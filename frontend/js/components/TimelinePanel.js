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
            const p = document.getElementById('preview-container');
            if (this.vm.isTimelineCollapsed) {
                p.style.height = 'calc(100% - 32px)';
            } else {
                p.style.height = '50%';
            }
        },
        
        initClipInteractions() {
            const self = this;
            interact('.clip').unset();
            
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
            
            interact('.clip').resizable({
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
                        const clipId = e.target.id.replace('clip-', '');
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
                        const clipId = e.target.id.replace('clip-', '');
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
            if (!target.className.includes('sticky-ruler') && !target.className.includes('playhead-handle')) return;
            
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
        <div class="flex flex-col h-full bg-bg-panel select-none" 
             @wheel.prevent="handleWheel" 
             data-dev="요소의 역할: 타임라인 패널 루트
요소의 고유ID: timeline-panel-root
요소의 기능 목적 정의: 타임라인 트랙, 클립, 플레이헤드 렌더링 및 관리
요소의 동작 로직 설명: 클립 드래그/리사이즈, 플레이헤드 제어, Shift+휠로 줌 조절
요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: vm.updateClip(), vm.moveClip()
요소의 경로정보: frontend/js/components/TimelinePanel.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: initClipInteractions(), handleWheel()">
            <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0">
                <div class="flex items-center gap-2">
                    <button class="hover:text-text-main w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover" 
                            @click="toggleCollapse">
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span class="text-xs font-mono text-ui-accent font-bold">{{ formattedTime }}</span>
                </div>
                <input type="range" 
                       min="10" 
                       max="100" 
                       :value="vm.zoom" 
                       @input="vm.zoom = Number($event.target.value)" 
                       class="w-20 accent-ui-accent h-1"/>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" 
                 class="h-5 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-xxs">
                <div class="flex gap-1">
                    <button class="tool-btn" title="Cut"><i class="fa-solid fa-scissors"></i></button>
                    <button class="tool-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="flex gap-2 items-center">
                    <button :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isMagnet, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isMagnet }" 
                            class="flex items-center gap-1 px-2 rounded border" 
                            @click="vm.isMagnet = !vm.isMagnet">
                        <i class="fa-solid fa-magnet"></i>
                    </button>
                    <button :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isAutoRipple, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isAutoRipple }" 
                            class="flex items-center gap-1 px-2 rounded border" 
                            @click="vm.isAutoRipple = !vm.isAutoRipple">
                        <i class="fa-solid fa-link"></i>
                    </button>
                </div>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" 
                 class="flex-1 overflow-auto timeline-grid relative" 
                 id="timeline-scroll-area" 
                 style="grid-template-columns: 180px 1fr" 
                 @dragover="handleDragOver" 
                 @drop="handleDrop">
                
                <div class="sticky-col z-30 bg-bg-panel border-r border-ui-border">
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel z-40 sticky top-0">
                        <span>TRACKS</span>
                    </div>
                    <div v-for="(track, index) in vm.tracks" 
                         :key="track.id" 
                         class="h-10 border-b border-ui-border flex items-center px-2 group hover:bg-bg-hover cursor-move bg-bg-panel relative" 
                         draggable 
                         @dragstart="onTrackDragStart($event, index)" 
                         @dragenter="onTrackDragEnter($event, index)" 
                         @dragend="onTrackDragEnd" 
                         @dragover.prevent 
                         :data-dev="'요소의 역할: 타임라인 트랙\\n요소의 고유ID: track-' + track.id + '\\n요소의 기능 목적 정의: 개별 트랙 표시 및 순서 변경\\n요소의 동작 로직 설명: 드래그로 트랙 순서 변경\\n요소의 입출력 데이터 구조: 입력: track (객체). 출력: vm.moveTrack()\\n요소의 경로정보: frontend/js/components/TimelinePanel.js#track\\n요소의 수행해야 할 백엔드/JS 명령: JS: onTrackDragStart(), vm.moveTrack()'">
                        <div class="w-1 h-2/3 rounded mr-2" :style="{ backgroundColor: track.color || '#666' }"></div>
                        <span class="text-xs truncate flex-1 text-text-main" contenteditable suppressContentEditableWarning>
                            {{ track.name }}
                        </span>
                    </div>
                </div>
                
                <div class="relative bg-bg-dark min-w-max" @mousedown="handlePlayheadDrag($event)">
                    <div class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark z-20 flex text-[9px] text-text-sub sticky-ruler">
                        <div v-for="i in 50" 
                             :key="i" 
                             class="border-l border-ui-border pl-1 pt-2" 
                             :style="{ width: vm.zoom * 5 + 'px' }">
                            {{ (i - 1) * 5 }}s
                        </div>
                    </div>
                    
                    <div v-for="track in vm.tracks" 
                         :key="track.id" 
                         class="h-10 border-b border-ui-border relative">
                        <div v-for="clip in vm.clips.filter(c => c.trackId === track.id)" 
                             :key="clip.id"
                             :id="'clip-' + clip.id"
                             class="clip absolute top-1 h-8 rounded cursor-pointer overflow-hidden" 
                             :class="{ 'selected': vm.selectedClip && vm.selectedClip.id === clip.id }"
                             :style="{ 
                                 left: clip.start * vm.zoom + 'px', 
                                 width: clip.duration * vm.zoom + 'px', 
                                 backgroundColor: 'transparent' 
                             }"
                             @click.stop="vm.setSelectedClip(clip)" 
                             :data-dev="'요소의 역할: 타임라인 클립\\n요소의 고유ID: clip-' + clip.id + '\\n요소의 기능 목적 정의: 개별 클립 표시 및 편집\\n요소의 동작 로직 설명: 드래그로 이동, 리사이즈로 길이 조절\\n요소의 입출력 데이터 구조: 입력: clip (객체). 출력: vm.updateClip(), vm.moveClip()\\n요소의 경로정보: frontend/js/components/TimelinePanel.js#clip\\n요소의 수행해야 할 백엔드/JS 명령: JS: Interact.js 드래그/리사이즈, vm.setSelectedClip()'"
                             data-x="0" 
                             data-y="0">
                            <div class="absolute inset-0 opacity-30" 
                                 :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"></div>
                            
                            <template v-if="track.type === 'audio'">
                                <svg class="waveform" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" 
                                          stroke="white" 
                                          fill="transparent" 
                                          stroke-width="2" 
                                          vector-effect="non-scaling-stroke"/>
                                </svg>
                                <div class="volume-line" title="Volume"></div>
                            </template>
                            
                            <div class="text-[9px] px-2 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none">
                                {{ clip.name }}
                            </div>
                        </div>
                    </div>
                    
                    <div class="playhead-line" :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                    <div class="playhead-handle" :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                </div>
            </div>
        </div>
    `
};
