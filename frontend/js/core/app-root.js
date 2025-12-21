const { createApp, reactive, ref, onMounted, computed, nextTick } = Vue;

const Z_INDEX_OFFSETS = { 'BG': 20, 'TXT': 40, 'VID': 60, 'EFF': 80 };
const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#d946ef', '#f43f5e', '#ffffff', '#9ca3af',
    '#4b5563', '#000000', '#7f1d1d', '#7c2d12', '#78350f',
    '#365314', '#14532d', '#064e3b', '#164e63', '#0c4a6e',
    '#1e3a8a', '#312e81', '#4c1d95', '#701a75', '#881337'
];

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
            playbackLastTime: 0,
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
        // 트랙 순서 기반 z-index 계산 (위쪽 트랙 = 높은 z-index)
        activeClipBoxes() {
            var currentTime = this.currentTime;
            var activeBoxes = [];
            var self = this;
            var totalTracks = this.tracks.length;
            
            this.tracks.forEach(function(track, trackIndex) {
                if (track.isHidden) return;
                
                var trackClips = self.clips.filter(function(clip) {
                    if (clip.trackId !== track.id) return false;
                    var clipEnd = clip.start + clip.duration;
                    return currentTime >= clip.start && currentTime < clipEnd;
                });
                
                trackClips.forEach(function(clip) {
                    // z-index: 위쪽 트랙(인덱스 작음) = 높은 z-index
                    // 트랙 인덱스 0이 가장 위 = 가장 높은 z-index
                    var baseZIndex = (totalTracks - trackIndex) * 100;
                    
                    var box = {
                        id: 'clip_box_' + clip.id,
                        clipId: clip.id,
                        clipStart: clip.start,
                        clipDuration: clip.duration,
                        x: 0,
                        y: 0,
                        w: self.canvasSize.w,
                        h: self.canvasSize.h,
                        zIndex: baseZIndex,
                        color: track.color || '#3b82f6',
                        layerBgColor: 'transparent',
                        isHidden: false,
                        layerName: clip.name || 'Clip',
                        rowType: clip.type === 'sound' ? 'EFF' : 'BG',
                        volume: clip.volume || 100,
                        isMuted: clip.isMuted || false
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
            var layerBoxes = this.canvasBoxes.filter(function(box) { return !box.isHidden; });
            var clipBoxes = this.activeClipBoxes;
            
            // 클립 박스가 먼저, 레이어 박스가 위에 (레이어 박스는 더 높은 z-index)
            var maxClipZIndex = 0;
            clipBoxes.forEach(function(box) {
                if (box.zIndex > maxClipZIndex) maxClipZIndex = box.zIndex;
            });
            
            // 레이어 박스 z-index 조정 (클립 위에 표시)
            var adjustedLayerBoxes = layerBoxes.map(function(box) {
                return Object.assign({}, box, {
                    zIndex: (box.zIndex || 100) + maxClipZIndex + 100
                });
            });
            
            var allBoxes = clipBoxes.concat(adjustedLayerBoxes);
            return allBoxes.sort(function(a, b) { return (a.zIndex || 0) - (b.zIndex || 0); });
        },
        layerConfigBox() {
            if (!this.layerConfig.isOpen || !this.layerConfig.boxId) return null;
            return this.canvasBoxes.find(function(b) { return b.id === this.layerConfig.boxId; }.bind(this)) || null;
        },
        mediaAssetCount() {
            return this.mediaAssets.length;
        }
    },
    watch: {
        aspectRatio: function(newRatio) {
            this.updateCanvasSizeFromAspectRatio(newRatio);
        }
    },
    mounted() {
        this.$nextTick(function() { 
            this.setupPanelResizers(); 
            this.setupCanvasScaler(); 
            this.setupInspectorMode(); 
            this.setupAssetEventListeners();
            this.setupHeaderMenuClose();
            this.setupKeyboardShortcuts();
            this.initPreviewRenderer();
        });
        window.vm = this; 
    },
    beforeUnmount() {
        this.removeAssetEventListeners();
        this.removeKeyboardShortcuts();
        if (this.playbackTimer) {
            cancelAnimationFrame(this.playbackTimer);
        }
        if (this._headerMenuCloseHandler) {
            document.removeEventListener('click', this._headerMenuCloseHandler);
        }
    },
    methods: {
        // --- 키보드 단축키 설정 ---
        setupKeyboardShortcuts: function() {
            var self = this;
            this._keyboardHandler = function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                    return;
                }
                
                if (e.code === 'Space') {
                    e.preventDefault();
                    self.togglePlayback();
                }
                if (e.code === 'Home') {
                    e.preventDefault();
                    self.seekToStart();
                }
                if (e.code === 'End') {
                    e.preventDefault();
                    self.seekToEnd();
                }
                if (e.code === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    self.seekBackward();
                }
                if (e.code === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    self.seekForward();
                }
            };
            document.addEventListener('keydown', this._keyboardHandler);
        },
        
        removeKeyboardShortcuts: function() {
            if (this._keyboardHandler) {
                document.removeEventListener('keydown', this._keyboardHandler);
            }
        },
        
        // --- 화면 비율에 따른 캔버스 크기 업데이트 ---
        updateCanvasSizeFromAspectRatio: function(ratio) {
            var baseHeight = 1080;
            var w, h;
            
            switch(ratio) {
                case '원본': w = 1920; h = 1080; break;
                case '16:9': w = Math.round(baseHeight * 16 / 9); h = baseHeight; break;
                case '9:16': w = Math.round(baseHeight * 9 / 16); h = baseHeight; break;
                case '4:3': w = Math.round(baseHeight * 4 / 3); h = baseHeight; break;
                case '1:1': w = baseHeight; h = baseHeight; break;
                case '21:9': w = Math.round(baseHeight * 21 / 9); h = baseHeight; break;
                default: w = 1920; h = 1080;
            }
            
            this.canvasSize = { w: w, h: h };
            this.recalculateCanvasScale();
            
            if (window.PreviewRenderer) {
                window.PreviewRenderer.setCanvasSize(this.canvasSize);
            }
        },
        
        // --- Preview Renderer 초기화 ---
        initPreviewRenderer: function() {
            var canvas = document.getElementById('preview-render-canvas');
            if (canvas && window.PreviewRenderer) {
                window.PreviewRenderer.init(canvas, this);
            }
        },
        
        // --- Header Menu Methods ---
        setupHeaderMenuClose: function() {
            var self = this;
            this._headerMenuCloseHandler = function(e) {
                var isInsideMenu = e.target.closest('.header-menu-wrapper');
                if (!isInsideMenu) self.closeAllHeaderMenus();
            };
            document.addEventListener('click', this._headerMenuCloseHandler);
        },
        closeAllHeaderMenus: function() {
            this.headerMenus.create = false;
            this.headerMenus.assets = false;
            this.headerMenus.settings = false;
            this.headerSubmenus.assetManage = false;
        },
        toggleHeaderMenu: function(menu) {
            var wasOpen = this.headerMenus[menu];
            this.closeAllHeaderMenus();
            this.headerMenus[menu] = !wasOpen;
        },
        toggleHeaderSubmenu: function(submenu) { 
            this.headerSubmenus[submenu] = !this.headerSubmenus[submenu]; 
        },
        
        // --- Modal Methods ---
        openProjectManager: function() { this.closeAllHeaderMenus(); this.projectManagerModal.isOpen = true; },
        closeProjectManager: function() { this.projectManagerModal.isOpen = false; },
        openAssetManager: function(assetType) { this.closeAllHeaderMenus(); this.assetManagerModal.assetType = assetType || 'video'; this.assetManagerModal.isOpen = true; },
        closeAssetManager: function() { this.assetManagerModal.isOpen = false; },
        openImageAssetModal: function() { this.closeAllHeaderMenus(); this.imageAssetModal.isOpen = true; },
        closeImageAssetModal: function() { this.imageAssetModal.isOpen = false; },
        openImageEffectModal: function() { this.closeAllHeaderMenus(); this.imageEffectModal.isOpen = true; },
        closeImageEffectModal: function() { this.imageEffectModal.isOpen = false; },
        openVisualizationModal: function() { this.closeAllHeaderMenus(); this.visualizationModal.isOpen = true; },
        closeVisualizationModal: function() { this.visualizationModal.isOpen = false; },
        openApiManagerModal: function() { this.closeAllHeaderMenus(); this.apiManagerModal.isOpen = true; },
        closeApiManagerModal: function() { this.apiManagerModal.isOpen = false; },
        openAccountManager: function() { 
            this.closeAllHeaderMenus(); 
            Swal.fire({ icon: 'info', title: '계정관리', text: '계정관리 기능은 준비 중입니다.', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' }); 
        },
        handleLogout: function() {
            var self = this;
            this.closeAllHeaderMenus();
            Swal.fire({ title: '로그아웃', text: '정말 로그아웃 하시겠습니까?', icon: 'question', showCancelButton: true, confirmButtonText: '로그아웃', cancelButtonText: '취소', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#ef4444' }).then(function(result) {
                if (result.isConfirmed) Swal.fire({ icon: 'success', title: '로그아웃 완료', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            });
        },
        
        // --- Layer Config/Template Modal Methods ---
        openLayerConfig: function(boxId) { this.layerConfig.isOpen = true; this.layerConfig.boxId = boxId; this.setSelectedBoxId(boxId); },
        closeLayerConfig: function() { this.layerConfig.isOpen = false; this.layerConfig.boxId = null; },
        deleteLayerFromConfig: function() { var box = this.layerConfigBox; if (box) this.removeBox(box.id); this.closeLayerConfig(); },
        openLayerTemplateModal: function() { this.layerTemplateModal.isOpen = true; },
        closeLayerTemplateModal: function() { this.layerTemplateModal.isOpen = false; },
        deleteLayerTemplate: function(templateId) { this.layerTemplates = this.layerTemplates.filter(function(t) { return t.id !== templateId; }); },
        loadLayerTemplate: function(template) {
            if (!template || !template.matrixJson) return;
            try {
                var parsed = JSON.parse(template.matrixJson);
                if (parsed.canvasBoxes && Array.isArray(parsed.canvasBoxes)) {
                    var newBoxes = parsed.canvasBoxes.map(function(box) { 
                        return Object.assign({}, box, { id: 'box_' + box.slotKey + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) }); 
                    });
                    this.canvasBoxes = newBoxes;
                }
                this.layerMainName = template.name || '';
            } catch (err) {
                console.error('[loadLayerTemplate] parse error:', err);
            }
        },
        updateLayerTemplates: function(templates) { this.layerTemplates = templates; },
        updateLayerTemplateFolders: function(folders) { this.layerTemplateFolders = folders; },
        
        // --- 미디어 자산 관리 ---
        toggleMediaAssetPanel: function() {
            this.mediaAssetCollapsed = !this.mediaAssetCollapsed;
        },
        
        addMediaAsset: function(asset) {
            var newAsset = {
                id: 'asset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
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
        
        removeMediaAsset: function(assetId) {
            var idx = this.mediaAssets.findIndex(function(a) { return a.id === assetId; });
            if (idx !== -1) {
                this.mediaAssets.splice(idx, 1);
            }
        },
        
        clearMediaAssets: function() {
            if (confirm('모든 미디어 자산을 삭제하시겠습니까?')) {
                this.mediaAssets = [];
            }
        },
        
        onMediaAssetDragStart: function(event, asset) {
            var transferData = [{
                type: asset.type,
                id: asset.id,
                name: asset.name,
                src: asset.src || '',
                duration: asset.duration || 10,
                resolution: asset.resolution || ''
            }];
            event.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            event.dataTransfer.effectAllowed = 'copy';
            
            var dragImage = document.createElement('div');
            var icons = { video: '🎬', image: '🖼️', sound: '🎵' };
            dragImage.textContent = (icons[asset.type] || '📁') + ' ' + asset.name;
            dragImage.style.cssText = 'position:absolute;top:-1000px;padding:8px 16px;background:#3b82f6;color:#fff;border-radius:6px;font-size:12px;font-weight:bold;white-space:nowrap;';
            document.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(function() { document.body.removeChild(dragImage); }, 0);
        },
        
        onMediaAssetDrop: function(event) {
            var self = this;
            event.preventDefault();
            this.mediaAssetDragOver = false;
            
            var clipData = event.dataTransfer.getData('text/wai-clip');
            if (clipData) {
                try {
                    var clip = JSON.parse(clipData);
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
            
            var assetData = event.dataTransfer.getData('text/wai-asset');
            if (assetData) {
                try {
                    var assets = JSON.parse(assetData);
                    var assetArray = Array.isArray(assets) ? assets : [assets];
                    assetArray.forEach(function(asset) {
                        var exists = self.mediaAssets.some(function(a) { return a.src === asset.src && asset.src; });
                        if (!exists) {
                            self.addMediaAsset({
                                name: asset.name || 'Asset',
                                type: asset.type || 'video',
                                src: asset.src || '',
                                duration: self.parseDuration(asset.duration) || 0,
                                resolution: asset.resolution || ''
                            });
                        }
                    });
                    return;
                } catch (e) {
                    console.warn('자산 데이터 파싱 오류:', e);
                }
            }
            
            if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                Array.from(event.dataTransfer.files).forEach(function(file) {
                    var url = URL.createObjectURL(file);
                    var type = 'video';
                    if (file.type.startsWith('image/')) type = 'image';
                    else if (file.type.startsWith('audio/')) type = 'sound';
                    
                    self.addMediaAsset({
                        name: file.name,
                        type: type,
                        src: url,
                        duration: 0
                    });
                });
            }
        },
        
        onMediaAssetDragOver: function(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            this.mediaAssetDragOver = true;
        },
        
        onMediaAssetDragLeave: function(event) {
            this.mediaAssetDragOver = false;
        },
        
        onMediaAssetDoubleClick: function(asset) {
            this.handleAssetAddToTimeline({ detail: [asset] });
        },
        
        getAssetIcon: function(type) {
            var icons = {
                video: 'fas fa-film',
                image: 'fas fa-image',
                sound: 'fas fa-music',
                effect: 'fas fa-wand-magic-sparkles'
            };
            return icons[type] || 'fas fa-file';
        },
        
        formatAssetDuration: function(seconds) {
            if (!seconds || seconds === 0) return '--:--';
            var mins = Math.floor(seconds / 60);
            var secs = Math.floor(seconds % 60);
            return mins + ':' + secs.toString().padStart(2, '0');
        },
        
        // --- Asset Event Listeners ---
        setupAssetEventListeners: function() {
            this._handleAssetAddToTimeline = this.handleAssetAddToTimeline.bind(this);
            this._handleTimelineDrop = this.handleTimelineDrop.bind(this);
            this._handleClipToAsset = this.handleClipToAsset.bind(this);
            document.addEventListener('wai-asset-add-to-timeline', this._handleAssetAddToTimeline);
            document.addEventListener('wai-timeline-drop', this._handleTimelineDrop);
            document.addEventListener('wai-clip-to-asset', this._handleClipToAsset);
        },
        
        removeAssetEventListeners: function() {
            document.removeEventListener('wai-asset-add-to-timeline', this._handleAssetAddToTimeline);
            document.removeEventListener('wai-timeline-drop', this._handleTimelineDrop);
            document.removeEventListener('wai-clip-to-asset', this._handleClipToAsset);
        },
        
        handleClipToAsset: function(e) {
            var clip = e.detail;
            if (!clip) return;
            
            var self = this;
            var exists = this.mediaAssets.some(function(a) { return a.src === clip.src && clip.src; });
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
        
        handleAssetAddToTimeline: function(e) {
            var assets = e.detail;
            if (!assets || !Array.isArray(assets) || assets.length === 0) return;
            
            var self = this;
            var targetTrack = this.tracks.find(function(t) { return t.isMain; }) || this.tracks[0];
            if (!targetTrack) return;
            
            var insertTime = this.currentTime;
            
            assets.forEach(function(asset) {
                var duration = self.parseDuration(asset.duration) || 10;
                var newClip = {
                    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    trackId: targetTrack.id,
                    name: asset.name || 'Untitled',
                    start: insertTime,
                    duration: duration,
                    type: asset.type || 'video',
                    src: asset.src || '',
                    volume: 100
                };
                
                self.clips.push(newClip);
                insertTime += duration;
            });
        },
        
        handleTimelineDrop: function(e) {
            var detail = e.detail;
            var assets = detail.assets;
            var dropTime = detail.dropTime;
            var targetTrackId = detail.targetTrackId;
            
            if (!assets || assets.length === 0) return;
            
            var self = this;
            var trackId = targetTrackId;
            if (!trackId) {
                var mainTrack = this.tracks.find(function(t) { return t.isMain; }) || this.tracks[0];
                trackId = mainTrack ? mainTrack.id : null;
            }
            if (!trackId) return;
            
            var insertTime = dropTime || this.currentTime;
            
            assets.forEach(function(asset) {
                var duration = self.parseDuration(asset.duration) || 10;
                var newClip = {
                    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    trackId: trackId,
                    name: asset.name || 'Untitled',
                    start: insertTime,
                    duration: duration,
                    type: asset.type || 'video',
                    src: asset.src || '',
                    volume: 100
                };
                
                self.clips.push(newClip);
                insertTime += duration;
            });
        },
        
        parseDuration: function(durationStr) {
            if (!durationStr) return null;
            if (typeof durationStr === 'number') return durationStr;
            var parts = durationStr.split(':');
            if (parts.length === 2) return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
            if (parts.length === 3) return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
            return parseFloat(durationStr) || null;
        },
        
        // --- Playback Controls ---
        togglePlayback: function() {
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                this.startPlayback();
            } else {
                this.stopPlayback();
            }
        },
        
        startPlayback: function() {
            var self = this;
            this.playbackLastTime = performance.now();
            
            var animate = function(currentTime) {
                if (!self.isPlaying) return;
                
                var delta = (currentTime - self.playbackLastTime) / 1000;
                self.playbackLastTime = currentTime;
                
                self.currentTime += delta;
                
                if (window.PreviewRenderer) {
                    window.PreviewRenderer.setCurrentTime(self.currentTime);
                }
                
                self.scrollToPlayhead();
                
                var maxTime = self.getMaxClipEnd();
                if (self.currentTime >= maxTime) {
                    self.currentTime = maxTime;
                    self.isPlaying = false;
                    return;
                }
                
                self.playbackTimer = requestAnimationFrame(animate);
            };
            
            this.playbackTimer = requestAnimationFrame(animate);
        },
        
        stopPlayback: function() {
            if (this.playbackTimer) {
                cancelAnimationFrame(this.playbackTimer);
                this.playbackTimer = null;
            }
        },
        
        scrollToPlayhead: function() {
            var container = document.getElementById('timeline-scroll-container');
            if (!container) return;
            
            var playheadPosition = this.currentTime * this.zoom;
            var scrollLeft = container.scrollLeft;
            var viewportWidth = container.clientWidth;
            var margin = 100;
            
            if (playheadPosition > scrollLeft + viewportWidth - margin) {
                container.scrollLeft = playheadPosition - viewportWidth + margin;
            }
            else if (playheadPosition < scrollLeft + margin) {
                container.scrollLeft = Math.max(0, playheadPosition - margin);
            }
        },
        
        seekToStart: function() {
            this.currentTime = 0;
            if (window.PreviewRenderer) {
                window.PreviewRenderer.setCurrentTime(0);
            }
        },
        
        seekToEnd: function() {
            this.currentTime = this.getMaxClipEnd();
            if (window.PreviewRenderer) {
                window.PreviewRenderer.setCurrentTime(this.currentTime);
            }
        },
        
        seekBackward: function() {
            this.currentTime = Math.max(0, this.currentTime - 5);
            if (window.PreviewRenderer) {
                window.PreviewRenderer.setCurrentTime(this.currentTime);
            }
        },
        
        seekForward: function() {
            var maxTime = this.getMaxClipEnd();
            this.currentTime = Math.min(maxTime, this.currentTime + 5);
            if (window.PreviewRenderer) {
                window.PreviewRenderer.setCurrentTime(this.currentTime);
            }
        },
        
        getMaxClipEnd: function() {
            var max = 0;
            this.clips.forEach(function(c) {
                var end = c.start + c.duration;
                if (end > max) max = end;
            });
            return max || 60;
        },

        // --- System & Dev Mode ---
        firePython: function(f) {
            console.log('Py:', f);
            if (window.backend && window.backend[f]) {
                window.backend[f]();
            } else {
                console.log('[DUMMY] Python call: ' + f);
            }
        },
        toggleDevMode: function(mode) {
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
        copyInspectorId: function() {
            var id = this.inspector.id;
            if (!id) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(id.toString()).catch(function(err) { console.warn('[Inspector] clipboard write failed', err); });
            }
        },
        addCol: function() { this.layerCols.push({ id: 'lc_' + Date.now(), name: 'New', color: '#333' }); },
        openCtx: function(e, id) { this.ctxMenu = { x: e.clientX, y: e.clientY, id: id }; },
        setColColor: function(c) { 
            var self = this;
            var col = this.layerCols.find(function(x) { return x.id === self.ctxMenu.id; });
            if(col) col.color = c;
            this.ctxMenu = null;
        },
        setupInspectorMode: function() {
            var self = this;
            document.addEventListener('mousemove', function(e) {
                if (!self.isDevModeActive && !self.isDevModeFull) return;

                var target = e.target;
                if (target.classList.contains('dev-highlight') || target.classList.contains('dev-tooltip')) {
                    var realTarget = document.elementFromPoint(e.clientX, e.clientY);
                    if (realTarget) target = realTarget;
                }

                if (target && target.tagName !== 'HTML' && target.tagName !== 'BODY') {
                    var rect = target.getBoundingClientRect();
                    
                    self.highlightStyle = {
                        width: rect.width + 'px',
                        height: rect.height + 'px',
                        top: rect.top + 'px',
                        left: rect.left + 'px',
                    };

                    var devInfo = self.isDevModeFull ? self.buildDevInfo(target) : '';

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

                    var top = rect.top - 80 - 10;
                    var left = rect.left + rect.width + 10;
                    if (top < 10) top = rect.bottom + 10;
                    if (top + 150 > window.innerHeight - 10) top = Math.max(10, window.innerHeight - 150 - 10);
                    if (left + 260 > window.innerWidth - 10) {
                        left = rect.left - 260 - 10;
                        if (left < 10) left = Math.max(10, window.innerWidth - 260 - 10);
                    }
                    self.tooltipStyle = { top: top + 'px', left: left + 'px' };
                } else {
                    self.inspector = { tag: '', id: '', className: '', x: 0, y: 0, w: 0, h: 0, dataDev: '' };
                }
            });
        },
        buildDevInfo: function(targetEl) {
            var id = targetEl.id || '';
            var dataAction = targetEl.getAttribute('data-action') || '';
            var lines = [];
            if (dataAction) lines.push('data-action: ' + dataAction);
            return lines.join('\n') || 'No dev info';
        },

        // --- Preview/Canvas Logic ---
        setAspect: function(r) { 
            this.aspectRatio = r; 
        },
        setResolution: function(r) { 
            this.resolution = r; 
        },
        updateCanvasMouseCoord: function(e) {
            var wrapper = document.getElementById('preview-canvas-wrapper');
            var scaler = document.getElementById('preview-canvas-scaler');
            if (!wrapper || !scaler) return;

            var wrapperRect = wrapper.getBoundingClientRect();
            var scalerRect = scaler.getBoundingClientRect();
            
            var padding = 20; 

            var mouseX = e.clientX - wrapperRect.left - padding;
            var mouseY = e.clientY - wrapperRect.top - padding;
            
            this.isMouseOverCanvas = mouseX > 0 && mouseY > 0 && mouseX < wrapperRect.width - padding && mouseY < wrapperRect.height - padding;
            
            this.mouseMarkerPos = { x: mouseX + padding, y: mouseY + padding };

            var canvasX = e.clientX - scalerRect.left;
            var canvasY = e.clientY - scalerRect.top;
            
            var scale = this.canvasScale;
            var realX = canvasX / scale;
            var realY = canvasY / scale;

            this.mouseCoord = { 
                x: Math.min(this.canvasSize.w, Math.max(0, realX)), 
                y: Math.min(this.canvasSize.h, Math.max(0, realY))
            };
        },
        
        // --- Layout Resizer Handlers ---
        setupPanelResizers: function() {
            var self = this;
            var setup = function(rid, stateKey, minSize, dir, isReverse) {
                isReverse = isReverse || false;
                var r = document.getElementById(rid);
                if (!r) return;
                
                var startS, startP;

                var onMove = function(ev) {
                    var diff = (dir === 'w' ? ev.clientX : ev.clientY) - startP;
                    var newSize;
                    
                    if (dir === 'w') {
                        newSize = isReverse ? startS - diff : startS + diff;
                        self[stateKey] = Math.max(minSize, newSize);
                    } else { 
                        var headerHeight = 48; 
                        var targetHeight = ev.clientY - headerHeight - 2; 
                        
                        newSize = targetHeight;
                        var effectiveHeight = Math.max(minSize, newSize);

                        self.previewContainerHeight = effectiveHeight + 'px';
                        self.timelineContainerHeight = 'calc(100% - ' + effectiveHeight + 'px)';
                    }
                    self.recalculateCanvasScale();
                };
                
                var onUp = function() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };

                r.addEventListener('mousedown', function(e) {
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
        
        setupCanvasScaler: function() {
            var self = this;
            var wrapper = document.getElementById('preview-canvas-wrapper');
            if (!wrapper) return;
            
            var updateScale = function() {
                var padding = 20; 
                var scale = Math.min((wrapper.clientWidth - padding)/self.canvasSize.w, (wrapper.clientHeight - padding)/self.canvasSize.h); 
                self.canvasScale = scale;
            };

            updateScale();
            if (window.ResizeObserver) {
                new ResizeObserver(updateScale).observe(wrapper);
            } else {
                window.addEventListener('resize', updateScale);
            }
        },
        
        recalculateCanvasScale: function() {
            var wrapper = document.getElementById('preview-canvas-wrapper');
            if (!wrapper) return;
            var padding = 20;
            this.canvasScale = Math.min((wrapper.clientWidth - padding)/this.canvasSize.w, (wrapper.clientHeight - padding)/this.canvasSize.h);
        },

        // --- Core Model Methods (Clips/Boxes) ---
        getZIndex: function(colIdx, type) {
            var base = (colIdx * 100) + 100;
            var offset = Z_INDEX_OFFSETS[type] || 60;
            return base + offset;
        },
        addLayerBox: function(colIdx, type, color) {
            var zIndex = this.getZIndex(colIdx, type);
            var newBox = {
                id: 'box_' + Date.now(), 
                colIdx: colIdx, 
                type: type, 
                zIndex: zIndex, 
                color: color,
                x: 1920 - 200 + (colIdx*50), 
                y: 1080 - 150 + (colIdx*50), 
                w: 400, 
                h: 300,
                rowType: type,
                isHidden: false
            };
            this.canvasBoxes.push(newBox);
        },
        removeBox: function(id) {
            this.canvasBoxes = this.canvasBoxes.filter(function(b) { return b.id !== id; });
            if (this.selectedBoxId === id) this.selectedBoxId = null;
        },
        setSelectedBoxId: function(id) {
            this.selectedBoxId = (this.selectedBoxId === id) ? null : id;
            this.selectedClip = null;
        },
        updateBoxPosition: function(id, x, y, w, h, isResizeEnd) {
            isResizeEnd = isResizeEnd || false;
            if (id && id.startsWith('clip_box_')) return;
            
            var index = this.canvasBoxes.findIndex(function(b) { return b.id === id; });
            if (index !== -1) {
                var box = this.canvasBoxes[index];
                var newBoxes = this.canvasBoxes.slice();
                newBoxes[index] = Object.assign({}, box, {
                    x: x !== undefined ? x : box.x, 
                    y: y !== undefined ? y : box.y,
                    w: w !== undefined ? w : box.w,
                    h: h !== undefined ? h : box.h
                });
                this.canvasBoxes = newBoxes;
            }
        },
        removeClip: function(id) {
            this.clips = this.clips.filter(function(c) { return c.id !== id; });
            if (this.selectedClip && this.selectedClip.id === id) {
                this.selectedClip = null;
            }
        },
        setSelectedClip: function(clip) {
            this.selectedClip = (this.selectedClip && this.selectedClip.id === clip.id) ? null : clip;
            this.selectedBoxId = null;
        },
        moveTrack: function(fromIndex, toIndex) {
            var tracks = this.tracks.slice();
            var removed = tracks.splice(fromIndex, 1)[0];
            tracks.splice(toIndex, 0, removed);
            this.tracks = tracks;
        },
        saveLayerTemplate: function(name, matrixJson) {
            var newTpl = { 
                id: 'tpl_' + Date.now(), 
                name: name, 
                cols: this.layerCols.map(function(c) { return Object.assign({}, c); }), 
                matrixJson: matrixJson || null,
                createdAt: new Date().toISOString(),
                folderId: 'root'
            }; 
            this.layerTemplates.push(newTpl);
            this.layerMainName = name; 
        },
        addClipFromDrop: function(fileType, trackIndex, time, assetName) {
            var trackId = this.tracks[trackIndex] ? this.tracks[trackIndex].id : null;
            if (!trackId) return;
            var newClip = {
                id: 'c_' + Date.now(), 
                trackId: trackId, 
                name: assetName, 
                start: time, 
                duration: 10, 
                type: fileType, 
                volume: 100
            };
            this.clips.push(newClip);
        },
        updateClip: function(clipId, startChange, durationChange) {
            var index = this.clips.findIndex(function(c) { return c.id === clipId; });
            if (index !== -1) {
                var clip = this.clips[index];
                var newClips = this.clips.slice();
                
                var newStart = Math.max(0, clip.start + startChange); 
                var newDuration = Math.max(0.1, clip.duration + durationChange - (newStart - clip.start));
                
                newClips[index] = Object.assign({}, clip, {
                    start: newStart,
                    duration: newDuration
                });
                this.clips = newClips;
            }
        },
        moveClip: function(clipId, timeChange) {
            var index = this.clips.findIndex(function(c) { return c.id === clipId; });
            if (index !== -1) {
                var clip = this.clips[index];
                var newClips = this.clips.slice();
                newClips[index] = Object.assign({}, clip, {
                    start: Math.max(0, clip.start + timeChange)
                });
                this.clips = newClips;
            }
        },
        
        setTrackHeight: function(trackId, preset) {
            var track = this.tracks.find(function(t) { return t.id === trackId; });
            if (!track) return;
            track.height = this.trackHeightPresets[preset] || this.trackHeightPresets.default;
        },
        
        handleCanvasAssetDrop: function(assetData, x, y) {
            var self = this;
            var assets = Array.isArray(assetData) ? assetData : [assetData];
            
            assets.forEach(function(asset, index) {
                var defaultW = self.canvasSize.w / 2;
                var defaultH = self.canvasSize.h / 2;
                var boxX = Math.max(0, Math.min(self.canvasSize.w - defaultW, x - defaultW / 2 + index * 50));
                var boxY = Math.max(0, Math.min(self.canvasSize.h - defaultH, y - defaultH / 2 + index * 50));
                
                var newBox = {
                    id: 'box_drop_' + Date.now() + '_' + index,
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
                
                self.canvasBoxes.push(newBox);
            });
        }
    }
};

var app = createApp(App);
app.mount('#app-vue-root');
