// ============================================
// WAI-UI App Root (Vue 3)
// 파일 위치: frontend/js/core/app-root.js
// 우측 패널 미디어 자산 콜랩스 추가
// ============================================

const AppRoot = {
  name: 'AppRoot',

  components: {
    TimelinePanel: window.TimelinePanel,
    PreviewRenderer: window.PreviewRenderer
  },

  data() {
    return {
      // 프로젝트 상태
      projectName: '새 프로젝트',
      isDirty: false,

      // 화면 비율 및 해상도
      aspectRatio: '16:9',
      resolution: '1080p',
      aspectOptions: ['원본', '16:9', '9:16', '4:3', '1:1', '21:9'],
      resolutionOptions: ['480p', '720p', '1080p', '1440p', '4K'],

      // 재생 상태
      isPlaying: false,
      currentTime: 0,
      duration: 0,

      // 캔버스 박스
      canvasBoxes: [],
      selectedBoxId: null,

      // 우측 패널 상태
      rightPanelCollapsed: false,
      mediaAssetCollapsed: false,
      layerPanelCollapsed: false,
      propertyPanelCollapsed: true,

      // 미디어 자산 임시 저장소
      mediaAssets: [],
      draggedAsset: null,

      // 타임라인 참조
      timelineTracks: [],

      // 모달 상태
      showSettingsModal: false,
      showExportModal: false
    };
  },

  computed: {
    // 미디어 자산 카운트
    mediaAssetCount() {
      return this.mediaAssets.length;
    },

    // 타입별 미디어 자산 그룹
    groupedMediaAssets() {
      const groups = {
        video: [],
        image: [],
        sound: []
      };
      this.mediaAssets.forEach(asset => {
        if (groups[asset.type]) {
          groups[asset.type].push(asset);
        }
      });
      return groups;
    }
  },

  methods: {
    // === 비율/해상도 변경 ===
    onAspectChange(ratio) {
      this.aspectRatio = ratio;
      this.isDirty = true;
    },

    onResolutionChange(res) {
      this.resolution = res;
      this.isDirty = true;
    },

    // === 재생 제어 ===
    play() {
      this.isPlaying = true;
    },

    pause() {
      this.isPlaying = false;
    },

    togglePlay() {
      this.isPlaying = !this.isPlaying;
    },

    seek(time) {
      this.currentTime = Math.max(0, Math.min(time, this.duration));
    },

    // === 캔버스 박스 관리 ===
    onSelectBox(boxId) {
      this.selectedBoxId = boxId;
    },

    onAddBox(box) {
      this.canvasBoxes.push(box);
      this.selectedBoxId = box.id;
      this.isDirty = true;
    },

    onUpdateBox(updatedBox) {
      const idx = this.canvasBoxes.findIndex(b => b.id === updatedBox.id);
      if (idx !== -1) {
        this.canvasBoxes[idx] = { ...this.canvasBoxes[idx], ...updatedBox };
        this.isDirty = true;
      }
    },

    // === 미디어 자산 관리 ===
    addMediaAsset(asset) {
      const newAsset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: asset.name || 'Untitled',
        type: asset.type || 'video',
        src: asset.src || '',
        duration: asset.duration || 0,
        thumbnail: asset.thumbnail || '',
        addedAt: Date.now()
      };
      this.mediaAssets.push(newAsset);
      this.isDirty = true;
    },

    removeMediaAsset(assetId) {
      const idx = this.mediaAssets.findIndex(a => a.id === assetId);
      if (idx !== -1) {
        this.mediaAssets.splice(idx, 1);
        this.isDirty = true;
      }
    },

    clearMediaAssets() {
      if (confirm('모든 미디어 자산을 삭제하시겠습니까?')) {
        this.mediaAssets = [];
        this.isDirty = true;
      }
    },

    // 미디어 자산 드래그 시작
    onAssetDragStart(event, asset) {
      this.draggedAsset = asset;
      event.dataTransfer.setData('text/wai-asset', JSON.stringify(asset));
      event.dataTransfer.effectAllowed = 'copy';
    },

    // 미디어 자산 드래그 종료
    onAssetDragEnd() {
      this.draggedAsset = null;
    },

    // 타임라인에서 자산 받기
    onTimelineAssetReceive(asset) {
      this.addMediaAsset(asset);
    },

    // 미디어 자산 패널에 드롭
    onMediaAssetDrop(event) {
      event.preventDefault();
      
      // 타임라인에서 드래그된 클립인지 확인
      const clipData = event.dataTransfer.getData('text/wai-clip');
      if (clipData) {
        try {
          const clip = JSON.parse(clipData);
          this.addMediaAsset({
            name: clip.name || clip.fileName,
            type: clip.type,
            src: clip.src,
            duration: clip.duration,
            thumbnail: clip.thumbnail
          });
        } catch (e) {
          console.warn('클립 파싱 오류:', e);
        }
      }

      // 파일 드롭
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        Array.from(event.dataTransfer.files).forEach(file => {
          this.handleFileAsAsset(file);
        });
      }
    },

    onMediaAssetDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    },

    handleFileAsAsset(file) {
      const url = URL.createObjectURL(file);
      let type = 'video';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'sound';

      this.addMediaAsset({
        name: file.name,
        type: type,
        src: url,
        duration: 0
      });
    },

    // 자산 더블클릭: 타임라인에 추가
    onAssetDoubleClick(asset) {
      if (this.$refs.timelinePanel && typeof this.$refs.timelinePanel.addClipFromAsset === 'function') {
        this.$refs.timelinePanel.addClipFromAsset(asset);
      }
    },

    // === 패널 토글 ===
    toggleRightPanel() {
      this.rightPanelCollapsed = !this.rightPanelCollapsed;
    },

    toggleMediaAssetPanel() {
      this.mediaAssetCollapsed = !this.mediaAssetCollapsed;
    },

    toggleLayerPanel() {
      this.layerPanelCollapsed = !this.layerPanelCollapsed;
    },

    togglePropertyPanel() {
      this.propertyPanelCollapsed = !this.propertyPanelCollapsed;
    },

    // === 타임라인 연동 ===
    onTimeUpdate(time) {
      this.currentTime = time;
    },

    onDurationChange(dur) {
      this.duration = dur;
    },

    onTracksChange(tracks) {
      this.timelineTracks = tracks;
    },

    // === 유틸 ===
    getAssetIcon(type) {
      const icons = {
        video: 'fas fa-film',
        image: 'fas fa-image',
        sound: 'fas fa-music'
      };
      return icons[type] || 'fas fa-file';
    },

    formatDuration(seconds) {
      if (!seconds || seconds === 0) return '--:--';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  },

  template: `
    <div class="app-root flex flex-col h-screen bg-bg-dark text-text-primary">
      
      <!-- 상단 헤더 -->
      <header class="app-header flex items-center h-12 px-4 border-b border-ui-border bg-bg-panel">
        <div class="flex items-center gap-3">
          <span class="text-lg font-bold text-accent-primary">WAI-UI</span>
          <span class="text-sm text-text-secondary">{{ projectName }}</span>
          <span v-if="isDirty" class="text-xs text-yellow-500">*</span>
        </div>
        <div class="flex-1"></div>
        <div class="flex items-center gap-2">
          <!-- 비율 선택 -->
          <select 
            v-model="aspectRatio" 
            @change="onAspectChange(aspectRatio)"
            class="bg-bg-input border border-ui-border rounded px-2 py-1 text-sm"
          >
            <option v-for="opt in aspectOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <!-- 해상도 선택 -->
          <select 
            v-model="resolution" 
            @change="onResolutionChange(resolution)"
            class="bg-bg-input border border-ui-border rounded px-2 py-1 text-sm"
          >
            <option v-for="opt in resolutionOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
      </header>

      <!-- 메인 컨텐츠 -->
      <div class="flex flex-1 overflow-hidden">
        
        <!-- 좌측 패널 (자산 브라우저) -->
        <aside class="w-64 border-r border-ui-border bg-bg-panel flex flex-col">
          <div class="p-2 border-b border-ui-border">
            <span class="text-sm font-semibold">자산 브라우저</span>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <!-- 자산 브라우저 콘텐츠 -->
          </div>
        </aside>

        <!-- 중앙 영역 (프리뷰 + 타임라인) -->
        <main class="flex-1 flex flex-col overflow-hidden">
          
          <!-- 프리뷰 영역 -->
          <div class="flex-1 min-h-0 bg-bg-dark flex items-center justify-center">
            <PreviewRenderer
              ref="previewRenderer"
              :canvas-boxes="canvasBoxes"
              :selected-box-id="selectedBoxId"
              :current-time="currentTime"
              :is-playing="isPlaying"
              :aspect-ratio="aspectRatio"
              :resolution="resolution"
              @select-box="onSelectBox"
              @add-box="onAddBox"
              @update-box="onUpdateBox"
              @aspect-change="onAspectChange"
              @resolution-change="onResolutionChange"
            />
          </div>

          <!-- 타임라인 영역 -->
          <div class="h-80 border-t border-ui-border">
            <TimelinePanel
              ref="timelinePanel"
              :current-time="currentTime"
              :is-playing="isPlaying"
              @time-update="onTimeUpdate"
              @duration-change="onDurationChange"
              @tracks-change="onTracksChange"
              @asset-to-storage="onTimelineAssetReceive"
            />
          </div>
        </main>

        <!-- 우측 패널 -->
        <aside 
          class="border-l border-ui-border bg-bg-panel flex flex-col transition-all duration-200"
          :class="rightPanelCollapsed ? 'w-10' : 'w-72'"
        >
          <!-- 패널 토글 버튼 -->
          <div class="flex items-center justify-between p-2 border-b border-ui-border">
            <span v-if="!rightPanelCollapsed" class="text-sm font-semibold">패널</span>
            <button 
              @click="toggleRightPanel" 
              class="p-1 hover:bg-bg-hover rounded"
              :title="rightPanelCollapsed ? '패널 펼치기' : '패널 접기'"
            >
              <i :class="rightPanelCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
            </button>
          </div>

          <div v-if="!rightPanelCollapsed" class="flex-1 overflow-y-auto">
            
            <!-- 미디어 자산 콜랩스 -->
            <div class="border-b border-ui-border">
              <div 
                class="flex items-center justify-between p-2 cursor-pointer hover:bg-bg-hover"
                @click="toggleMediaAssetPanel"
              >
                <div class="flex items-center gap-2">
                  <i :class="mediaAssetCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'" class="text-xs w-3"></i>
                  <i class="fas fa-folder-open text-accent-primary"></i>
                  <span class="text-sm font-medium">미디어 자산</span>
                  <span class="text-xs text-text-secondary">({{ mediaAssetCount }})</span>
                </div>
                <button 
                  v-if="mediaAssetCount > 0"
                  @click.stop="clearMediaAssets" 
                  class="p-1 hover:bg-red-600 rounded text-xs"
                  title="모두 삭제"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              
              <!-- 미디어 자산 목록 -->
              <div 
                v-show="!mediaAssetCollapsed"
                class="media-asset-drop-zone p-2 min-h-24 max-h-64 overflow-y-auto"
                @drop="onMediaAssetDrop"
                @dragover="onMediaAssetDragOver"
              >
                <!-- 빈 상태 -->
                <div 
                  v-if="mediaAssets.length === 0" 
                  class="flex flex-col items-center justify-center h-20 text-text-secondary text-xs border-2 border-dashed border-ui-border rounded"
                >
                  <i class="fas fa-cloud-upload-alt text-2xl mb-1"></i>
                  <span>자산을 여기에 드롭하세요</span>
                  <span class="text-xs mt-1">타임라인 클립도 저장 가능</span>
                </div>

                <!-- 자산 목록 -->
                <div v-else class="space-y-1">
                  <div
                    v-for="asset in mediaAssets"
                    :key="asset.id"
                    class="media-asset-item flex items-center gap-2 p-2 rounded bg-bg-input hover:bg-bg-hover cursor-move group"
                    draggable="true"
                    @dragstart="onAssetDragStart($event, asset)"
                    @dragend="onAssetDragEnd"
                    @dblclick="onAssetDoubleClick(asset)"
                    :title="asset.name + ' (더블클릭으로 타임라인에 추가)'"
                  >
                    <!-- 썸네일 -->
                    <div class="w-10 h-10 bg-bg-dark rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img 
                        v-if="asset.thumbnail" 
                        :src="asset.thumbnail" 
                        class="w-full h-full object-cover"
                      />
                      <i v-else :class="getAssetIcon(asset.type)" class="text-lg text-text-secondary"></i>
                    </div>
                    
                    <!-- 정보 -->
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium truncate">{{ asset.name }}</div>
                      <div class="text-xs text-text-secondary flex items-center gap-1">
                        <i :class="getAssetIcon(asset.type)" class="text-xs"></i>
                        <span>{{ formatDuration(asset.duration) }}</span>
                      </div>
                    </div>

                    <!-- 삭제 버튼 -->
                    <button 
                      @click.stop="removeMediaAsset(asset.id)"
                      class="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 rounded transition-opacity"
                      title="삭제"
                    >
                      <i class="fas fa-times text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 레이어 관리 콜랩스 -->
            <div class="border-b border-ui-border">
              <div 
                class="flex items-center justify-between p-2 cursor-pointer hover:bg-bg-hover"
                @click="toggleLayerPanel"
              >
                <div class="flex items-center gap-2">
                  <i :class="layerPanelCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'" class="text-xs w-3"></i>
                  <i class="fas fa-layer-group text-accent-secondary"></i>
                  <span class="text-sm font-medium">레이어 관리</span>
                </div>
              </div>
              <div v-show="!layerPanelCollapsed" class="p-2">
                <!-- 레이어 관리 콘텐츠 -->
                <div class="text-xs text-text-secondary">레이어 관리 패널</div>
              </div>
            </div>

            <!-- 속성 콜랩스 -->
            <div class="border-b border-ui-border">
              <div 
                class="flex items-center justify-between p-2 cursor-pointer hover:bg-bg-hover"
                @click="togglePropertyPanel"
              >
                <div class="flex items-center gap-2">
                  <i :class="propertyPanelCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'" class="text-xs w-3"></i>
                  <i class="fas fa-sliders-h text-accent-warning"></i>
                  <span class="text-sm font-medium">속성</span>
                </div>
              </div>
              <div v-show="!propertyPanelCollapsed" class="p-2">
                <!-- 속성 패널 콘텐츠 -->
                <div class="text-xs text-text-secondary">선택된 항목 없음</div>
              </div>
            </div>

          </div>
        </aside>

      </div>
    </div>
  `
};

window.AppRoot = AppRoot;
