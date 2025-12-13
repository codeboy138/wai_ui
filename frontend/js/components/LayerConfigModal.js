const LayerConfigModal = {
    props: ['box'],
    template: `
        <div
            v-if="box"
            class="fixed inset-0 z-40 bg-black/60"
            @click.self="onClose"
        >
            <div
                ref="win"
                class="layer-config-window bg-bg-panel border border-ui-border rounded shadow-lg text-xs text-text-main flex flex-col"
                :style="combinedWindowStyle"
                @mousedown.stop
            >
                <!-- 헤더 (드래그 영역) -->
                <div
                    class="flex items-center justify-between px-3 py-2 border-b border-ui-border bg-bg-hover cursor-move"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <div class="flex flex-col">
                        <span class="text-[11px] font-bold">
                            레이어 설정
                        </span>
                        <span class="text-[10px] text-text-sub">
                            {{ headerLabel }}
                        </span>
                    </div>
                    <button
                        class="text-[10px] text-text-sub hover:text-white"
                        @click.stop="onClose"
                    >
                        ✕
                    </button>
                </div>

                <!-- 바디 -->
                <div class="flex-1 overflow-auto px-3 py-2 space-y-3">
                    <!-- 텍스트 내용 입력 (텍스트 레이어 전용) -->
                    <div v-if="isTextLayer">
                        <label class="block text-[10px] mb-1 text-text-sub">
                            텍스트 내용
                        </label>
                        <textarea
                            class="w-full bg-bg-input border border-ui-border rounded px-1 py-1 text-[11px] resize-y"
                            rows="3"
                            v-model="box.textContent"
                            :placeholder="textPlaceholder"
                        ></textarea>
                        <p class="mt-1 text-[10px] text-text-sub">
                            입력한 내용이 캔버스 텍스트 레이어에 실시간으로 반영됩니다.
                        </p>
                    </div>

                    <!-- 좌표 (X, Y, W, H) -->
                    <div>
                        <label class="block text-[10px] mb-1 text-text-sub">
                            좌표 / 크기 (캔버스 기준 px)
                        </label>
                        <div class="grid grid-cols-4 gap-1">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-text-sub mb-0.5">X</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model.number="box.x"
                                />
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-text-sub mb-0.5">Y</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model.number="box.y"
                                />
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-text-sub mb-0.5">W</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model.number="box.w"
                                />
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-text-sub mb-0.5">H</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model.number="box.h"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- 레이어 숨김 -->
                    <div class="flex items-center gap-2">
                        <input
                            id="layer-config-hidden"
                            type="checkbox"
                            class="w-3 h-3"
                            v-model="box.isHidden"
                        />
                        <label
                            for="layer-config-hidden"
                            class="text-[10px] text-text-sub select-none"
                        >
                            레이어 숨기기
                        </label>
                    </div>

                    <!-- 색상 설정 -->
                    <div>
                        <label class="block text-[10px] mb-1 text-text-sub">
                            레이어 색상 / 배경
                        </label>
                        <div class="space-y-1">
                            <!-- 레이어 테두리/레이블 색상 -->
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">레이어 색상</span>
                                <select
                                    class="flex-1 bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model="box.color"
                                >
                                    <option
                                        v-for="opt in colorOptions"
                                        :key="'layer-color-' + opt.value"
                                        :value="opt.value"
                                        :style="optionStyle(opt.value)"
                                    >
                                        {{ '■ ' + opt.name + ' ' + opt.code }}
                                    </option>
                                </select>
                            </div>

                            <!-- 레이어 배경색 -->
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">레이어 배경</span>
                                <select
                                    class="flex-1 bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model="box.layerBgColor"
                                >
                                    <option
                                        v-for="opt in colorOptions"
                                        :key="'layer-bg-' + opt.value"
                                        :value="opt.value"
                                        :style="optionStyle(opt.value)"
                                    >
                                        {{ '■ ' + opt.name + ' ' + opt.code }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 텍스트 스타일 (텍스트 레이어 전용) -->
                    <div v-if="isTextLayer">
                        <label class="block text-[10px] mb-1 text-text-sub">
                            텍스트 스타일
                        </label>
                        <div class="space-y-1">
                            <!-- 폰트 크기 & 테두리 두께 -->
                            <div class="grid grid-cols-2 gap-1">
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-text-sub mb-0.5">폰트 크기</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                        v-model.number="box.textStyle.fontSize"
                                    />
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[10px] text-text-sub mb-0.5">테두리 두께</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                        v-model.number="box.textStyle.strokeWidth"
                                    />
                                </div>
                            </div>

                            <!-- 텍스트 색상 -->
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">텍스트 색상</span>
                                <select
                                    class="flex-1 bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model="box.textStyle.fillColor"
                                >
                                    <option
                                        v-for="opt in colorOptions"
                                        :key="'fill-' + opt.value"
                                        :value="opt.value"
                                        :style="optionStyle(opt.value)"
                                    >
                                        {{ '■ ' + opt.name + ' ' + opt.code }}
                                    </option>
                                </select>
                            </div>

                            <!-- 테두리 색상 -->
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">테두리 색상</span>
                                <select
                                    class="flex-1 bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model="box.textStyle.strokeColor"
                                >
                                    <option
                                        v-for="opt in colorOptions"
                                        :key="'stroke-' + opt.value"
                                        :value="opt.value"
                                        :style="optionStyle(opt.value)"
                                    >
                                        {{ '■ ' + opt.name + ' ' + opt.code }}
                                    </option>
                                </select>
                            </div>

                            <!-- 텍스트 배경 -->
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-text-sub w-16">텍스트 배경</span>
                                <select
                                    class="flex-1 bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[11px]"
                                    v-model="box.textStyle.backgroundColor"
                                >
                                    <option
                                        v-for="opt in colorOptions"
                                        :key="'text-bg-' + opt.value"
                                        :value="opt.value"
                                        :style="optionStyle(opt.value)"
                                    >
                                        {{ '■ ' + opt.name + ' ' + opt.code }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 푸터 + 리사이즈 핸들 -->
                <div class="px-3 py-2 border-t border-ui-border flex justify-between items-center">
                    <button
                        class="text-[11px] text-red-400 hover:text-red-300"
                        @click.stop="onDelete"
                    >
                        레이어 삭제
                    </button>
                    <div class="flex items-center gap-2">
                        <div
                            class="w-3 h-3 bg-bg-hover border border-ui-border cursor-se-resize"
                            @mousedown.stop.prevent="onResizeMouseDown"
                            title="드래그하여 창 크기 조절"
                        ></div>
                        <button
                            class="text-[11px] px-2 py-1 rounded bg-ui-accent text-white hover:bg-blue-600"
                            @click.stop="onClose"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            // 초기 크기: 이전 대비 절반 정도 폭
            baseWidth: 320,
            baseHeight: 420,
            posX: 0,
            posY: 0,
            width: 320,
            height: 420,
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
            colorOptions: []
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
                maxHeight: '80vh',
                minWidth: '280px',
                minHeight: '260px'
            };
        },
        isTextLayer() {
            return this.box && this.box.rowType === 'TXT';
        },
        headerLabel() {
            if (!this.box) return '';
            const colLabel = this.getColLabel(this.box.colRole);
            const rowLabel = this.getRowLabel(this.box.rowType);
            const name = this.box.layerName || '';
            const parts = [];
            if (name) parts.push(name);
            if (colLabel && rowLabel) {
                parts.push(`${colLabel}/${rowLabel}`);
            }
            return parts.join(' · ');
        }
    },
    mounted() {
        this.centerWindow();
        this.buildColorOptions();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
    },
    methods: {
        centerWindow() {
            const vw = window.innerWidth || 1280;
            const vh = window.innerHeight || 720;
            this.width = this.baseWidth;
            this.height = this.baseHeight;
            this.posX = Math.max(20, (vw - this.width) / 2);
            this.posY = Math.max(20, (vh - this.height) / 2);
        },
        buildColorOptions() {
            // COLORS: ['#RRGGBB', ...] 전제
            if (typeof COLORS === 'undefined' || !Array.isArray(COLORS)) {
                this.colorOptions = [];
                return;
            }
            this.colorOptions = COLORS.map(c => {
                // 이름 정보가 있는 글로벌 매핑이 있으면 활용
                let name = c;
                if (window.COLOR_NAMES && window.COLOR_NAMES[c]) {
                    name = window.COLOR_NAMES[c];
                } else if (window.COLOR_META && window.COLOR_META[c] && window.COLOR_META[c].name) {
                    name = window.COLOR_META[c].name;
                }
                return {
                    value: c,
                    name,
                    code: c
                };
            });
        },
        optionStyle(color) {
            const textColor = this.getContrastingTextColor(color);
            return {
                backgroundColor: color,
                color: textColor
            };
        },
        getColLabel(colRole) {
            if (colRole === 'full') return '전체';
            if (colRole === 'high') return '상단';
            if (colRole === 'mid')  return '중단';
            if (colRole === 'low')  return '하단';
            return colRole || '';
        },
        getRowLabel(rowType) {
            if (rowType === 'EFF') return '이펙트';
            if (rowType === 'TXT') return '텍스트';
            if (rowType === 'BG')  return '배경';
            return '';
        },
        // 헤더 드래그 시작
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
                const dx = e.clientX - this.dragStartMouseX;
                const dy = e.clientY - this.dragStartMouseY;
                this.posX = this.dragStartPosX + dx;
                this.posY = this.dragStartPosY + dy;
            } else if (this.resizing) {
                const dx = e.clientX - this.resizeStartMouseX;
                const dy = e.clientY - this.resizeStartMouseY;
                let newW = this.resizeStartW + dx;
                let newH = this.resizeStartH + dy;
                if (newW < 280) newW = 280;
                if (newH < 260) newH = 260;
                this.width = newW;
                this.height = newH;
            }
        },
        onGlobalMouseUp() {
            this.dragging = false;
            this.resizing = false;
        },
        onClose() {
            this.$emit('close');
        },
        onDelete() {
            this.$emit('delete');
            this.$emit('delete-layer');
        },

        // 배경색에 따라 가독성 좋은 텍스트 컬러 선택(흰/검)
        getContrastingTextColor(bgColor) {
            const rgb = this.parseColorToRgb(bgColor);
            if (!rgb) return '#000000';
            const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
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
        }
    }
};

// 전역 등록용
window.LayerConfigModal = LayerConfigModal;
