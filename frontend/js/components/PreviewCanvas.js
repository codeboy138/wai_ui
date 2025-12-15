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
      // 캔버스 논리 크기
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
    // --- 좌표 변환 (마우스 -> 논리 캔버스) ---
    clientToCanvas(e) {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler) {
        return { mx: 0, my: 0 };
      }
      
      const rect = scaler.getBoundingClientRect();
      const scaleX = rect.width / (this.canvasSize?.w || 1920);
      
      const mx = (e.clientX - rect.left) / scaleX;
      const my = (e.clientY - rect.top) / scaleX;
      
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

    // [복구] 레이블 하단 고정 스타일
    labelChipStyle(box) {
      return {
        position: 'absolute',
        bottom: '0',        // 하단 고정
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

    // 핸들 스타일 (감지 영역 확대: 24px)
    handleStyle(pos) {
      const size = 24; 
      const offset = -12; // 중앙 정렬 (24/2)
      
      // 시각적으로는 작게 보이게 내부 박스(옵션)를 둘 수도 있지만,
      // 여기서는 전체 영역을 핸들로 사용하고 border로 표시
      // (사용성을 위해 투명 배경에 border만 작게 그리는 방식도 가능하나, 일단 전체 표시)
      const style = {
        position: 'absolute',
        width: size + 'px',
        height: size + 'px',
        backgroundColor: '#fff', 
        border: '1px solid #000',
        zIndex: 9999,
        pointerEvents: 'auto',
        opacity: 0.8 // 살짝 투명하게
      };

      // 위치 배치
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
      // 부모(AppRoot)에 우클릭 이벤트 전달 (컨텍스트 메뉴 표시용 등)
      // 현재 AppRoot에 openCtx 메서드가 있다면 호출되도록 $emit
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

      // 캔버스 크기 (Clamping 용)
      const cw = this.canvasSize?.w || 1920;
      const ch = this.canvasSize?.h || 1080;

      if (this.dragMode === 'move') {
        x += dx;
        y += dy;
        
        // [수정] 캔버스 밖으로 못 나가게 제한 (Clamping)
        // 왼쪽/위 제한
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        // 오른쪽/아래 제한
        if (x + w > cw) x = cw - w;
        if (y + h > ch) y = ch - h;

      } else if (this.dragMode === 'resize') {
        const hdl = this.dragHandle;
        
        // 가로 리사이징
        if (hdl.includes('l')) { 
          // 왼쪽 핸들: x가 변하고 w가 반대로 변함
          let newX = x + dx;
          // 캔버스 왼쪽 경계 체크
          if (newX < 0) newX = 0;
          // 최대 너비 체크 (오른쪽 끝 고정)
          const rightEdge = x0 + w0;
          let newW = rightEdge - newX;
          
          x = newX;
          w = newW;
        } else if (hdl.includes('r')) {
          // 오른쪽 핸들: w가 변함
          w += dx;
          // 캔버스 오른쪽 경계 체크
          if (x + w > cw) w = cw - x;
        }

        // 세로 리사이징
        if (hdl.includes('t')) {
          // 위쪽 핸들: y가 변하고 h가 반대로 변함
          let newY = y + dy;
          // 캔버스 위쪽 경계 체크
          if (newY < 0) newY = 0;
          // 최대 높이 체크 (아래쪽 끝 고정)
          const bottomEdge = y0 + h0;
          let newH = bottomEdge - newY;
          
          y = newY;
          h = newH;
        } else if (hdl.includes('b')) {
          // 아래쪽 핸들: h가 변함
          h += dy;
          // 캔버스 아래쪽 경계 체크
          if (y + h > ch) h = ch - y;
        }
      }

      // 최소 크기 제한 (10px)
      if (w < 10) w = 10;
      if (h < 10) h = 10;

      // 부모 컴포넌트에 업데이트 요청 (null을 주면 내부에서 % 좌표도 자동 갱신됨)
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
        <!-- [복구] 레이블 (박스 하단 고정) -->
        <div class="canvas-label-chip" :style="labelChipStyle(box)">
          {{ box.layerName || box.type || 'Layer' }}
        </div>

        <!-- 리사이즈 핸들 (선택 시만) -->
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
