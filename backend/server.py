# C:\wai-ui\backend\server.py

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import os

# 파일이 저장될 디렉토리 설정
UPLOAD_DIR = "uploaded_files"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI()

# 프론트엔드(localhost:5174 또는 5173)와의 통신을 허용하기 위한 CORS 설정
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",  # 새로 사용할 포트 추가
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 기본 상태 확인 엔드포인트
@app.get("/")
def read_root():
    return {"status": "backend ok"}

# 🚀 2번 항목 구현: 파일 업로드 API 추가
@app.post("/api/upload")
async def upload_asset(
    file: UploadFile = File(...), 
    description: str = Form(None)
):
    try:
        # 파일을 서버에 저장
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            # 파일 내용을 비동기적으로 읽어와 저장 (chunk 단위)
            while content := await file.read(1024 * 1024):  # 1MB씩 읽기
                buffer.write(content)
        
        print(f"✅ 파일 업로드 성공: {file.filename} (설명: {description})")
        
        return {
            "filename": file.filename, 
            "message": "File successfully uploaded and saved.",
            "description": description
        }
    except Exception as e:
        print(f"❌ 파일 업로드 실패: {e}")
        return {"message": "File upload failed.", "error": str(e)}