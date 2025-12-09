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
            
            <div v-show="!vm.isTimelineCollapsed" 
                 class="c-timeline__content" 
                 id="timeline-scroll-area" 
                 data-js="timeline-scroll-area"
                 title="타임라인 콘텐츠"
                 @dragover="handleDragOver" 
                 @drop="handleDrop"
                 data-dev="요소의 역할: 타임라인 스크롤 영역
요소의 고유ID: component-timeline-scroll-area
요소의 기능 목적 정의: 트랙/클립 표시 및 드래그 앤 드롭 처리
요소의 동작 로직 설명: 자산 드래그 앤 드롭 시 클립 생성, 가로 스크롤 지원
요소의 입출력 데이터 구조: 입력: 드래그 이벤트. 출력: addClipFromDrop()
요소의 경로정보: frontend/js/components/TimelinePanel.js#scroll-area
요소의 수행해야 할 백엔드/JS 명령: JS: handleDrop()">
                
                <div class="c-timeline__tracks-sidebar"
                     data-js="timeline-sidebar"
                     title="트랙 목록"
                     data-dev="요소의 역할: 트랙 사이드바
요소의 고유ID: component-timeline-tracks-sidebar
요소의 기능 목적 정의: 트랙 이름 및 컨트롤 표시
요소의 동작 로직 설명: 트랙 헤더 렌더링, 드래그로 순서 변경
요소의 입출력 데이터 구조: 입력: tracks 배열. 출력: 트랙 UI
요소의 경로정보: frontend/js/components/TimelinePanel.js#sidebar
요소의 수행해야 할 백엔드/JS 명령: JS: moveTrack()">
                    <div class="c-timeline__tracks-header"
                         data-js="timeline-tracks-header"
                         title="트랙 헤더">
                        <span>TRACKS</span>
                    </div>
                    <div v-for="(track, index) in vm.tracks" 
                         :key="track.id" 
                         class="c-timeline__track-item" 
                         :class="{
                             'c-timeline__track-item--hidden': !track.visible,
                             'c-timeline__track-item--locked': track.locked
                         }"
                         :id="'timeline-track-item-' + track.id"
                         :data-js="'timeline-track-item-' + index"
                         :title="'트랙: ' + track.name"
                         draggable 
                         @dragstart="onTrackDragStart($event, index)" 
                         @dragenter="onTrackDragEnter($event, index)" 
                         @dragend="onTrackDragEnd" 
                         @dragover.prevent 
                         :data-dev="'요소의 역할: 타임라인 트랙 헤더\\n요소의 고유ID: component-timeline-track-' + track.id + '\\n요소의 기능 목적 정의: 개별 트랙 표시 및 순서 변경, 가시성/잠금 토글\\n요소의 동작 로직 설명: 드래그로 트랙 순서 변경, 눈 아이콘으로 가시성 토글, 자물쇠 아이콘으로 잠금 토글\\n요소의 입출력 데이터 구조: 입력: track (객체). 출력: vm.moveTrack(), vm.toggleTrackVisibility(), vm.toggleTrackLock()\\n요소의 경로정보: frontend/js/components/TimelinePanel.js#track\\n요소의 수행해야 할 백엔드/JS 명령: JS: onTrackDragStart(), vm.moveTrack(), vm.toggleTrackVisibility(), vm.toggleTrackLock()'">
                        <div class="c-timeline__track-color" 
                             :style="{ backgroundColor: track.color || '#666' }"
                             :title="'트랙 색상: ' + track.color"></div>
                        <span class="c-timeline__track-name" 
                              contenteditable 
                              suppressContentEditableWarning
                              :data-js="'timeline-track-name-' + track.id"
                              :title="'트랙 이름 편집'">
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
요소의 고유ID: component-track-visibility-btn
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
요소의 고유ID: component-track-lock-btn
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
                     data-js="timeline-canvas"
                     title="타임라인 캔버스"
                     @mousedown="handlePlayheadDrag($event)"
                     data-dev="요소의 역할: 타임라인 캔버스
