// Timeline Panel Component - Enhanced with Filmstrip & Audio
// 비디오 썸네일, 오디오 파형, 볼륨 컨트롤, 부드러운 트랙 이동

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
                    <!-- 볼륨 컨트롤 -->
                    <div class="volume-slider-container ml-2">
                        <button 
                            class="tool-btn" 
                            :class="{ 'text-red-400': masterVolume === 0 }"
                            @click="toggleMute"
                            :title="'마스터 볼륨: ' + masterVolume + '%'"
                        >
                            <i :class="getVolumeIcon(masterVolume)"></i>
                        </button>
                        <div class="volume-slider-popup">
                            <div class="volume-slider-vertical" @mousedown="startVolumeSlider">
                                <div class="volume-slider-fill" :style="{ height: masterVolume + '%' }"></div>
                                <div class="volume-slider-thumb" :style="{ bottom: masterVolume + '%' }"></div>
                            </div>
                            <span class="volume-slider-value">{{ masterVolume }}%</span>
                        </div>
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
                        class="tool-btn w-6 h-6"
                        @click="zoomToFit"
                        title="전체 보기"
                    >
                        <i class="fa-solid fa-expand"></i>
                    </button>
                    <button 
                        class="tool-btn w-6 h-6"
                        :class="{ 'bg-ui-accent text-white': zoomMode === 'playhead' }"
                        @click="toggleZoomMode"
                        :title="zoomMode === 'cursor' ? '커서 중심 줌' : '플레이헤드 중심 줌'"
                    >
                        <i class="fa-solid fa-crosshairs"></i>
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
                        class="border-b border-ui-border flex items-center px-1 group bg-bg-panel relative" 
                        :class="{ 'opacity-50': track.isLocked, 'bg-ui-accent/20': dragOverTrackId === track.id && dragOverTrackId !== draggingTrackId }" 
                        :style="{ height: getTrackHeight(track.id) + 'px', transition: 'none' }"
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
                        
                        <div class="flex items-center gap-0.5 mr-1 shrink-0" v-show="getTrackHeight(track.id) >= 30">
                            <button class="track-control-btn" :class="{ 'active': !track.isHidden }" @click.stop="track.isHidden = !track.isHidden" title="가시성">
                                <i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" style="font-size: 8px;"></i>
                            </button>
                            <button class="track-control-btn" :class="{ 'locked': track.isLocked }" @click.stop="track.isLocked = !track.isLocked" title="잠금">
                                <i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" style="font-size: 8px;"></i>
                            </button>
                        </div>
                        <div v-show="!isTrackNamesCollapsed" class="w-1 h-2/3 rounded mr-1 shrink-0" :style="{ backgroundColor: track.color || '#666' }"></div>
                        <input 
                            v-show="!isTrackNamesCollapsed && getTrackHeight(track.id) >= 24"
                            type="text" 
                            class="text-[10px] truncate flex-1 text-text-main bg-transparent border-none outline-none min-w-0" 
                            :class="{ 'text-text-sub italic': track.name === 'NONE' }"
                            :value="track.name === 'NONE' ? '' : track.name" 
                            @input="updateTrackName(track, $event.target.value)" 
                            :disabled="track.isLocked"
                            @mousedown.stop
                            :placeholder="'Track ' + (index + 1)"
                        />
                        <div class="absolute left-0 right-0 bottom-0 h-1 cursor-ns-resize hover:bg-ui-accent/50 z-10" @mousedown.prevent.stop="startTrackResize($event, track)"></div>
                    </div>
                    <div v-show="!isTrackNamesCollapsed" class="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-ui-accent/50" style="right: 0; z-index: 50;" @mousedown.prevent="startHeaderResize"></div>
                </div>

                <div id="timeline-lane-container" class="relative min-w-max" @mousedown="handleLaneMouseDown">
                    <div id="timeline-ruler" class="h-6 border-b border-ui-border sticky top-0 relative" :style="{ width: totalTimelineWidth + 'px' }" style="z-index: 20;">
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
                        :style="{ height: getTrackHeight(track.id) + 'px' }"
                        @mousedown="onTrackLaneMouseDown($event, track)"
                        @contextmenu.prevent="openClipContextMenu($event, track)"
                    >
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
                            <!-- 클립 배경 -->
                            <div class="absolute inset-0" :style="getClipBackgroundStyle(clip, track)"></div>
                            
                            <!-- 타이틀 바 -->
                            <div class="clip-title-bar absolute top-0 left-0 right-0 h-4 flex items-center px-1 z-10" 
                                :style="{ backgroundColor: getClipTitleBgColor(track) }">
                                <span class="text-[9px] text-white font-bold truncate drop-shadow">{{ clip.name }}</span>
                                <span class="text-[8px] text-white/70 ml-auto pl-1 whitespace-nowrap">{{ formatClipDuration(clip.duration) }}</span>
                            </div>
                            
                            <!-- 필름스트립 (비디오/이미지) -->
                            <div v-if="(clip.type === 'video' || clip.type === 'image') && isClipVisible(clip)" 
                                class="absolute left-0 right-0 overflow-hidden"
                                :style="getFilmstripAreaStyle(track)">
                                <div class="clip-filmstrip" :style="{ width: getClipPixelWidth(clip) + 'px' }">
                                    <div 
                                        v-for="(frame, fi) in getFilmstripFrames(clip)" 
                                        :key="'frame_' + fi" 
                                        class="clip-filmstrip-frame"
                                        :style="{ 
                                            width: frame.width + 'px',
                                            backgroundImage: frame.thumbnail ? 'url(' + frame.thumbnail + ')' : 'none',
                                            backgroundColor: frame.thumbnail ? 'transparent' : '#1a1a2e'
                                        }"
                                    >
                                        <i v-if="!frame.thumbnail" class="fa-solid fa-film" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: rgba(255,255,255,0.15); font-size: 14px;"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 오디오 파형 -->
                            <div class="absolute left-0 right-0 bottom-0 pointer-events-none"
                                :style="getWaveformAreaStyle(track)">
                                <svg class="clip-waveform-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <rect x="0" y="0" width="100" height="100" :fill="getWaveformBgColor(clip)" />
                                    <rect 
                                        v-for="(bar, bi) in getWaveformBars(clip)" 
                                        :key="'wf_' + bi"
                                        class="clip-waveform-bar"
                                        :x="bar.x"
                                        :y="bar.y"
                                        :width="bar.width"
                                        :height="bar.height"
                                        :fill="getWaveformBarColor(clip)"
                                    />
                                </svg>
                                <!-- 볼륨 라인 -->
                                <div 
                                    class="clip-volume-indicator"
                                    :style="{ bottom: ((clip.volume || 100) / 100 * 100) + '%' }"
                                    @mousedown.stop="startVolumeLineDrag($event, clip)"
                                ></div>
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
                <div class="ctx-item" @click="moveTrackUp(trackContextMenu.index)"><i class="fa-solid fa-arrow-up w-4"></i><span>위로 이동</span></div>
                <div class="ctx-item" @click="moveTrackDown(trackContextMenu.index)"><i class="fa-solid fa-arrow-down w-4"></i><span>아래로 이동</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item text-red-400 hover:!bg-ui-danger" @click="deleteTrack(trackContextMenu.track, trackContextMenu.index)"><i class="fa-solid fa-trash w-4"></i><span>삭제</span></div>
            </div>
            
            <!-- 클립 컨텍스트 메뉴 -->
            <div v-if="clipContextMenu" class="context-menu" :style="{ top: clipContextMenu.y + 'px', left: clipContextMenu.x + 'px' }" @click.stop>
                <template v-if="clipContextMenu.clip">
                    <div class="ctx-item" @click="cutAtPlayheadForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>플레이헤드에서 자르기</span></div>
                    <div class="ctx-item" @click="cutAndDeleteLeftForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>자르기 + 왼쪽 삭제</span></div>
                    <div class="ctx-item" @click="cutAndDeleteRightForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>자르기 + 오른쪽 삭제</span></div>
                    <div class="h-px bg-ui-border my-1"></div>
                    <div class="ctx-item" @click="showVolumeDialog(clipContextMenu.clip)"><i class="fa-solid fa-volume-high w-4"></i><span>볼륨 ({{ clipContextMenu.clip.volume || 100 }}%)</span></div>
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
            historyStack: [],
            historyIndex: -1,
            maxHistorySize: 50,
            isUndoRedoAction: false,
            dropIndicator: { visible: false, trackId: null, left: 0, width: 0 },
            zoomMin: 1,
            zoomMax: 200,
            scrollLeft: 0,
            viewportWidth: 1000,
            MAX_FILMSTRIP_FRAMES: 10,
            MAX_WAVEFORM_BARS: 50,
            MAX_RULER_MARKS: 200,
            // 마스터 볼륨
            masterVolume: 100,
            previousVolume: 100,
            isDraggingVolume: false,
            // 클립 볼륨 드래그
            isDraggingClipVolume: false,
            volumeDragClip: null,
            volumeDragStartY: 0,
            volumeDragStartVolume: 0,
            // 썸네일 캐시
            thumbnailCache: {},
            // 부드러운 트랙 이동
            currentDragTrackIndex: null
        };
    },
