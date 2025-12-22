// Timeline Panel Component - CapCut Style
// 캡컷 스타일 클립 드래그 (자유 이동 + 드롭 시 유효 위치 계산)
// 클립 사운드 파형 막대그래프 표시 (무음 구간 구분)
// 트랙 순서 = 캔버스 레이어 z-index
// 클립 겹침 시 좌우 공간 탐색하여 자동 삽입
// 드래그 성능 최적화: 마우스 1:1 추적
// 메인 트랙 플레이헤드 위치 편집 지원

const TimelinePanel = {
    mixins: [
        window.TimelineHistoryMixin,
        window.TimelineZoomMixin,
        window.TimelineAudioMixin
    ],
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col bg-bg-panel select-none h-full"
            @dragover.prevent="onExternalDragOver"
            @dragleave="onExternalDragLeave"
            @drop.prevent="onExternalDrop"
        >
            <!-- 타임라인 헤더 (플레이 버튼 바) -->
            <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0">
                <div class="flex items-center gap-2">
                    <button class="hover:text-text-main w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover" @click="toggleCollapse" :title="vm.isTimelineCollapsed ? '타임라인 펼치기' : '타임라인 접기'">
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span class="text-xs font-mono text-ui-accent font-bold">{{ formattedTime }}</span>
                    <div class="flex items-center gap-1 ml-2">
                        <button class="tool-btn" @click="seekToStart" title="처음으로 (Home)"><i class="fa-solid fa-backward-step"></i></button>
                        <button class="tool-btn" @click="seekBackward" title="5초 뒤로 (←)"><i class="fa-solid fa-backward"></i></button>
                        <button class="tool-btn w-8" @click="togglePlayback" :title="vm.isPlaying ? '일시정지 (Space)' : '재생 (Space)'">
                            <i :class="vm.isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
                        </button>
                        <button class="tool-btn" @click="seekForward" title="5초 앞으로 (→)"><i class="fa-solid fa-forward"></i></button>
                        <button class="tool-btn" @click="seekToEnd" title="끝으로 (End)"><i class="fa-solid fa-forward-step"></i></button>
                    </div>
                    <div class="master-volume-container ml-2" @mouseenter="showMasterVolume = true" @mouseleave="onMasterVolumeLeave">
                        <button class="tool-btn" :class="{ 'text-red-400': masterVolume === 0 }" @click="toggleMute" :title="'마스터 볼륨: ' + masterVolume + '%'" @wheel.stop.prevent="onMasterVolumeWheel">
                            <i :class="getVolumeIcon(masterVolume)"></i>
                        </button>
                        <div class="master-volume-popup" :class="{ 'show': showMasterVolume }" @mouseenter="showMasterVolume = true" @mouseleave="onMasterVolumeLeave" @wheel.stop.prevent="onMasterVolumeWheel">
                            <div class="volume-track" @mousedown="startMasterVolumeDrag">
                                <div class="volume-fill" :style="{ height: masterVolume + '%' }"></div>
                                <div class="volume-thumb" :style="{ bottom: 'calc(' + masterVolume + '% - 6px)' }"></div>
                            </div>
                            <span class="volume-value">{{ masterVolume }}%</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 ml-4 text-[10px]">
                        <div class="relative aspect-ratio-dropdown-wrapper">
                            <button class="timeline-select-no-arrow bg-bg-input border border-ui-border rounded px-2 py-0.5 text-text-main text-[10px] min-w-[50px] text-left flex items-center justify-between gap-1" @click="toggleAspectDropdown">
                                <span>{{ vm.aspectRatio }}</span>
                                <i class="fa-solid fa-chevron-down text-[8px] text-text-sub"></i>
                            </button>
                            <div v-if="isAspectDropdownOpen" class="absolute top-full left-0 mt-1 bg-bg-panel border border-ui-border rounded shadow-lg z-50 min-w-[100px]">
                                <div v-for="opt in aspectRatioOptions" :key="opt.value" class="px-3 py-1.5 text-[10px] text-text-main hover:bg-bg-hover cursor-pointer flex justify-between gap-2" :class="{ 'bg-bg-hover': vm.aspectRatio === opt.value }" @click="selectAspectRatio(opt.value)">
                                    <span>{{ opt.label }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="relative resolution-dropdown-wrapper">
                            <button class="timeline-select-no-arrow bg-bg-input border border-ui-border rounded px-2 py-0.5 text-text-main text-[10px] min-w-[40px] text-left" @click="toggleResolutionDropdown">{{ vm.resolution }}</button>
                            <div v-if="isResolutionDropdownOpen" class="absolute top-full left-0 mt-1 bg-bg-panel border border-ui-border rounded shadow-lg z-50 min-w-[140px]">
                                <div v-for="opt in resolutionOptions" :key="opt.value" class="px-3 py-1.5 text-[10px] text-text-main hover:bg-bg-hover cursor-pointer flex justify-between gap-4" :class="{ 'bg-bg-hover': vm.resolution === opt.value }" @click="selectResolution(opt.value)">
                                    <span>{{ opt.label }}</span>
                                    <span class="text-text-sub">{{ opt.pixels }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-text-sub w-12 text-right">{{ zoomDisplayText }}</span>
                    <input type="range" :min="zoomMin" :max="zoomMax" :value="currentDisplayZoom" @input="handleZoomInput($event)" class="w-20 accent-ui-accent h-1" />
                </div>
            </div>
            
            <!-- 툴바 -->
            <div v-if="!vm.isTimelineCollapsed" class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-[10px]">
                <div class="flex gap-1 items-center">
                    <button class="tool-btn" @click="undo" title="실행 취소 (Ctrl+Z)" :disabled="!canUndo"><i class="fa-solid fa-rotate-left"></i></button>
                    <button class="tool-btn" @click="redo" title="다시 실행 (Ctrl+Y)" :disabled="!canRedo"><i class="fa-solid fa-rotate-right"></i></button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" :disabled="!canEditAtPlayhead" :title="getEditButtonTitle('자르기+왼쪽삭제 (Shift+A)')" @click="cutAndDeleteLeftSelected">
                        <span class="text-red-400 text-[10px] leading-none">&lt;</span>
                        <i class="fa-solid fa-scissors text-[9px]"></i>
                    </button>
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" :disabled="!canEditAtPlayhead" :title="getEditButtonTitle('자르기+오른쪽삭제 (Shift+D)')" @click="cutAndDeleteRightSelected">
                        <i class="fa-solid fa-scissors text-[9px]"></i>
                        <span class="text-red-400 text-[10px] leading-none">&gt;</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn" :disabled="!canEditAtPlayhead" :title="getEditButtonTitle('자르기 (Shift+S)')" @click="cutAtPlayhead"><i class="fa-solid fa-scissors"></i></button>
                    <button class="tool-btn" :disabled="!hasSelectedClips" :title="hasSelectedClips ? '삭제' : '클립을 먼저 선택하세요'" @click="deleteSelectedClips"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="flex gap-2 items-center">
                    <span v-if="selectedClipIds.length > 0" class="text-ui-accent">{{ selectedClipIds.length }}개 선택</span>
                    <span v-else-if="mainTrackClipAtPlayhead" class="text-yellow-400">메인트랙 편집</span>
                    <span v-else class="text-text-sub">클립 미선택</span>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn w-6 h-6" @click="zoomToFit" title="전체 보기"><i class="fa-solid fa-expand"></i></button>
                    <button class="tool-btn w-6 h-6" :class="{ 'bg-ui-accent text-white': zoomMode === 'playhead' }" @click="toggleZoomMode" :title="zoomMode === 'cursor' ? '커서 중심 줌' : '플레이헤드 중심 줌'"><i class="fa-solid fa-crosshairs"></i></button>
                    <button class="tool-btn" :class="{ 'bg-ui-accent text-white': vm.isMagnet }" @click="vm.isMagnet = !vm.isMagnet" title="스냅 토글"><i class="fa-solid fa-magnet"></i></button>
                    <button class="tool-btn" :class="{ 'bg-ui-accent text-white': vm.isAutoRipple }" @click="vm.isAutoRipple = !vm.isAutoRipple" title="리플 토글"><i class="fa-solid fa-link"></i></button>
                </div>
            </div>

            <!-- 메인 타임라인 영역 -->
            <div v-if="!vm.isTimelineCollapsed" class="flex-grow flex overflow-hidden min-h-0 relative">
                <!-- 트랙 헤더 (고정) -->
                <div class="track-header-container bg-bg-panel border-r border-ui-border flex-shrink-0 flex flex-col relative" :style="{ width: currentHeaderWidth + 'px' }" @mouseenter="onHeaderAreaEnter" @mouseleave="onHeaderAreaLeave">
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel shrink-0">
                        <div class="flex items-center gap-1">
                            <button v-if="isTrackHeaderCollapsed" class="tool-btn w-5 h-5" title="헤더 펼치기" @click="expandTrackHeader"><i class="fa-solid fa-chevron-right" style="font-size: 9px;"></i></button>
                            <button v-else class="tool-btn w-5 h-5" title="트랙 추가" @click="addTrack"><i class="fa-solid fa-plus" style="font-size: 9px;"></i></button>
                            <span v-show="!isTrackHeaderCollapsed">TRACKS</span>
                        </div>
                        <button v-show="!isTrackHeaderCollapsed" class="w-4 h-4 flex items-center justify-center rounded hover:bg-bg-hover text-[8px]" @click="collapseTrackHeader" title="헤더 접기"><i class="fa-solid fa-chevron-left" style="font-size: 8px;"></i></button>
                    </div>
                    <div ref="trackHeaderList" class="track-header-list flex-grow overflow-hidden relative" @scroll="onHeaderScroll">
                        <div class="track-header-inner" :style="{ height: totalTrackHeight + 'px' }">
                            <div v-for="(track, index) in vm.tracks" :key="track.id" :data-track-id="track.id" class="border-b border-ui-border flex items-center px-1 group bg-bg-panel relative" :class="{ 'opacity-50': track.isLocked, 'bg-ui-accent/20': dragOverTrackId === track.id }" :style="{ height: getTrackHeight(track.id) + 'px' }" draggable="true" @dragstart="startTrackDrag($event, track, index)" @dragover.prevent="handleTrackDragOver($event, track)" @dragleave="handleTrackDragLeave" @drop.prevent="handleTrackDrop($event, track, index)" @dragend="endTrackDrag" @contextmenu.prevent="openTrackContextMenu($event, track, index)" @wheel.stop="onTrackHeaderWheel($event, track)">
                                <button class="w-4 h-4 flex items-center justify-center rounded mr-1 shrink-0 hover:bg-bg-hover" :class="track.isMain ? 'text-yellow-400' : 'text-text-sub opacity-30 hover:opacity-100'" @click.stop="setMainTrack(track)"><i :class="track.isMain ? 'fa-solid fa-star' : 'fa-regular fa-star'" style="font-size: 10px;"></i></button>
                                <template v-if="!isTrackHeaderCollapsed">
                                    <div class="flex items-center gap-0.5 mr-1 shrink-0" v-show="getTrackHeight(track.id) >= 30">
                                        <button class="track-control-btn" :class="{ 'active': !track.isHidden }" @click.stop="track.isHidden = !track.isHidden"><i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" style="font-size: 8px;"></i></button>
                                        <button class="track-control-btn" :class="{ 'locked': track.isLocked }" @click.stop="track.isLocked = !track.isLocked"><i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" style="font-size: 8px;"></i></button>
                                    </div>
                                    <div v-show="getTrackHeight(track.id) >= 24" class="w-1 h-2/3 rounded mr-1 shrink-0" :style="{ backgroundColor: track.color || '#666' }"></div>
                                    <input v-show="getTrackHeight(track.id) >= 24" type="text" class="text-[10px] truncate flex-1 text-text-main bg-transparent border-none outline-none min-w-0" :class="{ 'text-text-sub italic': track.name === 'NONE' }" :value="track.name === 'NONE' ? '' : track.name" @input="updateTrackName(track, $event.target.value)" :disabled="track.isLocked" @mousedown.stop :placeholder="getTrackPlaceholder(index)" />
                                </template>
                                <div class="absolute left-0 right-0 bottom-0 h-1 cursor-ns-resize hover:bg-ui-accent/50 z-10" @mousedown.prevent.stop="startTrackResize($event, track)"></div>
                            </div>
                        </div>
                    </div>
                    <div v-show="!isTrackHeaderCollapsed" class="header-resize-handle" :class="{ 'resizing': isResizingHeader }" :style="{ top: '24px', height: totalTrackHeight + 'px' }" @mousedown.prevent="startHeaderResize"></div>
                    <div v-if="isTrackHeaderCollapsed && isHoveringHeaderArea" class="absolute inset-0 top-6 flex items-center justify-center bg-bg-hover/80 cursor-pointer z-20" @click="expandTrackHeader"><i class="fa-solid fa-chevron-right text-ui-accent"></i></div>
                </div>

                <!-- 타임라인 레인 (스크롤 가능) -->
                <div id="timeline-scroll-container" ref="timelineScrollContainer" class="flex-grow overflow-auto relative timeline-scroll-enhanced" @scroll="onTimelineScroll">
                    <div id="timeline-lane-container" class="relative min-w-max" :style="{ minHeight: totalTrackHeight + 24 + 'px' }" @mousedown="handleLaneMouseDown" @mouseenter="isMouseInLane = true" @mouseleave="isMouseInLane = false" @wheel.prevent="handleLaneWheel">
                        <!-- 룰러 -->
                        <div id="timeline-ruler" class="h-6 border-b border-ui-border sticky top-0 relative" :style="{ width: totalTimelineWidth + 'px' }" style="z-index: 20; background: var(--bg-panel);">
                            <template v-for="mark in visibleRulerMarks" :key="'ruler-' + mark.time">
                                <div v-if="mark.isMajor" class="absolute top-0 bottom-0 border-l border-ui-border" :style="{ left: mark.position + 'px' }">
                                    <span v-if="mark.label" class="absolute top-0 left-1 text-[9px] text-text-sub whitespace-nowrap">{{ mark.label }}</span>
                                </div>
                                <div v-else-if="mark.isMid" class="absolute bottom-0 h-3 border-l border-ui-border opacity-50" :style="{ left: mark.position + 'px' }"></div>
                                <div v-else class="absolute bottom-0 h-1.5 border-l border-ui-border opacity-30" :style="{ left: mark.position + 'px' }"></div>
                            </template>
                            <div class="playhead-head" :style="{ left: vm.currentTime * pixelsPerSecond + 'px' }" @mousedown.stop.prevent="startPlayheadDrag"></div>
                        </div>
                        
                        <!-- 트랙 레인 -->
                        <div v-for="(track, idx) in vm.tracks" :key="track.id" :data-track-id="track.id" :data-track-index="idx" class="border-b border-ui-border relative track-lane" :class="{ 'opacity-30': track.isHidden }" :style="{ height: getTrackHeight(track.id) + 'px' }" @mousedown="onTrackLaneMouseDown($event, track)" @contextmenu.prevent="openClipContextMenu($event, track)">
                            <div v-if="dropIndicator.visible && dropIndicator.trackId === track.id" class="absolute top-1 bottom-1 bg-ui-accent/30 border-2 border-dashed border-ui-accent rounded pointer-events-none z-20" :style="{ left: dropIndicator.left + 'px', width: dropIndicator.width + 'px' }"></div>
                            <div v-for="clip in getVisibleClipsForTrack(track.id)" :key="clip.id" :data-clip-id="clip.id" class="clip absolute cursor-pointer" :class="getClipClasses(clip)" :style="getClipStyle(clip, track)" @mousedown.stop="onClipMouseDown($event, clip, track)" @contextmenu.stop.prevent="openClipContextMenu($event, track, clip)">
                                <div class="absolute inset-0" :style="getClipBackgroundStyle(clip, track)"></div>
                                <div v-if="clip.type === 'video' || clip.type === 'image'" class="absolute inset-0 top-[18px]" :style="{ bottom: getWaveformHeight(track) + 'px' }">
                                    <div class="clip-filmstrip h-full flex overflow-hidden">
                                        <div v-for="(frame, fi) in getFilmstripFrames(clip)" :key="'f'+fi" class="clip-filmstrip-frame flex-shrink-0 h-full bg-cover bg-center bg-no-repeat relative" :style="{ width: frame.width + 'px', backgroundImage: frame.src ? 'url(' + frame.src + ')' : 'none', backgroundColor: frame.src ? 'transparent' : '#1a1a2e' }">
                                            <i v-if="!frame.src" class="fa-solid fa-film absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 text-[10px]"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="clip-title-bar"><span class="clip-name">{{ clip.name }}</span><span class="clip-duration">{{ formatClipDuration(clip.duration) }}</span></div>
                                <div class="clip-waveform-area" :style="{ height: getWaveformHeight(track) + 'px' }">
                                    <div class="clip-waveform-bars">
                                        <div v-for="(bar, bi) in getAudioLevelBars(clip)" :key="'bar'+bi" class="clip-waveform-bar" :class="{ 'silent': bar.isSilent }" :style="{ left: bar.x + '%', width: bar.w + '%', height: bar.h + '%' }"></div>
                                    </div>
                                    <div class="clip-volume-line" :style="{ bottom: getVolumeLinePosition(clip) + '%' }" @mousedown.stop="startClipVolumeDrag($event, clip)"></div>
                                </div>
                                <div class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20" style="z-index:15;" @mousedown.stop="startClipResize($event, clip, 'left')"></div>
                                <div class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20" style="z-index:15;" @mousedown.stop="startClipResize($event, clip, 'right')"></div>
                            </div>
                        </div>
                        <div class="playhead-line-body" :style="{ left: vm.currentTime * pixelsPerSecond + 'px', height: totalTrackHeight + 'px' }"></div>
                        <div v-if="dragGhost.visible" class="clip-drag-ghost" :style="dragGhost.style">
                            <div class="absolute inset-0" :style="{ background: dragGhost.bgColor, borderRadius: '4px' }"></div>
                            <div class="clip-title-bar"><span class="clip-name">{{ dragGhost.name }}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 볼륨 팝업 -->
            <div v-if="volumePopup.visible" class="clip-volume-popup" :style="{ top: volumePopup.y + 'px', left: volumePopup.x + 'px' }" @mousedown.stop>
                <div class="volume-track" @mousedown="startVolumePopupDrag">
                    <div class="volume-fill" :style="{ height: Math.min(100, volumePopup.value / 2) + '%' }"></div>
                    <div class="volume-thumb" :style="{ bottom: 'calc(' + Math.min(100, volumePopup.value / 2) + '% - 7px)' }"></div>
                </div>
                <span class="volume-value">{{ volumePopup.value }}%</span>
            </div>
            
            <!-- 트랙 컨텍스트 메뉴 -->
            <div v-if="trackContextMenu" class="context-menu context-menu--compact" :style="getContextMenuStyle(trackContextMenu)" @click.stop>
                <div class="ctx-item" @click="moveTrackUp(trackContextMenu.index)"><i class="fa-solid fa-arrow-up w-4"></i><span>위로 이동</span></div>
                <div class="ctx-item" @click="moveTrackDown(trackContextMenu.index)"><i class="fa-solid fa-arrow-down w-4"></i><span>아래로 이동</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item" @click="setMainTrack(trackContextMenu.track); closeContextMenus()"><i class="fa-solid fa-star w-4"></i><span>메인 트랙 설정</span></div>
                <div class="ctx-item" @click="duplicateTrack(trackContextMenu.track)"><i class="fa-solid fa-copy w-4"></i><span>트랙 복제</span></div>
                <div class="ctx-item" @click="changeTrackColor(trackContextMenu.track)"><i class="fa-solid fa-palette w-4"></i><span>색상 변경</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item has-submenu" @mouseenter="openHeightSubmenu($event, 'this')" @mouseleave="scheduleCloseHeightSubmenu"><i class="fa-solid fa-arrows-up-down w-4"></i><span>높이: 이 트랙</span><i class="fa-solid fa-chevron-right ml-auto text-[8px]"></i></div>
                <div class="ctx-item has-submenu" @mouseenter="openHeightSubmenu($event, 'all')" @mouseleave="scheduleCloseHeightSubmenu"><i class="fa-solid fa-layer-group w-4"></i><span>높이: 전체</span><i class="fa-solid fa-chevron-right ml-auto text-[8px]"></i></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item text-red-400" @click="deleteTrack(trackContextMenu.track, trackContextMenu.index)"><i class="fa-solid fa-trash w-4"></i><span>삭제</span></div>
            </div>
            
            <!-- 높이 서브메뉴 -->
            <div v-if="heightSubmenu.visible" class="context-menu context-menu--compact" :style="getHeightSubmenuStyle()" @mouseenter="cancelCloseHeightSubmenu" @mouseleave="scheduleCloseHeightSubmenu" @click.stop>
                <div class="ctx-item" @click="applyHeightPreset('low')"><i class="fa-solid fa-compress-alt w-4"></i><span>낮음 (20px)</span></div>
                <div class="ctx-item" @click="applyHeightPreset('medium')"><i class="fa-solid fa-minus w-4"></i><span>중간 (40px)</span></div>
                <div class="ctx-item" @click="applyHeightPreset('high')"><i class="fa-solid fa-expand-alt w-4"></i><span>높음 (80px)</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item" @click="enableWheelAdjust"><i class="fa-solid fa-mouse w-4"></i><span>휠로 조절</span></div>
            </div>
            
            <!-- 클립 컨텍스트 메뉴 -->
            <div v-if="clipContextMenu" class="context-menu context-menu--compact" :style="getContextMenuStyle(clipContextMenu)" @click.stop>
                <template v-if="clipContextMenu.clip">
                    <div class="ctx-item" :class="{ disabled: !isClipAtPlayhead(clipContextMenu.clip) }" @click="isClipAtPlayhead(clipContextMenu.clip) && cutAtPlayheadForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>플레이헤드에서 자르기</span></div>
                    <div class="ctx-item" :class="{ disabled: !isClipAtPlayhead(clipContextMenu.clip) }" @click="isClipAtPlayhead(clipContextMenu.clip) && cutAndDeleteLeftForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>자르기 + 왼쪽 삭제</span></div>
                    <div class="ctx-item" :class="{ disabled: !isClipAtPlayhead(clipContextMenu.clip) }" @click="isClipAtPlayhead(clipContextMenu.clip) && cutAndDeleteRightForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>자르기 + 오른쪽 삭제</span></div>
                    <div class="h-px bg-ui-border my-1"></div>
                    <!-- 편집 서브메뉴 -->
                    <div class="ctx-item has-submenu" @mouseenter="openEditSubmenu($event)" @mouseleave="scheduleCloseEditSubmenu"><i class="fa-solid fa-pen-to-square w-4"></i><span>편집</span><i class="fa-solid fa-chevron-right ml-auto text-[8px]"></i></div>
                    <div class="h-px bg-ui-border my-1"></div>
                    <div class="ctx-item" :class="{ disabled: !canExtractAudio(clipContextMenu.clip) }" @click="canExtractAudio(clipContextMenu.clip) && extractAudioFromClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-music w-4"></i><span>사운드 분리</span></div>
                    <div class="ctx-item" @click="toggleClipMute(clipContextMenu.clip); closeContextMenus()"><i :class="clipContextMenu.clip.isMuted ? 'fa-solid fa-volume-xmark w-4' : 'fa-solid fa-volume-high w-4'"></i><span>{{ clipContextMenu.clip.isMuted ? '음소거 해제' : '음소거' }}</span></div>
                    <div class="h-px bg-ui-border my-1"></div>
                    <div class="ctx-item" @click="exportClipToAsset(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-file-export w-4"></i><span>미디어 자산으로 내보내기</span></div>
                    <div class="ctx-item" @click="openVolumePopup($event, clipContextMenu.clip)"><i class="fa-solid fa-volume-high w-4"></i><span>볼륨 ({{ clipContextMenu.clip.volume || 100 }}%)</span></div>
                    <div class="ctx-item" @click="duplicateClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-copy w-4"></i><span>클립 복제</span></div>
                    <div class="h-px bg-ui-border my-1"></div>
                    <div class="ctx-item text-red-400" @click="deleteClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-trash w-4"></i><span>클립 삭제</span></div>
                </template>
                <template v-else>
                    <div class="ctx-item" @click="addClipAtPosition(); closeContextMenus()"><i class="fa-solid fa-plus w-4"></i><span>빈 클립 추가</span></div>
                </template>
            </div>
            
            <!-- 편집 서브메뉴 -->
            <div v-if="editSubmenu.visible" class="context-menu context-menu--compact" :style="getEditSubmenuStyle()" @mouseenter="cancelCloseEditSubmenu" @mouseleave="scheduleCloseEditSubmenu" @click.stop>
                <div class="ctx-item" :class="{ disabled: selectedClipIds.length < 2 }" @click="mergeSelectedClips"><i class="fa-solid fa-object-group w-4"></i><span>클립 합치기</span><span v-if="selectedClipIds.length >= 2" class="ml-auto text-text-sub text-[9px]">({{ selectedClipIds.length }})</span></div>
                <div class="ctx-item" @click="openSpeedEditor"><i class="fa-solid fa-gauge-high w-4"></i><span>재생 속도 조절</span></div>
            </div>
            
            <!-- 속도 조절 팝업 -->
            <div v-if="speedEditorPopup.visible" class="speed-editor-popup" :style="{ top: speedEditorPopup.y + 'px', left: speedEditorPopup.x + 'px' }" @mousedown.stop @click.stop>
                <div class="speed-editor-popup__header">
                    <span class="speed-editor-popup__title">재생 속도 조절</span>
                    <button class="speed-editor-popup__close" @click="closeSpeedEditor"><i class="fa-solid fa-times"></i></button>
                </div>
                <div class="speed-editor-popup__body">
                    <div class="speed-editor-popup__presets">
                        <button v-for="preset in speedPresets" :key="preset.value" class="speed-preset-btn" :class="{ active: speedEditorPopup.speed === preset.value }" @click="setClipSpeed(preset.value)">{{ preset.label }}</button>
                    </div>
                    <div class="speed-editor-popup__custom">
                        <span class="speed-editor-popup__label">속도</span>
                        <input type="range" min="0.25" max="4" step="0.05" :value="speedEditorPopup.speed" @input="setClipSpeed(parseFloat($event.target.value))" class="speed-slider" />
                        <input type="number" min="0.25" max="4" step="0.05" :value="speedEditorPopup.speed" @input="setClipSpeed(parseFloat($event.target.value))" class="speed-input" />
                        <span class="speed-editor-popup__unit">x</span>
                    </div>
                    <div class="speed-editor-popup__info">
                        <span>원본: {{ formatClipDuration(speedEditorPopup.originalDuration) }}</span>
                        <span>→</span>
                        <span>결과: {{ formatClipDuration(speedEditorPopup.resultDuration) }}</span>
                    </div>
                </div>
                <div class="speed-editor-popup__footer">
                    <button class="speed-editor-popup__btn speed-editor-popup__btn--cancel" @click="closeSpeedEditor">취소</button>
                    <button class="speed-editor-popup__btn speed-editor-popup__btn--apply" @click="applyClipSpeed">적용</button>
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            trackHeaderWidth: 180, initialHeaderWidth: 180, minHeaderWidth: 60, collapsedHeaderWidth: 28, 
            isResizingHeader: false, resizeStartX: 0, resizeStartWidth: 0, isTrackHeaderCollapsed: false, isHoveringHeaderArea: false,
            trackContextMenu: null, clipContextMenu: null,
            draggingTrackId: null, draggingTrackIndex: null, dragOverTrackId: null,
            trackHeights: {}, isResizingTrack: false, resizingTrackId: null, resizeStartY: 0, resizeStartHeight: 0,
            minTrackHeight: 20, defaultTrackHeight: 40,
            trackHeightPresets: { low: 20, medium: 40, high: 80, default: 40 },
            heightSubmenu: { visible: false, x: 0, y: 0, target: 'this' }, heightSubmenuCloseTimer: null,
            // 편집 서브메뉴
            editSubmenu: { visible: false, x: 0, y: 0 }, editSubmenuCloseTimer: null,
            // 속도 조절 팝업
            speedEditorPopup: { visible: false, x: 0, y: 0, clip: null, speed: 1.0, originalDuration: 0, resultDuration: 0, originalSpeed: 1.0 },
            speedPresets: [
                { value: 0.25, label: '0.25x' },
                { value: 0.5, label: '0.5x' },
                { value: 0.75, label: '0.75x' },
                { value: 1.0, label: '1x' },
                { value: 1.25, label: '1.25x' },
                { value: 1.5, label: '1.5x' },
                { value: 2.0, label: '2x' },
                { value: 4.0, label: '4x' }
            ],
            wheelAdjustMode: { active: false, target: 'this' },
            selectedClipIds: [], lastSelectedClipId: null, lastSelectedTrackId: null,
            isDraggingClip: false, draggingClipIds: [], dragStartX: 0, dragStartY: 0, dragStartScrollLeft: 0,
            dragOriginalState: {}, currentDragTrackIndex: null, originalTrackIndex: null,
            dragGhost: { visible: false, style: {}, name: '', bgColor: '' },
            dragClipOffset: 0,
            isResizingClip: false, resizingClip: null, resizeDirection: null, 
            resizeStartClipStart: 0, resizeStartClipDuration: 0, resizeOriginalState: null,
            isDraggingPlayhead: false, pendingClickClipId: null, pendingClickModifiers: null,
            isResolutionDropdownOpen: false, isAspectDropdownOpen: false, 
            isExternalDragOver: false, isDraggingClipOut: false, clipDragOutData: null,
            aspectRatioOptions: [
                { value: '원본', label: '원본' }, { value: '16:9', label: '16:9' },
                { value: '9:16', label: '9:16' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' }
            ],
            resolutionOptions: [
                { value: '4K', label: '4K', pixels: '3840×2160' },
                { value: 'FHD', label: 'FHD', pixels: '1920×1080' },
                { value: 'HD', label: 'HD', pixels: '1280×720' }
            ],
            dropIndicator: { visible: false, trackId: null, left: 0, width: 0 },
            FILMSTRIP_FRAME_WIDTH: 40, MIN_FILMSTRIP_FRAME_WIDTH: 20, MAX_FILMSTRIP_FRAME_WIDTH: 80,
            MAX_RULER_MARKS: 200, MIN_RULER_LABEL_SPACING: 60, CLIP_MIN_GAP: 0.01,
            masterVolume: 100, previousVolume: 100, isDraggingMasterVolume: false,
            showMasterVolume: false, masterVolumeHideTimer: null,
            isDraggingClipVolume: false, volumeDragClip: null, volumeDragStartY: 0, volumeDragStartVolume: 0,
            volumePopup: { visible: false, x: 0, y: 0, clip: null, value: 100 }, isDraggingVolumePopup: false,
            thumbnailCache: {}, videoMetaCache: {}, trackYPositions: [], isMouseInLane: false,
            contextMenuWidth: 180, contextMenuHeight: 400, submenuWidth: 160, submenuHeight: 140
        };
    },
    computed: {
        formattedTime: function() { 
            var t = this.vm.currentTime || 0, h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s = Math.floor(t%60), f = Math.floor((t-Math.floor(t))*30);
            var pad = function(n) { return String(n).padStart(2,'0'); };
            return pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
        },
        maxClipEnd: function() { var max = 60; this.vm.clips.forEach(function(c) { if (c.start + c.duration > max) max = c.start + c.duration; }); return max; },
        totalDuration: function() { return Math.max(300, this.maxClipEnd + 60); },
        totalTimelineWidth: function() { return this.totalDuration * this.pixelsPerSecond; },
        totalTrackHeight: function() { var total = 0; var self = this; this.vm.tracks.forEach(function(t) { total += self.getTrackHeight(t.id); }); return total; },
        currentHeaderWidth: function() { return this.isTrackHeaderCollapsed ? this.collapsedHeaderWidth : this.trackHeaderWidth; },
        visibleRulerMarks: function() {
            var marks = [], pps = this.pixelsPerSecond, startTime = this.visibleTimeRange.startTime, endTime = this.visibleTimeRange.endTime;
            var majorInt, minorInt, microInt;
            if (pps >= 150) { majorInt = 1; minorInt = 0.5; microInt = 0.1; }
            else if (pps >= 100) { majorInt = 1; minorInt = 0.5; microInt = 0.25; }
            else if (pps >= 50) { majorInt = 2; minorInt = 1; microInt = 0.5; }
            else if (pps >= 20) { majorInt = 5; minorInt = 1; microInt = null; }
            else if (pps >= 10) { majorInt = 10; minorInt = 5; microInt = 1; }
            else if (pps >= 5) { majorInt = 30; minorInt = 10; microInt = 5; }
            else if (pps >= 2) { majorInt = 60; minorInt = 30; microInt = 10; }
            else { majorInt = 120; minorInt = 60; microInt = 30; }
            var smallest = microInt || minorInt, alignedStart = Math.floor(startTime / smallest) * smallest;
            var self = this, lastLabelPosition = -this.MIN_RULER_LABEL_SPACING;
            for (var t = alignedStart; t <= endTime && marks.length < this.MAX_RULER_MARKS; t += smallest) {
                if (t < 0) continue;
                var time = Math.round(t * 1000) / 1000, pos = time * pps;
                var isMajor = Math.abs(time % majorInt) < 0.001, isMid = !isMajor && Math.abs(time % minorInt) < 0.001;
                var label = '';
                if (isMajor && (pos - lastLabelPosition) >= self.MIN_RULER_LABEL_SPACING) { label = self.formatRulerTime(time); lastLabelPosition = pos; }
                marks.push({ time: time, position: pos, isMajor: isMajor, isMid: isMid, label: label });
            }
            return marks;
        },
        hasSelectedClips: function() { return this.selectedClipIds.length > 0; },
        mainTrack: function() { return this.vm.tracks.find(function(t) { return t.isMain; }) || null; },
        mainTrackClipAtPlayhead: function() {
            var self = this;
            if (!this.mainTrack) return null;
            var currentTime = this.vm.currentTime;
            return this.vm.clips.find(function(c) {
                return c.trackId === self.mainTrack.id && currentTime > c.start && currentTime < c.start + c.duration;
            }) || null;
        },
        canEditAtPlayhead: function() {
            if (this.hasSelectedClips) {
                var self = this;
                return this.selectedClipIds.some(function(cid) {
                    var c = self.vm.clips.find(function(cl) { return cl.id === cid; });
                    return c && self.isClipAtPlayhead(c);
                });
            }
            return this.mainTrackClipAtPlayhead !== null;
        }
    },
    watch: {
        'vm.clips': { handler: function() { if (!this.isUndoRedoAction && !this.isDraggingClip && !this.isResizingClip) { this.saveToHistory(); } this.generateThumbnailsForNewClips(); this.analyzeAudioLevelsForClips(); }, deep: true },
        'vm.tracks': { handler: function() { if (!this.isUndoRedoAction) this.saveToHistory(); this.updateTrackYPositions(); }, deep: true },
        'vm.zoom': { handler: function(v) { if (v && v !== this.currentDisplayZoom) this.currentDisplayZoom = v; }, immediate: true },
        masterVolume: function(v) { if (window.PreviewRenderer) window.PreviewRenderer.setMasterVolume(v / 100); document.querySelectorAll('video, audio').forEach(function(el) { el.volume = v / 100; }); },
        trackHeights: { handler: function() { this.updateTrackYPositions(); }, deep: true },
        'vm.currentTime': function(newTime) { if (window.PreviewRenderer && typeof window.PreviewRenderer.setCurrentTime === 'function') window.PreviewRenderer.setCurrentTime(newTime); }
    },
    mounted: function() {
        var self = this;
        this.$nextTick(function() {
            self.adjustLayout(); self.injectStyles(); self.initTrackHeights();
            self.currentDisplayZoom = self.vm.zoom || 20; self.saveToHistory();
            self.calculateDynamicZoomRange(); self.updateViewportSize(); self.updateTrackYPositions();
            window.addEventListener('resize', self.onWindowResize);
            document.addEventListener('click', self.onDocumentClick);
            document.addEventListener('mousemove', self.onDocumentMouseMove);
            document.addEventListener('mouseup', self.onDocumentMouseUp);
            document.addEventListener('keydown', self.onDocumentKeyDown);
            self.generateThumbnailsForNewClips(); self.analyzeAudioLevelsForClips();
        });
    },
    beforeUnmount: function() {
        window.removeEventListener('resize', this.onWindowResize);
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        document.removeEventListener('mouseup', this.onDocumentMouseUp);
        document.removeEventListener('keydown', this.onDocumentKeyDown);
        if (this.masterVolumeHideTimer) clearTimeout(this.masterVolumeHideTimer);
        if (this.heightSubmenuCloseTimer) clearTimeout(this.heightSubmenuCloseTimer);
        if (this.editSubmenuCloseTimer) clearTimeout(this.editSubmenuCloseTimer);
    },
    methods: {
        // 트랙 번호 생성 (아래부터 1번)
        getTrackPlaceholder: function(index) {
            var trackNumber = this.vm.tracks.length - index;
            return 'Track ' + trackNumber;
        },
        
        getEditButtonTitle: function(baseTitle) {
            if (this.hasSelectedClips) return baseTitle;
            else if (this.mainTrackClipAtPlayhead) return baseTitle + ' (메인트랙)';
            return '클립을 먼저 선택하세요';
        },
        getEditTargetClips: function() {
            var self = this;
            if (this.hasSelectedClips) {
                return this.selectedClipIds.map(function(cid) {
                    return self.vm.clips.find(function(cl) { return cl.id === cid; });
                }).filter(function(c) { return c && self.isClipAtPlayhead(c); });
            } else if (this.mainTrackClipAtPlayhead) {
                return [this.mainTrackClipAtPlayhead];
            }
            return [];
        },
        getContextMenuStyle: function(menu) { if (!menu) return {}; var x = menu.x, y = menu.y, vw = window.innerWidth, vh = window.innerHeight; if (x + this.contextMenuWidth > vw) x = vw - this.contextMenuWidth - 10; if (y + this.contextMenuHeight > vh) y = vh - this.contextMenuHeight - 10; if (x < 10) x = 10; if (y < 10) y = 10; return { top: y + 'px', left: x + 'px' }; },
        getHeightSubmenuStyle: function() { var x = this.heightSubmenu.x, y = this.heightSubmenu.y, vw = window.innerWidth, vh = window.innerHeight; if (x + this.submenuWidth > vw) x = this.heightSubmenu.x - this.submenuWidth - this.contextMenuWidth; if (y + this.submenuHeight > vh) y = vh - this.submenuHeight - 10; if (x < 10) x = 10; if (y < 10) y = 10; return { top: y + 'px', left: x + 'px' }; },
        // 편집 서브메뉴 스타일
        getEditSubmenuStyle: function() { 
            var x = this.editSubmenu.x, y = this.editSubmenu.y, vw = window.innerWidth, vh = window.innerHeight; 
            if (x + this.submenuWidth > vw) x = this.editSubmenu.x - this.submenuWidth - this.contextMenuWidth; 
            if (y + 80 > vh) y = vh - 90; 
            if (x < 10) x = 10; 
            if (y < 10) y = 10; 
            return { top: y + 'px', left: x + 'px' }; 
        },
        onHeaderAreaEnter: function() { this.isHoveringHeaderArea = true; },
        onHeaderAreaLeave: function() { this.isHoveringHeaderArea = false; },
        collapseTrackHeader: function() { this.isTrackHeaderCollapsed = true; },
        expandTrackHeader: function() { this.isTrackHeaderCollapsed = false; },
        onHeaderScroll: function(e) { var sc = this.$refs.timelineScrollContainer; if (sc && !this._syncingScroll) { this._syncingScroll = true; sc.scrollTop = e.target.scrollTop; var self = this; this.$nextTick(function() { self._syncingScroll = false; }); } },
        onTrackHeaderWheel: function(e, track) { if (this.wheelAdjustMode.active) { e.preventDefault(); e.stopPropagation(); var delta = e.deltaY > 0 ? -5 : 5; var self = this; if (this.wheelAdjustMode.target === 'all') { this.vm.tracks.forEach(function(t) { var h = self.getTrackHeight(t.id); self.trackHeights[t.id] = Math.max(self.minTrackHeight, Math.min(120, h + delta)); }); } else { var h = this.getTrackHeight(track.id); this.trackHeights[track.id] = Math.max(this.minTrackHeight, Math.min(120, h + delta)); } this.trackHeights = Object.assign({}, this.trackHeights); } },
        openHeightSubmenu: function(e, target) { if (this.heightSubmenuCloseTimer) { clearTimeout(this.heightSubmenuCloseTimer); this.heightSubmenuCloseTimer = null; } var rect = e.currentTarget.getBoundingClientRect(); this.heightSubmenu = { visible: true, x: rect.right, y: rect.top, target: target }; },
        scheduleCloseHeightSubmenu: function() { var self = this; this.heightSubmenuCloseTimer = setTimeout(function() { self.heightSubmenu.visible = false; }, 150); },
        cancelCloseHeightSubmenu: function() { if (this.heightSubmenuCloseTimer) { clearTimeout(this.heightSubmenuCloseTimer); this.heightSubmenuCloseTimer = null; } },
        // 편집 서브메뉴
        openEditSubmenu: function(e) { 
            if (this.editSubmenuCloseTimer) { clearTimeout(this.editSubmenuCloseTimer); this.editSubmenuCloseTimer = null; } 
            var rect = e.currentTarget.getBoundingClientRect(); 
            this.editSubmenu = { visible: true, x: rect.right, y: rect.top }; 
        },
        scheduleCloseEditSubmenu: function() { 
            var self = this; 
            this.editSubmenuCloseTimer = setTimeout(function() { self.editSubmenu.visible = false; }, 150); 
        },
        cancelCloseEditSubmenu: function() { 
            if (this.editSubmenuCloseTimer) { clearTimeout(this.editSubmenuCloseTimer); this.editSubmenuCloseTimer = null; } 
        },
        applyHeightPreset: function(preset) { var height = this.trackHeightPresets[preset] || this.trackHeightPresets.default; var self = this; if (this.heightSubmenu.target === 'all') { this.vm.tracks.forEach(function(t) { self.trackHeights[t.id] = height; }); } else if (this.trackContextMenu && this.trackContextMenu.track) { this.trackHeights[this.trackContextMenu.track.id] = height; } this.trackHeights = Object.assign({}, this.trackHeights); this.closeContextMenus(); },
        enableWheelAdjust: function() { this.wheelAdjustMode = { active: true, target: this.heightSubmenu.target }; this.closeContextMenus(); var self = this; setTimeout(function() { self.wheelAdjustMode.active = false; }, 5000); },
        toggleAspectDropdown: function() { this.isAspectDropdownOpen = !this.isAspectDropdownOpen; if (this.isAspectDropdownOpen) this.isResolutionDropdownOpen = false; },
        selectAspectRatio: function(value) { if (this.vm) { this.vm.aspectRatio = value; this.applyAspectRatio(value); } this.isAspectDropdownOpen = false; },
        applyAspectRatio: function(ratio) { if (!this.vm) return; var baseWidth = this.getBaseWidth(); var newW, newH; switch(ratio) { case '원본': var os = this.getOriginalVideoSize(); if (os) { newW = os.width; newH = os.height; } else { newW = 1920; newH = 1080; } break; case '16:9': newW = baseWidth; newH = Math.round(baseWidth * 9 / 16); break; case '9:16': newH = baseWidth; newW = Math.round(baseWidth * 9 / 16); break; case '4:3': newW = baseWidth; newH = Math.round(baseWidth * 3 / 4); break; case '1:1': newW = baseWidth; newH = baseWidth; break; default: newW = 1920; newH = 1080; } this.vm.canvasSize = { w: newW, h: newH }; var self = this; this.$nextTick(function() { if (typeof self.vm.recalculateCanvasScale === 'function') self.vm.recalculateCanvasScale(); }); },
        getBaseWidth: function() { switch(this.vm.resolution) { case '4K': return 3840; case 'FHD': return 1920; case 'HD': return 1280; default: return 1920; } },
        getOriginalVideoSize: function() { var currentTime = this.vm.currentTime; var self = this; var activeVideoClip = this.vm.clips.find(function(clip) { if (clip.type !== 'video') return false; return currentTime >= clip.start && currentTime < clip.start + clip.duration; }); if (activeVideoClip && activeVideoClip.src) { var meta = this.videoMetaCache[activeVideoClip.id]; if (meta) return { width: meta.width, height: meta.height }; } return null; },
        cacheVideoMetadata: function(clip) { if (!clip.src || clip.type !== 'video' || this.videoMetaCache[clip.id]) return; var self = this; var video = document.createElement('video'); video.preload = 'metadata'; video.onloadedmetadata = function() { self.videoMetaCache[clip.id] = { width: video.videoWidth, height: video.videoHeight, duration: video.duration }; video.remove(); if (self.vm.aspectRatio === '원본') { var ct = self.vm.currentTime; if (ct >= clip.start && ct < clip.start + clip.duration) self.applyAspectRatio('원본'); } }; video.src = clip.src; },
        toggleResolutionDropdown: function() { this.isResolutionDropdownOpen = !this.isResolutionDropdownOpen; if (this.isResolutionDropdownOpen) this.isAspectDropdownOpen = false; },
        selectResolution: function(v) { if (this.vm) { this.vm.resolution = v; this.applyAspectRatio(this.vm.aspectRatio); } this.isResolutionDropdownOpen = false; },
        onMasterVolumeLeave: function() { if (this.isDraggingMasterVolume) return; var self = this; this.masterVolumeHideTimer = setTimeout(function() { if (!self.isDraggingMasterVolume) self.showMasterVolume = false; }, 200); },
        onMasterVolumeWheel: function(e) { e.stopPropagation(); this.masterVolume = Math.max(0, Math.min(100, this.masterVolume + (e.deltaY > 0 ? -5 : 5))); },
        toggleMute: function() { if (this.masterVolume > 0) { this.previousVolume = this.masterVolume; this.masterVolume = 0; } else { this.masterVolume = this.previousVolume || 100; } },
        startMasterVolumeDrag: function(e) { this.isDraggingMasterVolume = true; if (this.masterVolumeHideTimer) { clearTimeout(this.masterVolumeHideTimer); this.masterVolumeHideTimer = null; } this.updateMasterVolumeFromEvent(e); },
        updateMasterVolumeFromEvent: function(e) { var track = e.target.closest('.volume-track'); if (!track) return; var rect = track.getBoundingClientRect(); this.masterVolume = Math.round(Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100))); },
        onTimelineScroll: function(e) { this.scrollLeft = e.target.scrollLeft; var headerList = this.$refs.trackHeaderList; if (headerList && !this._syncingScroll) { this._syncingScroll = true; headerList.scrollTop = e.target.scrollTop; var self = this; this.$nextTick(function() { self._syncingScroll = false; }); } },
        updateTrackYPositions: function() { var accY = 0; var self = this; this.trackYPositions = this.vm.tracks.map(function(track) { var h = self.getTrackHeight(track.id); var pos = { id: track.id, top: accY, bottom: accY + h, height: h }; accY += h; return pos; }); },
        getTrackIndexFromY: function(relativeY) { for (var i = 0; i < this.trackYPositions.length; i++) { var pos = this.trackYPositions[i]; if (relativeY >= pos.top && relativeY < pos.bottom) return i; } return relativeY < 0 ? 0 : this.trackYPositions.length - 1; },
        getTrackHeight: function(trackId) { return this.trackHeights[trackId] || this.defaultTrackHeight; },
        injectStyles: function() { if (document.getElementById('timeline-custom-styles')) return; var style = document.createElement('style'); style.id = 'timeline-custom-styles'; style.textContent = '.playhead-line-body{position:absolute;top:24px;width:1px;background:#ef4444;pointer-events:none;z-index:35;transform:translateX(-0.5px);}.playhead-head{position:absolute;top:2px;width:10px;height:16px;background:transparent;border:1px solid #ef4444;border-radius:0 0 3px 3px;transform:translateX(-5px);cursor:ew-resize;z-index:50;}.playhead-head::after{content:"";position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);border-left:4px solid transparent;border-right:4px solid transparent;border-top:4px solid #ef4444;}.timeline-select-no-arrow{-webkit-appearance:none;-moz-appearance:none;appearance:none;}.master-volume-popup{display:none;}.master-volume-popup.show{display:flex;}.track-header-container{position:relative;display:flex;flex-direction:column;overflow:hidden;}.track-header-list{scrollbar-width:none;-ms-overflow-style:none;}.track-header-list::-webkit-scrollbar{display:none;}.track-header-inner{position:relative;}.has-submenu{position:relative;}.clip.dragging{opacity:0.5;}.clip-drag-ghost{position:absolute;pointer-events:none;z-index:1000;border-radius:4px;border:2px solid rgba(255,255,255,0.8);box-shadow:0 4px 12px rgba(0,0,0,0.4);overflow:hidden;}.header-resize-handle{position:absolute;right:0;width:3px;cursor:col-resize;background:transparent;z-index:60;transition:background 0.15s;}.header-resize-handle:hover,.header-resize-handle.resizing{background:#3b82f6;}.timeline-scroll-enhanced::-webkit-scrollbar{width:8px;height:8px;}.timeline-scroll-enhanced::-webkit-scrollbar-track{background:rgba(0,0,0,0.1);}.timeline-scroll-enhanced::-webkit-scrollbar-thumb{background:rgba(100,100,100,0.5);border-radius:4px;}.timeline-scroll-enhanced:hover::-webkit-scrollbar{width:14px;height:14px;}.timeline-scroll-enhanced:hover::-webkit-scrollbar-thumb{background:rgba(100,100,100,0.7);}.timeline-scroll-enhanced{scrollbar-width:thin;scrollbar-color:rgba(100,100,100,0.5) rgba(0,0,0,0.1);}.clip-filmstrip{display:flex;overflow:hidden;}.clip-filmstrip-frame{flex-shrink:0;height:100%;background-size:cover;background-position:center;background-repeat:no-repeat;border-right:1px solid rgba(0,0,0,0.3);}.clip-waveform-bars{position:absolute;inset:0;display:flex;align-items:flex-end;gap:1px;padding:2px;}.clip-waveform-bar{position:absolute;bottom:0;background:rgba(59,130,246,0.7);border-radius:1px 1px 0 0;min-height:2px;transition:background 0.1s;}.clip-waveform-bar.silent{background:rgba(100,100,100,0.3);}.clip.sound .clip-waveform-bar{background:rgba(34,197,94,0.7);}.clip.sound .clip-waveform-bar.silent{background:rgba(100,100,100,0.3);}'; document.head.appendChild(style); },
        generateThumbnailsForNewClips: function() { var self = this; this.vm.clips.forEach(function(clip) { if (clip.type === 'video' && clip.src) { if (!self.thumbnailCache[clip.id]) self.generateVideoThumbnails(clip); self.cacheVideoMetadata(clip); } }); },
        generateVideoThumbnails: function(clip) { if (!clip.src) return; var self = this; var video = document.createElement('video'); video.crossOrigin = 'anonymous'; video.muted = true; video.preload = 'metadata'; video.onloadedmetadata = function() { var duration = video.duration || clip.duration || 10; var frameCount = Math.min(60, Math.max(10, Math.ceil(duration))); var frames = {}; var loaded = 0; var captureFrame = function(index) { video.currentTime = (index / frameCount) * duration; }; video.onseeked = function() { var canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 45; var ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0, canvas.width, canvas.height); try { frames[loaded] = canvas.toDataURL('image/jpeg', 0.6); } catch (err) { frames[loaded] = null; } loaded++; if (loaded < frameCount) captureFrame(loaded); else { self.thumbnailCache[clip.id] = frames; video.remove(); } }; captureFrame(0); }; video.onerror = function() { self.thumbnailCache[clip.id] = {}; }; video.src = clip.src; },
        getFilmstripFrames: function(clip) { var clipPixelWidth = this.getClipPixelWidth(clip); var pps = this.pixelsPerSecond; var dynamicFrameWidth; if (pps >= 100) dynamicFrameWidth = this.MAX_FILMSTRIP_FRAME_WIDTH; else if (pps >= 50) dynamicFrameWidth = 60; else if (pps >= 20) dynamicFrameWidth = this.FILMSTRIP_FRAME_WIDTH; else if (pps >= 10) dynamicFrameWidth = 30; else dynamicFrameWidth = this.MIN_FILMSTRIP_FRAME_WIDTH; var frameCount = Math.max(1, Math.ceil(clipPixelWidth / dynamicFrameWidth)); var actualFrameWidth = clipPixelWidth / frameCount; var frames = []; var cached = this.thumbnailCache[clip.id] || {}; var cachedKeys = Object.keys(cached); var cachedCount = cachedKeys.length; for (var i = 0; i < frameCount; i++) { var framePosition = i / frameCount; var thumbnailIndex = Math.floor(framePosition * cachedCount); var src = cached[thumbnailIndex] || (clip.type === 'image' ? clip.src : null); frames.push({ width: actualFrameWidth, src: src }); } return frames; },
        getClipStyle: function(clip, track) { var h = this.getTrackHeight(track.id); var isDraggingThis = this.isDraggingClip && this.draggingClipIds.indexOf(clip.id) >= 0; return { left: clip.start * this.pixelsPerSecond + 'px', width: Math.max(20, clip.duration * this.pixelsPerSecond) + 'px', top: '1px', height: (h - 2) + 'px', opacity: isDraggingThis ? '0.5' : '1' }; },
        getClipClasses: function(clip) { var sel = this.selectedClipIds.indexOf(clip.id) >= 0; var isDraggingThis = this.isDraggingClip && this.draggingClipIds.indexOf(clip.id) >= 0; var classes = { 'clip-selected': sel && this.selectedClipIds.length === 1, 'clip-multi-selected': sel && this.selectedClipIds.length > 1, 'dragging': isDraggingThis }; if (clip.type === 'sound') classes['sound'] = true; if (clip.type === 'video') classes['video'] = true; if (clip.type === 'image') classes['image'] = true; return classes; },
        getClipPixelWidth: function(clip) { return Math.max(20, clip.duration * this.pixelsPerSecond); },
        getClipBackgroundStyle: function(clip, track) { return { background: 'linear-gradient(180deg, ' + (track.color || '#3b82f6') + '50 0%, ' + (track.color || '#3b82f6') + '30 100%)' }; },
        selectClip: function(clipId, mod) { mod = mod || {}; var self = this; var clip = this.vm.clips.find(function(c) { return c.id === clipId; }); if (!clip) return; if (mod.ctrlKey || mod.metaKey) { var idx = this.selectedClipIds.indexOf(clipId); if (idx >= 0) this.selectedClipIds.splice(idx, 1); else this.selectedClipIds.push(clipId); } else if (mod.shiftKey && this.lastSelectedClipId && this.lastSelectedTrackId === clip.trackId) { var tc = this.vm.clips.filter(function(c) { return c.trackId === clip.trackId; }).sort(function(a, b) { return a.start - b.start; }); var li = -1, ci = -1; for (var i = 0; i < tc.length; i++) { if (tc[i].id === self.lastSelectedClipId) li = i; if (tc[i].id === clipId) ci = i; } if (li >= 0 && ci >= 0) this.selectedClipIds = tc.slice(Math.min(li, ci), Math.max(li, ci) + 1).map(function(c) { return c.id; }); } else { this.selectedClipIds = [clipId]; } this.lastSelectedClipId = clipId; this.lastSelectedTrackId = clip.trackId; this.syncVmSelectedClip(); },
        clearSelection: function() { this.selectedClipIds = []; this.lastSelectedClipId = null; this.lastSelectedTrackId = null; this.syncVmSelectedClip(); },
        syncVmSelectedClip: function() { var self = this; this.vm.selectedClip = this.selectedClipIds.length === 1 ? this.vm.clips.find(function(c) { return c.id === self.selectedClipIds[0]; }) || null : null; },
        
        // 개선된 onClipMouseDown - 클립 내 클릭 오프셋 저장
        onClipMouseDown: function(e, clip, track) {
            if (track.isLocked) return;
            
            var lane = document.getElementById('timeline-lane-container');
            var laneRect = lane ? lane.getBoundingClientRect() : null;
            var clipStartPx = clip.start * this.pixelsPerSecond;
            var clickXInLane = laneRect ? (e.clientX - laneRect.left) : 0;
            this.dragClipOffset = clickXInLane - clipStartPx;
            
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            var sc = this.$refs.timelineScrollContainer;
            this.dragStartScrollLeft = sc ? sc.scrollLeft : 0;
            this.pendingClickClipId = clip.id;
            this.pendingClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
            
            var trackIndex = -1;
            for (var i = 0; i < this.vm.tracks.length; i++) {
                if (this.vm.tracks[i].id === track.id) { trackIndex = i; break; }
            }
            this.currentDragTrackIndex = trackIndex;
            this.originalTrackIndex = trackIndex;
            
            // 다중 선택 상태에서 선택된 클립을 클릭하면 선택 유지
            if (this.selectedClipIds.indexOf(clip.id) < 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                this.selectedClipIds = [clip.id];
                this.lastSelectedClipId = clip.id;
                this.lastSelectedTrackId = clip.trackId;
                this.syncVmSelectedClip();
            }
            
            this.draggingClipIds = this.selectedClipIds.slice();
            if (this.draggingClipIds.indexOf(clip.id) < 0) this.draggingClipIds = [clip.id];
            
            this.dragOriginalState = {};
            var self = this;
            this.draggingClipIds.forEach(function(id) {
                var c = self.vm.clips.find(function(cl) { return cl.id === id; });
                if (c) self.dragOriginalState[id] = { start: c.start, trackId: c.trackId };
            });
        },
        
        onTrackLaneMouseDown: function(e, track) { if (!e.target.closest('.clip')) this.clearSelection(); },
        onDocumentClick: function(e) { 
            // 컨텍스트 메뉴 외부 클릭 시 닫기 (클립 선택은 유지)
            if (!e.target.closest('.context-menu') && !e.target.closest('.clip-volume-popup') && !e.target.closest('.speed-editor-popup')) {
                this.closeContextMenus(); 
            }
            if (!e.target.closest('.resolution-dropdown-wrapper')) this.isResolutionDropdownOpen = false; 
            if (!e.target.closest('.aspect-ratio-dropdown-wrapper')) this.isAspectDropdownOpen = false; 
            if (!e.target.closest('.clip-volume-popup') && !e.target.closest('.ctx-item')) this.volumePopup.visible = false; 
        },
        onDocumentKeyDown: function(e) { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(); return; } if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); this.redo(); return; } if (e.key === 'Delete' && this.hasSelectedClips) { e.preventDefault(); this.deleteSelectedClips(); return; } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); this.selectedClipIds = this.vm.clips.map(function(c) { return c.id; }); this.syncVmSelectedClip(); return; } if (e.key === 'Escape') { this.clearSelection(); this.isResolutionDropdownOpen = false; this.isAspectDropdownOpen = false; this.volumePopup.visible = false; this.speedEditorPopup.visible = false; this.wheelAdjustMode.active = false; if (this.isDraggingClip) { this.cancelDrag(); } return; } if (e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); this.cutAtPlayhead(); return; } if (e.shiftKey && e.key.toLowerCase() === 'a') { e.preventDefault(); this.cutAndDeleteLeftSelected(); return; } if (e.shiftKey && e.key.toLowerCase() === 'd') { e.preventDefault(); this.cutAndDeleteRightSelected(); return; } },
        
        // 개선된 onDocumentMouseMove - 직접 업데이트로 1:1 추적
        onDocumentMouseMove: function(e) {
            if (this.isResizingHeader && !this.isTrackHeaderCollapsed) {
                this.trackHeaderWidth = Math.max(this.minHeaderWidth, Math.min(this.initialHeaderWidth, this.resizeStartWidth + (e.clientX - this.resizeStartX)));
            }
            if (this.isResizingTrack && this.resizingTrackId) {
                this.trackHeights[this.resizingTrackId] = Math.max(this.minTrackHeight, this.resizeStartHeight + (e.clientY - this.resizeStartY));
                this.trackHeights = Object.assign({}, this.trackHeights);
            }
            if (this.isDraggingPlayhead) this.updatePlayheadPosition(e);
            if (this.isDraggingMasterVolume) this.updateMasterVolumeFromEvent(e);
            if (this.isDraggingVolumePopup) this.updateVolumePopupFromEvent(e);
            if (this.isDraggingClipVolume && this.volumeDragClip) {
                var dy = this.volumeDragStartY - e.clientY;
                var newVol = Math.max(0, Math.min(200, Math.round(this.volumeDragStartVolume + dy * 2)));
                this.volumeDragClip.volume = newVol;
                if (window.PreviewRenderer) window.PreviewRenderer.updateClipVolume(this.volumeDragClip.id, newVol / 100);
            }
            
            // 드래그 시작 감지
            if (this.pendingClickClipId && !this.isDraggingClip && this.draggingClipIds.length > 0) {
                if (Math.abs(e.clientX - this.dragStartX) > 3 || Math.abs(e.clientY - this.dragStartY) > 3) {
                    this.isDraggingClip = true;
                    this.pendingClickClipId = null;
                    this.createDragGhost();
                }
            }
            
            // 드래그 중 - 직접 업데이트 (RAF 제거)
            if (this.isDraggingClip && this.draggingClipIds.length > 0) {
                this.updateDragPosition(e);
            }
            
            if (this.isResizingClip && this.resizingClip) this.handleClipResize(e);
        },
        
        createDragGhost: function() {
            if (this.draggingClipIds.length === 0) return;
            var firstClipId = this.draggingClipIds[0];
            var firstClip = this.vm.clips.find(function(c) { return c.id === firstClipId; });
            if (!firstClip) return;
            var track = this.vm.tracks.find(function(t) { return t.id === firstClip.trackId; });
            var trackHeight = track ? this.getTrackHeight(track.id) : this.defaultTrackHeight;
            var clipWidth = firstClip.duration * this.pixelsPerSecond;
            var trackY = 0;
            for (var i = 0; i < this.vm.tracks.length; i++) {
                if (this.vm.tracks[i].id === firstClip.trackId) break;
                trackY += this.getTrackHeight(this.vm.tracks[i].id);
            }
            this.dragGhost = {
                visible: true,
                style: { left: (firstClip.start * this.pixelsPerSecond) + 'px', top: (trackY + 24 + 1) + 'px', width: clipWidth + 'px', height: (trackHeight - 2) + 'px' },
                name: firstClip.name || 'Clip',
                bgColor: track ? track.color : '#3b82f6'
            };
        },
        
        // 새 메서드: 드래그 위치 직접 업데이트
        updateDragPosition: function(e) {
            var lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            
            var rect = lane.getBoundingClientRect();
            var relY = e.clientY - rect.top - 24;
            var newIdx = this.getTrackIndexFromY(relY);
            
            if (newIdx !== -1 && newIdx !== this.currentDragTrackIndex) {
                var target = this.vm.tracks[newIdx];
                if (target && !target.isLocked) {
                    this.currentDragTrackIndex = newIdx;
                }
            }
            
            if (this.dragGhost.visible && this.draggingClipIds.length > 0) {
                var firstClipId = this.draggingClipIds[0];
                var firstClip = this.vm.clips.find(function(c) { return c.id === firstClipId; });
                if (!firstClip) return;
                
                // 마우스 위치에서 오프셋을 뺀 위치 계산 (1:1 추적)
                var mouseXInLane = e.clientX - rect.left;
                var newLeft = mouseXInLane - this.dragClipOffset;
                newLeft = Math.max(0, newLeft);
                
                var trackY = 0;
                for (var i = 0; i < this.currentDragTrackIndex && i < this.vm.tracks.length; i++) {
                    trackY += this.getTrackHeight(this.vm.tracks[i].id);
                }
                
                var targetTrack = this.vm.tracks[this.currentDragTrackIndex];
                var trackHeight = targetTrack ? this.getTrackHeight(targetTrack.id) : this.defaultTrackHeight;
                
                this.dragGhost.style = {
                    left: newLeft + 'px',
                    top: (trackY + 24 + 1) + 'px',
                    width: (firstClip.duration * this.pixelsPerSecond) + 'px',
                    height: (trackHeight - 2) + 'px'
                };
                
                if (targetTrack) {
                    this.dragGhost.bgColor = targetTrack.color || '#3b82f6';
                }
            }
        },
        
        onDocumentMouseUp: function(e) {
            if (this.isResizingClip && this.resizeOriginalState) {
                this.saveToHistory();
                this.resizeOriginalState = null;
            }
            if (this.isDraggingClip && this.draggingClipIds.length > 0) {
                this.finalizeDrop(e);
            }
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
            this.dragOriginalState = {};
            this.currentDragTrackIndex = null;
            this.originalTrackIndex = null;
            this.dragGhost.visible = false;
            this.dragClipOffset = 0;
            this.isResizingClip = false;
            this.resizingClip = null;
            if (this.isDraggingMasterVolume) this.isDraggingMasterVolume = false;
            this.isDraggingClipVolume = false;
            this.volumeDragClip = null;
            this.isDraggingVolumePopup = false;
        },
        
        // 개선된 finalizeDrop - 겹침 시 좌우 공간 탐색
        finalizeDrop: function(e) {
            var self = this;
            var lane = document.getElementById('timeline-lane-container');
            if (!lane) { this.restoreOriginalPositions(); return; }
            
            var rect = lane.getBoundingClientRect();
            var mouseXInLane = e.clientX - rect.left;
            var dropTime = Math.max(0, (mouseXInLane - this.dragClipOffset) / this.pixelsPerSecond);
            
            var newTrackId = null;
            var newTrackIndex = this.currentDragTrackIndex;
            if (newTrackIndex !== null && newTrackIndex >= 0 && newTrackIndex < this.vm.tracks.length) {
                newTrackId = this.vm.tracks[newTrackIndex].id;
            }
            
            // 각 클립에 대해 최적 위치 계산
            var allSuccess = true;
            this.draggingClipIds.forEach(function(id) {
                var clip = self.vm.clips.find(function(c) { return c.id === id; });
                var orig = self.dragOriginalState[id];
                if (!clip || !orig) return;
                
                var targetTrackId = newTrackId || orig.trackId;
                var desiredStart = dropTime;
                
                // 스냅 적용
                if (self.vm.isMagnet) {
                    var snap = self.findSnapPosition(desiredStart, clip, self.draggingClipIds);
                    if (snap.snapped) desiredStart = snap.position;
                }
                
                // 최적 위치 찾기 (겹침 시 좌우 공간 탐색)
                var finalPosition = self.findBestDropPosition(clip, targetTrackId, desiredStart, self.draggingClipIds);
                
                if (finalPosition !== null) {
                    clip.start = finalPosition;
                    clip.trackId = targetTrackId;
                } else {
                    // 공간 없음 - 원래 위치 유지
                    clip.start = orig.start;
                    clip.trackId = orig.trackId;
                    allSuccess = false;
                }
            });
            
            if (allSuccess) {
                this.saveToHistory();
            }
        },
        
        // 새 메서드: 최적 드롭 위치 찾기
        findBestDropPosition: function(clip, trackId, desiredStart, excludeIds) {
            excludeIds = excludeIds || [];
            var self = this;
            
            var trackClips = this.vm.clips.filter(function(c) {
                return c.trackId === trackId && c.id !== clip.id && excludeIds.indexOf(c.id) < 0;
            }).sort(function(a, b) { return a.start - b.start; });
            
            var duration = clip.duration;
            var clipEnd = desiredStart + duration;
            
            // 빈 트랙이면 바로 성공
            if (trackClips.length === 0) {
                return Math.max(0, desiredStart);
            }
            
            // 1. 원하는 위치에 공간이 있는지 확인
            if (!this.hasOverlapAt(desiredStart, duration, trackClips)) {
                return Math.max(0, desiredStart);
            }
            
            // 2. 겹치는 클립들 찾기
            var overlappingClips = trackClips.filter(function(other) {
                var otherEnd = other.start + other.duration;
                return desiredStart < otherEnd && clipEnd > other.start;
            });
            
            if (overlappingClips.length === 0) {
                return Math.max(0, desiredStart);
            }
            
            // 3. 좌우 공간 탐색
            var candidates = [];
            
            // 왼쪽 끝 (0 위치)
            if (!this.hasOverlapAt(0, duration, trackClips)) {
                candidates.push({ pos: 0, distance: desiredStart });
            }
            
            // 각 클립 뒤 공간
            for (var i = 0; i < trackClips.length; i++) {
                var afterPos = trackClips[i].start + trackClips[i].duration + this.CLIP_MIN_GAP;
                if (!this.hasOverlapAt(afterPos, duration, trackClips)) {
                    candidates.push({ pos: afterPos, distance: Math.abs(afterPos - desiredStart) });
                }
            }
            
            // 각 클립 앞 공간
            for (var j = 0; j < trackClips.length; j++) {
                var beforePos = trackClips[j].start - duration - this.CLIP_MIN_GAP;
                if (beforePos >= 0 && !this.hasOverlapAt(beforePos, duration, trackClips)) {
                    candidates.push({ pos: beforePos, distance: Math.abs(beforePos - desiredStart) });
                }
            }
            
            // 가장 가까운 후보 선택
            if (candidates.length > 0) {
                candidates.sort(function(a, b) { return a.distance - b.distance; });
                return candidates[0].pos;
            }
            
            // 공간 없음
            return null;
        },
        
        // 새 메서드: 특정 위치에 겹침이 있는지 확인
        hasOverlapAt: function(start, duration, trackClips) {
            var end = start + duration;
            for (var i = 0; i < trackClips.length; i++) {
                var other = trackClips[i];
                var otherEnd = other.start + other.duration;
                if (start < otherEnd - this.CLIP_MIN_GAP && end > other.start + this.CLIP_MIN_GAP) {
                    return true;
                }
            }
            return false;
        },
        
        restoreOriginalPositions: function() {
            var self = this;
            this.draggingClipIds.forEach(function(id) {
                var clip = self.vm.clips.find(function(c) { return c.id === id; });
                var orig = self.dragOriginalState[id];
                if (clip && orig) {
                    clip.start = orig.start;
                    clip.trackId = orig.trackId;
                }
            });
        },
        
        checkClipOverlap: function(clip, excludeIds) { excludeIds = excludeIds || []; var trackClips = this.vm.clips.filter(function(c) { return c.trackId === clip.trackId && c.id !== clip.id && excludeIds.indexOf(c.id) < 0; }); var clipEnd = clip.start + clip.duration; for (var i = 0; i < trackClips.length; i++) { var other = trackClips[i]; var otherEnd = other.start + other.duration; if (clip.start < otherEnd - this.CLIP_MIN_GAP && clipEnd > other.start + this.CLIP_MIN_GAP) { return true; } } return false; },
        
        cancelDrag: function() { this.restoreOriginalPositions(); this.isDraggingClip = false; this.draggingClipIds = []; this.dragGhost.visible = false; this.dragClipOffset = 0; },
        startClipResize: function(e, clip, dir) { var t = this.vm.tracks.find(function(tr) { return tr.id === clip.trackId; }); if (t && t.isLocked) return; e.preventDefault(); this.isResizingClip = true; this.resizingClip = clip; this.resizeDirection = dir; this.dragStartX = e.clientX; this.resizeStartClipStart = clip.start; this.resizeStartClipDuration = clip.duration; this.resizeOriginalState = { clipId: clip.id, start: clip.start, duration: clip.duration }; },
        handleClipResize: function(e) { var dt = (e.clientX - this.dragStartX) / this.pixelsPerSecond; var clip = this.resizingClip; var trackClips = this.getClipsInTrack(clip.trackId, [clip.id]); if (this.resizeDirection === 'left') { var ns = this.resizeStartClipStart + dt; var nd = this.resizeStartClipDuration - dt; if (ns < 0) { nd += ns; ns = 0; } if (nd < 0.5) { nd = 0.5; ns = this.resizeStartClipStart + this.resizeStartClipDuration - 0.5; } for (var i = 0; i < trackClips.length; i++) { var other = trackClips[i]; var otherEnd = other.start + other.duration; if (otherEnd > ns && other.start < this.resizeStartClipStart) { ns = otherEnd + this.CLIP_MIN_GAP; nd = this.resizeStartClipStart + this.resizeStartClipDuration - ns; break; } } clip.start = ns; clip.duration = Math.max(0.5, nd); } else { var nd2 = this.resizeStartClipDuration + dt; if (nd2 < 0.5) nd2 = 0.5; var clipEnd = clip.start + nd2; for (var j = 0; j < trackClips.length; j++) { var other2 = trackClips[j]; if (other2.start > clip.start && clipEnd > other2.start) { nd2 = other2.start - clip.start - this.CLIP_MIN_GAP; break; } } clip.duration = Math.max(0.5, nd2); } },
        getClipsInTrack: function(trackId, excludeClipIds) { excludeClipIds = excludeClipIds || []; return this.vm.clips.filter(function(c) { return c.trackId === trackId && excludeClipIds.indexOf(c.id) < 0; }).sort(function(a, b) { return a.start - b.start; }); },
        findSnapPosition: function(ns, clip, excludeIds) { excludeIds = excludeIds || []; var sd = 10 / this.pixelsPerSecond; var ce = ns + clip.duration; if (Math.abs(ns - this.vm.currentTime) < sd) return { snapped: true, position: this.vm.currentTime }; if (Math.abs(ce - this.vm.currentTime) < sd) return { snapped: true, position: this.vm.currentTime - clip.duration }; for (var i = 0; i < this.vm.clips.length; i++) { var c = this.vm.clips[i]; if (c.id === clip.id || excludeIds.indexOf(c.id) >= 0) continue; if (Math.abs(ns - (c.start + c.duration)) < sd) return { snapped: true, position: c.start + c.duration }; if (Math.abs(ns - c.start) < sd) return { snapped: true, position: c.start }; if (Math.abs(ce - c.start) < sd) return { snapped: true, position: c.start - clip.duration }; } return { snapped: false, position: ns }; },
        isClipAtPlayhead: function(clip) { return this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration; },
        getVisibleClipsForTrack: function(trackId) { var self = this; return this.vm.clips.filter(function(c) { return c.trackId === trackId && self.isClipVisible(c); }); },
        isClipVisible: function(clip) { var s = clip.start * this.pixelsPerSecond; var en = (clip.start + clip.duration) * this.pixelsPerSecond; return en >= this.scrollLeft - 100 && s <= this.scrollLeft + this.viewportWidth + 100; },
        formatClipDuration: function(d) { if (!d) return '0:00'; var h = Math.floor(d/3600); var m = Math.floor((d%3600)/60); var s = Math.floor(d%60); return h > 0 ? h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') : m + ':' + String(s).padStart(2,'0'); },
        formatRulerTime: function(s) { if (s >= 3600) { var h = Math.floor(s/3600); var m = Math.floor((s%3600)/60); var sec = Math.floor(s%60); return h + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0'); } else if (s >= 60) { var m2 = Math.floor(s/60); var sec2 = Math.floor(s%60); return m2 + ':' + String(sec2).padStart(2,'0'); } return s + 's'; },
        startTrackDrag: function(e, track, idx) { this.draggingTrackId = track.id; this.draggingTrackIndex = idx; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', track.id); },
        handleTrackDragOver: function(e, track) { if (this.draggingTrackId && this.draggingTrackId !== track.id) this.dragOverTrackId = track.id; },
        handleTrackDragLeave: function() { this.dragOverTrackId = null; },
        handleTrackDrop: function(e, targetTrack, targetIdx) { if (!this.draggingTrackId || this.draggingTrackId === targetTrack.id) { this.endTrackDrag(); return; } var fromIdx = this.draggingTrackIndex; if (fromIdx !== targetIdx) { var tracks = this.vm.tracks.slice(); var moved = tracks.splice(fromIdx, 1)[0]; tracks.splice(targetIdx, 0, moved); this.vm.tracks = tracks; } this.endTrackDrag(); },
        endTrackDrag: function() { this.draggingTrackId = null; this.draggingTrackIndex = null; this.dragOverTrackId = null; },
        moveTrackUp: function(idx) { if (idx <= 0) return; var t = this.vm.tracks.slice(); var temp = t[idx - 1]; t[idx - 1] = t[idx]; t[idx] = temp; this.vm.tracks = t; this.closeContextMenus(); },
        moveTrackDown: function(idx) { if (idx >= this.vm.tracks.length - 1) return; var t = this.vm.tracks.slice(); var temp = t[idx]; t[idx] = t[idx + 1]; t[idx + 1] = temp; this.vm.tracks = t; this.closeContextMenus(); },
        startTrackResize: function(e, track) { this.isResizingTrack = true; this.resizingTrackId = track.id; this.resizeStartY = e.clientY; this.resizeStartHeight = this.getTrackHeight(track.id); },
        addTrack: function() { var colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']; var t = { id: 't_' + Date.now(), name: 'NONE', color: colors[this.vm.tracks.length % colors.length], isHidden: false, isLocked: false, isMain: false }; this.vm.tracks.push(t); this.trackHeights[t.id] = this.defaultTrackHeight; this.trackHeights = Object.assign({}, this.trackHeights); },
        deleteTrack: function(track, idx) { if (this.vm.tracks.length <= 1) return; this.vm.clips = this.vm.clips.filter(function(c) { return c.trackId !== track.id; }); delete this.trackHeights[track.id]; this.trackHeights = Object.assign({}, this.trackHeights); this.vm.tracks.splice(idx, 1); this.closeContextMenus(); },
        duplicateTrack: function(track) { var idx = -1; for (var i = 0; i < this.vm.tracks.length; i++) { if (this.vm.tracks[i].id === track.id) { idx = i; break; } } var nt = Object.assign({}, track, { id: 't_' + Date.now(), name: track.name === 'NONE' ? 'NONE' : track.name + ' (복사)', isMain: false }); this.vm.tracks.splice(idx + 1, 0, nt); this.trackHeights[nt.id] = this.getTrackHeight(track.id); this.trackHeights = Object.assign({}, this.trackHeights); this.closeContextMenus(); },
        setMainTrack: function(track) { this.vm.tracks.forEach(function(t) { t.isMain = false; }); track.isMain = true; },
        changeTrackColor: function(track) { var self = this; Swal.fire({ title: '트랙 색상', input: 'text', inputValue: track.color, showCancelButton: true, background: '#1e1e1e', color: '#fff' }).then(function(result) { if (result.value) track.color = result.value; self.closeContextMenus(); }); },
        updateTrackName: function(track, v) { track.name = v.trim() === '' ? 'NONE' : v; },
        initTrackHeights: function() { var self = this; this.vm.tracks.forEach(function(t) { if (!self.trackHeights[t.id]) self.trackHeights[t.id] = self.defaultTrackHeight; }); this.updateTrackYPositions(); },
        openTrackContextMenu: function(e, track, idx) { this.clipContextMenu = null; this.heightSubmenu.visible = false; this.editSubmenu.visible = false; this.trackContextMenu = { x: e.clientX, y: e.clientY, track: track, index: idx }; },
        // 수정: 클립 우클릭 시 다중 선택 유지
        openClipContextMenu: function(e, track, clip) { 
            clip = clip || null; 
            this.trackContextMenu = null; 
            this.heightSubmenu.visible = false; 
            this.editSubmenu.visible = false;
            // 다중 선택된 상태에서 선택된 클립을 우클릭하면 선택 유지
            if (clip && this.selectedClipIds.indexOf(clip.id) < 0) { 
                // 선택되지 않은 클립을 우클릭하면 해당 클립만 선택
                this.selectedClipIds = [clip.id]; 
                this.syncVmSelectedClip(); 
            }
            // 이미 선택된 클립을 우클릭하면 기존 다중 선택 유지
            this.clipContextMenu = { x: e.clientX, y: e.clientY, track: track, clip: clip, time: this.getTimeFromMouseEvent(e) }; 
        },
        getTimeFromMouseEvent: function(e) { var lane = document.getElementById('timeline-lane-container'); if (!lane) return 0; return Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pixelsPerSecond); },
        closeContextMenus: function() { this.trackContextMenu = null; this.clipContextMenu = null; this.heightSubmenu.visible = false; this.editSubmenu.visible = false; },
        duplicateClip: function(clip) { var nc = Object.assign({}, clip, { id: 'c_' + Date.now(), start: clip.start + clip.duration + 0.5 }); this.vm.clips.push(nc); },
        deleteClip: function(clip) { this.vm.clips = this.vm.clips.filter(function(c) { return c.id !== clip.id; }); this.selectedClipIds = this.selectedClipIds.filter(function(id) { return id !== clip.id; }); this.syncVmSelectedClip(); },
        addClipAtPosition: function() { if (!this.clipContextMenu) return; var t = this.clipContextMenu.track; var time = this.clipContextMenu.time || 0; var newClip = { id: 'c_' + Date.now(), trackId: t.id, name: 'New Clip', start: time, duration: 5, type: 'video', volume: 100 }; this.vm.clips.push(newClip); },
        deleteSelectedClips: function() { if (!this.hasSelectedClips) return; var self = this; this.vm.clips = this.vm.clips.filter(function(c) { return self.selectedClipIds.indexOf(c.id) < 0; }); this.selectedClipIds = []; this.syncVmSelectedClip(); },
        cutAtPlayhead: function() { var targetClips = this.getEditTargetClips(); if (targetClips.length === 0) return; var self = this; targetClips.forEach(function(c) { if (c && self.isClipAtPlayhead(c)) { var origDur = c.duration; var relTime = self.vm.currentTime - c.start; c.duration = relTime; self.vm.clips.push(Object.assign({}, c, { id: 'c_' + Date.now(), start: self.vm.currentTime, duration: origDur - relTime })); } }); this.saveToHistory(); },
        cutAtPlayheadForClip: function(clip) { if (!this.isClipAtPlayhead(clip)) return; var origDur = clip.duration; var relTime = this.vm.currentTime - clip.start; clip.duration = relTime; this.vm.clips.push(Object.assign({}, clip, { id: 'c_' + Date.now(), start: this.vm.currentTime, duration: origDur - relTime })); this.saveToHistory(); },
        cutAndDeleteLeftSelected: function() { var targetClips = this.getEditTargetClips(); if (targetClips.length === 0) return; var self = this; targetClips.forEach(function(c) { if (c && self.isClipAtPlayhead(c)) { c.duration = c.start + c.duration - self.vm.currentTime; c.start = self.vm.currentTime; } }); this.saveToHistory(); },
        cutAndDeleteRightSelected: function() { var targetClips = this.getEditTargetClips(); if (targetClips.length === 0) return; var self = this; targetClips.forEach(function(c) { if (c && self.isClipAtPlayhead(c)) { c.duration = self.vm.currentTime - c.start; } }); this.saveToHistory(); },
        cutAndDeleteLeftForClip: function(clip) { if (!this.isClipAtPlayhead(clip)) return; clip.duration = clip.start + clip.duration - this.vm.currentTime; clip.start = this.vm.currentTime; this.saveToHistory(); },
        cutAndDeleteRightForClip: function(clip) { if (!this.isClipAtPlayhead(clip)) return; clip.duration = this.vm.currentTime - clip.start; this.saveToHistory(); },
        canExtractAudio: function(clip) { return clip && clip.type === 'video' && clip.src; },
        toggleClipMute: function(clip) { if (!clip) return; clip.isMuted = !clip.isMuted; },
        extractAudioFromClip: function(clip) { if (!this.canExtractAudio(clip)) return; var self = this; var audioTrack = this.vm.tracks.find(function(t) { return t.type === 'audio'; }); if (!audioTrack) { audioTrack = { id: 't_audio_' + Date.now(), name: 'Audio', type: 'audio', color: '#22c55e', isHidden: false, isLocked: false, isMain: false }; this.vm.tracks.push(audioTrack); this.trackHeights[audioTrack.id] = this.defaultTrackHeight; this.trackHeights = Object.assign({}, this.trackHeights); } var audioClip = { id: 'c_audio_' + Date.now(), trackId: audioTrack.id, name: clip.name + ' (Audio)', start: clip.start, duration: clip.duration, type: 'sound', src: clip.src, volume: clip.volume || 100, sourceClipId: clip.id }; Swal.fire({ title: '사운드 분리', text: '원본 비디오 클립을 음소거 하시겠습니까?', icon: 'question', showCancelButton: true, confirmButtonText: '음소거', cancelButtonText: '유지', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' }).then(function(result) { if (result.isConfirmed) clip.isMuted = true; self.vm.clips.push(audioClip); }); },
        exportClipToAsset: function(clip) { var clipData = clip.id ? clip : this.vm.clips.find(function(c) { return c.id === clip.id; }); if (!clipData) clipData = clip; var event = new CustomEvent('wai-clip-to-asset', { detail: { id: clipData.id, name: clipData.name || 'Clip', type: clipData.type || 'video', src: clipData.src || '', duration: clipData.duration || 0, resolution: clipData.resolution || '' }, bubbles: true }); document.dispatchEvent(event); },
        
        // === 클립 합치기 기능 ===
        mergeSelectedClips: function() {
            if (this.selectedClipIds.length < 2) {
                this.closeContextMenus();
                return;
            }
            
            var self = this;
            // 선택된 클립들 가져오기
            var selectedClips = this.selectedClipIds.map(function(id) {
                return self.vm.clips.find(function(c) { return c.id === id; });
            }).filter(function(c) { return c; });
            
            // 같은 트랙에 있는지 확인
            var trackIds = {};
            selectedClips.forEach(function(c) { trackIds[c.trackId] = true; });
            
            if (Object.keys(trackIds).length > 1) {
                Swal.fire({
                    title: '클립 합치기',
                    text: '같은 트랙에 있는 클립만 합칠 수 있습니다.',
                    icon: 'warning',
                    background: '#1e1e1e',
                    color: '#fff'
                });
                this.closeContextMenus();
                return;
            }
            
            // 시작 시간순으로 정렬
            selectedClips.sort(function(a, b) { return a.start - b.start; });
            
            // 첫 번째 클립을 기준으로 합치기
            var firstClip = selectedClips[0];
            var lastClip = selectedClips[selectedClips.length - 1];
            var newDuration = (lastClip.start + lastClip.duration) - firstClip.start;
            
            // 첫 번째 클립 수정
            firstClip.duration = newDuration;
            firstClip.name = firstClip.name + ' (합침)';
            
            // 나머지 클립 삭제
            var idsToRemove = selectedClips.slice(1).map(function(c) { return c.id; });
            this.vm.clips = this.vm.clips.filter(function(c) {
                return idsToRemove.indexOf(c.id) < 0;
            });
            
            // 선택 초기화
            this.selectedClipIds = [firstClip.id];
            this.syncVmSelectedClip();
            this.saveToHistory();
            this.closeContextMenus();
        },
        
        // === 속도 조절 팝업 ===
        openSpeedEditor: function() {
            var clip = this.clipContextMenu ? this.clipContextMenu.clip : null;
            if (!clip) {
                this.closeContextMenus();
                return;
            }
            
            var x = this.clipContextMenu.x;
            var y = this.clipContextMenu.y;
            
            // 화면 경계 처리
            var popupWidth = 280;
            var popupHeight = 220;
            if (x + popupWidth > window.innerWidth) x = window.innerWidth - popupWidth - 20;
            if (y + popupHeight > window.innerHeight) y = window.innerHeight - popupHeight - 20;
            if (x < 10) x = 10;
            if (y < 10) y = 10;
            
            var currentSpeed = clip.playbackSpeed || 1.0;
            var baseDuration = clip.originalDuration || clip.duration;
            
            this.speedEditorPopup = {
                visible: true,
                x: x,
                y: y,
                clip: clip,
                speed: currentSpeed,
                originalDuration: baseDuration,
                resultDuration: baseDuration / currentSpeed,
                originalSpeed: currentSpeed
            };
            
            this.closeContextMenus();
        },
        
        setClipSpeed: function(speed) {
            speed = Math.max(0.25, Math.min(4, speed));
            this.speedEditorPopup.speed = Math.round(speed * 100) / 100;
            this.speedEditorPopup.resultDuration = this.speedEditorPopup.originalDuration / speed;
        },
        
        applyClipSpeed: function() {
            var clip = this.speedEditorPopup.clip;
            if (!clip) {
                this.closeSpeedEditor();
                return;
            }
            
            var newSpeed = this.speedEditorPopup.speed;
            var baseDuration = clip.originalDuration || clip.duration;
            
            // 원본 duration 저장 (최초 1회)
            if (!clip.originalDuration) {
                clip.originalDuration = clip.duration;
            }
            
            // 속도에 따른 duration 조정
            clip.duration = baseDuration / newSpeed;
            clip.playbackSpeed = newSpeed;
            
            this.saveToHistory();
            this.closeSpeedEditor();
        },
        
        closeSpeedEditor: function() {
            this.speedEditorPopup.visible = false;
            this.speedEditorPopup.clip = null;
        },
        
        handleLaneMouseDown: function(e) { if (e.target.id === 'timeline-ruler' || e.target.closest('#timeline-ruler')) this.updatePlayheadPosition(e); },
        startPlayheadDrag: function(e) { this.isDraggingPlayhead = true; this.updatePlayheadPosition(e); },
        updatePlayheadPosition: function(e) { var lane = document.getElementById('timeline-lane-container'); if (!lane) return; var time = Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pixelsPerSecond); if (this.vm.isMagnet) { var snap = null; var minD = 10 / this.pixelsPerSecond; this.vm.clips.forEach(function(c) { if (Math.abs(time - c.start) < minD) { minD = Math.abs(time - c.start); snap = c.start; } if (Math.abs(time - (c.start + c.duration)) < minD) { minD = Math.abs(time - (c.start + c.duration)); snap = c.start + c.duration; } }); if (snap !== null) time = snap; } this.vm.currentTime = time; },
        togglePlayback: function() { if (typeof this.vm.togglePlayback === 'function') this.vm.togglePlayback(); else this.vm.isPlaying = !this.vm.isPlaying; },
        seekToStart: function() { if (typeof this.vm.seekToStart === 'function') this.vm.seekToStart(); else this.vm.currentTime = 0; },
        seekToEnd: function() { var max = 0; this.vm.clips.forEach(function(c) { if (c.start + c.duration > max) max = c.start + c.duration; }); this.vm.currentTime = max; },
        seekBackward: function() { this.vm.currentTime = Math.max(0, this.vm.currentTime - 5); },
        seekForward: function() { this.vm.currentTime = Math.min(this.maxClipEnd, this.vm.currentTime + 5); },
        adjustLayout: function() { var p = document.getElementById('preview-main-container'); if (p) p.style.height = this.vm.isTimelineCollapsed ? 'calc(100% - 32px)' : '50%'; this.calculateDynamicZoomRange(); },
        toggleCollapse: function() { this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed; var self = this; this.$nextTick(function() { self.adjustLayout(); }); },
        startHeaderResize: function(e) { if (this.isTrackHeaderCollapsed) return; this.isResizingHeader = true; this.resizeStartX = e.clientX; this.resizeStartWidth = this.trackHeaderWidth; },
        onWindowResize: function() { this.adjustLayout(); this.updateViewportSize(); this.updateTrackYPositions(); },
        onExternalDragOver: function(e) { if (e.dataTransfer.types.indexOf('text/wai-asset') >= 0) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; this.isExternalDragOver = true; this.updateDropIndicator(e); } },
        onExternalDragLeave: function(e) { var rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) { this.isExternalDragOver = false; this.dropIndicator.visible = false; } },
// 코드연결지점
        updateDropIndicator: function(e) { var lane = document.getElementById('timeline-lane-container'); if (!lane) return; var rect = lane.getBoundingClientRect(); var relY = e.clientY - rect.top - 24; var accH = 0; var targetTrack = null; for (var i = 0; i < this.vm.tracks.length; i++) { var t = this.vm.tracks[i]; var h = this.getTrackHeight(t.id); if (relY >= accH && relY < accH + h) { targetTrack = t; break; } accH += h; } if (!targetTrack) { this.dropIndicator.visible = false; return; } var dropTime = Math.max(0, (e.clientX - rect.left) / this.pixelsPerSecond); this.dropIndicator = { visible: true, trackId: targetTrack.id, left: dropTime * this.pixelsPerSecond, width: 5 * this.pixelsPerSecond }; },
        onExternalDrop: function(e) { e.preventDefault(); this.isExternalDragOver = false; this.dropIndicator.visible = false; var assetData; try { var raw = e.dataTransfer.getData('text/wai-asset'); if (!raw) return; assetData = JSON.parse(raw); } catch (err) { return; } var assets = Array.isArray(assetData) ? assetData : [assetData]; if (assets.length === 0) return; var lane = document.getElementById('timeline-lane-container'); var dropTime = this.vm.currentTime; var targetTrackId = null; if (lane) { var rect = lane.getBoundingClientRect(); dropTime = Math.max(0, (e.clientX - rect.left) / this.pixelsPerSecond); var relY = e.clientY - rect.top - 24; var accH = 0; for (var i = 0; i < this.vm.tracks.length; i++) { var t = this.vm.tracks[i]; var h = this.getTrackHeight(t.id); if (relY >= accH && relY < accH + h) { targetTrackId = t.id; break; } accH += h; } } document.dispatchEvent(new CustomEvent('wai-timeline-drop', { detail: { assets: assets, dropTime: dropTime, targetTrackId: targetTrackId }, bubbles: true })); }
    }
};

window.TimelinePanel = TimelinePanel;
