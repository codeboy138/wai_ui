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
