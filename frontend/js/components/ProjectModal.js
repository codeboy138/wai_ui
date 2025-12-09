/**
 * ==========================================
 * ProjectModal.js
 * 
 * 역할: 프로젝트 생성/열기 모달
 * 경로: frontend/js/components/ProjectModal.js
 * ==========================================
 */

const ProjectModal = {
  name: 'ProjectModal',
  
  props: {
    // 모달 표시 여부
    visible: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      // 새 프로젝트 폼 데이터
      newProject: {
        name: '',
        ratio: '16:9',
        quality: 'FHD'
      },
      // 최근 프로젝트 목록
      recentProjects: []
    };
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
    },
    
    /**
     * 새 프로젝트 생성 핸들러
     */
    createNewProject() {
      if (!this.newProject.name.trim()) {
        alert('Please enter a project name.');
        return;
      }
      
      console.log('[ProjectModal] Create New Project:', this.newProject);
      
      // TODO: 백엔드 IPC 호출 - 프로젝트 생성
      // window.electronAPI?.createProject(this.newProject);
      
      // Store 초기화
      this.$root.store.project.name = this.newProject.name;
      this.$root.store.canvas.ratio = this.newProject.ratio;
      this.$root.store.canvas.quality = this.newProject.quality;
      
      this.close();
    },
    
    /**
     * 기존 프로젝트 열기 핸들러
     * @param {String} projectPath - 프로젝트 파일 경로
     */
    openProject(projectPath) {
      console.log('[ProjectModal] Open Project:', projectPath);
      
      // TODO: 백엔드 IPC 호출 - 프로젝트 로드
      // window.electronAPI?.openProject(projectPath);
      
      this.close();
    },
    
    /**
     * 프로젝트 찾아보기 (파일 선택 다이얼로그)
     */
    browseProject() {
      console.log('[ProjectModal] Browse Project');
      
      // TODO: 백엔드 IPC 호출 - 파일 다이얼로그
      // window.electronAPI?.browseProject();
    }
  },
  
  mounted() {
    // TODO: 최근 프로젝트 목록 로드
    // this.recentProjects = await window.electronAPI?.getRecentProjects();
  },
  
  template: `
    <div 
      v-if="visible"
      id="project-modal-container"
      class="c-project-modal"
      @click="handleOverlayClick"
      :data-dev='{
        "role": "프로젝트 생성/열기 모달",
        "id": "project-modal-container",
        "func": "새 프로젝트 생성 또는 기존 프로젝트 열기 UI 제공",
        "goal": "사용자가 프로젝트를 시작하거나 기존 작업을 이어서 진행",
        "state": {
          "visible": "모달 표시 여부 (Boolean)",
          "newProject": "새 프로젝트 폼 데이터 { name, ratio, quality }",
          "recentProjects": "최근 프로젝트 목록 배열"
        },
        "path": "frontend/js/components/ProjectModal.js",
        "py": "window.electronAPI.createProject(data), window.electronAPI.openProject(path), window.electronAPI.browseProject()",
        "js": "createNewProject(), openProject(path), browseProject(), close()"
      }'
    >
      <!-- 오버레이 배경 -->
      <div 
        id="project-modal-overlay"
        class="c-project-modal__overlay"
        :data-dev='{
          "role": "모달 오버레이 배경",
          "id": "project-modal-overlay",
          "func": "모달 뒤 어두운 배경 레이어 (클릭 시 모달 닫기)",
          "goal": "모달 포커스 강조 및 배경 클릭으로 닫기 기능 제공",
          "state": {},
          "path": "frontend/js/components/ProjectModal.js → overlay",
          "py": "",
          "js": "handleOverlayClick(event)"
        }'
      ></div>

      <!-- 모달 컨텐츠 -->
      <div 
        id="project-modal-content"
        class="c-project-modal__content"
        @click.stop
        :data-dev='{
          "role": "프로젝트 모달 컨텐츠 컨테이너",
          "id": "project-modal-content",
          "func": "프로젝트 생성/열기 폼 및 최근 프로젝트 목록 표시",
          "goal": "사용자가 프로젝트 관련 작업을 수행할 수 있도록 UI 제공",
          "state": {},
          "path": "frontend/js/components/ProjectModal.js → content",
          "py": "",
          "js": ""
        }'
      >
        <!-- 헤더 (제목 + 닫기 버튼) -->
        <div 
          id="project-modal-header"
          class="c-project-modal__header"
          :data-dev='{
            "role": "모달 헤더 (제목 + 닫기 버튼)",
            "id": "project-modal-header",
            "func": "모달 상단에 제목과 닫기 버튼 표시",
            "goal": "사용자가 현재 모달의 용도를 인지하고 닫기 가능",
            "state": {},
            "path": "frontend/js/components/ProjectModal.js → header",
            "py": "",
            "js": "close()"
          }'
        >
          <h2 
            id="project-modal-title"
            class="c-project-modal__title"
            :data-dev='{
              "role": "모달 제목",
              "id": "project-modal-title",
              "func": "프로젝트 모달 제목 표시",
              "goal": "사용자가 현재 화면의 용도를 확인",
              "state": {},
              "path": "frontend/js/components/ProjectModal.js → title",
              "py": "",
              "js": ""
            }'
          >
            Project
          </h2>
          
          <button 
            id="project-modal-close"
            class="c-project-modal__close"
            data-js-close
            @click="close"
            title="Close"
            :data-dev='{
              "role": "모달 닫기 버튼",
              "id": "project-modal-close",
              "func": "클릭 시 프로젝트 모달 닫기",
              "goal": "사용자가 모달을 즉시 닫을 수 있도록 함",
              "state": {},
              "path": "frontend/js/components/ProjectModal.js → close button",
              "py": "",
              "js": "close()"
            }'
          >
            ✕
          </button>
        </div>

        <!-- 본문 -->
        <div 
          id="project-modal-body"
          class="c-project-modal__body"
          :data-dev='{
            "role": "프로젝트 모달 본문",
            "id": "project-modal-body",
            "func": "새 프로젝트 생성 폼 및 최근 프로젝트 목록 표시",
            "goal": "사용자가 프로젝트를 생성하거나 기존 프로젝트를 열 수 있도록 함",
            "state": {},
            "path": "frontend/js/components/ProjectModal.js → body",
            "py": "",
            "js": ""
          }'
        >
          <!-- 새 프로젝트 섹션 -->
          <section 
            id="project-modal-section-new"
            class="c-project-modal__section"
            :data-dev='{
              "role": "새 프로젝트 생성 섹션",
              "id": "project-modal-section-new",
              "func": "프로젝트명, Ratio, Quality 입력 폼 제공",
              "goal": "사용자가 새 프로젝트 설정을 입력하고 생성",
              "state": { "newProject": newProject },
              "path": "frontend/js/components/ProjectModal.js → new project section",
              "py": "window.electronAPI.createProject(newProject)",
              "js": "createNewProject()"
            }'
          >
            <h3 
              id="project-modal-new-title"
              class="c-project-modal__section-title"
              :data-dev='{
                "role": "새 프로젝트 섹션 제목",
                "id": "project-modal-new-title",
                "func": "섹션 용도를 나타내는 제목 표시",
                "goal": "사용자가 새 프로젝트 생성 섹션임을 인식",
                "state": {},
                "path": "frontend/js/components/ProjectModal.js → new project title",
                "py": "",
                "js": ""
              }'
            >
              New Project
            </h3>

            <!-- 프로젝트명 입력 -->
            <div 
              id="project-modal-field-name"
              class="c-project-modal__field"
              :data-dev='{
                "role": "프로젝트명 입력 필드",
                "id": "project-modal-field-name",
                "func": "프로젝트 이름 입력 UI",
                "goal": "사용자가 프로젝트명을 입력",
                "state": { "value": newProject.name },
                "path": "frontend/js/components/ProjectModal.js → name field",
                "py": "",
                "js": "v-model newProject.name"
              }'
            >
              <label 
                for="input-project-name"
                id="label-project-name"
                class="c-project-modal__label"
              >
                Project Name:
              </label>
              <input 
                id="input-project-name"
                type="text"
                class="c-project-modal__input"
                v-model="newProject.name"
                placeholder="My Project"
              />
            </div>

            <!-- Ratio 선택 -->
            <div 
              id="project-modal-field-ratio"
              class="c-project-modal__field"
              :data-dev='{
                "role": "Ratio 선택 필드",
                "id": "project-modal-field-ratio",
                "func": "프로젝트 화면 비율 선택 UI",
                "goal": "사용자가 프로젝트 화면 비율 설정",
                "state": { "value": newProject.ratio },
                "path": "frontend/js/components/ProjectModal.js → ratio field",
                "py": "",
                "js": "v-model newProject.ratio"
              }'
            >
              <label 
                for="select-project-ratio"
                id="label-project-ratio"
                class="c-project-modal__label"
              >
                Ratio:
              </label>
              <select 
                id="select-project-ratio"
                class="c-project-modal__select"
                v-model="newProject.ratio"
              >
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
                <option value="21:9">21:9</option>
              </select>
            </div>

            <!-- Quality 선택 -->
            <div 
              id="project-modal-field-quality"
              class="c-project-modal__field"
              :data-dev='{
                "role": "Quality 선택 필드",
                "id": "project-modal-field-quality",
                "func": "프로젝트 영상 품질 선택 UI",
                "goal": "사용자가 프로젝트 영상 품질 설정",
                "state": { "value": newProject.quality },
                "path": "frontend/js/components/ProjectModal.js → quality field",
                "py": "",
                "js": "v-model newProject.quality"
              }'
            >
              <label 
                for="select-project-quality"
                id="label-project-quality"
                class="c-project-modal__label"
              >
                Quality:
              </label>
              <select 
                id="select-project-quality"
                class="c-project-modal__select"
                v-model="newProject.quality"
              >
                <option value="4K">4K</option>
                <option value="FHD">FHD</option>
                <option value="HD">HD</option>
                <option value="SD">SD</option>
              </select>
            </div>

            <!-- 생성 버튼 -->
            <button 
              id="btn-new-project"
              class="c-project-modal__btn c-project-modal__btn--primary"
              data-js-new
              @click="createNewProject"
              title="Create New Project"
              :data-dev='{
                "role": "새 프로젝트 생성 버튼",
                "id": "btn-new-project",
                "func": "입력된 정보로 새 프로젝트 생성 (Python 백엔드 호출)",
                "goal": "사용자가 새 프로젝트를 시작",
                "state": {},
                "path": "frontend/js/components/ProjectModal.js → create button",
                "py": "window.electronAPI.createProject(newProject)",
                "js": "createNewProject()"
              }'
            >
              Create Project
            </button>
          </section>

          <!-- 기존 프로젝트 열기 섹션 -->
          <section 
            id="project-modal-section-open"
            class="c-project-modal__section"
            :data-dev='{
              "role": "기존 프로젝트 열기 섹션",
              "id": "project-modal-section-open",
              "func": "최근 프로젝트 목록 및 파일 찾아보기 UI 제공",
              "goal": "사용자가 기존 프로젝트를 선택하여 열기",
              "state": { "recentProjects": recentProjects },
              "path": "frontend/js/components/ProjectModal.js → open project section",
              "py": "window.electronAPI.openProject(path), window.electronAPI.browseProject()",
              "js": "openProject(path), browseProject()"
            }'
          >
            <h3 
              id="project-modal-open-title"
              class="c-project-modal__section-title"
              :data-dev='{
                "role": "기존 프로젝트 섹션 제목",
                "id": "project-modal-open-title",
                "func": "섹션 용도를 나타내는 제목 표시",
                "goal": "사용자가 기존 프로젝트 열기 섹션임을 인식",
                "state": {},
                "path": "frontend/js/components/ProjectModal.js → open project title",
                "py": "",
                "js": ""
              }'
            >
              Open Project
            </h3>

            <!-- 최근 프로젝트 목록 -->
            <div 
              v-if="recentProjects.length > 0"
              id="project-modal-recent-list"
              class="c-project-modal__recent-list"
              :data-dev='{
                "role": "최근 프로젝트 목록",
                "id": "project-modal-recent-list",
                "func": "최근 열었던 프로젝트 목록 표시",
                "goal": "사용자가 빠르게 최근 프로젝트를 선택하여 열기",
                "state": { "recentProjects": recentProjects },
                "path": "frontend/js/components/ProjectModal.js → recent list",
                "py": "window.electronAPI.openProject(path)",
                "js": "openProject(path)"
              }'
            >
              <div
                v-for="(project, index) in recentProjects"
                :key="index"
                :id="'recent-project-' + index"
                class="c-project-modal__recent-item"
                @click="openProject(project.path)"
              >
                {{ project.name }}
              </div>
            </div>

            <!-- 프로젝트 찾아보기 버튼 -->
            <button 
              id="btn-open-project"
              class="c-project-modal__btn c-project-modal__btn--secondary"
              data-js-open
              @click="browseProject"
              title="Browse Project"
              :data-dev='{
                "role": "프로젝트 찾아보기 버튼",
                "id": "btn-open-project",
                "func": "파일 선택 다이얼로그 호출하여 프로젝트 파일 선택 (Python 백엔드)",
                "goal": "사용자가 파일 탐색기에서 프로젝트 파일을 선택",
                "state": {},
                "path": "frontend/js/components/ProjectModal.js → browse button",
                "py": "window.electronAPI.browseProject()",
                "js": "browseProject()"
              }'
            >
              Browse...
            </button>
          </section>
        </div>
      </div>
    </div>
  `
};

export default ProjectModal;
