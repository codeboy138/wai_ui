/**
 * ==========================================
 * ProjectModal.js - 프로젝트 관리 모달
 * 
 * 역할: 프로젝트 파일 관리 모달창
 * 경로: frontend/js/components/ProjectModal.js
 * ==========================================
 */

export default {
    name: 'ProjectModal',
    
    template: \`
        <div class="c-modal-overlay" 
             @click="$emit('close')"
             title="모달 닫기">
            <div class="c-modal-window" 
                 @click.stop>
                <div class="c-modal-window__header">
                    <span class="c-modal-window__title">프로젝트 관리</span>
                    <button class="c-modal-window__close-btn"
                            title="닫기"
                            @click="$emit('close')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="c-modal-window__body">
                    <div class="c-modal-window__sidebar" title="폴더 목록">Folders...</div>
                    <div class="c-modal-window__content" title="파일 목록">Files...</div>
                </div>
            </div>
        </div>
    \`
};
