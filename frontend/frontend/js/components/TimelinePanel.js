// Timeline Panel Component - Enhanced
// 트랙간 클립 이동, 자석 기능, 초단위 눈금, 트랙 기능(눈/잠금/메인/추가/삭제), 퀵바 자르기 기능, 사운드 속도 조절

const TimelinePanel = {
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col h-full bg-bg-panel select-none"
            @wheel.prevent="handleWheel"
            data-action="js:timelineWheelScroll"
        >
            <!-- 타임라인 헤더 (접기, 타임코드, 줌 슬라이더) -->
            <div
                id="timeline-header-bar"
                class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0"
            >
                <div class="flex items-center gap-2">
                    <button
                        id="timeline-header-collapse-btn"
                        class="hover:text-text-main w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover"
                        @click="toggleCollapse"
                        data-action="js:toggleTimelineCollapse"
                    >
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span
                        id="timeline-header-timecode-label"
                        class="text-xs font-mono text-ui-accent font-bold"
                    >
                        {{ formattedTime }}
                    </span>
                    <!-- 재생 컨트롤 -->
                    <div class="flex items-center gap-1 ml-2">
                        <button
                            class="tool-btn"
                            @click="skipToStart"
                            title="처음으로"
                        >
                            <i class="fa-solid fa-backward-step"></i>
                        </button>
                        <button
                            class="tool-btn"
                            @click="togglePlay"
                            :title="isPlaying ? '일시정지' : '재생'"
                        >
                            <i :class="isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
                        </button>
                        <button
                            class="tool-btn"
                            @click="skipToEnd"
                            title="끝으로"
                        >
                            <i class="fa-solid fa-forward-step"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-text-sub">{{ Math.round(vm.zoom) }}%</span>
                    <input
                        id="timeline-header-zoom-slider"
                        type="range"
                        min="10"
                        max="100"
                        :value="vm.zoom"
                        @input="vm.zoom = Number($event.target.value)"
                        class="w-20 accent-ui-accent h-1"
                        data-action="js:timelineChangeZoom"
                    />
                </div>
            </div>
            
            <!-- 타임라인 퀵 툴바 -->
            <div
                v-show="!vm.isTimelineCollapsed"
                id="timeline-toolbar-quick-bar"
                class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-[10px]"
            >
                <div class="flex gap-1 items-center">
                    <!-- 자르기+좌삭제 -->
                    <button
                        id="timeline-tool-cut-left-btn"
                        class="tool-btn relative"
                        title="자르기 + 왼쪽 삭제"
                        @click="cutAndDeleteLeft"
                        data-action="js:timelineCutDeleteLeft"
                    >
                        <i class="fa-solid fa-scissors"></i>
                        <span class="absolute -left-1 top-0 text-[8px] text-red-400">◀</span>
                    </button>
                    <!-- 자르기+우삭제 -->
                    <button
                        id="timeline-tool-cut-right-btn"
                        class="tool-btn relative"
                        title="자르기 + 오른쪽 삭제"
                        @click="cutAndDeleteRight"
                        data-action="js:timelineCutDeleteRight"
                    >
                        <i class="fa-solid fa-scissors"></i>
                        <span class="absolute -right-1 top-0 text-[8px] text-red-400">▶</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button
                        id="timeline-tool-cut-btn"
                        class="tool-btn"
                        title="Cut"
                        @click="cutAtPlayhead"
                        data-action="js:timelineToolCut"
                    >
                        <i class="fa-solid fa-scissors"></i>
                    </button>
                    <button
                        id="timeline-tool-delete-btn"
                        class="tool-btn"
                        title="Delete"
                        @click="deleteSelectedClip"
                        data-action="js:timelineToolDelete"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="flex gap-2 items-center">
                    <button
                        id="timeline-tool-magnet-btn"
                        :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isMagnet, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isMagnet }"
                        class="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px]"
                        @click="vm.isMagnet = !vm.isMagnet"
                        data-action="js:toggleTimelineMagnet"
                    >
                        <i class="fa-solid fa-magnet"></i>
                        <span>스냅</span>
                    </button>
                    <button
                        id="timeline-tool-ripple-btn"
                        :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isAutoRipple, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isAutoRipple }"
                        class="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px]"
                        @click="vm.isAutoRipple = !vm.isAutoRipple"
                        data-action="js:toggleTimelineRipple"
                    >
                        <i class="fa-solid fa-link"></i>
                        <span>리플</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button
                        id="timeline-tool-add-track-btn"
                        class="tool-btn"
                        title="트랙 추가"
                        @click="addTrack"
                        data-action="js:timelineAddTrack"
                    >
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button
                        id="timeline-tool-normalize-btn"
                        class="tool-btn bg-ui-selected text-white px-2 py-0.5"
                        data-action="js:timelineNormalizeAudio"
                    >
                        Normalize
                    </button>
                    <i
                        id="timeline-tool-volume-icon"
                        class="fa-solid fa-volume-high text-text-sub cursor-pointer hover:text-white"
                        data-action="js:timelineVolumeControl"
                    ></i>
                </div>
            </div>
            
            <!-- 타임라인 스크롤/트랙/클립 영역 -->
            <div
                v-show="!vm.isTimelineCollapsed"
                id="timeline-scroll-container"
                class="flex-1 overflow-auto timeline-grid relative"
                :style="{ gridTemplateColumns: trackHeaderWidth + 'px 1fr' }"
                style="z-index: 1;"
                @dragover="handleDragOver"
                @drop="handleDrop"
                data-action="js:timelineDropAsset"
            >
                <!-- 트랙 리스트 컬럼 -->
                <div
                    id="timeline-track-column"
                    class="sticky-col bg-bg-panel border-r border-ui-border relative"
                    style="z-index: 30;"
                >
                    <!-- 헤더 폭 조절 핸들 -->
                    <div
                        class="track-header-resizer"
                        @mousedown.prevent="startHeaderResize"
                    ></div>
                    
                    <div
                        id="timeline-track-header-row"
                        class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel sticky top-0"
                        style="z-index: 40;"
                    >
                        <span>TRACKS</span>
                        <span class="text-[8px]">{{ vm.tracks.length }}</span>
                    </div>
                    <div
                        v-for="(track, index) in vm.tracks"
                        :key="track.id"
                        :id="'timeline-track-row-' + track.id"
                        class="h-10 border-b border-ui-border flex items-center px-2 group hover:bg-bg-hover bg-bg-panel relative"
                        :class="{ 'opacity-50': track.isLocked, 'bg-bg-input': track.isMain }"
                        @contextmenu.prevent="openTrackContextMenu($event, track, index)"
                    >
                        <!-- 트랙 컨트롤 버튼들 -->
                        <div class="flex items-center gap-0.5 mr-2">
                            <!-- 눈 표시 (가시성) -->
                            <button
                                class="track-control-btn"
                                :class="{ 'active': !track.isHidden }"
                                @click="toggleTrackVisibility(track)"
                                title="가시성"
                            >
                                <i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                            </button>
                            <!-- 잠금 -->
                            <button
                                class="track-control-btn"
                                :class="{ 'locked': track.isLocked }"
                                @click="toggleTrackLock(track)"
                                title="잠금"
                            >
                                <i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'"></i>
                            </button>
                            <!-- 메인 트랙 -->
                            <button
                                class="track-control-btn"
                                :class="{ 'main-track': track.isMain }"
                                @click="setMainTrack(track)"
                                title="메인 트랙"
                            >
                                <i class="fa-solid fa-star"></i>
                            </button>
                        </div>
                        
                        <div
                            class="w-1 h-2/3 rounded mr-2 cursor-move"
                            :style="{ backgroundColor: track.color || '#666' }"
                            draggable="true"
                            @dragstart="onTrackDragStart($event, index)"
                            @dragenter="onTrackDragEnter($event, index)"
                            @dragend="onTrackDragEnd"
                            @dragover.prevent
                        ></div>
                        <input
                            :id="'timeline-track-name-' + track.id"
                            type="text"
                            class="text-xs truncate flex-1 text-text-main bg-transparent border-none outline-none"
                            :value="track.name"
                            @input="updateTrackName(track.id, $event.target.value)"
                            @dblclick.stop
                            :disabled="track.isLocked"
                        />
                        
                        <!-- 트랙 삭제 버튼 -->
                        <button
                            class="opacity-0 group-hover:opacity-100 track-control-btn text-red-400 hover:text-red-300"
                            @click="deleteTrack(track, index)"
                            title="트랙 삭제"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <!-- 타임라인 레인 & 클립 영역 -->
                <div
                    id="timeline-lane-container"
                    class="relative bg-bg-dark min-w-max"
                    @mousedown="handlePlayheadDrag($event)"
                    data-action="js:timelineDragPlayhead"
                >
                    <!-- 시간 눈금 룰러 (초단위 작은 눈금 추가) -->
                    <div
                        id="timeline-time-ruler-row"
                        class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark flex text-[9px] text-text-sub sticky-ruler"
                        style="z-index: 20;"
                    >
                        <template v-for="i in rulerMajorTicks" :key="'major-' + i">
                            <div
                                class="relative border-l timeline-ruler-major"
                                :style="{ width: (vm.zoom * 5) + 'px' }"
                            >
                                <span class="absolute top-0 left-1">{{ formatRulerTime((i - 1) * 5) }}</span>
                                <!-- 초단위 작은 눈금 (1초 간격) -->
                                <template v-if="vm.zoom >= 20">
                                    <div
                                        v-for="j in 4"
                                        :key="'minor-' + i + '-' + j"
                                        class="absolute top-3 h-2 timeline-ruler-minor"
                                        :style="{ left: (j * vm.zoom) + 'px' }"
                                    ></div>
                                </template>
                                <!-- 0.5초 눈금 (줌이 높을 때) -->
                                <template v-if="vm.zoom >= 40">
                                    <div
                                        v-for="j in 9"
                                        :key="'sub-' + i + '-' + j"
                                        class="absolute top-4 h-1 timeline-ruler-sub"
                                        :style="{ left: ((j + 1) * vm.zoom * 0.5) + 'px' }"
                                    ></div>
                                </template>
                            </div>
                        </template>
                    </div>
                    
                    <!-- 각 트랙의 클립 레인 -->
                    <div
                        v-for="(track, trackIndex) in vm.tracks"
                        :key="track.id"
                        :id="'timeline-lane-row-' + track.id"
                        class="h-10 border-b border-ui-border relative"
                        :class="{ 
                            'opacity-30': track.isHidden,
                            'track-lane-drop-target': dragOverTrackId === track.id
                        }"
                        @dragover.prevent="onClipDragOverTrack($event, track)"
                        @dragleave="onClipDragLeaveTrack($event, track)"
                        @drop.prevent="onClipDropOnTrack($event, track)"
                    >
                        <div
                            v-for="clip in vm.clips.filter(c => c.trackId === track.id)"
                            :key="clip.id"
                            :id="'timeline-clip-' + clip.id"
                            class="clip absolute top-1 h-8 rounded cursor-pointer overflow-hidden"
                            :class="{ 
                                'selected': vm.selectedClip && vm.selectedClip.id === clip.id,
                                'snapped': snappedClipId === clip.id
                            }"
                            :style="{
                                left: clip.start * vm.zoom + 'px',
                                width: clip.duration * vm.zoom + 'px',
                                backgroundColor: 'transparent'
                            }"
                            @click.stop="vm.setSelectedClip(clip)"
                            @mousedown.stop="startClipDrag($event, clip, track)"
                            draggable="false"
                            data-action="js:selectTimelineClip"
                        >
                            <div
                                class="absolute inset-0 opacity-30"
                                :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"
                            ></div>
                            
                            <!-- 오디오 클립: 파형 + 속도 조절 -->
                            <template v-if="track.type === 'audio'">
                                <svg class="waveform" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path
                                        d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50"
                                        stroke="white"
                                        fill="transparent"
                                        stroke-width="2"
                                        vector-effect="non-scaling-stroke"
                                    />
                                </svg>
                                <div class="volume-line" title="Volume"></div>
                                
                                <!-- 속도 조절 포인트 -->
                                <template v-if="clip.speedPoints && clip.speedPoints.length > 0">
                                    <div
                                        v-for="(point, pIdx) in clip.speedPoints"
                                        :key="'sp-' + pIdx"
                                        class="speed-point"
                                        :style="{ 
                                            left: (point.position * 100) + '%', 
                                            top: ((1 - point.speed / 2) * 100) + '%' 
                                        }"
                                        @mousedown.stop="startSpeedPointDrag($event, clip, pIdx)"
                                        :title="'속도: ' + point.speed.toFixed(2) + 'x'"
                                    ></div>
                                </template>
                                
                                <!-- 속도 라인 -->
                                <svg 
                                    v-if="clip.speedPoints && clip.speedPoints.length > 1"
                                    class="absolute inset-0 w-full h-full pointer-events-none"
                                    preserveAspectRatio="none"
                                >
                                    <polyline
                                        :points="getSpeedLinePoints(clip)"
                                        fill="none"
                                        stroke="#22c55e"
                                        stroke-width="2"
                                        vector-effect="non-scaling-stroke"
                                    />
                                </svg>
                            </template>
                            
                            <div class="text-[9px] px-2 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none">
                                {{ clip.name }}
                            </div>
                            
                            <!-- 클립 리사이즈 핸들 -->
                            <div 
                                class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                @mousedown.stop="startClipResize($event, clip, 'left')"
                            ></div>
                            <div 
                                class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                @mousedown.stop="startClipResize($event, clip, 'right')"
                            ></div>
                        </div>
                    </div>
                    
                    <!-- 플레이헤드 -->
                    <div
                        id="timeline-playhead-line"
                        class="playhead-line"
                        :style="{ left: vm.currentTime * vm.zoom + 'px', zIndex: 35 }"
                    ></div>
                    <div
                        id="timeline-playhead-handle"
                        class="playhead-handle"
                        :style="{ left: vm.currentTime * vm.zoom + 'px', zIndex: 36 }"
                        data-action="js:timelineDragPlayhead"
                    ></div>
                </div>
            </div>
            
            <!-- 트랙 컨텍스트 메뉴 -->
            <div
                v-if="trackContextMenu"
                class="context-menu"
                :style="{ top: trackContextMenu.y + 'px', left: trackContextMenu.x + 'px' }"
                @click.stop
            >
                <div class="ctx-item" @click="duplicateTrack(trackContextMenu.track)">
                    <i class="fa-solid fa-copy w-4"></i>
                    <span>트랙 복제</span>
                </div>
                <div class="ctx-item" @click="changeTrackColor(trackContextMenu.track)">
                    <i class="fa-solid fa-palette w-4"></i>
                    <span>색상 변경</span>
                </div>
                <div class="ctx-item" @click="changeTrackType(trackContextMenu.track)">
                    <i class="fa-solid fa-exchange-alt w-4"></i>
                    <span>타입 변경</span>
                </div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item text-red-400 hover:!bg-ui-danger" @click="deleteTrack(trackContextMenu.track, trackContextMenu.index)">
                    <i class="fa-solid fa-trash w-4"></i>
                    <span>삭제</span>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            trackHeaderWidth: 180,
            isResizingHeader: false,
            resizeStartX: 0,
            resizeStartWidth: 0,
            
            isPlaying: false,
            playInterval: null,
            
            trackContextMenu: null,
            
            // 클립 드래그
            isDraggingClip: false,
            draggingClip: null,
            draggingClipOriginalTrack: null,
            dragStartX: 0,
            dragStartClipStart: 0,
            dragOverTrackId: null,
            snappedClipId: null,
            
            // 클립 리사이즈
            isResizingClip: false,
            resizingClip: null,
            resizeDirection: null,
            resizeStartClipStart: 0,
            resizeStartClipDuration: 0,
            
            // 속도 포인트 드래그
            isDraggingSpeedPoint: false,
            draggingSpeedClip: null,
            draggingSpeedPointIndex: null
        };
    },
    computed: {
        formattedTime() {
            const totalSeconds = this.vm.currentTime;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);
            const frames = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 30);
            
            const pad = (num, length = 2) => String(num).padStart(length, '0');
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
        },
        rulerMajorTicks() {
            return 60;
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.initClipInteractions();
            this.adjustLayout();
            window.addEventListener('resize', this.adjustLayout);
            document.addEventListener('click', this.closeContextMenus);
            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.adjustLayout);
        document.removeEventListener('click', this.closeContextMenus);
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);
        if (this.playInterval) {
            clearInterval(this.playInterval);
        }
    },
    watch: {
        'vm.clips': { handler() { this.$nextTick(this.initClipInteractions); }, deep: true },
        'vm.isMagnet': { handler() { this.$nextTick(this.initClipInteractions); } }
    },
    methods: {
        // === 레이아웃 ===
        adjustLayout() {
            const p = document.getElementById('preview-main-container');
            if (!p) return;
            if (this.vm.isTimelineCollapsed) {
                p.style.height = 'calc(100% - 32px)';
            } else {
                p.style.height = '50%';
            }
        },
        
        toggleCollapse() {
            this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed;
            this.adjustLayout();
        },
        
        // === 헤더 폭 조절 ===
        startHeaderResize(e) {
            this.isResizingHeader = true;
            this.resizeStartX = e.clientX;
            this.resizeStartWidth = this.trackHeaderWidth;
        },
        
        // === 재생 컨트롤 ===
        togglePlay() {
            if (this.isPlaying) {
                this.pausePlayback();
            } else {
                this.startPlayback();
            }
        },
        
        startPlayback() {
            this.isPlaying = true;
            const fps = 30;
            const frameTime = 1000 / fps;
            
            this.playInterval = setInterval(() => {
                this.vm.currentTime += 1 / fps;
                
                // 캔버스 연동: 현재 시간에 해당하는 클립 렌더링
                if (this.$parent && typeof this.$parent.renderAtTime === 'function') {
                    this.$parent.renderAtTime(this.vm.currentTime);
                }
            }, frameTime);
        },
        
        pausePlayback() {
            this.isPlaying = false;
            if (this.playInterval) {
                clearInterval(this.playInterval);
                this.playInterval = null;
            }
        },
        
        skipToStart() {
            this.vm.currentTime = 0;
        },
        
        skipToEnd() {
            let maxEnd = 0;
            this.vm.clips.forEach(clip => {
                const end = clip.start + clip.duration;
                if (end > maxEnd) maxEnd = end;
            });
            this.vm.currentTime = maxEnd;
        },
        
        // === 눈금 포맷 ===
        formatRulerTime(seconds) {
            if (seconds < 60) {
                return seconds + 's';
            }
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m}:${String(s).padStart(2, '0')}`;
        },
        
        // === 트랙 관리 ===
        addTrack() {
            const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
            const newTrack = {
                id: `t_${Date.now()}`,
                name: `Track ${this.vm.tracks.length + 1}`,
                type: 'video',
                color: colors[this.vm.tracks.length % colors.length],
                isHidden: false,
                isLocked: false,
                isMain: false
            };
            this.vm.tracks.push(newTrack);
        },
        
        deleteTrack(track, index) {
            if (this.vm.tracks.length <= 1) {
                Swal.fire({
                    icon: 'warning',
                    title: '삭제 불가',
                    text: '최소 1개의 트랙이 필요합니다.',
                    background: '#1e1e1e',
                    color: '#fff'
                });
                return;
            }
            
            // 해당 트랙의 클립들도 삭제
            this.vm.clips = this.vm.clips.filter(c => c.trackId !== track.id);
            this.vm.tracks.splice(index, 1);
            this.closeContextMenus();
        },
        
        duplicateTrack(track) {
            const newTrack = {
                ...track,
                id: `t_${Date.now()}`,
                name: track.name + ' (복사)',
                isMain: false
            };
            const index = this.vm.tracks.findIndex(t => t.id === track.id);
            this.vm.tracks.splice(index + 1, 0, newTrack);
            this.closeContextMenus();
        },
        
        toggleTrackVisibility(track) {
            track.isHidden = !track.isHidden;
        },
        
        toggleTrackLock(track) {
            track.isLocked = !track.isLocked;
        },
        
        setMainTrack(track) {
            this.vm.tracks.forEach(t => t.isMain = false);
            track.isMain = true;
        },
        
        updateTrackName(trackId, name) {
            const track = this.vm.tracks.find(t => t.id === trackId);
            if (track) track.name = name;
        },
        
        async changeTrackColor(track) {
            const { value: color } = await Swal.fire({
                title: '트랙 색상',
                input: 'text',
                inputValue: track.color,
                inputPlaceholder: '#HEX 색상',
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff'
            });
            if (color) {
                track.color = color;
            }
            this.closeContextMenus();
        },
        
        async changeTrackType(track) {
            const { value: type } = await Swal.fire({
                title: '트랙 타입',
                input: 'select',
                inputOptions: {
                    video: '비디오',
                    audio: '오디오',
                    text: '텍스트'
                },
                inputValue: track.type,
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff'
            });
            if (type) {
                track.type = type;
            }
            this.closeContextMenus();
        },
        
        openTrackContextMenu(e, track, index) {
            this.trackContextMenu = {
                x: e.clientX,
                y: e.clientY,
                track,
                index
            };
        },
        
        closeContextMenus() {
            this.trackContextMenu = null;
        },
        
        // === 트랙 순서 드래그 ===
        onTrackDragStart(e, index) {
            this.vm.dragItemIndex = index;
            e.dataTransfer.effectAllowed = 'move';
        },
        
        onTrackDragEnter(e, index) {
            this.vm.dragOverItemIndex = index;
        },
        
        onTrackDragEnd() {
            if (this.vm.dragItemIndex !== null && this.vm.dragOverItemIndex !== null) {
                this.vm.moveTrack(this.vm.dragItemIndex, this.vm.dragOverItemIndex);
            }
            this.vm.dragItemIndex = null;
            this.vm.dragOverItemIndex = null;
        },
        
        // === 클립 드래그 (트랙간 이동) ===
        startClipDrag(e, clip, track) {
            if (track.isLocked) return;
            
            this.isDraggingClip = true;
            this.draggingClip = clip;
            this.draggingClipOriginalTrack = track;
            this.dragStartX = e.clientX;
            this.dragStartClipStart = clip.start;
        },
        
        onClipDragOverTrack(e, track) {
            if (!this.isDraggingClip) return;
            if (track.isLocked) return;
            this.dragOverTrackId = track.id;
        },
        
        onClipDragLeaveTrack(e, track) {
            if (this.dragOverTrackId === track.id) {
                this.dragOverTrackId = null;
            }
        },
        
        onClipDropOnTrack(e, track) {
            if (!this.isDraggingClip || !this.draggingClip) return;
            if (track.isLocked) return;
            
            // 트랙 변경
            this.draggingClip.trackId = track.id;
            this.dragOverTrackId = null;
        },
        
        // === 클립 리사이즈 ===
        startClipResize(e, clip, direction) {
            const track = this.vm.tracks.find(t => t.id === clip.trackId);
            if (track && track.isLocked) return;
            
            this.isResizingClip = true;
            this.resizingClip = clip;
            this.resizeDirection = direction;
            this.dragStartX = e.clientX;
            this.resizeStartClipStart = clip.start;
            this.resizeStartClipDuration = clip.duration;
        },
        
        // === 글로벌 마우스 이벤트 ===
        handleGlobalMouseMove(e) {
            // 헤더 리사이즈
            if (this.isResizingHeader) {
                const dx = e.clientX - this.resizeStartX;
                this.trackHeaderWidth = Math.max(120, Math.min(400, this.resizeStartWidth + dx));
            }
            
            // 클립 드래그
            if (this.isDraggingClip && this.draggingClip) {
                const dx = e.clientX - this.dragStartX;
                let newStart = this.dragStartClipStart + (dx / this.vm.zoom);
                newStart = Math.max(0, newStart);
                
                // 자석 스냅
                if (this.vm.isMagnet) {
                    const snapResult = this.findSnapPosition(newStart, this.draggingClip);
                    if (snapResult.snapped) {
                        newStart = snapResult.position;
                        this.snappedClipId = this.draggingClip.id;
                    } else {
                        this.snappedClipId = null;
                    }
                }
                
                this.draggingClip.start = newStart;
            }
            
            // 클립 리사이즈
            if (this.isResizingClip && this.resizingClip) {
                const dx = e.clientX - this.dragStartX;
                const timeChange = dx / this.vm.zoom;
                
                if (this.resizeDirection === 'left') {
                    let newStart = this.resizeStartClipStart + timeChange;
                    let newDuration = this.resizeStartClipDuration - timeChange;
                    
                    if (newStart < 0) {
                        newDuration += newStart;
                        newStart = 0;
                    }
                    if (newDuration < 0.1) {
                        newDuration = 0.1;
                        newStart = this.resizeStartClipStart + this.resizeStartClipDuration - 0.1;
                    }
                    
                    this.resizingClip.start = newStart;
                    this.resizingClip.duration = newDuration;
                } else {
                    let newDuration = this.resizeStartClipDuration + timeChange;
                    if (newDuration < 0.1) newDuration = 0.1;
                    this.resizingClip.duration = newDuration;
                }
            }
            
            // 속도 포인트 드래그
            if (this.isDraggingSpeedPoint && this.draggingSpeedClip) {
                const clip = this.draggingSpeedClip;
                const clipEl = document.getElementById('timeline-clip-' + clip.id);
                if (clipEl) {
                    const rect = clipEl.getBoundingClientRect();
                    const relX = (e.clientX - rect.left) / rect.width;
                    const relY = (e.clientY - rect.top) / rect.height;
                    
                    const position = Math.max(0, Math.min(1, relX));
                    const speed = Math.max(0.25, Math.min(2, 2 * (1 - relY)));
                    
                    if (clip.speedPoints && clip.speedPoints[this.draggingSpeedPointIndex]) {
                        clip.speedPoints[this.draggingSpeedPointIndex].position = position;
                        clip.speedPoints[this.draggingSpeedPointIndex].speed = speed;
                    }
                }
            }
        },
        
        handleGlobalMouseUp() {
            this.isResizingHeader = false;
            this.isDraggingClip = false;
            this.draggingClip = null;
            this.draggingClipOriginalTrack = null;
            this.snappedClipId = null;
            this.isResizingClip = false;
            this.resizingClip = null;
            this.isDraggingSpeedPoint = false;
            this.draggingSpeedClip = null;
            this.draggingSpeedPointIndex = null;
            this.dragOverTrackId = null;
        },
        
        // === 자석 스냅 ===
        findSnapPosition(newStart, currentClip) {
            const snapDistance = 10 / this.vm.zoom; // 10px 를 시간으로 변환
            const clipEnd = newStart + currentClip.duration;
            
            let snapped = false;
            let snapPos = newStart;
            
            // 플레이헤드에 스냅
            if (Math.abs(newStart - this.vm.currentTime) < snapDistance) {
                snapPos = this.vm.currentTime;
                snapped = true;
            } else if (Math.abs(clipEnd - this.vm.currentTime) < snapDistance) {
                snapPos = this.vm.currentTime - currentClip.duration;
                snapped = true;
            }
            
            // 다른 클립에 스냅
            if (!snapped) {
                for (const clip of this.vm.clips) {
                    if (clip.id === currentClip.id) continue;
                    
                    const otherStart = clip.start;
                    const otherEnd = clip.start + clip.duration;
                    
                    // 시작점 -> 다른 클립 끝
                    if (Math.abs(newStart - otherEnd) < snapDistance) {
                        snapPos = otherEnd;
                        snapped = true;
                        break;
                    }
                    // 시작점 -> 다른 클립 시작
                    if (Math.abs(newStart - otherStart) < snapDistance) {
                        snapPos = otherStart;
                        snapped = true;
                        break;
                    }
                    // 끝점 -> 다른 클립 시작
                    if (Math.abs(clipEnd - otherStart) < snapDistance) {
                        snapPos = otherStart - currentClip.duration;
                        snapped = true;
                        break;
                    }
                    // 끝점 -> 다른 클립 끝
                    if (Math.abs(clipEnd - otherEnd) < snapDistance) {
                        snapPos = otherEnd - currentClip.duration;
                        snapped = true;
                        break;
                    }
                }
            }
            
            return { snapped, position: snapPos };
        },
        
        // === 속도 조절 ===
        startSpeedPointDrag(e, clip, pointIndex) {
            e.preventDefault();
            this.isDraggingSpeedPoint = true;
            this.draggingSpeedClip = clip;
            this.draggingSpeedPointIndex = pointIndex;
        },
        
        getSpeedLinePoints(clip) {
            if (!clip.speedPoints || clip.speedPoints.length < 2) return '';
            
            return clip.speedPoints
                .sort((a, b) => a.position - b.position)
                .map(p => {
                    const x = p.position * 100;
                    const y = (1 - p.speed / 2) * 100;
                    return `${x},${y}`;
                })
                .join(' ');
        },
        
        // === 자르기 기능 ===
        cutAtPlayhead() {
            const currentTime = this.vm.currentTime;
            
            // 플레이헤드 위치에 있는 클립 찾기
            const clipsAtPlayhead = this.vm.clips.filter(clip => {
                return currentTime > clip.start && currentTime < clip.start + clip.duration;
            });
            
            if (clipsAtPlayhead.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: '자를 클립 없음',
                    text: '플레이헤드 위치에 클립이 없습니다.',
                    background: '#1e1e1e',
                    color: '#fff',
                    timer: 1500,
                    showConfirmButton: false
                });
                return;
            }
            
            clipsAtPlayhead.forEach(clip => {
                const cutPoint = currentTime - clip.start;
                
                // 새 클립 생성 (오른쪽 부분)
                const newClip = {
                    ...clip,
                    id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    start: currentTime,
                    duration: clip.duration - cutPoint
                };
                
                // 기존 클립 수정 (왼쪽 부분)
                clip.duration = cutPoint;
                
                // 속도 포인트 분할
                if (clip.speedPoints) {
                    const cutPosition = cutPoint / (clip.duration + newClip.duration);
                    
                    newClip.speedPoints = clip.speedPoints
                        .filter(p => p.position > cutPosition)
                        .map(p => ({
                            position: (p.position - cutPosition) / (1 - cutPosition),
                            speed: p.speed
                        }));
                    
                    clip.speedPoints = clip.speedPoints
                        .filter(p => p.position <= cutPosition)
                        .map(p => ({
                            position: p.position / cutPosition,
                            speed: p.speed
                        }));
                }
                
                this.vm.clips.push(newClip);
            });
        },
        
        cutAndDeleteLeft() {
            const currentTime = this.vm.currentTime;
            
            this.vm.clips = this.vm.clips.filter(clip => {
                const clipEnd = clip.start + clip.duration;
                
                if (clipEnd <= currentTime) {
                    return false; // 전체가 왼쪽 -> 삭제
                }
                
                if (clip.start < currentTime && clipEnd > currentTime) {
                    // 부분적으로 겹침 -> 왼쪽 부분 자르기
                    const cutPoint = currentTime - clip.start;
                    clip.duration -= cutPoint;
                    clip.start = currentTime;
                }
                
                return true;
            });
        },
        
        cutAndDeleteRight() {
            const currentTime = this.vm.currentTime;
            
            this.vm.clips = this.vm.clips.filter(clip => {
                if (clip.start >= currentTime) {
                    return false; // 전체가 오른쪽 -> 삭제
                }
                
                const clipEnd = clip.start + clip.duration;
                if (clip.start < currentTime && clipEnd > currentTime) {
                    // 부분적으로 겹침 -> 오른쪽 부분 자르기
                    clip.duration = currentTime - clip.start;
                }
                
                return true;
            });
        },
        
        deleteSelectedClip() {
            if (this.vm.selectedClip) {
                const track = this.vm.tracks.find(t => t.id === this.vm.selectedClip.trackId);
                if (track && track.isLocked) {
                    Swal.fire({
                        icon: 'warning',
                        title: '잠긴 트랙',
                        text: '잠긴 트랙의 클립은 삭제할 수 없습니다.',
                        background: '#1e1e1e',
                        color: '#fff'
                    });
                    return;
                }
                
                this.vm.clips = this.vm.clips.filter(c => c.id !== this.vm.selectedClip.id);
                this.vm.selectedClip = null;
            }
        },
        
        // === 기존 메서드 ===
        initClipInteractions() {
            // interact.js 기반 상호작용은 커스텀 드래그로 대체됨
        },
        
        handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        },
        
        handleDrop(e) {
            e.preventDefault();
            let assetData;
            try {
                assetData = JSON.parse(e.dataTransfer.getData('text/wai-asset'));
            } catch (error) {
                return;
            }

            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top - 24;
            const trackIndex = Math.floor(y / 40);
            
            const scrollArea = document.getElementById('timeline-scroll-container');
            const x = e.clientX - rect.left + scrollArea.scrollLeft - this.trackHeaderWidth;
            const time = Math.max(0, x / this.vm.zoom);
            
            this.vm.addClipFromDrop(assetData.type, trackIndex, time, assetData.name);
        },
        
        handleWheel(e) {
            const scrollArea = document.getElementById('timeline-scroll-container');
            if (e.shiftKey) {
                const delta = e.deltaY > 0 ? -2 : 2;
                this.vm.zoom = Math.max(10, Math.min(100, this.vm.zoom + delta));
            } else {
                scrollArea.scrollLeft += e.deltaY;
            }
        },
        
        handlePlayheadDrag(e) {
            const target = e.target;
            if (
                !target.className.includes('sticky-ruler') &&
                !target.className.includes('playhead-handle') &&
                !target.id.includes('timeline-time-ruler')
            ) return;

            e.preventDefault();
            
            const scrollArea = document.getElementById('timeline-scroll-container');
            const rect = scrollArea.getBoundingClientRect();
            const scrollLeft = scrollArea.scrollLeft;
            const headerWidth = this.trackHeaderWidth;
            const zoom = this.vm.zoom;

            const updateTime = (event) => {
                let newX = event.clientX - rect.left + scrollLeft - headerWidth;
                
                if (this.vm.isMagnet) {
                    let minDiff = Infinity;
                    let snapTime = null;

                    this.vm.clips.forEach(clip => {
                        const startPx = clip.start * zoom;
                        const endPx = (clip.start + clip.duration) * zoom;
                        
                        [startPx, endPx].forEach(px => {
                            const diff = Math.abs(newX - px);
                            if (diff < 10 && diff < minDiff) {
                                minDiff = diff;
                                snapTime = px / zoom;
                            }
                        });
                    });

                    if (snapTime !== null) {
                        this.vm.currentTime = snapTime;
                        return;
                    }
                }

                this.vm.currentTime = Math.max(0, newX / zoom);
            };

            const onMove = (event) => updateTime(event);
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            updateTime(e);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }
    }
};

window.TimelinePanel = TimelinePanel;
