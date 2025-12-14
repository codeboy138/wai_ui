// PreviewRenderer
// - 퍼센트 좌표(0~1)를 사용하는 프리뷰 렌더러 진입점
// - 기본: PixiJS(WebGL 2D) 기반으로 레이어 박스/텍스트를 렌더링
// - 폴백: Pixi 사용 불가 시 Canvas2D 로 중앙 십자 가이드만 렌더
// - DOM(PreviewCanvas) 쪽 드래그/리사이즈/레이블 동작은 그대로 유지

(function (global) {
    const DEFAULT_TEXT_MESSAGE = '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';

    const PreviewRenderer = {
        // 공통 정보
        canvas: null,
        vm: null,
        dpr: global.devicePixelRatio || 1,
        handleResize: null,

        // Pixi 모드
        app: null,              // PIXI.Application
        mode: null,             // 'pixi' | '2d' | null
        rootContainer: null,
        guidesContainer: null,
        layersContainer: null,
        guideGraphics: null,

        // Canvas2D 폴백
        ctx2d: null,

        // 논리 캔버스 크기(퍼센트 좌표 기준)
        logicalCanvasSize: { w: 1920, h: 1080 },

        // 박스 → Pixi 오브젝트 매핑
        boxEntries: new Map(),  // id -> { container, bg, border, text }
        _lastBoxes: [],

        /**
         * 초기화
         * @param {HTMLCanvasElement} canvasEl
         * @param {VueComponent} vm - AppRoot 인스턴스
         */
        async init(canvasEl, vm) {
            this.canvas = canvasEl;
            this.vm = vm;
            this.dpr = global.devicePixelRatio || 1;
            this.mode = null;

            if (!this.canvas) {
                console.warn('[PreviewRenderer] canvas element not provided');
                return;
            }

            // 1) PixiJS 시도 (v8 Application.init 사용)
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

            // 2) Pixi 사용 불가 → Canvas2D 폴백
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

        // ----------------------
        // Pixi 초기화 (v8)
        // ----------------------
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

            // 컨테이너 구성
            this.rootContainer = new PIXI.Container();

            this.layersContainer = new PIXI.Container();
            this.layersContainer.sortableChildren = true;

            this.guidesContainer = new PIXI.Container();

            this.rootContainer.addChild(this.layersContainer);
            this.rootContainer.addChild(this.guidesContainer);
            app.stage.addChild(this.rootContainer);

            this._recreateGuides();
        },

        // ----------------------
        // Canvas2D 폴백 초기화
        // ----------------------
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

        // ----------------------
        // 리사이즈 처리
        // ----------------------
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

        // ----------------------
        // 메인 렌더 루프 (Pixi ticker / rAF)
        // ----------------------
        render() {
            if (!this.canvas || !this.vm) return;

            const rect = this.canvas.getBoundingClientRect();
            const cssHeight = Math.max(1, rect.height || 1);
            this._updateZoomFromCssHeight(cssHeight);

            if (this.mode === '2d') {
                const cssWidth = Math.max(1, rect.width || 1);
                this._renderCanvas2D(cssWidth, cssHeight);
            }
            // Pixi 모드는 Application 이 자동 렌더
        },

        _loop2d() {
            if (this.mode !== '2d') return;
            this.render();
            global.requestAnimationFrame(this._loop2d.bind(this));
        },

        // ----------------------
        // 화면 배율 UI 갱신
        // ----------------------
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

        // ----------------------
        // 외부 API: 논리 캔버스 크기 설정
        // ----------------------
        setCanvasSize(size) {
            if (!size) return;
            const w = size.w || size.width || this.logicalCanvasSize.w;
            const h = size.h || size.height || this.logicalCanvasSize.h;
            this.logicalCanvasSize = { w, h };

            // 논리 크기 변경 시, 기존 박스도 다시 반영
            this._resyncBoxesAfterResize();
        },

        // ----------------------
        // 외부 API: 박스 동기화
        // canvasBoxes + canvasSize 를 받아 Pixi 레이어로 반영
        // ----------------------
        syncBoxes(boxes, canvasSize) {
            if (!Array.isArray(boxes)) {
                this._lastBoxes = [];
            } else {
                // 얕은 복사로 참조 보존
                this._lastBoxes = boxes.slice();
            }

            if (canvasSize) {
                this.setCanvasSize(canvasSize);
            }

            if (this.mode !== 'pixi' || !this.app || !this.layersContainer) {
                // Pixi 가 아직 준비되지 않았으면 조용히 패스
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

            // 더 이상 존재하지 않는 박스 제거
            for (const id of existingIds) {
                const entry = this.boxEntries.get(id);
                if (entry && entry.container && entry.container.parent) {
                    entry.container.parent.removeChild(entry.container);
                }
                this.boxEntries.delete(id);
            }
        },

        _resyncBoxesAfterResize() {
            if (this._lastBoxes && this._lastBoxes.length) {
                this.syncBoxes(this._lastBoxes, this.logicalCanvasSize);
            }
        },

        // 현재 Pixi 스테이지 크기(뷰 좌표 기준)
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

        // ----------------------
        // 박스 생성/업데이트
        // ----------------------
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

            const align = ts.textAlign || 'center';       // 'left' | 'center' | 'right'
            const vAlign = ts.vAlign || 'middle';         // 'top' | 'middle' | 'bottom'

            // Pixi TextStyle 옵션
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

            // 수직 정렬은 컨테이너에서 text.position 으로 처리하므로 여기서는 보관만
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

            // 0~1 클램프
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

            // 색상
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

            // 텍스트 레이어
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

                    // 기본은 박스 중앙
                    let offsetX = w / 2;
                    let offsetY = h / 2;

                    // 수평 정렬은 TextStyle.align + anchor 로 어느 정도 해결
                    // 수직 정렬은 vAlign 보조
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
            // 테두리 색: box.color
            const borderParsed = this._parseColorWithAlpha(
                box && box.color,
                0x22c55e,
                1.0
            );

            // 배경 색: box.layerBgColor (기본 rgba(255,255,255,0.02))
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

            // rgba(...) / rgb(...)
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

            // hex (#rgb / #rrggbb)
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

            // 그 외: 기본 값
            return { color: defaultColor, alpha: defaultAlpha };
        },

        // ----------------------
        // Pixi 중앙 십자 가이드
        // ----------------------
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

            const color = 0x94a3b8; // #94a3b8
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

        // ----------------------
        // Canvas2D 십자 가이드 렌더
        // ----------------------
        _renderCanvas2D(wCss, hCss) {
            const ctx = this.ctx2d;
            if (!ctx) return;

            const w = wCss;
            const h = hCss;

            ctx.clearRect(0, 0, w, h);

            ctx.save();
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'; // #94a3b8, 반투명
            ctx.lineWidth = 1;

            const midX = w / 2 + 0.5;
            const midY = h / 2 + 0.5;

            // 수평선
            ctx.beginPath();
            ctx.moveTo(0, midY);
            ctx.lineTo(w, midY);
            ctx.stroke();

            // 수직선
            ctx.beginPath();
            ctx.moveTo(midX, 0);
            ctx.lineTo(midX, h);
            ctx.stroke();

            ctx.restore();
        },

        // ----------------------
        // 색상 파서 (hex / rgba)
        // ----------------------
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
