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
                v-for="box in visibleBoxes"
                :key="box.id"
                :id="'preview-canvas-box-' + box.id"
                class="canvas-box pointer-events-auto"
                :class="{ 'selected': selectedBoxId === box.id }"
                :style="boxStyle(box)"
                @click.stop="$emit('select-box', box.id)"
                @contextmenu.prevent="openLayerConfig(box.id)"
                data-x="0"
                data-y="0"
                data-action="js:selectCanvasBox"
            >
                <div
                    class="canvas-label"
                    :style="labelStyle(box)"
                >
                    {{ box.layerName || ('Z:' + box.zIndex) }}
                </div>

                <div
                    v-if="box.rowType === 'TXT' && box.textStyle"
                    class="canvas-text-content"
                    :style="textStyle(box)"
                >
                    텍스트
                </div>

                <div class="box-handle bh-tl"></div>
                <div class="box-handle bh-tr"></div>
                <div class="box-handle bh-bl"></div>
                <div class="box-handle bh-br"></div>
            </div>
        </div>
    `,
    computed: {
        // 숨김 처리된 레이어는 프리뷰/스냅에서 제외
        visibleBoxes() {
            return (this.canvasBoxes || []).filter(b => !b.isHidden);
        }
    },
    mounted() {
        this.initInteract();
    },
    updated() {
        this.initInteract();
    },
    methods: {
        boxStyle(box) {
            return {
                left: box.x + 'px',
                top: box.y + 'px',
                width: box.w + 'px',
                height: box.h + 'px',
                borderColor: box.color,
                zIndex: box.zIndex,
                backgroundColor: box.layerBgColor || 'rgba(255,255,255,0.05)'
            };
        },
        textStyle(box) {
            const ts = box.textStyle || {};
            return {
                color: ts.fillColor || '#ffffff',
                fontFamily: ts.fontFamily || 'Pretendard, system-ui, sans-serif',
                fontSize: (ts.fontSize || 48) + 'px',
                backgroundColor: ts.backgroundColor || 'transparent',
                WebkitTextStrokeColor: ts.strokeColor || 'transparent',
                WebkitTextStrokeWidth: (ts.strokeWidth || 0) + 'px'
            };
        },
        // 라벨 위치: Effect / Text / BG → 하단 3등분
        labelStyle(box) {
            const base = {
                bottom: '0px',
                height: '16px',
                lineHeight: '16px',
                fontSize: '10px',
                fontWeight: 'bold',
                position: 'absolute',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            };

            let left = '0%';
            let width = '100%';
            let textAlign = 'center';

            if (box.rowType === 'EFF') {
                left = '0%';
                width = '33.333%';
                textAlign = 'left';
            } else if (box.rowType === 'TXT') {
                left = '33.333%';
                width = '33.333%';
                textAlign = 'center';
            } else if (box.rowType === 'BG') {
                left = '66.666%';
                width = '33.333%';
                textAlign = 'right';
            }

            const bg = box.color || '#3b82f6';
            const fg = this.getComplementColor(bg);

            return Object.assign({}, base, {
                left,
                width,
                textAlign,
                backgroundColor: bg,
                color: fg
            });
        },
        //  보색 계산 (hex 6자리 기준)
        getComplementColor(color) {
            if (!color) return '#ffffff';
            const hex = color.replace('#', '').trim();
            if (hex.length !== 6) return '#ffffff';
            const r = 255 - parseInt(hex.slice(0, 2), 16);
            const g = 255 - parseInt(hex.slice(2, 4), 16);
            const b = 255 - parseInt(hex.slice(4, 6), 16);
            const toHex = v => v.toString(16).padStart(2, '0');
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        },
        openLayerConfig(boxId) {
            if (this.$parent && typeof this.$parent.openLayerConfig === 'function') {
                this.$parent.openLayerConfig(boxId);
            }
        },
        initInteract() {
            const i = window.interact;
            if (!i) {
                console.warn('[PreviewCanvas] window.interact not found');
                return;
            }

            const self = this;

            i('.canvas-box').unset();

            // 드래그
            i('.canvas-box').draggable({
                modifiers: [
                    i.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                listeners: {
                    move(e) {
                        const target = e.target;
                        const scaler = document.getElementById('preview-canvas-scaler');
                        const scaleMatch = scaler && scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;

                        let x = (parseFloat(target.getAttribute('data-x')) || 0) + (e.dx / scale);
                        let y = (parseFloat(target.getAttribute('data-y')) || 0) + (e.dy / scale);

                        const guideV = document.getElementById('preview-guide-v');
                        if (guideV) {
                            const boxId = target.id.replace('preview-canvas-box-', '');
                            const box = self.visibleBoxes.find(b => b.id === boxId);
                            const canvasW = (self.$parent && self.$parent.canvasSize) ? self.$parent.canvasSize.w : 1920;
                            const centerX = canvasW / 2;

                            const baseLeft = box ? box.x : 0;
                            const newLeft = baseLeft + x;
                            const newWidth = box ? box.w : (e.rect.width / scale);
                            const cx = newLeft + (newWidth / 2);

                            guideV.style.display = Math.abs(cx - centerX) < 10 ? 'block' : 'none';
                        }

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end(e) {
                        const guideV = document.getElementById('preview-guide-v');
                        if (guideV) guideV.style.display = 'none';

                        const target = e.target;
                        const scaler = document.getElementById('preview-canvas-scaler');
                        const scaleMatch = scaler && scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;

                        const boxId = target.id.replace('preview-canvas-box-', '');
                        const box = self.visibleBoxes.find(b => b.id === boxId);
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
            // 리사이즈 (변 5px)
            .resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                margin: 5,
                modifiers: [
                    i.modifiers.restrictEdges({ outer: 'parent' })
                ],
                listeners: {
                    move(e) {
                        const scaler = document.getElementById('preview-canvas-scaler');
                        const scaleMatch = scaler && scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;

                        let { x, y } = e.target.dataset;
                        x = (parseFloat(x) || 0) + (e.deltaRect.left / scale);
                        y = (parseFloat(y) || 0) + (e.deltaRect.top / scale);

                        Object.assign(e.target.style, {
                            width: `${e.rect.width / scale}px`,
                            height: `${e.rect.height / scale}px`,
                            transform: `translate(${x}px, ${y}px)`
                        });
                        Object.assign(e.target.dataset, { x, y });
                    },
                    end(e) {
                        const scaler = document.getElementById('preview-canvas-scaler');
                        const scaleMatch = scaler && scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;

                        const boxId = e.target.id.replace('preview-canvas-box-', '');
                        const box = self.visibleBoxes.find(b => b.id === boxId);
                        if (!box) {
                            e.target.removeAttribute('data-x');
                            e.target.removeAttribute('data-y');
                            e.target.style.transform = 'translate(0, 0)';
                            e.target.style.width = null;
                            e.target.style.height = null;
                            return;
                        }

                        const dx = parseFloat(e.target.dataset.x) || 0;
                        const dy = parseFloat(e.target.dataset.y) || 0;

                        let newX = box.x + dx;
                        let newY = box.y + dy;
                        let newW = e.rect.width / scale;
                        let newH = e.rect.height / scale;

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
                            self.triggerSnapFlash(e.target);
                        }

                        e.target.removeAttribute('data-x');
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = 'translate(0, 0)';
                        e.target.style.width = null;
                        e.target.style.height = null;
                    }
                }
            });
        },

        // 캔바스/다른 박스와의 스냅 + 플래시 판정
        checkSnap(boxId, x, y, w, h) {
            const threshold = 6; // 조금 넉넉하게
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

            // 캔바스 아웃라인
            let s = snapTo(left, canvasLeft);
            if (s !== null) { left = s; right = left + w; snapped = true; }
            s = snapTo(right, canvasRight);
            if (s !== null) { right = s; left = right - w; snapped = true; }
            s = snapTo(top, canvasTop);
            if (s !== null) { top = s; bottom = top + h; snapped = true; }
            s = snapTo(bottom, canvasBottom);
            if (s !== null) { bottom = s; top = bottom - h; snapped = true; }

            // 다른 박스
            const boxes = this.visibleBoxes || [];
            boxes.forEach(b => {
                if (b.id === boxId) return;
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
            });

            return {
                x: left,
                y: top,
                w: right - left,
                h: bottom - top,
                snapped
            };
        },

        triggerSnapFlash(target) {
            target.classList.add('snap-flash');
            setTimeout(() => {
                target.classList.remove('snap-flash');
            }, 500);
        }
    }
};
