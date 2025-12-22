# WAI-UI 배포 및 관리 가이드

이 문서는 WAI-UI 프로젝트의 개발부터 최종 배포, 지속적인 업데이트 관리까지의 전체 과정을 안내합니다.

---

## 1. 현재 프로젝트 구조

    wai-ui/
    ├── frontend/                    # Vue.js 프론트엔드 (Vite)
    │   ├── index.html
    │   ├── css/
    │   ├── js/
    │   └── package.json
    ├── backend/                     # Python FastAPI 백엔드
    │   ├── server.py               # 메인 서버 (구현됨)
    │   └── requirements.txt
    ├── tools/                       # 개발 도구
    ├── docs/                        # 문서
    ├── electron/                    # [2단계] Electron 메인
    ├── build/                       # [3단계] 빌드 설정
    └── .github/workflows/           # [4단계] CI/CD

---

## 2. 기술 스택

| 항목 | 기술 | 역할 |
|------|------|------|
| 프론트엔드 | Vue.js + Vite | UI |
| 백엔드 | FastAPI | API 서버 |
| 앱 프레임워크 | Electron | 데스크톱 앱 |
| Python 빌드 | Nuitka | Python → exe |
| 앱 패키징 | electron-builder | 설치 파일 생성 |
| 자동 업데이트 | electron-updater | 앱 업데이트 |
| CI/CD | GitHub Actions | 자동 빌드/배포 |

---

## 3. 단계별 진행 요약

    1단계: 기능 개발 ← 현재
      └── Vue.js UI + FastAPI 백엔드 완성
    
    2단계: Electron 통합
      └── Electron으로 앱 감싸기
    
    3단계: 배포 준비
      └── Nuitka 빌드, electron-builder 설정
    
    4단계: CI/CD 구축
      └── GitHub Actions 자동화
    
    5단계: 라이선스 시스템
      └── 서버 인증, 하드웨어 바인딩
    
    6단계: 정식 배포
      └── 릴리즈, 판매 시작

---

## 4. 1단계: 기능 개발

### 4.1 현재 완료된 항목

- [x] Vue.js 프론트엔드 기본 구조
- [x] FastAPI 백엔드 기본 구조 (backend/server.py)
- [x] 파일 업로드 API (/api/upload)
- [ ] TTS 생성 API
- [ ] 이미지 생성 API
- [ ] 프로젝트 저장/불러오기 API

### 4.2 FastAPI 엔드포인트 추가 예시

backend/server.py에 필요한 API를 추가합니다:

    # ===== TTS 생성 API =====
    from pydantic import BaseModel
    
    class TTSRequest(BaseModel):
        text: str
        voice_id: str = "ko-KR-InJoonNeural"
        speed: float = 1.0
    
    @app.post("/api/tts/generate")
    async def generate_tts(request: TTSRequest):
        # Azure TTS 또는 다른 서비스 호출
        # ...
        return {"audio_url": "path/to/audio.mp3"}
    
    # ===== 이미지 생성 API =====
    class ImageRequest(BaseModel):
        prompt: str
        style: str = "ghibli"
    
    @app.post("/api/image/generate")
    async def generate_image(request: ImageRequest):
        # OpenAI DALL-E 또는 다른 서비스 호출
        # ...
        return {"image_url": "path/to/image.png"}
    
    # ===== 프로젝트 저장/불러오기 =====
    @app.post("/api/project/save")
    async def save_project(project_data: dict):
        return {"message": "saved", "project_id": "..."}
    
    @app.get("/api/project/load/{project_id}")
    async def load_project(project_id: str):
        return {"project_data": {...}}

### 4.3 개발 모드 실행

    # 터미널 1: 백엔드 서버
    cd backend
    pip install -r requirements.txt
    uvicorn server:app --reload --port 8000
    
    # 터미널 2: 프론트엔드 개발 서버
    cd frontend
    npm install
    npm run dev

---

## 5. 2단계: Electron 통합

### 5.1 Electron 프로젝트 초기화

    mkdir electron
    cd electron
    npm init -y
    npm install electron electron-builder electron-updater --save-dev

