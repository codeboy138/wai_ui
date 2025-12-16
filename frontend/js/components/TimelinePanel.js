// Timeline Panel Component - Enhanced
// 트랙간 클립 이동, 자석 기능, 재생 상태 app-root 연동

const TimelinePanel = {
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col bg-bg-panel select-none"
            :class="{ 'h-8': vm.isTimelineCollapsed, 'h-full': !vm.isTimelineCollapsed }"
            @wheel.prevent="handleWheel"
            data-action="js:timelineWheelScroll"
        >
            <!-- 타임라인 헤더 - 항상 표시 -->
            <div
                id="timeline-header-bar"
                class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0"
            >
                <div class="flex items-center gap-2">
                    <button
                        id="timeline-header-collapse-btn"
                        class="hover:text-text-main w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover"
                        @click="toggleCollapse"
                        :title="vm.isTimelineCollapsed ? '타임라인 펼치기' : '타임라인 접기'"
                    >
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span
                        id="timeline-header-timecode-label"
                        class="text-xs font-mono text-ui-accent font-bold"
                    >
                        {{ formattedTime }}
                    </span>
                    <!-- 재생 컨트롤 (app-root 상태 사용) -->
                    <div class="flex items-center gap-1 ml-2">
                        <button
                            class="tool-btn"
                            @click="vm.seekToStart()"
                            title="처음으로 (Home)"
                        >
                            <i class="fa-solid fa-backward-step"></i>
                        </button>
                        <button
                            class="tool-btn"
                            @click="vm.togglePlayback()"
                            :title="vm.isPlaying ? '일시정지 (Space)' : '재생 (Space)'"
                        >
                            <i :class="vm.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
                        </button>
                        <button
                            class="tool-btn"
                            @click="vm.seekToEnd()"
                            title="끝으로 (End)"
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
                    <button
                        class="tool-btn relative"
                        title="자르기 + 왼쪽 삭제"
                        @click="cutAndDeleteLeft"
                    >
                        <i class="fa-solid fa-scissors"></i>
                        <span class="absolute -left-1 top-0 text-[8px] text-red-400">◀</span>
                    </button>
                    <button
                        class="tool-btn relative"
                        title="자르기 + 오른쪽 삭제"
                        @click="cutAndDeleteRight"
                    >
                        <i class="fa-solid fa-scissors"></i>
                        <span class="absolute -right-1 top-0 text-[8px] text-red-400">▶</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button
                        class="tool-btn"
                        title="자르기 (현재 위치)"
                        @click="cutAtPlayhead"
                    >
                        <i class="fa-solid fa-scissors"></i>
                    </button>
                    <button
                        class="tool-btn"
                        title="선택 삭제 (Delete)"
                        @click="deleteSelectedClip"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="flex gap-2 items-center">
                    <button
                        :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isMagnet, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isMagnet }"
                        class="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px]"
                        @click="vm.isMagnet = !vm.isMagnet"
                    >
                        <i class="fa-solid fa-magnet"></i>
                        <span>스냅</span>
                    </button>
                    <button
                        :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isAutoRipple, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isAutoRipple }"
                        class="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px]"
                        @click="vm.isAutoRipple = !vm.isAutoRipple"
                    >
                        <i class="fa-solid fa-link"></i>
                        <span>리플</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button
                        class="tool-btn"
                        title="트랙 추가"
                        @click="addTrack"
                    >
                        <i class="fa-solid fa-plus"></i>
                    </button>
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
            >
                <!-- 트랙 리스트 컬럼 -->
                <div
                    id="timeline-track-column"
                    class="sticky-col bg-bg-panel border-r border-ui-border relative"
                    style="z-index: 30;"
                >
                    <div
                        class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel sticky top-0"
                        style="z-index: 40;"
                    >
                        <span>TRACKS</span>
                        <span class="text-[8px]">{{ vm.tracks.length }}</span>
                    </div>
                    <div
                        v-for="(track, index) in vm.tracks"
                        :key="track.id"
                        class="h-10 border-b border-ui-border flex items-center px-2 group hover:bg-bg-hover bg-bg-panel relative"
                        :class="{ 'opacity-50': track.isLocked, 'bg-bg-input': track.isMain }"
                        @contextmenu.prevent="openTrackContextMenu($event, track, index)"
                    >
                        <div class="flex items-center gap-0.5 mr-2">
                            <button
                                class="track-control-btn"
                                :class="{ 'active': !track.isHidden }"
                                @click="toggleTrackVisibility(track)"
                                title="가시성"
                            >
                                <i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                            </button>
                            <button
                                class="track-control-btn"
                                :class="{ 'locked': track.isLocked }"
                                @click="toggleTrackLock(track)"
                                title="잠금"
                            >
                                <i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'"></i>
                            </button>
                            <button
                                class="track-control-btn"
                                @click="setMainTrack(track)"
                                title="메인 트랙"
                            >
                                <i :class="track.isMain ? 'fa-solid fa-star text-yellow-400' : 'fa-regular fa-star text-text-sub'"></i>
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
                            type="text"
                            class="text-xs truncate flex-1 text-text-main bg-transparent border-none outline-none"
                            :value="track.name"
                            @input="updateTrackName(track.id, $event.target.value)"
                            @dblclick.stop
                            :disabled="track.isLocked"
                        />
                    </div>
                    
                    <!-- 헤더 폭 조절 핸들 -->
                    <div
                        class="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-ui-accent/50 transition-colors"
                        style="right: 0; z-index: 50;"
                        @mousedown.prevent="startHeaderResize"
                    ></div>
                </div>

                <!-- 타임라인 레인 & 클립 영역 -->
                <div
                    id="timeline-lane-container"
                    class="relative bg-bg-dark min-w-max"
                    @mousedown="handleLaneMouseDown"
                >
                    <!-- 시간 눈금 룰러 -->
                    <div
                        class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark flex text-[9px] text-text-sub sticky-ruler"
                        style="z-index: 20;"
                    >
                        <template v-for="i in rulerMajorTicks" :key="'major-' + i">
                            <div
                                class="relative border-l timeline-ruler-major"
                                :style="{ width: (vm.zoom * 5) + 'px' }"
                            >
                                <span class="absolute top-0 left-1">{{ formatRulerTime((i - 1) * 5) }}</span>
                                <template v-if="vm.zoom >= 20">
                                    <div
                                        v-for="j in 4"
                                        :key="'minor-' + i + '-' + j"
                                        class="absolute top-3 h-2 timeline-ruler-minor"
                                        :style="{ left: (j * vm.zoom) + 'px' }"
                                    ></div>
                                </template>
                            </div>
                        </template>
                    </div>
                    
                    <!-- 각 트랙의 클립 레인 -->
                    <div
                        v-for="(track, trackIndex) in vm.tracks"
                        :key="track.id"
                        class="h-10 border-b border-ui-border relative"
                        :class="{ 
                            'opacity-30': track.isHidden,
                            'bg-ui-accent/10': dragOverTrackId === track.id && isDraggingClip
                        }"
                        @mouseenter="onLaneMouseEnter(track)"
                        @mouseleave="onLaneMouseLeave"
                    >
                        <div
                            v-for="clip in getClipsForTrack(track.id)"
                            :key="clip.id"
                            class="clip absolute top-1 h-8 rounded cursor-pointer overflow-hidden"
                            :class="{ 
                                'selected': vm.selectedClip && vm.selectedClip.id === clip.id,
                                'snapped': snappedClipId === clip.id,
                                'opacity-50': isDraggingClip && draggingClip && draggingClip.id === clip.id,
                                'clip-active': clip.isActive
                            }"
                            :style="clipStyle(clip, track)"
                            @click.stop="vm.setSelectedClip(clip)"
                            @mousedown.stop="startClipDrag($event, clip, track)"
                            @dblclick.stop="openClipSettings(clip)"
                        >
                            <div
                                class="absolute inset-0 opacity-30"
                                :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"
                            ></div>
                            
                            <!-- 비디오 클립 썸네일 표시 -->
                            <div v-if="clip.type === 'video' && clip.src" class="absolute inset-0 flex items-center justify-center">
                                <i class="fa-solid fa-film text-white/50 text-lg"></i>
                            </div>
                            
                            <!-- 오디오 파형 -->
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
                        class="playhead-line"
                        :style="{ left: vm.currentTime * vm.zoom + 'px', zIndex: 35 }"
                    ></div>
                    <div
                        class="playhead-handle"
                        :style="{ left: vm.currentTime * vm.zoom + 'px', zIndex: 36 }"
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
            
            trackContextMenu: null,
            
            // 클립 드래그
            isDraggingClip: false,
            draggingClip: null,
            draggingClipOriginalTrackId: null,
            dragStartX: 0,
            dragStartY: 0,
            dragStartClipStart: 0,
            dragOverTrackId: null,
            hoverTrackId: null,
            snappedClipId: null,
            
            // 클립 리사이즈
            isResizingClip: false,
            resizingClip: null,
            resizeDirection: null,
            resizeStartClipStart: 0,
            resizeStartClipDuration: 0,
            
            // 플레이헤드 드래그
            isDraggingPlayhead: false
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
    },
    methods: {
        // === 유틸리티 ===
        getClipsForTrack(trackId) {
            return this.vm.clips.filter(c => c.trackId === trackId);
        },
        
        clipStyle(clip, track) {
            return {
                left: clip.start * this.vm.zoom + 'px',
                width: clip.duration * this.vm.zoom + 'px',
                backgroundColor: 'transparent'
            };
        },
        
        openClipSettings(clip) {
            console.log('Open clip settings:', clip.name);
        },
        
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
            this.$nextTick(() => {
                this.adjustLayout();
            });
        },
        
        // === 헤더 폭 조절 ===
        startHeaderResize(e) {
            this.isResizingHeader = true;
            this.resizeStartX = e.clientX;
            this.resizeStartWidth = this.trackHeaderWidth;
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
            this.vm.tracks.forEach(t => {
                t.isMain = (t.id === track.id);
            });
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
        
        getTrackIndex(trackId) {
            return this.vm.tracks.findIndex(t => t.id === trackId);
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
        
        // === 레인 마우스 이벤트 ===
        onLaneMouseEnter(track) {
            this.hoverTrackId = track.id;
            if (this.isDraggingClip && !track.isLocked) {
                this.dragOverTrackId = track.id;
            }
        },
        
        onLaneMouseLeave() {
            this.hoverTrackId = null;
        },
        
        handleLaneMouseDown(e) {
            const target = e.target;
            if (
                target.className.includes('sticky-ruler') ||
                target.className.includes('playhead-handle') ||
                target.closest('.sticky-ruler')
            ) {
                this.startPlayheadDrag(e);
            }
        },
        
        // === 클립 드래그 ===
        startClipDrag(e, clip, track) {
            if (track.isLocked) return;
            
            this.isDraggingClip = true;
            this.draggingClip = clip;
            this.draggingClipOriginalTrackId = track.id;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragStartClipStart = clip.start;
            this.dragOverTrackId = track.id;
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
        
        // === 플레이헤드 드래그 ===
        startPlayheadDrag(e) {
            this.isDraggingPlayhead = true;
            this.updatePlayheadPosition(e);
        },
        
        updatePlayheadPosition(e) {
            const scrollArea = document.getElementById('timeline-scroll-container');
            if (!scrollArea) return;
            
            const rect = scrollArea.getBoundingClientRect();
            const scrollLeft = scrollArea.scrollLeft;
            const headerWidth = this.trackHeaderWidth;
            const zoom = this.vm.zoom;
            
            let newX = e.clientX - rect.left + scrollLeft - headerWidth;
            
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
                    this.vm.seekToTime(snapTime);
                    return;
                }
            }

            this.vm.seekToTime(Math.max(0, newX / zoom));
        },
        
        // === 글로벌 마우스 이벤트 ===
        handleGlobalMouseMove(e) {
            if (this.isResizingHeader) {
                const dx = e.clientX - this.resizeStartX;
                this.trackHeaderWidth = Math.max(120, Math.min(400, this.resizeStartWidth + dx));
            }
            
            if (this.isDraggingPlayhead) {
                this.updatePlayheadPosition(e);
            }
            
            if (this.isDraggingClip && this.draggingClip) {
                const dx = e.clientX - this.dragStartX;
                let newStart = this.dragStartClipStart + (dx / this.vm.zoom);
                newStart = Math.max(0, newStart);
                
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
                
                const laneContainer = document.getElementById('timeline-lane-container');
                if (laneContainer) {
                    const rect = laneContainer.getBoundingClientRect();
                    const relY = e.clientY - rect.top - 24;
                    const trackIndex = Math.floor(relY / 40);
                    
                    if (trackIndex >= 0 && trackIndex < this.vm.tracks.length) {
                        const targetTrack = this.vm.tracks[trackIndex];
                        if (!targetTrack.isLocked) {
                            this.dragOverTrackId = targetTrack.id;
                        }
                    }
                }
            }
            
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
        },
        
        handleGlobalMouseUp() {
            if (this.isDraggingClip && this.draggingClip && this.dragOverTrackId) {
                if (this.dragOverTrackId !== this.draggingClipOriginalTrackId) {
                    const targetTrack = this.vm.tracks.find(t => t.id === this.dragOverTrackId);
                    if (targetTrack && !targetTrack.isLocked) {
                        this.draggingClip.trackId = this.dragOverTrackId;
                    }
                }
            }
            
            this.isResizingHeader = false;
            this.isDraggingPlayhead = false;
            this.isDraggingClip = false;
            this.draggingClip = null;
            this.draggingClipOriginalTrackId = null;
            this.snappedClipId = null;
            this.dragOverTrackId = null;
            this.isResizingClip = false;
            this.resizingClip = null;
        },
        
        // === 자석 스냅 ===
        findSnapPosition(newStart, currentClip) {
            const snapDistance = 10 / this.vm.zoom;
            const clipEnd = newStart + currentClip.duration;
            
            let snapped = false;
            let snapPos = newStart;
            
            if (Math.abs(newStart - this.vm.currentTime) < snapDistance) {
                snapPos = this.vm.currentTime;
                snapped = true;
            } else if (Math.abs(clipEnd - this.vm.currentTime) < snapDistance) {
                snapPos = this.vm.currentTime - currentClip.duration;
                snapped = true;
            }
            
            if (!snapped) {
                for (const clip of this.vm.clips) {
                    if (clip.id === currentClip.id) continue;
                    
                    const otherStart = clip.start;
                    const otherEnd = clip.start + clip.duration;
                    
                    if (Math.abs(newStart - otherEnd) < snapDistance) {
                        snapPos = otherEnd;
                        snapped = true;
                        break;
                    }
                    if (Math.abs(newStart - otherStart) < snapDistance) {
                        snapPos = otherStart;
                        snapped = true;
                        break;
                    }
                    if (Math.abs(clipEnd - otherStart) < snapDistance) {
                        snapPos = otherStart - currentClip.duration;
                        snapped = true;
                        break;
                    }
                    if (Math.abs(clipEnd - otherEnd) < snapDistance) {
                        snapPos = otherEnd - currentClip.duration;
                        snapped = true;
                        break;
                    }
                }
            }
            
            return { snapped, position: snapPos };
        },
        
        // === 자르기 기능 ===
        cutAtPlayhead() {
            if (this.vm.selectedClip) {
                this.vm.splitClip(this.vm.selectedClip.id, this.vm.currentTime);
            }
        },
        
        cutAndDeleteLeft() {
            const currentTime = this.vm.currentTime;
            
            this.vm.clips = this.vm.clips.filter(clip => {
                const clipEnd = clip.start + clip.duration;
                
                if (clipEnd <= currentTime) {
                    return false;
                }
                
                if (clip.start < currentTime && clipEnd > currentTime) {
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
                    return false;
                }
                
                const clipEnd = clip.start + clip.duration;
                if (clip.start < currentTime && clipEnd > currentTime) {
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
                
                this.vm.removeClip(this.vm.selectedClip.id);
            }
        },
        
        // === 자산 드롭 처리 ===
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
            
            // 클립 생성 (src 포함)
            this.createClipFromAsset(assetData, trackIndex, time);
        },
        
        createClipFromAsset(assetData, trackIndex, time) {
            const track = this.vm.tracks[trackIndex];
            if (!track) return;
            
            const newClip = {
                id: `c_${Date.now()}`,
                trackId: track.id,
                name: assetData.name || 'New Clip',
                start: time,
                duration: 10,
                type: assetData.type || 'video',
                src: assetData.src || '',
                isActive: false
            };
            
            this.vm.clips.push(newClip);
            this.vm.setSelectedClip(newClip);
            
            Swal.fire({
                icon: 'success',
                title: '클립 추가됨',
                text: `"${assetData.name}" 클립이 ${track.name} 트랙에 추가되었습니다.`,
                background: '#1e1e1e',
                color: '#fff',
                timer: 1500,
                showConfirmButton: false
            });
        },
        
        handleWheel(e) {
            const scrollArea = document.getElementById('timeline-scroll-container');
            if (e.shiftKey) {
                const delta = e.deltaY > 0 ? -2 : 2;
                this.vm.zoom = Math.max(10, Math.min(100, this.vm.zoom + delta));
            } else {
                scrollArea.scrollLeft += e.deltaY;
            }
        }
    }
};

window.TimelinePanel = TimelinePanel;
