// Preview Canvas Component - Enhanced
// 자산 드롭 수신, 캔버스-타임라인 연동, 비디오 시간 동기화
// 클립 기반 박스 표시 - 플레이헤드 위치에 따라 활성 클립 표시

const PreviewCanvas = {
  name: 'PreviewCanvas',

  props: {
    canvasBoxes: { type: Array, required: true },
    canvasSize: { type: Object, required: false, default: () => ({ w: 1920, h: 1080 }) },
    selectedBoxId: { type: String, default: null },
    currentTime: { type: Number, default: 0 },
    isPlaying: { type: Boolean, default: false }
  },

  data() {
    return {
      dragging: false,
      dragMode: null,
      dragHandle: null,
      dragBoxId: null,
      dragStartMouse: { mx: 0, my: 0 },
      dragStartBox: { x0: 0, y0: 0, w0: 0, h0: 0 },
      edgeFlash: { top: false, bottom: false, left: false, right: false },
      magnetEnabled: true,
      snapDistance: 15,
      isDropTarget: false,
      videoElements: {},
      lastSyncTime: -1
    };
  },

  computed: {
    overlayStyle() {
      return { position: 'absolute', inset: '0', pointerEvents: 'auto', overflow: 'visible' };
    },
    // 표시할 박스: 숨김 처리되지 않은 모든 박스
    visibleBoxes() {
      return this.canvasBoxes
        .filter(box => !box.isHidden)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    },
    isMagnetActive() {
      if (this.$parent && typeof this.$parent.isMagnet === 'boolean') return this.$parent.isMagnet;
      return this.magnetEnabled;
    }
  },

  watch: {
    isPlaying(newVal) { this.handlePlayStateChange(newVal); },
    currentTime(newTime) { this.syncAllVideos(newTime); },
    canvasBoxes: {
      handler() { this.$nextTick(() => { this.cleanupVideoElements(); this.initializeVideoElements(); }); },
      deep: true
    }
  },

  mounted() {
    this.$nextTick(() => { this.initializeVideoElements(); });
  },

  methods: {
    initializeVideoElements() {
      const videoBoxes = this.canvasBoxes.filter(box => box.mediaType === 'video' && box.mediaSrc && !box.isHidden);
      videoBoxes.forEach(box => {
        if (!this.videoElements[box.id]) {
          const videoEl = this.$refs[`video_${box.id}`];
          if (videoEl && videoEl[0]) {
            this.videoElements[box.id] = videoEl[0];
            const video = videoEl[0];
            video.muted = true;
            video.playsInline = true;
            video.addEventListener('loadedmetadata', () => { this.syncVideoToTime(box, this.currentTime); });
          }
        }
      });
    },
    
    cleanupVideoElements() {
      const activeBoxIds = new Set(this.canvasBoxes.filter(b => !b.isHidden).map(b => b.id));
      Object.keys(this.videoElements).forEach(boxId => {
        if (!activeBoxIds.has(boxId)) {
          const video = this.videoElements[boxId];
          if (video) {
            video.pause();
            video.src = '';
          }
          delete this.videoElements[boxId];
        }
      });
    },

    handlePlayStateChange(isPlaying) {
      this.visibleBoxes.forEach(box => {
        if (box.mediaType !== 'video' || !box.mediaSrc) return;
        const video = this.videoElements[box.id];
        if (!video) return;
        if (isPlaying) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },

    syncAllVideos(currentTime) {
      if (Math.abs(currentTime - this.lastSyncTime) < 0.03) return;
      this.lastSyncTime = currentTime;
      
      this.visibleBoxes.forEach(box => {
        if (box.mediaType === 'video' && box.mediaSrc) {
          this.syncVideoToTime(box, currentTime);
        }
      });
    },

    syncVideoToTime(box, globalTime) {
      let video = this.videoElements[box.id];
      if (!video) {
        const videoEl = this.$refs[`video_${box.id}`];
        if (videoEl && videoEl[0]) { 
          this.videoElements[box.id] = videoEl[0]; 
          video = videoEl[0]; 
        } else {
          return;
        }
      }
      
      // 클립 연동 박스의 경우 로컬 시간 계산
      if (box.clipId && typeof box.clipStart === 'number') {
        const localTime = globalTime - box.clipStart;
        if (localTime >= 0 && localTime < (box.clipDuration || video.duration || 1000)) {
          if (Math.abs(video.currentTime - localTime) > 0.1) {
            video.currentTime = Math.max(0, Math.min(localTime, video.duration || localTime));
          }
          if (this.isPlaying && video.paused) {
            video.play().catch(() => {});
          }
        }
      } else {
        // 레이어관리 박스 (항상 0부터 재생)
        if (this.isPlaying && video.paused) {
          video.play().catch(() => {});
        } else if (!this.isPlaying && !video.paused) {
          video.pause();
        }
      }
    },

    clientToCanvas(e) {
      const scaler = document.getElementById('preview-canvas-scaler');
      if (!scaler) return { mx: 0, my: 0 };
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
      const isClipBox = !!box.clipId;
      return {
        position: 'absolute',
        left: (Number(box.x) || 0) + 'px',
        top: (Number(box.y) || 0) + 'px',
        width: (Number(box.w) || 0) + 'px',
        height: (Number(box.h) || 0) + 'px',
        border: isClipBox ? 'none' : `2px dashed ${box.color || '#fff'}`,
        zIndex: box.zIndex || 0,
        cursor: 'move',
        boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 12px rgba(59,130,246,0.5)' : 'none',
        backgroundColor: box.layerBgColor || 'transparent',
        overflow: 'hidden'
      };
    },

    mediaStyle(box) {
      const fit = box.mediaFit || 'cover';
      return { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: fit, pointerEvents: 'none' };
    },

    hasMedia(box) { return box.mediaType && box.mediaType !== 'none' && box.mediaSrc; },
    isImage(box) { return box.mediaType === 'image'; },
    isVideo(box) { return box.mediaType === 'video'; },

    labelStyle(box) {
      if (box.clipId) return { display: 'none' };
      
      const fontSize = 40;
      const paddingV = 4;
      const paddingH = 10;
      const baseStyle = {
        position: 'absolute', bottom: '0', backgroundColor: box.color || '#333', color: '#fff',
        padding: `${paddingV}px ${paddingH}px`, fontSize: fontSize + 'px', fontWeight: 'bold',
        fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '90%', pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        borderRadius: '3px 3px 0 0', zIndex: 10, lineHeight: '1.2'
      };
      const rowType = box.rowType || '';
      if (rowType === 'EFF') { baseStyle.left = '0'; baseStyle.right = 'auto'; baseStyle.transform = 'none'; }
      else if (rowType === 'TXT') { baseStyle.left = '50%'; baseStyle.right = 'auto'; baseStyle.transform = 'translateX(-50%)'; }
      else if (rowType === 'BG') { baseStyle.left = 'auto'; baseStyle.right = '0'; baseStyle.transform = 'none'; }
      else { baseStyle.left = '0'; baseStyle.right = 'auto'; baseStyle.transform = 'none'; }
      return baseStyle;
    },

    textContentStyle(box) {
      const ts = box.textStyle || {};
      const fontSize = ts.fontSize || 48;
      const fillColor = ts.fillColor || '#ffffff';
      const strokeColor = ts.strokeColor || '#000000';
      const strokeWidth = ts.strokeWidth || 0;
      const textAlign = ts.textAlign || 'center';
      const vAlign = ts.vAlign || 'middle';
      const bgColor = ts.backgroundColor || 'transparent';
      const letterSpacing = ts.letterSpacing || 0;
      const lineHeight = ts.lineHeight || 1.4;
      let textShadow = 'none';
      if (ts.shadow) {
        const sx = ts.shadow.offsetX || 0;
        const sy = ts.shadow.offsetY || 0;
        const blur = ts.shadow.blur || 0;
        const scolor = ts.shadow.color || '#000000';
        textShadow = `${sx}px ${sy}px ${blur}px ${scolor}`;
      }
      let justifyContent = 'center';
      if (vAlign === 'top') justifyContent = 'flex-start';
      if (vAlign === 'bottom') justifyContent = 'flex-end';
      return {
        position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column',
        alignItems: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        justifyContent: justifyContent, padding: '20px', fontSize: fontSize + 'px',
        fontFamily: ts.fontFamily || 'Pretendard, system-ui, sans-serif', fontWeight: 'bold',
        color: fillColor, textAlign: textAlign, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        overflow: 'hidden', pointerEvents: 'none', textShadow: textShadow, backgroundColor: bgColor,
        WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : 'none',
        paintOrder: 'stroke fill', letterSpacing: letterSpacing + 'px', lineHeight: lineHeight, zIndex: 5
      };
    },

    getLabelText(box) {
      if (box.clipId) return '';
      const typeMap = { 'EFF': 'Effect', 'TXT': 'Text', 'BG': 'BG' };
      return typeMap[box.rowType] || box.rowType || 'Layer';
    },

    getTextContent(box) {
      if (box.rowType !== 'TXT') return '';
      const content = box.textContent || '';
      return content.trim() || '';
    },

    hasTextContent(box) { return box.rowType === 'TXT' && this.getTextContent(box).length > 0; },

    handleStyle(pos) {
      const size = 28;
      const offset = -Math.round(size / 2);
      const style = { position: 'absolute', width: size + 'px', height: size + 'px', backgroundColor: '#fff', border: '2px solid #000', zIndex: 9999, pointerEvents: 'auto', opacity: 0.9 };
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

    onCanvasDragOver(e) {
      const hasAssetData = e.dataTransfer.types.includes('text/wai-asset');
      if (hasAssetData) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; this.isDropTarget = true; }
    },

    onCanvasDragLeave(e) { this.isDropTarget = false; },

    onCanvasDrop(e) {
      e.preventDefault();
      this.isDropTarget = false;
      let assetData;
      try {
        const dataStr = e.dataTransfer.getData('text/wai-asset');
        if (!dataStr) return;
        assetData = JSON.parse(dataStr);
      } catch (error) { console.warn('[PreviewCanvas] Drop parse error:', error); return; }
      const { mx, my } = this.clientToCanvas(e);
      if (this.$parent && typeof this.$parent.handleCanvasAssetDrop === 'function') {
        this.$parent.handleCanvasAssetDrop(assetData, mx, my);
      } else {
        this.createLayerFromAsset(assetData, mx, my);
      }
    },

    createLayerFromAsset(assetData, x, y) {
      const cw = this.canvasSize.w || 1920;
      const ch = this.canvasSize.h || 1080;
      const defaultW = cw / 2;
      const defaultH = ch / 2;
      const boxX = Math.max(0, Math.min(cw - defaultW, x - defaultW / 2));
      const boxY = Math.max(0, Math.min(ch - defaultH, y - defaultH / 2));
      const newBox = {
        id: `box_drop_${Date.now()}`, x: boxX, y: boxY, w: defaultW, h: defaultH,
        nx: boxX / cw, ny: boxY / ch, nw: defaultW / cw, nh: defaultH / ch,
        color: '#3b82f6', layerBgColor: 'transparent', zIndex: 100, isHidden: false,
        layerName: assetData.name || 'Dropped Asset',
        rowType: assetData.type === 'sound' ? 'EFF' : 'BG', colRole: 'full', slotKey: `drop_${Date.now()}`
      };
      if (assetData.type === 'video') { newBox.mediaType = 'video'; newBox.mediaSrc = assetData.src || ''; newBox.mediaFit = 'cover'; }
      else if (assetData.type === 'image') { newBox.mediaType = 'image'; newBox.mediaSrc = assetData.src || ''; newBox.mediaFit = 'cover'; }
      this.$emit('add-box', newBox);
    },

    onVideoLoaded(box, event) {
      const video = event.target;
      this.videoElements[box.id] = video;
      this.syncVideoToTime(box, this.currentTime);
      if (this.isPlaying) video.play().catch(() => {});
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
      this.dragStartBox = { x0: Number(box.x) || 0, y0: Number(box.y) || 0, w0: Number(box.w) || 0, h0: Number(box.h) || 0 };
      this.edgeFlash = { top: false, bottom: false, left: false, right: false };
      this.hideAllEdgeFlash();
      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);
    },

    getBgAllowedRegion(colRole) {
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const third = ch / 3;
      if (colRole === 'high') return { minY: 0, maxY: third };
      else if (colRole === 'mid') return { minY: third, maxY: third * 2 };
      else if (colRole === 'low') return { minY: third * 2, maxY: ch };
      return { minY: 0, maxY: ch };
    },

    applyBgConstraints(box, x, y, w, h) {
      if (box.rowType !== 'BG') return { x, y, w, h };
      const colRole = box.colRole || 'full';
      const region = this.getBgAllowedRegion(colRole);
      let newY = y;
      let newH = h;
      if (newY < region.minY) newY = region.minY;
      if (newY + newH > region.maxY) {
        if (newH > (region.maxY - region.minY)) { newH = region.maxY - region.minY; newY = region.minY; }
        else newY = region.maxY - newH;
      }
      return { x, y: newY, w, h: newH };
    },

    applyMagnetSnap(currentBoxId, x, y, w, h) {
      if (!this.isMagnetActive) return { x, y, w, h, snappedX: false, snappedY: false };
      const cw = (this.canvasSize && this.canvasSize.w) ? this.canvasSize.w : 1920;
      const ch = (this.canvasSize && this.canvasSize.h) ? this.canvasSize.h : 1080;
      const snapDist = this.snapDistance;
      let newX = x, newY = y, snappedX = false, snappedY = false;
      const xLines = [0, cw / 2, cw];
      const yLines = [0, ch / 2, ch];
      if (this.canvasBoxes && Array.isArray(this.canvasBoxes)) {
        this.canvasBoxes.forEach(box => {
          if (box.id === currentBoxId || box.isHidden) return;
          const bx = Number(box.x) || 0;
          const by = Number(box.y) || 0;
          const bw = Number(box.w) || 0;
          const bh = Number(box.h) || 0;
          xLines.push(bx, bx + bw, bx + bw / 2);
          yLines.push(by, by + bh, by + bh / 2);
        });
      }
      const boxLeft = x, boxRight = x + w, boxCenterX = x + w / 2;
      const boxTop = y, boxBottom = y + h, boxCenterY = y + h / 2;
      for (const line of xLines) {
        if (Math.abs(boxLeft - line) < snapDist) { newX = line; snappedX = true; break; }
        if (Math.abs(boxRight - line) < snapDist) { newX = line - w; snappedX = true; break; }
        if (Math.abs(boxCenterX - line) < snapDist) { newX = line - w / 2; snappedX = true; break; }
      }
      for (const line of yLines) {
        if (Math.abs(boxTop - line) < snapDist) { newY = line; snappedY = true; break; }
        if (Math.abs(boxBottom - line) < snapDist) { newY = line - h; snappedY = true; break; }
        if (Math.abs(boxCenterY - line) < snapDist) { newY = line - h / 2; snappedY = true; break; }
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
      if (touchTop && !this.edgeFlash.top) this.triggerEdgeFlash('top');
      if (touchBottom && !this.edgeFlash.bottom) this.triggerEdgeFlash('bottom');
      if (touchLeft && !this.edgeFlash.left) this.triggerEdgeFlash('left');
      if (touchRight && !this.edgeFlash.right) this.triggerEdgeFlash('right');
      if (!touchTop && this.edgeFlash.top) this.hideEdgeFlash('top');
      if (!touchBottom && this.edgeFlash.bottom) this.hideEdgeFlash('bottom');
      if (!touchLeft && this.edgeFlash.left) this.hideEdgeFlash('left');
      if (!touchRight && this.edgeFlash.right) this.hideEdgeFlash('right');
      this.edgeFlash = { top: touchTop, bottom: touchBottom, left: touchLeft, right: touchRight };
    },

    checkBgRegionContact(box, x, y, w, h) {
      if (box.rowType !== 'BG') return;
      const colRole = box.colRole || 'full';
      if (colRole === 'full') return;
      const region = this.getBgAllowedRegion(colRole);
      const threshold = 2;
      const touchRegionTop = Math.abs(y - region.minY) <= threshold;
      const touchRegionBottom = Math.abs((y + h) - region.maxY) <= threshold;
      if (touchRegionTop) this.triggerEdgeFlash('top');
      if (touchRegionBottom) this.triggerEdgeFlash('bottom');
    },

    triggerEdgeFlash(direction) {
      const flashEl = document.getElementById(`preview-edge-flash-${direction}`);
      if (flashEl) { flashEl.classList.add('active'); setTimeout(() => { flashEl.classList.remove('active'); }, 500); }
    },

    hideEdgeFlash(direction) {
      const flashEl = document.getElementById(`preview-edge-flash-${direction}`);
      if (flashEl) flashEl.classList.remove('active');
    },

    hideAllEdgeFlash() { ['top', 'bottom', 'left', 'right'].forEach(dir => this.hideEdgeFlash(dir)); },

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
        x += dx; y += dy;
        if (x < 0) x = 0; if (y < 0) y = 0;
        if (x + w > cw) x = cw - w; if (y + h > ch) y = ch - h;
        const snapped = this.applyMagnetSnap(this.dragBoxId, x, y, w, h);
        x = snapped.x; y = snapped.y;
        if (currentBox && !currentBox.clipId) {
          const constrained = this.applyBgConstraints(currentBox, x, y, w, h);
          x = constrained.x; y = constrained.y; w = constrained.w; h = constrained.h;
        }
      } else if (this.dragMode === 'resize') {
        const hdl = this.dragHandle;
        if (hdl.includes('l')) { let newX = x + dx; if (newX < 0) newX = 0; const rightEdge = x0 + w0; let newW = rightEdge - newX; x = newX; w = newW; }
        else if (hdl.includes('r')) { w += dx; if (x + w > cw) w = cw - x; }
        if (hdl.includes('t')) { let newY = y + dy; if (newY < 0) newY = 0; const bottomEdge = y0 + h0; let newH = bottomEdge - newY; y = newY; h = newH; }
        else if (hdl.includes('b')) { h += dy; if (y + h > ch) h = ch - y; }
        if (currentBox && !currentBox.clipId) {
          const constrained = this.applyBgConstraints(currentBox, x, y, w, h);
          x = constrained.x; y = constrained.y; w = constrained.w; h = constrained.h;
        }
      }
      if (w < 10) w = 10; if (h < 10) h = 10;
      this.checkEdgeContact(x, y, w, h);
      if (currentBox) this.checkBgRegionContact(currentBox, x, y, w, h);
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
    Object.values(this.videoElements).forEach(video => { if (video) { video.pause(); video.src = ''; } });
    this.videoElements = {};
  },

  template: `
    <div 
      class="preview-canvas-overlay"
      :style="overlayStyle"
      :class="{ 'canvas-drop-target': isDropTarget }"
      @dragover="onCanvasDragOver"
      @dragleave="onCanvasDragLeave"
      @drop="onCanvasDrop"
    >
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
        <img 
          v-if="hasMedia(box) && isImage(box)"
          :src="box.mediaSrc"
          :style="mediaStyle(box)"
          draggable="false"
        />
        
        <video 
          v-if="hasMedia(box) && isVideo(box)"
          :ref="'video_' + box.id"
          :src="box.mediaSrc"
          :style="mediaStyle(box)"
          muted
          playsinline
          preload="auto"
          @loadedmetadata="onVideoLoaded(box, $event)"
        ></video>

        <div 
          v-if="hasTextContent(box)"
          :style="textContentStyle(box)"
        >{{ getTextContent(box) }}</div>

        <div 
          v-if="!box.clipId"
          class="canvas-label"
          :style="labelStyle(box)"
        >{{ getLabelText(box) }}</div>

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
