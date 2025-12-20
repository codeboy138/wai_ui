// PreviewRenderer
// - Canvas2D 기반 프리뷰 렌더러
// - 줌 배율 표시
// - DOM PreviewCanvas가 박스 상호작용 담당
// - 오디오 출력 지원

(function (global) {

    const PreviewRenderer = {
        // 캔버스 및 컨텍스트
        canvas: null,
        ctx: null,
        vm: null,
        dpr: global.devicePixelRatio || 1,
        handleResize: null,

        // 논리 캔버스 크기
        logicalCanvasSize: { w: 1920, h: 1080 },
        
        // 현재 재생 시간
        currentTime: 0,
        
        // 초기화 완료 플래그
        initialized: false,
        
        // 오디오 관리
        audioElements: new Map(),
        masterVolume: 1.0,

        /**
         * 초기화
         */
        init(canvasEl, vm) {
            this.canvas = canvasEl;
            this.vm = vm;
            this.dpr = global.devicePixelRatio || 1;

            if (!this.canvas) {
                console.warn('[PreviewRenderer] canvas element not provided');
                return;
            }

            const ctx = this.canvas.getContext('2d');
            if (!ctx) {
                console.warn('[PreviewRenderer] Canvas2D context not available');
                return;
            }

            this.ctx = ctx;
            this.initialized = true;
            console.log('[PreviewRenderer] Canvas2D mode initialized with audio support');

            this.handleResize = this.resize.bind(this);
            global.addEventListener('resize', this.handleResize);
            
            this.resize();
        },

        /**
         * 리사이즈 처리
         */
        resize() {
            if (!this.canvas || !this.ctx) return;

            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = Math.max(1, rect.width || 1);
            const cssHeight = Math.max(1, rect.height || 1);
            const dpr = this.dpr || 1;

            this.canvas.width = cssWidth * dpr;
            this.canvas.height = cssHeight * dpr;
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            this.ctx.clearRect(0, 0, cssWidth, cssHeight);
            
            this._updateZoomFromCssHeight(cssHeight);
        },

        /**
         * 메인 렌더
         */
        render() {
            if (!this.canvas || !this.ctx) return;

            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = Math.max(1, rect.width || 1);
            const cssHeight = Math.max(1, rect.height || 1);

            this.ctx.clearRect(0, 0, cssWidth, cssHeight);
            
            this._updateZoomFromCssHeight(cssHeight);
        },

        /**
         * 줌 배율 업데이트
         */
        _updateZoomFromCssHeight(cssHeight) {
            const state = this.vm;
            const canvasSize = (state && state.canvasSize) ? state.canvasSize : { w: 1920, h: 1080 };
            const ch = canvasSize.h || 1;

            const scaleY = ch ? (cssHeight / ch) : 1;
            this.updateZoomIndicator(scaleY);
        },

        /**
         * 줌 인디케이터 UI 업데이트
         */
        updateZoomIndicator(scale) {
            const valueEl = global.document.getElementById('preview-zoom-indicator-value');
            if (!valueEl) return;

            if (!scale || !isFinite(scale) || scale <= 0) {
                valueEl.textContent = '100%';
                return;
            }

            const pct = scale * 100;
            valueEl.textContent = pct.toFixed(0) + '%';
        },

        /**
         * 외부 API: 논리 캔버스 크기 설정
         */
        setCanvasSize(size) {
            if (!size) return;
            const w = size.w || size.width || this.logicalCanvasSize.w;
            const h = size.h || size.height || this.logicalCanvasSize.h;

            this.logicalCanvasSize = { w, h };
            this.resize();
        },

        /**
         * 외부 API: 박스 동기화
         */
        syncBoxes(boxes, canvasSize) {
            if (canvasSize) {
                this.setCanvasSize(canvasSize);
            }
        },

        /**
         * 외부 API: 드래그 중 박스 업데이트
         */
        updateBoxDuringDrag(id, newX, newY, newW, newH) {
        },
        
        /**
         * 외부 API: 현재 시간 설정
         */
        setCurrentTime(time) {
            this.currentTime = time;
            this.syncAudioToTime(time);
        },
        
        /**
         * 외부 API: 마스터 볼륨 설정
         */
        setMasterVolume(volume) {
            this.masterVolume = Math.max(0, Math.min(1, volume));
            this.audioElements.forEach((info, el) => {
                const clipVolume = info.clipVolume || 1;
                el.volume = this.masterVolume * clipVolume;
            });
            document.querySelectorAll('video, audio').forEach(el => {
                if (!this.audioElements.has(el)) {
                    el.volume = this.masterVolume;
                }
            });
        },
        
        /**
         * 오디오 요소 등록
         */
        registerAudioElement(element, clipId, clipVolume = 1) {
            if (!element) return;
            
            element.muted = false;
            element.volume = this.masterVolume * clipVolume;
            
            this.audioElements.set(element, {
                clipId: clipId,
                clipVolume: clipVolume
            });
        },
        
        /**
         * 오디오 요소 등록 해제
         */
        unregisterAudioElement(element) {
            this.audioElements.delete(element);
        },
        
        /**
         * 클립 볼륨 업데이트
         */
        updateClipVolume(clipId, volume) {
            this.audioElements.forEach((info, el) => {
                if (info.clipId === clipId) {
                    info.clipVolume = volume;
                    el.volume = this.masterVolume * volume;
                }
            });
        },
        
        /**
         * 오디오 시간 동기화
         */
        syncAudioToTime(time) {
            this.audioElements.forEach((info, el) => {
                if (Math.abs(el.currentTime - time) > 0.1) {
                    el.currentTime = time;
                }
            });
        },
        
        /**
         * 재생 시작
         */
        play() {
            this.audioElements.forEach((info, el) => {
                if (el.paused) {
                    el.play().catch(() => {});
                }
            });
        },
        
        /**
         * 재생 일시정지
         */
        pause() {
            this.audioElements.forEach((info, el) => {
                if (!el.paused) {
                    el.pause();
                }
            });
        },
        
        /**
         * 외부 API: 초기화 상태 확인
         */
        isInitialized() {
            return this.initialized;
        },

        /**
         * 정리
         */
        destroy() {
            if (this.handleResize) {
                global.removeEventListener('resize', this.handleResize);
                this.handleResize = null;
            }
            this.audioElements.clear();
            this.canvas = null;
            this.ctx = null;
            this.vm = null;
            this.initialized = false;
        }
    };

    global.PreviewRenderer = PreviewRenderer;

})(window);

