/**
 * ==========================================
 * store.js - 전역 상태 관리
 * 
 * 역할: Vue Reactive를 사용한 중앙 집중식 상태 관리
 * 경로: frontend/js/store.js
 * ==========================================
 */

const { reactive } = window.Vue;

const store = reactive({
  // 프로젝트 정보
  projectName: 'Untitled Project',
  createdAt: null,
  modifiedAt: null,
  
  // 캔버스 설정
  selectedRatio: '16:9',
  selectedQuality: 'FHD',
  selectedResolution: '1920 × 1080',
  zoom: 1.0,
  
  // 타임라인
  tracks: [
    { id: 'track-1', name: 'Global', type: 'global', height: 40 },
    { id: 'track-2', name: 'bgp', type: 'video', height: 40 },
    { id: 'track-3', name: 'Middle', type: 'video', height: 40 },
    { id: 'track-4', name: 'Bottom', type: 'video', height: 40 },
    { id: 'track-5', name: 'scan', type: 'audio', height: 40 }
  ],
  clips: [],
  playheadTime: 0,
  isPlaying: false,
  duration: 60,
  
  // 캔버스
  canvasBoxes: [],
  selectedBoxId: null,
  
  // 레이어 행렬 (4x4)
  layers: [],
  selectedLayerId: null,
  
  // 에셋 라이브러리
  assets: {
    images: [],
    videos: [],
    audios: [],
    texts: []
  },
  
  // 현재 선택된 탭
  currentAssetTab: 'images',
  
  // 모달 표시 상태
  showDesignGuide: false,
  showProjectModal: false,
  
  // 메서드: 레이어 추가
  addLayer(row, col, name) {
    const id = `layer-${Date.now()}`;
    this.layers.push({
      id,
      name: name || `Layer ${this.layers.length + 1}`,
      row,
      col,
      visible: true
    });
    return id;
  },
  
  // 메서드: 레이어 삭제
  deleteLayer(layerId) {
    const index = this.layers.findIndex(l => l.id === layerId);
    if (index > -1) {
      this.layers.splice(index, 1);
      if (this.selectedLayerId === layerId) {
        this.selectedLayerId = null;
      }
    }
  },
  
  // 메서드: 레이어 선택
  selectLayer(layerId) {
    this.selectedLayerId = layerId;
  },
  
  // 메서드: 클립 추가
  addClip(trackId, startTime, duration, name, color) {
    const id = `clip-${Date.now()}`;
    this.clips.push({
      id,
      trackId,
      name: name || 'New Clip',
      startTime: startTime || 0,
      duration: duration || 5,
      color: color || '#3b82f6'
    });
    return id;
  },
  
  // 메서드: 클립 삭제
  deleteClip(clipId) {
    const index = this.clips.findIndex(c => c.id === clipId);
    if (index > -1) {
      this.clips.splice(index, 1);
    }
  },
  
  // 메서드: Canvas Box 추가
  addCanvasBox(x, y, width, height, name) {
    const id = `box-${Date.now()}`;
    this.canvasBoxes.push({
      id,
      name: name || `Box ${this.canvasBoxes.length + 1}`,
      x: x || 0,
      y: y || 0,
      width: width || 100,
      height: height || 100,
      rotation: 0,
      opacity: 1
    });
    return id;
  },
  
  // 메서드: Canvas Box 삭제
  deleteCanvasBox(boxId) {
    const index = this.canvasBoxes.findIndex(b => b.id === boxId);
    if (index > -1) {
      this.canvasBoxes.splice(index, 1);
      if (this.selectedBoxId === boxId) {
        this.selectedBoxId = null;
      }
    }
  },
  
  // 메서드: Canvas Box 선택
  selectCanvasBox(boxId) {
    this.selectedBoxId = boxId;
  }
});

export default store;
