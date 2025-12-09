/**
 * ==========================================
 * app.js - Vue 3 앱 초기화
 * 
 * 역할: Vue 애플리케이션 생성, 컴포넌트 등록, 마운트
 * 경로: frontend/js/app.js
 * 
 * DATA-DEV:
 * 요소의 역할: Vue 3 애플리케이션 메인 엔트리 포인트
 * 요소의 고유ID: js-app-entry
 * 요소의 기능 목적 정의: Vue 앱 생성, 전역 상태(store) 주입, 컴포넌트 등록, #vue-app에 마운트
 * 요소의 동작 로직 설명: createApp(App) 생성 → 컴포넌트 등록 → store 주입 → mount('#vue-app')
 * 요소의 입출력 데이터 구조: 입력: 없음. 출력: Vue 앱 인스턴스, DOM 렌더링
 * 요소의 경로정보: frontend/js/app.js
 * 요소의 수행해야 할 백엔드/JS 명령: JS: createApp(), component(), mount()
 * ==========================================
 */

import store from './store.js';
import DropdownMenu from './components/DropdownMenu.js';
import ProjectModal from './components/ProjectModal.js';
import RulerLine from './components/RulerLine.js';
import LayerPanel from './components/LayerPanel.js';
import PropertiesPanel from './components/PropertiesPanel.js';
import PreviewCanvas from './components/PreviewCanvas.js';
import TimelinePanel from './components/TimelinePanel.js';

const { createApp } = window.Vue;

