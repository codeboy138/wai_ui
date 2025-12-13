// Preview Canvas Component (순수 JS 드래그/리사이즈 + 자석 + 플래시)

const PreviewCanvas = {
  props: ['canvasBoxes', 'selectedBoxId'],

  template: /*html*/`
    <div
      id="preview-canvas-overlay-root"
      ref="overlay"
      class="absolute inset-0 pointer-events-none"
      style="z-index: 30; overflow: visible;"
      @click="$emit('select-box', null)"
    >
      <!-- 레이어 박스들 -->
      <div
        v-for="box in visibleBoxes"
        :key="box.id"
        :id="'preview-canvas-box-' + box.id"
        class="canvas-box pointer-events-auto"
        :class="{ 'selected': selectedBoxId === box.id }"
        :style="boxStyle(box)"
        @mousedown.stop="onBoxMouseDown($event, box)"
        @mousemove.stop="onBoxHoverMove($event)"
        @contextmenu.prevent.stop="openLayerConfig(box.id, $event)"
      >
        <!-- 텍스트 레이어 내용 : 기본값 가로/세로 중앙정렬 -->
        <div
          v-if="box.rowType === 'TXT'"
          class="canvas-text-content"
          :style="textStyle(box)"
        >
          {{ textContent(box) }}
        </div>

        <!-- 모서리 시각용 핸들 -->
        <div class="box-handle bh-tl"></div>
        <div class="box-handle bh-tr"></div>
        <div class="box-handle bh-bl"></div>
        <div class="box-handle bh-br"></div>

        <!-- 레이어 라벨 (우측 변 외측 기준, 필요시 좌측으로 자동 이동) -->
        <div class="layer-label" :style="labelStyle(box)">
          <div>{{ labelLine1(box) }}</div>
          <div>{{ labelLine2(box) }}</div>
        </div>
      </div>

      <!-- 중앙 가이드 라인 -->
      <div
        v-show="showVGuide"
        :style="vGuideStyle"
        class="pointer-events-none"
      ></div>
      <div
        v-show="showHGuide"
        :style="hGuideStyle"
        class="pointer-events-none"
      ></div>
    </div>
  `,

  data() {
    return {
      dragState: null,   // 현재 드래그/리사이즈 상태
      showVGuide: false,
      showHGuide: false,
      guideTimer: null
    };
  },

  computed: {
    // 박스 목록 (숨김/undefined/null 제거)
    visibleBoxes() {
      if (!Array.isArray(this.canvasBoxes)) return [];
      return this.canvasBoxes.filter(b => b && !b.isHidden);
    },

    // 세로 중앙 가이드
    vGuideStyle() {
      const canvas = this.getCanvasSize();
      return {
        position: 'absolute',
        top: '0px',
        bottom: '0px',
        left: (canvas.w / 2) + 'px',
        width: '1px',
        backgroundColor: 'rgba(255,255,255,0.6)',
        zIndex: 2000
      };
    },
    // 가로 중앙 가이드
    hGuideStyle() {
      const canvas = this.getCanvasSize();
      return {
        position: 'absolute',
        left: '0px',
        right: '0px',
        top: (canvas.h / 2) + 'px',
        height: '1px',
        backgroundColor: 'rgba(255,255,255,0.6)',
        zIndex: 2000
      };
    }
  },

  mounted() {
    // 전역 마우스 이동/업으로 드래그 유지
    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
  },

  beforeUnmount() {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  },

  methods: {
    // 부모에서 넘겨준 캔버스 사이즈 사용
    getCanvasSize() {
      const parent = this.$parent;
      if (parent && parent.canvasSize) {
        return parent.canvasSize;
      }
      // fallback
      return { w: 1920, h: 1080 };
    },

    // 프리뷰 배율 (preview-canvas-scaler 의 transform: scale(...) 사용)
    getScale() {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler || !scaler.style.transform) return 1;
      const m = scaler.style.transform.match(/scale\(([^)]+)\)/);
      if (!m) return 1;
      const s = parseFloat(m[1]);
      return isNaN(s) ? 1 : s;
    },

    // 텍스트 내용 (직접 텍스트 → sampleText → 기본 '텍스트')
    textContent(box) {
      if (box.text != null && box.text !== '') return box.text;
      const ts = box.textStyle || {};
      if (ts.sampleText != null && ts.sampleText !== '') return ts.sampleText;
      return '텍스트';
    },

    // 레이어 박스 스타일
    boxStyle(box) {
      return {
        position: 'absolute',
        left: box.x + 'px',
        top: box.y + 'px',
        width: box.w + 'px',
        height: box.h + 'px',
        borderStyle: 'dashed',
        borderWidth: '4px', // 현재의 2배 두께
        borderColor: box.color || '#facc15',
        boxSizing: 'border-box',
        backgroundColor: box.layerBgColor || 'rgba(0,0,0,0.1)',
        zIndex: box.zIndex != null ? box.zIndex : 1
      };
    },

    // 텍스트 스타일(기본: 가로/세로 중앙정렬)
    textStyle(box) {
      const ts = box.textStyle || {};
      const hAlign = ts.hAlign || 'center';  // left / center / right
      const vAlign = ts.vAlign || 'middle';  // top / middle / bottom

      let justifyContent = 'center';
      if (hAlign === 'left') justifyContent = 'flex-start';
      else if (hAlign === 'right') justifyContent = 'flex-end';

      let alignItems = 'center';
      if (vAlign === 'top') alignItems = 'flex-start';
      else if (vAlign === 'bottom') alignItems = 'flex-end';

      return {
        position: 'absolute',
        left: '0px',
        top: '0px',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent,
        alignItems,
        textAlign: hAlign,
        padding: '8px',
        boxSizing: 'border-box',
        color: ts.fillColor || '#ffffff',
        fontFamily: ts.fontFamily || 'system-ui, sans-serif',
        fontSize: (ts.fontSize || 40) + 'px',
        lineHeight: ts.lineHeight != null ? ts.lineHeight : 1.2,
        whiteSpace: 'pre-wrap',
        // text-stroke 대신 text-shadow 다중 적용으로 자모 경계선 문제 회피
        textShadow: this.buildTextStrokeShadow(ts),
        pointerEvents: 'none'
      };
    },

    // 텍스트 외곽선 효과를 text-shadow 로 구현
    buildTextStrokeShadow(ts) {
      const w = ts.strokeWidth || 0;
      const c = ts.strokeColor || 'transparent';
      if (!w || c === 'transparent') return 'none';

      const px = w;
      const shadows = [];
      for (let dx = -px; dx <= px; dx++) {
        for (let dy = -px; dy <= px; dy++) {
          if (dx === 0 && dy === 0) continue;
          shadows.push(dx + 'px ' + dy + 'px 0 ' + c);
        }
      }
      return shadows.join(', ');
    },

    // ----- 레이블 텍스트 -----
    colLabel(box) {
      const role = box.colRole;
      if (role === 'full') return '전체';
      if (role === 'high') return '상단';
      if (role === 'mid')  return '중단';
      if (role === 'low')  return '하단';
      return '';
    },
    rowLabel(box) {
      const t = box.rowType;
      if (t === 'EFF') return '이펙트';
      if (t === 'TXT') return '텍스트';
      if (t === 'BG')  return '배경';
      return '';
    },
    labelLine1(box) {
      return this.colLabel(box);
    },
    labelLine2(box) {
      return this.rowLabel(box);
    },

    // 레이블 위치/스타일 : 우측 외측, 행 타입별(Y: 위/중간/아래), 캔버스 밖 부족하면 좌측
    labelStyle(box) {
      const baseTop = box.y;
      const baseLeft = box.x + box.w;

      let offsetY = 0;
      if (box.rowType === 'EFF') offsetY = 0;
      else if (box.rowType === 'TXT') offsetY = box.h / 2;
      else if (box.rowType === 'BG') offsetY = box.h;

      const canvas = this.getCanvasSize();
      let left = baseLeft + 8; // 기본: 우측 외측

      // 프리뷰 오른쪽을 넘어가면 좌측 외측으로 이동
      if (left + 140 > canvas.w) {
        left = box.x - 8;
      }

      const top = baseTop + offsetY;

      return {
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
        transform: 'translateY(-50%)',
        minWidth: '80px',
        maxWidth: '140px',
        padding: '4px 6px',
        borderRadius: '6px',
        // 반투명(50%) 배경: #RRGGBB80 형태
        backgroundColor: (box.color || '#facc15') + '80',
        color: '#000000',
        fontSize: '50px',     // 레이블 폰트크기 50
        fontWeight: '700',
        lineHeight: 1.1,
        textAlign: 'center',
        zIndex: 1000,         // 프리뷰 패널보다 위 레이어
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      };
    },

    // ----- 커서 모양 (리사이즈 영역 감지) -----
    onBoxHoverMove(event) {
      if (this.dragState && this.dragState.mode) return;

      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const edge = 6;

      const nearLeft = x <= edge;
      const nearRight = x >= rect.width - edge;
      const nearTop = y <= edge;
      const nearBottom = y >= rect.height - edge;

      let cursor = 'move';
      if ((nearLeft && nearTop) || (nearRight && nearBottom)) {
        cursor = 'nwse-resize';
      } else if ((nearRight && nearTop) || (nearLeft && nearBottom)) {
        cursor = 'nesw-resize';
      } else if (nearLeft || nearRight) {
        cursor = 'ew-resize';
      } else if (nearTop || nearBottom) {
        cursor = 'ns-resize';
      }

      el.style.cursor = cursor;
    },

    // ----- 박스 마우스다운: 드래그 or 리사이즈 시작 -----
    onBoxMouseDown(event, box) {
      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const edge = 6;

      const nearLeft = x <= edge;
      const nearRight = x >= rect.width - edge;
      const nearTop = y <= edge;
      const nearBottom = y >= rect.height - edge;

      let mode = 'move';
      if (nearLeft || nearRight || nearTop || nearBottom) {
        mode = 'resize';
      }

      this.dragState = {
        boxId: box.id,
        mode: mode,
        edges: {
          left: nearLeft,
          right: nearRight,
          top: nearTop,
          bottom: nearBottom
        },
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: box.x,
        startY: box.y,
        startW: box.w,
        startH: box.h,
        dx: 0,
        dy: 0,
        dW: 0,
        dH: 0,
        scale: this.getScale(),
        el: el
      };

      this.$emit('select-box', box.id);
      document.body.style.userSelect = 'none';
    },

    // 전역 mousemove : 드래그/리사이즈 진행
    onWindowMouseMove(event) {
      const s = this.dragState;
      if (!s) return;

      const scale = s.scale || 1;
      const dx = (event.clientX - s.startClientX) / scale;
      const dy = (event.clientY - s.startClientY) / scale;

      s.dx = dx;
      s.dy = dy;

      if (s.mode === 'move') {
        // 시각적으로만 translate, 실제 좌표는 mouseup 시 갱신
        s.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';

        const box = this.findBoxById(s.boxId);
        if (box) {
          const newX = s.startX + dx;
          const newY = s.startY + dy;
          this.updateCenterGuides(newX, newY, box.w, box.h);
        }
      } else if (s.mode === 'resize') {
        let newX = s.startX;
        let newY = s.startY;
        let newW = s.startW;
        let newH = s.startH;

        if (s.edges.right) {
          newW = s.startW + dx;
        }
        if (s.edges.left) {
          newX = s.startX + dx;
          newW = s.startW - dx;
        }
        if (s.edges.bottom) {
          newH = s.startH + dy;
        }
        if (s.edges.top) {
          newY = s.startY + dy;
          newH = s.startH - dy;
        }

        const minSize = 20;
        if (newW < minSize) {
          newX -= (minSize - newW);
          newW = minSize;
        }
        if (newH < minSize) {
          newY -= (minSize - newH);
          newH = minSize;
        }

        s.dW = newW - s.startW;
        s.dH = newH - s.startH;

        s.el.style.width = newW + 'px';
        s.el.style.height = newH + 'px';
        s.el.style.transform =
          'translate(' + (newX - s.startX) + 'px,' + (newY - s.startY) + 'px)';

        this.updateCenterGuides(newX, newY, newW, newH);
      }
    },

    // 전역 mouseup : 실제 좌표/사이즈 확정 + 자석 + 플래시
    onWindowMouseUp() {
      const s = this.dragState;
      if (!s) return;

      const box = this.findBoxById(s.boxId);
      if (!box) {
        this.resetDragVisual(s);
        this.dragState = null;
        document.body.style.userSelect = '';
        return;
      }

      let newX = s.startX + s.dx;
      let newY = s.startY + s.dy;
      let newW = s.startW;
      let newH = s.startH;

      if (s.mode === 'resize') {
        newW = s.startW + s.dW;
        newH = s.startH + s.dH;

        if (s.edges.left) {
          newX = s.startX + (s.startW - newW);
        }
        if (s.edges.top) {
          newY = s.startY + (s.startH - newH);
        }
      }

      // 자석 스냅
      const snap = this.checkSnap(box.id, newX, newY, newW, newH);
      newX = snap.x;
      newY = snap.y;
      newW = snap.w;
      newH = snap.h;

      // 부모에 실제 값 전달
      if (this.$parent && typeof this.$parent.updateBoxPosition === 'function') {
        this.$parent.updateBoxPosition(box.id, newX, newY, newW, newH);
      } else {
        // 혹시 모를 fallback
        box.x = newX;
        box.y = newY;
        box.w = newW;
        box.h = newH;
      }

      // 완전 접촉 시 플래시
      if (snap.snapped) {
        this.triggerSnapFlash(s.el);
      }

      this.resetDragVisual(s);
      this.dragState = null;
      document.body.style.userSelect = '';
    },

    resetDragVisual(s) {
      if (!s || !s.el) return;
      s.el.style.transform = '';
      s.el.style.width = '';
      s.el.style.height = '';
      s.el.style.cursor = '';
    },

    findBoxById(id) {
      if (!this.canvasBoxes) return null;
      for (let i = 0; i < this.canvasBoxes.length; i++) {
        const b = this.canvasBoxes[i];
        if (String(b.id) === String(id)) return b;
      }
      return null;
    },

    // 박스 중심이 캔버스 중심 근처일 때 가이드 1초 표시
    updateCenterGuides(x, y, w, h) {
      const canvas = this.getCanvasSize();
      const cx = x + w / 2;
      const cy = y + h / 2;
      const centerX = canvas.w / 2;
      const centerY = canvas.h / 2;
      const threshold = 5;

      const nearV = Math.abs(cx - centerX) <= threshold;
      const nearH = Math.abs(cy - centerY) <= threshold;

      this.showVGuide = nearV;
      this.showHGuide = nearH;

      if (nearV || nearH) {
        if (this.guideTimer) {
          clearTimeout(this.guideTimer);
        }
        this.guideTimer = setTimeout(() => {
          this.showVGuide = false;
          this.showHGuide = false;
          this.guideTimer = null;
        }, 1000);
      }
    },

    // 캔버스/다른 박스와 자석 스냅
    checkSnap(boxId, x, y, w, h) {
      const threshold = 8;
      let snapped = false;

      let left = x;
      let top = y;
      let right = x + w;
      let bottom = y + h;

      const canvas = this.getCanvasSize();
      const cLeft = 0;
      const cTop = 0;
      const cRight = canvas.w;
      const cBottom = canvas.h;

      function snapTo(value, target) {
        if (Math.abs(value - target) <= threshold) {
          return target;
        }
        return null;
      }

      // 1) 캔버스 경계 스냅
      let s = snapTo(left, cLeft);
      if (s !== null) {
        left = s;
        right = left + w;
        snapped = true;
      }
      s = snapTo(right, cRight);
      if (s !== null) {
        right = s;
        left = right - w;
        snapped = true;
      }
      s = snapTo(top, cTop);
      if (s !== null) {
        top = s;
        bottom = top + h;
        snapped = true;
      }
      s = snapTo(bottom, cBottom);
      if (s !== null) {
        bottom = s;
        top = bottom - h;
        snapped = true;
      }

      // 2) 다른 박스와 스냅
      if (this.canvasBoxes && this.canvasBoxes.length > 0) {
        for (let i = 0; i < this.canvasBoxes.length; i++) {
          const b = this.canvasBoxes[i];
          if (!b || String(b.id) === String(boxId) || b.isHidden) continue;

          const bLeft = b.x;
          const bRight = b.x + b.w;
          const bTop = b.y;
          const bBottom = b.y + b.h;

          let s2 = snapTo(left, bRight);
          if (s2 !== null) {
            left = s2;
            right = left + w;
            snapped = true;
          }
          s2 = snapTo(right, bLeft);
          if (s2 !== null) {
            right = s2;
            left = right - w;
            snapped = true;
          }
          s2 = snapTo(top, bBottom);
          if (s2 !== null) {
            top = s2;
            bottom = top + h;
            snapped = true;
          }
          s2 = snapTo(bottom, bTop);
          if (s2 !== null) {
            bottom = s2;
            top = bottom - h;
            snapped = true;
          }
        }
      }

      return {
        x: left,
        y: top,
        w: right - left,
        h: bottom - top,
        snapped: snapped
      };
    },

    // 경계선 접촉 시 2px 흰색 플래시(0.5초)
    triggerSnapFlash(el) {
      if (!el) return;
      const flash = document.createElement('div');
      flash.style.position = 'absolute';
      flash.style.left = '-2px';
      flash.style.top = '-2px';
      flash.style.right = '-2px';
      flash.style.bottom = '-2px';
      flash.style.border = '2px solid #ffffff';
      flash.style.boxSizing = 'border-box';
      flash.style.pointerEvents = 'none';
      flash.style.opacity = '1';
      flash.style.transition = 'opacity 0.5s ease-out';

      el.appendChild(flash);
      requestAnimationFrame(function () {
        flash.style.opacity = '0';
      });
      setTimeout(function () {
        if (flash.parentNode === el) {
          el.removeChild(flash);
        }
      }, 500);
    },

    // 레이어 설정 모달 열기 (우클릭)
    openLayerConfig(boxId, event) {
      if (this.$parent && typeof this.$parent.openLayerConfig === 'function') {
        this.$parent.openLayerConfig(boxId, event);
      }
    }
  }
};

window.PreviewCanvas = PreviewCanvas;
