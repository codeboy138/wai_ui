import time
import os
import pyperclip
import re
import subprocess

# ==========================================
# [설정]
# ==========================================
TARGET_ROOT = r"C:\wai-ui\frontend"
LAST_CONTENT = ""
GIT_ENABLED = False
AUTO_PUSH_ENABLED = False

def check_git_environment():
    """Git 환경 검증"""
    global GIT_ENABLED, AUTO_PUSH_ENABLED
    
    print(f"\n🔍 [Git 환경 검증 시작]")
    
    # 1. Git 설치 확인
    try:
        result = subprocess.run(['git', '--version'], capture_output=True, text=True, check=True)
        print(f"   ✅ Git 설치: {result.stdout.strip()}")
    except FileNotFoundError:
        print(f"   ❌ Git 미설치")
        return False
    
    # 2. Git 저장소 확인
    try:
        os.chdir(TARGET_ROOT)
        subprocess.run(['git', 'status'], capture_output=True, text=True, check=True)
        print(f"   ✅ Git 저장소 초기화됨")
    except subprocess.CalledProcessError:
        print(f"   ❌ Git 저장소 미초기화")
        return False
    
    # 3. 사용자 정보 확인
    try:
        name = subprocess.run(['git', 'config', 'user.name'], capture_output=True, text=True)
        email = subprocess.run(['git', 'config', 'user.email'], capture_output=True, text=True)
        
        if name.stdout.strip() and email.stdout.strip():
            print(f"   ✅ Git 사용자: {name.stdout.strip()} <{email.stdout.strip()}>")
        else:
            print(f"   ❌ Git 사용자 정보 미설정")
            return False
    except Exception as e:
        print(f"   ⚠️ 사용자 정보 확인 실패: {e}")
        return False
    
    # 4. 원격 저장소 확인
    try:
        remote = subprocess.run(['git', 'remote', '-v'], capture_output=True, text=True)
        if remote.stdout.strip():
            print(f"   ✅ 원격 저장소 연결됨")
            for line in remote.stdout.strip().split('\n')[:2]:
                print(f"      {line}")
            AUTO_PUSH_ENABLED = True
        else:
            print(f"   ⚠️ 원격 저장소 미연결 (로컬 커밋만 수행)")
            AUTO_PUSH_ENABLED = False
    except Exception as e:
        print(f"   ⚠️ 원격 저장소 확인 실패: {e}")
        AUTO_PUSH_ENABLED = False
    
    print(f"✅ [Git 환경 검증 완료]\n")
    return True

def git_commit_and_push(filename):
    """Git 자동 커밋 + GitHub Push"""
    if not GIT_ENABLED:
        return
    
    try:
        os.chdir(TARGET_ROOT)
        
        # Git add
        subprocess.run(['git', 'add', filename], capture_output=True, text=True, check=True)
        
        # Git commit
        commit_msg = f"[Auto] Update {filename}"
        result_commit = subprocess.run(
            ['git', 'commit', '-m', commit_msg], 
            capture_output=True, 
            text=True
        )
        
        if result_commit.returncode == 0:
            print(f"   🔥 [로컬 커밋] {commit_msg}")
            
            # GitHub Push
            if AUTO_PUSH_ENABLED:
                # 현재 브랜치 확인
                branch_result = subprocess.run(
                    ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                    capture_output=True,
                    text=True
                )
                current_branch = branch_result.stdout.strip()
                
                # Push (upstream 자동 설정)
                result_push = subprocess.run(
                    ['git', 'push', '--set-upstream', 'origin', current_branch], 
                    capture_output=True, 
                    text=True,
                    timeout=10
                )
                
                if result_push.returncode == 0:
                    print(f"   🚀 [GitHub Push 완료] https://github.com/codeboy138/wai_ui")
                else:
                    error_msg = result_push.stderr.strip()
                    # "Everything up-to-date" 메시지는 정상
                    if "up-to-date" in error_msg or "up-to-date" in result_push.stdout:
                        print(f"   ℹ️ [GitHub] 이미 최신 상태")
                    else:
                        print(f"   ⚠️ [Push 실패] {error_msg}")
        elif "nothing to commit" in result_commit.stdout:
            print(f"   ℹ️ [변경사항 없음] {filename}")
            
    except subprocess.TimeoutExpired:
        print(f"   ⚠️ [Push 타임아웃] 네트워크 확인 필요")
    except Exception as e:
        print(f"   ⚠️ [Git 오류] {e}")

def save_file(filename, content):
    """파일 저장 + Git 커밋 + GitHub Push"""
    filepath = os.path.join(TARGET_ROOT, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✨ [로컬 저장] {filename}")
        
        # Git 자동 커밋 + Push
        git_commit_and_push(filename)
        
    except Exception as e:
        print(f"   ❌ [저장 오류] {e}")

# ==========================================
# 실행 시작
# ==========================================
print(f"=============================================")
print(f"   🎩 WAI Magic Sync (Auto Commit + Push)")
print(f"   📂 로컬: {TARGET_ROOT}")
print(f"   🌐 GitHub: https://github.com/codeboy138/wai_ui")
print(f"=============================================")

# Git 환경 검증
GIT_ENABLED = check_git_environment()

if GIT_ENABLED:
    if AUTO_PUSH_ENABLED:
        print(f"   🔥 로컬 커밋 + 🚀 GitHub Push 활성화")
    else:
        print(f"   🔥 로컬 커밋만 활성화 (원격 저장소 미연결)")
else:
    print(f"   ⚠️ Git 비활성화 (파일 저장만 수행)")

print(f"   [대기 중] 클립보드 감시 중...")
print(f"=============================================\n")

while True:
    try:
        content = pyperclip.paste()
        
        if content != LAST_CONTENT:
            LAST_CONTENT = content
            match = re.search(r'### \[WAI:UPDATE:(.*?)\]', content)
            
            if match:
                target_file = match.group(1).strip()
                clean_code = re.sub(r'### \[WAI:UPDATE:.*?\]\s*', '', content, count=1)
                save_file(target_file, clean_code)
                
    except KeyboardInterrupt:
        print("\n   👋 Magic Sync 종료")
        break
    except Exception as e:
        print(f"   ❌ [오류] {e}")
        
    time.sleep(0.5)
