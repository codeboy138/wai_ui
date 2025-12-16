// Visualization Modal Component - 시각화 관리 + 리사이징 + 드래그

const VisualizationModal = {
    emits: ['close'],
    template: `
        <div
            id="visualization-modal-overlay"
            class="modal-overlay"
            @click.self="$emit('close')"
            @contextmenu.prevent
        >
            <div
                id="visualization-modal-window"
                class="asset-manager-window bg-bg-panel border border-ui-border rounded-lg shadow-2xl text-[12px] text-text-main flex flex-col"
                :style="windowStyle"
                @mousedown.stop
            >
                <!-- 리사이즈 핸들 -->
                <div class="modal-resize-handle resize-n" @mousedown="startResize($event, 'n')"></div>
                <div class="modal-resize-handle resize-s" @mousedown="startResize($event, 's')"></div>
                <div class="modal-resize-handle resize-e" @mousedown="startResize($event, 'e')"></div>
                <div class="modal-resize-handle resize-w" @mousedown="startResize($event, 'w')"></div>
                <div class="modal-resize-handle resize-nw" @mousedown="startResize($event, 'nw')"></div>
                <div class="modal-resize-handle resize-ne" @mousedown="startResize($event, 'ne')"></div>
                <div class="modal-resize-handle resize-sw" @mousedown="startResize($event, 'sw')"></div>
                <div class="modal-resize-handle resize-se" @mousedown="startResize($event, 'se')"></div>

                <!-- 헤더 -->
                <div
                    id="visualization-modal-header"
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-chart-line text-ui-accent"></i>
                        <span class="text-[14px] font-bold">시각화 관리</span>
                        <span class="text-[11px] text-text-sub">{{ filteredItems.length }}개 항목</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1" @click="addItem">
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
                        <input type="text" v-model="searchQuery" placeholder="시각화 검색..." class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" />
                        <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                    </div>
                </div>

                <!-- 메인 컨텐츠 -->
                <div class="flex-1 overflow-auto p-4">
                    <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">
                        <i class="fa-solid fa-chart-line text-4xl mb-3"></i>
                        <p class="text-[12px]">{{ currentCategoryLabel }} 항목이 없습니다</p>
                        <p class="text-[11px] mt-1">새 시각화를 추가하세요</p>
                    </div>

                    <div v-else class="grid grid-cols-3 gap-4">
                        <div
                            v-for="item in filteredItems"
                            :key="item.id"
                            class="bg-bg-input border border-ui-border rounded-lg p-4 cursor-pointer hover:border-ui-accent transition-colors"
                            :class="{ 'border-ui-accent ring-1 ring-ui-accent': selectedItemId === item.id }"
                            @click="selectItem(item)"
                            @dblclick="applyItem(item)"
                            draggable="true"
                            @dragstart="onItemDragStart($event, item)"
                            @dragend="onDragEnd"
                        >
                            <div class="w-full aspect-video bg-bg-dark rounded flex items-center justify-center mb-3">
                                <i :class="item.icon" class="text-3xl text-ui-accent"></i>
                            </div>
                            <div class="text-[12px] font-medium mb-1">{{ item.name }}</div>
                            <div class="text-[10px] text-text-sub">{{ item.description }}</div>
                        </div>
                    </div>
                </div>

                <!-- 상태바 -->
                <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                    <div class="text-text-sub">
                        <span v-if="selectedItemId">1개 선택됨</span>
                        <span v-else>{{ currentCategoryLabel }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button v-if="selectedItemId" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click="applySelectedItem">적용</button>
                        <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors" @click="$emit('close')">닫기</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            posX: 0, posY: 0,
            width: 1000, height: 650,
            minWidth: 600, minHeight: 400,
            dragging: false, dragStartMouseX: 0, dragStartMouseY: 0, dragStartPosX: 0, dragStartPosY: 0,
            resizing: false, resizeDir: '', resizeStartX: 0, resizeStartY: 0, resizeStartW: 0, resizeStartH: 0, resizeStartPosX: 0, resizeStartPosY: 0,
            
            currentCategory: 'chart',
            searchQuery: '',
            selectedItemId: null,
            
            categoryTabs: [
                { id: 'chart', label: '차트', icon: 'fa-solid fa-chart-bar' },
                { id: 'graph', label: '그래프', icon: 'fa-solid fa-chart-line' },
                { id: 'infographic', label: '인포그래픽', icon: 'fa-solid fa-icons' },
                { id: 'data', label: '데이터 표시', icon: 'fa-solid fa-table' }
            ],
            
            dummyItems: [
                { id: 'c1', name: '막대 차트', description: '수직/수평 막대 차트', category: 'chart', icon: 'fa-solid fa-chart-bar' },
                { id: 'c2', name: '파이 차트', description: '원형 비율 차트', category: 'chart', icon: 'fa-solid fa-chart-pie' },
                { id: 'c3', name: '도넛 차트', description: '도넛형 비율 차트', category: 'chart', icon: 'fa-solid fa-circle-notch' },
                { id: 'g1', name: '라인 그래프', description: '시계열 데이터 표시', category: 'graph', icon: 'fa-solid fa-chart-line' },
                { id: 'g2', name: '영역 그래프', description: '면적 강조 그래프', category: 'graph', icon: 'fa-solid fa-chart-area' },
                { id: 'i1', name: '진행률 바', description: '진행 상태 표시', category: 'infographic', icon: 'fa-solid fa-bars-progress' },
                { id: 'i2', name: '카운터', description: '숫자 카운트 애니메이션', category: 'infographic', icon: 'fa-solid fa-calculator' },
                { id: 'd1', name: '데이터 테이블', description: '표 형식 데이터', category: 'data', icon: 'fa-solid fa-table' },
                { id: 'd2', name: '순위표', description: '순위 리스트 표시', category: 'data', icon: 'fa-solid fa-ranking-star' }
            ]
        };
    },
    computed: {
        windowStyle() { 
            return { 
                position: 'absolute', 
                left: this.posX + 'px', 
                top: this.posY + 'px',
                width: this.width + 'px',
                height: this.height + 'px'
            }; 
        },
        currentCategoryLabel() { 
            const tab = this.categoryTabs.find(t => t.id === this.currentCategory);
            return tab ? tab.label : '전체';
        },
        filteredItems() {
            let items = this.dummyItems.filter(i => i.category === this.currentCategory);
            if (this.searchQuery) { 
                const q = this.searchQuery.toLowerCase(); 
                items = items.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)); 
            }
            return items;
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
        onHeaderMouseDown(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX; this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX; this.dragStartPosY = this.posY;
        },
        startResize(e, dir) {
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
        onGlobalMouseUp() { this.dragging = false; this.resizing = false; },
        
        selectItem(item) { this.selectedItemId = item.id; },
        
        applyItem(item) {
            Swal.fire({ icon: 'success', title: '시각화 적용', text: `"${item.name}"을(를) 캔버스에 추가합니다.`, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            this.$emit('close');
        },
        applySelectedItem() { 
            const item = this.filteredItems.find(i => i.id === this.selectedItemId); 
            if (item) this.applyItem(item); 
        },
        
        async addItem() {
            const { value: name } = await Swal.fire({ 
                title: '새 시각화 추가', 
                input: 'text', 
                inputPlaceholder: '시각화 이름', 
                showCancelButton: true, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6' 
            });
            if (name) { 
                this.dummyItems.push({ 
                    id: `viz_${Date.now()}`, 
                    name, 
                    description: '사용자 정의 시각화',
                    category: this.currentCategory,
                    icon: 'fa-solid fa-chart-simple'
                }); 
            }
        },
        
        // 드래그앤드롭
        onItemDragStart(e, item) {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/wai-asset', JSON.stringify({ 
                type: 'visualization', 
                id: item.id, 
                name: item.name,
                category: item.category,
                vizType: this.currentCategory
            }));
        },
        onDragEnd() {
            // 드래그 종료 시 정리
        }
    }
};

window.VisualizationModal = VisualizationModal;
