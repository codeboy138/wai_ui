// Timeline Panel Component - Enhanced
// 트랙 드래그 순서 변경, Z-Index 연동, 클립-캔버스 연동

const TimelinePanel = {
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col bg-bg-panel select-none h-full"
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
                    <div class="flex items-center gap-2 ml-4 text-[10px]">
                        <select 
                            class="timeline-select-no-arrow bg-bg-input border border-ui-border rounded px-2 py-0.5 text-text-main text-[10px]"
                            :value="vm.aspectRatio"
                            @change="vm.setAspect($event.target.value)"
                        >
                            <option value="16:9">16:9</option>
                            <option value="9:16">9:16</option>
                            <option value="1:1">1:1</option>
                        </select>
                        <div class="relative resolution-dropdown-wrapper">
                            <button 
                                class="timeline-select-no-arrow bg-bg-input border border-ui-border rounded px-2 py-0.5 text-text-main text-[10px] min-w-[40px] text-left"
                                @click="toggleResolutionDropdown"
                            >
                                {{ vm.resolution }}
                            </button>
                            <div 
                                v-if="isResolutionDropdownOpen" 
                                class="absolute top-full left-0 mt-1 bg-bg-panel border border-ui-border rounded shadow-lg z-50 min-w-[140px]"
                            >
                                <div 
                                    v-for="opt in resolutionOptions" 
                                    :key="opt.value"
                                    class="px-3 py-1.5 text-[10px] text-text-main hover:bg-bg-hover cursor-pointer flex justify-between gap-4"
                                    :class="{ 'bg-bg-hover': vm.resolution === opt.value }"
                                    @click="selectResolution(opt.value)"
                                >
                                    <span>{{ opt.label }}</span>
                                    <span class="text-text-sub">{{ opt.pixels }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-text-sub">{{ Math.round(vm.zoom) }}%</span>
                    <input type="range" min="10" max="100" :value="vm.zoom" @input="vm.zoom = Number($event.target.value)" class="w-20 accent-ui-accent h-1" />
                </div>
            </div>
            
            <div v-if="!vm.isTimelineCollapsed" class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-[10px]">
                <div class="flex gap-1 items-center">
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" title="선택 클립: 자르기+왼쪽삭제" @click="cutAndDeleteLeftSelected">
                        <span class="text-red-400 text-[10px] leading-none">&lt;</span>
                        <i class="fa-solid fa-scissors text-[9px]"></i>
                    </button>
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" title="선택 클립: 자르기+오른쪽삭제" @click="cutAndDeleteRightSelected">
                        <i class="fa-solid fa-scissors text-[9px]"></i>
                        <span class="text-red-400 text-[10px] leading-none">&gt;</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn" title="자르기 (플레이헤드 위치에서 분할)" @click="cutAtPlayhead"><i class="fa-solid fa-scissors"></i></button>
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
            
            <div v-if="!vm.isTimelineCollapsed" id="timeline-scroll-container" class="flex-grow overflow-auto timeline-grid relative min-h-0" :style="{ gridTemplateColumns: currentHeaderWidth + 'px 1fr' }">
                <div class="sticky-col bg-bg-panel border-r border-ui-border relative" style="z-index: 30;">
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel sticky top-0" style="z-index: 40;">
                        <span v-show="!isTrackNamesCollapsed">TRACKS</span>
                        <div class="flex items-center gap-1">
                            <button class="w-4 h-4 flex items-center justify-center rounded hover:bg-bg-hover text-[8px]" @click="toggleAllTrackNames" :title="isTrackNamesCollapsed ? '이름 펼치기' : '이름 접기'">
                                <i :class="isTrackNamesCollapsed ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" style="font-size: 8px;"></i>
                            </button>
                        </div>
                    </div>
                    <div 
                        v-for="(track, index) in vm.tracks" 
                        :key="track.id"
                        :data-track-id="track.id"
                        class="border-b border-ui-border flex items-center px-1 group bg-bg-panel relative transition-all duration-150" 
                        :class="{ 'opacity-50': track.isLocked, 'bg-ui-accent/20': dragOverTrackId === track.id && dragOverTrackId !== draggingTrackId }" 
                        :style="{ height: (trackHeights[track.id] || 40) + 'px' }"
                        draggable="true"
                        @dragstart="startTrackDrag($event, track, index)"
                        @dragover.prevent="handleTrackDragOver($event, track, index)"
                        @dragleave="handleTrackDragLeave"
                        @drop.prevent="handleTrackDrop($event, track, index)"
                        @dragend="endTrackDrag"
                        @contextmenu.prevent="openTrackContextMenu($event, track, index)"
                    >
                        <button 
                            class="w-4 h-4 flex items-center justify-center rounded mr-1 shrink-0 hover:bg-bg-hover"
                            :class="track.isMain ? 'text-yellow-400' : 'text-text-sub opacity-30 hover:opacity-100'"
                            @click.stop="setMainTrack(track)" 
                            :title="track.isMain ? '메인 트랙' : '메인 트랙으로 설정'"
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
                        <div v-show="!isTrackNamesCollapsed" class="w-1 h-2/3 rounded mr-1 shrink-0" :style="{ backgroundColor: track.color || '#666' }"></div>
                        <input 
                            v-show="!isTrackNamesCollapsed && (trackHeights[track.id] || 40) >= 24"
                            type="text" 
                            class="text-[10px] truncate flex-1 text-text-main bg-transparent border-none outline-none min-w-0" 
                            :value="track.name" 
                            @input="track.name = $event.target.value" 
                            :disabled="track.isLocked"
                            @mousedown.stop
                        />
                        <div class="absolute left-0 right-0 bottom-0 h-1 cursor-ns-resize hover:bg-ui-accent/50 z-10" @mousedown.prevent.stop="startTrackResize($event, track)"></div>
                    </div>
                    <div v-show="!isTrackNamesCollapsed" class="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-ui-accent/50" style="right: 0; z-index: 50;" @mousedown.prevent="startHeaderResize"></div>
                </div>

                <div id="timeline-lane-container" class="relative bg-bg-dark min-w-max" @mousedown="handleLaneMouseDown" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
                    <div id="timeline-ruler" class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark relative" style="z-index: 20;" :style="{ width: totalTimelineWidth + 'px' }">
                        <template v-for="mark in rulerMarks" :key="'ruler-' + mark.time">
                            <div v-if="mark.isMajor" class="absolute top-0 bottom-0 border-l border-ui-border" :style="{ left: mark.position + 'px' }">
                                <span class="absolute top-0 left-1 text-[9px] text-text-sub">{{ mark.label }}</span>
                            </div>
                            <div v-else-if="mark.isMid" class="absolute bottom-0 h-3 border-l border-ui-border opacity-50" :style="{ left: mark.position + 'px' }"></div>
                            <div v-else class="absolute bottom-0 h-1.5 border-l border-ui-border opacity-30" :style="{ left: mark.position + 'px' }"></div>
                        </template>
                        
                        <div class="playhead-head" :style="{ left: vm.currentTime * vm.zoom + 'px' }" @mousedown.stop.prevent="startPlayheadDrag"></div>
                    </div>
                    
                    <div 
                        v-for="(track, idx) in vm.tracks" 
                        :key="track.id" 
                        :data-track-id="track.id"
                        class="border-b border-ui-border relative track-lane" 
                        :class="{ 'opacity-30': track.isHidden }"
                        :style="{ height: (trackHeights[track.id] || 40) + 'px' }"
                        @mousedown="onTrackLaneMouseDown($event, track)"
                        @contextmenu.prevent="openClipContextMenu($event, track)"
                    >
                        <div 
                            v-for="clip in getClipsForTrack(track.id)" 
                            :key="clip.id" 
                            :data-clip-id="clip.id" 
                            class="clip absolute rounded cursor-pointer overflow-hidden" 
                            :class="getClipClasses(clip)" 
                            :style="clipStyle(clip, track.id)" 
                            @mousedown.stop="onClipMouseDown($event, clip, track)"
                            @contextmenu.stop.prevent="openClipContextMenu($event, track, clip)"
                        >
                            <div class="absolute inset-0 opacity-30" :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"></div>
                            <div v-if="clip.type === 'video' && (trackHeights[track.id] || 40) >= 24" class="absolute inset-0 flex items-center justify-center"><i class="fa-solid fa-film text-white/50"></i></div>
                            <template v-if="track.type === 'audio'">
                                <svg class="waveform" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" stroke="white" fill="transparent" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
                            </template>
                            <div v-show="(trackHeights[track.id] || 40) >= 16" class="text-[9px] px-1 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none">{{ clip.name }}</div>
                            <div class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, 'left')"></div>
                            <div class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, 'right')"></div>
                        </div>
                    </div>
                    
                    <div class="playhead-line-body" :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
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
            
            <div v-if="clipContextMenu" class="context-menu" :style="{ top: clipContextMenu.y + 'px', left: clipContextMenu.x + 'px' }" @click.stop>
                <template v-if="clipContextMenu.clip">
                    <div class="ctx-item" @click="cutAtPlayheadForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>플레이헤드에서 자르기</span></div>
                    <div class="ctx-item" @click="cutAndDeleteLeftForClip(clipContextMenu.clip); closeContextMenus()">
                        <i class="fa-solid fa-scissors w-4"></i><span>자르기 + 왼쪽 삭제</span>
                    </div>
                    <div class="ctx-item" @click="cutAndDeleteRightForClip(clipContextMenu.clip); closeContextMenus()">
                        <i class="fa-solid fa-scissors w-4"></i><span>자르기 + 오른쪽 삭제</span>
                    </div>
                    <div class="h-px bg-ui-border my-1"></div>
                    <div class="ctx-item" @click="duplicateClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-copy w-4"></i><span>클립 복제</span></div>
                    <div class="h-px bg-ui-border my-1"></div>
                    <div class="ctx-item text-red-400 hover:!bg-ui-danger" @click="deleteClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-trash w-4"></i><span>클립 삭제</span></div>
                </template>
                <template v-else>
                    <div class="ctx-item" @click="addClipAtPosition(); closeContextMenus()"><i class="fa-solid fa-plus w-4"></i><span>빈 클립 추가</span></div>
                    <div class="ctx-item" @click="pasteClip(); closeContextMenus()"><i class="fa-solid fa-paste w-4"></i><span>붙여넣기</span></div>
                </template>
            </div>
        </div>
    `,
    data() {
        return {
            trackHeaderWidth: 180,
            collapsedHeaderWidth: 70,
            isResizingHeader: false,
            resizeStartX: 0,
            resizeStartWidth: 0,
            trackContextMenu: null,
            clipContextMenu: null,
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
            lastSelectedTrackId: null,
            isDraggingClip: false,
            draggingClipIds: [],
            dragStartX: 0,
            dragStartY: 0,
            dragStartPositions: {},
            dragStartTrackIds: {},
            isResizingClip: false,
            resizingClip: null,
            resizeDirection: null,
            resizeStartClipStart: 0,
            resizeStartClipDuration: 0,
            isDraggingPlayhead: false,
            totalDuration: 300,
            isTrackNamesCollapsed: false,
            copiedClip: null,
            pendingClickClipId: null,
            pendingClickTime: 0,
            pendingClickModifiers: null,
            isResolutionDropdownOpen: false,
            resolutionOptions: [
                { value: '4K', label: '4K', pixels: '3840×2160' },
                { value: 'FHD', label: 'FHD', pixels: '1920×1080' },
                { value: 'HD', label: 'HD', pixels: '1280×720' }
            ]
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
        currentHeaderWidth() {
            return this.isTrackNamesCollapsed ? this.collapsedHeaderWidth : this.trackHeaderWidth;
        },
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
                if (isMajor || isMid || isMinor) {
                    marks.push({ time, position, isMajor, isMid, label: isMajor ? this.formatRulerTime(time) : '' });
                }
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
            document.addEventListener('click', this.onDocumentClick);
            document.addEventListener('mousemove', this.onDocumentMouseMove);
            document.addEventListener('mouseup', this.onDocumentMouseUp);
            document.addEventListener('keydown', this.onDocumentKeyDown);
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.adjustLayout);
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        document.removeEventListener('mouseup', this.onDocumentMouseUp);
        document.removeEventListener('keydown', this.onDocumentKeyDown);
    },
    methods: {
        injectStyles() {
            if (document.getElementById('timeline-custom-styles')) return;
            const style = document.createElement('style');
            style.id = 'timeline-custom-styles';
            style.textContent = `
                .clip.clip-selected {
                    box-shadow: inset 0 0 0 2px #3b82f6 !important;
                }
                .clip.clip-multi-selected {
                    box-shadow: inset 0 0 0 2px #f59e0b !important;
                }
                .clip {
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
                }
                .clip:hover {
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4);
                }
                [draggable="true"] { cursor: grab; }
                [draggable="true"]:active { cursor: grabbing; }
                .playhead-line-body {
                    position: absolute; top: 24px; bottom: 0; width: 2px;
                    background: #ef4444; pointer-events: none; z-index: 35;
                    transform: translateX(-1px);
                }
                .playhead-head {
                    position: absolute; top: 2px; width: 12px; height: 20px;
                    background: transparent; border: 2px solid #ef4444;
                    border-radius: 0 0 4px 4px; transform: translateX(-6px);
                    cursor: ew-resize; z-index: 50; box-sizing: border-box;
                }
                .playhead-head::after {
                    content: ''; position: absolute; bottom: -6px; left: 50%;
                    transform: translateX(-50%);
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 5px solid #ef4444;
                }
                .timeline-select-no-arrow {
                    -webkit-appearance: none; -moz-appearance: none; appearance: none;
                    background-image: none !important; padding-right: 8px !important;
                }
                .timeline-select-no-arrow::-ms-expand { display: none; }
                #timeline-main-panel {
                    min-height: 0;
                }
                .resolution-dropdown-wrapper {
                    position: relative;
                }
            `;
            document.head.appendChild(style);
        },
        
        initTrackHeights() {
            this.vm.tracks.forEach(track => {
                if (!this.trackHeights[track.id]) {
                    this.trackHeights[track.id] = this.defaultTrackHeight;
                }
            });
        },
        
        toggleAllTrackNames() {
            this.isTrackNamesCollapsed = !this.isTrackNamesCollapsed;
        },
        
        toggleResolutionDropdown() {
            this.isResolutionDropdownOpen = !this.isResolutionDropdownOpen;
        },
        
        selectResolution(value) {
            this.vm.setResolution(value);
            this.isResolutionDropdownOpen = false;
        },
        
        getClipsForTrack(trackId) {
            return this.vm.clips.filter(c => c.trackId === trackId);
        },
        
        clipStyle(clip, trackId) {
            const height = this.trackHeights[trackId] || this.defaultTrackHeight;
            const padding = Math.max(2, Math.min(4, height * 0.1));
            return {
                left: clip.start * this.vm.zoom + 'px',
                width: Math.max(20, clip.duration * this.vm.zoom) + 'px',
                top: padding + 'px',
                height: (height - padding * 2) + 'px'
            };
        },
        
        getClipClasses(clip) {
            const isSelected = this.selectedClipIds.includes(clip.id);
            const isMulti = this.selectedClipIds.length > 1;
            return {
                'clip-selected': isSelected && !isMulti,
                'clip-multi-selected': isSelected && isMulti
            };
        },
        
        selectClip(clipId, modifiers = {}) {
            const clip = this.vm.clips.find(c => c.id === clipId);
            if (!clip) return;
            
            if (modifiers.ctrlKey || modifiers.metaKey) {
                const idx = this.selectedClipIds.indexOf(clipId);
                if (idx >= 0) {
                    this.selectedClipIds.splice(idx, 1);
                } else {
                    this.selectedClipIds.push(clipId);
                }
                this.lastSelectedClipId = clipId;
                this.lastSelectedTrackId = clip.trackId;
            } else if (modifiers.shiftKey && this.lastSelectedClipId && this.lastSelectedTrackId === clip.trackId) {
                const trackClips = this.getClipsForTrack(clip.trackId).sort((a, b) => a.start - b.start);
                const lastIdx = trackClips.findIndex(c => c.id === this.lastSelectedClipId);
                const curIdx = trackClips.findIndex(c => c.id === clipId);
                if (lastIdx >= 0 && curIdx >= 0) {
                    const minIdx = Math.min(lastIdx, curIdx);
                    const maxIdx = Math.max(lastIdx, curIdx);
                    this.selectedClipIds = trackClips.slice(minIdx, maxIdx + 1).map(c => c.id);
                }
            } else {
                if (this.selectedClipIds.length === 1 && this.selectedClipIds[0] === clipId) {
                    this.selectedClipIds = [];
                    this.lastSelectedClipId = null;
                    this.lastSelectedTrackId = null;
                } else {
                    this.selectedClipIds = [clipId];
                    this.lastSelectedClipId = clipId;
                    this.lastSelectedTrackId = clip.trackId;
                }
            }
            
            this.syncVmSelectedClip();
        },
        
        onClipMouseDown(e, clip, track) {
            if (track.isLocked) return;
            
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.pendingClickClipId = clip.id;
            this.pendingClickTime = Date.now();
            this.pendingClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
            
            if (!this.selectedClipIds.includes(clip.id) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                this.selectedClipIds = [clip.id];
                this.lastSelectedClipId = clip.id;
                this.lastSelectedTrackId = clip.trackId;
                this.syncVmSelectedClip();
            }
            
            this.draggingClipIds = [...this.selectedClipIds];
            if (!this.draggingClipIds.includes(clip.id)) {
                this.draggingClipIds = [clip.id];
            }
            this.dragStartPositions = {};
            this.dragStartTrackIds = {};
            this.draggingClipIds.forEach(id => {
                const c = this.vm.clips.find(cl => cl.id === id);
                if (c) {
                    this.dragStartPositions[id] = c.start;
                    this.dragStartTrackIds[id] = c.trackId;
                }
            });
        },
        
        onTrackLaneMouseDown(e, track) {
            if (e.target.closest('.clip')) return;
            this.selectedClipIds = [];
            this.lastSelectedClipId = null;
            this.lastSelectedTrackId = null;
            this.syncVmSelectedClip();
        },
        
        syncVmSelectedClip() {
            if (this.selectedClipIds.length === 1) {
                this.vm.selectedClip = this.vm.clips.find(c => c.id === this.selectedClipIds[0]) || null;
            } else {
                this.vm.selectedClip = null;
            }
        },
        
        onDocumentClick(e) {
            if (!e.target.closest('.context-menu')) {
                this.closeContextMenus();
            }
            if (!e.target.closest('.resolution-dropdown-wrapper')) {
                this.isResolutionDropdownOpen = false;
            }
        },
        
        onDocumentKeyDown(e) {
            if (e.key === 'Delete' && this.selectedClipIds.length > 0) {
                this.deleteSelectedClips();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.selectedClipIds = this.vm.clips.map(c => c.id);
                this.syncVmSelectedClip();
            }
            if (e.key === 'Escape') {
                this.selectedClipIds = [];
                this.lastSelectedClipId = null;
                this.lastSelectedTrackId = null;
                this.syncVmSelectedClip();
                this.isResolutionDropdownOpen = false;
            }
        },
        
        onDocumentMouseMove(e) {
            if (this.isResizingHeader && !this.isTrackNamesCollapsed) {
                this.trackHeaderWidth = Math.max(120, Math.min(400, this.resizeStartWidth + (e.clientX - this.resizeStartX)));
            }
            
            if (this.isResizingTrack && this.resizingTrackId) {
                const dy = e.clientY - this.resizeStartY;
                this.trackHeights[this.resizingTrackId] = Math.max(this.minTrackHeight, this.resizeStartHeight + dy);
            }
            
            if (this.isDraggingPlayhead) {
                this.updatePlayheadPosition(e);
            }
            
            if (this.pendingClickClipId && !this.isDraggingClip && this.draggingClipIds.length > 0) {
                const dx = Math.abs(e.clientX - this.dragStartX);
                const dy = Math.abs(e.clientY - this.dragStartY);
                if (dx > 3 || dy > 3) {
                    this.isDraggingClip = true;
                    this.pendingClickClipId = null;
                }
            }
            
            if (this.isDraggingClip && this.draggingClipIds.length > 0) {
                this.handleClipDrag(e);
            }
            
            if (this.isResizingClip && this.resizingClip) {
                this.handleClipResize(e);
            }
        },
        
        onDocumentMouseUp(e) {
            if (this.pendingClickClipId && !this.isDraggingClip) {
                this.selectClip(this.pendingClickClipId, this.pendingClickModifiers || {});
            }
            
            this.pendingClickClipId = null;
            this.pendingClickModifiers = null;
            this.isResizingHeader = false;
            this.isResizingTrack = false;
            this.resizingTrackId = null;
            this.isDraggingPlayhead = false;
            this.isDraggingClip = false;
            this.draggingClipIds = [];
            this.dragStartPositions = {};
            this.dragStartTrackIds = {};
            this.isResizingClip = false;
            this.resizingClip = null;
        },
        
        handleClipDrag(e) {
            const dx = e.clientX - this.dragStartX;
            const dt = dx / this.vm.zoom;
            
            const lane = document.getElementById('timeline-lane-container');
            let targetTrack = null;
            if (lane) {
                const rect = lane.getBoundingClientRect();
                const relY = e.clientY - rect.top - 24;
                targetTrack = this.getTrackAtY(relY);
            }
            
            if (targetTrack && !targetTrack.isLocked) {
                const sourceTrackIds = new Set(Object.values(this.dragStartTrackIds));
                if (sourceTrackIds.size === 1) {
                    const sourceTrackId = [...sourceTrackIds][0];
                    if (targetTrack.id !== sourceTrackId) {
                        let canMove = true;
                        for (const clipId of this.draggingClipIds) {
                            const clip = this.vm.clips.find(c => c.id === clipId);
                            if (!clip) continue;
                            const newStart = Math.max(0, this.dragStartPositions[clipId] + dt);
                            if (this.hasCollision(targetTrack.id, newStart, clip.duration, this.draggingClipIds)) {
                                canMove = false;
                                break;
                            }
                        }
                        if (canMove) {
                            this.draggingClipIds.forEach(clipId => {
                                const clip = this.vm.clips.find(c => c.id === clipId);
                                if (clip) clip.trackId = targetTrack.id;
                            });
                        }
                    }
                }
            }
            
            const newPositions = {};
            this.draggingClipIds.forEach(id => {
                const clip = this.vm.clips.find(c => c.id === id);
                if (!clip) return;
                let newStart = Math.max(0, this.dragStartPositions[id] + dt);
                if (this.vm.isMagnet) {
                    const snap = this.findSnapPosition(newStart, clip, this.draggingClipIds);
                    if (snap.snapped) newStart = snap.position;
                }
                newPositions[id] = Math.max(0, newStart);
            });
            
            let canMoveAll = true;
            for (const id of this.draggingClipIds) {
                const clip = this.vm.clips.find(c => c.id === id);
                if (!clip) continue;
                if (this.hasCollision(clip.trackId, newPositions[id], clip.duration, this.draggingClipIds)) {
                    canMoveAll = false;
                    break;
                }
            }
            
            if (canMoveAll) {
                this.draggingClipIds.forEach(id => {
                    const clip = this.vm.clips.find(c => c.id === id);
                    if (clip && newPositions[id] !== undefined) {
                        clip.start = newPositions[id];
                    }
                });
            }
        },
        
        startClipResize(e, clip, dir) {
            const track = this.vm.tracks.find(t => t.id === clip.trackId);
            if (track && track.isLocked) return;
            e.preventDefault();
            this.isResizingClip = true;
            this.resizingClip = clip;
            this.resizeDirection = dir;
            this.dragStartX = e.clientX;
            this.resizeStartClipStart = clip.start;
            this.resizeStartClipDuration = clip.duration;
        },
        
        handleClipResize(e) {
            const dx = e.clientX - this.dragStartX;
            const dt = dx / this.vm.zoom;
            
            if (this.resizeDirection === 'left') {
                let ns = this.resizeStartClipStart + dt;
                let nd = this.resizeStartClipDuration - dt;
                if (ns < 0) { nd += ns; ns = 0; }
                if (nd < 0.5) { nd = 0.5; ns = this.resizeStartClipStart + this.resizeStartClipDuration - 0.5; }
                if (!this.hasCollision(this.resizingClip.trackId, ns, nd, [this.resizingClip.id])) {
                    this.resizingClip.start = ns;
                    this.resizingClip.duration = nd;
                }
            } else {
                let nd = this.resizeStartClipDuration + dt;
                if (nd < 0.5) nd = 0.5;
                if (!this.hasCollision(this.resizingClip.trackId, this.resizingClip.start, nd, [this.resizingClip.id])) {
                    this.resizingClip.duration = nd;
                }
            }
        },
        
        hasCollision(trackId, start, duration, excludeIds = []) {
            const end = start + duration;
            const trackClips = this.vm.clips.filter(c => c.trackId === trackId && !excludeIds.includes(c.id));
            for (const c of trackClips) {
                const cEnd = c.start + c.duration;
                if (start < cEnd && end > c.start) return true;
            }
            return false;
        },
        
        findNonCollidingPosition(clip, desiredStart, excludeIds = []) {
            if (!this.hasCollision(clip.trackId, desiredStart, clip.duration, excludeIds)) {
                return desiredStart;
            }
            const trackClips = this.vm.clips.filter(c => c.trackId === clip.trackId && !excludeIds.includes(c.id));
            for (const c of trackClips) {
                const cEnd = c.start + c.duration;
                if (desiredStart < cEnd && desiredStart + clip.duration > c.start) {
                    return desiredStart < c.start ? Math.max(0, c.start - clip.duration) : cEnd;
                }
            }
            return desiredStart;
        },
        
        getTrackAtY(relY) {
            let accHeight = 0;
            for (const track of this.vm.tracks) {
                const h = this.trackHeights[track.id] || this.defaultTrackHeight;
                if (relY >= accHeight && relY < accHeight + h) return track;
                accHeight += h;
            }
            return null;
        },
        
        findSnapPosition(newStart, clip, excludeIds = []) {
            const snapDist = 10 / this.vm.zoom;
            const clipEnd = newStart + clip.duration;
            
            if (Math.abs(newStart - this.vm.currentTime) < snapDist) {
                return { snapped: true, position: this.vm.currentTime };
            }
            if (Math.abs(clipEnd - this.vm.currentTime) < snapDist) {
                return { snapped: true, position: this.vm.currentTime - clip.duration };
            }
            
            for (const c of this.vm.clips) {
                if (c.id === clip.id || excludeIds.includes(c.id)) continue;
                const os = c.start, oe = c.start + c.duration;
                if (Math.abs(newStart - oe) < snapDist) return { snapped: true, position: oe };
                if (Math.abs(newStart - os) < snapDist) return { snapped: true, position: os };
                if (Math.abs(clipEnd - os) < snapDist) return { snapped: true, position: os - clip.duration };
                if (Math.abs(clipEnd - oe) < snapDist) return { snapped: true, position: oe - clip.duration };
            }
            return { snapped: false, position: newStart };
        },
        
        startTrackDrag(e, track, index) {
            this.draggingTrackId = track.id;
            this.draggingTrackIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', track.id);
        },
        
        handleTrackDragOver(e, track) {
            if (this.draggingTrackId && this.draggingTrackId !== track.id) {
                this.dragOverTrackId = track.id;
            }
        },
        
        handleTrackDragLeave() {
            this.dragOverTrackId = null;
        },
        
        handleTrackDrop(e, targetTrack, targetIndex) {
            if (!this.draggingTrackId || this.draggingTrackId === targetTrack.id) {
                this.endTrackDrag();
                return;
            }
            const fromIndex = this.draggingTrackIndex;
            if (fromIndex !== targetIndex) {
                const tracks = [...this.vm.tracks];
                const [moved] = tracks.splice(fromIndex, 1);
                tracks.splice(targetIndex, 0, moved);
                this.vm.tracks = tracks;
            }
            this.endTrackDrag();
        },
        
        endTrackDrag() {
            this.draggingTrackId = null;
            this.draggingTrackIndex = null;
            this.dragOverTrackId = null;
        },
        
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
        
        startTrackResize(e, track) {
            this.isResizingTrack = true;
            this.resizingTrackId = track.id;
            this.resizeStartY = e.clientY;
            this.resizeStartHeight = this.trackHeights[track.id] || this.defaultTrackHeight;
        },
        
        resetTrackHeight(track) {
            this.trackHeights[track.id] = this.defaultTrackHeight;
            this.closeContextMenus();
        },
        
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
            this.trackHeights[newTrack.id] = this.defaultTrackHeight;
        },
        
        deleteTrack(track, idx) {
            if (this.vm.tracks.length <= 1) {
                Swal.fire({ icon: 'warning', title: '삭제 불가', text: '최소 1개 트랙 필요', background: '#1e1e1e', color: '#fff' });
                return;
            }
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
        
        setMainTrack(track) {
            this.vm.tracks.forEach(t => t.isMain = false);
            track.isMain = true;
        },
        
        async changeTrackColor(track) {
            const { value } = await Swal.fire({
                title: '트랙 색상',
                input: 'text',
                inputValue: track.color,
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff'
            });
            if (value) track.color = value;
            this.closeContextMenus();
        },
        
        openTrackContextMenu(e, track, idx) {
            this.clipContextMenu = null;
            this.trackContextMenu = { x: e.clientX, y: e.clientY, track, index: idx };
        },
        
        openClipContextMenu(e, track, clip = null) {
            this.trackContextMenu = null;
            this.clipContextMenu = { 
                x: e.clientX, 
                y: e.clientY, 
                track, 
                clip,
                time: this.getTimeFromMouseEvent(e)
            };
        },
        
        getTimeFromMouseEvent(e) {
            const lane = document.getElementById('timeline-lane-container');
            if (!lane) return 0;
            const rect = lane.getBoundingClientRect();
            return Math.max(0, (e.clientX - rect.left) / this.vm.zoom);
        },
        
        closeContextMenus() {
            this.trackContextMenu = null;
            this.clipContextMenu = null;
        },
        
        duplicateClip(clip) {
            const newClip = {
                ...clip,
                id: `c_${Date.now()}`,
                start: clip.start + clip.duration + 0.5
            };
            newClip.start = this.findNonCollidingPosition(newClip, newClip.start, []);
            if (typeof this.vm.addClipWithBox === 'function') {
                this.vm.addClipWithBox(newClip);
            } else {
                this.vm.clips.push(newClip);
            }
        },
        
        deleteClip(clip) {
            this.vm.clips = this.vm.clips.filter(c => c.id !== clip.id);
            this.selectedClipIds = this.selectedClipIds.filter(id => id !== clip.id);
            this.syncVmSelectedClip();
        },
        
        addClipAtPosition() {
            if (!this.clipContextMenu) return;
            const track = this.clipContextMenu.track;
            const time = this.clipContextMenu.time || 0;
            const newClip = {
                id: `c_${Date.now()}`,
                trackId: track.id,
                name: 'New Clip',
                start: time,
                duration: 5,
                type: 'video'
            };
            newClip.start = this.findNonCollidingPosition(newClip, time, []);
            if (typeof this.vm.addClipWithBox === 'function') {
                this.vm.addClipWithBox(newClip);
            } else {
                this.vm.clips.push(newClip);
            }
        },
        
        pasteClip() {
            if (!this.copiedClip || !this.clipContextMenu) return;
            const track = this.clipContextMenu.track;
            const time = this.clipContextMenu.time || 0;
            const newClip = {
                ...this.copiedClip,
                id: `c_${Date.now()}`,
                trackId: track.id,
                start: time
            };
            newClip.start = this.findNonCollidingPosition(newClip, time, []);
            if (typeof this.vm.addClipWithBox === 'function') {
                this.vm.addClipWithBox(newClip);
            } else {
                this.vm.clips.push(newClip);
            }
        },
        
        deleteSelectedClips() {
            if (this.selectedClipIds.length === 0) return;
            const deletableIds = this.selectedClipIds.filter(id => {
                const clip = this.vm.clips.find(c => c.id === id);
                if (!clip) return false;
                const track = this.vm.tracks.find(t => t.id === clip.trackId);
                return !track || !track.isLocked;
            });
            if (deletableIds.length === 0) {
                Swal.fire({ icon: 'warning', title: '삭제 불가', text: '잠긴 트랙의 클립입니다', background: '#1e1e1e', color: '#fff' });
                return;
            }
            this.vm.clips = this.vm.clips.filter(c => !deletableIds.includes(c.id));
            this.selectedClipIds = [];
            this.syncVmSelectedClip();
        },
        
        cutAtPlayhead() {
            const targetIds = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : [];
            
            if (targetIds.length === 0) {
                const t = this.vm.currentTime;
                this.vm.clips.forEach(clip => {
                    if (t > clip.start && t < clip.start + clip.duration) {
                        targetIds.push(clip.id);
                    }
                });
            }
            
            if (targetIds.length === 0) {
                Swal.fire({ icon: 'info', title: '자르기 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false });
                return;
            }
            
            const t = this.vm.currentTime;
            let splitCount = 0;
            const newClipIds = [];
            
            targetIds.forEach(clipId => {
                const clip = this.vm.clips.find(c => c.id === clipId);
                if (!clip) return;
                if (t > clip.start && t < clip.start + clip.duration) {
                    const newClipId = this.performSplitClip(clipId, t);
                    if (newClipId) {
                        newClipIds.push(newClipId);
                        splitCount++;
                    }
                }
            });
            
            if (splitCount === 0) {
                Swal.fire({ icon: 'info', title: '자르기 불가', text: '플레이헤드가 클립 범위 내에 있어야 합니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false });
            } else {
                this.selectedClipIds = [...targetIds.filter(id => this.vm.clips.find(c => c.id === id)), ...newClipIds];
                this.syncVmSelectedClip();
            }
        },
        
        performSplitClip(clipId, splitTime) {
            const clip = this.vm.clips.find(c => c.id === clipId);
            if (!clip) return null;
            const relTime = splitTime - clip.start;
            if (relTime <= 0 || relTime >= clip.duration) return null;
            
            const origDur = clip.duration;
            clip.duration = relTime;
            
            const newClipId = `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const secondPart = {
                ...clip,
                id: newClipId,
                start: splitTime,
                duration: origDur - relTime
            };
            
            if (typeof this.vm.addClipWithBox === 'function') {
                this.vm.addClipWithBox(secondPart);
            } else {
                this.vm.clips.push(secondPart);
            }
            
            return newClipId;
        },
        
        cutAtPlayheadForClip(clip) {
            const t = this.vm.currentTime;
            if (t > clip.start && t < clip.start + clip.duration) {
                const newClipId = this.performSplitClip(clip.id, t);
                if (newClipId) {
                    this.selectedClipIds = [clip.id, newClipId];
                    this.syncVmSelectedClip();
                }
            }
        },
        
        cutAndDeleteLeftSelected() {
            const targetIds = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : [];
            
            if (targetIds.length === 0) {
                const t = this.vm.currentTime;
                this.vm.clips.forEach(clip => {
                    if (t > clip.start && t < clip.start + clip.duration) {
                        targetIds.push(clip.id);
                    }
                });
            }
            
            if (targetIds.length === 0) {
                Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false });
                return;
            }
            
            const t = this.vm.currentTime;
            let count = 0;
            targetIds.forEach(clipId => {
                const clip = this.vm.clips.find(c => c.id === clipId);
                if (!clip) return;
                const clipEnd = clip.start + clip.duration;
                if (t > clip.start && t < clipEnd) {
                    clip.duration = clipEnd - t;
                    clip.start = t;
                    count++;
                }
            });
            
            if (count === 0) {
                Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드가 클립 범위 내에 있어야 합니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false });
            }
        },
        
        cutAndDeleteRightSelected() {
            const targetIds = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : [];
            
            if (targetIds.length === 0) {
                const t = this.vm.currentTime;
                this.vm.clips.forEach(clip => {
                    if (t > clip.start && t < clip.start + clip.duration) {
                        targetIds.push(clip.id);
                    }
                });
            }
            
            if (targetIds.length === 0) {
                Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false });
                return;
            }
            
            const t = this.vm.currentTime;
            let count = 0;
            targetIds.forEach(clipId => {
                const clip = this.vm.clips.find(c => c.id === clipId);
                if (!clip) return;
                const clipEnd = clip.start + clip.duration;
                if (t > clip.start && t < clipEnd) {
                    clip.duration = t - clip.start;
                    count++;
                }
            });
            
            if (count === 0) {
                Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드가 클립 범위 내에 있어야 합니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false });
            }
        },
        
        cutAndDeleteLeftForClip(clip) {
            const t = this.vm.currentTime;
            const clipEnd = clip.start + clip.duration;
            if (t > clip.start && t < clipEnd) {
                clip.duration = clipEnd - t;
                clip.start = t;
            }
        },
        
        cutAndDeleteRightForClip(clip) {
            const t = this.vm.currentTime;
            const clipEnd = clip.start + clip.duration;
            if (t > clip.start && t < clipEnd) {
                clip.duration = t - clip.start;
            }
        },
        
        handleLaneMouseDown(e) {
            const isRuler = e.target.id === 'timeline-ruler' || e.target.closest('#timeline-ruler');
            if (isRuler) this.updatePlayheadPosition(e);
        },
        
        startPlayheadDrag(e) {
            this.isDraggingPlayhead = true;
            this.updatePlayheadPosition(e);
        },
        
        updatePlayheadPosition(e) {
            const lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            const rect = lane.getBoundingClientRect();
            let time = Math.max(0, (e.clientX - rect.left) / this.vm.zoom);
            if (this.vm.isMagnet) {
                let snap = null, minDiff = 10 / this.vm.zoom;
                this.vm.clips.forEach(c => {
                    if (Math.abs(time - c.start) < minDiff) { minDiff = Math.abs(time - c.start); snap = c.start; }
                    if (Math.abs(time - (c.start + c.duration)) < minDiff) { minDiff = Math.abs(time - (c.start + c.duration)); snap = c.start + c.duration; }
                });
                if (snap !== null) time = snap;
            }
            this.vm.currentTime = time;
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
        
        adjustLayout() {
            const p = document.getElementById('preview-main-container');
            if (p) p.style.height = this.vm.isTimelineCollapsed ? 'calc(100% - 32px)' : '50%';
        },
        
        toggleCollapse() {
            this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed;
            this.$nextTick(() => this.adjustLayout());
        },
        
        startHeaderResize(e) {
            if (this.isTrackNamesCollapsed) return;
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
            const time = Math.max(0, (e.clientX - rect.left) / this.vm.zoom);
            const relY = e.clientY - rect.top - 24;
            let targetTrack = this.getTrackAtY(relY) || this.vm.tracks[this.vm.tracks.length - 1];
            if (!targetTrack) return;
            
            const newClip = {
                id: `c_${Date.now()}`,
                trackId: targetTrack.id,
                name: data.name || 'Clip',
                start: time,
                duration: data.duration || 10,
                type: data.type || 'video',
                src: data.src || data.url || '',
                isActive: false
            };
            newClip.start = this.findNonCollidingPosition(newClip, time, []);
            if (typeof this.vm.addClipWithBox === 'function') this.vm.addClipWithBox(newClip);
            else this.vm.clips.push(newClip);
            
            this.selectedClipIds = [newClip.id];
            this.syncVmSelectedClip();
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
작업 2/2: main.css 수정
수정대상파일: C:\wai-ui\frontend\css\main.css

수정 내용: 타임라인 패널 높이 관련 스타일 추가

Copy### [WAI:UPDATE:css/main.css]
/* WAI-UI Main Stylesheet */
/* 다크 테마 기반 + Tailwind 보조 */

/* ================================
   CSS 변수 (다크 테마)
   ================================ */
:root {
    --color-bg-dark: #0a0a0a;
    --color-bg-panel: #141414;
    --color-bg-hover: #1e1e1e;
    --color-bg-input: #252525;
    --color-ui-border: #333333;
    --color-ui-accent: #3b82f6;
    --color-ui-selected: #2563eb;
    --color-ui-danger: #dc2626;
    --color-text-main: #e5e5e5;
    --color-text-sub: #888888;
    --color-text-disabled: #555555;
}

/* ================================
   기본 리셋 및 전역 스타일
   ================================ */
*, *::before, *::after {
    box-sizing: border-box;
}

html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: 'Pretendard', 'Noto Sans KR', system-ui, -apple-system, sans-serif;
    background-color: var(--color-bg-dark);
    color: var(--color-text-main);
    font-size: 14px;
    line-height: 1.5;
}

#app-vue-root {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* ================================
   스크롤바 스타일
   ================================ */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--color-bg-dark);
}

