const { createApp, reactive, ref, onMounted, computed, nextTick } = Vue;

// 프리뷰 캔버스 기준 긴 변 픽셀 (해상도와 무관, 프리뷰 전용)
// - 16:9 가로형 기준 1920 x 1080
const BASE_CANVAS_LONG_SIDE = 1920;

// 해상도별 기준 긴 변 픽셀 (레이블용, 프리뷰 스케일과는 무관)
const RESOLUTION_KEYS = ['8K', '6K', '4K', '3K', '2K'];
const RESOLUTION_LONG_SIDE = {
    '8K': 7680,
    '6K': 5760,
    '4K': 3840,
    '3K': 2880,
    '2K': 1920
};

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
                // 좌표가 1920x1080 기준으로 잡혀 있으므로 BASE 기준도 1920x1080 으로 맞춘다.
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
            // 해상도 키(내부 값): '8K' / '6K' / '4K' / '3K' / '2K'
            // ※ 프리뷰 캔버스 크기와는 연동하지 않고, 프로젝트 메타/라벨 용도만 사용
            resolution: '4K',
            // 프리뷰용 기준 픽셀 사이즈 (aspectRatio 만 반영, 해상도와 무관)
            canvasSize: { w: 1920, h: 1080 }, 
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
        /**
         * 프리뷰 캔버스 실제 픽셀 사이즈(canvasSize) + 스케일(canvasScale)을
         * preview-canvas-viewport 중앙에 배치하는 스타일.
         * - transform scale 은 항상 균일(scaleX = scaleY) → 화면비율 그대로 유지
         */
        canvasScalerStyle() {
            return {
                width: this.canvasSize.w + 'px',
                height: this.canvasSize.h + 'px',
                backgroundColor: '#000',
                transform: `translate(-50%, -50%) scale(${this.canvasScale})`,
                position: 'absolute',
                top: '50%',
                left: '50%'
            };
        },

        // 현재 aspectRatio 에 맞는 해상도 옵션 라벨 리스트
        // 예: ["4K (3840 x 2160)", "3K (2880 x 1620)", ...]
        resolutionOptions() {
            return RESOLUTION_KEYS.map(key => this.getResolutionLabelFor(key));
        },

        // 현재 선택된 해상도 라벨
        currentResolutionLabel() {
            return this.getResolutionLabelFor(this.resolution);
        }
    },
    mounted() {
        this.$nextTick(() => { 
            // 초기 비율 기준으로 canvasSize + scale 계산 (해상도와는 무관)
            this.updateCanvasSizeFromControls();
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

        // 비율 선택 (16:9 / 9:16 / 1:1)
        setAspect(r) { 
            this.aspectRatio = r; 
            this.updateCanvasSizeFromControls();
        },

        // 해상도 선택
        // - 이제 프리뷰 캔버스 크기/비율과는 연동하지 않고, 메타 정보/라벨만 변경
        setResolution(labelOrKey) { 
            const str = (labelOrKey || '').toString().trim();
            const match = str.match(/^(\S+)/); // 첫 토큰만 해상도 키로 사용
            const key = match ? match[1] : (str || this.resolution);
            this.resolution = key;
            // 프리뷰 캔버스는 그대로 유지 (recalculateCanvasScale 호출하지 않음)
        },

        /**
         * 프리뷰용 기준 캔버스 크기 계산
         * - BASE_CANVAS_LONG_SIDE (1920)를 기준으로만 계산
         * - 해상도와 무관
         */
        computeCanvasSize(aspectRatio) {
            const longSide = BASE_CANVAS_LONG_SIDE;
            let w, h;

            if (aspectRatio === '9:16') {
                // 세로형: 높이를 긴 변으로 사용 (예: 1080 x 1920 과 비슷한 비율)
                h = longSide;
                w = Math.round(longSide * 9 / 16); // 1080
            } else if (aspectRatio === '1:1') {
                // 1:1 은 16:9 높이(약 1080)에 맞춰 정사각형
                const square = Math.round(longSide * 9 / 16); // 1080
                w = square;
                h = square;
            } else {
                // 기본: 16:9 가로형
                w = longSide;                           // 1920
                h = Math.round(longSide * 9 / 16);      // 1080
            }
            return { w, h };
        },

        /**
         * 해상도 라벨용 픽셀 크기 계산
         * - 실제 프리뷰 크기에는 사용하지 않고, 드롭다운 텍스트에만 사용
         */
        computeResolutionSize(aspectRatio, resolutionKey) {
            const key = resolutionKey || '4K';
            const longSide = RESOLUTION_LONG_SIDE[key] || RESOLUTION_LONG_SIDE['4K'];
            let w, h;

            if (aspectRatio === '9:16') {
                h = longSide;
                w = Math.round(longSide * 9 / 16);
            } else if (aspectRatio === '1:1') {
                const square = Math.round(longSide * 9 / 16);
                w = square;
                h = square;
            } else {
                w = longSide;
                h = Math.round(longSide * 9 / 16);
            }
            return { w, h };
        },

        // 특정 해상도 키에 대한 "4K (3840 x 2160)" 형식 라벨 생성
        getResolutionLabelFor(key) {
            const k = key || this.resolution || '4K';
            const size = this.computeResolutionSize(this.aspectRatio, k);
            return `${k} (${size.w} x ${size.h})`;
        },

        // 비율(Aspect) 변경 시 프리뷰용 canvasSize + scale 갱신
        updateCanvasSizeFromControls() {
            const size = this.computeCanvasSize(this.aspectRatio);
            this.canvasSize = size;
            this.recalculateCanvasScale();
        },

        /**
         * preview-canvas-viewport 안에서
         * - 사방 20px 마진을 최소로 두고
         * - 그 안을 기준으로 설정된 화면비율을 최대한 채우도록 스케일 계산
         * 남는 여백은 그대로 비워두는(레터박스) 방식.
         */
        recalculateCanvasScale() {
            const viewport = document.getElementById('preview-canvas-viewport');
            if (!viewport) return;

            const PADDING = 20; // CSS 의 padding 과 동일해야 함

            // clientWidth/Height 는 padding 을 포함하므로, 실제 "컨텐츠 영역"은 -2*padding
            const innerW = viewport.clientWidth - PADDING * 2;
            const innerH = viewport.clientHeight - PADDING * 2;

            if (innerW <= 0 || innerH <= 0 || this.canvasSize.w <= 0 || this.canvasSize.h <= 0) {
                this.canvasScale = 1.0;
                return;
            }

            // 가로/세로 중 더 작은 비율을 사용 → 비율 유지 + 여백은 그대로 둠
            const scale = Math.min(
                innerW / this.canvasSize.w,
                innerH / this.canvasSize.h
            );

            this.canvasScale = (scale > 0 && Number.isFinite(scale)) ? scale : 1.0;
        },

        updateCanvasMouseCoord(e) {
            const viewport = document.getElementById('preview-canvas-viewport');
            const scaler = document.getElementById('preview-canvas-scaler');
            if (!viewport || !scaler) return;

            const vpRect = viewport.getBoundingClientRect();
            const scRect = scaler.getBoundingClientRect();
            const PADDING = 20;

            // 뷰포트 기준 마우스 위치
            const mouseXInVp = e.clientX - vpRect.left;
            const mouseYInVp = e.clientY - vpRect.top;

            const innerLeft = PADDING;
            const innerTop = PADDING;
            const innerRight = vpRect.width - PADDING;
            const innerBottom = vpRect.height - PADDING;

            // 캔버스 영역(20px 마진 안쪽)을 기준으로 마우스가 안에 있는지 판단
            this.isMouseOverCanvas =
                mouseXInVp >= innerLeft &&
                mouseXInVp <= innerRight &&
                mouseYInVp >= innerTop &&
                mouseYInVp <= innerBottom;

            // 마우스 마커 위치도 뷰포트 내부 좌표로 저장
            this.mouseMarkerPos = {
                x: mouseXInVp,
                y: mouseYInVp
            };

            // 실제 캔버스 좌표 (스케일 이전 좌표)
            const canvasX = e.clientX - scRect.left;
            const canvasY = e.clientY - scRect.top;
            const scale = this.canvasScale || 1.0;

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

                    // 프리뷰 패널 크기가 변하면 캔버스 스케일 재계산
                    self.recalculateCanvasScale();
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
            const viewport = document.getElementById('preview-canvas-viewport');
            if (!viewport) return;
            
            const updateScale = () => {
                this.recalculateCanvasScale();
            };

            updateScale();

            if (window.ResizeObserver) {
                new ResizeObserver(updateScale).observe(viewport);
            } else {
                window.addEventListener('resize', updateScale);
            }
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
