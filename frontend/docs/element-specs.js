/**
 * ==========================================
 * element-specs.js - 요소 기술 명세
 * 
 * 역할: DOM 요소의 IO/Logic 정의
 * 경로: frontend/docs/element-specs.js
 * ==========================================
 */

export default {
    // ===== HEADER =====
    "header-nav-explore-btn": {
        "io": "입력:클릭 → firePython('nav_explore') → Python:backend.nav_explore() → 출력:페이지 전환 (탐색 화면)",
        "logic": "@click → firePython('nav_explore') → window.backend.nav_explore() 호출",
        "py_func": "nav_explore",
        "py_params": null,
        "return": "None"
    },
    
    "header-nav-create-btn": {
        "io": "입력:클릭 → isProjectModalOpen=true → 출력:ProjectModal 컴포넌트 렌더링",
        "logic": "@click → vm.isProjectModalOpen = true → v-if 조건 만족 → 모달 표시",
        "js_state": "store.isProjectModalOpen"
    },
    
    "header-nav-assets-manage-btn": {
        "io": "입력:클릭 → firePython('open_asset_manager') → Python:backend.open_asset_manager() → 출력:자산 관리 창 오픈",
        "logic": "@click → firePython('open_asset_manager') → Python 자산 관리 다이얼로그 실행",
        "py_func": "open_asset_manager",
        "py_params": null
    },
    
    "header-nav-settings-btn": {
        "io": "입력:클릭 → firePython('nav_settings') → Python:backend.nav_settings() → 출력:설정 페이지 전환",
        "logic": "@click → firePython('nav_settings') → 설정 화면 렌더링",
        "py_func": "nav_settings"
    },
    
    "header-nav-research-btn": {
        "io": "입력:클릭 → firePython('nav_research') → Python:backend.nav_research() → 출력:연구 페이지 전환",
        "logic": "@click → firePython('nav_research') → 연구 화면 렌더링",
        "py_func": "nav_research"
    },
    
    "header-devmode-inspect-btn": {
        "io": "입력:클릭 → toggleDevMode('inspect') → isDevModeActive 토글 → 출력:Inspector 오버레이 표시/숨김",
        "logic": "@click → toggleDevMode('inspect') → body.classList.toggle('dev-mode-active') → 마우스 호버 시 요소 정보 표시",
        "js_state": "store.isDevModeActive"
    },
    
    "header-devmode-datadev-btn": {
        "io": "입력:클릭 → toggleDevMode('datadev') → isDevModeFull 토글 → 출력:DATA-DEV 상세 정보 표시/숨김",
        "logic": "@click → toggleDevMode('datadev') → body.classList.toggle('dev-mode-full') → element-specs.js 조회하여 IO/Logic 표시",
        "js_state": "store.isDevModeFull"
    },
    
    "header-window-minimize-btn": {
        "io": "입력:클릭 → firePython('win_min') → Python:backend.win_minimize() → 출력:창 최소화",
        "logic": "@click → firePython('win_min') → OS 레벨 창 최소화",
        "py_func": "win_min"
    },
    
    "header-window-maximize-btn": {
        "io": "입력:클릭 → firePython('win_max') → Python:backend.win_maximize() → 출력:창 최대화/복원",
        "logic": "@click → firePython('win_max') → OS 레벨 창 크기 토글",
        "py_func": "win_max"
    },
    
    "header-window-close-btn": {
        "io": "입력:클릭 → firePython('win_close') → Python:backend.win_close() → 출력:애플리케이션 종료",
        "logic": "@click → firePython('win_close') → 앱 종료 프로세스 실행",
        "py_func": "win_close"
    },
    
    // ===== PREVIEW TOOLBAR =====
    "preview-toolbar-ratio-dropdown": {
        "io": "입력:항목 선택 → @select 이벤트 → aspectRatio 상태 변경 → 출력:캔버스 비율 변경",
        "logic": "DropdownMenu 컴포넌트 → $emit('select', ratio) → vm.aspectRatio = ratio → store.aspectRatio 업데이트",
        "js_state": "store.aspectRatio"
    },
    
    "preview-toolbar-resolution-dropdown": {
        "io": "입력:항목 선택 → @select 이벤트 → canvasSize 상태 변경 → 출력:캔버스 해상도 변경",
        "logic": "DropdownMenu 컴포넌트 → $emit('select', res) → vm.resolution = res → store.canvasSize 업데이트 (예: 4K → {w:3840, h:2160})",
        "js_state": "store.canvasSize"
    },
    
    "preview-toolbar-snap-toggle": {
        "io": "입력:클릭 → isMagnet 토글 → 출력:스냅 기능 활성화/비활성화",
        "logic": "@click → vm.isMagnet = !vm.isMagnet → Interact.js snap modifier 적용/해제",
        "js_state": "store.isMagnet"
    },
    
    // ===== TIMELINE =====
    "timeline-collapse-btn": {
        "io": "입력:클릭 → toggleCollapse() → isTimelineCollapsed 토글 → 출력:타임라인 패널 접기/펼치기",
        "logic": "@click → toggleCollapse() → adjustLayout() → preview 높이 조정",
        "js_methods": ["toggleCollapse", "adjustLayout"],
        "js_state": "store.isTimelineCollapsed"
    },
    
    "timeline-zoom-slider": {
        "io": "입력:슬라이더 드래그 → @input 이벤트 → zoom 값 변경 (10~100) → 출력:타임라인 줌 레벨 조정",
        "logic": "@input → vm.zoom = Number($event.target.value) → 클립 width 재계산 (clip.duration * zoom)",
        "js_state": "store.zoom"
    },
    
    "timeline-tool-magnet-btn": {
        "io": "입력:클릭 → isMagnet 토글 → 출력:클립 스냅 기능 활성화/비활성화",
        "logic": "@click → vm.isMagnet = !vm.isMagnet → Interact.js snap modifier 재설정 → 클립 드래그 시 다른 클립/플레이헤드에 자동 정렬",
        "js_state": "store.isMagnet",
        "affects": "Interact.js snap targets"
    },
    
    "timeline-tool-ripple-btn": {
        "io": "입력:클릭 → isAutoRipple 토글 → 출력:리플 편집 모드 활성화/비활성화",
        "logic": "@click → vm.isAutoRipple = !vm.isAutoRipple → 클립 이동 시 이후 클립들 자동 시프트",
        "js_state": "store.isAutoRipple"
    },
    
    "timeline-clip-{id}": {
        "io": "입력:드래그/리사이즈 → Interact.js 이벤트 → updateClip()/moveClip() 호출 → 출력:clips[].start/duration 업데이트",
        "logic": "Interact.draggable → move → data-x 누적 → end → moveClip(id, timeChange) | Interact.resizable → move → width 변경 → end → updateClip(id, startChange, durationChange)",
        "js_methods": ["updateClip", "moveClip"],
        "js_state": "store.clips"
    },
    
    "timeline-playhead-handle": {
        "io": "입력:드래그 → handlePlayheadDrag() → currentTime 업데이트 → 출력:플레이헤드 위치 이동",
        "logic": "mousedown → 마우스 이동 추적 → newX 계산 → isMagnet 체크 → 스냅 대상 검색 → currentTime = newX / zoom",
        "js_methods": ["handlePlayheadDrag"],
        "js_state": "store.currentTime"
    },
    
    // ===== CANVAS =====
    "canvas-box-{id}": {
        "io": "입력:드래그/리사이즈 → Interact.js 이벤트 → updateBoxPosition() 호출 → 출력:canvasBoxes[].x/y/w/h 업데이트",
        "logic": "Interact.draggable → move → data-x/y 누적 → end → updateBoxPosition(id, dx, dy, w, h) | Interact.resizable → move → width/height 변경 → end → updateBoxPosition(id, dx, dy, newW, newH, true)",
        "js_methods": ["updateBoxPosition", "removeBox", "setSelectedBoxId"],
        "js_state": "store.canvasBoxes"
    },
    
    // ===== LAYER PANEL =====
    "layer-add-column-btn": {
        "io": "입력:클릭 → addColumn() → layerCols 배열에 새 항목 추가 → 출력:레이어 매트릭스 컬럼 추가",
        "logic": "@click → addColumn() → layerCols.push({id, name:'New', color:'#333'})",
        "js_methods": ["addColumn"],
        "js_state": "store.layerCols"
    },
    
    "layer-matrix-cell": {
        "io": "입력:클릭 → addLayerBox(colIdx, type, color) → canvasBoxes 배열에 새 박스 추가 → 출력:캔버스에 박스 렌더링",
        "logic": "@click → addLayerBox(colIdx, type, color) → zIndex = getZIndex(colIdx, type) → canvasBoxes.push({id, colIdx, type, zIndex, color, x, y, w, h})",
        "js_methods": ["addLayerBox", "getZIndex"],
        "js_state": "store.canvasBoxes"
    },
    
    "layer-save-template-btn": {
        "io": "입력:클릭 → SweetAlert2 입력 모달 → 이름 입력 → saveLayerTemplate() → 출력:layerTemplates 배열에 추가",
        "logic": "@click → Swal.fire({input:'text'}) → 이름 입력 → saveLayerTemplate(name) → layerTemplates.push({id, name, cols})",
        "js_methods": ["saveLayerTemplate"],
        "js_state": "store.layerTemplates"
    },
    
    // ===== PROPERTIES PANEL =====
    "properties-clip-delete-btn": {
        "io": "입력:클릭 → deleteClip(id) → clips 배열에서 제거 → 출력:타임라인에서 클립 제거 + selectedClip = null",
        "logic": "@click → deleteClip(selectedClip.id) → removeClip(id) → clips.filter(c => c.id !== id) → selectedClip = null",
        "js_methods": ["deleteClip", "removeClip"],
        "js_state": "store.clips"
    },
    
    "properties-box-delete-btn": {
        "io": "입력:클릭 → removeBox(id) → canvasBoxes 배열에서 제거 → 출력:캔버스에서 박스 제거 + selectedBoxId = null",
        "logic": "@click → vm.removeBox(selectedBoxId) → canvasBoxes.filter(b => b.id !== id) → selectedBoxId = null",
        "js_methods": ["removeBox"],
        "js_state": "store.canvasBoxes"
    }
};