::-webkit-scrollbar-thumb {
    background: var(--color-ui-border);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #444;
}

/* ================================
   Tailwind 확장 색상 클래스
   ================================ */
.bg-bg-dark { background-color: var(--color-bg-dark); }
.bg-bg-panel { background-color: var(--color-bg-panel); }
.bg-bg-hover { background-color: var(--color-bg-hover); }
.bg-bg-input { background-color: var(--color-bg-input); }
.bg-ui-accent { background-color: var(--color-ui-accent); }
.bg-ui-selected { background-color: var(--color-ui-selected); }
.bg-ui-danger { background-color: var(--color-ui-danger); }
.border-ui-border { border-color: var(--color-ui-border); }
.border-ui-accent { border-color: var(--color-ui-accent); }
.text-text-main { color: var(--color-text-main); }
.text-text-sub { color: var(--color-text-sub); }
.text-ui-accent { color: var(--color-ui-accent); }

/* ================================
   네비게이션 버튼
   ================================ */
.nav-btn {
    height: 100%;
    padding: 0 12px;
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--color-text-sub);
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: transparent;
    white-space: nowrap;
}

.nav-btn:hover,
.nav-btn.active {
    color: var(--color-text-main);
    background-color: var(--color-bg-hover);
}

/* ================================
   헤더 메뉴 드롭다운 (수정됨)
   ================================ */
