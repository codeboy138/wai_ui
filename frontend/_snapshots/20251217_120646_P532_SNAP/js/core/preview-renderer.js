// PreviewRenderer
// - Canvas2D 기반 프리뷰 렌더러
// - 줌 배율 표시
// - DOM PreviewCanvas가 박스 상호작용 담당

(function (global) {

    const PreviewRenderer = {
        // 캔버스 및 컨텍스트
        canvas: null,
        ctx: null,
        vm: null,
        dpr: global.devicePixelRatio || 1,
        handleResize: null,

        // 논리 캔버스 크기
        logicalCanvasSize: { w: 1920, h: 1080 },
        
        // 현재 재생 시간
        currentTime: 0,

        /**
         * 초기화
         * @param {HTMLCanvasElement} canvasEl
         * @param {VueComponent} vm - AppRoot 인스턴스
         */
        init(canvasEl, vm) {
            this.canvas = canvasEl;
            this.vm = vm;
            this.dpr = global.devicePixelRatio || 1;

            if (!this.canvas) {
                console.warn('[PreviewRenderer] canvas element not provided');
                return;
            }

            const ctx = this.canvas.getContext('2d');
            if (!ctx) {
                console.warn('[PreviewRenderer] Canvas2D context not available');
                return;
            }

            this.ctx = ctx;
            console.log('[PreviewRenderer] Canvas2D mode initialized');

            // 리사이즈 이벤트 등록
            this.handleResize = this.resize.bind(this);
            global.addEventListener('resize', this.handleResize);
            
            // 초기 리사이즈
            this.resize();
        },

        /**
         * 리사이즈 처리
         */
        resize() {
            if (!this.canvas || !this.ctx) return;

            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = Math.max(1, rect.width || 1);
            const cssHeight = Math.max(1, rect.height || 1);
            const dpr = this.dpr || 1;

            // 캔버스 크기 설정 (고해상도 대응)
            this.canvas.width = cssWidth * dpr;
            this.canvas.height = cssHeight * dpr;
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // 캔버스 클리어
            this.ctx.clearRect(0, 0, cssWidth, cssHeight);
            
            // 줌 배율 업데이트
            this._updateZoomFromCssHeight(cssHeight);
        },

        /**
         * 메인 렌더 (필요시 호출)
         */
        render() {
            if (!this.canvas || !this.ctx) return;

            const rect = this.canvas.getBoundingClientRect();
            const cssWidth = Math.max(1, rect.width || 1);
            const cssHeight = Math.max(1, rect.height || 1);

            // 캔버스 클리어만 수행 (가이드 렌더링 제거)
            this.ctx.clearRect(0, 0, cssWidth, cssHeight);
            
            // 줌 배율 업데이트
            this._updateZoomFromCssHeight(cssHeight);
        },

        /**
         * 줌 배율 업데이트
         */
        _updateZoomFromCssHeight(cssHeight) {
            const state = this.vm;
            const canvasSize = (state && state.canvasSize) ? state.canvasSize : { w: 1920, h: 1080 };
            const ch = canvasSize.h || 1;

            const scaleY = ch ? (cssHeight / ch) : 1;
            this.updateZoomIndicator(scaleY);
        },

        /**
         * 줌 인디케이터 UI 업데이트
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

        /**
         * 외부 API: 논리 캔버스 크기 설정
         */
        setCanvasSize(size) {
            if (!size) return;
            const w = size.w || size.width || this.logicalCanvasSize.w;
            const h = size.h || size.height || this.logicalCanvasSize.h;

            this.logicalCanvasSize = { w, h };
            this.resize();
        },

        /**
         * 외부 API: 박스 동기화 (호환성 유지, 실제 렌더링은 DOM이 담당)
         */
        syncBoxes(boxes, canvasSize) {
            if (canvasSize) {
                this.setCanvasSize(canvasSize);
            }
            // DOM PreviewCanvas가 박스 렌더링 담당
            // 이 메서드는 호환성을 위해 유지
        },

        /**
         * 외부 API: 드래그 중 박스 업데이트 (호환성 유지)
         */
        updateBoxDuringDrag(id, newX, newY, newW, newH) {
            // DOM PreviewCanvas가 드래그 처리
            // 이 메서드는 호환성을 위해 유지
        },
        
        /**
         * 외부 API: 현재 시간 설정 (재생 연동)
         */
        setCurrentTime(time) {
            this.currentTime = time;
            // 필요시 시간 기반 렌더링 처리
        },

        /**
         * 정리
         */
        destroy() {
            if (this.handleResize) {
                global.removeEventListener('resize', this.handleResize);
                this.handleResize = null;
            }
            this.canvas = null;
            this.ctx = null;
            this.vm = null;
        }
    };

    global.PreviewRenderer = PreviewRenderer;

})(window);