// 코드연결지점
// 코드연결지점
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
        pixelsPerSecond() { return this.currentDisplayZoom; },
        maxClipEnd() {
            let max = 60;
            this.vm.clips.forEach(c => { const end = c.start + c.duration; if (end > max) max = end; });
            return max;
        },
        totalDuration() { return Math.max(300, this.maxClipEnd + 60); },
        totalTimelineWidth() { return this.totalDuration * this.pixelsPerSecond; },
        currentHeaderWidth() { return this.isTrackNamesCollapsed ? this.collapsedHeaderWidth : this.trackHeaderWidth; },
        zoomDisplayText() {
            if (this.pixelsPerSecond >= 60) return Math.round(this.pixelsPerSecond) + 'px/s';
            else if (this.pixelsPerSecond >= 1) return this.pixelsPerSecond.toFixed(1) + 'px/s';
            else return (this.pixelsPerSecond * 60).toFixed(1) + 'px/m';
        },
        visibleTimeRange() {
            const startTime = Math.max(0, this.scrollLeft / this.pixelsPerSecond - 10);
            const endTime = (this.scrollLeft + this.viewportWidth) / this.pixelsPerSecond + 10;
            return { startTime, endTime };
        },
        visibleRulerMarks() {
            const marks = [];
            const pps = this.pixelsPerSecond;
            const { startTime, endTime } = this.visibleTimeRange;
            let majorInterval, minorInterval, microInterval;
            if (pps >= 150) { majorInterval = 1; minorInterval = 0.5; microInterval = 0.1; }
            else if (pps >= 100) { majorInterval = 1; minorInterval = 0.5; microInterval = 0.25; }
            else if (pps >= 50) { majorInterval = 2; minorInterval = 1; microInterval = 0.5; }
            else if (pps >= 30) { majorInterval = 5; minorInterval = 1; microInterval = 0.5; }
            else if (pps >= 20) { majorInterval = 5; minorInterval = 1; microInterval = null; }
            else if (pps >= 10) { majorInterval = 10; minorInterval = 5; microInterval = 1; }
            else if (pps >= 5) { majorInterval = 30; minorInterval = 10; microInterval = 5; }
            else if (pps >= 2) { majorInterval = 60; minorInterval = 30; microInterval = 10; }
            else if (pps >= 0.5) { majorInterval = 300; minorInterval = 60; microInterval = 30; }
            else { majorInterval = 600; minorInterval = 300; microInterval = 60; }
            const smallestInterval = microInterval || minorInterval;
            const alignedStart = Math.floor(startTime / smallestInterval) * smallestInterval;
            for (let t = alignedStart; t <= endTime && marks.length < this.MAX_RULER_MARKS; t += smallestInterval) {
                if (t < 0) continue;
                const time = Math.round(t * 1000) / 1000;
                const position = time * pps;
                const isMajor = Math.abs(time % majorInterval) < 0.001 || Math.abs(time % majorInterval - majorInterval) < 0.001;
                const isMid = !isMajor && (Math.abs(time % minorInterval) < 0.001 || Math.abs(time % minorInterval - minorInterval) < 0.001);
                marks.push({ time, position, isMajor, isMid: isMid && !isMajor, label: isMajor ? this.formatRulerTime(time) : '' });
            }
            return marks;
        },
        canUndo() { return this.historyIndex > 0; },
        canRedo() { return this.historyIndex < this.historyStack.length - 1; }
    },
    watch: {
        'vm.clips': { handler() { if (!this.isUndoRedoAction) this.saveToHistory(); }, deep: true },
        'vm.tracks': { handler() { if (!this.isUndoRedoAction) this.saveToHistory(); }, deep: true },
        'vm.zoom': { handler(newVal) { if (newVal && newVal !== this.currentDisplayZoom) this.currentDisplayZoom = newVal; }, immediate: true },
        masterVolume(newVal) { this.applyMasterVolume(newVal); }
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
    },
    methods: {
        getTrackHeight(trackId) { return this.trackHeights[trackId] || this.defaultTrackHeight; },
        injectStyles() {
            if (document.getElementById('timeline-custom-styles')) return;
            const style = document.createElement('style');
            style.id = 'timeline-custom-styles';
            style.textContent = `
                .clip.clip-selected { box-shadow: inset 0 0 0 2px #3b82f6 !important; }
                .clip.clip-multi-selected { box-shadow: inset 0 0 0 2px #f59e0b !important; }
                .clip { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15); }
                .clip:hover { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.3); }
                .playhead-line-body { position: absolute; top: 24px; bottom: 0; width: 2px; background: #ef4444; pointer-events: none; z-index: 35; transform: translateX(-1px); }
                .playhead-head { position: absolute; top: 2px; width: 12px; height: 20px; background: transparent; border: 2px solid #ef4444; border-radius: 0 0 4px 4px; transform: translateX(-6px); cursor: ew-resize; z-index: 50; }
                .playhead-head::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #ef4444; }
                .timeline-select-no-arrow { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
                .tool-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .clip-title-bar { backdrop-filter: blur(2px); }
            `;
            document.head.appendChild(style);
        },
        // 볼륨 관련
        getVolumeIcon(volume) {
            if (volume === 0) return 'fa-solid fa-volume-xmark';
            if (volume < 30) return 'fa-solid fa-volume-off';
            if (volume < 70) return 'fa-solid fa-volume-low';
            return 'fa-solid fa-volume-high';
        },
        toggleMute() {
            if (this.masterVolume > 0) { this.previousVolume = this.masterVolume; this.masterVolume = 0; }
            else { this.masterVolume = this.previousVolume || 100; }
        },
        startVolumeSlider(e) {
            this.isDraggingVolume = true;
            this.updateVolumeFromMouse(e);
        },
        updateVolumeFromMouse(e) {
            const slider = e.target.closest('.volume-slider-vertical');
            if (!slider) return;
            const rect = slider.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const height = rect.height;
            const volume = Math.round(Math.max(0, Math.min(100, (1 - y / height) * 100)));
            this.masterVolume = volume;
        },
        applyMasterVolume(volume) {
            // 모든 비디오/오디오 요소에 볼륨 적용
            document.querySelectorAll('video, audio').forEach(el => {
                el.volume = volume / 100;
            });
        },
        startVolumeLineDrag(e, clip) {
            e.preventDefault();
            this.isDraggingClipVolume = true;
            this.volumeDragClip = clip;
            this.volumeDragStartY = e.clientY;
            this.volumeDragStartVolume = clip.volume || 100;
        },
        // 필름스트립 프레임 생성
        getFilmstripFrames(clip) {
            const clipWidth = this.getClipPixelWidth(clip);
            const frameWidth = Math.max(40, Math.min(80, clipWidth / this.MAX_FILMSTRIP_FRAMES));
            const frameCount = Math.min(this.MAX_FILMSTRIP_FRAMES, Math.ceil(clipWidth / frameWidth));
            const frames = [];
            for (let i = 0; i < frameCount; i++) {
                const w = i === frameCount - 1 ? clipWidth - (frameWidth * i) : frameWidth;
                frames.push({
                    width: w,
                    thumbnail: clip.type === 'image' ? clip.src : this.getVideoThumbnail(clip, i / frameCount)
                });
            }
            return frames;
        },
        getVideoThumbnail(clip, position) {
            if (!clip.src || clip.type !== 'video') return null;
            const cacheKey = `${clip.id}_${Math.floor(position * 10)}`;
            if (this.thumbnailCache[cacheKey]) return this.thumbnailCache[cacheKey];
            // 실제 구현에서는 비디오에서 프레임 캡처
            return null;
        },
        getFilmstripAreaStyle(track) {
            const h = this.getTrackHeight(track.id);
            const titleH = 16;
            const waveH = Math.max(16, Math.floor((h - titleH) * 0.35));
            return { top: titleH + 'px', height: Math.max(0, h - titleH - waveH) + 'px' };
        },
        // 파형 바 생성
        getWaveformBars(clip) {
            const bars = [];
            const barCount = Math.min(this.MAX_WAVEFORM_BARS, Math.max(15, Math.floor(this.getClipPixelWidth(clip) / 4)));
            const barWidth = 100 / barCount * 0.7;
            for (let i = 0; i < barCount; i++) {
                const x = (i / barCount) * 100;
                const amplitude = 15 + Math.sin(i * 0.8 + (clip.id.charCodeAt(0) || 0)) * 12 + (i % 5) * 4;
                const height = amplitude * 2;
                bars.push({ x, y: 50 - amplitude, width: barWidth, height });
            }
            return bars;
        },
        getWaveformAreaStyle(track) {
            const h = this.getTrackHeight(track.id);
            const waveH = Math.max(16, Math.floor((h - 16) * 0.35));
            return { height: waveH + 'px' };
        },
        getWaveformBgColor(clip) { return clip.type === 'sound' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.1)'; },
        getWaveformBarColor(clip) { return clip.type === 'sound' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.6)'; },
        // 기존 메서드들
        onWindowResize() { this.adjustLayout(); this.updateViewportSize(); },
        updateViewportSize() { const c = document.getElementById('timeline-scroll-container'); if (c) this.viewportWidth = c.clientWidth; },
        onTimelineScroll(e) { this.scrollLeft = e.target.scrollLeft; },
        isClipVisible(clip) {
            const s = clip.start * this.pixelsPerSecond, e = (clip.start + clip.duration) * this.pixelsPerSecond;
            return e >= this.scrollLeft - 100 && s <= this.scrollLeft + this.viewportWidth + 100;
        },
        getVisibleClipsForTrack(trackId) {
            return this.vm.clips.filter(c => c.trackId === trackId).filter(clip => {
                const s = clip.start * this.pixelsPerSecond, e = (clip.start + clip.duration) * this.pixelsPerSecond;
                return e >= this.scrollLeft - 500 && s <= this.scrollLeft + this.viewportWidth + 500;
            });
        },
        calculateDynamicZoomRange() {
            const c = document.getElementById('timeline-scroll-container');
            if (!c) return;
            const w = c.clientWidth - this.currentHeaderWidth - 40;
            const maxD = Math.max(60, this.maxClipEnd + 30);
            this.zoomMin = Math.max(0.1, w / maxD / 2);
            if (this.currentDisplayZoom < this.zoomMin) this.currentDisplayZoom = this.zoomMin;
        },
        zoomToFit() {
            const c = document.getElementById('timeline-scroll-container');
            if (!c) return;
            const w = c.clientWidth - this.currentHeaderWidth - 40;
            const maxD = Math.max(10, this.maxClipEnd + 5);
            this.currentDisplayZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, w / maxD));
            this.vm.zoom = this.currentDisplayZoom;
            this.$nextTick(() => { c.scrollLeft = 0; this.scrollLeft = 0; });
        },
        onAspectChange(e) { if (this.vm) this.vm.aspectRatio = e.target.value; },
        updateTrackName(track, value) { track.name = value.trim() === '' ? 'NONE' : value; },
        formatClipDuration(d) {
            if (!d) return '0:00';
            const h = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = Math.floor(d % 60);
            return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
        },
        getClipPixelWidth(clip) { return Math.max(20, clip.duration * this.pixelsPerSecond); },
        getClipBackgroundStyle(clip, track) { return { background: `linear-gradient(180deg, ${track.color || '#3b82f6'}40 0%, ${track.color || '#3b82f6'}20 100%)` }; },
        getClipTitleBgColor(track) { return (track.color || '#3b82f6') + 'cc'; },
        saveToHistory() {
            if (this.isUndoRedoAction) return;
            const state = { clips: JSON.parse(JSON.stringify(this.vm.clips)), tracks: JSON.parse(JSON.stringify(this.vm.tracks)) };
            if (this.historyIndex < this.historyStack.length - 1) this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
            this.historyStack.push(state);
            if (this.historyStack.length > this.maxHistorySize) this.historyStack.shift();
            else this.historyIndex++;
        },
        undo() { if (!this.canUndo) return; this.isUndoRedoAction = true; this.historyIndex--; const s = this.historyStack[this.historyIndex]; this.vm.clips = JSON.parse(JSON.stringify(s.clips)); this.vm.tracks = JSON.parse(JSON.stringify(s.tracks)); this.selectedClipIds = []; this.syncVmSelectedClip(); this.$nextTick(() => { this.isUndoRedoAction = false; }); },
        redo() { if (!this.canRedo) return; this.isUndoRedoAction = true; this.historyIndex++; const s = this.historyStack[this.historyIndex]; this.vm.clips = JSON.parse(JSON.stringify(s.clips)); this.vm.tracks = JSON.parse(JSON.stringify(s.tracks)); this.selectedClipIds = []; this.syncVmSelectedClip(); this.$nextTick(() => { this.isUndoRedoAction = false; }); },
        toggleZoomMode() { this.zoomMode = this.zoomMode === 'cursor' ? 'playhead' : 'cursor'; },
        handleZoomInput(e) { this.setZoom(Number(e.target.value), this.zoomMode === 'playhead' ? 'playhead' : null); },
        setZoom(newZoom, centerType = null) {
            this.currentDisplayZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, newZoom));
            this.vm.zoom = this.currentDisplayZoom;
            if (centerType === 'playhead') {
                this.$nextTick(() => { const sc = document.getElementById('timeline-scroll-container'); if (sc) { sc.scrollLeft = this.vm.currentTime * this.pixelsPerSecond - (sc.clientWidth - this.currentHeaderWidth) / 2; this.scrollLeft = sc.scrollLeft; } });
            }
        },
        initTrackHeights() { this.vm.tracks.forEach(t => { if (!this.trackHeights[t.id]) this.trackHeights[t.id] = this.defaultTrackHeight; }); },
        toggleAllTrackNames() { this.isTrackNamesCollapsed = !this.isTrackNamesCollapsed; },
        toggleResolutionDropdown() { this.isResolutionDropdownOpen = !this.isResolutionDropdownOpen; },
        selectResolution(v) { if (this.vm) this.vm.resolution = v; this.isResolutionDropdownOpen = false; },
        clipStyle(clip, track) { const h = this.getTrackHeight(track.id); return { left: clip.start * this.pixelsPerSecond + 'px', width: Math.max(20, clip.duration * this.pixelsPerSecond) + 'px', top: '1px', height: (h - 2) + 'px' }; },
        getClipClasses(clip) { const sel = this.selectedClipIds.includes(clip.id); return { 'clip-selected': sel && this.selectedClipIds.length === 1, 'clip-multi-selected': sel && this.selectedClipIds.length > 1 }; },
        selectClip(clipId, mod = {}) {
            const clip = this.vm.clips.find(c => c.id === clipId);
            if (!clip) return;
            if (mod.ctrlKey || mod.metaKey) { const idx = this.selectedClipIds.indexOf(clipId); if (idx >= 0) this.selectedClipIds.splice(idx, 1); else this.selectedClipIds.push(clipId); }
            else if (mod.shiftKey && this.lastSelectedClipId && this.lastSelectedTrackId === clip.trackId) {
                const tc = this.vm.clips.filter(c => c.trackId === clip.trackId).sort((a, b) => a.start - b.start);
                const li = tc.findIndex(c => c.id === this.lastSelectedClipId), ci = tc.findIndex(c => c.id === clipId);
                if (li >= 0 && ci >= 0) this.selectedClipIds = tc.slice(Math.min(li, ci), Math.max(li, ci) + 1).map(c => c.id);
            } else { this.selectedClipIds = [clipId]; }
            this.lastSelectedClipId = clipId; this.lastSelectedTrackId = clip.trackId;
            this.syncVmSelectedClip();
        },
        clearSelection() { this.selectedClipIds = []; this.lastSelectedClipId = null; this.lastSelectedTrackId = null; this.syncVmSelectedClip(); },
        onClipMouseDown(e, clip, track) {
            if (track.isLocked) return;
            this.dragStartX = e.clientX; this.dragStartY = e.clientY;
            this.pendingClickClipId = clip.id;
            this.pendingClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
            this.currentDragTrackIndex = this.vm.tracks.findIndex(t => t.id === track.id);
            if (!this.selectedClipIds.includes(clip.id) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                this.selectedClipIds = [clip.id]; this.lastSelectedClipId = clip.id; this.lastSelectedTrackId = clip.trackId; this.syncVmSelectedClip();
            }
            this.draggingClipIds = [...this.selectedClipIds];
            if (!this.draggingClipIds.includes(clip.id)) this.draggingClipIds = [clip.id];
            this.dragStartPositions = {}; this.dragStartTrackIds = {};
            this.draggingClipIds.forEach(id => { const c = this.vm.clips.find(cl => cl.id === id); if (c) { this.dragStartPositions[id] = c.start; this.dragStartTrackIds[id] = c.trackId; } });
        },
        onTrackLaneMouseDown(e, track) { if (!e.target.closest('.clip')) this.clearSelection(); },
        syncVmSelectedClip() { this.vm.selectedClip = this.selectedClipIds.length === 1 ? this.vm.clips.find(c => c.id === this.selectedClipIds[0]) || null : null; },
        onDocumentClick(e) { if (!e.target.closest('.context-menu')) this.closeContextMenus(); if (!e.target.closest('.resolution-dropdown-wrapper')) this.isResolutionDropdownOpen = false; },
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
            if (this.isResizingTrack && this.resizingTrackId) { this.trackHeights[this.resizingTrackId] = Math.max(this.minTrackHeight, this.resizeStartHeight + (e.clientY - this.resizeStartY)); this.trackHeights = { ...this.trackHeights }; }
            if (this.isDraggingPlayhead) this.updatePlayheadPosition(e);
            if (this.isDraggingVolume) this.updateVolumeFromMouse(e);
            if (this.isDraggingClipVolume && this.volumeDragClip) {
                const dy = this.volumeDragStartY - e.clientY;
                const newVol = Math.max(0, Math.min(200, this.volumeDragStartVolume + dy));
                this.volumeDragClip.volume = Math.round(newVol);
            }
            if (this.pendingClickClipId && !this.isDraggingClip && this.draggingClipIds.length > 0) {
                if (Math.abs(e.clientX - this.dragStartX) > 3 || Math.abs(e.clientY - this.dragStartY) > 3) { this.isDraggingClip = true; this.pendingClickClipId = null; }
            }
            if (this.isDraggingClip && this.draggingClipIds.length > 0) this.handleClipDrag(e);
            if (this.isResizingClip && this.resizingClip) this.handleClipResize(e);
        },
        onDocumentMouseUp(e) {
            if (this.pendingClickClipId && !this.isDraggingClip) this.selectClip(this.pendingClickClipId, this.pendingClickModifiers || {});
            this.pendingClickClipId = null; this.pendingClickModifiers = null;
            this.isResizingHeader = false; this.isResizingTrack = false; this.resizingTrackId = null;
            this.isDraggingPlayhead = false; this.isDraggingClip = false;
            this.draggingClipIds = []; this.dragStartPositions = {}; this.dragStartTrackIds = {};
            this.currentDragTrackIndex = null;
            this.isResizingClip = false; this.resizingClip = null;
            this.isDraggingVolume = false;
            this.isDraggingClipVolume = false; this.volumeDragClip = null;
        },
        handleClipDrag(e) {
            const dx = e.clientX - this.dragStartX;
            const dt = dx / this.pixelsPerSecond;
            const lane = document.getElementById('timeline-lane-container');
            if (lane) {
                const rect = lane.getBoundingClientRect();
                const relY = e.clientY - rect.top - 24;
                let accH = 0, newTrackIdx = -1;
                for (let i = 0; i < this.vm.tracks.length; i++) {
                    const h = this.getTrackHeight(this.vm.tracks[i].id);
                    if (relY >= accH && relY < accH + h) { newTrackIdx = i; break; }
                    accH += h;
                }
                // 부드러운 트랙 이동: 한 번에 한 트랙씩만
                if (newTrackIdx !== -1 && this.currentDragTrackIndex !== null && newTrackIdx !== this.currentDragTrackIndex) {
                    const targetTrack = this.vm.tracks[newTrackIdx];
                    if (targetTrack && !targetTrack.isLocked) {
                        let canMove = true;
                        for (const clipId of this.draggingClipIds) {
                            const clip = this.vm.clips.find(c => c.id === clipId);
                            if (!clip) continue;
                            const newStart = Math.max(0, this.dragStartPositions[clipId] + dt);
                            if (this.hasCollision(targetTrack.id, newStart, clip.duration, this.draggingClipIds)) { canMove = false; break; }
                        }
                        if (canMove) {
                            this.draggingClipIds.forEach(clipId => {
                                const clip = this.vm.clips.find(c => c.id === clipId);
                                if (clip) { clip.trackId = targetTrack.id; this.dragStartTrackIds[clipId] = targetTrack.id; }
                            });
                            this.currentDragTrackIndex = newTrackIdx;
                        }
                    }
                }
            }
            // 시간 위치 업데이트
            const newPos = {};
            this.draggingClipIds.forEach(id => {
                const clip = this.vm.clips.find(c => c.id === id);
                if (!clip) return;
                let ns = Math.max(0, this.dragStartPositions[id] + dt);
                if (this.vm.isMagnet) { const snap = this.findSnapPosition(ns, clip, this.draggingClipIds); if (snap.snapped) ns = snap.position; }
                newPos[id] = ns;
            });
            let canMove = true;
            for (const id of this.draggingClipIds) { const clip = this.vm.clips.find(c => c.id === id); if (clip && this.hasCollision(clip.trackId, newPos[id], clip.duration, this.draggingClipIds)) { canMove = false; break; } }
            if (canMove) this.draggingClipIds.forEach(id => { const clip = this.vm.clips.find(c => c.id === id); if (clip && newPos[id] !== undefined) clip.start = newPos[id]; });
        },
        startClipResize(e, clip, dir) { const t = this.vm.tracks.find(tr => tr.id === clip.trackId); if (t && t.isLocked) return; e.preventDefault(); this.isResizingClip = true; this.resizingClip = clip; this.resizeDirection = dir; this.dragStartX = e.clientX; this.resizeStartClipStart = clip.start; this.resizeStartClipDuration = clip.duration; },
        handleClipResize(e) {
            const dt = (e.clientX - this.dragStartX) / this.pixelsPerSecond;
            if (this.resizeDirection === 'left') {
                let ns = this.resizeStartClipStart + dt, nd = this.resizeStartClipDuration - dt;
                if (ns < 0) { nd += ns; ns = 0; }
                if (nd < 0.5) { nd = 0.5; ns = this.resizeStartClipStart + this.resizeStartClipDuration - 0.5; }
                if (!this.hasCollision(this.resizingClip.trackId, ns, nd, [this.resizingClip.id])) { this.resizingClip.start = ns; this.resizingClip.duration = nd; }
            } else {
                let nd = this.resizeStartClipDuration + dt;
                if (nd < 0.5) nd = 0.5;
                if (!this.hasCollision(this.resizingClip.trackId, this.resizingClip.start, nd, [this.resizingClip.id])) this.resizingClip.duration = nd;
            }
        },
        hasCollision(trackId, start, dur, excludeIds = []) { const end = start + dur; for (const c of this.vm.clips.filter(c => c.trackId === trackId && !excludeIds.includes(c.id))) { if (start < c.start + c.duration && end > c.start) return true; } return false; },
        findSnapPosition(newStart, clip, excludeIds = []) {
            const snapDist = 10 / this.pixelsPerSecond, clipEnd = newStart + clip.duration;
            if (Math.abs(newStart - this.vm.currentTime) < snapDist) return { snapped: true, position: this.vm.currentTime };
            if (Math.abs(clipEnd - this.vm.currentTime) < snapDist) return { snapped: true, position: this.vm.currentTime - clip.duration };
            for (const c of this.vm.clips) {
                if (c.id === clip.id || excludeIds.includes(c.id)) continue;
                if (Math.abs(newStart - (c.start + c.duration)) < snapDist) return { snapped: true, position: c.start + c.duration };
                if (Math.abs(newStart - c.start) < snapDist) return { snapped: true, position: c.start };
                if (Math.abs(clipEnd - c.start) < snapDist) return { snapped: true, position: c.start - clip.duration };
                if (Math.abs(clipEnd - (c.start + c.duration)) < snapDist) return { snapped: true, position: c.start + c.duration - clip.duration };
            }
            return { snapped: false, position: newStart };
        },
        startTrackDrag(e, track, idx) { this.draggingTrackId = track.id; this.draggingTrackIndex = idx; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', track.id); },
        handleTrackDragOver(e, track) { if (this.draggingTrackId && this.draggingTrackId !== track.id) this.dragOverTrackId = track.id; },
        handleTrackDragLeave() { this.dragOverTrackId = null; },
        handleTrackDrop(e, targetTrack, targetIdx) { if (!this.draggingTrackId || this.draggingTrackId === targetTrack.id) { this.endTrackDrag(); return; } const fromIdx = this.draggingTrackIndex; if (fromIdx !== targetIdx) { const tracks = [...this.vm.tracks]; const [moved] = tracks.splice(fromIdx, 1); tracks.splice(targetIdx, 0, moved); this.vm.tracks = tracks; } this.endTrackDrag(); },
        endTrackDrag() { this.draggingTrackId = null; this.draggingTrackIndex = null; this.dragOverTrackId = null; },
        moveTrackUp(idx) { if (idx <= 0) return; const t = [...this.vm.tracks]; [t[idx - 1], t[idx]] = [t[idx], t[idx - 1]]; this.vm.tracks = t; this.closeContextMenus(); },
        moveTrackDown(idx) { if (idx >= this.vm.tracks.length - 1) return; const t = [...this.vm.tracks]; [t[idx], t[idx + 1]] = [t[idx + 1], t[idx]]; this.vm.tracks = t; this.closeContextMenus(); },
        startTrackResize(e, track) { this.isResizingTrack = true; this.resizingTrackId = track.id; this.resizeStartY = e.clientY; this.resizeStartHeight = this.getTrackHeight(track.id); },
        resetTrackHeight(track) { this.trackHeights[track.id] = this.defaultTrackHeight; this.trackHeights = { ...this.trackHeights }; this.closeContextMenus(); },
        unifyAllTrackHeights() { this.vm.tracks.forEach(t => { this.trackHeights[t.id] = this.defaultTrackHeight; }); this.trackHeights = { ...this.trackHeights }; this.closeContextMenus(); },
        addTrack() { const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']; const t = { id: `t_${Date.now()}`, name: 'NONE', color: colors[this.vm.tracks.length % colors.length], isHidden: false, isLocked: false, isMain: false }; this.vm.tracks.push(t); this.trackHeights[t.id] = this.defaultTrackHeight; this.trackHeights = { ...this.trackHeights }; },
        deleteTrack(track, idx) { if (this.vm.tracks.length <= 1) { Swal.fire({ icon: 'warning', title: '삭제 불가', text: '최소 1개 트랙 필요', background: '#1e1e1e', color: '#fff' }); return; } this.vm.clips = this.vm.clips.filter(c => c.trackId !== track.id); delete this.trackHeights[track.id]; this.trackHeights = { ...this.trackHeights }; this.vm.tracks.splice(idx, 1); this.closeContextMenus(); },
        duplicateTrack(track) { const idx = this.vm.tracks.findIndex(t => t.id === track.id); const nt = { ...track, id: `t_${Date.now()}`, name: track.name === 'NONE' ? 'NONE' : track.name + ' (복사)', isMain: false }; this.vm.tracks.splice(idx + 1, 0, nt); this.trackHeights[nt.id] = this.getTrackHeight(track.id); this.trackHeights = { ...this.trackHeights }; this.closeContextMenus(); },
        setMainTrack(track) { this.vm.tracks.forEach(t => t.isMain = false); track.isMain = true; },
        async changeTrackColor(track) { const { value } = await Swal.fire({ title: '트랙 색상', input: 'text', inputValue: track.color, showCancelButton: true, background: '#1e1e1e', color: '#fff' }); if (value) track.color = value; this.closeContextMenus(); },
        openTrackContextMenu(e, track, idx) { this.clipContextMenu = null; this.trackContextMenu = { x: e.clientX, y: e.clientY, track, index: idx }; },
        openClipContextMenu(e, track, clip = null) { this.trackContextMenu = null; this.clipContextMenu = { x: e.clientX, y: e.clientY, track, clip, time: this.getTimeFromMouseEvent(e) }; },
        getTimeFromMouseEvent(e) { const lane = document.getElementById('timeline-lane-container'); if (!lane) return 0; return Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pixelsPerSecond); },
        closeContextMenus() { this.trackContextMenu = null; this.clipContextMenu = null; },
        async showVolumeDialog(clip) { const { value } = await Swal.fire({ title: '볼륨 조절', input: 'range', inputValue: clip.volume || 100, inputAttributes: { min: 0, max: 200, step: 1 }, showCancelButton: true, confirmButtonText: '적용', cancelButtonText: '취소', background: '#1e1e1e', color: '#fff', didOpen: () => { const input = Swal.getInput(); const label = document.createElement('div'); label.className = 'text-center mt-2 text-lg'; label.id = 'volume-label'; label.textContent = `${clip.volume || 100}%`; input.parentNode.appendChild(label); input.addEventListener('input', () => { document.getElementById('volume-label').textContent = `${input.value}%`; }); } }); if (value !== undefined) clip.volume = parseInt(value); this.closeContextMenus(); },
        duplicateClip(clip) { const nc = { ...clip, id: `c_${Date.now()}`, start: clip.start + clip.duration + 0.5 }; this.vm.clips.push(nc); },
        deleteClip(clip) { this.vm.clips = this.vm.clips.filter(c => c.id !== clip.id); this.selectedClipIds = this.selectedClipIds.filter(id => id !== clip.id); this.syncVmSelectedClip(); },
        addClipAtPosition() { if (!this.clipContextMenu) return; const t = this.clipContextMenu.track, time = this.clipContextMenu.time || 0; const nc = { id: `c_${Date.now()}`, trackId: t.id, name: 'New Clip', start: time, duration: 5, type: 'video', volume: 100 }; this.vm.clips.push(nc); },
        pasteClip() { if (!this.copiedClip || !this.clipContextMenu) return; const nc = { ...this.copiedClip, id: `c_${Date.now()}`, trackId: this.clipContextMenu.track.id, start: this.clipContextMenu.time || 0 }; this.vm.clips.push(nc); },
        deleteSelectedClips() { if (this.selectedClipIds.length === 0) return; this.vm.clips = this.vm.clips.filter(c => !this.selectedClipIds.includes(c.id)); this.selectedClipIds = []; this.syncVmSelectedClip(); },
        cutAtPlayhead() { const targets = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : this.vm.clips.filter(c => this.vm.currentTime > c.start && this.vm.currentTime < c.start + c.duration).map(c => c.id); targets.forEach(clipId => { const clip = this.vm.clips.find(c => c.id === clipId); if (clip && this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { const origDur = clip.duration, relTime = this.vm.currentTime - clip.start; clip.duration = relTime; this.vm.clips.push({ ...clip, id: `c_${Date.now()}`, start: this.vm.currentTime, duration: origDur - relTime }); } }); },
        cutAtPlayheadForClip(clip) { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { const origDur = clip.duration, relTime = this.vm.currentTime - clip.start; clip.duration = relTime; this.vm.clips.push({ ...clip, id: `c_${Date.now()}`, start: this.vm.currentTime, duration: origDur - relTime }); } },
        cutAndDeleteLeftSelected() { const targets = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : this.vm.clips.filter(c => this.vm.currentTime > c.start && this.vm.currentTime < c.start + c.duration).map(c => c.id); targets.forEach(clipId => { const clip = this.vm.clips.find(c => c.id === clipId); if (clip && this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { clip.duration = clip.start + clip.duration - this.vm.currentTime; clip.start = this.vm.currentTime; } }); },
        cutAndDeleteRightSelected() { const targets = this.selectedClipIds.length > 0 ? [...this.selectedClipIds] : this.vm.clips.filter(c => this.vm.currentTime > c.start && this.vm.currentTime < c.start + c.duration).map(c => c.id); targets.forEach(clipId => { const clip = this.vm.clips.find(c => c.id === clipId); if (clip && this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { clip.duration = this.vm.currentTime - clip.start; } }); },
        cutAndDeleteLeftForClip(clip) { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { clip.duration = clip.start + clip.duration - this.vm.currentTime; clip.start = this.vm.currentTime; } },
        cutAndDeleteRightForClip(clip) { if (this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration) { clip.duration = this.vm.currentTime - clip.start; } },
        handleLaneMouseDown(e) { if (e.target.id === 'timeline-ruler' || e.target.closest('#timeline-ruler')) this.updatePlayheadPosition(e); },
        startPlayheadDrag(e) { this.isDraggingPlayhead = true; this.updatePlayheadPosition(e); },
        updatePlayheadPosition(e) { const lane = document.getElementById('timeline-lane-container'); if (!lane) return; let time = Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pixelsPerSecond); if (this.vm.isMagnet) { let snap = null, minDiff = 10 / this.pixelsPerSecond; this.vm.clips.forEach(c => { if (Math.abs(time - c.start) < minDiff) { minDiff = Math.abs(time - c.start); snap = c.start; } if (Math.abs(time - (c.start + c.duration)) < minDiff) { minDiff = Math.abs(time - (c.start + c.duration)); snap = c.start + c.duration; } }); if (snap !== null) time = snap; } this.vm.currentTime = time; },
        togglePlayback() { if (typeof this.vm.togglePlayback === 'function') this.vm.togglePlayback(); else this.vm.isPlaying = !this.vm.isPlaying; },
        seekToStart() { if (typeof this.vm.seekToStart === 'function') this.vm.seekToStart(); else this.vm.currentTime = 0; },
        seekToEnd() { let max = 0; this.vm.clips.forEach(c => { if (c.start + c.duration > max) max = c.start + c.duration; }); this.vm.currentTime = max; },
        adjustLayout() { const p = document.getElementById('preview-main-container'); if (p) p.style.height = this.vm.isTimelineCollapsed ? 'calc(100% - 32px)' : '50%'; this.calculateDynamicZoomRange(); },
        toggleCollapse() { this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed; this.$nextTick(() => this.adjustLayout()); },
        startHeaderResize(e) { if (this.isTrackNamesCollapsed) return; this.isResizingHeader = true; this.resizeStartX = e.clientX; this.resizeStartWidth = this.trackHeaderWidth; },
        formatRulerTime(s) { if (s >= 3600) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60); return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; } else if (s >= 60) { const m = Math.floor(s / 60), sec = Math.floor(s % 60); return `${m}:${String(sec).padStart(2, '0')}`; } return s + 's'; },
        onExternalDragOver(e) { if (e.dataTransfer.types.includes('text/wai-asset')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; this.isExternalDragOver = true; this.updateDropIndicator(e); } },
        onExternalDragLeave(e) { const rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) { this.isExternalDragOver = false; this.dropIndicator.visible = false; } },
        updateDropIndicator(e) { const lane = document.getElementById('timeline-lane-container'); if (!lane) return; const rect = lane.getBoundingClientRect(), relY = e.clientY - rect.top - 24; let accH = 0, targetTrack = null; for (const t of this.vm.tracks) { const h = this.getTrackHeight(t.id); if (relY >= accH && relY < accH + h) { targetTrack = t; break; } accH += h; } if (!targetTrack) { this.dropIndicator.visible = false; return; } const dropTime = Math.max(0, (e.clientX - rect.left) / this.pixelsPerSecond); this.dropIndicator = { visible: true, trackId: targetTrack.id, left: dropTime * this.pixelsPerSecond, width: 5 * this.pixelsPerSecond }; },
        onExternalDrop(e) { e.preventDefault(); this.isExternalDragOver = false; this.dropIndicator.visible = false; let assetData; try { const raw = e.dataTransfer.getData('text/wai-asset'); if (!raw) return; assetData = JSON.parse(raw); } catch (err) { return; } const assets = Array.isArray(assetData) ? assetData : [assetData]; if (assets.length === 0) return; const lane = document.getElementById('timeline-lane-container'); let dropTime = this.vm.currentTime, targetTrackId = null; if (lane) { const rect = lane.getBoundingClientRect(); dropTime = Math.max(0, (e.clientX - rect.left) / this.pixelsPerSecond); const relY = e.clientY - rect.top - 24; let accH = 0; for (const t of this.vm.tracks) { const h = this.getTrackHeight(t.id); if (relY >= accH && relY < accH + h) { targetTrackId = t.id; break; } accH += h; } } document.dispatchEvent(new CustomEvent('wai-timeline-drop', { detail: { assets, dropTime, targetTrackId }, bubbles: true })); },
        handleWheel(e) { const sc = document.getElementById('timeline-scroll-container'); if (!sc) return; if (e.shiftKey || e.ctrlKey) { const zoomFactor = this.currentDisplayZoom > 10 ? 0.15 : 0.3, delta = e.deltaY > 0 ? -this.currentDisplayZoom * zoomFactor : this.currentDisplayZoom * zoomFactor, newZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, this.currentDisplayZoom + delta)); if (this.zoomMode === 'playhead') this.setZoom(newZoom, 'playhead'); else { const lane = document.getElementById('timeline-lane-container'); if (lane) { const rect = lane.getBoundingClientRect(), cursorX = e.clientX - rect.left, cursorTime = (sc.scrollLeft + cursorX) / this.pixelsPerSecond; this.currentDisplayZoom = newZoom; this.vm.zoom = newZoom; this.$nextTick(() => { sc.scrollLeft = cursorTime * this.pixelsPerSecond - cursorX; this.scrollLeft = sc.scrollLeft; }); } else this.setZoom(newZoom); } } else { sc.scrollLeft += e.deltaY; this.scrollLeft = sc.scrollLeft; } }
    }
};

window.TimelinePanel = TimelinePanel;
