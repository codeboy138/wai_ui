// Timeline Panel Component - Enhanced
// 트랙 드래그 순서 변경, Z-Index 연동, 클립-캔버스 연동

var TimelinePanel = {
    props: ['vm'],
    template: '\
        <div\
            id="timeline-main-panel"\
            class="flex flex-col bg-bg-panel select-none h-full"\
            @wheel.prevent="handleWheel"\
        >\
            <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0">\
                <div class="flex items-center gap-2">\
                    <button\
                        class="hover:text-text-main w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover"\
                        @click="toggleCollapse"\
                        :title="vm.isTimelineCollapsed ? \'타임라인 펼치기\' : \'타임라인 접기\'"\
                    >\
                        <i :class="[\'fa-solid\', vm.isTimelineCollapsed ? \'fa-chevron-up\' : \'fa-chevron-down\']"></i>\
                    </button>\
                    <span class="text-xs font-mono text-ui-accent font-bold">{{ formattedTime }}</span>\
                    <div class="flex items-center gap-1 ml-2">\
                        <button class="tool-btn" @click="seekToStart" title="처음으로"><i class="fa-solid fa-backward-step"></i></button>\
                        <button class="tool-btn" @click="togglePlayback" :title="vm.isPlaying ? \'일시정지\' : \'재생\'">\
                            <i :class="vm.isPlaying ? \'fa-solid fa-pause\' : \'fa-solid fa-play\'"></i>\
                        </button>\
                        <button class="tool-btn" @click="seekToEnd" title="끝으로"><i class="fa-solid fa-forward-step"></i></button>\
                    </div>\
                    <div class="flex items-center gap-2 ml-4 text-[10px]">\
                        <select \
                            class="timeline-select-no-arrow bg-bg-input border border-ui-border rounded px-2 py-0.5 text-text-main text-[10px]"\
                            :value="vm.aspectRatio"\
                            @change="vm.setAspect($event.target.value)"\
                        >\
                            <option value="16:9">16:9</option>\
                            <option value="9:16">9:16</option>\
                            <option value="1:1">1:1</option>\
                        </select>\
                        <div class="relative resolution-dropdown-wrapper">\
                            <button \
                                class="timeline-select-no-arrow bg-bg-input border border-ui-border rounded px-2 py-0.5 text-text-main text-[10px] min-w-[40px] text-left"\
                                @click="toggleResolutionDropdown"\
                            >\
                                {{ vm.resolution }}\
                            </button>\
                            <div \
                                v-if="isResolutionDropdownOpen" \
                                class="absolute top-full left-0 mt-1 bg-bg-panel border border-ui-border rounded shadow-lg z-50 min-w-[140px]"\
                            >\
                                <div \
                                    v-for="opt in resolutionOptions" \
                                    :key="opt.value"\
                                    class="px-3 py-1.5 text-[10px] text-text-main hover:bg-bg-hover cursor-pointer flex justify-between gap-4"\
                                    :class="{ \'bg-bg-hover\': vm.resolution === opt.value }"\
                                    @click="selectResolution(opt.value)"\
                                >\
                                    <span>{{ opt.label }}</span>\
                                    <span class="text-text-sub">{{ opt.pixels }}</span>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
                <div class="flex items-center gap-2">\
                    <span class="text-[10px] text-text-sub">{{ Math.round(vm.zoom) }}%</span>\
                    <input type="range" min="10" max="100" :value="vm.zoom" @input="vm.zoom = Number($event.target.value)" class="w-20 accent-ui-accent h-1" />\
                </div>\
            </div>\
            \
            <div v-if="!vm.isTimelineCollapsed" class="h-6 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-[10px]">\
                <div class="flex gap-1 items-center">\
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" title="선택 클립: 자르기+왼쪽삭제" @click="cutAndDeleteLeftSelected">\
                        <span class="text-red-400 text-[10px] leading-none">&lt;</span>\
                        <i class="fa-solid fa-scissors text-[9px]"></i>\
                    </button>\
                    <button class="tool-btn h-5 px-1 flex items-center justify-center" title="선택 클립: 자르기+오른쪽삭제" @click="cutAndDeleteRightSelected">\
                        <i class="fa-solid fa-scissors text-[9px]"></i>\
                        <span class="text-red-400 text-[10px] leading-none">&gt;</span>\
                    </button>\
                    <div class="w-px h-4 bg-ui-border mx-1"></div>\
                    <button class="tool-btn" title="자르기 (플레이헤드 위치에서 분할)" @click="cutAtPlayhead"><i class="fa-solid fa-scissors"></i></button>\
                    <button class="tool-btn" title="삭제" @click="deleteSelectedClips"><i class="fa-solid fa-trash"></i></button>\
                </div>\
                <div class="flex gap-2 items-center">\
                    <span v-if="selectedClipIds.length > 1" class="text-ui-accent">{{ selectedClipIds.length }}개 선택</span>\
                    <button :class="{ \'bg-bg-input border-ui-accent text-ui-accent\': vm.isMagnet }" class="flex items-center gap-1 px-2 py-0.5 rounded border border-transparent text-[10px] hover:bg-ui-selected" @click="vm.isMagnet = !vm.isMagnet">\
                        <i class="fa-solid fa-magnet"></i><span>스냅</span>\
                    </button>\
                    <button :class="{ \'bg-bg-input border-ui-accent text-ui-accent\': vm.isAutoRipple }" class="flex items-center gap-1 px-2 py-0.5 rounded border border-transparent text-[10px] hover:bg-ui-selected" @click="vm.isAutoRipple = !vm.isAutoRipple">\
                        <i class="fa-solid fa-link"></i><span>리플</span>\
                    </button>\
                    <div class="w-px h-4 bg-ui-border mx-1"></div>\
                    <button class="tool-btn" title="트랙 추가" @click="addTrack"><i class="fa-solid fa-plus"></i></button>\
                </div>\
            </div>\
            \
            <div v-if="!vm.isTimelineCollapsed" id="timeline-scroll-container" class="flex-grow overflow-auto timeline-grid relative min-h-0" :style="{ gridTemplateColumns: currentHeaderWidth + \'px 1fr\' }">\
                <div class="sticky-col bg-bg-panel border-r border-ui-border relative" style="z-index: 30;">\
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel sticky top-0" style="z-index: 40;">\
                        <span v-show="!isTrackNamesCollapsed">TRACKS</span>\
                        <div class="flex items-center gap-1">\
                            <button class="w-4 h-4 flex items-center justify-center rounded hover:bg-bg-hover text-[8px]" @click="toggleAllTrackNames" :title="isTrackNamesCollapsed ? \'이름 펼치기\' : \'이름 접기\'">\
                                <i :class="isTrackNamesCollapsed ? \'fa-solid fa-eye\' : \'fa-solid fa-eye-slash\'" style="font-size: 8px;"></i>\
                            </button>\
                        </div>\
                    </div>\
                    <div \
                        v-for="(track, index) in vm.tracks" \
                        :key="track.id"\
                        :data-track-id="track.id"\
                        class="border-b border-ui-border flex items-center px-1 group bg-bg-panel relative transition-all duration-150" \
                        :class="{ \'opacity-50\': track.isLocked, \'bg-ui-accent/20\': dragOverTrackId === track.id && dragOverTrackId !== draggingTrackId }" \
                        :style="{ height: (trackHeights[track.id] || 40) + \'px\' }"\
                        draggable="true"\
                        @dragstart="startTrackDrag($event, track, index)"\
                        @dragover.prevent="handleTrackDragOver($event, track, index)"\
                        @dragleave="handleTrackDragLeave"\
                        @drop.prevent="handleTrackDrop($event, track, index)"\
                        @dragend="endTrackDrag"\
                        @contextmenu.prevent="openTrackContextMenu($event, track, index)"\
                    >\
                        <button \
                            class="w-4 h-4 flex items-center justify-center rounded mr-1 shrink-0 hover:bg-bg-hover"\
                            :class="track.isMain ? \'text-yellow-400\' : \'text-text-sub opacity-30 hover:opacity-100\'"\
                            @click.stop="setMainTrack(track)" \
                            :title="track.isMain ? \'메인 트랙\' : \'메인 트랙으로 설정\'"\
                        >\
                            <i :class="track.isMain ? \'fa-solid fa-star\' : \'fa-regular fa-star\'" style="font-size: 10px;"></i>\
                        </button>\
                        \
                        <div class="flex items-center gap-0.5 mr-1 shrink-0" v-show="(trackHeights[track.id] || 40) >= 30">\
                            <button class="track-control-btn" :class="{ \'active\': !track.isHidden }" @click.stop="track.isHidden = !track.isHidden" title="가시성">\
                                <i :class="track.isHidden ? \'fa-solid fa-eye-slash\' : \'fa-solid fa-eye\'" style="font-size: 8px;"></i>\
                            </button>\
                            <button class="track-control-btn" :class="{ \'locked\': track.isLocked }" @click.stop="track.isLocked = !track.isLocked" title="잠금">\
                                <i :class="track.isLocked ? \'fa-solid fa-lock\' : \'fa-solid fa-lock-open\'" style="font-size: 8px;"></i>\
                            </button>\
                        </div>\
                        <div v-show="!isTrackNamesCollapsed" class="w-1 h-2/3 rounded mr-1 shrink-0" :style="{ backgroundColor: track.color || \'#666\' }"></div>\
                        <input \
                            v-show="!isTrackNamesCollapsed && (trackHeights[track.id] || 40) >= 24"\
                            type="text" \
                            class="text-[10px] truncate flex-1 text-text-main bg-transparent border-none outline-none min-w-0" \
                            :value="track.name" \
                            @input="track.name = $event.target.value" \
                            :disabled="track.isLocked"\
                            @mousedown.stop\
                        />\
                        <div class="absolute left-0 right-0 bottom-0 h-1 cursor-ns-resize hover:bg-ui-accent/50 z-10" @mousedown.prevent.stop="startTrackResize($event, track)"></div>\
                    </div>\
                    <div v-show="!isTrackNamesCollapsed" class="absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-ui-accent/50" style="right: 0; z-index: 50;" @mousedown.prevent="startHeaderResize"></div>\
                </div>\
\
                <div id="timeline-lane-container" class="relative bg-bg-dark min-w-max" @mousedown="handleLaneMouseDown" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">\
                    <div id="timeline-ruler" class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark relative" style="z-index: 20;" :style="{ width: totalTimelineWidth + \'px\' }">\
                        <template v-for="mark in rulerMarks" :key="\'ruler-\' + mark.time">\
                            <div v-if="mark.isMajor" class="absolute top-0 bottom-0 border-l border-ui-border" :style="{ left: mark.position + \'px\' }">\
                                <span class="absolute top-0 left-1 text-[9px] text-text-sub">{{ mark.label }}</span>\
                            </div>\
                            <div v-else-if="mark.isMid" class="absolute bottom-0 h-3 border-l border-ui-border opacity-50" :style="{ left: mark.position + \'px\' }"></div>\
                            <div v-else class="absolute bottom-0 h-1.5 border-l border-ui-border opacity-30" :style="{ left: mark.position + \'px\' }"></div>\
                        </template>\
                        \
                        <div class="playhead-head" :style="{ left: vm.currentTime * vm.zoom + \'px\' }" @mousedown.stop.prevent="startPlayheadDrag"></div>\
                    </div>\
                    \
                    <div \
                        v-for="(track, idx) in vm.tracks" \
                        :key="track.id" \
                        :data-track-id="track.id"\
                        class="border-b border-ui-border relative track-lane" \
                        :class="{ \'opacity-30\': track.isHidden }"\
                        :style="{ height: (trackHeights[track.id] || 40) + \'px\' }"\
                        @mousedown="onTrackLaneMouseDown($event, track)"\
                        @contextmenu.prevent="openClipContextMenu($event, track)"\
                    >\
                        <div \
                            v-for="clip in getClipsForTrack(track.id)" \
                            :key="clip.id" \
                            :data-clip-id="clip.id" \
                            class="clip absolute rounded cursor-pointer overflow-hidden" \
                            :class="getClipClasses(clip)" \
                            :style="clipStyle(clip, track.id)" \
                            @mousedown.stop="onClipMouseDown($event, clip, track)"\
                            @contextmenu.stop.prevent="openClipContextMenu($event, track, clip)"\
                        >\
                            <div class="absolute inset-0 opacity-30" :style="{backgroundColor: track.type === \'audio\' ? \'#3b82f6\' : track.color}"></div>\
                            <div v-if="clip.type === \'video\' && (trackHeights[track.id] || 40) >= 24" class="absolute inset-0 flex items-center justify-center"><i class="fa-solid fa-film text-white/50"></i></div>\
                            <template v-if="track.type === \'audio\'">\
                                <svg class="waveform" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" stroke="white" fill="transparent" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>\
                            </template>\
                            <div v-show="(trackHeights[track.id] || 40) >= 16" class="text-[9px] px-1 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none">{{ clip.name }}</div>\
                            <div class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, \'left\')"></div>\
                            <div class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30" @mousedown.stop="startClipResize($event, clip, \'right\')"></div>\
                        </div>\
                    </div>\
                    \
                    <div class="playhead-line-body" :style="{ left: vm.currentTime * vm.zoom + \'px\' }"></div>\
                </div>\
            </div>\
            \
            <div v-if="trackContextMenu" class="context-menu" :style="{ top: trackContextMenu.y + \'px\', left: trackContextMenu.x + \'px\' }" @click.stop>\
                <div class="ctx-item" @click="setMainTrack(trackContextMenu.track); closeContextMenus()"><i class="fa-solid fa-star w-4"></i><span>메인 트랙 설정</span></div>\
                <div class="ctx-item" @click="duplicateTrack(trackContextMenu.track)"><i class="fa-solid fa-copy w-4"></i><span>트랙 복제</span></div>\
                <div class="ctx-item" @click="changeTrackColor(trackContextMenu.track)"><i class="fa-solid fa-palette w-4"></i><span>색상 변경</span></div>\
                <div class="ctx-item" @click="resetTrackHeight(trackContextMenu.track)"><i class="fa-solid fa-arrows-up-down w-4"></i><span>높이 초기화</span></div>\
                <div class="h-px bg-ui-border my-1"></div>\
                <div class="ctx-item" @click="moveTrackUp(trackContextMenu.index)"><i class="fa-solid fa-arrow-up w-4"></i><span>위로 이동 (Z+)</span></div>\
                <div class="ctx-item" @click="moveTrackDown(trackContextMenu.index)"><i class="fa-solid fa-arrow-down w-4"></i><span>아래로 이동 (Z-)</span></div>\
                <div class="h-px bg-ui-border my-1"></div>\
                <div class="ctx-item text-red-400 hover:!bg-ui-danger" @click="deleteTrack(trackContextMenu.track, trackContextMenu.index)"><i class="fa-solid fa-trash w-4"></i><span>삭제</span></div>\
            </div>\
            \
            <div v-if="clipContextMenu" class="context-menu" :style="{ top: clipContextMenu.y + \'px\', left: clipContextMenu.x + \'px\' }" @click.stop>\
                <template v-if="clipContextMenu.clip">\
                    <div class="ctx-item" @click="cutAtPlayheadForClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-scissors w-4"></i><span>플레이헤드에서 자르기</span></div>\
                    <div class="ctx-item" @click="cutAndDeleteLeftForClip(clipContextMenu.clip); closeContextMenus()">\
                        <i class="fa-solid fa-scissors w-4"></i><span>자르기 + 왼쪽 삭제</span>\
                    </div>\
                    <div class="ctx-item" @click="cutAndDeleteRightForClip(clipContextMenu.clip); closeContextMenus()">\
                        <i class="fa-solid fa-scissors w-4"></i><span>자르기 + 오른쪽 삭제</span>\
                    </div>\
                    <div class="h-px bg-ui-border my-1"></div>\
                    <div class="ctx-item" @click="duplicateClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-copy w-4"></i><span>클립 복제</span></div>\
                    <div class="h-px bg-ui-border my-1"></div>\
                    <div class="ctx-item text-red-400 hover:!bg-ui-danger" @click="deleteClip(clipContextMenu.clip); closeContextMenus()"><i class="fa-solid fa-trash w-4"></i><span>클립 삭제</span></div>\
                </template>\
                <template v-else>\
                    <div class="ctx-item" @click="addClipAtPosition(); closeContextMenus()"><i class="fa-solid fa-plus w-4"></i><span>빈 클립 추가</span></div>\
                    <div class="ctx-item" @click="pasteClip(); closeContextMenus()"><i class="fa-solid fa-paste w-4"></i><span>붙여넣기</span></div>\
                </template>\
            </div>\
        </div>\
    ',
    data: function() {
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
            pendingClickModifiers: null,
            isResolutionDropdownOpen: false,
            resolutionOptions: [
                { value: '4K', label: '4K', pixels: '3840x2160' },
                { value: 'FHD', label: 'FHD', pixels: '1920x1080' },
                { value: 'HD', label: 'HD', pixels: '1280x720' }
            ]
        };
    },
    computed: {
        formattedTime: function() {
            var t = this.vm.currentTime || 0;
            var h = Math.floor(t / 3600);
            var m = Math.floor((t % 3600) / 60);
            var s = Math.floor(t % 60);
            var f = Math.floor((t - Math.floor(t)) * 30);
            function pad(n) { return String(n).padStart(2, '0'); }
            return pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
        },
        totalTimelineWidth: function() {
            return this.totalDuration * this.vm.zoom;
        },
        currentHeaderWidth: function() {
            return this.isTrackNamesCollapsed ? this.collapsedHeaderWidth : this.trackHeaderWidth;
        },
        rulerMarks: function() {
            var marks = [];
            var zoom = this.vm.zoom;
            var duration = this.totalDuration;
            var majorInterval = 1, showMid = true, showMinor = true;
            if (zoom < 20) { majorInterval = 5; showMid = false; showMinor = false; }
            else if (zoom < 40) { majorInterval = 2; showMid = true; showMinor = false; }
            else { majorInterval = 1; showMid = true; showMinor = zoom >= 60; }
            for (var t = 0; t <= duration; t += 0.1) {
                var time = Math.round(t * 10) / 10;
                var position = time * zoom;
                var isMajor = time % majorInterval === 0;
                var isMid = showMid && !isMajor && time % 0.5 === 0;
                var isMinor = showMinor && !isMajor && !isMid;
                if (isMajor || isMid || isMinor) {
                    marks.push({ time: time, position: position, isMajor: isMajor, isMid: isMid, label: isMajor ? this.formatRulerTime(time) : '' });
                }
            }
            return marks;
        }
    },
    mounted: function() {
        var self = this;
        this.$nextTick(function() {
            self.adjustLayout();
            self.injectStyles();
            self.initTrackHeights();
            window.addEventListener('resize', self.adjustLayout);
            document.addEventListener('click', self.onDocumentClick);
            document.addEventListener('mousemove', self.onDocumentMouseMove);
            document.addEventListener('mouseup', self.onDocumentMouseUp);
            document.addEventListener('keydown', self.onDocumentKeyDown);
        });
    },
    beforeUnmount: function() {
        window.removeEventListener('resize', this.adjustLayout);
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        document.removeEventListener('mouseup', this.onDocumentMouseUp);
        document.removeEventListener('keydown', this.onDocumentKeyDown);
    },
    methods: {
        injectStyles: function() {
            if (document.getElementById('timeline-custom-styles')) return;
            var style = document.createElement('style');
            style.id = 'timeline-custom-styles';
            style.textContent = '.clip.clip-selected { box-shadow: inset 0 0 0 2px #3b82f6 !important; } .clip.clip-multi-selected { box-shadow: inset 0 0 0 2px #f59e0b !important; } .clip { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2); } .clip:hover { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4); } [draggable="true"] { cursor: grab; } [draggable="true"]:active { cursor: grabbing; } .playhead-line-body { position: absolute; top: 24px; bottom: 0; width: 2px; background: #ef4444; pointer-events: none; z-index: 35; transform: translateX(-1px); } .playhead-head { position: absolute; top: 2px; width: 12px; height: 20px; background: transparent; border: 2px solid #ef4444; border-radius: 0 0 4px 4px; transform: translateX(-6px); cursor: ew-resize; z-index: 50; box-sizing: border-box; } .playhead-head::after { content: ""; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #ef4444; } .timeline-select-no-arrow { -webkit-appearance: none; -moz-appearance: none; appearance: none; background-image: none !important; padding-right: 8px !important; } .timeline-select-no-arrow::-ms-expand { display: none; } #timeline-main-panel { min-height: 0; overflow: hidden; } .resolution-dropdown-wrapper { position: relative; }';
            document.head.appendChild(style);
        },
        initTrackHeights: function() {
            var self = this;
            this.vm.tracks.forEach(function(track) {
                if (!self.trackHeights[track.id]) {
                    self.trackHeights[track.id] = self.defaultTrackHeight;
                }
            });
        },
        toggleAllTrackNames: function() { this.isTrackNamesCollapsed = !this.isTrackNamesCollapsed; },
        toggleResolutionDropdown: function() { this.isResolutionDropdownOpen = !this.isResolutionDropdownOpen; },
        selectResolution: function(value) { this.vm.setResolution(value); this.isResolutionDropdownOpen = false; },
        getClipsForTrack: function(trackId) { return this.vm.clips.filter(function(c) { return c.trackId === trackId; }); },
        clipStyle: function(clip, trackId) {
            var height = this.trackHeights[trackId] || this.defaultTrackHeight;
            var padding = Math.max(2, Math.min(4, height * 0.1));
            return { left: clip.start * this.vm.zoom + 'px', width: Math.max(20, clip.duration * this.vm.zoom) + 'px', top: padding + 'px', height: (height - padding * 2) + 'px' };
        },
        getClipClasses: function(clip) {
            var isSelected = this.selectedClipIds.indexOf(clip.id) >= 0;
            var isMulti = this.selectedClipIds.length > 1;
            return { 'clip-selected': isSelected && !isMulti, 'clip-multi-selected': isSelected && isMulti };
        },
        onClipMouseDown: function(e, clip, track) {
            if (track.isLocked) return;
            var self = this;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.pendingClickClipId = clip.id;
            this.pendingClickModifiers = { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey };
            if (this.selectedClipIds.indexOf(clip.id) < 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                this.selectedClipIds = [clip.id];
                this.lastSelectedClipId = clip.id;
                this.lastSelectedTrackId = clip.trackId;
                this.syncVmSelectedClip();
            }
            this.draggingClipIds = this.selectedClipIds.slice();
            if (this.draggingClipIds.indexOf(clip.id) < 0) { this.draggingClipIds = [clip.id]; }
            this.dragStartPositions = {};
            this.dragStartTrackIds = {};
            this.draggingClipIds.forEach(function(id) {
                var c = self.vm.clips.find(function(cl) { return cl.id === id; });
                if (c) { self.dragStartPositions[id] = c.start; self.dragStartTrackIds[id] = c.trackId; }
            });
        },
        selectClip: function(clipId, modifiers) {
            var self = this;
            modifiers = modifiers || {};
            var clip = this.vm.clips.find(function(c) { return c.id === clipId; });
            if (!clip) return;
            if (modifiers.ctrlKey || modifiers.metaKey) {
                var idx = this.selectedClipIds.indexOf(clipId);
                if (idx >= 0) { this.selectedClipIds.splice(idx, 1); } else { this.selectedClipIds.push(clipId); }
                this.lastSelectedClipId = clipId;
                this.lastSelectedTrackId = clip.trackId;
            } else if (modifiers.shiftKey && this.lastSelectedClipId && this.lastSelectedTrackId === clip.trackId) {
                var trackClips = this.getClipsForTrack(clip.trackId).sort(function(a, b) { return a.start - b.start; });
                var lastIdx = -1, curIdx = -1;
                for (var i = 0; i < trackClips.length; i++) {
                    if (trackClips[i].id === self.lastSelectedClipId) lastIdx = i;
                    if (trackClips[i].id === clipId) curIdx = i;
                }
                if (lastIdx >= 0 && curIdx >= 0) {
                    var minIdx = Math.min(lastIdx, curIdx);
                    var maxIdx = Math.max(lastIdx, curIdx);
                    this.selectedClipIds = [];
                    for (var j = minIdx; j <= maxIdx; j++) { this.selectedClipIds.push(trackClips[j].id); }
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
        onTrackLaneMouseDown: function(e, track) {
            if (e.target.closest('.clip')) return;
            this.selectedClipIds = [];
            this.lastSelectedClipId = null;
            this.lastSelectedTrackId = null;
            this.syncVmSelectedClip();
        },
        syncVmSelectedClip: function() {
            var self = this;
            if (this.selectedClipIds.length === 1) {
                this.vm.selectedClip = this.vm.clips.find(function(c) { return c.id === self.selectedClipIds[0]; }) || null;
            } else { this.vm.selectedClip = null; }
        },
        onDocumentClick: function(e) {
            if (!e.target.closest('.context-menu')) { this.closeContextMenus(); }
            if (!e.target.closest('.resolution-dropdown-wrapper')) { this.isResolutionDropdownOpen = false; }
        },
        onDocumentKeyDown: function(e) {
            var self = this;
            if (e.key === 'Delete' && this.selectedClipIds.length > 0) { this.deleteSelectedClips(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); this.selectedClipIds = this.vm.clips.map(function(c) { return c.id; }); this.syncVmSelectedClip(); }
            if (e.key === 'Escape') { this.selectedClipIds = []; this.lastSelectedClipId = null; this.lastSelectedTrackId = null; this.syncVmSelectedClip(); this.isResolutionDropdownOpen = false; }
        },
        onDocumentMouseMove: function(e) {
            var self = this;
            if (this.isResizingHeader && !this.isTrackNamesCollapsed) { this.trackHeaderWidth = Math.max(120, Math.min(400, this.resizeStartWidth + (e.clientX - this.resizeStartX))); }
            if (this.isResizingTrack && this.resizingTrackId) { var dy = e.clientY - this.resizeStartY; this.trackHeights[this.resizingTrackId] = Math.max(this.minTrackHeight, this.resizeStartHeight + dy); }
            if (this.isDraggingPlayhead) { this.updatePlayheadPosition(e); }
            if (this.pendingClickClipId && !this.isDraggingClip && this.draggingClipIds.length > 0) {
                var dx = Math.abs(e.clientX - this.dragStartX);
                var dy = Math.abs(e.clientY - this.dragStartY);
                if (dx > 3 || dy > 3) { this.isDraggingClip = true; this.pendingClickClipId = null; }
            }
            if (this.isDraggingClip && this.draggingClipIds.length > 0) { this.handleClipDrag(e); }
            if (this.isResizingClip && this.resizingClip) { this.handleClipResize(e); }
        },
        onDocumentMouseUp: function(e) {
            if (this.pendingClickClipId && !this.isDraggingClip) { this.selectClip(this.pendingClickClipId, this.pendingClickModifiers || {}); }
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
        handleClipDrag: function(e) {
            var self = this;
            var dx = e.clientX - this.dragStartX;
            var dt = dx / this.vm.zoom;
            var lane = document.getElementById('timeline-lane-container');
            var targetTrack = null;
            if (lane) { var rect = lane.getBoundingClientRect(); var relY = e.clientY - rect.top - 24; targetTrack = this.getTrackAtY(relY); }
            if (targetTrack && !targetTrack.isLocked) {
                var sourceTrackIds = {};
                for (var k in this.dragStartTrackIds) { sourceTrackIds[this.dragStartTrackIds[k]] = true; }
                var sourceKeys = Object.keys(sourceTrackIds);
                if (sourceKeys.length === 1) {
                    var sourceTrackId = sourceKeys[0];
                    if (targetTrack.id !== sourceTrackId) {
                        var canMove = true;
                        for (var i = 0; i < this.draggingClipIds.length; i++) {
                            var clipId = this.draggingClipIds[i];
                            var clip = this.vm.clips.find(function(c) { return c.id === clipId; });
                            if (!clip) continue;
                            var newStart = Math.max(0, this.dragStartPositions[clipId] + dt);
                            if (this.hasCollision(targetTrack.id, newStart, clip.duration, this.draggingClipIds)) { canMove = false; break; }
                        }
                        if (canMove) { this.draggingClipIds.forEach(function(cid) { var c = self.vm.clips.find(function(x) { return x.id === cid; }); if (c) c.trackId = targetTrack.id; }); }
                    }
                }
            }
            var newPositions = {};
            this.draggingClipIds.forEach(function(id) {
                var clip = self.vm.clips.find(function(c) { return c.id === id; });
                if (!clip) return;
                var newStart = Math.max(0, self.dragStartPositions[id] + dt);
                if (self.vm.isMagnet) { var snap = self.findSnapPosition(newStart, clip, self.draggingClipIds); if (snap.snapped) newStart = snap.position; }
                newPositions[id] = Math.max(0, newStart);
            });
            var canMoveAll = true;
            for (var j = 0; j < this.draggingClipIds.length; j++) {
                var id = this.draggingClipIds[j];
                var clip = this.vm.clips.find(function(c) { return c.id === id; });
                if (!clip) continue;
                if (this.hasCollision(clip.trackId, newPositions[id], clip.duration, this.draggingClipIds)) { canMoveAll = false; break; }
            }
            if (canMoveAll) { this.draggingClipIds.forEach(function(id) { var clip = self.vm.clips.find(function(c) { return c.id === id; }); if (clip && newPositions[id] !== undefined) { clip.start = newPositions[id]; } }); }
        },
        startClipResize: function(e, clip, dir) {
            var track = this.vm.tracks.find(function(t) { return t.id === clip.trackId; });
            if (track && track.isLocked) return;
            e.preventDefault();
            this.isResizingClip = true;
            this.resizingClip = clip;
            this.resizeDirection = dir;
            this.dragStartX = e.clientX;
            this.resizeStartClipStart = clip.start;
            this.resizeStartClipDuration = clip.duration;
        },
        handleClipResize: function(e) {
            var dx = e.clientX - this.dragStartX;
            var dt = dx / this.vm.zoom;
            if (this.resizeDirection === 'left') {
                var ns = this.resizeStartClipStart + dt;
                var nd = this.resizeStartClipDuration - dt;
                if (ns < 0) { nd += ns; ns = 0; }
                if (nd < 0.5) { nd = 0.5; ns = this.resizeStartClipStart + this.resizeStartClipDuration - 0.5; }
                if (!this.hasCollision(this.resizingClip.trackId, ns, nd, [this.resizingClip.id])) { this.resizingClip.start = ns; this.resizingClip.duration = nd; }
            } else {
                var nd2 = this.resizeStartClipDuration + dt;
                if (nd2 < 0.5) nd2 = 0.5;
                if (!this.hasCollision(this.resizingClip.trackId, this.resizingClip.start, nd2, [this.resizingClip.id])) { this.resizingClip.duration = nd2; }
            }
        },
        hasCollision: function(trackId, start, duration, excludeIds) {
            excludeIds = excludeIds || [];
            var end = start + duration;
            var trackClips = this.vm.clips.filter(function(c) { return c.trackId === trackId && excludeIds.indexOf(c.id) < 0; });
            for (var i = 0; i < trackClips.length; i++) { var c = trackClips[i]; var cEnd = c.start + c.duration; if (start < cEnd && end > c.start) return true; }
            return false;
        },
        findNonCollidingPosition: function(clip, desiredStart, excludeIds) {
            excludeIds = excludeIds || [];
            if (!this.hasCollision(clip.trackId, desiredStart, clip.duration, excludeIds)) return desiredStart;
            var trackClips = this.vm.clips.filter(function(c) { return c.trackId === clip.trackId && excludeIds.indexOf(c.id) < 0; });
            for (var i = 0; i < trackClips.length; i++) { var c = trackClips[i]; var cEnd = c.start + c.duration; if (desiredStart < cEnd && desiredStart + clip.duration > c.start) { return desiredStart < c.start ? Math.max(0, c.start - clip.duration) : cEnd; } }
            return desiredStart;
        },
        getTrackAtY: function(relY) {
            var accHeight = 0;
            for (var i = 0; i < this.vm.tracks.length; i++) { var track = this.vm.tracks[i]; var h = this.trackHeights[track.id] || this.defaultTrackHeight; if (relY >= accHeight && relY < accHeight + h) return track; accHeight += h; }
            return null;
        },
        findSnapPosition: function(newStart, clip, excludeIds) {
            excludeIds = excludeIds || [];
            var snapDist = 10 / this.vm.zoom;
            var clipEnd = newStart + clip.duration;
            if (Math.abs(newStart - this.vm.currentTime) < snapDist) return { snapped: true, position: this.vm.currentTime };
            if (Math.abs(clipEnd - this.vm.currentTime) < snapDist) return { snapped: true, position: this.vm.currentTime - clip.duration };
            for (var i = 0; i < this.vm.clips.length; i++) {
                var c = this.vm.clips[i];
                if (c.id === clip.id || excludeIds.indexOf(c.id) >= 0) continue;
                var os = c.start, oe = c.start + c.duration;
                if (Math.abs(newStart - oe) < snapDist) return { snapped: true, position: oe };
                if (Math.abs(newStart - os) < snapDist) return { snapped: true, position: os };
                if (Math.abs(clipEnd - os) < snapDist) return { snapped: true, position: os - clip.duration };
                if (Math.abs(clipEnd - oe) < snapDist) return { snapped: true, position: oe - clip.duration };
            }
            return { snapped: false, position: newStart };
        },
        startTrackDrag: function(e, track, index) { this.draggingTrackId = track.id; this.draggingTrackIndex = index; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', track.id); },
        handleTrackDragOver: function(e, track) { if (this.draggingTrackId && this.draggingTrackId !== track.id) { this.dragOverTrackId = track.id; } },
        handleTrackDragLeave: function() { this.dragOverTrackId = null; },
        handleTrackDrop: function(e, targetTrack, targetIndex) {
            if (!this.draggingTrackId || this.draggingTrackId === targetTrack.id) { this.endTrackDrag(); return; }
            var fromIndex = this.draggingTrackIndex;
            if (fromIndex !== targetIndex) { var tracks = this.vm.tracks.slice(); var moved = tracks.splice(fromIndex, 1)[0]; tracks.splice(targetIndex, 0, moved); this.vm.tracks = tracks; }
            this.endTrackDrag();
        },
        endTrackDrag: function() { this.draggingTrackId = null; this.draggingTrackIndex = null; this.dragOverTrackId = null; },
        moveTrackUp: function(index) { if (index <= 0) return; var tracks = this.vm.tracks.slice(); var temp = tracks[index - 1]; tracks[index - 1] = tracks[index]; tracks[index] = temp; this.vm.tracks = tracks; this.closeContextMenus(); },
        moveTrackDown: function(index) { if (index >= this.vm.tracks.length - 1) return; var tracks = this.vm.tracks.slice(); var temp = tracks[index]; tracks[index] = tracks[index + 1]; tracks[index + 1] = temp; this.vm.tracks = tracks; this.closeContextMenus(); },
        startTrackResize: function(e, track) { this.isResizingTrack = true; this.resizingTrackId = track.id; this.resizeStartY = e.clientY; this.resizeStartHeight = this.trackHeights[track.id] || this.defaultTrackHeight; },
        resetTrackHeight: function(track) { this.trackHeights[track.id] = this.defaultTrackHeight; this.closeContextMenus(); },
        addTrack: function() {
            var colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
            var newTrack = { id: 't_' + Date.now(), name: 'Track ' + (this.vm.tracks.length + 1), type: 'video', color: colors[this.vm.tracks.length % colors.length], isHidden: false, isLocked: false, isMain: false };
            this.vm.tracks.push(newTrack);
            this.trackHeights[newTrack.id] = this.defaultTrackHeight;
        },
        deleteTrack: function(track, idx) {
            if (this.vm.tracks.length <= 1) { Swal.fire({ icon: 'warning', title: '삭제 불가', text: '최소 1개 트랙 필요', background: '#1e1e1e', color: '#fff' }); return; }
            this.vm.clips = this.vm.clips.filter(function(c) { return c.trackId !== track.id; });
            delete this.trackHeights[track.id];
            this.vm.tracks.splice(idx, 1);
            this.closeContextMenus();
        },
        duplicateTrack: function(track) {
            var self = this;
            var idx = -1;
            for (var i = 0; i < this.vm.tracks.length; i++) { if (this.vm.tracks[i].id === track.id) { idx = i; break; } }
            var newTrack = {}; for (var k in track) { newTrack[k] = track[k]; }
            newTrack.id = 't_' + Date.now(); newTrack.name = track.name + ' (복사)'; newTrack.isMain = false;
            this.vm.tracks.splice(idx + 1, 0, newTrack);
            this.trackHeights[newTrack.id] = this.trackHeights[track.id] || this.defaultTrackHeight;
            this.closeContextMenus();
        },
        setMainTrack: function(track) { this.vm.tracks.forEach(function(t) { t.isMain = false; }); track.isMain = true; },
        changeTrackColor: function(track) {
            var self = this;
            Swal.fire({ title: '트랙 색상', input: 'text', inputValue: track.color, showCancelButton: true, background: '#1e1e1e', color: '#fff' }).then(function(result) { if (result.value) track.color = result.value; self.closeContextMenus(); });
        },
        openTrackContextMenu: function(e, track, idx) { this.clipContextMenu = null; this.trackContextMenu = { x: e.clientX, y: e.clientY, track: track, index: idx }; },
        openClipContextMenu: function(e, track, clip) { this.trackContextMenu = null; this.clipContextMenu = { x: e.clientX, y: e.clientY, track: track, clip: clip || null, time: this.getTimeFromMouseEvent(e) }; },
        getTimeFromMouseEvent: function(e) { var lane = document.getElementById('timeline-lane-container'); if (!lane) return 0; var rect = lane.getBoundingClientRect(); return Math.max(0, (e.clientX - rect.left) / this.vm.zoom); },
        closeContextMenus: function() { this.trackContextMenu = null; this.clipContextMenu = null; },
        duplicateClip: function(clip) {
            var newClip = {}; for (var k in clip) { newClip[k] = clip[k]; }
            newClip.id = 'c_' + Date.now(); newClip.start = clip.start + clip.duration + 0.5;
            newClip.start = this.findNonCollidingPosition(newClip, newClip.start, []);
            if (typeof this.vm.addClipWithBox === 'function') { this.vm.addClipWithBox(newClip); } else { this.vm.clips.push(newClip); }
        },
        deleteClip: function(clip) {
            this.vm.clips = this.vm.clips.filter(function(c) { return c.id !== clip.id; });
            this.selectedClipIds = this.selectedClipIds.filter(function(id) { return id !== clip.id; });
            this.syncVmSelectedClip();
        },
        addClipAtPosition: function() {
            if (!this.clipContextMenu) return;
            var track = this.clipContextMenu.track;
            var time = this.clipContextMenu.time || 0;
            var newClip = { id: 'c_' + Date.now(), trackId: track.id, name: 'New Clip', start: time, duration: 5, type: 'video' };
            newClip.start = this.findNonCollidingPosition(newClip, time, []);
            if (typeof this.vm.addClipWithBox === 'function') { this.vm.addClipWithBox(newClip); } else { this.vm.clips.push(newClip); }
        },
        pasteClip: function() {
            if (!this.copiedClip || !this.clipContextMenu) return;
            var track = this.clipContextMenu.track;
            var time = this.clipContextMenu.time || 0;
            var newClip = {}; for (var k in this.copiedClip) { newClip[k] = this.copiedClip[k]; }
            newClip.id = 'c_' + Date.now(); newClip.trackId = track.id; newClip.start = time;
            newClip.start = this.findNonCollidingPosition(newClip, time, []);
            if (typeof this.vm.addClipWithBox === 'function') { this.vm.addClipWithBox(newClip); } else { this.vm.clips.push(newClip); }
        },
        deleteSelectedClips: function() {
            var self = this;
            if (this.selectedClipIds.length === 0) return;
            var deletableIds = this.selectedClipIds.filter(function(id) {
                var clip = self.vm.clips.find(function(c) { return c.id === id; });
                if (!clip) return false;
                var track = self.vm.tracks.find(function(t) { return t.id === clip.trackId; });
                return !track || !track.isLocked;
            });
            if (deletableIds.length === 0) { Swal.fire({ icon: 'warning', title: '삭제 불가', text: '잠긴 트랙의 클립입니다', background: '#1e1e1e', color: '#fff' }); return; }
            this.vm.clips = this.vm.clips.filter(function(c) { return deletableIds.indexOf(c.id) < 0; });
            this.selectedClipIds = [];
            this.syncVmSelectedClip();
        },
        cutAtPlayhead: function() {
            var self = this;
            var targetIds = this.selectedClipIds.length > 0 ? this.selectedClipIds.slice() : [];
            if (targetIds.length === 0) { var t = this.vm.currentTime; this.vm.clips.forEach(function(clip) { if (t > clip.start && t < clip.start + clip.duration) { targetIds.push(clip.id); } }); }
            if (targetIds.length === 0) { Swal.fire({ icon: 'info', title: '자르기 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); return; }
            var t = this.vm.currentTime;
            var splitCount = 0;
            var newClipIds = [];
            targetIds.forEach(function(clipId) { var clip = self.vm.clips.find(function(c) { return c.id === clipId; }); if (!clip) return; if (t > clip.start && t < clip.start + clip.duration) { var newClipId = self.performSplitClip(clipId, t); if (newClipId) { newClipIds.push(newClipId); splitCount++; } } });
            if (splitCount === 0) { Swal.fire({ icon: 'info', title: '자르기 불가', text: '플레이헤드가 클립 범위 내에 있어야 합니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); }
            else { var validIds = targetIds.filter(function(id) { return self.vm.clips.find(function(c) { return c.id === id; }); }); this.selectedClipIds = validIds.concat(newClipIds); this.syncVmSelectedClip(); }
        },
        performSplitClip: function(clipId, splitTime) {
            var self = this;
            var clip = this.vm.clips.find(function(c) { return c.id === clipId; });
            if (!clip) return null;
            var relTime = splitTime - clip.start;
            if (relTime <= 0 || relTime >= clip.duration) return null;
            var origDur = clip.duration;
            clip.duration = relTime;
            var newClipId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            var secondPart = {}; for (var k in clip) { secondPart[k] = clip[k]; }
            secondPart.id = newClipId; secondPart.start = splitTime; secondPart.duration = origDur - relTime;
            if (typeof this.vm.addClipWithBox === 'function') { this.vm.addClipWithBox(secondPart); } else { this.vm.clips.push(secondPart); }
            return newClipId;
        },
        cutAtPlayheadForClip: function(clip) { var t = this.vm.currentTime; if (t > clip.start && t < clip.start + clip.duration) { var newClipId = this.performSplitClip(clip.id, t); if (newClipId) { this.selectedClipIds = [clip.id, newClipId]; this.syncVmSelectedClip(); } } },
        cutAndDeleteLeftSelected: function() {
            var self = this;
            var targetIds = this.selectedClipIds.length > 0 ? this.selectedClipIds.slice() : [];
            if (targetIds.length === 0) { var t = this.vm.currentTime; this.vm.clips.forEach(function(clip) { if (t > clip.start && t < clip.start + clip.duration) { targetIds.push(clip.id); } }); }
            if (targetIds.length === 0) { Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); return; }
            var t = this.vm.currentTime;
            var count = 0;
            targetIds.forEach(function(clipId) { var clip = self.vm.clips.find(function(c) { return c.id === clipId; }); if (!clip) return; var clipEnd = clip.start + clip.duration; if (t > clip.start && t < clipEnd) { clip.duration = clipEnd - t; clip.start = t; count++; } });
            if (count === 0) { Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드가 클립 범위 내에 있어야 합니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); }
        },
        cutAndDeleteRightSelected: function() {
            var self = this;
            var targetIds = this.selectedClipIds.length > 0 ? this.selectedClipIds.slice() : [];
            if (targetIds.length === 0) { var t = this.vm.currentTime; this.vm.clips.forEach(function(clip) { if (t > clip.start && t < clip.start + clip.duration) { targetIds.push(clip.id); } }); }
            if (targetIds.length === 0) { Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드 위치에 클립이 없습니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); return; }
            var t = this.vm.currentTime;
            var count = 0;
            targetIds.forEach(function(clipId) { var clip = self.vm.clips.find(function(c) { return c.id === clipId; }); if (!clip) return; var clipEnd = clip.start + clip.duration; if (t > clip.start && t < clipEnd) { clip.duration = t - clip.start; count++; } });
            if (count === 0) { Swal.fire({ icon: 'info', title: '작업 불가', text: '플레이헤드가 클립 범위 내에 있어야 합니다', background: '#1e1e1e', color: '#fff', timer: 1500, showConfirmButton: false }); }
        },
        cutAndDeleteLeftForClip: function(clip) { var t = this.vm.currentTime; var clipEnd = clip.start + clip.duration; if (t > clip.start && t < clipEnd) { clip.duration = clipEnd - t; clip.start = t; } },
        cutAndDeleteRightForClip: function(clip) { var t = this.vm.currentTime; var clipEnd = clip.start + clip.duration; if (t > clip.start && t < clipEnd) { clip.duration = t - clip.start; } },
        handleLaneMouseDown: function(e) { var isRuler = e.target.id === 'timeline-ruler' || e.target.closest('#timeline-ruler'); if (isRuler) this.updatePlayheadPosition(e); },
        startPlayheadDrag: function(e) { this.isDraggingPlayhead = true; this.updatePlayheadPosition(e); },
        updatePlayheadPosition: function(e) {
            var self = this;
            var lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            var rect = lane.getBoundingClientRect();
            var time = Math.max(0, (e.clientX - rect.left) / this.vm.zoom);
            if (this.vm.isMagnet) { var snap = null; var minDiff = 10 / this.vm.zoom; this.vm.clips.forEach(function(c) { if (Math.abs(time - c.start) < minDiff) { minDiff = Math.abs(time - c.start); snap = c.start; } if (Math.abs(time - (c.start + c.duration)) < minDiff) { minDiff = Math.abs(time - (c.start + c.duration)); snap = c.start + c.duration; } }); if (snap !== null) time = snap; }
            this.vm.currentTime = time;
        },
        togglePlayback: function() { if (typeof this.vm.togglePlayback === 'function') this.vm.togglePlayback(); else this.vm.isPlaying = !this.vm.isPlaying; },
        seekToStart: function() { if (typeof this.vm.seekToStart === 'function') this.vm.seekToStart(); else this.vm.currentTime = 0; },
        seekToEnd: function() { var max = 0; this.vm.clips.forEach(function(c) { if (c.start + c.duration > max) max = c.start + c.duration; }); this.vm.currentTime = max; },
        adjustLayout: function() { var p = document.getElementById('preview-main-container'); if (p) p.style.height = this.vm.isTimelineCollapsed ? 'calc(100% - 32px)' : '50%'; },
        toggleCollapse: function() { var self = this; this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed; this.$nextTick(function() { self.adjustLayout(); }); },
        startHeaderResize: function(e) { if (this.isTrackNamesCollapsed) return; this.isResizingHeader = true; this.resizeStartX = e.clientX; this.resizeStartWidth = this.trackHeaderWidth; },
        formatRulerTime: function(s) { if (s < 60) return s + 's'; var m = Math.floor(s / 60); var sec = Math.round(s % 60); return m + ':' + String(sec).padStart(2, '0'); },
        handleDragOver: function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; },
        handleDrop: function(e) {
            var self = this;
            e.preventDefault();
            var data;
            try { data = JSON.parse(e.dataTransfer.getData('text/wai-asset')); } catch(err) { return; }
            var lane = document.getElementById('timeline-lane-container');
            if (!lane) return;
            var rect = lane.getBoundingClientRect();
            var time = Math.max(0, (e.clientX - rect.left) / this.vm.zoom);
            var relY = e.clientY - rect.top - 24;
            var targetTrack = this.getTrackAtY(relY) || this.vm.tracks[this.vm.tracks.length - 1];
            if (!targetTrack) return;
            
            // 배열인 경우 (복수 자산) 처리
            var assets = Array.isArray(data) ? data : [data];
            var addedClipIds = [];
            var currentTime = time;
            
            assets.forEach(function(asset) {
                var dur = 10;
                if (asset.duration) {
                    var parts = asset.duration.split(':');
                    if (parts.length === 2) { dur = parseInt(parts[0]) * 60 + parseInt(parts[1]); }
                    else if (parts.length === 3) { dur = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]); }
                    else { dur = parseFloat(asset.duration) || 10; }
                }
                var newClip = { id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), trackId: targetTrack.id, name: asset.name || 'Clip', start: currentTime, duration: dur, type: asset.type || 'video', src: asset.src || asset.url || '', isActive: false };
                newClip.start = self.findNonCollidingPosition(newClip, currentTime, addedClipIds);
                if (typeof self.vm.addClipWithBox === 'function') { self.vm.addClipWithBox(newClip); } else { self.vm.clips.push(newClip); }
                addedClipIds.push(newClip.id);
                currentTime = newClip.start + newClip.duration;
            });
            
            this.selectedClipIds = addedClipIds;
            this.syncVmSelectedClip();
        },
        handleWheel: function(e) { var sc = document.getElementById('timeline-scroll-container'); if (!sc) return; if (e.shiftKey) this.vm.zoom = Math.max(10, Math.min(100, this.vm.zoom + (e.deltaY > 0 ? -2 : 2))); else sc.scrollLeft += e.deltaY; }
    }
};

window.TimelinePanel = TimelinePanel;
작업 2/2: AssetManagerModal.js 수정
수정대상파일: C:\wai-ui\frontend\js\components\AssetManagerModal.js

수정 내용:

로컬 파일 업로드 수정 (모달 닫지 않고 내부 input 사용)
복수 선택 드래그 데이터 형식 수정
Copy### [WAI:UPDATE:js/components/AssetManagerModal.js]
// Asset Manager Modal Component - 드래그앤드롭 지원 + 리사이징 + 복수선택 + 파일업로드

var AssetManagerModal = {
    props: {
        assetType: { type: String, required: true, default: 'video' }
    },
    emits: ['close'],
    template: '\
        <div\
            id="asset-manager-modal-overlay"\
            class="modal-overlay"\
            @click.self="$emit(\'close\')"\
            @contextmenu.prevent\
        >\
            <input \
                type="file" \
                ref="fileInput" \
                :accept="fileAcceptTypes" \
                multiple \
                style="display:none;" \
                @change="onFileSelected"\
            />\
            \
            <div\
                id="asset-manager-modal-window"\
                class="asset-manager-window bg-bg-panel border border-ui-border rounded-lg shadow-2xl text-[12px] text-text-main flex flex-col"\
                :style="windowStyle"\
                @mousedown.stop\
            >\
                <div class="modal-resize-handle resize-n" @mousedown="startResize($event, \'n\')"></div>\
                <div class="modal-resize-handle resize-s" @mousedown="startResize($event, \'s\')"></div>\
                <div class="modal-resize-handle resize-e" @mousedown="startResize($event, \'e\')"></div>\
                <div class="modal-resize-handle resize-w" @mousedown="startResize($event, \'w\')"></div>\
                <div class="modal-resize-handle resize-nw" @mousedown="startResize($event, \'nw\')"></div>\
                <div class="modal-resize-handle resize-ne" @mousedown="startResize($event, \'ne\')"></div>\
                <div class="modal-resize-handle resize-sw" @mousedown="startResize($event, \'sw\')"></div>\
                <div class="modal-resize-handle resize-se" @mousedown="startResize($event, \'se\')"></div>\
\
                <div\
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"\
                    @mousedown.stop.prevent="onHeaderMouseDown"\
                >\
                    <div class="flex items-center gap-3">\
                        <i :class="assetTypeIcon" class="text-ui-accent"></i>\
                        <span class="text-[14px] font-bold">{{ assetTypeTitle }} 관리</span>\
                        <span class="text-[11px] text-text-sub">{{ filteredAssets.length }}개 {{ assetTypeLabel }}</span>\
                    </div>\
                    <div class="flex items-center gap-2">\
                        <button class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1" @click="addAsset">\
                            <i class="fa-solid fa-plus"></i> 추가\
                        </button>\
                        <button class="text-[14px] text-text-sub hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit(\'close\')">\
                            <i class="fa-solid fa-xmark"></i>\
                        </button>\
                    </div>\
                </div>\
\
                <div class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-panel">\
                    <div class="flex items-center gap-2">\
                        <span class="text-[11px] text-text-sub">{{ assetTypeTitle }} 목록</span>\
                        <span class="text-[10px] text-ui-accent">(Ctrl+클릭: 복수선택 / 드래그: 타임라인 추가)</span>\
                    </div>\
                    \
                    <div class="flex items-center gap-2">\
                        <div class="flex items-center gap-1 px-2 py-1 bg-bg-input rounded border border-ui-border">\
                            <span class="text-[10px] text-text-sub">{{ previewToggleLabel }}</span>\
                            <button\
                                class="w-8 h-4 rounded-full transition-colors relative"\
                                :class="previewEnabled ? \'bg-ui-accent\' : \'bg-ui-border\'"\
                                @click="previewEnabled = !previewEnabled"\
                            >\
                                <span class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="previewEnabled ? \'left-4\' : \'left-0.5\'"></span>\
                            </button>\
                        </div>\
                        \
                        <div class="w-px h-5 bg-ui-border"></div>\
                        \
                        <div class="relative">\
                            <input type="text" v-model="searchQuery" :placeholder="assetTypeLabel + \' 검색...\'" class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" />\
                            <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>\
                        </div>\
                        \
                        <div class="flex border border-ui-border rounded overflow-hidden">\
                            <button class="px-2 py-1 text-[10px]" :class="viewMode === \'grid\' ? \'bg-ui-accent text-white\' : \'bg-bg-input text-text-sub hover:bg-bg-hover\'" @click="viewMode = \'grid\'">\
                                <i class="fa-solid fa-grip"></i>\
                            </button>\
                            <button class="px-2 py-1 text-[10px]" :class="viewMode === \'list\' ? \'bg-ui-accent text-white\' : \'bg-bg-input text-text-sub hover:bg-bg-hover\'" @click="viewMode = \'list\'">\
                                <i class="fa-solid fa-list"></i>\
                            </button>\
                        </div>\
                    </div>\
                </div>\
\
                <div class="flex-1 flex overflow-hidden">\
                    <div class="w-44 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">\
                        <div class="p-2 border-b border-ui-border bg-bg-panel">\
                            <span class="text-[10px] text-text-sub font-bold uppercase tracking-wide">폴더</span>\
                        </div>\
                        <div class="flex-1 overflow-auto p-1">\
                            <div \
                                v-for="folder in assetFolders"\
                                :key="folder.id"\
                                class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-[11px] transition-colors folder-drop-zone"\
                                :class="{\
                                    \'bg-ui-selected text-white\': currentFolderId === folder.id,\
                                    \'hover:bg-bg-hover\': currentFolderId !== folder.id,\
                                    \'drag-over\': dragOverFolderId === folder.id\
                                }"\
                                @click="currentFolderId = folder.id"\
                                @dragover.prevent="onFolderDragOver($event, folder)"\
                                @dragleave="onFolderDragLeave($event, folder)"\
                                @drop.prevent="onFolderDrop($event, folder)"\
                            >\
                                <i class="fa-solid fa-folder text-yellow-500"></i>\
                                <span class="truncate flex-1">{{ folder.name }}</span>\
                                <span class="text-[9px] text-text-sub">{{ getFolderAssetCount(folder.id) }}</span>\
                            </div>\
                        </div>\
                        \
                        <div class="p-2 border-t border-ui-border">\
                            <button class="w-full px-2 py-1 text-[10px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover flex items-center justify-center gap-1" @click="createFolder">\
                                <i class="fa-solid fa-folder-plus"></i> 새 폴더\
                            </button>\
                        </div>\
                    </div>\
\
                    <div \
                        class="flex-1 flex flex-col bg-bg-dark overflow-hidden"\
                        @dragover.prevent="onContentPanelDragOver"\
                        @drop.prevent="onContentPanelDrop"\
                    >\
                        <div class="flex items-center justify-between px-3 py-1.5 border-b border-ui-border bg-bg-panel text-[10px]">\
                            <div class="flex items-center gap-4">\
                                <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ \'text-ui-accent\': sortBy === \'name\' }" @click="toggleSort(\'name\')">\
                                    이름 <i v-if="sortBy === \'name\'" :class="sortAsc ? \'fa-solid fa-arrow-up\' : \'fa-solid fa-arrow-down\'" class="text-[8px]"></i>\
                                </span>\
                                <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ \'text-ui-accent\': sortBy === \'date\' }" @click="toggleSort(\'date\')">\
                                    추가일 <i v-if="sortBy === \'date\'" :class="sortAsc ? \'fa-solid fa-arrow-up\' : \'fa-solid fa-arrow-down\'" class="text-[8px]"></i>\
                                </span>\
                            </div>\
                            <span class="text-text-sub">{{ selectedAssetIds.length > 0 ? selectedAssetIds.length + \'개 선택됨\' : filteredAssets.length + \'개 항목\' }}</span>\
                        </div>\
\
                        <div class="flex-1 overflow-auto p-3" :class="{ \'drag-over\': isContentPanelDragOver }">\
                            <div v-if="filteredAssets.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">\
                                <i :class="assetTypeIcon" class="text-4xl mb-3"></i>\
                                <p class="text-[12px]">{{ assetTypeLabel }}이(가) 없습니다</p>\
                                <p class="text-[11px] mt-1">파일을 추가하거나 드래그하여 가져오세요</p>\
                            </div>\
\
                            <div v-else-if="viewMode === \'grid\'" class="asset-grid view-grid" :style="gridStyle">\
                                <div\
                                    v-for="asset in filteredAssets"\
                                    :key="asset.id"\
                                    class="asset-card"\
                                    :class="{ \'selected\': isAssetSelected(asset.id) }"\
                                    @click="selectAsset($event, asset)"\
                                    @dblclick="useAsset(asset)"\
                                    draggable="true"\
                                    @dragstart="onAssetDragStart($event, asset)"\
                                    @dragend="onDragEnd"\
                                >\
                                    <div class="asset-thumbnail">\
                                        <template v-if="assetType === \'video\'">\
                                            <video \
                                                v-if="previewEnabled && asset.src" \
                                                :src="asset.src" \
                                                class="w-full h-full object-cover" \
                                                muted \
                                                loop \
                                                @mouseenter="$event.target.play()" \
                                                @mouseleave="$event.target.pause(); $event.target.currentTime = 0;"\
                                            ></video>\
                                            <div v-else class="asset-thumbnail-placeholder">\
                                                <i class="fa-solid fa-film asset-thumbnail-icon-center"></i>\
                                            </div>\
                                        </template>\
                                        <template v-else-if="assetType === \'sound\'">\
                                            <div class="asset-thumbnail-placeholder sound" @click.stop="toggleAudioPreview(asset)">\
                                                <div class="flex items-end gap-0.5 h-8">\
                                                    <div v-for="i in 5" :key="i" class="w-1 bg-ui-accent rounded-t" :style="{ height: (20 + Math.random() * 60) + \'%\' }"></div>\
                                                </div>\
                                                <i class="fa-solid fa-play asset-thumbnail-icon-center"></i>\
                                            </div>\
                                        </template>\
                                    </div>\
                                    <div class="asset-info">\
                                        <div class="asset-name">{{ asset.name }}</div>\
                                        <div class="asset-meta">{{ asset.duration || \'\' }}<span v-if="asset.resolution"> · {{ asset.resolution }}</span></div>\
                                    </div>\
                                </div>\
                            </div>\
\
                            <div v-else class="asset-grid view-list">\
                                <div\
                                    v-for="asset in filteredAssets"\
                                    :key="asset.id"\
                                    class="asset-card"\
                                    :class="{ \'selected\': isAssetSelected(asset.id) }"\
                                    @click="selectAsset($event, asset)"\
                                    @dblclick="useAsset(asset)"\
                                    draggable="true"\
                                    @dragstart="onAssetDragStart($event, asset)"\
                                    @dragend="onDragEnd"\
                                >\
                                    <div class="asset-thumbnail">\
                                        <i :class="assetTypeIcon" class="asset-thumbnail-icon-center"></i>\
                                    </div>\
                                    <div class="asset-info">\
                                        <div class="flex-1">\
                                            <div class="asset-name">{{ asset.name }}</div>\
                                            <div class="asset-meta">{{ asset.duration || \'\' }}</div>\
                                        </div>\
                                        <div class="text-[10px] text-text-sub">{{ asset.resolution || \'\' }}</div>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
\
                <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">\
                    <div class="text-text-sub">\
                        <span v-if="selectedAssetIds.length > 0">{{ selectedAssetIds.length }}개 선택됨 - 드래그하여 타임라인에 추가</span>\
                        <span v-else>{{ currentFolderName }}</span>\
                    </div>\
                    <div class="flex items-center gap-2">\
                        <button v-if="selectedAssetIds.length > 0" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click="useSelectedAssets">사용</button>\
                        <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors" @click="$emit(\'close\')">닫기</button>\
                    </div>\
                </div>\
            </div>\
        </div>\
    ',
    data: function() {
        return {
            posX: 0, posY: 0,
            width: 900, height: 600,
            minWidth: 500, minHeight: 350,
            dragging: false, dragStartMouseX: 0, dragStartMouseY: 0, dragStartPosX: 0, dragStartPosY: 0,
            resizing: false, resizeDir: '', resizeStartX: 0, resizeStartY: 0, resizeStartW: 0, resizeStartH: 0, resizeStartPosX: 0, resizeStartPosY: 0,
            currentFolderId: 'all',
            viewMode: 'grid',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            previewEnabled: true,
            selectedAssetIds: [],
            dragData: null,
            dragOverFolderId: null,
            isContentPanelDragOver: false,
            assetFolders: [
                { id: 'all', name: '전체' },
                { id: 'recent', name: '최근 사용' },
                { id: 'favorites', name: '즐겨찾기' }
            ],
            dummyAssets: {
                video: [
                    { id: 'v1', name: 'Big Buck Bunny', duration: '00:10', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
                    { id: 'v2', name: 'Elephant Dream', duration: '00:15', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
                    { id: 'v3', name: 'Sintel Trailer', duration: '00:52', resolution: '4K', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
                    { id: 'v4', name: 'Tears of Steel', duration: '00:12', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }
                ],
                sound: [
                    { id: 's1', name: 'bgm_corporate.mp3', duration: '03:24', folderId: 'all', src: '' },
                    { id: 's2', name: 'sfx_whoosh.wav', duration: '00:02', folderId: 'all', src: '' },
                    { id: 's3', name: 'voiceover_intro.mp3', duration: '00:45', folderId: 'all', src: '' }
                ]
            }
        };
    },
    computed: {
        windowStyle: function() { return { position: 'absolute', left: this.posX + 'px', top: this.posY + 'px', width: this.width + 'px', height: this.height + 'px' }; },
        gridStyle: function() {
            var contentWidth = this.width - 176 - 24;
            var minCardWidth = 140;
            var cols = Math.max(2, Math.floor(contentWidth / minCardWidth));
            return { gridTemplateColumns: 'repeat(' + cols + ', 1fr)' };
        },
        assetTypeIcon: function() { return { video: 'fa-solid fa-film', sound: 'fa-solid fa-music' }[this.assetType] || 'fa-solid fa-file'; },
        assetTypeTitle: function() { return { video: '영상', sound: '사운드' }[this.assetType] || '자산'; },
        assetTypeLabel: function() { return { video: '영상', sound: '사운드' }[this.assetType] || '자산'; },
        previewToggleLabel: function() { return this.assetType === 'sound' ? '미리듣기' : '미리보기'; },
        currentFolderName: function() { var self = this; var folder = this.assetFolders.find(function(f) { return f.id === self.currentFolderId; }); return folder ? folder.name : '전체'; },
        fileAcceptTypes: function() { if (this.assetType === 'video') return 'video/*'; if (this.assetType === 'sound') return 'audio/*'; return '*/*'; },
        filteredAssets: function() {
            var self = this;
            var assets = this.dummyAssets[this.assetType] || [];
            if (this.currentFolderId !== 'all') assets = assets.filter(function(a) { return a.folderId === self.currentFolderId; });
            if (this.searchQuery) { var q = this.searchQuery.toLowerCase(); assets = assets.filter(function(a) { return a.name.toLowerCase().indexOf(q) >= 0; }); }
            assets = assets.slice().sort(function(a, b) { var cmp = self.sortBy === 'name' ? a.name.localeCompare(b.name) : 0; return self.sortAsc ? cmp : -cmp; });
            return assets;
        }
    },
    mounted: function() {
        this.centerWindow();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
    },
    beforeUnmount: function() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
    },
    methods: {
        centerWindow: function() {
            var vw = window.innerWidth || 1280;
            var vh = window.innerHeight || 720;
            this.posX = Math.max(20, (vw - this.width) / 2);
            this.posY = Math.max(20, (vh - this.height) / 2);
        },
        onHeaderMouseDown: function(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX;
            this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX;
            this.dragStartPosY = this.posY;
        },
        startResize: function(e, dir) {
            e.preventDefault();
            e.stopPropagation();
            this.resizing = true;
            this.resizeDir = dir;
            this.resizeStartX = e.clientX;
            this.resizeStartY = e.clientY;
            this.resizeStartW = this.width;
            this.resizeStartH = this.height;
            this.resizeStartPosX = this.posX;
            this.resizeStartPosY = this.posY;
        },
        onGlobalMouseMove: function(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
            }
            if (this.resizing) {
                var dx = e.clientX - this.resizeStartX;
                var dy = e.clientY - this.resizeStartY;
                var dir = this.resizeDir;
                var newW = this.resizeStartW;
                var newH = this.resizeStartH;
                var newX = this.resizeStartPosX;
                var newY = this.resizeStartPosY;
                if (dir.indexOf('e') >= 0) newW = Math.max(this.minWidth, this.resizeStartW + dx);
                if (dir.indexOf('w') >= 0) { newW = Math.max(this.minWidth, this.resizeStartW - dx); newX = this.resizeStartPosX + (this.resizeStartW - newW); }
                if (dir.indexOf('s') >= 0) newH = Math.max(this.minHeight, this.resizeStartH + dy);
                if (dir.indexOf('n') >= 0) { newH = Math.max(this.minHeight, this.resizeStartH - dy); newY = this.resizeStartPosY + (this.resizeStartH - newH); }
                this.width = newW;
                this.height = newH;
                this.posX = newX;
                this.posY = newY;
            }
        },
        onGlobalMouseUp: function() { this.dragging = false; this.resizing = false; },
        toggleSort: function(field) { if (this.sortBy === field) this.sortAsc = !this.sortAsc; else { this.sortBy = field; this.sortAsc = true; } },
        isAssetSelected: function(assetId) { return this.selectedAssetIds.indexOf(assetId) >= 0; },
        selectAsset: function(e, asset) {
            if (e.ctrlKey || e.metaKey) {
                var idx = this.selectedAssetIds.indexOf(asset.id);
                if (idx > -1) { this.selectedAssetIds.splice(idx, 1); } else { this.selectedAssetIds.push(asset.id); }
            } else {
                this.selectedAssetIds = [asset.id];
            }
        },
        useAsset: function(asset) {
            Swal.fire({ icon: 'success', title: '자산 사용', text: '"' + asset.name + '"을(를) 타임라인에 추가합니다.', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            this.$emit('close');
        },
        useSelectedAssets: function() { 
            var self = this;
            var assets = this.filteredAssets.filter(function(a) { return self.selectedAssetIds.indexOf(a.id) >= 0; }); 
            if (assets.length > 0) {
                var names = assets.map(function(a) { return a.name; }).join(', ');
                Swal.fire({ icon: 'success', title: '자산 사용', text: assets.length + '개 자산을 타임라인에 추가합니다: ' + names, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
                this.$emit('close');
            }
        },
        addAsset: function() {
            // 모달 닫지 않고 파일 선택 다이얼로그 열기
            if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },
        onFileSelected: function(e) {
            this.handleFileUpload(e.target.files);
            // 입력 초기화 (같은 파일 다시 선택 가능하도록)
            e.target.value = '';
        },
        handleFileUpload: function(files) {
            var self = this;
            if (!files || files.length === 0) return;
            var fileNames = Array.from(files).map(function(f) { return f.name; }).join(', ');
            Swal.fire({ icon: 'success', title: '파일 업로드', text: files.length + '개 파일 추가됨: ' + fileNames, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 2000, showConfirmButton: false });
            Array.from(files).forEach(function(file) {
                var newAsset = {
                    id: self.assetType + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    folderId: 'all',
                    duration: '00:00',
                    resolution: '',
                    src: URL.createObjectURL(file)
                };
                if (!self.dummyAssets[self.assetType]) self.dummyAssets[self.assetType] = [];
                self.dummyAssets[self.assetType].push(newAsset);
            });
        },
        createFolder: function() {
            var self = this;
            Swal.fire({ title: '새 폴더', input: 'text', inputPlaceholder: '폴더 이름', showCancelButton: true, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' }).then(function(result) {
                if (result.value) { self.assetFolders.push({ id: 'folder_' + Date.now(), name: result.value }); }
            });
        },
        getFolderAssetCount: function(folderId) {
            var assets = this.dummyAssets[this.assetType] || [];
            if (folderId === 'all') return assets.length;
            return assets.filter(function(a) { return a.folderId === folderId; }).length;
        },
        toggleAudioPreview: function(asset) { console.log('Playing audio:', asset.name); },
        onAssetDragStart: function(e, asset) {
            var self = this;
            if (this.selectedAssetIds.indexOf(asset.id) < 0) { this.selectedAssetIds = [asset.id]; }
            var selectedAssets = this.filteredAssets.filter(function(a) { return self.selectedAssetIds.indexOf(a.id) >= 0; });
            this.dragData = { type: 'asset', assets: selectedAssets };
            e.dataTransfer.effectAllowed = 'copy';
            var transferData = selectedAssets.map(function(a) { 
                return { type: self.assetType, id: a.id, name: a.name, src: a.src || '', duration: a.duration || '', resolution: a.resolution || '' };
            });
            e.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            var dragImage = document.createElement('div');
            var icon = self.assetType === 'video' ? '🎬' : '🎵';
            dragImage.textContent = selectedAssets.length > 1 ? icon + ' ' + selectedAssets.length + '개 항목' : icon + ' ' + asset.name;
            dragImage.style.cssText = 'position:absolute;top:-1000px;padding:8px 16px;background:#3b82f6;color:#fff;border-radius:6px;font-size:12px;font-weight:bold;white-space:nowrap;';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(function() { document.body.removeChild(dragImage); }, 0);
        },
        onDragEnd: function() { this.dragData = null; this.dragOverFolderId = null; this.isContentPanelDragOver = false; },
        onFolderDragOver: function(e, folder) { e.preventDefault(); if (this.dragData) this.dragOverFolderId = folder.id; },
        onFolderDragLeave: function(e, folder) { if (this.dragOverFolderId === folder.id) this.dragOverFolderId = null; },
        onFolderDrop: function(e, folder) {
            var self = this;
            e.preventDefault();
            if (this.dragData && this.dragData.type === 'asset' && this.dragData.assets) {
                this.dragData.assets.forEach(function(asset) { self.moveAssetToFolder(asset, folder.id); });
            }
            this.dragOverFolderId = null;
            this.dragData = null;
        },
        onContentPanelDragOver: function(e) { e.preventDefault(); this.isContentPanelDragOver = true; },
        onContentPanelDrop: function(e) {
            var self = this;
            e.preventDefault();
            if (this.dragData && this.dragData.type === 'asset' && this.dragData.assets) {
                this.dragData.assets.forEach(function(asset) { self.moveAssetToFolder(asset, self.currentFolderId); });
            }
            this.isContentPanelDragOver = false;
            this.dragData = null;
        },
        moveAssetToFolder: function(asset, targetFolderId) {
            var assets = this.dummyAssets[this.assetType] || [];
            var idx = -1;
            for (var i = 0; i < assets.length; i++) { if (assets[i].id === asset.id) { idx = i; break; } }
            if (idx !== -1) assets[idx].folderId = targetFolderId;
        }
    }
};

window.AssetManagerModal = AssetManagerModal;
