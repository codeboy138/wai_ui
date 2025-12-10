/**
 * WAI UI Element Specs
 * - Dev 모드에서 ID 기준으로 py/js/data-action 정보를 보여주기 위한 중앙 정의 파일
 * - vm.buildDevInfo() → window.WAI_getElementSpec(id) 를 통해 접근
 */

(function (global) {
    /**
     * 공통 헬퍼: data-action 문자열을 py/js로 나누고, module을 id에서 추론할 때 참고용
     * 실제 Dev표시는 app-root.js(buildDevInfo) 기준이므로, 여기서는 메타 정보만 저장
     */

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
         * Right Panel
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
         * Dev / Inspector Overlay
         * --------------------------------------------------- */
        'dev-overlay-root': {
            module: 'dev.overlay',
            desc: 'Inspector/Dev 공용 오버레이 루트',
            io: {
                input: ['mousemove (문서 전체)', 'click (툴팁)'],
                output: ['inspector state, highlightStyle, tooltipStyle 업데이트']
            },
            logic: 'dev-mode-active / dev-mode-full 상태일 때 활성화되는 하이라이트/툴팁 레이어.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['dev-overlay-highlight', 'dev-overlay-tooltip'],
            examples: []
        },
        'dev-overlay-highlight': {
            module: 'dev.overlay',
            desc: '현재 hover 된 요소의 영역을 표시하는 하이라이트 박스',
            io: { input: [], output: [] },
            logic: 'vm.highlightStyle에 따라 위치/크기/투명도(10%)를 반영.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'dev-overlay-tooltip': {
            module: 'dev.overlay',
            desc: 'Inspector/Dev 정보 툴팁',
            io: {
                input: ['click'],
                output: ['clipboard에 inspector.id 복사']
            },
            logic: 'Inspect 모드에서는 ID/Tag/Size + 힌트만, Dev 모드에서는 element-specs.js/data-action 정보까지 표시.',
            py_func: null,
            js_action: 'copyInspectorId',
            events: ['click'],
            affects: [],
            examples: []
        }
    };

    /**
     * ID 기반 스펙 조회 함수
     * - 정확히 일치하는 ID가 있으면 그대로 반환
     * - 추후 패턴(id에 {id} 등) 매칭이 필요할 경우 이 함수 내부를 확장
     */
    function WAI_getElementSpec(id) {
        if (!id) return null;
        if (Object.prototype.hasOwnProperty.call(SPECS, id)) {
            return SPECS[id];
        }
        // TODO: 패턴 매칭 (예: timeline-clip-{id}, canvas-box-{id}) 필요 시 여기서 처리
        return null;
    }

    global.WAI_ELEMENT_SPECS = SPECS;
    global.WAI_getElementSpec = WAI_getElementSpec;
})(window);