요소의 고유ID: component-timeline-canvas
요소의 기능 목적 정의: 눈금자, 트랙 행, 클립, 플레이헤드 렌더링
요소의 동작 로직 설명: 눈금자 클릭으로 플레이헤드 이동, 클립 드래그/리사이즈
요소의 입출력 데이터 구조: 입력: tracks, clips. 출력: 타임라인 UI
요소의 경로정보: frontend/js/components/TimelinePanel.js#canvas
요소의 수행해야 할 백엔드/JS 명령: JS: handlePlayheadDrag()">
                    <div class="c-timeline__ruler c-timeline__ruler--sticky"
                         data-js="timeline-ruler"
                         title="타임라인 눈금자"
                         data-dev="요소의 역할: 타임라인 눈금자
요소의 고유ID: component-timeline-ruler
요소의 기능 목적 정의: 시간 눈금 표시, 클릭 시 플레이헤드 이동
요소의 동작 로직 설명: 5초 간격으로 눈금 표시, 클릭 시 해당 시간으로 플레이헤드 이동
요소의 입출력 데이터 구조: 입력: zoom. 출력: 눈금 틱 렌더링
요소의 경로정보: frontend/js/components/TimelinePanel.js#ruler
요소의 수행해야 할 백엔드/JS 명령: JS: handlePlayheadDrag()">
                        <div v-for="i in 50" 
                             :key="'ruler-tick-' + i" 
                             class="c-timeline__ruler-tick" 
                             :style="{ width: vm.zoom * 5 + 'px' }"
                             :data-js="'ruler-tick-' + i"
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
                         :id="'timeline-track-row-' + track.id"
                         :data-js="'track-row-' + track.id"
                         :title="'트랙 행: ' + track.name"
                         data-dev="요소의 역할: 트랙 행
요소의 고유ID: component-timeline-track-row
요소의 기능 목적 정의: 개별 트랙의 클립 표시 영역
요소의 동작 로직 설명: 해당 트랙에 속한 클립들을 렌더링
요소의 입출력 데이터 구조: 입력: track, clips. 출력: 클립 UI
요소의 경로정보: frontend/js/components/TimelinePanel.js#track-row
요소의 수행해야 할 백엔드/JS 명령: 없음">
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
                             :title="'클립: ' + clip.name"
                             :data-dev="'요소의 역할: 타임라인 클립\\n요소의 고유ID: component-timeline-clip-' + clip.id + '\\n요소의 기능 목적 정의: 개별 클립 표시 및 편집\\n요소의 동작 로직 설명: 드래그로 이동, 리사이즈로 길이 조절 (트랙 잠금 시 비활성화)\\n요소의 입출력 데이터 구조: 입력: clip (객체). 출력: vm.updateClip(), vm.moveClip()\\n요소의 경로정보: frontend/js/components/TimelinePanel.js#clip\\n요소의 수행해야 할 백엔드/JS 명령: JS: Interact.js 드래그/리사이즈, vm.setSelectedClip()'"
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
                                <div class="c-timeline__clip-volume" 
                                     title="볼륨 조절"></div>
                            </template>
                            
                            <div class="c-timeline__clip-label"
                                 :title="clip.name">
                                {{ clip.name }}
                            </div>
                        </div>
                    </div>
                    
                    <div class="c-timeline__playhead-line" 
                         :style="{ left: vm.currentTime * vm.zoom + 'px' }"
                         data-js="timeline-playhead-line"
                         title="플레이헤드"></div>
                    <div class="c-timeline__playhead-handle" 
                         :style="{ left: vm.currentTime * vm.zoom + 'px' }"
                         data-js="timeline-playhead-handle"
                         title="플레이헤드 드래그"></div>
                </div>
            </div>
        </div>
    \`
};