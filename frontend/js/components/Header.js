/**
 * ==========================================
 * Header.js
 * 
 * 역할: 애플리케이션 상단 헤더 (로고, 메뉴, 프로젝트 관리)
 * 경로: frontend/js/components/Header.js
 * ==========================================
 */

const Header = {
  name: 'Header',
  
  data() {
    return {
      // 프로젝트 모달 표시 여부
      showProjectModal: false,
      // 디자인 가이드 모달 표시 여부
      showDesignGuide: false
    };
  },
  
  computed: {
    /**
     * 현재 프로젝트 이름
     * @returns {String} 프로젝트명 또는 기본값
     */
    projectName() {
      return this.$root.store.project.name || 'Untitled Project';
    }
  },
  
  methods: {
    /**
     * 새 프로젝트 생성 핸들러
     */
    newProject() {
      console.log('[Header] New Project');
      this.showProjectModal = true;
    },
    
    /**
     * 프로젝트 열기 핸들러
     */
    openProject() {
      console.log('[Header] Open Project');
      this.showProjectModal = true;
    },
    
    /**
     * 프로젝트 저장 핸들러
     */
    saveProject() {
      console.log('[Header] Save Project:', this.projectName);
      
      // TODO: 백엔드 IPC 호출 - 프로젝트 저장
      // window.electronAPI?.saveProject(this.$root.store);
    },
    
    /**
     * 프로젝트 내보내기 핸들러
     */
    exportProject() {
      console.log('[Header] Export Project');
      
      // TODO: 백엔드 IPC 호출 - 프로젝트 렌더링 및 내보내기
      // window.electronAPI?.exportProject(this.$root.store);
    },
    
    /**
     * 디자인 가이드 열기 핸들러
     */
    openDesignGuide() {
      console.log('[Header] Open Design Guide');
      this.showDesignGuide = true;
    },
    
    /**
     * 프로젝트 모달 닫기 핸들러
     */
    closeProjectModal() {
      this.showProjectModal = false;
    },
    
    /**
     * 디자인 가이드 모달 닫기 핸들러
     */
    closeDesignGuide() {
      this.showDesignGuide = false;
    }
  },
  
  template: `
    <header 
      id="app-header"
      class="c-header"
      data-dev='{
        "role": "애플리케이션 상단 헤더",
        "id": "app-header",
        "func": "로고, 프로젝트명, 메뉴(New, Open, Save, Export), 디자인 가이드 버튼 제공",
        "goal": "사용자가 프로젝트를 관리하고 주요 기능에 빠르게 접근",
        "state": {
          "projectName": "현재 프로젝트 이름",
          "showProjectModal": "프로젝트 모달 표시 여부",
          "showDesignGuide": "디자인 가이드 모달 표시 여부"
        },
        "path": "frontend/js/components/Header.js",
        "py": "window.electronAPI.saveProject(data), window.electronAPI.exportProject(data)",
        "js": "newProject(), openProject(), saveProject(), exportProject(), openDesignGuide()"
      }'
    >
      <!-- 로고 영역 -->
      <div 
        id="header-logo"
        class="c-header__logo"
        data-dev='{
          "role": "애플리케이션 로고 및 프로젝트명",
          "id": "header-logo",
          "func": "WAI Studio 로고와 현재 프로젝트명 표시",
          "goal": "사용자가 애플리케이션과 현재 프로젝트를 인식",
          "state": { "projectName": projectName },
          "path": "frontend/js/components/Header.js → logo",
          "py": "",
          "js": ""
        }'
      >
        <h1 
          id="app-title"
          class="c-header__title"
          :data-dev='{
            "role": "애플리케이션 제목",
            "id": "app-title",
            "func": "WAI Studio 로고 텍스트 표시",
            "goal": "사용자가 애플리케이션명을 확인",
            "state": {},
            "path": "frontend/js/components/Header.js → title",
            "py": "",
            "js": ""
          }'
        >
          WAI Studio
        </h1>
        
        <span 
          id="project-name-display"
          class="c-header__project-name"
          :data-dev='{
            "role": "현재 프로젝트명 표시",
            "id": "project-name-display",
            "func": "현재 열린 프로젝트의 이름 표시",
            "goal": "사용자가 작업 중인 프로젝트를 확인",
            "state": { "projectName": projectName },
            "path": "frontend/js/components/Header.js → project name",
            "py": "",
            "js": ""
          }'
        >
          {{ projectName }}
        </span>
      </div>

      <!-- 메뉴 영역 -->
      <nav 
        id="header-menu"
        class="c-header__menu"
        data-dev='{
          "role": "헤더 메뉴 (프로젝트 관리 버튼)",
          "id": "header-menu",
          "func": "New, Open, Save, Export 버튼 그룹",
          "goal": "사용자가 프로젝트 관련 주요 작업을 수행",
          "state": {},
          "path": "frontend/js/components/Header.js → menu",
          "py": "window.electronAPI.saveProject(data), window.electronAPI.exportProject(data)",
          "js": "newProject(), openProject(), saveProject(), exportProject()"
        }'
      >
        <button 
          id="btn-new"
          class="c-header__btn"
          data-js-new
          @click="newProject"
          title="New Project"
          :data-dev='{
            "role": "새 프로젝트 버튼",
            "id": "btn-new",
            "func": "클릭 시 프로젝트 생성 모달 열기",
            "goal": "사용자가 새 프로젝트를 시작",
            "state": {},
            "path": "frontend/js/components/Header.js → new button",
            "py": "",
            "js": "newProject()"
          }'
        >
          New
        </button>

        <button 
          id="btn-open"
          class="c-header__btn"
          data-js-open
          @click="openProject"
          title="Open Project"
          :data-dev='{
            "role": "프로젝트 열기 버튼",
            "id": "btn-open",
            "func": "클릭 시 프로젝트 열기 모달 표시",
            "goal": "사용자가 기존 프로젝트를 열기",
            "state": {},
            "path": "frontend/js/components/Header.js → open button",
            "py": "",
            "js": "openProject()"
          }'
        >
          Open
        </button>

        <button 
          id="btn-save"
          class="c-header__btn"
          data-js-save
          @click="saveProject"
          title="Save Project"
          :data-dev='{
            "role": "프로젝트 저장 버튼",
            "id": "btn-save",
            "func": "클릭 시 현재 프로젝트를 파일로 저장 (Python 백엔드)",
            "goal": "사용자가 작업 내용을 저장",
            "state": {},
            "path": "frontend/js/components/Header.js → save button",
            "py": "window.electronAPI.saveProject(store)",
            "js": "saveProject()"
          }'
        >
          Save
        </button>

        <button 
          id="btn-export"
          class="c-header__btn c-header__btn--primary"
          data-js-export
          @click="exportProject"
          title="Export Project"
          :data-dev='{
            "role": "프로젝트 내보내기 버튼",
            "id": "btn-export",
            "func": "클릭 시 프로젝트를 영상으로 렌더링 및 내보내기 (Python 백엔드)",
            "goal": "사용자가 최종 결과물을 영상 파일로 생성",
            "state": {},
            "path": "frontend/js/components/Header.js → export button",
            "py": "window.electronAPI.exportProject(store)",
            "js": "exportProject()"
          }'
        >
          Export
        </button>
      </nav>

      <!-- 우측 유틸리티 영역 -->
      <div 
        id="header-utility"
        class="c-header__utility"
        data-dev='{
          "role": "헤더 우측 유틸리티 영역",
          "id": "header-utility",
          "func": "디자인 가이드 등 부가 기능 버튼",
          "goal": "사용자가 디자인 시스템 문서 등에 접근",
          "state": {},
          "path": "frontend/js/components/Header.js → utility",
          "py": "",
          "js": "openDesignGuide()"
        }'
      >
        <button 
          id="btn-design-guide"
          class="c-header__btn c-header__btn--icon"
          data-js-design-guide
          @click="openDesignGuide"
          title="Design Guide"
          :data-dev='{
            "role": "디자인 가이드 버튼",
            "id": "btn-design-guide",
            "func": "클릭 시 디자인 가이드 모달 열기",
            "goal": "개발자가 디자인 시스템 문서를 참조",
            "state": {},
            "path": "frontend/js/components/Header.js → design guide button",
            "py": "",
            "js": "openDesignGuide()"
          }'
        >
          📘
        </button>
      </div>

      <!-- 프로젝트 모달 -->
      <ProjectModal 
        :visible="showProjectModal"
        @close="closeProjectModal"
      />

      <!-- 디자인 가이드 모달 -->
      <DesignGuide 
        :visible="showDesignGuide"
        @close="closeDesignGuide"
      />
    </header>
  `
};

// CommonJS 모듈로 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Header;
}
