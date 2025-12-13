const LayerConfigModal = {
    props: ['box'],
    template: `
        <div
            v-if="box"
            class="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
            @click.self="onClose"
        >
            <div
                class="layer-config-window bg-bg-panel border border-ui-border rounded shadow-lg text-xs text-text-main flex flex-col"
                :style="windowStyle"
            >
                <!-- 헤더 -->
                <div
                    class="flex items-center justify-between px-3 py-2 border-b border-ui-border bg-bg-hover"
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
                        @click="onClose"
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
                            <!-- 레이어 테두리/라벨 색상 -->
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
                                    >
                                        {{ opt.label }}
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
                                    >
                                        {{ opt.label }}
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

                            <!-- 색상 필드: 모두 '선택' 대신 색상 이름/코드 표시 -->
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
                                    >
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>

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
                                    >
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>

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
                                    >
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 푸터 -->
                <div class="px-3 py-2 border-t border-ui-border flex justify-between items-center">
                    <button
                        class="text-[11px] text-red-400 hover:text-red-300"
                        @click="onDelete"
                    >
                        레이어 삭제
                    </button>
                    <button
                        class="text-[11px] px-2 py-1 rounded bg-ui-accent text-white hover:bg-blue-600"
                        @click="onClose"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            // 모달 초기 폭: 약 320px (이전의 절반 수준)
            windowStyle: {
                width: '320px',
                maxWidth: '90vw',
                maxHeight: '80vh'
            },
            textPlaceholder: '현재의 레이어에 적용할\n텍스트 스타일을 설정하세요',
            colorOptions: (typeof COLORS !== 'undefined'
                ? COLORS.map(c => ({ value: c, label: c }))
                : [])
        };
    },
    computed: {
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
    methods: {
        onClose() {
            this.$emit('close');
        },
        onDelete() {
            // 부모에서 deleteLayerFromConfig 로 처리하도록 이벤트 송출
            this.$emit('delete');
            this.$emit('delete-layer');
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
        }
    }
};

// 전역 등록용
window.LayerConfigModal = LayerConfigModal;