.header-menu-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.header-menu-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 160px;
    background: var(--color-bg-panel);
    border: 1px solid var(--color-ui-border);
    border-radius: 6px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    padding: 4px 0;
    margin-top: 0;
}

.header-menu-wrapper.open > .header-menu-dropdown {
    display: block;
}

.header-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 14px;
    cursor: pointer;
    transition: background-color 0.1s;
    font-size: 12px;
    color: var(--color-text-main);
}

.header-menu-item:hover {
    background-color: var(--color-bg-hover);
}

.header-menu-item i {
    color: var(--color-text-sub);
}

/* 서브메뉴 */
.header-submenu-wrapper {
    position: relative;
}

.header-submenu {
    display: none;
    position: absolute;
    left: 100%;
    top: 0;
    min-width: 140px;
    background: var(--color-bg-panel);
    border: 1px solid var(--color-ui-border);
    border-radius: 6px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    z-index: 1001;
    padding: 4px 0;
    margin-left: 0;
}

.header-submenu-wrapper.open > .header-submenu {
    display: block;
}

.header-submenu-item {
    padding: 8px 14px;
    cursor: pointer;
    font-size: 12px;
    color: var(--color-text-main);
    transition: background-color 0.1s;
}

.header-submenu-item:hover {
    background-color: var(--color-bg-hover);
}

