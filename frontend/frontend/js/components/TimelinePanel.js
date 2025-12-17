// Timeline Panel Component - Enhanced
// 트랙 드래그 순서 변경, Z-Index 연동, 클립-캔버스 연동

const TimelinePanel = {
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col bg-bg-panel select-none"
            @wheel.prevent="handleWheel"
        >
            <!-- 타임라인 헤더 (항상 표시) -->
            <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0">
                <div class="flex items-center gap-2">
                    <button
                        class="hover:text-text-main w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover"
                        @click="toggleCollapse"
                        :title="vm.isTimelineCollapsed ? '타임라인 펼치기' : '타임라인 접기'"
                    >
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span class="text-xs font-mono text-ui-accent font-bold">{{ formattedTime }}</span>
                    <div class="flex items-center gap-1 ml-2">
                        <button class="tool-btn" @click="seekToStart" title="처음으로"><i class="fa-solid fa-backward-step"></i></button>
                        <button class="tool-btn" @click="togglePlayback" :title="vm.isPlaying ? '일시정지' : '재생'">
                            <i :class="vm.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
                        </button>
                        <button class="tool-btn" @click="seekToEnd" title="끝으로"><i class="fa-solid fa-forward-step"></i></button>
                    </div>
                    <!-- 화면비율/해상도 컨트롤 -->
                    <div class="flex items-center gap-2 ml-4 text-[10px]">
                        <div class="flex items-center gap-1">
                            <span class="text-text-sub">비율:</span>
                            <select 
                                class="bg-bg-input border border-ui-border rounded px-1 py-0.5 text-text-main text-[10px]"
                                :value="vm.aspectRatio"
                                @change="vm.setAspect($event.target.value)"
                            >
                                <option value="16:9">16:9</option>
                                <option value="9:16">9:16</option>
                                <option value="1:1">1:1</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-text-sub">해상도:</span>
                            <select 
                                class="bg-bg-input border border-ui-border rounded px-1 py-0.5 text-text-main text-[10px]"
                                :value="vm.resolution"
                                @change="vm.setResolution($event.target.value)"
                            >
                                <option value="8K">8K</option>
                                <option value="6K">6K</option>
                                <option value="4K">4K</option>
                                <option value="FHD">FHD</option>
                                <option value="HD">HD</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-text-sub">{{ Math.round(vm.zoom) }}%</span>
                    <input type="range" min="10" max="100" :value="vm.zoom" @input="vm.zoom = Number($event.target.value)" class="w-20 accent-ui-accent h-1" />
                </div>
            </div>
            
            <!-- 퀵 툴바 (접히면 숨김) -->
            <div v-if="!vm.isTimelineCollapsed" class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-[10px]">
                <div class="flex gap-1 items-center">
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" title="자르기+왼쪽삭제" @click="cutAndDeleteLeft">
                        <span class="text-red-400 text-[10px] leading-none">&lt;</span>
                        <i class="fa-solid fa-scissors text-[9px]"></i>
                    </button>
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" title="자르기+오른쪽삭제" @click="cutAndDeleteRight">
                        <i class="fa-solid fa-scissors text-[9px]"></i>
                        <span class="text-red-400 text-[10px] leading-none">&gt;</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn" title="자르기" @click="cutAtPlayhead"><i class="fa-solid fa-scissors"></i></button>
                    <button class="tool-btn" title="삭제" @click="deleteSelectedClips"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="flex gap-2 items-center">
                    <span v-if="selectedClipIds.length > 1" class="text-ui-accent">{{ selectedClipIds.length }}개 선택</span>
                    <button :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isMagnet }" class="flex items-center gap-1 px-2 py-0.5 rounded border border-transparent text-[10px] hover:bg-ui-selected" @click="vm.isMagnet = !vm.isMagnet">
                        <i class="fa-solid fa-magnet"></i><span>스냅</span>
                    </button>
                    <button :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isAutoRipple }" class="flex items-center gap-1 px-2 py-0.5 rounded border border-transparent text-[10px] hover:bg-ui-selected" @click="vm.isAutoRipple = !vm.isAutoRipple">
                        <i class="fa-solid fa-link"></i><span>리플</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn" title="트랙 추가" @click="addTrack"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
            
            <!-- 타임라인 영역 (접히면 숨김) -->
            <div v-if="!vm.isTimelineCollapsed" id="timeline-scroll-container" class="flex-1 overflow-auto timeline-grid relative" :style="{ gridTemplateColumns: trackHeaderWidth + 'px 1fr' }">
                <!-- 트랙 헤더 -->
                <div class="sticky-col bg-bg-panel border-r border-ui-border relative" style="z-index: 30;">
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel sticky top-0" style="z-index: 40;">
                        <span>TRACKS</span>
                        <div class="flex items-center gap-1">
                            <button 
                                class="w-4 h-4 flex items-center justify-center rounded hover:bg-bg-hover text-[8px]"
                                @click="toggleAllTrackNames"
                                :title="isTrackNamesCollapsed ? '이름 펼치기' : '이름 접기'"
                            >
                                <i :class="isTrackNamesCollapsed ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" style="font-size: 8px;"></i>
                            </button>
                        </div>
                    </div>
                    <div 
                        v-for="(track, index) in vm.tracks" 
                        :key="track.id"
                        :data-track-id="track.id"
                        class="border-b border-ui-border flex items-center px-1 group bg-bg-panel relative transition-all duration-150" 
                        :class="{ 
                            'opacity-50': track.isLocked, 
                            'bg-yellow-900/30 border-l-2 border-l-yellow-400': track.isMain,
                            'bg-ui-accent/20': dragOverTrackId === track.id && dragOverTrackId !== draggingTrackId
                        }" 
                        :style="{ height: (trackHeights[track.id] || 40) + 'px' }"
                        draggable="true"
                        @dragstart="startTrackDrag($event, track, index)"
                        @dragover.prevent="handleTrackDragOver($event, track, index)"
                        @dragleave="handleTrackDragLeave"
                        @drop.prevent="handleTrackDrop($event, track, index)"
                        @dragend="endTrackDrag"
                        @contextmenu.prevent="openTrackContextMenu($event, track, index)"
                    >
                        <div class="flex items-center justify-center w-4 h-full cursor-grab active:cursor-grabbing mr-1 text-text-sub hover:text-text-main">
                            <i class="fa-solid fa-grip-vertical text-[8px]"></i>
                        </div>
                        <div class="w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded mr-1" :style="{ backgroundColor: track.color || '#666', color: '#fff' }">
                            {{ vm.tracks.length - index }}
                        </div>
                        <button 
                            class="w-4 h-4 flex items-center justify-center rounded mr-1 shrink-0" 
                            :class="track.isMain ? 'text-yellow-400' : 'text-text-sub hover:text-yellow-400'"
                            @click.stop="setMainTrack(track)" 
                            title="메인 트랙"
                        >
                            <i :class="track.isMain ? 'fa-solid fa-star' : 'fa-regular fa-star'" style="font-size: 10px;"></i>
                        </button>
                        <div class="flex items-center gap-0.5 mr-1 shrink-0" v-show="(trackHeights[track.id] || 40) >= 30">
                            <button class="track-control-btn" :class="{ 'active': !track.isHidden }" @click.stop="track.isHidden = !track.isHidden" title="가시성">
                                <i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" style="font-size: 8px;"></i>
                            </button>
                            <button class="track-control-btn" :class="{ 'locked': track.isLocked }" @click.stop="track.isLocked = !track.isLocked" title="잠금">
                                <i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" style="font-size: 8px;"></i>
                            </button>
                        </div>
                        <div class="w-1 h-2/3 rounded mr-1 shrink-0" :style="{ backgroundColor: track.color || '#666' }"></div>
                        <input 
                            v-show="!isTrackNamesCollapsed && (trackHeights[track.id] || 40) >= 24"
                            type="text" 
                            class="text-[10px] truncate flex-1 text-text-main bg-transparent border-none outline-none min-w-0" 
                            :value="track.name" 
                            @input="track.name = $event.target.value" 
                            :disabled="track.isLocked"
                            @mousedown.stop
                        />
                        <div 
                            class="absolute left-0 right-0 bottom-0 h-1 cursor-ns-resize hover:bg-ui-accent/50 z-10"
                            @mousedown.prevent.stop="startTrackResize($event, track)"
                        ></div>
                    </div>
                    <div class="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-ui-accent/50" style="right: 0; z-index: 50;" @mousedown.prevent="startHeaderResize"></div>
                </div>

                <!-- 레인 영역 -->
                <div id="timeline-lane-container" class="relative bg-bg-dark min-w-max" @mousedown="handleLaneMouseDown" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop" @click="handleLaneClick">
                    <div id="timeline-ruler" class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark relative" style="z-index: 20;" :style="{ width: totalTimelineWidth + 'px' }">
                        <template v-for="mark in rulerMarks" :key="'ruler-' + mark.time">
                            <div v-if="mark.isMajor" class="absolute top-0 bottom-0 border-l border-ui-border" :style="{ left: mark.position + 'px' }">
                                <span class="absolute top-0 left-1 text-[9px] text-text-sub">{{ mark.label }}</span>
                            </div>
                            <div v-else-if="mark.isMid" class="absolute bottom-0 h-3 border-l border-ui-border opacity-50" :style="{ left: mark.position + 'px' }"></div>
                            <div v-else class="absolute bottom-0 h-1.5 border-l border-ui-border opacity-30" :style="{ left: mark.position + 'px' }"></div>
                        </template>
                    </div>
                    
                    <div 
                        v-for="(track, idx) in vm.tracks" 
                        :key="track.id" 
                        class="border-b border-ui-border relative track-lane" 
                        :class="{ 'opacity-30': track.isHidden }"
                        :style="{ height: (trackHeights[track.id] || 40) + 'px' }"
                    >
                        <div 
                            v-for="clip in getClipsForTrack(track.id)" 
                            :key="clip.id" 
                            :data-clip-id="clip.id" 
                            class="clip absolute rounded cursor-pointer overflow-hidden" 
                            :class="getClipClasses(clip)" 
                            :style="clipStyle(clip, track.id)" 
                            @click.stop="handleClipClick($event, clip)" 
                            @mousedown.stop="startClipDrag($event, clip, track)"
                        >
                            <div class="absolute inset-0 opacity-30" :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"></div>
                            <div v-if="clip.type === 'video' && (trackHeights[track.id] || 40) >= 24" class="absolute inset-0 flex items-center justify-center"><i class="fa-solid fa-film text-white/50"></i></div>
                            <template v-if="track.type === 'audio'">
                                <svg class="waveform" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" stroke="white" fill="transparent" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
                            </template>
                            <div v-show="(trackHeights[track.id] || 40) >= 16" class="text-[9px] px-1 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none">{{ clip.name }}</div>
                            <div class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, 'left')"></div>
                            <div class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, 'right')"></div>
                            <!-- 스냅 접촉면 플래시 (좌/우 측면만) -->
                            <div v-if="snapFlashEdge.clipId === clip.id && snapFlashEdge.side === 'left'" class="snap-edge-flash-left"></div>
                            <div v-if="snapFlashEdge.clipId === clip.id && snapFlashEdge.side === 'right'" class="snap-edge-flash-right"></div>
                        </div>
                    </div>
                    
                    <!-- 플레이헤드 -->
                    <div class="playhead-line" :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                    <div 
                        class="playhead-handle" 
                        :style="{ left: vm.currentTime * vm.zoom + 'px' }"
                        @mousedown.stop.prevent="startPlayheadDrag"
                    ></div>
                </div>
            </div>
            
            <div v-if="trackContextMenu" class="context-menu" :style="{ top: trackContextMenu.y + 'px', left: trackContextMenu.x + 'px' }" @click.stop>
                <div class="ctx-item" @click="setMainTrack(trackContextMenu.track); closeContextMenus()"><i class="fa-solid fa-star w-4"></i><span>메인 트랙 설정</span></div>
                <div class="ctx-item" @click="duplicateTrack(trackContextMenu.track)"><i class="fa-solid fa-copy w-4"></i><span>트랙 복제</span></div>
                <div class="ctx-item" @click="changeTrackColor(trackContextMenu.track)"><i class="fa-solid fa-palette w-4"></i><span>색상 변경</span></div>
                <div class="ctx-item" @click="resetTrackHeight(trackContextMenu.track)"><i class="fa-solid fa-arrows-up-down w-4"></i><span>높이 초기화</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item" @click="moveTrackUp(trackContextMenu.index)"><i class="fa-solid fa-arrow-up w-4"></i><span>위로 이동 (Z+)</span></div>
                <div class="ctx-item" @click="moveTrackDown(trackContextMenu.index)"><i class="fa-solid fa-arrow-down w-4"></i><span>아래로 이동 (Z-)</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item text-red-400 hover:!bg-ui-danger" @click="deleteTrack(trackContextMenu.track, trackContextMenu.index)"><i class="fa-solid fa-trash w-4"></i><span>삭제</span></div>
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
            draggingTrackId: null,
            draggingTrackIndex: null,
            dragOverTrackId: null,
            trackHeights: {},
            isResizingTrack: false,
            resizingTrackId: null,
            resizeStartY: 0,
            resizeStartHeight: 0,
            minTrackHeight: 12,
            defaultTrackHeight: 40,
            selectedClipIds: [],
            lastSelectedClipId: null,
            isDraggingClip: false,
            draggingClipIds: [],
            dragStartX: 0,
            dragStartPositions: {},
            isResizingClip: false,
            resizingClip: null,
            resizeDirection: null,
            resizeStartClipStart: 0,
            resizeStartClipDuration: 0,
            isDraggingPlayhead: false,
            lastSnappedClipId: null,
            totalDuration: 300,
            isTrackNamesCollapsed: false,
            snapFlashEdge: { clipId: null, side: null }
        };
    },
    computed: {
        formattedTime() {
            const t = this.vm.currentTime || 0;
            const h = Math.floor(t / 3600);
            const m = Math.floor((t % 3600) / 60);
            const s = Math.floor(t % 60);
            const f = Math.floor((t - Math.floor(t)) * 30);
            const pad = n => String(n).padStart(2, '0');
            return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
        },
        totalTimelineWidth() { return this.totalDuration * this.vm.zoom; },
        rulerMarks() {
            const marks = [];
            const zoom = this.vm.zoom;
            const duration = this.totalDuration;
            let majorInterval = 1, showMid = true, showMinor = true;
            if (zoom < 20) { majorInterval = 5; showMid = false; showMinor = false; }
            else if (zoom < 40) { majorInterval = 2; showMid = true; showMinor = false; }
            else { majorInterval = 1; showMid = true; showMinor = zoom >= 60; }
            for (let t = 0; t <= duration; t += 0.1) {
                const time = Math.round(t * 10) / 10;
                const position = time * zoom;
                const isMajor = time % majorInterval === 0;
                const isMid = showMid && !isMajor && time % 0.5 === 0;
                const isMinor = showMinor && !isMajor && !isMid;
                if (isMajor || isMid || isMinor) marks.push({ time, position, isMajor, isMid, label: isMajor ? this.formatRulerTime(time) : '' });
            }
            return marks;
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.adjustLayout();
            this.injectStyles();
            this.initTrackHeights();
            window.addEventListener('resize', this.adjustLayout);
            document.addEventListener('click', this.closeContextMenus);
            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
            document.addEventListener('keydown', this.handleKeyDown);
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.adjustLayout);
        document.removeEventListener('click', this.closeContextMenus);
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);
        document.removeEventListener('keydown', this.handleKeyDown);
    },
    methods: {
        injectStyles() {
            if (document.getElementById('timeline-custom-styles')) return;
            const style = document.createElement('style');
            style.id = 'timeline-custom-styles';
            style.textContent = `
                .snap-edge-flash-left, .snap-edge-flash-right {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 1px;
                    background: rgba(255, 255, 255, 0.2);
                    z-index: 50;
                    pointer-events: none;
                    animation: snapEdgeFlash 0.2s ease-out forwards;
                }
                .snap-edge-flash-left { left: 0; }
                .snap-edge-flash-right { right: 0; }
                @keyframes snapEdgeFlash {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .clip.multi-selected {
                    outline: 2px solid #f59e0b !important;
                    outline-offset: 1px;
                }
                [draggable="true"] { cursor: grab; }
                [draggable="true"]:active { cursor: grabbing; }
                .playhead-handle { cursor: ew-resize; }
            `;
            document.head.appendChild(style);
        },
        initTrackHeights() { this.vm.tracks.forEach(track => { if (!this.trackHeights[track.id]) this.trackHeights[track.id] = this.defaultTrackHeight; }); },
        toggleAllTrackNames() { this.isTrackNamesCollapsed = !this.isTrackNamesCollapsed; },
        startTrackDrag(e, track, index) {
            this.draggingTrackId = track.id;
            this.draggingTrackIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', track.id);
            const dragImage = document.createElement('div');
            dragImage.style.opacity = '0';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        },
        handleTrackDragOver(e, track, index) { if (this.draggingTrackId && this.draggingTrackId !== track.id) this.dragOverTrackId = track.id; },
        handleTrackDragLeave() { this.dragOverTrackId = null; },
        handleTrackDrop(e, targetTrack, targetIndex) {
            if (!this.draggingTrackId || this.draggingTrackId === targetTrack.id) { this.endTrackDrag(); return; }
            const fromIndex = this.draggingTrackIndex;
            const toIndex = targetIndex;
            if (fromIndex !== toIndex) {
                const tracks = [...this.vm.tracks];
                const [movedTrack] = tracks.splice(fromIndex, 1);
                tracks.splice(toIndex, 0, movedTrack);
                this.vm.tracks = tracks;
            }
            this.endTrackDrag();
        },
        endTrackDrag() { this.draggingTrackId = null; this.draggingTrackIndex = null; this.dragOverTrackId = null; },
        moveTrackUp(index) {
            if (index <= 0) return;
            const tracks = [...this.vm.tracks];
            [tracks[index - 1], tracks[index]] = [tracks[index], tracks[index - 1]];
            this.vm.tracks = tracks;
            this.closeContextMenus();
        },
        moveTrackDown(index) {
            if (index >= this.vm.tracks.length - 1) return;
            const tracks = [...this.vm.tracks];
            [tracks[index], tracks[index + 1]] = [tracks[index + 1], tracks[index]];
            this.vm.tracks = tracks;
            this.closeContextMenus();
        },
        getClipsForTrack(trackId) { return this.vm.clips.filter(c => c.trackId === trackId); },
        clipStyle(clip, trackId) {
            const height = this.trackHeights[trackId] || this.defaultTrackHeight;
            const padding = Math.max(2, Math.min(4, height * 0.1));
            return { left: clip.start * this.vm.zoom + 'px', width: Math.max(20, clip.duration * this.vm.zoom) + 'px', top: padding + 'px', height: (height - padding * 2) + 'px' };
        },
        getClipClasses(clip) {
            return {
                'selected': this.vm.selectedClip && this.vm.selectedClip.id === clip.id,
                'multi-selected': this.selectedClipIds.includes(clip.id) && this.selectedClipIds.length > 1,
                'clip-active': clip.isActive
            };
        },
        startTrackResize(e, track) {
            this.isResizingTrack = true;
            this.resizingTrackId = track.id;
            this.resizeStartY = e.clientY;
            this.resizeStartHeight = this.trackHeights[track.id] || this.defaultTrackHeight;
        },
        resetTrackHeight(track) { this.trackHeights[track.id] = this.defaultTrackHeight; this.closeContextMenus(); },
        handleClipClick(e, clip) {
            if (e.ctrlKey || e.metaKey) {
                const idx = this.selectedClipIds.indexOf(clip.id);
                if (idx >= 0) this.selectedClipIds.splice(idx, 1);
                else this.selectedClipIds.push(clip.id);
                this.lastSelectedClipId = clip.id;
            } else if (e.shiftKey && this.lastSelectedClipId) {
                const trackClips = this.getClipsForTrack(clip.trackId).sort((a, b) => a.start - b.start);
                const lastClip = trackClips.find(c => c.id === this.lastSelectedClipId);
                if (lastClip && lastClip.trackId === clip.trackId) {
                    const startIdx = trackClips.indexOf(lastClip);
                    const endIdx = trackClips.indexOf(clip);
                    const minIdx = Math.min(startIdx, endIdx);
                    const maxIdx = Math.max(startIdx, endIdx);
                    for (let i = minIdx; i <= maxIdx; i++) { if (!this.selectedClipIds.includes(trackClips[i].id)) this.selectedClipIds.push(trackClips[i].id); }
                } else this.selectedClipIds = [clip.id];
            } else { this.selectedClipIds = [clip.id]; this.lastSelectedClipId = clip.id; }
            this.vm.selectedClip = this.selectedClipIds.length === 1 ? this.vm.clips.find(c => c.id === this.selectedClipIds[0]) : null;
        },
        handleLaneClick(e) {
            if (e.target.id === 'timeline-lane-container' || e.target.classList.contains('track-lane')) {
                this.selectedClipIds = [];
                this.vm.selectedClip = null;
            }
        },
        handleKeyDown(e) {
            if (e.key === 'Delete' && this.selectedClipIds.length > 0) this.deleteSelectedClips();
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); this.selectedClipIds = this.vm.clips.map(c => c.id); }
            if (e.key === 'Escape') { this.selectedClipIds = []; this.vm.selectedClip = null; }
        },
        togglePlayback() { if (typeof this.vm.togglePlayback === 'function') this.vm.togglePlayback(); else this.vm.isPlaying = !this.vm.isPlaying; },
        seekToStart() { if (typeof this.vm.seekToStart === 'function') this.vm.seekToStart(); else this.vm.currentTime = 0; },
        seekToEnd() { let max = 0; this.vm.clips.forEach(c => { if (c.start + c.duration > max) max = c.start + c.duration; }); this.vm.currentTime = max; },
        seekToTime(t) { this.vm.currentTime = Math.max(0, t); },
        adjustLayout() { const p = document.getElementById('preview-main-container'); if (p) p.style.height = this.vm.isTimelineCollapsed ? 'calc(100% - 32px)' : '50%'; },
        toggleCollapse() { this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed; this.$nextTick(() => this.adjustLayout()); },
        startHeaderResize(e) { this.isResizingHeader = true; this.resizeStartX = e.clientX; this.resizeStartWidth = this.trackHeaderWidth; },
        formatRulerTime(s) { if (s < 60) return s + 's'; const m = Math.floor(s / 60); const sec = Math.round(s % 60); return m + ':' + String(sec).padStart(2, '0'); },
        addTrack() {
            const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
            const newTrack = { id: `t_${Date.now()}`, name: `Track ${this.vm.tracks.length + 1}`, type: 'video', color: colors[this.vm.tracks.length % colors.length], isHidden: false, isLocked: false, isMain: false };
            this.vm.tracks.push(newTrack);
            this.trackHeights[newTrack.id] = this.defaultTrackHeight;
        },
        deleteTrack(track, idx) {
            if (this.vm.tracks.length <= 1) { Swal.fire({ icon:'warning', title:'삭제 불가', text:'최소 1개 트랙 필요', background:'#1e1e1e', color:'#fff' }); return; }
            this.vm.clips = this.vm.clips.filter(c => c.trackId !== track.id);
            delete this.trackHeights[track.id];
            this.vm.tracks.splice(idx, 1);
            this.closeContextMenus();
        },
        duplicateTrack(track) {
            const idx = this.vm.tracks.findIndex(t => t.id === track.id);
            const newTrack = { ...track, id: `t_${Date.now()}`, name: track.name + ' (복사)', isMain: false };
            this.vm.tracks.splice(idx + 1, 0, newTrack);
            this.trackHeights[newTrack.id] = this.trackHeights[track.id] || this.defaultTrackHeight;
            this.closeContextMenus();
        },
        setMainTrack(track) { this.vm.tracks.forEach(t => t.isMain = t.id === track.id); },
        async changeTrackColor(track) {
            const { value } = await Swal.fire({ title:'트랙 색상', input:'text', inputValue:track.color, showCancelButton:true, background:'#1e1e1e', color:'#fff' });
            if (value) track.color = value;
            this.closeContextMenus();
        },
        openTrackContextMenu(e, track, idx) { this.trackContextMenu = { x: e.clientX, y: e.clientY, track, index: idx }; },
        closeContextMenus() { this.trackContextMenu = null; },
        handleLaneMouseDown(e) {
            const isRuler = e.target.id === 'timeline-ruler' || e.target.closest('#timeline-ruler');
            if (isRuler) this.updatePlayheadPosition(e);
        },
        startPlayheadDrag(e) { this.isDraggingPlayhead = true; this.updatePlayheadPosition(e); },
        startClipDrag(e, clip, track) {
            if (track.isLocked) return;
            if (!this.selectedClipIds.includes(clip.id)) { this.selectedClipIds = [clip.id]; this.vm.selectedClip = clip; }
            this.isDraggingClip = true;
            this.draggingClipIds = [...this.selectedClipIds];
            this.dragStartX = e.clientX;
            this.dragStartPositions = {};
            this.draggingClipIds.forEach(id => { const c = this.vm.clips.find(clip => clip.id === id); if (c) this.dragStartPositions[id] = c.start; });
        },
        startClipResize(e, clip, dir) {
            const track = this.vm.tracks.find(t => t.id === clip.trackId);
            if (track && track.isLocked) return;
            this.isResizingClip = true;
            this.resizingClip = clip;
            this.resizeDirection = dir;
            this.dragStartX = e.clientX;
            this.resizeStartClipStart = clip.start;
            this.resizeStartClipDuration = clip.duration;
        },
        updatePlayheadPosition(e) {
            const lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            const rect = lane.getBoundingClientRect();
            const x = e.clientX - rect.left;
            let time = Math.max(0, x / this.vm.zoom);
            if (this.vm.isMagnet) {
                let snap = null, minDiff = 10 / this.vm.zoom;
                this.vm.clips.forEach(c => {
                    if (Math.abs(time - c.start) < minDiff) { minDiff = Math.abs(time - c.start); snap = c.start; }
                    if (Math.abs(time - (c.start + c.duration)) < minDiff) { minDiff = Math.abs(time - (c.start + c.duration)); snap = c.start + c.duration; }
                });
                if (snap !== null) time = snap;
            }
            this.seekToTime(time);
        },
        checkClipCollision(clip, newStart, excludeIds = []) {
            const trackClips = this.getClipsForTrack(clip.trackId);
            const newEnd = newStart + clip.duration;
            for (const other of trackClips) {
                if (other.id === clip.id || excludeIds.includes(other.id)) continue;
                const otherEnd = other.start + other.duration;
                if (newStart < otherEnd && newEnd > other.start) return other;
            }
            return null;
        },
        findNonCollidingPosition(clip, desiredStart, excludeIds = []) {
            const collision = this.checkClipCollision(clip, desiredStart, excludeIds);
            if (!collision) return desiredStart;
            const collisionEnd = collision.start + collision.duration;
            return desiredStart < collision.start ? collision.start - clip.duration : collisionEnd;
        },
        showSnapEdgeFlash(clipId, side) {
            this.snapFlashEdge = { clipId, side };
            setTimeout(() => { if (this.snapFlashEdge.clipId === clipId && this.snapFlashEdge.side === side) this.snapFlashEdge = { clipId: null, side: null }; }, 200);
        },
        handleGlobalMouseMove(e) {
            if (this.isResizingHeader) this.trackHeaderWidth = Math.max(120, Math.min(400, this.resizeStartWidth + (e.clientX - this.resizeStartX)));
            if (this.isResizingTrack && this.resizingTrackId) {
                const dy = e.clientY - this.resizeStartY;
                const newHeight = Math.max(this.minTrackHeight, this.resizeStartHeight + dy);
                this.trackHeights[this.resizingTrackId] = newHeight;
            }
            if (this.isDraggingPlayhead) this.updatePlayheadPosition(e);
            if (this.isDraggingClip && this.draggingClipIds.length > 0) {
                const dx = e.clientX - this.dragStartX;
                const dt = dx / this.vm.zoom;
                this.draggingClipIds.forEach(id => {
                    const clip = this.vm.clips.find(c => c.id === id);
                    if (!clip) return;
                    let newStart = Math.max(0, this.dragStartPositions[id] + dt);
                    if (this.vm.isMagnet) {
                        const snap = this.findSnapPosition(newStart, clip, this.draggingClipIds);
                        if (snap.snapped) {
                            newStart = snap.position;
                            if (this.lastSnappedClipId !== snap.snappedToClipId) {
                                this.showSnapEdgeFlash(clip.id, snap.dragSide);
                                this.lastSnappedClipId = snap.snappedToClipId;
                            }
                        } else this.lastSnappedClipId = null;
                    }
                    const finalStart = this.findNonCollidingPosition(clip, newStart, this.draggingClipIds);
                    clip.start = Math.max(0, finalStart);
                });
                if (this.draggingClipIds.length === 1) {
                    const lane = document.getElementById('timeline-lane-container');
                    if (lane) {
                        const rect = lane.getBoundingClientRect();
                        const relY = e.clientY - rect.top - 24;
                        let accHeight = 0, targetTrack = null;
                        for (const track of this.vm.tracks) {
                            const trackHeight = this.trackHeights[track.id] || this.defaultTrackHeight;
                            if (relY >= accHeight && relY < accHeight + trackHeight) { targetTrack = track; break; }
                            accHeight += trackHeight;
                        }
                        const clip = this.vm.clips.find(c => c.id === this.draggingClipIds[0]);
                        if (targetTrack && !targetTrack.isLocked && clip && targetTrack.id !== clip.trackId) {
                            const tempClip = { ...clip, trackId: targetTrack.id };
                            const collision = this.checkClipCollision(tempClip, clip.start, []);
                            if (!collision) clip.trackId = targetTrack.id;
                        }
                    }
                }
            }
            if (this.isResizingClip && this.resizingClip) {
                const dx = e.clientX - this.dragStartX;
                const dt = dx / this.vm.zoom;
                if (this.resizeDirection === 'left') {
                    let ns = this.resizeStartClipStart + dt;
                    let nd = this.resizeStartClipDuration - dt;
                    if (ns < 0) { nd += ns; ns = 0; }
                    if (nd < 0.5) { nd = 0.5; ns = this.resizeStartClipStart + this.resizeStartClipDuration - 0.5; }
                    const tempClip = { ...this.resizingClip, start: ns, duration: nd };
                    const collision = this.checkClipCollision(tempClip, ns, [this.resizingClip.id]);
                    if (!collision) { this.resizingClip.start = ns; this.resizingClip.duration = nd; }
                } else {
                    let nd = this.resizeStartClipDuration + dt;
                    if (nd < 0.5) nd = 0.5;
                    const tempClip = { ...this.resizingClip, duration: nd };
                    const collision = this.checkClipCollision(tempClip, this.resizingClip.start, [this.resizingClip.id]);
                    if (!collision) this.resizingClip.duration = nd;
                }
            }
        },
        handleGlobalMouseUp() {
            this.isResizingHeader = false;
            this.isResizingTrack = false;
            this.resizingTrackId = null;
            this.isDraggingPlayhead = false;
            this.isDraggingClip = false;
            this.draggingClipIds = [];
            this.dragStartPositions = {};
            this.isResizingClip = false;
            this.resizingClip = null;
            this.lastSnappedClipId = null;
            this.snapFlashEdge = { clipId: null, side: null };
        },
        findSnapPosition(newStart, clip, excludeIds = []) {
            const snapDist = 10 / this.vm.zoom;
            const clipEnd = newStart + clip.duration;
            let snapped = false, pos = newStart, snappedToClipId = null, dragSide = null;
            if (Math.abs(newStart - this.vm.currentTime) < snapDist) { pos = this.vm.currentTime; snapped = true; snappedToClipId = 'playhead'; dragSide = 'left'; }
            else if (Math.abs(clipEnd - this.vm.currentTime) < snapDist) { pos = this.vm.currentTime - clip.duration; snapped = true; snappedToClipId = 'playhead'; dragSide = 'right'; }
            if (!snapped) {
                for (const c of this.vm.clips) {
                    if (c.id === clip.id || excludeIds.includes(c.id)) continue;
                    const os = c.start, oe = c.start + c.duration;
                    if (Math.abs(newStart - oe) < snapDist) { pos = oe; snapped = true; snappedToClipId = c.id; dragSide = 'left'; break; }
                    if (Math.abs(newStart - os) < snapDist) { pos = os; snapped = true; snappedToClipId = c.id; dragSide = 'left'; break; }
                    if (Math.abs(clipEnd - os) < snapDist) { pos = os - clip.duration; snapped = true; snappedToClipId = c.id; dragSide = 'right'; break; }
                    if (Math.abs(clipEnd - oe) < snapDist) { pos = oe - clip.duration; snapped = true; snappedToClipId = c.id; dragSide = 'right'; break; }
                }
            }
            return { snapped, position: pos, snappedToClipId, dragSide };
        },
        cutAtPlayhead() { if (this.selectedClipIds.length === 1 && typeof this.vm.splitClip === 'function') this.vm.splitClip(this.selectedClipIds[0], this.vm.currentTime); },
        cutAndDeleteLeft() {
            const t = this.vm.currentTime;
            this.vm.clips = this.vm.clips.filter(c => {
                if (c.start + c.duration <= t) return false;
                if (c.start < t) { c.duration = c.start + c.duration - t; c.start = t; }
                return true;
            });
        },
        cutAndDeleteRight() {
            const t = this.vm.currentTime;
            this.vm.clips = this.vm.clips.filter(c => {
                if (c.start >= t) return false;
                if (c.start + c.duration > t) c.duration = t - c.start;
                return true;
            });
        },
        deleteSelectedClips() {
            if (this.selectedClipIds.length === 0) return;
            const deletableIds = this.selectedClipIds.filter(id => {
                const clip = this.vm.clips.find(c => c.id === id);
                if (!clip) return false;
                const track = this.vm.tracks.find(t => t.id === clip.trackId);
                return !track || !track.isLocked;
            });
            if (deletableIds.length === 0) { Swal.fire({ icon:'warning', title:'삭제 불가', text:'잠긴 트랙의 클립입니다', background:'#1e1e1e', color:'#fff' }); return; }
            this.vm.clips = this.vm.clips.filter(c => !deletableIds.includes(c.id));
            this.selectedClipIds = [];
            this.vm.selectedClip = null;
        },
        handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; },
        handleDrop(e) {
            e.preventDefault();
            let data;
            try { data = JSON.parse(e.dataTransfer.getData('text/wai-asset')); } catch { return; }
            const lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            const rect = lane.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top - 24;
            const time = Math.max(0, x / this.vm.zoom);
            let accHeight = 0, targetTrack = null;
            for (const track of this.vm.tracks) {
                const trackHeight = this.trackHeights[track.id] || this.defaultTrackHeight;
                if (y >= accHeight && y < accHeight + trackHeight) { targetTrack = track; break; }
                accHeight += trackHeight;
            }
            if (!targetTrack) targetTrack = this.vm.tracks[this.vm.tracks.length - 1];
            if (!targetTrack) return;
            const newClip = { id: `c_${Date.now()}`, trackId: targetTrack.id, name: data.name || 'Clip', start: time, duration: data.duration || 10, type: data.type || 'video', src: data.src || data.url || '', isActive: false };
            const finalStart = this.findNonCollidingPosition(newClip, time, []);
            newClip.start = finalStart;
            if (typeof this.vm.addClipWithBox === 'function') this.vm.addClipWithBox(newClip);
            else this.vm.clips.push(newClip);
            this.selectedClipIds = [newClip.id];
            this.vm.selectedClip = newClip;
        },
        handleWheel(e) {
            const sc = document.getElementById('timeline-scroll-container');
            if (!sc) return;
            if (e.shiftKey) this.vm.zoom = Math.max(10, Math.min(100, this.vm.zoom + (e.deltaY > 0 ? -2 : 2)));
            else sc.scrollLeft += e.deltaY;
        }
    }
};

window.TimelinePanel = TimelinePanel;
