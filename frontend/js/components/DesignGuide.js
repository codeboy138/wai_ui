/**
 * ==========================================
 * DesignGuide.js
 * 
 * 역할: 디자인 가이드 모달 (Zinc-Dark Edition 문서 표시)
 * 경로: frontend/js/components/DesignGuide.js
 * ==========================================
 */

const DesignGuide = {
  name: 'DesignGuide',
  
  props: {
    // 모달 표시 여부
    visible: {
      type: Boolean,
      default: false
    }
  },
  
  methods: {
    /**
     * 모달 닫기 핸들러
     */
    close() {
      this.$emit('close');
    },
    
    /**
     * 오버레이 클릭 핸들러 (배경 클릭 시 닫기)
     */
    handleOverlayClick(event) {
      if (event.target === event.currentTarget) {
        this.close();
      }
    }
  },
  
  template: `
    <div 
      v-if="visible"
      id="design-guide-modal"
      class="c-design-guide"
      @click="handleOverlayClick"
      :data-dev='{
        "role": "디자인 가이드 모달",
        "id": "design-guide-modal",
        "func": "Zinc-Dark Edition 디자인 시스템 문서를 풀스크린 모달로 표시",
        "goal": "개발자가 색상, Z-Index, 타이포그래피 등 디자인 규칙을 빠르게 참조",
        "state": {
          "visible": "모달 표시 여부 (Boolean)"
        },
        "path": "frontend/js/components/DesignGuide.js",
        "py": "",
        "js": "close(), handleOverlayClick(event)"
      }'
    >
      <!-- 오버레이 배경 -->
      <div 
        id="design-guide-overlay"
        class="c-design-guide__overlay"
        :data-dev='{
          "role": "모달 오버레이 배경",
          "id": "design-guide-overlay",
          "func": "모달 뒤 어두운 배경 레이어 (클릭 시 모달 닫기)",
          "goal": "모달 포커스 강조 및 배경 클릭으로 닫기 기능 제공",
          "state": {},
          "path": "frontend/js/components/DesignGuide.js → overlay",
          "py": "",
          "js": "handleOverlayClick(event)"
        }'
      ></div>

      <!-- 모달 컨텐츠 -->
      <div 
        id="design-guide-content"
        class="c-design-guide__content"
        @click.stop
        :data-dev='{
          "role": "디자인 가이드 컨텐츠 컨테이너",
          "id": "design-guide-content",
          "func": "디자인 시스템 문서 내용을 스크롤 가능한 영역에 표시",
          "goal": "사용자가 디자인 가이드 전체 내용을 읽을 수 있도록 함",
          "state": {},
          "path": "frontend/js/components/DesignGuide.js → content",
          "py": "",
          "js": ""
        }'
      >
        <!-- 헤더 (제목 + 닫기 버튼) -->
        <div 
          id="design-guide-header"
          class="c-design-guide__header"
          :data-dev='{
            "role": "모달 헤더 (제목 + 닫기 버튼)",
            "id": "design-guide-header",
            "func": "모달 상단에 제목과 닫기 버튼 표시",
            "goal": "사용자가 현재 보고 있는 문서가 디자인 가이드임을 인지하고 닫기 가능",
            "state": {},
            "path": "frontend/js/components/DesignGuide.js → header",
            "py": "",
            "js": "close()"
          }'
        >
          <h2 
            id="design-guide-title"
            class="c-design-guide__title"
            :data-dev='{
              "role": "모달 제목",
              "id": "design-guide-title",
              "func": "디자인 가이드 문서 제목 표시",
              "goal": "사용자가 현재 문서명을 확인",
              "state": {},
              "path": "frontend/js/components/DesignGuide.js → title",
              "py": "",
              "js": ""
            }'
          >
            WAI Studio Design Guide (Zinc-Dark Edition)
          </h2>
          
          <button 
            id="design-guide-close"
            class="c-design-guide__close"
            data-js-close
            @click="close"
            title="Close"
            :data-dev='{
              "role": "모달 닫기 버튼",
              "id": "design-guide-close",
              "func": "클릭 시 디자인 가이드 모달 닫기",
              "goal": "사용자가 모달을 즉시 닫을 수 있도록 함",
              "state": {},
              "path": "frontend/js/components/DesignGuide.js → close button",
              "py": "",
              "js": "close()"
            }'
          >
            ✕
          </button>
        </div>

        <!-- 본문 (디자인 시스템 문서) -->
        <div 
          id="design-guide-body"
          class="c-design-guide__body"
          :data-dev='{
            "role": "디자인 가이드 본문",
            "id": "design-guide-body",
            "func": "색상, Z-Index, 타이포그래피 등 디자인 시스템 규칙 표시",
            "goal": "개발자가 프로젝트 디자인 규칙을 참조하며 작업",
            "state": {},
            "path": "frontend/js/components/DesignGuide.js → body",
            "py": "",
            "js": ""
          }'
        >
          <!-- 색상 시스템 -->
          <section 
            id="design-guide-section-colors"
            class="c-design-guide__section"
            :data-dev='{
              "role": "색상 시스템 섹션",
              "id": "design-guide-section-colors",
              "func": "Zinc-Dark 테마의 배경, 텍스트, 액센트 색상 표시",
              "goal": "개발자가 일관된 색상을 사용하도록 색상 팔레트 제공",
              "state": {},
              "path": "frontend/js/components/DesignGuide.js → colors section",
              "py": "",
              "js": ""
            }'
          >
            <h3 class="c-design-guide__section-title">🎨 Color System (Zinc-Dark)</h3>
            
            <div class="c-design-guide__color-grid">
              <!-- Background Colors -->
              <div class="c-design-guide__color-group">
                <h4>Background</h4>
                <div class="c-design-guide__color-item">
                  <div class="c-design-guide__color-sample" style="background: #09090b;"></div>
                  <code>#09090b</code> <span>Base (zinc-950)</span>
                </div>
                <div class="c-design-guide__color-item">
                  <div class="c-design-guide__color-sample" style="background: #18181b;"></div>
                  <code>#18181b</code> <span>Panel (zinc-900)</span>
                </div>
                <div class="c-design-guide__color-item">
                  <div class="c-design-guide__color-sample" style="background: #27272a;"></div>
                  <code>#27272a</code> <span>Hover (zinc-800)</span>
                </div>
              </div>

              <!-- Text Colors -->
              <div class="c-design-guide__color-group">
                <h4>Text</h4>
                <div class="c-design-guide__color-item">
                  <div class="c-design-guide__color-sample" style="background: #f4f4f5;"></div>
                  <code>#f4f4f5</code> <span>Primary (zinc-100)</span>
                </div>
                <div class="c-design-guide__color-item">
                  <div class="c-design-guide__color-sample" style="background: #a1a1aa;"></div>
                  <code>#a1a1aa</code> <span>Secondary (zinc-400)</span>
                </div>
                <div class="c-design-guide__color-item">
                  <div class="c-design-guide__color-sample" style="background: #71717a;"></div>
                  <code>#71717a</code> <span>Disabled (zinc-500)</span>
                </div>
              </div>

              <!-- Accent Colors -->
              <div class="c-design-guide__color-group">
                <h4>Accent</h4>
                <div class="c-design-guide__color-item">
                  <div class="c-design-guide__color-sample" style="background: #3b82f6;"></div>
                  <code>#3b82f6</code> <span>Primary (blue-500)</span>
                </div>
                <div class="c-design-guide__color-item">
                  <div class="c-design-guide__color-sample" style="background: #ef4444;"></div>
                  <code>#ef4444</code> <span>Danger (red-500)</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Z-Index 시스템 -->
          <section 
            id="design-guide-section-zindex"
            class="c-design-guide__section"
            :data-dev='{
              "role": "Z-Index 계층 시스템 섹션",
              "id": "design-guide-section-zindex",
              "func": "UI 요소별 Z-Index 값 표시 (Base → Content → Toolbar → Header → Menu → Inspector)",
              "goal": "개발자가 레이어 겹침 순서를 일관되게 관리",
              "state": {},
              "path": "frontend/js/components/DesignGuide.js → zindex section",
              "py": "",
              "js": ""
            }'
          >
            <h3 class="c-design-guide__section-title">📐 Z-Index System</h3>
            
            <table class="c-design-guide__table">
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>Z-Index</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>Base</code></td>
                  <td><code>10</code></td>
                  <td>Canvas, Timeline 등 기본 컨텐츠</td>
                </tr>
                <tr>
                  <td><code>Content</code></td>
                  <td><code>20</code></td>
                  <td>레이어, 클립 등 상호작용 요소</td>
                </tr>
                <tr>
                  <td><code>Sticky</code></td>
                  <td><code>40</code></td>
                  <td>Playhead, 스크롤 고정 요소</td>
                </tr>
                <tr>
                  <td><code>Toolbar</code></td>
                  <td><code>100</code></td>
                  <td>PreviewToolbar, 도구 모음</td>
                </tr>
                <tr>
                  <td><code>Header</code></td>
                  <td><code>200000</code></td>
                  <td>상단 헤더 (항상 최상단)</td>
                </tr>
                <tr>
                  <td><code>Menu</code></td>
                  <td><code>200001</code></td>
                  <td>드롭다운 메뉴</td>
                </tr>
                <tr>
                  <td><code>Inspector</code></td>
                  <td><code>300000</code></td>
                  <td>DATA DEV Inspector (최상위)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Typography -->
          <section 
            id="design-guide-section-typography"
            class="c-design-guide__section"
            :data-dev='{
              "role": "타이포그래피 시스템 섹션",
              "id": "design-guide-section-typography",
              "func": "폰트 패밀리, 크기, 두께 규칙 표시",
              "goal": "개발자가 일관된 텍스트 스타일 적용",
              "state": {},
              "path": "frontend/js/components/DesignGuide.js → typography section",
              "py": "",
              "js": ""
            }'
          >
            <h3 class="c-design-guide__section-title">✍️ Typography</h3>
            
            <ul class="c-design-guide__list">
              <li><strong>Font Family:</strong> <code>Inter, system-ui, sans-serif</code></li>
              <li><strong>Base Size:</strong> <code>14px</code></li>
              <li><strong>Headings:</strong> <code>16px (semibold)</code></li>
              <li><strong>Body:</strong> <code>14px (normal)</code></li>
              <li><strong>Small:</strong> <code>12px (normal)</code></li>
            </ul>
          </section>

          <!-- Spacing -->
          <section 
            id="design-guide-section-spacing"
            class="c-design-guide__section"
            :data-dev='{
              "role": "간격(Spacing) 시스템 섹션",
              "id": "design-guide-section-spacing",
              "func": "여백 및 패딩 규칙 표시 (4px 단위)",
              "goal": "개발자가 일관된 여백을 유지",
              "state": {},
              "path": "frontend/js/components/DesignGuide.js → spacing section",
              "py": "",
              "js": ""
            }'
          >
            <h3 class="c-design-guide__section-title">📏 Spacing</h3>
            
            <ul class="c-design-guide__list">
              <li><code>4px</code> - Tight (버튼 내부, 아이콘 간격)</li>
              <li><code>8px</code> - Normal (컴포넌트 내부 여백)</li>
              <li><code>16px</code> - Comfortable (섹션 간 여백)</li>
              <li><code>24px</code> - Loose (패널 간 여백)</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  `
};

// CommonJS 모듈로 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DesignGuide;
}
