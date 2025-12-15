#!/usr/bin/env python
# -*- coding: utf-8 -*-

r"""
WAI Local Snapshot Tool (순수 로컬 스냅샷 + Git 복구 커밋/푸시)

역할:
- 기본 실행(인자 없음): 클립보드 워처 모드
  - 클립보드에서 `### [WAI:LOCAL_SNAPSHOT:설명]` 패턴을 감지하면
    → 현재 프로젝트(frontend) 전체 상태를 _snapshots/ 에 로컬 스냅샷으로 저장
    → 최근 5개만 유지, 나머지는 휴지통으로 이동
  - 이때 PROMPT 번호는 wai_magic.py 와 공유:
    - 동일한 클립보드 텍스트에 대해 항상 같은 [PROMPT N] 사용

- CLI 모드:
  - py tools\wai_local_snapshot.py save "설명"
      → 새 PROMPT 번호를 할당하고 로컬 스냅샷 생성
  - py tools\wai_local_snapshot.py list
      → 저장된 스냅샷 목록 표시
  - py tools\wai_local_snapshot.py restore <스냅샷_폴더이름>
      → 해당 스냅샷 내용으로 frontend 폴더 전체 복구
      → Git 리포지토리라면 자동으로 git add -A + commit + push 수행
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
from datetime import datetime
from typing import List

# 휴지통 이동용 모듈
try:
    from send2trash import send2trash
    SEND2TRASH_AVAILABLE = True
except ImportError:
    SEND2TRASH_AVAILABLE = False

# --- 경로 설정 ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))   # C:\wai-ui\frontend
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
    - INVALID_WIN_CHARS 에 포함된 문자는 모두 '_' 로 치환
    - 앞뒤 공백 제거
    - 빈 문자열이면 'snapshot' 반환
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


def safe_delete_folder(path: str) -> bool:
    """
    폴더를 안전하게 삭제.
    - send2trash 사용 가능하면 휴지통으로 이동
    - 그렇지 않으면 shutil.rmtree 로 영구 삭제
    반환값: 삭제 성공 여부
    """
    if not os.path.isdir(path):
        return False

    if SEND2TRASH_AVAILABLE:
        try:
            send2trash(path)
            return True
        except Exception as e:
            print(f"[WARN] 휴지통 이동 실패, 영구 삭제 시도: {e}")
            # 폴백: 영구 삭제
            try:
                shutil.rmtree(path)
                return True
            except Exception as e2:
                print(f"[WARN] 영구 삭제도 실패: {e2}")
                return False
    else:
        try:
            shutil.rmtree(path)
            return True
        except Exception as e:
            print(f"[WARN] 폴더 삭제 실패: {e}")
            return False


def append_snapshot_log(ts_for_log: str, folder_name: str, description: str) -> None:
    """
    snapshot_log.md 에 스냅샷 기록을 한 줄 추가.
    - 파일이 없으면 헤더와 함께 생성
    - 형식: | 시간 | 폴더명 | 설명 |
    """
    ensure_dir(SNAP_DIR)
    
    # 파일이 없으면 헤더 생성
    if not os.path.isfile(SNAPSHOT_LOG_FILE):
        with open(SNAPSHOT_LOG_FILE, "w", encoding="utf-8") as f:
            f.write("# WAI Snapshot Log\n\n")
            f.write("| 시간 | 폴더명 | 설명 |\n")
            f.write("|------|--------|------|\n")
    
    # 설명에서 줄바꿈/파이프 제거 (테이블 깨짐 방지)
    desc_clean = (description or "").replace("\n", " ").replace("|", "/").strip()
    
    # 한 줄 추가
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


# --- PROMPT 상태 공유 (wai_magic.py 와 동일 규칙) ---

def _acquire_state_lock():
    """prompt_state.json 접근용 간단한 파일 락."""
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
    """
    락이 잡힌 상태에서만 호출.
    - prompt_state.json 이 없으면 기존 _snapshots 폴더명에서 최대 P번호를 찾아 초기화.
    구조: { "last_id": int, "last_hash": str }
    """
    ensure_dir(SNAP_DIR)
    if os.path.isfile(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                raise ValueError("invalid state")
            return {
                "last_id": int(data.get("last_id", 0)),
                "last_hash": str(data.get("last_hash", "")),
            }
        except Exception:
            pass

    # 초기 상태: 기존 스냅샷 폴더명에서 최대 P번호 추출
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


def get_or_allocate_prompt_id_by_hash(text_hash: str) -> int:
    """
    wai_magic.py 와 동일한 규칙:
    - 같은 클립보드 텍스트(=text_hash)에 대해서는 항상 같은 PROMPT ID 사용
    - 다른 텍스트면 last_id + 1 할당
    """
    fd = _acquire_state_lock()
    try:
        state = _load_prompt_state_unlocked()
        last_id = int(state.get("last_id", 0))
        last_hash = str(state.get("last_hash", ""))

        if last_hash == text_hash and last_id > 0:
            return last_id

        new_id = last_id + 1
        state["last_id"] = new_id
        state["last_hash"] = text_hash
        _save_prompt_state_unlocked(state)
        return new_id
    finally:
        _release_state_lock(fd)


def allocate_new_prompt_id_cli() -> int:
    """
    CLI save 용 단독 PROMPT ID 할당.
    - 텍스트 해시 없이 last_id + 1 만 증가
    - last_hash 는 빈 문자열로 초기화
    """
    fd = _acquire_state_lock()
    try:
        state = _load_prompt_state_unlocked()
        last_id = int(state.get("last_id", 0))
        new_id = last_id + 1
        state["last_id"] = new_id
        state["last_hash"] = ""
        _save_prompt_state_unlocked(state)
        return new_id
    finally:
        _release_state_lock(fd)


# --- 스냅샷 파일 수집/저장 ---

def collect_files_for_snapshot() -> List[str]:
    """
    스냅샷에 포함할 파일 목록을 결정.
    - git 사용 X
    - C:\\wai-ui\\frontend 전체를 os.walk로 돌면서 수집
    - 일부 디렉토리만 제외: .git, _snapshots, venv, node_modules 등
    """
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
        # 스냅샷/가상환경/IDE 관련 폴더 제외
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        rel_root = os.path.relpath(root, REPO_ROOT)
        if rel_root == ".":
            rel_root = ""

        for f in files:
            # 파이썬 바이트코드 등은 굳이 백업 안 해도 됨
            if f.endswith((".pyc", ".pyo")):
                continue

            rel_path = os.path.join(rel_root, f) if rel_root else f
            result.append(rel_path)

    return result


def cleanup_old_snapshots(keep_last: int = 5) -> None:
    """
    _snapshots 내에서 가장 최근 것 N개만 남기고 나머지는 휴지통으로 이동
    - 정렬 기준: 폴더 이름(앞에 timestamp가 붙어 있으므로 이름 정렬 == 시간 정렬)
    - send2trash 사용 가능하면 휴지통으로, 아니면 영구 삭제
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
        if safe_delete_folder(path):
            if SEND2TRASH_AVAILABLE:
                print(f"[WAI SNAPSHOT] 휴지통으로 이동: {name}")
            else:
                print(f"[WAI SNAPSHOT] 영구 삭제됨: {name}")


