// Visualization Modal Component - 시각화 관리 + 리사이징 + 드래그 + 최소화 + 다중선택

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
                    id="visualization-modal-header"
                    class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-hover rounded-t-lg"
                    :class="isMinimized ? 'cursor-pointer' : 'cursor-move'"
                    @mousedown.stop="onHeaderMouseDown"
                    @dblclick="toggleMinimize"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-chart-line text-ui-accent"></i>
                        <span class="text-[14px] font-bold">시각화 관리</span>
                        <span v-if="!isMinimized" class="text-[11px] text-text-sub">{{ filteredItems.length }}개 항목</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button v-if="!isMinimized" class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1" @click.stop="addItem">
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
                            <input type="text" v-model="searchQuery" placeholder="시각화 검색..." class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" @mousedown.stop />
                            <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                        </div>
                    </div>

                    <!-- 메인 컨텐츠 -->
                    <div class="flex-1 overflow-auto p-4" @click="onContentAreaClick">
                        <div v-if="filteredItems.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">
                            <i class="fa-solid fa-chart-line text-4xl mb-3"></i>
                            <p class="text-[12px]">{{ currentCategoryLabel }} 항목이 없습니다</p>
                            <p class="text-[11px] mt-1">새 시각화를 추가하세요</p>
                        </div>

                        <div v-else class="asset-grid view-grid" :style="gridStyle" @click="onGridAreaClick">
                            <div
                                v-for="(item, index) in filteredItems"
                                :key="item.id"
                                class="bg-bg-input border border-ui-border rounded-lg p-4 cursor-pointer hover:border-ui-accent transition-colors"
                                :class="{ 'border-ui-accent ring-1 ring-ui-accent': isItemSelected(item.id) }"
                                @click.stop="selectItem($event, item, index)"
                                @dblclick.stop="applyItem(item)"
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
                            <span v-if="selectedItemIds.length > 0">{{ selectedItemIds.length }}개 선택됨</span>
                            <span v-else>{{ currentCategoryLabel }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button v-if="selectedItemIds.length > 0" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click.stop="applySelectedItems">적용</button>
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
            minWidth: 400,
            minHeight: 300,
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
            
            currentCategory: 'chart',
            searchQuery: '',
            selectedItemIds: [],
            lastSelectedIndex: -1,
            
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
                width: (this.isMinimized ? this.minimizedWidth : this.width) + 'px',
                height: (this.isMinimized ? this.minimizedHeight : this.height) + 'px'
            }; 
        },
        gridStyle() {
            const padding = 32;
            const contentWidth = this.width - padding;
            const minCardWidth = 120;
            const gap = 16;
            let cols = Math.max(1, Math.floor((contentWidth + gap) / (minCardWidth + gap)));
            cols = Math.min(cols, 6);
            return {
                display: 'grid',
                gridTemplateColumns: 'repeat(' + cols + ', 1fr)',
                gap: gap + 'px'
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
        document.addEventListener('keydown', this.onKeyDown);
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
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
        onKeyDown(e) {
            if (e.key === 'Escape') {
                this.clearSelection();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            }
        },
        
        isItemSelected(itemId) {
            return this.selectedItemIds.includes(itemId);
        },
        clearSelection() {
            this.selectedItemIds = [];
            this.lastSelectedIndex = -1;
        },
        selectAll() {
            this.selectedItemIds = this.filteredItems.map(i => i.id);
            this.lastSelectedIndex = this.filteredItems.length - 1;
        },
        onContentAreaClick(e) {
            if (e.target.closest('.bg-bg-input')) return;
            this.clearSelection();
        },
        onGridAreaClick(e) {
            if (e.target.closest('.bg-bg-input')) return;
            this.clearSelection();
        },
        selectItem(e, item, index) {
            if (e.ctrlKey || e.metaKey) {
                const idx = this.selectedItemIds.indexOf(item.id);
                if (idx > -1) {
                    this.selectedItemIds.splice(idx, 1);
                } else {
                    this.selectedItemIds.push(item.id);
                }
                this.lastSelectedIndex = index;
            } else if (e.shiftKey && this.lastSelectedIndex >= 0) {
                const items = this.filteredItems;
                const start = Math.min(this.lastSelectedIndex, index);
                const end = Math.max(this.lastSelectedIndex, index);
                const newSelection = [];
                for (let i = start; i <= end; i++) {
                    if (items[i]) {
                        newSelection.push(items[i].id);
                    }
                }
                const combined = this.selectedItemIds.slice();
                newSelection.forEach(id => {
                    if (!combined.includes(id)) {
                        combined.push(id);
                    }
                });
                this.selectedItemIds = combined;
            } else {
                this.selectedItemIds = [item.id];
                this.lastSelectedIndex = index;
            }
        },
        
        applyItem(item) {
            Swal.fire({ 
                icon: 'success', 
                title: '시각화 적용', 
                text: `"${item.name}"을(를) 캔버스에 추가합니다.`, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6', 
                timer: 1500, 
                showConfirmButton: false 
            });
        },
        applySelectedItems() { 
            const items = this.filteredItems.filter(i => this.selectedItemIds.includes(i.id));
            if (items.length > 0) {
                const names = items.map(i => i.name).join(', ');
                Swal.fire({ 
                    icon: 'success', 
                    title: '시각화 적용', 
                    text: `${items.length}개 시각화를 캔버스에 추가합니다: ${names}`, 
                    background: '#1e1e1e', 
                    color: '#fff', 
                    confirmButtonColor: '#3b82f6', 
                    timer: 1500, 
                    showConfirmButton: false 
                });
            }
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
            // 선택되지 않은 항목 드래그 시 해당 항목만 선택
            if (!this.selectedItemIds.includes(item.id)) {
                this.selectedItemIds = [item.id];
            }
            
            const selectedItems = this.filteredItems.filter(it => this.selectedItemIds.includes(it.id));
            
            e.dataTransfer.effectAllowed = 'copy';
            const transferData = selectedItems.map(it => ({
                type: 'visualization',
                id: it.id,
                name: it.name,
                category: it.category,
                vizType: this.currentCategory
            }));
            e.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            
            // 드래그 이미지
            const dragImage = document.createElement('div');
            if (selectedItems.length > 1) {
                dragImage.textContent = `📊 ${selectedItems.length}개 시각화`;
            } else {
                dragImage.textContent = `📊 ${item.name}`;
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

window.VisualizationModal = VisualizationModal;
