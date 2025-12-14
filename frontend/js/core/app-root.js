const { createApp, reactive, ref, onMounted, computed, nextTick } = Vue;

// 프리뷰 캔버스 기준 긴 변 픽셀 (해상도와 무관, 프리뷰 전용)
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

// 레이어 매트릭스 컬럼 역할 (좌→우)
const LAYER_COLUMN_ROLES = ['full', 'high', 'mid', 'low'];

// 레이어 매트릭스 행 메타 (위→아래)
const LAYER_ROW_META = {
    EFF: { name: 'effect', zOffset: 80 },
    TXT: { name: 'text',   zOffset: 40 },
    BG:  { name: 'bg',     zOffset: 20 }
};

// 텍스트 레이어 기본 메시지
const DEFAULT_TEXT_MESSAGE = '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';

function createDefaultTextStyle() {
    return {
        fontFamily: 'Pretendard',
        fontSize: 48,
        strokeColor: '#000000',
        strokeWidth: 0,
        fillColor: '#ffffff',
        backgroundColor: 'transparent'
    };
}

// --- Main App Vue Instance ---
const AppRoot = {
    components: { 
        'dropdown-menu': DropdownMenu, 
        'project-modal': ProjectModal, 
        'layer-panel': LayerPanel,
        'properties-panel': PropertiesPanel,
        'preview-canvas': PreviewCanvas,
        'timeline-panel': TimelinePanel,
        'ruler-line': RulerLine,
        'layer-config-modal': LayerConfigModal
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
                { id: 't2', name: 'Top', type: 'text',  color: '#eab308' },
                { id: 't3', name: 'Middle', type: 'video', color: '#22c55e' }, 
                { id: 't4', name: 'Bottom', type: 'text',  color: '#3b82f6' },
                { id: 't5', name: 'BGM', type: 'audio',  color: '#a855f7' }
            ],
            clips: [
                { id: 'c1', trackId: 't1', name: 'Intro_BG.mp4',  start: 0, duration: 10, type: 'video' },
                { id: 'c3', trackId: 't5', name: 'BGM_Main.mp3', start: 0, duration: 30, type: 'audio' }
            ],

            // 캔바스 레이어 박스
            canvasBoxes: [],

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
            canvasSize: { w: 1920, h: 1080 }, 
            mouseCoord: { x: 0, y: 0 }, 
            isMouseOverCanvas: false,
            canvasScale: 1.0,

            // 박스 드래그 중 여부 (PreviewCanvas에서 제어)
            isBoxDragging: false,
            
            // Inspector / Dev Overlay State
            inspector: { tag: '', id: '', className: '', x: 0, y: 0, w: 0, h: 0, dataDev: '' },
            highlightStyle: { width: '0', height: '0', top: '0', left: '0' },
            tooltipStyle: { top: '0', left: '0' },
            mouseMarkerPos: { x: 0, y: 0 },

            // 레이어 매트릭스 컬럼 정의
            layerCols: [
                { id: 'c1', name: '전체', color: '#64748b' },
                { id: 'c2', name: '상단', color: '#eab308' },
                { id: 'c3', name: '중단', color: '#22c55e' },
                { id: 'c4', name: '하단', color: '#3b82f6' }
            ],

            ctxMenu: null,

            // 레이어 설정 모달 상태
            layerConfig: {
                isOpen: false,
                boxId: null
            },

            COLORS
        };
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
            };
        },
        resolutionOptions() {
            return RESOLUTION_KEYS.map(key => this.getResolutionLabelFor(key));
        },
        currentResolutionLabel() {
            return this.getResolutionLabelFor(this.resolution);
        },
        layerConfigBox() {
            if (!this.layerConfig.isOpen || !this.layerConfig.boxId) return null;
            return this.canvasBoxes.find(b => b.id === this.layerConfig.boxId) || null;
        }
    },
    watch: {
        canvasSize: {
            handler(newSize) {
                try {
                    if (window.PreviewRenderer && typeof window.PreviewRenderer.setCanvasSize === 'function') {
                        window.PreviewRenderer.setCanvasSize(newSize);
                    }
                } catch (err) {
                    console.warn('[Preview] canvasSize watcher failed:', err);
                }
            },
            deep: true
        },
        canvasBoxes: {
            handler(newBoxes) {
                try {
                    if (window.PreviewRenderer && typeof window.PreviewRenderer.syncBoxes === 'function') {
                        window.PreviewRenderer.syncBoxes(newBoxes);
                    }
                } catch (err) {
                    console.warn('[Preview] canvasBoxes watcher failed:', err);
                }
            },
            deep: true
        }
    },
    mounted() {
        this.$nextTick(() => { 
            this.updateCanvasSizeFromControls();
            this.setupPanelResizers(); 
            this.setupCanvasScaler(); 
            this.setupInspectorMode();
            this.setupSpinWheel();
            this.initPreviewRenderer();
        });
        window.vm = this; 
    },
    beforeUnmount() {
        if (this._spinWheelHandler) {
            document.removeEventListener('wheel', this._spinWheelHandler);
            this._spinWheelHandler = null;
        }
    },
    methods: {
        // --- Helper: 박스 퍼센트 좌표 보정 ---
        ensureBoxNormalized(box) {
            const cw = this.canvasSize.w || 1;
            const ch = this.canvasSize.h || 1;
            if (typeof box.nx !== 'number' || typeof box.ny !== 'number' ||
                typeof box.nw !== 'number' || typeof box.nh !== 'number') {
                const x = typeof box.x === 'number' ? box.x : 0;
                const y = typeof box.y === 'number' ? box.y : 0;
                const w = typeof box.w === 'number' && box.w > 0 ? box.w : cw;
                const h = typeof box.h === 'number' && box.h > 0 ? box.h : ch;
                box.nx = x / cw;
                box.ny = y / ch;
                box.nw = w / cw;
                box.nh = h / ch;
            }
        },
        applyBoxNormalizedToPx(box) {
            const cw = this.canvasSize.w || 1;
            const ch = this.canvasSize.h || 1;
            const nx = typeof box.nx === 'number' ? box.nx : 0;
            const ny = typeof box.ny === 'number' ? box.ny : 0;
            const nw = typeof box.nw === 'number' ? box.nw : 1;
            const nh = typeof box.nh === 'number' ? box.nh : 1;
            box.x = nx * cw;
            box.y = ny * ch;
            box.w = nw * cw;
            box.h = nh * ch;
        },
        ensureAllBoxesNormalized() {
            this.canvasBoxes.forEach(box => {
                this.ensureBoxNormalized(box);
                this.applyBoxNormalizedToPx(box);
            });
        },

        // --- Preview Renderer 초기화 ---
        initPreviewRenderer() {
            try {
                const canvas = document.getElementById('preview-render-canvas');
                if (!canvas || !window.PreviewRenderer || typeof window.PreviewRenderer.init !== 'function') {
                    return;
                }
                window.PreviewRenderer.init(canvas, this);
                if (typeof window.PreviewRenderer.setCanvasSize === 'function') {
                    window.PreviewRenderer.setCanvasSize(this.canvasSize);
                }
                if (typeof window.PreviewRenderer.syncBoxes === 'function') {
                    window.PreviewRenderer.syncBoxes(this.canvasBoxes);
                }
            } catch (err) {
                console.warn('[PreviewRenderer] init failed:', err);
            }
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

        setupInspectorMode() {
            const self = this;
            const TOOLTIP_MARGIN = 10;
            const TOOLTIP_WIDTH = 260;
            const TOOLTIP_HEIGHT_INSPECT = 80;
            const TOOLTIP_HEIGHT_DEV = 150;

            document.addEventListener('mousemove', (e) => {
                if (!self.isDevModeActive && !self.isDevModeFull) return;

                let target = e.target;

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

                    const tooltipHeight = self.isDevModeFull ? TOOLTIP_HEIGHT_DEV : TOOLTIP_HEIGHT_INSPECT;

                    let top = rect.top - tooltipHeight - TOOLTIP_MARGIN;
                    let left = rect.left + rect.width + TOOLTIP_MARGIN;

                    if (top < TOOLTIP_MARGIN) {
                        top = rect.bottom + TOOLTIP_MARGIN;
                    }

                    if (top + tooltipHeight > window.innerHeight - TOOLTIP_MARGIN) {
                        top = Math.max(TOOLTIP_MARGIN, window.innerHeight - tooltipHeight - TOOLTIP_MARGIN);
                    }

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

        // --- 레이어/슬롯 헬퍼 ---
        getColRole(colIdx) {
            return LAYER_COLUMN_ROLES[colIdx] || `col${colIdx}`;
        },
        getRowName(rowType) {
            const meta = LAYER_ROW_META[rowType];
            return meta ? meta.name : (rowType || '').toLowerCase();
        },
        getSlotKey(colIdx, rowType) {
            const role = this.getColRole(colIdx);
            const rowName = this.getRowName(rowType);
            return `${role}_${rowName}`;
        },
        getZIndexForCell(colIdx, rowType) {
            const meta = LAYER_ROW_META[rowType];
            const offset = meta ? meta.zOffset : 0;
            const base = (colIdx * 100) + 100;
            return base + offset;
        },
        getZIndex(colIdx, type) {
            return this.getZIndexForCell(colIdx, type);
        },
        findBoxBySlot(slotKey) {
            return this.canvasBoxes.find(b => b.slotKey === slotKey) || null;
        },

        createBoxForSlot(colIdx, rowType, color) {
            const colRole = this.getColRole(colIdx);
            const rowName = this.getRowName(rowType);
            const slotKey = this.getSlotKey(colIdx, rowType);
            const zIndex = this.getZIndexForCell(colIdx, rowType);

            const col = this.layerCols[colIdx] || null;
            const layerName = col ? col.name : `Layer ${colIdx + 1}`;
            const boxColor = color || (col && col.color) || '#ffffff';

            const cw = this.canvasSize.w;
            const ch = this.canvasSize.h;

            let x = 0;
            let y = 0;
            let w = cw;
            let h = ch;

            if (colRole === 'full') {
                x = 0;
                y = 0;
                w = cw;
                h = ch;
            } else if (colRole === 'high') {
                x = 0;
                y = 0;
                w = cw;
                h = Math.round(ch / 3);
            } else if (colRole === 'mid') {
                x = 0;
                y = Math.round(ch / 3);
                w = cw;
                h = Math.round(ch / 3);
            } else if (colRole === 'low') {
                x = 0;
                y = Math.round((2 * ch) / 3);
                w = cw;
                h = ch - y;
            }

            const box = {
                id: `box_${slotKey}_${Date.now()}`,
                colIdx,
                colId: col ? col.id : null,
                colRole,
                rowType,
                rowName,
                slotKey,
                layerName,
                color: boxColor,
                zIndex,
                layerBgColor: 'rgba(255,255,255,0.02)',
                x,
                y,
                w,
                h,
                isHidden: false
            };

            if (rowType === 'TXT') {
                box.textStyle = createDefaultTextStyle();
                box.textContent = DEFAULT_TEXT_MESSAGE;
            }

            this.ensureBoxNormalized(box);
            this.applyBoxNormalizedToPx(box);

            return box;
        },

        addLayerBox(colIdx, rowType, color) {
            const slotKey = this.getSlotKey(colIdx, rowType);
            const existing = this.findBoxBySlot(slotKey);

            if (existing) {
                this.setSelectedBoxId(existing.id);
                return;
            }

            const newBox = this.createBoxForSlot(colIdx, rowType, color);
            this.canvasBoxes = [...this.canvasBoxes, newBox];
            this.selectedBoxId = newBox.id;
            this.selectedClip = null;
        },

        // --- Preview/Canvas Logic ---
        setAspect(r) { 
            this.aspectRatio = r;
            this.updateCanvasSizeFromControls();
        },
        setResolution(labelOrKey) { 
            const str = (labelOrKey || '').toString().trim();
            const match = str.match(/^(\S+)/);
            const key = match ? match[1] : (str || this.resolution);
            this.resolution = key;
        },
        computeCanvasSize(aspectRatio) {
            const longSide = BASE_CANVAS_LONG_SIDE;
            let w, h;

            if (aspectRatio === '9:16') {
                h = longSide;
                w = Math.round(longSide * 9 / 16);
            } else if (aspectRatio === '1:1') {
                w = longSide;
                h = longSide;
            } else {
                w = longSide;
                h = Math.round(longSide * 9 / 16);
            }
            return { w, h };
        },
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
        getResolutionLabelFor(key) {
            const k = key || this.resolution || '4K';
            const size = this.computeResolutionSize(this.aspectRatio, k);
            return `${k} (${size.w} x ${size.h})`;
        },
        updateCanvasSizeFromControls() {
            const size = this.computeCanvasSize(this.aspectRatio);
            this.canvasSize = size;
            this.ensureAllBoxesNormalized();
            this.recalculateCanvasScale();
        },
        recalculateCanvasScale() {
            const wrapper = document.getElementById('preview-canvas-wrapper');
            if (!wrapper) return;

            const PADDING = 20;

            const innerW = wrapper.clientWidth - PADDING * 2;
            const innerH = wrapper.clientHeight - PADDING * 2;

            if (innerW <= 0 || innerH <= 0 || this.canvasSize.w <= 0 || this.canvasSize.h <= 0) {
                this.canvasScale = 1.0;
                return;
            }

            const scale = Math.min(
                innerW / this.canvasSize.w,
                innerH / this.canvasSize.h
            );

            this.canvasScale = (scale > 0 && Number.isFinite(scale)) ? scale : 1.0;
        },
        updateCanvasMouseCoord(e) {
            if (this.isBoxDragging) return;

            const wrapper = document.getElementById('preview-canvas-wrapper');
            const scaler = document.getElementById('preview-canvas-scaler');
            if (!wrapper || !scaler) return;

            const wRect = wrapper.getBoundingClientRect();
            const sRect = scaler.getBoundingClientRect();
            const PADDING = 20;

            const mouseXInWrapper = e.clientX - wRect.left;
            const mouseYInWrapper = e.clientY - wRect.top;

            const innerLeft = PADDING;
            const innerTop = PADDING;
            const innerRight = wRect.width - PADDING;
            const innerBottom = wRect.height - PADDING;

            this.isMouseOverCanvas =
                mouseXInWrapper >= innerLeft &&
                mouseXInWrapper <= innerRight &&
                mouseYInWrapper >= innerTop &&
                mouseYInWrapper <= innerBottom;

            this.mouseMarkerPos = {
                x: mouseXInWrapper,
                y: mouseYInWrapper
            };

            const canvasX = e.clientX - sRect.left;
            const canvasY = e.clientY - sRect.top;
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
            
            setup('main-left-resizer-v', 'leftPanelWidth', 180, 'w', false);
            setup('main-right-resizer-v', 'rightPanelWidth', 250, 'w', true); 
            setup('main-center-timeline-resizer-h', 'previewContainerHeight', 100, 'h', false);
        },
        
        setupCanvasScaler() {
            const wrapper = document.getElementById('preview-canvas-wrapper');
            if (!wrapper) return;
            
            const updateScale = () => {
                this.recalculateCanvasScale();
            };

            updateScale();

            if (window.ResizeObserver) {
                new ResizeObserver(updateScale).observe(wrapper);
            } else {
                window.addEventListener('resize', updateScale);
            }
        },

        // --- 모든 number 스핀박스: 마우스 휠로 증감 ---
        setupSpinWheel() {
            const handler = (event) => {
                const target = event.target;
                if (!(target instanceof HTMLInputElement)) return;
                if (target.type !== 'number') return;
                if (target.disabled || target.readOnly) return;

                event.preventDefault();

                const stepAttr = target.step;
                const step = stepAttr ? parseFloat(stepAttr) : 1;
                const dir = event.deltaY < 0 ? 1 : -1;

                let value = parseFloat(target.value);
                if (isNaN(value)) value = 0;

                const min = target.min !== '' ? parseFloat(target.min) : 0;
                const max = target.max !== '' ? parseFloat(target.max) : +Infinity;

                value += dir * step;
                if (value < min) value = min;
                if (value > max) value = max;

                target.value = value;

                const evt = new Event('input', { bubbles: true });
                target.dispatchEvent(evt);
            };

            document.addEventListener('wheel', handler, { passive: false });
            this._spinWheelHandler = handler;
        },

            // --- 레이어 설정 모달 ---
        openLayerConfig(boxId) {
            this.layerConfig.isOpen = true;
            this.layerConfig.boxId = boxId;
            this.setSelectedBoxId(boxId);
        },
        closeLayerConfig() {
            this.layerConfig.isOpen = false;
            this.layerConfig.boxId = null;
        },
        deleteLayerFromConfig() {
            const box = this.layerConfigBox;
            if (box) {
                this.removeBox(box.id);
            }
            this.closeLayerConfig();
        },

        // --- Core Model Methods (Clips/Boxes) ---
        removeBox(id) {
            this.canvasBoxes = this.canvasBoxes.filter(b => b.id !== id);
            if (this.selectedBoxId === id) this.selectedBoxId = null;
        },
        setSelectedBoxId(id) {
            // 토글이 아니라 "해당 id로 선택"만 수행
            // 선택 해제는 PreviewCanvas 바깥 클릭(@select-box="null")에서만 일어남
            this.selectedBoxId = id;
            this.selectedClip = null;
        },

        /**
         * 퍼센트(0~1) 좌표 기반 업데이트 (PreviewCanvas 드래그 전용)
         */
        updateBoxPositionNormalized(id, nx, ny, nw, nh) {
            const index = this.canvasBoxes.findIndex(b => b.id === id);
            if (index === -1) return;

            const cw = this.canvasSize.w || 1;
            const ch = this.canvasSize.h || 1;

            // 최소 크기: 논리 캔버스 기준 10px
            const minNw = 10 / cw;
            const minNh = 10 / ch;

            if (nw < minNw) nw = minNw;
            if (nh < minNh) nh = minNh;

            if (nx < 0) nx = 0;
            if (ny < 0) ny = 0;
            if (nx + nw > 1) nx = Math.max(0, 1 - nw);
            if (ny + nh > 1) ny = Math.max(0, 1 - nh);

            const x = nx * cw;
            const y = ny * ch;
            const w = nw * cw;
            const h = nh * ch;

            const oldBox = this.canvasBoxes[index];
            const box = {
                ...oldBox,
                x, y, w, h,
                nx, ny, nw, nh
            };

            const newBoxes = [...this.canvasBoxes];
            newBoxes[index] = box;
            this.canvasBoxes = newBoxes;
        },

        /**
         * 기존 px 기반 업데이트 (레이어 설정 모달/기타용)
         */
        updateBoxPosition(id, newX, newY, newW, newH, optNorm) {
            const index = this.canvasBoxes.findIndex(b => b.id === id);
            if (index === -1) return;

            const oldBox = this.canvasBoxes[index];
            const cw = this.canvasSize.w || 1;
            const ch = this.canvasSize.h || 1;

            let x, y, w, h;
            let nx, ny, nw, nh;

            if (optNorm && typeof optNorm === 'object') {
                nx = (typeof optNorm.nx === 'number')
                    ? optNorm.nx
                    : (typeof oldBox.nx === 'number' ? oldBox.nx : (oldBox.x || 0) / cw);
                ny = (typeof optNorm.ny === 'number')
                    ? optNorm.ny
                    : (typeof oldBox.ny === 'number' ? oldBox.ny : (oldBox.y || 0) / ch);
                nw = (typeof optNorm.nw === 'number')
                    ? optNorm.nw
                    : (typeof oldBox.nw === 'number' ? oldBox.nw : (oldBox.w || cw) / cw);
                nh = (typeof optNorm.nh === 'number')
                    ? optNorm.nh
                    : (typeof oldBox.nh === 'number' ? oldBox.nh : (oldBox.h || ch) / ch);

                const minNw = 10 / cw;
                const minNh = 10 / ch;

                if (nw < minNw) nw = minNw;
                if (nh < minNh) nh = minNh;

                if (nx < 0) nx = 0;
                if (ny < 0) ny = 0;
                if (nx + nw > 1) nx = Math.max(0, 1 - nw);
                if (ny + nh > 1) ny = Math.max(0, 1 - nh);

                x = nx * cw;
                y = ny * ch;
                w = nw * cw;
                h = nh * ch;
            } else {
                x = (typeof newX === 'number')
                    ? newX
                    : (typeof oldBox.x === 'number' ? oldBox.x : 0);
                y = (typeof newY === 'number')
                    ? newY
                    : (typeof oldBox.y === 'number' ? oldBox.y : 0);
                w = (typeof newW === 'number' && newW > 0)
                    ? newW
                    : (typeof oldBox.w === 'number' && oldBox.w > 0 ? oldBox.w : cw);
                h = (typeof newH === 'number' && newH > 0)
                    ? newH
                    : (typeof oldBox.h === 'number' && oldBox.h > 0 ? oldBox.h : ch);

                const minW = 10;
                const minH = 10;

                if (w < minW) w = minW;
                if (h < minH) h = minH;

                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x + w > cw) x = Math.max(0, cw - w);
                if (y + h > ch) y = Math.max(0, ch - h);

                nx = x / cw;
                ny = y / ch;
                nw = w / cw;
                nh = h / ch;
            }

            const box = {
                ...oldBox,
                x, y, w, h,
                nx, ny, nw, nh
            };

            const newBoxes = [...this.canvasBoxes];
            newBoxes[index] = box;
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

        saveLayerTemplate(name, matrixJson) {
            const newTpl = {
                id: `tpl_${Date.now()}`,
                name,
                cols: this.layerCols.map(c => ({ ...c })),
                matrixJson: matrixJson || null,
                createdAt: new Date().toISOString()
            };
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

createApp(AppRoot).mount('#app-vue-root');
