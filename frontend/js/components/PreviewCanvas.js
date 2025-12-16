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
      // 외곽선 접촉 플래시 상태
      edgeFlash: {
        top: false,
        bottom: false,
        left: false,
        right: false
      }
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
    // [핵심] 화면 좌표 -> 캔버스 논리 좌표 변환 (스케일 보정)
    clientToCanvas(e) {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler) {
        return { mx: 0, my: 0 };
      }
      
      const rect = scaler.getBoundingClientRect();
      const logicalW = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      
      // 스케일 = (화면상 렌더링된 너비) / (논리적 너비)
      let scaleX = rect.width / logicalW;
      if (!scaleX || scaleX === 0) scaleX = 1;

      // 변환: (현재마우스 - 캔버스시작점) / 스케일
      const mx = (e.clientX - rect.left) / scaleX;
      const my = (e.clientY - rect.top) / scaleX;
      
      return { mx, my };
    },

    boxStyle(box) {
      const isSelected = (this.selectedBoxId === box.id);
      return {
        position: 'absolute',
        left: (Number(box.x) || 0) + 'px',
        top: (Number(box.y) || 0) + 'px',
        width: (Number(box.w) || 0) + 'px',
        height: (Number(box.h) || 0) + 'px',
        border: `2px dashed ${box.color || '#fff'}`,
        zIndex: box.zIndex || 0,
        cursor: 'move',
        boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 12px rgba(59,130,246,0.5)' : 'none',
        backgroundColor: box.layerBgColor || 'transparent'
      };
    },

    /**
     * 레이어 레이블 스타일
     * - 박스 하단 내부에 표시
     * - 컬럼 색상 배경 + 흰색 텍스트
     */
    labelStyle(box) {
      return {
        position: 'absolute',
        bottom: '0',
        left: '0',
        backgroundColor: box.color || '#333',
        color: '#fff',
        padding: '2px 6px',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        pointerEvents: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        borderRadius: '2px 2px 0 0'
      };
    },

    /**
     * 레이어 레이블 텍스트 생성
     * - 형식: "layerName (rowType)" 예: "전체 (텍스트)"
     */
    getLabelText(box) {
      const name = box.layerName || box.colRole || 'Layer';
      const typeMap = {
        'EFF': '효과',
        'TXT': '텍스트',
        'BG': '배경'
      };
      const typeName = typeMap[box.rowType] || box.rowType || '';
      return typeName ? `${name} (${typeName})` : name;
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
      
      this.dragStartBox = { 
        x0: Number(box.x) || 0, 
        y0: Number(box.y) || 0, 
        w0: Number(box.w) || 0, 
        h0: Number(box.h) || 0 
      };

      // 플래시 상태 초기화
      this.edgeFlash = { top: false, bottom: false, left: false, right: false };

      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);
    },

    /**
     * 외곽선 접촉 감지 및 플래시 트리거
     * - 박스가 캔버스 경계에 닿으면 해당 방향 플래시
     */
    checkEdgeContact(x, y, w, h) {
      const cw = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const threshold = 2; // 접촉 판정 허용 오차 (px)

      const touchTop = y <= threshold;
      const touchLeft = x <= threshold;
      const touchBottom = (y + h) >= (ch - threshold);
      const touchRight = (x + w) >= (cw - threshold);

      // 새로 접촉한 경우에만 플래시 트리거
      if (touchTop && !this.edgeFlash.top) {
        this.triggerEdgeFlash('top');
      }
      if (touchBottom && !this.edgeFlash.bottom) {
        this.triggerEdgeFlash('bottom');
      }
      if (touchLeft && !this.edgeFlash.left) {
        this.triggerEdgeFlash('left');
      }
      if (touchRight && !this.edgeFlash.right) {
        this.triggerEdgeFlash('right');
      }

      // 현재 접촉 상태 업데이트
      this.edgeFlash = {
        top: touchTop,
        bottom: touchBottom,
        left: touchLeft,
        right: touchRight
      };
    },

    /**
     * 외곽선 플래시 효과 트리거
     * - 캔버스 scaler 요소에 flash 클래스 추가 후 0.5초 후 제거
     */
    triggerEdgeFlash(direction) {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler) return;

      // 플래시 클래스 추가
      scaler.classList.add('edge-flash-active');

      // 0.5초 후 제거
      setTimeout(() => {
        scaler.classList.remove('edge-flash-active');
      }, 500);
    },

    onWindowMouseMove(e) {
      if (!this.dragging) return;

      const { mx, my } = this.clientToCanvas(e);
      const dx = mx - this.dragStartMouse.mx;
      const dy = my - this.dragStartMouse.my;
      
      const { x0, y0, w0, h0 } = this.dragStartBox;
      let x = x0, y = y0, w = w0, h = h0;

      const cw = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;

      if (this.dragMode === 'move') {
        x += dx;
        y += dy;
        
        // Clamping (캔버스 내부 제한)
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + w > cw) x = cw - w;
        if (y + h > ch) y = ch - h;

      } else if (this.dragMode === 'resize') {
        const hdl = this.dragHandle;
        
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

      // 최소 크기 제한 (10px)
      if (w < 10) w = 10;
      if (h < 10) h = 10;

      // 외곽선 접촉 감지 및 플래시
      this.checkEdgeContact(x, y, w, h);

      // 부모 컴포넌트에 업데이트 요청
      if (this.$parent && typeof this.$parent.updateBoxPosition === 'function') {
        this.$parent.updateBoxPosition(this.dragBoxId, x, y, w, h, null);
      }
    },

    onWindowMouseUp() {
      this.dragging = false;
      this.dragMode = null;
      // 플래시 상태 초기화
      this.edgeFlash = { top: false, bottom: false, left: false, right: false };
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
        <!-- 레이어 레이블 (하단 내부) -->
        <div 
          class="canvas-label"
          :style="labelStyle(box)"
        >
          {{ getLabelText(box) }}
        </div>

        <!-- 리사이즈 핸들 (선택 시에만 표시) -->
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
