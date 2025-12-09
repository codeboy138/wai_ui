/**
 * ==========================================
 * app.js - Vue 3 앱 초기화
 * 
 * 역할: Vue 3 애플리케이션 생성 및 마운트
 * 경로: frontend/js/app.js
 * ==========================================
 */

import store from './store.js';
import Panels from './components/Panels.js';
import Timeline from './components/Timeline.js';
import Canvas from './components/Canvas.js';
import Common from './components/Common.js';

const { createApp } = window.Vue;

const app = createApp({
  name: 'App',
  
  template: `
    <div 
      class="flex flex-col h-screen bg-bg-dark text-text-main"
      data-dev="
요소의 역할: Vue 3 루트 애플리케이션 컨테이너
요소의 고유ID: vue-app-root
요소의 기능 목적 정의: 전체 레이아웃 구성 (Header, LeftPanel, Canvas, RightPanel, Timeline)
요소의 동작 로직 설명: app.mount('#vue-app') 시 렌더링, Store 상태 기반 반응형 UI 업데이트
요소의 입출력 데이터 구조: 입력: store 전역 상태. 출력: 렌더링된 컴포넌트 트리
요소의 경로정보: frontend/js/app.js#AppRoot
요소의 수행해야 할 백엔드/JS 명령: JS: createApp().mount('#vue-app'), store 반응형 업데이트
      "
    >
      <Header />
      
      <main class="flex flex-1 overflow-hidden">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </main>
      
      <Timeline />
    </div>
  `,
  
  mounted() {
    console.log('✅ WAI Studio 앱 마운트 완료');
    console.log('📦 Store:', this.$store);
  }
});

// 전역 Store 주입
app.config.globalProperties.$store = store;

// 컴포넌트 등록
app.component('Header', Panels.Header);
app.component('LeftPanel', Panels.LeftPanel);
app.component('RightPanel', Panels.RightPanel);
app.component('Timeline', Timeline);
app.component('Canvas', Canvas);

// 앱 마운트
app.mount('#vue-app');

console.log('🚀 WAI Studio 앱이 성공적으로 시작되었습니다!');
