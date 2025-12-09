import { store } from '../store.js';

export default {
    template: `
        <div class="flex flex-col h-full bg-bg-panel select-none relative" 
             data-dev="ID: timeline-panel | Role: Panel | Func: 타임라인 | Goal: 편집 | Path: App/Timeline | Py: None">
            <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0 z-50 relative">
                <div class="flex items-center gap-1">
                    <button class="tool-btn" title="자르기" data-dev="ID: btn-cut | Role: Action | Func: 자르기 | Goal: 클립 분할 | Path: Timeline/Toolbar | Py: clip.cut()"><i class="fa-solid fa-scissors"></i></button>
                    <button class="tool-btn" title="왼쪽 리플" data-dev="ID: btn-rip-l | Role: Action | Func: 왼쪽 리플 | Goal: 공간 삭제 | Path: Timeline/Toolbar | Py: clip.ripple_l()"><i class="fa-solid fa-arrow-left-long"></i></button>
                    <button class="tool-btn" title="오른쪽 리플" data-dev="ID: btn-rip-r | Role: Action | Func: 오른쪽 리플 | Goal: 공간 삭제 | Path: Timeline/Toolbar | Py: clip.ripple_r()"><i class="fa-solid fa-arrow-right-long"></i></button>
                    <button class="tool-btn" title="트림" data-dev="ID: btn-trim | Role: Action | Func: 트림 | Goal: 길이 조정 | Path: Timeline/Toolbar | Py: clip.trim()"><i class="fa-solid fa-crop"></i></button>
                </div>
                <span class="text-xs font-mono text-ui-accent font-bold" title="현재 시간" data-dev="ID: time-display | Role: Indicator | Func: 시간 | Goal: 위치 확인 | Path: Timeline/Toolbar | Py: None">00:00:00:00</span>
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1 border border-ui-border rounded h-6 px-2" title="스냅" data-dev="ID: grp-snap | Role: Group | Func: 스냅 | Goal: 자석 모드 | Path: Timeline/Toolbar | Py: None">
                         <i class="fa-solid fa-magnet text-text-sub text-[10px]" :class="{'text-ui-accent': store.project.isMagnet}"></i>
                         <input type="checkbox" v-model="store.project.isMagnet" class="h-3 w-3 accent-ui-accent" data-dev="ID: chk-snap | Role: Checkbox | Func: 스냅 토글 | Goal: 제어 | Path: Timeline/Toolbar | Py: tl.set_snap(val)">
                         <span class="text-[10px] text-text-sub ml-1">Snap</span>
                    </div>
                    <input type="range" min="10" max="100" v-model.number="store.project.zoom" class="w-20 accent-ui-accent h-1" title="줌" data-dev="ID: slider-zoom | Role: Slider | Func: 줌 | Goal: 확대축소 | Path: Timeline/Toolbar | Py: tl.zoom(val)"/>
                    <button class="tool-btn" @click="toggleDock" title="도킹" data-dev="ID: btn-dock | Role: Toggle | Func: 도킹 | Goal: 창 분리 | Path: Timeline/Toolbar | Py: ui.toggle_dock()"><i class="fa-solid fa-window-maximize rotate-180"></i></button>
                </div>
            </div>
            <div class="timeline-container" id="timeline-scroll-area" style="grid-template-columns: 200px 1fr" @dragover.prevent @drop="handleDrop">
                <div class="tl-corner text-[10px] text-text-sub font-bold relative" title="트랙 헤더" data-dev="ID: tl-corner | Role: Label | Func: 헤더 | Goal: 식별 | Path: Timeline/Corner | Py: None">
                    TRACKS <div class="header-resizer-v" @mousedown.stop="startHeaderResize"></div>
                </div>
                <div class="tl-ruler" :style="{ width: totalWidth + 'px' }" @mousedown="startScrub" title="룰러" data-dev="ID: ruler | Role: Ruler | Func: 눈금자 | Goal: 탐색 | Path: Timeline/Ruler | Py: tl.scrub()">
                    <div class="h-full relative">
                        <div v-for="i in 50" :key="i" class="absolute top-0 h-full border-l border-ui-border pl-1 pt-2 text-[9px] text-text-sub" :style="{ left: (i-1) * 5 * store.project.zoom + 'px' }">{{ (i - 1) * 5 }}s</div>
                        <div class="playhead-handle" :style="{ left: playheadPos + 'px' }" @mousedown="startScrub" title="재생 헤드" data-dev="ID: playhead | Role: Handle | Func: 헤드 | Goal: 탐색 | Path: Timeline/Ruler | Py: tl.seek()"></div>
                    </div>
                </div>
                <template v-for="track in store.tracks" :key="track.id">
                    <div class="tl-header group hover:bg-bg-hover transition-colors relative" :style="{ height: track.height + 'px' }" 
                         :data-dev="'ID: trk-head-' + track.id + ' | Role: Header | Func: 트랙 | Goal: 관리 | Path: Timeline/Track | Py: None'">
                        <div class="flex gap-1 mr-2 text-[10px]" @click.stop>
                            <button @click="toggleProp(track.id, 'isVisible')" :class="track.isVisible ? 'text-ui-accent' : 'text-ui-danger'" title="가시성" data-dev="'ID: btn-eye | Role: Toggle | Func: 보기 | Goal: 제어 | Path: Timeline/Track | Py: trk.vis()'"><i class="fa-solid" :class="track.isVisible ? 'fa-eye' : 'fa-eye-slash'"></i></button>
                            <button @click="toggleProp(track.id, 'isLocked')" :class="track.isLocked ? 'text-ui-danger' : 'text-text-sub'" title="잠금" data-dev="'ID: btn-lock | Role: Toggle | Func: 잠금 | Goal: 보호 | Path: Timeline/Track | Py: trk.lock()'"><i class="fa-solid" :class="track.isLocked ? 'fa-lock' : 'fa-lock-open'"></i></button>
                        </div>
                        <div class="w-1 h-3/4 rounded mr-2" :style="{ backgroundColor: track.color }"></div>
                        <span class="text-xs truncate flex-1 text-text-main outline-none px-1 rounded focus:bg-bg-input" contenteditable="true" @blur="updateTrackName(track.id, $event)" title="이름 변경" data-dev="'ID: input-name | Role: Input | Func: 이름 | Goal: 식별 | Path: Timeline/Track | Py: trk.rename()'">{{ track.name }}</span>
                        <div class="track-resizer-h" @mousedown.stop="startTrackResize(track.id, $event)"></div>
                        <div class="header-resizer-v" @mousedown.stop="startHeaderResize"></div>
                    </div>
                    <div class="tl-track" :style="{ width: totalWidth + 'px', height: track.height + 'px' }" :data-dev="'ID: trk-body-' + track.id + ' | Role: Area | Func: 트랙 | Goal: 배치 | Path: Timeline/Track | Py: None'">
                        <div v-for="clip in getClips(track.id)" :key="clip.id" :id="'clip-' + clip.id" class="clip"
                             :style="{ left: clip.start * store.project.zoom + 'px', width: clip.duration * store.project.zoom + 'px' }"
                             @click.stop="store.selectClip(clip.id)" title="클립"
                             :data-dev="'ID: clip-' + clip.id + ' | Role: Item | Func: 클립 | Goal: 편집 | Path: Timeline/Track | Py: clip.select()'">
                            <div class="absolute inset-0 opacity-30" :style="{backgroundColor: track.color}"></div>
                            <div class="text-[9px] px-2 text-white truncate font-bold relative z-10 mt-1">{{ clip.name }}</div>
                        </div>
                        <div class="playhead-line" :style="{ left: playheadPos + 'px' }"></div>
                    </div>
                </template>
            </div>
        </div>
    `,
    data() { return { store } },
    computed: { totalWidth() { return Math.max(2000, store.project.zoom * 300); }, playheadPos() { return store.project.currentTime * store.project.zoom; } },
    mounted() { this.$nextTick(() => { this.initInteractions(); }); },
    watch: { 'store.clips': { handler() { this.$nextTick(this.initInteractions); }, deep: true } },
    methods: {
        getClips(tid) { return store.clips.filter(c => c.trackId === tid); },
        toggleDock() { store.layout.isTimelineDocked = !store.layout.isTimelineDocked; },
        toggleProp(id, prop) { store.toggleTrackProp(id, prop); },
        updateTrackName(id, e) { store.renameTrack(id, e.target.innerText); },
        startHeaderResize(e) { /*...*/ }, startTrackResize(tid, e) { /*...*/ }, startScrub(e) { /*...*/ }, handleDrop(e) { /*...*/ },
        initInteractions() { interact('.clip').draggable({ listeners: { move(e) { /*...*/ } } }).resizable({ /*...*/ }); }
    }
}