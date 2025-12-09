/**
 * ==========================================
 * store.js
 * 
 * 역할: 전역 상태 관리 (Reactive Store)
 * 경로: frontend/js/store.js
 * ==========================================
 */

// Vue 3 CDN에서 reactive 가져오기
const { reactive } = Vue;

const store = reactive({
  // 프로젝트 정보
  projectName: 'Untitled Project',
  createdAt: null,
  modifiedAt: null,
  
  // 캔버스 설정
  selectedRatio: '16:9',
  selectedQuality: 'FHD',
  selectedResolution: '1920 × 1080',
  
  // 레이어 목록
  layers: [],
  selectedLayerId: null,
  
  // 에셋 라이브러리
  assets: {
    images: [],
    videos: [],
    audios: [],
    texts: []
  },
  
  // 모달 표시 상태
  showDesignGuide: false,
  showProjectModal: false
});

export default store;
