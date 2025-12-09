import { store } from '../store.js';
import { bridge } from '../bridge.js';

// HeaderDropdown 컴포넌트 정의 삭제됨

export default {
    // components: { HeaderDropdown }, 삭제됨
    template: `
        <header class="header-compact bg-bg-panel border-b border-ui-border flex items-center justify-between shrink-0 select-none px-4 relative z-header" 
                style="-webkit-app-region: drag" 
                data-dev="ID: header-root | Role: Container | Func: 헤더 | Goal: 전역 네비게이션 | Path: App/Header | Py: None">
            
            <div class="flex items-center h-full gap-4 z-20" style="-webkit-app-region: no-drag">
                <div class="font-bold tracking-tight text-text-main cursor-default" 
                     data-dev="ID: logo | Role: Label | Func: 로고 | Goal: 브랜드 표시 | Path: App/Header/Logo | Py: None">WAI</div>
                
                <button class="w-8 h-full hover:bg-bg-hover flex items-center justify-center text-text-sub" 
                        @click="toggleMenu" 
                        title="사이드바 토글"
                        data-dev="ID: btn-hamburger | Role: Button | Func: 사이드바 토글 | Goal: 좌측 패널 열기/닫기 | Path: App/Header/LeftNav | Py: ui.toggle_sidebar()">
                    <i class="fa-solid fa-bars"></i>
                </button>

                <nav class="flex items-center gap-1 h-full ml-2">
                    
                    <div class="c-nav-group z-10" data-dev="ID: nav-explore | Role: Group | Func: 탐색 메뉴 | Goal: 탐색 기능 진입 | Path: App/Header/Nav/Explore | Py: None">
                        <button class="nav-btn">탐색</button>
                    </div>
                    
                    <div class="c-nav-group group z-10" data-dev="ID: nav-prod-group | Role: Group | Func: 제작 메뉴 | Goal: 제작 도구 접근 | Path: App/Header/Nav/Production | Py: None">
                        <button class="nav-btn active">제작</button>
                        <div class="c-dropdown-menu">
                            <div class="relative group/sub w-full">
                                <div class="c-menu-item" data-dev="ID: menu-video-auto | Role: MenuItem | Func: 영상제작자동화 | Goal: 하위 메뉴 노출 | Path: App/Menu/Prod | Py: None">
                                    <span>영상제작자동화</span>
                                    <i class="fa-solid fa-chevron-right text-[9px] text-text-sub"></i>
                                </div>
                                <div class="c-submenu">
                                    <div class="c-menu-item" @click="openProjectManager" 
                                         data-dev="ID: item-proj-mgr | Role: Action | Func: 프로젝트 관리 | Goal: 프로젝트 모달 열기 | Path: App/Menu/Prod/Auto/Proj | Py: project.open_manager()">
                                        <span>프로젝트 관리</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="c-nav-group z-10" data-dev="ID: nav-assets | Role: Group | Func: 자산 메뉴 | Goal: 자산 관리 | Path: App/Header/Nav/Assets | Py: None">
                        <button class="nav-btn">자산</button>
                    </div>
                    
                    <div class="c-nav-group group z-10" data-dev="ID: nav-research | Role: Group | Func: 연구 메뉴 | Goal: 연구 도구 | Path: App/Header/Nav/Research | Py: None">
                        <button class="nav-btn">연구</button>
                        <div class="c-dropdown-menu">
                            <div class="c-menu-item" @click="openDesignGuide" 
                                 data-dev="ID: item-design | Role: Action | Func: 디자인 가이드 | Goal: 가이드북 열기 | Path: App/Menu/Research/Design | Py: app.show_design_guide()">
                                <span>디자인 가이드</span>
                            </div>
                        </div>
                    </div>

                    <div class="c-nav-group group z-10" data-dev="ID: nav-settings | Role: Group | Func: 설정 메뉴 | Goal: 시스템 설정 | Path: App/Header/Nav/Settings | Py: None">
                        <button class="nav-btn">설정</button>
                        <div class="c-dropdown-menu">
                            <div class="c-menu-item" @click="winCtrl('preferences')" data-dev="ID: item-pref | Role: Action | Func: 환경설정 | Goal: 설정창 열기 | Path: App/Menu/Settings/Pref | Py: app.preferences()"><span>환경설정</span></div>
                            <div class="c-menu-item" @click="winCtrl('shortcuts')" data-dev="ID: item-keys | Role: Action | Func: 단축키 | Goal: 키맵 확인 | Path: App/Menu/Settings/Keys | Py: app.shortcuts()"><span>단축키</span></div>
                            <div class="border-t border-ui-border my-1"></div>
                            <div class="c-menu-item" @click="winCtrl('about')" data-dev="ID: item-about | Role: Action | Func: 버전 정보 | Goal: 앱 정보 확인 | Path: App/Menu/Settings/About | Py: app.about()"><span>버전 정보</span></div>
                        </div>
                    </div>
                </nav>
            </div>

            <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 text-center z-10" style="-webkit-app-region: no-drag">
                <input type="text" v-model="store.project.name" placeholder="프로젝트 이름 없음" 
                       class="bg-transparent text-center text-xs text-text-main font-bold placeholder-text-sub/30 focus:outline-none focus:bg-bg-input/50 rounded py-1 w-full"
                       title="프로젝트 이름 수정"
                       data-dev="ID: input-proj-name | Role: Input | Func: 이름 입력 | Goal: 프로젝트명 변경 | Path: App/Header/Center | Py: project.rename(val)"/>
            </div>
            
            <div class="flex items-center h-full gap-2 z-20" style="-webkit-app-region: no-drag">
                <div class="flex items-center border border-ui-border rounded overflow-hidden mr-4 h-full my-1">
                    <button class="px-3 h-full text-[10px] transition-colors flex items-center gap-1 font-bold" 
                            :class="store.devMode.active ? 'bg-ui-accent text-white' : 'text-text-sub hover:text-white hover:bg-bg-hover'" 
                            @click="toggleDev" 
                            title="데이터 디버그 모드 토글"
                            data-dev="ID: btn-datadev | Role: Toggle | Func: DATA DEV | Goal: 인스펙터 활성화 | Path: App/Header/Tools | Py: dev.toggle_inspector()">
                        <i class="fa-solid fa-code mr-1"></i> DATA DEV
                    </button>
                </div>
                <div class="flex items-center h-full gap-0 border-l border-ui-border pl-2">
                    <button class="win-btn" @click="winCtrl('minimize')" data-dev="ID: win-min | Role: Button | Func: 최소화 | Goal: 창 숨기기 | Path: App/Header/Window | Py: win.minimize()">_</button>
                    <button class="win-btn" @click="winCtrl('maximize')" data-dev="ID: win-max | Role: Button | Func: 최대화 | Goal: 전체화면 | Path: App/Header/Window | Py: win.maximize()">□</button>
                    <button class="win-btn close" @click="winCtrl('close')" data-dev="ID: win-close | Role: Button | Func: 닫기 | Goal: 앱 종료 | Path: App/Header/Window | Py: win.close()">X</button>
                </div>
            </div>
        </header>
    `,
    setup() { return { store }; },
    methods: {
        winCtrl(act) { 
            // 'preferences', 'shortcuts', 'about' 등의 메뉴 액션을 winCtrl로 통합 (임시)
            if (['minimize', 'maximize', 'close'].includes(act)) {
                bridge.winControl(act); 
            } else {
                console.log(`[Bridge] Fire Menu Action: app.${act}`);
                bridge.fire(`app.${act}`);
            }
        },
        openProjectManager() { store.layout.isProjectModalOpen = true; },
        openDesignGuide() { store.layout.isDesignGuideOpen = true; },
        toggleMenu() { store.layout.isLeftPanelVisible = !store.layout.isLeftPanelVisible; },
        toggleDev() { 
            store.devMode.active = !store.devMode.active;
            store.devMode.full = store.devMode.active;
            document.body.classList.toggle('dev-mode-active', store.devMode.active);
        }
    }
}