/**
 * [DATA-DEV: Header]
 * - 역할: 앱 헤더 (네비게이션 + Dev 모드 버튼)
 * - 고유ID: header
 * - 기능: 페이지 이동, Dev 모드 토글, 창 제어
 * - 로직: 버튼 클릭 → firePython() 또는 toggleDevMode()
 * - 데이터: currentPage, devMode
 * - 경로: frontend/js/components/Header.js
 * - 명령: firePython('nav_explore'), toggleDevMode('inspect')
 */

export default {
  name: 'Header',
  template: '<header id="app-header" class="c-header" data-action="js:header" title="앱 헤더">' +
            '<nav id="header-nav" class="c-header__nav" data-action="js:navigation" title="네비게이션">' +
            '<button id="header-nav-explore-btn" class="c-header__nav-btn" data-action="py:nav_explore" title="탐색" @click="navigate(\'explore\')">탐색</button>' +
            '<button id="header-nav-assets-btn" class="c-header__nav-btn" data-action="py:nav_assets" title="에셋" @click="navigate(\'assets\')">에셋</button>' +
            '<button id="header-nav-timeline-btn" class="c-header__nav-btn" data-action="py:nav_timeline" title="타임라인" @click="navigate(\'timeline\')">타임라인</button>' +
            '</nav>' +
            '<div id="header-devmode" class="c-header__devmode" data-action="js:devmode" title="개발 모드">' +
            '<button id="header-devmode-inspect-btn" class="c-header__devmode-btn" data-action="js:toggleInspect" title="Inspector 모드" @click="toggleInspect">Inspect</button>' +
            '<button id="header-devmode-datadev-btn" class="c-header__devmode-btn" data-action="js:toggleDataDev" title="DATA-DEV 모드" @click="toggleDataDev">DATA-DEV</button>' +
            '</div>' +
            '<div id="header-window-controls" class="c-header__window-controls" data-action="js:windowControls" title="창 제어">' +
            '<button id="header-window-minimize-btn" class="c-header__window-btn" data-action="py:window_minimize" title="최소화" @click="minimizeWindow">-</button>' +
            '<button id="header-window-maximize-btn" class="c-header__window-btn" data-action="py:window_maximize" title="최대화" @click="maximizeWindow">□</button>' +
            '<button id="header-window-close-btn" class="c-header__window-btn" data-action="py:window_close" title="닫기" @click="closeWindow">×</button>' +
            '</div>' +
            '</header>',
  
  methods: {
    navigate(page) {
      this.$root.currentPage = page;
      console.log('[Header] 페이지 이동:', page);
      this.$root.firePython('nav_' + page);
    },
    
    toggleInspect() {
      this.$root.toggleDevMode('inspect');
      console.log('[Header] Inspector 토글');
    },
    
    toggleDataDev() {
      this.$root.toggleDevMode('data-dev');
      console.log('[Header] DATA-DEV 토글');
    },
    
    minimizeWindow() {
      console.log('[Header] 창 최소화');
      this.$root.firePython('window_minimize');
    },
    
    maximizeWindow() {
      console.log('[Header] 창 최대화');
      this.$root.firePython('window_maximize');
    },
    
    closeWindow() {
      console.log('[Header] 창 닫기');
      this.$root.firePython('window_close');
    }
  }
};
