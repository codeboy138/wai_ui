// ============================================
// WAI-UI Preview Renderer (Vue 3)
// 파일 위치: frontend/js/core/preview-renderer.js
// 화면 비율 변경 시 캔버스 비율 연동 수정
// ============================================

const PreviewRenderer = {
  name: 'PreviewRenderer',

  components: {
    PreviewCanvas: window.PreviewCanvas
  },

  props: {
    canvasBoxes: { type: Array, default: () => [] },
    selectedBoxId: { type: String, default: null },
    currentTime: { type: Number, default: 0 },
    isPlaying: { type: Boolean, default: false },
    aspectRatio: { type: String, default: '16:9' },
    resolution: { type: String, default: '1080p' }
  },

  emits: ['select-box', 'add-box', 'update-box', 'aspect-change', 'resolution-change'],

  data() {
    return {
      containerWidth: 0,
      containerHeight: 0,
      canvasDisplayWidth: 0,
      canvasDisplayHeight: 0,
      masterVolume: 1,
      isMuted: false,
      isMagnet: true,
      resizeObserver: null
    };
  },

  computed: {
    // 비율 문자열을 숫자로 변환
    aspectRatioValue() {
      const ratioMap = {
        '원본': null,
        '16:9': 16 / 9,
        '9:16': 9 / 16,
        '4:3': 4 / 3,
        '1:1': 1,
        '21:9': 21 / 9
      };
      return ratioMap[this.aspectRatio] || 16 / 9;
    },

    // 해상도에 따른 기본 캔버스 크기
    baseCanvasSize() {
      const resMap = {
        '480p': { w: 854, h: 480 },
        '720p': { w: 1280, h: 720 },
        '1080p': { w: 1920, h: 1080 },
        '1440p': { w: 2560, h: 1440 },
        '4K': { w: 3840, h: 2160 }
      };
      return resMap[this.resolution] || { w: 1920, h: 1080 };
    },

    // 실제 캔버스 크기 (비율 적용)
    canvasSize() {
      const base = this.baseCanvasSize;
      const ratio = this.aspectRatioValue;

      // 원본 비율인 경우 기본 크기 사용
      if (ratio === null) {
        return base;
      }

      // 비율에 맞게 조정
      let w = base.w;
      let h = base.h;

      const currentRatio = w / h;

      if (ratio > currentRatio) {
        // 더 넓은 비율: 높이 기준으로 너비 계산
        w = Math.round(h * ratio);
      } else if (ratio < currentRatio) {
        // 더 좁은 비율: 너비 기준으로 높이 계산
        h = Math.round(w / ratio);
      }

      return { w, h };
    },

    // 캔버스 스케일러 스타일
    scalerStyle() {
      const cs = this.canvasSize;
      return {
        width: cs.w + 'px',
        height: cs.h + 'px',
        transform: `scale(${this.canvasDisplayWidth / cs.w})`,
        transformOrigin: 'top left'
      };
    },

    // 캔버스 래퍼 스타일
    wrapperStyle() {
      return {
        width: this.canvasDisplayWidth + 'px',
        height: this.canvasDisplayHeight + 'px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000'
      };
    },

    // 볼륨 아이콘 클래스
    volumeIconClass() {
      if (this.isMuted || this.masterVolume === 0) return 'fas fa-volume-mute';
      if (this.masterVolume < 0.5) return 'fas fa-volume-down';
      return 'fas fa-volume-up';
    }
  },

  watch: {
    aspectRatio: {
      handler() {
        this.$nextTick(() => {
          this.calculateCanvasDisplay();
        });
      },
      immediate: true
    },
    resolution: {
      handler() {
        this.$nextTick(() => {
          this.calculateCanvasDisplay();
        });
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.initResizeObserver();
      this.calculateCanvasDisplay();
    });
  },

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },

  methods: {
    initResizeObserver() {
      const container = this.$refs.previewContainer;
      if (!container) return;

      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          this.containerWidth = entry.contentRect.width;
          this.containerHeight = entry.contentRect.height;
          this.calculateCanvasDisplay();
        }
      });

      this.resizeObserver.observe(container);
    },

    calculateCanvasDisplay() {
      const container = this.$refs.previewContainer;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const availableWidth = rect.width - 20; // 패딩
      const availableHeight = rect.height - 20;

      const cs = this.canvasSize;
      const canvasRatio = cs.w / cs.h;

      let displayWidth, displayHeight;

      if (availableWidth / availableHeight > canvasRatio) {
        // 컨테이너가 더 넓음: 높이에 맞춤
        displayHeight = availableHeight;
        displayWidth = displayHeight * canvasRatio;
      } else {
        // 컨테이너가 더 좁음: 너비에 맞춤
        displayWidth = availableWidth;
        displayHeight = displayWidth / canvasRatio;
      }

      this.canvasDisplayWidth = Math.floor(displayWidth);
      this.canvasDisplayHeight = Math.floor(displayHeight);
    },

    // 비율 변경 핸들러
    onAspectRatioChange(ratio) {
      this.$emit('aspect-change', ratio);
    },

    // 해상도 변경 핸들러
    onResolutionChange(res) {
      this.$emit('resolution-change', res);
    },

    // 마스터 볼륨 설정
    setMasterVolume(vol) {
      this.masterVolume = Math.max(0, Math.min(1, vol));
      this.applyVolumeToVideos();
    },

    // 음소거 토글
    toggleMute() {
      this.isMuted = !this.isMuted;
      this.applyVolumeToVideos();
    },

    // 비디오 요소에 볼륨 적용
    applyVolumeToVideos() {
      const videos = document.querySelectorAll('#preview-canvas-scaler video');
      videos.forEach(video => {
        video.muted = this.isMuted;
        video.volume = this.isMuted ? 0 : this.masterVolume;
      });
    },

    // 자석 토글
    toggleMagnet() {
      this.isMagnet = !this.isMagnet;
    },

    // 박스 선택
    onSelectBox(boxId) {
      this.$emit('select-box', boxId);
    },

    // 박스 추가
    onAddBox(box) {
      this.$emit('add-box', box);
    },

    // 박스 위치 업데이트
    updateBoxPosition(boxId, x, y, w, h, extra) {
      const cs = this.canvasSize;
      const updatedBox = {
        id: boxId,
        x, y, w, h,
        nx: x / cs.w,
        ny: y / cs.h,
        nw: w / cs.w,
        nh: h / cs.h
      };
      this.$emit('update-box', updatedBox);
    },

    // 캔버스 자산 드롭 핸들러
    handleCanvasAssetDrop(assetData, x, y) {
      const cs = this.canvasSize;
      const defaultW = cs.w / 2;
      const defaultH = cs.h / 2;
      const boxX = Math.max(0, Math.min(cs.w - defaultW, x - defaultW / 2));
      const boxY = Math.max(0, Math.min(cs.h - defaultH, y - defaultH / 2));

      const newBox = {
        id: `box_${Date.now()}`,
        x: boxX,
        y: boxY,
        w: defaultW,
        h: defaultH,
        nx: boxX / cs.w,
        ny: boxY / cs.h,
        nw: defaultW / cs.w,
        nh: defaultH / cs.h,
        color: '#3b82f6',
        layerBgColor: 'transparent',
        zIndex: 100,
        isHidden: false,
        layerName: assetData.name || 'New Layer',
        rowType: assetData.type === 'sound' ? 'EFF' : 'BG',
        colRole: 'full',
        slotKey: `layer_${Date.now()}`
      };

      if (assetData.type === 'video') {
        newBox.mediaType = 'video';
        newBox.mediaSrc = assetData.src || '';
        newBox.mediaFit = 'contain';
      } else if (assetData.type === 'image') {
        newBox.mediaType = 'image';
        newBox.mediaSrc = assetData.src || '';
        newBox.mediaFit = 'contain';
      }

      this.$emit('add-box', newBox);
    },

    // 레이어 설정 열기
    openLayerConfig(boxId) {
      // 부모 컴포넌트에서 처리
      if (this.$parent && typeof this.$parent.openLayerConfig === 'function') {
        this.$parent.openLayerConfig(boxId);
      }
    }
  },

  template: `
    <div class="preview-renderer-container" ref="previewContainer">
      <div class="preview-canvas-wrapper" :style="wrapperStyle">
        <div id="preview-canvas-scaler" :style="scalerStyle">
          <PreviewCanvas
            :canvas-boxes="canvasBoxes"
            :canvas-size="canvasSize"
            :selected-box-id="selectedBoxId"
            :current-time="currentTime"
            :is-playing="isPlaying"
            @select-box="onSelectBox"
            @add-box="onAddBox"
          />
        </div>
      </div>
    </div>
  `
};

window.PreviewRenderer = PreviewRenderer;
