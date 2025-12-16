const COLOR_KO_NAMES = {
    '#000000': '블랙',
    '#ffffff': '화이트',
    '#ff0000': '레드',
    '#00ff00': '라임',
    '#0000ff': '블루',
    '#ffff00': '옐로',
    '#00ffff': '시안',
    '#ff00ff': '마젠타',
    '#64748b': '슬레이트',
    '#ef4444': '레드',
    '#22c55e': '그린',
    '#3b82f6': '블루',
    '#0ea5e9': '스카이',
    '#6366f1': '인디고',
    '#a855f7': '퍼플',
    '#ec4899': '핑크',
    '#eab308': '옐로',
    '#f97316': '오렌지',
    '#facc15': '앰버'
};

function parseColorToRgbLocal(color) {
    if (!color || typeof color !== 'string') return null;
    color = color.trim().toLowerCase();
    if (color[0] === '#') {
        let hex = color.slice(1);
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length !== 6) return null;
        const num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }
    const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch) {
        const parts = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (parts.length >= 3) return { r: parts[0], g: parts[1], b: parts[2] };
    }
    return null;
}

function rgbToHexLocal(r, g, b) {
    const h = (n) => n.toString(16).padStart(2, '0');
    return '#' + h(r) + h(g) + h(b);
}

function complementColorLocal(hex) {
    const rgb = parseColorToRgbLocal(hex);
    if (!rgb) return hex;
    return rgbToHexLocal(255 - rgb.r, 255 - rgb.g, 255 - rgb.b).toUpperCase();
}

