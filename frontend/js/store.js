/**
 * ==========================================
 * store.js - 전역 상태 관리
 * 
 * 역할: 중앙 집중식 상태 관리
 * 경로: frontend/js/store.js
 * ==========================================
 */

const { reactive } = window.Vue;

const Z_INDEX_OFFSETS = { 'BG': 20, 'TXT': 40, 'VID': 60, 'EFF': 80 };

const store = reactive({
    leftPanelWidth: 240,
    rightPanelWidth: 320,
    previewContainerHeight: '50%',
    timelineContainerHeight: '50%',
    isProjectModalOpen: false,
    isDevModeActive: false,
    isDevModeFull: false,
    
    tracks: [
        { id: 't1', name: 'Global', type: 'video', color: '#64748b', visible: true, locked: false },
        { id: 't2', name: 'Top', type: 'text', color: '#eab308', visible: true, locked: false },
        { id: 't3', name: 'Middle', type: 'video', color: '#22c55e', visible: true, locked: false },
        { id: 't4', name: 'Bottom', type: 'text', color: '#3b82f6', visible: true, locked: false },
        { id: 't5', name: 'BGM', type: 'audio', color: '#a855f7', visible: true, locked: false }
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
    
    aspectRatio: '16:9',
    resolution: '4K',
    canvasSize: { w: 3840, h: 2160 },
    mouseCoord: { x: 0, y: 0 },
    isMouseOverCanvas: false,
    canvasScale: 1.0,
    
    inspector: { name: '', width: 0, height: 0, id: '', action: '', io: '', logic: '' },
    highlightStyle: { width: '0', height: '0', top: '0', left: '0' },
    tooltipStyle: { top: '0', left: '0' },
    mouseMarkerPos: { x: 0, y: 0 },
    
    layerCols: [
        { id: 'c1', name: '전체', color: '#64748b' },
        { id: 'c2', name: '상단', color: '#eab308' },
        { id: 'c3', name: '중단', color: '#22c55e' },
        { id: 'c4', name: '하단', color: '#3b82f6' }
    ],
    
    COLORS: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#ffffff', '#9ca3af', '#4b5563', '#000000'],
    
    getZIndex(colIdx, type) {
        const base = (colIdx * 100) + 100;
        const offset = Z_INDEX_OFFSETS[type] || 60;
        return base + offset;
    },
    
    addLayerBox(colIdx, type, color) {
        const zIndex = this.getZIndex(colIdx, type);
        const newBox = {
            id: \`box_\${Date.now()}\`,
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
        const newTpl = { id: \`tpl_\${Date.now()}\`, name, cols: this.layerCols };
        this.layerTemplates.push(newTpl);
        this.layerMainName = name;
    },
    
    addClipFromDrop(fileType, trackIndex, time, assetName) {
        const trackId = this.tracks[trackIndex] ? this.tracks[trackIndex].id : null;
        if (!trackId) return;
        const newClip = {
            id: \`c_\${Date.now()}\`,
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
    },
    
    toggleTrackVisibility(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) track.visible = !track.visible;
    },
    
    toggleTrackLock(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (track) track.locked = !track.locked;
    }
});

export default store;
