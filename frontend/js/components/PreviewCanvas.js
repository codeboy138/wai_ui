// Preview Canvas Component - Enhanced
// 캔버스 센터 유지, 레이어 라벨 크기 축소, 해상도 하이라이트, 영상 재생 연동

const PreviewCanvas = {
    props: ['vm'],
    template: `
        <div id="preview-main-container" class="flex flex-col h-full bg-bg-dark overflow-hidden">
            <!-- 프리뷰 툴바 -->
            <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-text-sub">프리뷰</span>
                    <div class="w-px h-4 bg-ui-border"></div>
                    <!-- 해상도 드롭다운 -->
                    <div class="wai-dropdown" ref="resolutionDropdown">
                        <button 
                            class="wai-dropdown-trigger text-[10px]" 
                            :class="{ 'open': isResolutionOpen, 'active-resolution': true }"
                            @click="isResolutionOpen = !isResolutionOpen"
                        >
                            <span>{{ currentResolutionLabel }}</span>
                            <i class="fa-solid fa-chevron-down text-[8px]"></i>
                        </button>
                        <div v-show="isResolutionOpen" class="wai-dropdown-menu">
                            <div 
                                v-for="res in resolutions" 
                                :key="res.value"
                                class="wai-dropdown-item"
                                :class="{ 'selected': vm.canvasResolution === res.value }"
                                @click="setResolution(res.value)"
                            >
                                {{ res.label }}
                            </div>
                        </div>
                    </div>
                    <div class="w-px h-4 bg-ui-border"></div>
                    <span class="text-[10px] text-text-sub">{{ canvasWidth }} × {{ canvasHeight }}</span>
                </div>
                <div class="flex items-center gap-1">
                    <button class="tool-btn" :class="{ 'active': vm.showSafeZone }" @click="vm.showSafeZone = !vm.showSafeZone" title="안전 영역">
                        <i class="fa-solid fa-border-all"></i>
                    </button>
                    <button class="tool-btn" :class="{ 'active': vm.showGrid }" @click="vm.showGrid = !vm.showGrid" title="그리드">
                        <i class="fa-solid fa-grip"></i>
                    </button>
                    <button class="tool-btn" @click="fitToScreen" title="화면에 맞추기">
                        <i class="fa-solid fa-expand"></i>
                    </button>
                    <div class="w-px h-4 bg-ui-border"></div>
                    <span class="text-[10px] text-text-sub">{{ Math.round(previewScale * 100) }}%</span>
                </div>
            </div>
            
            <!-- 캔버스 영역 -->
            <div 
                ref="canvasContainer" 
                class="flex-1 relative overflow-hidden flex items-center justify-center"
                @wheel.prevent="handleWheel"
            >
                <!-- 캔버스 래퍼 (센터 유지) -->
                <div 
                    ref="canvasWrapper"
                    class="relative"
                    :style="canvasWrapperStyle"
                >
                    <!-- 메인 캔버스 -->
                    <div 
                        ref="canvas"
                        class="preview-canvas relative overflow-hidden"
                        :style="canvasStyle"
                        @mousedown="handleCanvasMouseDown"
                    >
                        <!-- 비디오 요소 (타임라인 영상 재생) -->
                        <video
                            v-if="activeVideoClip"
                            ref="videoPlayer"
                            class="absolute inset-0 w-full h-full object-contain"
                            :src="activeVideoClip.src"
                            @loadedmetadata="onVideoLoaded"
                            @timeupdate="onVideoTimeUpdate"
                            @ended="onVideoEnded"
                            muted
                        ></video>
                        
                        <!-- 레이어들 -->
                        <div 
                            v-for="layer in visibleLayers" 
                            :key="layer.id"
                            class="absolute"
                            :style="getLayerStyle(layer)"
                            @mousedown.stop="selectLayer(layer, $event)"
                        >
                            <!-- 레이어 컨텐츠 -->
                            <div v-if="layer.type === 'text'" class="w-full h-full flex items-center justify-center" :style="getTextStyle(layer)">
                                {{ layer.content || layer.name }}
                            </div>
                            <div v-else-if="layer.type === 'image' && layer.src" class="w-full h-full">
                                <img :src="layer.src" class="w-full h-full object-contain" draggable="false" />
                            </div>
                            <div v-else-if="layer.type === 'shape'" class="w-full h-full" :style="getShapeStyle(layer)"></div>
                            <div v-else class="w-full h-full bg-gray-600/50 flex items-center justify-center">
                                <i class="fa-solid fa-cube text-white/50"></i>
                            </div>
                            
                            <!-- 레이어 라벨 (크기 고정) -->
                            <div class="canvas-layer-label absolute -top-3 left-0 bg-black/70 text-white rounded px-1">
                                {{ layer.name }}
                            </div>
                        </div>
                        
                        <!-- 선택된 레이어 핸들 -->
                        <div 
                            v-if="vm.selectedLayer && !vm.selectedLayer.isLocked"
                            class="absolute pointer-events-none"
                            :style="getSelectionStyle(vm.selectedLayer)"
                        >
                            <div class="absolute inset-0 border-2 border-ui-accent pointer-events-none"></div>
                            <!-- 리사이즈 핸들 -->
                            <div class="transform-handle tl pointer-events-auto" @mousedown.stop="startResize($event, 'tl')"></div>
                            <div class="transform-handle tr pointer-events-auto" @mousedown.stop="startResize($event, 'tr')"></div>
                            <div class="transform-handle bl pointer-events-auto" @mousedown.stop="startResize($event, 'bl')"></div>
                            <div class="transform-handle br pointer-events-auto" @mousedown.stop="startResize($event, 'br')"></div>
                            <div class="transform-handle tm pointer-events-auto" @mousedown.stop="startResize($event, 'tm')"></div>
                            <div class="transform-handle bm pointer-events-auto" @mousedown.stop="startResize($event, 'bm')"></div>
                            <div class="transform-handle ml pointer-events-auto" @mousedown.stop="startResize($event, 'ml')"></div>
                            <div class="transform-handle mr pointer-events-auto" @mousedown.stop="startResize($event, 'mr')"></div>
                            <!-- 회전 핸들 -->
                            <div class="rotation-handle pointer-events-auto" @mousedown.stop="startRotate($event)"></div>
                        </div>
                        
                        <!-- 안전 영역 -->
                        <template v-if="vm.showSafeZone">
                            <div class="safe-zone action"></div>
                            <div class="safe-zone title"></div>
                        </template>
                        
                        <!-- 그리드 -->
                        <div v-if="vm.showGrid" class="absolute inset-0 pointer-events-none" :style="gridStyle"></div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            previewScale: 1,
            minPadding: 40,
            isResolutionOpen: false,
            resolutions: [
                { label: '4K (3840×2160)', value: '4k' },
                { label: 'FHD (1920×1080)', value: 'fhd' },
                { label: 'HD (1280×720)', value: 'hd' },
                { label: 'SD (854×480)', value: 'sd' },
                { label: '정사각형 (1080×1080)', value: 'square' },
                { label: '세로 (1080×1920)', value: 'vertical' }
            ],
            isDraggingLayer: false,
            dragStartX: 0,
            dragStartY: 0,
            dragStartLayerX: 0,
            dragStartLayerY: 0,
            isResizing: false,
            resizeHandle: null,
            resizeStartX: 0,
            resizeStartY: 0,
            resizeStartLayer: null,
            isRotating: false,
            rotateStartAngle: 0,
            rotateStartLayerRotation: 0,
            rotateCenterX: 0,
            rotateCenterY: 0,
            videoSyncInterval: null
        };
    },
    computed: {
        canvasWidth() {
            const res = this.vm.canvasResolution || 'fhd';
            const sizes = { '4k': 3840, 'fhd': 1920, 'hd': 1280, 'sd': 854, 'square': 1080, 'vertical': 1080 };
            return sizes[res] || 1920;
        },
        canvasHeight() {
            const res = this.vm.canvasResolution || 'fhd';
            const sizes = { '4k': 2160, 'fhd': 1080, 'hd': 720, 'sd': 480, 'square': 1080, 'vertical': 1920 };
            return sizes[res] || 1080;
        },
        currentResolutionLabel() {
            const res = this.resolutions.find(r => r.value === this.vm.canvasResolution);
            return res ? res.label.split(' ')[0] : 'FHD';
        },
        canvasWrapperStyle() {
            return {
                width: this.canvasWidth * this.previewScale + 'px',
                height: this.canvasHeight * this.previewScale + 'px'
            };
        },
        canvasStyle() {
            return {
                width: this.canvasWidth + 'px',
                height: this.canvasHeight + 'px',
                transform: `scale(${this.previewScale})`,
                transformOrigin: 'top left',
                background: '#000'
            };
        },
        gridStyle() {
            const size = 50;
            return {
                backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${size}px ${size}px`
            };
        },
        visibleLayers() {
            if (!this.vm.layers) return [];
            return this.vm.layers.filter(l => l.isVisible !== false).reverse();
        },
        activeVideoClip() {
            if (!this.vm.clips || this.vm.clips.length === 0) return null;
            const currentTime = this.vm.currentTime || 0;
            
            // 현재 시간에 해당하는 비디오 클립 찾기
            for (const clip of this.vm.clips) {
                if (clip.type === 'video' && clip.src) {
                    if (currentTime >= clip.start && currentTime < clip.start + clip.duration) {
                        return clip;
                    }
                }
            }
            return null;
        }
    },
    watch: {
        'vm.canvasResolution'() {
            this.$nextTick(() => this.fitToScreen());
        },
        'vm.isPlaying'(newVal) {
            if (newVal) {
                this.startVideoSync();
            } else {
                this.stopVideoSync();
                this.pauseVideo();
            }
        },
        'vm.currentTime'() {
            this.syncVideoToTime();
        },
        activeVideoClip(newClip, oldClip) {
            if (newClip !== oldClip) {
                this.$nextTick(() => {
                    this.syncVideoToTime();
                });
            }
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.fitToScreen();
            window.addEventListener('resize', this.fitToScreen);
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
            document.addEventListener('click', this.handleDocumentClick);
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.fitToScreen);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('click', this.handleDocumentClick);
        this.stopVideoSync();
    },
    methods: {
        fitToScreen() {
            const container = this.$refs.canvasContainer;
            if (!container) return;
            
            const containerWidth = container.clientWidth - this.minPadding * 2;
            const containerHeight = container.clientHeight - this.minPadding * 2;
            
            if (containerWidth <= 0 || containerHeight <= 0) return;
            
            const scaleX = containerWidth / this.canvasWidth;
            const scaleY = containerHeight / this.canvasHeight;
            
            this.previewScale = Math.min(scaleX, scaleY, 1);
        },
        
        handleWheel(e) {
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            this.previewScale = Math.max(0.1, Math.min(2, this.previewScale + delta));
        },
        
        setResolution(value) {
            this.vm.canvasResolution = value;
            this.isResolutionOpen = false;
        },
        
        handleDocumentClick(e) {
            if (this.$refs.resolutionDropdown && !this.$refs.resolutionDropdown.contains(e.target)) {
                this.isResolutionOpen = false;
            }
        },
        
        getLayerStyle(layer) {
            return {
                left: (layer.x || 0) + 'px',
                top: (layer.y || 0) + 'px',
                width: (layer.width || 100) + 'px',
                height: (layer.height || 100) + 'px',
                transform: `rotate(${layer.rotation || 0}deg)`,
                opacity: layer.opacity !== undefined ? layer.opacity / 100 : 1,
                cursor: layer.isLocked ? 'not-allowed' : 'move'
            };
        },
        
        getTextStyle(layer) {
            return {
                fontSize: (layer.fontSize || 24) + 'px',
                fontFamily: layer.fontFamily || 'Arial',
                fontWeight: layer.fontWeight || 'normal',
                color: layer.color || '#ffffff',
                textAlign: layer.textAlign || 'center'
            };
        },
        
        getShapeStyle(layer) {
            const style = {
                backgroundColor: layer.fill || '#666666'
            };
            if (layer.shapeType === 'circle') {
                style.borderRadius = '50%';
            } else if (layer.shapeType === 'rounded') {
                style.borderRadius = '8px';
            }
            return style;
        },
        
        getSelectionStyle(layer) {
            return {
                left: (layer.x || 0) + 'px',
                top: (layer.y || 0) + 'px',
                width: (layer.width || 100) + 'px',
                height: (layer.height || 100) + 'px',
                transform: `rotate(${layer.rotation || 0}deg)`
            };
        },
        
        selectLayer(layer, e) {
            if (layer.isLocked) return;
            this.vm.setSelectedLayer(layer);
            
            this.isDraggingLayer = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragStartLayerX = layer.x || 0;
            this.dragStartLayerY = layer.y || 0;
        },
        
        handleCanvasMouseDown(e) {
            if (e.target === this.$refs.canvas) {
                this.vm.setSelectedLayer(null);
            }
        },
        
        startResize(e, handle) {
            this.isResizing = true;
            this.resizeHandle = handle;
            this.resizeStartX = e.clientX;
            this.resizeStartY = e.clientY;
            this.resizeStartLayer = {
                x: this.vm.selectedLayer.x || 0,
                y: this.vm.selectedLayer.y || 0,
                width: this.vm.selectedLayer.width || 100,
                height: this.vm.selectedLayer.height || 100
            };
        },
        
        startRotate(e) {
            if (!this.vm.selectedLayer) return;
            this.isRotating = true;
            
            const layer = this.vm.selectedLayer;
            this.rotateCenterX = (layer.x || 0) + (layer.width || 100) / 2;
            this.rotateCenterY = (layer.y || 0) + (layer.height || 100) / 2;
            
            const rect = this.$refs.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / this.previewScale;
            const mouseY = (e.clientY - rect.top) / this.previewScale;
            
            this.rotateStartAngle = Math.atan2(mouseY - this.rotateCenterY, mouseX - this.rotateCenterX);
            this.rotateStartLayerRotation = layer.rotation || 0;
        },
        
        handleMouseMove(e) {
            if (this.isDraggingLayer && this.vm.selectedLayer) {
                const dx = (e.clientX - this.dragStartX) / this.previewScale;
                const dy = (e.clientY - this.dragStartY) / this.previewScale;
                
                this.vm.selectedLayer.x = this.dragStartLayerX + dx;
                this.vm.selectedLayer.y = this.dragStartLayerY + dy;
            }
            
            if (this.isResizing && this.vm.selectedLayer) {
                const dx = (e.clientX - this.resizeStartX) / this.previewScale;
                const dy = (e.clientY - this.resizeStartY) / this.previewScale;
                const layer = this.vm.selectedLayer;
                const start = this.resizeStartLayer;
                
                switch (this.resizeHandle) {
                    case 'br':
                        layer.width = Math.max(20, start.width + dx);
                        layer.height = Math.max(20, start.height + dy);
                        break;
                    case 'bl':
                        layer.x = start.x + dx;
                        layer.width = Math.max(20, start.width - dx);
                        layer.height = Math.max(20, start.height + dy);
                        break;
                    case 'tr':
                        layer.y = start.y + dy;
                        layer.width = Math.max(20, start.width + dx);
                        layer.height = Math.max(20, start.height - dy);
                        break;
                    case 'tl':
                        layer.x = start.x + dx;
                        layer.y = start.y + dy;
                        layer.width = Math.max(20, start.width - dx);
                        layer.height = Math.max(20, start.height - dy);
                        break;
                    case 'tm':
                        layer.y = start.y + dy;
                        layer.height = Math.max(20, start.height - dy);
                        break;
                    case 'bm':
                        layer.height = Math.max(20, start.height + dy);
                        break;
                    case 'ml':
                        layer.x = start.x + dx;
                        layer.width = Math.max(20, start.width - dx);
                        break;
                    case 'mr':
                        layer.width = Math.max(20, start.width + dx);
                        break;
                }
            }
            
            if (this.isRotating && this.vm.selectedLayer) {
                const rect = this.$refs.canvas.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) / this.previewScale;
                const mouseY = (e.clientY - rect.top) / this.previewScale;
                
                const currentAngle = Math.atan2(mouseY - this.rotateCenterY, mouseX - this.rotateCenterX);
                const angleDiff = (currentAngle - this.rotateStartAngle) * (180 / Math.PI);
                
                this.vm.selectedLayer.rotation = this.rotateStartLayerRotation + angleDiff;
            }
        },
        
        handleMouseUp() {
            this.isDraggingLayer = false;
            this.isResizing = false;
            this.resizeHandle = null;
            this.isRotating = false;
        },
        
        // 비디오 재생 관련 메서드
        startVideoSync() {
            this.stopVideoSync();
            this.playVideo();
            
            this.videoSyncInterval = setInterval(() => {
                if (this.vm.isPlaying) {
                    this.vm.currentTime += 1/30; // 30fps 기준
                }
            }, 1000/30);
        },
        
        stopVideoSync() {
            if (this.videoSyncInterval) {
                clearInterval(this.videoSyncInterval);
                this.videoSyncInterval = null;
            }
        },
        
        playVideo() {
            const video = this.$refs.videoPlayer;
            if (video && this.activeVideoClip) {
                video.play().catch(e => console.log('Video play error:', e));
            }
        },
        
        pauseVideo() {
            const video = this.$refs.videoPlayer;
            if (video) {
                video.pause();
            }
        },
        
        syncVideoToTime() {
            const video = this.$refs.videoPlayer;
            if (!video || !this.activeVideoClip) return;
            
            const clip = this.activeVideoClip;
            const clipLocalTime = this.vm.currentTime - clip.start;
            
            if (clipLocalTime >= 0 && clipLocalTime < clip.duration) {
                if (Math.abs(video.currentTime - clipLocalTime) > 0.5) {
                    video.currentTime = clipLocalTime;
                }
                
                if (this.vm.isPlaying && video.paused) {
                    video.play().catch(e => console.log('Video play error:', e));
                }
            }
        },
        
        onVideoLoaded() {
            this.syncVideoToTime();
        },
        
        onVideoTimeUpdate() {
            // 비디오 시간 업데이트는 interval에서 처리
        },
        
        onVideoEnded() {
            // 클립 끝나면 다음 클립으로 또는 정지
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
