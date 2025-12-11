import argparse
import datetime
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

import pyperclip

# 이 스크립트는 frontend/ 하위 tools/ 폴더에 위치한다고 가정
ROOT = Path(__file__).resolve().parents[1]   # C:\wai-ui\frontend
SNAP_ROOT = ROOT / "_snapshots"
PROMPT_COUNTER_FILE = SNAP_ROOT / "_prompt_counter.txt"
LAST_CONTENT = ""


def run_git(args):
    try:
        out = subprocess.check_output(["git"] + args, cwd=ROOT)
        return out.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


def get_head_short():
    head = run_git(["rev-parse", "--short", "HEAD"])
    return head or "nogit"


def list_tracked_files():
    """git으로 추적 중인 파일 목록을 가져온다."""
    out = run_git(["ls-files"])
    if not out:
        return []
    return [line.strip() for line in out.splitlines() if line.strip()]


def safe_slug(text: str, max_len: int = 40) -> str:
    if not text:
        return ""
    # 한글/공백 등은 - 로 치환
    text = re.sub(r"[^0-9a-zA-Z가-힣_-]+", "-", text)
    text = text.strip("-")
    if len(text) > max_len:
        text = text[:max_len]
    return text or ""


def next_prompt_index() -> int:
    """
    프롬프트 단위 번호 증가:
    - _snapshots/_prompt_counter.txt 에 마지막 번호 저장
    - 새 스냅샷마다 +1 해서 반환
    """
    SNAP_ROOT.mkdir(parents=True, exist_ok=True)
    n = 0
    try:
        if PROMPT_COUNTER_FILE.exists():
            raw = PROMPT_COUNTER_FILE.read_text(encoding="utf-8").strip()
            if raw:
                n = int(raw)
    except Exception:
        n = 0
    n += 1
    PROMPT_COUNTER_FILE.write_text(str(n), encoding="utf-8")
    return n


def cleanup_old_snapshots(max_keep: int = 3):
    """
    _snapshots 안의 스냅샷 디렉터리 중,
    가장 최근 max_keep 개만 남기고 나머지는 오래된 것부터 삭제.
    """
    if not SNAP_ROOT.exists():
        return

    snaps = [p for p in SNAP_ROOT.iterdir() if p.is_dir()]
    if len(snaps) <= max_keep:
        return

    snaps_sorted = sorted(snaps, key=lambda p: p.name)   # 오래된 것부터
    to_delete = snaps_sorted[:-max_keep]

    for d in to_delete:
        try:
            shutil.rmtree(d)
            print(f"[WAI SNAPSHOT] Removed old snapshot: {d.name}")
        except Exception as e:
            print(f"[WAI SNAPSHOT] Failed to remove {d.name}: {e}")