const { createApp, reactive, ref, onMounted, computed, nextTick } = Vue;

const App = {
    components: { 
        'dropdown-menu': DropdownMenu, 
        'project-modal': ProjectModal, 
        'asset-manager-modal': AssetManagerModal,
        'image-asset-modal': ImageAssetModal,
        'image-effect-modal': ImageEffectModal,
        'visualization-modal': VisualizationModal,
        'api-manager-modal': ApiManagerModal,
        'layer-panel': LayerPanel,
        'layer-config-modal': LayerConfigModal,
        'layer-template-modal': LayerTemplateModal,
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
            
            // Header Menus State
            headerMenus: { create: false, assets: false, settings: false },
            headerSubmenus: { assetManage: false },
            projectManagerModal: { isOpen: false },
            assetManagerModal: { isOpen: false, assetType: 'video' },
            imageAssetModal: { isOpen: false },
            imageEffectModal: { isOpen: false },
            visualizationModal: { isOpen: false },
            apiManagerModal: { isOpen: false },
            
            // Core Timeline/Canvas State
            tracks: [
                { id: 't1', name: 'NONE', type: 'video', color: '#64748b', isMain: false, isHidden: false, isLocked: false, height: 80 },
                { id: 't2', name: 'NONE', type: 'text', color: '#eab308', isMain: false, isHidden: false, isLocked: false, height: 80 },
                { id: 't3', name: 'NONE', type: 'video', color: '#22c55e', isMain: true, isHidden: false, isLocked: false, height: 80 },
                { id: 't4', name: 'NONE', type: 'text', color: '#3b82f6', isMain: false, isHidden: false, isLocked: false, height: 80 },
                { id: 't5', name: 'NONE', type: 'audio', color: '#a855f7', isMain: false, isHidden: false, isLocked: false, height: 60 }
            ],
            clips: [],
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
            isPlaying: false,
            playbackTimer: null,
            dragItemIndex: null, 
            dragOverItemIndex: null, 
            
            // Preview Toolbar State
            aspectRatio: '16:9',
            resolution: 'FHD',
            canvasSize: { w: 1920, h: 1080 }, 
            mouseCoord: { x: 0, y: 0 }, 
            isMouseOverCanvas: false,
            canvasScale: 1.0, 
            
            // 화면 비율 옵션
            aspectRatioOptions: ['원본', '16:9', '9:16', '4:3', '1:1', '21:9'],
            
            // Inspector State
            inspector: { tag: '', id: '', className: '', x: 0, y: 0, w: 0, h: 0, dataDev: '' },
            highlightStyle: { width: '0', height: '0', top: '0', left: '0' },
            tooltipStyle: { top: '0', left: '0' },
            mouseMarkerPos: { x: 0, y: 0 },
            
            // Layer Panel State
            layerCols: [
                { id: 'c1', name: '전체', color: '#64748b' },
                { id: 'c2', name: '상단', color: '#eab308' },
                { id: 'c3', name: '중단', color: '#22c55e' },
                { id: 'c4', name: '하단', color: '#3b82f6' }
            ],
            ctxMenu: null,
            layerConfig: { isOpen: false, boxId: null },
            layerTemplateModal: { isOpen: false },
            
            // 미디어 자산 저장소 (우측 패널)
            mediaAssets: [],
            mediaAssetCollapsed: false,
            mediaAssetDragOver: false,
            
            // 트랙 높이 프리셋
            trackHeightPresets: {
                low: 40,
                medium: 80,
                high: 120,
                default: 80
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
        activeClipBoxes() {
            const currentTime = this.currentTime;
            const activeBoxes = [];
            
            this.tracks.forEach((track, trackIndex) => {
                if (track.isHidden) return;
                
                const trackClips = this.clips.filter(clip => {
                    if (clip.trackId !== track.id) return false;
                    const clipEnd = clip.start + clip.duration;
                    return currentTime >= clip.start && currentTime < clipEnd;
                });
                
                trackClips.forEach(clip => {
                    const box = {
                        id: `clip_box_${clip.id}`,
                        clipId: clip.id,
                        clipStart: clip.start,
                        clipDuration: clip.duration,
                        x: 0,
                        y: 0,
                        w: this.canvasSize.w,
                        h: this.canvasSize.h,
                        zIndex: (trackIndex + 1) * 10,
                        color: track.color || '#3b82f6',
                        layerBgColor: 'transparent',
                        isHidden: false,
                        layerName: clip.name || 'Clip',
                        rowType: clip.type === 'sound' ? 'EFF' : 'BG',
                        volume: clip.volume || 100
                    };
                    
                    if (clip.type === 'video' && clip.src) {
                        box.mediaType = 'video';
                        box.mediaSrc = clip.src;
                        box.mediaFit = 'contain';
                    } else if (clip.type === 'image' && clip.src) {
                        box.mediaType = 'image';
                        box.mediaSrc = clip.src;
                        box.mediaFit = 'contain';
                    } else {
                        box.mediaType = 'none';
                        box.mediaSrc = '';
                    }
                    
                    activeBoxes.push(box);
                });
            });
            
            return activeBoxes;
        },
        allVisibleBoxes() {
            const layerBoxes = this.canvasBoxes.filter(box => !box.isHidden);
            const clipBoxes = this.activeClipBoxes;
            const allBoxes = [...clipBoxes, ...layerBoxes];
            return allBoxes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        },
        layerConfigBox() {
            if (!this.layerConfig.isOpen || !this.layerConfig.boxId) return null;
            return this.canvasBoxes.find(b => b.id === this.layerConfig.boxId) || null;
        },
        // 미디어 자산 카운트
        mediaAssetCount() {
            return this.mediaAssets.length;
        }
    },
    watch: {
        // 화면 비율 변경 시 캔버스 크기 업데이트
        aspectRatio(newRatio) {
            this.updateCanvasSizeFromAspectRatio(newRatio);
        }
    },
    mounted() {
        this.$nextTick(() => { 
            this.setupPanelResizers(); 
            this.setupCanvasScaler(); 
            this.setupInspectorMode(); 
            this.setupAssetEventListeners();
            this.setupHeaderMenuClose();
            this.initPreviewRenderer();
        });
        window.vm = this; 
    },
    beforeUnmount() {
        this.removeAssetEventListeners();
        if (this.playbackTimer) {
            cancelAnimationFrame(this.playbackTimer);
        }
        if (this._headerMenuCloseHandler) {
            document.removeEventListener('click', this._headerMenuCloseHandler);
        }
    },
    methods: {
        // --- 화면 비율에 따른 캔버스 크기 업데이트 ---
        updateCanvasSizeFromAspectRatio(ratio) {
            const baseHeight = 1080;
            let w, h;
            
            switch(ratio) {
                case '원본':
                    w = 1920;
                    h = 1080;
                    break;
                case '16:9':
                    w = Math.round(baseHeight * 16 / 9);
                    h = baseHeight;
                    break;
                case '9:16':
                    w = Math.round(baseHeight * 9 / 16);
                    h = baseHeight;
                    break;
                case '4:3':
                    w = Math.round(baseHeight * 4 / 3);
                    h = baseHeight;
                    break;
                case '1:1':
                    w = baseHeight;
                    h = baseHeight;
                    break;
                case '21:9':
                    w = Math.round(baseHeight * 21 / 9);
                    h = baseHeight;
                    break;
                default:
                    w = 1920;
                    h = 1080;
            }
            
            this.canvasSize = { w, h };
            this.recalculateCanvasScale();
            
            if (window.PreviewRenderer) {
                window.PreviewRenderer.setCanvasSize(this.canvasSize);
            }
        },
        
        // --- Preview Renderer 초기화 ---
        initPreviewRenderer() {
            const canvas = document.getElementById('preview-render-canvas');
            if (canvas && window.PreviewRenderer) {
                window.PreviewRenderer.init(canvas, this);
            }
        },
        
        // --- Header Menu Methods ---
        setupHeaderMenuClose() {
            this._headerMenuCloseHandler = (e) => {
                const isInsideMenu = e.target.closest('.header-menu-wrapper');
                if (!isInsideMenu) this.closeAllHeaderMenus();
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
        
        // --- Modal Methods ---
        openProjectManager() { this.closeAllHeaderMenus(); this.projectManagerModal.isOpen = true; },
        closeProjectManager() { this.projectManagerModal.isOpen = false; },
        openAssetManager(assetType) { this.closeAllHeaderMenus(); this.assetManagerModal.assetType = assetType || 'video'; this.assetManagerModal.isOpen = true; },
        closeAssetManager() { this.assetManagerModal.isOpen = false; },
        openImageAssetModal() { this.closeAllHeaderMenus(); this.imageAssetModal.isOpen = true; },
        closeImageAssetModal() { this.imageAssetModal.isOpen = false; },
        openImageEffectModal() { this.closeAllHeaderMenus(); this.imageEffectModal.isOpen = true; },
        closeImageEffectModal() { this.imageEffectModal.isOpen = false; },
        openVisualizationModal() { this.closeAllHeaderMenus(); this.visualizationModal.isOpen = true; },
        closeVisualizationModal() { this.visualizationModal.isOpen = false; },
        openApiManagerModal() { this.closeAllHeaderMenus(); this.apiManagerModal.isOpen = true; },
        closeApiManagerModal() { this.apiManagerModal.isOpen = false; },
        openAccountManager() { 
            this.closeAllHeaderMenus(); 
            Swal.fire({ icon: 'info', title: '계정관리', text: '계정관리 기능은 준비 중입니다.', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' }); 
        },
        async handleLogout() {
            this.closeAllHeaderMenus();
            const result = await Swal.fire({ title: '로그아웃', text: '정말 로그아웃 하시겠습니까?', icon: 'question', showCancelButton: true, confirmButtonText: '로그아웃', cancelButtonText: '취소', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#ef4444' });
            if (result.isConfirmed) Swal.fire({ icon: 'success', title: '로그아웃 완료', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
        },
        
        // --- Layer Config/Template Modal Methods ---
        openLayerConfig(boxId) { this.layerConfig.isOpen = true; this.layerConfig.boxId = boxId; this.setSelectedBoxId(boxId); },
        closeLayerConfig() { this.layerConfig.isOpen = false; this.layerConfig.boxId = null; },
        deleteLayerFromConfig() { const box = this.layerConfigBox; if (box) this.removeBox(box.id); this.closeLayerConfig(); },
        openLayerTemplateModal() { this.layerTemplateModal.isOpen = true; },
        closeLayerTemplateModal() { this.layerTemplateModal.isOpen = false; },
        deleteLayerTemplate(templateId) { this.layerTemplates = this.layerTemplates.filter(t => t.id !== templateId); },
        loadLayerTemplate(template) {
            if (!template || !template.matrixJson) return;
            try {
                const parsed = JSON.parse(template.matrixJson);
                if (parsed.canvasBoxes && Array.isArray(parsed.canvasBoxes)) {
                    const newBoxes = parsed.canvasBoxes.map(box => ({ ...box, id: `box_${box.slotKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }));
                    this.canvasBoxes = newBoxes;
                }
                this.layerMainName = template.name || '';
            } catch (err) {
                console.error('[loadLayerTemplate] parse error:', err);
            }
        },
        updateLayerTemplates(templates) { this.layerTemplates = templates; },
        updateLayerTemplateFolders(folders) { this.layerTemplateFolders = folders; },
        
        // --- 미디어 자산 관리 ---
        toggleMediaAssetPanel() {
            this.mediaAssetCollapsed = !this.mediaAssetCollapsed;
        },
        
        addMediaAsset(asset) {
            const newAsset = {
                id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: asset.name || 'Untitled',
                type: asset.type || 'video',
                src: asset.src || '',
                duration: asset.duration || 0,
                thumbnail: asset.thumbnail || '',
                resolution: asset.resolution || '',
                addedAt: Date.now()
            };
            this.mediaAssets.push(newAsset);
            return newAsset;
        },
        
        removeMediaAsset(assetId) {
            const idx = this.mediaAssets.findIndex(a => a.id === assetId);
            if (idx !== -1) {
                this.mediaAssets.splice(idx, 1);
            }
        },
        
        clearMediaAssets() {
            if (confirm('모든 미디어 자산을 삭제하시겠습니까?')) {
                this.mediaAssets = [];
            }
        },
        
        // 미디어 자산 패널에서 드래그 시작 (타임라인으로)
        onMediaAssetDragStart(event, asset) {
            const transferData = [{
                type: asset.type,
                id: asset.id,
                name: asset.name,
                src: asset.src || '',
                duration: asset.duration || 10,
                resolution: asset.resolution || ''
            }];
            event.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            event.dataTransfer.effectAllowed = 'copy';
            
            // 드래그 이미지 생성
            const dragImage = document.createElement('div');
            const icons = { video: '🎬', image: '🖼️', sound: '🎵' };
            dragImage.textContent = (icons[asset.type] || '📁') + ' ' + asset.name;
            dragImage.style.cssText = 'position:absolute;top:-1000px;padding:8px 16px;background:#3b82f6;color:#fff;border-radius:6px;font-size:12px;font-weight:bold;white-space:nowrap;';
            document.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        },
        
        // 미디어 자산 패널에 드롭 (타임라인 클립 또는 외부 파일)
        onMediaAssetDrop(event) {
            event.preventDefault();
            this.mediaAssetDragOver = false;
            
            // 1. 타임라인 클립 드롭 처리
            const clipData = event.dataTransfer.getData('text/wai-clip');
            if (clipData) {
                try {
                    const clip = JSON.parse(clipData);
                    this.addMediaAsset({
                        name: clip.name || clip.fileName || 'Clip',
                        type: clip.type || 'video',
                        src: clip.src || '',
                        duration: clip.duration || 0,
                        thumbnail: clip.thumbnail || '',
                        resolution: clip.resolution || ''
                    });
                    return;
                } catch (e) {
                    console.warn('클립 데이터 파싱 오류:', e);
                }
            }
            
            // 2. 모달에서 드래그한 자산 처리
            const assetData = event.dataTransfer.getData('text/wai-asset');
            if (assetData) {
                try {
                    const assets = JSON.parse(assetData);
                    const assetArray = Array.isArray(assets) ? assets : [assets];
                    assetArray.forEach(asset => {
                        // 이미 존재하는 자산인지 확인 (src 기준)
                        const exists = this.mediaAssets.some(a => a.src === asset.src && asset.src);
                        if (!exists) {
                            this.addMediaAsset({
                                name: asset.name || 'Asset',
                                type: asset.type || 'video',
                                src: asset.src || '',
                                duration: this.parseDuration(asset.duration) || 0,
                                resolution: asset.resolution || ''
                            });
                        }
                    });
                    return;
                } catch (e) {
                    console.warn('자산 데이터 파싱 오류:', e);
                }
            }
            
            // 3. 외부 파일 드롭 처리
            if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                Array.from(event.dataTransfer.files).forEach(file => {
                    const url = URL.createObjectURL(file);
                    let type = 'video';
                    if (file.type.startsWith('image/')) type = 'image';
                    else if (file.type.startsWith('audio/')) type = 'sound';
                    
                    this.addMediaAsset({
                        name: file.name,
                        type: type,
                        src: url,
                        duration: 0
                    });
                });
            }
        },
        
        onMediaAssetDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            this.mediaAssetDragOver = true;
        },
        
        onMediaAssetDragLeave(event) {
            this.mediaAssetDragOver = false;
        },
        
        onMediaAssetDoubleClick(asset) {
            // 타임라인에 추가
            this.handleAssetAddToTimeline({ detail: [asset] });
        },
        
        getAssetIcon(type) {
            const icons = {
                video: 'fas fa-film',
                image: 'fas fa-image',
                sound: 'fas fa-music',
                effect: 'fas fa-wand-magic-sparkles'
            };
            return icons[type] || 'fas fa-file';
        },
        
        formatAssetDuration(seconds) {
            if (!seconds || seconds === 0) return '--:--';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        // --- Asset Event Listeners ---
        setupAssetEventListeners() {
            document.addEventListener('wai-asset-add-to-timeline', this.handleAssetAddToTimeline);
            document.addEventListener('wai-timeline-drop', this.handleTimelineDrop);
            document.addEventListener('wai-clip-to-asset', this.handleClipToAsset);
        },
        
        removeAssetEventListeners() {
            document.removeEventListener('wai-asset-add-to-timeline', this.handleAssetAddToTimeline);
            document.removeEventListener('wai-timeline-drop', this.handleTimelineDrop);
            document.removeEventListener('wai-clip-to-asset', this.handleClipToAsset);
        },
        
        // 타임라인 클립을 미디어 자산으로 추가하는 이벤트 핸들러
        handleClipToAsset(e) {
            const clip = e.detail;
            if (!clip) return;
            
            // 이미 존재하는 자산인지 확인
            const exists = this.mediaAssets.some(a => a.src === clip.src && clip.src);
            if (!exists) {
                this.addMediaAsset({
                    name: clip.name || 'Clip',
                    type: clip.type || 'video',
                    src: clip.src || '',
                    duration: clip.duration || 0,
                    resolution: clip.resolution || ''
                });
            }
        },
        
        handleAssetAddToTimeline(e) {
            const assets = e.detail;
            if (!assets || !Array.isArray(assets) || assets.length === 0) return;
            
            let targetTrack = this.tracks.find(t => t.isMain) || this.tracks[0];
            if (!targetTrack) return;
            
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
                
                this.clips.push(newClip);
                insertTime += duration;
            });
        },
        
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
                
                this.clips.push(newClip);
                insertTime += duration;
            });
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
            let lastTime = performance.now();
            
            const animate = (currentTime) => {
                if (!this.isPlaying) return;
                
                const delta = (currentTime - lastTime) / 1000;
                lastTime = currentTime;
                
                this.currentTime += delta;
                
                if (window.PreviewRenderer) {
                    window.PreviewRenderer.setCurrentTime(this.currentTime);
                }
                
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
            if (window.PreviewRenderer) {
                window.PreviewRenderer.setCurrentTime(0);
            }
        },
        
        seekToEnd() {
            this.currentTime = this.getMaxClipEnd();
            if (window.PreviewRenderer) {
                window.PreviewRenderer.setCurrentTime(this.currentTime);
            }
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
        copyInspectorId() {
            const id = this.inspector.id;
            if (!id) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(id.toString()).catch(err => console.warn('[Inspector] clipboard write failed', err));
            }
        },
        addCol() { this.layerCols.push({ id: `lc_${Date.now()}`, name: 'New', color: '#333' }); },
        openCtx(e, id) { this.ctxMenu = { x: e.clientX, y: e.clientY, id }; },
        setColColor(c) { 
            const col = this.layerCols.find(x => x.id === this.ctxMenu?.id);
            if(col) col.color = c;
            this.ctxMenu = null;
        },
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
            const lines = [];
            if (dataAction) lines.push(`data-action: ${dataAction}`);
            return lines.join('\n') || 'No dev info';
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
                const padding = 20; 
                const scale = Math.min((wrapper.clientWidth - padding)/this.canvasSize.w, (wrapper.clientHeight - padding)/this.canvasSize.h); 
                this.canvasScale = scale;
            };

            updateScale();
            if (window.ResizeObserver) {
                new ResizeObserver(updateScale).observe(wrapper);
            } else {
                window.addEventListener('resize', updateScale);
            }
        },
        
        recalculateCanvasScale() {
            const wrapper = document.getElementById('preview-canvas-wrapper');
            if (!wrapper) return;
            const padding = 20;
            this.canvasScale = Math.min((wrapper.clientWidth - padding)/this.canvasSize.w, (wrapper.clientHeight - padding)/this.canvasSize.h);
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
                x: 1920 - 200 + (colIdx*50), y: 1080 - 150 + (colIdx*50), w: 400, h: 300,
                rowType: type,
                isHidden: false
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
            if (id && id.startsWith('clip_box_')) return;
            
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
            }
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
                createdAt: new Date().toISOString(),
                folderId: 'root'
            }; 
            this.layerTemplates.push(newTpl);
            this.layerMainName = name; 
        },
        addClipFromDrop(fileType, trackIndex, time, assetName) {
            const trackId = this.tracks[trackIndex] ? this.tracks[trackIndex].id : null;
            if (!trackId) return;
            const newClip = {
                id: `c_${Date.now()}`, trackId, name: assetName, 
                start: time, duration: 10, type: fileType, volume: 100
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
        },
        
        // 트랙 높이 설정
        setTrackHeight(trackId, preset) {
            const track = this.tracks.find(t => t.id === trackId);
            if (!track) return;
            track.height = this.trackHeightPresets[preset] || this.trackHeightPresets.default;
        },
        
        handleCanvasAssetDrop(assetData, x, y) {
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
app.mount('#app-vue-root');
/* === END OF FILE === */
