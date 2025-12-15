#!/usr/bin/env python
# -*- coding: utf-8 -*-

r"""
WAI Local Snapshot Tool (순수 로컬 스냅샷 + Git 복구 커밋/푸시)

역할:
- 기본 실행(인자 없음): 클립보드 워처 모드
  - 클립보드에서 `### [WAI:LOCAL_SNAPSHOT:설명]` 패턴을 감지하면
    → 현재 프로젝트(frontend) 전체 상태를 _snapshots/ 에 로컬 스냅샷으로 저장
    → 최근 5개만 유지, 나머지는 휴지통으로 이동
  - PROMPT 번호(P-Number)는 항상 직전 번호 + 1 로 할당 (해시 중복 체크 없이 무조건 증가)

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
import argparse
import hashlib
import subprocess
import stat
from datetime import datetime
from typing import List

# 로그 즉시 출력 설정 (새 창 팝업 방지 및 실시간 로그 확인용)
sys.stdout.reconfigure(encoding='utf-8')

# 휴지통 이동용 모듈
try:
    from send2trash import send2trash
    SEND2TRASH_AVAILABLE = True
except ImportError:
    SEND2TRASH_AVAILABLE = False

# --- 경로 설정 ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Windows 단축 경로(~1) 문제를 피하기 위해 realpath로 실제 경로 해상
REPO_ROOT = os.path.realpath(os.path.abspath(os.path.join(SCRIPT_DIR, "..")))   # C:\wai-ui\frontend
SNAP_DIR = os.path.join(REPO_ROOT, "_snapshots")
STATE_FILE = os.path.join(SNAP_DIR, "prompt_state.json")
STATE_LOCK = os.path.join(SNAP_DIR, "prompt_state.lock")
SNAPSHOT_LOG_FILE = os.path.join(SNAP_DIR, "snapshot_log.md")

# Windows에서 폴더/파일 이름에 허용되지 않는 문자 (폴더 이름에만 사용)
INVALID_WIN_CHARS = '<>:"/\\|?*'


# --- 공통 유틸 ---

def ensure_dir(path: str) -> None:
    if not path:
        return
    if not os.path.isdir(path):
        os.makedirs(path, exist_ok=True)


def sanitize_for_path(name: str) -> str:
    """
    전체 폴더 이름에 대해 Windows에서 쓸 수 없는 문자 제거/변환.
    """
    name = (name or "").strip()
    if not name:
        return "snapshot"

    safe_chars = []
    for ch in name:
        if ch in INVALID_WIN_CHARS:
            safe_chars.append("_")
        else:
            safe_chars.append(ch)
    safe = "".join(safe_chars).strip()
    return safe or "snapshot"


def on_rm_error(func, path, exc_info):
    """
    shutil.rmtree 실패 시 호출 (주로 읽기 전용 파일 삭제 위함)
    """
    if not os.access(path, os.W_OK):
        os.chmod(path, stat.S_IWRITE)
        func(path)
    else:
        print(f"[WARN] 파일 삭제 실패: {path} - {exc_info[1]}")


def safe_delete_folder(path: str) -> bool:
    """
    폴더를 안전하게 삭제.
    """
    path = os.path.normpath(os.path.abspath(path))

    if not os.path.isdir(path):
        return False

    if SEND2TRASH_AVAILABLE:
        try:
            send2trash(path)
            return True
        except Exception as e:
            print(f"[WARN] 휴지통 이동 실패, 영구 삭제 시도: {e}")
    
    try:
        if os.path.isdir(path):
            shutil.rmtree(path, onerror=on_rm_error)
        return True
    except Exception as e2:
        print(f"[WARN] 영구 삭제도 실패: {e2}")
        return False


def append_snapshot_log(ts_for_log: str, folder_name: str, description: str) -> None:
    ensure_dir(SNAP_DIR)
    
    if not os.path.isfile(SNAPSHOT_LOG_FILE):
        with open(SNAPSHOT_LOG_FILE, "w", encoding="utf-8") as f:
            f.write("# WAI Snapshot Log\n\n")
            f.write("| 시간 | 폴더명 | 설명 |\n")
            f.write("|------|--------|------|\n")
    
    desc_clean = (description or "").replace("\n", " ").replace("|", "/").strip()
    
    with open(SNAPSHOT_LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"| {ts_for_log} | {folder_name} | {desc_clean} |\n")


# --- Git 유틸 (restore 시 전체 커밋/푸시용) ---

def is_git_repo() -> bool:
    try:
        subprocess.check_output(
            ["git", "-C", REPO_ROOT, "rev-parse", "--is-inside-work-tree"],
            stderr=subprocess.DEVNULL,
            text=True,
        )
        return True
    except Exception:
        return False


def run_git(args, check=False):
    return subprocess.run(
        ["git", "-C", REPO_ROOT] + args,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=check,
    )


GIT_AVAILABLE = is_git_repo()


# --- PROMPT 상태 관리 ---

def _acquire_state_lock():
    ensure_dir(SNAP_DIR)
    while True:
        try:
            fd = os.open(STATE_LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            return fd
        except FileExistsError:
            time.sleep(0.05)


def _release_state_lock(fd):
    try:
        os.close(fd)
    finally:
        try:
            os.remove(STATE_LOCK)
        except FileNotFoundError:
            pass


def _load_prompt_state_unlocked():
    ensure_dir(SNAP_DIR)
    if os.path.isfile(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {
                "last_id": int(data.get("last_id", 0)),
                "last_hash": str(data.get("last_hash", "")),
            }
        except Exception:
            pass

    max_idx = 0
    try:
        for name in os.listdir(SNAP_DIR):
            m = re.search(r"_P(\d+)_", name)
            if m:
                try:
                    idx = int(m.group(1))
                    if idx > max_idx:
                        max_idx = idx
                except ValueError:
                    continue
    except FileNotFoundError:
        pass

    return {"last_id": max_idx, "last_hash": ""}


def _save_prompt_state_unlocked(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {
                "last_id": int(state.get("last_id", 0)),
                "last_hash": str(state.get("last_hash", "")),
            },
            f,
            ensure_ascii=False,
            indent=2,
        )


def allocate_next_prompt_id(text_hash: str = "") -> int:
    """
    무조건 last_id + 1 을 할당 (중복 사용 안 함).
    text_hash는 저장만 해둠 (참고용).
    """
    fd = _acquire_state_lock()
    try:
        state = _load_prompt_state_unlocked()
        last_id = int(state.get("last_id", 0))
        
        # [수정] 무조건 증가
        new_id = last_id + 1
        
        state["last_id"] = new_id
        state["last_hash"] = text_hash
        _save_prompt_state_unlocked(state)
        return new_id
    finally:
        _release_state_lock(fd)


# --- 스냅샷 파일 수집/저장 ---

def collect_files_for_snapshot() -> List[str]:
    result = []
    skip_dirs = {
        ".git",
        "_snapshots",
        "__pycache__",
        "venv",
        "env",
        ".venv",
        "node_modules",
        ".idea",
        ".vscode",
    }

    for root, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        rel_root = os.path.relpath(root, REPO_ROOT)
        if rel_root == ".":
            rel_root = ""

        for f in files:
            if f.endswith((".pyc", ".pyo")):
                continue

            rel_path = os.path.join(rel_root, f) if rel_root else f
            result.append(rel_path)

    return result


def cleanup_old_snapshots(keep_last: int = 5) -> None:
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
        if safe_delete_folder(path):
            if SEND2TRASH_AVAILABLE:
                print(f"[WAI SNAPSHOT] 휴지통 이동: {name}")
            else:
                print(f"[WAI SNAPSHOT] 삭제됨: {name}")


def get_previous_snapshot_name(current_snap_name: str):
    """
    현재 스냅샷 폴더 이름을 기준으로 정렬상 바로 이전 폴더 이름을 찾음.
    """
    ensure_dir(SNAP_DIR)
    dirs = [
        d for d in os.listdir(SNAP_DIR)
        if os.path.isdir(os.path.join(SNAP_DIR, d))
    ]
    if not dirs:
        return None

    dirs_sorted = sorted(dirs)
    try:
        idx = dirs_sorted.index(current_snap_name)
    except ValueError:
        return None

    if idx == 0:
        return None

    return dirs_sorted[idx - 1]


def save_snapshot(description: str, prompt_idx: int, keep_last: int = 5) -> None:
    ensure_dir(SNAP_DIR)

    now = datetime.now()
    ts_for_name = now.strftime("%Y%m%d_%H%M%S")
    ts_for_log = now.strftime("%Y-%m-%d %H:%M:%S")

    raw_name = f"{ts_for_name}_P{prompt_idx}_SNAP"
    folder_name = sanitize_for_path(raw_name)

    snap_path = os.path.join(SNAP_DIR, folder_name)
    ensure_dir(snap_path)

    files = collect_files_for_snapshot()

    for rel_path in files:
        if not rel_path:
            continue

        src = os.path.join(REPO_ROOT, rel_path)
        dst = os.path.join(snap_path, rel_path)
        dst_dir = os.path.dirname(dst)
        ensure_dir(dst_dir)
        if os.path.isfile(src):
            shutil.copy2(src, dst)

    manifest = {
        "description": description,
        "prompt_index": prompt_idx,
        "created_at": ts_for_log,
        "files": files,
    }
    with open(os.path.join(snap_path, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    append_snapshot_log(ts_for_log, folder_name, description)
    cleanup_old_snapshots(keep_last=keep_last)

    # 이전 스냅샷 찾기 (방금 만든게 current이므로, 직전 스냅샷이 나옴)
    prev_snap_name = get_previous_snapshot_name(folder_name)

    print(f"[P{prompt_idx}] {ts_for_log} | {folder_name}")
    print(f"  > 파일: {len(files)}개 저장됨")
    if description:
        print(f"  > 설명: {description}")
    
    # [수정] 복구 명령줄 안내 시 직전 스냅샷 이름 사용
    if prev_snap_name:
        print(f"  > 복구: py tools\\wai_local_snapshot.py restore {prev_snap_name}")
    else:
        print(f"  > 복구: (이전 스냅샷 없음 - 최초 저장)")
        
    print("-" * 50)


# --- CLI: list / restore ---

def list_snapshots() -> None:
    ensure_dir(SNAP_DIR)
    dirs = [
        d for d in os.listdir(SNAP_DIR)
        if os.path.isdir(os.path.join(SNAP_DIR, d))
    ]
    if not dirs:
        print("저장된 스냅샷이 없습니다.")
        return

    dirs_sorted = sorted(dirs)
    print("=== 로컬 스냅샷 목록 ===")
    for name in dirs_sorted:
        print(f"- {name}")


def restore_snapshot(snap_name: str) -> None:
    snap_path = os.path.join(SNAP_DIR, snap_name)
    if not os.path.isdir(snap_path):
        print(f"[ERROR] 스냅샷 없음: {snap_path}")
        return

    manifest_path = os.path.join(snap_path, "manifest.json")
    prompt_idx = None
    description = ""
    if os.path.isfile(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            m = json.load(f)
        files = m.get("files", [])
        prompt_idx = m.get("prompt_index", "")
        description = m.get("description", "")
    else:
        files = []

    print(f"=== 스냅샷 복구: {snap_name} ===")
    ans = input('복구하시겠습니까? (YES 입력) : ').strip()
    if ans != "YES":
        print("취소됨.")
        return

    # 파일 복구
    if files:
        for rel_path in files:
            if not rel_path:
                continue
            src = os.path.join(snap_path, rel_path)
            dst = os.path.join(REPO_ROOT, rel_path)
            if os.path.isfile(src):
                dst_dir = os.path.dirname(dst)
                ensure_dir(dst_dir)
                shutil.copy2(src, dst)
    else:
        # 폴백: 폴더 전체 복사
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

    print("복구 완료.")

    # 복구 후 상태 자동 스냅샷
    try:
        # 해시 대신 빈 문자열 넘기고 무조건 새 ID 할당
        new_prompt_idx = allocate_next_prompt_id("")
        auto_desc = f"RESTORE:{snap_name}"
        if description:
            auto_desc += f" - {description}"
        save_snapshot(auto_desc, new_prompt_idx)
    except Exception as e:
        print(f"[RESTORE] 자동 스냅샷 오류: {e}")

    # Git 처리
    if not GIT_AVAILABLE:
        return

    try:
        diff_proc = run_git(["status", "--porcelain"], check=False)
        if not diff_proc.stdout.strip():
            print("[GIT] 변경 사항 없음.")
            return

        run_git(["add", "-A"], check=False)
        
        msg = f"[RESTORE P{prompt_idx}] {snap_name}" if prompt_idx else f"[RESTORE] {snap_name}"
        run_git(["commit", "-m", msg], check=False)
        run_git(["push"], check=False)
        print(f"[GIT] Commit & Push 완료: {msg}")

    except Exception as e:
        print(f"[GIT] 오류: {e}")


# --- 클립보드 워처 모드 ---

def watch_clipboard() -> None:
    try:
        import pyperclip
        from pyperclip import PyperclipException
    except ImportError:
        print("[ERROR] pyperclip 필요: py -m pip install pyperclip")
        sys.exit(1)

    print("=== WAI Snapshot Watcher Started (Ctrl+C to stop) ===")
    print("감지 패턴: ### [WAI:LOCAL_SNAPSHOT:설명]")

    pattern = re.compile(r"###\s*\[WAI:LOCAL_SNAPSHOT:(.+?)\]", re.IGNORECASE | re.DOTALL)

    try:
        last_text = pyperclip.paste()
    except Exception:
        last_text = ""

    had_error = False

    try:
        while True:
            try:
                text = pyperclip.paste()
                had_error = False
            except Exception:
                if not had_error:
                    print("[WARN] 클립보드 읽기 실패 (재시도 중...)")
                    had_error = True
                time.sleep(1.0)
                continue

            if text != last_text:
                last_text = text
                m = pattern.search(text)
                if m:
                    desc_raw = m.group(1).strip()
                    desc_one_line = " ".join(desc_raw.split())

                    # 항상 새로운 ID 할당 (중복 없음)
                    text_hash = hashlib.sha1(text.encode("utf-8", errors="ignore")).hexdigest()
                    prompt_idx = allocate_next_prompt_id(text_hash)
                    
                    save_snapshot(desc_one_line, prompt_idx)

            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nWatcher 종료.")


# --- 메인 ---

def main():
    if len(sys.argv) == 1:
        watch_clipboard()
        return

    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")

    p_save = sub.add_parser("save")
    p_save.add_argument("description")

    sub.add_parser("list")

    p_restore = sub.add_parser("restore")
    p_restore.add_argument("snapshot_name")

    args = parser.parse_args()

    if args.cmd == "save":
        # CLI save도 무조건 새 번호
        pid = allocate_next_prompt_id("")
        save_snapshot(args.description, pid)
    elif args.cmd == "list":
        list_snapshots()
    elif args.cmd == "restore":
        restore_snapshot(args.snapshot_name)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
