/**
 * WAI Studio - Element Specification Registry
 *
 * 각 DOM id에 대한 IO/로직/브리지 정보를 중앙에서 관리합니다.
 * - key: 고정 id 또는 패턴(id에 {id} 포함 가능)
 * - value: spec object
 *
 * 필드 가이드:
 * - module   : UI 모듈/영역 이름 (예: "header-nav", "panel-left")
 * - desc     : 간단한 설명 (사용자/개발자 공용)
 * - io       : { input, output } 형태의 입출력 요약
 * - logic    : 이 요소가 수행하는 핵심 로직 설명
 * - py_func  : 호출되는 Python 함수명 (없으면 null)
 * - py_params: Python 호출 시 전달되는 기본 파라미터(객체)
 * - js_action: 호출되는 JS 액션명 (store/methods 등에서 매핑)
 * - events   : 트리거 이벤트 리스트 (기본 "click")
 * - affects  : 이 요소가 주로 영향을 미치는 주요 타겟 id 리스트
 * - examples : 실제 DOM id 예시 (패턴일 경우 특히 유용)
 * - deprecated: 더 이상 사용되지 않을 경우 true
 */
(function (global) {
    'use strict';

    /** @type {Record<string, any>} */
    const SPECS = {
        // =========================================
        // 앱 루트 / 레이아웃
        // =========================================
        'app-root': {
            module: 'app',
            desc: '애플리케이션 최상위 컨테이너 (body)',
            io: {
                input: '없음 (직접 인터랙션 없음)',
                output: '하위 모든 패널/컴포넌트 렌더링'
            },
            logic: 'WAI Studio 전체 레이아웃과 Vue 루트 마운트의 기준이 되는 최상위 DOM.',
            py_func: null,
            py_params: {},
            js_action: null,
            events: [],
            affects: ['vue-app', 'main-layout'],
            examples: ['app-root'],
            deprecated: false
        },

        'vue-app': {
            module: 'app',
            desc: 'Vue 3 애플리케이션이 마운트되는 루트 엘리먼트',
            io: {
                input: 'Vue 인스턴스 마운트',
                output: '전체 UI 렌더링'
            },
            logic: 'Vue 3 createApp()이 마운트되는 실제 DOM 노드.',
            py_func: null,
            py_params: {},
            js_action: null,
            events: [],
            affects: ['app-header', 'main-layout'],
            examples: ['vue-app'],
            deprecated: false
        },

        'main-layout': {
            module: 'layout-main',
            desc: '좌/중앙/우 패널을 포함하는 메인 레이아웃 컨테이너',
            io: {
                input: '패널 리사이즈, 뷰 전환',
                output: '에디터 3분할 레이아웃 유지'
            },
            logic: '좌측 자산 패널, 중앙 프리뷰+타임라인, 우측 속성 패널을 3분할로 배치.',
            py_func: null,
            py_params: {},
            js_action: null,
            events: [],
            affects: ['panel-left', 'panel-center', 'panel-right'],
            examples: ['main-layout'],
            deprecated: false
        },

        // =========================================
        // 헤더 / 내비게이션
        // =========================================
        'app-header': {
            module: 'header',
            desc: '상단 헤더 바 (로고, 네비게이션, 윈도우 컨트롤 포함)',
            io: {
                input: '내비게이션 버튼 클릭, 창 제어 버튼 클릭',
                output: '뷰 전환, 윈도우 상태 변경'
            },
            logic: '에디터 상단에 고정된 글로벌 컨트롤 영역.',
            py_func: null,
            py_params: {},
            js_action: null,
            events: [],
            affects: ['main-layout', 'panel-center'],
            examples: ['app-header'],
            deprecated: false
        },

        'app-logo': {
            module: 'header',
            desc: 'WAI Studio 로고',
            io: {
                input: '클릭 (향후 홈/대시보드 이동에 사용 가능)',
                output: '현재는 동작 없음'
            },
            logic: '브랜딩 및 홈 이동 트리거로 확장 가능.',
            py_func: null,
            py_params: {},
            js_action: null,
            events: [],
            affects: [],
            examples: ['app-logo'],
            deprecated: false
        },

        'nav-explore': {
            module: 'header-nav',
            desc: '상단 네비게이션 - 탐색 탭',
            io: {
                input: 'click',
                output: 'Python 탐색 화면 전환 요청'
            },
            logic: '프로젝트 탐색/관리 뷰로 전환하도록 Python 브리지에 nav_explore를 요청.',
            py_func: 'nav_explore',
            py_params: {},
            js_action: null,
            events: ['click'],
            affects: ['main-layout'],
            examples: ['nav-explore'],
            deprecated: false
        },

        'nav-create': {
            module: 'header-nav',
            desc: '상단 네비게이션 - 제작 탭 (새 프로젝트)',
            io: {
                input: 'click',
                output: '새 프로젝트 생성 모달 오픈'
            },
            logic: 'Vue 상태 isProjectModalOpen 값을 true로 설정해 프로젝트 생성 모달을 연다.',
            py_func: null,
            py_params: {},
            js_action: 'openProjectModal',
            events: ['click'],
            affects: ['project-modal'],
            examples: ['nav-create'],
            deprecated: false
        },

        'nav-settings': {
            module: 'header-nav',
            desc: '상단 네비게이션 - 설정 탭',
            io: {
                input: 'click',
                output: 'Python 설정 뷰 전환 요청'
            },
            logic: '설정 화면으로 전환하도록 Python 브리지에 nav_settings를 요청.',
            py_func: 'nav_settings',
            py_params: {},
            js_action: null,
            events: ['click'],
            affects: ['main-layout'],
            examples: ['nav-settings'],
            deprecated: false
        },

        'nav-research': {
            module: 'header-nav',
            desc: '상단 네비게이션 - 연구 탭',
            io: {
                input: 'click',
                output: 'Python 연구 뷰 전환 요청'
            },
            logic: '연구/실험 관련 화면으로 전환하도록 Python 브리지에 nav_research를 요청.',
            py_func: 'nav_research',
            py_params: {},
            js_action: null,
            events: ['click'],
            affects: ['main-layout'],
            examples: ['nav-research'],
            deprecated: false
        },

        'menu-asset-manage': {
            module: 'header-nav',
            desc: '자산 드롭다운 - 자산 관리 메뉴',
            io: {
                input: 'click',
                output: 'Python 자산 관리자 창 오픈 요청'
            },
            logic: '자산 관리자(별도 창 또는 패널)를 열도록 open_asset_manager Python 함수를 호출.',
            py_func: 'open_asset_manager',
            py_params: {},
            js_action: null,
            events: ['click'],
            affects: ['panel-left'],
            examples: ['menu-asset-manage'],
            deprecated: false
        },

        // =========================================
        // 개발자 / 인스펙터 모드 토글
        // =========================================
        'inspector-toggle': {
            module: 'devtools',
            desc: 'Inspect 모드 토글 버튼',
            io: {
                input: 'click',
                output: '인스펙터 오버레이 on/off'
            },
            logic: 'Vue 메서드 toggleDevMode("active")를 호출해 요소 인스펙션 모드를 토글.',
            py_func: null,
            py_params: {},
            js_action: 'toggleDevModeActive',
            events: ['click'],
            affects: ['dev-overlay'],
            examples: ['inspector-toggle'],
            deprecated: false
        },

        'dev-toggle': {
            module: 'devtools',
            desc: '전체 개발자 모드 토글 버튼',
            io: {
                input: 'click',
                output: 'Dev 모드 on/off'
            },
            logic: 'Vue 메서드 toggleDevMode("full")을 호출해 전체 개발자 모드를 토글.',
            py_func: null,
            py_params: {},
            js_action: 'toggleDevModeFull',
            events: ['click'],
            affects: ['dev-overlay'],
            examples: ['dev-toggle'],
            deprecated: false
        },

        // =========================================
        // 창 제어 (윈도우 버튼)
        // =========================================
        'win-min': {
            module: 'window-controls',
            desc: '윈도우 최소화 버튼',
            io: {
                input: 'click',
                output: '현재 앱 창 최소화'
            },
            logic: 'Python 브리지의 win_min() 함수를 호출해 Electron 창을 최소화.',
            py_func: 'win_min',
            py_params: {},
            js_action: null,
            events: ['click'],
            affects: [],
            examples: ['win-min'],
            deprecated: false
        },

        'win-max': {
            module: 'window-controls',
            desc: '윈도우 최대화/복원 버튼',
            io: {
                input: 'click',
                output: '현재 앱 창 최대화 또는 복원'
            },
            logic: 'Python 브리지의 win_max() 함수를 호출해 창을 최대화/복원 토글.',
            py_func: 'win_max',
            py_params: {},
            js_action: null,
            events: ['click'],
            affects: [],
            examples: ['win-max'],
            deprecated: false
        },

        'win-close': {
            module: 'window-controls',
            desc: '윈도우 닫기 버튼',
            io: {
                input: 'click',
                output: '애플리케이션 종료'
            },
            logic: 'Python 브리지의 win_close() 함수를 호출해 앱을 종료.',
            py_func: 'win_close',
            py_params: {},
            js_action: null,
            events: ['click'],
            affects: [],
            examples: ['win-close'],
            deprecated: false
        },

        // =========================================
        // 좌측 패널 (자산)
        // =========================================
        'panel-left': {
            module: 'panel-left',
            desc: '좌측 자산 패널 컨테이너',
            io: {
                input: '패널 리사이즈, 자산 선택',
                output: '자산 목록 표시 및 선택 상태 반영'
            },
            logic: '프로젝트에서 사용하는 미디어/에셋 목록을 보여주는 패널.',
            py_func: null,
            py_params: {},
            js_action: null,
            events: [],
            affects: ['react-asset-list'],
            examples: ['panel-left'],
            deprecated: false
        },

        'btn-add-asset': {
            module: 'panel-left',
            desc: '새 자산 가져오기 버튼',
            io: {
                input: 'click',
                output: 'Python 자산 가져오기 요청'
            },
            logic: 'Python 브리지의 import_asset()을 호출해 로컬/원격 자산을 프로젝트로 가져옴.',
            py_func: 'import_asset',
            py_params: {},
            js_action: null,
            events: ['click'],
            affects: ['react-asset-list'],
            examples: ['btn-add-asset'],
            deprecated: false
        },

        'resizer-left': {
            module: 'layout-main',
            desc: '좌측 패널 너비 조절 핸들',
            io: {
                input: 'drag (mousedown + move)',
                output: 'leftPanelWidth 상태 변경'
            },
            logic: 'Vue 메서드/핸들러를 통해 좌측 패널 너비를 실시간으로 조정.',
            py_func: null,
            py_params: {},
            js_action: 'resizePanelLeft',
            events: ['mousedown', 'mousemove', 'mouseup'],
            affects: ['panel-left', 'panel-center'],
            examples: ['resizer-left'],
            deprecated: false
        },

        // =========================================
        // 우측 패널 (속성)
        // =========================================
        'panel-right': {
            module: 'panel-right',
            desc: '우측 속성/레이어 패널 컨테이너',
            io: {
                input: '패널 리사이즈, 속성 편집',
                output: '선택된 객체 속성/레이어 정보 표시'
            },
            logic: '선택한 타임라인 클립 또는 캔버스 박스의 상세 속성을 편집하는 영역.',
            py_func: null,
            py_params: {},
            js_action: null,
            events: [],
            affects: ['vue-right-panel-root'],
            examples: ['panel-right'],
            deprecated: false
        },

        'resizer-right': {
            module: 'layout-main',
            desc: '우측 패널 너비 조절 핸들',
            io: {
                input: 'drag (mousedown + move)',
                output: 'rightPanelWidth 상태 변경'
            },
            logic: 'Vue 메서드/핸들러를 통해 우측 패널 너비를 실시간으로 조정.',
            py_func: null,
            py_params: {},
            js_action: 'resizePanelRight',
            events: ['mousedown', 'mousemove', 'mouseup'],
            affects: ['panel-right', 'panel-center'],
            examples: ['resizer-right'],
            deprecated: false
        },

        // =========================================
        // 중앙 패널 - 프리뷰 / 타임라인
        // =========================================
        'preview-container': {
            module: 'panel-center',
            desc: '프리뷰(캔버스) 영역 상단 컨테이너',
            io: {
                input: '패널 리사이즈',
                output: '프리뷰 영역 높이 변경'
            },
            logic: 'previewContainerHeight 상태에 따라 프리뷰 영역의 세로 비율을 조절.',
            py_func: null,
            py_params: {},
            js_action: null,
            events: [],
            affects: ['canvas-wrapper'],
            examples: ['preview-container'],
            deprecated: false
        },

        'btn-magnet': {
            module: 'panel-center',
            desc: '프리뷰 캔버스 SNAP 온/오프 토글',
            io: {
                input: 'click',
                output: 'isMagnet 상태 토글'
            },
            logic: 'Vue 데이터 isMagnet을 토글하여 캔버스 박스 정렬/스냅 동작을 켜고 끔.',
            py_func: null,
            py_params: {},
            js_action: 'toggleSnapMagnet',
            events: ['click'],
            affects: ['canvas-scaler'],
            examples: ['btn-magnet'],
            deprecated: false
        },

        'resizer-timeline': {
            module: 'layout-main',
            desc: '프리뷰와 타임라인 사이 세로 리사이저',
            io: {
                input: 'drag (mousedown + move)',
                output: 'timelineContainerHeight, previewContainerHeight 변경'
            },
            logic: '프리뷰 vs 타임라인의 세로 비율을 사용자가 드래그로 조정.',
            py_func: null,
            py_params: {},
            js_action: 'resizePanelCenter',
            events: ['mousedown', 'mousemove', 'mouseup'],
            affects: ['preview-container', 'timeline-panel'],
            examples: ['resizer-timeline'],
            deprecated: false
        },

        // =========================================
        // 동적 요소 패턴 예시
        // (아직 실제 DOM id는 컴포넌트 측에서 생성됨)
        // =========================================
        'timeline-clip-{id}': {
            module: 'timeline',
            desc: '타임라인 상의 개별 클립 (동적 ID 패턴)',
            io: {
                input: 'click, drag, contextmenu',
                output: '클립 선택/이동/편집'
            },
            logic: '타임라인에 배치된 미디어/레이어 클립. id 자리에 클립 고유 ID가 들어간다.',
            py_func: null,
            py_params: {},
            js_action: 'selectTimelineClip',
            events: ['click', 'dragstart', 'dragend', 'contextmenu'],
            affects: ['properties-panel', 'layer-panel'],
            examples: ['timeline-clip-1', 'timeline-clip-42'],
            deprecated: false
        },

        'canvas-box-{id}': {
            module: 'canvas',
            desc: '프리뷰 캔버스 상의 개별 박스 (동적 ID 패턴)',
            io: {
                input: 'click, drag, resize',
                output: '박스 위치/크기/선택 상태 변경'
            },
            logic: '캔버스 상에 표시되는 텍스트/이미지 등 시각 요소를 나타내는 박스.',
            py_func: null,
            py_params: {},
            js_action: 'selectCanvasBox',
            events: ['click', 'dragstart', 'dragend'],
            affects: ['properties-panel', 'layer-panel'],
            examples: ['canvas-box-title', 'canvas-box-hero'],
            deprecated: false
        }
    };

    // =============================================
    // 내부 유틸: {id} 패턴 지원을 위한 정규식 빌더
    // =============================================

    /**
     * "timeline-clip-{id}" 같은 패턴을 정규식으로 변환합니다.
     * @param {string} pattern
     * @returns {RegExp}
     */
    function buildPatternRegex(pattern) {
        // 정규식 메타문자 이스케이프
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // {id} 자리만 캡처 그룹으로 교체
        const source = '^' + escaped.replace('\\{id\\}', '(.+?)') + '$';
        return new RegExp(source);
    }

    const PATTERN_ENTRIES = Object.entries(SPECS)
        .filter(([key]) => key.includes('{id}'))
        .map(([pattern, spec]) => ({
            pattern,
            regex: buildPatternRegex(pattern),
            spec
        }));

    /**
     * 주어진 DOM id에 대한 spec을 조회합니다.
     * - 정확히 일치하는 id가 우선.
     * - 없으면 {id} 패턴들을 순회하며 첫 매칭을 반환.
     *
     * @param {string} id
     * @returns {any|null}
     */
    function getElementSpec(id) {
        if (!id) return null;

        if (Object.prototype.hasOwnProperty.call(SPECS, id)) {
            return SPECS[id];
        }

        for (const entry of PATTERN_ENTRIES) {
            if (entry.regex.test(id)) {
                // 패턴에서 파생된 실제 id를 spec에 주입해서 반환 (얕은 복사)
                return Object.assign({}, entry.spec, { resolvedId: id, pattern: entry.pattern });
            }
        }

        return null;
    }

    // 전역 공개
    global.WAI_ELEMENT_SPECS = SPECS;
    global.WAI_getElementSpec = getElementSpec;
})(typeof window !== 'undefined' ? window : this);
