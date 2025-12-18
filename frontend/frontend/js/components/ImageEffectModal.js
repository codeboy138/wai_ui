// Image Effect Modal Component - 이미지효과 관리 + 리사이징 + 드래그 + 최소화 + 다중선택

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
                @mousedown="onWindowMouseDown"
            >
                <!-- 리사이즈 핸들 -->
                <div class="modal-resize-handle resize-n" @mousedown.stop="startResize($event, 'n')"></div>
                <div class="modal-resize-handle resize-s" @mousedown.stop="startResize($event, 's')"></div>
                <div class="modal-resize-handle resize-e" @mousedown.stop="startResize($event, 'e')"></div>
                <div class="modal-resize-handle resize-w" @mousedown.stop="startResize($event, 'w')"></div>
                <div class="modal-resize-handle resize-nw" @mousedown.stop="startResize($event, 'nw')"></div>
                <div class="modal-resize-handle resize-ne" @mousedown.stop="startResize($event, 'ne')"></div>
                <div class="modal-resize-handle resize-sw" @mousedown.stop="startResize($event, 'sw')"></div>
                <div class="modal-resize-handle resize-se" @mousedown.stop="startResize($event, 'se')"></div>

                <!-- 헤더 -->
                <div
                    id="image-effect-modal-header"
                    class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-hover rounded-t-lg"
                    :class="isMinimized ? 'cursor-pointer' : 'cursor-move'"
                    @mousedown.stop="onHeaderMouseDown"
                    @dblclick="toggleMinimize"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-wand-magic-sparkles text-ui-accent"></i>
                        <span class="text-[14px] font-bold">이미지효과 관리</span>
                        <span v-if="!isMinimized" class="text-[11px] text-text-sub">{{ filteredEffects.length }}개 효과</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button v-if="!isMinimized" class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1" @click.stop="addEffect">
                            <i class="fa-solid fa-plus"></i> 추가
                        </button>
                        <button class="text-[14px] text-text-sub hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-bg-input transition-colors" @click.stop="toggleMinimize" :title="isMinimized ? '확장' : '최소화'">
                            <i :class="isMinimized ? 'fa-solid fa-expand' : 'fa-solid fa-minus'"></i>
                        </button>
                        <button class="text-[14px] text-text-sub hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit('close')">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <template v-if="!isMinimized">
                    <!-- 카테고리 탭 -->
                    <div class="flex items-center px-4 py-2 border-b border-ui-border bg-bg-panel gap-1">
                        <button
                            v-for="tab in categoryTabs"
                            :key="tab.id"
                            class="px-4 py-1.5 text-[11px] rounded transition-colors"
                            :class="currentCategory === tab.id ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                            @click.stop="currentCategory = tab.id"
                        >
                            <i :class="tab.icon" class="mr-1"></i>{{ tab.label }}
                        </button>
                        
                        <div class="flex-1"></div>
                        
                        <div class="relative">
                            <input type="text" v-model="searchQuery" placeholder="효과 검색..." class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" @mousedown.stop />
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
                                :class="{ 'border-ui-accent ring-1 ring-ui-accent': isEffectSelected(effect.id) }"
                                @click.stop="selectEffect($event, effect)"
                                @dblclick.stop="applyEffect(effect)"
                                draggable="true"
                                @dragstart="onEffectDragStart($event, effect)"
                                @dragend="onDragEnd"
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
                            <span v-if="selectedEffectIds.length > 0">{{ selectedEffectIds.length }}개 선택됨</span>
                            <span v-else>{{ currentCategoryLabel }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button v-if="selectedEffectIds.length > 0" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click.stop="applySelectedEffects">적용</button>
                            <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors" @click.stop="$emit('close')">닫기</button>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    `,
    data() {
        return {
            posX: 0,
            posY: 0,
            width: 1000,
            height: 650,
            minWidth: 600,
            minHeight: 400,
            minimizedWidth: 280,
            minimizedHeight: 45,
            prevWidth: 1000,
            prevHeight: 650,
            isMinimized: false,
            dragging: false,
            dragStartMouseX: 0,
            dragStartMouseY: 0,
            dragStartPosX: 0,
            dragStartPosY: 0,
            resizing: false,
            resizeDir: '',
            resizeStartX: 0,
            resizeStartY: 0,
            resizeStartW: 0,
            resizeStartH: 0,
            resizeStartPosX: 0,
            resizeStartPosY: 0,
            
            currentCategory: 'filter',
            searchQuery: '',
            selectedEffectIds: [],
            
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
        windowStyle() { 
            return { 
                position: 'absolute', 
                left: this.posX + 'px', 
                top: this.posY + 'px',
                width: (this.isMinimized ? this.minimizedWidth : this.width) + 'px',
                height: (this.isMinimized ? this.minimizedHeight : this.height) + 'px'
            }; 
        },
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
            this.posX = Math.max(20, (vw - this.width) / 2);
            this.posY = Math.max(20, (vh - this.height) / 2);
        },
        clampPosition() {
            const vw = window.innerWidth || 1280;
            const vh = window.innerHeight || 720;
            const w = this.isMinimized ? this.minimizedWidth : this.width;
            const h = this.isMinimized ? this.minimizedHeight : this.height;
            const minVisible = 100;
            if (this.posX < -w + minVisible) this.posX = -w + minVisible;
            if (this.posX > vw - minVisible) this.posX = vw - minVisible;
            if (this.posY < 0) this.posY = 0;
            if (this.posY > vh - minVisible) this.posY = vh - minVisible;
        },
        toggleMinimize() {
            if (this.isMinimized) {
                this.isMinimized = false;
                this.width = this.prevWidth;
                this.height = this.prevHeight;
            } else {
                this.prevWidth = this.width;
                this.prevHeight = this.height;
                this.isMinimized = true;
            }
            this.clampPosition();
        },
        onWindowMouseDown(e) {
            if (e.target.closest('input, button, select, .bg-bg-input, .modal-resize-handle')) return;
            this.startDrag(e);
        },
        onHeaderMouseDown(e) {
            if (e.target.closest('button')) return;
            this.startDrag(e);
        },
        startDrag(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX;
            this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX;
            this.dragStartPosY = this.posY;
        },
        startResize(e, dir) {
            if (this.isMinimized) return;
            e.preventDefault();
            e.stopPropagation();
            this.resizing = true;
            this.resizeDir = dir;
            this.resizeStartX = e.clientX;
            this.resizeStartY = e.clientY;
            this.resizeStartW = this.width;
            this.resizeStartH = this.height;
            this.resizeStartPosX = this.posX;
            this.resizeStartPosY = this.posY;
        },
        onGlobalMouseMove(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
                this.clampPosition();
            }
            if (this.resizing) {
                const dx = e.clientX - this.resizeStartX;
                const dy = e.clientY - this.resizeStartY;
                const dir = this.resizeDir;
                
                let newW = this.resizeStartW;
                let newH = this.resizeStartH;
                let newX = this.resizeStartPosX;
                let newY = this.resizeStartPosY;
                
                if (dir.includes('e')) newW = Math.max(this.minWidth, this.resizeStartW + dx);
                if (dir.includes('w')) { newW = Math.max(this.minWidth, this.resizeStartW - dx); newX = this.resizeStartPosX + (this.resizeStartW - newW); }
                if (dir.includes('s')) newH = Math.max(this.minHeight, this.resizeStartH + dy);
                if (dir.includes('n')) { newH = Math.max(this.minHeight, this.resizeStartH - dy); newY = this.resizeStartPosY + (this.resizeStartH - newH); }
                
                this.width = newW;
                this.height = newH;
                this.posX = newX;
                this.posY = newY;
            }
        },
        onGlobalMouseUp() { 
            this.dragging = false; 
            this.resizing = false; 
        },
        
        isEffectSelected(effectId) {
            return this.selectedEffectIds.includes(effectId);
        },
        selectEffect(e, effect) {
            if (e.ctrlKey || e.metaKey) {
                const idx = this.selectedEffectIds.indexOf(effect.id);
                if (idx > -1) {
                    this.selectedEffectIds.splice(idx, 1);
                } else {
                    this.selectedEffectIds.push(effect.id);
                }
            } else if (e.shiftKey && this.selectedEffectIds.length > 0) {
                const lastId = this.selectedEffectIds[this.selectedEffectIds.length - 1];
                const effects = this.filteredEffects;
                let lastIdx = -1, curIdx = -1;
                for (let i = 0; i < effects.length; i++) {
                    if (effects[i].id === lastId) lastIdx = i;
                    if (effects[i].id === effect.id) curIdx = i;
                }
                if (lastIdx >= 0 && curIdx >= 0) {
                    const minIdx = Math.min(lastIdx, curIdx);
                    const maxIdx = Math.max(lastIdx, curIdx);
                    this.selectedEffectIds = [];
                    for (let j = minIdx; j <= maxIdx; j++) {
                        this.selectedEffectIds.push(effects[j].id);
                    }
                }
            } else {
                this.selectedEffectIds = [effect.id];
            }
        },
        
        applyEffect(effect) {
            Swal.fire({ 
                icon: 'success', 
                title: '효과 적용', 
                text: `"${effect.name}" 효과를 적용합니다.`, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6', 
                timer: 1500, 
                showConfirmButton: false 
            });
            // 모달 유지 - $emit('close') 제거
        },
        applySelectedEffects() { 
            const effects = this.filteredEffects.filter(e => this.selectedEffectIds.includes(e.id));
            if (effects.length > 0) {
                const names = effects.map(e => e.name).join(', ');
                Swal.fire({ 
                    icon: 'success', 
                    title: '효과 적용', 
                    text: `${effects.length}개 효과를 적용합니다: ${names}`, 
                    background: '#1e1e1e', 
                    color: '#fff', 
                    confirmButtonColor: '#3b82f6', 
                    timer: 1500, 
                    showConfirmButton: false 
                });
            }
            // 모달 유지 - $emit('close') 제거
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
        },
        
        // 드래그앤드롭
        onEffectDragStart(e, effect) {
            // 선택되지 않은 항목 드래그 시 해당 항목만 선택
            if (!this.selectedEffectIds.includes(effect.id)) {
                this.selectedEffectIds = [effect.id];
            }
            
            const selectedEffects = this.filteredEffects.filter(ef => this.selectedEffectIds.includes(ef.id));
            
            e.dataTransfer.effectAllowed = 'copy';
            const transferData = selectedEffects.map(ef => ({
                type: 'effect',
                id: ef.id,
                name: ef.name,
                category: ef.category,
                effectType: this.currentCategory
            }));
            e.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            
            // 드래그 이미지
            const dragImage = document.createElement('div');
            if (selectedEffects.length > 1) {
                dragImage.textContent = `✨ ${selectedEffects.length}개 효과`;
            } else {
                dragImage.textContent = `✨ ${effect.name}`;
            }
            dragImage.style.cssText = 'position:absolute;top:-1000px;padding:8px 16px;background:#3b82f6;color:#fff;border-radius:6px;font-size:12px;font-weight:bold;white-space:nowrap;';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        },
        onDragEnd() {
            // 드래그 종료 시 정리
        }
    }
};

window.ImageEffectModal = ImageEffectModal;