const ColorPaletteModal = {
    props: ['currentColor'],
    emits: ['close', 'select'],
    template: `
        <div class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60" @click.self="$emit('close')">
            <div class="bg-bg-panel border border-ui-border rounded shadow-lg p-3 text-[11px] text-text-main w-[480px] max-w-[95vw] max-h-[90vh] overflow-auto" @mousedown.stop>
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-[12px]">색상 선택</span>
                    <button class="text-[10px] text-text-sub hover:text-white" @click="$emit('close')">✕</button>
                </div>
                <div class="mb-3 flex items-center gap-2">
                    <span class="text-[10px] text-text-sub w-16">현재 색상</span>
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 border border-ui-border rounded" :style="{ backgroundColor: currentColor || '#000000' }"></div>
                        <span class="text-[11px]">{{ colorLabel(currentColor || '#000000') }}</span>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="text-[10px] text-text-sub mb-1">무지개 색상</div>
                    <div class="flex flex-wrap gap-1">
                        <button v-for="c in rainbow" :key="'rainbow-' + c" class="w-7 h-7 rounded border border-ui-border" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="text-[10px] text-text-sub mb-1">자주 쓰는 색상</div>
                    <div class="grid grid-cols-10 gap-1">
                        <button v-for="c in popular" :key="'popular-' + c" class="w-7 h-7 rounded border border-ui-border" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="text-[10px] text-text-sub mb-1">보색</div>
                    <div class="grid grid-cols-10 gap-1">
                        <button v-for="c in popularComplements" :key="'compl-' + c" class="w-7 h-7 rounded border border-ui-border" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>
                    </div>
                </div>
                <div>
                    <div class="text-[10px] text-text-sub mb-1">기본 팔레트</div>
                    <div class="flex flex-wrap gap-1">
                        <button v-for="c in basePalette" :key="'base-' + c" class="w-7 h-7 rounded border border-ui-border" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        const rainbow = ['#ff0000','#ff7f00','#ffff00','#00ff00','#00ffff','#0000ff','#8b00ff','#ff1493','#ff4500','#ffd700','#7fff00','#00bfff'];
        let popular = [];
        if (typeof COLORS !== 'undefined' && Array.isArray(COLORS) && COLORS.length > 0) {
            popular = COLORS.slice(0, 20).map(c => c.toUpperCase());
        } else {
            popular = ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#0ea5e9','#3b82f6','#6366f1','#a855f7','#ec4899','#f97316','#facc15','#4b5563','#9ca3af','#e5e7eb','#10b981','#14b8a6','#06b6d4','#2563eb'];
        }
        const popularComplements = popular.map(c => complementColorLocal(c));
        const basePalette = ['#000000','#111827','#4b5563','#9ca3af','#e5e7eb','#ffffff'];
        return { rainbow, popular, popularComplements, basePalette };
    },
    methods: {
        pick(c) { this.$emit('select', c.toUpperCase()); },
        colorLabel(c) {
            const code = (c || '#000000').toUpperCase();
            const name = COLOR_KO_NAMES[code.toLowerCase()] || COLOR_KO_NAMES[code] || code;
            if (name && name !== code) return `${name} ${code}`;
            return code;
        }
    }
};

const LayerConfigModal = {
    components: { 'color-palette-modal': ColorPaletteModal },
    props: ['box'],
    emits: ['close', 'delete', 'delete-layer'],
    template: `
        <div v-if="box" class="fixed inset-0 z-[10000] bg-black/60" @click.self="onClose">
            <div ref="win" class="layer-config-window bg-bg-panel border border-ui-border rounded shadow-lg text-xs text-text-main flex flex-col" :style="combinedWindowStyle" @mousedown.stop>
                <div class="flex items-center justify-between px-3 py-2 border-b border-ui-border bg-bg-hover cursor-move" @mousedown.stop.prevent="onHeaderMouseDown">
                    <div class="flex flex-col">
                        <span class="text-[11px] font-bold">레이어 설정</span>
                        <span class="text-[10px] text-text-sub">{{ headerLabel }}</span>
                    </div>
                    <button class="text-[10px] text-text-sub hover:text-white" @click.stop="onClose">✕</button>
                </div>

                <div class="flex-1 overflow-auto px-3 py-2 space-y-3">
                    <!-- [수정] 텍스트 입력 필드 - 클릭 이벤트 전파 차단 -->
                    <div v-if="isTextLayer">
                        <label class="block text-[10px] mb-1 text-text-sub">텍스트 내용</label>
                        <textarea 
                            class="w-full bg-bg-input border border-ui-border rounded px-2 py-2 text-[11px] resize-y text-text-main" 
                            rows="3" 
                            v-model="box.textContent" 
                            :placeholder="textPlaceholder"
                            @mousedown.stop
                            @click.stop
                            @focus.stop
                        ></textarea>
                    </div>

                    <div>
                        <label class="block text-[10px] mb-1 text-text-sub">좌표 / 크기 (캔버스 기준 %)</label>
                        <div class="grid grid-cols-4 gap-1">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-text-sub mb-0.5">X (%)</span>
                                <input type="number" min="0" max="100" step="0.01" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="percentX" @mousedown.stop @click.stop />
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-text-sub mb-0.5">Y (%)</span>
                                <input type="number" min="0" max="100" step="0.01" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="percentY" @mousedown.stop @click.stop />
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-text-sub mb-0.5">W (%)</span>
                                <input type="number" min="0" max="100" step="0.01" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="percentW" @mousedown.stop @click.stop />
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-text-sub mb-0.5">H (%)</span>
                                <input type="number" min="0" max="100" step="0.01" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="percentH" @mousedown.stop @click.stop />
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <input id="layer-config-hidden" type="checkbox" class="w-3 h-3" v-model="box.isHidden" @click.stop />
                        <label for="layer-config-hidden" class="text-[10px] text-text-sub select-none">레이어 숨기기</label>
                    </div>

                    <div>
                        <label class="block text-[10px] mb-1 text-text-sub">레이어 색상 / 배경</label>
                        <div class="space-y-1">
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">레이어 색상</span>
                                <button type="button" class="flex-1 h-6 rounded border border-ui-border text-[10px] px-1" :style="colorButtonStyle(box.color)" @click.stop="openColorPicker('layerColor')">{{ colorLabel(box.color || '#000000') }}</button>
                            </div>
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">레이어 배경</span>
                                <button type="button" class="flex-1 h-6 rounded border border-ui-border text-[10px] px-1" :style="colorButtonStyle(box.layerBgColor)" @click.stop="openColorPicker('layerBg')">{{ colorLabel(box.layerBgColor || '#000000') }}</button>
                            </div>
                        </div>
                    </div>

                    <div v-if="isTextLayer">
                        <label class="block text-[10px] mb-1 text-text-sub">텍스트 스타일</label>
                        <div class="space-y-1">
                            <div class="grid grid-cols-2 gap-1">
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-text-sub mb-0.5">폰트 크기 (%)</span>
                                    <input type="number" min="0" max="100" step="0.01" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="percentFontSize" @mousedown.stop @click.stop />
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-text-sub mb-0.5">테두리 두께 (px)</span>
                                    <input type="number" min="0" step="1" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="box.textStyle.strokeWidth" @mousedown.stop @click.stop />
                                </div>
                            </div>

                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">텍스트 색상</span>
                                <button type="button" class="flex-1 h-6 rounded border border-ui-border text-[10px] px-1" :style="colorButtonStyle(box.textStyle.fillColor)" @click.stop="openColorPicker('textFill')">{{ colorLabel(box.textStyle.fillColor || '#ffffff') }}</button>
                            </div>
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">테두리 색상</span>
                                <button type="button" class="flex-1 h-6 rounded border border-ui-border text-[10px] px-1" :style="colorButtonStyle(box.textStyle.strokeColor)" @click.stop="openColorPicker('textStroke')">{{ colorLabel(box.textStyle.strokeColor || '#000000') }}</button>
                            </div>
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">텍스트 배경</span>
                                <button type="button" class="flex-1 h-6 rounded border border-ui-border text-[10px] px-1" :style="colorButtonStyle(box.textStyle.backgroundColor)" @click.stop="openColorPicker('textBg')">{{ colorLabel(box.textStyle.backgroundColor || 'transparent') }}</button>
                            </div>

                            <!-- 그림자 설정 -->
                            <div class="border-t border-ui-border pt-2 mt-2">
                                <div class="text-[10px] text-text-sub mb-1 font-bold">그림자 설정</div>
                                <div class="grid grid-cols-2 gap-1 mb-1">
                                    <div class="flex flex-col">
                                        <span class="text-[10px] text-text-sub mb-0.5">그림자 X (px)</span>
                                        <input type="number" step="1" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="shadowOffsetX" @mousedown.stop @click.stop />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[10px] text-text-sub mb-0.5">그림자 Y (px)</span>
                                        <input type="number" step="1" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="shadowOffsetY" @mousedown.stop @click.stop />
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-1 mb-1">
                                    <div class="flex flex-col">
                                        <span class="text-[10px] text-text-sub mb-0.5">블러 (px)</span>
                                        <input type="number" min="0" step="1" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]" v-model.number="shadowBlur" @mousedown.stop @click.stop />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[10px] text-text-sub mb-0.5">그림자 색상</span>
                                        <button type="button" class="w-full h-6 rounded border border-ui-border text-[10px] px-1" :style="colorButtonStyle(shadowColor)" @click.stop="openColorPicker('shadowColor')">{{ colorLabel(shadowColor) }}</button>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center justify-between gap-2 mt-1">
                                <span class="text-[10px] text-text-sub w-16">가로 정렬</span>
                                <div class="flex gap-1">
                                    <button type="button" class="px-1 py-0.5 rounded border text-[10px]" :class="alignButtonClass('left')" @click.stop="setTextAlign('left')">좌</button>
                                    <button type="button" class="px-1 py-0.5 rounded border text-[10px]" :class="alignButtonClass('center')" @click.stop="setTextAlign('center')">중앙</button>
                                    <button type="button" class="px-1 py-0.5 rounded border text-[10px]" :class="alignButtonClass('right')" @click.stop="setTextAlign('right')">우</button>
                                </div>
                            </div>

                            <div class="flex items-center justify-between gap-2 mt-1">
                                <span class="text-[10px] text-text-sub w-16">세로 정렬</span>
                                <div class="flex gap-1">
                                    <button type="button" class="px-1 py-0.5 rounded border text-[10px]" :class="vAlignButtonClass('top')" @click.stop="setTextVAlign('top')">상</button>
                                    <button type="button" class="px-1 py-0.5 rounded border text-[10px]" :class="vAlignButtonClass('middle')" @click.stop="setTextVAlign('middle')">중앙</button>
                                    <button type="button" class="px-1 py-0.5 rounded border text-[10px]" :class="vAlignButtonClass('bottom')" @click.stop="setTextVAlign('bottom')">하</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-3 py-2 border-t border-ui-border flex justify-between items-center">
                    <button class="text-[11px] text-red-400 hover:text-red-300" @click.stop="onDelete">레이어 삭제</button>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-bg-hover border border-ui-border cursor-se-resize" @mousedown.stop.prevent="onResizeMouseDown" title="드래그하여 창 크기 조절"></div>
                    </div>
                </div>

                <color-palette-modal v-if="colorPicker.isOpen" :current-color="currentPickedColor" @close="colorPicker.isOpen = false" @select="onColorPicked" />
            </div>
        </div>
    `,
    data() {
        return {
            baseWidth: 340,
            baseHeight: 520,
            posX: 0,
            posY: 0,
            width: 340,
            height: 520,
            dragging: false,
            dragStartMouseX: 0,
            dragStartMouseY: 0,
            dragStartPosX: 0,
            dragStartPosY: 0,
            resizing: false,
            resizeStartMouseX: 0,
            resizeStartMouseY: 0,
            resizeStartW: 0,
            resizeStartH: 0,
            textPlaceholder: '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요',
            colorPicker: { isOpen: false, target: null }
        };
    },
    computed: {
        combinedWindowStyle() {
            return {
                position: 'absolute',
                left: this.posX + 'px',
                top: this.posY + 'px',
                width: this.width + 'px',
                height: this.height + 'px',
                maxWidth: '90vw',
                maxHeight: '85vh',
                minWidth: '300px',
                minHeight: '400px'
            };
        },
        isTextLayer() { return this.box && this.box.rowType === 'TXT'; },
        headerLabel() {
            if (!this.box) return '';
            const colLabel = this.getColLabel(this.box.colRole);
            const rowLabel = this.getRowLabel(this.box.rowType);
            const name = this.box.layerName || '';
            const parts = [];
            if (name) parts.push(name);
            if (colLabel && rowLabel) parts.push(`${colLabel}/${rowLabel}`);
            return parts.join(' · ');
        },
        currentPickedColor() {
            if (!this.box) return '#000000';
            const t = this.colorPicker.target;
            if (t === 'layerColor') return this.box.color || '#000000';
            if (t === 'layerBg') return this.box.layerBgColor || '#000000';
            if (t === 'shadowColor') return this.shadowColor;
            if (!this.box.textStyle) return '#000000';
            if (t === 'textFill') return this.box.textStyle.fillColor || '#ffffff';
            if (t === 'textStroke') return this.box.textStyle.strokeColor || '#000000';
            if (t === 'textBg') return this.box.textStyle.backgroundColor || '#000000';
            return '#000000';
        },
        percentX: {
            get() {
                const box = this.box;
                if (!box) return 0;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const cw = canvas.w || 1;
                const rawNx = typeof box.nx === 'number' ? box.nx : (box.x || 0) / cw;
                return +(rawNx * 100).toFixed(2);
            },
            set(v) {
                const box = this.box;
                if (!box) return;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const cw = canvas.w || 1;
                const nw = typeof box.nw === 'number' ? box.nw : ((box.w || cw) / cw);
                let nx = (parseFloat(v) || 0) / 100;
                nx = Math.max(0, Math.min(nx, 1 - nw));
                box.nx = nx;
                box.x = nx * cw;
            }
        },
        percentY: {
            get() {
                const box = this.box;
                if (!box) return 0;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const ch = canvas.h || 1;
                const rawNy = typeof box.ny === 'number' ? box.ny : (box.y || 0) / ch;
                return +(rawNy * 100).toFixed(2);
            },
            set(v) {
                const box = this.box;
                if (!box) return;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const ch = canvas.h || 1;
                const nh = typeof box.nh === 'number' ? box.nh : ((box.h || ch) / ch);
                let ny = (parseFloat(v) || 0) / 100;
                ny = Math.max(0, Math.min(ny, 1 - nh));
                box.ny = ny;
                box.y = ny * ch;
            }
        },
        percentW: {
            get() {
                const box = this.box;
                if (!box) return 0;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const cw = canvas.w || 1;
                const rawNw = typeof box.nw === 'number' ? box.nw : ((box.w || cw) / cw);
                return +(rawNw * 100).toFixed(2);
            },
            set(v) {
                const box = this.box;
                if (!box) return;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const cw = canvas.w || 1;
                const nx = typeof box.nx === 'number' ? box.nx : ((box.x || 0) / cw);
                let nw = (parseFloat(v) || 0) / 100;
                const minNw = 10 / cw;
                nw = Math.max(minNw, Math.min(nw, 1 - nx));
                box.nw = nw;
                box.w = nw * cw;
            }
        },
        percentH: {
            get() {
                const box = this.box;
                if (!box) return 0;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const ch = canvas.h || 1;
                const rawNh = typeof box.nh === 'number' ? box.nh : ((box.h || ch) / ch);
                return +(rawNh * 100).toFixed(2);
            },
            set(v) {
                const box = this.box;
                if (!box) return;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const ch = canvas.h || 1;
                const ny = typeof box.ny === 'number' ? box.ny : ((box.y || 0) / ch);
                let nh = (parseFloat(v) || 0) / 100;
                const minNh = 10 / ch;
                nh = Math.max(minNh, Math.min(nh, 1 - ny));
                box.nh = nh;
                box.h = nh * ch;
            }
        },
        percentFontSize: {
            get() {
                if (!this.box || !this.box.textStyle) return 0;
                const fontSize = this.box.textStyle.fontSize || 0;
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const ch = canvas.h || 1;
                const scale = ch > 0 ? fontSize / ch : 0;
                return +(scale * 100).toFixed(2);
            },
            set(v) {
                if (!this.box) return;
                if (!this.box.textStyle) this.box.textStyle = {};
                const root = this.$root;
                const canvas = root && root.canvasSize ? root.canvasSize : { w: 1, h: 1 };
                const ch = canvas.h || 1;
                let scale = (parseFloat(v) || 0) / 100;
                if (scale < 0) scale = 0;
                this.box.textStyle.fontSize = scale * ch;
            }
        },
        shadowOffsetX: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return 2;
                return this.box.textStyle.shadow.offsetX || 2;
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.offsetX = parseInt(v) || 0;
            }
        },
        shadowOffsetY: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return 2;
                return this.box.textStyle.shadow.offsetY || 2;
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.offsetY = parseInt(v) || 0;
            }
        },
        shadowBlur: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return 4;
                return this.box.textStyle.shadow.blur || 4;
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.blur = Math.max(0, parseInt(v) || 0);
            }
        },
        shadowColor: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return '#000000';
                return this.box.textStyle.shadow.color || '#000000';
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.color = v;
            }
        }
    },
    mounted() {
        this.centerWindow();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
    },
    methods: {
        ensureShadow() {
            if (!this.box) return;
            if (!this.box.textStyle) this.box.textStyle = {};
            if (!this.box.textStyle.shadow) {
                this.box.textStyle.shadow = { offsetX: 2, offsetY: 2, blur: 4, color: '#000000' };
            }
        },
        centerWindow() {
            const vw = window.innerWidth || 1280;
            const vh = window.innerHeight || 720;
            this.width = this.baseWidth;
            this.height = this.baseHeight;
            this.posX = Math.max(20, (vw - this.width) / 2);
            this.posY = Math.max(20, (vh - this.height) / 2);
        },
        onHeaderMouseDown(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX;
            this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX;
            this.dragStartPosY = this.posY;
        },
        onResizeMouseDown(e) {
            this.resizing = true;
            this.resizeStartMouseX = e.clientX;
            this.resizeStartMouseY = e.clientY;
            this.resizeStartW = this.width;
            this.resizeStartH = this.height;
        },
        onGlobalMouseMove(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
            } else if (this.resizing) {
                let newW = this.resizeStartW + (e.clientX - this.resizeStartMouseX);
                let newH = this.resizeStartH + (e.clientY - this.resizeStartMouseY);
                if (newW < 300) newW = 300;
                if (newH < 400) newH = 400;
                this.width = newW;
                this.height = newH;
            }
        },
        onGlobalMouseUp() { this.dragging = false; this.resizing = false; },
        onClose() { this.$emit('close'); },
        onDelete() { this.$emit('delete'); this.$emit('delete-layer'); },
        colorLabel(c) {
            if (!c || c === 'transparent') return '투명';
            const code = c.toUpperCase();
            const name = COLOR_KO_NAMES[code.toLowerCase()] || COLOR_KO_NAMES[code] || code;
            if (name && name !== code) return `${name} ${code}`;
            return code;
        },
        colorButtonStyle(c) {
            if (!c || c === 'transparent') return { backgroundColor: 'transparent', color: '#ffffff' };
            const rgb = parseColorToRgbLocal(c);
            let textColor = '#000000';
            if (rgb) {
                const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
                textColor = lum > 0.5 ? '#000000' : '#ffffff';
            }
            return { backgroundColor: c, color: textColor };
        },
        openColorPicker(target) {
            this.colorPicker.target = target;
            this.colorPicker.isOpen = true;
        },
        onColorPicked(color) {
            if (!this.box) return;
            const t = this.colorPicker.target;
            if (t === 'layerColor') this.box.color = color;
            else if (t === 'layerBg') this.box.layerBgColor = color;
            else if (t === 'shadowColor') { this.ensureShadow(); this.box.textStyle.shadow.color = color; }
            else {
                if (!this.box.textStyle) this.box.textStyle = {};
                if (t === 'textFill') this.box.textStyle.fillColor = color;
                if (t === 'textStroke') this.box.textStyle.strokeColor = color;
                if (t === 'textBg') this.box.textStyle.backgroundColor = color;
            }
            this.colorPicker.isOpen = false;
        },
        alignButtonClass(targetAlign) {
            const current = (this.box && this.box.textStyle && this.box.textStyle.textAlign) || 'center';
            return current === targetAlign ? 'bg-ui-accent text-white border-ui-accent' : 'bg-bg-input text-text-sub border-ui-border';
        },
        setTextAlign(align) {
            if (!this.box) return;
            if (!this.box.textStyle) this.box.textStyle = {};
            this.box.textStyle.textAlign = align;
        },
        vAlignButtonClass(targetAlign) {
            const current = (this.box && this.box.textStyle && this.box.textStyle.vAlign) || 'middle';
            return current === targetAlign ? 'bg-ui-accent text-white border-ui-accent' : 'bg-bg-input text-text-sub border-ui-border';
        },
        setTextVAlign(align) {
            if (!this.box) return;
            if (!this.box.textStyle) this.box.textStyle = {};
            this.box.textStyle.vAlign = align;
        },
        getColLabel(colRole) {
            if (colRole === 'full') return '전체';
            if (colRole === 'high') return '상단';
            if (colRole === 'mid') return '중단';
            if (colRole === 'low') return '하단';
            return colRole || '';
        },
        getRowLabel(rowType) {
            if (rowType === 'EFF') return '이펙트';
            if (rowType === 'TXT') return '텍스트';
            if (rowType === 'BG') return '배경';
            return '';
        }
    }
};

window.LayerConfigModal = LayerConfigModal;
