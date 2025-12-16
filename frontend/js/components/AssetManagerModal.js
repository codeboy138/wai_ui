// Asset Manager Modal Component - 드래그앤드롭 지원 + 리사이징
// 모달 오버레이 드래그 통과 가능하도록 수정

const AssetManagerModal = {
    props: {
        assetType: { type: String, required: true, default: 'video' }
    },
    emits: ['close'],
    template: `
        <div
            id="asset-manager-modal-overlay"
            class="modal-overlay"
            @click.self="$emit('close')"
            @contextmenu.prevent
        >
            <div
                id="asset-manager-modal-window"
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
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <div class="flex items-center gap-3">
                        <i :class="assetTypeIcon" class="text-ui-accent"></i>
                        <span class="text-[14px] font-bold">{{ assetTypeTitle }} 관리</span>
                        <span class="text-[11px] text-text-sub">{{ filteredAssets.length }}개 {{ assetTypeLabel }}</span>
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

                <!-- 툴바 -->
                <div class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-panel">
                    <div class="flex items-center gap-2">
                        <span class="text-[11px] text-text-sub">{{ assetTypeTitle }} 목록</span>
                        <span class="text-[10px] text-ui-accent">(드래그하여 타임라인에 추가)</span>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1 px-2 py-1 bg-bg-input rounded border border-ui-border">
                            <span class="text-[10px] text-text-sub">{{ previewToggleLabel }}</span>
                            <button
                                class="w-8 h-4 rounded-full transition-colors relative"
                                :class="previewEnabled ? 'bg-ui-accent' : 'bg-ui-border'"
                                @click="previewEnabled = !previewEnabled"
                            >
                                <span class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="previewEnabled ? 'left-4' : 'left-0.5'"></span>
                            </button>
                        </div>
                        
                        <div class="w-px h-5 bg-ui-border"></div>
                        
                        <div class="relative">
                            <input type="text" v-model="searchQuery" :placeholder="assetTypeLabel + ' 검색...'" class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" />
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
                    <div class="w-44 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">
                        <div class="p-2 border-b border-ui-border bg-bg-panel">
                            <span class="text-[10px] text-text-sub font-bold uppercase tracking-wide">폴더</span>
                        </div>
                        <div class="flex-1 overflow-auto p-1">
                            <div 
                                v-for="folder in assetFolders"
                                :key="folder.id"
                                class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-[11px] transition-colors folder-drop-zone"
                                :class="{
                                    'bg-ui-selected text-white': currentFolderId === folder.id,
                                    'hover:bg-bg-hover': currentFolderId !== folder.id,
                                    'drag-over': dragOverFolderId === folder.id
                                }"
                                @click="currentFolderId = folder.id"
                                @dragover.prevent="onFolderDragOver($event, folder)"
                                @dragleave="onFolderDragLeave($event, folder)"
                                @drop.prevent="onFolderDrop($event, folder)"
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

                    <!-- 우측: 자산 목록 -->
                    <div 
                        class="flex-1 flex flex-col bg-bg-dark overflow-hidden"
                        @dragover.prevent="onContentPanelDragOver"
                        @drop.prevent="onContentPanelDrop"
                    >
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

                        <div class="flex-1 overflow-auto p-3" :class="{ 'drag-over': isContentPanelDragOver }">
                            <div v-if="filteredAssets.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">
                                <i :class="assetTypeIcon" class="text-4xl mb-3"></i>
                                <p class="text-[12px]">{{ assetTypeLabel }}이(가) 없습니다</p>
                                <p class="text-[11px] mt-1">파일을 추가하거나 드래그하여 가져오세요</p>
                            </div>

                            <!-- 그리드 보기 -->
                            <div v-else-if="viewMode === 'grid'" class="asset-grid view-grid" :style="gridStyle">
                                <div
                                    v-for="asset in filteredAssets"
                                    :key="asset.id"
                                    class="asset-card"
                                    :class="{ 'selected': selectedAssetId === asset.id }"
                                    @click="selectAsset(asset)"
                                    @dblclick="useAsset(asset)"
                                    draggable="true"
                                    @dragstart="onAssetDragStart($event, asset)"
                                    @dragend="onDragEnd"
                                >
                                    <div class="asset-thumbnail">
                                        <template v-if="assetType === 'video'">
                                            <video 
                                                v-if="previewEnabled && asset.src" 
                                                :src="asset.src" 
                                                class="w-full h-full object-cover" 
                                                muted 
                                                loop 
                                                @mouseenter="$event.target.play()" 
                                                @mouseleave="$event.target.pause(); $event.target.currentTime = 0;"
                                            ></video>
                                            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                                                <i class="fa-solid fa-film text-2xl text-text-sub opacity-50"></i>
                                            </div>
                                        </template>
                                        <template v-else-if="assetType === 'sound'">
                                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 relative" @click.stop="toggleAudioPreview(asset)">
                                                <div class="flex items-end gap-0.5 h-8">
                                                    <div v-for="i in 5" :key="i" class="w-1 bg-ui-accent rounded-t" :style="{ height: (20 + Math.random() * 60) + '%' }"></div>
                                                </div>
                                                <i class="fa-solid fa-play absolute text-white text-xl drop-shadow-lg"></i>
                                            </div>
                                        </template>
                                    </div>
                                    <div class="asset-info">
                                        <div class="asset-name">{{ asset.name }}</div>
                                        <div class="asset-meta">{{ asset.duration || '' }}<span v-if="asset.resolution"> · {{ asset.resolution }}</span></div>
                                    </div>
                                </div>
                            </div>

                            <!-- 리스트 보기 -->
                            <div v-else class="asset-grid view-list">
                                <div
                                    v-for="asset in filteredAssets"
                                    :key="asset.id"
                                    class="asset-card"
                                    :class="{ 'selected': selectedAssetId === asset.id }"
                                    @click="selectAsset(asset)"
                                    @dblclick="useAsset(asset)"
                                    draggable="true"
                                    @dragstart="onAssetDragStart($event, asset)"
                                    @dragend="onDragEnd"
                                >
                                    <div class="asset-thumbnail">
                                        <i :class="assetTypeIcon" class="asset-thumbnail-icon"></i>
                                    </div>
                                    <div class="asset-info">
                                        <div class="flex-1">
                                            <div class="asset-name">{{ asset.name }}</div>
                                            <div class="asset-meta">{{ asset.duration || '' }}</div>
                                        </div>
                                        <div class="text-[10px] text-text-sub">{{ asset.resolution || '' }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 상태바 -->
                <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                    <div class="text-text-sub">
                        <span v-if="selectedAssetId">1개 선택됨 - 드래그하여 타임라인에 추가</span>
                        <span v-else>{{ currentFolderName }}</span>
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
            width: 900, height: 600,
            minWidth: 500, minHeight: 350,
            dragging: false, dragStartMouseX: 0, dragStartMouseY: 0, dragStartPosX: 0, dragStartPosY: 0,
            resizing: false, resizeDir: '', resizeStartX: 0, resizeStartY: 0, resizeStartW: 0, resizeStartH: 0, resizeStartPosX: 0, resizeStartPosY: 0,
            
            currentFolderId: 'all',
            viewMode: 'grid',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            previewEnabled: true,
            
            selectedAssetId: null,
            
            dragData: null,
            dragOverFolderId: null,
            isContentPanelDragOver: false,
            
            assetFolders: [
                { id: 'all', name: '전체' },
                { id: 'recent', name: '최근 사용' },
                { id: 'favorites', name: '즐겨찾기' }
            ],
            
            dummyAssets: {
                video: [
                    { id: 'v1', name: 'Big Buck Bunny', duration: '00:10', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
                    { id: 'v2', name: 'Elephant Dream', duration: '00:15', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
                    { id: 'v3', name: 'Sintel Trailer', duration: '00:52', resolution: '4K', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
                    { id: 'v4', name: 'Tears of Steel', duration: '00:12', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }
                ],
                sound: [
                    { id: 's1', name: 'bgm_corporate.mp3', duration: '03:24', folderId: 'all', src: '' },
                    { id: 's2', name: 'sfx_whoosh.wav', duration: '00:02', folderId: 'all', src: '' },
                    { id: 's3', name: 'voiceover_intro.mp3', duration: '00:45', folderId: 'all', src: '' }
                ]
            }
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
        // 그리드 스타일 - 창 크기에 따라 컬럼 수 조정
        gridStyle() {
            const contentWidth = this.width - 176 - 24; // 폴더 패널 폭 + 패딩
            const minCardWidth = 140;
            const cols = Math.max(2, Math.floor(contentWidth / minCardWidth));
            return {
                gridTemplateColumns: `repeat(${cols}, 1fr)`
            };
        },
        assetTypeIcon() { return { video: 'fa-solid fa-film', sound: 'fa-solid fa-music' }[this.assetType] || 'fa-solid fa-file'; },
        assetTypeTitle() { return { video: '영상', sound: '사운드' }[this.assetType] || '자산'; },
        assetTypeLabel() { return { video: '영상', sound: '사운드' }[this.assetType] || '자산'; },
        previewToggleLabel() { return this.assetType === 'sound' ? '미리듣기' : '미리보기'; },
        currentFolderName() { const folder = this.assetFolders.find(f => f.id === this.currentFolderId); return folder ? folder.name : '전체'; },
        filteredAssets() {
            let assets = this.dummyAssets[this.assetType] || [];
            if (this.currentFolderId !== 'all') assets = assets.filter(a => a.folderId === this.currentFolderId);
            if (this.searchQuery) { const q = this.searchQuery.toLowerCase(); assets = assets.filter(a => a.name.toLowerCase().includes(q)); }
            assets = [...assets].sort((a, b) => { let cmp = this.sortBy === 'name' ? a.name.localeCompare(b.name) : 0; return this.sortAsc ? cmp : -cmp; });
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
            this.dragStartMouseX = e.clientX;
            this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX;
            this.dragStartPosY = this.posY;
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
        
        toggleSort(field) { if (this.sortBy === field) this.sortAsc = !this.sortAsc; else { this.sortBy = field; this.sortAsc = true; } },
        selectAsset(asset) { this.selectedAssetId = asset.id; },
        
        useAsset(asset) {
            Swal.fire({ icon: 'success', title: '자산 사용', text: `"${asset.name}"을(를) 타임라인에 추가합니다.`, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            this.$emit('close');
        },
        useSelectedAsset() { const asset = this.filteredAssets.find(a => a.id === this.selectedAssetId); if (asset) this.useAsset(asset); },
        
        async addAsset() {
            const { value: name } = await Swal.fire({ title: '새 ' + this.assetTypeLabel + ' 추가', input: 'text', inputPlaceholder: '파일명', showCancelButton: true, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' });
            if (name) { 
                if (!this.dummyAssets[this.assetType]) this.dummyAssets[this.assetType] = [];
                this.dummyAssets[this.assetType].push({ id: `${this.assetType}_${Date.now()}`, name, folderId: this.currentFolderId, duration: '00:00', src: '' }); 
            }
        },
        
        async createFolder() {
            const { value: name } = await Swal.fire({ title: '새 폴더', input: 'text', inputPlaceholder: '폴더 이름', showCancelButton: true, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' });
            if (name) { this.assetFolders.push({ id: `folder_${Date.now()}`, name }); }
        },
        
        getFolderAssetCount(folderId) {
            const assets = this.dummyAssets[this.assetType] || [];
            if (folderId === 'all') return assets.length;
            return assets.filter(a => a.folderId === folderId).length;
        },
        
        toggleAudioPreview(asset) { console.log('Playing audio:', asset.name); },
        
        // 자산 드래그 시작 - 타임라인으로 드래그
        onAssetDragStart(e, asset) {
            this.dragData = { type: 'asset', asset };
            e.dataTransfer.effectAllowed = 'copy';
            
            const transferData = { 
                type: this.assetType, 
                id: asset.id, 
                name: asset.name,
                src: asset.src || '',
                duration: asset.duration || '',
                resolution: asset.resolution || ''
            };
            
            e.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            
            // 드래그 이미지
            const dragImage = document.createElement('div');
            dragImage.textContent = '🎬 ' + asset.name;
            dragImage.style.cssText = 'position:absolute;top:-1000px;padding:8px 16px;background:#3b82f6;color:#fff;border-radius:6px;font-size:12px;font-weight:bold;white-space:nowrap;';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        },
        onDragEnd() {
            this.dragData = null;
            this.dragOverFolderId = null;
            this.isContentPanelDragOver = false;
        },
        onFolderDragOver(e, folder) {
            e.preventDefault();
            if (this.dragData) this.dragOverFolderId = folder.id;
        },
        onFolderDragLeave(e, folder) {
            if (this.dragOverFolderId === folder.id) this.dragOverFolderId = null;
        },
        onFolderDrop(e, folder) {
            e.preventDefault();
            if (this.dragData && this.dragData.type === 'asset') {
                this.moveAssetToFolder(this.dragData.asset, folder.id);
            }
            this.dragOverFolderId = null;
            this.dragData = null;
        },
        onContentPanelDragOver(e) {
            e.preventDefault();
            this.isContentPanelDragOver = true;
        },
        onContentPanelDrop(e) {
            e.preventDefault();
            if (this.dragData && this.dragData.type === 'asset') {
                this.moveAssetToFolder(this.dragData.asset, this.currentFolderId);
            }
            this.isContentPanelDragOver = false;
            this.dragData = null;
        },
        moveAssetToFolder(asset, targetFolderId) {
            const assets = this.dummyAssets[this.assetType] || [];
            const idx = assets.findIndex(a => a.id === asset.id);
            if (idx !== -1) assets[idx].folderId = targetFolderId;
        }
    }
};

window.AssetManagerModal = AssetManagerModal;
