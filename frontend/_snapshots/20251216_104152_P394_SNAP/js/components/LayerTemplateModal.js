// Layer Template Modal Component (레이어 템플릿 관리 모달)
// 저장된 레이어 템플릿 목록을 보여주고 불러오기/삭제 기능 제공

const LayerTemplateModal = {
    props: {
        templates: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    emits: ['close', 'delete-template', 'load-template'],
    template: `
        <div
            id="layer-template-modal-overlay"
            class="fixed inset-0 z-40 bg-black/60"
            @click.self="$emit('close')"
        >
            <div
                id="layer-template-modal-window"
                class="layer-template-window bg-bg-panel border border-ui-border rounded shadow-lg text-[12px] text-text-main flex flex-col"
                :style="windowStyle"
                @mousedown.stop
            >
                <!-- 헤더 -->
                <div
                    id="layer-template-modal-header"
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <span class="text-[14px] font-bold">레이어 템플릿 관리</span>
                    <button
                        id="layer-template-modal-close-btn"
                        class="text-[12px] text-text-sub hover:text-white w-6 h-6 flex items-center justify-center"
                        @click.stop="$emit('close')"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- 바디: 템플릿 목록 -->
                <div
                    id="layer-template-modal-body"
                    class="flex-1 overflow-auto p-4"
                >
                    <!-- 빈 상태 -->
                    <div
                        v-if="templates.length === 0"
                        class="flex flex-col items-center justify-center h-full text-text-sub opacity-50"
                    >
                        <i class="fa-solid fa-folder-open text-3xl mb-2"></i>
                        <p class="text-[12px]">저장된 템플릿이 없습니다</p>
                        <p class="text-[11px] mt-1">레이어 관리 패널에서 '저장' 버튼을 눌러 템플릿을 생성하세요</p>
                    </div>

                    <!-- 템플릿 목록 -->
                    <div v-else class="space-y-2">
                        <div
                            v-for="tpl in templates"
                            :key="tpl.id"
                            :id="'layer-template-item-' + tpl.id"
                            class="bg-bg-input border border-ui-border rounded p-3 hover:border-ui-accent transition-colors"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="text-[12px] font-bold text-text-main">{{ tpl.name }}</div>
                                    <div class="text-[11px] text-text-sub mt-1">
                                        저장일: {{ formatDate(tpl.createdAt) }}
                                    </div>
                                    <div class="text-[11px] text-text-sub">
                                        레이어 수: {{ getBoxCount(tpl) }}개
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button
                                        class="text-[11px] bg-ui-accent text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                        @click="loadTemplate(tpl)"
                                        title="이 템플릿을 캔버스에 불러옵니다"
                                    >
                                        불러오기
                                    </button>
                                    <button
                                        class="text-[11px] bg-ui-border text-text-sub px-3 py-1 rounded hover:bg-ui-danger hover:text-white transition-colors"
                                        @click="deleteTemplate(tpl)"
                                        title="이 템플릿을 삭제합니다"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>

                            <!-- JSON 미리보기 (접기/펼치기) -->
                            <div class="mt-2">
                                <button
                                    class="text-[10px] text-text-sub hover:text-text-main"
                                    @click="toggleJsonPreview(tpl.id)"
                                >
                                    <i :class="['fa-solid', expandedJsonIds.includes(tpl.id) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                                    JSON 미리보기
                                </button>
                                <div
                                    v-if="expandedJsonIds.includes(tpl.id)"
                                    class="mt-2 bg-bg-dark border border-ui-border rounded p-2 max-h-40 overflow-auto"
                                >
                                    <pre class="text-[10px] text-text-sub whitespace-pre-wrap font-mono">{{ tpl.matrixJson }}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 푸터 -->
                <div
                    id="layer-template-modal-footer"
                    class="px-4 py-3 border-t border-ui-border flex justify-between items-center"
                >
                    <span class="text-[11px] text-text-sub">
                        총 {{ templates.length }}개의 템플릿
                    </span>
                    <button
                        class="text-[12px] bg-ui-border text-text-sub px-4 py-1.5 rounded hover:bg-bg-hover transition-colors"
                        @click="$emit('close')"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            posX: 0,
            posY: 0,
            dragging: false,
            dragStartMouseX: 0,
            dragStartMouseY: 0,
            dragStartPosX: 0,
            dragStartPosY: 0,
            expandedJsonIds: []
        };
    },
    computed: {
        windowStyle() {
            return {
                position: 'absolute',
                left: this.posX + 'px',
                top: this.posY + 'px'
            };
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
        centerWindow() {
            const vw = window.innerWidth || 1280;
            const vh = window.innerHeight || 720;
            this.posX = Math.max(20, (vw - 600) / 2);
            this.posY = Math.max(20, (vh - 500) / 2);
        },

        onHeaderMouseDown(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX;
            this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX;
            this.dragStartPosY = this.posY;
        },

        onGlobalMouseMove(e) {
            if (this.dragging) {
                const dx = e.clientX - this.dragStartMouseX;
                const dy = e.clientY - this.dragStartMouseY;
                this.posX = this.dragStartPosX + dx;
                this.posY = this.dragStartPosY + dy;
            }
        },

        onGlobalMouseUp() {
            this.dragging = false;
        },

        formatDate(isoString) {
            if (!isoString) return '-';
            try {
                const date = new Date(isoString);
                return date.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return isoString;
            }
        },

        getBoxCount(tpl) {
            if (tpl.matrixJson) {
                try {
                    const parsed = JSON.parse(tpl.matrixJson);
                    if (parsed.canvasBoxes && Array.isArray(parsed.canvasBoxes)) {
                        return parsed.canvasBoxes.length;
                    }
                } catch (e) {
                    // ignore
                }
            }
            return 0;
        },

        toggleJsonPreview(id) {
            const idx = this.expandedJsonIds.indexOf(id);
            if (idx === -1) {
                this.expandedJsonIds.push(id);
            } else {
                this.expandedJsonIds.splice(idx, 1);
            }
        },

        async loadTemplate(tpl) {
            const result = await Swal.fire({
                title: '템플릿 불러오기',
                text: `"${tpl.name}" 템플릿을 불러오시겠습니까? 현재 캔버스의 레이어가 교체됩니다.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '불러오기',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                cancelButtonColor: '#4b5563'
            });

            if (result.isConfirmed) {
                this.$emit('load-template', tpl);
                this.$emit('close');
            }
        },

        async deleteTemplate(tpl) {
            const result = await Swal.fire({
                title: '템플릿 삭제',
                text: `"${tpl.name}" 템플릿을 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#4b5563'
            });

            if (result.isConfirmed) {
                this.$emit('delete-template', tpl.id);
            }
        }
    }
};

window.LayerTemplateModal = LayerTemplateModal;
