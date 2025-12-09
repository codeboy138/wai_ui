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
      <Header 
        :data-dev='{
          "role": "애플리케이션 헤더 컴포넌트",
          "id": "app-header-component",
          "func": "프로젝트 관리 메뉴 제공 (New, Open, Save, Export)",
          "goal": "사용자가 프로젝트를 관리하고 주요 기능에 접근",
          "state": {},
          "path": "frontend/js/app.js → Header component",
          "py": "",
          "js": ""
        }'
      />

      <!-- 메인 레이아웃 -->
      <main 
        id="app-main"
        class="c-app__main"
        :data-dev='{
          "role": "메인 작업 영역 (3컬럼 레이아웃)",
          "id": "app-main",
          "func": "LeftPanel, PreviewCanvas, RightPanel을 수평 배치",
          "goal": "사용자가 자산 선택, 캔버스 편집, 레이어 관리를 동시에 수행",
          "state": {},
          "path": "frontend/js/app.js → main layout",
          "py": "",
          "js": ""
        }'
      >
        <!-- 좌측 패널 (자산 라이브러리) -->
        <aside 
          id="app-left-panel"
          class="c-app__panel c-app__panel--left"
          :data-dev='{
            "role": "좌측 패널 컨테이너",
            "id": "app-left-panel",
            "func": "LeftPanel 컴포넌트를 포함하는 사이드바",
            "goal": "사용자가 자산을 선택하여 캔버스에 추가",
            "state": {},
            "path": "frontend/js/app.js → left panel",
            "py": "",
            "js": ""
          }'
        >
          <LeftPanel 
            :data-dev='{
              "role": "자산 라이브러리 컴포넌트",
              "id": "app-left-panel-component",
              "func": "이미지, 비디오, 오디오, 텍스트 자산 관리",
              "goal": "사용자가 자산을 카테고리별로 관리하고 캔버스에 추가",
              "state": {},
              "path": "frontend/js/app.js → LeftPanel component",
              "py": "",
              "js": ""
            }'
          />
        </aside>

        <!-- 중앙 패널 (프리뷰 캔버스) -->
        <section 
          id="app-center-panel"
          class="c-app__panel c-app__panel--center"
          :data-dev='{
            "role": "중앙 패널 컨테이너",
            "id": "app-center-panel",
            "func": "PreviewToolbar와 PreviewCanvas를 포함하는 메인 작업 영역",
            "goal": "사용자가 캔버스에서 레이어를 시각적으로 편집",
            "state": {},
            "path": "frontend/js/app.js → center panel",
            "py": "",
            "js": ""
          }'
        >
          <PreviewToolbar 
            :data-dev='{
              "role": "프리뷰 도구 모음 컴포넌트",
              "id": "app-preview-toolbar-component",
              "func": "Ratio, Quality, Resolution 선택 UI",
              "goal": "사용자가 캔버스 해상도 설정",
              "state": {},
              "path": "frontend/js/app.js → PreviewToolbar component",
              "py": "",
              "js": ""
            }'
          />
          
          <PreviewCanvas 
            :data-dev='{
              "role": "프리뷰 캔버스 컴포넌트",
              "id": "app-preview-canvas-component",
              "func": "레이어 객체를 시각적으로 배치 및 편집",
              "goal": "사용자가 레이어를 드래그, 리사이즈하며 실시간 피드백 제공",
              "state": {},
              "path": "frontend/js/app.js → PreviewCanvas component",
              "py": "",
              "js": ""
            }'
          />
        </section>

        <!-- 우측 패널 (레이어 매트릭스 + 속성) -->
        <aside 
          id="app-right-panel"
          class="c-app__panel c-app__panel--right"
          :data-dev='{
            "role": "우측 패널 컨테이너",
            "id": "app-right-panel",
            "func": "RightPanel 컴포넌트를 포함하는 사이드바",
            "goal": "사용자가 레이어를 매트릭스로 관리하고 속성 편집",
            "state": {},
            "path": "frontend/js/app.js → right panel",
            "py": "",
            "js": ""
          }'
        >
          <RightPanel 
            :data-dev='{
              "role": "레이어 매트릭스 및 속성 패널 컴포넌트",
              "id": "app-right-panel-component",
              "func": "레이어 매트릭스 그리드와 선택된 레이어의 속성 편집 UI",
              "goal": "사용자가 레이어를 시각적으로 관리하고 속성 수정",
              "state": {},
              "path": "frontend/js/app.js → RightPanel component",
              "py": "",
              "js": ""
            }'
          />
        </aside>
      </main>

      <!-- 타임라인 패널 (하단) -->
      <footer 
        id="app-timeline-panel"
        class="c-app__panel c-app__panel--bottom"
        :data-dev='{
          "role": "타임라인 패널 컨테이너",
          "id": "app-timeline-panel",
          "func": "TimelinePanel 컴포넌트를 포함하는 하단 영역",
          "goal": "사용자가 클립을 시간축에 배치하고 재생 제어",
          "state": {},
          "path": "frontend/js/app.js → timeline panel",
          "py": "",
          "js": ""
        }'
      >
        <TimelinePanel 
          :data-dev='{
            "role": "타임라인 컴포넌트",
            "id": "app-timeline-component",
            "func": "트랙, 클립, Playhead, 재생 제어 UI",
            "goal": "사용자가 클립을 시간축에서 편집하고 프로젝트 재생",
            "state": {},
            "path": "frontend/js/app.js → TimelinePanel component",
            "py": "",
            "js": ""
          }'
        />
      </footer>

      <!-- DATA DEV Inspector (devMode 활성화 시) -->
      <div 
        v-if="devMode && inspector.visible"
        id="data-dev-inspector"
        class="c-inspector"
        :data-dev='{
          "role": "DATA DEV Inspector (개발자 도구)",
          "id": "data-dev-inspector",
          "func": "마우스 오버 시 data-dev 속성 정보를 실시간 표시",
          "goal": "개발자가 컴포넌트 구조, 역할, 상태, 명령을 빠르게 파악",
          "state": {
            "visible": inspector.visible,
            "target": "현재 마우스 오버 중인 요소",
            "data": "data-dev 파싱 데이터"
          },
          "path": "frontend/js/app.js → DATA DEV Inspector",
          "py": "",
          "js": "initInspector()"
        }'
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
app.component('DropdownMenu', DropdownMenu);

// ==========================================
// Vue 앱 마운트
// ==========================================
app.mount('#app');

console.log('[WAI Studio] Application Initialized');