### 5.2 electron/main.js 생성

    const { app, BrowserWindow } = require('electron');
    const { spawn } = require('child_process');
    const path = require('path');
    
    let mainWindow;
    let pythonProcess;
    const isDev = !app.isPackaged;
    
    // Python 백엔드 서버 시작
    function startBackend() {
        if (isDev) {
            pythonProcess = spawn('python', [
                path.join(__dirname, '../backend/server.py')
            ]);
        } else {
            const exePath = path.join(process.resourcesPath, 'backend', 'server.exe');
            pythonProcess = spawn(exePath);
        }
        
        pythonProcess.stdout.on('data', (data) => {
            console.log('[Backend]', data.toString());
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error('[Backend Error]', data.toString());
        });
    }
    
    // 백엔드 서버 준비 대기
    function waitForBackend(retries = 30) {
        return new Promise((resolve, reject) => {
            const check = async (attempt) => {
                try {
                    const res = await fetch('http://localhost:8000/');
                    if (res.ok) return resolve();
                } catch (e) {}
                
                if (attempt >= retries) {
                    return reject(new Error('Backend startup timeout'));
                }
                setTimeout(() => check(attempt + 1), 500);
            };
            check(0);
        });
    }
    
    // 메인 윈도우 생성
    function createWindow() {
        mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });
        
        if (isDev) {
            mainWindow.loadURL('http://localhost:5173');
            mainWindow.webContents.openDevTools();
        } else {
            mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
        }
    }
    
    // 앱 시작
    app.whenReady().then(async () => {
        startBackend();
        
        try {
            await waitForBackend();
            console.log('[Electron] Backend ready');
            createWindow();
        } catch (e) {
            console.error('[Electron] Backend failed:', e);
            app.quit();
        }
    });
    
    // 앱 종료 시 Python 프로세스도 종료
    app.on('window-all-closed', () => {
        if (pythonProcess) pythonProcess.kill();
        if (process.platform !== 'darwin') app.quit();
    });

### 5.3 electron/preload.js 생성

    const { contextBridge, ipcRenderer } = require('electron');
    
    contextBridge.exposeInMainWorld('electronAPI', {
        platform: process.platform,
        versions: process.versions,
        // 필요한 IPC 메서드 추가
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, callback) => ipcRenderer.on(channel, callback)
    });

### 5.4 electron/package.json 생성

    {
      "name": "wai-studio",
      "version": "1.0.0",
      "main": "main.js",
      "scripts": {
        "start": "electron .",
        "build": "electron-builder"
      },
      "build": {
        "appId": "com.wai.studio",
        "productName": "WAI Studio",
        "directories": {
          "output": "../dist"
        },
        "files": [
          "main.js",
          "preload.js"
        ],
        "extraResources": [
          {
            "from": "../frontend/dist",
            "to": "frontend/dist"
          },
          {
            "from": "../build/backend",
            "to": "backend"
          }
        ],
        "win": {
          "target": "nsis",
          "icon": "assets/icon.ico"
        },
        "nsis": {
          "oneClick": false,
          "allowToChangeInstallationDirectory": true
        },
        "publish": {
          "provider": "github",
          "owner": "your-github-username",
          "repo": "wai-ui"
        }
      },
      "devDependencies": {
        "electron": "^28.0.0",
        "electron-builder": "^24.0.0",
        "electron-updater": "^6.0.0"
      }
    }

### 5.5 자동 업데이트 추가 (electron/main.js에 추가)

    const { autoUpdater } = require('electron-updater');
    
    // 앱 시작 후 업데이트 체크
    app.whenReady().then(() => {
        // ... 기존 코드 ...
        
        // 배포 모드에서만 업데이트 체크
        if (!isDev) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });
    
    // 업데이트 이벤트 핸들러
    autoUpdater.on('update-available', () => {
        console.log('Update available');
    });
    
    autoUpdater.on('update-downloaded', () => {
        // 사용자에게 알림 후 재시작
        autoUpdater.quitAndInstall();
    });

---

## 6. 3단계: 배포 준비

