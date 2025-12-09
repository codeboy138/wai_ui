/**
 * ==========================================
 * Header.js
 * 
 * 역할: 앱 메인 헤더 (New, Open, Save, Export, Design Guide)
 * 경로: frontend/js/components/Header.js
 * ==========================================
 */

export default {
  name: 'Header',
  
  methods: {
    /**
     * 새 프로젝트 생성 모달 열기
     */
    handleNew() {
      this.$store.showProjectModal = true;
      console.log('New Project 모달 열기');
    },
    
    /**
     * 프로젝트 열기 모달 열기
     */
    handleOpen() {
      this.$store.showProjectModal = true;
      console.log('Open Project 모달 열기');
    },
    
    /**
     * 현재 프로젝트 저장
     */
    handleSave() {
      console.log('프로젝트 저장:', this.$store.projectName);
      // TODO: 실제 저장 로직 구현 (파일 시스템 API 또는 IPC 통신)
    },
    
    /**
     * 프로젝트 내보내기 (비디오 렌더링)
     */
    handleExport() {
      console.log('프로젝트 내보내기 (렌더링)');
      // TODO: 백엔드 렌더링 API 호출
    },
    
    /**
     * 디자인 가이드 모달 열기
     */
    handleDesignGuide() {
      this.$store.showDesignGuide = true;
      console.log('Design Guide 모달 열기');
    }
  },
  
  template: `
    <header 
      id="app-header"
      class="c-header"
      :data-dev='{
        "role": "앱 메인 헤더",
        "id": "app-header",
        "func": "프로젝트 생성/열기/저장/내보내기 및 디자인 가이드 액션 제공",
        "goal": "사용자가 프로젝트 전반을 관리하고 주요 기능에 빠르게 접근",
        "state": {
          "projectName": "$store.projectName"
        },
        "path": "frontend/js/components/Header.js",
        "py": "",
        "js": "handleNew(), handleOpen(), handleSave(), handleExport(), handleDesignGuide()"
      }'
    >
      <!-- 로고 및 프로젝트 제목 -->
      <div 
        id="header-logo"
        class="c-header__logo"
        :data-dev='{
          "role": "헤더 로고 및 프로젝트 제목 영역",
          "id": "header-logo",
          "func": "앱 이름과 현재 프로젝트 이름 표시",
          "goal": "사용자가 앱 브랜드와 현재 작업 중인 프로젝트를 인식",
          "state": {
            "appName": "WAI Studio",
            "projectName": "$store.projectName || Untitled"
          },
          "path": "frontend/js/components/Header.js → logo",
          "py": "",
          "js": ""
        }'
      >
        <h1 class="c-header__title">WAI Studio</h1>
        <span class="c-header__project-name">{{ $store.projectName || 'Untitled Project' }}</span>
      </div>
      
      <!-- 액션 버튼 그룹 -->
      <div 
        id="header-actions"
        class="c-header__actions"
        :data-dev='{
          "role": "헤더 액션 버튼 그룹",
          "id": "header-actions",
          "func": "주요 프로젝트 액션 버튼들을 모아서 표시",
          "goal": "사용자가 프로젝트 관련 주요 기능을 한 곳에서 실행",
          "state": {},
          "path": "frontend/js/components/Header.js → actions",
          "py": "",
          "js": ""
        }'
      >
        <!-- New 버튼 -->
        <button
          id="btn-new"
          class="c-header__btn"
          :data-js-new="true"
          @click="handleNew"
          title="Create New Project"
          :data-dev='{
            "role": "새 프로젝트 생성 버튼",
            "id": "btn-new",
            "func": "클릭 시 새 프로젝트 생성 모달 열기",
            "goal": "사용자가 새로운 프로젝트를 시작",
            "state": {},
            "path": "frontend/js/components/Header.js → actions → new button",
            "py": "",
            "js": "handleNew()"
          }'
        >
          <i class="fas fa-plus"></i>
          <span>New</span>
        </button>
        
        <!-- Open 버튼 -->
        <button
          id="btn-open"
          class="c-header__btn"
          :data-js-open="true"
          @click="handleOpen"
          title="Open Existing Project"
          :data-dev='{
            "role": "프로젝트 열기 버튼",
            "id": "btn-open",
            "func": "클릭 시 기존 프로젝트 열기 모달 표시",
            "goal": "사용자가 저장된 프로젝트를 불러옴",
            "state": {},
            "path": "frontend/js/components/Header.js → actions → open button",
            "py": "",
            "js": "handleOpen()"
          }'
        >
          <i class="fas fa-folder-open"></i>
          <span>Open</span>
        </button>
        
        <!-- Save 버튼 -->
        <button
          id="btn-save"
          class="c-header__btn"
          :data-js-save="true"
          @click="handleSave"
          title="Save Project"
          :data-dev='{
            "role": "프로젝트 저장 버튼",
            "id": "btn-save",
            "func": "클릭 시 현재 프로젝트 상태를 파일로 저장",
            "goal": "사용자가 작업 내용을 보존",
            "state": {
              "projectName": "$store.projectName"
            },
            "path": "frontend/js/components/Header.js → actions → save button",
            "py": "",
            "js": "handleSave()"
          }'
        >
          <i class="fas fa-save"></i>
          <span>Save</span>
        </button>
        
        <!-- Export 버튼 -->
        <button
          id="btn-export"
          class="c-header__btn c-header__btn--primary"
          :data-js-export="true"
          @click="handleExport"
          title="Export Video"
          :data-dev='{
            "role": "프로젝트 내보내기 버튼",
            "id": "btn-export",
            "func": "클릭 시 프로젝트를 비디오 파일로 렌더링 및 내보내기",
            "goal": "사용자가 완성된 영상을 파일로 저장",
            "state": {
              "ratio": "$store.selectedRatio",
              "quality": "$store.selectedQuality"
            },
            "path": "frontend/js/components/Header.js → actions → export button",
            "py": "backend/render.py (렌더링 API)",
            "js": "handleExport()"
          }'
        >
          <i class="fas fa-download"></i>
          <span>Export</span>
        </button>
        
        <!-- Design Guide 버튼 -->
        <button
          id="btn-design-guide"
          class="c-header__btn c-header__btn--secondary"
          :data-js-design-guide="true"
          @click="handleDesignGuide"
          title="Open Design Guide"
          :data-dev='{
            "role": "디자인 가이드 열기 버튼",
            "id": "btn-design-guide",
            "func": "클릭 시 디자인 가이드 모달 표시 (Color, Typography, Spacing 등)",
            "goal": "개발자가 디자인 시스템을 참고",
            "state": {},
            "path": "frontend/js/components/Header.js → actions → design guide button",
            "py": "",
            "js": "handleDesignGuide()"
          }'
        >
          <i class="fas fa-palette"></i>
          <span>Design Guide</span>
        </button>
      </div>
    </header>
  `
};
