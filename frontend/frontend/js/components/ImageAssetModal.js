// Image Asset Modal Component - 이미지 관리 (배경/인물/사물 탭) + 리사이징

const ImageAssetModal = {
    emits: ['close'],
    template: `
        <div
            id="image-asset-modal-overlay"
            class="modal-overlay"
            @click.self="$emit('close')"
            @contextmenu.prevent
        >
            <div
                id="image-asset-modal-window"
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
                    id="image-asset-modal-header"
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-image text-ui-accent"></i>
                        <span class="text-[14px] font-bold">이미지 관리</span>
                        <span class="text-[11px] text-text-sub">{{ filteredAssets.length }}개 이미지</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1" @click="addAsset">
                            <i class="fa-solid fa-plus"></i> 추가
                        </button>
                        <button class="text-[14px] text-text-sub hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit('close')">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <!-- 카테고리 탭 (배경/인물/사물) -->
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
                    
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <input type="text" v-model="searchQuery" placeholder="이미지 검색..." class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" />
                            <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                        </div>
                        
                        <div class="flex border border-ui-border rounded overflow-hidden">
                            <button class="px-2 py-1 text-[10px]" :class="viewMode === 'grid' ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'" @click="viewMode = 'grid'">
                                <i class="fa-solid fa-grip"></i>
                            </button>
                            <button class="px-2 py-1 text-[10px]" :class="viewMode === 'list' ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'" @click="viewMode = 'list'">
                                <i class="fa-solid fa-list"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 메인 컨텐츠 -->
                <div class="flex-1 flex overflow-hidden">
                    <!-- 좌측: 폴더 -->
                    <div class="w-48 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">
                        <div class="p-2 border-b border-ui-border bg-bg-panel">
                            <span class="text-[10px] text-text-sub font-bold uppercase tracking-wide">폴더</span>
                        </div>
                        <div class="flex-1 overflow-auto p-1">
                            <div 
                                v-for="folder in assetFolders"
                                :key="folder.id"
                                class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-[11px] transition-colors"
                                :class="{
                                    'bg-ui-selected text-white': currentFolderId === folder.id,
                                    'hover:bg-bg-hover': currentFolderId !== folder.id
                                }"
                                @click="currentFolderId = folder.id"
                            >
                                <i class="fa-solid fa-folder text-yellow-500"></i>
                                <span class="truncate flex-1">{{ folder.name }}</span>
                                <span class="text-[9px] text-text-sub">{{ getFolderAssetCount(folder.id) }}</span>
                            </div>
                        </div>
                        
                        <div class="p-2 border-t border-ui-border">
                            <button class="w-full px-2 py-1 text-[10px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover flex items-center justify-center gap-1" @click="createFolder">
                                <i class="fa-solid fa-folder-plus"></i> 새 폴더
                            </button>
                        </div>
                    </div>

                    <!-- 우측: 이미지 목록 -->
                    <div class="flex-1 flex flex-col bg-bg-dark overflow-hidden">
                        <div class="flex items-center justify-between px-3 py-1.5 border-b border-ui-border bg-bg-panel text-[10px]">
                            <div class="flex items-center gap-4">
                                <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ 'text-ui-accent': sortBy === 'name' }" @click="toggleSort('name')">
                                    이름 <i v-if="sortBy === 'name'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                </span>
                                <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ 'text-ui-accent': sortBy === 'date' }" @click="toggleSort('date')">
                                    추가일 <i v-if="sortBy === 'date'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                </span>
                            </div>
                            <span class="text-text-sub">{{ filteredAssets.length }}개 항목</span>
                        </div>

                        <div class="flex-1 overflow-auto p-3">
                            <div v-if="filteredAssets.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">
                                <i class="fa-solid fa-image text-4xl mb-3"></i>
                                <p class="text-[12px]">{{ currentCategoryLabel }} 이미지가 없습니다</p>
                                <p class="text-[11px] mt-1">파일을 추가하거나 드래그하여 가져오세요</p>
                            </div>

                            <!-- 그리드 보기 -->
                            <div v-else-if="viewMode === 'grid'" class="asset-grid view-grid">
                                <div
                                    v-for="asset in filteredAssets"
                                    :key="asset.id"
                                    class="asset-card"
                                    :class="{ 'selected': selectedAssetId === asset.id, 'dragging': draggingAssetId === asset.id }"
                                    @click="selectAsset(asset)"
                                    @dblclick="useAsset(asset)"
                                    draggable="true"
                                    @dragstart="onAssetDragStart($event, asset)"
                                    @dragend="onDragEnd"
                                >
                                    <div class="asset-thumbnail">
                                        <img v-if="asset.src" :src="asset.src" class="w-full h-full object-cover" />
                                        <i v-else class="asset-thumbnail-icon fa-solid fa-image"></i>
                                    </div>
                                    <div class="asset-info">
                                        <div class="asset-name">{{ asset.name }}</div>
                                        <div class="asset-meta">{{ asset.resolution || '' }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 리스트 보기 -->
                            <div v-else class="asset-grid view-list">
                                <div
                                    v-for="asset in filteredAssets"
                                    :key="asset.id"
                                    class="asset-card"
                                    :class="{ 'selected': selectedAssetId === asset.id, 'dragging': draggingAssetId === asset.id }"
                                    @click="selectAsset(asset)"
                                    @dblclick="useAsset(asset)"
                                    draggable="true"
                                    @dragstart="onAssetDragStart($event, asset)"
                                    @dragend="onDragEnd"
                                >
                                    <div class="asset-thumbnail">
                                        <i class="asset-thumbnail-icon fa-solid fa-image"></i>
                                    </div>
                                    <div class="asset-info">
                                        <div class="flex-1">
                                            <div class="asset-name">{{ asset.name }}</div>
                                            <div class="asset-meta">{{ asset.resolution || '' }}</div>
                                        </div>
                                        <div class="text-[10px] text-text-sub">{{ asset.category }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 상태바 -->
                <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                    <div class="text-text-sub">
                        <span v-if="selectedAssetId">1개 선택됨 - 캔버스로 드래그하세요</span>
                        <span v-else>{{ currentCategoryLabel }} · {{ currentFolderName }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button v-if="selectedAssetId" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click="useSelectedAsset">사용</button>
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
            
            currentCategory: 'background',
            currentFolderId: 'all',
            viewMode: 'grid',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            
            selectedAssetId: null,
            draggingAssetId: null,
            
            categoryTabs: [
                { id: 'background', label: '배경', icon: 'fa-solid fa-panorama' },
                { id: 'person', label: '인물', icon: 'fa-solid fa-user' },
                { id: 'object', label: '사물', icon: 'fa-solid fa-cube' }
            ],
            
            assetFolders: [
                { id: 'all', name: '전체' },
                { id: 'recent', name: '최근 사용' },
                { id: 'favorites', name: '즐겨찾기' }
            ],
            
            dummyAssets: [
                { id: 'bg1', name: 'city_skyline.jpg', resolution: '3840x2160', category: 'background', folderId: 'all' },
                { id: 'bg2', name: 'nature_forest.jpg', resolution: '1920x1080', category: 'background', folderId: 'all' },
                { id: 'bg3', name: 'studio_backdrop.png', resolution: '4096x2160', category: 'background', folderId: 'all' },
                { id: 'p1', name: 'presenter_male.png', resolution: '1080x1920', category: 'person', folderId: 'all' },
                { id: 'p2', name: 'presenter_female.png', resolution: '1080x1920', category: 'person', folderId: 'all' },
                { id: 'o1', name: 'logo_icon.png', resolution: '512x512', category: 'object', folderId: 'all' },
                { id: 'o2', name: 'lower_third.png', resolution: '1920x200', category: 'object', folderId: 'all' }
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
        currentFolderName() { 
            const folder = this.assetFolders.find(f => f.id === this.currentFolderId); 
            return folder ? folder.name : '전체'; 
        },
        filteredAssets() {
            let assets = this.dummyAssets.filter(a => a.category === this.currentCategory);
            if (this.currentFolderId !== 'all') assets = assets.filter(a => a.folderId === this.currentFolderId);
            if (this.searchQuery) { 
                const q = this.searchQuery.toLowerCase(); 
                assets = assets.filter(a => a.name.toLowerCase().includes(q)); 
            }
            assets = [...assets].sort((a, b) => { 
                let cmp = this.sortBy === 'name' ? a.name.localeCompare(b.name) : 0; 
                return this.sortAsc ? cmp : -cmp; 
            });
            return assets;
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
        
        toggleSort(field) { 
            if (this.sortBy === field) this.sortAsc = !this.sortAsc; 
            else { this.sortBy = field; this.sortAsc = true; } 
        },
        selectAsset(asset) { this.selectedAssetId = asset.id; },
        
        useAsset(asset) {
            Swal.fire({ icon: 'success', title: '이미지 사용', text: `"${asset.name}"을(를) 캔버스에 추가합니다.`, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            this.$emit('close');
        },
        useSelectedAsset() { 
            const asset = this.filteredAssets.find(a => a.id === this.selectedAssetId); 
            if (asset) this.useAsset(asset); 
        },
        
        // 드래그앤드롭 - 캔버스로
        onAssetDragStart(e, asset) {
            this.draggingAssetId = asset.id;
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/wai-asset', JSON.stringify({ 
                type: 'image', 
                id: asset.id, 
                name: asset.name,
                resolution: asset.resolution,
                category: asset.category
            }));
            
            const dragImage = document.createElement('div');
            dragImage.textContent = asset.name;
            dragImage.style.cssText = 'position:absolute;top:-1000px;padding:8px 12px;background:#3b82f6;color:white;border-radius:4px;font-size:12px;';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        },
        onDragEnd() {
            this.draggingAssetId = null;
        },
        
        async addAsset() {
            const { value: name } = await Swal.fire({ 
                title: '새 이미지 추가', 
                input: 'text', 
                inputPlaceholder: '파일명', 
                showCancelButton: true, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6' 
            });
            if (name) { 
                this.dummyAssets.push({ 
                    id: `img_${Date.now()}`, 
                    name, 
                    category: this.currentCategory,
                    folderId: this.currentFolderId, 
                    resolution: '1920x1080' 
                }); 
            }
        },
        
        async createFolder() {
            const { value: name } = await Swal.fire({ 
                title: '새 폴더', 
                input: 'text', 
                inputPlaceholder: '폴더 이름', 
                showCancelButton: true, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6' 
            });
            if (name) { this.assetFolders.push({ id: `folder_${Date.now()}`, name }); }
        },
        
        getFolderAssetCount(folderId) {
            const assets = this.dummyAssets.filter(a => a.category === this.currentCategory);
            if (folderId === 'all') return assets.length;
            return assets.filter(a => a.folderId === folderId).length;
        }
    }
};

window.ImageAssetModal = ImageAssetModal;
