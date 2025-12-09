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
             data-js="timeline-panel"
             title="타임라인 패널"
             data-dev="요소의 역할: 타임라인 패널 루트
요소의 고유ID: component-timeline-root
요소의 기능 목적 정의: 타임라인 트랙, 클립, 플레이헤드 렌더링 및 관리
요소의 동작 로직 설명: 클립 드래그/리사이즈, 플레이헤드 제어, Shift+휠로 줌 조절
요소의 입출력 데이터 구조: 입력: vm (부모 data). 출력: vm.updateClip(), vm.moveClip()
요소의 경로정보: frontend/js/components/TimelinePanel.js#root
요소의 수행해야 할 백엔드/JS 명령: JS: initClipInteractions(), handleWheel()">
            <div class="c-timeline__header" 
                 data-js="timeline-header"
                 title="타임라인 헤더"
                 data-dev="요소의 역할: 타임라인 헤더
요소의 고유ID: component-timeline-header
요소의 기능 목적 정의: 타임코드 표시, 접기/펼치기, 줌 슬라이더 제공
요소의 동작 로직 설명: 타임코드 실시간 업데이트, 접기 버튼 클릭 시 패널 축소/확장
요소의 입출력 데이터 구조: 입력: currentTime, zoom. 출력: isTimelineCollapsed 토글
요소의 경로정보: frontend/js/components/TimelinePanel.js#header
요소의 수행해야 할 백엔드/JS 명령: JS: toggleCollapse()">
                <div class="c-timeline__header-left">
                    <button class="c-timeline__collapse-btn" 
                            @click="toggleCollapse"
                            data-js="timeline-collapse-btn"
                            :title="vm.isTimelineCollapsed ? '타임라인 펼치기' : '타임라인 접기'"
                            data-dev="요소의 역할: 타임라인 접기/펼치기 버튼
요소의 고유ID: component-timeline-collapse-btn
요소의 기능 목적 정의: 타임라인 패널 최소화/복원
요소의 동작 로직 설명: 클릭 시 isTimelineCollapsed 상태 토글
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isTimelineCollapsed 상태 변경
요소의 경로정보: frontend/js/components/TimelinePanel.js#collapse-btn
요소의 수행해야 할 백엔드/JS 명령: JS: toggleCollapse()">
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span class="c-timeline__timecode"
                          data-js="timeline-timecode"
                          title="현재 시간">{{ formattedTime }}</span>
                </div>
                <input type="range" 
                       min="10" 
                       max="100" 
                       :value="vm.zoom" 
                       @input="vm.zoom = Number($event.target.value)" 
                       class="c-timeline__zoom-slider"
                       data-js="timeline-zoom-slider"
                       title="줌 조절"/>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" 
                 class="c-timeline__toolbar"
                 data-js="timeline-toolbar"
                 title="타임라인 툴바"
                 data-dev="요소의 역할: 타임라인 툴바
요소의 고유ID: component-timeline-toolbar
요소의 기능 목적 정의: 편집 도구 및 스냅/리플 옵션 제공
요소의 동작 로직 설명: 자석, 리플 토글 버튼, 잘라내기/삭제 도구 제공
요소의 입출력 데이터 구조: 입력: isMagnet, isAutoRipple. 출력: 상태 토글
요소의 경로정보: frontend/js/components/TimelinePanel.js#toolbar
요소의 수행해야 할 백엔드/JS 명령: JS: vm.isMagnet 토글, vm.isAutoRipple 토글">
                <div class="c-timeline__toolbar-left">
                    <button class="c-timeline__tool-btn" 
                            data-js="timeline-tool-cut"
                            title="클립 자르기"
                            data-dev="요소의 역할: 클립 자르기 버튼
요소의 고유ID: component-timeline-tool-cut
요소의 기능 목적 정의: 현재 플레이헤드 위치에서 클립 분할
요소의 동작 로직 설명: 클릭 시 선택된 클립을 플레이헤드 위치에서 분할
요소의 입출력 데이터 구조: 입력: 클릭. 출력: 클립 분할 실행
요소의 경로정보: frontend/js/components/TimelinePanel.js#tool-cut
요소의 수행해야 할 백엔드/JS 명령: JS: cutClip()">
                        <i class="fa-solid fa-scissors"></i>
                    </button>
                    <button class="c-timeline__tool-btn"
                            data-js="timeline-tool-delete"
                            title="클립 삭제"
                            data-dev="요소의 역할: 클립 삭제 버튼
요소의 고유ID: component-timeline-tool-delete
요소의 기능 목적 정의: 선택된 클립 삭제
요소의 동작 로직 설명: 클릭 시 선택된 클립 제거
요소의 입출력 데이터 구조: 입력: 클릭. 출력: 클립 삭제 실행
요소의 경로정보: frontend/js/components/TimelinePanel.js#tool-delete
요소의 수행해야 할 백엔드/JS 명령: JS: deleteSelectedClip()">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="c-timeline__toolbar-right">
                    <button :class="{ 
                                'c-timeline__tool-btn': true,
                                'c-timeline__tool-btn--active': vm.isMagnet
                            }" 
                            @click="vm.isMagnet = !vm.isMagnet"
                            data-js="timeline-tool-magnet"
                            :title="vm.isMagnet ? '스냅 끄기' : '스냅 켜기'"
                            data-dev="요소의 역할: 스냅 토글 버튼
요소의 고유ID: component-timeline-tool-magnet
요소의 기능 목적 정의: 클립 스냅 기능 활성화/비활성화
요소의 동작 로직 설명: 클릭 시 isMagnet 상태 토글, 활성화 시 클립이 다른 클립/플레이헤드에 자동 정렬
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isMagnet 상태 변경
요소의 경로정보: frontend/js/components/TimelinePanel.js#tool-magnet
요소의 수행해야 할 백엔드/JS 명령: JS: vm.isMagnet 토글">
                        <i class="fa-solid fa-magnet"></i>
                    </button>
                    <button :class="{ 
                                'c-timeline__tool-btn': true,
                                'c-timeline__tool-btn--active': vm.isAutoRipple
                            }" 
                            @click="vm.isAutoRipple = !vm.isAutoRipple"
                            data-js="timeline-tool-ripple"
                            :title="vm.isAutoRipple ? '리플 끄기' : '리플 켜기'"
                            data-dev="요소의 역할: 리플 편집 토글 버튼
요소의 고유ID: component-timeline-tool-ripple
요소의 기능 목적 정의: 자동 리플 편집 활성화/비활성화
요소의 동작 로직 설명: 클릭 시 isAutoRipple 상태 토글, 활성화 시 클립 이동 시 이후 클립들도 자동 이동
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isAutoRipple 상태 변경
요소의 경로정보: frontend/js/components/TimelinePanel.js#tool-ripple
요소의 수행해야 할 백엔드/JS 명령: JS: vm.isAutoRipple 토글">
                        <i class="fa-solid fa-link"></i>
                    </button>
                </div>
            </div>
\`
};
