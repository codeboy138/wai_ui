/**
 * ==========================================
 * TimelinePanel.js - 타임라인 패널 컴포넌트
 * 
 * 역할: 타임라인 UI, 클립 관리, Interact.js 드래그/리사이즈
 * 경로: frontend/js/components/TimelinePanel.js
 * 
 * DATA-DEV:
 * 요소의 역할: 타임라인 패널 (트랙, 클립, 플레이헤드)
 * 요소의 고유ID: component-timeline-panel
 * 요소의 기능 목적 정의: 타임라인 트랙 렌더링, 클립 드래그/리사이즈, 플레이헤드 제어, 자석(Snap) 기능
 * 요소의 동작 로직 설명: mounted 시 initClipInteractions() 호출, 클립 드래그/리사이즈 시 updateClip()/moveClip() 호출, Shift+휠로 줌 조절
 * 요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: vm.updateClip(), vm.moveClip(), vm.moveTrack()
 * 요소의 경로정보: frontend/js/components/TimelinePanel.js
 * 요소의 수행해야 할 백엔드/JS 명령: JS: initClipInteractions(), handlePlayheadDrag(), toggleCollapse()
 * ==========================================
 */

export default {
    name: 'TimelinePanel',
    
    props: ['vm'],
    
    computed: {
        formattedTime() {
            const totalSeconds = this.vm.currentTime;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);
            const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 100);
            
            const pad = (num, length = 2) => String(num).padStart(length, '0');
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(milliseconds)}`;
        }
    },
    
    mounted() {
        this.$nextTick(() => {
            this.initClipInteractions();
            this.adjustLayout();
            window.addEventListener('resize', this.adjustLayout);
        });
    },
    
    beforeUnmount() {
        window.removeEventListener('resize', this.adjustLayout);
    },
    
    watch: {
        'vm.clips': {
            handler() {
                this.$nextTick(this.initClipInteractions);
            },
            deep: true
        },
        'vm.isMagnet': {
            handler() {
                this.$nextTick(this.initClipInteractions);
            }
        }
    },
    
    methods: {
        adjustLayout() {
            const p = document.getElementById('timeline-preview-container');
            if (this.vm.isTimelineCollapsed) {
                p.style.height = 'calc(100% - 32px)';
            } else {
                p.style.height = '50%';
            }
        },
        
        initClipInteractions() {
            const self = this;
            interact('.c-timeline__clip').unset();
            
            const snapModifier = this.vm.isMagnet ? [
                interact.modifiers.snap({
                    targets: [
                        ({ x, y }) => {
                            const snaps = [];
                            const zoom = self.vm.zoom;
                            self.vm.clips.forEach(clip => {
                                snaps.push({ x: clip.start * zoom, range: 10 });
                                snaps.push({ x: (clip.start + clip.duration) * zoom, range: 10 });
                            });
                            snaps.push({ x: self.vm.currentTime * zoom, range: 10 });
                            return snaps;
                        }
                    ],
                    relativePoints: [{ x: 0, y: 0 }, { x: 1, y: 0 }]
                })
            ] : [];
            
            interact('.c-timeline__clip').resizable({
                edges: { left: true, right: true, bottom: false, top: false },
                modifiers: snapModifier,
                listeners: {
                    move(e) {
                        let { x } = e.target.dataset;
                        x = (parseFloat(x) || 0) + e.deltaRect.left;
                        Object.assign(e.target.style, {
                            width: `${e.rect.width}px`,
                            transform: `translate(${x}px, 0)`
                        });
                        Object.assign(e.target.dataset, { x });
                    },
                    end(e) {
                        const clipId = e.target.id.replace('timeline-clip-', '');
                        const startChange = (parseFloat(e.target.dataset.x) || 0) / self.vm.zoom;
                        const durationChange = (e.rect.width - e.rect.initialSize.width) / self.vm.zoom;
                        
                        self.$parent.updateClip(clipId, startChange, durationChange);
                        
                        e.target.removeAttribute('data-x');
                        e.target.style.transform = 'none';
                    }
                }
            }).draggable({
                modifiers: snapModifier,
                listeners: {
                    move(e) {
                        const target = e.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + e.dx;
                        target.style.transform = `translate(${x}px, 0)`;
                        target.setAttribute('data-x', x);
                    },
                    end(e) {
                        const clipId = e.target.id.replace('timeline-clip-', '');
                        const timeChange = (parseFloat(e.target.getAttribute('data-x')) || 0) / self.vm.zoom;
                        
                        self.$parent.moveClip(clipId, timeChange);
                        
                        e.target.style.transform = 'none';
                        e.target.removeAttribute('data-x');
                    }
                }
            });
        },
        
        handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        },
        
        handleDrop(e) {
            e.preventDefault();
            let assetData;
            try {
                assetData = JSON.parse(e.dataTransfer.getData('text/wai-asset'));
            } catch (error) {
                return;
            }
            
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top - 24;
            const trackIndex = Math.floor(y / 40);
            
            const scrollArea = document.getElementById('timeline-scroll-area');
            const x = e.clientX - rect.left + scrollArea.scrollLeft - 180;
            const time = Math.max(0, x / this.vm.zoom);
            
            this.vm.addClipFromDrop(assetData.type, trackIndex, time, assetData.name);
        },
        
        onTrackDragStart(e, index) {
            this.vm.dragItemIndex = index;
        },
        
        onTrackDragEnter(e, index) {
            this.vm.dragOverItemIndex = index;
        },
        
        onTrackDragEnd() {
            this.vm.moveTrack(this.vm.dragItemIndex, this.vm.dragOverItemIndex);
            this.vm.dragItemIndex = null;
            this.vm.dragOverItemIndex = null;
        },
        
        handleWheel(e) {
            const scrollArea = document.getElementById('timeline-scroll-area');
            if (e.shiftKey) {
                const delta = e.deltaY > 0 ? -2 : 2;
                this.vm.zoom = Math.max(10, Math.min(100, this.vm.zoom + delta));
            } else {
                scrollArea.scrollLeft += e.deltaY;
            }
        },
        
        toggleCollapse() {
            this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed;
            this.adjustLayout();
        },
        
        handlePlayheadDrag(e) {
            const target = e.target;
            if (!target.className.includes('c-timeline__ruler') && !target.className.includes('c-timeline__playhead-handle')) return;
            
            e.preventDefault();
            
            const scrollArea = document.getElementById('timeline-scroll-area');
            const rect = scrollArea.getBoundingClientRect();
            const scrollLeft = scrollArea.scrollLeft;
            const headerWidth = 180;
            const zoom = this.vm.zoom;
            
            const updateTime = (event) => {
                let newX = event.clientX - rect.left + scrollLeft - headerWidth;
                
                if (this.vm.isMagnet) {
                    let minDiff = Infinity;
                    let snapTime = null;
                    
                    this.vm.clips.forEach(clip => {
                        const startPx = clip.start * zoom;
                        const endPx = (clip.start + clip.duration) * zoom;
                        
                        [startPx, endPx].forEach(px => {
                            const diff = Math.abs(newX - px);
                            if (diff < 10 && diff < minDiff) {
                                minDiff = diff;
                                snapTime = px / zoom;
                            }
                        });
                    });
                    
                    if (snapTime !== null) {
                        this.vm.currentTime = snapTime;
                        return;
                    }
                }
                
                this.vm.currentTime = Math.max(0, newX / zoom);
            };
            
            const onMove = (event) => updateTime(event);
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            
            updateTime(e);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }
    },
    
    template: `
        <div class="c-timeline" 
             @wheel.prevent="handleWheel" 
             data-js="timeline-panel"
             data-dev="요소의 역할: 타임라인 패널 루트
