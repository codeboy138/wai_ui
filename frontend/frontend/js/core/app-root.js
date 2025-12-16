const { createApp, reactive, ref, onMounted, computed, nextTick } = Vue;

const BASE_CANVAS_LONG_SIDE = 1920;
const RESOLUTION_KEYS = ['8K', '6K', '4K', 'FHD', 'HD'];
const RESOLUTION_LONG_SIDE = { '8K': 7680, '6K': 5760, '4K': 3840, 'FHD': 1920, 'HD': 1280 };
const LAYER_COLUMN_ROLES = ['full', 'high', 'mid', 'low'];
const LAYER_ROW_META = { EFF: { name: 'effect', zOffset: 80 }, TXT: { name: 'text', zOffset: 40 }, BG: { name: 'bg', zOffset: 20 } };
const DEFAULT_TEXT_MESSAGE = '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';

function createDefaultTextStyle() {
    return { fontFamily: 'Pretendard', fontSize: 48, strokeColor: '#000000', strokeWidth: 0, fillColor: '#ffffff', backgroundColor: 'transparent', shadow: { offsetX: 2, offsetY: 2, blur: 4, color: '#000000' } };
}

const AppRoot = {
    components: { 
        'dropdown-menu': DropdownMenu, 
        'project-modal': ProjectModal, 
        'asset-manager-modal': AssetManagerModal,
        'image-asset-modal': ImageAssetModal,
        'image-effect-modal': ImageEffectModal,
        'visualization-modal': VisualizationModal,
        'api-manager-modal': ApiManagerModal,
        'layer-panel': LayerPanel,
        'preview-canvas': PreviewCanvas,
        'timeline-panel': TimelinePanel,
        'ruler-line': RulerLine,
        'layer-config-modal': LayerConfigModal,
        'layer-template-modal': LayerTemplateModal
    },
    data() {
        return {
            leftPanelWidth: 240, 
            rightPanelWidth: 320,
            previewContainerHeight: '50%', 
            timelineContainerHeight: '50%',
            isProjectModalOpen: false,
            isDevModeActive: false,
            isDevModeFull: false,
            
            // 헤더 메뉴 상태
            headerMenus: {
                create: false,
                assets: false,
                settings: false
            },
            headerSubmenus: {
                assetManage: false
            },
            
            // 프로젝트 관리 모달
            projectManagerModal: {
                isOpen: false
            },
            
            // 자산 관리 모달
            assetManagerModal: {
                isOpen: false,
                assetType: 'video'
            },
            
            // 이미지 자산 모달
            imageAssetModal: {
                isOpen: false
            },
            
            // 이미지효과 모달
            imageEffectModal: {
                isOpen: false
            },
            
            // 시각화 모달
            visualizationModal: {
                isOpen: false
            },
            
            // API 관리 모달
            apiManagerModal: {
                isOpen: false
            },
            
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
            canvasBoxes: [],
            zoom: 20,
            selectedClip: null,
            selectedBoxId: null,
            layerMainName: "",
            layerTemplates: [],
            layerTemplateFolders: [{ id: 'root', name: '전체 템플릿', parentId: null, isExpanded: true }],
            isMagnet: true,
            isAutoRipple: false,
            isTimelineCollapsed: false,
            currentTime: 0,
            dragItemIndex: null, 
            dragOverItemIndex: null, 
            
            aspectRatio: '16:9',
            resolution: 'FHD',
            canvasSize: { w: 1920, h: 1080 }, 
            mouseCoord: { x: 0, y: 0 }, 
            isMouseOverCanvas: false,
            canvasScale: 1.0,
            isBoxDragging: false,
            
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
            layerConfig: { isOpen: false, boxId: null },
            layerTemplateModal: { isOpen: false },
            COLORS,
            
            // 재생 상태
            isPlaying: false,
            playbackInterval: null,
            playbackFPS: 30,
            totalDuration: 60
        };
    },
    computed: {
        canvasScalerStyle() {
            return {
                width: this.canvasSize.w + 'px',
                height: this.canvasSize.h + 'px',
                backgroundColor: '#000',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${this.canvasScale})`,
                transformOrigin: 'center center'
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
        },
        // 전체 타임라인 길이 계산
        computedTotalDuration() {
            if (this.clips.length === 0) return this.totalDuration;
            let maxEnd = 0;
            this.clips.forEach(clip => {
                const end = clip.start + clip.duration;
                if (end > maxEnd) maxEnd = end;
            });
            return Math.max(this.totalDuration, maxEnd + 10);
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
        },
        currentTime: {
            handler(newTime) {
                this.onTimeUpdate(newTime);
            }
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
            this.setupHeaderMenuClose();
            this.setupGlobalDropHandler();
            this.setupKeyboardShortcuts();
        });
        window.vm = this; 
    },
    beforeUnmount() { 
        if (this._spinWheelHandler) { 
            document.removeEventListener('wheel', this._spinWheelHandler); 
            this._spinWheelHandler = null; 
        }
        if (this._headerMenuCloseHandler) {
            document.removeEventListener('click', this._headerMenuCloseHandler);
            this._headerMenuCloseHandler = null;
        }
        if (this._keyboardHandler) {
            document.removeEventListener('keydown', this._keyboardHandler);
            this._keyboardHandler = null;
        }
        this.stopPlayback();
    },
    methods: {
        // === Header Menu Methods ===
        setupHeaderMenuClose() {
            this._headerMenuCloseHandler = (e) => {
                const isInsideMenu = e.target.closest('.header-menu-wrapper');
                if (!isInsideMenu) {
                    this.closeAllHeaderMenus();
                }
            };
            document.addEventListener('click', this._headerMenuCloseHandler);
        },
        
        closeAllHeaderMenus() {
            this.headerMenus.create = false;
            this.headerMenus.assets = false;
            this.headerMenus.settings = false;
            this.headerSubmenus.assetManage = false;
        },
        
        toggleHeaderMenu(menu) {
            const wasOpen = this.headerMenus[menu];
            this.closeAllHeaderMenus();
            this.headerMenus[menu] = !wasOpen;
        },
        
        toggleHeaderSubmenu(submenu) {
            this.headerSubmenus[submenu] = !this.headerSubmenus[submenu];
        },
        
        // === Project Manager Modal ===
        openProjectManager() {
            this.closeAllHeaderMenus();
            this.projectManagerModal.isOpen = true;
        },
        
        closeProjectManager() {
            this.projectManagerModal.isOpen = false;
        },
        
        // === Asset Manager Modal (영상/사운드) ===
        openAssetManager(assetType) {
            this.closeAllHeaderMenus();
            this.assetManagerModal.assetType = assetType || 'video';
            this.assetManagerModal.isOpen = true;
        },
        
        closeAssetManager() {
            this.assetManagerModal.isOpen = false;
        },
        
        // === Image Asset Modal ===
        openImageAssetModal() {
            this.closeAllHeaderMenus();
            this.imageAssetModal.isOpen = true;
        },
        
        closeImageAssetModal() {
            this.imageAssetModal.isOpen = false;
        },
        
        // === Image Effect Modal ===
        openImageEffectModal() {
            this.closeAllHeaderMenus();
            this.imageEffectModal.isOpen = true;
        },
        
        closeImageEffectModal() {
            this.imageEffectModal.isOpen = false;
        },
        
        // === Visualization Modal ===
        openVisualizationModal() {
            this.closeAllHeaderMenus();
            this.visualizationModal.isOpen = true;
        },
        
        closeVisualizationModal() {
            this.visualizationModal.isOpen = false;
        },
        
        // === API Manager Modal ===
        openApiManagerModal() {
            this.closeAllHeaderMenus();
            this.apiManagerModal.isOpen = true;
        },
        
        closeApiManagerModal() {
            this.apiManagerModal.isOpen = false;
        },
        
        // === Account Manager (placeholder) ===
        openAccountManager() {
            this.closeAllHeaderMenus();
            Swal.fire({ icon: 'info', title: '계정관리', text: '계정관리 기능은 준비 중입니다.', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' });
        },
        
        // === Logout ===
        async handleLogout() {
            this.closeAllHeaderMenus();
            const result = await Swal.fire({
                title: '로그아웃',
                text: '정말 로그아웃 하시겠습니까?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '로그아웃',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
            if (result.isConfirmed) {
                Swal.fire({ icon: 'success', title: '로그아웃 완료', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            }
        },

        // === Box Normalization ===
        ensureBoxNormalized(box) {
            const cw = this.canvasSize.w || 1;
            const ch = this.canvasSize.h || 1;
            if (typeof box.nx !== 'number' || typeof box.ny !== 'number' || typeof box.nw !== 'number' || typeof box.nh !== 'number') {
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
            box.x = (box.nx || 0) * cw; 
            box.y = (box.ny || 0) * ch; 
            box.w = (box.nw || 1) * cw; 
            box.h = (box.nh || 1) * ch;
        },
        ensureAllBoxesNormalized() { 
            this.canvasBoxes.forEach(box => { 
                this.ensureBoxNormalized(box); 
                this.applyBoxNormalizedToPx(box); 
            }); 
        },

        // === Preview Renderer ===
        initPreviewRenderer() {
            try {
                const canvas = document.getElementById('preview-render-canvas');
                if (!canvas || !window.PreviewRenderer || typeof window.PreviewRenderer.init !== 'function') return;
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

        // === System ===
        firePython(f) { 
            console.log('Py:', f); 
            if (window.backend && window.backend[f]) { 
                window.backend[f](); 
            } else { 
                console.log(`[DUMMY] Python call: ${f}`); 
            } 
        },

        // === Dev Mode ===
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
            if (navigator.clipboard && navigator.clipboard.writeText) { 
                navigator.clipboard.writeText(id.toString()).catch(err => console.warn('[Inspector] clipboard write failed', err)); 
            } else { 
                const ta = document.createElement('textarea'); 
                ta.value = id.toString(); 
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

        // === Layer Columns ===
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

        // === Inspector Mode ===
        setupInspectorMode() {
            const self = this;
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
                        left: `${rect.left}px` 
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
                    let top = rect.top - 80 - 10;
                    let left = rect.left + rect.width + 10;
                    if (top < 10) top = rect.bottom + 10;
                    if (top + 150 > window.innerHeight - 10) top = Math.max(10, window.innerHeight - 150 - 10);
                    if (left + 260 > window.innerWidth - 10) { 
                        left = rect.left - 260 - 10; 
                        if (left < 10) left = Math.max(10, window.innerWidth - 260 - 10); 
                    }
                    self.tooltipStyle = { top: `${top}px`, left: `${left}px` };
                } else { 
                    self.inspector = { tag: '', id: '', className: '', x: 0, y: 0, w: 0, h: 0, dataDev: '' }; 
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
                if (spec.module) lines.push(`module: ${spec.module}`); 
                if (spec.py_func) lines.push(`py: ${spec.py_func}`); 
                if (spec.js_action) lines.push(`js: ${spec.js_action}`); 
            } else { 
                lines.push('Spec: NOT FOUND'); 
            }
            if (dataAction) lines.push(`data-action: ${dataAction}`);
            return lines.join('\n');
        },

        // === Layer Helpers ===
        getColRole(colIdx) { 
            return LAYER_COLUMN_ROLES[colIdx] || `col${colIdx}`; 
        },
        getRowName(rowType) { 
            const meta = LAYER_ROW_META[rowType]; 
            return meta ? meta.name : (rowType || '').toLowerCase(); 
        },
        getSlotKey(colIdx, rowType) { 
            return `${this.getColRole(colIdx)}_${this.getRowName(rowType)}`; 
        },
        getZIndexForCell(colIdx, rowType) { 
            const meta = LAYER_ROW_META[rowType]; 
            const offset = meta ? meta.zOffset : 0; 
            return (colIdx * 100) + 100 + offset; 
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
            let x = 0, y = 0, w = cw, h = ch;
            if (colRole === 'high') { 
                x = 0; y = 0; w = cw; h = Math.round(ch / 3); 
            } else if (colRole === 'mid') { 
                x = 0; y = Math.round(ch / 3); w = cw; h = Math.round(ch / 3); 
            } else if (colRole === 'low') { 
                x = 0; y = Math.round((2 * ch) / 3); w = cw; h = ch - y; 
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
                x, y, w, h, 
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

        // === Aspect / Resolution ===
        setAspect(r) { 
            this.aspectRatio = r; 
            this.updateCanvasSizeFromControls(); 
        },
        setResolution(labelOrKey) { 
            const str = (labelOrKey || '').toString().trim(); 
            const match = str.match(/^(\S+)/); 
            this.resolution = match ? match[1] : (str || this.resolution); 
            this.updateCanvasSizeFromControls(); 
        },
        computeResolutionSize(aspectRatio, resolutionKey) {
            const key = resolutionKey || 'FHD';
            const longSide = RESOLUTION_LONG_SIDE[key] || RESOLUTION_LONG_SIDE['FHD'];
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
            const k = key || this.resolution || 'FHD'; 
            const size = this.computeResolutionSize(this.aspectRatio, k); 
            return `${k} (${size.w} x ${size.h})`; 
        },
        recalculateCanvasSizeFromWrapper() {
            const wrapper = document.getElementById('preview-canvas-wrapper'); 
            if (!wrapper) return;
            const PADDING = 20;
            const innerW = wrapper.clientWidth - PADDING * 2;
            const innerH = wrapper.clientHeight - PADDING * 2;
            if (innerW <= 0 || innerH <= 0) return;
            const cw = this.canvasSize.w || 1920;
            const ch = this.canvasSize.h || 1080;
            const cRatio = cw / ch;
            const wrapperRatio = innerW / innerH;
            this.canvasScale = wrapperRatio > cRatio ? innerH / ch : innerW / cw;
        },
        updateCanvasSizeFromControls() { 
            this.canvasSize = this.computeResolutionSize(this.aspectRatio, this.resolution); 
            this.recalculateCanvasSizeFromWrapper(); 
            this.ensureAllBoxesNormalized(); 
        },
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
            this.isMouseOverCanvas = mouseXInWrapper >= PADDING && mouseXInWrapper <= wRect.width - PADDING && mouseYInWrapper >= PADDING && mouseYInWrapper <= wRect.height - PADDING;
            this.mouseMarkerPos = { x: mouseXInWrapper, y: mouseYInWrapper };
            const canvasX = e.clientX - sRect.left;
            const canvasY = e.clientY - sRect.top;
            const scale = this.canvasScale || 1.0;
            this.mouseCoord = { 
                x: Math.min(this.canvasSize.w, Math.max(0, canvasX / scale)), 
                y: Math.min(this.canvasSize.h, Math.max(0, canvasY / scale)) 
            };
        },

        // === Panel Resizers ===
        setupPanelResizers() {
            const setup = (rid, stateKey, minSize, dir, isReverse = false) => {
                const r = document.getElementById(rid); 
                if (!r) return;
                let startS, startP; 
                const self = this;
                const onMove = (ev) => {
                    const diff = (dir === 'w' ? ev.clientX : ev.clientY) - startP;
                    if (dir === 'w') { 
                        self[stateKey] = Math.max(minSize, isReverse ? startS - diff : startS + diff); 
                    } else { 
                        const effectiveHeight = Math.max(minSize, ev.clientY - 48 - 2); 
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
                    startS = dir === 'w' ? self[stateKey] : (rid === 'main-center-timeline-resizer-h' ? document.getElementById('preview-main-container').offsetHeight : 0); 
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
        setupSpinWheel() {
            const handler = (event) => {
                const target = event.target; 
                if (!(target instanceof HTMLInputElement) || target.type !== 'number' || target.disabled || target.readOnly) return;
                event.preventDefault();
                const step = target.step ? parseFloat(target.step) : 1;
                let value = parseFloat(target.value) || 0;
                const min = target.min !== '' ? parseFloat(target.min) : 0;
                const max = target.max !== '' ? parseFloat(target.max) : +Infinity;
                value += (event.deltaY < 0 ? 1 : -1) * step;
                target.value = Math.max(min, Math.min(max, value));
                target.dispatchEvent(new Event('input', { bubbles: true }));
            };
            document.addEventListener('wheel', handler, { passive: false });
            this._spinWheelHandler = handler;
        },

        // === Keyboard Shortcuts ===
        setupKeyboardShortcuts() {
            this._keyboardHandler = (e) => {
                // 입력 필드에서는 단축키 무시
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                    return;
                }
                
                // 스페이스바: 재생/일시정지
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.togglePlayback();
                }
                
                // Home: 시작으로 이동
                if (e.code === 'Home') {
                    e.preventDefault();
                    this.seekToStart();
                }
                
                // End: 끝으로 이동
                if (e.code === 'End') {
                    e.preventDefault();
                    this.seekToEnd();
                }
                
                // Left Arrow: 1초 뒤로
                if (e.code === 'ArrowLeft' && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    this.seekRelative(-1);
                }
                
                // Right Arrow: 1초 앞으로
                if (e.code === 'ArrowRight' && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    this.seekRelative(1);
                }
                
                // Shift + Left: 0.1초 뒤로 (프레임 단위)
                if (e.code === 'ArrowLeft' && e.shiftKey) {
                    e.preventDefault();
                    this.seekRelative(-0.1);
                }
                
                // Shift + Right: 0.1초 앞으로 (프레임 단위)
                if (e.code === 'ArrowRight' && e.shiftKey) {
                    e.preventDefault();
                    this.seekRelative(0.1);
                }
                
                // Delete: 선택된 클립/박스 삭제
                if (e.code === 'Delete') {
                    e.preventDefault();
                    this.deleteSelected();
                }
            };
            document.addEventListener('keydown', this._keyboardHandler);
        },

        // === Playback Control ===
        togglePlayback() {
            if (this.isPlaying) {
                this.stopPlayback();
            } else {
                this.startPlayback();
            }
        },
        
        startPlayback() {
            if (this.isPlaying) return;
            this.isPlaying = true;
            
            const frameTime = 1000 / this.playbackFPS;
            const increment = 1 / this.playbackFPS;
            
            this.playbackInterval = setInterval(() => {
                this.currentTime += increment;
                
                // 끝에 도달하면 멈춤
                if (this.currentTime >= this.computedTotalDuration) {
                    this.currentTime = this.computedTotalDuration;
                    this.stopPlayback();
                }
            }, frameTime);
        },
        
        stopPlayback() {
            this.isPlaying = false;
            if (this.playbackInterval) {
                clearInterval(this.playbackInterval);
                this.playbackInterval = null;
            }
        },
        
        seekToStart() {
            this.stopPlayback();
            this.currentTime = 0;
        },
        
        seekToEnd() {
            this.stopPlayback();
            this.currentTime = this.computedTotalDuration;
        },
        
        seekRelative(seconds) {
            const newTime = this.currentTime + seconds;
            this.currentTime = Math.max(0, Math.min(this.computedTotalDuration, newTime));
        },
        
        seekToTime(time) {
            this.currentTime = Math.max(0, Math.min(this.computedTotalDuration, time));
        },
        
        // 시간 업데이트 시 호출되는 핸들러
        onTimeUpdate(time) {
            // 현재 시간에 해당하는 클립들의 가시성 업데이트
            this.updateClipVisibility(time);
            
            // PreviewRenderer에 시간 전달
            try {
                if (window.PreviewRenderer && typeof window.PreviewRenderer.setCurrentTime === 'function') {
                    window.PreviewRenderer.setCurrentTime(time);
                }
            } catch (err) {
                console.warn('[Preview] setCurrentTime failed:', err);
            }
        },
        
        // 현재 시간에 따른 클립 가시성 업데이트
        updateClipVisibility(time) {
            this.clips.forEach(clip => {
                const isActive = time >= clip.start && time < (clip.start + clip.duration);
                clip.isActive = isActive;
            });
        },
        
        // 선택된 항목 삭제
        deleteSelected() {
            if (this.selectedClip) {
                this.removeClip(this.selectedClip.id);
            } else if (this.selectedBoxId) {
                this.removeBox(this.selectedBoxId);
            }
        },

        // === Global Drop Handler ===
        setupGlobalDropHandler() {
            const previewWrapper = document.getElementById('preview-canvas-wrapper');
            if (!previewWrapper) return;
            
            previewWrapper.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });
            
            previewWrapper.addEventListener('drop', (e) => {
                e.preventDefault();
                this.handlePreviewDrop(e);
            });
        },
        
        handlePreviewDrop(e) {
            let assetData;
            try {
                assetData = JSON.parse(e.dataTransfer.getData('text/wai-asset'));
            } catch (err) {
                // 일반 파일 드롭 처리
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                    this.handleFilesDrop(files, e);
                }
                return;
            }
            
            // 자산 데이터가 있으면 캔버스에 배치
            if (assetData && this.selectedBoxId) {
                const box = this.canvasBoxes.find(b => b.id === this.selectedBoxId);
                if (box) {
                    this.applyAssetToBox(box, assetData);
                }
            }
        },
        
        handleFilesDrop(files, e) {
            const file = files[0];
            if (!file) return;
            
            const fileType = file.type;
            let assetType = 'unknown';
            
            if (fileType.startsWith('image/')) {
                assetType = 'image';
            } else if (fileType.startsWith('video/')) {
                assetType = 'video';
            } else if (fileType.startsWith('audio/')) {
                assetType = 'audio';
            }
            
            if (assetType === 'image' || assetType === 'video') {
                // 선택된 박스에 미디어 적용
                if (this.selectedBoxId) {
                    const box = this.canvasBoxes.find(b => b.id === this.selectedBoxId);
                    if (box) {
                        const url = URL.createObjectURL(file);
                        box.mediaSrc = url;
                        box.mediaType = assetType;
                        box.mediaName = file.name;
                    }
                }
            }
        },
        
        applyAssetToBox(box, assetData) {
            if (assetData.type === 'image') {
                box.mediaSrc = assetData.src || assetData.url;
                box.mediaType = 'image';
                box.mediaName = assetData.name;
            } else if (assetData.type === 'video') {
                box.mediaSrc = assetData.src || assetData.url;
                box.mediaType = 'video';
                box.mediaName = assetData.name;
            }
        },

        // === Layer Config Modal ===
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
            if (box) this.removeBox(box.id); 
            this.closeLayerConfig(); 
        },

        // === Layer Template Modal ===
        openLayerTemplateModal() { 
            this.layerTemplateModal.isOpen = true; 
        },
        closeLayerTemplateModal() { 
            this.layerTemplateModal.isOpen = false; 
        },
        deleteLayerTemplate(templateId) {
            this.layerTemplates = this.layerTemplates.filter(t => t.id !== templateId);
            Swal.fire({
                icon: 'success',
                title: '삭제됨',
                text: '템플릿이 삭제되었습니다',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1500,
                showConfirmButton: false
            });
        },
        loadLayerTemplate(template) {
            if (!template || !template.matrixJson) {
                Swal.fire({
                    icon: 'error',
                    title: '불러오기 실패',
                    text: '템플릿 데이터가 유효하지 않습니다',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            try {
                const parsed = JSON.parse(template.matrixJson);
                if (parsed.canvasBoxes && Array.isArray(parsed.canvasBoxes)) {
                    const newBoxes = parsed.canvasBoxes.map(box => ({
                        ...box,
                        id: `box_${box.slotKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    }));
                    this.canvasBoxes = newBoxes;
                    this.ensureAllBoxesNormalized();
                }
                this.layerMainName = template.name || '';
                Swal.fire({
                    icon: 'success',
                    title: '불러오기 완료',
                    text: `"${template.name}" 템플릿이 적용되었습니다`,
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (err) {
                console.error('[loadLayerTemplate] parse error:', err);
                Swal.fire({
                    icon: 'error',
                    title: '불러오기 실패',
                    text: '템플릿 파싱 중 오류가 발생했습니다',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6'
                });
            }
        },
        updateLayerTemplates(templates) {
            this.layerTemplates = templates;
        },
        updateLayerTemplateFolders(folders) {
            this.layerTemplateFolders = folders;
        },
        saveLayerTemplate(name, matrixJson) {
            const newTpl = {
                id: `tpl_${Date.now()}`,
                name,
                cols: this.layerCols.map(c => ({ ...c })),
                matrixJson: matrixJson || null,
                createdAt: new Date().toISOString(),
                folderId: 'root'
            };
            this.layerTemplates.push(newTpl);
            this.layerMainName = name;
        },

        // === Box Operations ===
        removeBox(id) {
            this.canvasBoxes = this.canvasBoxes.filter(b => b.id !== id);
            if (this.selectedBoxId === id) this.selectedBoxId = null;
        },
        setSelectedBoxId(id) {
            this.selectedBoxId = id;
            this.selectedClip = null;
        },
        updateBoxPosition(id, newX, newY, newW, newH, optNorm) {
            const index = this.canvasBoxes.findIndex(b => b.id === id);
            if (index === -1) return;
            const oldBox = this.canvasBoxes[index];
            const cw = this.canvasSize.w || 1;
            const ch = this.canvasSize.h || 1;
            let x, y, w, h, nx, ny, nw, nh;
            if (optNorm && typeof optNorm === 'object') {
                nx = typeof optNorm.nx === 'number' ? optNorm.nx : (typeof oldBox.nx === 'number' ? oldBox.nx : (oldBox.x || 0) / cw);
                ny = typeof optNorm.ny === 'number' ? optNorm.ny : (typeof oldBox.ny === 'number' ? oldBox.ny : (oldBox.y || 0) / ch);
                nw = typeof optNorm.nw === 'number' ? optNorm.nw : (typeof oldBox.nw === 'number' ? oldBox.nw : (oldBox.w || cw) / cw);
                nh = typeof optNorm.nh === 'number' ? optNorm.nh : (typeof oldBox.nh === 'number' ? oldBox.nh : (oldBox.h || ch) / ch);
                const minNw = 20 / cw, minNh = 20 / ch;
                if (nw < minNw) nw = minNw;
                if (nh < minNh) nh = minNh;
                if (nx < 0) nx = 0;
                if (ny < 0) ny = 0;
                if (nx + nw > 1) nx = Math.max(0, 1 - nw);
                if (ny + nh > 1) ny = Math.max(0, 1 - nh);
                x = nx * cw; y = ny * ch; w = nw * cw; h = nh * ch;
            } else {
                x = typeof newX === 'number' ? newX : (typeof oldBox.x === 'number' ? oldBox.x : 0);
                y = typeof newY === 'number' ? newY : (typeof oldBox.y === 'number' ? oldBox.y : 0);
                w = typeof newW === 'number' && newW > 0 ? newW : (typeof oldBox.w === 'number' && oldBox.w > 0 ? oldBox.w : cw);
                h = typeof newH === 'number' && newH > 0 ? newH : (typeof oldBox.h === 'number' && oldBox.h > 0 ? oldBox.h : ch);
                const minW = 20, minH = 20;
                if (w < minW) w = minW;
                if (h < minH) h = minH;
                if (x < 0) x = 0;
                if (y < 0) y = 0;
                if (x + w > cw) x = Math.max(0, cw - w);
                if (y + h > ch) y = Math.max(0, ch - h);
                nx = x / cw; ny = y / ch; nw = w / cw; nh = h / ch;
            }
            const box = { ...oldBox, x, y, w, h, nx, ny, nw, nh };
            const newBoxes = [...this.canvasBoxes];
            newBoxes[index] = box;
            this.canvasBoxes = newBoxes;
        },

        // === Clip Operations ===
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
        addClipFromDrop(fileType, trackIndex, time, assetName) {
            const trackId = this.tracks[trackIndex] ? this.tracks[trackIndex].id : null;
            if (!trackId) return;
            const newClip = {
                id: `c_${Date.now()}`,
                trackId,
                name: assetName,
                start: time,
                duration: 10,
                type: fileType,
                isActive: false
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
                newClips[index] = { ...clip, start: newStart, duration: newDuration };
                this.clips = newClips;
            }
        },
        moveClip(clipId, timeChange) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index !== -1) {
                const clip = this.clips[index];
                const newClips = [...this.clips];
                newClips[index] = { ...clip, start: Math.max(0, clip.start + timeChange) };
                this.clips = newClips;
            }
        },
        
        // 클립을 다른 트랙으로 이동
        moveClipToTrack(clipId, newTrackId) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index !== -1) {
                const newClips = [...this.clips];
                newClips[index] = { ...newClips[index], trackId: newTrackId };
                this.clips = newClips;
            }
        },
        
        // 클립 복제
        duplicateClip(clipId) {
            const clip = this.clips.find(c => c.id === clipId);
            if (clip) {
                const newClip = {
                    ...clip,
                    id: `c_${Date.now()}`,
                    start: clip.start + clip.duration
                };
                this.clips.push(newClip);
            }
        },
        
        // 클립 분할
        splitClip(clipId, splitTime) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index === -1) return;
            
            const clip = this.clips[index];
            const relativeTime = splitTime - clip.start;
            
            if (relativeTime <= 0 || relativeTime >= clip.duration) return;
            
            const firstPart = {
                ...clip,
                duration: relativeTime
            };
            
            const secondPart = {
                ...clip,
                id: `c_${Date.now()}`,
                start: splitTime,
                duration: clip.duration - relativeTime
            };
            
            const newClips = [...this.clips];
            newClips[index] = firstPart;
            newClips.push(secondPart);
            this.clips = newClips;
        },
        
        // 선택된 클립 분할 (현재 시간 기준)
        splitSelectedClipAtPlayhead() {
            if (this.selectedClip) {
                this.splitClip(this.selectedClip.id, this.currentTime);
            }
        },
        
        // 트랙 추가
        addTrack(type = 'video') {
            const colors = {
                video: '#22c55e',
                audio: '#a855f7',
                text: '#eab308'
            };
            const newTrack = {
                id: `t_${Date.now()}`,
                name: `Track ${this.tracks.length + 1}`,
                type: type,
                color: colors[type] || '#64748b'
            };
            this.tracks.push(newTrack);
        },
        
        // 트랙 삭제
        removeTrack(trackId) {
            // 트랙에 속한 클립도 함께 삭제
            this.clips = this.clips.filter(c => c.trackId !== trackId);
            this.tracks = this.tracks.filter(t => t.id !== trackId);
        }
    }
};

createApp(AppRoot).mount('#app-vue-root');
