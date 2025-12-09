/**
 * [DATA-DEV: ProjectModal]
 * - 역할: 프로젝트 파일 관리 모달
 * - 고유ID: project-modal
 * - 기능: 프로젝트 열기/저장/내보내기
 * - 로직: isOpen prop 제어, 버튼 클릭 시 Python 호출
 * - 데이터: isOpen (boolean)
 * - 경로: frontend/js/components/ProjectModal.js
 * - 명령: firePython('open_project'), firePython('save_project'), firePython('export_project')
 */

export default {
  name: 'ProjectModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  template: '<div v-if="isOpen" id="project-modal-overlay" class="c-project-modal__overlay" data-action="js:modalOverlay" title="프로젝트 모달" @click="close">' +
            '<div class="c-project-modal" @click.stop>' +
            '<h2 class="c-project-modal__title">프로젝트 관리</h2>' +
            '<button id="project-modal-open-btn" class="c-project-modal__button" data-action="py:open_project" title="프로젝트 열기" @click="openProject">프로젝트 열기</button>' +
            '<button id="project-modal-save-btn" class="c-project-modal__button" data-action="py:save_project" title="프로젝트 저장" @click="saveProject">프로젝트 저장</button>' +
            '<button id="project-modal-export-btn" class="c-project-modal__button" data-action="py:export_project" title="비디오 내보내기" @click="exportProject">비디오 내보내기</button>' +
            '<button id="project-modal-close-btn" class="c-project-modal__close-btn" data-action="js:closeModal" title="닫기" @click="close">닫기</button>' +
            '</div>' +
            '</div>',
  
  methods: {
    close() {
      this.$emit('close');
      console.log('[ProjectModal] 모달 닫기');
    },
    
    openProject() {
      console.log('[ProjectModal] 프로젝트 열기');
      this.$root.firePython('open_project');
      this.close();
    },
    
    saveProject() {
      console.log('[ProjectModal] 프로젝트 저장');
      this.$root.firePython('save_project');
      this.close();
    },
    
    exportProject() {
      console.log('[ProjectModal] 비디오 내보내기');
      this.$root.firePython('export_project');
      this.close();
    }
  }
};
