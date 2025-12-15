import Vue from 'vue';

export default {
  name: 'PreviewCanvas',

  props: {
    /**
     * 박스 목록 (수정됨: boxes -> canvasBoxes)
     * 부모 컴포넌트(app-root.js)에서 :canvas-boxes="..." 로 전달하므로
     * 이름을 반드시 canvasBoxes 로 맞춰야 데이터가 수신됨.
     */
    canvasBoxes: {
      type: Array,
      required: true
    },

    /**
     * 캔버스 크기(px 기준)
     * { w, h }
     */
    canvasSize: {
      type: Object,
      required: false,
      default: () => ({ w: 1920, h: 1080 })
    },

    /**
     * 선택된 박스 ID
     */
    selectedBoxId: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      // 드래그/리사이즈 상태
      dragging: false,
      dragMode: null,        // 'move' | 'resize' | null
      dragHandle: null,      // 'tl' | 'tr' | 'bl' | 'br' | null
      dragBoxId: null,

      // 드래그 시작 시 마우스 좌표(canvas px)
      dragStartMouse: {
        mx: 0,
        my: 0
      },

      // 드래그 시작 시 박스 상태
      dragStartBox: {
        x0: 0,
        y0: 0,
        w0: 0,
        h0: 0,
        right0: 0,
        bottom0: 0
      },

      // 드래그 시점의 캔버스 크기
      dragCanvasSize: {
        cw: 0,
        ch: 0
      }
    };
  },

  computed: {
    /**
     * 캔버스 스케일러 스타일
     */
    scalerStyle() {
      const cw = this.canvasSize?.w || 1920;
      const ch = this.canvasSize?.h || 1080;

      return {
        position: 'relative',
        width: cw + 'px',
        height: ch + 'px',
        overflow: 'visible' // 핸들이 박스 밖으로 나갈 수 있으므로 visible
      };
    }
  },

  methods: {
    /**
     * 브라우저 client 좌표 -> 캔버스 좌표 (composition px)
     */
    clientToCanvas(e) {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler) {
        return {
          mx: 0,
          my: 0,
          cw: this.canvasSize?.w || 1920,
          ch: this.canvasSize?.h || 1080
        };
      }

      const rect = scaler.getBoundingClientRect();
      const cw = this.canvasSize?.w || 1920;
      const ch = this.canvasSize?.h || 1080;

      // 화면상 렌더링된 크기(rect.width) 대 논리 크기(cw) 비
      const scaleX = rect.width / cw;
      // 0이나 무한대 방지
      const scale = (!Number.isFinite(scaleX) || scaleX <= 0) ? 1 : scaleX;

      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;

      return { mx, my, cw, ch };
    },

    /**
     * 박스 스타일 (px 기준)
     */
    boxStyle(box) {
      const x = box.x || 0;
      const y = box.y || 0;
      const w = box.w || 0;
      const h = box.h || 0;
      const z = box.zIndex || 0;
      
      const borderColor = box.color || '#ffffff';
      const isSelected = (this.selectedBoxId === box.id);

      return {
        position: 'absolute',
        left: x + 'px',
        top: y + 'px',
        width: w + 'px',
        height: h + 'px',
        boxSizing: 'border-box',
        border: `2px solid ${borderColor}`,
        zIndex: z,
        cursor: 'move',
        // 선택된 경우 강조 그림자
        boxShadow: isSelected 
            ? '0 0 0 1px #fff, 0 0 10px rgba(0,0,0,0.5)' 
            : 'none',
        // 텍스트 레이어인 경우 배경색 처리 (선택적으로)
        backgroundColor: box.layerBgColor || 'transparent' 
      };
    },

    /**
     * 라벨 칩 스타일
     */
    labelChipStyle(box) {
      return {
        position: 'absolute',
        bottom: '0',
        left: '0',
        backgroundColor: box.color || '#333',
        color: '#fff',
        padding: '2px 4px',
        fontSize: '10px',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      };
    },

    /**
     * 박스 본체 드래그 시작 (이동)
     */
    onBoxMouseDown(e, box) {
      e.preventDefault();

      const { mx, my, cw, ch } = this.clientToCanvas(e);

      this.dragging = true;
      this.dragMode = 'move';
      this.dragHandle = null;
      this.dragBoxId = box.id;

      const x0 = box.x || 0;
      const y0 = box.y || 0;
      const w0 = box.w || 0;
      const h0 = box.h || 0;
      const right0 = x0 + w0;
      const bottom0 = y0 + h0;

      this.dragStartMouse = { mx, my };
      this.dragStartBox = { x0, y0, w0, h0, right0, bottom0 };
      this.dragCanvasSize = { cw, ch };

      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);

      // 선택 이벤트 발생
      this.$emit('select-box', box.id);
    },

    /**
     * 리사이즈 핸들 드래그 시작
     */
    onHandleMouseDown(e, box, handle) {
      e.preventDefault();
      e.stopPropagation();

      const { mx, my, cw, ch } = this.clientToCanvas(e);

      this.dragging = true;
      this.dragMode = 'resize';
      this.dragHandle = handle;
      this.dragBoxId = box.id;

      const x0 = box.x || 0;
      const y0 = box.y || 0;
      const w0 = box.w || 0;
      const h0 = box.h || 0;
      const right0 = x0 + w0;
      const bottom0 = y0 + h0;

      this.dragStartMouse = { mx, my };
      this.dragStartBox = { x0, y0, w0, h0, right0, bottom0 };
      this.dragCanvasSize = { cw, ch };

      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);

      this.$emit('select-box', box.id);
    },

    /**
     * 전역 mousemove 핸들러
     */
    onWindowMouseMove(e) {
      if (!this.dragging || !this.dragBoxId) return;

      const { mx, my } = this.clientToCanvas(e);
      const { x0, y0, w0, h0, right0, bottom0 } = this.dragStartBox;
      const { cw, ch } = this.dragCanvasSize;

      let x = x0;
      let y = y0;
      let w = w0;
      let h = h0;

      const minW = 20;
      const minH = 20;

      if (this.dragMode === 'move') {
        const dx = mx - this.dragStartMouse.mx;
        const dy = my - this.dragStartMouse.my;

        x = x0 + dx;
        y = y0 + dy;
        w = w0;
        h = h0;
      } else if (this.dragMode === 'resize') {
        const handle = this.dragHandle;

        if (handle === 'br') {
          const rawW = mx - x0;
          const rawH = my - y0;
          w = Math.max(minW, rawW);
          h = Math.max(minH, rawH);
          x = x0;
          y = y0;
        } else if (handle === 'tl') {
          const rawW = right0 - mx;
          const rawH = bottom0 - my;
          w = Math.max(minW, rawW);
          h = Math.max(minH, rawH);
          x = right0 - w;
          y = bottom0 - h;
        } else if (handle === 'tr') {
          const rawW = mx - x0;
          const rawH = bottom0 - my;
          w = Math.max(minW, rawW);
          h = Math.max(minH, rawH);
          x = x0;
          y = bottom0 - h;
        } else if (handle === 'bl') {
          const rawW = right0 - mx;
          const rawH = my - y0;
          w = Math.max(minW, rawW);
          h = Math.max(minH, rawH);
          x = right0 - w;
          y = y0;
        }
      }

      // 부모(AppRoot)의 updateBoxPosition에 px 값 전달
      if (this.$parent && typeof this.$parent.updateBoxPosition === 'function') {
        // null을 전달하면 내부에서 nx, ny 등을 자동 재계산
        this.$parent.updateBoxPosition(this.dragBoxId, x, y, w, h, null);
      }
    },

    /**
     * 전역 mouseup 핸들러
     */
    onWindowMouseUp() {
      this.dragging = false;
      this.dragMode = null;
      this.dragHandle = null;
      this.dragBoxId = null;

      window.removeEventListener('mousemove', this.onWindowMouseMove);
      window.removeEventListener('mouseup', this.onWindowMouseUp);
    }
  },

  beforeDestroy() {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  },

  render(h) {
    const boxes = this.canvasBoxes || [];

    return h(
      'div',
      {
        attrs: { id: 'preview-canvas-scaler' },
        style: this.scalerStyle
      },
      boxes.map(box =>
        h(
          'div',
          {
            key: box.id,
            class: ['canvas-box'],
            attrs: { 
              id: 'preview-canvas-box-' + box.id,
              'data-action': 'js:selectCanvasBox' 
            },
            style: this.boxStyle(box),
            on: {
              mousedown: (e) => this.onBoxMouseDown(e, box)
            }
          },
          [
            // 라벨 칩
            h(
              'div',
              {
                class: ['canvas-label-chip'],
                style: this.labelChipStyle(box)
              },
              box.layerName || box.type || 'Layer'
            ),

            // 선택된 경우에만 리사이즈 핸들 표시
            (this.selectedBoxId === box.id) && h('div', {
              class: ['box-handle', 'bh-tl'],
              on: { mousedown: (e) => this.onHandleMouseDown(e, box, 'tl') }
            }),
            (this.selectedBoxId === box.id) && h('div', {
              class: ['box-handle', 'bh-tr'],
              on: { mousedown: (e) => this.onHandleMouseDown(e, box, 'tr') }
            }),
            (this.selectedBoxId === box.id) && h('div', {
              class: ['box-handle', 'bh-bl'],
              on: { mousedown: (e) => this.onHandleMouseDown(e, box, 'bl') }
            }),
            (this.selectedBoxId === box.id) && h('div', {
              class: ['box-handle', 'bh-br'],
              on: { mousedown: (e) => this.onHandleMouseDown(e, box, 'br') }
            })
          ].filter(Boolean)
        )
      )
    );
  }
};

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.component('PreviewCanvas', module.exports.default);
}
