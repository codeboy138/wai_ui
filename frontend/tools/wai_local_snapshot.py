#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
WAI Local Snapshot Tool

역할:
- 기본 실행(인자 없음): 클립보드 워처 모드
  - 클립보드에서 `### [WAI:LOCAL_SNAPSHOT:설명]` 패턴을 감지하면
    → 현재 프로젝트 상태를 _snapshots/ 에 로컬 스냅샷으로 저장
    → 최근 3개만 유지, 나머지는 자동 삭제

- CLI 모드:
  - py tools\wai_local_snapshot.py save "설명"
  - py tools\wai_local_snapshot.py list
  - py tools\wai_local_snapshot.py restore <스냅샷_폴더이름>
"""

import os
import sys
import re
import shutil
import json
import time
import subprocess
import argparse
from datetime import datetime
from typing import List

# --- 경로 설정 ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
SNAP_DIR = os.path.join(REPO_ROOT, "_snapshots")


# --- 공통 유틸 ---

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def slugify(text: str) -> str:
    text = text.strip()
    # 공백 → 하이픈
    text = re.sub(r"\s+", "-", text)
    # 한글/영문/숫자/하이픈/언더스코어만 허용
    text = re.sub(r"[^0-9A-Za-z가-힣\-_]+", "", text)
    # 너무 길면 자르기
    return text[:60] if len(text) > 60 else text


def get_git_short_sha() -> str:
    try:
        out = subprocess.check_output(
            ["git", "-C", REPO_ROOT, "rev-parse", "--short", "HEAD"],
            stderr=subprocess.DEVNULL,
            text=True
        ).strip()
        return out or "nogit"
    except Exception:
        return "nogit"


def collect_files_for_snapshot() -> List[str]:
    """
    스냅샷에 포함할 파일 목록을 결정.
    1순위: git ls-files 결과 (트래킹된 파일만)
    실패 시: .git, _snapshots, venv 등 몇몇 디렉토리 제외하고 전체 탐색
    """
    # 1) git ls-files 시도
    try:
        out = subprocess.check_output(
            ["git", "-C", REPO_ROOT, "ls-files"],
            stderr=subprocess.DEVNULL,
            text=True
        )
        files = []
        for line in out.splitlines():
            line = line.strip()
            if not line:
                continue
            # git 출력은 / 기준이므로 OS 구분자로 교체
            files.append(line.replace("/", os.sep))
        if files:
            return files
    except Exception:
        pass

    # 2) fallback: 디렉토리 전체 탐색
    result = []
    skip_dirs = {".git", "_snapshots", "__pycache__", "venv", "env", ".venv", "node_modules"}
    for root, dirs, files in os.walk(REPO_ROOT):
        rel_root = os.path.relpath(root, REPO_ROOT)
        # 상위에서 스킵 디렉토리 제거
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        # 루트인 경우
        if rel_root == ".":
            rel_root = ""

        for f in files:
            if f.endswith((".pyc", ".pyo")):
                continue
            rel_path = os.path.join(rel_root, f) if rel_root else f
            result.append(rel_path)

    return result


def get_next_prompt_index() -> int:
    """
    스냅샷 폴더 이름에서 _P숫자_ 패턴을 읽어 가장 큰 값 + 1 을 반환.
    예: 20251211_143058_efaf152_P1_테스트-스냅샷 → P1 → 다음은 2
    """
    ensure_dir(SNAP_DIR)
    max_idx = 0
    for name in os.listdir(SNAP_DIR):
        m = re.search(r"_P(\d+)_", name)
        if m:
            try:
                idx = int(m.group(1))
                if idx > max_idx:
                    max_idx = idx
            except ValueError:
                continue
    return max_idx + 1


def cleanup_old_snapshots(keep_last: int = 3) -> None:
    """
    _snapshots 내에서 가장 최근 것 N개만 남기고 나머지는 삭제
    - 정렬 기준: 폴더 이름(앞에 timestamp가 붙어 있으므로 이름 정렬 == 시간 정렬)
    """
    ensure_dir(SNAP_DIR)
    dirs = [
        d for d in os.listdir(SNAP_DIR)
        if os.path.isdir(os.path.join(SNAP_DIR, d))
    ]
    if len(dirs) <= keep_last:
        return

    dirs_sorted = sorted(dirs)  # 오래된 순
    to_delete = dirs_sorted[:-keep_last]
    for name in to_delete:
        path = os.path.join(SNAP_DIR, name)
        try:
            shutil.rmtree(path)
            print(f"[INFO] 오래된 스냅샷 삭제: {name}")
        except Exception as e:
            print(f"[WARN] 스냅샷 삭제 실패: {name} ({e})")


def save_snapshot(description: str, keep_last: int = 3) -> None:
    """
    현재 REPO_ROOT 상태를 _snapshots/ 하위에 저장.
    """
    ensure_dir(SNAP_DIR)

    prompt_idx = get_next_prompt_index()
    now = datetime.now()
    ts_for_name = now.strftime("%Y%m%d_%H%M%S")
    ts_for_log = now.strftime("%Y-%m-%d %H:%M:%S")
    git_sha = get_git_short_sha()
    slug = slugify(description) or "snapshot"

    folder_name = f"{ts_for_name}_{git_sha}_P{prompt_idx}_{slug}"
    snap_path = os.path.join(SNAP_DIR, folder_name)
    ensure_dir(snap_path)

    files = collect_files_for_snapshot()

    # 파일 복사
    for rel_path in files:
        src = os.path.join(REPO_ROOT, rel_path)
        dst = os.path.join(snap_path, rel_path)
        dst_dir = os.path.dirname(dst)
        ensure_dir(dst_dir)
        if os.path.isfile(src):
            shutil.copy2(src, dst)

    # manifest 저장
    manifest = {
        "description": description,
        "prompt_index": prompt_idx,
        "created_at": ts_for_log,
        "git_head": git_sha,
        "files": files,
    }
    with open(os.path.join(snap_path, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # 오래된 스냅샷 정리
    cleanup_old_snapshots(keep_last=keep_last)

    # 로그 출력 + 복구 명령어 안내
    print(f"[PROMPT {prompt_idx} | {ts_for_log}]")
    print(f" ✨ [로컬 스냅샷 저장] {folder_name}")
    print(f"    경로   : {snap_path}")
    print(f"    파일수 : {len(files)}")
    print(f"    복구   : py tools\\wai_local_snapshot.py restore {folder_name}")


def list_snapshots() -> None:
    ensure_dir(SNAP_DIR)
    dirs = [
        d for d in os.listdir(SNAP_DIR)
        if os.path.isdir(os.path.join(SNAP_DIR, d))
    ]
    if not dirs:
        print("저장된 스냅샷이 없습니다.")
        return

    dirs_sorted = sorted(dirs)  # 오래된 순
    print("=== 로컬 스냅샷 목록 (오래된 → 최신) ===")
    for name in dirs_sorted:
        path = os.path.join(SNAP_DIR, name)
        manifest_path = os.path.join(path, "manifest.json")
        desc = ""
        created_at = ""
        prompt_idx = ""
        if os.path.isfile(manifest_path):
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    m = json.load(f)
                desc = m.get("description", "")
                created_at = m.get("created_at", "")
                prompt_idx = m.get("prompt_index", "")
            except Exception:
                pass
        print(f"- {name}")
        if created_at or prompt_idx or desc:
            print(f"    PROMPT : {prompt_idx}")
            print(f"    시각   : {created_at}")
            if desc:
                print(f"    설명   : {desc}")


def restore_snapshot(snap_name: str) -> None:
    snap_path = os.path.join(SNAP_DIR, snap_name)
    if not os.path.isdir(snap_path):
        print(f"[ERROR] 스냅샷 폴더가 존재하지 않습니다: {snap_path}")
        return

    manifest_path = os.path.join(snap_path, "manifest.json")
    if not os.path.isfile(manifest_path):
        print("[WARN] manifest.json 이 없어도 복구는 시도할 수 있지만, 권장되지 않습니다.")
        files = []
    else:
        with open(manifest_path, "r", encoding="utf-8") as f:
            m = json.load(f)
        files = m.get("files", [])

    print("=== 스냅샷 복구 준비 ===")
    print(f"대상 스냅샷 : {snap_name}")
    print(f"경로        : {snap_path}")
    print("현재 REPO_ROOT 내 동일 경로의 파일들이 모두 덮어쓰기 됩니다.")
    ans = input('정말 복구하시겠습니까? (진행하려면 "YES" 입력) : ').strip()
    if ans != "YES":
        print("복구를 취소했습니다.")
        return

    if files:
        # manifest 기반 복구
        for rel_path in files:
            src = os.path.join(snap_path, rel_path)
            dst = os.path.join(REPO_ROOT, rel_path)
            if os.path.isfile(src):
                dst_dir = os.path.dirname(dst)
                ensure_dir(dst_dir)
                shutil.copy2(src, dst)
    else:
        # manifest 없으면 폴더 전체를 덮어쓰는 방식
        for root, dirs, fs in os.walk(snap_path):
            rel_root = os.path.relpath(root, snap_path)
            if rel_root == ".":
                rel_root = ""
            for f in fs:
                if f == "manifest.json":
                    continue
                rel_path = os.path.join(rel_root, f) if rel_root else f
                src = os.path.join(snap_path, rel_path)
                dst = os.path.join(REPO_ROOT, rel_path)
                dst_dir = os.path.dirname(dst)
                ensure_dir(dst_dir)
                shutil.copy2(src, dst)

    print("스냅샷 복구가 완료되었습니다.")


# --- 클립보드 워처 모드 ---

def watch_clipboard() -> None:
    try:
        import pyperclip
    except ImportError:
        print("[ERROR] pyperclip 모듈이 없습니다.")
        print("다음 명령으로 설치 후 다시 실행하세요:")
        print("  py -m pip install pyperclip")
        sys.exit(1)

    print("=== WAI Local Snapshot Watcher ===")
    print("클립보드에 다음 형식이 포함되면 자동으로 스냅샷을 저장합니다:")
    print("  ### [WAI:LOCAL_SNAPSHOT:설명]")
    print("중지하려면 Ctrl + C 를 누르세요.\n")

    last_text = None
    pattern = re.compile(r"###\s*\[WAI:LOCAL_SNAPSHOT:(.+?)\]", re.IGNORECASE | re.DOTALL)

    try:
        while True:
            try:
                text = pyperclip.paste()
            except Exception:
                text = ""

            if text != last_text:
                last_text = text
                m = pattern.search(text)
                if m:
                    desc_raw = m.group(1).strip()
                    # 줄바꿈/공백 정리
                    desc_one_line = " ".join(desc_raw.split())
                    save_snapshot(desc_one_line)

            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n클립보드 워처를 종료합니다.")


# --- 메인 ---

def main():
    # 인자 없으면 워처 모드
    if len(sys.argv) == 1:
        watch_clipboard()
        return

    parser = argparse.ArgumentParser(description="WAI Local Snapshot CLI")
    sub = parser.add_subparsers(dest="cmd")

    p_save = sub.add_parser("save", help="현재 상태를 스냅샷으로 저장")
    p_save.add_argument("description", help="스냅샷 설명")

    sub.add_parser("list", help="저장된 스냅샷 목록 보기")

    p_restore = sub.add_parser("restore", help="지정 스냅샷으로 복구")
    p_restore.add_argument("snapshot_name", help="_snapshots 안의 스냅샷 폴더 이름")

    args = parser.parse_args()

    if args.cmd == "save":
        save_snapshot(args.description)
    elif args.cmd == "list":
        list_snapshots()
    elif args.cmd == "restore":
        restore_snapshot(args.snapshot_name)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
