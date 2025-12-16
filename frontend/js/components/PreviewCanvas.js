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
      // 외곽선 접촉 플래시 상태 (각 면별)
      edgeFlash: {
        top: false,
        bottom: false,
        left: false,
        right: false
      },
      // 자석 기능 활성화 (AppRoot의 isMagnet과 연동 가능)
      magnetEnabled: true,
      // 자석 스냅 거리 (논리 좌표 기준)
      snapDistance: 15
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
     */
    canvasFontSize() {
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const size = Math.round(ch * 0.03);
      return Math.max(24, Math.min(48, size));
    },

    /**
     * 자석 활성화 여부 (AppRoot와 연동)
     */
    isMagnetActive() {
      if (this.$parent && typeof this.$parent.isMagnet === 'boolean') {
        return this.$parent.isMagnet;
      }
      return this.magnetEnabled;
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
      
      let scaleX = rect.width / logicalW;
      if (!scaleX || scaleX === 0) scaleX = 1;

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

      const rowType = box.rowType || '';
      
      if (rowType === 'EFF') {
        baseStyle.left = '0';
        baseStyle.right = 'auto';
        baseStyle.transform = 'none';
      } else if (rowType === 'TXT') {
        baseStyle.left = '50%';
        baseStyle.right = 'auto';
        baseStyle.transform = 'translateX(-50%)';
      } else if (rowType === 'BG') {
        baseStyle.left = 'auto';
        baseStyle.right = '0';
        baseStyle.transform = 'none';
      } else {
        baseStyle.left = '0';
        baseStyle.right = 'auto';
        baseStyle.transform = 'none';
      }

      return baseStyle;
    },

    /**
     * 레이어 레이블 텍스트 생성
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
     * 리사이즈 핸들 스타일
     */
    handleStyle(pos) {
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
     */
    onBoxContextMenu(e, box) {
      e.preventDefault();
      e.stopPropagation();
      
      this.$emit('select-box', box.id);
      
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
      // 플래시 요소 숨기기
      this.hideAllEdgeFlash();

      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);
    },

    /**
     * 배경(BG) 레이어의 허용 영역 계산
     * - high(상단): 0 ~ ch/3
     * - mid(중단): ch/3 ~ ch*2/3
     * - low(하단): ch*2/3 ~ ch
     */
    getBgAllowedRegion(colRole) {
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const third = ch / 3;

      if (colRole === 'high') {
        return { minY: 0, maxY: third };
      } else if (colRole === 'mid') {
        return { minY: third, maxY: third * 2 };
      } else if (colRole === 'low') {
        return { minY: third * 2, maxY: ch };
      }
      // full 또는 기타: 전체 영역
      return { minY: 0, maxY: ch };
    },

    /**
     * 배경(BG) 레이어 충돌 방지 적용
     */
    applyBgConstraints(box, x, y, w, h) {
      if (box.rowType !== 'BG') {
        return { x, y, w, h };
      }

      const colRole = box.colRole || 'full';
      const region = this.getBgAllowedRegion(colRole);
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;

      let newY = y;
      let newH = h;

      // 상단 경계 제한
      if (newY < region.minY) {
        newY = region.minY;
      }

      // 하단 경계 제한
      if (newY + newH > region.maxY) {
        // 높이를 줄이거나 위치를 조정
        if (newH > (region.maxY - region.minY)) {
          newH = region.maxY - region.minY;
          newY = region.minY;
        } else {
          newY = region.maxY - newH;
        }
      }

      return { x, y: newY, w, h: newH };
    },

    /**
     * 자석 스냅 계산
     * - 캔버스 외곽선, 중앙선, 다른 레이어 경계에 스냅
     */
    applyMagnetSnap(currentBoxId, x, y, w, h) {
      if (!this.isMagnetActive) {
        return { x, y, w, h, snappedX: false, snappedY: false };
      }

      const cw = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const snapDist = this.snapDistance;

      let newX = x;
      let newY = y;
      let snappedX = false;
      let snappedY = false;

      // 스냅 타겟 라인들 수집
      const xLines = [0, cw / 2, cw]; // 좌, 중앙, 우
      const yLines = [0, ch / 2, ch]; // 상, 중앙, 하

      // 다른 레이어의 경계선 추가
      if (this.canvasBoxes && Array.isArray(this.canvasBoxes)) {
        this.canvasBoxes.forEach(box => {
          if (box.id === currentBoxId) return;
          const bx = Number(box.x) || 0;
          const by = Number(box.y) || 0;
          const bw = Number(box.w) || 0;
          const bh = Number(box.h) || 0;

          // X 라인: 왼쪽, 오른쪽, 중앙
          xLines.push(bx);           // 좌측
          xLines.push(bx + bw);      // 우측
          xLines.push(bx + bw / 2);  // 중앙

          // Y 라인: 상단, 하단, 중앙
          yLines.push(by);           // 상단
          yLines.push(by + bh);      // 하단
          yLines.push(by + bh / 2);  // 중앙
        });
      }

      // 현재 박스의 주요 포인트
      const boxLeft = x;
      const boxRight = x + w;
      const boxCenterX = x + w / 2;
      const boxTop = y;
      const boxBottom = y + h;
      const boxCenterY = y + h / 2;

      // X축 스냅 (좌측, 우측, 중앙)
      for (const line of xLines) {
        // 좌측 스냅
        if (Math.abs(boxLeft - line) < snapDist) {
          newX = line;
          snappedX = true;
          break;
        }
        // 우측 스냅
        if (Math.abs(boxRight - line) < snapDist) {
          newX = line - w;
          snappedX = true;
          break;
        }
        // 중앙 스냅
        if (Math.abs(boxCenterX - line) < snapDist) {
          newX = line - w / 2;
          snappedX = true;
          break;
        }
      }

      // Y축 스냅 (상단, 하단, 중앙)
      for (const line of yLines) {
        // 상단 스냅
        if (Math.abs(boxTop - line) < snapDist) {
          newY = line;
          snappedY = true;
          break;
        }
        // 하단 스냅
        if (Math.abs(boxBottom - line) < snapDist) {
          newY = line - h;
          snappedY = true;
          break;
        }
        // 중앙 스냅
        if (Math.abs(boxCenterY - line) < snapDist) {
          newY = line - h / 2;
          snappedY = true;
          break;
        }
      }

      return { x: newX, y: newY, w, h, snappedX, snappedY };
    },

    /**
     * 외곽선 접촉 감지 및 플래시 트리거 (면별 개별 플래시)
     */
    checkEdgeContact(x, y, w, h) {
      const cw = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const threshold = 2;

      const touchTop = y <= threshold;
      const touchLeft = x <= threshold;
      const touchBottom = (y + h) >= (ch - threshold);
      const touchRight = (x + w) >= (cw - threshold);

      // 새로 접촉한 경우에만 해당 면 플래시
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

      // 접촉 해제 시 해당 면 플래시 숨기기
      if (!touchTop && this.edgeFlash.top) {
        this.hideEdgeFlash('top');
      }
      if (!touchBottom && this.edgeFlash.bottom) {
        this.hideEdgeFlash('bottom');
      }
      if (!touchLeft && this.edgeFlash.left) {
        this.hideEdgeFlash('left');
      }
      if (!touchRight && this.edgeFlash.right) {
        this.hideEdgeFlash('right');
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
     * 배경(BG) 레이어의 영역 경계 접촉 감지
     */
    checkBgRegionContact(box, x, y, w, h) {
      if (box.rowType !== 'BG') return;

      const colRole = box.colRole || 'full';
      if (colRole === 'full') return;

      const region = this.getBgAllowedRegion(colRole);
      const threshold = 2;

      const touchRegionTop = Math.abs(y - region.minY) <= threshold;
      const touchRegionBottom = Math.abs((y + h) - region.maxY) <= threshold;

      if (touchRegionTop) {
        this.triggerEdgeFlash('top');
      }
      if (touchRegionBottom) {
        this.triggerEdgeFlash('bottom');
      }
    },

    /**
     * 특정 면에 플래시 효과 표시
     */
    triggerEdgeFlash(direction) {
      const flashEl = document.getElementById(`preview-edge-flash-${direction}`);
      if (flashEl) {
        flashEl.classList.add('active');
        // 0.5초 후 자동 제거
        setTimeout(() => {
          flashEl.classList.remove('active');
        }, 500);
      }
    },

    /**
     * 특정 면 플래시 숨기기
     */
    hideEdgeFlash(direction) {
      const flashEl = document.getElementById(`preview-edge-flash-${direction}`);
      if (flashEl) {
        flashEl.classList.remove('active');
      }
    },

    /**
     * 모든 면 플래시 숨기기
     */
    hideAllEdgeFlash() {
      ['top', 'bottom', 'left', 'right'].forEach(dir => {
        this.hideEdgeFlash(dir);
      });
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

      // 현재 드래그 중인 박스 찾기
      const currentBox = this.canvasBoxes.find(b => b.id === this.dragBoxId);

      if (this.dragMode === 'move') {
        x += dx;
        y += dy;
        
        // 캔버스 경계 제한
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + w > cw) x = cw - w;
        if (y + h > ch) y = ch - h;

        // 자석 스냅 적용
        const snapped = this.applyMagnetSnap(this.dragBoxId, x, y, w, h);
        x = snapped.x;
        y = snapped.y;

        // 배경(BG) 레이어 영역 제한
        if (currentBox) {
          const constrained = this.applyBgConstraints(currentBox, x, y, w, h);
          x = constrained.x;
          y = constrained.y;
          w = constrained.w;
          h = constrained.h;
        }

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

        // 배경(BG) 레이어 영역 제한
        if (currentBox) {
          const constrained = this.applyBgConstraints(currentBox, x, y, w, h);
          x = constrained.x;
          y = constrained.y;
          w = constrained.w;
          h = constrained.h;
        }
      }

      // 최소 크기 제한 (10px)
      if (w < 10) w = 10;
      if (h < 10) h = 10;

      // 외곽선 접촉 감지 및 플래시
      this.checkEdgeContact(x, y, w, h);

      // 배경 레이어 영역 경계 접촉 감지
      if (currentBox) {
        this.checkBgRegionContact(currentBox, x, y, w, h);
      }

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
      this.hideAllEdgeFlash();
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
      <!-- 면별 플래시 오버레이 -->
      <div id="preview-edge-flash-top" class="edge-flash-overlay edge-flash-top"></div>
      <div id="preview-edge-flash-bottom" class="edge-flash-overlay edge-flash-bottom"></div>
      <div id="preview-edge-flash-left" class="edge-flash-overlay edge-flash-left"></div>
      <div id="preview-edge-flash-right" class="edge-flash-overlay edge-flash-right"></div>

      <!-- 레이어 박스들 -->
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
