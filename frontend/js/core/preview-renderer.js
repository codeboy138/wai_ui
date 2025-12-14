// PreviewRenderer
// - 퍼센트 좌표(0~1)를 사용하는 프리뷰 전용 렌더러 진입점
// - 기본: PixiJS(WebGL 2D) 기반
// - 폴백: Pixi 사용 불가 시 Canvas2D 로 중앙 십자 가이드만 렌더
// - DOM / Vue 상태(AppRoot.canvasSize 등) 구조는 그대로 사용

(function (global) {
    const PreviewRenderer = {
        // 공통
        canvas: null,
        vm: null,
        dpr: global.devicePixelRatio || 1,
        handleResize: null,

        // Pixi 모드
        app: null,              // PIXI.Application
        rootContainer: null,    // stage 하위 루트 컨테이너
        guidesContainer: null,  // 중앙 가이드 전용 컨테이너
        guideGraphics: null,    // 가이드 라인 Graphics

        // Canvas2D 폴백 모드
        ctx2d: null,

        // 현재 모드: 'pixi' | '2d' | null
        mode: null,

        /**
         * 초기화
         * @param {HTMLCanvasElement} canvasEl
         * @param {VueComponent} vm - AppRoot 인스턴스
         */
        init(canvasEl, vm) {
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
                    this._initPixi();
                    this.mode = 'pixi';
                    console.log('[PreviewRenderer] PixiJS mode enabled');
                } catch (err) {
                    console.warn('[PreviewRenderer] Pixi init failed, fallback to Canvas2D:', err);
                    this._initCanvas2D();
                }
            } else {
                // 2) Pixi 사용 불가 → Canvas2D 폴백
                this._initCanvas2D();
            }

            if (!this.mode) {
                console.warn('[PreviewRenderer] No rendering mode available');
                return;
            }

            // 리사이즈 이벤트
            this.handleResize = this.resize.bind(this);
            global.addEventListener('resize', this.handleResize);

            // 초기 리사이즈 & 루프 시작
            this.resize();

            if (this.mode === 'pixi' && this.app && this.app.ticker) {
                this.app.ticker.add(this.render, this);
            } else if (this.mode === '2d') {
                this._loop2d();
            }
        },

        // ----------------------
        // Pixi 초기화
        // ----------------------
        _initPixi() {
            const PIXI = global.PIXI;
            const rect = this.canvas.getBoundingClientRect();
            const width = Math.max(1, rect.width || 1);
            const height = Math.max(1, rect.height || 1);

            const app = new PIXI.Application({
                view: this.canvas,
                width,
                height,
                antialias: true,
                resolution: this.dpr,
                autoDensity: true,
                backgroundAlpha: 0
            });

            this.app = app;

            // 루트 컨테이너
            this.rootContainer = new PIXI.Container();
            app.stage.addChild(this.rootContainer);

            // 가이드 컨테이너
            this.guidesContainer = new PIXI.Container();
            this.rootContainer.addChild(this.guidesContainer);

            // 초기 가이드 생성
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
            const dpr = this.dpr || 1;
            const cssWidth = Math.max(1, rect.width || 1);
            const cssHeight = Math.max(1, rect.height || 1);

            if (this.mode === 'pixi' && this.app) {
                // Pixi 렌더러 리사이즈 (CSS px 기준)
                this.app.renderer.resolution = dpr;
                this.app.renderer.resize(cssWidth, cssHeight);
                this._recreateGuides();
            } else if (this.mode === '2d' && this.ctx2d) {
                // 내부 버퍼 크기 = CSS * DPR
                const w = cssWidth * dpr;
                const h = cssHeight * dpr;
                this.canvas.width = w;
                this.canvas.height = h;
                this.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
                this._renderCanvas2D(cssWidth, cssHeight);
            }

            // 리사이즈 시 한 번 배율 갱신
            this._updateZoomIndicatorFromCanvasSize(cssHeight);
        },

        // ----------------------
        // 메인 렌더 루프 (Pixi ticker / rAF)
        // ----------------------
        render() {
            if (!this.canvas || !this.vm) return;

            const rect = this.canvas.getBoundingClientRect();
            const cssHeight = Math.max(1, rect.height || 1);

            this._updateZoomIndicatorFromCanvasSize(cssHeight);

            // Pixi 모드는 stage 가 자동 렌더되므로 여기서 별도 draw 없음
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

        // ----------------------
        // 화면 배율 UI 갱신
        // ----------------------
        _updateZoomIndicatorFromCanvasSize(cssHeight) {
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
        // Pixi 중앙 십자 가이드
        // ----------------------
        _recreateGuides() {
            if (!this.app || !this.guidesContainer) return;

            const PIXI = global.PIXI;
            const renderer = this.app.renderer;
            const w = Math.max(1, renderer.width || 1);
            const h = Math.max(1, renderer.height || 1);

            // 이전 가이드 제거
            if (this.guideGraphics && this.guideGraphics.parent) {
                this.guideGraphics.parent.removeChild(this.guideGraphics);
            }

            const g = new PIXI.Graphics();
            g.clear();

            const color = 0x94a3b8; // #94a3b8
            const alpha = 0.35;

            g.lineStyle({ width: 1, color, alpha });

            // 수평선
            const midY = h / 2;
            g.moveTo(0, midY);
            g.lineTo(w, midY);

            // 수직선
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
        // 색상 파서 (현재는 사용하지 않지만, 향후 용도 대비 유지)
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
