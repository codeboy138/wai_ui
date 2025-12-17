// Timeline Panel Component - Enhanced
// 룰러 세분화, 클립 충돌 방지, 다중 선택, 스냅 플래시

const TimelinePanel = {
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col bg-bg-panel select-none"
            :class="{ 'h-8': vm.isTimelineCollapsed, 'h-full': !vm.isTimelineCollapsed }"
            @wheel.prevent="handleWheel"
        >
            <!-- 타임라인 헤더 -->
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
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-text-sub">{{ Math.round(vm.zoom) }}%</span>
                    <input type="range" min="10" max="100" :value="vm.zoom" @input="vm.zoom = Number($event.target.value)" class="w-20 accent-ui-accent h-1" />
                </div>
            </div>
            
            <!-- 퀵 툴바 -->
            <div v-show="!vm.isTimelineCollapsed" class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-[10px]">
                <div class="flex gap-1 items-center">
                    <button class="tool-btn relative" title="자르기+왼쪽삭제" @click="cutAndDeleteLeft">
                        <i class="fa-solid fa-scissors"></i><span class="absolute -left-1 top-0 text-[8px] text-red-400">◀</span>
                    </button>
                    <button class="tool-btn relative" title="자르기+오른쪽삭제" @click="cutAndDeleteRight">
                        <i class="fa-solid fa-scissors"></i><span class="absolute -right-1 top-0 text-[8px] text-red-400">▶</span>
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
            
            <!-- 타임라인 영역 -->
            <div v-show="!vm.isTimelineCollapsed" id="timeline-scroll-container" class="flex-1 overflow-auto timeline-grid relative" :style="{ gridTemplateColumns: trackHeaderWidth + 'px 1fr' }">
                <!-- 트랙 헤더 -->
                <div class="sticky-col bg-bg-panel border-r border-ui-border relative" style="z-index: 30;">
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel sticky top-0" style="z-index: 40;">
                        <span>TRACKS</span><span class="text-[8px]">{{ vm.tracks.length }}</span>
                    </div>
                    <div v-for="(track, index) in vm.tracks" :key="track.id" class="h-10 border-b border-ui-border flex items-center px-2 group hover:bg-bg-hover bg-bg-panel" :class="{ 'opacity-50': track.isLocked, 'bg-bg-input': track.isMain }" @contextmenu.prevent="openTrackContextMenu($event, track, index)">
                        <div class="flex items-center gap-0.5 mr-2">
                            <button class="track-control-btn" :class="{ 'active': !track.isHidden }" @click="track.isHidden = !track.isHidden" title="가시성">
                                <i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                            </button>
                            <button class="track-control-btn" :class="{ 'locked': track.isLocked }" @click="track.isLocked = !track.isLocked" title="잠금">
                                <i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'"></i>
                            </button>
                            <button class="track-control-btn" @click="setMainTrack(track)" title="메인 트랙">
                                <i :class="track.isMain ? 'fa-solid fa-star text-yellow-400' : 'fa-regular fa-star text-text-sub'"></i>
                            </button>
                        </div>
                        <div class="w-1 h-2/3 rounded mr-2" :style="{ backgroundColor: track.color || '#666' }"></div>
                        <input type="text" class="text-xs truncate flex-1 text-text-main bg-transparent border-none outline-none" :value="track.name" @input="track.name = $event.target.value" :disabled="track.isLocked" />
                    </div>
                    <div class="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-ui-accent/50" style="right: 0; z-index: 50;" @mousedown.prevent="startHeaderResize"></div>
                </div>

                <!-- 레인 영역 -->
                <div id="timeline-lane-container" class="relative bg-bg-dark min-w-max" @mousedown="handleLaneMouseDown" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop" @click="handleLaneClick">
                    <!-- 룰러 (세분화) -->
                    <div id="timeline-ruler" class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark relative" style="z-index: 20;" :style="{ width: totalTimelineWidth + 'px' }">
                        <template v-for="mark in rulerMarks" :key="'ruler-' + mark.time">
                            <!-- 주눈금 (1초 단위) -->
                            <div v-if="mark.isMajor" class="absolute top-0 bottom-0 border-l border-ui-border" :style="{ left: mark.position + 'px' }">
                                <span class="absolute top-0 left-1 text-[9px] text-text-sub">{{ mark.label }}</span>
                            </div>
                            <!-- 중간눈금 (0.5초) -->
                            <div v-else-if="mark.isMid" class="absolute bottom-0 h-3 border-l border-ui-border opacity-50" :style="{ left: mark.position + 'px' }"></div>
                            <!-- 세부눈금 (0.1초) -->
                            <div v-else class="absolute bottom-0 h-1.5 border-l border-ui-border opacity-30" :style="{ left: mark.position + 'px' }"></div>
                        </template>
                    </div>
                    
                    <!-- 트랙 레인 -->
                    <div v-for="(track, idx) in vm.tracks" :key="track.id" class="h-10 border-b border-ui-border relative track-lane" :class="{ 'opacity-30': track.isHidden }">
                        <div v-for="clip in getClipsForTrack(track.id)" :key="clip.id" :data-clip-id="clip.id" class="clip absolute top-1 h-8 rounded cursor-pointer overflow-hidden" :class="getClipClasses(clip)" :style="clipStyle(clip)" @click.stop="handleClipClick($event, clip)" @mousedown.stop="startClipDrag($event, clip, track)">
                            <div class="absolute inset-0 opacity-30" :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"></div>
                            <div v-if="clip.type === 'video'" class="absolute inset-0 flex items-center justify-center"><i class="fa-solid fa-film text-white/50 text-lg"></i></div>
                            <template v-if="track.type === 'audio'">
                                <svg class="waveform" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" stroke="white" fill="transparent" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
                            </template>
                            <div class="text-[9px] px-2 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none">{{ clip.name }}</div>
                            <div class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, 'left')"></div>
                            <div class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, 'right')"></div>
                        </div>
                    </div>
                    
                    <!-- 플레이헤드 -->
                    <div class="playhead-line" :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                    <div class="playhead-handle" :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                </div>
            </div>
            
            <!-- 컨텍스트 메뉴 -->
            <div v-if="trackContextMenu" class="context-menu" :style="{ top: trackContextMenu.y + 'px', left: trackContextMenu.x + 'px' }" @click.stop>
                <div class="ctx-item" @click="duplicateTrack(trackContextMenu.track)"><i class="fa-solid fa-copy w-4"></i><span>트랙 복제</span></div>
                <div class="ctx-item" @click="changeTrackColor(trackContextMenu.track)"><i class="fa-solid fa-palette w-4"></i><span>색상 변경</span></div>
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
            
            // 다중 선택
            selectedClipIds: [],
            lastSelectedClipId: null,
            
            // 드래그
            isDraggingClip: false,
            draggingClipIds: [],
            dragStartX: 0,
            dragStartPositions: {},
            
            // 리사이즈
            isResizingClip: false,
            resizingClip: null,
            resizeDirection: null,
            resizeStartClipStart: 0,
            resizeStartClipDuration: 0,
            
            // 플레이헤드
            isDraggingPlayhead: false,
            
            // 스냅 플래시
            lastSnappedClipId: null,
            snapFlashTimeouts: {},
            
            // 타임라인 총 길이 (초)
            totalDuration: 300
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
        
        totalTimelineWidth() {
            return this.totalDuration * this.vm.zoom;
        },
        
        // 룰러 눈금 생성 (세분화)
        rulerMarks() {
            const marks = [];
            const zoom = this.vm.zoom;
            const duration = this.totalDuration;
            
            // 줌 레벨에 따라 눈금 간격 조정
            let majorInterval = 1; // 기본 1초
            let showMid = true;
            let showMinor = true;
            
            if (zoom < 20) {
                majorInterval = 5;
                showMid = false;
                showMinor = false;
            } else if (zoom < 40) {
                majorInterval = 2;
                showMid = true;
                showMinor = false;
            } else {
                majorInterval = 1;
                showMid = true;
                showMinor = zoom >= 60;
            }
            
            for (let t = 0; t <= duration; t += 0.1) {
                const time = Math.round(t * 10) / 10;
                const position = time * zoom;
                const isMajor = time % majorInterval === 0;
                const isMid = showMid && !isMajor && time % 0.5 === 0;
                const isMinor = showMinor && !isMajor && !isMid;
                
                if (isMajor || isMid || isMinor) {
                    marks.push({
                        time,
                        position,
                        isMajor,
                        isMid,
                        label: isMajor ? this.formatRulerTime(time) : ''
                    });
                }
            }
            
            return marks;
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.adjustLayout();
            this.injectSnapFlashStyles();
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
        Object.values(this.snapFlashTimeouts).forEach(t => clearTimeout(t));
    },
    methods: {
        // 스냅 플래시 CSS 동적 주입
        injectSnapFlashStyles() {
            if (document.getElementById('snap-flash-styles')) return;
            const style = document.createElement('style');
            style.id = 'snap-flash-styles';
            style.textContent = `
                @keyframes snapFlashWhite {
                    0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                    10% { box-shadow: 0 0 20px 8px rgba(255, 255, 255, 0.9), inset 0 0 30px rgba(255, 255, 255, 0.8); }
                    30% { box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.5); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                }
                .clip.snap-flash {
                    animation: snapFlashWhite 1s ease-out forwards !important;
                }
                .clip.multi-selected {
                    outline: 2px solid #f59e0b !important;
                    outline-offset: 1px;
                }
            `;
            document.head.appendChild(style);
        },
        
        getClipsForTrack(trackId) { 
            return this.vm.clips.filter(c => c.trackId === trackId); 
        },
        
        clipStyle(clip) { 
            return { 
                left: clip.start * this.vm.zoom + 'px', 
                width: Math.max(20, clip.duration * this.vm.zoom) + 'px' 
            }; 
        },
        
        getClipClasses(clip) {
            return {
                'selected': this.vm.selectedClip && this.vm.selectedClip.id === clip.id,
                'multi-selected': this.selectedClipIds.includes(clip.id) && this.selectedClipIds.length > 1,
                'clip-active': clip.isActive
            };
        },
        
        // 클립 클릭 핸들러 (다중 선택 지원)
        handleClipClick(e, clip) {
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+클릭: 개별 토글
                const idx = this.selectedClipIds.indexOf(clip.id);
                if (idx >= 0) {
                    this.selectedClipIds.splice(idx, 1);
                } else {
                    this.selectedClipIds.push(clip.id);
                }
                this.lastSelectedClipId = clip.id;
            } else if (e.shiftKey && this.lastSelectedClipId) {
                // Shift+클릭: 범위 선택 (같은 트랙 내)
                const trackClips = this.getClipsForTrack(clip.trackId).sort((a, b) => a.start - b.start);
                const lastClip = trackClips.find(c => c.id === this.lastSelectedClipId);
                
                if (lastClip && lastClip.trackId === clip.trackId) {
                    const startIdx = trackClips.indexOf(lastClip);
                    const endIdx = trackClips.indexOf(clip);
                    const minIdx = Math.min(startIdx, endIdx);
                    const maxIdx = Math.max(startIdx, endIdx);
                    
                    for (let i = minIdx; i <= maxIdx; i++) {
                        if (!this.selectedClipIds.includes(trackClips[i].id)) {
                            this.selectedClipIds.push(trackClips[i].id);
                        }
                    }
                } else {
                    // 다른 트랙이면 단일 선택
                    this.selectedClipIds = [clip.id];
                }
            } else {
                // 일반 클릭: 단일 선택
                this.selectedClipIds = [clip.id];
                this.lastSelectedClipId = clip.id;
            }
            
            // vm.selectedClip 동기화
            if (this.selectedClipIds.length === 1) {
                this.vm.selectedClip = this.vm.clips.find(c => c.id === this.selectedClipIds[0]);
            } else {
                this.vm.selectedClip = null;
            }
        },
        
        // 레인 클릭 (선택 해제)
        handleLaneClick(e) {
            if (e.target.id === 'timeline-lane-container' || e.target.classList.contains('track-lane')) {
                this.selectedClipIds = [];
                this.vm.selectedClip = null;
            }
        },
        
        // 키보드 이벤트
        handleKeyDown(e) {
            // Delete 키로 선택된 클립 삭제
            if (e.key === 'Delete' && this.selectedClipIds.length > 0) {
                this.deleteSelectedClips();
            }
            // Ctrl+A: 전체 선택
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.selectedClipIds = this.vm.clips.map(c => c.id);
            }
            // Escape: 선택 해제
            if (e.key === 'Escape') {
                this.selectedClipIds = [];
                this.vm.selectedClip = null;
            }
        },
        
        togglePlayback() { 
            if (typeof this.vm.togglePlayback === 'function') this.vm.togglePlayback(); 
            else this.vm.isPlaying = !this.vm.isPlaying; 
        },
        seekToStart() { 
            if (typeof this.vm.seekToStart === 'function') this.vm.seekToStart(); 
            else this.vm.currentTime = 0; 
        },
        seekToEnd() {
            let max = 0;
            this.vm.clips.forEach(c => { if (c.start + c.duration > max) max = c.start + c.duration; });
            this.vm.currentTime = max;
        },
        seekToTime(t) { this.vm.currentTime = Math.max(0, t); },
        
        adjustLayout() {
            const p = document.getElementById('preview-main-container');
            if (p) p.style.height = this.vm.isTimelineCollapsed ? 'calc(100% - 32px)' : '50%';
        },
        toggleCollapse() { 
            this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed; 
            this.$nextTick(() => this.adjustLayout()); 
        },
        
        startHeaderResize(e) { 
            this.isResizingHeader = true; 
            this.resizeStartX = e.clientX; 
            this.resizeStartWidth = this.trackHeaderWidth; 
        },
        
        formatRulerTime(s) { 
            if (s < 60) return s + 's';
            const m = Math.floor(s / 60);
            const sec = Math.round(s % 60);
            return m + ':' + String(sec).padStart(2, '0');
        },
        
        addTrack() {
            const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
            this.vm.tracks.push({ 
                id: `t_${Date.now()}`, 
                name: `Track ${this.vm.tracks.length + 1}`, 
                type: 'video', 
                color: colors[this.vm.tracks.length % colors.length], 
                isHidden: false, 
                isLocked: false, 
                isMain: false 
            });
        },
        
        deleteTrack(track, idx) {
            if (this.vm.tracks.length <= 1) { 
                Swal.fire({ icon:'warning', title:'삭제 불가', text:'최소 1개 트랙 필요', background:'#1e1e1e', color:'#fff' }); 
                return; 
            }
            this.vm.clips = this.vm.clips.filter(c => c.trackId !== track.id);
            this.vm.tracks.splice(idx, 1);
            this.closeContextMenus();
        },
        
        duplicateTrack(track) {
            const idx = this.vm.tracks.findIndex(t => t.id === track.id);
            this.vm.tracks.splice(idx + 1, 0, { 
                ...track, 
                id: `t_${Date.now()}`, 
                name: track.name + ' (복사)', 
                isMain: false 
            });
            this.closeContextMenus();
        },
        
        setMainTrack(track) { 
            this.vm.tracks.forEach(t => t.isMain = t.id === track.id); 
        },
        
        async changeTrackColor(track) {
            const { value } = await Swal.fire({ 
                title:'트랙 색상', 
                input:'text', 
                inputValue:track.color, 
                showCancelButton:true, 
                background:'#1e1e1e', 
                color:'#fff' 
            });
            if (value) track.color = value;
            this.closeContextMenus();
        },
        
        openTrackContextMenu(e, track, idx) { 
            this.trackContextMenu = { x: e.clientX, y: e.clientY, track, index: idx }; 
        },
        closeContextMenus() { this.trackContextMenu = null; },
        
        handleLaneMouseDown(e) {
            const isRuler = e.target.id === 'timeline-ruler' || e.target.closest('#timeline-ruler');
            const isPlayhead = e.target.classList.contains('playhead-handle');
            if (isRuler || isPlayhead) { 
                this.isDraggingPlayhead = true; 
                this.updatePlayheadPosition(e); 
            }
        },
        
        startClipDrag(e, clip, track) {
            if (track.isLocked) return;
            
            // 선택되지 않은 클립을 드래그하면 해당 클립만 선택
            if (!this.selectedClipIds.includes(clip.id)) {
                this.selectedClipIds = [clip.id];
                this.vm.selectedClip = clip;
            }
            
            this.isDraggingClip = true;
            this.draggingClipIds = [...this.selectedClipIds];
            this.dragStartX = e.clientX;
            
            // 각 클립의 시작 위치 저장
            this.dragStartPositions = {};
            this.draggingClipIds.forEach(id => {
                const c = this.vm.clips.find(clip => clip.id === id);
                if (c) this.dragStartPositions[id] = c.start;
            });
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
        
        // 클립 충돌 검사
        checkClipCollision(clip, newStart, excludeIds = []) {
            const trackClips = this.getClipsForTrack(clip.trackId);
            const newEnd = newStart + clip.duration;
            
            for (const other of trackClips) {
                if (other.id === clip.id || excludeIds.includes(other.id)) continue;
                const otherEnd = other.start + other.duration;
                
                // 겹침 검사
                if (newStart < otherEnd && newEnd > other.start) {
                    return other;
                }
            }
            return null;
        },
        
        // 충돌 없는 위치 찾기
        findNonCollidingPosition(clip, desiredStart, excludeIds = []) {
            const collision = this.checkClipCollision(clip, desiredStart, excludeIds);
            if (!collision) return desiredStart;
            
            // 충돌 시 스냅 위치로 조정
            const collisionEnd = collision.start + collision.duration;
            
            // 원래 위치가 충돌 클립의 왼쪽이면 왼쪽에 붙이고, 오른쪽이면 오른쪽에 붙임
            if (desiredStart < collision.start) {
                return collision.start - clip.duration;
            } else {
                return collisionEnd;
            }
        },
        
        // 클립 스냅 시 백색 플래시 효과 (1초)
        triggerSnapFlash(clipId, snappedToClipId) {
            const triggerFlashOnClip = (id) => {
                if (!id || id === 'playhead') return;
                const clipEl = this.$el.querySelector(`[data-clip-id="${id}"]`);
                if (!clipEl) return;
                
                if (this.snapFlashTimeouts[id]) {
                    clearTimeout(this.snapFlashTimeouts[id]);
                    clipEl.classList.remove('snap-flash');
                    void clipEl.offsetWidth;
                }
                
                clipEl.classList.add('snap-flash');
                this.snapFlashTimeouts[id] = setTimeout(() => {
                    clipEl.classList.remove('snap-flash');
                    delete this.snapFlashTimeouts[id];
                }, 1000);
            };
            
            triggerFlashOnClip(clipId);
            if (snappedToClipId && snappedToClipId !== 'playhead') {
                triggerFlashOnClip(snappedToClipId);
            }
        },
        
        handleGlobalMouseMove(e) {
            if (this.isResizingHeader) {
                this.trackHeaderWidth = Math.max(120, Math.min(400, this.resizeStartWidth + (e.clientX - this.resizeStartX)));
            }
            
            if (this.isDraggingPlayhead) {
                this.updatePlayheadPosition(e);
            }
            
            if (this.isDraggingClip && this.draggingClipIds.length > 0) {
                const dx = e.clientX - this.dragStartX;
                const dt = dx / this.vm.zoom;
                
                // 모든 선택된 클립 이동
                this.draggingClipIds.forEach(id => {
                    const clip = this.vm.clips.find(c => c.id === id);
                    if (!clip) return;
                    
                    let newStart = Math.max(0, this.dragStartPositions[id] + dt);
                    
                    // 스냅
                    if (this.vm.isMagnet) {
                        const snap = this.findSnapPosition(newStart, clip, this.draggingClipIds);
                        if (snap.snapped) {
                            newStart = snap.position;
                            if (this.lastSnappedClipId !== snap.snappedToClipId) {
                                this.triggerSnapFlash(clip.id, snap.snappedToClipId);
                                this.lastSnappedClipId = snap.snappedToClipId;
                            }
                        } else {
                            this.lastSnappedClipId = null;
                        }
                    }
                    
                    // 충돌 검사 및 조정
                    const finalStart = this.findNonCollidingPosition(clip, newStart, this.draggingClipIds);
                    clip.start = Math.max(0, finalStart);
                });
                
                // 트랙 변경 (단일 클립 드래그 시에만)
                if (this.draggingClipIds.length === 1) {
                    const lane = document.getElementById('timeline-lane-container');
                    if (lane) {
                        const rect = lane.getBoundingClientRect();
                        const relY = e.clientY - rect.top - 24;
                        const trackIdx = Math.max(0, Math.min(this.vm.tracks.length - 1, Math.floor(relY / 40)));
                        const target = this.vm.tracks[trackIdx];
                        const clip = this.vm.clips.find(c => c.id === this.draggingClipIds[0]);
                        
                        if (target && !target.isLocked && clip && target.id !== clip.trackId) {
                            // 새 트랙에서 충돌 검사
                            const tempClip = { ...clip, trackId: target.id };
                            const collision = this.checkClipCollision(tempClip, clip.start, []);
                            if (!collision) {
                                clip.trackId = target.id;
                            }
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
                    
                    // 충돌 검사
                    const tempClip = { ...this.resizingClip, start: ns, duration: nd };
                    const collision = this.checkClipCollision(tempClip, ns, [this.resizingClip.id]);
                    if (!collision) {
                        this.resizingClip.start = ns;
                        this.resizingClip.duration = nd;
                    }
                } else {
                    let nd = this.resizeStartClipDuration + dt;
                    if (nd < 0.5) nd = 0.5;
                    
                    // 충돌 검사
                    const tempClip = { ...this.resizingClip, duration: nd };
                    const collision = this.checkClipCollision(tempClip, this.resizingClip.start, [this.resizingClip.id]);
                    if (!collision) {
                        this.resizingClip.duration = nd;
                    }
                }
            }
        },
        
        handleGlobalMouseUp() {
            this.isResizingHeader = false;
            this.isDraggingPlayhead = false;
            this.isDraggingClip = false;
            this.draggingClipIds = [];
            this.dragStartPositions = {};
            this.isResizingClip = false;
            this.resizingClip = null;
            this.lastSnappedClipId = null;
        },
        
        findSnapPosition(newStart, clip, excludeIds = []) {
            const snapDist = 10 / this.vm.zoom;
            const clipEnd = newStart + clip.duration;
            let snapped = false, pos = newStart, snappedToClipId = null;
            
            // 플레이헤드 스냅
            if (Math.abs(newStart - this.vm.currentTime) < snapDist) { 
                pos = this.vm.currentTime; 
                snapped = true; 
                snappedToClipId = 'playhead';
            } else if (Math.abs(clipEnd - this.vm.currentTime) < snapDist) { 
                pos = this.vm.currentTime - clip.duration; 
                snapped = true; 
                snappedToClipId = 'playhead';
            }
            
            // 다른 클립 스냅
            if (!snapped) {
                for (const c of this.vm.clips) {
                    if (c.id === clip.id || excludeIds.includes(c.id)) continue;
                    const os = c.start, oe = c.start + c.duration;
                    if (Math.abs(newStart - oe) < snapDist) { 
                        pos = oe; snapped = true; snappedToClipId = c.id; break; 
                    }
                    if (Math.abs(newStart - os) < snapDist) { 
                        pos = os; snapped = true; snappedToClipId = c.id; break; 
                    }
                    if (Math.abs(clipEnd - os) < snapDist) { 
                        pos = os - clip.duration; snapped = true; snappedToClipId = c.id; break; 
                    }
                    if (Math.abs(clipEnd - oe) < snapDist) { 
                        pos = oe - clip.duration; snapped = true; snappedToClipId = c.id; break; 
                    }
                }
            }
            return { snapped, position: pos, snappedToClipId };
        },
        
        cutAtPlayhead() { 
            if (this.selectedClipIds.length === 1 && typeof this.vm.splitClip === 'function') {
                this.vm.splitClip(this.selectedClipIds[0], this.vm.currentTime);
            }
        },
        
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
            
            // 잠긴 트랙 클립 필터링
            const deletableIds = this.selectedClipIds.filter(id => {
                const clip = this.vm.clips.find(c => c.id === id);
                if (!clip) return false;
                const track = this.vm.tracks.find(t => t.id === clip.trackId);
                return !track || !track.isLocked;
            });
            
            if (deletableIds.length === 0) {
                Swal.fire({ icon:'warning', title:'삭제 불가', text:'잠긴 트랙의 클립입니다', background:'#1e1e1e', color:'#fff' });
                return;
            }
            
            this.vm.clips = this.vm.clips.filter(c => !deletableIds.includes(c.id));
            this.selectedClipIds = [];
            this.vm.selectedClip = null;
        },
        
        handleDragOver(e) { 
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'copy'; 
        },
        
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
            const trackIdx = Math.max(0, Math.min(this.vm.tracks.length - 1, Math.floor(y / 40)));
            const track = this.vm.tracks[trackIdx];
            if (!track) return;
            
            const newClip = { 
                id: `c_${Date.now()}`, 
                trackId: track.id, 
                name: data.name || 'Clip', 
                start: time, 
                duration: 10, 
                type: data.type || 'video', 
                src: data.src || '', 
                isActive: false 
            };
            
            // 충돌 검사 후 위치 조정
            const finalStart = this.findNonCollidingPosition(newClip, time, []);
            newClip.start = finalStart;
            
            this.vm.clips.push(newClip);
            this.selectedClipIds = [newClip.id];
            this.vm.selectedClip = newClip;
            
            Swal.fire({ 
                icon:'success', 
                title:'클립 추가', 
                text:`"${data.name}" → ${track.name}`, 
                background:'#1e1e1e', 
                color:'#fff', 
                timer:1500, 
                showConfirmButton:false 
            });
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
