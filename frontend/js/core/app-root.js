const { createApp, reactive, ref, onMounted, computed, nextTick } = Vue;

// --- Main App Vue Instance ---

const App = {
    components: { 
        'dropdown-menu': DropdownMenu, 
        'project-modal': ProjectModal, 
        'layer-panel': LayerPanel,
        'properties-panel': PropertiesPanel,
        'preview-canvas': PreviewCanvas,
        'timeline-panel': TimelinePanel,
        'ruler-line': RulerLine
    },
    data() {
        return {
            // UI Layout State
            leftPanelWidth: 240, 
            rightPanelWidth: 320,
            previewContainerHeight: '50%', 
            timelineContainerHeight: '50%',
            isProjectModalOpen: false,
            isDevModeActive: false, 
            isDevModeFull: false,   
            
            // Core Timeline/Canvas State
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
            // 레이어 관리용 박스 (항상 표시)
            canvasBoxes: [
                { id: 'box_init', colIdx: 1, type: 'TXT', zIndex: 240, color: '#eab308', x: 1720, y: 980, w: 400, h: 200 }
            ],
            // 클립 연동 박스 (클립 추가 시 자동 생성)
            clipBoxes: [],
            zoom: 20,
            selectedClip: null,
            selectedBoxId: null,
            layerMainName: "",
            layerTemplates: [],
            isMagnet: true,
            isAutoRipple: false,
            isTimelineCollapsed: false,
            currentTime: 0,
            isPlaying: false,
            playbackTimer: null,
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
            layerCols: [
                { id: 'c1', name: '전체', color: '#64748b' },
                { id: 'c2', name: '상단', color: '#eab308' },
                { id: 'c3', name: '중단', color: '#22c55e' },
                { id: 'c4', name: '하단', color: '#3b82f6' }
            ],
            COLORS
        }
    },
    computed: {
        canvasScalerStyle() {
            return {
                width: this.canvasSize.w + 'px', 
                height: this.canvasSize.h + 'px', 
                backgroundColor: '#000', 
                transform: `translate(-50%, -50%) scale(${this.canvasScale})`,
                position: 'absolute', 
                top: '50%', 
                left: '50%'
            }
        },
        // 플레이헤드 위치에 해당하는 활성 클립들의 박스
        activeClipBoxes() {
            const currentTime = this.currentTime;
            const activeClips = this.clips.filter(clip => {
                return currentTime >= clip.start && currentTime < clip.start + clip.duration;
            });
            
            return activeClips.map(clip => {
                // clipBoxes에서 해당 클립의 박스 찾기
                const existingBox = this.clipBoxes.find(box => box.clipId === clip.id);
                if (existingBox) {
                    return {
                        ...existingBox,
                        clipStart: clip.start,
                        clipDuration: clip.duration,
                        isActive: true
                    };
                }
                return null;
            }).filter(box => box !== null);
        },
        // PreviewCanvas에 전달할 모든 박스 (레이어 박스 + 활성 클립 박스)
        allVisibleBoxes() {
            // 레이어 박스 (항상 표시, isHidden 제외)
            const layerBoxes = this.canvasBoxes.filter(box => !box.isHidden);
            
            // 활성 클립 박스 (플레이헤드 위치 기준)
            const clipBoxesActive = this.activeClipBoxes;
            
            // zIndex로 정렬하여 병합
            return [...layerBoxes, ...clipBoxesActive].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        }
    },
    mounted() {
        this.$nextTick(() => { 
            this.setupPanelResizers(); 
            this.setupCanvasScaler(); 
            this.setupInspectorMode(); 
            this.setupAssetEventListeners();
        });
        window.vm = this; 
    },
    beforeUnmount() {
        this.removeAssetEventListeners();
        if (this.playbackTimer) {
            cancelAnimationFrame(this.playbackTimer);
        }
    },
    methods: {
        // --- Asset Event Listeners ---
        setupAssetEventListeners() {
            // AssetManagerModal에서 발생하는 이벤트 수신
            document.addEventListener('wai-asset-add-to-timeline', this.handleAssetAddToTimeline);
            // TimelinePanel에서 발생하는 드롭 이벤트 수신
            document.addEventListener('wai-timeline-drop', this.handleTimelineDrop);
        },
        
        removeAssetEventListeners() {
            document.removeEventListener('wai-asset-add-to-timeline', this.handleAssetAddToTimeline);
            document.removeEventListener('wai-timeline-drop', this.handleTimelineDrop);
        },
        
        // AssetManagerModal의 "타임라인에 추가" 버튼 클릭 시
        handleAssetAddToTimeline(e) {
            const assets = e.detail;
            if (!assets || !Array.isArray(assets) || assets.length === 0) return;
            
            // 첫 번째 트랙 또는 메인 트랙 찾기
            let targetTrack = this.tracks.find(t => t.isMain) || this.tracks[0];
            if (!targetTrack) return;
            
            // 현재 플레이헤드 위치부터 순차 배치
            let insertTime = this.currentTime;
            
            assets.forEach(asset => {
                const duration = this.parseDuration(asset.duration) || 10;
                const newClip = {
                    id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    trackId: targetTrack.id,
                    name: asset.name || 'Untitled',
                    start: insertTime,
                    duration: duration,
                    type: asset.type || 'video',
                    src: asset.src || '',
                    volume: 100
                };
                
                this.addClipWithBox(newClip);
                insertTime += duration;
            });
        },
        
        // TimelinePanel에서 드래그 드롭 시
        handleTimelineDrop(e) {
            const { assets, dropTime, targetTrackId } = e.detail;
            if (!assets || assets.length === 0) return;
            
            let trackId = targetTrackId;
            if (!trackId) {
                const mainTrack = this.tracks.find(t => t.isMain) || this.tracks[0];
                trackId = mainTrack ? mainTrack.id : null;
            }
            if (!trackId) return;
            
            let insertTime = dropTime || this.currentTime;
            
            assets.forEach(asset => {
                const duration = this.parseDuration(asset.duration) || 10;
                const newClip = {
                    id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    trackId: trackId,
                    name: asset.name || 'Untitled',
                    start: insertTime,
                    duration: duration,
                    type: asset.type || 'video',
                    src: asset.src || '',
                    volume: 100
                };
                
                this.addClipWithBox(newClip);
                insertTime += duration;
            });
        },
        
        // 클립 추가 + 연동 박스 생성
        addClipWithBox(clip) {
            // 1. 클립 추가
            this.clips.push(clip);
            
            // 2. 비디오/이미지 클립인 경우 연동 박스 생성
            if (clip.type === 'video' || clip.type === 'image') {
                const track = this.tracks.find(t => t.id === clip.trackId);
                const trackIndex = this.tracks.findIndex(t => t.id === clip.trackId);
                
                // 캔버스 전체 크기로 박스 생성 (풀스크린)
                const clipBox = {
                    id: `clipbox_${clip.id}`,
                    clipId: clip.id,
                    x: 0,
                    y: 0,
                    w: this.canvasSize.w,
                    h: this.canvasSize.h,
                    zIndex: (trackIndex + 1) * 10, // 트랙 순서 기반 zIndex
                    color: track ? track.color : '#3b82f6',
                    mediaType: clip.type,
                    mediaSrc: clip.src || '',
                    mediaFit: 'cover',
                    isHidden: false
                };
                
                this.clipBoxes.push(clipBox);
            }
            
            return clip.id;
        },
        
        // 클립 삭제 시 연동 박스도 제거
        removeClipWithBox(clipId) {
            this.clips = this.clips.filter(c => c.id !== clipId);
            this.clipBoxes = this.clipBoxes.filter(box => box.clipId !== clipId);
        },
        
        parseDuration(durationStr) {
            if (!durationStr) return null;
            if (typeof durationStr === 'number') return durationStr;
            const parts = durationStr.split(':');
            if (parts.length === 2) return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
            if (parts.length === 3) return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
            return parseFloat(durationStr) || null;
        },
        
        // --- Playback Controls ---
        togglePlayback() {
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                this.startPlayback();
            } else {
                this.stopPlayback();
            }
        },
        
        startPlayback() {
            const fps = 30;
            const frameTime = 1000 / fps;
            let lastTime = performance.now();
            
            const animate = (currentTime) => {
                if (!this.isPlaying) return;
                
                const delta = (currentTime - lastTime) / 1000;
                lastTime = currentTime;
                
                this.currentTime += delta;
                
                // 끝에 도달하면 멈춤
                const maxTime = this.getMaxClipEnd();
                if (this.currentTime >= maxTime) {
                    this.currentTime = maxTime;
                    this.isPlaying = false;
                    return;
                }
                
                this.playbackTimer = requestAnimationFrame(animate);
            };
            
            this.playbackTimer = requestAnimationFrame(animate);
        },
        
        stopPlayback() {
            if (this.playbackTimer) {
                cancelAnimationFrame(this.playbackTimer);
                this.playbackTimer = null;
            }
        },
        
        seekToStart() {
            this.currentTime = 0;
        },
        
        seekToEnd() {
            this.currentTime = this.getMaxClipEnd();
        },
        
        getMaxClipEnd() {
            let max = 0;
            this.clips.forEach(c => {
                const end = c.start + c.duration;
                if (end > max) max = end;
            });
            return max || 60;
        },

        // --- System & Dev Mode ---
        firePython(f) {
            console.log('Py:', f);
            if (window.backend && window.backend[f]) {
                window.backend[f]();
            } else {
                console.log(`[DUMMY] Python call: ${f}`);
            }
        },
        toggleDevMode(mode) {
            if (mode === 'active') {
                this.isDevModeActive = !this.isDevModeActive;
                document.body.classList.toggle('dev-mode-active', this.isDevModeActive);
                if (this.isDevModeActive) {
                    this.isDevModeFull = false;
                    document.body.classList.remove('dev-mode-full');
                }
            } else if (mode === 'full') {
                this.isDevModeFull = !this.isDevModeFull;
                document.body.classList.toggle('dev-mode-full', this.isDevModeFull);
                if (this.isDevModeFull) {
                    this.isDevModeActive = false;
                    document.body.classList.remove('dev-mode-active');
                }
            }
        },
        addCol() { this.layerCols.push({ id: `lc_${Date.now()}`, name: 'New', color: '#333' }); },
        openCtx(e, id) { this.ctxMenu = { x: e.clientX, y: e.clientY, id }; },
        setColColor(c) { 
            const col = this.layerCols.find(x => x.id === this.ctxMenu.id);
            if(col) col.color = c;
            this.ctxMenu = null;
        },
        setupInspectorMode() {
            const self = this;
            document.addEventListener('mousemove', (e) => {
                if (!self.isDevModeActive) return;

                let target = e.target;
                if (target.classList.contains('dev-highlight') || target.classList.contains('dev-tooltip')) {
                     target = document.elementFromPoint(e.clientX, e.clientY);
                }

                if (target && target.tagName !== 'HTML' && target.tagName !== 'BODY') {
                    const rect = target.getBoundingClientRect();
                    
                    self.highlightStyle = {
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        top: `${rect.top}px`,
                        left: `${rect.left}px`,
                    };

                    let dataDevContent = target.getAttribute('data-dev') || '';
                    dataDevContent = dataDevContent.replace(/\\n/g, '\n');

                    self.inspector = {
                        tag: target.tagName,
                        id: target.id,
                        className: target.className,
                        x: Math.round(rect.left),
                        y: Math.round(rect.top),
                        w: Math.round(rect.width),
                        h: Math.round(rect.height),
                        dataDev: dataDevContent
                    };

                    self.tooltipStyle = {
                        top: `${rect.top - 50}px`, 
                        left: `${rect.left + rect.width + 10}px`,
                        transform: 'translateY(0)'
                    };

                    if (rect.top - 50 < 0) {
                        self.tooltipStyle.top = `${rect.bottom + 10}px`;
                    }
                } else {
                    self.inspector = { tag: '', id: '', className: '', x: 0, y: 0, w: 0, h: 0, dataDev: '' };
                }
            });
        },

        // --- Preview/Canvas Logic ---
        setAspect(r) { 
            this.aspectRatio = r; 
        },
        setResolution(r) { 
            this.resolution = r; 
        },
        updateCanvasMouseCoord(e) {
            const wrapper = document.getElementById('canvas-wrapper');
            const scaler = document.getElementById('canvas-scaler');
            if (!wrapper || !scaler) return;

            const wrapperRect = wrapper.getBoundingClientRect();
            const scalerRect = scaler.getBoundingClientRect();
            
            const padding = 20; 

            const mouseX = e.clientX - wrapperRect.left - padding;
            const mouseY = e.clientY - wrapperRect.top - padding;
            
            this.isMouseOverCanvas = mouseX > 0 && mouseY > 0 && mouseX < wrapperRect.width - padding && mouseY < wrapperRect.height - padding;
            
            this.mouseMarkerPos = { x: mouseX + padding, y: mouseY + padding };

            const canvasX = e.clientX - scalerRect.left;
            const canvasY = e.clientY - scalerRect.top;
            
            const scale = this.canvasScale;
            const realX = canvasX / scale;
            const realY = canvasY / scale;

            this.mouseCoord = { 
                x: Math.min(this.canvasSize.w, Math.max(0, realX)), 
                y: Math.min(this.canvasSize.h, Math.max(0, realY))
            };
        },
        
        // --- Layout Resizer Handlers ---
        setupPanelResizers() {
            const setup = (rid, stateKey, minSize, dir, isReverse = false) => {
                const r = document.getElementById(rid);
                if (!r) return;
                
                let startS, startP;
                const self = this;

                const onMove = (ev) => {
                    const diff = (dir === 'w' ? ev.clientX : ev.clientY) - startP;
                    let newSize;
                    
                    if (dir === 'w') {
                        newSize = isReverse ? startS - diff : startS + diff;
                        self[stateKey] = Math.max(minSize, newSize);
                    } else { 
                        const headerHeight = 48; 
                        const targetHeight = ev.clientY - headerHeight - 2; 
                        
                        newSize = targetHeight;
                        const effectiveHeight = Math.max(minSize, newSize);

                        self.previewContainerHeight = `${effectiveHeight}px`;
                        self.timelineContainerHeight = `calc(100% - ${effectiveHeight}px)`;
                    }
                };
                
                const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };

                r.addEventListener('mousedown', e => {
                    e.preventDefault(); 
                    startS = dir === 'w' ? self[stateKey] : 
                             (rid === 'resizer-timeline' ? document.getElementById('preview-container').offsetHeight : 0);
                    startP = dir === 'w' ? e.clientX : e.clientY;

                    document.addEventListener('mousemove', onMove); 
                    document.addEventListener('mouseup', onUp);
                });
            };
            
            setup('resizer-left', 'leftPanelWidth', 180, 'w', false);
            setup('resizer-right', 'rightPanelWidth', 250, 'w', true); 
            setup('resizer-timeline', 'previewContainerHeight', 100, 'h', false);
        },
        
        setupCanvasScaler() {
            const wrapper = document.getElementById('canvas-wrapper');
            
            const updateScale = () => {
                const padding = 20; 
                const scale = Math.min((wrapper.clientWidth - padding)/this.canvasSize.w, (wrapper.clientHeight - padding)/this.canvasSize.h); 
                this.canvasScale = scale;
            };

            updateScale();
            new ResizeObserver(updateScale).observe(wrapper);
        },

        // --- Core Model Methods (Clips/Boxes) ---
        getZIndex(colIdx, type) {
            const base = (colIdx * 100) + 100;
            const offset = Z_INDEX_OFFSETS[type] || 60;
            return base + offset;
        },
        addLayerBox(colIdx, type, color) {
            const zIndex = this.getZIndex(colIdx, type);
            const newBox = {
                id: `box_${Date.now()}`, colIdx, type, zIndex, color,
                x: 1920 - 200 + (colIdx*50), y: 1080 - 150 + (colIdx*50), w: 400, h: 300
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
        updateBoxPosition(id, x, y, w, h, isResizeEnd=false) {
            // 레이어 박스에서 찾기
            let index = this.canvasBoxes.findIndex(b => b.id === id);
            if (index !== -1) {
                const box = this.canvasBoxes[index];
                const newBoxes = [...this.canvasBoxes];
                newBoxes[index] = { 
                    ...box, 
                    x: x !== undefined ? x : box.x, 
                    y: y !== undefined ? y : box.y,
                    w: w !== undefined ? w : box.w,
                    h: h !== undefined ? h : box.h
                };
                this.canvasBoxes = newBoxes;
                return;
            }
            
            // 클립 박스에서 찾기
            index = this.clipBoxes.findIndex(b => b.id === id);
            if (index !== -1) {
                const box = this.clipBoxes[index];
                const newBoxes = [...this.clipBoxes];
                newBoxes[index] = { 
                    ...box, 
                    x: x !== undefined ? x : box.x, 
                    y: y !== undefined ? y : box.y,
                    w: w !== undefined ? w : box.w,
                    h: h !== undefined ? h : box.h
                };
                this.clipBoxes = newBoxes;
            }
        },
        removeClip(id) {
            this.removeClipWithBox(id);
        },
        setSelectedClip(clip) {
            this.selectedClip = (this.selectedClip && this.selectedClip.id === clip.id) ? null : clip;
            this.selectedBoxId = null;
        },
        moveTrack(fromIndex, toIndex) {
            const tracks = [...this.tracks];
            const [removed] = tracks.splice(fromIndex, 1);
            tracks.splice(toIndex, 0, removed);
            this.tracks = tracks;
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
                id: `c_${Date.now()}`, trackId, name: assetName, 
                start: time, duration: 10, type: fileType
            };
            this.addClipWithBox(newClip);
        },
        updateClip(clipId, startChange, durationChange) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index !== -1) {
                const clip = this.clips[index];
                const newClips = [...this.clips];
                
                const newStart = Math.max(0, clip.start + startChange); 
                const newDuration = Math.max(0.1, clip.duration + durationChange - (newStart - clip.start));
                
                newClips[index] = {
                    ...clip,
                    start: newStart,
                    duration: newDuration
                };
                this.clips = newClips;
            }
        },
        moveClip(clipId, timeChange) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index !== -1) {
                const clip = this.clips[index];
                const newClips = [...this.clips];
                newClips[index] = {
                    ...clip,
                    start: Math.max(0, clip.start + timeChange)
                };
                this.clips = newClips;
            }
        },
        
        // PreviewCanvas에서 호출하는 캔버스 에셋 드롭 핸들러
        handleCanvasAssetDrop(assetData, x, y) {
            // 캔버스에 직접 드롭된 경우 - 레이어 박스로 추가
            const assets = Array.isArray(assetData) ? assetData : [assetData];
            
            assets.forEach((asset, index) => {
                const defaultW = this.canvasSize.w / 2;
                const defaultH = this.canvasSize.h / 2;
                const boxX = Math.max(0, Math.min(this.canvasSize.w - defaultW, x - defaultW / 2 + index * 50));
                const boxY = Math.max(0, Math.min(this.canvasSize.h - defaultH, y - defaultH / 2 + index * 50));
                
                const newBox = {
                    id: `box_drop_${Date.now()}_${index}`,
                    x: boxX,
                    y: boxY,
                    w: defaultW,
                    h: defaultH,
                    zIndex: 100 + index,
                    color: '#3b82f6',
                    layerBgColor: 'transparent',
                    isHidden: false,
                    layerName: asset.name || 'Dropped Asset',
                    rowType: asset.type === 'sound' ? 'EFF' : 'BG',
                    mediaType: asset.type === 'video' ? 'video' : asset.type === 'image' ? 'image' : 'none',
                    mediaSrc: asset.src || '',
                    mediaFit: 'cover'
                };
                
                this.canvasBoxes.push(newBox);
            });
        }
    }
};

const app = createApp(App);
app.mount('#vue-app');