### 6.1 backend/requirements.txt

    fastapi==0.109.0
    uvicorn==0.27.0
    python-multipart==0.0.6
    httpx==0.26.0
    pydantic==2.5.0
    openai==1.10.0
    # 기타 필요한 패키지

### 6.2 Nuitka 빌드 스크립트 (build/build_backend.py)

    import subprocess
    import os
    import shutil
    
    def build():
        print("=== Nuitka 백엔드 빌드 시작 ===")
        
        # 빌드 디렉토리 정리
        output_dir = os.path.join(os.path.dirname(__file__), 'backend')
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
        os.makedirs(output_dir)
        
        # Nuitka 빌드 실행
        subprocess.run([
            "python", "-m", "nuitka",
            "--standalone",
            "--onefile",
            "--output-dir=backend",
            "--output-filename=server.exe",
            "--include-package=uvicorn",
            "--include-package=fastapi",
            "--include-package=pydantic",
            "--follow-imports",
            "../backend/server.py"
        ], check=True, cwd=os.path.dirname(__file__))
        
        print("=== 빌드 완료 ===")
    
    if __name__ == "__main__":
        build()

### 6.3 수동 빌드 명령어

    # 1. Python 백엔드를 exe로 빌드
    pip install nuitka
    cd build
    python build_backend.py
    
    # 2. Vue.js 프론트엔드 빌드
    cd ../frontend
    npm run build
    
    # 3. Electron 앱 패키징
    cd ../electron
    npm run build
    
    # 결과물: dist/ 폴더에 설치 파일 생성

---

## 7. 4단계: CI/CD 구축

