import time
import os
import pyperclip
import re

# ==========================================
# [설정] 파일이 저장될 타겟 폴더 (프론트엔드)
# ==========================================
TARGET_ROOT = r"C:\wai-ui\frontend"
LAST_CONTENT = ""

print(f"=============================================")
print(f"   🎩 WAI Magic Sync 가 실행 중입니다...")
print(f"   📂 타겟 경로: {TARGET_ROOT}")
print(f"   [Copy] 버튼을 누르면 즉시 파일이 업데이트됩니다.")
print(f"=============================================")

def save_file(filename, content):
    # 파일 경로 조합
    filepath = os.path.join(TARGET_ROOT, filename)
    
    # 폴더가 없으면 생성 (예: electron 폴더)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # 파일 쓰기
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✨ [업데이트 완료] {filename}")
    except Exception as e:
        print(f"   ❌ [오류 발생] {e}")

while True:
    try:
        # 1. 클립보드 감시
        content = pyperclip.paste()
        
        # 2. 내용 변경 감지
        if content != LAST_CONTENT:
            LAST_CONTENT = content
            
            # 3. 태그 확인: ### [WAI:UPDATE:파일경로]
            match = re.search(r'### \[WAI:UPDATE:(.*?)\]', content)
            
            if match:
                target_file = match.group(1).strip()
                # 태그 줄을 제외한 코드만 추출
                clean_code = re.sub(r'### \[WAI:UPDATE:.*?\]\s*', '', content, count=1)
                
                # 저장 수행
                save_file(target_file, clean_code)
                
    except KeyboardInterrupt:
        break
    except Exception as e:
        print(f"Error: {e}")
        
    time.sleep(0.5)