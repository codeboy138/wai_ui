/**
 * ==========================================
 * Header.js - 헤더 컴포넌트
 * 
 * 역할: 상단 네비게이션 및 윈도우 컨트롤
 * 경로: frontend/js/components/Header.js
 * ==========================================
 */

export default {
    name: 'AppHeader',
    
    props: ['vm'],
    
    template: `
        <header id="header-main" 
                class="c-header">
            <div class="c-header__left">
                <div class="c-header__logo">WAI</div>
                
                <div class="c-header__menu-icon">
                    <button class="c-header__btn" title="메뉴">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                </div>
                
                <nav class="c-header__nav">
                    <button id="header-nav-explore-btn"
                            class="c-header__nav-btn"
                            data-action="py:nav_explore"
                            title="탐색"
                            @click="$parent.firePython('nav_explore')">
                        탐색
                    </button>
                    
                    <button id="header-nav-create-btn"
                            class="c-header__nav-btn c-header__nav-btn--active"
                            data-action="js:toggleModal"
                            title="제작"
                            @click="vm.isProjectModalOpen = true">
                        제작
                    </button>
                    
                    <div class="c-header__nav-dropdown">
                        <button class="c-header__nav-btn" title="자산">자산</button>
                        <div class="c-header__nav-dropdown-menu">
                            <button id="header-nav-assets-manage-btn"
                                    class="c-header__nav-dropdown-item"
                                    data-action="py:open_asset_manager"
                                    title="자산 관리"
                                    @click="$parent.firePython('open_asset_manager')">
                                자산 관리
                            </button>
                        </div>
                    </div>
                    
                    <button id="header-nav-settings-btn"
                            class="c-header__nav-btn"
                            data-action="py:nav_settings"
                            title="설정"
                            @click="$parent.firePython('nav_settings')">
                        설정
                    </button>
                    
                    <button id="header-nav-research-btn"
                            class="c-header__nav-btn"
                            data-action="py:nav_research"
                            title="연구"
                            @click="$parent.firePython('nav_research')">
                        연구
                    </button>
                </nav>
            </div>
            
            <div class="c-header__right">
                <button id="header-devmode-inspect-btn" 
                        class="c-header__devmode-btn c-header__devmode-btn--left" 
                        :class="{'c-header__devmode-btn--active': vm.isDevModeActive}"
                        data-action="js:toggleDevMode"
                        title="요소 검사"
                        @click="$parent.toggleDevMode('inspect')">
                    <i class="fa-solid fa-magnifying-glass"></i> Inspect
                </button>
                
                <button id="header-devmode-datadev-btn" 
                        class="c-header__devmode-btn c-header__devmode-btn--right" 
                        :class="{'c-header__devmode-btn--active': vm.isDevModeFull}"
                        data-action="js:toggleDevMode"
                        title="DATA-DEV 보기"
                        @click="$parent.toggleDevMode('datadev')">
                    <i class="fa-solid fa-code"></i> DATA-DEV
                </button>
                
                <div class="c-header__window-controls">
                    <button id="header-window-minimize-btn"
                            class="c-header__window-btn"
                            data-action="py:win_min"
                            title="최소화"
                            @click="$parent.firePython('win_min')">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    
                    <button id="header-window-maximize-btn"
                            class="c-header__window-btn"
                            data-action="py:win_max"
                            title="최대화"
                            @click="$parent.firePython('win_max')">
                        <i class="fa-regular fa-square"></i>
                    </button>
                    
                    <button id="header-window-close-btn"
                            class="c-header__window-btn c-header__window-btn--close"
                            data-action="py:win_close"
                            title="닫기"
                            @click="$parent.firePython('win_close')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        </header>
    `
};
