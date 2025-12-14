// PreviewRenderer
// - 퍼센트 좌표(0~1)를 사용하는 프리뷰 전용 렌더러
// - WebGL(가능 시) + Canvas2D(폴백) 구조
// - 현재는 레이어 박스를 WebGL로 선(라인)으로만 그리며,
//   화면 배율(%)을 상단 UI에 표시합니다.
// - DOM 박스(PreviewCanvas)는 그대로 유지되어 드래그/리사이즈/레이블 UI를 담당합니다.

(function (global) {
    const PreviewRenderer = {
        canvas: null,
        vm: null,

        // 모드: 'webgl' | '2d' | null
        mode: null,

        // WebGL 관련
        gl: null,
        glProgram: null,
        glBuffer: null,
        aPositionLoc: null,
        uColorLoc: null,

        // Canvas2D 관련 (폴백용)
        ctx2d: null,

        dpr: global.devicePixelRatio || 1,
        handleResize: null,

        init(canvasEl, vm) {
            this.canvas = canvasEl;
            this.vm = vm;
            this.dpr = global.devicePixelRatio || 1;

            // 1) WebGL 시도
            if (this.initWebGL()) {
                this.mode = 'webgl';
                console.log('[PreviewRenderer] WebGL mode enabled');
            } else {
                // 2) 실패 시 Canvas2D 폴백
                this.ctx2d = canvasEl.getContext('2d');
                if (this.ctx2d) {
                    this.mode = '2d';
                    console.log('[PreviewRenderer] Canvas2D fallback mode');
                } else {
                    this.mode = null;
                    console.warn('[PreviewRenderer] No rendering context available');
                    return;
                }
            }

            this.handleResize = this.resize.bind(this);
            global.addEventListener('resize', this.handleResize);

            this.resize();
            this.loop();
        },

        // -------- WebGL 초기화 --------
        initWebGL() {
            const canvas = this.canvas;
            if (!canvas) return false;

            const gl =
                canvas.getContext('webgl2', { antialias: true }) ||
                canvas.getContext('webgl', { antialias: true });

            if (!gl) return false;

            this.gl = gl;

            const vsSource = `
                attribute vec2 a_position;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }
            `;

            const fsSource = `
                precision mediump float;
                uniform vec4 u_color;
                void main() {
                    gl_FragColor = u_color;
                }
            `;

            const vs = this._createShader(gl, gl.VERTEX_SHADER, vsSource);
            const fs = this._createShader(gl, gl.FRAGMENT_SHADER, fsSource);
            if (!vs || !fs) return false;

            const program = this._createProgram(gl, vs, fs);
            if (!program) return false;

            this.glProgram = program;
            gl.useProgram(program);

            this.aPositionLoc = gl.getAttribLocation(program, 'a_position');
            this.uColorLoc = gl.getUniformLocation(program, 'u_color');

            this.glBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
            gl.enableVertexAttribArray(this.aPositionLoc);
            gl.vertexAttribPointer(this.aPositionLoc, 2, gl.FLOAT, false, 0, 0);

            return true;
        },

        _createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.warn('[PreviewRenderer] Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        },

        _createProgram(gl, vs, fs) {
            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.warn('[PreviewRenderer] Program link error:', gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
            return program;
        },

        // -------- 리사이즈 --------
        resize() {
            if (!this.canvas) return;

            const rect = this.canvas.getBoundingClientRect();
            const dpr = this.dpr || 1;

            const w = Math.max(1, rect.width * dpr);
            const h = Math.max(1, rect.height * dpr);

            this.canvas.width = w;
            this.canvas.height = h;

            // WebGL은 viewport 설정
            if (this.mode === 'webgl' && this.gl) {
                this.gl.viewport(0, 0, w, h);
            }
            // Canvas2D 는 좌표계를 CSS px 기준으로 맞춤
            if (this.mode === '2d' && this.ctx2d) {
                this.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            this.render();
        },

        loop() {
            this.render();
            global.requestAnimationFrame(this.loop.bind(this));
        },

        // -------- 화면 배율 표시 --------
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

        // -------- 메인 렌더 --------
        render() {
            if (!this.canvas || !this.vm || !this.mode) return;

            const state = this.vm;
            const canvasSize = state.canvasSize || { w: 1920, h: 1080 };
            const cw = canvasSize.w || 1;
            const ch = canvasSize.h || 1;

            const rect = this.canvas.getBoundingClientRect();
            const wPix = rect.width || 1;
            const hPix = rect.height || 1;

            // 화면 배율 표시 갱신 (논리 높이 대비 실제 렌더 높이)
            const scaleY = ch ? (hPix / ch) : 1;
            this.updateZoomIndicator(scaleY);

            if (this.mode === 'webgl') {
                this.renderWebGL(cw, ch);
            } else if (this.mode === '2d') {
                this.renderCanvas2D(wPix, hPix);
            }
        },

        // -------- WebGL 렌더 (박스 라인) --------
        renderWebGL(cw, ch) {
            const gl = this.gl;
            if (!gl || !this.glProgram) return;

            gl.useProgram(this.glProgram);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const boxes = this.vm.canvasBoxes || [];
            if (!boxes.length) return;

            for (const box of boxes) {
                if (!box || box.isHidden) continue;

                const x = box.x || 0;
                const y = box.y || 0;
                const w = box.w || 0;
                const h = box.h || 0;

                if (w <= 0 || h <= 0) continue;

                // 논리 좌표(0~cw, 0~ch) → 클립좌표(-1~1, -1~1)
                const left   = (x / cw) * 2 - 1;
                const right  = ((x + w) / cw) * 2 - 1;
                const top    = 1 - (y / ch) * 2;
                const bottom = 1 - ((y + h) / ch) * 2;

                // 사각형 외곽선 4개 라인 (GL_LINES)
                const positions = new Float32Array([
                    left,  top,    right, top,    // 상
                    right, top,    right, bottom, // 우
                    right, bottom, left,  bottom, // 하
                    left,  bottom, left,  top     // 좌
                ]);

                gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STREAM_DRAW);

                gl.enableVertexAttribArray(this.aPositionLoc);
                gl.vertexAttribPointer(this.aPositionLoc, 2, gl.FLOAT, false, 0, 0);

                // 색상: box.color 사용 (hex → RGB)
                const rgb = this.parseColorToRgb(box.color || '#22c55e') || { r: 34, g: 197, b: 94 };
                const r = rgb.r / 255;
                const g = rgb.g / 255;
                const b = rgb.b / 255;
                const a = 0.9; // 약간 투명

                gl.uniform4f(this.uColorLoc, r, g, b, a);

                gl.drawArrays(gl.LINES, 0, positions.length / 2);
            }
        },

        // -------- Canvas2D 렌더 (폴백) --------
        renderCanvas2D(wPix, hPix) {
            const ctx = this.ctx2d;
            if (!ctx) return;
            // 현재는 캔버스만 지우고, 박스는 DOM(PreviewCanvas)에서만 표현
            ctx.clearRect(0, 0, wPix, hPix);
        },

        // -------- 색상 파서 (hex / rgba) --------
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
