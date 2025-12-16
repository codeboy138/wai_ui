/**
 * WAI UI Element Specs
 * - Dev 모드에서 ID 기준으로 py/js/data-action 정보를 보여주기 위한 중앙 정의 파일
 * - vm.buildDevInfo() → window.WAI_getElementSpec(id) 를 통해 접근
 */

(function (global) {
    const SPECS = {
        /* -----------------------------------------------------
         * Root / Layout
         * --------------------------------------------------- */
        'app-root-container': {
            module: 'root',
            desc: 'WAI Studio 전체 앱 컨테이너 (body)',
            io: { input: [], output: [] },
            logic: '최상위 DOM 루트. Vue 앱 및 전체 레이아웃을 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'app-vue-root': {
            module: 'root.vue',
            desc: 'Vue 애플리케이션이 마운트되는 루트 노드',
            io: { input: [], output: [] },
            logic: 'Vue createApp(AppRoot).mount() 대상 엘리먼트.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'main-layout-root': {
            module: 'layout.main',
            desc: '좌/중앙/우 패널을 담는 메인 레이아웃 컨테이너',
            io: { input: [], output: [] },
            logic: 'flex 레이아웃으로 좌측 패널, 중앙 패널, 우측 패널을 배치.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['main-left-panel', 'main-center-panel', 'main-right-panel'],
            examples: []
        },

        /* -----------------------------------------------------
         * Header - Main
         * --------------------------------------------------- */
        'header-main-panel': {
            module: 'header.main',
            desc: '상단 헤더 전체 영역',
            io: { input: [], output: [] },
            logic: '로고, 상단 네비게이션, Inspector/Dev 토글, 윈도우 컨트롤을 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['header-nav-container', 'header-window-controls-container'],
            examples: []
        },
        'header-main-logo-label': {
            module: 'header.main',
            desc: 'WAI 로고 텍스트 라벨',
            io: { input: [], output: [] },
            logic: '클릭 동작은 아직 정의되지 않은 단순 라벨.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'header-main-menu-container': {
            module: 'header.main',
            desc: '상단 좌측 햄버거 메뉴 컨테이너',
            io: { input: [], output: [] },
            logic: '추후 메인 메뉴 드롭다운 추가 예정.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },

        /* -----------------------------------------------------
         * Header - Navigation
         * --------------------------------------------------- */
        'header-nav-container': {
            module: 'header.nav',
            desc: '상단 네비게이션 버튼 그룹 컨테이너',
            io: { input: [], output: [] },
            logic: '탐색/제작/자산/설정/연구 탭 버튼 묶음.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'header-nav-explore-btn',
                'header-nav-create-btn',
                'header-nav-assets-btn',
                'header-nav-settings-btn',
                'header-nav-research-btn'
            ],
            examples: []
        },
        'header-nav-explore-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 탐색 탭 버튼',
            io: {
                input: ['click'],
                output: ['backend.nav_explore']
            },
            logic: '클릭 시 Python backend.nav_explore 호출 (프로젝트 탐색 화면 요청).',
            py_func: 'nav_explore',
            js_action: null,
            events: ['click'],
            affects: ['main-center-panel'],
            examples: [
                'data-action="py:nav_explore"'
            ]
        },
        'header-nav-create-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 제작 탭 버튼',
            io: {
                input: ['click'],
                output: ['UI: isProjectModalOpen = true']
            },
            logic: '클릭 시 새 프로젝트 생성 모달을 오픈.',
            py_func: null,
            js_action: 'openProjectModal',
            events: ['click'],
            affects: ['project-modal'],
            examples: [
                'data-action="js:openProjectModal"'
            ]
        },
        'header-nav-assets-group': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 자산 드롭다운 그룹 컨테이너',
            io: { input: [], output: [] },
            logic: 'hover 시 자산 관리 메뉴를 표시하는 그룹 래퍼.',
            py_func: null,
            js_action: null,
            events: ['hover'],
            affects: ['header-nav-assets-btn', 'header-menu-assets-manage-item'],
            examples: []
        },
        'header-nav-assets-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 자산 버튼 (드롭다운 트리거)',
            io: { input: ['hover', 'click'], output: [] },
            logic: 'hover 시 자산 관련 서브 메뉴를 표시. 직접적인 py 호출은 없음.',
            py_func: null,
            js_action: null,
            events: ['mouseenter', 'mouseleave', 'click'],
            affects: ['header-menu-assets-manage-item'],
            examples: []
        },
        'header-menu-assets-manage-item': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 자산 관리 메뉴 아이템',
            io: {
                input: ['click'],
                output: ['backend.open_asset_manager']
            },
            logic: '클릭 시 Python backend.open_asset_manager 호출.',
            py_func: 'open_asset_manager',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:open_asset_manager"'
            ]
        },
        'header-nav-settings-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 설정 탭 버튼',
            io: {
                input: ['click'],
                output: ['backend.nav_settings']
            },
            logic: '클릭 시 Python backend.nav_settings 호출 (설정 화면 요청).',
            py_func: 'nav_settings',
            js_action: null,
            events: ['click'],
            affects: ['main-right-panel'],
            examples: [
                'data-action="py:nav_settings"'
            ]
        },
        'header-nav-research-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 연구 탭 버튼',
            io: {
                input: ['click'],
                output: ['backend.nav_research']
            },
            logic: '클릭 시 Python backend.nav_research 호출 (연구/실험 화면 요청).',
            py_func: 'nav_research',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:nav_research"'
            ]
        },

        /* -----------------------------------------------------
         * Header - Dev / Inspector
         * --------------------------------------------------- */
        'header-dev-inspect-btn': {
            module: 'header.dev',
            desc: 'Inspector 모드 토글 버튼',
            io: {
                input: ['click'],
                output: ['body.classList += dev-mode-active']
            },
            logic: '클릭 시 Inspect 모드를 토글. Dev 모드와는 상호 배타적.',
            py_func: null,
            js_action: 'toggleDevModeActive',
            events: ['click'],
            affects: ['dev-overlay-root'],
            examples: [
                'data-action="js:toggleDevModeActive"'
            ]
        },
        'header-dev-mode-btn': {
            module: 'header.dev',
            desc: 'Dev(개발자) 모드 토글 버튼',
            io: {
                input: ['click'],
                output: ['body.classList += dev-mode-full']
            },
            logic: '클릭 시 Dev 모드를 토글. Inspect 모드와는 상호 배타적.',
            py_func: null,
            js_action: 'toggleDevModeFull',
            events: ['click'],
            affects: ['dev-overlay-root'],
            examples: [
                'data-action="js:toggleDevModeFull"'
            ]
        },

        /* -----------------------------------------------------
         * Header - Window Controls
         * --------------------------------------------------- */
        'header-window-controls-container': {
            module: 'header.window',
            desc: '윈도우 컨트롤(최소화/최대화/닫기) 버튼 컨테이너',
            io: { input: [], output: [] },
            logic: '각 버튼은 Python backend를 통해 실제 OS 윈도우 제어.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'header-window-min-btn',
                'header-window-max-btn',
                'header-window-close-btn'
            ],
            examples: []
        },
        'header-window-min-btn': {
            module: 'header.window',
            desc: '윈도우 최소화 버튼',
            io: {
                input: ['click'],
                output: ['backend.win_min']
            },
            logic: '클릭 시 Python backend.win_min 호출.',
            py_func: 'win_min',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:win_min"'
            ]
        },
        'header-window-max-btn': {
            module: 'header.window',
            desc: '윈도우 최대화/복원 토글 버튼',
            io: {
                input: ['click'],
                output: ['backend.win_max']
            },
            logic: '클릭 시 Python backend.win_max 호출 (최대화/복원 토글).',
            py_func: 'win_max',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:win_max"'
            ]
        },
        'header-window-close-btn': {
            module: 'header.window',
            desc: '윈도우 닫기(앱 종료) 버튼',
            io: {
                input: ['click'],
                output: ['backend.win_close']
            },
            logic: '클릭 시 Python backend.win_close 호출 (앱 종료).',
            py_func: 'win_close',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:win_close"'
            ]
        },

        /* -----------------------------------------------------
         * Left Panel (Assets)
         * --------------------------------------------------- */
        'main-left-panel': {
            module: 'panel.left',
            desc: '좌측 패널(자산 영역) 컨테이너',
            io: { input: [], output: [] },
            logic: '자산 목록 및 자산 추가 버튼을 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['main-left-assets-list'],
            examples: []
        },
        'main-left-header-bar': {
            module: 'panel.left',
            desc: '좌측 패널 헤더 바 (제목 및 + 버튼)',
            io: { input: [], output: [] },
            logic: '"자산(Assets)" 라벨과 자산 추가 버튼을 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['main-left-assets-add-btn'],
            examples: []
        },
        'main-left-assets-add-btn': {
            module: 'panel.left.assets',
            desc: '좌측 패널 - 자산 추가(Import) 버튼',
            io: {
                input: ['click'],
                output: ['backend.import_asset']
            },
            logic: '클릭 시 Python backend.import_asset 호출 (새 자산 가져오기).',
            py_func: 'import_asset',
            js_action: null,
            events: ['click'],
            affects: ['main-left-assets-list'],
            examples: [
                'data-action="py:import_asset"'
            ]
        },
        'main-left-assets-list': {
            module: 'panel.left.assets',
            desc: '좌측 패널 - 자산 리스트(플레이스홀더)',
            io: { input: [], output: [] },
            logic: '초기에는 "자산 목록이 비어있습니다." 플레이스홀더를 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'main-left-resizer-v': {
            module: 'panel.left.resizer',
            desc: '좌측 패널 너비 조절 리사이저',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['state.leftPanelWidth 변경']
            },
            logic: '드래그하여 좌측 패널의 너비를 조절.',
            py_func: null,
            js_action: 'resizePanelLeft',
            events: ['mousedown'],
            affects: ['main-left-panel'],
            examples: [
                'data-action="js:resizePanelLeft"'
            ]
        },

        /* -----------------------------------------------------
         * Center Panel / Preview
         * --------------------------------------------------- */
        'main-center-panel': {
            module: 'panel.center',
            desc: '중앙 패널(프리뷰 + 타임라인) 컨테이너',
            io: { input: [], output: [] },
            logic: '상단 프리뷰 영역과 하단 타임라인 패널로 구성.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-main-container'],
            examples: []
        },
        'preview-main-container': {
            module: 'preview',
            desc: '프리뷰 전체 컨테이너 (툴바 + 캔버스)',
            io: { input: [], output: [] },
            logic: '상단 툴바와 하단 실제 캔버스를 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'preview-toolbar-panel',
                'preview-canvas-wrapper'
            ],
            examples: []
        },
        'preview-toolbar-panel': {
            module: 'preview.toolbar',
            desc: '프리뷰 상단 툴바 영역',
            io: { input: [], output: [] },
            logic: '비율/해상도/SNAP 토글 및 좌표 표시 기능 제공.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'preview-toolbar-ratio-dropdown',
                'preview-toolbar-resolution-dropdown',
                'preview-toolbar-snap-toggle',
                'preview-toolbar-coord-box'
            ],
            examples: []
        },
        'preview-toolbar-ratio-dropdown': {
            module: 'preview.toolbar',
            desc: '프리뷰 - 캔버스 비율 선택 드롭다운',
            io: {
                input: ['select'],
                output: ['state.aspectRatio 변경']
            },
            logic: '선택한 비율(16:9, 9:16, 1:1)에 따라 캔버스 가로세로 비를 조정.',
            py_func: null,
            js_action: 'setAspect',
            events: ['change'],
            affects: ['preview-canvas-scaler'],
            examples: []
        },
        'preview-toolbar-coord-box': {
            module: 'preview.toolbar',
            desc: '프리뷰 - 마우스 좌표 표시 박스',
            io: {
                input: ['mousemove (on canvas)'],
                output: ['coord 텍스트 업데이트']
            },
            logic: '프리뷰 캔버스 내 마우스 위치를 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-toolbar-coord-label'],
            examples: []
        },
        'preview-toolbar-coord-label': {
            module: 'preview.toolbar',
            desc: '프리뷰 - 마우스 좌표 라벨 (텍스트)',
            io: { input: [], output: [] },
            logic: 'Vue 바인딩으로 mouseCoord.x, mouseCoord.y 값을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-toolbar-resolution-dropdown': {
            module: 'preview.toolbar',
            desc: '프리뷰 - 해상도 선택 드롭다운',
            io: {
                input: ['select'],
                output: ['state.resolution 변경']
            },
            logic: '8K/6K/4K/3K/2K 등 해상도 프리셋 변경.',
            py_func: null,
            js_action: 'setResolution',
            events: ['change'],
            affects: ['preview-canvas-scaler'],
            examples: []
        },
        'preview-toolbar-snap-toggle': {
            module: 'preview.toolbar',
            desc: '프리뷰 - SNAP(자석) 토글 스위치',
            io: {
                input: ['click'],
                output: ['state.isMagnet 토글']
            },
            logic: '캔버스 내 박스 이동/정렬 시 스냅 기능 온/오프.',
            py_func: null,
            js_action: 'toggleSnapMagnet',
            events: ['click'],
            affects: ['preview-canvas-scaler'],
            examples: [
                'data-action="js:toggleSnapMagnet"'
            ]
        },
        'preview-canvas-wrapper': {
            module: 'preview.canvas',
            desc: '프리뷰 캔버스 래퍼 (검정 배경 + 중앙 정렬)',
            io: {
                input: ['mousemove', 'mouseleave'],
                output: ['mouseCoord, isMouseOverCanvas 업데이트']
            },
            logic: 'updateCanvasMouseCoord()의 기준이 되는 영역.',
            py_func: null,
            js_action: 'updateCanvasMouseCoord',
            events: ['mousemove', 'mouseleave'],
            affects: ['preview-toolbar-coord-box', 'mouseMarkerPos'],
            examples: []
        },
        'preview-ruler-h': {
            module: 'preview.ruler',
            desc: '수평 룰러 컨테이너',
            io: { input: [], output: [] },
            logic: 'preview 상단의 수평 ruler-line 컴포넌트를 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-ruler-v': {
            module: 'preview.ruler',
            desc: '수직 룰러 컨테이너',
            io: { input: [], output: [] },
            logic: 'preview 좌측의 수직 ruler-line 컴포넌트를 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-canvas-viewport': {
            module: 'preview.canvas',
            desc: '프리뷰 캔버스 뷰포트(스크롤/클리핑 영역)',
            io: { input: [], output: [] },
            logic: '실제 캔버스 스케일러를 감싸는 뷰포트 역할.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-canvas-scaler'],
            examples: []
        },
        'preview-canvas-scaler': {
            module: 'preview.canvas',
            desc: '프리뷰 캔버스 스케일러 (실제 3840x2160 등 캔버스)',
            io: {
                input: ['ResizeObserver(wrapper)'],
                output: ['state.canvasScale 변경']
            },
            logic: 'wrapper 크기에 맞춰 Canvas를 scale하여 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-canvas-wrapper'],
            examples: []
        },
        'preview-guide-h': {
            module: 'preview.guides',
            desc: '프리뷰 캔버스 수평 가이드 라인',
            io: { input: [], output: [] },
            logic: '캔버스 중앙 Y축 기준 가이드라인(십자선) 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-guide-v': {
            module: 'preview.guides',
            desc: '프리뷰 캔버스 수직 가이드 라인',
            io: { input: [], output: [] },
            logic: '캔버스 중앙 X축 기준 가이드라인(십자선) 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-canvas-overlay-root': {
            module: 'preview.canvas.overlay',
            desc: '프리뷰 캔버스 상의 선택 가능한 박스들을 감싸는 오버레이 루트',
            io: {
                input: ['click'],
                output: ['select-box(null) emit (선택 해제)', 'contextMenu 닫힘']
            },
            logic: '오버레이 빈 공간 클릭 시 컨텍스트 메뉴를 닫고 선택을 해제.',
            py_func: null,
            js_action: null,
            events: ['click'],
            affects: ['preview-canvas-box-{id}', 'panel-right-props-root'],
            examples: []
        },
        'preview-canvas-box-{id}': {
            module: 'preview.canvas.box',
            desc: '프리뷰 캔버스 상의 개별 레이어 박스 (드래그/리사이즈/컨텍스트 메뉴)',
            io: {
                input: ['mousedown', 'drag', 'resize', 'contextmenu'],
                output: [
                    'select-box(boxId) emit',
                    'updateBoxPosition(boxId, dx, dy, w, h) 호출(부모)',
                    'remove-box emit(삭제 시)'
                ]
            },
            logic: 'interact.js를 사용해 위치/크기를 조정하고, 선택/삭제/컨텍스트 메뉴를 통해 상호작용.',
            py_func: null,
            js_action: 'selectCanvasBox',
            events: ['mousedown', 'drag', 'resize', 'contextmenu'],
            affects: ['preview-canvas-scaler', 'panel-right-props-root'],
            examples: [
                'data-action="js:selectCanvasBox"'
            ]
        },
        'preview-canvas-context-menu': {
            module: 'preview.canvas.context',
            desc: '프리뷰 캔버스 박스용 컨텍스트 메뉴 루트',
            io: {
                input: ['click(메뉴 항목)'],
                output: ['remove-box emit', '추후: zIndex 조정']
            },
            logic: '박스 우클릭 시 표시되며, 맨 위로/삭제 등 액션을 제공.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-canvas-box-{id}'],
            examples: []
        },
        'preview-canvas-context-top-btn': {
            module: 'preview.canvas.context',
            desc: '선택 박스를 맨 위로 올리는 컨텍스트 메뉴 항목 (예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '향후 선택된 박스의 zIndex를 최상단으로 올리는 기능에 연결 예정.',
            py_func: null,
            js_action: 'canvasContextBringToFront',
            events: ['click'],
            affects: ['preview-canvas-box-{id}'],
            examples: [
                'data-action="js:canvasContextBringToFront"'
            ]
        },
        'preview-canvas-context-delete-btn': {
            module: 'preview.canvas.context',
            desc: '선택 박스를 삭제하는 컨텍스트 메뉴 항목',
            io: {
                input: ['click'],
                output: ['remove-box emit → vm.removeBox 호출']
            },
            logic: '선택된 박스를 프리뷰 캔버스에서 제거.',
            py_func: null,
            js_action: 'canvasContextDelete',
            events: ['click'],
            affects: ['preview-canvas-box-{id}', 'panel-right-props-root'],
            examples: [
                'data-action="js:canvasContextDelete"'
            ]
        },

        /* -----------------------------------------------------
         * Center Panel - Timeline Resizer
         * --------------------------------------------------- */
        'main-center-timeline-resizer-h': {
            module: 'panel.center.timeline',
            desc: '프리뷰/타임라인 사이 세로 리사이저',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['previewContainerHeight, timelineContainerHeight 변경']
            },
            logic: '드래그하여 프리뷰/타임라인 영역의 높이 비율을 조절.',
            py_func: null,
            js_action: 'resizePanelCenter',
            events: ['mousedown'],
            affects: ['preview-main-container', 'timeline-panel'],
            examples: [
                'data-action="js:resizePanelCenter"'
            ]
        },

        /* -----------------------------------------------------
         * Timeline Panel
         * --------------------------------------------------- */
        'timeline-main-panel': {
            module: 'timeline.panel',
            desc: '타임라인 전체 패널(헤더 + 퀵바 + 트랙/클립 영역)',
            io: {
                input: ['wheel'],
                output: ['zoom 변경 또는 수평 스크롤']
            },
            logic: '휠/Shift+휠로 줌/스크롤 조작을 처리 (handleWheel).',
            py_func: null,
            js_action: 'timelineWheelScroll',
            events: ['wheel'],
            affects: ['timeline-scroll-container'],
            examples: [
                'data-action="js:timelineWheelScroll"'
            ]
        },
        'timeline-header-bar': {
            module: 'timeline.header',
            desc: '타임라인 상단 헤더 (접기, 타임코드, 줌 슬라이더)',
            io: { input: [], output: [] },
            logic: '좌측에 접기 버튼과 타임코드, 우측에 줌 슬라이더를 배치.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'timeline-header-collapse-btn',
                'timeline-header-timecode-label',
                'timeline-header-zoom-slider'
            ],
            examples: []
        },
        'timeline-header-collapse-btn': {
            module: 'timeline.header',
            desc: '타임라인 접기/펼치기 토글 버튼',
            io: {
                input: ['click'],
                output: ['vm.isTimelineCollapsed 토글', 'preview-main-container 높이 변경']
            },
            logic: '타임라인 패널을 접거나 펼쳐서 프리뷰 영역 높이를 조정.',
            py_func: null,
            js_action: 'toggleTimelineCollapse',
            events: ['click'],
            affects: ['timeline-main-panel', 'preview-main-container'],
            examples: [
                'data-action="js:toggleTimelineCollapse"'
            ]
        },
        'timeline-header-timecode-label': {
            module: 'timeline.header',
            desc: '현재 플레이헤드 시간을 표시하는 타임코드 라벨',
            io: { input: [], output: [] },
            logic: 'vm.currentTime을 HH:MM:SS:FF 포맷으로 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-header-zoom-slider': {
            module: 'timeline.header',
            desc: '타임라인 줌 슬라이더',
            io: {
                input: ['input'],
                output: ['vm.zoom 변경']
            },
            logic: '줌 레벨(10~100)을 변경하여 타임축 단위(초당 px)를 조절.',
            py_func: null,
            js_action: 'timelineChangeZoom',
            events: ['input'],
            affects: ['timeline-time-ruler-row', 'timeline-clip-{id}'],
            examples: [
                'data-action="js:timelineChangeZoom"'
            ]
        },
        'timeline-toolbar-quick-bar': {
            module: 'timeline.toolbar',
            desc: '타임라인 퀵 툴바 (Cut/Delete/Magnet/Ripple/Normalize/Volume)',
            io: { input: [], output: [] },
            logic: '타임라인 편집에 자주 쓰이는 도구들을 묶어 둔 퀵바.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'timeline-tool-cut-btn',
                'timeline-tool-delete-btn',
                'timeline-tool-magnet-btn',
                'timeline-tool-ripple-btn',
                'timeline-tool-normalize-btn',
                'timeline-tool-volume-icon'
            ],
            examples: []
        },
        'timeline-tool-cut-btn': {
            module: 'timeline.toolbar',
            desc: '타임라인 클립 자르기(Cut) 도구 버튼 (예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '현재는 UI만 존재. 추후 선택된 클립을 분할하는 기능 연결 예정.',
            py_func: null,
            js_action: 'timelineToolCut',
            events: ['click'],
            affects: [],
            examples: [
                'data-action="js:timelineToolCut"'
            ]
        },
        'timeline-tool-delete-btn': {
            module: 'timeline.toolbar',
            desc: '타임라인 클립 삭제(Delete) 도구 버튼 (예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '현재는 UI만 존재. 추후 선택된 클립을 삭제하는 기능 연결 예정.',
            py_func: null,
            js_action: 'timelineToolDelete',
            events: ['click'],
            affects: [],
            examples: [
                'data-action="js:timelineToolDelete"'
            ]
        },
        'timeline-tool-magnet-btn': {
            module: 'timeline.toolbar',
            desc: '타임라인 스냅(마그넷) 토글 버튼',
            io: {
                input: ['click'],
                output: ['vm.isMagnet 토글']
            },
            logic: '클립/플레이헤드 이동/리사이즈 시 다른 클립 경계나 플레이헤드에 스냅 여부를 제어.',
            py_func: null,
            js_action: 'toggleTimelineMagnet',
            events: ['click'],
            affects: ['timeline-clip-{id}', 'timeline-playhead-handle'],
            examples: [
                'data-action="js:toggleTimelineMagnet"'
            ]
        },
        'timeline-tool-ripple-btn': {
            module: 'timeline.toolbar',
            desc: '타임라인 오토 리플(Auto Ripple) 토글 버튼',
            io: {
                input: ['click'],
                output: ['vm.isAutoRipple 토글']
            },
            logic: '클립 편집 시 이후 클립들을 자동으로 당기거나 밀지 여부를 제어 (로직은 추후 구현 가능).',
            py_func: null,
            js_action: 'toggleTimelineRipple',
            events: ['click'],
            affects: ['timeline-clip-{id}'],
            examples: [
                'data-action="js:toggleTimelineRipple"'
            ]
        },
        'timeline-tool-normalize-btn': {
            module: 'timeline.toolbar',
            desc: 'Normalize 버튼 (오디오 정규화 기능, 예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '클릭 시 선택된 오디오 클립 볼륨을 정규화하는 기능을 연결할 예정.',
            py_func: null,
            js_action: 'timelineNormalizeAudio',
            events: ['click'],
            affects: ['timeline-clip-{id}'],
            examples: [
                'data-action="js:timelineNormalizeAudio"'
            ]
        },
        'timeline-tool-volume-icon': {
            module: 'timeline.toolbar',
            desc: '타임라인 전체 볼륨/볼륨 컨트롤 아이콘 (예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '전체 타임라인 오디오 레벨을 조정하는 UI로 확장 가능.',
            py_func: null,
            js_action: 'timelineVolumeControl',
            events: ['click'],
            affects: [],
            examples: [
                'data-action="js:timelineVolumeControl"'
            ]
        },
        'timeline-scroll-container': {
            module: 'timeline.scroll',
            desc: '트랙/클립 및 시간 룰러를 포함하는 스크롤 영역',
            io: {
                input: ['dragover', 'drop', 'wheel'],
                output: ['스크롤 위치 변경', '클립 추가(addClipFromDrop)']
            },
            logic: '에셋을 드래그&드롭하여 새 클립을 생성하고, 수평 스크롤을 담당.',
            py_func: null,
            js_action: 'timelineDropAsset',
            events: ['dragover', 'drop'],
            affects: ['timeline-clip-{id}', 'timeline-track-row-{id}'],
            examples: [
                'data-action="js:timelineDropAsset"'
            ]
        },
        'timeline-track-column': {
            module: 'timeline.track',
            desc: '타임라인 좌측 트랙 리스트 컬럼',
            io: { input: [], output: [] },
            logic: '각 트랙 이름과 색상을 표시하고, 드래그로 순서 변경 가능.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['timeline-track-row-{id}'],
            examples: []
        },
        'timeline-track-header-row': {
            module: 'timeline.track',
            desc: 'TRACKS 헤더 행',
            io: { input: [], output: [] },
            logic: '트랙 컬럼 상단 타이틀을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-track-row-{id}': {
            module: 'timeline.track',
            desc: '각 타임라인 트랙 행 (드래그로 순서 변경)',
            io: {
                input: ['dragstart', 'dragenter', 'dragend'],
                output: ['vm.moveTrack(fromIndex, toIndex) 호출']
            },
            logic: '드래그 앤 드롭으로 트랙 순서를 재배치.',
            py_func: null,
            js_action: 'timelineTrackReorder',
            events: ['dragstart', 'dragenter', 'dragend'],
            affects: ['timeline-lane-row-{id}'],
            examples: [
                'data-action="js:timelineTrackReorder"'
            ]
        },
        'timeline-track-name-{id}': {
            module: 'timeline.track',
            desc: '트랙 이름 텍스트 (contenteditable)',
            io: {
                input: ['text edit'],
                output: ['track.name 변경 (직접 DOM 편집)']
            },
            logic: '사용자가 트랙 이름을 직접 수정할 수 있도록 contenteditable로 노출.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-lane-container': {
            module: 'timeline.lane',
            desc: '우측 트랙 레인 및 클립/플레이헤드 영역',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['vm.currentTime 변경 (플레이헤드 이동)']
            },
            logic: '상단 룰러와 하단 클립 레인이 포함된 실제 타임라인 영역. 클릭/드래그로 플레이헤드를 이동.',
            py_func: null,
            js_action: 'timelineDragPlayhead',
            events: ['mousedown'],
            affects: ['timeline-playhead-line', 'timeline-playhead-handle'],
            examples: [
                'data-action="js:timelineDragPlayhead"'
            ]
        },
        'timeline-time-ruler-row': {
            module: 'timeline.ruler',
            desc: '타임라인 상단 시간 눈금 룰러',
            io: { input: [], output: [] },
            logic: '줌 레벨에 따라 일정 간격(5초 단위)의 시간 눈금을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-lane-row-{id}': {
            module: 'timeline.lane',
            desc: '각 트랙에 대응하는 클립 레인 행',
            io: { input: [], output: [] },
            logic: '해당 트랙에 속한 클립들을 수평으로 배치하는 영역.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['timeline-clip-{id}'],
            examples: []
        },
        'timeline-clip-{id}': {
            module: 'timeline.clip',
            desc: '각 트랙에 배치된 개별 클립 박스 (드래그/리사이즈 가능)',
            io: {
                input: ['click', 'drag', 'resize'],
                output: ['vm.setSelectedClip', 'vm.moveClip', 'vm.updateClip']
            },
            logic: '클립의 시작 시간/길이를 시각적으로 표현하고, 드래그/리사이즈를 통해 값을 변경.',
            py_func: null,
            js_action: 'selectTimelineClip',
            events: ['click', 'drag', 'resize'],
            affects: ['timeline-main-panel'],
            examples: [
                'data-action="js:selectTimelineClip"'
            ]
        },
        'timeline-playhead-line': {
            module: 'timeline.playhead',
            desc: '현재 재생 위치를 나타내는 수직 플레이헤드 라인',
            io: { input: [], output: [] },
            logic: 'vm.currentTime을 기준으로 x좌표를 계산하여 라인을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-playhead-handle': {
            module: 'timeline.playhead',
            desc: '플레이헤드 이동을 위한 삼각형 핸들',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['vm.currentTime 변경']
            },
            logic: '룰러/핸들을 드래그하여 재생 위치를 변경. 스냅 옵션(isMagnet)에 따라 클립 경계에 스냅.',
            py_func: null,
            js_action: 'timelineDragPlayhead',
            events: ['mousedown'],
            affects: ['timeline-playhead-line'],
            examples: [
                'data-action="js:timelineDragPlayhead"'
            ]
        },

        /* -----------------------------------------------------
         * Right Panel - Container & Resizer
         * --------------------------------------------------- */
        'main-right-panel': {
            module: 'panel.right',
            desc: '우측 패널(레이어/프로퍼티/이펙트) 컨테이너',
            io: { input: [], output: [] },
            logic: 'LayerPanel, PropertiesPanel, Effects 영역을 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['main-right-vue-root'],
            examples: []
        },
        'main-right-resizer-v': {
            module: 'panel.right.resizer',
            desc: '우측 패널 너비 조절 리사이저',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['state.rightPanelWidth 변경']
            },
            logic: '드래그하여 우측 패널의 너비를 조절.',
            py_func: null,
            js_action: 'resizePanelRight',
            events: ['mousedown'],
            affects: ['main-right-panel'],
            examples: [
                'data-action="js:resizePanelRight"'
            ]
        },
        'main-right-vue-root': {
            module: 'panel.right',
            desc: '우측 패널 Vue 루트(LayerPanel, PropertiesPanel 등)',
            io: { input: [], output: [] },
            logic: 'LayerPanel, PropertiesPanel 컴포넌트를 렌더링하는 컨테이너.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },

        /* -----------------------------------------------------
         * Right Panel - LayerPanel
         * --------------------------------------------------- */
        'panel-right-layer-root': {
            module: 'panel.right.layer',
            desc: '우측 패널 - 레이어 관리 전체 영역',
            io: { input: [], output: [] },
            logic: '레이어 컬럼 매트릭스, 컬럼 추가, 템플릿 저장 및 색상 선택 컨텍스트 메뉴 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'panel-right-layer-header',
                'panel-right-layer-matrix-container',
                'panel-right-layer-save-template-btn'
            ],
            examples: []
        },
        'panel-right-layer-header': {
            module: 'panel.right.layer',
            desc: '우측 레이어 패널 헤더 (레이어 관리 / 접기 토글)',
            io: {
                input: ['click'],
                output: ['isCollapsed 토글']
            },
            logic: '클릭 시 레이어 매트릭스 영역을 접거나 펼침.',
            py_func: null,
            js_action: 'toggleLayerPanelCollapse',
            events: ['click'],
            affects: ['panel-right-layer-body'],
            examples: [
                'data-action="js:toggleLayerPanelCollapse"'
            ]
        },
        'panel-right-layer-body': {
            module: 'panel.right.layer',
            desc: '레이어 패널 본문 컨테이너',
            io: { input: [], output: [] },
            logic: '매트릭스, 컬럼 추가 버튼, 템플릿 저장 버튼을 포함하는 본문 래퍼.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-mainname-badge': {
            module: 'panel.right.layer',
            desc: '현재 저장된 레이어 템플릿 메인 이름 배지',
            io: { input: [], output: [] },
            logic: 'vm.layerMainName 값이 존재할 때만 표시되며, 현재 레이아웃 이름을 나타냄.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-matrix-label': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스 설명 라벨',
            io: { input: [], output: [] },
            logic: '"매트릭스 (우클릭: 색상)" 고정 텍스트.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-addcol-btn': {
            module: 'panel.right.layer',
            desc: '새 레이어 컬럼 추가 버튼',
            io: {
                input: ['click'],
                output: ['vm.layerCols.push(...)']
            },
            logic: '레이어 컬럼 목록에 새 컬럼을 추가.',
            py_func: null,
            js_action: 'layerAddColumn',
            events: ['click'],
            affects: ['panel-right-layer-matrix-container'],
            examples: [
                'data-action="js:layerAddColumn"'
            ]
        },
        'panel-right-layer-matrix-container': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스(컬럼 헤더 + EFF/TXT/BG 셀) 스크롤 컨테이너',
            io: { input: [], output: [] },
            logic: '컬럼 헤더 및 각 행(EFF/TXT/BG)을 가로 스크롤 가능하게 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'panel-right-layer-col-{id}',
                'panel-right-layer-row-{id}',
                'panel-right-layer-cell-{id}'
            ],
            examples: []
        },
        'panel-right-layer-col-{id}': {
            module: 'panel.right.layer',
            desc: '개별 레이어 컬럼 헤더 셀',
            io: {
                input: ['contextmenu', 'input(내부 input)'],
                output: ['컬럼 이름 변경', '컬럼 색상 변경']
            },
            logic: '우클릭으로 색상 선택 메뉴를 열고, input으로 컬럼 이름을 수정.',
            py_func: null,
            js_action: null,
            events: ['contextmenu'],
            affects: [
                'panel-right-layer-col-name-{id}',
                'panel-right-layer-color-menu'
            ],
            examples: []
        },
        'panel-right-layer-col-name-{id}': {
            module: 'panel.right.layer',
            desc: '레이어 컬럼 이름 입력 필드',
            io: {
                input: ['input'],
                output: ['vm.layerCols[].name 변경']
            },
            logic: '컬럼의 표시 이름을 변경.',
            py_func: null,
            js_action: null,
            events: ['input'],
            affects: [],
            examples: []
        },
        'panel-right-layer-row-{id}': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스 행(EFF/TXT/BG)',
            io: { input: [], output: [] },
            logic: '각 행 타입에 해당하는 셀들을 수평으로 배치.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['panel-right-layer-cell-{id}'],
            examples: []
        },
        'panel-right-layer-rowlabel-{id}': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스 행 레이블(EFF/TXT/BG)',
            io: { input: [], output: [] },
            logic: '행 타입 이름(Effect/Text/BG)을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-cell-{id}': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스의 개별 셀 (컬럼 x 행 타입)',
            io: {
                input: ['click'],
                output: ['vm.addLayerBox(colIdx, type, color) 호출']
            },
            logic: '클릭 시 해당 컬럼/타입에 대응하는 캔버스 박스를 추가.',
            py_func: null,
            js_action: 'layerAddBox',
            events: ['click'],
            affects: ['preview-canvas-scaler'],
            examples: [
                'data-action="js:layerAddBox"'
            ]
        },
        'panel-right-layer-save-template-btn': {
            module: 'panel.right.layer',
            desc: '레이어 템플릿 저장 버튼',
            io: {
                input: ['click'],
                output: ['Swal.prompt → vm.saveLayerTemplate(name) 호출']
            },
            logic: 'SweetAlert2 팝업으로 템플릿 이름을 받아 vm.saveLayerTemplate(name)을 호출.',
            py_func: null,
            js_action: 'layerSaveTemplate',
            events: ['click'],
            affects: ['panel-right-layer-mainname-badge'],
            examples: [
                'data-action="js:layerSaveTemplate"'
            ]
        },
        'panel-right-layer-color-menu': {
            module: 'panel.right.layer',
            desc: '레이어 컬럼 색상 선택 컨텍스트 메뉴',
            io: {
                input: ['click(색상 스와치)'],
                output: ['해당 컬럼 color 변경']
            },
            logic: '우클릭한 컬럼에 대해 COLORS 팔레트 중 하나를 선택.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['panel-right-layer-col-{id}'],
            examples: []
        },
        'panel-right-layer-color-swatch-{id}': {
            module: 'panel.right.layer',
            desc: '팔레트 내 개별 색상 스와치',
            io: {
                input: ['click'],
                output: ['선택한 컬럼의 색상 변경']
            },
            logic: 'contextMenu.colId에 해당하는 컬럼의 color 필드를 업데이트.',
            py_func: null,
            js_action: null,
            events: ['click'],
            affects: ['panel-right-layer-col-{id}'],
            examples: []
        },
        'panel-right-layer-template-manage-btn': {
            module: 'panel.right.layer',
            desc: '레이어 템플릿 관리 모달 열기 버튼',
            io: {
                input: ['click'],
                output: ['vm.openLayerTemplateModal() 호출']
            },
            logic: '클릭 시 레이어 템플릿 관리 모달을 오픈.',
            py_func: null,
            js_action: 'openLayerTemplateModal',
            events: ['click'],
            affects: ['layer-template-modal-overlay'],
            examples: [
                'data-action="js:openLayerTemplateModal"'
            ]
        },
        'panel-right-layer-reset-btn': {
            module: 'panel.right.layer',
            desc: '캔버스 레이어 초기화 버튼',
            io: {
                input: ['click'],
                output: ['vm.canvasBoxes = []']
            },
            logic: '클릭 시 캔버스의 모든 레이어를 삭제.',
            py_func: null,
            js_action: 'layerResetAll',
            events: ['click'],
            affects: ['preview-canvas-scaler'],
            examples: [
                'data-action="js:
