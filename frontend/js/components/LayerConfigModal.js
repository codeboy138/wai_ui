const LAYER_CONFIG_COLORS = [
    { name: 'Red',        code: '#ef4444' },
    { name: 'Orange',     code: '#f97316' },
    { name: 'Amber',      code: '#f59e0b' },
    { name: 'Yellow',     code: '#eab308' },
    { name: 'Lime',       code: '#84cc16' },
    { name: 'Green',      code: '#22c55e' },
    { name: 'Emerald',    code: '#10b981' },
    { name: 'Teal',       code: '#14b8a6' },
    { name: 'Cyan',       code: '#06b6d4' },
    { name: 'Sky',        code: '#0ea5e9' },
    { name: 'Blue',       code: '#3b82f6' },
    { name: 'Indigo',     code: '#6366f1' },
    { name: 'Violet',     code: '#8b5cf6' },
    { name: 'Purple',     code: '#a855f7' },
    { name: 'Fuchsia',    code: '#d946ef' },
    { name: 'Pink',       code: '#ec4899' },
    { name: 'Rose',       code: '#f43f5e' },
    { name: 'Slate',      code: '#64748b' },
    { name: 'Gray',       code: '#6b7280' },
    { name: 'Zinc',       code: '#71717a' },
    { name: 'Neutral',    code: '#737373' },
    { name: 'Stone',      code: '#78716c' },
    { name: 'Warm Gray',  code: '#78716c' },
    { name: 'Cool Gray',  code: '#6b7280' },
    { name: 'Black',      code: '#000000' },
    { name: 'White',      code: '#ffffff' },
    { name: 'Light Gray', code: '#d4d4d8' },
    { name: 'Dark Gray',  code: '#111827' },
    { name: 'Olive',      code: '#4d7c0f' },
    { name: 'Brown',      code: '#92400e' }
];

const LayerConfigModal = {
    props: ['box'],
    template: `
        <div v-if="box" class="modal-overlay">
            <div
                ref="window"
                class="modal-window layer-config-window relative bg-bg-panel border border-ui-border rounded-lg overflow-hidden"
            >
                <!-- 헤더 -->
                <div
                    class="h-8 flex items-center justify-between px-3 border-b border-ui-border bg-bg-hover layer-config-drag-handle select-none"
                >
                    <div class="text-xs font-bold text-text-main">
                        레이어 설정 - {{ box.layerName || '(이름 없음)' }}
                        <span class="text-[10px] text-text-sub ml-1">({{ box.slotKey }})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            class="text-[10px] px-2 py-1 rounded bg-ui-border text-text-sub hover:bg-ui-danger hover:text-white"
                            @click="$emit('delete')"
                            data-action="js:layerConfigDeleteLayer"
                        >
                            레이어삭제
                        </button>
                        <button
                            class="text-[10px] px-2 py-1 rounded bg-bg-dark text-text-sub hover:bg-bg-hover"
                            @click="$emit('close')"
                            data-action="js:layerConfigClose"
                        >
                            닫기
                        </button>
                    </div>
                </div>

                <!-- 본문 -->
                <div class="flex-1 overflow-auto p-3 bg-bg-dark space-y-4">
                    <!-- 공통 설정 -->
                    <section id="layer-config-common-section" class="space-y-2">
                        <div class="text-[11px] font-bold text-text-main mb-1">
                            공통 설정
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">레이어 이름</label>
                                <input
                                    id="layer-config-name-input"
                                    type="text"
                                    v-model="box.layerName"
                                    class="w-full bg-bg-input border border-ui-border rounded px-2 py-1 text-[11px] text-text-main"
                                />
                            </div>

                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">테두리 색상</label>
                                <button
                                    id="layer-config-border-color-btn"
                                    class="w-full h-7 rounded border border-ui-border flex items-center justify-between px-2 text-[10px] text-text-sub bg-bg-input hover:bg-bg-hover"
                                    @click="openColorPicker('border')"
                                >
                                    <span>선택</span>
                                    <span
                                        class="inline-block w-6 h-4 rounded border border-ui-border"
                                        :style="{ backgroundColor: box.color }"
                                    ></span>
                                </button>
                            </div>

                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">레이어 배경색</label>
                                <button
                                    id="layer-config-layerbg-color-btn"
                                    class="w-full h-7 rounded border border-ui-border flex items-center justify-between px-2 text-[10px] text-text-sub bg-bg-input hover:bg-bg-hover"
                                    @click="openColorPicker('layerBg')"
                                >
                                    <span>선택</span>
                                    <span
                                        class="inline-block w-6 h-4 rounded border border-ui-border"
                                        :style="{ backgroundColor: box.layerBgColor || 'transparent' }"
                                    ></span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- 좌표 설정 -->
                    <section id="layer-config-geom-section" class="space-y-2">
                        <div class="text-[11px] font-bold text-text-main mb-1">
                            좌표 (캔바스 기준)
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">X</label>
                                <input
                                    id="layer-config-pos-x"
                                    type="number"
                                    v-model.number="box.x"
                                    class="w-full bg-bg-input border border-ui-border rounded px-2 py-1 text-[11px] text-text-main"
                                />
                            </div>
                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">Y</label>
                                <input
                                    id="layer-config-pos-y"
                                    type="number"
                                    v-model.number="box.y"
                                    class="w-full bg-bg-input border border-ui-border rounded px-2 py-1 text-[11px] text-text-main"
                                />
                            </div>
                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">W</label>
                                <input
                                    id="layer-config-size-w"
                                    type="number"
                                    min="1"
                                    v-model.number="box.w"
                                    class="w-full bg-bg-input border border-ui-border rounded px-2 py-1 text-[11px] text-text-main"
                                />
                            </div>
                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">H</label>
                                <input
                                    id="layer-config-size-h"
                                    type="number"
                                    min="1"
                                    v-model.number="box.h"
                                    class="w-full bg-bg-input border border-ui-border rounded px-2 py-1 text-[11px] text-text-main"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- 텍스트 레이어 전용 -->
                    <section
                        v-if="isTextLayer"
                        id="layer-config-text-section"
                        class="space-y-2"
                    >
                        <div class="text-[11px] font-bold text-text-main mb-1">
                            텍스트 레이어 설정
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">폰트</label>
                                <select
                                    id="layer-config-font-family"
                                    v-model="box.textStyle.fontFamily"
                                    class="w-full bg-bg-input border border-ui-border rounded px-2 py-1 text-[11px] text-text-main"
                                >
                                    <option value="Pretendard">Pretendard</option>
                                    <option value="Noto Sans KR">Noto Sans KR</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Nanum Gothic">Nanum Gothic</option>
                                </select>
                            </div>

                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">글자 크기</label>
                                <input
                                    id="layer-config-font-size"
                                    type="number"
                                    min="8"
                                    max="300"
                                    v-model.number="box.textStyle.fontSize"
                                    class="w-full bg-bg-input border border-ui-border rounded px-2 py-1 text-[11px] text-text-main"
                                />
                            </div>

                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">글자 색상</label>
                                <button
                                    id="layer-config-text-fill-color-btn"
                                    class="w-full h-7 rounded border border-ui-border flex items-center justify-between px-2 text-[10px] text-text-sub bg-bg-input hover:bg-bg-hover"
                                    @click="openColorPicker('textFill')"
                                >
                                    <span>선택</span>
                                    <span
                                        class="inline-block w-6 h-4 rounded border border-ui-border"
                                        :style="{ backgroundColor: box.textStyle.fillColor }"
                                    ></span>
                                </button>
                            </div>

                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">글자 테두리 색상</label>
                                <button
                                    id="layer-config-text-stroke-color-btn"
                                    class="w-full h-7 rounded border border-ui-border flex items-center justify-between px-2 text-[10px] text-text-sub bg-bg-input hover:bg-bg-hover"
                                    @click="openColorPicker('textStroke')"
                                >
                                    <span>선택</span>
                                    <span
                                        class="inline-block w-6 h-4 rounded border border-ui-border"
                                        :style="{ backgroundColor: box.textStyle.strokeColor }"
                                    ></span>
                                </button>
                            </div>

                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">글자 테두리 두께</label>
                                <input
                                    id="layer-config-text-stroke-width"
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    v-model.number="box.textStyle.strokeWidth"
                                    class="w-full bg-bg-input border border-ui-border rounded px-2 py-1 text-[11px] text-text-main"
                                />
                            </div>

                            <div>
                                <label class="text-[10px] text-text-sub block mb-1">글자 배경색</label>
                                <button
                                    id="layer-config-text-bg-color-btn"
                                    class="w-full h-7 rounded border border-ui-border flex items-center justify-between px-2 text-[10px] text-text-sub bg-bg-input hover:bg-bg-hover"
                                    @click="openColorPicker('textBg')"
                                >
                                    <span>선택</span>
                                    <span
                                        class="inline-block w-6 h-4 rounded border border-ui-border"
                                        :style="{ backgroundColor: box.textStyle.backgroundColor }"
                                    ></span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- 색상 팔레트 -->
                    <section
                        v-if="activeColorTarget"
                        id="layer-config-color-palette-section"
                        class="pt-3 border-t border-ui-border space-y-2"
                    >
                        <div class="flex items-center justify-between">
                            <div class="text-[11px] font-bold text-text-main">
                                색상 선택
                            </div>
                            <div class="text-[10px] text-text-sub">
                                대상:
                                <span v-if="activeColorTarget === 'border'">테두리</span>
                                <span v-else-if="activeColorTarget === 'layerBg'">레이어 배경</span>
                                <span v-else-if="activeColorTarget === 'textFill'">글자</span>
                                <span v-else-if="activeColorTarget === 'textStroke'">글자 테두리</span>
                                <span v-else-if="activeColorTarget === 'textBg'">글자 배경</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-10 gap-1 mb-2">
                            <button
                                v-for="c in palette"
                                :key="c.code"
                                class="w-6 h-6 rounded border border-ui-border hover:border-white"
                                :style="{ backgroundColor: c.code }"
                                @mouseover="onHoverColor(c)"
                                @mouseleave="onHoverColor(null)"
                                @click="applyColor(c)"
                            ></button>
                        </div>

                        <div class="text-[10px] text-text-sub bg-bg-input rounded px-2 py-1 border border-ui-border">
                            <template v-if="hoverColor">
                                <div>
                                    선택: {{ hoverColor.name }} ({{ hoverColor.code }})
                                </div>
                                <div v-if="hoverComplement">
                                    보색: {{ hoverComplement.name }} ({{ hoverComplement.code }})
                                </div>
                            </template>
                            <template v-else>
                                색상 위에 마우스를 올리면 색상명, 코드, 보색 정보가 표시됩니다.
                            </template>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            palette: LAYER_CONFIG_COLORS,
            activeColorTarget: null,
            hoverColor: null
        };
    },
    computed: {
        isTextLayer() {
            return this.box && this.box.rowType === 'TXT' && this.box.textStyle;
        },
        hoverComplement() {
            if (!this.hoverColor) return null;
            return this.getComplementInfo(this.hoverColor);
        }
    },
    mounted() {
        this.initInteract();
    },
    methods: {
        initInteract() {
            const el = this.$refs.window;
            if (!el || !window.interact) return;

            window.interact(el)
                .draggable({
                    allowFrom: '.layer-config-drag-handle',
                    listeners: {
                        move(event) {
                            const target = event.target;
                            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                            target.style.transform = `translate(${x}px, ${y}px)`;
                            target.setAttribute('data-x', x);
                            target.setAttribute('data-y', y);
                        }
                    }
                })
                .resizable({
                    edges: { left: true, right: true, bottom: true, top: true },
                    modifiers: [
                        window.interact.modifiers.restrictEdges({
                            outer: 'parent'
                        })
                    ],
                    listeners: {
                        move(event) {
                            const target = event.target;
                            let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.deltaRect.left;
                            let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.deltaRect.top;

                            Object.assign(target.style, {
                                width: `${event.rect.width}px`,
                                height: `${event.rect.height}px`,
                                transform: `translate(${x}px, ${y}px)`
                            });

                            target.setAttribute('data-x', x);
                            target.setAttribute('data-y', y);
                        }
                    }
                });
        },
        openColorPicker(target) {
            this.activeColorTarget = target;
        },
        applyColor(color) {
            if (!this.box) return;

            if (this.activeColorTarget === 'border') {
                this.box.color = color.code;
            } else if (this.activeColorTarget === 'layerBg') {
                this.box.layerBgColor = color.code;
            } else if (this.activeColorTarget === 'textFill' && this.box.textStyle) {
                this.box.textStyle.fillColor = color.code;
            } else if (this.activeColorTarget === 'textStroke' && this.box.textStyle) {
                this.box.textStyle.strokeColor = color.code;
            } else if (this.activeColorTarget === 'textBg' && this.box.textStyle) {
                this.box.textStyle.backgroundColor = color.code;
            }
        },
        onHoverColor(c) {
            this.hoverColor = c;
        },
        hexToComplement(hex) {
            const cleaned = (hex || '').replace('#', '');
            if (cleaned.length !== 6) return '#000000';
            const r = 255 - parseInt(cleaned.slice(0, 2), 16);
            const g = 255 - parseInt(cleaned.slice(2, 4), 16);
            const b = 255 - parseInt(cleaned.slice(4, 6), 16);
            const toHex = function(v) {
                return v.toString(16).padStart(2, '0');
            };
            return '#' + toHex(r) + toHex(g) + toHex(b);
        },
        getComplementInfo(color) {
            const compCode = this.hexToComplement(color.code);
            const found = this.palette.find(function(p) {
                return p.code.toLowerCase() === compCode.toLowerCase();
            });
            if (found) return found;
            return { name: 'Complement', code: compCode };
        }
    }
};