/* 윈도우 컨트롤 버튼 */
.win-btn {
    width: 40px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-sub);
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: transparent;
}

.win-btn:hover {
    color: var(--color-text-main);
    background-color: var(--color-bg-hover);
}

.win-btn.close:hover {
    background-color: var(--color-ui-danger);
    color: white;
}

/* 패널 리사이저 */
.panel-resizer-v {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    z-index: 10;
    transition: background-color 0.15s;
}

.panel-resizer-v:hover {
    background-color: var(--color-ui-accent);
}

.panel-resizer-h {
    height: 4px;
    cursor: row-resize;
    z-index: 10;
    transition: background-color 0.15s;
}

.panel-resizer-h:hover {
    background-color: var(--color-ui-accent);
}

/* ================================
   모달 오버레이 - 드래그 통과 가능
   ================================ */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: none;
}

.modal-overlay > * {
    pointer-events: auto;
}

/* 모달 창 공통 */
.asset-manager-window,
.layer-template-window,
.project-modal-window,
.image-asset-window,
.image-effect-window,
.visualization-window,
.api-manager-window {
    position: relative;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    max-width: 95vw;
}

/* ================================
   모달 리사이즈 핸들
   ================================ */
.modal-resize-handle {
    position: absolute;
    z-index: 100;
}

