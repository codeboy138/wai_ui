/**
 * [DATA-DEV: app.js]
 * - 역할: Vue 3 앱 진입점
 * - 고유ID: app-root
 * - 기능: 컴포넌트 등록, 전역 상태 연결, Python 브릿지
 * - 로직: createApp → components 등록 → mixins 적용 → mount
 * - 데이터: store.js에서 가져옴
 * - 경로: frontend/js/app.js
 * - 명령: firePython() 전역 제공
 */

import { appState } from './store.js';
import pythonBridge from './mixins/pythonBridge.js';
import panelResizer from './mixins/panelResizer.js';
import devMode from './mixins/devMode.js';

import Header from './components/Header.js';
import AppMain from './components/AppMain.js';
import DropdownMenu from './components/DropdownMenu.js';
import ProjectModal from './components/ProjectModal.js';

const { createApp } = Vue;

const app = createApp({
  template: '<div id="app-root" class="c-app-root">' +
            '<app-header></app-header>' +
            '<app-main></app-main>' +
            '<project-modal :isOpen="isProjectModalOpen" @close="isProjectModalOpen = false"></project-modal>' +
            '</div>',
  
  data() {
    return {
      ...appState,
      isProjectModalOpen: false
    };
  },
  
  mixins: [pythonBridge, panelResizer, devMode],
  
  mounted() {
    console.log('[App] Vue 앱 마운트 완료');
    
    // 개발 모드 초기화
    this.setupDevMode();
    
    // 패널 리사이저 초기화 (다음 틱에서 실행)
    this.$nextTick(() => {
      this.setupLeftPanelResizer();
      this.setupRightPanelResizer();
      this.setupTimelineResizer();
      this.setupCanvasScaler();
    });
    
    console.log('[App] 초기화 완료');
  },
  
  methods: {
    setupDevMode() {
      const inspectBtn = document.getElementById('header-devmode-inspect-btn');
      const dataDevBtn = document.getElementById('header-devmode-datadev-btn');
      
      if (inspectBtn) {
        inspectBtn.addEventListener('click', () => {
          this.toggleDevMode('inspect');
        });
      }
      
      if (dataDevBtn) {
        dataDevBtn.addEventListener('click', () => {
          this.toggleDevMode('data-dev');
        });
      }
    }
  }
});

// 컴포넌트 등록
app.component('app-header', Header);
app.component('app-main', AppMain);
app.component('dropdown-menu', DropdownMenu);
app.component('project-modal', ProjectModal);

// 앱 마운트
app.mount('#vue-app');

console.log('[App] Vue 3 앱 시작');
