// Preview Canvas Component
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
                @mousedown.stop="$emit('select-box', box.id)"
                @contextmenu.prevent="openLayerConfig(box.id)"
                data-x="0"
                data-y="0"
                data-action="js:selectCanvasBox"
            >
                <!-- 텍스트 박스 내용 (모달 상단 입력필드와 연동) -->
                <div
                    v-if="box.rowType === 'TXT'"
                    class="canvas-text-content"
                    :style="textStyle(box)"
                >
                    {{ effectiveText(box) }}
                </div>

                <!-- 모서리 ㄱ자 핸들 (선택 시 표시) -->
                <div class="box-handle bh-tl"></div>
                <div class="box-handle bh-tr"></div>
                <div class="box-handle bh-bl"></div>
                <div class="box-handle bh-br"></div>

                <!-- 우측 변 레이블 (해당 레이어 한 개만 표시) -->
                <div
                    class="canvas-label-right"
                    :style="labelWrapperStyle(box)"
                >
                    <div
                        class="canvas-label-chip"
                        :style="labelChipStyle(box)"
                    >
                        <div class="canvas-label-line">
                            {{ getColLabel(box) }}
                        </div>
                        <div class="canvas-label-line">
                            {{ getRowLabel(box.rowType) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {};
    },
    mounted() {
        this.initInteract();
    },
    updated() {
        this.initInteract();
    },
    methods: {
        // 텍스트 기본 문구 (box.textContent 없을 때)
        defaultTextMessage() {
            return '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요';
        },
        effectiveText(box) {
            if (box.textContent && box.textContent.trim().length > 0) {
                return box.textContent;
            }
            return this.defaultTextMessage();
        },

        // 박스 스타일: 점선 + 1px (0.5px의 2배)
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
                borderWidth: '1px',
                boxSizing: 'border-box',
                zIndex: box.zIndex,
                backgroundColor: box.layerBgColor || 'rgba(255,255,255,0.05)'
            };
        },

        // 텍스트 행간 겹침 방지 (lineHeight 1.2)
        textStyle(box) {
            const ts = box.textStyle || {};
            const fontSize = ts.fontSize || 48;
            return {
                color: ts.fillColor || '#ffffff',
                fontFamily: ts.fontFamily || 'Pretendard, system-ui, sans-serif',
                fontSize: fontSize + 'px',
                lineHeight: (ts.lineHeight || 1.2),
                backgroundColor: ts.backgroundColor || 'transparent',
                WebkitTextStrokeColor: ts.strokeColor || 'transparent',
                WebkitTextStrokeWidth: (ts.strokeWidth || 0) + 'px',
                whiteSpace: 'pre-wrap'
            };
        },

        // --- 레이블 텍스트 (컬럼/줄 이름) ---
        // 컬럼: 전체 / 상단 / 중단 / 하단
        getColLabel(box) {
            const role = box.colRole || '';
            if (role === 'full') return '전체';
            if (role === 'high') return '상단';
            if (role === 'mid')  return '중단';
            if (role === 'low')  return '하단';
            return role || '';
        },
        // 줄: 이펙트 / 텍스트 / 배경
        getRowLabel(rowType) {
            if (rowType === 'EFF') return '이펙트';
            if (rowType === 'TXT') return '텍스트';
            if (rowType === 'BG')  return '배경';
            return '';
        },

        // 레이블 래퍼 위치:
        // 기본: 박스 우측 외측 (x + w + margin)
        // 캔버스 밖으로 나가면 → 박스 내부 우측으로 이동
        labelWrapperStyle(box) {
            const margin = 6;
            const labelWidth = 120;
            const labelHeight = 40;

            const canvasSize = (this.$parent && this.$parent.canvasSize) || { w: 1920, h: 1080 };
            const canvasW = canvasSize.w;
            const canvasH = canvasSize.h;

            // 기본: 우측 외부
            let left = box.x + box.w + margin;
            let top = box.y + (box.h / 2) - (labelHeight / 2);

            // 우측 여유가 부족하면 → 박스 내부로 이동
            const outsideRight = left + labelWidth > canvasW;
            if (outsideRight) {
                left = box.x + box.w - labelWidth - margin;
                if (left < box.x + margin) {
                    left = box.x + margin;
                }
            }

            // 상/하단 캔버스 범위 보정
            if (top < 0) top = 0;
            if (top + labelHeight > canvasH) {
                top = canvasH - labelHeight;
            }

            return {
                position: 'absolute',
                left: left + 'px',
                top: top + 'px',
                pointerEvents: 'none',
                zIndex: box.zIndex + 1
            };
        },

        // 레이블 칩 스타일 (2행, 텍스트 1.5배: 대략 18px)
        labelChipStyle(box) {
            const bg = box.color || '#facc15';
            const textColor = this.getContrastingTextColor(bg);
            return {
                minWidth: '120px',
                padding: '4px 6px',
                borderRadius: '6px',
                border: '2px solid ' + bg,
                backgroundColor: bg,
                color: textColor,
                fontSize: '18px',     // 약 1.5배 크기
                lineHeight: '1.1',
                textAlign: 'center',
                boxSizing: 'border-box',
                textShadow: '0 0 4px rgba(0,0,0,0.6)'
            };
        },

        // 레이어 설정 모달 열기
        openLayerConfig(boxId) {
            if (this.$parent && typeof this.$parent.openLayerConfig === 'function') {
                this.$parent.openLayerConfig(boxId);
            }
        },

        // 배경색에 따라 가독성 좋은 텍스트 컬러 선택(흰/검)
        getContrastingTextColor(bgColor) {
            const rgb = this.parseColorToRgb(bgColor);
            if (!rgb) return '#000000';
            const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
            return luminance > 0.5 ? '#000000' : '#ffffff';
        },

        // #RRGGBB / rgb() / rgba() 를 {r,g,b} 로 변환
        parseColorToRgb(color) {
            if (!color || typeof color !== 'string') return null;
            color = color.trim().toLowerCase();

            // #rgb, #rrggbb
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

            // rgb(...) or rgba(...)
            const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
            if (rgbMatch) {
                const parts = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
                if (parts.length >= 3) {
                    return { r: parts[0], g: parts[1], b: parts[2] };
                }
            }

            return null;
        },

        // ------------------------------------------------
        // 드래그 & 리사이즈 (interact.js)
        // ------------------------------------------------
        initInteract() {
            const i = window.interact || window.interactjs;
            if (!i) {
                console.warn('[PreviewCanvas] interact.js not found');
                return;
            }

            const self = this;

            // 기존 바인딩 해제 후 다시 설정
            i('.canvas-box').unset();

            // ---------------------------
            // 드래그 (박스 내부 전체 영역)
            // ---------------------------
            i('.canvas-box')
                .draggable({
                    modifiers: [
                        i.modifiers.restrictRect({
                            restriction: 'parent',
                            endOnly: true
                        })
                    ],
                    listeners: {
                        move(event) {
                            const target = event.target;

                            // 숨김 박스는 무시
                            if (target.style.display === 'none') return;

                            const scaler = document.getElementById('preview-canvas-scaler');
                            let scale = 1.0;
                            if (scaler && scaler.style.transform) {
                                const m = scaler.style.transform.match(/scale\(([^)]+)\)/);
                                if (m) scale = parseFloat(m[1]) || 1.0;
                            }

                            let x = (parseFloat(target.getAttribute('data-x')) || 0) + (event.dx / scale);
                            let y = (parseFloat(target.getAttribute('data-y')) || 0) + (event.dy / scale);

                            target.style.transform = `translate(${x}px, ${y}px)`;
                            target.setAttribute('data-x', x);
                            target.setAttribute('data-y', y);
                        },
                        end(event) {
                            const target = event.target;

                            const scaler = document.getElementById('preview-canvas-scaler');
                            let scale = 1.0;
                            if (scaler && scaler.style.transform) {
                                const m = scaler.style.transform.match(/scale\(([^)]+)\)/);
                                if (m) scale = parseFloat(m[1]) || 1.0;
                            }

                            const boxId = target.id.replace('preview-canvas-box-', '');
                            const box = self.canvasBoxes.find(b => b.id === boxId);
                            if (!box) {
                                target.removeAttribute('data-x');
                                target.removeAttribute('data-y');
                                target.style.transform = 'translate(0, 0)';
                                return;
                            }

                            const dx = parseFloat(target.getAttribute('data-x')) || 0;
                            const dy = parseFloat(target.getAttribute('data-y')) || 0;

                            let newX = box.x + dx;
                            let newY = box.y + dy;

                            // 스냅(자석) 처리
                            const snapResult = self.checkSnap(boxId, newX, newY, box.w, box.h);
                            newX = snapResult.x;
                            newY = snapResult.y;

                            if (self.$parent && typeof self.$parent.updateBoxPosition === 'function') {
                                self.$parent.updateBoxPosition(boxId, newX, newY, undefined, undefined);
                            }

                            if (snapResult.snapped) {
                                self.triggerSnapFlash(target);
                            }

                            target.removeAttribute('data-x');
                            target.removeAttribute('data-y');
                            target.style.transform = 'translate(0, 0)';
                        }
                    }
                })

                // ---------------------------
                // 리사이즈 (변 5px 영역만)
                // ---------------------------
                .resizable({
                    edges: { left: true, right: true, bottom: true, top: true },
                    margin: 5,
                    modifiers: [
                        i.modifiers.restrictEdges({ outer: 'parent' })
                    ],
                    listeners: {
                        move(event) {
                            const target = event.target;

                            if (target.style.display === 'none') return;

                            const scaler = document.getElementById('preview-canvas-scaler');
                            let scale = 1.0;
                            if (scaler && scaler.style.transform) {
                                const m = scaler.style.transform.match(/scale\(([^)]+)\)/);
                                if (m) scale = parseFloat(m[1]) || 1.0;
                            }

                            let x = (parseFloat(target.dataset.x) || 0) + (event.deltaRect.left / scale);
                            let y = (parseFloat(target.dataset.y) || 0) + (event.deltaRect.top / scale);

                            Object.assign(target.style, {
                                width: `${event.rect.width / scale}px`,
                                height: `${event.rect.height / scale}px`,
                                transform: `translate(${x}px, ${y}px)`
                            });
                            Object.assign(target.dataset, { x, y });
                        },
                        end(event) {
                            const target = event.target;
                            const scaler = document.getElementById('preview-canvas-scaler');
                            let scale = 1.0;
                            if (scaler && scaler.style.transform) {
                                const m = scaler.style.transform.match(/scale\(([^)]+)\)/);
                                if (m) scale = parseFloat(m[1]) || 1.0;
                            }

                            const boxId = target.id.replace('preview-canvas-box-', '');
                            const box = self.canvasBoxes.find(b => b.id === boxId);
                            if (!box) {
                                target.removeAttribute('data-x');
                                target.removeAttribute('data-y');
                                target.style.transform = 'translate(0, 0)';
                                target.style.width = null;
                                target.style.height = null;
                                return;
                            }

                            const dx = parseFloat(target.dataset.x) || 0;
                            const dy = parseFloat(target.dataset.y) || 0;

                            let newX = box.x + dx;
                            let newY = box.y + dy;
                            let newW = event.rect.width / scale;
                            let newH = event.rect.height / scale;

                            const snapResult = self.checkSnap(boxId, newX, newY, newW, newH);
                            newX = snapResult.x;
                            newY = snapResult.y;
                            newW = snapResult.w;
                            newH = snapResult.h;

                            if (self.$parent && typeof self.$parent.updateBoxPosition === 'function') {
                                self.$parent.updateBoxPosition(
                                    boxId,
                                    newX,
                                    newY,
                                    newW,
                                    newH
                                );
                            }

                            if (snapResult.snapped) {
                                self.triggerSnapFlash(target);
                            }

                            target.removeAttribute('data-x');
                            target.removeAttribute('data-y');
                            target.style.transform = 'translate(0, 0)';
                            target.style.width = null;
                            target.style.height = null;
                        }
                    }
                });
        },

        // 캔버스/다른 박스와의 스냅 + 플래시 판정
        checkSnap(boxId, x, y, w, h) {
            const threshold = 8;
            let snapped = false;

            let left = x;
            let top = y;
            let right = x + w;
            let bottom = y + h;

            const canvasSize = (this.$parent && this.$parent.canvasSize) || { w: 1920, h: 1080 };
            const canvasLeft = 0;
            const canvasTop = 0;
            const canvasRight = canvasSize.w;
            const canvasBottom = canvasSize.h;

            const snapTo = (value, target) => {
                return Math.abs(value - target) <= threshold ? target : null;
            };

            // 캔버스 아웃라인 스냅
            let s = snapTo(left, canvasLeft);
            if (s !== null) { left = s; right = left + w; snapped = true; }
            s = snapTo(right, canvasRight);
            if (s !== null) { right = s; left = right - w; snapped = true; }
            s = snapTo(top, canvasTop);
            if (s !== null) { top = s; bottom = top + h; snapped = true; }
            s = snapTo(bottom, canvasBottom);
            if (s !== null) { bottom = s; top = bottom - h; snapped = true; }

            // 다른 박스와의 스냅 (숨김 박스 제외)
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

        // 2px 흰색 플래시 (0.5초)
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

            requestAnimationFrame(() => {
                flash.style.opacity = '0';
            });

            setTimeout(() => {
                if (flash.parentNode === target) {
                    target.removeChild(flash);
                }
            }, 500);
        }
    }
};

// 전역 등록용
window.PreviewCanvas = PreviewCanvas;
