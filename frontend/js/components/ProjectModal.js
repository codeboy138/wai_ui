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
        <div class="c-modal-overlay" 
             @click="$emit('close')"
             data-js="modal-overlay"
             title="모달 닫기"
             data-dev="요소의 역할: 프로젝트 모달 오버레이
요소의 고유ID: component-modal-overlay
요소의 기능 목적 정의: 모달 배경 및 외부 클릭 감지
요소의 동작 로직 설명: 오버레이 클릭 시 @close 이벤트 발생
요소의 입출력 데이터 구조: 입력: 클릭 이벤트. 출력: @close 이벤트
요소의 경로정보: frontend/js/components/ProjectModal.js#overlay
요소의 수행해야 할 백엔드/JS 명령: JS: $emit('close')">
            <div class="c-modal-window" 
                 @click.stop
                 data-js="modal-window"
                 data-dev="요소의 역할: 프로젝트 모달 창
요소의 고유ID: component-modal-window
요소의 기능 목적 정의: 프로젝트 파일 목록 표시
요소의 동작 로직 설명: 클릭 이벤트 전파 중단 (@click.stop)
요소의 입출력 데이터 구조: 입력: 없음. 출력: 프로젝트 리스트 렌더링
요소의 경로정보: frontend/js/components/ProjectModal.js#window
요소의 수행해야 할 백엔드/JS 명령: 없음">
                <div class="c-modal-window__header"
                     data-js="modal-header"
                     data-dev="요소의 역할: 모달 헤더
요소의 고유ID: component-modal-header
요소의 기능 목적 정의: 모달 제목 및 닫기 버튼 표시
요소의 동작 로직 설명: 제목 텍스트 표시, 닫기 버튼 렌더링
요소의 입출력 데이터 구조: 입력: 없음. 출력: 헤더 UI
요소의 경로정보: frontend/js/components/ProjectModal.js#header
요소의 수행해야 할 백엔드/JS 명령: 없음">
                    <span class="c-modal-window__title">프로젝트 관리</span>
                    <button @click="$emit('close')" 
                            class="c-modal-window__close-btn"
                            data-js="modal-close-btn"
                            title="닫기"
                            data-dev="요소의 역할: 모달 닫기 버튼
요소의 고유ID: component-modal-close-btn
요소의 기능 목적 정의: 모달창 닫기
요소의 동작 로직 설명: 클릭 시 @close 이벤트 발생
요소의 입출력 데이터 구조: 입력: 클릭. 출력: @close 이벤트
요소의 경로정보: frontend/js/components/ProjectModal.js#close-btn
요소의 수행해야 할 백엔드/JS 명령: JS: $emit('close')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="c-modal-window__body"
                     data-js="modal-body"
                     data-dev="요소의 역할: 모달 본문
요소의 고유ID: component-modal-body
요소의 기능 목적 정의: 프로젝트 파일 목록 및 폴더 구조 표시
요소의 동작 로직 설명: 좌측 폴더 트리, 우측 파일 리스트 렌더링
요소의 입출력 데이터 구조: 입력: 없음. 출력: 프로젝트 목록 UI
요소의 경로정보: frontend/js/components/ProjectModal.js#body
요소의 수행해야 할 백엔드/JS 명령: 없음">
                    <div class="c-modal-window__sidebar"
                         data-js="modal-sidebar"
                         title="폴더 목록">Folders...</div>
                    <div class="c-modal-window__content"
                         data-js="modal-content"
                         title="파일 목록">Files...</div>
                </div>
            </div>
        </div>
    `
};
