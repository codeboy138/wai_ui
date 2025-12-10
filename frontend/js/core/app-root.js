const { createApp, reactive, ref, onMounted, computed, nextTick } = Vue;

// --- Main App Vue Instance ---
const AppRoot = {
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

            // Dev / Inspector 모드 상태
            isDevModeActive: false,   // Inspect
            isDevModeFull: false,     // Dev
            
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
            
            // Inspector / Dev Overlay State
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

            ctxMenu: null,

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
        }
    },
    mounted() {
        this.$nextTick(() => { 
            this.setupPanelResizers(); 
            this.setupCanvasScaler(); 
            this.setupInspectorMode(); 
        });
        window.vm = this; 
    },
    methods: {
        // --- System & Dev Mode ---
        firePython(f) {
            console.log('Py:', f);
            if (window.backend && window.backend[f]) {
                window.backend[f]();
            } else {
                console.log(`[DUMMY] Python call: ${f}`);
            }
        },

        /**
         * Inspect / Dev 모드 토글
         * - active: Inspect
         * - full: Dev
         * 둘 중 하나만 활성화되도록 body 클래스와 함께 관리
         */
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

        /**
         * Inspector tooltip 클릭 시 현재 요소 ID를 클립보드에 복사
         */
        copyInspectorId() {
            const id = this.inspector.id;
            if (!id) return;

            const text = id.toString();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).catch(err => {
                    console.warn('[Inspector] clipboard write failed', err);
                });
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.warn('[Inspector] execCommand copy failed', err);
                }
                document.body.removeChild(ta);
            }
        },

        addCol() { 
            this.layerCols.push({ id: `lc_${Date.now()}`, name: 'New', color: '#333' }); 
        },
        openCtx(e, id) { 
            this.ctxMenu = { x: e.clientX, y: e.clientY, id }; 
        },
        setColColor(c) { 
            const col = this.layerCols.find(x => x.id === this.ctxMenu?.id);
            if (col) col.color = c;
            this.ctxMenu = null;
        },

        /**
         * Inspector / Dev 모드 공통 마우스 무브 핸들러
         * - Inspect 모드: ID/태그/클래스 + 크기만 표시
         * - Dev 모드: element-specs.js + data-action 기반 정보 표시
         */
        setupInspectorMode() {
            const self = this;
            const TOOLTIP_MARGIN = 10;
            const TOOLTIP_WIDTH = 260;
            const TOOLTIP_HEIGHT_INSPECT = 80;
            const TOOLTIP_HEIGHT_DEV = 150;

            document.addEventListener('mousemove', (e) => {
                if (!self.isDevModeActive && !self.isDevModeFull) return;

                let target = e.target;

                // 오버레이 위에서 움직이는 경우 실제 요소로 재획득
                if (target.classList.contains('dev-highlight') || target.classList.contains('dev-tooltip')) {
                    const realTarget = document.elementFromPoint(e.clientX, e.clientY);
                    if (realTarget) target = realTarget;
                }

                if (target && target.tagName !== 'HTML' && target.tagName !== 'BODY') {
                    const rect = target.getBoundingClientRect();

                    self.highlightStyle = {
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        top: `${rect.top}px`,
                        left: `${rect.left}px`,
                    };

                    const devInfo = self.isDevModeFull ? self.buildDevInfo(target) : '';

                    self.inspector = {
                        tag: target.tagName,
                        id: target.id,
                        className: target.className,
                        x: Math.round(rect.left),
                        y: Math.round(rect.top),
                        w: Math.round(rect.width),
                        h: Math.round(rect.height),
                        dataDev: devInfo
                    };

                    // 툴팁 위치 계산 (뷰포트 안으로 클램핑)
                    const tooltipHeight = self.isDevModeFull ? TOOLTIP_HEIGHT_DEV : TOOLTIP_HEIGHT_INSPECT;

                    let top = rect.top - tooltipHeight - TOOLTIP_MARGIN;
                    let left = rect.left + rect.width + TOOLTIP_MARGIN;

                    // 위로 나가면 아래로
                    if (top < TOOLTIP_MARGIN) {
                        top = rect.bottom + TOOLTIP_MARGIN;
                    }

                    // 아래로도 나가지 않도록 클램프
                    if (top + tooltipHeight > window.innerHeight - TOOLTIP_MARGIN) {
                        top = Math.max(TOOLTIP_MARGIN, window.innerHeight - tooltipHeight - TOOLTIP_MARGIN);
                    }

                    // 오른쪽으로 나가면 왼쪽에 배치
                    if (left + TOOLTIP_WIDTH > window.innerWidth - TOOLTIP_MARGIN) {
                        left = rect.left - TOOLTIP_WIDTH - TOOLTIP_MARGIN;
                        if (left < TOOLTIP_MARGIN) {
                            left = Math.max(TOOLTIP_MARGIN, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN);
                        }
                    }

                    self.tooltipStyle = {
                        top: `${top}px`,
                        left: `${left}px`
                    };
                } else {
                    self.inspector = { 
                        tag: '', 
                        id: '', 
                        className: '', 
                        x: 0, 
                        y: 0, 
                        w: 0, 
                        h: 0, 
                        dataDev: '' 
                    };
                }
            });
        },

        /**
         * Dev 모드용 정보 문자열 생성
         * - 코드/브리지 중심 정보만 표시
         * - 사람이 읽기 쉬운 설명(desc)는 element-specs.js 쪽에서 관리
         */
        buildDevInfo(targetEl) {
            const id = targetEl.id || '';
            const dataAction = targetEl.getAttribute('data-action') || '';

            let spec = null;
            try {
                if (typeof window !== 'undefined' && typeof window.WAI_getElementSpec === 'function' && id) {
                    spec = window.WAI_getElementSpec(id);
                }
            } catch (err) {
                console.warn('[DEV] element spec lookup error for id=', id, err);
            }

            const lines = [];

            if (spec) {
                if (spec.module) {
                    lines.push(`module: ${spec.module}`);
                }
                if (spec.py_func) {
                    lines.push(`py: ${spec.py_func}`);
                }
                if (spec.js_action) {
                    lines.push(`js: ${spec.js_action}`);
                }
            } else {
                lines.push('Spec: NOT FOUND');
            }

            if (dataAction) {
                lines.push(`data-action: ${dataAction}`);
            }

            return lines.join('\n');
        },

        // --- Preview/Canvas Logic ---
        setAspect(r) { 
            this.aspectRatio = r; 
        },
        setResolution(r) { 
            this.resolution = r; 
        },
        updateCanvasMouseCoord(e) {
            const wrapper = document.getElementById('preview-canvas-wrapper');
            const scaler = document.getElementById('preview-canvas-scaler');
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
                             (rid === 'main-center-timeline-resizer-h' ? document.getElementById('preview-main-container').offsetHeight : 0);
                    startP = dir === 'w' ? e.clientX : e.clientY;

                    document.addEventListener('mousemove', onMove); 
                    document.addEventListener('mouseup', onUp);
                });
            };
            
            // Left Panel (Width)
            setup('main-left-resizer-v', 'leftPanelWidth', 180, 'w', false);
            
            // Right Panel (Width - Reverse calculation)
            setup('main-right-resizer-v', 'rightPanelWidth', 250, 'w', true); 
            
            // Center Horizontal (Height)
            setup('main-center-timeline-resizer-h', 'previewContainerHeight', 100, 'h', false);
        },
        
        setupCanvasScaler() {
            const wrapper = document.getElementById('preview-canvas-wrapper');
            if (!wrapper) return;
            
            const updateScale = () => {
                const padding = 20; 
                const scale = Math.min(
                    (wrapper.clientWidth - padding) / this.canvasSize.w, 
                    (wrapper.clientHeight - padding) / this.canvasSize.h
                ); 
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
        updateBoxPosition(id, dx, dy, dw, dh, isResizeEnd = false) {
            const index = this.canvasBoxes.findIndex(b => b.id === id);
            if (index === -1) return;

            const box = this.canvasBoxes[index];
            const newBoxes = [...this.canvasBoxes];
            
            newBoxes[index] = { 
                ...box, 
                x: box.x + dx, 
                y: box.y + dy,
                w: isResizeEnd ? dw : box.w,
                h: isResizeEnd ? dh : box.h
            };
            this.canvasBoxes = newBoxes;
        },
        removeClip(id) {
            this.clips = this.clips.filter(c => c.id !== id);
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
                id: `c_${Date.now()}`, 
                trackId, 
                name: assetName, 
                start: time, 
                duration: 10, 
                type: fileType
            };
            this.clips.push(newClip);
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
        }
    }
};

// Vue 앱 부트스트랩 (bootstrap.js에서 할 수도 있음)
createApp(AppRoot).mount('#app-vue-root');
