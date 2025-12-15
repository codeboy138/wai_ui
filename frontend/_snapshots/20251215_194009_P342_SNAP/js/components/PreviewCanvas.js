const PreviewCanvas = {
  name: 'PreviewCanvas',

  props: {
    canvasBoxes: {
      type: Array,
      required: true
    },
    canvasSize: {
      type: Object,
      required: false,
      default: () => ({ w: 1920, h: 1080 })
    },
    selectedBoxId: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      dragging: false,
      dragMode: null,
      dragHandle: null,
      dragBoxId: null,
      dragStartMouse: { mx: 0, my: 0 },
      dragStartBox: { x0: 0, y0: 0, w0: 0, h0: 0 },
    };
  },

  computed: {
    scalerStyle() {
      const cw = this.canvasSize?.w || 1920;
      const ch = this.canvasSize?.h || 1080;
      return {
        position: 'relative',
        width: cw + 'px',
        height: ch + 'px',
        overflow: 'visible' 
      };
    }
  },

  methods: {
    clientToCanvas(e) {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler) {
        return { mx: 0, my: 0 };
      }
      
      const rect = scaler.getBoundingClientRect();
      const logicalW = this.canvasSize?.w || 1920;
      
      const scaleX = rect.width / logicalW;
      const s = (scaleX === 0) ? 1 : scaleX;

      const mx = (e.clientX - rect.left) / s;
      const my = (e.clientY - rect.top) / s;
      
      return { mx, my };
    },

    boxStyle(box) {
      const isSelected = (this.selectedBoxId === box.id);
      return {
        position: 'absolute',
        left: (box.x || 0) + 'px',
        top: (box.y || 0) + 'px',
        width: (box.w || 0) + 'px',
        height: (box.h || 0) + 'px',
        border: `2px solid ${box.color || '#fff'}`,
        zIndex: box.zIndex || 0,
        cursor: 'move',
        boxShadow: isSelected ? '0 0 0 1px #fff, 0 0 10px rgba(0,0,0,0.5)' : 'none',
        backgroundColor: box.layerBgColor || 'transparent'
      };
    },

    labelChipStyle(box) {
      return {
        position: 'absolute',
        // [수정] 좌측 상단 고정 (모서리 핸들과 겹침 방지)
        top: '0', 
        left: '0',
        backgroundColor: box.color || '#333',
        color: '#fff',
        padding: '2px 6px',
        fontSize: '12px',
        fontWeight: 'bold',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        pointerEvents: 'none',
        zIndex: 10 
      };
    },

    handleStyle(pos) {
      // 모서리 감지 반경 2배 (24px)
      const size = 24; 
      const offset = -12; 
      
      const style = {
        position: 'absolute',
        width: size + 'px',
        height: size + 'px',
        backgroundColor: '#fff', 
        border: '1px solid #000',
        zIndex: 9999,
        pointerEvents: 'auto', 
        opacity: 0.8 
      };

      if (pos === 'tl') { style.top = offset + 'px'; style.left = offset + 'px'; style.cursor = 'nwse-resize'; }
      if (pos === 'tr') { style.top = offset + 'px'; style.right = offset + 'px'; style.cursor = 'nesw-resize'; }
      if (pos === 'bl') { style.bottom = offset + 'px'; style.left = offset + 'px'; style.cursor = 'nesw-resize'; }
      if (pos === 'br') { style.bottom = offset + 'px'; style.right = offset + 'px'; style.cursor = 'nwse-resize'; }
      
      return style;
    },

    onBoxMouseDown(e, box) {
      if (e.target.classList.contains('box-handle')) return;
      if (e.button !== 0) return;

      e.preventDefault();
      this.$emit('select-box', box.id);

      const { mx, my } = this.clientToCanvas(e);
      this.startDrag('move', box, mx, my);
    },

    onBoxContextMenu(e, box) {
      this.$emit('contextmenu', e, box.id);
    },

    onHandleMouseDown(e, box, handle) {
      if (e.button !== 0) return;

      e.stopPropagation(); 
      e.preventDefault();
      this.$emit('select-box', box.id);

      const { mx, my } = this.clientToCanvas(e);
      this.startDrag('resize', box, mx, my, handle);
    },

    startDrag(mode, box, mx, my, handle = null) {
      this.dragging = true;
      this.dragMode = mode;
      this.dragHandle = handle;
      this.dragBoxId = box.id;
      this.dragStartMouse = { mx, my };
      this.dragStartBox = { 
        x0: box.x || 0, 
        y0: box.y || 0, 
        w0: box.w || 0, 
        h0: box.h || 0 
      };

      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);
    },

    onWindowMouseMove(e) {
      if (!this.dragging) return;

      const { mx, my } = this.clientToCanvas(e);
      const dx = mx - this.dragStartMouse.mx;
      const dy = my - this.dragStartMouse.my;
      
      const { x0, y0, w0, h0 } = this.dragStartBox;
      let x = x0, y = y0, w = w0, h = h0;

      // 캔버스 크기 (경계 제한용)
      const cw = this.canvasSize?.w || 1920;
      const ch = this.canvasSize?.h || 1080;
      const minSize = 10;

      if (this.dragMode === 'move') {
        x += dx;
        y += dy;

        // [수정] 캔버스 내부로 이동 제한 (Clamping)
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + w > cw) x = cw - w;
        if (y + h > ch) y = ch - h;

      } else if (this.dragMode === 'resize') {
        const hdl = this.dragHandle;

        if (hdl.includes('l')) { 
            let newX = x + dx;
            // 왼쪽 경계 제한
            if (newX < 0) { 
                w = w + x; 
                x = 0; 
            } else {
                x = newX;
                w -= dx;
            }
        }
        if (hdl.includes('r')) { 
            let newW = w + dx;
            // 오른쪽 경계 제한
            if (x + newW > cw) {
                w = cw - x;
            } else {
                w = newW;
            }
        }
        if (hdl.includes('t')) { 
            let newY = y + dy;
            // 위쪽 경계 제한
            if (newY < 0) {
                h = h + y;
                y = 0;
            } else {
                y = newY;
                h -= dy;
            }
        }
        if (hdl.includes('b')) { 
            let newH = h + dy;
            // 아래쪽 경계 제한
            if (y + newH > ch) {
                h = ch - y;
            } else {
                h = newH;
            }
        }
      }

      if (w < minSize) w = minSize;
      if (h < minSize) h = minSize;

      if (this.$parent && typeof this.$parent.updateBoxPosition === 'function') {
        this.$parent.updateBoxPosition(this.dragBoxId, x, y, w, h, null);
      }
    },

    onWindowMouseUp() {
      this.dragging = false;
      this.dragMode = null;
      window.removeEventListener('mousemove', this.onWindowMouseMove);
      window.removeEventListener('mouseup', this.onWindowMouseUp);
    }
  },

  beforeUnmount() {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  },

  template: `
    <div id="preview-canvas-scaler" :style="scalerStyle">
      <div
        v-for="box in canvasBoxes"
        :key="box.id"
        :id="'preview-canvas-box-' + box.id"
        class="canvas-box"
        :style="boxStyle(box)"
        @mousedown="onBoxMouseDown($event, box)"
        @contextmenu.prevent="onBoxContextMenu($event, box)"
        data-action="js:selectCanvasBox"
      >
        <!-- 레이블 (텍스트가 있을 때만 렌더링, 좌측 상단 고정) -->
        <div 
            v-if="box.layerName || box.type" 
            class="canvas-label-chip" 
            :style="labelChipStyle(box)"
        >
          {{ box.layerName || box.type || 'Layer' }}
        </div>

        <!-- 리사이즈 핸들 (선택 시만) -->
        <template v-if="selectedBoxId === box.id">
          <div class="box-handle" :style="handleStyle('tl')" @mousedown="onHandleMouseDown($event, box, 'tl')"></div>
          <div class="box-handle" :style="handleStyle('tr')" @mousedown="onHandleMouseDown($event, box, 'tr')"></div>
          <div class="box-handle" :style="handleStyle('bl')" @mousedown="onHandleMouseDown($event, box, 'bl')"></div>
          <div class="box-handle" :style="handleStyle('br')" @mousedown="onHandleMouseDown($event, box, 'br')"></div>
        </template>
      </div>
    </div>
  `
};

window.PreviewCanvas = PreviewCanvas;
