/**
 * ==========================================
 * ProjectModal.js - 프로젝트 관리 모달
 * 
 * 역할: 프로젝트 파일 관리 모달창
 * 경로: frontend/js/components/ProjectModal.js
 * 
 * DATA-DEV:
 * 요소의 역할: 프로젝트 관리 모달 컴포넌트
 * 요소의 고유ID: component-project-modal
 * 요소의 기능 목적 정의: 프로젝트 파일 목록 표시 및 관리
 * 요소의 동작 로직 설명: 오버레이 클릭 또는 X 버튼 클릭 시 @close 이벤트 발생
 * 요소의 입출력 데이터 구조: 입력: 없음. 출력: @close 이벤트
 * 요소의 경로정보: frontend/js/components/ProjectModal.js
 * 요소의 수행해야 할 백엔드/JS 명령: JS: $emit('close')
 * ==========================================
 */

export default {
    name: 'ProjectModal',
    
    template: `
        <div class="modal-overlay" 
             @click="$emit('close')" 
             data-dev="요소의 역할: 프로젝트 모달 오버레이
요소의 고유ID: modal-project-overlay
요소의 기능 목적 정의: 모달 배경 및 외부 클릭 감지
요소의 동작 로직 설명: 오버레이 클릭 시 @close 이벤트 발생
요소의 입출력 데이터 구조: 입력: 클릭 이벤트. 출력: @close 이벤트
요소의 경로정보: frontend/js/components/ProjectModal.js#overlay
요소의 수행해야 할 백엔드/JS 명령: JS: $emit('close')">
            <div class="modal-window" 
                 @click.stop
                 data-dev="요소의 역할: 프로젝트 모달 창
요소의 고유ID: modal-project-window
요소의 기능 목적 정의: 프로젝트 파일 목록 표시
요소의 동작 로직 설명: 클릭 이벤트 전파 중단 (@click.stop)
요소의 입출력 데이터 구조: 입력: 없음. 출력: 프로젝트 리스트 렌더링
요소의 경로정보: frontend/js/components/ProjectModal.js#window
요소의 수행해야 할 백엔드/JS 명령: 없음">
                <div class="h-10 border-b border-ui-border flex items-center justify-between px-4 bg-bg-panel text-text-main font-bold">
                    프로젝트 관리
                    <button @click="$emit('close')" 
                            class="win-btn close"
                            data-dev="요소의 역할: 모달 닫기 버튼
요소의 고유ID: btn-modal-close
요소의 기능 목적 정의: 모달창 닫기
요소의 동작 로직 설명: 클릭 시 @close 이벤트 발생
요소의 입출력 데이터 구조: 입력: 클릭. 출력: @close 이벤트
요소의 경로정보: frontend/js/components/ProjectModal.js#btn-close
요소의 수행해야 할 백엔드/JS 명령: JS: $emit('close')">
                        <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                </div>
                <div class="flex-1 flex">
                    <div class="w-40 border-r border-ui-border p-2 bg-bg-hover">Folders...</div>
                    <div class="flex-1 bg-bg-dark p-4">Files...</div>
                </div>
            </div>
        </div>
    `
};