def cmd_save(description: str, only_tracked: bool = True):
    SNAP_ROOT.mkdir(parents=True, exist_ok=True)

    now = datetime.datetime.now()
    ts_pretty = now.strftime("%Y-%m-%d %H:%M:%S")
    ts_id = now.strftime("%Y%m%d_%H%M%S")
    head = get_head_short()
    slug = safe_slug(description)
    prompt_index = next_prompt_index()

    # 스냅샷 디렉터리 이름: 시간_커밋_프롬프트번호_설명
    snap_name_parts = [ts_id, head, f"P{prompt_index}"]
    if slug:
        snap_name_parts.append(slug)
    snap_name = "_".join(snap_name_parts)

    snap_dir = SNAP_ROOT / snap_name
    snap_dir.mkdir(parents=True, exist_ok=True)

    # 백업 대상 파일 목록
    if only_tracked:
        files = list_tracked_files()
    else:
        # frontend 전체를 백업하고 싶을 때 (숨김/스냅샷/.git 제외)
        files = []
        for p in ROOT.rglob("*"):
            if p.is_dir():
                continue
            rel = p.relative_to(ROOT)
            parts = rel.parts
            if parts[0] in (".git", "_snapshots"):
                continue
            files.append(str(rel).replace("\\", "/"))

    copied = []

    for rel_path in files:
        src = ROOT / rel_path
        if not src.exists():
            continue
        dst = snap_dir / rel_path
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied.append(rel_path)

    manifest = {
        "snapshot": snap_name,
        "created": ts_pretty,
        "head": head,
        "description": description,
        "root": str(ROOT),
        "file_count": len(copied),
        "files": copied,
        "prompt_index": prompt_index,
    }
    with open(snap_dir / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # 프롬프트형 로그 포맷
    print(f"[PROMPT {prompt_index} 1/3 | {ts_pretty}]")
    print(f" ✨ [로컬 스냅샷 저장] {snap_name}")
    print(f"    경로   : {snap_dir}")
    print(f"    파일수 : {len(copied)}")

    # 최근 3개만 유지
    cleanup_old_snapshots(max_keep=3)


def cmd_list():
    if not SNAP_ROOT.exists():
        print("No snapshots found.")
        return

    snaps = sorted([p for p in SNAP_ROOT.iterdir() if p.is_dir()], key=lambda p: p.name)
    if not snaps:
        print("No snapshots found.")
        return

    print("Available snapshots (oldest -> newest):")
    for p in snaps:
        manifest_path = p / "manifest.json"
        desc = ""
        created = ""
        head = ""
        prompt_index = None
        if manifest_path.exists():
            try:
                data = json.loads(manifest_path.read_text(encoding="utf-8"))
                desc = data.get("description", "")
                created = data.get("created", "")
                head = data.get("head", "")
                prompt_index = data.get("prompt_index", None)
            except Exception:
                pass
        line = f"  - {p.name}"
        if prompt_index is not None:
            line += f"  (PROMPT {prompt_index})"
        print(line)
        meta = []
        if created:
            meta.append(f"created: {created}")
        if head:
            meta.append(f"head: {head}")
        if desc:
            meta.append(f"desc: {desc}")
        if meta:
            print("      " + ", ".join(meta))


def cmd_restore(name: str):
    snap_dir = SNAP_ROOT / name
    manifest_path = snap_dir / "manifest.json"

    if not snap_dir.exists():
        print(f"[ERROR] Snapshot not found: {snap_dir}")
        return

    if not manifest_path.exists():
        print(f"[ERROR] manifest.json not found in snapshot: {snap_dir}")
        return

    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    files = data.get("files", [])
    prompt_index = data.get("prompt_index", "?")
    created = data.get("created", "?")

    print(f"[WAI LOCAL SNAPSHOT] Restoring snapshot: {name}")
    print(f"  PROMPT : {prompt_index}")
    print(f"  created: {created}")
    print(f"  From   : {snap_dir}")
    print(f"  Files  : {len(files)}")
    confirm = input("  정말로 현재 파일들을 이 스냅샷으로 덮어쓸까요? (yes/no): ").strip().lower()
    if confirm not in ("yes", "y"):
        print("  취소됨.")
        return

    for rel_path in files:
        src = snap_dir / rel_path
        dst = ROOT / rel_path
        if not src.exists():
            print(f"  [SKIP] Missing in snapshot: {rel_path}")
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"  [RESTORE] {rel_path}")

    print("[DONE] Restore complete. git diff 로 변경 내용 확인 후 커밋하세요.")


# ------------------ 모드 1: CLI (복구 전용) ------------------ #

def cli_main():
    parser = argparse.ArgumentParser(
        description="WAI UI Local Snapshot Helper (frontend/_snapshots)"
    )
    sub = parser.add_subparsers(dest="command")

    p_save = sub.add_parser("save", help="현재 frontend 상태를 스냅샷으로 저장")
    p_save.add_argument("description", nargs="?", default="", help="스냅샷 설명")
    p_save.add_argument(
        "--all",
        action="store_true",
        help="git 추적 파일만이 아니라 frontend 전체 파일을 스냅샷",
    )

    sub.add_parser("list", help="저장된 스냅샷 목록 보기")

    p_restore = sub.add_parser("restore", help="지정한 스냅샷으로 파일 복구")
    p_restore.add_argument("name", help="_snapshots/ 하위 스냅샷 디렉터리 이름")

    args = parser.parse_args()

    if args.command == "save":
        cmd_save(args.description, only_tracked=not args.all)
    elif args.command == "list":
        cmd_list()
    elif args.command == "restore":
        cmd_restore(args.name)
    else:
        parser.print_help()


# ------------------ 모드 2: 클립보드 감시 (자동 스냅샷) ------------------ #

def watch_clipboard():
    global LAST_CONTENT
    print("=============================================")
    print("  🧊 WAI Local Snapshot Watcher")
    print(f"  📂 frontend: {ROOT}")
    print("  패턴:  ### [WAI:LOCAL_SNAPSHOT:설명]")
    print("  동작:  새 프롬프트 끝에서 해당 블럭 복사 → 자동 스냅샷 저장")
    print("  복구:  py tools/wai_local_snapshot.py list / restore ... (CLI 전용)")
    print("=============================================\n")

    while True:
        try:
            content = pyperclip.paste()
            if content != LAST_CONTENT:
                LAST_CONTENT = content
                m = re.search(r'### \[WAI:LOCAL_SNAPSHOT:(.*?)\]', content)
                if m:
                    desc = m.group(1).strip()
                    if not desc:
                        desc = "NO_DESC"
                    cmd_save(desc, only_tracked=True)
        except KeyboardInterrupt:
            print("\n👋 Local Snapshot Watcher 종료")
            break
        except Exception as e:
            print(f"❌ [오류] {e}")
        time.sleep(0.5)


if __name__ == "__main__":
    # 인자가 없으면 → 감시 모드(자동 스냅샷)
    # 인자가 있으면 → CLI 모드(list/restore/save)
    if len(sys.argv) == 1:
        watch_clipboard()
    else:
        cli_main()
