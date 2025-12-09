if (!window.Vue) { throw new Error("Vue.js global object not found."); }
const { reactive } = window.Vue;

export const store = reactive({
    layout: {
        leftPanelWidth: 240, rightPanelWidth: 320, timelineHeaderWidth: 200, 
        isTimelineDocked: false, isTimelineCollapsed: false, isProjectModalOpen: false, isDesignGuideOpen: false, isLeftPanelVisible: true
    },
    devMode: { active: false, full: false },
    project: { name: "", zoom: 20, currentTime: 0, isMagnet: true, isAutoRipple: false, aspectRatio: '16:9', resolution: '4K' },
    status: { mouseCoord: { x: 0, y: 0 }, canvasScale: 1.0 },

    // Original Track Data
    tracks: [
        { id: 't1', name: 'Global', type: 'video', color: '#64748b', height: 40, isVisible: true, isLocked: false }, 
        { id: 't2', name: 'Top', type: 'text', color: '#eab308', height: 40, isVisible: true, isLocked: false },
        { id: 't3', name: 'Middle', type: 'video', color: '#22c55e', height: 60, isVisible: true, isLocked: false }, 
        { id: 't4', name: 'Bottom', type: 'text', color: '#3b82f6', height: 40, isVisible: true, isLocked: false },
        { id: 't5', name: 'BGM', type: 'audio', color: '#a855f7', height: 40, isVisible: true, isLocked: false }
    ],
    clips: [ { id: 'c1', trackId: 't1', name: 'Intro_BG.mp4', start: 0, duration: 10, type: 'video' } ],
    
    // Layer Data (Color fix)
    canvasBoxes: [ { id: 'box_init', colIdx: 1, type: 'TXT', zIndex: 240, color: '#eab308', x: 1720, y: 980, w: 400, h: 200 } ],
    layerCols: [ { id: 'c1', name: '전체', color: '#64748b' }, { id: 'c2', name: '상단', color: '#eab308' }, { id: 'c3', name: '중단', color: '#22c55e' }, { id: 'c4', name: '하단', color: '#3b82f6' } ],
    
    selection: { clipId: null, boxId: null },
    fileSystem: { folders: [], files: [] },

    selectClip(id) { this.selection.clipId = (this.selection.clipId === id) ? null : id; this.selection.boxId = null; },
    selectBox(id) { this.selection.boxId = (this.selection.boxId === id) ? null : id; this.selection.clipId = null; },
    updateClip(id, s, d, tid) { const c = this.clips.find(x => x.id === id); if(c) { c.start = Math.max(0, c.start+s); c.duration = Math.max(0.1, c.duration+d); if(tid) c.trackId = tid; } },
    removeClip(id) { this.clips = this.clips.filter(c => c.id !== id); },
    addLayerBox(colIdx, type, zIndex, color) { this.canvasBoxes.push({ id: `box_${Date.now()}`, colIdx, type, zIndex, color, x: 1920-200+(colIdx*50), y: 1080-150+(colIdx*50), w: 400, h: 300 }); },
    removeBox(id) { this.canvasBoxes = this.canvasBoxes.filter(b => b.id !== id); },
    renameTrack(id, newName) { const t = this.tracks.find(x => x.id === id); if(t) t.name = newName; },
    toggleTrackProp(id, prop) { const t = this.tracks.find(x => x.id === id); if(t) t[prop] = !t[prop]; }
});