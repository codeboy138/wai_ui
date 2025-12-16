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
    },

    /**
     * 캔버스 내 텍스트 크기 기준값
     * - 논리 캔버스 높이 기준 약 3% (1080px 기준 약 32px)
     * - 화면에서 축소되어도 읽을 수 있는 크기
     */
    canvasFontSize() {
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      // 캔버스 높이의 3% (최소 24px, 최대 48px)
      const size = Math.round(ch * 0.03);
      return Math.max(24, Math.min(48, size));
    }
  },

  methods: {
    /**
     * 화면 좌표 -> 캔버스 논리 좌표 변환 (스케일 보정)
     */
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

    /**
     * 박스 스타일 (위치, 크기, 테두리, 선택 상태)
     */
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
     * - 폰트 크기: 논리 캔버스 기준 (canvasFontSize)
     * - 위치: rowType에 따라 다름
     *   - EFF(효과): 좌측 (left: 0)
     *   - TXT(텍스트): 중앙 (left: 50%, transform: translateX(-50%))
     *   - BG(배경): 우측 (right: 0)
     */
    labelStyle(box) {
      const fontSize = this.canvasFontSize;
      const padding = Math.round(fontSize * 0.2);
      
      const baseStyle = {
        position: 'absolute',
        bottom: '0',
        backgroundColor: box.color || '#333',
        color: '#fff',
        padding: `${padding}px ${padding * 2}px`,
        fontSize: fontSize + 'px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '40%',
        pointerEvents: 'none',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        borderRadius: `${Math.round(fontSize * 0.15)}px ${Math.round(fontSize * 0.15)}px 0 0`
      };

      // rowType별 위치 지정
      const rowType = box.rowType || '';
      
      if (rowType === 'EFF') {
        // 효과: 좌측
        baseStyle.left = '0';
        baseStyle.right = 'auto';
        baseStyle.transform = 'none';
      } else if (rowType === 'TXT') {
        // 텍스트: 중앙
        baseStyle.left = '50%';
        baseStyle.right = 'auto';
        baseStyle.transform = 'translateX(-50%)';
      } else if (rowType === 'BG') {
        // 배경: 우측
        baseStyle.left = 'auto';
        baseStyle.right = '0';
        baseStyle.transform = 'none';
      } else {
        // 기본: 좌측
        baseStyle.left = '0';
        baseStyle.right = 'auto';
        baseStyle.transform = 'none';
      }

      return baseStyle;
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

    /**
     * 리사이즈 핸들 스타일 (논리 캔버스 기준 크기)
     */
    handleStyle(pos) {
      // 핸들 크기도 캔버스 기준으로 설정 (높이의 약 2.5%)
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const size = Math.max(20, Math.min(40, Math.round(ch * 0.025)));
      const offset = -Math.round(size / 2);
      
      const style = {
        position: 'absolute',
        width: size + 'px',
        height: size + 'px',
        backgroundColor: '#fff', 
        border: '2px solid #000',
        zIndex: 9999,
        pointerEvents: 'auto',
        opacity: 0.9
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

    /**
     * 박스 우클릭 → 레이어 설정 모달 열기
     * - ID: preview-canvas-box-{boxId}
     * - data-action: js:openLayerConfig
     */
    onBoxContextMenu(e, box) {
      e.preventDefault();
      e.stopPropagation();
      
      // 박스 선택
      this.$emit('select-box', box.id);
      
      // 레이어 설정 모달 열기 (AppRoot의 openLayerConfig 호출)
      if (this.$parent && typeof this.$parent.openLayerConfig === 'function') {
        this.$parent.openLayerConfig(box.id);
      }
    },

    /**
     * 박스 마우스다운 (드래그 시작)
     */
    onBoxMouseDown(e, box) {
      if (e.target.classList.contains('box-handle')) return;
      e.preventDefault();
      this.$emit('select-box', box.id);
      const { mx, my } = this.clientToCanvas(e);
      this.startDrag('move', box, mx, my);
    },

    /**
     * 핸들 마우스다운 (리사이즈 시작)
     */
    onHandleMouseDown(e, box, handle) {
      e.stopPropagation();
      e.preventDefault();
      this.$emit('select-box', box.id);
      const { mx, my } = this.clientToCanvas(e);
      this.startDrag('resize', box, mx, my, handle);
    },

    /**
     * 드래그/리사이즈 시작
     */
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

    /**
     * 윈도우 마우스 이동 (드래그/리사이즈 중)
     */
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

    /**
     * 윈도우 마우스 업 (드래그/리사이즈 종료)
     */
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
        <!-- 레이어 레이블 (하단 내부, rowType별 위치) -->
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
