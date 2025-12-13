// PreviewRenderer
// - 퍼센트 좌표(0~1)를 사용하는 프리뷰 전용 Canvas2D 렌더러 뼈대
// - 나중에 WebGL + SDF/MSDF 렌더러로 교체하기 위한 자리입니다.
// - 현재는 레이어 박스를 점선 사각형으로만 그리고,
//   프리뷰 화면 배율(%)을 상단 UI에 표시합니다.

(function (global) {
    const PreviewRenderer = {
        canvas: null,
        ctx: null,
        vm: null,
        dpr: global.devicePixelRatio || 1,

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

            // 캔버스 내부 픽셀 크기 = 화면 px * DPR
            this.canvas.width = Math.max(1, rect.width * dpr);
            this.canvas.height = Math.max(1, rect.height * dpr);

            // 그리기 좌표계를 CSS px 기준으로 맞춤
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            this.render();
        },

        loop() {
            this.render();
            global.requestAnimationFrame(this.loop.bind(this));
        },

        /**
         * 프리뷰 상단 화면 배율 표시 업데이트
         * - 기준: 논리 캔버스 높이 대비 실제 렌더 캔버스 높이 비율
         * - 예: hPix(360) / ch(1080) = 0.333... → 33%
         */
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
            const boxes = state.canvasBoxes || [];

            const cw = canvasSize.w || 1;
            const ch = canvasSize.h || 1;

            const rect = this.canvas.getBoundingClientRect();
            const wPix = rect.width || 1;
            const hPix = rect.height || 1;

            // 화면 배율 표시 갱신
            const scaleY = ch ? (hPix / ch) : 1;
            this.updateZoomIndicator(scaleY);

            this.ctx.clearRect(0, 0, wPix, hPix);

            this.ctx.save();
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([4, 2]);

            for (const box of boxes) {
                if (!box || box.isHidden) continue;

                // 퍼센트 좌표가 있으면 우선 사용, 없으면 px → 비율 변환
                const nx = (typeof box.nx === 'number') ? box.nx : (box.x || 0) / cw;
                const ny = (typeof box.ny === 'number') ? box.ny : (box.y || 0) / ch;
                const nw = (typeof box.nw === 'number') ? box.nw : (box.w || cw) / cw;
                const nh = (typeof box.nh === 'number') ? box.nh : (box.h || ch) / ch;

                const x = nx * wPix;
                const y = ny * hPix;
                const bw = nw * wPix;
                const bh = nh * hPix;

                this.ctx.strokeStyle = box.color || '#22c55e';
                this.ctx.strokeRect(x, y, bw, bh);
            }

            this.ctx.restore();
        }
    };

    function waitForVmAndCanvas() {
        const vm = global.vm;
        const canvas = document.getElementById('preview-render-canvas');

        if (vm && canvas) {
            PreviewRenderer.init(canvas, vm);
        } else {
            global.requestAnimationFrame(waitForVmAndCanvas);
        }
    }

    global.PreviewRenderer = PreviewRenderer;
    waitForVmAndCanvas();
})(window);
