/**
 * ==========================================
 * PreviewCanvas.js
 * 
 * 역할: 프리뷰 캔버스 (레이어 객체 시각화 및 편집)
 * 경로: frontend/js/components/PreviewCanvas.js
 * ==========================================
 */

const PreviewCanvas = {
  name: 'PreviewCanvas',
  
  data() {
    return {
      // 캔버스 줌 레벨 (100% = 1.0)
      zoomLevel: 1.0,
      // 캔버스 팬 오프셋 { x, y }
      panOffset: { x: 0, y: 0 },
      // 현재 선택된 객체 ID
      selectedObjectId: null
    };
  },
  
  computed: {
    /**
     * 캔버스에 표시할 레이어 객체 목록 (store에서 가져옴)
     * @returns {Array} 레이어 배열
     */
    canvasObjects() {
      return this.$root.store.layers || [];
    },
    
    /**
     * 현재 캔버스 해상도 (store에서 가져옴)
     * @returns {String} 해상도 문자열 (예: '1920 × 1080')
     */
    currentResolution() {
      return this.$root.store.canvas.resolution;
    },
    
    /**
     * 캔버스 스타일 (줌, 팬 적용)
     * @returns {Object} CSS 스타일 객체
     */
    canvasStyle() {
      return {
        transform: `scale(${this.zoomLevel}) translate(${this.panOffset.x}px, ${this.panOffset.y}px)`,
        transformOrigin: 'center center'
      };
    }
  },
  
  methods: {
    /**
     * 캔버스 객체 선택 핸들러
     * @param {String} objectId - 선택된 객체 ID
     */
    selectObject(objectId) {
      this.selectedObjectId = objectId;
      console.log('[PreviewCanvas] Object Selected:', objectId);
    },
    
    /**
     * 캔버스 객체 드래그 시작 핸들러
     * @param {Event} event - 마우스 이벤트
     * @param {String} objectId - 드래그 중인 객체 ID
     */
    startDrag(event, objectId) {
      console.log('[PreviewCanvas] Drag Start:', objectId);
      // TODO: Interact.js 드래그 로직 구현
    },
    
    /**
     * 캔버스 줌 인/아웃
     * @param {Number} delta - 줌 변화량 (+0.1 또는 -0.1)
     */
    zoom(delta) {
      this.zoomLevel = Math.max(0.1, Math.min(3.0, this.zoomLevel + delta));
      console.log('[PreviewCanvas] Zoom Level:', this.zoomLevel);
    },
    
    /**
     * 캔버스 팬 (이동)
     * @param {Number} deltaX - X축 이동량
     * @param {Number} deltaY - Y축 이동량
     */
    pan(deltaX, deltaY) {
      this.panOffset.x += deltaX;
      this.panOffset.y += deltaY;
      console.log('[PreviewCanvas] Pan Offset:', this.panOffset);
    }
  },
  
  template: `
    <div 
      id="preview-canvas-container"
      class="c-preview-canvas"
      data-dev='{
        "role": "프리뷰 캔버스 컨테이너",
        "id": "preview-canvas-container",
        "func": "레이어 객체들을 시각적으로 배치하고 편집할 수 있는 작업 영역",
        "goal": "사용자가 레이어를 드래그, 리사이즈, 회전하며 실시간으로 시각 피드백 제공",
        "state": {
          "canvasObjects": "캔버스에 표시 중인 레이어 객체 배열",
          "zoomLevel": "캔버스 줌 레벨 (0.1 ~ 3.0)",
          "panOffset": "캔버스 팬 오프셋 { x, y }",
          "selectedObjectId": "현재 선택된 객체 ID"
        },
        "path": "frontend/js/components/PreviewCanvas.js",
        "py": "",
        "js": "selectObject(id), startDrag(event, id), zoom(delta), pan(deltaX, deltaY)"
      }'
    >
      <!-- 캔버스 스테이지 (줌/팬 적용) -->
      <div 
        id="canvas-stage"
        class="c-preview-canvas__stage"
        :style="canvasStyle"
        data-js-canvas
        :data-dev='{
          "role": "캔버스 스테이지 (변환 적용 영역)",
          "id": "canvas-stage",
          "func": "줌(scale)과 팬(translate) 변환이 적용되는 메인 작업 영역",
          "goal": "사용자가 캔버스를 확대/축소하고 이동하며 작업",
          "state": {
            "transform": "scale(" + zoomLevel + ") translate(" + panOffset.x + "px, " + panOffset.y + "px)"
          },
          "path": "frontend/js/components/PreviewCanvas.js → stage",
          "py": "",
          "js": "canvasStyle computed"
        }'
      >
        <!-- 캔버스 객체 리스트 -->
        <div
          v-for="obj in canvasObjects"
          :key="obj.id"
          :id="'canvas-object-' + obj.id"
          :class="[
            'c-canvas-object',
            { 'c-canvas-object--selected': selectedObjectId === obj.id },
            { 'c-canvas-object--locked': obj.locked }
          ]"
          :data-js-object="obj.id"
          :style="{
            left: (obj.x || 0) + 'px',
            top: (obj.y || 0) + 'px',
            width: (obj.width || 100) + 'px',
            height: (obj.height || 100) + 'px',
            zIndex: obj.zIndex || 20
          }"
          @click="selectObject(obj.id)"
          @mousedown="startDrag($event, obj.id)"
          :data-dev='{
            "role": "캔버스 레이어 객체",
            "id": "canvas-object-" + obj.id,
            "func": "레이어의 시각적 표현 (이미지, 비디오, 텍스트 등)",
            "goal": "사용자가 객체를 클릭 선택, 드래그 이동, 리사이즈 가능",
            "state": {
              "object": {
                "id": obj.id,
                "name": obj.name,
                "type": obj.type,
                "x": obj.x,
                "y": obj.y,
                "width": obj.width,
                "height": obj.height,
                "zIndex": obj.zIndex,
                "visible": obj.visible,
                "locked": obj.locked
              },
              "selected": selectedObjectId === obj.id
            },
            "path": "frontend/js/components/PreviewCanvas.js → canvas object",
            "py": "",
            "js": "selectObject(obj.id), startDrag(event, obj.id)"
          }'
        >
          <!-- 객체 타입별 렌더링 -->
          <!-- 이미지 타입 -->
          <img 
            v-if="obj.type === 'image' && obj.asset"
            :id="'canvas-object-img-' + obj.id"
            class="c-canvas-object__img"
            :src="obj.asset.url"
            :alt="obj.name"
            draggable="false"
            :data-dev='{
              "role": "이미지 객체 렌더링",
              "id": "canvas-object-img-" + obj.id,
              "func": "이미지 자산을 캔버스에 표시",
              "goal": "사용자가 이미지 레이어를 시각적으로 확인",
              "state": { "src": obj.asset.url },
              "path": "frontend/js/components/PreviewCanvas.js → image object",
              "py": "",
              "js": ""
            }'
          />
          
          <!-- 비디오 타입 -->
          <video 
            v-if="obj.type === 'video' && obj.asset"
            :id="'canvas-object-video-' + obj.id"
            class="c-canvas-object__video"
            :src="obj.asset.url"
            muted
            :data-dev='{
              "role": "비디오 객체 렌더링",
              "id": "canvas-object-video-" + obj.id,
              "func": "비디오 자산을 캔버스에 표시",
              "goal": "사용자가 비디오 레이어를 시각적으로 확인",
              "state": { "src": obj.asset.url },
              "path": "frontend/js/components/PreviewCanvas.js → video object",
              "py": "",
              "js": ""
            }'
          ></video>
          
          <!-- 텍스트 타입 -->
          <div 
            v-if="obj.type === 'text'"
            :id="'canvas-object-text-' + obj.id"
            class="c-canvas-object__text"
            :data-dev='{
              "role": "텍스트 객체 렌더링",
              "id": "canvas-object-text-" + obj.id,
              "func": "텍스트 레이어를 캔버스에 표시",
              "goal": "사용자가 텍스트 레이어를 시각적으로 확인 및 편집",
              "state": { "text": obj.content },
              "path": "frontend/js/components/PreviewCanvas.js → text object",
              "py": "",
              "js": ""
            }'
          >
            {{ obj.content || obj.name }}
          </div>

          <!-- 선택 핸들 (선택된 객체만 표시) -->
          <div 
            v-if="selectedObjectId === obj.id"
            :id="'canvas-object-handle-' + obj.id"
            class="c-canvas-object__handle"
            :data-dev='{
              "role": "객체 리사이즈 핸들",
              "id": "canvas-object-handle-" + obj.id,
              "func": "선택된 객체의 모서리에 리사이즈 핸들 표시",
              "goal": "사용자가 객체를 드래그하여 크기 조절",
              "state": { "visible": selectedObjectId === obj.id },
              "path": "frontend/js/components/PreviewCanvas.js → resize handle",
              "py": "",
              "js": ""
            }'
          ></div>
        </div>

        <!-- 빈 캔버스 안내 -->
        <div 
          v-if="canvasObjects.length === 0"
          id="canvas-empty"
          class="c-preview-canvas__empty"
          data-dev='{
            "role": "빈 캔버스 안내 메시지",
            "id": "canvas-empty",
            "func": "캔버스에 레이어가 없을 때 안내 문구 표시",
            "goal": "사용자에게 레이어 추가 필요성을 알림",
            "state": { "visible": canvasObjects.length === 0 },
            "path": "frontend/js/components/PreviewCanvas.js → empty state",
            "py": "",
            "js": ""
          }'
        >
          No layers on canvas. Add assets from the left panel.
        </div>
      </div>

      <!-- 캔버스 줌 컨트롤 -->
      <div 
        id="canvas-zoom-controls"
        class="c-preview-canvas__zoom-controls"
        data-dev='{
          "role": "캔버스 줌 컨트롤",
          "id": "canvas-zoom-controls",
          "func": "캔버스 확대/축소 버튼 그룹",
          "goal": "사용자가 캔버스를 빠르게 줌 인/아웃",
          "state": { "zoomLevel": zoomLevel },
          "path": "frontend/js/components/PreviewCanvas.js → zoom controls",
          "py": "",
          "js": "zoom(delta)"
        }'
      >
        <button 
          id="btn-zoom-in"
          class="c-preview-canvas__zoom-btn"
          @click="zoom(0.1)"
          title="Zoom In"
          :data-dev='{
            "role": "줌 인 버튼",
            "id": "btn-zoom-in",
            "func": "클릭 시 캔버스를 10% 확대",
            "goal": "사용자가 캔버스를 크게 보기",
            "state": {},
            "path": "frontend/js/components/PreviewCanvas.js → zoom in button",
            "py": "",
            "js": "zoom(0.1)"
          }'
        >
          +
        </button>

        <span 
          id="zoom-level-display"
          class="c-preview-canvas__zoom-level"
          :data-dev='{
            "role": "현재 줌 레벨 표시",
            "id": "zoom-level-display",
            "func": "현재 캔버스 줌 레벨을 백분율로 표시",
            "goal": "사용자가 현재 줌 상태를 확인",
            "state": { "zoomLevel": zoomLevel },
            "path": "frontend/js/components/PreviewCanvas.js → zoom display",
            "py": "",
            "js": ""
          }'
        >
          {{ Math.round(zoomLevel * 100) }}%
        </span>

        <button 
          id="btn-zoom-out"
          class="c-preview-canvas__zoom-btn"
          @click="zoom(-0.1)"
          title="Zoom Out"
          :data-dev='{
            "role": "줌 아웃 버튼",
            "id": "btn-zoom-out",
            "func": "클릭 시 캔버스를 10% 축소",
            "goal": "사용자가 캔버스 전체를 보기",
            "state": {},
            "path": "frontend/js/components/PreviewCanvas.js → zoom out button",
            "py": "",
            "js": "zoom(-0.1)"
          }'
        >
          -
        </button>
      </div>
    </div>
  `
};

// CommonJS 모듈로 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PreviewCanvas;
}