const App = {
    name: 'App',
    
    data() {
        return store;
    },
    
    computed: {
        canvasScalerStyle() {
            return {
                width: this.canvasSize.w + 'px',
                height: this.canvasSize.h + 'px',
                backgroundColor: '#000',
                transform: `translate(-50%, -50%) scale(${this.canvasScale})`,
                position: 'absolute',
                top: '50%',
                left: '50%'
            };
        }
    },
    
    mounted() {
        this.$nextTick(() => {
            this.setupPanelResizers();
            this.setupCanvasScaler();
            this.setupInspectorMode();
        });
        window.vm = this;
        console.log('✅ WAI Studio v3.0 (컴포넌트 구조화) 시작 완료!');
    },
    
    methods: {
        // --- System & Dev Mode ---
        firePython(f) {
            console.log('Py:', f);
            if (window.backend && window.backend[f]) {
                window.backend[f]();
            } else {
                console.log(`[DUMMY] Python call: ${f}`);
            }
        },
        
        toggleDevMode(mode) {
            if (mode === 'inspect') {
                this.isDevModeActive = !this.isDevModeActive;
                document.body.classList.toggle('dev-mode-active', this.isDevModeActive);
                if (this.isDevModeActive) {
                    this.isDevModeFull = false;
                    document.body.classList.remove('dev-mode-full');
                }
            } else if (mode === 'datadev') {
                this.isDevModeFull = !this.isDevModeFull;
                document.body.classList.toggle('dev-mode-full', this.isDevModeFull);
                if (this.isDevModeFull) {
                    this.isDevModeActive = false;
                    document.body.classList.remove('dev-mode-active');
                }
            }
        },
        
        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '복사 완료',
                    text: `${text}`,
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#1e1e1e',
                    color: '#fff'
                });
            }).catch(err => {
                console.error('복사 실패:', err);
            });
        },
        
        setupInspectorMode() {
            const self = this;
            
            // 마우스 이동 시 하이라이트
            document.addEventListener('mousemove', (e) => {
                if (!self.isDevModeActive && !self.isDevModeFull) return;
                
                let target = e.target;
                if (target.classList.contains('dev-highlight') || target.classList.contains('dev-tooltip')) {
                    target = document.elementFromPoint(e.clientX, e.clientY);
                }
                
                if (target && target.tagName !== 'HTML' && target.tagName !== 'BODY') {
                    const rect = target.getBoundingClientRect();
                    
                    self.highlightStyle = {
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        top: `${rect.top}px`,
                        left: `${rect.left}px`,
                    };
                    
                    let dataDevContent = target.getAttribute('data-dev') || '';
                    const elementId = target.id || target.className.split(' ')[0] || target.tagName;
                    
                    self.inspector = {
                        tag: target.tagName,
                        id: target.id,
                        className: target.className,
                        x: Math.round(rect.left),
                        y: Math.round(rect.top),
                        w: Math.round(rect.width),
                        h: Math.round(rect.height),
                        dataDev: dataDevContent,
                        displayName: elementId
                    };
                    
                    self.tooltipStyle = {
                        top: `${rect.top - 50}px`,
                        left: `${rect.left + rect.width + 10}px`,
                        transform: 'translateY(0)'
                    };
                    
                    if (rect.top - 50 < 0) {
                        self.tooltipStyle.top = `${rect.bottom + 10}px`;
                    }
                } else {
                    self.inspector = { tag: '', id: '', className: '', x: 0, y: 0, w: 0, h: 0, dataDev: '', displayName: '' };
                }
            });
            
            // 클릭 시 복사 (Inspect 모드)
            document.addEventListener('click', (e) => {
                if (!self.isDevModeActive) return;
                
                let target = e.target;
                if (target.classList.contains('dev-highlight') || target.classList.contains('dev-tooltip')) {
                    return;
                }
                
                if (target && target.tagName !== 'HTML' && target.tagName !== 'BODY') {
                    const elementId = target.id || target.className.split(' ')[0] || target.tagName;
                    self.copyToClipboard(elementId);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        },
        
        // --- Preview/Canvas Logic ---
        setAspect(r) {
            this.aspectRatio = r;
        },
        
        setResolution(r) {
            this.resolution = r;
        },
        
        updateCanvasMouseCoord(e) {
            const wrapper = document.getElementById('canvas-wrapper-main');
            const scaler = document.getElementById('canvas-scaler-transform');
            if (!wrapper || !scaler) return;
            
            const wrapperRect = wrapper.getBoundingClientRect();
            const scalerRect = scaler.getBoundingClientRect();
            
            const padding = 20;
            
            const mouseX = e.clientX - wrapperRect.left - padding;
            const mouseY = e.clientY - wrapperRect.top - padding;
            
            this.isMouseOverCanvas = mouseX > 0 && mouseY > 0 && mouseX < wrapperRect.width - padding && mouseY < wrapperRect.height - padding;
            
            this.mouseMarkerPos = { x: mouseX + padding, y: mouseY + padding };
            
            const canvasX = e.clientX - scalerRect.left;
            const canvasY = e.clientY - scalerRect.top;
            
            const scale = this.canvasScale;
            const realX = canvasX / scale;
            const realY = canvasY / scale;
            
            this.mouseCoord = {
                x: Math.min(this.canvasSize.w, Math.max(0, realX)),
                y: Math.min(this.canvasSize.h, Math.max(0, realY))
            };
        },
        
        // --- Layout Resizer Handlers ---
        setupPanelResizers() {
            const setup = (rid, stateKey, minSize, dir, isReverse = false) => {
                const r = document.getElementById(rid);
                if (!r) return;
                
                let startS, startP;
                const self = this;
                
                const onMove = (ev) => {
                    const diff = (dir === 'w' ? ev.clientX : ev.clientY) - startP;
                    let newSize;
                    
                    if (dir === 'w') {
                        newSize = isReverse ? startS - diff : startS + diff;
                        self[stateKey] = Math.max(minSize, newSize);
                    } else {
                        const headerHeight = 48;
                        const targetHeight = ev.clientY - headerHeight - 2;
                        
                        newSize = targetHeight;
                        const effectiveHeight = Math.max(minSize, newSize);
                        
                        self.previewContainerHeight = `${effectiveHeight}px`;
                        self.timelineContainerHeight = `calc(100% - ${effectiveHeight}px)`;
                    }
                };
                
                const onUp = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };
                
                r.addEventListener('mousedown', e => {
                    e.preventDefault();
                    startS = dir === 'w' ? self[stateKey] :
                        (rid === 'layout-resizer-timeline' ? document.getElementById('preview-container-main').offsetHeight : 0);
                    startP = dir === 'w' ? e.clientX : e.clientY;
                    
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });
            };
            
            setup('layout-resizer-left', 'leftPanelWidth', 180, 'w', false);
            setup('layout-resizer-right', 'rightPanelWidth', 250, 'w', true);
            setup('layout-resizer-timeline', 'previewContainerHeight', 100, 'h', false);
        },
        
        setupCanvasScaler() {
            const wrapper = document.getElementById('canvas-wrapper-main');
            
            const updateScale = () => {
                const padding = 20;
                const scale = Math.min((wrapper.clientWidth - padding) / this.canvasSize.w, (wrapper.clientHeight - padding) / this.canvasSize.h);
                this.canvasScale = scale;
            };
            
            updateScale();
            new ResizeObserver(updateScale).observe(wrapper);
        },
        
        // --- Core Model Methods (Clips/Boxes) ---
        updateBoxPosition(id, dx, dy, dw, dh, isResizeEnd = false) {
            const index = this.canvasBoxes.findIndex(b => b.id === id);
            if (index === -1) return;
            
            const box = this.canvasBoxes[index];
            const newBoxes = [...this.canvasBoxes];
            
            newBoxes[index] = {
                ...box,
                x: box.x + dx,
                y: box.y + dy,
                w: isResizeEnd ? dw : box.w,
                h: isResizeEnd ? dh : box.h
            };
            this.canvasBoxes = newBoxes;
        },
        
        updateClip(clipId, startChange, durationChange) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index !== -1) {
                const clip = this.clips[index];
                const newClips = [...this.clips];
                
                const newStart = Math.max(0, clip.start + startChange);
                const newDuration = Math.max(0.1, clip.duration + durationChange - (newStart - clip.start));
                
                newClips[index] = {
                    ...clip,
                    start: newStart,
                    duration: newDuration
                };
                this.clips = newClips;
            }
        },
        
        moveClip(clipId, timeChange) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index !== -1) {
                const clip = this.clips[index];
                const newClips = [...this.clips];
                newClips[index] = {
                    ...clip,
                    start: Math.max(0, clip.start + timeChange)
                };
                this.clips = newClips;
            }
        }
    },
    
    template: `
        <header id="header-app-main" 
                class="c-header" 
                data-js="header-main"
                title="애플리케이션 헤더"
                data-dev="요소의 역할: 애플리케이션 상단 헤더
요소의 고유ID: header-app-main
요소의 기능 목적 정의: 네비게이션, 개발자 모드 토글, 윈도우 컨트롤 제공
요소의 동작 로직 설명: 네비게이션 버튼 클릭 시 페이지 전환, Inspect/DATA-DEV 버튼 클릭 시 개발자 모드 활성화
요소의 입출력 데이터 구조: 입력: 클릭 이벤트. 출력: isDevModeActive, isDevModeFull 상태 변경
요소의 경로정보: frontend/js/app.js#header
요소의 수행해야 할 백엔드/JS 명령: JS: toggleDevMode(), firePython('nav_*'). Py: nav(), win_minimize(), win_maximize(), win_close()">
            <div class="c-header__left">
                <div class="c-header__logo" 
                     id="header-logo-text"
                     data-js="header-logo"
                     title="WAI Studio 로고"
                     data-dev="요소의 역할: 애플리케이션 로고
요소의 고유ID: header-logo-text
요소의 기능 목적 정의: 브랜드 아이덴티티 표시
요소의 동작 로직 설명: 정적 텍스트 표시
요소의 입출력 데이터 구조: 입력: 없음. 출력: 'WAI' 텍스트
요소의 경로정보: frontend/js/app.js#header-logo
요소의 수행해야 할 백엔드/JS 명령: 없음">WAI</div>
                
                <div class="c-header__menu-icon" 
                     id="header-menu-hamburger"
                     data-js="header-menu"
                     title="메뉴">
                    <button class="c-header__btn">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                </div>
                
                <nav class="c-header__nav" 
                     id="header-nav-main"
                     data-js="header-nav"
                     title="네비게이션"
                     data-dev="요소의 역할: 메인 네비게이션
요소의 고유ID: header-nav-main
요소의 기능 목적 정의: 페이지 간 이동 제공
요소의 동작 로직 설명: 버튼 클릭 시 페이지 전환 또는 모달 오픈
요소의 입출력 데이터 구조: 입력: 클릭. 출력: firePython() 또는 모달 상태 변경
요소의 경로정보: frontend/js/app.js#nav
요소의 수행해야 할 백엔드/JS 명령: JS: firePython('nav_*'), isProjectModalOpen=true">
                    <button class="c-header__nav-btn" 
                            id="header-nav-explore"
                            data-js="nav-explore"
                            title="탐색"
                            @click="firePython('nav_explore')"
                            data-dev="요소의 역할: 탐색 페이지 이동 버튼
요소의 고유ID: header-nav-explore
요소의 기능 목적 정의: 탐색 페이지로 전환
요소의 동작 로직 설명: 클릭 시 Python 함수 nav('explore') 호출
요소의 입출력 데이터 구조: 입력: 클릭. 출력: Py:nav('explore')
요소의 경로정보: frontend/js/app.js#nav-explore
요소의 수행해야 할 백엔드/JS 명령: Py: nav('explore')">탐색</button>
                    <button class="c-header__nav-btn c-header__nav-btn--active" 
                            id="header-nav-create"
                            data-js="nav-create"
                            title="제작"
                            @click="isProjectModalOpen = true"
                            data-dev="요소의 역할: 제작 페이지 이동 버튼
요소의 고유ID: header-nav-create
요소의 기능 목적 정의: 프로젝트 모달 오픈
요소의 동작 로직 설명: 클릭 시 isProjectModalOpen=true
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isProjectModalOpen=true
요소의 경로정보: frontend/js/app.js#nav-create
요소의 수행해야 할 백엔드/JS 명령: JS: isProjectModalOpen=true">제작</button>
                    
                    <div class="c-header__nav-dropdown" 
                         id="header-nav-assets-group"
                         data-js="nav-assets-dropdown"
                         title="자산">
                        <button class="c-header__nav-btn"
                                id="header-nav-assets"
                                data-js="nav-assets"
                                title="자산">자산</button>
                        <div class="c-header__nav-dropdown-menu">
                            <button class="c-header__nav-dropdown-item" 
                                    id="header-nav-assets-manage"
                                    data-js="nav-assets-manage"
                                    title="자산 관리"
                                    @click="firePython('open_asset_manager')"
                                    data-dev="요소의 역할: 자산 관리 메뉴 항목
요소의 고유ID: header-nav-assets-manage
요소의 기능 목적 정의: 자산 관리 창 오픈
요소의 동작 로직 설명: 클릭 시 Python 함수 open_asset_manager() 호출
요소의 입출력 데이터 구조: 입력: 클릭. 출력: Py:open_asset_manager()
요소의 경로정보: frontend/js/app.js#nav-assets-manage
요소의 수행해야 할 백엔드/JS 명령: Py: open_asset_manager()">
                                자산 관리
                            </button>
                        </div>
                    </div>
                    
                    <button class="c-header__nav-btn" 
                            id="header-nav-settings"
                            data-js="nav-settings"
                            title="설정"
                            @click="firePython('nav_settings')">설정</button>
                    <button class="c-header__nav-btn" 
                            id="header-nav-research"
                            data-js="nav-research"
                            title="연구"
                            @click="firePython('nav_research')">연구</button>
                </nav>
            </div>
            
            <div class="c-header__right">
                <button id="header-devmode-inspect" 
                        class="c-header__devmode-btn c-header__devmode-btn--left" 
                        :class="{'c-header__devmode-btn--active': isDevModeActive}"
                        data-js="devmode-inspect"
                        title="요소 검사"
                        @click="toggleDevMode('inspect')"
                        data-dev="요소의 역할: 요소 검사 모드 토글 버튼
요소의 고유ID: header-devmode-inspect
요소의 기능 목적 정의: Inspector 모드 활성화/비활성화
요소의 동작 로직 설명: 클릭 시 toggleDevMode('inspect') 호출, 요소 호버 시 이름+크기 표시, 클릭 시 이름 복사
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isDevModeActive 상태 변경
요소의 경로정보: frontend/js/app.js#devmode-inspect
요소의 수행해야 할 백엔드/JS 명령: JS: toggleDevMode('inspect'), copyToClipboard()">
                    <i class="fa-solid fa-magnifying-glass"></i> Inspect
                </button>
                
                <button id="header-devmode-datadev" 
                        class="c-header__devmode-btn c-header__devmode-btn--right" 
                        :class="{'c-header__devmode-btn--active': isDevModeFull}"
                        data-js="devmode-datadev"
                        title="DATA-DEV 보기"
                        @click="toggleDevMode('datadev')"
                        data-dev="요소의 역할: DATA-DEV 모드 토글 버튼
요소의 고유ID: header-devmode-datadev
요소의 기능 목적 정의: DATA-DEV 전체 모드 활성화/비활성화
요소의 동작 로직 설명: 클릭 시 toggleDevMode('datadev') 호출, 요소 호버 시 DATA-DEV 7가지 필드 표시
요소의 입출력 데이터 구조: 입력: 클릭. 출력: isDevModeFull 상태 변경
요소의 경로정보: frontend/js/app.js#devmode-datadev
요소의 수행해야 할 백엔드/JS 명령: JS: toggleDevMode('datadev')">
                    <i class="fa-solid fa-code"></i> DATA-DEV
                </button>
                
                <div class="c-header__window-controls" 
                     id="header-window-controls"
                     data-js="window-controls"
                     title="창 제어"
                     data-dev="요소의 역할: 윈도우 창 제어 버튼 그룹
요소의 고유ID: header-window-controls
요소의 기능 목적 정의: 창 최소화, 최대화, 닫기 제공
요소의 동작 로직 설명: 각 버튼 클릭 시 Python 함수 호출
요소의 입출력 데이터 구조: 입력: 클릭. 출력: Py:win_minimize(), Py:win_maximize(), Py:win_close()
요소의 경로정보: frontend/js/app.js#window-controls
요소의 수행해야 할 백엔드/JS 명령: Py: win_minimize(), win_maximize(), win_close()">
                    <button class="c-header__window-btn" 
                            id="header-window-minimize"
                            data-js="window-minimize"
                            title="최소화"
                            @click="firePython('win_min')">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <button class="c-header__window-btn" 
                            id="header-window-maximize"
                            data-js="window-maximize"
                            title="최대화"
                            @click="firePython('win_max')">
                        <i class="fa-regular fa-square"></i>
                    </button>
                    <button class="c-header__window-btn c-header__window-btn--close" 
                            id="header-window-close"
                            data-js="window-close"
                            title="닫기"
                            @click="firePython('win_close')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        </header>
        
        <main class="c-layout" 
              id="layout-main-container"
              data-js="layout-main"
              title="메인 레이아웃">
            <aside id="layout-panel-left" 
                   class="c-layout__panel c-layout__panel--left" 
                   :style="{ width: leftPanelWidth + 'px', minWidth: '180px' }"
                   data-js="panel-left"
                   title="자산 패널">
                <div class="c-layout__panel-header">
                    <span>자산 (Assets)</span>
                    <button class="c-layout__panel-btn" 
                            @click="firePython('import_asset')"
                            title="자산 추가">+</button>
                </div>
                <div class="c-layout__panel-body c-layout__panel-body--empty" 
                     id="layout-asset-list">
                    <i class="fa-solid fa-folder-open"></i>
                    <div>자산 목록이 비어있습니다.</div>
                </div>
                
                <div class="c-layout__resizer c-layout__resizer--vertical c-layout__resizer--right" 
                     id="layout-resizer-left"
                     data-js="resizer-left"
                     title="패널 크기 조절"></div>
            </aside>
            
            <section class="c-layout__center">
                <div id="preview-container-main" 
                     class="c-layout__preview" 
                     :style="{ height: previewContainerHeight }"
                     data-js="preview-container"
                     title="프리뷰 영역">
                    
                    <div class="c-layout__preview-toolbar">
                        <div class="c-layout__preview-controls">
                            <dropdown-menu :current-value="aspectRatio" 
                                         :items="['16:9', '9:16', '1:1']" 
                                         @select="setAspect" 
                                         id="preview-dropdown-ratio"></dropdown-menu>
                            
                            <div class="c-layout__preview-divider"></div>
                            
                            <div class="c-layout__preview-coord" 
                                 id="preview-coord-display"
                                 data-js="preview-coord"
                                 title="마우스 좌표">
                                <span>{{ Math.round(mouseCoord.x) }}, {{ Math.round(mouseCoord.y) }}</span>
                            </div>
                            
                            <div class="c-layout__preview-divider"></div>
                            
                            <dropdown-menu :current-value="resolution" 
                                         :items="['8K', '6K', '4K', '3K', '2K']" 
                                         @select="setResolution" 
                                         id="preview-dropdown-resolution"></dropdown-menu>
                            
                            <div class="c-layout__preview-divider"></div>
                            
                            <div class="c-layout__preview-snap" 
                                 @click="isMagnet = !isMagnet" 
                                 :class="{'c-layout__preview-snap--active': isMagnet}"
                                 id="preview-toggle-snap"
                                 data-js="preview-snap"
                                 title="스냅 토글">
                                <i class="fa-solid fa-magnet"></i> SNAP {{ isMagnet ? 'ON' : 'OFF' }}
                            </div>
                        </div>
                    </div>
                    
                    <div class="c-layout__preview-canvas" 
                         id="canvas-wrapper-main" 
                         data-js="canvas-wrapper"
                         title="캔버스"
                         @mousemove="updateCanvasMouseCoord" 
                         @mouseleave="mouseCoord = {x: 0, y: 0}; isMouseOverCanvas = false">
                        
                        <div class="c-layout__ruler c-layout__ruler--horizontal" 
                             id="canvas-ruler-horizontal"
                             data-js="ruler-horizontal"
                             title="수평 눈금자">
                            <ruler-line :orientation="'h'" :max-size="canvasSize.w" :scale="canvasScale"></ruler-line>
                        </div>
                        <div class="c-layout__ruler c-layout__ruler--vertical" 
                             id="canvas-ruler-vertical"
                             data-js="ruler-vertical"
                             title="수직 눈금자">
                            <ruler-line :orientation="'v'" :max-size="canvasSize.h" :scale="canvasScale"></ruler-line>
                        </div>
                        
                        <div class="c-layout__crosshair" 
                             :style="{paddingLeft: '20px', paddingTop: '20px'}">
                            <div class="c-layout__crosshair-line c-layout__crosshair-line--vertical"<span class="cursor">█</span>