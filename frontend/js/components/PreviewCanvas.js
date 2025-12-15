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
        // 핸들이나 레이블이 박스 밖으로 삐져나와도 보이도록 visible
        overflow: 'visible' 
      };
    }
  },

  methods: {
    // 마우스 이벤트 -> 논리 캔버스 좌표(px) 변환 (드래그 1:1 동기화 핵심)
    clientToCanvas(e) {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler) {
        return { mx: 0, my: 0 };
      }
      
      // getBoundingClientRect()는 CSS transform(scale)이 적용된 실제 화면상 크기를 반환합니다.
      const rect = scaler.getBoundingClientRect();
      const logicalW = this.canvasSize?.w || 1920;
      
      // 화면상 1px이 논리적 캔버스에서 몇 px인지 비율 계산
      const scaleX = rect.width / logicalW;
      const s = (scaleX === 0) ? 1 : scaleX;

      // (현재 마우스 위치 - 캔버스 시작점) / 스케일 = 논리적 좌표
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
        // [수정] 박스 내부 하단 고정
        bottom: '0', 
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
        // 드래그 방해 금지
        pointerEvents: 'none',
        zIndex: 10 
      };
    },

    // 핸들 스타일
    handleStyle(pos) {
      // [수정] 모서리 감지 반경 2배 확대 (12px -> 24px)
      const size = 24; 
      const offset = -12; // 중앙 정렬 (size의 절반)
      
      const style = {
        position: 'absolute',
        width: size + 'px',
        height: size + 'px',
        backgroundColor: '#fff', 
        border: '1px solid #000',
        zIndex: 9999,
        pointerEvents: 'auto', // 핸들 클릭 가능
        opacity: 0.8 
      };

      if (pos === 'tl') { style.top = offset + 'px'; style.left = offset + 'px'; style.cursor = 'nwse-resize'; }
      if (pos === 'tr') { style.top = offset + 'px'; style.right = offset + 'px'; style.cursor = 'nesw-resize'; }
      if (pos === 'bl') { style.bottom = offset + 'px'; style.left = offset + 'px'; style.cursor = 'nesw-resize'; }
      if (pos === 'br') { style.bottom = offset + 'px'; style.right = offset + 'px'; style.cursor = 'nwse-resize'; }
      
      return style;
    },

    onBoxMouseDown(e, box) {
      // 핸들 클릭 무시
      if (e.target.classList.contains('box-handle')) return;
      
      // 좌클릭만 드래그 허용
      if (e.button !== 0) return;

      e.preventDefault();
      this.$emit('select-box', box.id);

      const { mx, my } = this.clientToCanvas(e);
      this.startDrag('move', box, mx, my);
    },

    // [수정] 우클릭 핸들러 추가
    onBoxContextMenu(e, box) {
      // 상위 컴포넌트로 이벤트 전달 (컨텍스트 메뉴 표시용)
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
      
      // 이동량 계산 (스케일 보정됨)
      const dx = mx - this.dragStartMouse.mx;
      const dy = my - this.dragStartMouse.my;
      
      const { x0, y0, w0, h0 } = this.dragStartBox;
      let x = x0, y = y0, w = w0, h = h0;

      if (this.dragMode === 'move') {
        x += dx;
        y += dy;
      } else if (this.dragMode === 'resize') {
        const hdl = this.dragHandle;
        if (hdl.includes('l')) { x += dx; w -= dx; }
        if (hdl.includes('r')) { w += dx; }
        if (hdl.includes('t')) { y += dy; h -= dy; }
        if (hdl.includes('b')) { h += dy; }
      }

      // 최소 크기 제한
      if (w < 10) w = 10;
      if (h < 10) h = 10;

      // 부모에게 업데이트 요청 (null 전달 시 퍼센트 좌표 자동 계산)
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
        <!-- 레이블 (박스 하단 고정) -->
        <div class="canvas-label-chip" :style="labelChipStyle(box)">
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
