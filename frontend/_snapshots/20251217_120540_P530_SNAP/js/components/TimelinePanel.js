// Timeline Panel Component - Enhanced
// 복수선택, 클립 충돌 방지, 스냅 플래시(좌우끝), 룰러 눈금 세분화, 완전 접기

const TimelinePanel = {
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col bg-bg-panel select-none"
            :style="{ height: vm.isTimelineCollapsed ? '32px' : '100%' }"
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
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-text-sub">{{ Math.round(vm.zoom) }}%</span>
                    <input type="range" min="10" max="200" :value="vm.zoom" @input="vm.zoom = Number($event.target.value)" class="w-20 accent-ui-accent h-1" />
                </div>
            </div>
            
            <!-- 퀵 툴바 -->
            <div v-show="!vm.isTimelineCollapsed" class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-[10px]">
                <div class="flex gap-1 items-center">
                    <button class="tool-btn relative" title="선택 클립 내 왼쪽 자르기" @click="cutAndDeleteLeft">
                        <i class="fa-solid fa-scissors"></i><span class="absolute -left-1 top-0 text-[8px] text-red-400">◀</span>
                    </button>
                    <button class="tool-btn relative" title="선택 클립 내 오른쪽 자르기" @click="cutAndDeleteRight">
                        <i class="fa-solid fa-scissors"></i><span class="absolute -right-1 top-0 text-[8px] text-red-400">▶</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn" title="선택 클립 분할" @click="cutAtPlayhead"><i class="fa-solid fa-scissors"></i></button>
                    <button class="tool-btn" title="선택 클립 삭제" @click="deleteSelectedClips"><i class="fa-solid fa-trash"></i></button>
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
            <div v-show="!vm.isTimelineCollapsed" id="timeline-scroll-container" class="flex-1 overflow-auto timeline-grid relative" :style="{ gridTemplateColumns: (isHeaderCollapsed ? 8 : trackHeaderWidth) + 'px 1fr' }">
                <!-- 트랙 헤더 -->
                <div class="sticky-col bg-bg-panel border-r border-ui-border relative" style="z-index: 30;">
                    <!-- 헤더 타이틀 -->
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel sticky top-0" style="z-index: 40;">
                        <template v-if="!isHeaderCollapsed">
                            <span>TRACKS</span>
                            <span class="text-[8px]">{{ vm.tracks.length }}</span>
                        </template>
                        <button v-else class="w-full h-full flex items-center justify-center text-text-sub hover:text-text-main" @click="isHeaderCollapsed = false" title="헤더 펼치기">
                            <i class="fa-solid fa-angles-right text-[8px]"></i>
                        </button>
                    </div>
                    
                    <!-- 트랙 헤더 목록 -->
                    <div v-for="(track, index) in vm.tracks" :key="track.id" class="border-b border-ui-border flex items-center group hover:bg-bg-hover bg-bg-panel relative" :class="{ 'opacity-50': track.isLocked, 'bg-bg-input': track.isMain }" :style="{ height: (trackHeights[track.id] || 40) + 'px' }" @contextmenu.prevent="openTrackContextMenu($event, track, index)">
                        <template v-if="!isHeaderCollapsed">
                            <div class="flex items-center gap-0.5 mr-2 px-2">
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
                        </template>
                        <template v-else>
                            <div class="w-full h-full flex items-center justify-center">
                                <div class="w-1 h-1/2 rounded" :style="{ backgroundColor: track.color || '#666' }"></div>
                            </div>
                        </template>
                        <!-- 트랙 높이 조절 핸들 -->
                        <div class="track-height-handle" @mousedown.prevent="startTrackHeightResize($event, track)"></div>
                    </div>
                    
                    <!-- 헤더 폭 조절 / 접기 핸들 -->
                    <div v-if="!isHeaderCollapsed" class="absolute top-0 bottom-0 w-2 cursor-col-resize hover:bg-ui-accent/50 flex items-center justify-center group" style="right: 0; z-index: 50;" @mousedown.prevent="startHeaderResize" @dblclick="isHeaderCollapsed = true">
                        <div class="w-0.5 h-8 bg-ui-border group-hover:bg-ui-accent rounded"></div>
                    </div>
                </div>

                <!-- 레인 영역 -->
                <div id="timeline-lane-container" class="relative bg-bg-dark min-w-max" @mousedown="handleLaneMouseDown" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
                    <!-- 룰러 (세분화된 눈금) -->
                    <div id="timeline-ruler" class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark relative" style="z-index: 20; min-width: 100%;">
                        <template v-for="mark in rulerMarks" :key="'ruler-' + mark.time">
                            <!-- 주 눈금 -->
                            <div v-if="mark.type === 'major'" class="absolute top-0 bottom-0 w-px bg-ui-border" :style="{ left: mark.pos + 'px' }">
                                <span class="absolute top-0 left-1 text-[9px] text-text-sub whitespace-nowrap">{{ mark.label }}</span>
                            </div>
                            <!-- 중간 눈금 -->
                            <div v-else-if="mark.type === 'minor'" class="absolute bottom-0 w-px h-3 bg-white/20" :style="{ left: mark.pos + 'px' }"></div>
                            <!-- 세부 눈금 -->
                            <div v-else class="absolute bottom-0 w-px h-1.5 bg-white/10" :style="{ left: mark.pos + 'px' }"></div>
                        </template>
                    </div>
                    
                    <!-- 트랙 레인 -->
                    <div v-for="(track, idx) in vm.tracks" :key="track.id" class="border-b border-ui-border relative track-lane" :class="{ 'opacity-30': track.isHidden }" :style="{ height: (trackHeights[track.id] || 40) + 'px' }">
                        <div v-for="clip in getClipsForTrack(track.id)" :key="clip.id" :data-clip-id="clip.id" class="clip absolute rounded cursor-pointer overflow-hidden" :class="getClipClasses(clip)" :style="clipStyle(clip, track)" @click.stop="handleClipClick($event, clip, track)" @mousedown.stop="startClipDrag($event, clip, track)">
                            <!-- 배경색 -->
                            <div class="absolute inset-0 opacity-30" :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"></div>
                            <!-- 프레임 썸네일 -->
                            <div v-if="clip.type === 'video' && clip.frames && clip.frames.length" class="clip-frames">
                                <div v-for="(frame, fi) in getVisibleFrames(clip)" :key="fi" class="clip-frame" :style="{ width: getFrameWidth(clip) + 'px', backgroundImage: 'url(' + frame + ')' }"></div>
                            </div>
                            <!-- 비디오 아이콘 (프레임 없을 때) -->
                            <div v-else-if="clip.type === 'video'" class="absolute inset-0 flex items-center justify-center"><i class="fa-solid fa-film text-white/50 text-lg"></i></div>
                            <!-- 오디오 파형 -->
                            <template v-if="track.type === 'audio'">
                                <svg class="waveform" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" stroke="white" fill="transparent" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
                            </template>
                            <!-- 클립 이름 -->
                            <div class="text-[9px] px-2 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none" style="line-height: 1.2; padding-top: 2px;">{{ clip.name }}</div>
                            <!-- 리사이즈 핸들 -->
                            <div class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, 'left')"></div>
                            <div class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, 'right')"></div>
                        </div>
                    </div>
                    
                    <!-- 수직 정렬선 (크로스 트랙 스냅) -->
                    <div v-if="snapAlignLine !== null" class="snap-align-line" :style="{ left: snapAlignLine * vm.zoom + 'px' }"></div>
                    
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
            isHeaderCollapsed: false,
            isResizingHeader: false,
            resizeStartX: 0,
            resizeStartWidth: 0,
            trackContextMenu: null,
            isDraggingClip: false,
            draggingClips: [],
            draggingClipOriginalPositions: [],
            dragStartX: 0,
            isResizingClip: false,
            resizingClip: null,
            resizeDirection: null,
            resizeStartClipStart: 0,
            resizeStartClipDuration: 0,
            isDraggingPlayhead: false,
            lastSnappedInfo: null,
            snapFlashTimeouts: {},
            snapAlignLine: null,
            trackHeights: {},
            isResizingTrackHeight: false,
            resizingTrack: null,
            resizeStartY: 0,
            resizeStartHeight: 0,
            selectedClipIds: [],
            lastClickedClipId: null
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
        rulerMarks() {
            const marks = [];
            const zoom = this.vm.zoom;
            const totalSeconds = 300;
            
            let majorInterval, minorInterval, subInterval;
            if (zoom >= 100) {
                majorInterval = 1; minorInterval = 0.5; subInterval = 0.1;
            } else if (zoom >= 50) {
                majorInterval = 2; minorInterval = 1; subInterval = 0.5;
            } else if (zoom >= 25) {
                majorInterval = 5; minorInterval = 1; subInterval = 0.5;
            } else {
                majorInterval = 10; minorInterval = 5; subInterval = 1;
            }
            
            for (let t = 0; t <= totalSeconds; t += subInterval) {
                const pos = t * zoom;
                const time = Math.round(t * 10) / 10;
                
                if (time % majorInterval === 0) {
                    marks.push({ time, pos, type: 'major', label: this.formatRulerTime(time) });
                } else if (time % minorInterval === 0) {
                    marks.push({ time, pos, type: 'minor' });
                } else {
                    marks.push({ time, pos, type: 'sub' });
                }
            }
            return marks;
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.initTrackHeights();
            this.adjustLayout();
            window.addEventListener('resize', this.adjustLayout);
            document.addEventListener('click', this.handleDocumentClick);
            document.addEventListener('mousemove', this.handleGlobalMouseMove);
            document.addEventListener('mouseup', this.handleGlobalMouseUp);
            document.addEventListener('keydown', this.handleKeydown);
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.adjustLayout);
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);
        document.removeEventListener('keydown', this.handleKeydown);
        Object.values(this.snapFlashTimeouts).forEach(t => clearTimeout(t));
    },
    watch: {
        'vm.tracks': {
            handler() { this.initTrackHeights(); },
            deep: true
        }
    },
    methods: {
        initTrackHeights() {
            this.vm.tracks.forEach(track => {
                if (!this.trackHeights[track.id]) {
                    this.trackHeights[track.id] = 40;
                }
            });
        },
        
        getClipsForTrack(trackId) { 
            return this.vm.clips.filter(c => c.trackId === trackId); 
        },
        
        getClipClasses(clip) {
            const isSelected = this.selectedClipIds.includes(clip.id);
            const isMulti = this.selectedClipIds.length > 1 && isSelected;
            return {
                'selected': isSelected && !isMulti,
                'multi-selected': isMulti,
                'clip-active': clip.isActive
            };
        },
        
        clipStyle(clip, track) {
            const h = this.trackHeights[track.id] || 40;
            return { 
                left: clip.start * this.vm.zoom + 'px', 
                width: Math.max(20, clip.duration * this.vm.zoom) + 'px',
                top: '2px',
                height: (h - 4) + 'px'
            };
        },
        
        getVisibleFrames(clip) {
            if (!clip.frames || !clip.frames.length) return [];
            const clipWidth = clip.duration * this.vm.zoom;
            const frameWidth = this.getFrameWidth(clip);
            const frameCount = Math.max(1, Math.floor(clipWidth / frameWidth));
            const result = [];
            for (let i = 0; i < frameCount; i++) {
                const frameIdx = Math.floor(i * clip.frames.length / frameCount) % clip.frames.length;
                result.push(clip.frames[frameIdx]);
            }
            return result;
        },
        
        getFrameWidth(clip) {
            const trackHeight = this.trackHeights[clip.trackId] || 40;
            const baseWidth = (trackHeight - 4) * 16 / 9;
            return Math.max(20, Math.min(baseWidth, clip.duration * this.vm.zoom / 3));
        },
        
        // 클립 선택 처리
        handleClipClick(e, clip, track) {
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+클릭: 개별 토글 선택
                const idx = this.selectedClipIds.indexOf(clip.id);
                if (idx >= 0) {
                    this.selectedClipIds.splice(idx, 1);
                } else {
                    this.selectedClipIds.push(clip.id);
                }
            } else if (e.shiftKey && this.lastClickedClipId) {
                // Shift+클릭: 범위 선택 (같은 트랙 내)
                const lastClip = this.vm.clips.find(c => c.id === this.lastClickedClipId);
                if (lastClip && lastClip.trackId === clip.trackId) {
                    const trackClips = this.getClipsForTrack(track.id).sort((a, b) => a.start - b.start);
                    const idx1 = trackClips.findIndex(c => c.id === this.lastClickedClipId);
                    const idx2 = trackClips.findIndex(c => c.id === clip.id);
                    const [startIdx, endIdx] = idx1 < idx2 ? [idx1, idx2] : [idx2, idx1];
                    
                    for (let i = startIdx; i <= endIdx; i++) {
                        if (!this.selectedClipIds.includes(trackClips[i].id)) {
                            this.selectedClipIds.push(trackClips[i].id);
                        }
                    }
                } else {
                    this.selectedClipIds = [clip.id];
                }
            } else {
                // 일반 클릭: 단일 선택
                this.selectedClipIds = [clip.id];
            }
            
            this.lastClickedClipId = clip.id;
            this.vm.setSelectedClip(clip);
        },
        
        handleDocumentClick(e) {
            // 컨텍스트 메뉴 닫기
            if (this.trackContextMenu && !e.target.closest('.context-menu')) {
                this.trackContextMenu = null;
            }
            // 타임라인 외부 클릭 시 선택 해제
            if (!e.target.closest('#timeline-lane-container') && !e.target.closest('.clip')) {
                // 선택 유지 (외부 클릭 시에도)
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
            if (p) {
                if (this.vm.isTimelineCollapsed) {
                    p.style.height = 'calc(100% - 32px)';
                } else {
                    p.style.height = '50%';
                }
            }
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
        
        startTrackHeightResize(e, track) {
            this.isResizingTrackHeight = true;
            this.resizingTrack = track;
            this.resizeStartY = e.clientY;
            this.resizeStartHeight = this.trackHeights[track.id] || 40;
        },
        
        formatRulerTime(s) { 
            if (s < 60) return s % 1 === 0 ? s + 's' : s.toFixed(1) + 's';
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return m + ':' + String(Math.floor(sec)).padStart(2, '0');
        },
        
        addTrack() {
            const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
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
            this.trackHeights[newTrack.id] = 40;
        },
        
        deleteTrack(track, idx) {
            if (this.vm.tracks.length <= 1) { 
                this.showToast('warning', '삭제 불가', '최소 1개 트랙 필요');
                return; 
            }
            this.vm.clips = this.vm.clips.filter(c => c.trackId !== track.id);
            this.vm.tracks.splice(idx, 1);
            delete this.trackHeights[track.id];
            this.trackContextMenu = null;
        },
        
        duplicateTrack(track) {
            const idx = this.vm.tracks.findIndex(t => t.id === track.id);
            const newTrack = { ...track, id: `t_${Date.now()}`, name: track.name + ' (복사)', isMain: false };
            this.vm.tracks.splice(idx + 1, 0, newTrack);
            this.trackHeights[newTrack.id] = this.trackHeights[track.id] || 40;
            this.trackContextMenu = null;
        },
        
        setMainTrack(track) { this.vm.tracks.forEach(t => t.isMain = t.id === track.id); },
        
        async changeTrackColor(track) {
            const { value } = await Swal.fire({ 
                title:'트랙 색상', 
                input:'text', 
                inputValue: track.color, 
                showCancelButton: true, 
                background:'#1e1e1e', 
                color:'#fff' 
            });
            if (value) track.color = value;
            this.trackContextMenu = null;
        },
        
        openTrackContextMenu(e, track, idx) { 
            this.trackContextMenu = { x: e.clientX, y: e.clientY, track, index: idx }; 
        },
        
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
            }
            
            this.isDraggingClip = true;
            this.dragStartX = e.clientX;
            
            // 선택된 모든 클립의 원래 위치 저장
            this.draggingClips = this.vm.clips.filter(c => this.selectedClipIds.includes(c.id));
            this.draggingClipOriginalPositions = this.draggingClips.map(c => ({
                id: c.id,
                start: c.start,
                trackId: c.trackId
            }));
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
            const x = e.clientX - rect.left + lane.scrollLeft;
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
        
        // 스냅 플래시 효과 (좌우 끝에만)
        triggerSnapFlash(clipId, side) {
            const clipEl = this.$el.querySelector(`[data-clip-id="${clipId}"]`);
            if (!clipEl) return;
            
            const className = side === 'left' ? 'snap-flash-left' : 'snap-flash-right';
            
            if (this.snapFlashTimeouts[clipId + side]) {
                clearTimeout(this.snapFlashTimeouts[clipId + side]);
                clipEl.classList.remove(className);
                void clipEl.offsetWidth;
            }
            
            clipEl.classList.add(className);
            this.snapFlashTimeouts[clipId + side] = setTimeout(() => {
                clipEl.classList.remove(className);
                delete this.snapFlashTimeouts[clipId + side];
            }, 1000);
        },
        
        checkClipCollision(clip, newStart, trackId) {
            const clipEnd = newStart + clip.duration;
            for (const c of this.vm.clips) {
                if (c.id === clip.id || c.trackId !== trackId) continue;
                const cEnd = c.start + c.duration;
                if (!(clipEnd <= c.start || newStart >= cEnd)) {
                    return c;
                }
            }
            return null;
        },
        
        resolveCollision(clip, newStart, collidingClip) {
            const clipEnd = newStart + clip.duration;
            const colEnd = collidingClip.start + collidingClip.duration;
            const distToLeft = Math.abs(clipEnd - collidingClip.start);
            const distToRight = Math.abs(newStart - colEnd);
            if (distToLeft < distToRight) {
                return collidingClip.start - clip.duration;
            } else {
                return colEnd;
            }
        },
        
        handleGlobalMouseMove(e) {
            // 헤더 폭 조절
            if (this.isResizingHeader) {
                this.trackHeaderWidth = Math.max(80, Math.min(400, this.resizeStartWidth + (e.clientX - this.resizeStartX)));
            }
            
            // 트랙 높이 조절
            if (this.isResizingTrackHeight && this.resizingTrack) {
                const dy = e.clientY - this.resizeStartY;
                const newHeight = Math.max(30, Math.min(200, this.resizeStartHeight + dy));
                this.trackHeights[this.resizingTrack.id] = newHeight;
            }
            
            // 플레이헤드 드래그
            if (this.isDraggingPlayhead) {
                this.updatePlayheadPosition(e);
            }
            
            // 클립 드래그 (복수 선택 지원)
            if (this.isDraggingClip && this.draggingClips.length > 0) {
                const dx = e.clientX - this.dragStartX;
                const dt = dx / this.vm.zoom;
                
                // 트랙 변경 계산 (첫 번째 클립 기준)
                const lane = document.getElementById('timeline-lane-container');
                let targetTrackId = this.draggingClips[0].trackId;
                
                if (lane) {
                    const rect = lane.getBoundingClientRect();
                    const relY = e.clientY - rect.top - 24;
                    let accHeight = 0;
                    for (let i = 0; i < this.vm.tracks.length; i++) {
                        const th = this.trackHeights[this.vm.tracks[i].id] || 40;
                        if (relY < accHeight + th) {
                            const target = this.vm.tracks[i];
                            if (target && !target.isLocked) {
                                targetTrackId = target.id;
                            }
                            break;
                        }
                        accHeight += th;
                    }
                }
                
                // 스냅 처리 (첫 번째 클립 기준)
                this.snapAlignLine = null;
                let snapOffset = 0;
                
                if (this.vm.isMagnet && this.draggingClips.length > 0) {
                    const firstClip = this.draggingClips[0];
                    const origPos = this.draggingClipOriginalPositions.find(p => p.id === firstClip.id);
                    const newStart = origPos.start + dt;
                    const snap = this.findSnapPosition(newStart, firstClip, targetTrackId);
                    
                    if (snap.snapped) {
                        snapOffset = snap.position - newStart;
                        
                        // 스냅 플래시
                        const snapKey = `${snap.snappedToClipId}-${snap.side}`;
                        if (this.lastSnappedInfo !== snapKey) {
                            this.triggerSnapFlash(firstClip.id, snap.side);
                            if (snap.snappedToClipId && snap.snappedToClipId !== 'playhead') {
                                this.triggerSnapFlash(snap.snappedToClipId, snap.side === 'left' ? 'right' : 'left');
                            }
                            this.lastSnappedInfo = snapKey;
                        }
                        
                        if (snap.isCrossTrack) {
                            this.snapAlignLine = snap.alignTime;
                        }
                    } else {
                        this.lastSnappedInfo = null;
                    }
                }
                
                // 모든 선택된 클립 이동
                for (const clip of this.draggingClips) {
                    const origPos = this.draggingClipOriginalPositions.find(p => p.id === clip.id);
                    let newStart = Math.max(0, origPos.start + dt + snapOffset);
                    
                    // 충돌 체크
                    const collision = this.checkClipCollision(clip, newStart, targetTrackId);
                    if (collision) {
                        newStart = this.resolveCollision(clip, newStart, collision);
                    }
                    
                    clip.start = Math.max(0, newStart);
                    clip.trackId = targetTrackId;
                }
            }
            
            // 클립 리사이즈
            if (this.isResizingClip && this.resizingClip) {
                const dx = e.clientX - this.dragStartX;
                const dt = dx / this.vm.zoom;
                
                if (this.resizeDirection === 'left') {
                    let ns = this.resizeStartClipStart + dt;
                    let nd = this.resizeStartClipDuration - dt;
                    if (ns < 0) { nd += ns; ns = 0; }
                    if (nd < 0.5) { nd = 0.5; ns = this.resizeStartClipStart + this.resizeStartClipDuration - 0.5; }
                    
                    const collision = this.checkClipCollision(this.resizingClip, ns, this.resizingClip.trackId);
                    if (!collision) {
                        this.resizingClip.start = ns;
                        this.resizingClip.duration = nd;
                    }
                } else {
                    let nd = this.resizeStartClipDuration + dt;
                    if (nd < 0.5) nd = 0.5;
                    
                    const testClip = { ...this.resizingClip, duration: nd };
                    const collision = this.checkClipCollision(testClip, this.resizingClip.start, this.resizingClip.trackId);
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
            this.draggingClips = [];
            this.draggingClipOriginalPositions = [];
            this.isResizingClip = false;
            this.resizingClip = null;
            this.lastSnappedInfo = null;
            this.snapAlignLine = null;
            this.isResizingTrackHeight = false;
            this.resizingTrack = null;
        },
        
        findSnapPosition(newStart, clip, targetTrackId) {
            const snapDist = 15 / this.vm.zoom;
            const clipEnd = newStart + clip.duration;
            let snapped = false, pos = newStart, snappedToClipId = null, isCrossTrack = false, alignTime = null, side = 'left';
            
            // 플레이헤드 스냅
            if (Math.abs(newStart - this.vm.currentTime) < snapDist) { 
                pos = this.vm.currentTime; snapped = true; snappedToClipId = 'playhead'; side = 'left';
            } else if (Math.abs(clipEnd - this.vm.currentTime) < snapDist) { 
                pos = this.vm.currentTime - clip.duration; snapped = true; snappedToClipId = 'playhead'; side = 'right';
            }
            
            // 다른 클립 스냅
            if (!snapped) {
                for (const c of this.vm.clips) {
                    if (c.id === clip.id) continue;
                    if (this.selectedClipIds.includes(c.id)) continue; // 선택된 클립끼리는 스냅 안함
                    
                    const os = c.start, oe = c.start + c.duration;
                    const isSameTrack = c.trackId === targetTrackId;
                    
                    if (Math.abs(newStart - oe) < snapDist) { 
                        pos = oe; snapped = true; snappedToClipId = c.id;
                        isCrossTrack = !isSameTrack; alignTime = oe; side = 'left';
                        break; 
                    }
                    if (Math.abs(clipEnd - os) < snapDist) { 
                        pos = os - clip.duration; snapped = true; snappedToClipId = c.id;
                        isCrossTrack = !isSameTrack; alignTime = os; side = 'right';
                        break; 
                    }
                    if (Math.abs(newStart - os) < snapDist) { 
                        pos = os; snapped = true; snappedToClipId = c.id;
                        isCrossTrack = !isSameTrack; alignTime = os; side = 'left';
                        break; 
                    }
                    if (Math.abs(clipEnd - oe) < snapDist) { 
                        pos = oe - clip.duration; snapped = true; snappedToClipId = c.id;
                        isCrossTrack = !isSameTrack; alignTime = oe; side = 'right';
                        break; 
                    }
                }
            }
            
            return { snapped, position: pos, snappedToClipId, isCrossTrack, alignTime, side };
        },
        
        // 작은 토스트 표시
        showToast(icon, title, text) {
            Swal.fire({
                icon,
                title,
                text,
                background: '#1e1e1e',
                color: '#fff',
                timer: 1200,
                showConfirmButton: false,
                toast: true,
                position: 'bottom-end'
            });
        },
        
        // 퀵바 기능들
        cutAtPlayhead() { 
            if (this.selectedClipIds.length === 0) {
                this.showToast('info', '클립 선택 필요', '자를 클립을 선택하세요');
                return;
            }
            
            const t = this.vm.currentTime;
            let cutCount = 0;
            
            for (const clipId of [...this.selectedClipIds]) {
                const clip = this.vm.clips.find(c => c.id === clipId);
                if (!clip) continue;
                
                if (t <= clip.start || t >= clip.start + clip.duration) continue;
                
                const newClip = {
                    id: `c_${Date.now()}_${cutCount}`,
                    trackId: clip.trackId,
                    name: clip.name + ' (2)',
                    start: t,
                    duration: clip.start + clip.duration - t,
                    type: clip.type,
                    src: clip.src,
                    frames: clip.frames
                };
                
                clip.duration = t - clip.start;
                this.vm.clips.push(newClip);
                cutCount++;
            }
            
            if (cutCount > 0) {
                this.showToast('success', '분할 완료', `${cutCount}개 클립 분할됨`);
            } else {
                this.showToast('warning', '분할 불가', '플레이헤드가 클립 범위 안에 있어야 합니다');
            }
        },
        
        cutAndDeleteLeft() {
            if (this.selectedClipIds.length === 0) {
                this.showToast('info', '클립 선택 필요', '클립을 선택하세요');
                return;
            }
            
            const t = this.vm.currentTime;
            let modCount = 0;
            
            for (const clipId of this.selectedClipIds) {
                const clip = this.vm.clips.find(c => c.id === clipId);
                if (!clip) continue;
                
                // 플레이헤드가 클립 안에 있는 경우만 처리
                if (t > clip.start && t < clip.start + clip.duration) {
                    const newDuration = clip.start + clip.duration - t;
                    clip.start = t;
                    clip.duration = newDuration;
                    modCount++;
                }
            }
            
            if (modCount > 0) {
                this.showToast('success', '왼쪽 자르기 완료', `${modCount}개 클립 수정됨`);
            } else {
                this.showToast('warning', '자르기 불가', '플레이헤드가 선택된 클립 범위 안에 있어야 합니다');
            }
        },
        
        cutAndDeleteRight() {
            if (this.selectedClipIds.length === 0) {
                this.showToast('info', '클립 선택 필요', '클립을 선택하세요');
                return;
            }
            
            const t = this.vm.currentTime;
            let modCount = 0;
            
            for (const clipId of this.selectedClipIds) {
                const clip = this.vm.clips.find(c => c.id === clipId);
                if (!clip) continue;
                
                // 플레이헤드가 클립 안에 있는 경우만 처리
                if (t > clip.start && t < clip.start + clip.duration) {
                    clip.duration = t - clip.start;
                    modCount++;
                }
            }
            
            if (modCount > 0) {
                this.showToast('success', '오른쪽 자르기 완료', `${modCount}개 클립 수정됨`);
            } else {
                this.showToast('warning', '자르기 불가', '플레이헤드가 선택된 클립 범위 안에 있어야 합니다');
            }
        },
        
        deleteSelectedClips() {
            if (this.selectedClipIds.length === 0) {
                this.showToast('info', '클립 선택 필요', '삭제할 클립을 선택하세요');
                return;
            }
            
            // 잠긴 트랙 체크
            for (const clipId of this.selectedClipIds) {
                const clip = this.vm.clips.find(c => c.id === clipId);
                if (clip) {
                    const track = this.vm.tracks.find(t => t.id === clip.trackId);
                    if (track && track.isLocked) {
                        this.showToast('warning', '잠긴 트랙', '트랙 잠금을 해제하세요');
                        return;
                    }
                }
            }
            
            const count = this.selectedClipIds.length;
            this.vm.clips = this.vm.clips.filter(c => !this.selectedClipIds.includes(c.id));
            this.selectedClipIds = [];
            this.vm.selectedClip = null;
            
            this.showToast('success', '삭제 완료', `${count}개 클립 삭제됨`);
        },
        
        handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; },
        
        handleDrop(e) {
            e.preventDefault();
            let data;
            try { data = JSON.parse(e.dataTransfer.getData('text/wai-asset')); } catch { return; }
            
            const lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            const rect = lane.getBoundingClientRect();
            const x = e.clientX - rect.left + lane.scrollLeft;
            const y = e.clientY - rect.top - 24;
            const time = Math.max(0, x / this.vm.zoom);
            
            let accHeight = 0;
            let trackIdx = 0;
            for (let i = 0; i < this.vm.tracks.length; i++) {
                const th = this.trackHeights[this.vm.tracks[i].id] || 40;
                if (y < accHeight + th) {
                    trackIdx = i;
                    break;
                }
                accHeight += th;
                trackIdx = i;
            }
            
            const track = this.vm.tracks[trackIdx];
            if (!track) return;
            
            const sampleFrames = [];
            for (let i = 0; i < 10; i++) {
                sampleFrames.push(`https://picsum.photos/seed/${data.name || 'clip'}${i}/160/90`);
            }
            
            const newClip = { 
                id: `c_${Date.now()}`, 
                trackId: track.id, 
                name: data.name || 'Clip', 
                start: time, 
                duration: data.duration || 10, 
                type: data.type || 'video', 
                src: data.src || '',
                frames: sampleFrames
            };
            
            const collision = this.checkClipCollision(newClip, time, track.id);
            if (collision) {
                newClip.start = collision.start + collision.duration;
            }
            
            this.vm.clips.push(newClip);
            this.selectedClipIds = [newClip.id];
            this.vm.setSelectedClip(newClip);
            
            this.showToast('success', '클립 추가', `"${data.name}" → ${track.name}`);
        },
        
        handleWheel(e) {
            const sc = document.getElementById('timeline-scroll-container');
            if (!sc) return;
            if (e.shiftKey) {
                this.vm.zoom = Math.max(10, Math.min(200, this.vm.zoom + (e.deltaY > 0 ? -5 : 5)));
            } else {
                sc.scrollLeft += e.deltaY;
            }
        },
        
        handleKeydown(e) {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.togglePlayback();
            }
            if (e.code === 'Delete' && this.selectedClipIds.length > 0) {
                e.preventDefault();
                this.deleteSelectedClips();
            }
            // Ctrl+A 전체 선택
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.selectedClipIds = this.vm.clips.map(c => c.id);
            }
            // Escape 선택 해제
            if (e.code === 'Escape') {
                this.selectedClipIds = [];
                this.vm.selectedClip = null;
            }
        }
    }
};

window.TimelinePanel = TimelinePanel;
