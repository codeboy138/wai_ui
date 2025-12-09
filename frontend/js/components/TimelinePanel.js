/**
 * ==========================================
 * TimelinePanel.js - 타임라인 패널 컴포넌트
 * 
 * 역할: 타임라인 UI, 클립 관리, Interact.js 드래그/리사이즈
 * 경로: frontend/js/components/TimelinePanel.js
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
            return \`\${pad(hours)}:\${pad(minutes)}:\${pad(seconds)}:\${pad(milliseconds)}\`;
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
            const p = document.getElementById('preview-container-main');
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
                            width: \`\${e.rect.width}px\`,
                            transform: \`translate(\${x}px, 0)\`
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
                        target.style.transform = \`translate(\${x}px, 0)\`;
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
    
    template: \`
        <div class="c-timeline" 
             @wheel.prevent="handleWheel" 
             title="타임라인 패널">
            <div class="c-timeline__header">
                <div class="c-timeline__header-left">
                    <button id="timeline-collapse-btn"
                            class="c-timeline__collapse-btn" 
                            data-action="js:toggleCollapse"
                            @click="toggleCollapse"
                            :title="vm.isTimelineCollapsed ? '타임라인 펼치기' : '타임라인 접기'">
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span class="c-timeline__timecode" title="현재 시간">{{ formattedTime }}</span>
                </div>
                <input id="timeline-zoom-slider"
                       type="range" 
                       min="10" 
                       max="100" 
                       :value="vm.zoom" 
                       @input="vm.zoom = Number($event.target.value)" 
                       class="c-timeline__zoom-slider"
                       data-action="js:setZoom"
                       title="줌 조절"/>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" 
                 class="c-timeline__toolbar">
                <div class="c-timeline__toolbar-left">
                    <button class="c-timeline__tool-btn" 
                            title="클립 자르기">
                        <i class="fa-solid fa-scissors"></i>
                    </button>
                    <button class="c-timeline__tool-btn"
                            title="클립 삭제">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="c-timeline__toolbar-right">
                    <button id="timeline-tool-magnet-btn"
                            :class="{ 
                                'c-timeline__tool-btn': true,
                                'c-timeline__tool-btn--active': vm.isMagnet
                            }" 
                            data-action="js:toggleMagnet"
                            @click="vm.isMagnet = !vm.isMagnet"
                            :title="vm.isMagnet ? '스냅 끄기' : '스냅 켜기'">
                        <i class="fa-solid fa-magnet"></i>
                    </button>
                    
                    <button id="timeline-tool-ripple-btn"
                            :class="{ 
                                'c-timeline__tool-btn': true,
                                'c-timeline__tool-btn--active': vm.isAutoRipple
                            }" 
                            data-action="js:toggleRipple"
                            @click="vm.isAutoRipple = !vm.isAutoRipple"
                            :title="vm.isAutoRipple ? '리플 끄기' : '리플 켜기'">
                        <i class="fa-solid fa-link"></i>
                    </button>
                </div>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" 
                 id="timeline-scroll-area"
                 class="c-timeline__content" 
                 @dragover="handleDragOver" 
                 @drop="handleDrop"
                 title="타임라인 콘텐츠">
                
                <div class="c-timeline__tracks-sidebar">
                    <div class="c-timeline__tracks-header" title="트랙 헤더">
                        <span>TRACKS</span>
                    </div>
                    <div v-for="(track, index) in vm.tracks" 
                         :key="track.id" 
                         class="c-timeline__track-item" 
                         :class="{
                             'c-timeline__track-item--hidden': !track.visible,
                             'c-timeline__track-item--locked': track.locked
                         }"
                         draggable 
                         @dragstart="onTrackDragStart($event, index)" 
                         @dragenter="onTrackDragEnter($event, index)" 
                         @dragend="onTrackDragEnd" 
                         @dragover.prevent 
                         :title="'트랙: ' + track.name">
                        <div class="c-timeline__track-color" 
                             :style="{ backgroundColor: track.color || '#666' }"
                             :title="'트랙 색상: ' + track.color"></div>
                        <span class="c-timeline__track-name" 
                              contenteditable 
                              suppressContentEditableWarning
                              :title="'트랙 이름 편집'">
                            {{ track.name }}
                        </span>
                        
                        <div class="c-timeline__track-controls">
                            <button class="c-timeline__track-btn" 
                                    :class="{ 
                                        'c-timeline__track-btn--danger': !track.visible,
                                        'c-timeline__track-btn--active': track.visible
                                    }"
                                    @click.stop="vm.toggleTrackVisibility(track.id)"
                                    :title="track.visible ? '트랙 숨기기' : '트랙 표시'">
                                <i :class="track.visible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" 
                                   class="c-timeline__track-icon"></i>
                            </button>
                            
                            <button class="c-timeline__track-btn" 
                                    :class="{ 
                                        'c-timeline__track-btn--danger': track.locked
                                    }"
                                    @click.stop="vm.toggleTrackLock(track.id)"
                                    :title="track.locked ? '트랙 잠금 해제' : '트랙 잠금'">
                                <i :class="track.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'" 
                                   class="c-timeline__track-icon"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="c-timeline__canvas" 
                     @mousedown="handlePlayheadDrag($event)"
                     title="타임라인 캔버스">
                    <div class="c-timeline__ruler c-timeline__ruler--sticky" 
                         title="타임라인 눈금자">
                        <div v-for="i in 50" 
                             :key="'ruler-tick-' + i" 
                             class="c-timeline__ruler-tick" 
                             :style="{ width: vm.zoom * 5 + 'px' }"
                             :title="((i - 1) * 5) + '초'">
                            {{ (i - 1) * 5 }}s
                        </div>
                    </div>
                    
                    <div v-for="track in vm.tracks" 
                         :key="'track-row-' + track.id" 
                         class="c-timeline__track-row"
                         :class="{ 
                             'c-timeline__track-row--hidden': !track.visible,
                             'c-timeline__track-row--locked': track.locked
                         }"
                         :title="'트랙 행: ' + track.name">
                        <div v-for="clip in vm.clips.filter(c => c.trackId === track.id)" 
                             :key="clip.id"
                             :id="'timeline-clip-' + clip.id"
                             class="c-timeline__clip" 
                             :class="{ 
                                 'c-timeline__clip--selected': vm.selectedClip && vm.selectedClip.id === clip.id,
                                 'c-timeline__clip--locked': track.locked
                             }"
                             :style="{ 
                                 left: clip.start * vm.zoom + 'px', 
                                 width: clip.duration * vm.zoom + 'px', 
                                 backgroundColor: 'transparent',
                                 pointerEvents: track.locked ? 'none' : 'auto'
                             }"
                             @click.stop="!track.locked && vm.setSelectedClip(clip)" 
                             :title="'클립: ' + clip.name"
                             data-x="0" 
                             data-y="0">
                            <div class="c-timeline__clip-bg" 
                                 :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"></div>
                            
                            <template v-if="track.type === 'audio'">
                                <svg class="c-timeline__clip-waveform" 
                                     viewBox="0 0 100 100" 
                                     preserveAspectRatio="none"
                                     title="오디오 파형">
                                    <path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" 
                                          stroke="white" 
                                          fill="transparent" 
                                          stroke-width="2" 
                                          vector-effect="non-scaling-stroke"/>
                                </svg>
                                <div class="c-timeline__clip-volume" title="볼륨 조절"></div>
                            </template>
                            
                            <div class="c-timeline__clip-label" :title="clip.name">
                                {{ clip.name }}
                            </div>
                        </div>
                    </div>
                    
                    <div id="timeline-playhead-line"
                         class="c-timeline__playhead-line" 
                         :style="{ left: vm.currentTime * vm.zoom + 'px' }"
                         title="플레이헤드"></div>
                    <div id="timeline-playhead-handle"
                         class="c-timeline__playhead-handle" 
                         data-action="js:dragPlayhead"
                         :style="{ left: vm.currentTime * vm.zoom + 'px' }"
                         title="플레이헤드 드래그"></div>
                </div>
            </div>
        </div>
    \`
};