def get_previous_snapshot_name(current_snap_name: str):
    """
    현재 스냅샷 기준, 정렬 상 바로 이전(오래된 쪽) 스냅샷 폴더 이름을 반환.
    - 이전 스냅샷이 없으면 None 반환.
    - cleanup_old_snapshots 이후 호출하여, 보존 대상 중에서만 이전 스냅샷을 찾는다.
    """
    ensure_dir(SNAP_DIR)
    dirs = [
        d for d in os.listdir(SNAP_DIR)
        if os.path.isdir(os.path.join(SNAP_DIR, d))
    ]
    if not dirs:
        return None

    dirs_sorted = sorted(dirs)  # 오래된 → 최신
    try:
        idx = dirs_sorted.index(current_snap_name)
    except ValueError:
        return None

    if idx == 0:
        return None

    return dirs_sorted[idx - 1]


def save_snapshot(description: str, prompt_idx: int, keep_last: int = 5) -> None:
    """
    현재 REPO_ROOT 상태를 _snapshots/ 하위에 저장.
    - prompt_idx 는 외부에서 결정 (wai_magic 과 번호 공유 가능)
    """
    ensure_dir(SNAP_DIR)

    now = datetime.now()
    ts_for_name = now.strftime("%Y%m%d_%H%M%S")
    ts_for_log = now.strftime("%Y-%m-%d %H:%M:%S")

    raw_name = f"{ts_for_name}_P{prompt_idx}_SNAP"
    folder_name = sanitize_for_path(raw_name)

    snap_path = os.path.join(SNAP_DIR, folder_name)
    ensure_dir(snap_path)

    files = collect_files_for_snapshot()

    # 파일 복사
    for rel_path in files:
        if not rel_path:
            continue

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
        "files": files,
    }
    with open(os.path.join(snap_path, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # snapshot_log.md 에 기록 추가
    append_snapshot_log(ts_for_log, folder_name, description)

    # 오래된 스냅샷 정리 (휴지통으로 이동)
    cleanup_old_snapshots(keep_last=keep_last)

    # 정리 후, "이 작업을 되돌릴 때 갈 곳" = 직전(이전) 스냅샷으로 안내
    prev_snap_name = get_previous_snapshot_name(folder_name)

    # 로그 출력 + 복구 명령어 안내
    print(f"[PROMPT {prompt_idx} | {ts_for_log}]")
    print(f" ✨ [로컬 스냅샷 저장] {folder_name}")
    print(f"    경로   : {snap_path}")
    print(f"    파일수 : {len(files)}")
    if prev_snap_name:
        # 현재 스냅샷(Pn) 기준, 한 단계 이전(Pn-1)으로 롤백하는 명령 안내
        print(f"    복구   : py tools\\wai_local_snapshot.py restore {prev_snap_name}")
    else:
        print("    복구   : (이전 스냅샷 없음)")
    if description:
        print(f"    설명   : {description}")


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
    prompt_idx = None
    description = ""
    if not os.path.isfile(manifest_path):
        print("[WARN] manifest.json 이 없어도 복구는 시도할 수 있지만, 권장되지 않습니다.")
        files = []
    else:
        with open(manifest_path, "r", encoding="utf-8") as f:
            m = json.load(f)
        files = m.get("files", [])
        prompt_idx = m.get("prompt_index")
        description = m.get("description", "")

    print("=== 스냅샷 복구 준비 ===")
    print(f"대상 스냅샷 : {snap_name}")
    print(f"경로        : {snap_path}")
    print("현재 REPO_ROOT 내 동일 경로의 파일들이 모두 덮어쓰기 됩니다.")
    ans = input('정말 복구하시겠습니까? (진행하려면 "YES" 입력) : ').strip()
    if ans != "YES":
        print("복구를 취소했습니다.")
        return

    # 파일 복구
    if files:
        # manifest 기반 복구
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
        # manifest 없으면 폴더 전체를 덮어쓰는 방식 (비권장)
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

    # 복구 직후, "복구된 상태"를 새로운 PROMPT/P 스냅샷으로 자동 저장
    # - 이렇게 해야 이후 작업에서 다시 스냅샷을 찍어도,
    #   롤백 기준이 예전(Pn) 이 아니라 "복구 이후 상태(Pn+1 이후)"가 된다.
    try:
        new_prompt_idx = allocate_new_prompt_id_cli()
        auto_desc = f"RESTORE:{snap_name}"
        if description:
            auto_desc += f" - {description}"
        save_snapshot(auto_desc, new_prompt_idx)
    except Exception as e:
        print(f"[RESTORE] 복구 후 자동 스냅샷 생성 중 예외 발생: {e}")

    # Git 리포지토리라면: 전체 변경 사항을 하나의 버전으로 커밋 + 푸시
    if not GIT_AVAILABLE:
        print("[RESTORE] 현재 디렉터리는 Git 리포지토리가 아닙니다. git add/commit/push 는 수행하지 않습니다.")
        return

    try:
        # 변경 사항이 있는지 확인
        diff_proc = run_git(["status", "--porcelain"], check=False)
        if not diff_proc.stdout.strip():
            print("[RESTORE] 복구 후 변경된 파일이 없어 commit/push 를 생략합니다.")
            return

        print("[RESTORE] git add -A 실행 중...")
        add_proc = run_git(["add", "-A"], check=False)
        if add_proc.returncode != 0:
            print(f"[RESTORE] git add 실패: {add_proc.stderr.strip()}")
            return

        # 커밋 메시지 구성
        if prompt_idx:
            msg = f"[RESTORE SNAPSHOT P{prompt_idx}] Restore from local snapshot {snap_name}"
        else:
            msg = f"[RESTORE SNAPSHOT] Restore from local snapshot {snap_name}"

        print(f"[RESTORE] git commit 실행 중... ({msg})")
        commit_proc = run_git(["commit", "-m", msg], check=False)
        if commit_proc.returncode != 0:
            stderr = commit_proc.stderr.strip()
            if "nothing to commit" in stderr.lower():
                print("[RESTORE] 커밋할 변경 사항이 없어 commit 을 생략합니다.")
            else:
                print(f"[RESTORE] git commit 실패: {stderr}")
                return
        else:
            print(f"[RESTORE] git commit 완료: {msg}")

        print("[RESTORE] git push 실행 중...")
        push_proc = run_git(["push"], check=False)
        if push_proc.returncode != 0:
            print(f"[RESTORE] git push 실패: {push_proc.stderr.strip()}")
        else:
            print("[RESTORE] git push 완료")

    except Exception as e:
        print(f"[RESTORE] git 처리 중 예외 발생: {e}")


# --- 클립보드 워처 모드 ---

def watch_clipboard() -> None:
    try:
        import pyperclip
        from pyperclip import PyperclipException
    except ImportError:
        print("[ERROR] pyperclip 모듈이 없습니다.")
        print("다음 명령으로 설치 후 다시 실행하세요:")
        print("  py -m pip install pyperclip")
        sys.exit(1)

    print("=== WAI Local Snapshot Watcher ===")
    print("클립보드에 다음 형식이 포함되면 자동으로 스냅샷을 저장합니다:")
    print("  ### [WAI:LOCAL_SNAPSHOT:설명]")
    print("중지하려면 Ctrl + C 를 누르세요.\n")

    pattern = re.compile(r"###\s*\[WAI:LOCAL_SNAPSHOT:(.+?)\]", re.IGNORECASE | re.DOTALL)

    # 시작 시점의 클립보드는 '베이스라인'으로만 저장하고, 스냅샷 트리거로는 사용하지 않는다.
    try:
        import pyperclip  # 재사용
        last_text = pyperclip.paste()
    except Exception:
        last_text = ""

    had_clipboard_error = False

    try:
        while True:
            try:
                text = pyperclip.paste()
                had_clipboard_error = False
            except PyperclipException:
                if not had_clipboard_error:
                    print("[WARN] 클립보드 접근 오류 발생. 잠시 후 재시도합니다.")
                    had_clipboard_error = True
                time.sleep(1.0)
                continue
            except Exception:
                time.sleep(1.0)
                continue

            if text != last_text:
                last_text = text
                m = pattern.search(text)
                if m:
                    desc_raw = m.group(1).strip()
                    desc_one_line = " ".join(desc_raw.split())

                    # 동일한 클립보드 텍스트에 대해 prompt ID 공유
                    text_hash = hashlib.sha1(text.encode("utf-8", errors="ignore")).hexdigest()
                    prompt_idx = get_or_allocate_prompt_id_by_hash(text_hash)
                    save_snapshot(desc_one_line, prompt_idx)

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
        # CLI save 는 독립적인 PROMPT ID 사용
        prompt_idx = allocate_new_prompt_id_cli()
        save_snapshot(args.description, prompt_idx)
    elif args.cmd == "list":
        list_snapshots()
    elif args.cmd == "restore":
        restore_snapshot(args.snapshot_name)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
