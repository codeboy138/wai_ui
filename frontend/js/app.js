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
            if (mode === 'active') {
                this.isDevModeActive = !this.isDevModeActive;
                document.body.classList.toggle('dev-mode-active', this.isDevModeActive);
                if (this.isDevModeActive) {
                    this.isDevModeFull = false;
                    document.body.classList.remove('dev-mode-full');
                }
            } else if (mode === 'full') {
                this.isDevModeFull = !this.isDevModeFull;
                document.body.classList.toggle('dev-mode-full', this.isDevModeFull);
                if (this.isDevModeFull) {
                    this.isDevModeActive = false;
                    document.body.classList.remove('dev-mode-active');
                }
            }
        },
        
        setupInspectorMode() {
            const self = this;
            document.addEventListener('mousemove', (e) => {
                if (!self.isDevModeActive) return;
                
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
                    dataDevContent = dataDevContent.replace(/\\n/g, '\n');
                    
                    self.inspector = {
                        tag: target.tagName,
                        id: target.id,
                        className: target.className,
                        x: Math.round(rect.left),
                        y: Math.round(rect.top),
                        w: Math.round(rect.width),
                        h: Math.round(rect.height),
                        dataDev: dataDevContent
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
                    self.inspector = { tag: '', id: '', className: '', x: 0, y: 0, w: 0, h: 0, dataDev: '' };
                }
            });
        },
        
        // --- Preview/Canvas Logic ---
        setAspect(r) {
            this.aspectRatio = r;
        },
        
        setResolution(r) {
            this.resolution = r;
        },
        
        updateCanvasMouseCoord(e) {
            const wrapper = document.getElementById('canvas-wrapper');
            const scaler = document.getElementById('canvas-scaler');
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
                        (rid === 'resizer-timeline' ? document.getElementById('preview-container').offsetHeight : 0);
                    startP = dir === 'w' ? e.clientX : e.clientY;
                    
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });
            };
            
            setup('resizer-left', 'leftPanelWidth', 180, 'w', false);
            setup('resizer-right', 'rightPanelWidth', 250, 'w', true);
            setup('resizer-timeline', 'previewContainerHeight', 100, 'h', false);
        },
        
        setupCanvasScaler() {
            const wrapper = document.getElementById('canvas-wrapper');
            
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
        <header id="app-header" 
                class="h-12 bg-bg-panel border-b border-ui-border flex items-center justify-between shrink-0 select-none px-[15px]" 
                data-dev="요소의 역할: 애플리케이션 상단 헤더
요소의 고유ID: app-header
요소의 기능 목적 정의: 네비게이션, 개발자 모드 토글, 윈도우 컨트롤 제공
요소의 동작 로직 설명: 네비게이션 버튼 클릭 시 페이지 전환, Dev 버튼 클릭 시 Inspector 모드 활성화
요소의 입출력 데이터 구조: 입력: 클릭 이벤트. 출력: isDevModeActive, isDevModeFull 상태 변경
요소의 경로정보: frontend/js/app.js#app-header
요소의 수행해야 할 백엔드/JS 명령: JS: toggleDevMode(), firePython('nav_*'). Py: nav(), win_minimize(), win_maximize(), win_close()">
            <div class="flex items-center h-full gap-[15px]">
                <div class="font-bold text-lg tracking-tighter text-text-main">WAI</div>
                
                <div class="relative group h-full flex items-center">
                    <button class="text-lg text-text-sub hover:text-text-main">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                </div>
                
                <nav class="flex items-center gap-[15px] h-full">
                    <button class="nav-btn hover:text-white text-text-sub" @click="firePython('nav_explore')">탐색</button>
                    <button class="nav-btn active" @click="isProjectModalOpen = true">제작</button>
                    
                    <div class="relative group h-full flex items-center">
                        <button class="nav-btn hover:text-white text-text-sub">자산</button>
                        <div class="absolute top-full left-0 w-32 bg-bg-panel border border-ui-border shadow-xl rounded-b hidden group-hover:block z-50">
                            <button class="w-full text-left px-4 py-2 hover:bg-bg-hover text-xs text-text-main" 
                                    @click="firePython('open_asset_manager')">
                                자산 관리
                            </button>
                        </div>
                    </div>
                    
                    <button class="nav-btn hover:text-white text-text-sub" @click="firePython('nav_settings')">설정</button>
                    <button class="nav-btn hover:text-white text-text-sub" @click="firePython('nav_research')">연구</button>
                </nav>
            </div>
            
            <div class="flex items-center h-full gap-0">
                <button id="inspector-toggle" 
                        class="h-6 px-3 border border-ui-border rounded-l text-text-sub hover:text-white hover:bg-bg-hover flex items-center gap-1 transition-colors" 
                        :class="{'bg-ui-selected text-text-main': isDevModeActive}"
                        @click="toggleDevMode('active')">
                    <i class="fa-solid fa-magnifying-glass"></i> Inspect
                </button>
                
                <button id="dev-toggle" 
                        class="h-6 px-3 border border-ui-border border-l-0 rounded-r text-text-sub hover:text-white hover:bg-bg-hover flex items-center gap-1 mr-4 transition-colors" 
                        :class="{'bg-ui-selected text-text-main': isDevModeFull}"
                        @click="toggleDevMode('full')">
                    <i class="fa-solid fa-code"></i> Dev
                </button>
                
                <div class="flex items-center h-full ml-[15px] gap-0 border-l border-ui-border pl-2">
                    <button class="win-btn" @click="firePython('win_min')">
                        <i class="fa-solid fa-minus text-[10px]"></i>
                    </button>
                    <button class="win-btn" @click="firePython('win_max')">
                        <i class="fa-regular fa-square text-[10px]"></i>
                    </button>
                    <button class="win-btn close" @click="firePython('win_close')">
                        <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                </div>
            </div>
        </header>
        
        <main class="flex-1 flex overflow-hidden relative" id="main-layout">
            <aside id="panel-left" 
                   class="bg-bg-panel flex flex-col relative border-r border-ui-border" 
                   :style="{ width: leftPanelWidth + 'px', minWidth: '180px' }">
                <div class="p-2 border-b border-ui-border font-bold text-text-sub flex justify-between">
                    <span>자산 (Assets)</span>
                    <button class="text-xs hover:text-white" @click="firePython('import_asset')">+</button>
                </div>
                <div class="flex-1 overflow-y-auto p-2 flex flex-col items-center justify-center text-text-sub opacity-30 gap-2" 
                     id="react-asset-list">
                    <i class="fa-solid fa-folder-open text-2xl"></i>
                    <div class="text-[10px]">자산 목록이 비어있습니다.</div>
                </div>
                
                <div class="panel-resizer-v right-0" id="resizer-left"></div>
            </aside>
            
            <section class="flex-1 flex flex-col bg-bg-dark min-w-[400px] relative overflow-hidden">
                <div id="preview-container" 
                     class="relative flex flex-col" 
                     :style="{ height: previewContainerHeight }">
                    
                    <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center justify-center px-2 gap-3 shrink-0 z-20">
                        <div class="flex items-center gap-2 bg-bg-input rounded px-3 h-6 border border-ui-border">
                            <dropdown-menu :current-value="aspectRatio" 
                                         :items="['16:9', '9:16', '1:1']" 
                                         @select="setAspect" 
                                         id="dd-ratio"></dropdown-menu>
                            
                            <div class="w-px h-3 bg-ui-border"></div>
                            
                            <div class="c-info-box px-2 flex items-center bg-bg-input rounded h-6 border border-ui-border w-24 justify-center">
                                <span class="text-xxs font-mono text-ui-accent">
                                    {{ Math.round(mouseCoord.x) }}, {{ Math.round(mouseCoord.y) }}
                                </span>
                            </div>
                            
                            <div class="w-px h-3 bg-ui-border"></div>
                            
                            <dropdown-menu :current-value="resolution" 
                                         :items="['8K', '6K', '4K', '3K', '2K']" 
                                         @select="setResolution" 
                                         id="dd-resolution"></dropdown-menu>
                            
                            <div class="w-px h-3 bg-ui-border"></div>
                            
                            <div class="cursor-pointer flex items-center gap-1 hover:text-white text-[10px] font-bold" 
                                 @click="isMagnet = !isMagnet" 
                                 :class="{'text-ui-accent': isMagnet, 'text-text-sub': !isMagnet}">
                                <i class="fa-solid fa-magnet mr-1"></i> SNAP {{ isMagnet ? 'ON' : 'OFF' }}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex-1 relative overflow-hidden bg-black flex items-center justify-center" 
                         id="canvas-wrapper" 
                         @mousemove="updateCanvasMouseCoord" 
                         @mouseleave="mouseCoord = {x: 0, y: 0}; isMouseOverCanvas = false">
                        
                        <div class="absolute top-0 left-0 w-full h-5 bg-[#121212] border-b border-[#333] z-20 pl-5 flex overflow-hidden" 
                             id="ruler-h">
                            <ruler-line :orientation="'h'" :max-size="canvasSize.w" :scale="canvasScale"></ruler-line>
                        </div>
                        <div class="absolute top-0 left-0 w-5 h-full bg-[#121212] border-r border-[#333] z-20 pt-5 flex flex-col overflow-hidden" 
                             id="ruler-v">
                            <ruler-line :orientation="'v'" :max-size="canvasSize.h" :scale="canvasScale"></ruler-line>
                        </div>
                        
                        <div class="absolute top-0 left-0 w-full h-full z-30 pointer-events-none" 
                             :style="{paddingLeft: '20px', paddingTop: '20px'}">
                            <div class="absolute w-px h-full bg-ui-accent opacity-30" 
                                 :style="{left: mouseMarkerPos.x + 'px'}" 
                                 v-show="isMouseOverCanvas"></div>
                            <div class="absolute h-px w-full bg-ui-accent opacity-30" 
                                 :style="{top: mouseMarkerPos.y + 'px'}" 
                                 v-show="isMouseOverCanvas"></div>
                        </div>
                        
                        <div class="relative overflow-hidden" id="canvas-viewport" style="width:100%; height:100%;">
                            <div id="canvas-scaler" class="canvas-scaler" :style="canvasScalerStyle">
                                <div id="guide-h" class="guide-line-h" style="top: 50%;"></div>
                                <div id="guide-v" class="guide-line-v" style="left: 50%;"></div>
                                
                                <preview-canvas :canvas-boxes="canvasBoxes" 
                                              :selected-box-id="selectedBoxId" 
                                              @select-box="setSelectedBoxId" 
                                              @remove-box="removeBox"></preview-canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="panel-resizer-h" id="resizer-timeline"></div>
                
                <timeline-panel :vm="$data" :style="{ height: timelineContainerHeight }"></timeline-panel>
            </section>
            
            <aside id="panel-right" 
                   class="bg-bg-panel flex flex-col relative border-l border-ui-border" 
                   :style="{ width: rightPanelWidth + 'px', minWidth: '250px' }">
                <div class="panel-resizer-v left-0" id="resizer-right"></div>
                <div class="flex-1 overflow-y-auto flex flex-col" id="vue-right-panel-root">
                    <layer-panel :vm="$data"></layer-panel>
                    <properties-panel :vm="$data"></properties-panel>
                    <div class="flex-1 bg-bg-dark border-t border-ui-border p-2">
                        <div class="text-[10px] text-text-sub text-center opacity-30 mt-4">Effects Library</div>
                    </div>
                </div>
            </aside>
        </main>
        
        <project-modal v-if="isProjectModalOpen" @close="isProjectModalOpen = false"></project-modal>
        
        <div class="dev-overlay" id="dev-overlay" v-if="inspector.tag">
            <div class="dev-highlight" :style="highlightStyle"></div>
            <div class="dev-tooltip" :style="tooltipStyle">
                <span class="text-yellow-400 font-bold">{{ inspector.tag }}</span> 
                <span class="text-blue-300">{{ inspector.id ? '#' + inspector.id : '' }}</span> 
                <span class="text-green-300">{{ inspector.className ? '.' + inspector.className.split(' ')[0] : '' }}</span><br>
                Size: {{ inspector.w }} x {{ inspector.h }}<br>
                <div v-if="inspector.dataDev" class="mt-1 pt-1 border-t border-gray-500 text-[9px] text-gray-300">
                    {{ inspector.dataDev }}
                </div>
            </div>
        </div>
    `
};

const app = createApp(App);

app.component('dropdown-menu', DropdownMenu);
app.component('project-modal', ProjectModal);
app.component('ruler-line', RulerLine);
app.component('layer-panel', LayerPanel);
app.component('properties-panel', PropertiesPanel);
app.component('preview-canvas', PreviewCanvas);
app.component('timeline-panel', TimelinePanel);

app.mount('#vue-app');
