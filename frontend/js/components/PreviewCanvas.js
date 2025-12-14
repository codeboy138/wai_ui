// Preview Canvas Component (pure JS drag/resize, px + canvasScale 기반)
const PreviewCanvas = {
    props: ['canvasBoxes', 'selectedBoxId'],
    template: `
        <div
            id="preview-canvas-overlay-root"
            ref="container"
            class="absolute inset-0 z-30 pointer-events-none"
            @click="$emit('select-box', null)"
        >
            <div
                v-for="box in canvasBoxes"
                :key="box.id"
                :id="'preview-canvas-box-' + box.id"
                class="canvas-box pointer-events-auto"
                :class="{ 'selected': selectedBoxId === box.id }"
                :style="boxStyle(box)"
                @mousedown.stop="onBoxMouseDown($event, box)"
                @mousemove.stop="onBoxMouseMove($event, box)"
                @mouseleave="onBoxMouseLeave($event)"
                @contextmenu.prevent="openLayerConfig(box.id)"
                data-action="js:selectCanvasBox"
            >
                <!-- 텍스트 박스 내용: 레이어 전체 영역 사용 -->
                <div
                    v-if="box.rowType === 'TXT'"
                    class="canvas-text-content"
                    :style="textStyle(box)"
                >
                    {{ effectiveText(box) }}
                </div>

                <!-- 모서리 ㄱ자 핸들 (시각용) -->
                <div class="box-handle bh-tl"></div>
                <div class="box-handle bh-tr"></div>
                <div class="box-handle bh-bl"></div>
                <div class="box-handle bh-br"></div>

                <!-- 레이어 레이블: 레이어 박스 하단 내부 (행별 좌/중/우 배치) -->
                <div
                    class="canvas-label-right"
                    :style="labelWrapperStyle(box)"
                >
                    <div
                        class="canvas-label-chip"
                        :style="labelChipStyle(box)"
                    >
                        <div class="canvas-label-line">
                            {{ labelText(box) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            // 드래그/리사이즈 상태
            dragMode: null,       // 'move' | 'resize' | null
            dragBoxId: null,
            dragStartMouse: { x: 0, y: 0 },
            dragStartBoxPx: { x: 0, y: 0, w: 0, h: 0 }, // px 기준
            dragCurrentBoxPx: null,                     // 드래그 중 최신 px
            dragEdges: { left: false, right: false, top: false, bottom: false },
            dragScale: 1.0,       // AppRoot.canvasScale
            dragDomEl: null,      // 드래그 중인 DOM 요소

            _mouseMoveHandler: null,
            _mouseUpHandler: null
        };
    },
    methods: {
        // ---------- 텍스트 표시 ----------
        defaultTextMessage() {
            return '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';
        },
        effectiveText(box) {
            if (box.textContent && box.textContent.trim().length > 0) {
                return box.textContent;
            }
            return this.defaultTextMessage();
        },

        // 레이어 박스 스타일: 점선 + 2px
        boxStyle(box) {
            return {
                display: box.isHidden ? 'none' : 'block',
                position: 'absolute',
                left: box.x + 'px',
                top: box.y + 'px',
                width: box.w + 'px',
                height: box.h + 'px',
                borderColor: box.color,
                borderStyle: 'dashed',
                borderWidth: '2px',
                boxSizing: 'border-box',
                zIndex: box.zIndex,
                backgroundColor: box.layerBgColor || '#000000'
            };
        },

        // 텍스트 영역: 레이어 전체, 좌/중/우 + 상/중/하 정렬
        textStyle(box) {
            const ts = box.textStyle || {};
            const fontSize = ts.fontSize || 48;

            const hAlign = ts.textAlign || 'center';   // left / center / right
            const vAlign = ts.vAlign   || 'middle';    // top / middle / bottom

            let justifyContent = 'center';
            if (hAlign === 'left')  justifyContent = 'flex-start';
            if (hAlign === 'right') justifyContent = 'flex-end';

            let alignItems = 'center';
            if (vAlign === 'top')    alignItems = 'flex-start';
            if (vAlign === 'bottom') alignItems = 'flex-end';

            return {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                padding: '8px',
                boxSizing: 'border-box',

                display: 'flex',
                alignItems,
                justifyContent,
                textAlign: hAlign,

                transform: 'none',

                color: ts.fillColor || '#ffffff',
                fontFamily: ts.fontFamily || 'Pretendard, system-ui, sans-serif',
                fontSize: fontSize + 'px',
                lineHeight: ts.lineHeight || 1.2,
                backgroundColor: ts.backgroundColor || 'transparent',
                WebkitTextStrokeColor: ts.strokeColor || 'transparent',
                WebkitTextStrokeWidth: (ts.strokeWidth || 0) + 'px',
                whiteSpace: 'pre-wrap'
            };
        },

        // ---------- 레이블 텍스트 ----------
        getColLabel(box) {
            const role = box.colRole || '';
            if (role === 'full') return '전체';
            if (role === 'high') return '상단';
            if (role === 'mid')  return '중단';
            if (role === 'low')  return '하단';
            return role || '';
        },
        getRowLabel(rowType) {
            if (rowType === 'EFF') return '이펙트';
            if (rowType === 'TXT') return '텍스트';
            if (rowType === 'BG')  return '배경';
            return rowType || '';
        },
        labelText(box) {
            const col = this.getColLabel(box);
            const row = this.getRowLabel(box.rowType);
            return `${col || ''} ${row || ''}`.trim();
        },

        labelWrapperStyle(box) {
            const marginX = 8;

            const style = {
                position: 'absolute',
                bottom: '0px',
                pointerEvents: 'none',
                zIndex: box.zIndex + 1
            };

            if (box.rowType === 'EFF') {
                style.left = marginX + 'px';
            } else if (box.rowType === 'BG') {
                style.right = marginX + 'px';
            } else {
                style.left = '50%';
                style.transform = 'translateX(-50%)';
            }

            return style;
        },

        labelChipStyle(box) {
            const base = box.color || '#22c55e';
            const rgb = this.parseColorToRgb(base);
            const bg = rgb
                ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`
                : 'rgba(34, 197, 94, 0.5)';

            const textColor = this.getContrastingTextColor(base);

            return {
                display: 'inline-block',
                minWidth: 'auto',
                maxWidth: '240px',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '2px solid ' + base,
                backgroundColor: bg,
                color: textColor,
                fontSize: '40px',
                lineHeight: '1.0',
                textAlign: 'center',
                boxSizing: 'border-box',
                textShadow: '0 0 4px rgba(0,0,0,0.7)'
            };
        },

        openLayerConfig(boxId) {
            if (this.$parent && typeof this.$parent.openLayerConfig === 'function') {
                this.$parent.openLayerConfig(boxId);
            }
        },

        getContrastingTextColor(bgColor) {
            const rgb = this.parseColorToRgb(bgColor);
            if (!rgb) return '#000000';
            const luminance =
                (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
            return luminance > 0.5 ? '#000000' : '#ffffff';
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
        },

        // ---------- 공통: 엣지 상태 계산 & 커서 결정 ----------
        getEdgeState(e, rect) {
            const edgeMargin = 8;
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

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
        getCursorForEdges({ nearLeft, nearRight, nearTop, nearBottom }) {
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

        // ---------- 드래그 / 리사이즈 (px + canvasScale, DOM + Pixi 동기) ----------
        onBoxMouseDown(e, box) {
            e.preventDefault();
            this.$emit('select-box', box.id);

            const target = e.currentTarget;
            const rect = target.getBoundingClientRect();
            const edgeState = this.getEdgeState(e, rect);

            const parent = this.$parent;
            this.dragScale = (parent && typeof parent.canvasScale === 'number')
                ? parent.canvasScale
                : 1.0;

            this.dragBoxId = box.id;
            this.dragStartMouse = { x: e.clientX, y: e.clientY };
            this.dragStartBoxPx = { x: box.x, y: box.y, w: box.w, h: box.h };
            this.dragCurrentBoxPx = { ...this.dragStartBoxPx };
            this.dragDomEl = target;

            const { nearLeft, nearRight, nearTop, nearBottom } = edgeState;

            if (nearLeft || nearRight || nearTop || nearBottom) {
                this.dragMode = 'resize';
                this.dragEdges = {
                    left: nearLeft,
                    right: nearRight,
                    top: nearTop,
                    bottom: nearBottom
                };
                target.style.cursor = this.getCursorForEdges(edgeState);
            } else {
                this.dragMode = 'move';
                this.dragEdges = { left: false, right: false, top: false, bottom: false };
                target.style.cursor = 'grabbing';
            }

            if (!this._mouseMoveHandler) {
                this._mouseMoveHandler = (ev) => this.handleMouseMove(ev);
                this._mouseUpHandler   = (ev) => this.handleMouseUp(ev);
            }
            window.addEventListener('mousemove', this._mouseMoveHandler);
            window.addEventListener('mouseup', this._mouseUpHandler);
        },

        onBoxMouseMove(e, box) {
            if (this.dragMode && this.dragBoxId === box.id) return;

            const target = e.currentTarget;
            const rect = target.getBoundingClientRect();
            const edgeState = this.getEdgeState(e, rect);
            target.style.cursor = this.getCursorForEdges(edgeState);
        },

        onBoxMouseLeave(e) {
            const target = e.currentTarget;
            if (!this.dragMode) {
                target.style.cursor = 'default';
            }
        },

        handleMouseMove(e) {
            if (!this.dragMode || !this.dragBoxId) return;

            const parent = this.$parent;
            const canvas = parent && parent.canvasSize
                ? parent.canvasSize
                : { w: 1920, h: 1080 };

            const cw = canvas.w || 1;
            const ch = canvas.h || 1;
            const scale = this.dragScale || 1.0;

            const dxCanvas = (e.clientX - this.dragStartMouse.x) / scale;
            const dyCanvas = (e.clientY - this.dragStartMouse.y) / scale;

            const start = this.dragStartBoxPx;
            let newX = start.x;
            let newY = start.y;
            let newW = start.w;
            let newH = start.h;

            if (this.dragMode === 'move') {
                newX = start.x + dxCanvas;
                newY = start.y + dyCanvas;

                newX = Math.max(0, Math.min(newX, cw - newW));
                newY = Math.max(0, Math.min(newY, ch - newH));
            } else if (this.dragMode === 'resize') {
                const edges = this.dragEdges;

                if (edges.left) {
                    newX = start.x + dxCanvas;
                    newW = start.w - dxCanvas;
                }
                if (edges.right) {
                    newW = start.w + dxCanvas;
                }
                if (edges.top) {
                    newY = start.y + dyCanvas;
                    newH = start.h - dyCanvas;
                }
                if (edges.bottom) {
                    newH = start.h + dyCanvas;
                }

                const minW = 10;
                const minH = 10;
                if (newW < minW) {
                    if (edges.left) newX -= (minW - newW);
                    newW = minW;
                }
                if (newH < minH) {
                    if (edges.top) newY -= (minH - newH);
                    newH = minH;
                }

                if (newX < 0) {
                    newW += newX;
                    newX = 0;
                }
                if (newY < 0) {
                    newH += newY;
                    newY = 0;
                }
                if (newX + newW > cw) newW = cw - newX;
                if (newY + newH > ch) newH = ch - newY;
            }

            this.dragCurrentBoxPx = { x: newX, y: newY, w: newW, h: newH };

            const el = this.dragDomEl || document.getElementById('preview-canvas-box-' + this.dragBoxId);
            this.dragDomEl = el;
            if (el) {
                el.style.left = newX + 'px';
                el.style.top = newY + 'px';
                el.style.width = newW + 'px';
                el.style.height = newH + 'px';
            }

            // --- PixiJS 쪽에도 드래그 중 실시간 반영 (데이터 모델은 그대로) ---
            if (window.PreviewRenderer && typeof window.PreviewRenderer.updateBoxDuringDrag === 'function') {
                window.PreviewRenderer.updateBoxDuringDrag(this.dragBoxId, newX, newY, newW, newH);
            }
        },

        handleMouseUp() {
            const boxId = this.dragBoxId;
            const mode = this.dragMode;

            window.removeEventListener('mousemove', this._mouseMoveHandler);
            window.removeEventListener('mouseup', this._mouseUpHandler);

            if (!mode || !boxId) {
                this.dragMode = null;
                this.dragBoxId = null;
                this.dragDomEl = null;
                this.dragCurrentBoxPx = null;
                return;
            }

            let finalPx = this.dragCurrentBoxPx || this.dragStartBoxPx;
            let { x, y, w, h } = finalPx;

            // 스냅 계산
            const snapResult = this.checkSnap(boxId, x, y, w, h);
            if (snapResult.snapped) {
                x = snapResult.x;
                y = snapResult.y;
                w = snapResult.w;
                h = snapResult.h;
            }

            // Vue 상태에 최종 결과 1회 반영
            if (this.$parent && typeof this.$parent.updateBoxPosition === 'function') {
                this.$parent.updateBoxPosition(boxId, x, y, w, h);
            }

            // DOM에도 스냅 적용 + 플래시
            const target = this.dragDomEl || document.getElementById('preview-canvas-box-' + boxId);
            if (target) {
                target.style.left = x + 'px';
                target.style.top = y + 'px';
                target.style.width = w + 'px';
                target.style.height = h + 'px';

                if (snapResult.snapped) {
                    this.triggerSnapFlash(target);
                }
            }

            this.dragMode = null;
            this.dragBoxId = null;
            this.dragDomEl = null;
            this.dragCurrentBoxPx = null;
        },

        // ---------- 스냅 & 플래시 ----------
        checkSnap(boxId, x, y, w, h) {
            const threshold = 8;
            let snapped = false;

            let left = x;
            let top = y;
            let right = x + w;
            let bottom = y + h;

            const canvas = this.$parent && this.$parent.canvasSize
                ? this.$parent.canvasSize
                : { w: 1920, h: 1080 };
            const canvasLeft = 0;
            const canvasTop = 0;
            const canvasRight = canvas.w;
            const canvasBottom = canvas.h;

            const snapTo = (value, target) =>
                Math.abs(value - target) <= threshold ? target : null;

            let s = snapTo(left, canvasLeft);
            if (s !== null) { left = s; right = left + w; snapped = true; }
            s = snapTo(right, canvasRight);
            if (s !== null) { right = s; left = right - w; snapped = true; }
            s = snapTo(top, canvasTop);
            if (s !== null) { top = s; bottom = top + h; snapped = true; }
            s = snapTo(bottom, canvasBottom);
            if (s !== null) { bottom = s; top = bottom - h; snapped = true; }

            const boxes = (this.canvasBoxes || []).filter(b => b.id !== boxId && !b.isHidden);
            for (const b of boxes) {
                const bLeft = b.x;
                const bRight = b.x + b.w;
                const bTop = b.y;
                const bBottom = b.y + b.h;

                let s2 = snapTo(left, bRight);
                if (s2 !== null) { left = s2; right = left + w; snapped = true; }
                s2 = snapTo(right, bLeft);
                if (s2 !== null) { right = s2; left = right - w; snapped = true; }
                s2 = snapTo(top, bBottom);
                if (s2 !== null) { top = s2; bottom = top + h; snapped = true; }
                s2 = snapTo(bottom, bTop);
                if (s2 !== null) { bottom = s2; top = bottom - h; snapped = true; }
            }

            return {
                x: left,
                y: top,
                w: right - left,
                h: bottom - top,
                snapped
            };
        },

        triggerSnapFlash(target) {
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.left = '-2px';
            flash.style.top = '-2px';
            flash.style.right = '-2px';
            flash.style.bottom = '-2px';
            flash.style.border = '2px solid #ffffff';
            flash.style.boxSizing = 'border-box';
            flash.style.pointerEvents = 'none';
            flash.style.opacity = '1';
            flash.style.transition = 'opacity 0.5s ease-out';

            target.appendChild(flash);
            requestAnimationFrame(() => { flash.style.opacity = '0'; });
            setTimeout(() => {
                if (flash.parentNode === target) target.removeChild(flash);
            }, 500);
        }
    }
};

window.PreviewCanvas = PreviewCanvas;