.modal-resize-handle.resize-n { top: 0; left: 8px; right: 8px; height: 4px; cursor: ns-resize; }
.modal-resize-handle.resize-s { bottom: 0; left: 8px; right: 8px; height: 4px; cursor: ns-resize; }
.modal-resize-handle.resize-e { right: 0; top: 8px; bottom: 8px; width: 4px; cursor: ew-resize; }
.modal-resize-handle.resize-w { left: 0; top: 8px; bottom: 8px; width: 4px; cursor: ew-resize; }
.modal-resize-handle.resize-nw { top: 0; left: 0; width: 12px; height: 12px; cursor: nwse-resize; }
.modal-resize-handle.resize-ne { top: 0; right: 0; width: 12px; height: 12px; cursor: nesw-resize; }
.modal-resize-handle.resize-sw { bottom: 0; left: 0; width: 12px; height: 12px; cursor: nesw-resize; }
.modal-resize-handle.resize-se { bottom: 0; right: 0; width: 12px; height: 12px; cursor: nwse-resize; }

.modal-resize-handle:hover {
    background: rgba(59, 130, 246, 0.3);
}

/* ================================
   자산 그리드 - 반응형
   ================================ */
.asset-grid {
    display: grid;
    gap: 12px;
}

.asset-grid.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}

