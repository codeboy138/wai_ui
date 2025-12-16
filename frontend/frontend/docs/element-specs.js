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
            examples: ['data-action="py:nav_explore"']
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
            examples: ['data-action="js:openProjectModal"']
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
            logic: 'hover 시 자산 관련 서브 메뉴를 표시.',
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
            examples: ['data-action="py:open_asset_manager"']
        },
        'header-nav-settings-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 설정 탭 버튼',
            io: {
                input: ['click'],
                output: ['backend.nav_settings']
            },
            logic: '클릭 시 Python backend.nav_settings 호출.',
            py_func: 'nav_settings',
            js_action: null,
            events: ['click'],
            affects: ['main-right-panel'],
            examples: ['data-action="py:nav_settings"']
        },
        'header-nav-research-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 연구 탭 버튼',
            io: {
                input: ['click'],
                output: ['backend.nav_research']
            },
            logic: '클릭 시 Python backend.nav_research 호출.',
            py_func: 'nav_research',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: ['data-action="py:nav_research"']
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
            logic: '클릭 시 Inspect 모드를 토글.',
            py_func: null,
            js_action: 'toggleDevModeActive',
            events: ['click'],
            affects: ['dev-overlay-root'],
            examples: ['data-action="js:toggleDevModeActive"']
        },
        'header-dev-mode-btn': {
            module: 'header.dev',
            desc: 'Dev(개발자) 모드 토글 버튼',
            io: {
                input: ['click'],
                output: ['body.classList += dev-mode-full']
            },
            logic: '클릭 시 Dev 모드를 토글.',
            py_func: null,
            js_action: 'toggleDevModeFull',
            events: ['click'],
            affects: ['dev-overlay-root'],
            examples: ['data-action="js:toggleDevModeFull"']
        },

        /* -----------------------------------------------------
         * Header - Window Controls
         * --------------------------------------------------- */
        'header-window-controls-container': {
            module: 'header.window',
            desc: '윈도우 컨트롤 버튼 컨테이너',
            io: { input: [], output: [] },
            logic: '각 버튼은 Python backend를 통해 실제 OS 윈도우 제어.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['header-window-min-btn', 'header-window-max-btn', 'header-window-close-btn'],
            examples: []
        },
        'header-window-min-btn': {
            module: 'header.window',
            desc: '윈도우 최소화 버튼',
            io: { input: ['click'], output: ['backend.win_min'] },
            logic: '클릭 시 Python backend.win_min 호출.',
            py_func: 'win_min',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: ['data-action="py:win_min"']
        },
        'header-window-max-btn': {
            module: 'header.window',
            desc: '윈도우 최대화/복원 토글 버튼',
            io: { input: ['click'], output: ['backend.win_max'] },
            logic: '클릭 시 Python backend.win_max 호출.',
            py_func: 'win_max',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: ['data-action="py:win_max"']
        },
        'header-window-close-btn': {
            module: 'header.window',
            desc: '윈도우 닫기 버튼',
            io: { input: ['click'], output: ['backend.win_close'] },
            logic: '클릭 시 Python backend.win_close 호출.',
            py_func: 'win_close',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: ['data-action="py:win_close"']
        },

        /* -----------------------------------------------------
         * Left Panel
         * --------------------------------------------------- */
        'main-left-panel': {
            module: 'panel.left',
            desc: '좌측 패널 컨테이너',
            io: { input: [], output: [] },
            logic: '자산 목록 및 자산 추가 버튼을 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['main-left-assets-list'],
            examples: []
        },
        'main-left-resizer-v': {
            module: 'panel.left.resizer',
            desc: '좌측 패널 너비 조절 리사이저',
            io: { input: ['mousedown'], output: ['state.leftPanelWidth 변경'] },
            logic: '드래그하여 좌측 패널의 너비를 조절.',
            py_func: null,
            js_action: 'resizePanelLeft',
            events: ['mousedown'],
            affects: ['main-left-panel'],
            examples: ['data-action="js:resizePanelLeft"']
        },

        /* -----------------------------------------------------
         * Center Panel / Preview
         * --------------------------------------------------- */
        'main-center-panel': {
            module: 'panel.center',
            desc: '중앙 패널 컨테이너',
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
            desc: '프리뷰 전체 컨테이너',
            io: { input: [], output: [] },
            logic: '상단 툴바와 하단 실제 캔버스를 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-toolbar-panel', 'preview-canvas-wrapper'],
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
            affects: [],
            examples: []
        },
        'preview-canvas-wrapper': {
            module: 'preview.canvas',
            desc: '프리뷰 캔버스 래퍼',
            io: { input: ['mousemove', 'mouseleave'], output: ['mouseCoord 업데이트'] },
            logic: 'updateCanvasMouseCoord()의 기준이 되는 영역.',
            py_func: null,
            js_action: 'updateCanvasMouseCoord',
            events: ['mousemove', 'mouseleave'],
            affects: [],
            examples: []
        },
        'preview-canvas-scaler': {
            module: 'preview.canvas',
            desc: '프리뷰 캔버스 스케일러',
            io: { input: [], output: ['state.canvasScale 변경'] },
            logic: 'wrapper 크기에 맞춰 Canvas를 scale하여 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },

        /* -----------------------------------------------------
         * Timeline Panel
         * --------------------------------------------------- */
        'timeline-main-panel': {
            module: 'timeline.panel',
            desc: '타임라인 전체 패널',
            io: { input: ['wheel'], output: ['zoom 변경 또는 수평 스크롤'] },
            logic: '휠/Shift+휠로 줌/스크롤 조작을 처리.',
            py_func: null,
            js_action: 'timelineWheelScroll',
            events: ['wheel'],
            affects: ['timeline-scroll-container'],
            examples: ['data-action="js:timelineWheelScroll"']
        },
        'timeline-header-collapse-btn': {
            module: 'timeline.header',
            desc: '타임라인 접기/펼치기 토글 버튼',
            io: { input: ['click'], output: ['vm.isTimelineCollapsed 토글'] },
            logic: '타임라인 패널을 접거나 펼침.',
            py_func: null,
            js_action: 'toggleTimelineCollapse',
            events: ['click'],
            affects: ['timeline-main-panel', 'preview-main-container'],
            examples: ['data-action="js:toggleTimelineCollapse"']
        },
        'timeline-playhead-handle': {
            module: 'timeline.playhead',
            desc: '플레이헤드 이동 핸들',
            io: { input: ['mousedown'], output: ['vm.currentTime 변경'] },
            logic: '드래그하여 재생 위치를 변경.',
            py_func: null,
            js_action: 'timelineDragPlayhead',
            events: ['mousedown'],
            affects: ['timeline-playhead-line'],
            examples: ['data-action="js:timelineDragPlayhead"']
        },

        /* -----------------------------------------------------
         * Right Panel
         * --------------------------------------------------- */
        'main-right-panel': {
            module: 'panel.right',
            desc: '우측 패널 컨테이너',
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
            io: { input: ['mousedown'], output: ['state.rightPanelWidth 변경'] },
            logic: '드래그하여 우측 패널의 너비를 조절.',
            py_func: null,
            js_action: 'resizePanelRight',
            events: ['mousedown'],
            affects: ['main-right-panel'],
            examples: ['data-action="js:resizePanelRight"']
        },
        'main-center-timeline-resizer-h': {
            module: 'panel.center.timeline',
            desc: '프리뷰/타임라인 사이 리사이저',
            io: { input: ['mousedown'], output: ['previewContainerHeight 변경'] },
            logic: '드래그하여 프리뷰/타임라인 영역의 높이 비율을 조절.',
            py_func: null,
            js_action: 'resizePanelCenter',
            events: ['mousedown'],
            affects: ['preview-main-container'],
            examples: ['data-action="js:resizePanelCenter"']
        },

        /* -----------------------------------------------------
         * Layer Panel
         * --------------------------------------------------- */
        'panel-right-layer-root': {
            module: 'panel.right.layer',
            desc: '우측 패널 - 레이어 관리 전체 영역',
            io: { input: [], output: [] },
            logic: '레이어 컬럼 매트릭스, 컬럼 추가, 템플릿 저장 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-addcol-btn': {
            module: 'panel.right.layer',
            desc: '새 레이어 컬럼 추가 버튼',
            io: { input: ['click'], output: ['vm.layerCols.push(...)'] },
            logic: '레이어 컬럼 목록에 새 컬럼을 추가.',
            py_func: null,
            js_action: 'layerAddColumn',
            events: ['click'],
            affects: ['panel-right-layer-matrix-container'],
            examples: ['data-action="js:layerAddColumn"']
        },
        'panel-right-layer-template-manage-btn': {
            module: 'panel.right.layer',
            desc: '레이어 템플릿 관리 모달 열기 버튼',
            io: { input: ['click'], output: ['vm.openLayerTemplateModal() 호출'] },
            logic: '클릭 시 레이어 템플릿 관리 모달을 오픈.',
            py_func: null,
            js_action: 'openLayerTemplateModal',
            events: ['click'],
            affects: ['layer-template-modal-overlay'],
            examples: ['data-action="js:openLayerTemplateModal"']
        },
        'panel-right-layer-reset-btn': {
            module: 'panel.right.layer',
            desc: '캔버스 레이어 초기화 버튼',
            io: { input: ['click'], output: ['vm.canvasBoxes = []'] },
            logic: '클릭 시 캔버스의 모든 레이어를 삭제.',
            py_func: null,
            js_action: 'layerResetAll',
            events: ['click'],
            affects: ['preview-canvas-scaler'],
            examples: ['data-action="js:layerResetAll"']
        }
    };

    /**
     * ID로 스펙을 조회하는 함수
     * @param {string} id - 요소 ID
     * @returns {object|null} 스펙 객체 또는 null
     */
    function getElementSpec(id) {
        if (!id) return null;
        
        // 정확한 매칭 먼저 시도
        if (SPECS[id]) {
            return SPECS[id];
        }
        
        // 패턴 매칭 시도 (예: timeline-clip-c1 → timeline-clip-{id})
        for (const key of Object.keys(SPECS)) {
            if (key.includes('{id}')) {
                const pattern = key.replace('{id}', '(.+)');
                const regex = new RegExp('^' + pattern + '$');
                if (regex.test(id)) {
                    return SPECS[key];
                }
            }
        }
        
        return null;
    }

    // 전역 노출
    global.WAI_ELEMENT_SPECS = SPECS;
    global.WAI_getElementSpec = getElementSpec;

})(window);
