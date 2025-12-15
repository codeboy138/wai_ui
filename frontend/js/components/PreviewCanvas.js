console.log('[PreviewCanvas] script loaded (debug-move)');

const PreviewCanvas = {
    props: ['canvasBoxes', 'selectedBoxId'],
    template: `...같음...`, // 템플릿은 생략. 기존 템플릿 그대로 유지

    // ⬇︎ data/스타일/기존 메서드는 모두 유지 (아래 handleMouseMove만 교체)
    data() { ... 기존과 동일 ... },
    beforeUnmount() { ... 기존과 동일 ... },
    methods: {
        // ... clientToCanvas, boxStyle, textStyle, handleStyle, labelStyle 등 기존 그대로 ...

        onBoxMouseDown(e, box) { ... 기존 그대로 ... },
        onHandleMouseDown(e, box, pos) { ... 기존 그대로 ... },
        onBoxMouseMove(e, box) { /* 그대로 비워둠 */ },
        onBoxMouseLeave(e) { /* 그대로 비워둠 */ },

        // ---------- 실제 이동/리사이즈 처리 (델타 방식, 내부 진입 허용) + 디버그 로그 ----------
        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;

            const parent = this.$parent;
            if (!parent || typeof parent.updateBoxPosition !== 'function') return;

            const { x: mCanvasX, y: mCanvasY } = this.clientToCanvas(e);

            // 마우스 이동량 (composition px)
            const dx = mCanvasX - this.dragStartMouseCanvas.x;
            const dy = mCanvasY - this.dragStartMouseCanvas.y;

            const x0 = this.dragStartBox.x;
            const y0 = this.dragStartBox.y;
            const w0 = this.dragStartBox.w;
            const h0 = this.dragStartBox.h;

            let x = x0;
            let y = y0;
            let w = w0;
            let h = h0;

            if (this.dragMode === 'move') {
                x = x0 + dx;
                y = y0 + dy;
            } else if (this.dragMode === 'resize') {
                switch (this.resizeHandlePos) {
                    case 'tl':
                        x = x0 + dx;
                        y = y0 + dy;
                        w = w0 - dx;
                        h = h0 - dy;
                        break;
                    case 'tr':
                        x = x0;
                        y = y0 + dy;
                        w = w0 + dx;
                        h = h0 - dy;
                        break;
                    case 'bl':
                        x = x0 + dx;
                        y = y0;
                        w = w0 - dx;
                        h = h0 + dy;
                        break;
                    case 'br':
                        x = x0;
                        y = y0;
                        w = w0 + dx;
                        h = h0 + dy;
                        break;
                }

                // 최소 크기: w,h 값만 clamp (x,y는 건드리지 않음 → 모서리가 안쪽까지 따라올 수 있음)
                const minW = 10;
                const minH = 10;
                if (w < minW) w = minW;
                if (h < minH) h = minH;
            }

            // 🔵 디버그 로그: 리사이즈 시 dx,dy,x,y,w,h 찍기
            if (this.dragMode === 'resize') {
                console.log(
                    '[PreviewCanvas] resize move',
                    'handle=', this.resizeHandlePos,
                    'dx=', dx.toFixed(1), 'dy=', dy.toFixed(1),
                    'x=', x.toFixed(1), 'y=', y.toFixed(1),
                    'w=', w.toFixed(1), 'h=', h.toFixed(1)
                );
            }

            if (!Number.isFinite(x) || !Number.isFinite(y) ||
                !Number.isFinite(w) || !Number.isFinite(h)) {
                console.warn('[PreviewCanvas] non-finite', { x, y, w, h });
                return;
            }

            parent.updateBoxPosition(this.dragBoxId, x, y, w, h);
        },

        handleMouseUp() { ... 기존 그대로 ... }
    }
};

window.PreviewCanvas = PreviewCanvas;