요소의 고유ID: timeline-panel-root
요소의 기능 목적 정의: 타임라인 트랙, 클립, 플레이헤드 렌더링 및 관리
요소의 동작 로직 설명: 클립 드래그/리사이즈, 플레이헤드 제어, Shift+휠로 줌 조절
요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: vm.updateClip(), vm.moveClip()
요소의 경로정보: frontend/js/components/TimelinePanel.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: initClipInteractions(), handleWheel()">
            <div class="c-timeline__header" 
                 id="timeline-header-main">
                <div class="c-timeline__header-left">
                    <button class="c-timeline__collapse-btn" 
                            id="timeline-collapse-btn"
                            data-js="timeline-collapse"
                            @click="toggleCollapse">
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span class="c-timeline__timecode" 
                          id="timeline-timecode-display"
                          data-js="timeline-timecode">{{ formattedTime }}</span>
                </div>
                <input type="range" 
                       min="10" 
                       max="100" 
                       :value="vm.zoom" 
                       @input="vm.zoom = Number($event.target.value)" 
                       class="c-timeline__zoom-slider"
                       id="timeline-zoom-slider"
                       data-js="timeline-zoom"/>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" 
                 class="c-timeline__toolbar" 
                 id="timeline-toolbar-quick"
                 data-js="timeline-toolbar">
                <div class="c-timeline__toolbar-left">
                    <button class="tool-btn" 
                            title="Cut"
                            id="timeline-tool-cut"
                            data-js="timeline-tool-cut">
                        <i class="fa-solid fa-scissors"></i>
                    </button>
                    <button class="tool-btn" 
                            title="Delete"
                            id="timeline-tool-delete"
                            data-js="timeline-tool-delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="c-timeline__toolbar-right">
                    <button :class="{ 
                                'c-timeline__tool-btn--active': vm.isMagnet, 
                                'c-timeline__tool-btn': !vm.isMagnet 
                            }" 
                            class="c-timeline__tool-btn" 
                            id="timeline-tool-magnet"
                            data-js="timeline-tool-magnet"
                            @click="vm.isMagnet = !vm.isMagnet">
                        <i class="fa-solid fa-magnet"></i>
                    </button>
                    <button :class="{ 
                                'c-timeline__tool-btn--active': vm.isAutoRipple, 
                                'c-timeline__tool-btn': !vm.isAutoRipple 
                            }" 
                            class="c-timeline__tool-btn" 
                            id="timeline-tool-ripple"
                            data-js="timeline-tool-ripple"
                            @click="vm.isAutoRipple = !vm.isAutoRipple">
                        <i class="fa-solid fa-link"></i>
                    </button>
                </div>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" 
                 class="c-timeline__content" 
                 id="timeline-scroll-area" 
                 data-js="timeline-scroll"
                 @dragover="handleDragOver" 
                 @drop="handleDrop">
                
                <div class="c-timeline__tracks-sidebar" 
                     id="timeline-tracks-sidebar"
                     data-js="timeline-sidebar">
                    <div class="c-timeline__tracks-header" 
                         id="timeline-tracks-header-label">
                        <span>TRACKS</span>
                    </div>
                    <div v-for="(track, index) in vm.tracks" 
                         :key="track.id" 
                         class="c-timeline__track-item" 
                         :class="{
                             'c-timeline__track-item--hidden': !track.visible,
                             'c-timeline__track-item--locked': track.locked
                         }"
                         :id="'timeline-track-' + track.id"
                         :data-js="'timeline-track-' + index"
                         draggable 
                         @dragstart="onTrackDragStart($event, index)" 
                         @dragenter="onTrackDragEnter($event, index)" 
                         @dragend="onTrackDragEnd" 
                         @dragover.prevent 
                         :data-dev="'요소의 역할: 타임라인 트랙 헤더\\n요소의 고유ID: timeline-track-' + track.id + '\\n요소의 기능 목적 정의: 개별 트랙 표시 및 순서 변경, 가시성/잠금 토글\\n요소의 동작 로직 설명: 드래그로 트랙 순서 변경, 눈 아이콘으로 가시성 토글, 자물쇠 아이콘으로 잠금 토글\\n요소의 입출력 데이터 구조: 입력: track (객체). 출력: vm.moveTrack(), vm.toggleTrackVisibility(), vm.toggleTrackLock()\\n요소의 경로정보: frontend/js/components/TimelinePanel.js#track\\n요소의 수행해야 할 백엔드/JS 명령: JS: onTrackDragStart(), vm.moveTrack(), vm.toggleTrackVisibility(), vm.toggleTrackLock()'">
                        <div class="c-timeline__track-color" 
                             :style="{ backgroundColor: track.color || '#666' }"></div>
                        <span class="c-timeline__track-name" 
                              contenteditable 
                              suppressContentEditableWarning>
                            {{ track.name }}
                        </span>
                        
                        <div class="c-timeline__track-controls">
                            <button class="c-timeline__track-btn" 
                                    :class="{ 
                                        'c-timeline__track-btn--danger': !track.visible,
                                        'c-timeline__track-btn--active': track.visible
                                    }"
                                    :id="'timeline-track-visibility-' + track.id"
                                    :data-js="'track-visibility-' + track.id"
                                    @click.stop="vm.toggleTrackVisibility(track.id)"
                                    :title="track.visible ? '트랙 숨기기' : '트랙 표시'"
                                    data-dev="요소의 역할: 트랙 가시성 토글 버튼
