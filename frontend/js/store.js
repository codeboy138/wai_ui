/**
 * [DATA-DEV: store.js]
 * - 역할: 전역 상태 관리 (Global State)
 * - 고유ID: global-store
 * - 기능: UI 상태, 트랙/클립/박스 데이터, 선택 상태
 * - 로직: reactive 객체로 Vue 반응성 제공
 * - 데이터: 아래 appState 객체 참조
 * - 경로: frontend/js/store.js
 * - 명령: 없음 (데이터 저장소)
 */

export const appState = {
  // UI 상태
  currentPage: 'explore',
  devMode: null, // 'inspect' | 'data-dev' | null
  
  // 패널 크기
  leftPanelWidth: 240,
  rightPanelWidth: 280,
  timelinePanelHeight: 200,
  
  // 캔버스 설정
  canvasRatio: '16:9',
  canvasResolution: '1920x1080',
  canvasScale: 1,
  snapEnabled: true,
  
  // 타임라인 설정
  timelineZoom: 30,
  playhead: 0,
  
  // 레이어 (4x3 매트릭스)
  layers: [
    { id: 1, name: 'L1', content: null },
    { id: 2, name: 'L2', content: null },
    { id: 3, name: 'L3', content: null },
    { id: 4, name: 'L4', content: null },
    { id: 5, name: 'L5', content: null },
    { id: 6, name: 'L6', content: null },
    { id: 7, name: 'L7', content: null },
    { id: 8, name: 'L8', content: null },
    { id: 9, name: 'L9', content: null },
    { id: 10, name: 'L10', content: null },
    { id: 11, name: 'L11', content: null },
    { id: 12, name: 'L12', content: null }
  ],
  selectedLayerId: null,
  
  // 트랙
  tracks: [
    { id: 1, name: '트랙 1', type: 'video' },
    { id: 2, name: '트랙 2', type: 'video' },
    { id: 3, name: '트랙 3', type: 'audio' }
  ],
  
  // 클립
  clips: [
    { id: 1, trackId: 1, name: '클립 1', start: 0, duration: 5, assetId: 'asset1' },
    { id: 2, trackId: 1, name: '클립 2', start: 6, duration: 3, assetId: 'asset2' }
  ],
  selectedClipId: null,
  
  // 캔버스 박스
  canvasBoxes: [
    { id: 1, name: '텍스트 1', x: 100, y: 100, width: 200, height: 100, zIndex: 10, bgColor: '#3b82f6' },
    { id: 2, name: '이미지 1', x: 350, y: 150, width: 300, height: 200, zIndex: 5, bgColor: '#10b981' }
  ],
  selectedCanvasBoxId: null,
  
  // Inspector 데이터
  inspectorData: {
    elementId: '',
    dataAction: '',
    io: '',
    logic: ''
  }
};
