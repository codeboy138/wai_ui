// Timeline Panel Component - CapCut Style
// 트랙 레이아웃 복구, 헤더 완전접기, 컨텍스트 메뉴 반응형
// 스크롤바 호버 확대, 트랙헤더 줄이기만 가능
// 클립 드래그 아웃 (미디어 자산 패널로) 지원
// 필름스트립 프레임 표시 개선 - 타임스케일 연동
// 플레이 버튼 패널 확장, 룰러 숫자 겹침 방지
// 클립 겹침 불가 원칙 복구, 사운드 분리 기능

const TimelinePanel = {
    props: ['vm'],
    template: `
        <div
            id="timeline-main-panel"
            class="flex flex-col bg-bg-panel select-none h-full"
            @dragover.prevent="onExternalDragOver"
            @dragleave="onExternalDragLeave"
            @drop.prevent="onExternalDrop"
        >
            <!-- 타임라인 헤더 (플레이 버튼 바) - 확장됨 -->
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
                    <button class="tool-btn" @click="undo" title="실행 취소" :disabled="!canUndo"><i class="fa-solid fa-rotate-left"></i></button>
                    <button class="tool-btn" @click="redo" title="다시 실행" :disabled="!canRedo"><i class="fa-solid fa-rotate-right"></i></button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" :disabled="!hasSelectedClips" :title="hasSelectedClips ? '자르기+왼쪽삭제' : '클립을 먼저 선택하세요'" @click="cutAndDeleteLeftSelected">
                        <span class="text-red-400 text-[10px] leading-none">&lt;</span>
                        <i class="fa-solid fa-scissors text-[9px]"></i>
                    </button>
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" :disabled="!hasSelectedClips" :title="hasSelectedClips ? '자르기+오른쪽삭제' : '클립을 먼저 선택하세요'" @click="cutAndDeleteRightSelected">
                        <i class="fa-solid fa-scissors text-[9px]"></i>
                        <span class="text-red-400 text-[10px] leading-none">&gt;</span>
                    </button>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn" :disabled="!hasSelectedClips" :title="hasSelectedClips ? '자르기' : '클립을 먼저 선택하세요'" @click="cutAtPlayhead"><i class="fa-solid fa-scissors"></i></button>
                    <button class="tool-btn" :disabled="!hasSelectedClips" :title="hasSelectedClips ? '삭제' : '클립을 먼저 선택하세요'" @click="deleteSelectedClips"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="flex gap-2 items-center">
                    <span v-if="selectedClipIds.length > 0" class="text-ui-accent">{{ selectedClipIds.length }}개 선택</span>
                    <span v-else class="text-text-sub">클립 미선택</span>
                    <div class="w-px h-4 bg-ui-border mx-1"></div>
                    <button class="tool-btn w-6 h-6" @click="zoomToFit" title="전체 보기"><i class="fa-solid fa-expand"></i></button>
                    <button class="tool-btn w-6 h-6" :class="{ 'bg-ui-accent text-white': zoomMode === 'playhead' }" @click="toggleZoomMode" :title="zoomMode === 'cursor' ? '커서 중심 줌' : '플레이헤드 중심 줌'"><i class="fa-solid fa-crosshairs"></i></button>
                    <button class="tool-btn" :class="{ 'bg-ui-accent text-white': vm.isMagnet }" @click="vm.isMagnet = !vm.isMagnet" title="스냅 토글">
                        <i class="fa-solid fa-magnet"></i>
                    </button>
                    <button class="tool-btn" :class="{ 'bg-ui-accent text-white': vm.isAutoRipple }" @click="vm.isAutoRipple = !vm.isAutoRipple" title="리플 토글">
                        <i class="fa-solid fa-link"></i>
                    </button>
                </div>
            </div>
// 코드연결지점
// 코드연결지점
            <!-- 메인 타임라인 영역 -->
            <div v-if="!vm.isTimelineCollapsed" class="flex-grow flex overflow-hidden min-h-0 relative">
                <!-- 트랙 헤더 (고정) -->
                <div 
                    class="track-header-container bg-bg-panel border-r border-ui-border flex-shrink-0 flex flex-col relative"
                    :style="{ width: currentHeaderWidth + 'px' }"
                    @mouseenter="onHeaderAreaEnter"
                    @mouseleave="onHeaderAreaLeave"
                >
                    <!-- 헤더 타이틀 -->
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel shrink-0">
                        <div class="flex items-center gap-1">
                            <button v-if="isTrackHeaderCollapsed" class="tool-btn w-5 h-5" title="헤더 펼치기" @click="expandTrackHeader">
                                <i class="fa-solid fa-chevron-right" style="font-size: 9px;"></i>
                            </button>
                            <button v-else class="tool-btn w-5 h-5" title="트랙 추가" @click="addTrack">
                                <i class="fa-solid fa-plus" style="font-size: 9px;"></i>
                            </button>
                            <span v-show="!isTrackHeaderCollapsed">TRACKS</span>
                        </div>
                        <button v-show="!isTrackHeaderCollapsed" class="w-4 h-4 flex items-center justify-center rounded hover:bg-bg-hover text-[8px]" @click="collapseTrackHeader" title="헤더 접기">
                            <i class="fa-solid fa-chevron-left" style="font-size: 8px;"></i>
                        </button>
                    </div>
                    <!-- 트랙 헤더 목록 -->
                    <div ref="trackHeaderList" class="track-header-list flex-grow overflow-hidden relative" @scroll="onHeaderScroll">
                        <div class="track-header-inner" :style="{ height: totalTrackHeight + 'px' }">
                            <div v-for="(track, index) in vm.tracks" :key="track.id" :data-track-id="track.id"
                                class="border-b border-ui-border flex items-center px-1 group bg-bg-panel relative"
                                :class="{ 'opacity-50': track.isLocked, 'bg-ui-accent/20': dragOverTrackId === track.id }"
                                :style="{ height: getTrackHeight(track.id) + 'px' }"
                                draggable="true" @dragstart="startTrackDrag($event, track, index)" @dragover.prevent="handleTrackDragOver($event, track)" @dragleave="handleTrackDragLeave" @drop.prevent="handleTrackDrop($event, track, index)" @dragend="endTrackDrag" @contextmenu.prevent="openTrackContextMenu($event, track, index)" @wheel.stop="onTrackHeaderWheel($event, track)">
                                <button class="w-4 h-4 flex items-center justify-center rounded mr-1 shrink-0 hover:bg-bg-hover" :class="track.isMain ? 'text-yellow-400' : 'text-text-sub opacity-30 hover:opacity-100'" @click.stop="setMainTrack(track)">
                                    <i :class="track.isMain ? 'fa-solid fa-star' : 'fa-regular fa-star'" style="font-size: 10px;"></i>
                                </button>
                                <template v-if="!isTrackHeaderCollapsed">
                                    <div class="flex items-center gap-0.5 mr-1 shrink-0" v-show="getTrackHeight(track.id) >= 30">
                                        <button class="track-control-btn" :class="{ 'active': !track.isHidden }" @click.stop="track.isHidden = !track.isHidden"><i :class="track.isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" style="font-size: 8px;"></i></button>
                                        <button class="track-control-btn" :class="{ 'locked': track.isLocked }" @click.stop="track.isLocked = !track.isLocked"><i :class="track.isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" style="font-size: 8px;"></i></button>
                                    </div>
                                    <div v-show="getTrackHeight(track.id) >= 24" class="w-1 h-2/3 rounded mr-1 shrink-0" :style="{ backgroundColor: track.color || '#666' }"></div>
                                    <input v-show="getTrackHeight(track.id) >= 24" type="text" class="text-[10px] truncate flex-1 text-text-main bg-transparent border-none outline-none min-w-0" :class="{ 'text-text-sub italic': track.name === 'NONE' }" :value="track.name === 'NONE' ? '' : track.name" @input="updateTrackName(track, $event.target.value)" :disabled="track.isLocked" @mousedown.stop :placeholder="'Track ' + (index + 1)" />
                                </template>
                                <div class="absolute left-0 right-0 bottom-0 h-1 cursor-ns-resize hover:bg-ui-accent/50 z-10" @mousedown.prevent.stop="startTrackResize($event, track)"></div>
                            </div>
                        </div>
                    </div>
                    <!-- 헤더 리사이즈 핸들 -->
                    <div v-show="!isTrackHeaderCollapsed" 
                        class="header-resize-handle" 
                        :class="{ 'resizing': isResizingHeader }"
                        :style="{ top: '24px', height: totalTrackHeight + 'px' }"
                        @mousedown.prevent="startHeaderResize"></div>
                    <!-- 접힌 상태에서 호버 시 펼치기 화살표 -->
                    <div v-if="isTrackHeaderCollapsed && isHoveringHeaderArea" 
                        class="absolute inset-0 top-6 flex items-center justify-center bg-bg-hover/80 cursor-pointer z-20"
                        @click="expandTrackHeader">
                        <i class="fa-solid fa-chevron-right text-ui-accent"></i>
                    </div>
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
                        <div v-for="(track, idx) in vm.tracks" :key="track.id" :data-track-id="track.id" :data-track-index="idx"
                            class="border-b border-ui-border relative track-lane"
                            :class="{ 'opacity-30': track.isHidden }"
                            :style="{ height: getTrackHeight(track.id) + 'px' }"
                            @mousedown="onTrackLaneMouseDown($event, track)"
                            @contextmenu.prevent="openClipContextMenu($event, track)">
                            
                            <div v-if="dropIndicator.visible && dropIndicator.trackId === track.id"
                                class="absolute top-1 bottom-1 bg-ui-accent/30 border-2 border-dashed border-ui-accent rounded pointer-events-none z-20"
                                :style="{ left: dropIndicator.left + 'px', width: dropIndicator.width + 'px' }"></div>
                            
                            <!-- 클립 -->
                            <div v-for="clip in getVisibleClipsForTrack(track.id)" :key="clip.id" :data-clip-id="clip.id"
                                class="clip absolute cursor-pointer"
                                :class="getClipClasses(clip)"
                                :style="clipStyle(clip, track)"
                                @mousedown.stop="onClipMouseDown($event, clip, track)"
                                @contextmenu.stop.prevent="openClipContextMenu($event, track, clip)">
                                
                                <div class="absolute inset-0" :style="getClipBackgroundStyle(clip, track)"></div>
                                
                                <div v-if="clip.type === 'video' || clip.type === 'image'" class="absolute inset-0 top-[18px]" :style="{ bottom: getWaveformHeight(track) + 'px' }">
                                    <div class="clip-filmstrip h-full flex overflow-hidden">
                                        <div v-for="(frame, fi) in getFilmstripFrames(clip)" :key="'f'+fi"
                                            class="clip-filmstrip-frame flex-shrink-0 h-full bg-cover bg-center bg-no-repeat relative"
                                            :style="{ width: frame.width + 'px', backgroundImage: frame.src ? 'url(' + frame.src + ')' : 'none', backgroundColor: frame.src ? 'transparent' : '#1a1a2e' }">
                                            <i v-if="!frame.src" class="fa-solid fa-film absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 text-[10px]"></i>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="clip-title-bar">
                                    <span class="clip-name">{{ clip.name }}</span>
                                    <span class="clip-duration">{{ formatClipDuration(clip.duration) }}</span>
                                </div>
                                
                                <div class="clip-waveform-area" :style="{ height: getWaveformHeight(track) + 'px' }">
                                    <svg class="clip-waveform-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <rect x="0" y="0" width="100" height="100" :fill="getWaveformBgColor(clip)" />
                                        <rect v-for="(bar, bi) in getWaveformBars(clip)" :key="'w'+bi" :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" :fill="getWaveformBarColor(clip)" />
                                    </svg>
                                    <div class="clip-volume-line" :style="{ bottom: getVolumeLinePosition(clip) + '%' }" @mousedown.stop="startClipVolumeDrag($event, clip)"></div>
                                </div>
                                
                                <div class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20" style="z-index:15;" @mousedown.stop="startClipResize($event, clip, 'left')"></div>
                                <div class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20" style="z-index:15;" @mousedown.stop="startClipResize($event, clip, 'right')"></div>
                            </div>
                        </div>
                        
                        <div class="playhead-line-body" :style="{ left: vm.currentTime * pixelsPerSecond + 'px', height: totalTrackHeight + 'px' }"></div>
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
            <div v-if="trackContextMenu" class="context-menu" :style="getContextMenuStyle(trackContextMenu)" @click.stop>
                <div class="ctx-item" @click="moveTrackUp(trackContextMenu.index)"><i class="fa-solid fa-arrow-up w-4"></i><span>위로 이동</span></div>
                <div class="ctx-item" @click="moveTrackDown(trackContextMenu.index)"><i class="fa-solid fa-arrow-down w-4"></i><span>아래로 이동</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item" @click="setMainTrack(trackContextMenu.track); closeContextMenus()"><i class="fa-solid fa-star w-4"></i><span>메인 트랙 설정</span></div>
                <div class="ctx-item" @click="duplicateTrack(trackContextMenu.track)"><i class="fa-solid fa-copy w-4"></i><span>트랙 복제</span></div>
                <div class="ctx-item" @click="changeTrackColor(trackContextMenu.track)"><i class="fa-solid fa-palette w-4"></i><span>색상 변경</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item has-submenu" @mouseenter="openHeightSubmenu($event, 'this')" @mouseleave="scheduleCloseHeightSubmenu">
                    <i class="fa-solid fa-arrows-up-down w-4"></i>
                    <span>높이: 이 트랙</span>
                    <i class="fa-solid fa-chevron-right ml-auto text-[8px]"></i>
                </div>
                <div class="ctx-item has-submenu" @mouseenter="openHeightSubmenu($event, 'all')" @mouseleave="scheduleCloseHeightSubmenu">
                    <i class="fa-solid fa-layer-group w-4"></i>
                    <span>높이: 전체</span>
                    <i class="fa-solid fa-chevron-right ml-auto text-[8px]"></i>
                </div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item text-red-400" @click="deleteTrack(trackContextMenu.track, trackContextMenu.index)"><i class="fa-solid fa-trash w-4"></i><span>삭제</span></div>
            </div>
            
            <!-- 높이 서브메뉴 -->
            <div v-if="heightSubmenu.visible" class="context-menu" :style="getHeightSubmenuStyle()" @mouseenter="cancelCloseHeightSubmenu" @mouseleave="scheduleCloseHeightSubmenu" @click.stop>
                <div class="ctx-item" @click="applyHeightPreset('low')"><i class="fa-solid fa-compress-alt w-4"></i><span>낮음 (20px)</span></div>
                <div class="ctx-item" @click="applyHeightPreset('medium')"><i class="fa-solid fa-minus w-4"></i><span>중간 (40px)</span></div>
                <div class="ctx-item" @click="applyHeightPreset('high')"><i class="fa-solid fa-expand-alt w-4"></i><span>높음 (80px)</span></div>
                <div class="h-px bg-ui-border my-1"></div>
                <div class="ctx-item" @click="enableWheelAdjust"><i class="fa-solid fa-mouse w-4"></i><span>휠로 조절</span></div>
            </div>
            
            <!-- 클립 컨텍스트 메뉴 - 사운드 분리 추가 -->
            <div v-if="clipContextMenu" class="context-menu" :style="getContextMenuStyle(clipContextMenu)" @click.stop>
                <template v-if="clipContextMenu.clip">
                    <div class="ctx-item" :class="{ disabled: !isClipAtPlayhead(clipContextMenu.clip) }" @click="isClipAtPlayhead(clipContextMenu.clip) && cutAtPlayheadForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>플레이헤드에서 자르기</span></div>
                    <div class="ctx-item" :class="{ disabled: !isClipAtPlayhead(clipContextMenu.clip) }" @click="isClipAtPlayhead(clipContextMenu.clip) && cutAndDeleteLeftForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>자르기 + 왼쪽 삭제</span></div>
                    <div class="ctx-item" :class="{ disabled: !isClipAtPlayhead(clipContextMenu.clip) }" @click="isClipAtPlayhead(clipContextMenu.clip) && cutAndDeleteRightForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>자르기 + 오른쪽 삭제</span></div>
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
        </div>
    `,
// 코드연결지점
// 코드연결지점
    data: function() {
        return {
            trackHeaderWidth: 180, 
            initialHeaderWidth: 180,
            minHeaderWidth: 60,
            collapsedHeaderWidth: 28, 
            isResizingHeader: false, 
            resizeStartX: 0, 
            resizeStartWidth: 0,
            isTrackHeaderCollapsed: false,
            isHoveringHeaderArea: false,
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
            minTrackHeight: 20, 
            defaultTrackHeight: 40,
            trackHeightPresets: {
                low: 20,
                medium: 40,
                high: 80,
                default: 40
            },
            heightSubmenu: { visible: false, x: 0, y: 0, target: 'this' },
            heightSubmenuCloseTimer: null,
            wheelAdjustMode: { active: false, target: 'this' },
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
            pendingClickClipId: null, 
            pendingClickModifiers: null,
            isResolutionDropdownOpen: false, 
            isAspectDropdownOpen: false, 
            isExternalDragOver: false,
            isDraggingClipOut: false,
            clipDragOutData: null,
            aspectRatioOptions: [
                { value: '원본', label: '원본' },
                { value: '16:9', label: '16:9' },
                { value: '9:16', label: '9:16' },
                { value: '4:3', label: '4:3' },
                { value: '1:1', label: '1:1' }
            ],
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
            // 필름스트립 프레임 설정
            FILMSTRIP_FRAME_WIDTH: 40,
            MIN_FILMSTRIP_FRAME_WIDTH: 20,
            MAX_FILMSTRIP_FRAME_WIDTH: 80,
            MAX_WAVEFORM_BARS: 60, 
            MAX_RULER_MARKS: 200,
            // 룰러 라벨 최소 간격 (픽셀)
            MIN_RULER_LABEL_SPACING: 60,
            // 클립 겹침 방지용 최소 간격 (초)
            CLIP_MIN_GAP: 0.01,
            masterVolume: 100, 
            previousVolume: 100, 
            isDraggingMasterVolume: false,
            showMasterVolume: false, 
            masterVolumeHideTimer: null,
            isDraggingClipVolume: false, 
            volumeDragClip: null, 
            volumeDragStartY: 0, 
            volumeDragStartVolume: 0,
            thumbnailCache: {}, 
            waveformCache: {}, 
            videoMetaCache: {}, 
            currentDragTrackIndex: null,
            volumePopup: { visible: false, x: 0, y: 0, clip: null, value: 100 }, 
            isDraggingVolumePopup: false,
            trackYPositions: [],
            isMouseInLane: false,
            contextMenuWidth: 180,
            contextMenuHeight: 320,
            submenuWidth: 160,
            submenuHeight: 140
        };
    },
    computed: {
        formattedTime: function() { 
            var t = this.vm.currentTime || 0;
            var h = Math.floor(t/3600);
            var m = Math.floor((t%3600)/60);
            var s = Math.floor(t%60);
            var f = Math.floor((t-Math.floor(t))*30); 
            var pad = function(n) { return String(n).padStart(2,'0'); };
            return pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
        },
        pixelsPerSecond: function() { return this.currentDisplayZoom; },
        maxClipEnd: function() { 
            var max = 60; 
            this.vm.clips.forEach(function(c) { 
                if (c.start + c.duration > max) max = c.start + c.duration; 
            }); 
            return max; 
        },
        totalDuration: function() { return Math.max(300, this.maxClipEnd + 60); },
        totalTimelineWidth: function() { return this.totalDuration * this.pixelsPerSecond; },
        totalTrackHeight: function() { 
            var total = 0;
            var self = this;
            this.vm.tracks.forEach(function(t) { total += self.getTrackHeight(t.id); });
            return total;
        },
        currentHeaderWidth: function() { 
            return this.isTrackHeaderCollapsed ? this.collapsedHeaderWidth : this.trackHeaderWidth; 
        },
        zoomDisplayText: function() { 
            if (this.pixelsPerSecond >= 60) return Math.round(this.pixelsPerSecond) + 'px/s';
            if (this.pixelsPerSecond >= 1) return this.pixelsPerSecond.toFixed(1) + 'px/s';
            return (this.pixelsPerSecond * 60).toFixed(1) + 'px/m';
        },
        visibleTimeRange: function() { 
            return { 
                startTime: Math.max(0, this.scrollLeft / this.pixelsPerSecond - 10), 
                endTime: (this.scrollLeft + this.viewportWidth) / this.pixelsPerSecond + 10 
            }; 
        },
        // 개선된 룰러 마크 - 라벨 겹침 방지
        visibleRulerMarks: function() {
            var marks = [];
            var pps = this.pixelsPerSecond;
            var startTime = this.visibleTimeRange.startTime;
            var endTime = this.visibleTimeRange.endTime;
            var majorInt, minorInt, microInt;
            
            // 줌 레벨에 따른 간격 조정
            if (pps >= 150) { majorInt = 1; minorInt = 0.5; microInt = 0.1; }
            else if (pps >= 100) { majorInt = 1; minorInt = 0.5; microInt = 0.25; }
            else if (pps >= 50) { majorInt = 2; minorInt = 1; microInt = 0.5; }
            else if (pps >= 20) { majorInt = 5; minorInt = 1; microInt = null; }
            else if (pps >= 10) { majorInt = 10; minorInt = 5; microInt = 1; }
            else if (pps >= 5) { majorInt = 30; minorInt = 10; microInt = 5; }
            else if (pps >= 2) { majorInt = 60; minorInt = 30; microInt = 10; }
            else { majorInt = 120; minorInt = 60; microInt = 30; }
            
            var smallest = microInt || minorInt;
            var alignedStart = Math.floor(startTime / smallest) * smallest;
            var self = this;
            
            // 라벨 겹침 방지를 위한 마지막 라벨 위치 추적
            var lastLabelPosition = -this.MIN_RULER_LABEL_SPACING;
            
            for (var t = alignedStart; t <= endTime && marks.length < this.MAX_RULER_MARKS; t += smallest) {
                if (t < 0) continue;
                var time = Math.round(t * 1000) / 1000;
                var pos = time * pps;
                var isMajor = Math.abs(time % majorInt) < 0.001;
                var isMid = !isMajor && Math.abs(time % minorInt) < 0.001;
                
                // 라벨 표시 여부 결정 - 최소 간격 확보
                var label = '';
                if (isMajor) {
                    if ((pos - lastLabelPosition) >= self.MIN_RULER_LABEL_SPACING) {
                        label = self.formatRulerTime(time);
                        lastLabelPosition = pos;
                    }
                }
                
                marks.push({ 
                    time: time, 
                    position: pos, 
                    isMajor: isMajor, 
                    isMid: isMid, 
                    label: label 
                });
            }
            return marks;
        },
        canUndo: function() { return this.historyIndex > 0; },
        canRedo: function() { return this.historyIndex < this.historyStack.length - 1; },
        hasSelectedClips: function() { return this.selectedClipIds.length > 0; }
    },
    watch: {
        'vm.clips': { 
            handler: function() { 
                if (!this.isUndoRedoAction) this.saveToHistory(); 
                this.generateThumbnailsForNewClips(); 
            }, 
            deep: true 
        },
        'vm.tracks': { 
            handler: function() { 
                if (!this.isUndoRedoAction) this.saveToHistory(); 
                this.updateTrackYPositions(); 
            }, 
            deep: true 
        },
        'vm.zoom': { 
            handler: function(v) { 
                if (v && v !== this.currentDisplayZoom) this.currentDisplayZoom = v; 
            }, 
            immediate: true 
        },
        masterVolume: function(v) { 
            if (window.PreviewRenderer) window.PreviewRenderer.setMasterVolume(v / 100);
            document.querySelectorAll('video, audio').forEach(function(el) { el.volume = v / 100; }); 
        },
        trackHeights: { 
            handler: function() { this.updateTrackYPositions(); }, 
            deep: true 
        }
    },
    mounted: function() {
        var self = this;
        this.$nextTick(function() {
            self.adjustLayout(); 
            self.injectStyles(); 
            self.initTrackHeights();
            self.currentDisplayZoom = self.vm.zoom || 20; 
            self.saveToHistory();
            self.calculateDynamicZoomRange(); 
            self.updateViewportSize(); 
            self.updateTrackYPositions();
            window.addEventListener('resize', self.onWindowResize);
            document.addEventListener('click', self.onDocumentClick);
            document.addEventListener('mousemove', self.onDocumentMouseMove);
            document.addEventListener('mouseup', self.onDocumentMouseUp);
            document.addEventListener('keydown', self.onDocumentKeyDown);
            self.generateThumbnailsForNewClips();
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
    },
// 코드연결지점
// 코드연결지점
    methods: {
        getContextMenuStyle: function(menu) {
            if (!menu) return {};
            var x = menu.x;
            var y = menu.y;
            var vw = window.innerWidth;
            var vh = window.innerHeight;
            
            if (x + this.contextMenuWidth > vw) x = vw - this.contextMenuWidth - 10;
            if (y + this.contextMenuHeight > vh) y = vh - this.contextMenuHeight - 10;
            if (x < 10) x = 10;
            if (y < 10) y = 10;
            
            return { top: y + 'px', left: x + 'px' };
        },
        getHeightSubmenuStyle: function() {
            var x = this.heightSubmenu.x;
            var y = this.heightSubmenu.y;
            var vw = window.innerWidth;
            var vh = window.innerHeight;
            
            if (x + this.submenuWidth > vw) x = this.heightSubmenu.x - this.submenuWidth - this.contextMenuWidth;
            if (y + this.submenuHeight > vh) y = vh - this.submenuHeight - 10;
            if (x < 10) x = 10;
            if (y < 10) y = 10;
            
            return { top: y + 'px', left: x + 'px' };
        },
        onHeaderAreaEnter: function() { this.isHoveringHeaderArea = true; },
        onHeaderAreaLeave: function() { this.isHoveringHeaderArea = false; },
        collapseTrackHeader: function() { this.isTrackHeaderCollapsed = true; },
        expandTrackHeader: function() { this.isTrackHeaderCollapsed = false; },
        onHeaderScroll: function(e) {
            var sc = this.$refs.timelineScrollContainer;
            if (sc && !this._syncingScroll) {
                this._syncingScroll = true;
                sc.scrollTop = e.target.scrollTop;
                var self = this;
                this.$nextTick(function() { self._syncingScroll = false; });
            }
        },
        onTrackHeaderWheel: function(e, track) {
            if (this.wheelAdjustMode.active) {
                e.preventDefault();
                e.stopPropagation();
                var delta = e.deltaY > 0 ? -5 : 5;
                var self = this;
                if (this.wheelAdjustMode.target === 'all') {
                    this.vm.tracks.forEach(function(t) {
                        var currentHeight = self.getTrackHeight(t.id);
                        self.trackHeights[t.id] = Math.max(self.minTrackHeight, Math.min(120, currentHeight + delta));
                    });
                } else {
                    var currentHeight = this.getTrackHeight(track.id);
                    this.trackHeights[track.id] = Math.max(this.minTrackHeight, Math.min(120, currentHeight + delta));
                }
                this.trackHeights = Object.assign({}, this.trackHeights);
            }
        },
        openHeightSubmenu: function(e, target) {
            if (this.heightSubmenuCloseTimer) {
                clearTimeout(this.heightSubmenuCloseTimer);
                this.heightSubmenuCloseTimer = null;
            }
            var rect = e.currentTarget.getBoundingClientRect();
            this.heightSubmenu = { visible: true, x: rect.right, y: rect.top, target: target };
        },
        scheduleCloseHeightSubmenu: function() {
            var self = this;
            this.heightSubmenuCloseTimer = setTimeout(function() { self.heightSubmenu.visible = false; }, 150);
        },
        cancelCloseHeightSubmenu: function() {
            if (this.heightSubmenuCloseTimer) {
                clearTimeout(this.heightSubmenuCloseTimer);
                this.heightSubmenuCloseTimer = null;
            }
        },
        applyHeightPreset: function(preset) {
            var height = this.trackHeightPresets[preset] || this.trackHeightPresets.default;
            var self = this;
            if (this.heightSubmenu.target === 'all') {
                this.vm.tracks.forEach(function(t) { self.trackHeights[t.id] = height; });
            } else if (this.trackContextMenu && this.trackContextMenu.track) {
                this.trackHeights[this.trackContextMenu.track.id] = height;
            }
            this.trackHeights = Object.assign({}, this.trackHeights);
            this.closeContextMenus();
        },
        enableWheelAdjust: function() {
            this.wheelAdjustMode = { active: true, target: this.heightSubmenu.target };
            this.closeContextMenus();
            var self = this;
            setTimeout(function() { self.wheelAdjustMode.active = false; }, 5000);
        },
        toggleAspectDropdown: function() { 
            this.isAspectDropdownOpen = !this.isAspectDropdownOpen; 
            if (this.isAspectDropdownOpen) this.isResolutionDropdownOpen = false;
        },
        selectAspectRatio: function(value) { 
            if (this.vm) { this.vm.aspectRatio = value; this.applyAspectRatio(value); }
            this.isAspectDropdownOpen = false; 
        },
        applyAspectRatio: function(ratio) {
            if (!this.vm) return;
            var baseWidth = this.getBaseWidth();
            var newW, newH;
            switch(ratio) {
                case '원본': var os = this.getOriginalVideoSize(); if (os) { newW = os.width; newH = os.height; } else { newW = 1920; newH = 1080; } break;
                case '16:9': newW = baseWidth; newH = Math.round(baseWidth * 9 / 16); break;
                case '9:16': newH = baseWidth; newW = Math.round(baseWidth * 9 / 16); break;
                case '4:3': newW = baseWidth; newH = Math.round(baseWidth * 3 / 4); break;
                case '1:1': newW = baseWidth; newH = baseWidth; break;
                default: newW = 1920; newH = 1080;
            }
            this.vm.canvasSize = { w: newW, h: newH };
            var self = this;
            this.$nextTick(function() { if (typeof self.vm.recalculateCanvasScale === 'function') self.vm.recalculateCanvasScale(); });
        },
        getBaseWidth: function() {
            switch(this.vm.resolution) { case '4K': return 3840; case 'FHD': return 1920; case 'HD': return 1280; default: return 1920; }
        },
        getOriginalVideoSize: function() {
            var currentTime = this.vm.currentTime;
            var activeVideoClip = this.vm.clips.find(function(clip) {
                if (clip.type !== 'video') return false;
                return currentTime >= clip.start && currentTime < clip.start + clip.duration;
            });
            if (activeVideoClip && activeVideoClip.src) {
                var meta = this.videoMetaCache[activeVideoClip.id];
                if (meta) return { width: meta.width, height: meta.height };
            }
            return null;
        },
        cacheVideoMetadata: function(clip) {
            if (!clip.src || clip.type !== 'video' || this.videoMetaCache[clip.id]) return;
            var self = this;
            var video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                self.videoMetaCache[clip.id] = { width: video.videoWidth, height: video.videoHeight, duration: video.duration };
                video.remove();
                if (self.vm.aspectRatio === '원본') {
                    var ct = self.vm.currentTime;
                    if (ct >= clip.start && ct < clip.start + clip.duration) self.applyAspectRatio('원본');
                }
            };
            video.src = clip.src;
        },
        onMasterVolumeLeave: function() {
            if (this.isDraggingMasterVolume) return;
            var self = this;
            this.masterVolumeHideTimer = setTimeout(function() { if (!self.isDraggingMasterVolume) self.showMasterVolume = false; }, 200);
        },
        onMasterVolumeWheel: function(e) { e.stopPropagation(); this.masterVolume = Math.max(0, Math.min(100, this.masterVolume + (e.deltaY > 0 ? -5 : 5))); },
        handleLaneWheel: function(e) {
            if (!this.isMouseInLane) return;
            var sc = document.getElementById('timeline-scroll-container'); 
            if (!sc) return;
            if (e.shiftKey || e.ctrlKey) { 
                e.preventDefault(); e.stopPropagation();
                var zf = this.currentDisplayZoom > 10 ? 0.15 : 0.3;
                var delta = e.deltaY > 0 ? -this.currentDisplayZoom * zf : this.currentDisplayZoom * zf;
                var nz = Math.max(this.zoomMin, Math.min(this.zoomMax, this.currentDisplayZoom + delta)); 
                if (this.zoomMode === 'playhead') { this.setZoom(nz, 'playhead'); } 
                else { 
                    var lane = document.getElementById('timeline-lane-container'); 
                    if (lane) { 
                        var rect = lane.getBoundingClientRect();
                        var cx = e.clientX - rect.left;
                        var ct = (sc.scrollLeft + cx) / this.pixelsPerSecond; 
                        this.currentDisplayZoom = nz; this.vm.zoom = nz; 
                        var self = this;
                        this.$nextTick(function() { sc.scrollLeft = ct * self.pixelsPerSecond - cx; self.scrollLeft = sc.scrollLeft; }); 
                    } else { this.setZoom(nz); }
                } 
            } else { sc.scrollLeft += e.deltaY; this.scrollLeft = sc.scrollLeft; }
        },
        updateTrackYPositions: function() {
            var accY = 0; var self = this;
            this.trackYPositions = this.vm.tracks.map(function(track) {
                var h = self.getTrackHeight(track.id);
                var pos = { id: track.id, top: accY, bottom: accY + h, height: h };
                accY += h; return pos;
            });
        },
        getTrackIndexFromY: function(relativeY) {
            for (var i = 0; i < this.trackYPositions.length; i++) {
                var pos = this.trackYPositions[i];
                if (relativeY >= pos.top && relativeY < pos.bottom) return i;
            }
            return relativeY < 0 ? 0 : this.trackYPositions.length - 1;
        },
        getTrackHeight: function(trackId) { return this.trackHeights[trackId] || this.defaultTrackHeight; },
        injectStyles: function() {
            if (document.getElementById('timeline-custom-styles')) return;
            var style = document.createElement('style'); style.id = 'timeline-custom-styles';
            style.textContent = '.playhead-line-body{position:absolute;top:24px;width:2px;background:#ef4444;pointer-events:none;z-index:35;transform:translateX(-1px);}.playhead-head{position:absolute;top:2px;width:12px;height:20px;background:transparent;border:2px solid #ef4444;border-radius:0 0 4px 4px;transform:translateX(-6px);cursor:ew-resize;z-index:50;}.playhead-head::after{content:"";position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid #ef4444;}.timeline-select-no-arrow{-webkit-appearance:none;-moz-appearance:none;appearance:none;}.master-volume-popup{display:none;}.master-volume-popup.show{display:flex;}.track-header-container{position:relative;display:flex;flex-direction:column;overflow:hidden;}.track-header-list{scrollbar-width:none;-ms-overflow-style:none;}.track-header-list::-webkit-scrollbar{display:none;}.track-header-inner{position:relative;}.has-submenu{position:relative;}.clip.dragging{opacity:0.8;z-index:100;}.clip.dragging-out{opacity:0.5;border:2px dashed #3b82f6;}.header-resize-handle{position:absolute;right:0;width:3px;cursor:col-resize;background:transparent;z-index:60;transition:background 0.15s;}.header-resize-handle:hover,.header-resize-handle.resizing{background:#3b82f6;}.timeline-scroll-enhanced::-webkit-scrollbar{width:8px;height:8px;}.timeline-scroll-enhanced::-webkit-scrollbar-track{background:rgba(0,0,0,0.1);}.timeline-scroll-enhanced::-webkit-scrollbar-thumb{background:rgba(100,100,100,0.5);border-radius:4px;}.timeline-scroll-enhanced:hover::-webkit-scrollbar{width:14px;height:14px;}.timeline-scroll-enhanced:hover::-webkit-scrollbar-thumb{background:rgba(100,100,100,0.7);}.timeline-scroll-enhanced{scrollbar-width:thin;scrollbar-color:rgba(100,100,100,0.5) rgba(0,0,0,0.1);}.clip-filmstrip{display:flex;overflow:hidden;}.clip-filmstrip-frame{flex-shrink:0;height:100%;background-size:cover;background-position:center;background-repeat:no-repeat;border-right:1px solid rgba(0,0,0,0.3);}';
            document.head.appendChild(style);
        },
        getVolumeIcon: function(v) { return v === 0 ? 'fa-solid fa-volume-xmark' : v < 30 ? 'fa-solid fa-volume-off' : v < 70 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high'; },
        toggleMute: function() { if (this.masterVolume > 0) { this.previousVolume = this.masterVolume; this.masterVolume = 0; } else { this.masterVolume = this.previousVolume || 100; } },
        startMasterVolumeDrag: function(e) { this.isDraggingMasterVolume = true; if (this.masterVolumeHideTimer) { clearTimeout(this.masterVolumeHideTimer); this.masterVolumeHideTimer = null; } this.updateMasterVolumeFromEvent(e); },
        updateMasterVolumeFromEvent: function(e) { var track = e.target.closest('.volume-track'); if (!track) return; var rect = track.getBoundingClientRect(); this.masterVolume = Math.round(Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100))); },
        generateThumbnailsForNewClips: function() { var self = this; this.vm.clips.forEach(function(clip) { if (clip.type === 'video' && clip.src) { if (!self.thumbnailCache[clip.id]) self.generateVideoThumbnails(clip); self.cacheVideoMetadata(clip); } }); },
        generateVideoThumbnails: function(clip) {
            if (!clip.src) return; var self = this;
            var video = document.createElement('video'); video.crossOrigin = 'anonymous'; video.muted = true; video.preload = 'metadata';
            video.onloadedmetadata = function() {
                var duration = video.duration || clip.duration || 10;
                var frameCount = Math.min(60, Math.max(10, Math.ceil(duration)));
                var frames = {}; var loaded = 0;
                var captureFrame = function(index) { video.currentTime = (index / frameCount) * duration; };
                video.onseeked = function() {
                    var canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 45;
                    var ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    try { frames[loaded] = canvas.toDataURL('image/jpeg', 0.6); } catch (err) { frames[loaded] = null; }
                    loaded++; if (loaded < frameCount) captureFrame(loaded); else { self.thumbnailCache[clip.id] = frames; video.remove(); }
                };
                captureFrame(0);
            };
            video.onerror = function() { self.thumbnailCache[clip.id] = {}; };
            video.src = clip.src;
        },
        getFilmstripFrames: function(clip) {
            var clipPixelWidth = this.getClipPixelWidth(clip);
            var pps = this.pixelsPerSecond;
            var dynamicFrameWidth;
            if (pps >= 100) { dynamicFrameWidth = this.MAX_FILMSTRIP_FRAME_WIDTH; }
            else if (pps >= 50) { dynamicFrameWidth = 60; }
            else if (pps >= 20) { dynamicFrameWidth = this.FILMSTRIP_FRAME_WIDTH; }
            else if (pps >= 10) { dynamicFrameWidth = 30; }
            else { dynamicFrameWidth = this.MIN_FILMSTRIP_FRAME_WIDTH; }
            var frameCount = Math.max(1, Math.ceil(clipPixelWidth / dynamicFrameWidth));
            var actualFrameWidth = clipPixelWidth / frameCount;
            var frames = [];
            var cached = this.thumbnailCache[clip.id] || {};
            var cachedKeys = Object.keys(cached);
            var cachedCount = cachedKeys.length;
            for (var i = 0; i < frameCount; i++) {
                var framePosition = i / frameCount;
                var thumbnailIndex = Math.floor(framePosition * cachedCount);
                var src = cached[thumbnailIndex] || (clip.type === 'image' ? clip.src : null);
                frames.push({ width: actualFrameWidth, src: src });
            }
            return frames;
        },
        getThumbnail: function(clip, pos) { if (!clip.src || clip.type !== 'video') return null; var cached = this.thumbnailCache[clip.id]; if (!cached) return null; var keys = Object.keys(cached); return cached[Math.floor(pos * keys.length)] || null; },
        getWaveformBars: function(clip) {
            var w = this.getClipPixelWidth(clip); var count = Math.min(this.MAX_WAVEFORM_BARS, Math.max(15, Math.floor(w / 3))); var bars = []; var bw = 100 / count * 0.6;
            var waveData = this.waveformCache[clip.id];
            if (!waveData) { waveData = []; for (var i = 0; i < 100; i++) waveData.push(12 + Math.sin(i * 0.8 + (clip.id.charCodeAt(0) || 0)) * 10 + (i % 4) * 3); this.waveformCache[clip.id] = waveData; }
            for (var j = 0; j < count; j++) { var x = (j / count) * 100; var dataIndex = Math.floor((j / count) * waveData.length); var amp = waveData[dataIndex] || 15; bars.push({ x: x, y: 50 - amp, w: bw, h: amp * 2 }); }
            return bars;
        },
        getWaveformHeight: function(track) { return Math.max(14, Math.floor((this.getTrackHeight(track.id) - 18) * 0.35)); },
        getWaveformBgColor: function(clip) { return clip.type === 'sound' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.1)'; },
        getWaveformBarColor: function(clip) { return clip.type === 'sound' ? 'rgba(34,197,94,0.8)' : 'rgba(59,130,246,0.6)'; },
        getVolumeLinePosition: function(clip) { return Math.min(95, Math.max(5, ((clip.volume || 100) / 200) * 100)); },
        startClipVolumeDrag: function(e, clip) { e.preventDefault(); this.isDraggingClipVolume = true; this.volumeDragClip = clip; this.volumeDragStartY = e.clientY; this.volumeDragStartVolume = clip.volume || 100; },
        openVolumePopup: function(e, clip) { this.closeContextMenus(); var rect = e.target.getBoundingClientRect(); this.volumePopup = { visible: true, x: rect.left - 20, y: rect.top - 130, clip: clip, value: clip.volume || 100 }; },
        startVolumePopupDrag: function(e) { this.isDraggingVolumePopup = true; this.updateVolumePopupFromEvent(e); },
        updateVolumePopupFromEvent: function(e) { var track = e.target.closest('.volume-track'); if (!track) return; var rect = track.getBoundingClientRect(); var val = Math.round(Math.max(0, Math.min(200, (1 - (e.clientY - rect.top) / rect.height) * 200))); this.volumePopup.value = val; if (this.volumePopup.clip) { this.volumePopup.clip.volume = val; if (window.PreviewRenderer) window.PreviewRenderer.updateClipVolume(this.volumePopup.clip.id, val / 100); } },
        isClipAtPlayhead: function(clip) { return this.vm.currentTime > clip.start && this.vm.currentTime < clip.start + clip.duration; },
        onWindowResize: function() { this.adjustLayout(); this.updateViewportSize(); this.updateTrackYPositions(); },
        updateViewportSize: function() { var c = document.getElementById('timeline-scroll-container'); if (c) this.viewportWidth = c.clientWidth; },
        onTimelineScroll: function(e) { this.scrollLeft = e.target.scrollLeft; var headerList = this.$refs.trackHeaderList; if (headerList && !this._syncingScroll) { this._syncingScroll = true; headerList.scrollTop = e.target.scrollTop; var self = this; this.$nextTick(function() { self._syncingScroll = false; }); } },
        isClipVisible: function(clip) { var s = clip.start * this.pixelsPerSecond; var en = (clip.start + clip.duration) * this.pixelsPerSecond; return en >= this.scrollLeft - 100 && s <= this.scrollLeft + this.viewportWidth + 100; },
        getVisibleClipsForTrack: function(trackId) { var self = this; return this.vm.clips.filter(function(c) { return c.trackId === trackId && self.isClipVisible(c); }); },
        calculateDynamicZoomRange: function() { var c = document.getElementById('timeline-scroll-container'); if (!c) return; this.zoomMin = Math.max(0.1, (c.clientWidth - 40) / Math.max(60, this.maxClipEnd + 30) / 2); if (this.currentDisplayZoom < this.zoomMin) this.currentDisplayZoom = this.zoomMin; },
        zoomToFit: function() { var c = document.getElementById('timeline-scroll-container'); if (!c) return; this.currentDisplayZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, (c.clientWidth - 40) / Math.max(10, this.maxClipEnd + 5))); this.vm.zoom = this.currentDisplayZoom; var self = this; this.$nextTick(function() { c.scrollLeft = 0; self.scrollLeft = 0; }); },
        updateTrackName: function(track, v) { track.name = v.trim() === '' ? 'NONE' : v; },
        formatClipDuration: function(d) { if (!d) return '0:00'; var h = Math.floor(d/3600); var m = Math.floor((d%3600)/60); var s = Math.floor(d%60); return h > 0 ? h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') : m + ':' + String(s).padStart(2,'0'); },
        getClipPixelWidth: function(clip) { return Math.max(20, clip.duration * this.pixelsPerSecond); },
        getClipBackgroundStyle: function(clip, track) { return { background: 'linear-gradient(180deg, ' + (track.color || '#3b82f6') + '50 0%, ' + (track.color || '#3b82f6') + '30 100%)' }; },
        saveToHistory: function() { if (this.isUndoRedoAction) return; var state = { clips: JSON.parse(JSON.stringify(this.vm.clips)), tracks: JSON.parse(JSON.stringify(this.vm.tracks)) }; if (this.historyIndex < this.historyStack.length - 1) this.historyStack = this.historyStack.slice(0, this.historyIndex + 1); this.historyStack.push(state); if (this.historyStack.length > this.maxHistorySize) this.historyStack.shift(); else this.historyIndex++; },
        undo: function() { if (!this.canUndo) return; this.isUndoRedoAction = true; this.historyIndex--; var s = this.historyStack[this.historyIndex]; this.vm.clips = JSON.parse(JSON.stringify(s.clips)); this.vm.tracks = JSON.parse(JSON.stringify(s.tracks)); this.selectedClipIds = []; this.syncVmSelectedClip(); var self = this; this.$nextTick(function() { self.isUndoRedoAction = false; }); },
        redo: function() { if (!this.canRedo) return; this.isUndoRedoAction = true; this.historyIndex++; var s = this.historyStack[this.historyIndex]; this.vm.clips = JSON.parse(JSON.stringify(s.clips)); this.vm.tracks = JSON.parse(JSON.stringify(s.tracks)); this.selectedClipIds = []; this.syncVmSelectedClip(); var self = this; this.$nextTick(function() { self.isUndoRedoAction = false; }); },
        toggleZoomMode: function() { this.zoomMode = this.zoomMode === 'cursor' ? 'playhead' : 'cursor'; },
        handleZoomInput: function(e) { this.setZoom(Number(e.target.value), this.zoomMode === 'playhead' ? 'playhead' : null); },
        setZoom: function(z, center) { this.currentDisplayZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, z)); this.vm.zoom = this.currentDisplayZoom; if (center === 'playhead') { var self = this; this.$nextTick(function() { var sc = document.getElementById('timeline-scroll-container'); if (sc) { sc.scrollLeft = self.vm.currentTime * self.pixelsPerSecond - sc.clientWidth / 2; self.scrollLeft = sc.scrollLeft; } }); } },
        initTrackHeights: function() { var self = this; this.vm.tracks.forEach(function(t) { if (!self.trackHeights[t.id]) self.trackHeights[t.id] = self.defaultTrackHeight; }); this.updateTrackYPositions(); },
        toggleResolutionDropdown: function() { this.isResolutionDropdownOpen = !this.isResolutionDropdownOpen; if (this.isResolutionDropdownOpen) this.isAspectDropdownOpen = false; },
        selectResolution: function(v) { if (this.vm) { this.vm.resolution = v; this.applyAspectRatio(this.vm.aspectRatio); } this.isResolutionDropdownOpen = false; },
        clipStyle: function(clip, track) { var h = this.getTrackHeight(track.id); return { left: clip.start * this.pixelsPerSecond + 'px', width: Math.max(20, clip.duration * this.pixelsPerSecond) + 'px', top: '1px', height: (h - 2) + 'px' }; },
        getClipClasses: function(clip) { var sel = this.selectedClipIds.indexOf(clip.id) >= 0; var dragging = this.isDraggingClip && this.draggingClipIds.indexOf(clip.id) >= 0; var draggingOut = this.isDraggingClipOut && this.clipDragOutData && this.clipDragOutData.id === clip.id; return { 'clip-selected': sel && this.selectedClipIds.length === 1, 'clip-multi-selected': sel && this.selectedClipIds.length > 1, 'dragging': dragging, 'dragging-out': draggingOut }; },
        selectClip: function(clipId, mod) {
            mod = mod || {}; var self = this;
            var clip = this.vm.clips.find(function(c) { return c.id === clipId; }); if (!clip) return;
            if (mod.ctrlKey || mod.metaKey) { var idx = this.selectedClipIds.indexOf(clipId); if (idx >= 0) this.selectedClipIds.splice(idx, 1); else this.selectedClipIds.push(clipId); }
            else if (mod.shiftKey && this.lastSelectedClipId && this.lastSelectedTrackId === clip.trackId) { var tc = this.vm.clips.filter(function(c) { return c.trackId === clip.trackId; }).sort(function(a, b) { return a.start - b.start; }); var li = -1, ci = -1; for (var i = 0; i < tc.length; i++) { if (tc[i].id === self.lastSelectedClipId) li = i; if (tc[i].id === clipId) ci = i; } if (li >= 0 && ci >= 0) this.selectedClipIds = tc.slice(Math.min(li, ci), Math.max(li, ci) + 1).map(function(c) { return c.id; }); }
            else { this.selectedClipIds = [clipId]; }
            this.lastSelectedClipId = clipId; this.lastSelectedTrackId = clip.trackId; this.syncVmSelectedClip();
        },
        clearSelection: function() { this.selectedClipIds = []; this.lastSelectedClipId = null; this.lastSelectedTrackId = null; this.syncVmSelectedClip(); },
        onClipMouseDown: function(e, clip, track) {
            if (track.isLocked) return;
            this.dragStartX = e.clientX; this.dragStartY = e.clientY;
            this.pendingClickClipId = clip.id; this.pendingClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
            var trackIndex = -1; for (var i = 0; i < this.vm.tracks.length; i++) { if (this.vm.tracks[i].id === track.id) { trackIndex = i; break; } }
            this.currentDragTrackIndex = trackIndex;
            if (this.selectedClipIds.indexOf(clip.id) < 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) { this.selectedClipIds = [clip.id]; this.lastSelectedClipId = clip.id; this.lastSelectedTrackId = clip.trackId; this.syncVmSelectedClip(); }
            this.draggingClipIds = this.selectedClipIds.slice(); if (this.draggingClipIds.indexOf(clip.id) < 0) this.draggingClipIds = [clip.id];
            this.dragStartPositions = {}; this.dragStartTrackIds = {}; var self = this;
            this.draggingClipIds.forEach(function(id) { var c = self.vm.clips.find(function(cl) { return cl.id === id; }); if (c) { self.dragStartPositions[id] = c.start; self.dragStartTrackIds[id] = c.trackId; } });
        },
        onTrackLaneMouseDown: function(e, track) { if (!e.target.closest('.clip')) this.clearSelection(); },
        syncVmSelectedClip: function() { var self = this; this.vm.selectedClip = this.selectedClipIds.length === 1 ? this.vm.clips.find(function(c) { return c.id === self.selectedClipIds[0]; }) || null : null; },
        onDocumentClick: function(e) { if (!e.target.closest('.context-menu') && !e.target.closest('.clip-volume-popup')) this.closeContextMenus(); if (!e.target.closest('.resolution-dropdown-wrapper')) this.isResolutionDropdownOpen = false; if (!e.target.closest('.aspect-ratio-dropdown-wrapper')) this.isAspectDropdownOpen = false; if (!e.target.closest('.clip-volume-popup') && !e.target.closest('.ctx-item')) this.volumePopup.visible = false; },
        onDocumentKeyDown: function(e) {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); this.undo(); return; }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); this.redo(); return; }
            if (e.key === 'Delete' && this.hasSelectedClips) this.deleteSelectedClips();
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); this.selectedClipIds = this.vm.clips.map(function(c) { return c.id; }); this.syncVmSelectedClip(); }
            if (e.key === 'Escape') { this.clearSelection(); this.isResolutionDropdownOpen = false; this.isAspectDropdownOpen = false; this.volumePopup.visible = false; this.wheelAdjustMode.active = false; }
        },
        onDocumentMouseMove: function(e) {
            var self = this;
            if (this.isResizingHeader && !this.isTrackHeaderCollapsed) { var newWidth = this.resizeStartWidth + (e.clientX - this.resizeStartX); this.trackHeaderWidth = Math.max(this.minHeaderWidth, Math.min(this.initialHeaderWidth, newWidth)); }
            if (this.isResizingTrack && this.resizingTrackId) { this.trackHeights[this.resizingTrackId] = Math.max(this.minTrackHeight, this.resizeStartHeight + (e.clientY - this.resizeStartY)); this.trackHeights = Object.assign({}, this.trackHeights); }
            if (this.isDraggingPlayhead) this.updatePlayheadPosition(e);
            if (this.isDraggingMasterVolume) this.updateMasterVolumeFromEvent(e);
            if (this.isDraggingVolumePopup) this.updateVolumePopupFromEvent(e);
            if (this.isDraggingClipVolume && this.volumeDragClip) { var dy = this.volumeDragStartY - e.clientY; var newVol = Math.max(0, Math.min(200, Math.round(this.volumeDragStartVolume + dy * 2))); this.volumeDragClip.volume = newVol; if (window.PreviewRenderer) window.PreviewRenderer.updateClipVolume(this.volumeDragClip.id, newVol / 100); }
            if (this.pendingClickClipId && !this.isDraggingClip && this.draggingClipIds.length > 0) { 
                if (Math.abs(e.clientX - this.dragStartX) > 3 || Math.abs(e.clientY - this.dragStartY) > 3) { 
                    var timelinePanel = document.getElementById('timeline-main-panel');
                    if (timelinePanel) {
                        var rect = timelinePanel.getBoundingClientRect();
                        if (e.clientY < rect.top || e.clientY > rect.bottom) {
                            this.startClipDragOut(e);
                        } else {
                            this.isDraggingClip = true; 
                        }
                    } else {
                        this.isDraggingClip = true;
                    }
                    this.pendingClickClipId = null; 
                } 
            }
            if (this.isDraggingClip && this.draggingClipIds.length > 0) this.handleClipDrag(e);
            if (this.isResizingClip && this.resizingClip) this.handleClipResize(e);
        },
        startClipDragOut: function(e) {
            if (this.draggingClipIds.length === 0) return;
            var self = this;
            var clip = this.vm.clips.find(function(c) { return c.id === self.draggingClipIds[0]; });
            if (!clip) return;
            this.isDraggingClipOut = true;
            this.clipDragOutData = { id: clip.id, name: clip.name, type: clip.type, src: clip.src || '', duration: clip.duration, volume: clip.volume || 100 };
        },
        onDocumentMouseUp: function(e) {
            if (this.isDraggingClipOut && this.clipDragOutData) {
                var mediaAssetPanel = document.querySelector('.media-asset-drop-zone');
                if (mediaAssetPanel) {
                    var rect = mediaAssetPanel.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        this.exportClipToAsset(this.clipDragOutData);
                    }
                }
                this.isDraggingClipOut = false;
                this.clipDragOutData = null;
            }
            if (this.pendingClickClipId && !this.isDraggingClip) this.selectClip(this.pendingClickClipId, this.pendingClickModifiers || {});
            this.pendingClickClipId = null; this.pendingClickModifiers = null;
            this.isResizingHeader = false; this.isResizingTrack = false; this.resizingTrackId = null;
            this.isDraggingPlayhead = false; this.isDraggingClip = false;
            this.draggingClipIds = []; this.dragStartPositions = {}; this.dragStartTrackIds = {}; this.currentDragTrackIndex = null;
            this.isResizingClip = false; this.resizingClip = null;
            if (this.isDraggingMasterVolume) this.isDraggingMasterVolume = false;
            this.isDraggingClipVolume = false; this.volumeDragClip = null;
            this.isDraggingVolumePopup = false;
        },
        exportClipToAsset: function(clip) {
            var clipData = clip.id ? clip : this.vm.clips.find(function(c) { return c.id === clip.id; });
            if (!clipData) clipData = clip;
            var event = new CustomEvent('wai-clip-to-asset', {
                detail: { id: clipData.id, name: clipData.name || 'Clip', type: clipData.type || 'video', src: clipData.src || '', duration: clipData.duration || 0, resolution: clipData.resolution || '' },
                bubbles: true
            });
            document.dispatchEvent(event);
        },
        // 클립 겹침 검사 - 같은 트랙 내 다른 클립과 겹치는지 확인
        getClipsInTrack: function(trackId, excludeClipIds) {
            excludeClipIds = excludeClipIds || [];
            var self = this;
            return this.vm.clips.filter(function(c) {
                return c.trackId === trackId && excludeClipIds.indexOf(c.id) < 0;
            }).sort(function(a, b) { return a.start - b.start; });
        },
        // 클립이 특정 위치에서 겹치는지 확인하고 유효한 위치 반환
        findValidClipPosition: function(clip, newStart, targetTrackId, excludeClipIds) {
            var trackClips = this.getClipsInTrack(targetTrackId, excludeClipIds);
            var clipEnd = newStart + clip.duration;
            var minGap = this.CLIP_MIN_GAP;
            
            // 겹치는 클립이 있는지 확인
            for (var i = 0; i < trackClips.length; i++) {
                var other = trackClips[i];
                var otherEnd = other.start + other.duration;
                
                // 겹침 감지
                if (newStart < otherEnd && clipEnd > other.start) {
                    // 왼쪽으로 이동하려 했다면 다른 클립 끝으로 스냅
                    if (newStart < other.start) {
                        return { position: other.start - clip.duration - minGap, snapped: true, blocked: false };
                    }
                    // 오른쪽으로 이동하려 했다면 다른 클립 끝으로 스냅
                    else {
                        return { position: otherEnd + minGap, snapped: true, blocked: false };
                    }
                }
            }
            
            // 겹침 없음
            return { position: newStart, snapped: false, blocked: false };
        },
        // 클립 드래그 핸들러 - 겹침 방지 로직 추가
        handleClipDrag: function(e) {
            var self = this;
            var dx = e.clientX - this.dragStartX;
            var dt = dx / this.pixelsPerSecond;
            var lane = document.getElementById('timeline-lane-container');
            
            if (lane) {
                var rect = lane.getBoundingClientRect();
                var relY = e.clientY - rect.top - 24;
                var newIdx = this.getTrackIndexFromY(relY);
                
                if (newIdx !== -1 && this.currentDragTrackIndex !== null && newIdx !== this.currentDragTrackIndex) {
                    var target = this.vm.tracks[newIdx];
                    if (target && !target.isLocked) {
                        // 트랙 변경 시 겹침 검사
                        var canMove = true;
                        this.draggingClipIds.forEach(function(cid) {
                            var c = self.vm.clips.find(function(cl) { return cl.id === cid; });
                            if (c) {
                                var result = self.findValidClipPosition(c, c.start, target.id, self.draggingClipIds);
                                if (result.blocked) canMove = false;
                            }
                        });
                        
                        if (canMove) {
                            this.draggingClipIds.forEach(function(cid) {
                                var c = self.vm.clips.find(function(cl) { return cl.id === cid; });
                                if (c) {
                                    c.trackId = target.id;
                                    self.dragStartTrackIds[cid] = target.id;
                                }
                            });
                            this.currentDragTrackIndex = newIdx;
                        }
                    }
                }
            }
            
            // 시간 위치 업데이트 (겹침 방지 적용)
            this.draggingClipIds.forEach(function(id) {
                var c = self.vm.clips.find(function(cl) { return cl.id === id; });
                if (!c) return;
                
                var ns = Math.max(0, self.dragStartPositions[id] + dt);
                
                // 스냅 적용
                if (self.vm.isMagnet) {
                    var snap = self.findSnapPosition(ns, c, self.draggingClipIds);
                    if (snap.snapped) ns = snap.position;
                }
                
                // 겹침 방지 적용
                var validPos = self.findValidClipPosition(c, ns, c.trackId, self.draggingClipIds);
                c.start = Math.max(0, validPos.position);
            });
        },
        startClipResize: function(e, clip, dir) { var self = this; var t = this.vm.tracks.find(function(tr) { return tr.id === clip.trackId; }); if (t && t.isLocked) return; e.preventDefault(); this.isResizingClip = true; this.resizingClip = clip; this.resizeDirection = dir; this.dragStartX = e.clientX; this.resizeStartClipStart = clip.start; this.resizeStartClipDuration = clip.duration; },
        // 클립 리사이즈 핸들러 - 겹침 방지 로직 추가
        handleClipResize: function(e) {
            var dt = (e.clientX - this.dragStartX) / this.pixelsPerSecond;
            var clip = this.resizingClip;
            var trackClips = this.getClipsInTrack(clip.trackId, [clip.id]);
            
            if (this.resizeDirection === 'left') {
                var ns = this.resizeStartClipStart + dt;
                var nd = this.resizeStartClipDuration - dt;
                
                if (ns < 0) { nd += ns; ns = 0; }
                if (nd < 0.5) { nd = 0.5; ns = this.resizeStartClipStart + this.resizeStartClipDuration - 0.5; }
                
                // 왼쪽 리사이즈 시 이전 클립과 겹침 방지
                for (var i = 0; i < trackClips.length; i++) {
                    var other = trackClips[i];
                    var otherEnd = other.start + other.duration;
                    if (otherEnd > ns && other.start < this.resizeStartClipStart) {
                        ns = otherEnd + this.CLIP_MIN_GAP;
                        nd = this.resizeStartClipStart + this.resizeStartClipDuration - ns;
                        break;
                    }
                }
                
                clip.start = ns;
                clip.duration = nd;
            } else {
                var nd2 = this.resizeStartClipDuration + dt;
                if (nd2 < 0.5) nd2 = 0.5;
                
                var clipEnd = clip.start + nd2;
                
                // 오른쪽 리사이즈 시 다음 클립과 겹침 방지
                for (var j = 0; j < trackClips.length; j++) {
                    var other2 = trackClips[j];
                    if (other2.start > clip.start && clipEnd > other2.start) {
                        nd2 = other2.start - clip.start - this.CLIP_MIN_GAP;
                        break;
                    }
                }
                
                clip.duration = Math.max(0.5, nd2);
            }
        },
        findSnapPosition: function(ns, clip, excludeIds) {
            excludeIds = excludeIds || []; var sd = 10 / this.pixelsPerSecond; var ce = ns + clip.duration;
            if (Math.abs(ns - this.vm.currentTime) < sd) return { snapped: true, position: this.vm.currentTime };
            if (Math.abs(ce - this.vm.currentTime) < sd) return { snapped: true, position: this.vm.currentTime - clip.duration };
            for (var i = 0; i < this.vm.clips.length; i++) { var c = this.vm.clips[i]; if (c.id === clip.id || excludeIds.indexOf(c.id) >= 0) continue; if (Math.abs(ns - (c.start + c.duration)) < sd) return { snapped: true, position: c.start + c.duration }; if (Math.abs(ns - c.start) < sd) return { snapped: true, position: c.start }; if (Math.abs(ce - c.start) < sd) return { snapped: true, position: c.start - clip.duration }; }
            return { snapped: false, position: ns };
        },
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
        openTrackContextMenu: function(e, track, idx) { this.clipContextMenu = null; this.heightSubmenu.visible = false; this.trackContextMenu = { x: e.clientX, y: e.clientY, track: track, index: idx }; },
        openClipContextMenu: function(e, track, clip) { clip = clip || null; this.trackContextMenu = null; this.heightSubmenu.visible = false; if (clip && this.selectedClipIds.indexOf(clip.id) < 0) { this.selectedClipIds = [clip.id]; this.syncVmSelectedClip(); } this.clipContextMenu = { x: e.clientX, y: e.clientY, track: track, clip: clip, time: this.getTimeFromMouseEvent(e) }; },
        getTimeFromMouseEvent: function(e) { var lane = document.getElementById('timeline-lane-container'); if (!lane) return 0; return Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pixelsPerSecond); },
        closeContextMenus: function() { this.trackContextMenu = null; this.clipContextMenu = null; this.heightSubmenu.visible = false; },
        duplicateClip: function(clip) { 
            var nc = Object.assign({}, clip, { id: 'c_' + Date.now(), start: clip.start + clip.duration + 0.5 }); 
            // 복제 시 겹침 방지
            var validPos = this.findValidClipPosition(nc, nc.start, nc.trackId, []);
            nc.start = validPos.position;
            this.vm.clips.push(nc); 
        },
        deleteClip: function(clip) { this.vm.clips = this.vm.clips.filter(function(c) { return c.id !== clip.id; }); this.selectedClipIds = this.selectedClipIds.filter(function(id) { return id !== clip.id; }); this.syncVmSelectedClip(); },
        addClipAtPosition: function() { 
            if (!this.clipContextMenu) return; 
            var t = this.clipContextMenu.track; 
            var time = this.clipContextMenu.time || 0; 
            var newClip = { id: 'c_' + Date.now(), trackId: t.id, name: 'New Clip', start: time, duration: 5, type: 'video', volume: 100 };
            // 추가 시 겹침 방지
            var validPos = this.findValidClipPosition(newClip, time, t.id, []);
            newClip.start = validPos.position;
            this.vm.clips.push(newClip); 
        },
        deleteSelectedClips: function() { if (!this.hasSelectedClips) return; var self = this; this.vm.clips = this.vm.clips.filter(function(c) { return self.selectedClipIds.indexOf(c.id) < 0; }); this.selectedClipIds = []; this.syncVmSelectedClip(); },
        cutAtPlayhead: function() { if (!this.hasSelectedClips) return; var self = this; this.selectedClipIds.forEach(function(cid) { var c = self.vm.clips.find(function(cl) { return cl.id === cid; }); if (c && self.isClipAtPlayhead(c)) { var origDur = c.duration; var relTime = self.vm.currentTime - c.start; c.duration = relTime; self.vm.clips.push(Object.assign({}, c, { id: 'c_' + Date.now(), start: self.vm.currentTime, duration: origDur - relTime })); } }); },
        cutAtPlayheadForClip: function(clip) { if (!this.isClipAtPlayhead(clip)) return; var origDur = clip.duration; var relTime = this.vm.currentTime - clip.start; clip.duration = relTime; this.vm.clips.push(Object.assign({}, clip, { id: 'c_' + Date.now(), start: this.vm.currentTime, duration: origDur - relTime })); },
        cutAndDeleteLeftSelected: function() { if (!this.hasSelectedClips) return; var self = this; this.selectedClipIds.forEach(function(cid) { var c = self.vm.clips.find(function(cl) { return cl.id === cid; }); if (c && self.isClipAtPlayhead(c)) { c.duration = c.start + c.duration - self.vm.currentTime; c.start = self.vm.currentTime; } }); },
        cutAndDeleteRightSelected: function() { if (!this.hasSelectedClips) return; var self = this; this.selectedClipIds.forEach(function(cid) { var c = self.vm.clips.find(function(cl) { return cl.id === cid; }); if (c && self.isClipAtPlayhead(c)) { c.duration = self.vm.currentTime - c.start; } }); },
        cutAndDeleteLeftForClip: function(clip) { if (!this.isClipAtPlayhead(clip)) return; clip.duration = clip.start + clip.duration - this.vm.currentTime; clip.start = this.vm.currentTime; },
        cutAndDeleteRightForClip: function(clip) { if (!this.isClipAtPlayhead(clip)) return; clip.duration = this.vm.currentTime - clip.start; },
        
        // 사운드 분리 관련 메서드
        canExtractAudio: function(clip) {
            // 비디오 클립만 사운드 분리 가능
            return clip && clip.type === 'video' && clip.src;
        },
        toggleClipMute: function(clip) {
            if (!clip) return;
            clip.isMuted = !clip.isMuted;
        },
        extractAudioFromClip: function(clip) {
            if (!this.canExtractAudio(clip)) return;
            
            var self = this;
            
            // 오디오 트랙 찾기 또는 생성
            var audioTrack = this.vm.tracks.find(function(t) { return t.type === 'audio'; });
            if (!audioTrack) {
                // 오디오 트랙이 없으면 새로 생성
                audioTrack = {
                    id: 't_audio_' + Date.now(),
                    name: 'Audio',
                    type: 'audio',
                    color: '#22c55e',
                    isHidden: false,
                    isLocked: false,
                    isMain: false
                };
                this.vm.tracks.push(audioTrack);
                this.trackHeights[audioTrack.id] = this.defaultTrackHeight;
                this.trackHeights = Object.assign({}, this.trackHeights);
            }
            
            // 새 오디오 클립 생성
            var audioClip = {
                id: 'c_audio_' + Date.now(),
                trackId: audioTrack.id,
                name: clip.name + ' (Audio)',
                start: clip.start,
                duration: clip.duration,
                type: 'sound',
                src: clip.src,
                volume: clip.volume || 100,
                sourceClipId: clip.id
            };
            
            // 겹침 방지 적용
            var validPos = this.findValidClipPosition(audioClip, audioClip.start, audioTrack.id, []);
            audioClip.start = validPos.position;
            
            // 원본 클립 음소거 옵션 표시
            Swal.fire({
                title: '사운드 분리',
                text: '원본 비디오 클립을 음소거 하시겠습니까?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '음소거',
                cancelButtonText: '유지',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            }).then(function(result) {
                if (result.isConfirmed) {
                    clip.isMuted = true;
                }
                // 오디오 클립 추가
                self.vm.clips.push(audioClip);
            });
        },
        
        handleLaneMouseDown: function(e) { if (e.target.id === 'timeline-ruler' || e.target.closest('#timeline-ruler')) this.updatePlayheadPosition(e); },
        startPlayheadDrag: function(e) { this.isDraggingPlayhead = true; this.updatePlayheadPosition(e); },
        updatePlayheadPosition: function(e) { var lane = document.getElementById('timeline-lane-container'); if (!lane) return; var time = Math.max(0, (e.clientX - lane.getBoundingClientRect().left) / this.pixelsPerSecond); if (this.vm.isMagnet) { var snap = null; var minD = 10 / this.pixelsPerSecond; this.vm.clips.forEach(function(c) { if (Math.abs(time - c.start) < minD) { minD = Math.abs(time - c.start); snap = c.start; } if (Math.abs(time - (c.start + c.duration)) < minD) { minD = Math.abs(time - (c.start + c.duration)); snap = c.start + c.duration; } }); if (snap !== null) time = snap; } this.vm.currentTime = time; },
        togglePlayback: function() { if (typeof this.vm.togglePlayback === 'function') this.vm.togglePlayback(); else this.vm.isPlaying = !this.vm.isPlaying; },
        seekToStart: function() { if (typeof this.vm.seekToStart === 'function') this.vm.seekToStart(); else this.vm.currentTime = 0; },
        seekToEnd: function() { var max = 0; this.vm.clips.forEach(function(c) { if (c.start + c.duration > max) max = c.start + c.duration; }); this.vm.currentTime = max; },
        seekBackward: function() {
            var newTime = Math.max(0, this.vm.currentTime - 5);
            this.vm.currentTime = newTime;
            if (window.PreviewRenderer) { window.PreviewRenderer.setCurrentTime(newTime); }
        },
        seekForward: function() {
            var maxTime = this.maxClipEnd;
            var newTime = Math.min(maxTime, this.vm.currentTime + 5);
            this.vm.currentTime = newTime;
            if (window.PreviewRenderer) { window.PreviewRenderer.setCurrentTime(newTime); }
        },
        adjustLayout: function() { var p = document.getElementById('preview-main-container'); if (p) p.style.height = this.vm.isTimelineCollapsed ? 'calc(100% - 32px)' : '50%'; this.calculateDynamicZoomRange(); },
        toggleCollapse: function() { this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed; var self = this; this.$nextTick(function() { self.adjustLayout(); }); },
        startHeaderResize: function(e) { if (this.isTrackHeaderCollapsed) return; this.isResizingHeader = true; this.resizeStartX = e.clientX; this.resizeStartWidth = this.trackHeaderWidth; },
        formatRulerTime: function(s) { if (s >= 3600) { var h = Math.floor(s/3600); var m = Math.floor((s%3600)/60); var sec = Math.floor(s%60); return h + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0'); } else if (s >= 60) { var m2 = Math.floor(s/60); var sec2 = Math.floor(s%60); return m2 + ':' + String(sec2).padStart(2,'0'); } return s + 's'; },
        onExternalDragOver: function(e) { if (e.dataTransfer.types.indexOf('text/wai-asset') >= 0) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; this.isExternalDragOver = true; this.updateDropIndicator(e); } },
        onExternalDragLeave: function(e) { var rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) { this.isExternalDragOver = false; this.dropIndicator.visible = false; } },
        updateDropIndicator: function(e) { var lane = document.getElementById('timeline-lane-container'); if (!lane) return; var rect = lane.getBoundingClientRect(); var relY = e.clientY - rect.top - 24; var accH = 0; var targetTrack = null; for (var i = 0; i < this.vm.tracks.length; i++) { var t = this.vm.tracks[i]; var h = this.getTrackHeight(t.id); if (relY >= accH && relY < accH + h) { targetTrack = t; break; } accH += h; } if (!targetTrack) { this.dropIndicator.visible = false; return; } var dropTime = Math.max(0, (e.clientX - rect.left) / this.pixelsPerSecond); this.dropIndicator = { visible: true, trackId: targetTrack.id, left: dropTime * this.pixelsPerSecond, width: 5 * this.pixelsPerSecond }; },
        onExternalDrop: function(e) { e.preventDefault(); this.isExternalDragOver = false; this.dropIndicator.visible = false; var assetData; try { var raw = e.dataTransfer.getData('text/wai-asset'); if (!raw) return; assetData = JSON.parse(raw); } catch (err) { return; } var assets = Array.isArray(assetData) ? assetData : [assetData]; if (assets.length === 0) return; var lane = document.getElementById('timeline-lane-container'); var dropTime = this.vm.currentTime; var targetTrackId = null; if (lane) { var rect = lane.getBoundingClientRect(); dropTime = Math.max(0, (e.clientX - rect.left) / this.pixelsPerSecond); var relY = e.clientY - rect.top - 24; var accH = 0; for (var i = 0; i < this.vm.tracks.length; i++) { var t = this.vm.tracks[i]; var h = this.getTrackHeight(t.id); if (relY >= accH && relY < accH + h) { targetTrackId = t.id; break; } accH += h; } } document.dispatchEvent(new CustomEvent('wai-timeline-drop', { detail: { assets: assets, dropTime: dropTime, targetTrackId: targetTrackId }, bubbles: true })); }
    }
};

window.TimelinePanel = TimelinePanel;
