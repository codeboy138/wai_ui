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

            // 박스 드래그 중 여부
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

            COLORS,

            _debugUpdateCount: 0
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
        // ... (생략 없이 나머지 메서드는 그대로, updateCanvasMouseCoord 포함) ...

        // --- Core Model Methods (Clips/Boxes) ---
        removeBox(id) {
            this.canvasBoxes = this.canvasBoxes.filter(b => b.id !== id);
            if (this.selectedBoxId === id) this.selectedBoxId = null;
        },
        setSelectedBoxId(id) {
            this.selectedBoxId = (this.selectedBoxId === id) ? null : id;
            this.selectedClip = null;
        },
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

            this._debugUpdateCount++;
            if (this._debugUpdateCount % 10 === 0) {
                console.log(
                    '[AppRoot] updateBoxPosition', id,
                    'x=', x.toFixed(1),
                    'y=', y.toFixed(1),
                    'w=', w.toFixed(1),
                    'h=', h.toFixed(1)
                );
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

        // ... (나머지 removeClip / setSelectedClip / moveTrack / saveLayerTemplate 등은 그대로) ...
    }
};

createApp(AppRoot).mount('#app-vue-root');