.asset-grid.view-list {
    grid-template-columns: 1fr;
}

.asset-card {
    background: var(--color-bg-input);
    border: 1px solid var(--color-ui-border);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.15s;
}

.asset-card:hover {
    border-color: var(--color-ui-accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.asset-card.selected {
    border-color: var(--color-ui-accent);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.asset-thumbnail {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
    background: var(--color-bg-dark);
    overflow: hidden;
}

.asset-thumbnail > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.asset-thumbnail video,
.asset-thumbnail img {
    object-fit: cover;
}

.asset-thumbnail-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: var(--color-text-sub);
    opacity: 0.5;
}

/* 썸네일 플레이스홀더 - 아이콘 정중앙 배치 */
.asset-thumbnail-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
}

.asset-thumbnail-placeholder.sound {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
}

/* 썸네일 아이콘 정중앙 스타일 */
.asset-thumbnail-icon-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 28px;
    color: var(--color-text-sub);
    opacity: 0.7;
    z-index: 1;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.asset-info {
    padding: 10px;
}

.asset-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
}

.asset-meta {
    font-size: 10px;
    color: var(--color-text-sub);
}

.asset-grid.view-list .asset-card {
    display: flex;
    align-items: center;
    gap: 12px;
}

.asset-grid.view-list .asset-thumbnail {
    width: 80px;
    padding-top: 45px;
    flex-shrink: 0;
}

