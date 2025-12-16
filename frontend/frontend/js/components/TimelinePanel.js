// Timeline Panel Component
// Enhanced with track controls, cross-track clip movement, snap between clips, minor ruler ticks
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
                            <i class="fa-solid fa-backward-fast"></i>
                        </button>
                        <button 
                            class="tool-btn" 
                            @click="togglePlay"
                            :class="{ 'active': vm.isPlaying }"
                            :title="vm.isPlaying ? '일시정지' : '재생'"
                        >
                            <i :class="vm.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
                        </button>
                        <button 
                            class="tool-btn" 
                            @click="skipToEnd"
                            title="끝으로"
                        >
                            <i class="fa-solid fa-forward-fast"></i>
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
                class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-xxs"
            >
                <div class="flex gap-1 items-center">
                    <!-- 자르기+좌삭제 -->
                    <button 
                        class="tool-btn" 
                        title="자르기 + 왼쪽 삭제" 
                        @click="cutAndDeleteLeft"
                        data-action="js:timelineCutDeleteLeft"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 4L6 20M6 12L2 12M10 6L22 6M10 12L22 12M10 18L22 18"/>
                            <path d="M2 8L4 12L2 16" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <!-- 자르기 -->
                    <button 
                        class="tool-btn" 
                        title="자르기 (현재 위치에서 클립 분할)" 
                        @click="cutAtPlayhead"
                        data-action="js:timelineToolCut"
                    >
                        <i class="fa-solid fa-scissors"></i>
                    </button>
                    <!-- 자르기+우삭제 -->
                    <button 
                        class="tool-btn" 
                        title="자르기 + 오른쪽 삭제" 
                        @click="cutAndDeleteRight"
                        data-action="js:timelineCutDeleteRight"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 4L18 20M18 12L22 12M2 6L14 6M2 12L14 12M2 18L14 18"/>
                            <path d="M22 8L20 12L22 16" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button
                        id="timeline-tool-delete-btn"
                        class="tool-btn"
                        title="선택 클립 삭제"
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
                        class="flex items-center gap-1 px-2 rounded border text-[10px]"
                        @click="vm.isMagnet = !vm.isMagnet"
                        data-action="js:toggleTimelineMagnet"
                        title="자석 모드 (클립 끝점에 스냅)"
                    >
                        <i class="fa-solid fa-magnet"></i>
                    </button>
                    <button
                        id="timeline-tool-ripple-btn"
                        :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isAutoRipple, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isAutoRipple }"
                        class="flex items-center gap-1 px-2 rounded border text-[10px]"
                        @click="vm.isAutoRipple = !vm.isAutoRipple"
                        data-action="js:toggleTimelineRipple"
                        title="리플 모드 (삭제 시 뒤 클립 당기기)"
                    >
                        <i class="fa-solid fa-link"></i>
                    </button>
                    <div class="w-px h-3 bg-ui-border mx-1"></div>
                    <button
                        id="timeline-tool-normalize-btn"
                        class="tool-btn bg-ui-selected text-white px-2 py-0 text-[10px]"
                        @click="normalizeAudio"
                        data-action="js:timelineNormalizeAudio"
                        title="오디오 노멀라이즈"
                    >
                        Normalize
                    </button>
                    <i
                        id="timeline-tool-volume-icon"
                        class="fa-solid fa-volume-high text-text-sub cursor-pointer hover:text-white"
                        data-action="js:timelineVolumeControl"
                        title="마스터 볼륨"
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
                    <!-- 트랙 헤더 리사이저 -->
                    <div 
                        class="track-header-resizer"
                        @mousedown="startTrackHeaderResize"
                    ></div>
                    
                    <div
                        id="timeline-track-header-row"
                        class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel sticky top-0"
                        style="z-index: 40;"
                    >
                        <span>TRACKS</span>
                        <button 
                            class="text-[10px] text-text-sub hover:text-white px-1 rounded hover:bg-bg-hover"
                            @click="addTrack"
                            title="트랙 추가"
                        >
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                    <div
                        v-for="(track, index) in vm.tracks"
                        :key="track.id"
                        :id="'timeline-track-row-' + track.id"
                        class="h-10 border-b border-ui-border flex items-center px-2 group hover:bg-bg-hover cursor-move bg-bg-panel relative"
                        :class="{ 'bg-bg-input': track.isMain }"
                        draggable="true"
                        @dragstart="onTrackDragStart($event, index)"
                        @dragenter="onTrackDragEnter($event, index)"
                        @dragend="onTrackDragEnd"
                        @dragover.prevent
                        @contextmenu.prevent="openTrackContextMenu($event, track)"
                        data-action="js:timelineTrackReorder"
                    >
                        <!-- 트랙 컨트롤 버튼들 -->
                        <div class="flex items-center gap-0.5 mr-2">
                            <button 
                                class="track-control-btn"
                                :class="{ 'main-track': track.isMain }"
                                @click.stop="toggleMainTrack(track)"
                                :title="track.isMain ? '메인 트랙 해제' : '메인 트랙 설정'"
                            >
                                <i class="fa-solid fa-star"></i>
                            </button>
                            <button 
                                class="track-control-btn"
                                :class="{ 'hidden': track.isHidden }"
                                @click.stop="toggleTrackVisibility(track)"
                                :title="track.isHidden ? '트랙 표시' : '트랙 숨기기'"
                            >
                                <i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                            </button>
                            <button 
                                class="track-control-btn"
                                :class="{ 'locked': track.isLocked }"
                                @click.stop="toggleTrackLock(track)"
                                :title="track.isLocked ? '트랙 잠금 해제' : '트랙 잠금'"
                            >
                                <i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'"></i>
                            </button>
                        </div>
                        <div
                            class="w-1 h-2/3 rounded mr-2"
                            :style="{ backgroundColor: track.color || '#666' }"
                        ></div>
                        <span
                            :id="'timeline-track-name-' + track.id"
                            class="text-xs truncate flex-1 text-text-main"
                            contenteditable
                            suppressContentEditableWarning
                            @blur="updateTrackName(track, $event)"
                        >{{ track.name }}</span>
                        <button 
                            class="opacity-0 group-hover:opacity-100 text-text-sub hover:text-ui-danger ml-1"
                            @click.stop="deleteTrack(track)"
                            title="트랙 삭제"
                        >
                            <i class="fa-solid fa-xmark text-[10px]"></i>
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
                    <!-- 시간 눈금 룰러 (메이저 + 마이너) -->
                    <div
                        id="timeline-time-ruler-row"
                        class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark flex relative sticky-ruler"
                        style="z-index: 20;"
                    >
                        <template v-for="i in rulerMajorTicks" :key="'major-' + i">
                            <div 
                                class="absolute ruler-tick-major"
                                :style="{ left: (i * 5 * vm.zoom) + 'px', width: (5 * vm.zoom) + 'px' }"
                            >
                                <span class="ruler-tick-label">{{ i * 5 }}s</span>
                            </div>
                            <!-- 마이너 틱 (1초 단위) -->
                            <template v-for="j in 4" :key="'minor-' + i + '-' + j">
                                <div 
                                    class="ruler-tick-minor"
                                    :style="{ left: ((i * 5 + j) * vm.zoom) + 'px' }"
                                ></div>
                            </template>
                        </template>
                    </div>
                    
                    <!-- 각 트랙의 클립 레인 -->
                    <div
                        v-for="(track, trackIndex) in vm.tracks"
                        :key="track.id"
                        :id="'timeline-lane-row-' + track.id"
                        class="h-10 border-b border-ui-border relative"
                        :class="{ 
                            'opacity-50': track.isHidden,
                            'bg-bg-panel/30': track.isMain
                        }"
                        :data-track-id="track.id"
                        :data-track-index="trackIndex"
                        @dragover.prevent="onClipDragOverLane($event, track, trackIndex)"
                        @drop.prevent="onClipDropOnLane($event, track)"
                    >
                        <div
                            v-for="clip in vm.clips.filter(c => c.trackId === track.id)"
                            :key="clip.id"
                            :id="'timeline-clip-' + clip.id"
                            class="clip absolute top-1 h-8 rounded cursor-pointer overflow-hidden"
                            :class="{ 
                                'selected': vm.selectedClip && vm.selectedClip.id === clip.id,
                                'pointer-events-none opacity-50': track.isLocked
                            }"
                            :style="{
                                left: clip.start * vm.zoom + 'px',
                                width: clip.duration * vm.zoom + 'px',
                                backgroundColor: 'transparent'
                            }"
                            @click.stop="vm.setSelectedClip(clip)"
                            @mousedown.stop="onClipMouseDown($event, clip, track)"
                            :draggable="!track.isLocked"
                            @dragstart="onClipDragStart($event, clip, track)"
                            @dragend="onClipDragEnd"
                            data-x="0"
                            data-y="0"
                            data-action="js:selectTimelineClip"
                        >
                            <div
                                class="absolute inset-0 opacity-30"
                                :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"
                            ></div>
                            
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
                                <!-- 속도 조절 라인 -->
                                <div class="speed-control-line" v-if="clip.speedPoints && clip.speedPoints.length > 0"></div>
                                <div 
                                    v-for="(point, pIdx) in (clip.speedPoints || [])"
                                    :key="'sp-' + pIdx"
                                    class="speed-control-point"
                                    :style="{ left: (point.position * 100) + '%', top: (100 - point.speed * 50) + '%' }"
                                    @mousedown.stop="onSpeedPointMouseDown($event, clip, pIdx)"
                                    :title="'속도: ' + point.speed.toFixed(2) + 'x'"
                                ></div>
                                <div class="volume-line" title="Volume"></div>
                            </template>
                            
                            <div class="text-[9px] px-2 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none">
                                {{ clip.name }}
                            </div>
                        </div>
                    </div>
                    
                    <!-- 스냅 라인 표시 -->
                    <div 
                        v-if="snapLinePosition !== null"
                        class="snap-line snap-line-v"
                        :style="{ left: snapLinePosition + 'px' }"
                    ></div>
                    
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
                <div class="ctx-item" @click="setAsMainTrack">
                    <i class="fa-solid fa-star w-4"></i>
                    <span>메인 트랙 설정</span>
                </div>
                <div class="ctx-item" @click="duplicateTrack">
                    <i class="fa-solid fa-copy w-4"></i>
                    <span>트랙 복제</span>
                </div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item text-red-400 hover:!bg-ui-danger hover:!text-white" @click="deleteContextTrack">
                    <i class="fa-solid fa-trash w-4"></i>
                    <span>트랙 삭제</span>
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
            snapLinePosition: null,
            draggedClip: null,
            draggedClipOriginalTrack: null
        };
    },
    computed: {
        formattedTime() {
            const totalSeconds = this.vm.currentTime;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);
            const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 100); 
            
            const pad = (num, length = 2) => String(num).padStart(length, '0');
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(milliseconds)}`;
        },
        rulerMajorTicks() {
            // 5초 단위 메이저 틱 수
            return Math.ceil(250 / 5); // 250초까지
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.initClipInteractions();
            this.adjustLayout();
            window.addEventListener('resize', this.adjustLayout);
            document.addEventListener('click', this.closeContextMenus);
            document.addEventListener('mousemove', this.onGlobalMouseMove);
            document.addEventListener('mouseup', this.onGlobalMouseUp);
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.adjustLayout);
        document.removeEventListener('click', this.closeContextMenus);
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
    },
    watch: {
        'vm.clips': { handler() { this.$nextTick(this.initClipInteractions); }, deep: true },
        'vm.isMagnet': { handler() { this.$nextTick(this.initClipInteractions); } } 
    },
    methods: {
        // 컨텍스트 메뉴 닫기
        closeContextMenus() {
            this.trackContextMenu = null;
        },
        
        // 트랙 헤더 리사이즈
        startTrackHeaderResize(e) {
            e.preventDefault();
            this.isResizingHeader = true;
            this.resizeStartX = e.clientX;
            this.resizeStartWidth = this.trackHeaderWidth;
        },
        
        onGlobalMouseMove(e) {
            if (this.isResizingHeader) {
                const diff = e.clientX - this.resizeStartX;
                this.trackHeaderWidth = Math.max(120, Math.min(400, this.resizeStartWidth + diff));
            }
        },
        
        onGlobalMouseUp() {
            this.isResizingHeader = false;
        },
        
        // 재생 컨트롤
        togglePlay() {
            if (this.vm.isPlaying) {
                this.vm.pausePlayback();
            } else {
                this.vm.startPlayback();
            }
        },
        
        skipToStart() {
            this.vm.currentTime = 0;
        },
        
        skipToEnd() {
            // 가장 긴 클립의 끝점 찾기
            let maxEnd = 0;
            this.vm.clips.forEach(clip => {
                const end = clip.start + clip.duration;
                if (end > maxEnd) maxEnd = end;
            });
            this.vm.currentTime = maxEnd;
        },
        
        // 자르기 기능
        cutAtPlayhead() {
            if (!this.vm.selectedClip) return;
            
            const clip = this.vm.selectedClip;
            const cutTime = this.vm.currentTime;
            
            // 클립 범위 내인지 확인
            if (cutTime <= clip.start || cutTime >= clip.start + clip.duration) return;
            
            const leftDuration = cutTime - clip.start;
            const rightDuration = clip.duration - leftDuration;
            
            // 왼쪽 클립 (원본 수정)
            const clipIndex = this.vm.clips.findIndex(c => c.id === clip.id);
            if (clipIndex !== -1) {
                this.vm.clips[clipIndex].duration = leftDuration;
            }
            
            // 오른쪽 클립 (새로 생성)
            const rightClip = {
                id: `c_${Date.now()}`,
                trackId: clip.trackId,
                name: clip.name + ' (2)',
                start: cutTime,
                duration: rightDuration,
                type: clip.type
            };
            this.vm.clips.push(rightClip);
        },
        
        cutAndDeleteLeft() {
            if (!this.vm.selectedClip) return;
            
            const clip = this.vm.selectedClip;
            const cutTime = this.vm.currentTime;
            
            if (cutTime <= clip.start || cutTime >= clip.start + clip.duration) return;
            
            const clipIndex = this.vm.clips.findIndex(c => c.id === clip.id);
            if (clipIndex !== -1) {
                const newDuration = (clip.start + clip.duration) - cutTime;
                this.vm.clips[clipIndex].start = cutTime;
                this.vm.clips[clipIndex].duration = newDuration;
            }
        },
        
        cutAndDeleteRight() {
            if (!this.vm.selectedClip) return;
            
            const clip = this.vm.selectedClip;
            const cutTime = this.vm.currentTime;
            
            if (cutTime <= clip.start || cutTime >= clip.start + clip.duration) return;
            
            const clipIndex = this.vm.clips.findIndex(c => c.id === clip.id);
            if (clipIndex !== -1) {
                this.vm.clips[clipIndex].duration = cutTime - clip.start;
            }
        },
        
        deleteSelectedClip() {
            if (this.vm.selectedClip) {
                this.vm.removeClip(this.vm.selectedClip.id);
                this.vm.selectedClip = null;
            }
        },
        
        normalizeAudio() {
            // 오디오 노멀라이즈 (더미)
            Swal.fire({
                icon: 'info',
                title: '오디오 노멀라이즈',
                text: '선택된 오디오 클립의 볼륨이 정규화됩니다.',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1500,
                showConfirmButton: false
            });
        },
        
        // 트랙 컨트롤
        addTrack() {
            const colors = ['#64748b', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#06b6d4'];
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
        
        deleteTrack(track) {
            if (this.vm.tracks.length <= 1) {
                Swal.fire({
                    icon: 'warning',
                    title: '삭제 불가',
                    text: '최소 1개의 트랙이 필요합니다.',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            
            // 해당 트랙의 클립도 삭제
            this.vm.clips = this.vm.clips.filter(c => c.trackId !== track.id);
            this.vm.tracks = this.vm.tracks.filter(t => t.id !== track.id);
        },
        
        toggleTrackVisibility(track) {
            track.isHidden = !track.isHidden;
        },
        
        toggleTrackLock(track) {
            track.isLocked = !track.isLocked;
        },
        
        toggleMainTrack(track) {
            // 다른 트랙의 메인 해제
            this.vm.tracks.forEach(t => {
                if (t.id !== track.id) t.isMain = false;
            });
            track.isMain = !track.isMain;
        },
        
        updateTrackName(track, e) {
            track.name = e.target.textContent.trim() || track.name;
        },
        
        openTrackContextMenu(e, track) {
            this.trackContextMenu = {
                x: e.clientX,
                y: e.clientY,
                track: track
            };
        },
        
        setAsMainTrack() {
            if (this.trackContextMenu && this.trackContextMenu.track) {
                this.toggleMainTrack(this.trackContextMenu.track);
            }
            this.trackContextMenu = null;
        },
        
        duplicateTrack() {
            if (!this.trackContextMenu || !this.trackContextMenu.track) return;
            
            const source = this.trackContextMenu.track;
            const newTrack = {
                id: `t_${Date.now()}`,
                name: source.name + ' (복사본)',
                type: source.type,
                color: source.color,
                isHidden: false,
                isLocked: false,
                isMain: false
            };
            
            // 트랙 추가
            const sourceIndex = this.vm.tracks.findIndex(t => t.id === source.id);
            this.vm.tracks.splice(sourceIndex + 1, 0, newTrack);
            
            // 클립도 복제
            const sourceClips = this.vm.clips.filter(c => c.trackId === source.id);
            sourceClips.forEach(clip => {
                this.vm.clips.push({
                    ...clip,
                    id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    trackId: newTrack.id
                });
            });
            
            this.trackContextMenu = null;
        },
        
        deleteContextTrack() {
            if (this.trackContextMenu && this.trackContextMenu.track) {
                this.deleteTrack(this.trackContextMenu.track);
            }
            this.trackContextMenu = null;
        },
        
        // 클립 드래그 (트랙간 이동)
        onClipMouseDown(e, clip, track) {
            if (track.isLocked) return;
            this.vm.setSelectedClip(clip);
        },
        
        onClipDragStart(e, clip, track) {
            if (track.isLocked) {
                e.preventDefault();
                return;
            }
            
            this.draggedClip = clip;
            this.draggedClipOriginalTrack = track;
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/wai-clip', JSON.stringify({
                clipId: clip.id,
                trackId: track.id
            }));
            
            // 드래그 중 스타일
            setTimeout(() => {
                const el = document.getElementById('timeline-clip-' + clip.id);
                if (el) el.classList.add('dragging');
            }, 0);
        },
        
        onClipDragEnd() {
            if (this.draggedClip) {
                const el = document.getElementById('timeline-clip-' + this.draggedClip.id);
                if (el) el.classList.remove('dragging');
            }
            this.draggedClip = null;
            this.draggedClipOriginalTrack = null;
            this.snapLinePosition = null;
        },
        
        onClipDragOverLane(e, track, trackIndex) {
            if (track.isLocked) return;
            
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // 스냅 위치 계산
            if (this.vm.isMagnet && this.draggedClip) {
                const rect = e.currentTarget.getBoundingClientRect();
                const scrollContainer = document.getElementById('timeline-scroll-container');
                const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
                const x = e.clientX - rect.left + scrollLeft;
                const time = x / this.vm.zoom;
                
                const snapResult = this.findSnapPosition(time, this.draggedClip.id);
                if (snapResult.snapped) {
                    this.snapLinePosition = snapResult.position * this.vm.zoom;
                } else {
                    this.snapLinePosition = null;
                }
            }
        },
        
        onClipDropOnLane(e, targetTrack) {
            if (targetTrack.isLocked) return;
            
            let clipData;
            try {
                clipData = JSON.parse(e.dataTransfer.getData('text/wai-clip'));
            } catch (err) {
                return;
            }
            
            const clipIndex = this.vm.clips.findIndex(c => c.id === clipData.clipId);
            if (clipIndex === -1) return;
            
            const clip = this.vm.clips[clipIndex];
            
            // 드롭 위치 계산
            const rect = e.currentTarget.getBoundingClientRect();
            const scrollContainer = document.getElementById('timeline-scroll-container');
            const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
            const x = e.clientX - rect.left + scrollLeft;
            let newTime = Math.max(0, x / this.vm.zoom);
            
            // 스냅 적용
            if (this.vm.isMagnet) {
                const snapResult = this.findSnapPosition(newTime, clip.id);
                if (snapResult.snapped) {
                    newTime = snapResult.position;
                }
            }
            
            // 클립 업데이트
            this.vm.clips[clipIndex].trackId = targetTrack.id;
            this.vm.clips[clipIndex].start = newTime;
            
            this.snapLinePosition = null;
        },
        
        findSnapPosition(time, excludeClipId) {
            const snapDistance = 10 / this.vm.zoom; // 10px 범위
            let closestSnap = null;
            let minDiff = Infinity;
            
            // 플레이헤드에 스냅
            const playheadDiff = Math.abs(time - this.vm.currentTime);
            if (playheadDiff < snapDistance && playheadDiff < minDiff) {
                minDiff = playheadDiff;
                closestSnap = this.vm.currentTime;
            }
            
            // 다른 클립 끝점에 스냅
            this.vm.clips.forEach(clip => {
                if (clip.id === excludeClipId) return;
                
                const startDiff = Math.abs(time - clip.start);
                const endDiff = Math.abs(time - (clip.start + clip.duration));
                
                if (startDiff < snapDistance && startDiff < minDiff) {
                    minDiff = startDiff;
                    closestSnap = clip.start;
                }
                if (endDiff < snapDistance && endDiff < minDiff) {
                    minDiff = endDiff;
                    closestSnap = clip.start + clip.duration;
                }
            });
            
            return {
                snapped: closestSnap !== null,
                position: closestSnap !== null ? closestSnap : time
            };
        },
        
        // 사운드 속도 조절 포인트
        onSpeedPointMouseDown(e, clip, pointIndex) {
            e.preventDefault();
            e.stopPropagation();
            
            const startY = e.clientY;
            const startSpeed = clip.speedPoints[pointIndex].speed;
            
            const onMove = (moveEvent) => {
                const diff = startY - moveEvent.clientY;
                const newSpeed = Math.max(0.25, Math.min(4, startSpeed + diff * 0.01));
                clip.speedPoints[pointIndex].speed = newSpeed;
            };
            
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
        
        adjustLayout() {
            const p = document.getElementById('preview-main-container');
            if (!p) return;
            if (this.vm.isTimelineCollapsed) {
                p.style.height = 'calc(100% - 32px)';
            } else {
                p.style.height = '50%';
            }
        },
        
        initClipInteractions() {
            const self = this;
            interact('.clip').unset(); 

            const snapModifier = this.vm.isMagnet ? [
                interact.modifiers.snap({
                    targets: [
                        ({ x, y }) => {
                            const snaps = [];
                            const zoom = self.vm.zoom;
                            self.vm.clips.forEach(clip => {
                                snaps.push({ x: clip.start * zoom, range: 10 }); 
                                snaps.push({ x: (clip.start + clip.duration) * zoom, range: 10 }); 
                            });
                            snaps.push({ x: self.vm.currentTime * zoom, range: 10 });
                            return snaps;
                        }
                    ],
                    relativePoints: [{x: 0, y: 0}, {x: 1, y: 0}] 
                })
            ] : [];
            
            interact('.clip').resizable({ 
                edges: { left: true, right: true, bottom: false, top: false },
                modifiers: snapModifier,
                listeners: { 
                    move (e) { 
                        let { x } = e.target.dataset; 
                        x = (parseFloat(x) || 0) + e.deltaRect.left; 
                        Object.assign(e.target.style, { width: `${e.rect.width}px`, transform: `translate(${x}px, 0)` }); 
                        Object.assign(e.target.dataset, { x }); 
                    }, 
                    end (e) { 
                        const clipId = e.target.id.replace('timeline-clip-', '');
                        const startChange = (parseFloat(e.target.dataset.x) || 0) / self.vm.zoom;
                        const durationChange = (e.rect.width - e.rect.initialSize.width) / self.vm.zoom;
                        
                        self.$parent.updateClip(clipId, startChange, durationChange);

                        e.target.removeAttribute('data-x'); 
                        e.target.style.transform='none'; 
                    } 
                } 
            }).draggable({ 
                modifiers: snapModifier,
                listeners: { 
                    move(e) { 
                        const target = e.target; 
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + e.dx; 
                        target.style.transform = `translate(${x}px, 0)`; 
                        target.setAttribute('data-x', x); 
                    }, 
                    end(e) { 
                        const clipId = e.target.id.replace('timeline-clip-', '');
                        const timeChange = (parseFloat(e.target.getAttribute('data-x')) || 0) / self.vm.zoom;
                        
                        self.$parent.moveClip(clipId, timeChange);

                        e.target.style.transform='none'; 
                        e.target.removeAttribute('data-x'); 
                    } 
                } 
            });
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
        
        onTrackDragStart(e, index) { this.vm.dragItemIndex = index; },
        onTrackDragEnter(e, index) { this.vm.dragOverItemIndex = index; },
        onTrackDragEnd() { 
            this.vm.moveTrack(this.vm.dragItemIndex, this.vm.dragOverItemIndex); 
            this.vm.dragItemIndex = null; 
            this.vm.dragOverItemIndex = null; 
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
        
        toggleCollapse() { 
            this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed;
            this.adjustLayout();
        },
        
        handlePlayheadDrag(e) {
            const target = e.target;
            if (
                !target.className.includes('sticky-ruler') &&
                !target.className.includes('playhead-handle')
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
