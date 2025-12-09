/**
 * ==========================================
 * store.js - 전역 상태 관리 (Vue Reactive Store)
 * 
 * 역할: 중앙 집중식 상태 관리 (Flux-like Pattern)
 * 경로: frontend/js/store.js
 * 
 * DATA-DEV:
 * 요소의 역할: 애플리케이션 전역 상태 관리
 * 요소의 고유ID: js-store
 * 요소의 기능 목적 정의: tracks, clips, canvasBoxes 등 모든 상태를 관리하는 중앙 저장소
 * 요소의 동작 로직 설명: Vue.reactive()로 반응형 상태 생성, 컴포넌트에서 this.$store로 접근
 * 요소의 입출력 데이터 구조: 입력: 없음. 출력: reactive store 객체
 * 요소의 경로정보: frontend/js/store.js
 * 요소의 수행해야 할 백엔드/JS 명령: JS: Vue.reactive(), export default store
 * ==========================================
 */

const { reactive } = window.Vue;

const Z_INDEX_OFFSETS = { 'BG': 20, 'TXT': 40, 'VID': 60, 'EFF': 80 };

const store = reactive({
    // UI Layout State
    leftPanelWidth: 240,
    rightPanelWidth: 320,
    previewContainerHeight: '50%',
    timelineContainerHeight: '50%',
    isProjectModalOpen: false,
    isDevModeActive: false,
    isDevModeFull: false,
    
    // Timeline/Canvas State
    tracks: [
        { id: 't1', name: 'Global', type: 'video', color: '#64748b' },
        { id: 't2', name: 'Top', type: 'text', color: '#eab308' },
        { id: 't3', name: 'Middle', type: 'video', color: '#22c55e' },
        { id: 't4', name: 'Bottom', type: 'text', color: '#3b82f6' },
        { id: 't5', name: 'BGM', type: 'audio', color: '#a855f7' }
    ],
    
    clips: [
        { id: 'c1', trackId: 't1', name: 'Intro_BG.mp4', start: 0, duration: 10, type: 'video' },
        { id: 'c3', trackId: 't5', name: 'BGM_Main.mp3', start: 0, duration: 30, type: 'audio' }
    ],
    
    canvasBoxes: [
        { id: 'box_init', colIdx: 1, type: 'TXT', zIndex: 240, color: '#eab308', x: 1720, y: 980, w: 400, h: 200 }
    ],
    
    zoom: 20,
    selectedClip: null,
    selectedBoxId: null,
    layerMainName: "",
    layerTemplates: [],
    isMagnet: true,
    isAutoRipple: false,
    isTimelineCollapsed: false,
    currentTime: 0,
    dragItemIndex: null,
    dragOverItemIndex: null,
    
    // Preview Toolbar State
    aspectRatio: '16:9',
    resolution: '4K',
    canvasSize: { w: 3840, h: 2160 },
    mouseCoord: { x: 0, y: 0 },
    isMouseOverCanvas: false,
    canvasScale: 1.0,
    
    // Inspector State
    inspector: { tag: '', id: '', className: '', x: 0, y: 0, w: 0, h: 0, dataDev: '' },
    highlightStyle: { width: '0', height: '0', top: '0', left: '0' },
    tooltipStyle: { top: '0', left: '0' },
    mouseMarkerPos: { x: 0, y: 0 },
    
    // Layer Matrix
    layerCols: [
        { id: 'c1', name: '전체', color: '#64748b' },
        { id: 'c2', name: '상단', color: '#eab308' },
        { id: 'c3', name: '중단', color: '#22c55e' },
        { id: 'c4', name: '하단', color: '#3b82f6' }
    ],
    
    COLORS: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#ffffff', '#9ca3af', '#4b5563', '#000000'],
    
    // Methods
    getZIndex(colIdx, type) {
        const base = (colIdx * 100) + 100;
        const offset = Z_INDEX_OFFSETS[type] || 60;
        return base + offset;
    },
    
    addLayerBox(colIdx, type, color) {
        const zIndex = this.getZIndex(colIdx, type);
        const newBox = {
            id: `box_${Date.now()}`,
            colIdx,
            type,
            zIndex,
            color,
            x: 1920 - 200 + (colIdx * 50),
            y: 1080 - 150 + (colIdx * 50),
            w: 400,
            h: 300
        };
        this.canvasBoxes.push(newBox);
    },
    
    removeBox(id) {
        this.canvasBoxes = this.canvasBoxes.filter(b => b.id !== id);
        if (this.selectedBoxId === id) this.selectedBoxId = null;
    },
    
    setSelectedBoxId(id) {
        this.selectedBoxId = (this.selectedBoxId === id) ? null : id;
        this.selectedClip = null;
    },
    
    removeClip(id) {
        this.clips = this.clips.filter(c => c.id !== id);
    },
    
    setSelectedClip(clip) {
        this.selectedClip = (this.selectedClip && this.selectedClip.id === clip.id) ? null : clip;
        this.selectedBoxId = null;
    },
    
    saveLayerTemplate(name) {
        const newTpl = { id: `tpl_${Date.now()}`, name, cols: this.layerCols };
        this.layerTemplates.push(newTpl);
        this.layerMainName = name;
    },
    
    addClipFromDrop(fileType, trackIndex, time, assetName) {
        const trackId = this.tracks[trackIndex] ? this.tracks[trackIndex].id : null;
        if (!trackId) return;
        const newClip = {
            id: `c_${Date.now()}`,
            trackId,
            name: assetName,
            start: time,
            duration: 10,
            type: fileType
        };
        this.clips.push(newClip);
    },
    
    moveTrack(fromIndex, toIndex) {
        if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
        const tracks = [...this.tracks];
        const [removed] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, removed);
        this.tracks = tracks;
    }
});

export default store;