요소의 고유ID: timeline-track-visibility-btn
요소의 기능 목적 정의: 트랙의 표시/숨김 상태 전환
요소의 동작 로직 설명: 클릭 시 track.visible 상태 토글, 아이콘 변경 (눈/눈감음), 트랙 투명도 변경
요소의 입출력 데이터 구조: 입력: 클릭. 출력: track.visible 상태 변경
요소의 경로정보: frontend/js/components/TimelinePanel.js#btn-visibility
요소의 수행해야 할 백엔드/JS 명령: JS: vm.toggleTrackVisibility(trackId)">
                                <i :class="track.visible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" 
                                   class="c-timeline__track-icon"></i>
                            </button>
                            
                            <button class="c-timeline__track-btn" 
                                    :class="{ 
                                        'c-timeline__track-btn--danger': track.locked
                                    }"
                                    :id="'timeline-track-lock-' + track.id"
                                    :data-js="'track-lock-' + track.id"
                                    @click.stop="vm.toggleTrackLock(track.id)"
                                    :title="track.locked ? '트랙 잠금 해제' : '트랙 잠금'"
                                    data-dev="요소의 역할: 트랙 잠금 토글 버튼
요소의 고유ID: timeline-track-lock-btn
요소의 기능 목적 정의: 트랙의 잠금/해제 상태 전환
요소의 동작 로직 설명: 클릭 시 track.locked 상태 토글, 아이콘 변경 (자물쇠 열림/닫힘), 클립 편집 비활성화
요소의 입출력 데이터 구조: 입력: 클릭. 출력: track.locked 상태 변경
요소의 경로정보: frontend/js/components/TimelinePanel.js#btn-lock
요소의 수행해야 할 백엔드/JS 명령: JS: vm.toggleTrackLock(trackId)">
                                <i :class="track.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" 
                                   class="c-timeline__track-icon"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="c-timeline__canvas" 
                     id="timeline-canvas-area"
                     data-js="timeline-canvas"
                     @mousedown="handlePlayheadDrag($event)">
                    <div class="c-timeline__ruler c-timeline__ruler--sticky" 
                         id="timeline-ruler-header"
                         data-js="timeline-ruler">
                        <div v-for="i in 50" 
                             :key="i" 
                             class="c-timeline__ruler-tick" 
                             :style="{ width: vm.zoom * 5 + 'px' }">
                            {{ (i - 1) * 5 }}s
                        </div>
                    </div>
                    
                    <div v-for="track in vm.tracks" 
                         :key="track.id" 
                         class="c-timeline__track-row"
                         :class="{ 
                             'c-timeline__track-row--hidden': !track.visible,
                             'c-timeline__track-row--locked': track.locked
                         }"
                         :id="'timeline-track-row-' + track.id"
                         :data-js="'track-row-' + track.id">
                        <div v-for="clip in vm.clips.filter(c => c.trackId === track.id)" 
                             :key="clip.id"
                             :id="'timeline-clip-' + clip.id"
                             class="c-timeline__clip" 
                             :class="{ 
                                 'c-timeline__clip--selected': vm.selectedClip && vm.selectedClip.id === clip.id,
                                 'c-timeline__clip--locked': track.locked
                             }"
                             :data-js="'clip-' + clip.id"
                             :style="{ 
                                 left: clip.start * vm.zoom + 'px', 
                                 width: clip.duration * vm.zoom + 'px', 
                                 backgroundColor: 'transparent',
                                 pointerEvents: track.locked ? 'none' : 'auto'
                             }"
                             @click.stop="!track.locked && vm.setSelectedClip(clip)" 
                             :data-dev="'요소의 역할: 타임라인 클립\\n요소의 고유ID: timeline-clip-' + clip.id + '\\n요소의 기능 목적 정의: 개별 클립 표시 및 편집\\n요소의 동작 로직 설명: 드래그로 이동, 리사이즈로 길이 조절 (트랙 잠금 시 비활성화)\\n요소의 입출력 데이터 구조: 입력: clip (객체). 출력: vm.updateClip(), vm.moveClip()\\n요소의 경로정보: frontend/js/components/TimelinePanel.js#clip\\n요소의 수행해야 할 백엔드/JS 명령: JS: Interact.js 드래그/리사이즈, vm.setSelectedClip()'"
                             data-x="0" 
                             data-y="0">
                            <div class="c-timeline__clip-bg" 
                                 :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"></div>
                            
                            <template v-if="track.type === 'audio'">
                                <svg class="c-timeline__clip-waveform" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" 
                                          stroke="white" 
                                          fill="transparent" 
                                          stroke-width="2" 
                                          vector-effect="non-scaling-stroke"/>
                                </svg>
                                <div class="c-timeline__clip-volume" title="Volume"></div>
                            </template>
                            
                            <div class="c-timeline__clip-label">
                                {{ clip.name }}
                            </div>
                        </div>
                    </div>
                    
                    <div class="c-timeline__playhead-line" 
                         id="timeline-playhead-line"
                         data-js="timeline-playhead-line"
                         :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                    <div class="c-timeline__playhead-handle" 
                         id="timeline-playhead-handle"
                         data-js="timeline-playhead-handle"
                         :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                </div>
            </div>
        </div>
    `
};
