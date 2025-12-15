const { createApp, reactive, ref, onMounted, computed, nextTick } = Vue;

// 프리뷰 캔버스 기준 긴 변 픽셀 (해상도와 무관, 프리뷰 전용 메타값)
// ※ 실제 프리뷰 좌표계는 wrapper 크기에 맞춰 동적으로 결정된다.
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
            // canvasSize: 실제 프리뷰 px (wrapper 크기 기준, aspectRatio 유지)
            canvasSize: { w: 1920, h: 1080 }, 
            mouseCoord: { x: 0, y: 0 }, 
            isMouseOverCanvas: false,
            // canvasScale: transform:scale 대신 항상 1.0 유지 (좌표계 = 실제 px)
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
        // 프리뷰 스케일러: transform scale 제거, translate만 사용 (좌표계 = 실제 px)
        canvasScalerStyle() {
            return {
                width: this.canvasSize.w + 'px',
                height: this.canvasSize.h + 'px',
                backgroundColor: '#000',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
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

        // 해상도 레이블 계산용 (프리뷰 좌표계와는 별개, 메타정보)
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

        // wrapper 크기 + aspectRatio 기반으로 실제 canvasSize(px) 재계산
        recalculateCanvasSizeFromWrapper() {
            const wrapper = document.getElementById('preview-canvas-wrapper');
            if (!wrapper) return;

            const PADDING = 20;
            const innerW = wrapper.clientWidth - PADDING * 2;
            const innerH = wrapper.clientHeight - PADDING * 2;

            if (innerW <= 0 || innerH <= 0) return;

            let arW = 16;
            let arH = 9;
            const parts = (this.aspectRatio || '16:9').split(':');
            const pw = parseFloat(parts[0]);
            const ph = parseFloat(parts[1]);
            if (pw > 0 && ph > 0) {
                arW = pw;
                arH = ph;
            }
            const targetRatio = arW / arH;
            const wrapperRatio = innerW / innerH;

            let w, h;
            if (wrapperRatio > targetRatio) {
                // wrapper가 더 넓음 → 높이에 맞추고 좌우 레터박스
                h = innerH;
                w = Math.round(h * targetRatio);
            } else {
                // wrapper가 더 좁음 → 너비에 맞추고 상하 레터박스
                w = innerW;
                h = Math.round(w / targetRatio);
            }

            this.canvasSize = { w, h };
            this.canvasScale = 1.0; // 좌표계 = 실제 px
        },

        updateCanvasSizeFromControls() {
            // 해상도/비율 변경 시, wrapper 기준으로 실제 canvasSize를 다시 계산
            this.recalculateCanvasSizeFromWrapper();
            this.ensureAllBoxesNormalized();
        },

        // 기존 recalculateCanvasScale 은 canvasSize 재계산을 래핑하는 역할만 하도록 단순화
        recalculateCanvasScale() {
            this.recalculateCanvasSizeFromWrapper();
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
            const scale = this.canvasScale || 1.0; // 현재는 항상 1.0 이지만 안전용

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
                    self.ensureAllBoxesNormalized();
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
            
            const updateLayout = () => {
                this.recalculateCanvasScale();
                this.ensureAllBoxesNormalized();
            };

            updateLayout();

            if (window.ResizeObserver) {
                new ResizeObserver(updateLayout).observe(wrapper);
            } else {
                window.addEventListener('resize', updateLayout);
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

            // 최소 크기: 논리 캔버스 기준 20px
            const minNw = 20 / cw;
            const minNh = 20 / ch;

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
         * px 기반 업데이트 (PreviewCanvas, 레이어 설정 모달 등에서 사용)
         * → 항상 nx,ny,nw,nh(0~1)를 함께 갱신
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

                const minNw = 20 / cw;
                const minNh = 20 / ch;

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

                const minW = 20;
                const minH = 20;

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
            if (this.selectedClip && this.selectedClip.id === id) {
                this.selectedClip = null;
            }
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
            examples: [
                'data-action="py:nav_explore"'
            ]
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
            examples: [
                'data-action="js:openProjectModal"'
            ]
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
            logic: 'hover 시 자산 관련 서브 메뉴를 표시. 직접적인 py 호출은 없음.',
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
            examples: [
                'data-action="py:open_asset_manager"'
            ]
        },
        'header-nav-settings-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 설정 탭 버튼',
            io: {
                input: ['click'],
                output: ['backend.nav_settings']
            },
            logic: '클릭 시 Python backend.nav_settings 호출 (설정 화면 요청).',
            py_func: 'nav_settings',
            js_action: null,
            events: ['click'],
            affects: ['main-right-panel'],
            examples: [
                'data-action="py:nav_settings"'
            ]
        },
        'header-nav-research-btn': {
            module: 'header.nav',
            desc: '상단 네비게이션 - 연구 탭 버튼',
            io: {
                input: ['click'],
                output: ['backend.nav_research']
            },
            logic: '클릭 시 Python backend.nav_research 호출 (연구/실험 화면 요청).',
            py_func: 'nav_research',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:nav_research"'
            ]
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
            logic: '클릭 시 Inspect 모드를 토글. Dev 모드와는 상호 배타적.',
            py_func: null,
            js_action: 'toggleDevModeActive',
            events: ['click'],
            affects: ['dev-overlay-root'],
            examples: [
                'data-action="js:toggleDevModeActive"'
            ]
        },
        'header-dev-mode-btn': {
            module: 'header.dev',
            desc: 'Dev(개발자) 모드 토글 버튼',
            io: {
                input: ['click'],
                output: ['body.classList += dev-mode-full']
            },
            logic: '클릭 시 Dev 모드를 토글. Inspect 모드와는 상호 배타적.',
            py_func: null,
            js_action: 'toggleDevModeFull',
            events: ['click'],
            affects: ['dev-overlay-root'],
            examples: [
                'data-action="js:toggleDevModeFull"'
            ]
        },

        /* -----------------------------------------------------
         * Header - Window Controls
         * --------------------------------------------------- */
        'header-window-controls-container': {
            module: 'header.window',
            desc: '윈도우 컨트롤(최소화/최대화/닫기) 버튼 컨테이너',
            io: { input: [], output: [] },
            logic: '각 버튼은 Python backend를 통해 실제 OS 윈도우 제어.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'header-window-min-btn',
                'header-window-max-btn',
                'header-window-close-btn'
            ],
            examples: []
        },
        'header-window-min-btn': {
            module: 'header.window',
            desc: '윈도우 최소화 버튼',
            io: {
                input: ['click'],
                output: ['backend.win_min']
            },
            logic: '클릭 시 Python backend.win_min 호출.',
            py_func: 'win_min',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:win_min"'
            ]
        },
        'header-window-max-btn': {
            module: 'header.window',
            desc: '윈도우 최대화/복원 토글 버튼',
            io: {
                input: ['click'],
                output: ['backend.win_max']
            },
            logic: '클릭 시 Python backend.win_max 호출 (최대화/복원 토글).',
            py_func: 'win_max',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:win_max"'
            ]
        },
        'header-window-close-btn': {
            module: 'header.window',
            desc: '윈도우 닫기(앱 종료) 버튼',
            io: {
                input: ['click'],
                output: ['backend.win_close']
            },
            logic: '클릭 시 Python backend.win_close 호출 (앱 종료).',
            py_func: 'win_close',
            js_action: null,
            events: ['click'],
            affects: [],
            examples: [
                'data-action="py:win_close"'
            ]
        },

        /* -----------------------------------------------------
         * Left Panel (Assets)
         * --------------------------------------------------- */
        'main-left-panel': {
            module: 'panel.left',
            desc: '좌측 패널(자산 영역) 컨테이너',
            io: { input: [], output: [] },
            logic: '자산 목록 및 자산 추가 버튼을 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['main-left-assets-list'],
            examples: []
        },
        'main-left-header-bar': {
            module: 'panel.left',
            desc: '좌측 패널 헤더 바 (제목 및 + 버튼)',
            io: { input: [], output: [] },
            logic: '"자산(Assets)" 라벨과 자산 추가 버튼을 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['main-left-assets-add-btn'],
            examples: []
        },
        'main-left-assets-add-btn': {
            module: 'panel.left.assets',
            desc: '좌측 패널 - 자산 추가(Import) 버튼',
            io: {
                input: ['click'],
                output: ['backend.import_asset']
            },
            logic: '클릭 시 Python backend.import_asset 호출 (새 자산 가져오기).',
            py_func: 'import_asset',
            js_action: null,
            events: ['click'],
            affects: ['main-left-assets-list'],
            examples: [
                'data-action="py:import_asset"'
            ]
        },
        'main-left-assets-list': {
            module: 'panel.left.assets',
            desc: '좌측 패널 - 자산 리스트(플레이스홀더)',
            io: { input: [], output: [] },
            logic: '초기에는 "자산 목록이 비어있습니다." 플레이스홀더를 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'main-left-resizer-v': {
            module: 'panel.left.resizer',
            desc: '좌측 패널 너비 조절 리사이저',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['state.leftPanelWidth 변경']
            },
            logic: '드래그하여 좌측 패널의 너비를 조절.',
            py_func: null,
            js_action: 'resizePanelLeft',
            events: ['mousedown'],
            affects: ['main-left-panel'],
            examples: [
                'data-action="js:resizePanelLeft"'
            ]
        },

        /* -----------------------------------------------------
         * Center Panel / Preview
         * --------------------------------------------------- */
        'main-center-panel': {
            module: 'panel.center',
            desc: '중앙 패널(프리뷰 + 타임라인) 컨테이너',
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
            desc: '프리뷰 전체 컨테이너 (툴바 + 캔버스)',
            io: { input: [], output: [] },
            logic: '상단 툴바와 하단 실제 캔버스를 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'preview-toolbar-panel',
                'preview-canvas-wrapper'
            ],
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
            affects: [
                'preview-toolbar-ratio-dropdown',
                'preview-toolbar-resolution-dropdown',
                'preview-toolbar-snap-toggle',
                'preview-toolbar-coord-box'
            ],
            examples: []
        },
        'preview-toolbar-ratio-dropdown': {
            module: 'preview.toolbar',
            desc: '프리뷰 - 캔버스 비율 선택 드롭다운',
            io: {
                input: ['select'],
                output: ['state.aspectRatio 변경']
            },
            logic: '선택한 비율(16:9, 9:16, 1:1)에 따라 캔버스 가로세로 비를 조정.',
            py_func: null,
            js_action: 'setAspect',
            events: ['change'],
            affects: ['preview-canvas-scaler'],
            examples: []
        },
        'preview-toolbar-coord-box': {
            module: 'preview.toolbar',
            desc: '프리뷰 - 마우스 좌표 표시 박스',
            io: {
                input: ['mousemove (on canvas)'],
                output: ['coord 텍스트 업데이트']
            },
            logic: '프리뷰 캔버스 내 마우스 위치를 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-toolbar-coord-label'],
            examples: []
        },
        'preview-toolbar-coord-label': {
            module: 'preview.toolbar',
            desc: '프리뷰 - 마우스 좌표 라벨 (텍스트)',
            io: { input: [], output: [] },
            logic: 'Vue 바인딩으로 mouseCoord.x, mouseCoord.y 값을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-toolbar-resolution-dropdown': {
            module: 'preview.toolbar',
            desc: '프리뷰 - 해상도 선택 드롭다운',
            io: {
                input: ['select'],
                output: ['state.resolution 변경']
            },
            logic: '8K/6K/4K/3K/2K 등 해상도 프리셋 변경.',
            py_func: null,
            js_action: 'setResolution',
            events: ['change'],
            affects: ['preview-canvas-scaler'],
            examples: []
        },
        'preview-toolbar-snap-toggle': {
            module: 'preview.toolbar',
            desc: '프리뷰 - SNAP(자석) 토글 스위치',
            io: {
                input: ['click'],
                output: ['state.isMagnet 토글']
            },
            logic: '캔버스 내 박스 이동/정렬 시 스냅 기능 온/오프.',
            py_func: null,
            js_action: 'toggleSnapMagnet',
            events: ['click'],
            affects: ['preview-canvas-scaler'],
            examples: [
                'data-action="js:toggleSnapMagnet"'
            ]
        },
        'preview-canvas-wrapper': {
            module: 'preview.canvas',
            desc: '프리뷰 캔버스 래퍼 (검정 배경 + 중앙 정렬)',
            io: {
                input: ['mousemove', 'mouseleave'],
                output: ['mouseCoord, isMouseOverCanvas 업데이트']
            },
            logic: 'updateCanvasMouseCoord()의 기준이 되는 영역.',
            py_func: null,
            js_action: 'updateCanvasMouseCoord',
            events: ['mousemove', 'mouseleave'],
            affects: ['preview-toolbar-coord-box', 'mouseMarkerPos'],
            examples: []
        },
        'preview-ruler-h': {
            module: 'preview.ruler',
            desc: '수평 룰러 컨테이너',
            io: { input: [], output: [] },
            logic: 'preview 상단의 수평 ruler-line 컴포넌트를 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-ruler-v': {
            module: 'preview.ruler',
            desc: '수직 룰러 컨테이너',
            io: { input: [], output: [] },
            logic: 'preview 좌측의 수직 ruler-line 컴포넌트를 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-canvas-viewport': {
            module: 'preview.canvas',
            desc: '프리뷰 캔버스 뷰포트(스크롤/클리핑 영역)',
            io: { input: [], output: [] },
            logic: '실제 캔버스 스케일러를 감싸는 뷰포트 역할.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-canvas-scaler'],
            examples: []
        },
        'preview-canvas-scaler': {
            module: 'preview.canvas',
            desc: '프리뷰 캔버스 스케일러 (실제 3840x2160 등 캔버스)',
            io: {
                input: ['ResizeObserver(wrapper)'],
                output: ['state.canvasScale 변경']
            },
            logic: 'wrapper 크기에 맞춰 Canvas를 scale하여 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-canvas-wrapper'],
            examples: []
        },
        'preview-guide-h': {
            module: 'preview.guides',
            desc: '프리뷰 캔버스 수평 가이드 라인',
            io: { input: [], output: [] },
            logic: '캔버스 중앙 Y축 기준 가이드라인(십자선) 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-guide-v': {
            module: 'preview.guides',
            desc: '프리뷰 캔버스 수직 가이드 라인',
            io: { input: [], output: [] },
            logic: '캔버스 중앙 X축 기준 가이드라인(십자선) 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'preview-canvas-overlay-root': {
            module: 'preview.canvas.overlay',
            desc: '프리뷰 캔버스 상의 선택 가능한 박스들을 감싸는 오버레이 루트',
            io: {
                input: ['click'],
                output: ['select-box(null) emit (선택 해제)', 'contextMenu 닫힘']
            },
            logic: '오버레이 빈 공간 클릭 시 컨텍스트 메뉴를 닫고 선택을 해제.',
            py_func: null,
            js_action: null,
            events: ['click'],
            affects: ['preview-canvas-box-{id}', 'panel-right-props-root'],
            examples: []
        },
        'preview-canvas-box-{id}': {
            module: 'preview.canvas.box',
            desc: '프리뷰 캔버스 상의 개별 레이어 박스 (드래그/리사이즈/컨텍스트 메뉴)',
            io: {
                input: ['mousedown', 'drag', 'resize', 'contextmenu'],
                output: [
                    'select-box(boxId) emit',
                    'updateBoxPosition(boxId, dx, dy, w, h) 호출(부모)',
                    'remove-box emit(삭제 시)'
                ]
            },
            logic: 'interact.js를 사용해 위치/크기를 조정하고, 선택/삭제/컨텍스트 메뉴를 통해 상호작용.',
            py_func: null,
            js_action: 'selectCanvasBox',
            events: ['mousedown', 'drag', 'resize', 'contextmenu'],
            affects: ['preview-canvas-scaler', 'panel-right-props-root'],
            examples: [
                'data-action="js:selectCanvasBox"'
            ]
        },
        'preview-canvas-context-menu': {
            module: 'preview.canvas.context',
            desc: '프리뷰 캔버스 박스용 컨텍스트 메뉴 루트',
            io: {
                input: ['click(메뉴 항목)'],
                output: ['remove-box emit', '추후: zIndex 조정']
            },
            logic: '박스 우클릭 시 표시되며, 맨 위로/삭제 등 액션을 제공.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['preview-canvas-box-{id}'],
            examples: []
        },
        'preview-canvas-context-top-btn': {
            module: 'preview.canvas.context',
            desc: '선택 박스를 맨 위로 올리는 컨텍스트 메뉴 항목 (예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '향후 선택된 박스의 zIndex를 최상단으로 올리는 기능에 연결 예정.',
            py_func: null,
            js_action: 'canvasContextBringToFront',
            events: ['click'],
            affects: ['preview-canvas-box-{id}'],
            examples: [
                'data-action="js:canvasContextBringToFront"'
            ]
        },
        'preview-canvas-context-delete-btn': {
            module: 'preview.canvas.context',
            desc: '선택 박스를 삭제하는 컨텍스트 메뉴 항목',
            io: {
                input: ['click'],
                output: ['remove-box emit → vm.removeBox 호출']
            },
            logic: '선택된 박스를 프리뷰 캔버스에서 제거.',
            py_func: null,
            js_action: 'canvasContextDelete',
            events: ['click'],
            affects: ['preview-canvas-box-{id}', 'panel-right-props-root'],
            examples: [
                'data-action="js:canvasContextDelete"'
            ]
        },

        /* -----------------------------------------------------
         * Center Panel - Timeline Resizer
         * --------------------------------------------------- */
        'main-center-timeline-resizer-h': {
            module: 'panel.center.timeline',
            desc: '프리뷰/타임라인 사이 세로 리사이저',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['previewContainerHeight, timelineContainerHeight 변경']
            },
            logic: '드래그하여 프리뷰/타임라인 영역의 높이 비율을 조절.',
            py_func: null,
            js_action: 'resizePanelCenter',
            events: ['mousedown'],
            affects: ['preview-main-container', 'timeline-panel'],
            examples: [
                'data-action="js:resizePanelCenter"'
            ]
        },

        /* -----------------------------------------------------
         * Timeline Panel
         * --------------------------------------------------- */
        'timeline-main-panel': {
            module: 'timeline.panel',
            desc: '타임라인 전체 패널(헤더 + 퀵바 + 트랙/클립 영역)',
            io: {
                input: ['wheel'],
                output: ['zoom 변경 또는 수평 스크롤']
            },
            logic: '휠/Shift+휠로 줌/스크롤 조작을 처리 (handleWheel).',
            py_func: null,
            js_action: 'timelineWheelScroll',
            events: ['wheel'],
            affects: ['timeline-scroll-container'],
            examples: [
                'data-action="js:timelineWheelScroll"'
            ]
        },
        'timeline-header-bar': {
            module: 'timeline.header',
            desc: '타임라인 상단 헤더 (접기, 타임코드, 줌 슬라이더)',
            io: { input: [], output: [] },
            logic: '좌측에 접기 버튼과 타임코드, 우측에 줌 슬라이더를 배치.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'timeline-header-collapse-btn',
                'timeline-header-timecode-label',
                'timeline-header-zoom-slider'
            ],
            examples: []
        },
        'timeline-header-collapse-btn': {
            module: 'timeline.header',
            desc: '타임라인 접기/펼치기 토글 버튼',
            io: {
                input: ['click'],
                output: ['vm.isTimelineCollapsed 토글', 'preview-main-container 높이 변경']
            },
            logic: '타임라인 패널을 접거나 펼쳐서 프리뷰 영역 높이를 조정.',
            py_func: null,
            js_action: 'toggleTimelineCollapse',
            events: ['click'],
            affects: ['timeline-main-panel', 'preview-main-container'],
            examples: [
                'data-action="js:toggleTimelineCollapse"'
            ]
        },
        'timeline-header-timecode-label': {
            module: 'timeline.header',
            desc: '현재 플레이헤드 시간을 표시하는 타임코드 라벨',
            io: { input: [], output: [] },
            logic: 'vm.currentTime을 HH:MM:SS:FF 포맷으로 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-header-zoom-slider': {
            module: 'timeline.header',
            desc: '타임라인 줌 슬라이더',
            io: {
                input: ['input'],
                output: ['vm.zoom 변경']
            },
            logic: '줌 레벨(10~100)을 변경하여 타임축 단위(초당 px)를 조절.',
            py_func: null,
            js_action: 'timelineChangeZoom',
            events: ['input'],
            affects: ['timeline-time-ruler-row', 'timeline-clip-{id}'],
            examples: [
                'data-action="js:timelineChangeZoom"'
            ]
        },
        'timeline-toolbar-quick-bar': {
            module: 'timeline.toolbar',
            desc: '타임라인 퀵 툴바 (Cut/Delete/Magnet/Ripple/Normalize/Volume)',
            io: { input: [], output: [] },
            logic: '타임라인 편집에 자주 쓰이는 도구들을 묶어 둔 퀵바.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'timeline-tool-cut-btn',
                'timeline-tool-delete-btn',
                'timeline-tool-magnet-btn',
                'timeline-tool-ripple-btn',
                'timeline-tool-normalize-btn',
                'timeline-tool-volume-icon'
            ],
            examples: []
        },
        'timeline-tool-cut-btn': {
            module: 'timeline.toolbar',
            desc: '타임라인 클립 자르기(Cut) 도구 버튼 (예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '현재는 UI만 존재. 추후 선택된 클립을 분할하는 기능 연결 예정.',
            py_func: null,
            js_action: 'timelineToolCut',
            events: ['click'],
            affects: [],
            examples: [
                'data-action="js:timelineToolCut"'
            ]
        },
        'timeline-tool-delete-btn': {
            module: 'timeline.toolbar',
            desc: '타임라인 클립 삭제(Delete) 도구 버튼 (예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '현재는 UI만 존재. 추후 선택된 클립을 삭제하는 기능 연결 예정.',
            py_func: null,
            js_action: 'timelineToolDelete',
            events: ['click'],
            affects: [],
            examples: [
                'data-action="js:timelineToolDelete"'
            ]
        },
        'timeline-tool-magnet-btn': {
            module: 'timeline.toolbar',
            desc: '타임라인 스냅(마그넷) 토글 버튼',
            io: {
                input: ['click'],
                output: ['vm.isMagnet 토글']
            },
            logic: '클립/플레이헤드 이동/리사이즈 시 다른 클립 경계나 플레이헤드에 스냅 여부를 제어.',
            py_func: null,
            js_action: 'toggleTimelineMagnet',
            events: ['click'],
            affects: ['timeline-clip-{id}', 'timeline-playhead-handle'],
            examples: [
                'data-action="js:toggleTimelineMagnet"'
            ]
        },
        'timeline-tool-ripple-btn': {
            module: 'timeline.toolbar',
            desc: '타임라인 오토 리플(Auto Ripple) 토글 버튼',
            io: {
                input: ['click'],
                output: ['vm.isAutoRipple 토글']
            },
            logic: '클립 편집 시 이후 클립들을 자동으로 당기거나 밀지 여부를 제어 (로직은 추후 구현 가능).',
            py_func: null,
            js_action: 'toggleTimelineRipple',
            events: ['click'],
            affects: ['timeline-clip-{id}'],
            examples: [
                'data-action="js:toggleTimelineRipple"'
            ]
        },
        'timeline-tool-normalize-btn': {
            module: 'timeline.toolbar',
            desc: 'Normalize 버튼 (오디오 정규화 기능, 예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '클릭 시 선택된 오디오 클립 볼륨을 정규화하는 기능을 연결할 예정.',
            py_func: null,
            js_action: 'timelineNormalizeAudio',
            events: ['click'],
            affects: ['timeline-clip-{id}'],
            examples: [
                'data-action="js:timelineNormalizeAudio"'
            ]
        },
        'timeline-tool-volume-icon': {
            module: 'timeline.toolbar',
            desc: '타임라인 전체 볼륨/볼륨 컨트롤 아이콘 (예약/미구현)',
            io: {
                input: ['click'],
                output: []
            },
            logic: '전체 타임라인 오디오 레벨을 조정하는 UI로 확장 가능.',
            py_func: null,
            js_action: 'timelineVolumeControl',
            events: ['click'],
            affects: [],
            examples: [
                'data-action="js:timelineVolumeControl"'
            ]
        },
        'timeline-scroll-container': {
            module: 'timeline.scroll',
            desc: '트랙/클립 및 시간 룰러를 포함하는 스크롤 영역',
            io: {
                input: ['dragover', 'drop', 'wheel'],
                output: ['스크롤 위치 변경', '클립 추가(addClipFromDrop)']
            },
            logic: '에셋을 드래그&드롭하여 새 클립을 생성하고, 수평 스크롤을 담당.',
            py_func: null,
            js_action: 'timelineDropAsset',
            events: ['dragover', 'drop'],
            affects: ['timeline-clip-{id}', 'timeline-track-row-{id}'],
            examples: [
                'data-action="js:timelineDropAsset"'
            ]
        },
        'timeline-track-column': {
            module: 'timeline.track',
            desc: '타임라인 좌측 트랙 리스트 컬럼',
            io: { input: [], output: [] },
            logic: '각 트랙 이름과 색상을 표시하고, 드래그로 순서 변경 가능.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['timeline-track-row-{id}'],
            examples: []
        },
        'timeline-track-header-row': {
            module: 'timeline.track',
            desc: 'TRACKS 헤더 행',
            io: { input: [], output: [] },
            logic: '트랙 컬럼 상단 타이틀을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-track-row-{id}': {
            module: 'timeline.track',
            desc: '각 타임라인 트랙 행 (드래그로 순서 변경)',
            io: {
                input: ['dragstart', 'dragenter', 'dragend'],
                output: ['vm.moveTrack(fromIndex, toIndex) 호출']
            },
            logic: '드래그 앤 드롭으로 트랙 순서를 재배치.',
            py_func: null,
            js_action: 'timelineTrackReorder',
            events: ['dragstart', 'dragenter', 'dragend'],
            affects: ['timeline-lane-row-{id}'],
            examples: [
                'data-action="js:timelineTrackReorder"'
            ]
        },
        'timeline-track-name-{id}': {
            module: 'timeline.track',
            desc: '트랙 이름 텍스트 (contenteditable)',
            io: {
                input: ['text edit'],
                output: ['track.name 변경 (직접 DOM 편집)']
            },
            logic: '사용자가 트랙 이름을 직접 수정할 수 있도록 contenteditable로 노출.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-lane-container': {
            module: 'timeline.lane',
            desc: '우측 트랙 레인 및 클립/플레이헤드 영역',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['vm.currentTime 변경 (플레이헤드 이동)']
            },
            logic: '상단 룰러와 하단 클립 레인이 포함된 실제 타임라인 영역. 클릭/드래그로 플레이헤드를 이동.',
            py_func: null,
            js_action: 'timelineDragPlayhead',
            events: ['mousedown'],
            affects: ['timeline-playhead-line', 'timeline-playhead-handle'],
            examples: [
                'data-action="js:timelineDragPlayhead"'
            ]
        },
        'timeline-time-ruler-row': {
            module: 'timeline.ruler',
            desc: '타임라인 상단 시간 눈금 룰러',
            io: { input: [], output: [] },
            logic: '줌 레벨에 따라 일정 간격(5초 단위)의 시간 눈금을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-lane-row-{id}': {
            module: 'timeline.lane',
            desc: '각 트랙에 대응하는 클립 레인 행',
            io: { input: [], output: [] },
            logic: '해당 트랙에 속한 클립들을 수평으로 배치하는 영역.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['timeline-clip-{id}'],
            examples: []
        },
        'timeline-clip-{id}': {
            module: 'timeline.clip',
            desc: '각 트랙에 배치된 개별 클립 박스 (드래그/리사이즈 가능)',
            io: {
                input: ['click', 'drag', 'resize'],
                output: ['vm.setSelectedClip', 'vm.moveClip', 'vm.updateClip']
            },
            logic: '클립의 시작 시간/길이를 시각적으로 표현하고, 드래그/리사이즈를 통해 값을 변경.',
            py_func: null,
            js_action: 'selectTimelineClip',
            events: ['click', 'drag', 'resize'],
            affects: ['timeline-main-panel'],
            examples: [
                'data-action="js:selectTimelineClip"'
            ]
        },
        'timeline-playhead-line': {
            module: 'timeline.playhead',
            desc: '현재 재생 위치를 나타내는 수직 플레이헤드 라인',
            io: { input: [], output: [] },
            logic: 'vm.currentTime을 기준으로 x좌표를 계산하여 라인을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'timeline-playhead-handle': {
            module: 'timeline.playhead',
            desc: '플레이헤드 이동을 위한 삼각형 핸들',
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['vm.currentTime 변경']
            },
            logic: '룰러/핸들을 드래그하여 재생 위치를 변경. 스냅 옵션(isMagnet)에 따라 클립 경계에 스냅.',
            py_func: null,
            js_action: 'timelineDragPlayhead',
            events: ['mousedown'],
            affects: ['timeline-playhead-line'],
            examples: [
                'data-action="js:timelineDragPlayhead"'
            ]
        },

        /* -----------------------------------------------------
         * Right Panel - Container & Resizer
         * --------------------------------------------------- */
        'main-right-panel': {
            module: 'panel.right',
            desc: '우측 패널(레이어/프로퍼티/이펙트) 컨테이너',
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
            io: {
                input: ['mousedown', 'mousemove', 'mouseup'],
                output: ['state.rightPanelWidth 변경']
            },
            logic: '드래그하여 우측 패널의 너비를 조절.',
            py_func: null,
            js_action: 'resizePanelRight',
            events: ['mousedown'],
            affects: ['main-right-panel'],
            examples: [
                'data-action="js:resizePanelRight"'
            ]
        },
        'main-right-vue-root': {
            module: 'panel.right',
            desc: '우측 패널 Vue 루트(LayerPanel, PropertiesPanel 등)',
            io: { input: [], output: [] },
            logic: 'LayerPanel, PropertiesPanel 컴포넌트를 렌더링하는 컨테이너.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },

        /* -----------------------------------------------------
         * Right Panel - LayerPanel
         * --------------------------------------------------- */
        'panel-right-layer-root': {
            module: 'panel.right.layer',
            desc: '우측 패널 - 레이어 관리 전체 영역',
            io: { input: [], output: [] },
            logic: '레이어 컬럼 매트릭스, 컬럼 추가, 템플릿 저장 및 색상 선택 컨텍스트 메뉴 포함.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'panel-right-layer-header',
                'panel-right-layer-matrix-container',
                'panel-right-layer-save-template-btn'
            ],
            examples: []
        },
        'panel-right-layer-header': {
            module: 'panel.right.layer',
            desc: '우측 레이어 패널 헤더 (레이어 관리 / 접기 토글)',
            io: {
                input: ['click'],
                output: ['isCollapsed 토글']
            },
            logic: '클릭 시 레이어 매트릭스 영역을 접거나 펼침.',
            py_func: null,
            js_action: 'toggleLayerPanelCollapse',
            events: ['click'],
            affects: ['panel-right-layer-body'],
            examples: [
                'data-action="js:toggleLayerPanelCollapse"'
            ]
        },
        'panel-right-layer-body': {
            module: 'panel.right.layer',
            desc: '레이어 패널 본문 컨테이너',
            io: { input: [], output: [] },
            logic: '매트릭스, 컬럼 추가 버튼, 템플릿 저장 버튼을 포함하는 본문 래퍼.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-mainname-badge': {
            module: 'panel.right.layer',
            desc: '현재 저장된 레이어 템플릿 메인 이름 배지',
            io: { input: [], output: [] },
            logic: 'vm.layerMainName 값이 존재할 때만 표시되며, 현재 레이아웃 이름을 나타냄.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-matrix-label': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스 설명 라벨',
            io: { input: [], output: [] },
            logic: '"매트릭스 (우클릭: 색상)" 고정 텍스트.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-addcol-btn': {
            module: 'panel.right.layer',
            desc: '새 레이어 컬럼 추가 버튼',
            io: {
                input: ['click'],
                output: ['vm.layerCols.push(...)']
            },
            logic: '레이어 컬럼 목록에 새 컬럼을 추가.',
            py_func: null,
            js_action: 'layerAddColumn',
            events: ['click'],
            affects: ['panel-right-layer-matrix-container'],
            examples: [
                'data-action="js:layerAddColumn"'
            ]
        },
        'panel-right-layer-matrix-container': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스(컬럼 헤더 + EFF/TXT/BG 셀) 스크롤 컨테이너',
            io: { input: [], output: [] },
            logic: '컬럼 헤더 및 각 행(EFF/TXT/BG)을 가로 스크롤 가능하게 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'panel-right-layer-col-{id}',
                'panel-right-layer-row-{id}',
                'panel-right-layer-cell-{id}'
            ],
            examples: []
        },
        'panel-right-layer-col-{id}': {
            module: 'panel.right.layer',
            desc: '개별 레이어 컬럼 헤더 셀',
            io: {
                input: ['contextmenu', 'input(내부 input)'],
                output: ['컬럼 이름 변경', '컬럼 색상 변경']
            },
            logic: '우클릭으로 색상 선택 메뉴를 열고, input으로 컬럼 이름을 수정.',
            py_func: null,
            js_action: null,
            events: ['contextmenu'],
            affects: [
                'panel-right-layer-col-name-{id}',
                'panel-right-layer-color-menu'
            ],
            examples: []
        },
        'panel-right-layer-col-name-{id}': {
            module: 'panel.right.layer',
            desc: '레이어 컬럼 이름 입력 필드',
            io: {
                input: ['input'],
                output: ['vm.layerCols[].name 변경']
            },
            logic: '컬럼의 표시 이름을 변경.',
            py_func: null,
            js_action: null,
            events: ['input'],
            affects: [],
            examples: []
        },
        'panel-right-layer-row-{id}': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스 행(EFF/TXT/BG)',
            io: { input: [], output: [] },
            logic: '각 행 타입에 해당하는 셀들을 수평으로 배치.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['panel-right-layer-cell-{id}'],
            examples: []
        },
        'panel-right-layer-rowlabel-{id}': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스 행 레이블(EFF/TXT/BG)',
            io: { input: [], output: [] },
            logic: '행 타입 이름(Effect/Text/BG)을 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-layer-cell-{id}': {
            module: 'panel.right.layer',
            desc: '레이어 매트릭스의 개별 셀 (컬럼 x 행 타입)',
            io: {
                input: ['click'],
                output: ['vm.addLayerBox(colIdx, type, color) 호출']
            },
            logic: '클릭 시 해당 컬럼/타입에 대응하는 캔버스 박스를 추가.',
            py_func: null,
            js_action: 'layerAddBox',
            events: ['click'],
            affects: ['preview-canvas-scaler'],
            examples: [
                'data-action="js:layerAddBox"'
            ]
        },
        'panel-right-layer-save-template-btn': {
            module: 'panel.right.layer',
            desc: '레이어 템플릿 저장 버튼',
            io: {
                input: ['click'],
                output: ['Swal.prompt → vm.saveLayerTemplate(name) 호출']
            },
            logic: 'SweetAlert2 팝업으로 템플릿 이름을 받아 vm.saveLayerTemplate(name)을 호출.',
            py_func: null,
            js_action: 'layerSaveTemplate',
            events: ['click'],
            affects: ['panel-right-layer-mainname-badge'],
            examples: [
                'data-action="js:layerSaveTemplate"'
            ]
        },
        'panel-right-layer-color-menu': {
            module: 'panel.right.layer',
            desc: '레이어 컬럼 색상 선택 컨텍스트 메뉴',
            io: {
                input: ['click(색상 스와치)'],
                output: ['해당 컬럼 color 변경']
            },
            logic: '우클릭한 컬럼에 대해 COLORS 팔레트 중 하나를 선택.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['panel-right-layer-col-{id}'],
            examples: []
        },
        'panel-right-layer-color-swatch-{id}': {
            module: 'panel.right.layer',
            desc: '팔레트 내 개별 색상 스와치',
            io: {
                input: ['click'],
                output: ['선택한 컬럼의 색상 변경']
            },
            logic: 'contextMenu.colId에 해당하는 컬럼의 color 필드를 업데이트.',
            py_func: null,
            js_action: null,
            events: ['click'],
            affects: ['panel-right-layer-col-{id}'],
            examples: []
        },

        /* -----------------------------------------------------
         * Right Panel - PropertiesPanel
         * --------------------------------------------------- */
        'panel-right-props-root': {
            module: 'panel.right.props',
            desc: '우측 패널 - 속성 패널 전체 영역',
            io: { input: [], output: [] },
            logic: '선택된 클립 또는 캔버스 박스의 속성을 요약하여 표시.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['panel-right-props-body'],
            examples: []
        },
        'panel-right-props-header': {
            module: 'panel.right.props',
            desc: '속성 패널 헤더 (속성 / 접기 토글)',
            io: {
                input: ['click'],
                output: ['isCollapsed 토글']
            },
            logic: '클릭 시 속성 패널 본문을 접거나 펼침.',
            py_func: null,
            js_action: 'togglePropsPanelCollapse',
            events: ['click'],
            affects: ['panel-right-props-body'],
            examples: [
                'data-action="js:togglePropsPanelCollapse"'
            ]
        },
        'panel-right-props-body': {
            module: 'panel.right.props',
            desc: '속성 패널 본문 컨테이너',
            io: { input: [], output: [] },
            logic: '선택 없음 / 클립 선택 / 박스 선택 섹션을 포함하는 래퍼.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-props-empty-label': {
            module: 'panel.right.props',
            desc: '선택된 요소가 없을 때 표시되는 안내 문구',
            io: { input: [], output: [] },
            logic: 'vm.selectedClip 및 vm.selectedBoxId가 모두 비어있을 때만 노출.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-props-clip-section': {
            module: 'panel.right.props',
            desc: '선택된 클립에 대한 속성 정보 섹션',
            io: { input: [], output: [] },
            logic: '클립 이름, 시작(Start), 길이(Dur) 정보를 표시하고 삭제 버튼 제공.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'panel-right-props-clip-start',
                'panel-right-props-clip-duration',
                'panel-right-props-clip-delete-btn'
            ],
            examples: []
        },
        'panel-right-props-clip-start': {
            module: 'panel.right.props',
            desc: '선택된 클립 시작 시간 표시 입력창',
            io: { input: [], output: [] },
            logic: 'vm.selectedClip.start 값을 소수점 한 자리로 표시 (readonly).',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-props-clip-duration': {
            module: 'panel.right.props',
            desc: '선택된 클립 길이 표시 입력창',
            io: { input: [], output: [] },
            logic: 'vm.selectedClip.duration 값을 소수점 한 자리로 표시 (readonly).',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-props-clip-delete-btn': {
            module: 'panel.right.props',
            desc: '선택된 클립 삭제 버튼',
            io: {
                input: ['click'],
                output: ['vm.removeClip(id)', 'vm.selectedClip = null']
            },
            logic: '현재 선택된 클립을 타임라인에서 제거.',
            py_func: null,
            js_action: 'propsDeleteClip',
            events: ['click'],
            affects: ['timeline-clip-{id}', 'panel-right-props-root'],
            examples: [
                'data-action="js:propsDeleteClip"'
            ]
        },
        'panel-right-props-box-section': {
            module: 'panel.right.props',
            desc: '선택된 캔버스 박스에 대한 속성 정보 섹션',
            io: { input: [], output: [] },
            logic: '박스 타입, ZIndex, 위치(X/Y), 크기(W/H)를 표시하고 삭제 버튼 제공.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [
                'panel-right-props-box-x',
                'panel-right-props-box-y',
                'panel-right-props-box-w',
                'panel-right-props-box-h',
                'panel-right-props-box-delete-btn'
            ],
            examples: []
        },
        'panel-right-props-box-x': {
            module: 'panel.right.props',
            desc: '선택된 박스의 X 좌표 표시 입력창',
            io: { input: [], output: [] },
            logic: 'selectedBox.x 값을 반올림하여 표시 (readonly).',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-props-box-y': {
            module: 'panel.right.props',
            desc: '선택된 박스의 Y 좌표 표시 입력창',
            io: { input: [], output: [] },
            logic: 'selectedBox.y 값을 반올림하여 표시 (readonly).',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-props-box-w': {
            module: 'panel.right.props',
            desc: '선택된 박스의 너비(W) 표시 입력창',
            io: { input: [], output: [] },
            logic: 'selectedBox.w 값을 반올림하여 표시 (readonly).',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-props-box-h': {
            module: 'panel.right.props',
            desc: '선택된 박스의 높이(H) 표시 입력창',
            io: { input: [], output: [] },
            logic: 'selectedBox.h 값을 반올림하여 표시 (readonly).',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'panel-right-props-box-delete-btn': {
            module: 'panel.right.props',
            desc: '선택된 캔버스 박스 삭제 버튼',
            io: {
                input: ['click'],
                output: ['vm.removeBox(vm.selectedBoxId)']
            },
            logic: '현재 선택된 캔버스 박스를 제거.',
            py_func: null,
            js_action: 'propsDeleteBox',
            events: ['click'],
            affects: ['preview-canvas-scaler', 'panel-right-props-root'],
            examples: [
                'data-action="js:propsDeleteBox"'
            ]
        },

        /* -----------------------------------------------------
         * Dev / Inspector Overlay
         * --------------------------------------------------- */
        'dev-overlay-root': {
            module: 'dev.overlay',
            desc: 'Inspector/Dev 공용 오버레이 루트',
            io: {
                input: ['mousemove (문서 전체)', 'click (툴팁)'],
                output: ['inspector state, highlightStyle, tooltipStyle 업데이트']
            },
            logic: 'dev-mode-active / dev-mode-full 상태일 때 활성화되는 하이라이트/툴팁 레이어.',
            py_func: null,
            js_action: null,
            events: [],
            affects: ['dev-overlay-highlight', 'dev-overlay-tooltip'],
            examples: []
        },
        'dev-overlay-highlight': {
            module: 'dev.overlay',
            desc: '현재 hover 된 요소의 영역을 표시하는 하이라이트 박스',
            io: { input: [], output: [] },
            logic: 'vm.highlightStyle에 따라 위치/크기/투명도(10%)를 반영.',
            py_func: null,
            js_action: null,
            events: [],
            affects: [],
            examples: []
        },
        'dev-overlay-tooltip': {
            module: 'dev.overlay',
            desc: 'Inspector/Dev 정보 툴팁',
            io: {
                input: ['click'],
                output: ['clipboard에 inspector.id 복사']
            },
            logic: 'Inspect 모드에서는 ID/Tag/Size + 힌트만, Dev 모드에서는 element-specs.js/data-action 정보까지 표시.',
            py_func: null,
            js_action: 'copyInspectorId',
            events: ['click'],
            affects: [],
            examples: [
                'data-action="js:copyInspectorId"'
            ]
        }
    };

    /**
     * ID 기반 스펙 조회 함수
     * - 1) 정확히 일치하는 ID 우선
     * - 2) 없으면 {id} 패턴 키를 이용해 prefix/suffix 매칭
     *    예) timeline-clip-{id}  →  timeline-clip-123 과 매칭
     *
     * ※ 중요: ID 문자열은 순서/구조를 파싱하지 않고,
     *          단순히 "앞부분(prefix)이 같은지" 정도만 본다.
     *          실제 의미 정보는 모두 SPECS 안에 수동으로 기록.
     */
    function WAI_getElementSpec(id) {
        if (!id) return null;

        // 1) 정확히 일치
        if (Object.prototype.hasOwnProperty.call(SPECS, id)) {
            return SPECS[id];
        }

        // 2) {id} 패턴 매칭
        for (const key in SPECS) {
            if (!Object.prototype.hasOwnProperty.call(SPECS, key)) continue;
            if (!key.includes('{id}')) continue;

            const [prefix, suffix] = key.split('{id}');
            if (id.startsWith(prefix) && id.endsWith(suffix)) {
                return SPECS[key];
            }
        }

        return null;
    }

    global.WAI_ELEMENT_SPECS = SPECS;
    global.WAI_getElementSpec = WAI_getElementSpec;
})(window);
