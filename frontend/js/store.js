/**
 * ==========================================
 * store.js
 * 
 * 역할: 전역 상태 관리 (Reactive Store)
 * 경로: frontend/js/store.js
 * ==========================================
 */

import { reactive } from 'vue';

const store = reactive({
  // 프로젝트 정보
  project: {
    name: 'Untitled Project',
    createdAt: null,
    modifiedAt: null
  },
  
  // 캔버스 설정
  canvas: {
    ratio: '16:9',
    quality: 'FHD',
    resolution: '1920 × 1080'
  },
  
  // 레이어 목록
  layers: [],
  
  // 자산 라이브러리
  assets: {
    images: [],
    videos: [],
    audios: [],
    texts: []
  }
});

export default store;
