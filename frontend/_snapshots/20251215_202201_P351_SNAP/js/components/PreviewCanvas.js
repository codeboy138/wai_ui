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
      dragMode: null, // 'move' | 'resize'
      dragHandle: null,
      dragBoxId: null,
      dragStartMouse: { mx: 0, my: 0 },
      dragStartBox: { x0: 0, y0: 0, w0: 0, h0: 0 },
    };
  },

  computed: {
    scalerStyle() {
      // 캔버스 논리 크기 (예: 1920x1080)
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
    // --- 좌표 변환 (마우스 화면 좌표 -> 캔버스 논리 좌표) ---
    // 해상도가 지정되어 있어도 화면엔 축소되어 표시되므로 스케일 보정이 필수입니다.
    clientToCanvas(e) {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler) {
        return { mx: 0, my: 0 };
      }
      
      // 1. 화면에 실제 렌더링된 크기 (px)
      const rect = scaler.getBoundingClientRect();
      
      // 2. 논리적 해상도 (px)
      const logicalW = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      
      // 3. 스케일 비율 = (렌더링된 너비) / (논리 너비)
      let scaleX = rect.width / logicalW;
      
      // 안전장치: 0 나누기 방지
      if (!scaleX || scaleX === 0) scaleX = 1;

      // 4. 변환: (마우스위치 - 캔버스시작점) / 스케일
      const mx = (e.clientX - rect.left) / scaleX;
      const my = (e.clientY - rect.top) / scaleX;
      
      return { mx, my };
    },

    boxStyle(box) {
      const isSelected = (this.selectedBoxId === box.id);
      return {
        position: 'absolute',
        // 좌표 계산 오류 방지를 위해 Number() 강제 변환
        left: (Number(box.x) || 0) + 'px',
        top: (Number(box.y) || 0) + 'px',
        width: (Number(box.w) || 0) + 'px',
        height: (Number(box.h) || 0) + 'px',
        border: `2px solid ${box.color || '#fff'}`,
        zIndex: box.zIndex || 0,
        cursor: 'move',
        boxShadow: isSelected ? '0 0 0 1px #fff, 0 0 10px rgba(0,0,0,0.5)' : 'none',
        backgroundColor: box.layerBgColor || 'transparent'
      };
    },

    // [레이블] 박스 내부 하단(bottom: 0)에 표시
    // 정보 출처: box.layerName (또는 type)
    labelChipStyle(box) {
      return {
        position: 'absolute',
        bottom: '0', 
        left: '0',
        backgroundColor: box.color || '#333',
        color: '#fff',
        padding: '2px 4px',
        fontSize: '12px',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        pointerEvents: 'none'
      };
    },

    // 핸들 스타일 (감지 영역 24px)
    handleStyle(pos) {
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
      if (pos === 't')  { style.top = offset + 'px'; style.left = '50%'; style.marginLeft = offset + 'px'; style.cursor = 'ns-resize'; }
      if (pos === 'tr') { style.top = offset + 'px'; style.right = offset + 'px'; style.cursor = 'nesw-resize'; }
      if (pos === 'l')  { style.top = '50%'; style.marginTop = offset + 'px'; style.left = offset + 'px'; style.cursor = 'ew-resize'; }
      if (pos === 'r')  { style.top = '50%'; style.marginTop = offset + 'px'; style.right = offset + 'px'; style.cursor = 'ew-resize'; }
      if (pos === 'bl') { style.bottom = offset + 'px'; style.left = offset + 'px'; style.cursor = 'nesw-resize'; }
      if (pos === 'b')  { style.bottom = offset + 'px'; style.left = '50%'; style.marginLeft = offset + 'px'; style.cursor = 'ns-resize'; }
      if (pos === 'br') { style.bottom = offset + 'px'; style.right = offset + 'px'; style.cursor = 'nwse-resize'; }
      
      return style;
    },

    onBoxContextMenu(e, box) {
      e.preventDefault();
      this.$emit('context-menu', e, box.id);
    },

    onBoxMouseDown(e, box) {
      if (e.target.classList.contains('box-handle')) return;
      e.preventDefault();
      this.$emit('select-box', box.id);
      const { mx, my } = this.clientToCanvas(e);
      this.startDrag('move', box, mx, my);
    },

    onHandleMouseDown(e, box, handle) {
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
      
      // 초기 상태 저장 (숫자로 변환하여 저장)
      this.dragStartBox = { 
        x0: Number(box.x) || 0, 
        y0: Number(box.y) || 0, 
        w0: Number(box.w) || 0, 
        h0: Number(box.h) || 0 
      };

      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);
    },

    onWindowMouseMove(e) {
      if (!this.dragging) return;

      const { mx, my } = this.clientToCanvas(e);
      // 논리 좌표 기준 이동 거리
      const dx = mx - this.dragStartMouse.mx;
      const dy = my - this.dragStartMouse.my;
      
      const { x0, y0, w0, h0 } = this.dragStartBox;
      let x = x0, y = y0, w = w0, h = h0;

      const cw = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;

      if (this.dragMode === 'move') {
        x += dx;
        y += dy;
        
        // Clamping: 캔버스 밖으로 못 나가게 제한
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + w > cw) x = cw - w;
        if (y + h > ch) y = ch - h;

      } else if (this.dragMode === 'resize') {
        const hdl = this.dragHandle;
        
        // 가로 방향
        if (hdl.includes('l')) { 
          let newX = x + dx;
          if (newX < 0) newX = 0;
          const rightEdge = x0 + w0;
          let newW = rightEdge - newX;
          x = newX;
          w = newW;
        } else if (hdl.includes('r')) {
          w += dx;
          if (x + w > cw) w = cw - x;
        }

        // 세로 방향
        if (hdl.includes('t')) {
          let newY = y + dy;
          if (newY < 0) newY = 0;
          const bottomEdge = y0 + h0;
          let newH = bottomEdge - newY;
          y = newY;
          h = newH;
        } else if (hdl.includes('b')) {
          h += dy;
          if (y + h > ch) h = ch - y;
        }
      }

      // 최소 크기 제한
      if (w < 10) w = 10;
      if (h < 10) h = 10;

      // 부모로 업데이트 이벤트 발송
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
        @contextmenu="onBoxContextMenu($event, box)"
        data-action="js:selectCanvasBox"
      >
        <div class="canvas-label-chip" :style="labelChipStyle(box)">
          {{ box.layerName || box.type || 'Layer' }}
        </div>

        <template v-if="selectedBoxId === box.id">
          <div class="box-handle" :style="handleStyle('tl')" @mousedown="onHandleMouseDown($event, box, 'tl')"></div>
          <div class="box-handle" :style="handleStyle('t')"  @mousedown="onHandleMouseDown($event, box, 't')"></div>
          <div class="box-handle" :style="handleStyle('tr')" @mousedown="onHandleMouseDown($event, box, 'tr')"></div>
          <div class="box-handle" :style="handleStyle('l')"  @mousedown="onHandleMouseDown($event, box, 'l')"></div>
          <div class="box-handle" :style="handleStyle('r')"  @mousedown="onHandleMouseDown($event, box, 'r')"></div>
          <div class="box-handle" :style="handleStyle('bl')" @mousedown="onHandleMouseDown($event, box, 'bl')"></div>
          <div class="box-handle" :style="handleStyle('b')"  @mousedown="onHandleMouseDown($event, box, 'b')"></div>
          <div class="box-handle" :style="handleStyle('br')" @mousedown="onHandleMouseDown($event, box, 'br')"></div>
        </template>
      </div>
    </div>
  `
};

window.PreviewCanvas = PreviewCanvas;
