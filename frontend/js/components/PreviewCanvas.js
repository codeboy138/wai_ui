import Vue from 'vue';

export default {
  name: 'PreviewCanvas',

  props: {
    /**
     * 박스 목록
     * 각 박스: { id, x, y, w, h, nx, ny, nw, nh, label, ... }
     */
    boxes: {
      type: Array,
      required: true
    },

    /**
     * 캔버스 크기(px 기준)
     * { w, h }
     */
    canvasSize: {
      type: Object,
      required: true
    },

    /**
     * 선택된 박스 ID (선택 표시 등에 사용할 수 있음)
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

      // 드래그 시작 시 마우스 좌표(canvas-px)
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
     * (canvasSize 기준으로 비율 맞출 수 있게 hook 제공)
     */
    scalerStyle() {
      const cw = this.canvasSize?.w || 1;
      const ch = this.canvasSize?.h || 1;

      return {
        position: 'relative',
        width: cw + 'px',
        height: ch + 'px',
        overflow: 'hidden'
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
        return { mx: 0, my: 0, cw: this.canvasSize?.w || 1, ch: this.canvasSize?.h || 1 };
      }

      const rect = scaler.getBoundingClientRect();
      const cw = this.canvasSize?.w || rect.width || 1;
      const ch = this.canvasSize?.h || rect.height || 1;

      const scaleX = rect.width / cw;
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

      return {
        position: 'absolute',
        left: x + 'px',
        top: y + 'px',
        width: w + 'px',
        height: h + 'px',
        boxSizing: 'border-box'
      };
    },

    /**
     * 라벨 칩 스타일 (박스 너비 기준, ellipsis 처리)
     */
    labelChipStyle(box) {
      const paddingX = 8;
      const w = box.w || 0;
      const maxWidthPx = Math.max(0, w - paddingX * 2);

      const canvasH = this.canvasSize?.h || 1080;
      const baseFont = 12;
      const scale = canvasH ? canvasH / 1080 : 1;
      const fontSize = Math.max(10, Math.round(baseFont * scale));

      return {
        maxWidth: maxWidthPx + 'px',
        fontSize: fontSize + 'px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      };
    },

    /**
     * 박스 본체를 드래그해서 이동 시작
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

      // 선택 이벤트 (부모가 사용하면 됨)
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
     * - 이동 / 리사이즈 모두 여기서 처리
     * - px 기준으로 계산 후, 부모에 그대로 전달
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

        // 캔버스 경계 클램프
        if (cw) {
          w = Math.max(minW, Math.min(w, cw));
          x = Math.max(0, Math.min(x, cw - w));
        }
        if (ch) {
          h = Math.max(minH, Math.min(h, ch));
          y = Math.max(0, Math.min(y, ch - h));
        }
      } else if (this.dragMode === 'resize') {
        const handle = this.dragHandle;

        // === 리사이즈: 각 핸들별 앵커 기준 계산 ===
        if (handle === 'br') {
          // 좌상단 (x0, y0) 고정, 우하단을 마우스에 맞춤
          const rawW = mx - x0;
          const rawH = my - y0;

          w = Math.max(minW, rawW);
          h = Math.max(minH, rawH);

          x = x0;
          y = y0;
        } else if (handle === 'tl') {
          // 우하단 (right0, bottom0) 고정
          const rawW = right0 - mx;
          const rawH = bottom0 - my;

          w = Math.max(minW, rawW);
          h = Math.max(minH, rawH);

          x = right0 - w;
          y = bottom0 - h;
        } else if (handle === 'tr') {
          // 좌하단 (x0, bottom0) 고정
          const rawW = mx - x0;
          const rawH = bottom0 - my;

          w = Math.max(minW, rawW);
          h = Math.max(minH, rawH);

          x = x0;
          y = bottom0 - h;
        } else if (handle === 'bl') {
          // 우상단 (right0, y0) 고정
          const rawW = right0 - mx;
          const rawH = my - y0;

          w = Math.max(minW, rawW);
          h = Math.max(minH, rawH);

          x = right0 - w;
          y = y0;
        }

        // 캔버스 경계 클램프
        if (cw && ch) {
          w = Math.max(minW, Math.min(w, cw));
          h = Math.max(minH, Math.min(h, ch));
          x = Math.max(0, Math.min(x, cw - w));
          y = Math.max(0, Math.min(y, ch - h));
        }
      }

      // 부모(AppRoot)에 px 값 그대로 전달
      // 시그니처: (id, x, y, w, h, optNorm)
      this.$emit('update-box-position', this.dragBoxId, x, y, w, h, null);
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
    const boxes = this.boxes || [];

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
            attrs: { id: 'preview-canvas-box-' + box.id },
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
              box.label || ''
            ),

            // 리사이즈 핸들들
            h('div', {
              class: ['box-handle', 'box-handle-tl'],
              on: {
                mousedown: (e) => this.onHandleMouseDown(e, box, 'tl')
              }
            }),
            h('div', {
              class: ['box-handle', 'box-handle-tr'],
              on: {
                mousedown: (e) => this.onHandleMouseDown(e, box, 'tr')
              }
            }),
            h('div', {
              class: ['box-handle', 'box-handle-bl'],
              on: {
                mousedown: (e) => this.onHandleMouseDown(e, box, 'bl')
              }
            }),
            h('div', {
              class: ['box-handle', 'box-handle-br'],
              on: {
                mousedown: (e) => this.onHandleMouseDown(e, box, 'br')
              }
            })
          ]
        )
      )
    );
  }
};

Vue.component('PreviewCanvas', module.exports ? module.exports.default || module.exports : exports.default || exports);