.asset-grid.view-list .asset-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
}

.folder-drop-zone.drag-over {
    background: rgba(59, 130, 246, 0.2) !important;
    outline: 2px dashed var(--color-ui-accent);
    outline-offset: -2px;
}

.drag-over {
    background: rgba(59, 130, 246, 0.1);
}

/* ================================
   타임라인 스타일
   ================================ */
.timeline-grid {
    display: grid;
    grid-template-rows: auto 1fr;
}

.sticky-col {
    position: sticky;
    left: 0;
    z-index: 10;
}

.sticky-ruler {
    position: sticky;
    top: 0;
    z-index: 20;
}

.timeline-ruler-major {
    border-color: var(--color-ui-border);
}

.timeline-ruler-minor {
    width: 1px;
    background: var(--color-ui-border);
    opacity: 0.5;
}

.timeline-ruler-sub {
    width: 1px;
    background: var(--color-ui-border);
    opacity: 0.3;
}

/* 플레이헤드 */
.playhead-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ef4444;
    pointer-events: none;
    z-index: 35;
}

.playhead-handle {
    position: absolute;
    top: 0;
    width: 12px;
    height: 20px;
    background: #ef4444;
    border-radius: 0 0 4px 4px;
    transform: translateX(-5px);
    cursor: ew-resize;
    z-index: 36;
}