### 7.1 .github/workflows/build.yml

    name: Build and Release
    
    on:
      push:
        tags:
          - 'v*'
    
    jobs:
      build-windows:
        runs-on: windows-latest
        
        steps:
          - name: Checkout
            uses: actions/checkout@v4
          
          # Python 설정
          - name: Setup Python
            uses: actions/setup-python@v5
            with:
              python-version: '3.11'
          
          # Python 의존성 설치
          - name: Install Python dependencies
            run: |
              pip install -r backend/requirements.txt
              pip install nuitka ordered-set zstandard
          
          # Nuitka로 Python 백엔드 빌드
          - name: Build Backend with Nuitka
            run: |
              mkdir -p build/backend
              python -m nuitka --standalone --onefile --output-dir=build/backend --output-filename=server.exe backend/server.py
          
          # Node.js 설정
          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'
              cache: 'npm'
              cache-dependency-path: frontend/package-lock.json
          
          # 프론트엔드 빌드
          - name: Build Frontend
            run: |
              cd frontend
              npm ci
              npm run build
          
          # Electron 빌드 및 패키징
          - name: Build Electron App
            env:
              GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            run: |
              cd electron
              npm ci
              npm run build
          
          # 릴리즈 업로드
          - name: Upload Release Assets
            uses: softprops/action-gh-release@v1
            with:
              files: |
                dist/*.exe
                dist/*.yml
            env:
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

### 7.2 릴리즈 방법

    # 1. 버전 태그 생성 및 푸시
    git add .
    git commit -m "Release v1.0.0"
    git tag v1.0.0
    git push origin main --tags
    
    # 2. GitHub Actions가 자동으로:
    #    - Python 백엔드 빌드 (Nuitka)
    #    - 프론트엔드 빌드 (Vite)
    #    - Electron 패키징
    #    - GitHub Releases에 업로드
    
    # 3. 사용자 앱에서 자동 업데이트 알림

---

## 8. 5단계: 라이선스 시스템

### 8.1 하드웨어 ID 수집 (backend/license.py)

    import hashlib
    import uuid
    import platform
    import subprocess
    
    def get_hardware_id():
        """기기 고유 식별자 생성"""
        components = []
        
        # MAC 주소
        mac = uuid.getnode()
        components.append(str(mac))
        
        # 플랫폼 정보
        components.append(platform.node())
        components.append(platform.machine())
        
        # Windows: CPU ID 추가
        if platform.system() == 'Windows':
            try:
                output = subprocess.check_output('wmic cpu get ProcessorId', shell=True)
                cpu_id = output.decode().split('\n')[1].strip()
                components.append(cpu_id)
            except:
                pass
        
        # 조합하여 해시
        combined = '|'.join(components)
        return hashlib.sha256(combined.encode()).hexdigest()[:32]

### 8.2 라이선스 검증 API (backend/server.py에 추가)

    from datetime import datetime, timedelta
    import json
    import os
    
    LICENSE_CACHE_FILE = "license_cache.json"
    GRACE_PERIOD_DAYS = 7
    
    class LicenseRequest(BaseModel):
        license_key: str
        hardware_id: str
    
    @app.post("/api/license/verify")
    async def verify_license(request: LicenseRequest):
        # 1. 로컬 캐시 확인 (오프라인 그레이스)
        cached = load_license_cache()
        if cached:
            last_verified = datetime.fromisoformat(cached.get('last_verified', ''))
            if datetime.now() - last_verified < timedelta(days=GRACE_PERIOD_DAYS):
                if cached.get('hardware_id') == request.hardware_id:
                    return {"valid": True, "cached": True}
        
        # 2. 라이선스 서버에 검증 요청
        try:
            # 실제 구현 시 외부 라이선스 서버 호출
            # response = await http_client.post(LICENSE_SERVER_URL, ...)
            
            # 임시: 항상 유효
            is_valid = True
            
            if is_valid:
                save_license_cache({
                    'license_key': request.license_key,
                    'hardware_id': request.hardware_id,
                    'last_verified': datetime.now().isoformat(),
                    'valid_until': (datetime.now() + timedelta(days=365)).isoformat()
                })
                return {"valid": True}
            else:
                return {"valid": False, "reason": "Invalid license key"}
                
        except Exception as e:
            # 네트워크 오류 시 캐시 확인
            if cached and cached.get('hardware_id') == request.hardware_id:
                return {"valid": True, "cached": True, "offline": True}
            return {"valid": False, "reason": str(e)}
    
    def load_license_cache():
        if os.path.exists(LICENSE_CACHE_FILE):
            with open(LICENSE_CACHE_FILE, 'r') as f:
                return json.load(f)
        return None
    
    def save_license_cache(data):
        with open(LICENSE_CACHE_FILE, 'w') as f:
            json.dump(data, f)

### 8.3 프론트엔드 라이선스 체크 (frontend/js/license.js)

    const LICENSE_API = 'http://localhost:8000/api/license/verify';
    
    export async function checkLicense() {
        const licenseKey = localStorage.getItem('license_key');
        const hardwareId = await getHardwareId();
        
        if (!licenseKey) {
            showLicensePrompt();
            return false;
        }
        
        try {
            const response = await fetch(LICENSE_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    license_key: licenseKey,
                    hardware_id: hardwareId
                })
            });
            
            const result = await response.json();
            
            if (result.valid) {
                return true;
            } else {
                showLicenseError(result.reason);
                return false;
            }
        } catch (e) {
            // 오프라인 모드
            console.warn('License check failed, using cached status');
            return true; // 캐시된 상태 사용
        }
    }
    
    function showLicensePrompt() {
        // 라이선스 키 입력 모달 표시
    }
    
    function showLicenseError(reason) {
        // 에러 메시지 표시
    }
    
    async function getHardwareId() {
        // Electron API를 통해 하드웨어 ID 가져오기
        if (window.electronAPI) {
            return await window.electronAPI.getHardwareId();
        }
        // 웹 환경에서는 브라우저 fingerprint 사용
        return 'web-' + navigator.userAgent.hashCode();
    }

---

## 9. 6단계: 정식 배포

### 9.1 배포 전 체크리스트

    [ ] 모든 핵심 기능 테스트 완료
    [ ] 라이선스 시스템 테스트 완료
    [ ] 자동 업데이트 테스트 완료
    [ ] Windows Defender / 백신 테스트
    [ ] 설치/제거 테스트
    [ ] 다양한 Windows 버전 테스트 (10, 11)

### 9.2 코드 서명 인증서 (선택사항)

코드 서명 인증서가 없으면 설치 시 "알 수 없는 게시자" 경고가 표시됩니다.

    # electron-builder 설정에 추가 (인증서 있는 경우)
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "${env.CERT_PASSWORD}"
    }

비용: 연 $300-500 (EV 인증서)
초기에는 없이 시작하고, 매출 발생 후 구매 권장

### 9.3 판매 채널

| 채널 | 수수료 | 특징 |
|------|--------|------|
| 자체 웹사이트 | 결제 수수료만 (3%) | 자유로움 |
| Gumroad | 10% | 쉬운 설정 |
| Paddle | 5-10% | 세금 처리 자동화 |
| FastSpring | 5-8% | B2B에 강점 |

---

## 10. 업데이트 관리

### 10.1 업데이트 종류별 버전 규칙

| 변경 내용 | 버전 변경 | 예시 |
|-----------|-----------|------|
| 버그 수정 | PATCH | 1.0.0 → 1.0.1 |
| 새 기능 추가 | MINOR | 1.0.0 → 1.1.0 |
| 대규모 변경 | MAJOR | 1.0.0 → 2.0.0 |

### 10.2 업데이트 흐름

    [개발자]
    1. 코드 수정
    2. 버전 번호 변경 (package.json)
    3. git commit
    4. git tag v1.0.1
    5. git push --tags
    
    [CI/CD 자동]
    6. GitHub Actions 실행
    7. 빌드 & 패키징
    8. GitHub Releases 업로드
    
    [사용자]
    9. 앱 실행 시 업데이트 알림
    10. "업데이트" 클릭
    11. 자동 다운로드 & 설치

### 10.3 긴급 패치 시

    # 핫픽스 브랜치 생성
    git checkout -b hotfix/v1.0.1
    
    # 수정 후
    git commit -m "Fix critical bug"
    git tag v1.0.1
    git push origin hotfix/v1.0.1 --tags
    
    # main에 머지
    git checkout main
    git merge hotfix/v1.0.1
    git push

---

## 11. 체크리스트

### 1단계: 기능 개발
- [ ] 모든 UI 컴포넌트 완성
- [ ] 모든 API 엔드포인트 구현
- [ ] 프론트엔드-백엔드 연동 테스트
- [ ] 로컬 환경에서 전체 기능 테스트

### 2단계: Electron 통합
- [ ] electron/ 폴더 생성
- [ ] main.js, preload.js 작성
- [ ] package.json 설정
- [ ] 개발 모드에서 Electron 실행 테스트
- [ ] 자동 업데이트 코드 추가

### 3단계: 배포 준비
- [ ] requirements.txt 정리
- [ ] Nuitka 빌드 테스트
- [ ] 프론트엔드 빌드 테스트
- [ ] Electron 패키징 테스트
- [ ] 생성된 exe 실행 테스트

### 4단계: CI/CD 구축
- [ ] GitHub repository 설정
- [ ] .github/workflows/build.yml 작성
- [ ] 테스트 태그 푸시로 CI/CD 확인
- [ ] GitHub Releases 확인

### 5단계: 라이선스 시스템
- [ ] 하드웨어 ID 수집 구현
- [ ] 라이선스 검증 API 구현
- [ ] 오프라인 그레이스 기간 구현
- [ ] 프론트엔드 라이선스 체크 구현

### 6단계: 정식 배포
- [ ] 최종 테스트 완료
- [ ] 버전 1.0.0 태그
- [ ] GitHub Releases에 릴리즈 노트 작성
- [ ] 판매 페이지 준비
- [ ] 고객 지원 채널 준비

---

## 자주 묻는 질문

Q: 기능 추가 후에도 CI/CD가 정상 작동하나요?
A: 네, 파일 수와 무관하게 동일하게 작동합니다.

Q: 인증서 없이 배포 가능한가요?
A: 가능합니다. 다만 설치 시 경고창이 표시됩니다.

Q: 업데이트는 어떻게 배포하나요?
A: 코드 수정 → 버전 태그 푸시 → 자동 빌드 → 사용자 자동 알림

Q: Mac/Linux 지원은?
A: CI/CD에 macOS/Linux 빌드 job 추가로 가능합니다.

---

문서 최종 업데이트: 2025년
