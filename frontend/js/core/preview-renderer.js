// PreviewRenderer
// - 퍼센트 좌표(0~1)를 사용하는 프리뷰 전용 Canvas2D 렌더러 뼈대
// - 나중에 WebGL + SDF/MSDF 렌더러로 교체하기 위한 자리입니다.
// - 현재는 화면 배율(%)만 갱신하고, 박스는 DOM(PreviewCanvas)에서만 보이도록 합니다.

(function (global) {
    const PreviewRenderer = {
        canvas: null,
        ctx: null,
        vm: null,
        dpr: global.devicePixelRatio || 1,
        handleResize: null,

        init(canvasEl, vm) {
            this.canvas = canvasEl;
            this.ctx = canvasEl.getContext('2d');
            this.vm = vm;

            if (!this.ctx || !this.vm) return;

            this.handleResize = this.resize.bind(this);
            global.addEventListener('resize', this.handleResize);

            this.resize();
            this.loop();
        },

        resize() {
            if (!this.canvas || !this.ctx) return;

            const rect = this.canvas.getBoundingClientRect();
            const dpr = this.dpr || 1;

            this.canvas.width = Math.max(1, rect.width * dpr);
            this.canvas.height = Math.max(1, rect.height * dpr);

            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            this.render();
        },

        loop() {
            this.render();
            global.requestAnimationFrame(this.loop.bind(this));
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

        render() {
            if (!this.ctx || !this.vm) return;
            const state = this.vm;
            const canvasSize = state.canvasSize || { w: 1920, h: 1080 };

            const cw = canvasSize.w || 1;
            const ch = canvasSize.h || 1;

            const rect = this.canvas.getBoundingClientRect();
            const wPix = rect.width || 1;
            const hPix = rect.height || 1;

            // 화면 배율 표시 갱신
            const scaleY = ch ? (hPix / ch) : 1;
            this.updateZoomIndicator(scaleY);

            // 캔버스만 지우고, 박스는 그리지 않음 (DOM 박스만 사용)
            this.ctx.clearRect(0, 0, wPix, hPix);
        }
    };

    global.PreviewRenderer = PreviewRenderer;
})(window);
