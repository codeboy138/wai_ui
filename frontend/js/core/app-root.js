// ============================================
// WAI-UI App Root (Vue 3)
// 파일 위치: frontend/js/core/app-root.js
// ============================================

// Z_INDEX_OFFSETS와 COLORS는 js/utils/constants.js에서 전역으로 정의됨

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
        'ruler-line': RulerLine,
        'clip-box-manager': ClipBoxManager
    },
    data() {
        return {
            leftPanelWidth: 320, 
            rightPanelWidth: 320,
            previewContainerHeight: '50%', 
            timelineContainerHeight: '50%',
            isProjectModalOpen: false,
            isDevModeActive: false, 
            isDevModeFull: false,
            headerMenus: { create: false, assets: false, settings: false },
            headerSubmenus: { assetManage: false },
            projectManagerModal: { isOpen: false },
            assetManagerModal: { isOpen: false, assetType: 'video' },
            imageAssetModal: { isOpen: false },
            imageEffectModal: { isOpen: false },
            visualizationModal: { isOpen: false },
            apiManagerModal: { isOpen: false },
            selectedPrompt: null,
            // 초기 트랙: 메인 트랙 1개만
            tracks: [
                { id: 't1', name: 'Main', type: 'video', color: '#3b82f6', isMain: true, isHidden: false, isLocked: false, height: 80 }
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
            aspectRatio: '16:9',
            resolution: 'FHD',
            canvasSize: { w: 1920, h: 1080 }, 
            mouseCoord: { x: 0, y: 0 }, 
            isMouseOverCanvas: false,
            canvasScale: 1.0, 
            videoMetaCache: {},
            lastActiveClipId: null,
            aspectRatioOptions: ['원본', '16:9', '9:16', '4:3', '1:1', '21:9'],
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
            mediaAssets: [],
            mediaAssetCollapsed: false,
            mediaAssetDragOver: false,
            trackHeightPresets: { low: 40, medium: 80, high: 120, default: 80 },
            COLORS: typeof COLORS !== 'undefined' ? COLORS : []
        };
    },
    computed: {
        canvasScalerStyle: function() {
            return {
                width: this.canvasSize.w + 'px', 
                height: this.canvasSize.h + 'px', 
                backgroundColor: '#000', 
                transform: 'translate(-50%, -50%) scale(' + this.canvasScale + ')',
                position: 'absolute', 
                top: '50%', 
                left: '50%'
            };
        },
        activeClipBoxes: function() {
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
                    var baseZIndex = (totalTracks - trackIndex) * 100;
                    var box = {
                        id: 'clip_box_' + clip.id, clipId: clip.id, clipStart: clip.start, clipDuration: clip.duration,
                        x: 0, y: 0, w: self.canvasSize.w, h: self.canvasSize.h, zIndex: baseZIndex,
                        color: track.color || '#3b82f6', layerBgColor: 'transparent', isHidden: false,
                        layerName: clip.name || 'Clip', rowType: clip.type === 'sound' ? 'EFF' : 'BG',
                        volume: clip.volume || 100, isMuted: clip.isMuted || false
                    };
                    if (clip.type === 'video' && clip.src) { box.mediaType = 'video'; box.mediaSrc = clip.src; box.mediaFit = 'contain'; }
                    else if (clip.type === 'image' && clip.src) { box.mediaType = 'image'; box.mediaSrc = clip.src; box.mediaFit = 'contain'; }
                    else { box.mediaType = 'none'; box.mediaSrc = ''; }
                    activeBoxes.push(box);
                });
            });
            return activeBoxes;
        },
        allVisibleBoxes: function() {
            var layerBoxes = this.canvasBoxes.filter(function(box) { return !box.isHidden; });
            var clipBoxes = this.activeClipBoxes;
            var maxClipZIndex = 0;
            clipBoxes.forEach(function(box) { if (box.zIndex > maxClipZIndex) maxClipZIndex = box.zIndex; });
            var adjustedLayerBoxes = layerBoxes.map(function(box) {
                return Object.assign({}, box, { zIndex: (box.zIndex || 100) + maxClipZIndex + 100 });
            });
            var allBoxes = clipBoxes.concat(adjustedLayerBoxes);
            return allBoxes.sort(function(a, b) { return (a.zIndex || 0) - (b.zIndex || 0); });
        },
        activeVideoClip: function() {
            var self = this;
            var currentTime = this.currentTime;
            for (var i = 0; i < this.tracks.length; i++) {
                var track = this.tracks[i];
                if (track.isHidden) continue;
                var clip = this.clips.find(function(c) {
                    if (c.trackId !== track.id) return false;
                    if (c.type !== 'video') return false;
                    return currentTime >= c.start && currentTime < c.start + c.duration;
                });
                if (clip) return clip;
            }
            return null;
        },
