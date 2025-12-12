#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
WAI Magic

역할:
- 클립보드 감시
- 클립보드 내용 중
    ### [WAI:UPDATE:상대경로]
    (파일 전체 내용)
  블록들을 찾아서 해당 파일을 C:\wai-ui\frontend 기준으로 저장
- Git이 가능한 환경이면:
    - 각 파일 git add
    - 전체 파일 한 번에 git commit + git push
- 로그 포맷:
    - [HH:MM:SS] [PROMPT N k/총파일수] path 저장 + git add
    - [HH:MM:SS] [PROMPT N] git commit / push 완료 여부

PROMPT 번호는 tools/wai_local_snapshot.py 와 공유됨:
- 동일한 프롬프트(동일한 클립보드 텍스트)에 대해
  - 스냅샷: [PROMPT N | ...]
  - 파일 저장: [PROMPT N k/총파일수]
  로 동일한 N이 찍히도록 prompt_state.json 을 공유
"""

import os
import re
import sys
import time
import json
import hashlib
import subprocess
from datetime import datetime

# ---------- 경로 설정 ----------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = SCRIPT_DIR  # wai_magic.py는 C:\wai-ui\frontend 바로 아래에 위치한다고 가정
SNAP_DIR = os.path.join(REPO_ROOT, "_snapshots")
STATE_FILE = os.path.join(SNAP_DIR, "prompt_state.json")
STATE_LOCK = os.path.join(SNAP_DIR, "prompt_state.lock")


def ensure_dir(path: str) -> None:
    if path and not os.path.isdir(path):
        os.makedirs(path, exist_ok=True)


# ---------- 공통 로그 유틸 (시간 표시) ----------

def _now_time_str() -> str:
    """HH:MM:SS 형식 현재 시간 문자열."""
    return datetime.now().strftime("%H:%M:%S")


def log(msg: str) -> None:
    """모든 런타임 로그에 시간 프리픽스를 붙여 출력."""
    print(f"[{_now_time_str()}] {msg}")


# ---------- PROMPT 상태 공유 (wai_local_snapshot.py 와 동일 규칙) ----------

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


def get_or_allocate_prompt_id(text_hash: str) -> int:
    """
    동일한 클립보드 텍스트(=text_hash)에 대해 항상 같은 PROMPT ID를 돌려준다.
    - prompt_state.json 내부 last_hash 와 비교
    - 다르면 last_id + 1 을 새로 할당
    - 같으면 last_id 재사용
    - 파일 락으로 동시 실행(wai_local_snapshot.py) 간에도 일관성 유지
    """
    fd = _acquire_state_lock()
    try:
        state = _load_prompt_state_unlocked()
        last_id = int(state.get("last_id", 0))
        last_hash = str(state.get("last_hash", ""))

        if last_hash == text_hash and last_id > 0:
            # 이미 같은 텍스트로 PROMPT가 할당된 경우
            return last_id

        # 새 프롬프트
        new_id = last_id + 1
        state["last_id"] = new_id
        state["last_hash"] = text_hash
        _save_prompt_state_unlocked(state)
        return new_id
    finally:
        _release_state_lock(fd)


# ---------- Git 유틸 ----------

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


# ---------- WAI:UPDATE 블록 처리 ----------

UPDATE_PATTERN = re.compile(
    r"^###\s*\[WAI:UPDATE:([^\]]+)\]\s*\n"  # 헤더
    r"(.*?)(?=^###\s*\[WAI:(?:UPDATE|LOCAL_SNAPSHOT):|\Z)",  # 다음 헤더 또는 끝
    re.DOTALL | re.MULTILINE,
)


def extract_updates(text: str):
    """
    클립보드 텍스트에서 모든 WAI:UPDATE 블록 추출.
    반환: [(rel_path, body), ...]
    """
    updates = []
    for m in UPDATE_PATTERN.finditer(text):
        rel_path = m.group(1).strip()
        body = m.group(2)

        # 코드 마지막에 붙은 ``` 같은 건 제거 (있으면)
        # 하지만 내용 중간의 ``` 는 그대로 둠
        body_stripped = body.strip("\n")
        if body_stripped.endswith("```"):
            body_stripped = body_stripped[: -3].rstrip("\n")

        updates.append((rel_path, body_stripped))
    return updates


def save_file(rel_path: str, content: str):
    rel_path = rel_path.strip().lstrip("/\\")
    target_path = os.path.join(REPO_ROOT, rel_path)
    ensure_dir(os.path.dirname(target_path))

    with open(target_path, "w", encoding="utf-8", newline="\n") as f:
        # 항상 마지막에 개행 하나 유지
        f.write(content.rstrip("\n") + "\n")

    return rel_path, target_path


def process_clipboard_text(text: str):
    updates = extract_updates(text)
    if not updates:
        # 클립보드 안에 WAI:UPDATE 문자열은 있는데 포맷이 틀린 경우를 디버깅하기 위함
        if "[WAI:UPDATE:" in text:
            log("[WAI MAGIC] [WAI:UPDATE:] 헤더는 감지했지만 유효한 블록을 파싱하지 못했습니다. "
                "헤더가 코드블록 첫 줄에 있는지, 형식이 정확한지 확인해 주세요.")
        return  # 처리할 것 없음

    # 이번 프롬프트의 PROMPT ID 계산 (wai_local_snapshot 과 공유)
    text_hash = hashlib.sha1(text.encode("utf-8", errors="ignore")).hexdigest()
    prompt_id = get_or_allocate_prompt_id(text_hash)

    total = len(updates)
    changed_files = []

    for idx, (rel_path, body) in enumerate(updates, start=1):
        saved_rel, _ = save_file(rel_path, body)
        changed_files.append(saved_rel)

        if GIT_AVAILABLE:
            try:
                run_git(["add", saved_rel], check=False)
                log(f"[PROMPT {prompt_id} {idx}/{total}] {saved_rel} 저장 + git add")
            except Exception as e:
                log(f"[PROMPT {prompt_id} {idx}/{total}] {saved_rel} 저장은 완료, git add 실패: {e}")
        else:
            log(f"[PROMPT {prompt_id} {idx}/{total}] {saved_rel} 저장 (git 미사용 모드)")

    # Git commit + push (한 번에)
    if GIT_AVAILABLE and changed_files:
        try:
            # 변경 사항이 있는지 확인
            diff_proc = run_git(["diff", "--cached", "--quiet"])
            need_commit = (diff_proc.returncode != 0)
        except Exception:
            need_commit = True

        if need_commit:
            msg = f"[WAI] Prompt {prompt_id}: {len(changed_files)} file(s) updated"
            try:
                commit_proc = run_git(["commit", "-m", msg], check=False)
                if commit_proc.returncode == 0:
                    log(f"[PROMPT {prompt_id}] git commit 완료: {msg}")
                else:
                    log(f"[PROMPT {prompt_id}] git commit 실패: {commit_proc.stderr.strip()}")
            except Exception as e:
                log(f"[PROMPT {prompt_id}] git commit 예외 발생: {e}")

            try:
                push_proc = run_git(["push"], check=False)
                if push_proc.returncode == 0:
                    log(f"[PROMPT {prompt_id}] git push 완료")
                else:
                    log(f"[PROMPT {prompt_id}] git push 실패: {push_proc.stderr.strip()}")
            except Exception as e:
                log(f"[PROMPT {prompt_id}] git push 예외 발생: {e}")
        else:
            log(f"[PROMPT {prompt_id}] 변경된 내용이 없어 commit/push 생략")


# ---------- 클립보드 워처 ----------

def watch_clipboard():
    try:
        import pyperclip
        from pyperclip import PyperclipException
    except ImportError:
        print("[ERROR] pyperclip 모듈이 없습니다.")
        print("다음 명령으로 설치 후 다시 실행하세요:")
        print("  py -m pip install pyperclip")
        sys.exit(1)

    print("=== WAI Magic Watcher ===")
    print("클립보드에 다음 형식이 포함되면 자동으로 파일 저장 + git add/commit/push 를 수행합니다:")
    print("  ### [WAI:UPDATE:상대경로]")
    print("중지하려면 Ctrl + C 를 누르세요.\n")

    if not GIT_AVAILABLE:
        log("[WARN] 현재 디렉터리는 Git 리포지토리가 아닙니다. git add/commit/push 는 생략됩니다.")

    last_text = None
    had_clipboard_error = False

    try:
        while True:
            try:
                text = pyperclip.paste()
                had_clipboard_error = False
            except PyperclipException:
                if not had_clipboard_error:
                    log("[WARN] 클립보드 접근 오류 발생. 잠시 후 재시도합니다.")
                    had_clipboard_error = True
                time.sleep(1.0)
                continue
            except Exception:
                time.sleep(1.0)
                continue

            if text != last_text:
                last_text = text
                # 새 텍스트에 대해 WAI:UPDATE 블록 처리 시도
                process_clipboard_text(text)

            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nWAI Magic Watcher 를 종료합니다.")


def main():
    # 인자 없이 실행하면 워처 모드
    if len(sys.argv) == 1:
        watch_clipboard()
        return

    # 간단한 CLI 모드 (선택사항): 나중 확장용
    print("현재는 워처 모드만 지원합니다. 인자 없이 실행하세요.")
    print("예: py wai_magic.py")


if __name__ == "__main__":
    main()
