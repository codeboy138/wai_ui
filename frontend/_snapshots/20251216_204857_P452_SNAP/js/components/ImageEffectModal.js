// Image Effect Modal Component - 이미지효과 관리

const ImageEffectModal = {
    emits: ['close'],
    template: `
        <div
            id="image-effect-modal-overlay"
            class="modal-overlay"
            @click.self="$emit('close')"
            @contextmenu.prevent
        >
            <div
                id="image-effect-modal-window"
                class="asset-manager-window bg-bg-panel border border-ui-border rounded-lg shadow-2xl text-[12px] text-text-main flex flex-col"
                :style="windowStyle"
                @mousedown.stop
            >
                <!-- 헤더 -->
                <div
                    id="image-effect-modal-header"
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-wand-magic-sparkles text-ui-accent"></i>
                        <span class="text-[14px] font-bold">이미지효과 관리</span>
                        <span class="text-[11px] text-text-sub">{{ filteredEffects.length }}개 효과</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1" @click="addEffect">
                            <i class="fa-solid fa-plus"></i> 추가
                        </button>
                        <button class="text-[14px] text-text-sub hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit('close')">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <!-- 카테고리 탭 -->
                <div class="flex items-center px-4 py-2 border-b border-ui-border bg-bg-panel gap-1">
                    <button
                        v-for="tab in categoryTabs"
                        :key="tab.id"
                        class="px-4 py-1.5 text-[11px] rounded transition-colors"
                        :class="currentCategory === tab.id ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                        @click="currentCategory = tab.id"
                    >
                        <i :class="tab.icon" class="mr-1"></i>{{ tab.label }}
                    </button>
                    
                    <div class="flex-1"></div>
                    
                    <div class="relative">
                        <input type="text" v-model="searchQuery" placeholder="효과 검색..." class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" />
                        <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                    </div>
                </div>

                <!-- 메인 컨텐츠 -->
                <div class="flex-1 overflow-auto p-4">
                    <div v-if="filteredEffects.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">
                        <i class="fa-solid fa-wand-magic-sparkles text-4xl mb-3"></i>
                        <p class="text-[12px]">{{ currentCategoryLabel }} 효과가 없습니다</p>
                        <p class="text-[11px] mt-1">새 효과를 추가하세요</p>
                    </div>

                    <div v-else class="grid grid-cols-4 gap-3">
                        <div
                            v-for="effect in filteredEffects"
                            :key="effect.id"
                            class="bg-bg-input border border-ui-border rounded-lg p-3 cursor-pointer hover:border-ui-accent transition-colors"
                            :class="{ 'border-ui-accent ring-1 ring-ui-accent': selectedEffectId === effect.id }"
                            @click="selectEffect(effect)"
                            @dblclick="applyEffect(effect)"
                        >
                            <div class="w-full aspect-video bg-bg-dark rounded flex items-center justify-center mb-2">
                                <i :class="effect.icon" class="text-2xl text-ui-accent"></i>
                            </div>
                            <div class="text-[11px] font-medium truncate">{{ effect.name }}</div>
                            <div class="text-[10px] text-text-sub">{{ effect.description }}</div>
                        </div>
                    </div>
                </div>

                <!-- 상태바 -->
                <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                    <div class="text-text-sub">
                        <span v-if="selectedEffectId">1개 선택됨</span>
                        <span v-else>{{ currentCategoryLabel }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button v-if="selectedEffectId" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click="applySelectedEffect">적용</button>
                        <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors" @click="$emit('close')">닫기</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            posX: 0, posY: 0,
            dragging: false, dragStartMouseX: 0, dragStartMouseY: 0, dragStartPosX: 0, dragStartPosY: 0,
            
            currentCategory: 'filter',
            searchQuery: '',
            selectedEffectId: null,
            
            categoryTabs: [
                { id: 'filter', label: '필터', icon: 'fa-solid fa-sliders' },
                { id: 'transition', label: '전환', icon: 'fa-solid fa-shuffle' },
                { id: 'overlay', label: '오버레이', icon: 'fa-solid fa-layer-group' },
                { id: 'animation', label: '애니메이션', icon: 'fa-solid fa-film' }
            ],
            
            dummyEffects: [
                { id: 'f1', name: '블러', description: '가우시안 블러 효과', category: 'filter', icon: 'fa-solid fa-circle-half-stroke' },
                { id: 'f2', name: '선명화', description: '이미지 선명도 향상', category: 'filter', icon: 'fa-solid fa-diamond' },
                { id: 'f3', name: '흑백', description: '그레이스케일 변환', category: 'filter', icon: 'fa-solid fa-circle' },
                { id: 'f4', name: '세피아', description: '빈티지 세피아 톤', category: 'filter', icon: 'fa-solid fa-palette' },
                { id: 't1', name: '페이드', description: '부드러운 페이드 효과', category: 'transition', icon: 'fa-solid fa-circle-right' },
                { id: 't2', name: '슬라이드', description: '슬라이드 전환', category: 'transition', icon: 'fa-solid fa-arrow-right' },
                { id: 'o1', name: '빛 누출', description: '필름 빛 누출 효과', category: 'overlay', icon: 'fa-solid fa-sun' },
                { id: 'o2', name: '그레인', description: '필름 그레인 효과', category: 'overlay', icon: 'fa-solid fa-braille' },
                { id: 'a1', name: '줌 인', description: '확대 애니메이션', category: 'animation', icon: 'fa-solid fa-magnifying-glass-plus' },
                { id: 'a2', name: '회전', description: '회전 애니메이션', category: 'animation', icon: 'fa-solid fa-rotate' }
            ]
        };
    },
    computed: {
        windowStyle() { return { position: 'absolute', left: this.posX + 'px', top: this.posY + 'px' }; },
        currentCategoryLabel() { 
            const tab = this.categoryTabs.find(t => t.id === this.currentCategory);
            return tab ? tab.label : '전체';
        },
        filteredEffects() {
            let effects = this.dummyEffects.filter(e => e.category === this.currentCategory);
            if (this.searchQuery) { 
                const q = this.searchQuery.toLowerCase(); 
                effects = effects.filter(e => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)); 
            }
            return effects;
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
            this.posX = Math.max(20, (vw - 1000) / 2);
            this.posY = Math.max(20, (vh - 650) / 2);
        },
        onHeaderMouseDown(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX; this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX; this.dragStartPosY = this.posY;
        },
        onGlobalMouseMove(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
            }
        },
        onGlobalMouseUp() { this.dragging = false; },
        
        selectEffect(effect) { this.selectedEffectId = effect.id; },
        
        applyEffect(effect) {
            Swal.fire({ icon: 'success', title: '효과 적용', text: `"${effect.name}" 효과를 적용합니다.`, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            this.$emit('close');
        },
        applySelectedEffect() { 
            const effect = this.filteredEffects.find(e => e.id === this.selectedEffectId); 
            if (effect) this.applyEffect(effect); 
        },
        
        async addEffect() {
            const { value: name } = await Swal.fire({ 
                title: '새 효과 추가', 
                input: 'text', 
                inputPlaceholder: '효과 이름', 
                showCancelButton: true, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6' 
            });
            if (name) { 
                this.dummyEffects.push({ 
                    id: `effect_${Date.now()}`, 
                    name, 
                    description: '사용자 정의 효과',
                    category: this.currentCategory,
                    icon: 'fa-solid fa-star'
                }); 
            }
        }
    }
};

window.ImageEffectModal = ImageEffectModal;
