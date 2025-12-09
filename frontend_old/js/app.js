/**
 * ==========================================
 * app.js
 * 
 * 역할: Vue 3 앱 메인 엔트리 포인트
 * 경로: frontend/js/app.js
 * ==========================================
 */

// ES6 Module Imports
import store from './store.js';
import { DropdownMenu, RulerLine } from './components/Common.js';
import DesignGuide from './components/DesignGuide.js';
import ProjectModal from './components/ProjectModal.js';
import LeftPanel from './components/LeftPanel.js';
import PreviewToolbar from './components/PreviewToolbar.js';
import PreviewCanvas from './components/PreviewCanvas.js';
import RightPanel from './components/RightPanel.js';
import TimelinePanel from './components/TimelinePanel.js';
import Header from './components/Header.js';

// ES6 Module 내에서 window.Vue 사용
const { createApp } = window.Vue;

/**
 * ==========================================
 * Vue 3 앱 생성
 * ==========================================
 */
const app = createApp({
  name: 'App',
  
  data() {
    return {};
  },
  
  mounted() {
    console.log('✅ WAI Studio 앱 마운트 완료');
    console.log('📦 Store:', this.$store);
    
    // DATA DEV Inspector 초기화
    this.initDataDevInspector();
  },
  
  methods: {
    /**
     * DATA DEV Inspector 초기화
     * 마우스 오버 시 data-dev 속성을 플로팅 패널로 표시
     */
    initDataDevInspector() {
      let inspectorPanel = document.getElementById('data-dev-inspector');
      
      // Inspector 패널이 없으면 생성
      if (!inspectorPanel) {
        inspectorPanel = document.createElement('div');
        inspectorPanel.id = 'data-dev-inspector';
        inspectorPanel.className = 'data-dev-inspector';
        inspectorPanel.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          width: 320px;
          max-height: 600px;
          overflow-y: auto;
          background: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 16px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #f4f4f5;
          z-index: 300000;
          display: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;
        document.body.appendChild(inspectorPanel);
      }
      
      // 마우스 오버 이벤트 (전역)
      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-dev]');
        if (target && target.dataset.dev) {
          try {
            // JSON 파싱 시도
            const devData = JSON.parse(target.dataset.dev);
            
            // Inspector 패널 내용 업데이트
            inspectorPanel.innerHTML = `
              <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #3f3f46;">
                <strong style="color: #3b82f6; font-size: 14px;">DATA DEV Inspector</strong>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #a1a1aa;">Role:</strong><br>
                <span style="color: #f4f4f5;">${devData.role || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #a1a1aa;">ID:</strong><br>
                <code style="color: #22c55e;">${devData.id || 'N/A'}</code>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #a1a1aa;">Func:</strong><br>
                <span style="color: #f4f4f5;">${devData.func || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #a1a1aa;">Goal:</strong><br>
                <span style="color: #f4f4f5;">${devData.goal || 'N/A'}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #a1a1aa;">State:</strong><br>
                <pre style="background: #09090b; padding: 8px; border-radius: 4px; color: #fbbf24; overflow-x: auto; white-space: pre-wrap;">${JSON.stringify(devData.state, null, 2)}</pre>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #a1a1aa;">Path:</strong><br>
                <code style="color: #8b5cf6;">${devData.path || 'N/A'}</code>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #a1a1aa;">Python:</strong><br>
                <code style="color: #06b6d4;">${devData.py || 'None'}</code>
              </div>
              <div>
                <strong style="color: #a1a1aa;">JavaScript:</strong><br>
                <code style="color: #f59e0b;">${devData.js || 'None'}</code>
              </div>
            `;
            
            inspectorPanel.style.display = 'block';
          } catch (err) {
            // JSON 파싱 실패 시 에러를 표시하지 않고 무시
            console.warn('⚠️ data-dev 파싱 실패 (무시됨):', target.dataset.dev);
            inspectorPanel.style.display = 'none';
          }
        } else {
          inspectorPanel.style.display = 'none';
        }
      });
      
      console.log('✅ DATA DEV Inspector 초기화 완료');
    }
  },
  
  template: `
    <div 
      id="app-container"
      class="c-app"
      data-dev='{"role":"WAI Studio 메인 앱 컨테이너","id":"app-container","func":"전체 앱 레이아웃 구성","goal":"통합 인터페이스 제공","state":{},"path":"frontend/js/app.js","py":"","js":"initDataDevInspector()"}'
    >
      <!-- 헤더 -->
      <Header />
      
      <!-- 메인 콘텐츠 영역 -->
      <main 
        id="app-main"
        class="c-app__main"
        data-dev='{"role":"메인 작업 영역","id":"app-main","func":"3개 패널 배치","goal":"에셋/캔버스/레이어 관리","state":{},"path":"frontend/js/app.js → main","py":"","js":""}'
      >
        <!-- 왼쪽 패널 -->
        <aside 
          id="app-left-panel"
          class="c-app__panel c-app__panel--left"
          data-dev='{"role":"에셋 라이브러리","id":"app-left-panel","func":"미디어 에셋 관리","goal":"캔버스로 드래그","state":{},"path":"frontend/js/app.js → left","py":"","js":""}'
        >
          <LeftPanel />
        </aside>
        
        <!-- 중앙 패널 -->
        <section 
          id="app-center-panel"
          class="c-app__panel c-app__panel--center"
          data-dev='{"role":"프리뷰 캔버스","id":"app-center-panel","func":"캔버스 및 툴바","goal":"레이어 시각 편집","state":{},"path":"frontend/js/app.js → center","py":"","js":""}'
        >
          <PreviewToolbar />
          <PreviewCanvas />
        </section>
        
        <!-- 오른쪽 패널 -->
        <aside 
          id="app-right-panel"
          class="c-app__panel c-app__panel--right"
          data-dev='{"role":"레이어 행렬","id":"app-right-panel","func":"4x4 레이어 관리","goal":"레이어 구조 관리","state":{},"path":"frontend/js/app.js → right","py":"","js":""}'
        >
          <RightPanel />
        </aside>
      </main>
      
      <!-- 타임라인 패널 -->
      <footer 
        id="app-timeline-panel"
        class="c-app__timeline"
        data-dev='{"role":"타임라인 패널","id":"app-timeline-panel","func":"비디오/오디오 타임라인","goal":"타이밍 조정 및 재생","state":{},"path":"frontend/js/app.js → timeline","py":"","js":""}'
      >
        <TimelinePanel />
      </footer>
      
      <!-- 모달: Design Guide -->
      <DesignGuide 
        :visible="$store.showDesignGuide"
        @close="$store.showDesignGuide = false"
      />
      
      <!-- 모달: Project Modal -->
      <ProjectModal 
        :visible="$store.showProjectModal"
        @close="$store.showProjectModal = false"
      />
    </div>
  `
});

/**
 * ==========================================
 * 전역 store 주입
 * ==========================================
 */
app.config.globalProperties.$store = store;

/**
 * ==========================================
 * 컴포넌트 등록
 * ==========================================
 */
app.component('DropdownMenu', DropdownMenu);
app.component('RulerLine', RulerLine);
app.component('DesignGuide', DesignGuide);
app.component('ProjectModal', ProjectModal);
app.component('LeftPanel', LeftPanel);
app.component('PreviewToolbar', PreviewToolbar);
app.component('PreviewCanvas', PreviewCanvas);
app.component('RightPanel', RightPanel);
app.component('TimelinePanel', TimelinePanel);
app.component('Header', Header);

/**
 * ==========================================
 * Vue 앱 마운트
 * ==========================================
 */
app.mount('#app-root');

console.log('🚀 WAI Studio 앱이 성공적으로 시작되었습니다!');
