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
      edgeFlash: {
        top: false,
        bottom: false,
        left: false,
        right: false
      },
      magnetEnabled: true,
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

    visibleBoxes() {
      return this.canvasBoxes.filter(box => !box.isHidden);
    },

    isMagnetActive() {
      if (this.$parent && typeof this.$parent.isMagnet === 'boolean') {
        return this.$parent.isMagnet;
      }
      return this.magnetEnabled;
    }
  },

  methods: {
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
     * 레이어 레이블 스타일 - 고정 30px 폰트
     */
    labelStyle(box) {
      const fontSize = 30;
      const padding = 4;
      
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
        maxWidth: '90%',
        pointerEvents: 'none',
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        borderRadius: '3px 3px 0 0'
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

    getLabelText(box) {
      const typeMap = {
        'EFF': 'Effect',
        'TXT': 'Text',
        'BG': 'BG'
      };
      return typeMap[box.rowType] || box.rowType || 'Layer';
    },

    handleStyle(pos) {
      const size = 24;
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

    onBoxContextMenu(e, box) {
      e.preventDefault();
      e.stopPropagation();
      
      this.$emit('select-box', box.id);
      
      if (this.$parent && typeof this.$parent.openLayerConfig === 'function') {
        this.$parent.openLayerConfig(box.id);
      }
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

      this.edgeFlash = { top: false, bottom: false, left: false, right: false };
      this.hideAllEdgeFlash();

      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);
    },

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
      return { minY: 0, maxY: ch };
    },

    applyBgConstraints(box, x, y, w, h) {
      if (box.rowType !== 'BG') {
        return { x, y, w, h };
      }

      const colRole = box.colRole || 'full';
      const region = this.getBgAllowedRegion(colRole);

      let newY = y;
      let newH = h;

      if (newY < region.minY) {
        newY = region.minY;
      }

      if (newY + newH > region.maxY) {
        if (newH > (region.maxY - region.minY)) {
          newH = region.maxY - region.minY;
          newY = region.minY;
        } else {
          newY = region.maxY - newH;
        }
      }

      return { x, y: newY, w, h: newH };
    },

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

      const xLines = [0, cw / 2, cw];
      const yLines = [0, ch / 2, ch];

      if (this.canvasBoxes && Array.isArray(this.canvasBoxes)) {
        this.canvasBoxes.forEach(box => {
          if (box.id === currentBoxId || box.isHidden) return;
          const bx = Number(box.x) || 0;
          const by = Number(box.y) || 0;
          const bw = Number(box.w) || 0;
          const bh = Number(box.h) || 0;

          xLines.push(bx);
          xLines.push(bx + bw);
          xLines.push(bx + bw / 2);

          yLines.push(by);
          yLines.push(by + bh);
          yLines.push(by + bh / 2);
        });
      }

      const boxLeft = x;
      const boxRight = x + w;
      const boxCenterX = x + w / 2;
      const boxTop = y;
      const boxBottom = y + h;
      const boxCenterY = y + h / 2;

      for (const line of xLines) {
        if (Math.abs(boxLeft - line) < snapDist) {
          newX = line;
          snappedX = true;
          break;
        }
        if (Math.abs(boxRight - line) < snapDist) {
          newX = line - w;
          snappedX = true;
          break;
        }
        if (Math.abs(boxCenterX - line) < snapDist) {
          newX = line - w / 2;
          snappedX = true;
          break;
        }
      }

      for (const line of yLines) {
        if (Math.abs(boxTop - line) < snapDist) {
          newY = line;
          snappedY = true;
          break;
        }
        if (Math.abs(boxBottom - line) < snapDist) {
          newY = line - h;
          snappedY = true;
          break;
        }
        if (Math.abs(boxCenterY - line) < snapDist) {
          newY = line - h / 2;
          snappedY = true;
          break;
        }
      }

      return { x: newX, y: newY, w, h, snappedX, snappedY };
    },

    checkEdgeContact(x, y, w, h) {
      const cw = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const threshold = 2;

      const touchTop = y <= threshold;
      const touchLeft = x <= threshold;
      const touchBottom = (y + h) >= (ch - threshold);
      const touchRight = (x + w) >= (cw - threshold);

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

      this.edgeFlash = {
        top: touchTop,
        bottom: touchBottom,
        left: touchLeft,
        right: touchRight
      };
    },

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

    triggerEdgeFlash(direction) {
      const flashEl = document.getElementById(`preview-edge-flash-${direction}`);
      if (flashEl) {
        flashEl.classList.add('active');
        setTimeout(() => {
          flashEl.classList.remove('active');
        }, 500);
      }
    },

    hideEdgeFlash(direction) {
      const flashEl = document.getElementById(`preview-edge-flash-${direction}`);
      if (flashEl) {
        flashEl.classList.remove('active');
      }
    },

    hideAllEdgeFlash() {
      ['top', 'bottom', 'left', 'right'].forEach(dir => {
        this.hideEdgeFlash(dir);
      });
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

      const currentBox = this.canvasBoxes.find(b => b.id === this.dragBoxId);

      if (this.dragMode === 'move') {
        x += dx;
        y += dy;
        
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + w > cw) x = cw - w;
        if (y + h > ch) y = ch - h;

        const snapped = this.applyMagnetSnap(this.dragBoxId, x, y, w, h);
        x = snapped.x;
        y = snapped.y;

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

        if (currentBox) {
          const constrained = this.applyBgConstraints(currentBox, x, y, w, h);
          x = constrained.x;
          y = constrained.y;
          w = constrained.w;
          h = constrained.h;
        }
      }

      if (w < 10) w = 10;
      if (h < 10) h = 10;

      this.checkEdgeContact(x, y, w, h);

      if (currentBox) {
        this.checkBgRegionContact(currentBox, x, y, w, h);
      }

      if (this.$parent && typeof this.$parent.updateBoxPosition === 'function') {
        this.$parent.updateBoxPosition(this.dragBoxId, x, y, w, h, null);
      }
    },

    onWindowMouseUp() {
      this.dragging = false;
      this.dragMode = null;
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
      <div id="preview-edge-flash-top" class="edge-flash-overlay edge-flash-top"></div>
      <div id="preview-edge-flash-bottom" class="edge-flash-overlay edge-flash-bottom"></div>
      <div id="preview-edge-flash-left" class="edge-flash-overlay edge-flash-left"></div>
      <div id="preview-edge-flash-right" class="edge-flash-overlay edge-flash-right"></div>

      <div
        v-for="box in visibleBoxes"
        :key="box.id"
        :id="'preview-canvas-box-' + box.id"
        class="canvas-box"
        :style="boxStyle(box)"
        @mousedown="onBoxMouseDown($event, box)"
        @contextmenu="onBoxContextMenu($event, box)"
        data-action="js:selectCanvasBox"
      >
        <div 
          class="canvas-label"
          :style="labelStyle(box)"
        >
          {{ getLabelText(box) }}
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
