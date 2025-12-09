/**
 * ==========================================
 * app.js
 * 
 * 역할: WAI Studio 메인 애플리케이션 (Vue 앱 루트)
 * 경로: frontend/js/app.js
 * ==========================================
 */

// ==========================================
// 전역 상태 (store) 가져오기
// ==========================================
const store = window.store;

// ==========================================
// Vue 애플리케이션 생성
// ==========================================
const { createApp } = Vue;

const app = createApp({
  name: 'WAIStudio',
  
  data() {
    return {
      // 전역 상태 store 참조
      store: store,
      
      // DATA DEV 모드 활성화 여부
      devMode: true,
      
      // Inspector 표시 상태
      inspector: {
        visible: false,
        target: null,
        data: {}
      }
    };
  },
  
  methods: {
    /**
     * 레이어 추가 메서드 (공통)
     * @param {Object} layerData - 레이어 데이터 { name, type, visible, locked, asset }
     */
    addLayer(layerData) {
      const newLayer = {
        id: 'layer-' + Date.now(),
        name: layerData.name || 'New Layer',
        type: layerData.type || 'image',
        visible: layerData.visible !== undefined ? layerData.visible : true,
        locked: layerData.locked || false,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 20,
        asset: layerData.asset || null,
        clips: []
      };
      
      this.store.layers.push(newLayer);
      console.log('[App] Layer Added:', newLayer);
    },
    
    /**
     * DATA DEV Inspector 초기화
     */
    initInspector() {
      if (!this.devMode) return;
      
      document.addEventListener('mouseover', (event) => {
        const target = event.target;
        const devData = target.getAttribute('data-dev');
        
        if (devData) {
          try {
            this.inspector.data = JSON.parse(devData);
            this.inspector.target = target;
            this.inspector.visible = true;
          } catch (e) {
            console.error('[Inspector] Invalid data-dev:', e);
          }
        }
      });
      
      document.addEventListener('mouseout', (event) => {
        if (event.target.hasAttribute('data-dev')) {
          this.inspector.visible = false;
        }
      });
      
      console.log('[App] DATA DEV Inspector Initialized');
    }
  },
  
  mounted() {
    console.log('[App] WAI Studio Mounted');
    
    // DATA DEV Inspector 초기화
    this.initInspector();
  },
  
  template: `
    <div 
      id="app-container"
      class="c-app"
      data-js-app
      :data-dev='{
        "role": "WAI Studio 메인 애플리케이션 컨테이너",
        "id": "app-container",
        "func": "전체 UI 레이아웃 및 컴포넌트 통합 (Header, LeftPanel, PreviewCanvas, RightPanel, Timeline)",
        "goal": "사용자가 영상 편집 작업을 수행할 수 있는 통합 환경 제공",
        "state": {
          "store": "전역 상태 (프로젝트, 캔버스, 레이어, 자산)",
          "devMode": "DATA DEV 모드 활성화 여부",
          "inspector": "DATA DEV Inspector 상태 { visible, target, data }"
        },
        "path": "frontend/js/app.js",
        "py": "",
        "js": "addLayer(layerData), initInspector()"
      }'
    >
      <!-- 헤더 -->
      <Header />

      <!-- 메인 레이아웃 -->
      <main 
        id="app-main"
        class="c-app__main"
      >
        <!-- 좌측 패널 (자산 라이브러리) -->
        <aside 
          id="app-left-panel"
          class="c-app__panel c-app__panel--left"
        >
          <LeftPanel />
        </aside>

        <!-- 중앙 패널 (프리뷰 캔버스) -->
        <section 
          id="app-center-panel"
          class="c-app__panel c-app__panel--center"
        >
          <PreviewToolbar />
          <PreviewCanvas />
        </section>

        <!-- 우측 패널 (레이어 매트릭스 + 속성) -->
        <aside 
          id="app-right-panel"
          class="c-app__panel c-app__panel--right"
        >
          <RightPanel />
        </aside>
      </main>

      <!-- 타임라인 패널 (하단) -->
      <footer 
        id="app-timeline-panel"
        class="c-app__panel c-app__panel--bottom"
      >
        <TimelinePanel />
      </footer>

      <!-- DATA DEV Inspector (devMode 활성화 시) -->
      <div 
        v-if="devMode && inspector.visible"
        id="data-dev-inspector"
        class="c-inspector"
      >
        <div class="c-inspector__header">
          <strong>DATA DEV Inspector</strong>
        </div>
        <div class="c-inspector__body">
          <div class="c-inspector__field">
            <strong>Role:</strong> {{ inspector.data.role }}
          </div>
          <div class="c-inspector__field">
            <strong>ID:</strong> <code>{{ inspector.data.id }}</code>
          </div>
          <div class="c-inspector__field">
            <strong>Func:</strong> {{ inspector.data.func }}
          </div>
          <div class="c-inspector__field">
            <strong>Goal:</strong> {{ inspector.data.goal }}
          </div>
          <div class="c-inspector__field">
            <strong>State:</strong> <pre>{{ JSON.stringify(inspector.data.state, null, 2) }}</pre>
          </div>
          <div class="c-inspector__field">
            <strong>Path:</strong> <code>{{ inspector.data.path }}</code>
          </div>
          <div class="c-inspector__field">
            <strong>Python:</strong> <code>{{ inspector.data.py || 'N/A' }}</code>
          </div>
          <div class="c-inspector__field">
            <strong>JS:</strong> <code>{{ inspector.data.js || 'N/A' }}</code>
          </div>
        </div>
      </div>
    </div>
  `
});

// ==========================================
// 컴포넌트 등록
// ==========================================
app.component('Header', Header);
app.component('LeftPanel', LeftPanel);
app.component('PreviewToolbar', PreviewToolbar);
app.component('PreviewCanvas', PreviewCanvas);
app.component('RightPanel', RightPanel);
app.component('TimelinePanel', TimelinePanel);
app.component('ProjectModal', ProjectModal);
app.component('DesignGuide', DesignGuide);

// DropdownMenu 전역 변수 확인 후 등록
if (typeof DropdownMenu !== 'undefined') {
  app.component('DropdownMenu', DropdownMenu);
}

// ==========================================
// Vue 앱 마운트 (중요! #app-root로 수정)
// ==========================================
app.mount('#app-root');

console.log('[WAI Studio] Application Initialized');
