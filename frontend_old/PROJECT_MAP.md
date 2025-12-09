# 🗺️ WAI Studio Project Structure (Tree View)

C:\wai-ui\frontend
├── 📄 DESIGN_GUIDE.md        [Docs] (New) 디자인 시스템 가이드북 (색상, 상태 정의)
├── 📁 css
│   └── 📄 main.css           [Style] 전체 UI 스타일 (Tailwind 커스텀)
├── 📁 js
│   ├── 📄 app.js             [Entry] Vue 앱 인스턴스
│   ├── 📄 store.js           [Data] 전역 상태 저장소
│   ├── 📄 bridge.js          [IPC] 통신 브리지
│   └── 📁 components
│       ├── 📄 Common.js        [UI] 공통 위젯
│       ├── 📄 UICustom.js      [Logic] UI 전용 로직
│       ├── 📄 Header.js        [UI] 상단 헤더
│       ├── 📄 PreviewToolbar.js[UI] 프리뷰 툴바
│       ├── 📄 PreviewCanvas.js [UI] 캔버스
│       ├── 📄 TimelinePanel.js [UI] 타임라인
│       ├── 📄 LeftPanel.js     [UI] 좌측 패널
│       ├── 📄 RightPanel.js    [UI] 우측 패널
│       └── 📄 ProjectModal.js  [UI] 프로젝트 관리
├── 📄 index.html             [Html] 진입점
├── 📄 package.json           [Config] 설정
└── 📄 .gitignore             [Git] 설정

## 📝 Change Log
- **[CREATE]** `DESIGN_GUIDE.md`: Zinc Dark 테마 명세 및 30색 팔레트 정의 파일 생성.
- **[UPDATE]** `PROJECT_MAP.md`: 신규 파일 등록 및 구조 갱신.
- **[UPDATE]** `js/components/RightPanel.js`: (이전작업) 레이어 매트릭스 및 속성 패널 기능 구현 완료.
- **[UPDATE]** `js/components/TimelinePanel.js`: (이전작업) 타임라인 리사이징, 도킹, 이름 변경 구현 완료.