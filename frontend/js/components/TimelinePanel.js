// Timeline Panel Component - Memory Optimized Version
// 긴 영상(30분+) 대응: 썸네일/파형 제한, DOM 최소화

const TimelinePanel = {
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col bg-bg-panel select-none h-full"
            @wheel.prevent="handleWheel"
            @dragover.prevent="onExternalDragOver"
            @dragleave="onExternalDragLeave"
            @drop.prevent="onExternalDrop"
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
                            @change="onAspectChange($event)"
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
                    <button 
                        class="tool-btn text-[10px] px-2"
                        @click="zoomToFit"
                        title="전체 보기"
                    >
                        <i class="fa-solid fa-expand mr-1"></i>전체
                    </button>
                    <button 
                        class="tool-btn text-[10px] px-2"
                        :class="{ 'bg-ui-accent text-white': zoomMode === 'playhead' }"
                        @click="toggleZoomMode"
                        :title="zoomMode === 'cursor' ? '커서 중심 줌' : '플레이헤드 중심 줌'"
                    >
                        <i class="fa-solid fa-crosshairs mr-1"></i>
                        {{ zoomMode === 'cursor' ? '커서' : '헤드' }}
                    </button>
                    <span class="text-[10px] text-text-sub w-12 text-right">{{ zoomDisplayText }}</span>
                    <input type="range" :min="zoomMin" :max="zoomMax" :value="currentDisplayZoom" @input="handleZoomInput($event)" class="w-20 accent-ui-accent h-1" />
                </div>
            </div>
            
            <div v-if="!vm.isTimelineCollapsed" class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-[10px]">
                <div class="flex gap-1 items-center">
                    <button class="tool-btn" @click="undo" title="실행 취소 (Ctrl+Z)" :disabled="!canUndo">
                        <i class="fa-solid fa-rotate-left"></i>
                    </button>
                    <button class="tool-btn" @click="redo" title="다시 실행 (Ctrl+Y)" :disabled="!canRedo">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
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
            
            <div v-if="!vm.isTimelineCollapsed" id="timeline-scroll-container" class="flex-grow overflow-auto timeline-grid relative min-h-0" :style="{ gridTemplateColumns: currentHeaderWidth + 'px 1fr' }" @scroll="onTimelineScroll">
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
                        :style="{ height: (trackHeights[track.id] || defaultTrackHeight) + 'px' }"
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
                        
                        <div class="flex items-center gap-0.5 mr-1 shrink-0" v-show="(trackHeights[track.id] || defaultTrackHeight) >= 30">
                            <button class="track-control-btn" :class="{ 'active': !track.isHidden }" @click.stop="track.isHidden = !track.isHidden" title="가시성">
                                <i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" style="font-size: 8px;"></i>
                            </button>
                            <button class="track-control-btn" :class="{ 'locked': track.isLocked }" @click.stop="track.isLocked = !track.isLocked" title="잠금">
                                <i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" style="font-size: 8px;"></i>
                            </button>
                        </div>
                        <div v-show="!isTrackNamesCollapsed" class="w-1 h-2/3 rounded mr-1 shrink-0" :style="{ backgroundColor: track.color || '#666' }"></div>
                        <input 
                            v-show="!isTrackNamesCollapsed && (trackHeights[track.id] || defaultTrackHeight) >= 24"
                            type="text" 
                            class="text-[10px] truncate flex-1 text-text-main bg-transparent border-none outline-none min-w-0" 
                            :class="{ 'text-text-sub italic': track.name === 'none' }"
                            :value="track.name === 'none' ? '' : track.name" 
                            @input="updateTrackName(track, $event.target.value)" 
                            :disabled="track.isLocked"
                            @mousedown.stop
                            :placeholder="'Track ' + (index + 1)"
                        />
                        <div class="absolute left-0 right-0 bottom-0 h-1 cursor-ns-resize hover:bg-ui-accent/50 z-10" @mousedown.prevent.stop="startTrackResize($event, track)"></div>
                    </div>
                    <div v-show="!isTrackNamesCollapsed" class="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-ui-accent/50" style="right: 0; z-index: 50;" @mousedown.prevent="startHeaderResize"></div>
                </div>

                <div id="timeline-lane-container" class="relative bg-bg-dark min-w-max" @mousedown="handleLaneMouseDown">
                    <div id="timeline-ruler" class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark relative" style="z-index: 20;" :style="{ width: totalTimelineWidth + 'px' }">
                        <template v-for="mark in visibleRulerMarks" :key="'ruler-' + mark.time">
                            <div v-if="mark.isMajor" class="absolute top-0 bottom-0 border-l border-ui-border" :style="{ left: mark.position + 'px' }">
                                <span class="absolute top-0 left-1 text-[9px] text-text-sub whitespace-nowrap">{{ mark.label }}</span>
                            </div>
                            <div v-else-if="mark.isMid" class="absolute bottom-0 h-3 border-l border-ui-border opacity-50" :style="{ left: mark.position + 'px' }"></div>
                            <div v-else class="absolute bottom-0 h-1.5 border-l border-ui-border opacity-30" :style="{ left: mark.position + 'px' }"></div>
                        </template>
                        
                        <div class="playhead-head" :style="{ left: vm.currentTime * pixelsPerSecond + 'px' }" @mousedown.stop.prevent="startPlayheadDrag"></div>
                    </div>
                    
                    <div 
                        v-for="(track, idx) in vm.tracks" 
                        :key="track.id" 
                        :data-track-id="track.id"
                        class="border-b border-ui-border relative track-lane" 
                        :class="{ 'opacity-30': track.isHidden }"
                        :style="{ height: (trackHeights[track.id] || defaultTrackHeight) + 'px' }"
                        @mousedown="onTrackLaneMouseDown($event, track)"
                        @contextmenu.prevent="openClipContextMenu($event, track)"
                    >
                        <!-- 드롭 인디케이터 -->
                        <div 
                            v-if="dropIndicator.visible && dropIndicator.trackId === track.id"
                            class="absolute top-1 bottom-1 bg-ui-accent/30 border-2 border-dashed border-ui-accent rounded pointer-events-none z-20"
                            :style="{ left: dropIndicator.left + 'px', width: dropIndicator.width + 'px' }"
                        ></div>
                        
                        <div 
                            v-for="clip in getVisibleClipsForTrack(track.id)" 
                            :key="clip.id" 
                            :data-clip-id="clip.id" 
                            class="clip absolute rounded-sm cursor-pointer overflow-hidden" 
                            :class="getClipClasses(clip)" 
                            :style="clipStyle(clip, track)" 
                            @mousedown.stop="onClipMouseDown($event, clip, track)"
                            @contextmenu.stop.prevent="openClipContextMenu($event, track, clip)"
                        >
                            <!-- 클립 배경 그라데이션 -->
                            <div class="absolute inset-0" :style="getClipBackgroundStyle(clip, track)"></div>
                            
                            <!-- 레이어 1: 파일명 (최상단 바) -->
                            <div class="clip-title-bar absolute top-0 left-0 right-0 h-4 flex items-center px-1 z-10" 
                                :style="{ backgroundColor: getClipTitleBgColor(track) }">
                                <span class="text-[9px] text-white font-bold truncate drop-shadow">{{ clip.name }}</span>
                                <span class="text-[8px] text-white/70 ml-auto pl-1 whitespace-nowrap">{{ formatClipDuration(clip.duration) }}</span>
                            </div>
                            
                            <!-- 레이어 2: 단순화된 프레임 표시 (썸네일 최대 5개) -->
                            <div v-if="(clip.type === 'video' || clip.type === 'image') && clip.src && isClipVisible(clip)" 
                                class="absolute left-0 right-0 overflow-hidden flex"
                                :style="getFrameAreaStyle(track)">
                                <div v-for="(thumbIdx, ti) in getLimitedThumbnailCount(clip)" :key="'frame_' + ti" 
                                    class="h-full flex-shrink-0 relative border-r border-black/40"
                                    :style="{ width: getLimitedThumbnailWidth(clip) + 'px' }">
                                    <img v-if="clip.type === 'image'" :src="clip.src" class="w-full h-full object-cover" draggable="false" loading="lazy" />
                                    <div v-else class="w-full h-full bg-bg-input flex items-center justify-center">
                                        <i class="fa-solid fa-film text-text-sub/30 text-xs"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 레이어 3: 단순화된 사운드 파형 (SVG 바 최대 40개) -->
                            <div class="absolute left-0 right-0 bottom-0 pointer-events-none"
                                :style="getWaveformAreaStyle(track)">
                                <svg class="w-full h-full" preserveAspectRatio="none" :viewBox="'0 0 100 100'">
                                    <!-- 파형 배경 -->
                                    <rect x="0" y="0" width="100" height="100" :fill="getWaveformBgColor(clip)" />
                                    
                                    <!-- 단순화된 파형 바 (최대 40개) -->
                                    <rect 
                                        v-for="i in getSimplifiedWaveformBars(clip)" 
                                        :key="'wf_'+i"
                                        :x="(i - 1) * (100 / getSimplifiedWaveformBars(clip))"
                                        :y="50 - (15 + Math.sin(i * 0.7) * 12 + (i % 5) * 3)"
                                        :width="Math.max(1, 100 / getSimplifiedWaveformBars(clip) * 0.7)"
                                        :height="30 + Math.sin(i * 0.7) * 24 + (i % 5) * 6"
                                        :fill="getWaveformBarColor(clip)"
                                    />
                                    
                                    <!-- 볼륨 레벨 가로선 -->
                                    <line 
                                        x1="0" 
                                        :y1="100 - (clip.volume || 100) * 0.8" 
                                        x2="100" 
                                        :y2="100 - (clip.volume || 100) * 0.8" 
                                        stroke="#fbbf24" 
                                        stroke-width="2"
                                        stroke-dasharray="4,2"
                                    />
                                </svg>
                            </div>
                            
                            <!-- 리사이즈 핸들 -->
                            <div class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 pointer-events-auto" style="z-index: 15;" @mousedown.stop="startClipResize($event, clip, 'left')"></div>
                            <div class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 pointer-events-auto" style="z-index: 15;" @mousedown.stop="startClipResize($event, clip, 'right')"></div>
                        </div>
                    </div>
                    
                    <div class="playhead-line-body" :style="{ left: vm.currentTime * pixelsPerSecond + 'px' }"></div>
                </div>
            </div>
            
            <!-- 트랙 컨텍스트 메뉴 -->
            <div v-if="trackContextMenu" class="context-menu" :style="{ top: trackContextMenu.y + 'px', left: trackContextMenu.x + 'px' }" @click.stop>
                <div class="ctx-item" @click="setMainTrack(trackContextMenu.track); closeContextMenus()"><i class="fa-solid fa-star w-4"></i><span>메인 트랙 설정</span></div>
                <div class="ctx-item" @click="duplicateTrack(trackContextMenu.track)"><i class="fa-solid fa-copy w-4"></i><span>트랙 복제</span></div>
                <div class="ctx-item" @click="changeTrackColor(trackContextMenu.track)"><i class="fa-solid fa-palette w-4"></i><span>색상 변경</span></div>
                <div class="ctx-item" @click="resetTrackHeight(trackContextMenu.track)"><i class="fa-solid fa-arrows-up-down w-4"></i><span>높이 초기화</span></div>
                <div class="ctx-item" @click="unifyAllTrackHeights"><i class="fa-solid fa-equals w-4"></i><span>전체 트랙 높이 통일</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item" @click="moveTrackUp(trackContextMenu.index)"><i class="fa-solid fa-arrow-up w-4"></i><span>위로 이동 (Z+)</span></div>
                <div class="ctx-item" @click="moveTrackDown(trackContextMenu.index)"><i class="fa-solid fa-arrow-down w-4"></i><span>아래로 이동 (Z-)</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item text-red-400 hover:!bg-ui-danger" @click="deleteTrack(trackContextMenu.track, trackContextMenu.index)"><i class="fa-solid fa-trash w-4"></i><span>삭제</span></div>
            </div>
            
            <!-- 클립 컨텍스트 메뉴 -->
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
                    <div class="ctx-item" @click="showVolumeDialog(clipContextMenu.clip)">
                        <i class="fa-solid fa-volume-high w-4"></i><span>볼륨 조절 ({{ clipContextMenu.clip.volume || 100 }}%)</span>
                    </div>
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
            minTrackHeight: 24,
            defaultTrackHeight: 60,
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
            isTrackNamesCollapsed: false,
            copiedClip: null,
            pendingClickClipId: null,
            pendingClickTime: 0,
            pendingClickModifiers: null,
            isResolutionDropdownOpen: false,
            isExternalDragOver: false,
            resolutionOptions: [
                { value: '4K', label: '4K', pixels: '3840×2160' },
                { value: 'FHD', label: 'FHD', pixels: '1920×1080' },
                { value: 'HD', label: 'HD', pixels: '1280×720' }
            ],
            zoomMode: 'cursor',
            currentDisplayZoom: 20,
            zoomAnimationId: null,
            historyStack: [],
            historyIndex: -1,
            maxHistorySize: 50,
            isUndoRedoAction: false,
            dropIndicator: {
                visible: false,
                trackId: null,
                left: 0,
                width: 0,
                count: 1,
                totalDuration: 0
            },
            basePixelsPerSecond: 20,
            zoomMin: 1,
            zoomMax: 200,
            // 가상화를 위한 스크롤 상태
            scrollLeft: 0,
            viewportWidth: 1000,
            // 썸네일/파형 제한 상수
            MAX_THUMBNAILS_PER_CLIP: 5,
            MAX_WAVEFORM_BARS: 40,
            MAX_RULER_MARKS: 100
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
        pixelsPerSecond() {
            return this.currentDisplayZoom;
        },
        maxClipEnd() {
            let max = 60;
            this.vm.clips.forEach(c => {
                const end = c.start + c.duration;
                if (end > max) max = end;
            });
            return max;
        },
        totalDuration() {
            return Math.max(300, this.maxClipEnd + 60);
        },
        totalTimelineWidth() { 
            return this.totalDuration * this.pixelsPerSecond; 
        },
        currentHeaderWidth() { 
            return this.isTrackNamesCollapsed ? this.collapsedHeaderWidth : this.trackHeaderWidth; 
        },
        zoomDisplayText() {
            if (this.pixelsPerSecond >= 60) {
                return Math.round(this.pixelsPerSecond) + 'px/s';
            } else if (this.pixelsPerSecond >= 1) {
                return this.pixelsPerSecond.toFixed(1) + 'px/s';
            } else {
                return (this.pixelsPerSecond * 60).toFixed(1) + 'px/m';
            }
        },
        // 가시 영역 계산
        visibleTimeRange() {
            const startTime = Math.max(0, this.scrollLeft / this.pixelsPerSecond - 10);
            const endTime = (this.scrollLeft + this.viewportWidth) / this.pixelsPerSecond + 10;
            return { startTime, endTime };
        },
        // 가시 영역 내의 룰러 마크만 반환 (최적화)
        visibleRulerMarks() {
            const marks = [];
            const pps = this.pixelsPerSecond;
            const { startTime, endTime } = this.visibleTimeRange;
            
            let majorInterval, minorInterval, showMinor;
            
            if (pps >= 100) {
                majorInterval = 1;
                minorInterval = 0.5;
                showMinor = true;
            } else if (pps >= 50) {
                majorInterval = 2;
                minorInterval = 1;
                showMinor = true;
            } else if (pps >= 20) {
                majorInterval = 5;
                minorInterval = 1;
                showMinor = false;
            } else if (pps >= 10) {
                majorInterval = 10;
                minorInterval = 5;
                showMinor = true;
            } else if (pps >= 5) {
                majorInterval = 30;
                minorInterval = 10;
                showMinor = false;
            } else if (pps >= 2) {
                majorInterval = 60;
                minorInterval = 30;
                showMinor = true;
            } else if (pps >= 0.5) {
                majorInterval = 300;
                minorInterval = 60;
                showMinor = false;
            } else {
                majorInterval = 600;
                minorInterval = 300;
                showMinor = false;
            }
            
            // 시작 시간을 majorInterval에 맞춤
            const alignedStart = Math.floor(startTime / minorInterval) * minorInterval;
            
            for (let t = alignedStart; t <= endTime && marks.length < this.MAX_RULER_MARKS; t += minorInterval) {
                if (t < 0) continue;
                const time = Math.round(t * 100) / 100;
                const position = time * pps;
                const isMajor = Math.abs(time % majorInterval) < 0.001 || Math.abs(time % majorInterval - majorInterval) < 0.001;
                const isMid = !isMajor && showMinor;
                
                if (isMajor || isMid) {
                    marks.push({ 
                        time, 
                        position, 
                        isMajor, 
                        isMid: isMid && !isMajor, 
                        label: isMajor ? this.formatRulerTime(time) : '' 
                    });
                }
            }
            return marks;
        },
        canUndo() { return this.historyIndex > 0; },
        canRedo() { return this.historyIndex < this.historyStack.length - 1; }
    },
    watch: {
        'vm.clips': { handler() { if (!this.isUndoRedoAction) this.saveToHistory(); }, deep: true },
        'vm.tracks': { handler() { if (!this.isUndoRedoAction) this.saveToHistory(); }, deep: true },
        'vm.zoom': { 
            handler(newVal) { 
                if (newVal && newVal !== this.currentDisplayZoom) {
                    this.currentDisplayZoom = newVal; 
                }
            }, 
            immediate: true 
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.adjustLayout();
            this.injectStyles();
            this.initTrackHeights();
            this.currentDisplayZoom = this.vm.zoom || 20;
            this.saveToHistory();
            this.calculateDynamicZoomRange();
            this.updateViewportSize();
            window.addEventListener('resize', this.onWindowResize);
            document.addEventListener('click', this.onDocumentClick);
            document.addEventListener('mousemove', this.onDocumentMouseMove);
            document.addEventListener('mouseup', this.onDocumentMouseUp);
            document.addEventListener('keydown', this.onDocumentKeyDown);
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.onWindowResize);
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        document.removeEventListener('mouseup', this.onDocumentMouseUp);
        document.removeEventListener('keydown', this.onDocumentKeyDown);
        if (this.zoomAnimationId) cancelAnimationFrame(this.zoomAnimationId);
    },
    methods: {
        injectStyles() {
            if (document.getElementById('timeline-custom-styles')) return;
            const style = document.createElement('style');
            style.id = 'timeline-custom-styles';
            style.textContent = `
                .clip.clip-selected { box-shadow: inset 0 0 0 2px #3b82f6 !important; }
                .clip.clip-multi-selected { box-shadow: inset 0 0 0 2px #f59e0b !important; }
                .clip { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15); }
                .clip:hover { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3); }
                [draggable="true"] { cursor: grab; }
                [draggable="true"]:active { cursor: grabbing; }
                .playhead-line-body { position: absolute; top: 24px; bottom: 0; width: 2px; background: #ef4444; pointer-events: none; z-index: 35; transform: translateX(-1px); }
                .playhead-head { position: absolute; top: 2px; width: 12px; height: 20px; background: transparent; border: 2px solid #ef4444; border-radius: 0 0 4px 4px; transform: translateX(-6px); cursor: ew-resize; z-index: 50; box-sizing: border-box; }
                .playhead-head::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #ef4444; }
                .timeline-select-no-arrow { -webkit-appearance: none; -moz-appearance: none; appearance: none; background-image: none !important; padding-right: 8px !important; }
                .timeline-select-no-arrow::-ms-expand { display: none; }
                #timeline-main-panel { min-height: 0; position: relative; }
                .resolution-dropdown-wrapper { position: relative; }
                .tool-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .clip-title-bar { backdrop-filter: blur(2px); }
            `;
            document.head.appendChild(style);
        },
        
        onWindowResize() {
            this.adjustLayout();
            this.updateViewportSize();
        },
        
        updateViewportSize() {
            const container = document.getElementById('timeline-scroll-container');
            if (container) {
                this.viewportWidth = container.clientWidth;
            }
        },
        
        onTimelineScroll(e) {
            this.scrollLeft = e.target.scrollLeft;
        },
        
        // 클립이 현재 뷰포트에 보이는지 확인
        isClipVisible(clip) {
            const clipStart = clip.start * this.pixelsPerSecond;
            const clipEnd = (clip.start + clip.duration) * this.pixelsPerSecond;
            const viewStart = this.scrollLeft - 100;
            const viewEnd = this.scrollLeft + this.viewportWidth + 100;
            return clipEnd >= viewStart && clipStart <= viewEnd;
        },
        
        // 특정 트랙의 가시 영역 내 클립만 반환
        getVisibleClipsForTrack(trackId) {
            const allClips = this.vm.clips.filter(c => c.trackId === trackId);
            // 가상화: 뷰포트 근처의 클립만 반환
            return allClips.filter(clip => {
                const clipStart = clip.start * this.pixelsPerSecond;
                const clipEnd = (clip.start + clip.duration) * this.pixelsPerSecond;
                const viewStart = this.scrollLeft - 500;
                const viewEnd = this.scrollLeft + this.viewportWidth + 500;
                return clipEnd >= viewStart && clipStart <= viewEnd;
            });
        },
        
        // 썸네일 개수 제한 (최대 5개)
        getLimitedThumbnailCount(clip) {
            const clipWidth = this.getClipPixelWidth(clip);
            const idealCount = Math.ceil(clipWidth / 80);
            return Math.min(idealCount, this.MAX_THUMBNAILS_PER_CLIP);
        },
        
        getLimitedThumbnailWidth(clip) {
            const clipWidth = this.getClipPixelWidth(clip);
            const count = this.getLimitedThumbnailCount(clip);
            return clipWidth / count;
        },
        
        // 파형 바 개수 제한 (최대 40개)
        getSimplifiedWaveformBars(clip) {
            const clipWidth = this.getClipPixelWidth(clip);
            const idealBars = Math.floor(clipWidth / 3);
            return Math.min(Math.max(10, idealBars), this.MAX_WAVEFORM_BARS);
        },
        
        calculateDynamicZoomRange() {
            const container = document.getElementById('timeline-scroll-container');
            if (!container) return;
            
            const availableWidth = container.clientWidth - this.currentHeaderWidth - 40;
            const maxDuration = Math.max(60, this.maxClipEnd + 30);
            
            this.zoomMin = Math.max(0.1, availableWidth / maxDuration / 2);
            this.zoomMax = 200;
            
            if (this.currentDisplayZoom < this.zoomMin) {
                this.currentDisplayZoom = this.zoomMin;
            }
        },
        
        zoomToFit() {
            const container = document.getElementById('timeline-scroll-container');
            if (!container) return;
            
            const availableWidth = container.clientWidth - this.currentHeaderWidth - 40;
            const maxDuration = Math.max(10, this.maxClipEnd + 5);
            
            const fitZoom = availableWidth / maxDuration;
            this.currentDisplayZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, fitZoom));
            this.vm.zoom = this.currentDisplayZoom;
            
            this.$nextTick(() => {
                container.scrollLeft = 0;
                this.scrollLeft = 0;
            });
        },
        
        onAspectChange(e) {
            const value = e.target.value;
            if (this.vm) {
                this.vm.aspectRatio = value;
            }
        },
        
        updateTrackName(track, value) {
            track.name = value.trim() === '' ? 'none' : value;
        },
        
        getVolumeIcon(volume) {
            const v = volume || 100;
            if (v === 0) return 'fa-volume-xmark';
            if (v < 50) return 'fa-volume-low';
            return 'fa-volume-high';
        },
        
        formatClipDuration(duration) {
            if (!duration) return '0:00';
            const h = Math.floor(duration / 3600);
            const m = Math.floor((duration % 3600) / 60);
            const s = Math.floor(duration % 60);
            if (h > 0) {
                return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
            return `${m}:${String(s).padStart(2, '0')}`;
        },
        
        getClipPixelWidth(clip) {
            return Math.max(20, clip.duration * this.pixelsPerSecond);
        },
        
        getClipBackgroundStyle(clip, track) {
            const baseColor = track.color || '#3b82f6';
            return { 
                background: `linear-gradient(180deg, ${baseColor}40 0%, ${baseColor}20 100%)`,
            };
        },
        
        getClipTitleBgColor(track) {
            const baseColor = track.color || '#3b82f6';
            return baseColor + 'cc';
        },
        
        getFrameAreaStyle(track) {
            const trackHeight = this.trackHeights[track.id] || this.defaultTrackHeight;
            const titleHeight = 16;
            const waveformHeight = Math.max(20, Math.floor((trackHeight - titleHeight) * 0.4));
            const frameHeight = trackHeight - titleHeight - waveformHeight;
            
            return {
                top: titleHeight + 'px',
                height: Math.max(0, frameHeight) + 'px'
            };
        },
        
        getWaveformAreaStyle(track) {
            const trackHeight = this.trackHeights[track.id] || this.defaultTrackHeight;
            const waveformHeight = Math.max(20, Math.floor((trackHeight - 16) * 0.4));
            return {
                height: waveformHeight + 'px'
            };
        },
        
        getWaveformBgColor(clip) {
            if (clip.type === 'sound') return 'rgba(34, 197, 94, 0.15)';
            return 'rgba(59, 130, 246, 0.1)';
        },
        
        getWaveformBarColor(clip) {
            if (clip.type === 'sound') return 'rgba(34, 197, 94, 0.8)';
            return 'rgba(59, 130, 246, 0.6)';
        },
        
        saveToHistory() {
            if (this.isUndoRedoAction) return;
            const state = { clips: JSON.parse(JSON.stringify(this.vm.clips)), tracks: JSON.parse(JSON.stringify(this.vm.tracks)) };
            if (this.historyIndex < this.historyStack.length - 1) this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
            this.historyStack.push(state);
            if (this.historyStack.length > this.maxHistorySize) this.historyStack.shift();
            else this.historyIndex++;
        },
        
        undo() {
            if (!this.canUndo) return;
            this.isUndoRedoAction = true;
            this.historyIndex--;
            const state = this.historyStack[this.historyIndex];
            this.vm.clips = JSON.parse(JSON.stringify(state.clips));
            this.vm.tracks = JSON.parse(JSON.stringify(state.tracks));
            this.selectedClipIds = [];
            this.syncVmSelectedClip();
            this.$nextTick(() => { this.isUndoRedoAction = false; });
        },
        
        redo() {
            if (!this.canRedo) return;
            this.isUndoRedoAction = true;
            this.historyIndex++;
            const state = this.historyStack[this.historyIndex];
            this.vm.clips = JSON.parse(JSON.stringify(state.clips));
            this.vm.tracks = JSON.parse(JSON.stringify(state.tracks));
            this.selectedClipIds = [];
            this.syncVmSelectedClip();
            this.$nextTick(() => { this.isUndoRedoAction = false; });
        },
        
        toggleZoomMode() { this.zoomMode = this.zoomMode === 'cursor' ? 'playhead' : 'cursor'; },
        
        handleZoomInput(e) {
            const newZoom = Number(e.target.value);
            this.setZoom(newZoom, this.zoomMode === 'playhead' ? 'playhead' : null);
        },
        
        setZoom(newZoom, centerType = null) {
            const clampedZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, newZoom));
            this.currentDisplayZoom = clampedZoom;
            this.vm.zoom = clampedZoom;
            
            if (centerType === 'playhead') {
                this.$nextTick(() => {
                    const sc = document.getElementById('timeline-scroll-container');
                    if (sc) {
                        const containerWidth = sc.clientWidth - this.currentHeaderWidth;
                        sc.scrollLeft = this.vm.currentTime * this.pixelsPerSecond - containerWidth / 2;
                        this.scrollLeft = sc.scrollLeft;
                    }
                });
            }
        },
        
        getClipTypeIcon(type) {
            const icons = { 'video': 'fa-solid fa-film', 'image': 'fa-solid fa-image', 'sound': 'fa-solid fa-music', 'effect': 'fa-solid fa-wand-magic-sparkles' };
            return icons[type] || 'fa-solid fa-file';
        },
        
        initTrackHeights() { 
            this.vm.tracks.forEach(track => { 
                if (!this.trackHeights[track.id]) this.trackHeights[track.id] = this.defaultTrackHeight; 
            }); 
        },
        toggleAllTrackNames() { this.isTrackNamesCollapsed = !this.isTrackNamesCollapsed; },
        toggleResolutionDropdown() { this.isResolutionDropdownOpen = !this.isResolutionDropdownOpen; },
        selectResolution(value) { 
            if (this.vm) {
                this.vm.resolution = value;
            }
            this.isResolutionDropdownOpen = false; 
        },
        getClipsForTrack(trackId) { return this.vm.clips.filter(c => c.trackId === trackId); },
        getTrackById(trackId) { return this.vm.tracks.find(t => t.id === trackId); },
        
        clipStyle(clip, track) {
            const height = this.trackHeights[track.id] || this.defaultTrackHeight;
            const padding = 1;
            return { 
                left: clip.start * this.pixelsPerSecond + 'px', 
                width: Math.max(20, clip.duration * this.pixelsPerSecond) + 'px', 
                top: padding + 'px', 
                height: (height - padding * 2) + 'px'
            };
        },
        
        getClipClasses(clip) {
            const isSelected = this.selectedClipIds.includes(clip.id);
            const isMulti = this.selectedClipIds.length > 1;
            return { 'clip-selected': isSelected && !isMulti, 'clip-multi-selected': isSelected && isMulti };
        },
        
        selectClip(clipId, modifiers = {}) {
            const clip = this.vm.clips.find(c => c.id === clipId);
            if (!clip) return;
            if (modifiers.ctrlKey || modifiers.metaKey) {
                const idx = this.selectedClipIds.indexOf(clipId);
                if (idx >= 0) this.selectedClipIds.splice(idx, 1);
                else this.selectedClipIds.push(clipId);
                this.lastSelectedClipId = clipId;
                this.lastSelectedTrackId = clip.trackId;
            } else if (modifiers.shiftKey && this.lastSelectedClipId && this.lastSelectedTrackId === clip.trackId) {
                const trackClips = this.getClipsForTrack(clip.trackId).sort((a, b) => a.start - b.start);
                const lastIdx = trackClips.findIndex(c => c.id === this.lastSelectedClipId);
                const curIdx = trackClips.findIndex(c => c.id === clipId);
                if (lastIdx >= 0 && curIdx >= 0) this.selectedClipIds = trackClips.slice(Math.min(lastIdx, curIdx), Math.max(lastIdx, curIdx) + 1).map(c => c.id);
            } else {
                this.selectedClipIds = [clipId];
                this.lastSelectedClipId = clipId;
                this.lastSelectedTrackId = clip.trackId;
            }
            this.syncVmSelectedClip();
        },
        
        clearSelection() { this.selectedClipIds = []; this.lastSelectedClipId = null; this.lastSelectedTrackId = null; this.syncVmSelectedClip(); },
        
        onClipMouseDown(e, clip, track) {
            if (track.isLocked) return;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.pendingClickClipId = clip.id;
            this.pendingClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
            if (!this.selectedClipIds.includes(clip.id) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                this.selectedClipIds = [clip.id];
                this.lastSelectedClipId = clip.id;
                this.lastSelectedTrackId = clip.trackId;
                this.syncVmSelectedClip();
            }
            this.draggingClipIds = [...this.selectedClipIds];
            if (!this.draggingClipIds.includes(clip.id)) this.draggingClipIds = [clip.id];
            this.dragStartPositions = {};
            this.dragStartTrackIds = {};
            this.draggingClipIds.forEach(id => {
                const c = this.vm.clips.find(cl => cl.id === id);
                if (c) { this.dragStartPositions[id] = c.start; this.dragStartTrackIds[id] = c.trackId; }
            });
        },
        
        onTrackLaneMouseDown(e, track) { if (e.target.closest('.clip')) return; this.clearSelection(); },
        syncVmSelectedClip() { this.vm.selectedClip = this.selectedClipIds.length === 1 ? this.vm.clips.find(c => c.id === this.selectedClipIds[0]) || null : null; },
        
        onDocumentClick(e) {
            if (!e.target.closest('.context-menu')) this.closeContextMenus();
            if (!e.target.closest('.resolution-dropdown-wrapper')) this.isResolutionDropdownOpen = false;
        },
        
        onDocumentKeyDown(e) {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); this.undo(); return; }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); this.redo(); return; }
            if (e.key === 'Delete' && this.selectedClipIds.length > 0) this.deleteSelectedClips();
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); this.selectedClipIds = this.vm.clips.map(c => c.id); this.syncVmSelectedClip(); }
            if (e.key === 'Escape') { this.clearSelection(); this.isResolutionDropdownOpen = false; }
            if (e.key === 'Home') { e.preventDefault(); this.zoomToFit(); }
        },
        
        onDocumentMouseMove(e) {
            if (this.isResizingHeader && !this.isTrackNamesCollapsed) this.trackHeaderWidth = Math.max(120, Math.min(400, this.resizeStartWidth + (e.clientX - this.resizeStartX)));
            if (this.isResizingTrack && this.resizingTrackId) this.trackHeights[this.resizingTrackId] = Math.max(this.minTrackHeight, this.resizeStartHeight + (e.clientY - this.resizeStartY));
            if (this.isDraggingPlayhead) this.updatePlayheadPosition(e);
            if (this.pendingClickClipId && !this.isDraggingClip && this.draggingClipIds.length > 0) {
                if (Math.abs(e.clientX - this.dragStartX) > 3 || Math.abs(e.clientY - this.dragStartY) > 3) { this.isDraggingClip = true; this.pendingClickClipId = null; }
            }
            if (this.isDraggingClip && this.draggingClipIds.length > 0) this.handleClipDrag(e);
            if (this.isResizingClip && this.resizingClip) this.handleClipResize(e);
        },
        
        onDocumentMouseUp(e) {
            if (this.pendingClickClipId && !this.isDraggingClip) this.selectClip(this.pendingClickClipId, this.pendingClickModifiers || {});
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
            const dt = dx / this.pixelsPerSecond;
            const lane = document.getElementById('timeline-lane-container');
            let targetTrack = null;
            if (lane) { const rect = lane.getBoundingClientRect(); targetTrack = this.getTrackAtY(e.clientY - rect.top - 24); }
            if (targetTrack && !targetTrack.isLocked) {
                const sourceTrackIds = new Set(Object.values(this.dragStartTrackIds));
                if (sourceTrackIds.size === 1) {
                    const sourceTrackId = [...sourceTrackIds][0];
                    if (targetTrack.id !== sourceTrackId) {
                        let canMove = true;
                        for (const clipId of this.draggingClipIds) {
                            const clip = this.vm.clips.find(c => c.id === clipId);
                            if (!clip) continue;
                            if (this.hasCollision(targetTrack.id, Math.max(0, this.dragStartPositions[clipId] + dt), clip.duration, this.draggingClipIds)) { canMove = false; break; }
                        }
                        if (canMove) this.draggingClipIds.forEach(clipId => { const clip = this.vm.clips.find(c => c.id === clipId); if (clip) clip.trackId = targetTrack.id; });
                    }
                }
            }
            const newPositions = {};
            this.draggingClipIds.forEach(id => {
                const clip = this.vm.clips.find(c => c.id === id);
                if (!clip) return;
                let newStart = Math.max(0, this.dragStartPositions[id] + dt);
                if (this.vm.isMagnet) { const snap = this.findSnapPosition(newStart, clip, this.draggingClipIds); if (snap.snapped) newStart = snap.position; }
                newPositions[id] = Math.max(0, newStart);
            });
            let canMoveAll = true;
            for (const id of this.draggingClipIds) { const clip = this.vm.clips.find(c => c.id === id); if (!clip) continue; if (this.hasCollision(clip.trackId, newPositions[id], clip.duration, this.draggingClipIds)) { canMoveAll = false; break; } }
            if (canMoveAll) this.draggingClipIds.forEach(id => { const clip = this.vm.clips.find(c => c.id === id); if (clip && newPositions[id] !== undefined) clip.start = newPositions[id]; });
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
            const dt = (e.clientX - this.dragStartX) / this.pixelsPerSecond;
            if (this.resizeDirection === 'left') {
                let ns = this.resizeStartClipStart + dt;
                let nd = this.resizeStartClipDuration - dt;
                if (ns < 0) { nd += ns; ns = 0; }
                if (nd < 0.5) { nd = 0.5; ns = this.resizeStartClipStart + this.resizeStartClipDuration - 0.5; }
                if (!this.hasCollision(this.resizingClip.trackId, ns, nd, [this.resizingClip.id])) { this.resizingClip.start = ns; this.resizingClip.duration = nd; }
            } else {
                let nd = this.resizeStartClipDuration + dt;
                if (nd < 0.5) nd = 0.5;
                if (!this.hasCollision(this.resizingClip.trackId, this.resizingClip.start, nd, [this.resizingClip.id])) this.resizingClip.duration = nd;
            }
        },
        
        hasCollision(trackId, start, duration, excludeIds = []) {
            const end = start + duration;
            for (const c of this.vm.clips.filter(c => c.trackId === trackId && !excludeIds.includes(c.id))) { if (start < c.start + c.duration && end > c.start) return true; }
            return false;
        },
        
        findNonCollidingPosition(clip, desiredStart, excludeIds = []) {
            if (!this.hasCollision(clip.trackId, desiredStart, clip.duration, excludeIds)) return desiredStart;
            for (const c of this.vm.clips.filter(c => c.trackId === clip.trackId && !excludeIds.includes(c.id))) {
                if (desiredStart < c.start + c.duration && desiredStart + clip.duration > c.start) return desiredStart < c.start ? Math.max(0, c.start - clip.duration) : c.start + c.duration;
            }
            return desiredStart;
        },
        
        getTrackAtY(relY) {
            let accHeight = 0;
            for (const track of this.vm.tracks) { const h = this.trackHeights[track.id] || this.defaultTrackHeight; if (relY >= accHeight && relY < accHeight + h) return track; accHeight += h; }
            return null;
        },
        
        findSnapPosition(newStart, clip, excludeIds = []) {
            const snapDist = 10 / this.pixelsPerSecond;
            const clipEnd = newStart + clip.duration;
            if (Math.abs(newStart - this.vm.currentTime) < snapDist) return { snapped: true, position: this.vm.currentTime };
            if (Math.abs(clipEnd - this.vm.currentTime) < snapDist) return { snapped: true, position: this.vm.currentTime - clip.duration };
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
        
        applyRippleDelete(trackId, deletedStart, deletedDuration) {
            if (!this.vm.isAutoRipple) return;
            this.vm.clips.filter(c => c.trackId === trackId && c.start >= deletedStart).sort((a, b) => a.start - b.start).forEach(clip => { clip.start = Math.max(0, clip.start - deletedDuration); });
        },
        
        startTrackDrag(e, track, index) { this.draggingTrackId = track.id; this.draggingTrackIndex = index; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', track.id); },
        handleTrackDragOver(e, track) { if (this.draggingTrackId && this.draggingTrackId !== track.id) this.dragOverTrackId = track.id; },
        handleTrackDragLeave() { this.dragOverTrackId = null; },
        handleTrackDrop(e, targetTrack, targetIndex) {
            if (!this.draggingTrackId || this.draggingTrackId === targetTrack.id) { this.endTrackDrag(); return; }
            const fromIndex = this.draggingTrackIndex;
            if (fromIndex !== targetIndex) { const tracks = [...this.vm.tracks]; const [moved] = tracks.splice(fromIndex, 1); tracks.splice(targetIndex, 0, moved); this.vm.tracks = tracks; }
            this.endTrackDrag();
        },
        endTrackDrag() { this.draggingTrackId = null; this.draggingTrackIndex = null; this.dragOverTrackId = null; },
        
        moveTrackUp(index) { if (index <= 0) return; const tracks = [...this.vm.tracks]; [tracks[index - 1], tracks[index]] = [tracks[index], tracks[index - 1]]; this.vm.tracks = tracks; this.closeContextMenus(); },
        moveTrackDown(index) { if (index >= this.vm.tracks.length - 1) return; const tracks = [...this.vm.tracks]; [tracks[index], tracks[index + 1]] = [tracks[index + 1], tracks[index]]; this.vm.tracks = tracks; this.closeContextMenus(); },
        startTrackResize(e, track) { this.isResizingTrack = true; this.resizingTrackId = track.id; this.resizeStartY = e.clientY; this.resizeStartHeight = this.trackHeights[track.id] || this.defaultTrackHeight; },
        resetTrackHeight(track) { this.trackHeights[track.id] = this.defaultTrackHeight; this.closeContextMenus(); },
        unifyAllTrackHeights() { this.vm.tracks.forEach(track => { this.trackHeights[track.id] = this.defaultTrackHeight; }); this.closeContextMenus(); },
        
        addTrack() {
            const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
            const newTrack = { id: `t_${Date.now()}`, name: 'none', color: colors[this.vm.tracks.length % colors.length], isHidden: false, isLocked: false, isMain: false };
            this.vm.tracks.push(newTrack);
            this.trackHeights[newTrack.id] = this.defaultTrackHeight;
        },
        
        deleteTrack(track, idx) {
            if (this.vm.tracks.length <= 1) { Swal.fire({ icon: 'warning', title: '삭제 불가', text: '최소 1개 트랙 필요', background: '#1e1e1e', color: '#fff' }); return; }
            this.vm.clips = this.vm.clips.filter(c => c.trackId !== track.id);
            delete this.trackHeights[track.id];
            this.vm.tracks.splice(idx, 1);
            this.closeContextMenus();
        },
        
        duplicateTrack(track) {
            const idx = this.vm.tracks.findIndex(t => t.id === track.id);
            const newTrack = { ...track, id: `t_${Date.now()}`, name: track.name === 'none' ? 'none' : track.name + ' (복사)', isMain: false };
            this.vm.tracks.splice(idx + 1, 0, newTrack);
            this.trackHeights[newTrack.id] = this.trackHeights[track.id] || this.defaultTrackHeight;
            this.closeContextMenus();
        },
        
        setMainTrack(track) { this.vm.tracks.forEach(t => t.isMain = false); track.isMain = true; },
        
        async changeTrackColor(track) {
            const { value } = await Swal.fire({ title: '트랙 색상', input: 'text', inputValue: track.color, showCancelButton: true, background: '#1e1e1e', color: '#fff' });
            if (value) track.color = value;
            this.closeContextMenus();
        },
        
        openTrackContextMenu(e, track, idx) { this.clipContextMenu = null; this.trackContextMenu = { x: e.clientX, y: e.clientY, track, index: idx }; },
        openClipContextMenu(e, track, clip = null) { this.trackContextMenu = null; this.clipContextMenu = { x: e.clientX, y: e.clientY, track, clip, time: this.getTimeFromMouseEvent(e) }; },
        getTimeFromMouseEvent(e) { const lane = document.getElementById('timeline-lane-container'); if (!lane) return 0; return Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pixelsPerSecond); },
        closeContextMenus() { this.trackContextMenu = null; this.clipContextMenu = null; },
        
        async showVolumeDialog(clip) {
            const { value } = await Swal.fire({ title: '볼륨 조절', input: 'range', inputValue: clip.volume || 100, inputAttributes: { min: 0, max: 200, step: 1 }, showCancelButton: true, confirmButtonText: '적용', cancelButtonText: '취소', background: '#1e1e1e', color: '#fff',
                didOpen: () => { const input = Swal.getInput(); const label = document.createElement('div'); label.className = 'text-center mt-2 text-lg'; label.id = 'volume-label'; label.textContent = `${clip.volume || 100}%`; input.parentNode.appendChild(label); input.addEventListener('input', () => { document.getElementById('volume-label').textContent = `${input.value}%`; }); }
            });
            if (value !== undefined) clip.volume = parseInt(value);
            this.closeContextMenus();
        },
        
        duplicateClip(clip) {
            const newClip = { ...clip, id: `c_${Date.now()}`, start: clip.start + clip.duration + 0.5 };
            newClip.start = this.findNonCollidingPosition(newClip, newClip.start, []);
            if (typeof this.vm.addClipWithBox === 'function') this.vm.addClipWithBox(newClip);
            else this.vm.clips.push(newClip);
        },
        
        deleteClip(clip) {
            const trackId = clip.trackId;
            const deletedStart = clip.start;
            const deletedDuration = clip.duration;
            this.vm.clips = this.vm.clips.filter(c => c.id !== clip.id);
            this.selectedClipIds = this.selectedClipIds.filter(id => id !== clip.id);
            this.syncVmSelectedClip();
            this.applyRippleDelete(trackId, deletedStart + deletedDuration, deletedDuration);
        },
        
        addClipAtPosition() {
            if (!this.clipContextMenu) return;
            const track = this.clipContextMenu.track;
            const time = this.clipContextMenu.time || 0;
            const newClip = { id: `c_${Date.now()}`, trackId: track.id, name: 'New Clip', start: time, duration: 5, type: 'video', volume: 100 };
            newClip.start = this.findNonCollidingPosition(newClip, time, []);
            if (typeof this.vm.addClipWithBox === 'function') this.vm.addClipWithBox(newClip);
            else this.vm.clips.push(newClip);
        },
        
        pasteClip() {
            if (!this.copiedClip || !this.clipContextMenu) return;
            const newClip = { ...this.copiedClip, id: `c_${Date.now()}`, trackId: this.clipContextMenu.track.id, start: this.clipContextMenu.time || 0 };
            newClip.start = this.findNonCollidingPosition(newClip, newClip.start, []);
            if (typeof this.vm.addClipWithBox === 'function') this.vm.addClipWithBox(newClip);
            else this.vm.clips.push(newClip);
        },
        
        deleteSelectedClips() {
            if (this.selectedClipIds.length === 0) return;
            const deletableIds = this.selectedClipIds.filter(id => { const clip = this.vm.clips.find(c => c.id === id); if (!clip) return false; const track = this.vm.tracks.find(t => t.id === clip.trackId); return !track || !track.isLocked; });
            if (deletableIds.length === 0) { Swal.fire({ icon: 'warning', title: '삭제 불가', text: '잠긴 트랙의 클립입니다', background: '#1e1e1e', color: '#fff' }); return; }
            const clipsToDelete = deletableIds.map(id => this.vm.clips.find(c => c.id === id)).filter(c => c).map(c => ({ ...c }));
            const clipsByTrack = {};
            clipsToDelete.forEach(clip => { if (!clipsByTrack[clip.trackId]) clipsByTrack[clip.trackId] = []; clipsByTrack[clip.trackId].push(clip); });
            this.vm.clips = this.vm.clips.filter(c => !deletableIds.includes(c.id));
            this.selectedClipIds = [];
            this.syncVmSelectedClip();
            if (this.vm.isAutoRipple) Object.keys(clipsByTrack).forEach(trackId => { clipsByTrack[trackId].sort((a, b) => b.start - a.start).forEach(deleted => { this.applyRippleDelete(trackId, deleted.start + deleted.duration, deleted.duration); }); });
        },
        
        cutAtPlayhead() {
            const targetIds = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : [];
            if (targetIds.length === 0) this.vm.clips.forEach(clip => { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) targetIds.push(clip.id); });
            if (targetIds.length === 0) { Swal.fire({ icon: 'info', title: '자르기 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); return; }
            const newClipIds = [];
            targetIds.forEach(clipId => { const clip = this.vm.clips.find(c => c.id === clipId); if (clip && this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { const newClipId = this.performSplitClip(clipId, this.vm.currentTime); if (newClipId) newClipIds.push(newClipId); } });
            if (newClipIds.length > 0) { this.selectedClipIds = [...targetIds.filter(id => this.vm.clips.find(c => c.id === id)), ...newClipIds]; this.syncVmSelectedClip(); }
        },
        
        performSplitClip(clipId, splitTime) {
            const clip = this.vm.clips.find(c => c.id === clipId);
            if (!clip) return null;
            const relTime = splitTime - clip.start;
            if (relTime <= 0 || relTime >= clip.duration) return null;
            const origDur = clip.duration;
            clip.duration = relTime;
            const newClipId = `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const secondPart = { ...clip, id: newClipId, start: splitTime, duration: origDur - relTime };
            if (typeof this.vm.addClipWithBox === 'function') this.vm.addClipWithBox(secondPart);
            else this.vm.clips.push(secondPart);
            return newClipId;
        },
        
        cutAtPlayheadForClip(clip) { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { const newClipId = this.performSplitClip(clip.id, this.vm.currentTime); if (newClipId) { this.selectedClipIds = [clip.id, newClipId]; this.syncVmSelectedClip(); } } },
        
        cutAndDeleteLeftSelected() {
            const targetIds = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : [];
            if (targetIds.length === 0) this.vm.clips.forEach(clip => { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) targetIds.push(clip.id); });
            if (targetIds.length === 0) { Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); return; }
            targetIds.forEach(clipId => { const clip = this.vm.clips.find(c => c.id === clipId); if (clip && this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { const deletedDuration = this.vm.currentTime - clip.start; clip.duration = clip.start + clip.duration - this.vm.currentTime; clip.start = this.vm.currentTime; if (this.vm.isAutoRipple) this.applyRippleDelete(clip.trackId, this.vm.currentTime, deletedDuration); } });
        },
        
        cutAndDeleteRightSelected() {
            const targetIds = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : [];
            if (targetIds.length === 0) this.vm.clips.forEach(clip => { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) targetIds.push(clip.id); });
            if (targetIds.length === 0) { Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); return; }
            targetIds.forEach(clipId => { const clip = this.vm.clips.find(c => c.id === clipId); if (clip && this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { const deletedDuration = clip.start + clip.duration - this.vm.currentTime; clip.duration = this.vm.currentTime - clip.start; if (this.vm.isAutoRipple) this.applyRippleDelete(clip.trackId, this.vm.currentTime + deletedDuration, deletedDuration); } });
        },
        
        cutAndDeleteLeftForClip(clip) { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { const deletedDuration = this.vm.currentTime - clip.start; clip.duration = clip.start + clip.duration - this.vm.currentTime; clip.start = this.vm.currentTime; if (this.vm.isAutoRipple) this.applyRippleDelete(clip.trackId, this.vm.currentTime, deletedDuration); } },
        cutAndDeleteRightForClip(clip) { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { const deletedDuration = clip.start + clip.duration - this.vm.currentTime; clip.duration = this.vm.currentTime - clip.start; if (this.vm.isAutoRipple) this.applyRippleDelete(clip.trackId, this.vm.currentTime + deletedDuration, deletedDuration); } },
        
        handleLaneMouseDown(e) { if (e.target.id === 'timeline-ruler' || e.target.closest('#timeline-ruler')) this.updatePlayheadPosition(e); },
        startPlayheadDrag(e) { this.isDraggingPlayhead = true; this.updatePlayheadPosition(e); },
        updatePlayheadPosition(e) {
            const lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            let time = Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pixelsPerSecond);
            if (this.vm.isMagnet) {
                let snap = null, minDiff = 10 / this.pixelsPerSecond;
                this.vm.clips.forEach(c => { if (Math.abs(time - c.start) < minDiff) { minDiff = Math.abs(time - c.start); snap = c.start; } if (Math.abs(time - (c.start + c.duration)) < minDiff) { minDiff = Math.abs(time - (c.start + c.duration)); snap = c.start + c.duration; } });
                if (snap !== null) time = snap;
            }
            this.vm.currentTime = time;
        },
        
        togglePlayback() { if (typeof this.vm.togglePlayback === 'function') this.vm.togglePlayback(); else this.vm.isPlaying = !this.vm.isPlaying; },
        seekToStart() { if (typeof this.vm.seekToStart === 'function') this.vm.seekToStart(); else this.vm.currentTime = 0; },
        seekToEnd() { let max = 0; this.vm.clips.forEach(c => { if (c.start + c.duration > max) max = c.start + c.duration; }); this.vm.currentTime = max; },
        
        adjustLayout() { 
            const p = document.getElementById('preview-main-container'); 
            if (p) p.style.height = this.vm.isTimelineCollapsed ? 'calc(100% - 32px)' : '50%'; 
            this.calculateDynamicZoomRange();
        },
        toggleCollapse() { this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed; this.$nextTick(() => this.adjustLayout()); },
        startHeaderResize(e) { if (this.isTrackNamesCollapsed) return; this.isResizingHeader = true; this.resizeStartX = e.clientX; this.resizeStartWidth = this.trackHeaderWidth; },
        
        formatRulerTime(s) { 
            if (s >= 3600) {
                const h = Math.floor(s / 3600);
                const m = Math.floor((s % 3600) / 60);
                const sec = Math.floor(s % 60);
                return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
            } else if (s >= 60) {
                const m = Math.floor(s / 60);
                const sec = Math.floor(s % 60);
                return `${m}:${String(sec).padStart(2, '0')}`;
            }
            return s + 's'; 
        },
        
        onExternalDragOver(e) {
            if (e.dataTransfer.types.includes('text/wai-asset')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                this.isExternalDragOver = true;
                this.updateDropIndicator(e);
            }
        },
        
        onExternalDragLeave(e) {
            const rect = e.currentTarget.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                this.isExternalDragOver = false;
                this.dropIndicator.visible = false;
            }
        },
        
        updateDropIndicator(e) {
            const lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            const rect = lane.getBoundingClientRect();
            const targetTrack = this.getTrackAtY(e.clientY - rect.top - 24);
            if (!targetTrack) { this.dropIndicator.visible = false; return; }
            const dropTime = Math.max(0, (e.clientX - rect.left) / this.pixelsPerSecond);
            let assets = [];
            try { const raw = e.dataTransfer.getData('text/wai-asset'); if (raw) { const parsed = JSON.parse(raw); assets = Array.isArray(parsed) ? parsed : [parsed]; } } catch (err) {}
            let totalDuration = 5;
            if (assets.length > 0) totalDuration = assets.reduce((sum, asset) => sum + (this.parseDuration(asset.duration) || 5), 0);
            this.dropIndicator = { visible: true, trackId: targetTrack.id, left: dropTime * this.pixelsPerSecond, width: totalDuration * this.pixelsPerSecond, count: assets.length || 1, totalDuration };
        },
        
        onExternalDrop(e) {
            e.preventDefault();
            this.isExternalDragOver = false;
            this.dropIndicator.visible = false;
            let assetData;
            try { const raw = e.dataTransfer.getData('text/wai-asset'); if (!raw) return; assetData = JSON.parse(raw); } catch (err) { console.error('Failed to parse asset data:', err); return; }
            const assets = Array.isArray(assetData) ? assetData : [assetData];
            if (assets.length === 0) return;
            const lane = document.getElementById('timeline-lane-container');
            let dropTime = this.vm.currentTime;
            let targetTrackId = null;
            if (lane) { const rect = lane.getBoundingClientRect(); dropTime = Math.max(0, (e.clientX - rect.left) / this.pixelsPerSecond); const targetTrack = this.getTrackAtY(e.clientY - rect.top - 24); if (targetTrack) targetTrackId = targetTrack.id; }
            document.dispatchEvent(new CustomEvent('wai-timeline-drop', { detail: { assets, dropTime, targetTrackId }, bubbles: true }));
        },
        
        parseDuration(durationStr) {
            if (!durationStr) return null;
            if (typeof durationStr === 'number') return durationStr;
            const parts = durationStr.split(':');
            if (parts.length === 2) return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
            if (parts.length === 3) return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
            return parseFloat(durationStr) || null;
        },
        
        handleWheel(e) {
            const sc = document.getElementById('timeline-scroll-container');
            if (!sc) return;
            
            if (e.shiftKey || e.ctrlKey) {
                const zoomFactor = this.currentDisplayZoom > 10 ? 0.15 : 0.3;
                const delta = e.deltaY > 0 ? -this.currentDisplayZoom * zoomFactor : this.currentDisplayZoom * zoomFactor;
                const newZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, this.currentDisplayZoom + delta));
                
                if (this.zoomMode === 'playhead') {
                    this.setZoom(newZoom, 'playhead');
                } else {
                    const lane = document.getElementById('timeline-lane-container');
                    if (lane) {
                        const rect = lane.getBoundingClientRect();
                        const cursorX = e.clientX - rect.left;
                        const cursorTime = (sc.scrollLeft + cursorX) / this.pixelsPerSecond;
                        
                        this.currentDisplayZoom = newZoom;
                        this.vm.zoom = newZoom;
                        
                        this.$nextTick(() => {
                            sc.scrollLeft = cursorTime * this.pixelsPerSecond - cursorX;
                            this.scrollLeft = sc.scrollLeft;
                        });
                    } else {
                        this.setZoom(newZoom);
                    }
                }
            } else {
                sc.scrollLeft += e.deltaY;
                this.scrollLeft = sc.scrollLeft;
            }
        }
    }
};

window.TimelinePanel = TimelinePanel;
