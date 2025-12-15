// PreviewCanvas
// - 퍼센트 좌표(0~1)를 사용하는 프리뷰 렌더러 진입점
// - 기본: PixiJS(WebGL 2D) 기반으로 레이어 박스/텍스트를 렌더링
// - 폴백: Pixi 사용 불가 시 Canvas2D 로 중앙 십자 가이드만 렌더
// - 수정: Pixi 박스 드래그/리사이즈 인터랙션 활성화 및 좌표계 보정

(function (global) {
    const DEFAULT_TEXT_MESSAGE = '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';

    // ★ Pixi 박스 렌더링/드래그 토글 - 활성화로 변경
    const PIXI_BOX_RENDERING_ENABLED = true;

    const PreviewRenderer = {
        // 공통 정보
        canvas: null,
        vm: null,
        dpr: global.devicePixelRatio || 1,
        handleResize: null,

        // Pixi 모드
        app: null,
        mode: null,
        rootContainer: null,
        guidesContainer: null,
        layersContainer: null,
        guideGraphics: null,

        // Canvas2D 폴백
        ctx2d: null,

        // 논리 캔버스 크기(퍼센트 좌표 기준)
        logicalCanvasSize: { w: 1920, h: 1080 },

        // 박스 → Pixi 오브젝트 매핑
        boxEntries: new Map(),
        _lastBoxes: [],

        // 드래그/리사이즈 상태 (Pixi 기준)
        dragMode: null,
        dragBoxId: null,
        dragStartMouse: { x: 0, y: 0 },
        dragStartNorm: { nx: 0, ny: 0, nw: 0, nh: 0 },
        dragCurrentNorm: null,
        dragEdges: { left: false, right: false, top: false, bottom: false },
        _boundPointerMove: null,
        _boundPointerUp: null,

        async init(canvasEl, vm) {
            this.canvas = canvasEl;
            this.vm = vm;
            this.dpr = global.devicePixelRatio || 1;
            this.mode = null;

            if (!this.canvas) {
                console.warn('[PreviewRenderer] canvas element not provided');
                return;
            }

            // 1) PixiJS 시도
            if (global.PIXI && global.PIXI.Application) {
                try {
                    await this._initPixi();
                    this.mode = 'pixi';
                    console.log('[PreviewRenderer] PixiJS mode enabled');

                    this.handleResize = this.resize.bind(this);
                    global.addEventListener('resize', this.handleResize);
                    this.resize();

                    if (this.app && this.app.ticker) {
                        this.app.ticker.add(this.render, this);
                    }
                    return;
                } catch (err) {
                    console.warn('[PreviewRenderer] Pixi init failed, fallback to Canvas2D:', err);
                }
            }

            // 2) Canvas2D 폴백
            this._initCanvas2D();
            if (!this.mode) {
                console.warn('[PreviewRenderer] No rendering mode available');
                return;
            }

            this.handleResize = this.resize.bind(this);
            global.addEventListener('resize', this.handleResize);
            this.resize();
            if (this.mode === '2d') {
                this._loop2d();
            }
        },

        async _initPixi() {
            const PIXI = global.PIXI;
            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = Math.max(1, rect.width || 1);
            const cssHeight = Math.max(1, rect.height || 1);

            const app = new PIXI.Application();
            this.app = app;

            await app.init({
                view: this.canvas,
                width: cssWidth,
                height: cssHeight,
                antialias: true,
                resolution: this.dpr,
                autoDensity: true,
                backgroundAlpha: 0
            });

            this.rootContainer = new PIXI.Container();
            this.layersContainer = new PIXI.Container();
            this.layersContainer.sortableChildren = true;
            this.guidesContainer = new PIXI.Container();

            this.rootContainer.addChild(this.layersContainer);
            this.rootContainer.addChild(this.guidesContainer);
            app.stage.addChild(this.rootContainer);

            this._recreateGuides();
        },

        _initCanvas2D() {
            const ctx = this.canvas.getContext('2d');
            if (!ctx) {
                console.warn('[PreviewRenderer] Canvas2D context not available');
                this.mode = null;
                return;
            }
            this.ctx2d = ctx;
            this.mode = '2d';
            console.log('[PreviewRenderer] Canvas2D fallback mode enabled');
        },

        resize() {
            if (!this.canvas) return;

            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = Math.max(1, rect.width || 1);
            const cssHeight = Math.max(1, rect.height || 1);

            if (this.mode === 'pixi' && this.app) {
                this.app.renderer.resize(cssWidth, cssHeight);
                this._recreateGuides();
                this._resyncBoxesAfterResize();
                this._updateZoomFromCssHeight(cssHeight);
            } else if (this.mode === '2d' && this.ctx2d) {
                const dpr = this.dpr || 1;
                this.canvas.width = cssWidth * dpr;
                this.canvas.height = cssHeight * dpr;
                this.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
                this._renderCanvas2D(cssWidth, cssHeight);
                this._updateZoomFromCssHeight(cssHeight);
            } else {
                this._updateZoomFromCssHeight(cssHeight);
            }
        },

        render() {
            if (!this.canvas || !this.vm) return;

            const rect = this.canvas.getBoundingClientRect();
            const cssHeight = Math.max(1, rect.height || 1);
            this._updateZoomFromCssHeight(cssHeight);

            if (this.mode === '2d') {
                const cssWidth = Math.max(1, rect.width || 1);
                this._renderCanvas2D(cssWidth, cssHeight);
            }
        },

        _loop2d() {
            if (this.mode !== '2d') return;
            this.render();
            global.requestAnimationFrame(this._loop2d.bind(this));
        },

        _updateZoomFromCssHeight(cssHeight) {
            const state = this.vm;
            const canvasSize = (state && state.canvasSize) ? state.canvasSize : { w: 1920, h: 1080 };
            const ch = canvasSize.h || 1;
            const scaleY = ch ? (cssHeight / ch) : 1;
            this.updateZoomIndicator(scaleY);
        },

        updateZoomIndicator(scale) {
            const valueEl = global.document.getElementById('preview-zoom-indicator-value');
            if (!valueEl) return;

            if (!scale || !isFinite(scale) || scale <= 0) {
                valueEl.textContent = '100%';
                return;
            }

            const pct = scale * 100;
            valueEl.textContent = pct.toFixed(0) + '%';
        },

        setCanvasSize(size) {
            if (!size) return;
            const w = size.w || size.width || this.logicalCanvasSize.w;
            const h = size.h || size.height || this.logicalCanvasSize.h;

            if (this.logicalCanvasSize.w === w && this.logicalCanvasSize.h === h) {
                return;
            }

            this.logicalCanvasSize = { w, h };
            this._resyncBoxesAfterResize();
        },

        syncBoxes(boxes, canvasSize) {
            if (!Array.isArray(boxes)) {
                this._lastBoxes = [];
            } else {
                this._lastBoxes = boxes.slice();
            }

            if (canvasSize) {
                this.setCanvasSize(canvasSize);
            }

            if (!PIXI_BOX_RENDERING_ENABLED) {
                return;
            }

            if (this.mode !== 'pixi' || !this.app || !this.layersContainer) {
                return;
            }

            const stageSize = this._getStageSize();
            const stageW = stageSize.w;
            const stageH = stageSize.h;

            if (!this.boxEntries) {
                this.boxEntries = new Map();
            }

            const existingIds = new Set(this.boxEntries.keys());

            for (const box of this._lastBoxes) {
                if (!box || !box.id) continue;
                this._upsertBox(box, stageW, stageH);
                existingIds.delete(box.id);
            }

            for (const id of existingIds) {
                const entry = this.boxEntries.get(id);
                if (entry && entry.container && entry.container.parent) {
                    entry.container.parent.removeChild(entry.container);
                }
                this.boxEntries.delete(id);
            }
        },

        _resyncBoxesAfterResize() {
            if (!this._lastBoxes || this._lastBoxes.length === 0) return;
            this.syncBoxes(this._lastBoxes);
        },

        updateBoxDuringDrag(id, newX, newY, newW, newH) {
            if (!PIXI_BOX_RENDERING_ENABLED) return;

            if (this.mode !== 'pixi' || !this.layersContainer || !this.boxEntries) return;
            if (!id) return;

            const entry = this.boxEntries.get(id);
            if (!entry) return;

            const baseBox = Array.isArray(this._lastBoxes)
                ? this._lastBoxes.find(b => b && b.id === id)
                : null;
            if (!baseBox) return;

            const logical = this.logicalCanvasSize || { w: 1920, h: 1080 };
            const cw = logical.w || 1;
            const ch = logical.h || 1;

            const tempBox = {
                ...baseBox,
                x: newX,
                y: newY,
                w: newW,
                h: newH,
                nx: newX / cw,
                ny: newY / ch,
                nw: newW / cw,
                nh: newH / ch
            };

            const stageSize = this._getStageSize();
            this._updateBoxGraphics(entry, tempBox, stageSize.w, stageSize.h);
        },

        _getEdgeState(globalPos, rect) {
            const edgeMargin = 8;
            const offsetX = globalPos.x - rect.x;
            const offsetY = globalPos.y - rect.y;

            const distLeft   = offsetX;
            const distRight  = rect.width  - offsetX;
            const distTop    = offsetY;
            const distBottom = rect.height - offsetY;

            let nearLeft   = distLeft   <= edgeMargin;
            let nearRight  = distRight  <= edgeMargin;
            let nearTop    = distTop    <= edgeMargin;
            let nearBottom = distBottom <= edgeMargin;

            if (nearLeft && nearRight) {
                if (distLeft <= distRight) nearRight = false;
                else nearLeft = false;
            }
            if (nearTop && nearBottom) {
                if (distTop <= distBottom) nearBottom = false;
                else nearTop = false;
            }

            return { nearLeft, nearRight, nearTop, nearBottom };
        },

        _getCursorForEdges({ nearLeft, nearRight, nearTop, nearBottom }) {
            if ((nearLeft && nearTop) || (nearRight && nearBottom)) {
                return 'nwse-resize';
            }
            if ((nearRight && nearTop) || (nearLeft && nearBottom)) {
                return 'nesw-resize';
            }
            if (nearLeft || nearRight) {
                return 'ew-resize';
            }
            if (nearTop || nearBottom) {
                return 'ns-resize';
            }
            return 'move';
        },

        _onBoxPointerDown(event, boxId) {
            if (!this.app || !this.layersContainer || !boxId) return;

            event.stopPropagation?.();

            // 우클릭: 레이어 설정 모달
            if (event.button === 2) {
                if (this.vm && typeof this.vm.openLayerConfig === 'function') {
                    this.vm.openLayerConfig(boxId);
                }
                return;
            }

            // 좌클릭: 선택 + 드래그 시작
            if (this.vm && typeof this.vm.setSelectedBoxId === 'function') {
                this.vm.setSelectedBoxId(boxId);
            }

            const entry = this.boxEntries.get(boxId);
            if (!entry || !entry.container) return;

            const baseBox = Array.isArray(this._lastBoxes)
                ? this._lastBoxes.find(b => b && b.id === boxId)
                : null;
            if (!baseBox) return;

            const stageSize = this._getStageSize();
            const stageW = stageSize.w;
            const stageH = stageSize.h;

            const globalPos = event.global;
            const rect = entry.container.getBounds();

            const edgeState = this._getEdgeState(globalPos, rect);
            const cursor = this._getCursorForEdges(edgeState);
            entry.container.cursor = cursor;

            this.dragMode =
                edgeState.nearLeft || edgeState.nearRight || edgeState.nearTop || edgeState.nearBottom
                    ? 'resize'
                    : 'move';

            this.dragBoxId = boxId;
            this.dragStartMouse = { x: globalPos.x, y: globalPos.y };

            const logical = this.logicalCanvasSize || { w: 1920, h: 1080 };
            const cw = logical.w || 1;
            const ch = logical.h || 1;

            const baseNx = (typeof baseBox.nx === 'number') ? baseBox.nx : (baseBox.x || 0) / cw;
            const baseNy = (typeof baseBox.ny === 'number') ? baseBox.ny : (baseBox.y || 0) / ch;
            const baseNw = (typeof baseBox.nw === 'number') ? baseBox.nw : (baseBox.w || cw) / cw;
            const baseNh = (typeof baseBox.nh === 'number') ? baseBox.nh : (baseBox.h || ch) / ch;

            this.dragStartNorm = { nx: baseNx, ny: baseNy, nw: baseNw, nh: baseNh };
            this.dragCurrentNorm = { ...this.dragStartNorm };
            this.dragEdges = {
                left: edgeState.nearLeft,
                right: edgeState.nearRight,
                top: edgeState.nearTop,
                bottom: edgeState.nearBottom
            };

            if (!this._boundPointerMove) {
                this._boundPointerMove = this._onStagePointerMove.bind(this);
            }
            if (!this._boundPointerUp) {
                this._boundPointerUp = this._onStagePointerUp.bind(this);
            }

            this.app.stage.on('pointermove', this._boundPointerMove);
            this.app.stage.on('pointerup', this._boundPointerUp);
            this.app.stage.on('pointerupoutside', this._boundPointerUp);
        },

        _onStagePointerMove(event) {
            if (!this.dragMode || !this.dragBoxId) return;
            if (!this.app || !this.layersContainer || !this.boxEntries) return;

            const entry = this.boxEntries.get(this.dragBoxId);
            if (!entry) return;

            const globalPos = event.global;
            const stageSize = this._getStageSize();
            const stageW = stageSize.w || 1;
            const stageH = stageSize.h || 1;

            const dxStage = globalPos.x - this.dragStartMouse.x;
            const dyStage = globalPos.y - this.dragStartMouse.y;

            let { nx, ny, nw, nh } = this.dragStartNorm;

            const dxNorm = dxStage / stageW;
            const dyNorm = dyStage / stageH;

            if (this.dragMode === 'move') {
                nx += dxNorm;
                ny += dyNorm;
            } else if (this.dragMode === 'resize') {
                const edges = this.dragEdges;

                if (edges.left) {
                    nx += dxNorm;
                    nw -= dxNorm;
                }
                if (edges.right) {
                    nw += dxNorm;
                }
                if (edges.top) {
                    ny += dyNorm;
                    nh -= dyNorm;
                }
                if (edges.bottom) {
                    nh += dyNorm;
                }
            }

            const logical = this.logicalCanvasSize || { w: 1920, h: 1080 };
            const cw = logical.w || 1;
            const ch = logical.h || 1;

            const minNw = 10 / cw;
            const minNh = 10 / ch;

            if (nw < minNw) nw = minNw;
            if (nh < minNh) nh = minNh;

            if (nx < 0) nx = 0;
            if (ny < 0) ny = 0;
            if (nx + nw > 1) nx = Math.max(0, 1 - nw);
            if (ny + nh > 1) ny = Math.max(0, 1 - nh);

            this.dragCurrentNorm = { nx, ny, nw, nh };

            const tempBox = this._buildTempBoxFromNorm(this.dragBoxId, nx, ny, nw, nh);
            if (!tempBox) return;

            this._updateBoxGraphics(entry, tempBox, stageW, stageH);
        },

        _onStagePointerUp() {
            if (!this.dragMode || !this.dragBoxId) {
                this._clearDragListeners();
                return;
            }

            const norm = this.dragCurrentNorm || this.dragStartNorm;
            const { nx, ny, nw, nh } = norm;

            if (this.vm && typeof this.vm.updateBoxPositionNormalized === 'function') {
                this.vm.updateBoxPositionNormalized(this.dragBoxId, nx, ny, nw, nh);
            }

            this.dragMode = null;
            this.dragBoxId = null;
            this.dragCurrentNorm = null;
            this._clearDragListeners();
        },

        _clearDragListeners() {
            if (!this.app || !this.app.stage) return;
            if (this._boundPointerMove) {
                this.app.stage.off('pointermove', this._boundPointerMove);
            }
            if (this._boundPointerUp) {
                this.app.stage.off('pointerup', this._boundPointerUp);
                this.app.stage.off('pointerupoutside', this._boundPointerUp);
            }
        },

        _buildTempBoxFromNorm(boxId, nx, ny, nw, nh) {
            const baseBox = Array.isArray(this._lastBoxes)
                ? this._lastBoxes.find(b => b && b.id === boxId)
                : null;
            if (!baseBox) return null;

            const logical = this.logicalCanvasSize || { w: 1920, h: 1080 };
            const cw = logical.w || 1;
            const ch = logical.h || 1;

            return {
                ...baseBox,
                nx,
                ny,
                nw,
                nh,
                x: nx * cw,
                y: ny * ch,
                w: nw * cw,
                h: nh * ch
            };
        },

        _getStageSize() {
            if (this.mode === 'pixi' && this.app) {
                const screen = this.app.screen || (this.app.renderer && this.app.renderer.screen);
                if (screen && typeof screen.width === 'number' && typeof screen.height === 'number') {
                    return { w: screen.width, h: screen.height };
                }
                const r = this.app.renderer;
                if (r && typeof r.width === 'number' && typeof r.height === 'number') {
                    const res = r.resolution || this.dpr || 1;
                    return { w: r.width / res, h: r.height / res };
                }
            }
            const s = this.logicalCanvasSize;
            return { w: s.w || 1920, h: s.h || 1080 };
        },

        _upsertBox(box, stageW, stageH) {
            if (!this.boxEntries) {
                this.boxEntries = new Map();
            }
            let entry = this.boxEntries.get(box.id);
            const PIXI = global.PIXI;

            if (!entry) {
                const container = new PIXI.Container();
                container.sortableChildren = false;

                const bg = new PIXI.Graphics();
                const border = new PIXI.Graphics();
                container.addChild(bg);
                container.addChild(border);

                let text = null;
                if (box.rowType === 'TXT' && PIXI.Text) {
                    const style = this._createTextStyle(box, stageH);
                    text = new PIXI.Text({
                        text: this._getBoxText(box),
                        style
                    });
                    text.anchor.set(0.5);
                    container.addChild(text);
                }

                container.eventMode = 'static';
                container.cursor = 'move';
                container._waiBoxId = box.id;

                container.on('pointerdown', (e) => this._onBoxPointerDown(e, box.id));

                this.layersContainer.addChild(container);
                entry = { container, bg, border, text };
                this.boxEntries.set(box.id, entry);
            }

            this._updateBoxGraphics(entry, box, stageW, stageH);
            return entry;
        },

        _getBoxText(box) {
            const txt = (box && typeof box.textContent === 'string') ? box.textContent : '';
            const trimmed = txt.trim();
            return trimmed.length > 0 ? trimmed : DEFAULT_TEXT_MESSAGE;
        },

        _createTextStyle(box, stageH) {
            const PIXI = global.PIXI;
            const ts = box && box.textStyle ? box.textStyle : {};

            const baseFontSize = typeof ts.fontSize === 'number' ? ts.fontSize : 48;
            const baseH = this.logicalCanvasSize.h || stageH || 1;
            const scaleY = baseH > 0 ? (stageH / baseH) : 1;
            const fontSize = baseFontSize * scaleY;

            const fillColor = (ts.fillColor && this.parseColorToRgb(ts.fillColor))
                ? ts.fillColor
                : '#ffffff';
            const strokeColor = (ts.strokeColor && this.parseColorToRgb(ts.strokeColor))
                ? ts.strokeColor
                : '#000000';
            const strokeWidth = typeof ts.strokeWidth === 'number' ? ts.strokeWidth : 0;

            const align = ts.textAlign || 'center';
            const vAlign = ts.vAlign || 'middle';

            const style = new PIXI.TextStyle({
                fill: fillColor,
                fontFamily: ts.fontFamily || 'Pretendard, system-ui, sans-serif',
                fontSize: fontSize,
                lineHeight: (ts.lineHeight || 1.2) * fontSize,
                stroke: strokeColor,
                strokeThickness: strokeWidth,
                align: align,
                wordWrap: true,
                wordWrapWidth: 1024,
                breakWords: true
            });

            style._wai_vAlign = vAlign;

            return style;
        },

        _updateBoxGraphics(entry, box, stageW, stageH) {
            if (!entry || !entry.container) return;

            const container = entry.container;
            const bg = entry.bg;
            const border = entry.border;
            let text = entry.text;

            const baseW = this.logicalCanvasSize.w || stageW || 1;
            const baseH = this.logicalCanvasSize.h || stageH || 1;

            let nx = (typeof box.nx === 'number') ? box.nx : (box.x || 0) / baseW;
            let ny = (typeof box.ny === 'number') ? box.ny : (box.y || 0) / baseH;
            let nw = (typeof box.nw === 'number') ? box.nw : (box.w || baseW) / baseW;
            let nh = (typeof box.nh === 'number') ? box.nh : (box.h || baseH) / baseH;

            nx = Math.max(0, Math.min(1, nx));
            ny = Math.max(0, Math.min(1, ny));
            nw = Math.max(0, Math.min(1, nw));
            nh = Math.max(0, Math.min(1, nh));

            const x = nx * stageW;
            const y = ny * stageH;
            const w = nw * stageW;
            const h = nh * stageH;

            container.position.set(x, y);
            container.zIndex = typeof box.zIndex === 'number' ? box.zIndex : 0;
            container.visible = !box.isHidden;

            const colors = this._getBoxColors(box);
            const borderColor = colors.borderColor;
            const bgColor = colors.bgColor;
            const bgAlpha = colors.bgAlpha;

            if (bg) {
                bg.clear();
                if (bgAlpha > 0) {
                    bg.beginFill(bgColor, bgAlpha);
                    bg.drawRect(0, 0, w, h);
                    bg.endFill();
                }
            }

            if (border) {
                border.clear();
                border.lineStyle({
                    width: 2,
                    color: borderColor,
                    alpha: 1
                });
                border.drawRect(0, 0, w, h);
            }

            if (box.rowType === 'TXT') {
                const PIXI = global.PIXI;

                if (!text && PIXI.Text) {
                    const style = this._createTextStyle(box, stageH);
                    text = new PIXI.Text({
                        text: this._getBoxText(box),
                        style
                    });
                    text.anchor.set(0.5);
                    container.addChild(text);
                    entry.text = text;
                }

                if (text) {
                    text.text = this._getBoxText(box);
                    text.style = this._createTextStyle(box, stageH);
                    text.visible = true;

                    let offsetX = w / 2;
                    let offsetY = h / 2;

                    const vAlign = text.style._wai_vAlign || 'middle';
                    if (vAlign === 'top') {
                        offsetY = h * 0.25;
                    } else if (vAlign === 'bottom') {
                        offsetY = h * 0.75;
                    }

                    text.position.set(offsetX, offsetY);
                }
            } else if (text) {
                text.visible = false;
            }
        },

        _getBoxColors(box) {
            const borderParsed = this._parseColorWithAlpha(
                box && box.color,
                0x22c55e,
                1.0
            );

            const bgParsed = this._parseColorWithAlpha(
                box && box.layerBgColor,
                0xffffff,
                0.04
            );

            return {
                borderColor: borderParsed.color,
                bgColor: bgParsed.color,
                bgAlpha: bgParsed.alpha
            };
        },

        _parseColorWithAlpha(color, defaultColor, defaultAlpha) {
            if (!color || typeof color !== 'string') {
                return { color: defaultColor, alpha: defaultAlpha };
            }

            const trimmed = color.trim().toLowerCase();
            if (trimmed === 'transparent') {
                return { color: defaultColor, alpha: 0 };
            }

            const rgbaMatch = trimmed.match(/rgba?\(([^)]+)\)/);
            if (rgbaMatch) {
                const parts = rgbaMatch[1].split(',').map(v => parseFloat(v.trim()));
                const r = parts[0] || 0;
                const g = parts[1] || 0;
                const b = parts[2] || 0;
                const a = (parts.length >= 4 && !isNaN(parts[3])) ? parts[3] : defaultAlpha;

                const hex = (r << 16) + (g << 8) + b;
                return { color: hex, alpha: a };
            }

            if (trimmed[0] === '#') {
                let hexStr = trimmed.slice(1);
                if (hexStr.length === 3) {
                    hexStr = hexStr.split('').map(c => c + c).join('');
                }
                if (hexStr.length === 6) {
                    const num = parseInt(hexStr, 16);
                    if (!isNaN(num)) {
                        return { color: num, alpha: defaultAlpha };
                    }
                }
            }

            return { color: defaultColor, alpha: defaultAlpha };
        },

        _recreateGuides() {
            if (!this.app || !this.guidesContainer) return;

            const PIXI = global.PIXI;
            const stageSize = this._getStageSize();
            const w = Math.max(1, stageSize.w || 1);
            const h = Math.max(1, stageSize.h || 1);

            if (this.guideGraphics && this.guideGraphics.parent) {
                this.guideGraphics.parent.removeChild(this.guideGraphics);
            }

            const g = new PIXI.Graphics();
            g.clear();

            const color = 0x94a3b8;
            const alpha = 0.35;

            g.lineStyle({ width: 1, color, alpha });

            const midY = h / 2;
            g.moveTo(0, midY);
            g.lineTo(w, midY);

            const midX = w / 2;
            g.moveTo(midX, 0);
            g.lineTo(midX, h);

            this.guidesContainer.addChild(g);
            this.guideGraphics = g;
        },

        _renderCanvas2D(wCss, hCss) {
            const ctx = this.ctx2d;
            if (!ctx) return;

            const w = wCss;
            const h = hCss;

            ctx.clearRect(0, 0, w, h);

            ctx.save();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
            ctx.lineWidth = 1;

            const midX = w / 2 + 0.5;
            const midY = h / 2 + 0.5;

            ctx.beginPath();
            ctx.moveTo(0, midY);
            ctx.lineTo(w, midY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(midX, 0);
            ctx.lineTo(midX, h);
            ctx.stroke();

            ctx.restore();
        },

        parseColorToRgb(color) {
            if (!color || typeof color !== 'string') return null;
            color = color.trim().toLowerCase();

            if (color[0] === '#') {
                let hex = color.slice(1);
                if (hex.length === 3) {
                    hex = hex.split('').map(c => c + c).join('');
                }
                if (hex.length !== 6) return null;
                const num = parseInt(hex, 16);
                if (isNaN(num)) return null;
                return {
                    r: (num >> 16) & 255,
                    g: (num >> 8) & 255,
                    b: num & 255
                };
            }

            const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
            if (rgbMatch) {
                const parts = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
                if (parts.length >= 3) {
                    return { r: parts[0], g: parts[1], b: parts[2] };
                }
            }
            return null;
        }
    };

    global.PreviewRenderer = PreviewRenderer;
})(window);

// ============================================
// Vue Component: PreviewCanvas
// ============================================
const PreviewCanvas = {
    template: `
        <div class="relative w-full h-full">
            <!-- Pixi 렌더링은 PreviewRenderer가 담당 -->
            <!-- 이 컴포넌트는 래퍼 역할만 수행 -->
        </div>
    `,
    props: {
        canvasBoxes: {
            type: Array,
            default: () => []
        },
        selectedBoxId: {
            type: String,
            default: null
        }
    },
    mounted() {
        console.log('[PreviewCanvas] Vue component mounted');
    },
    beforeUnmount() {
        console.log('[PreviewCanvas] Vue component unmounting');
    },
    methods: {
        setSelectedBoxId(id) {
            this.$emit('select-box', id);
        }
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.PreviewCanvas = PreviewCanvas;
}
