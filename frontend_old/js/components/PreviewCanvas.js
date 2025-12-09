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
      zoomLevel: 1.0,
      panOffset: { x: 0, y: 0 },
      selectedObjectId: null
    };
  },
  
  computed: {
    canvasObjects() {
      return this.$store.layers || [];  // ← 수정
    },
    
    currentResolution() {
      return this.$store.selectedResolution;  // ← 수정
    },
    
    canvasStyle() {
      return {
        transform: `scale(${this.zoomLevel}) translate(${this.panOffset.x}px, ${this.panOffset.y}px)`,
        transformOrigin: 'center center'
      };
    }
  },
  
  methods: {
    selectObject(objectId) {
      this.selectedObjectId = objectId;
      console.log('[PreviewCanvas] Object Selected:', objectId);
    },
    
    startDrag(event, objectId) {
      console.log('[PreviewCanvas] Drag Start:', objectId);
    },
    
    zoom(delta) {
      this.zoomLevel = Math.max(0.1, Math.min(3.0, this.zoomLevel + delta));
      console.log('[PreviewCanvas] Zoom Level:', this.zoomLevel);
    },
    
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
    >
      <div 
        id="canvas-stage"
        class="c-preview-canvas__stage"
        :style="canvasStyle"
        data-js-canvas
      >
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
        >
          <img 
            v-if="obj.type === 'image' && obj.asset"
            :src="obj.asset.url"
            :alt="obj.name"
            draggable="false"
          />
          
          <video 
            v-if="obj.type === 'video' && obj.asset"
            :src="obj.asset.url"
            muted
          ></video>
          
          <div 
            v-if="obj.type === 'text'"
          >
            {{ obj.content || obj.name }}
          </div>
        </div>

        <div 
          v-if="canvasObjects.length === 0"
          id="canvas-empty"
          class="c-preview-canvas__empty"
        >
          No layers on canvas. Add assets from the left panel.
        </div>
      </div>

      <div 
        id="canvas-zoom-controls"
        class="c-preview-canvas__zoom-controls"
      >
        <button 
          id="btn-zoom-in"
          class="c-preview-canvas__zoom-btn"
          @click="zoom(0.1)"
          title="Zoom In"
        >
          +
        </button>

        <span 
          id="zoom-level-display"
          class="c-preview-canvas__zoom-level"
        >
          {{ Math.round(zoomLevel * 100) }}%
        </span>

        <button 
          id="btn-zoom-out"
          class="c-preview-canvas__zoom-btn"
          @click="zoom(-0.1)"
          title="Zoom Out"
        >
          -
        </button>
      </div>
    </div>
  `
};

export default PreviewCanvas;