.playhead-handle::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #ef4444;
}

/* 클립 스타일 */
.clip {
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: box-shadow 0.1s, opacity 0.1s;
}

.clip:hover {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
}

.clip.selected {
    box-shadow: 0 0 0 2px var(--color-ui-accent);
}

.clip.clip-active {
    box-shadow: 0 0 0 2px #22c55e;
}

.clip .waveform {
    position: absolute;
    inset: 0;
    opacity: 0.6;
}

/* 클립 스냅 플래시 효과 */
@keyframes clipSnapFlash {
    0% { box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.8); }
    100% { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2); }
}

.clip.snap-flash {
    animation: clipSnapFlash 0.5s ease-out;
}

/* 트랙 컨트롤 버튼 */
.track-control-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    font-size: 10px;
    color: var(--color-text-sub);
    cursor: pointer;
    transition: all 0.1s;
    border: none;
    background: transparent;
}

.track-control-btn:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-main);
}

.track-control-btn.active {
    color: var(--color-ui-accent);
}

.track-control-btn.locked {
    color: #f59e0b;
}

.track-control-btn.main-track {
    color: #eab308;
}

.track-lane {
    transition: background-color 0.15s;
}

/* 툴 버튼 */
.tool-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 11px;
    color: var(--color-text-sub);
    cursor: pointer;
    transition: all 0.1s;
    border: none;
    background: transparent;
}

.tool-btn:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-main);
}

/* ================================
   컨텍스트 메뉴
   ================================ */
.context-menu {
    position: fixed;
    background: var(--color-bg-panel);
    border: 1px solid var(--color-ui-border);
    border-radius: 6px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    z-index: 9999;
    padding: 4px 0;
    min-width: 160px;
}

.ctx-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    color: var(--color-text-main);
    transition: background-color 0.1s;
}

.ctx-item:hover {
    background: var(--color-bg-hover);
}

.ctx-item i {
    width: 14px;
    text-align: center;
    font-size: 11px;
}

/* ================================
   캔버스 프리뷰
   ================================ */
#preview-canvas-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
}

#preview-canvas-viewport {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

#preview-canvas-scaler {
    position: relative;
    background: #000;
    outline: 2px solid #888;
    outline-offset: 0;
}

#preview-render-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.preview-canvas-overlay {
    position: absolute;
    inset: 0;
    pointer-events: auto;
}

.canvas-box {
    transition: box-shadow 0.1s;
}

.canvas-box:hover {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3) !important;
}

.box-handle {
    transition: background-color 0.1s;
}

.box-handle:hover {
    background-color: var(--color-ui-accent) !important;
}

.canvas-drop-target {
    outline: 3px dashed var(--color-ui-accent);
    outline-offset: -3px;
}

.edge-flash-overlay {
    position: absolute;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 100;
}

.edge-flash-overlay.active {
    opacity: 1;
}

.edge-flash-top { top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to bottom, var(--color-ui-accent), transparent); }
.edge-flash-bottom { bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to top, var(--color-ui-accent), transparent); }
.edge-flash-left { top: 0; bottom: 0; left: 0; width: 3px; background: linear-gradient(to right, var(--color-ui-accent), transparent); }
.edge-flash-right { top: 0; bottom: 0; right: 0; width: 3px; background: linear-gradient(to left, var(--color-ui-accent), transparent); }

/* ================================
   DEV 모드 스타일
   ================================ */
.dev-highlight {
    position: fixed;
    pointer-events: none;
    border: 2px solid #22c55e;
    background: rgba(34, 197, 94, 0.1);
    z-index: 99999;
    transition: all 0.05s;
}

.dev-tooltip {
    position: fixed;
    background: #1a1a2e;
    border: 1px solid #22c55e;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 11px;
    font-family: 'Consolas', 'Monaco', monospace;
    color: #e5e5e5;
    z-index: 100000;
    pointer-events: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    max-width: 300px;
}

.dev-tooltip .label { color: #888; margin-right: 6px; }
.dev-tooltip .value { color: #4ade80; }

body.dev-mode-active .dev-highlight,
body.dev-mode-full .dev-highlight { display: block; }

body:not(.dev-mode-active):not(.dev-mode-full) .dev-highlight { display: none; }

/* ================================
   레이어 패널
   ================================ */
.layer-grid-cell {
    min-height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.1s;
    font-size: 10px;
}

.layer-grid-cell:hover { transform: scale(1.02); }
.layer-grid-cell.empty { border: 1px dashed var(--color-ui-border); opacity: 0.5; }
.layer-grid-cell.empty:hover { opacity: 0.8; border-color: var(--color-ui-accent); }
.layer-grid-cell.filled { border: 1px solid; opacity: 0.9; }
.layer-grid-cell.filled:hover { opacity: 1; }
.layer-grid-cell.selected { box-shadow: 0 0 0 2px var(--color-ui-accent); }

/* ================================
   유틸리티 클래스
   ================================ */
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.no-select { user-select: none; }

.sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* ================================
   애니메이션
   ================================ */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.animate-fadeIn { animation: fadeIn 0.2s ease-out; }
.animate-slideDown { animation: slideDown 0.2s ease-out; }

/* ================================
   반응형 조정
   ================================ */
@media (max-width: 1200px) {
    .asset-grid.view-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
}

@media (max-width: 800px) {
    .asset-grid.view-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
}

/* 드롭다운 z-index 수정 */
#preview-toolbar-panel {
    z-index: 50;
}

#preview-toolbar-panel .wai-dropdown,
.dropdown-menu {
    z-index: 1000;
}

/* ================================
   타임라인 패널 높이 수정
   ================================ */
#timeline-main-panel {
    min-height: 0;
    overflow: hidden;
}

#timeline-scroll-container {
    min-height: 0;
}
