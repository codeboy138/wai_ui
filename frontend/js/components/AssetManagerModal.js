// Asset Manager Modal Component - 드래그앤드롭 지원

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
                <!-- 헤더 -->
                <div
                    id="asset-manager-modal-header"
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
                    <div class="flex items-center gap-1">
                        <button
                            v-for="tab in assetTabs"
                            :key="tab.type"
                            class="px-3 py-1 text-[11px] rounded transition-colors"
                            :class="currentAssetType === tab.type ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                            @click="switchAssetType(tab.type)"
                        >
                            <i :class="tab.icon" class="mr-1"></i>{{ tab.label }}
                        </button>
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
                    <div class="w-48 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">
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
                            <div v-else-if="viewMode === 'grid'" class="asset-grid view-grid">
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
                                    <div class="asset-thumbnail" :class="{ 'aspect-square': currentAssetType === 'sound' }">
                                        <template v-if="currentAssetType === 'video'">
                                            <video v-if="previewEnabled && asset.src" :src="asset.src" class="w-full h-full object-cover" muted loop @mouseenter="$event.target.play()" @mouseleave="$event.target.pause(); $event.target.currentTime = 0;"></video>
                                            <i v-else class="asset-thumbnail-icon fa-solid fa-film"></i>
                                        </template>
                                        <template v-else-if="currentAssetType === 'image'">
                                            <img v-if="previewEnabled && asset.src" :src="asset.src" class="w-full h-full object-cover" />
                                            <i v-else class="asset-thumbnail-icon fa-solid fa-image"></i>
                                        </template>
                                        <template v-else-if="currentAssetType === 'sound'">
                                            <div v-if="previewEnabled" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 relative" @click.stop="toggleAudioPreview(asset)">
                                                <div class="flex items-end gap-0.5 h-8">
                                                    <div v-for="i in 5" :key="i" class="w-1 bg-ui-accent rounded-t" :style="{ height: '30%' }"></div>
                                                </div>
                                                <i class="fa-solid fa-play absolute text-white text-xl drop-shadow-lg"></i>
                                            </div>
                                            <i v-else class="asset-thumbnail-icon fa-solid fa-music"></i>
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
                        <span v-if="selectedAssetId">1개 선택됨</span>
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
            dragging: false, dragStartMouseX: 0, dragStartMouseY: 0, dragStartPosX: 0, dragStartPosY: 0,
            
            currentAssetType: this.assetType,
            currentFolderId: 'all',
            viewMode: 'grid',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            previewEnabled: true,
            
            selectedAssetId: null,
            
            // 드래그 상태
            dragData: null,
            dragOverFolderId: null,
            isContentPanelDragOver: false,
            
            assetTabs: [
                { type: 'video', label: '영상', icon: 'fa-solid fa-film' },
                { type: 'image', label: '이미지', icon: 'fa-solid fa-image' },
                { type: 'sound', label: '사운드', icon: 'fa-solid fa-music' }
            ],
            
            assetFolders: [
                { id: 'all', name: '전체' },
                { id: 'recent', name: '최근 사용' },
                { id: 'favorites', name: '즐겨찾기' }
            ],
            
            dummyAssets: {
                video: [
                    { id: 'v1', name: 'intro_animation.mp4', duration: '00:15', resolution: '4K', folderId: 'all' },
                    { id: 'v2', name: 'background_loop.mp4', duration: '00:30', resolution: 'FHD', folderId: 'all' },
                    { id: 'v3', name: 'transition_01.mov', duration: '00:02', resolution: '4K', folderId: 'all' }
                ],
                image: [
                    { id: 'i1', name: 'logo_white.png', resolution: '1920x1080', folderId: 'all' },
                    { id: 'i2', name: 'background_01.jpg', resolution: '3840x2160', folderId: 'all' },
                    { id: 'i3', name: 'overlay_texture.png', resolution: '1920x1080', folderId: 'all' }
                ],
                sound: [
                    { id: 's1', name: 'bgm_corporate.mp3', duration: '03:24', folderId: 'all' },
                    { id: 's2', name: 'sfx_whoosh.wav', duration: '00:02', folderId: 'all' },
                    { id: 's3', name: 'voiceover_intro.mp3', duration: '00:45', folderId: 'all' }
                ]
            }
        };
    },
    computed: {
        windowStyle() { return { position: 'absolute', left: this.posX + 'px', top: this.posY + 'px' }; },
        assetTypeIcon() { return { video: 'fa-solid fa-film', image: 'fa-solid fa-image', sound: 'fa-solid fa-music' }[this.currentAssetType] || 'fa-solid fa-file'; },
        assetTypeTitle() { return { video: '영상', image: '이미지', sound: '사운드' }[this.currentAssetType] || '자산'; },
        assetTypeLabel() { return { video: '영상', image: '이미지', sound: '사운드' }[this.currentAssetType] || '자산'; },
        previewToggleLabel() { return this.currentAssetType === 'sound' ? '미리듣기' : '미리보기'; },
        currentFolderName() { const folder = this.assetFolders.find(f => f.id === this.currentFolderId); return folder ? folder.name : '전체'; },
        filteredAssets() {
            let assets = this.dummyAssets[this.currentAssetType] || [];
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
        
        switchAssetType(type) { this.currentAssetType = type; this.selectedAssetId = null; },
        toggleSort(field) { if (this.sortBy === field) this.sortAsc = !this.sortAsc; else { this.sortBy = field; this.sortAsc = true; } },
        selectAsset(asset) { this.selectedAssetId = asset.id; },
        
        useAsset(asset) {
            Swal.fire({ icon: 'success', title: '자산 사용', text: `"${asset.name}"을(를) 타임라인에 추가합니다.`, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            this.$emit('close');
        },
        useSelectedAsset() { const asset = this.filteredAssets.find(a => a.id === this.selectedAssetId); if (asset) this.useAsset(asset); },
        
        async addAsset() {
            const { value: name } = await Swal.fire({ title: '새 ' + this.assetTypeLabel + ' 추가', input: 'text', inputPlaceholder: '파일명', showCancelButton: true, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' });
            if (name) { this.dummyAssets[this.currentAssetType].push({ id: `${this.currentAssetType}_${Date.now()}`, name, folderId: this.currentFolderId, duration: '00:00' }); }
        },
        
        async createFolder() {
            const { value: name } = await Swal.fire({ title: '새 폴더', input: 'text', inputPlaceholder: '폴더 이름', showCancelButton: true, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6' });
            if (name) { this.assetFolders.push({ id: `folder_${Date.now()}`, name }); }
        },
        
        getFolderAssetCount(folderId) {
            if (folderId === 'all') return this.dummyAssets[this.currentAssetType]?.length || 0;
            return (this.dummyAssets[this.currentAssetType] || []).filter(a => a.folderId === folderId).length;
        },
        
        toggleAudioPreview(asset) { console.log('Playing audio:', asset.name); },
        
        // 드래그앤드롭
        onAssetDragStart(e, asset) {
            this.dragData = { type: 'asset', asset };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/wai-asset', JSON.stringify({ type: this.currentAssetType, id: asset.id, name: asset.name }));
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
            const assets = this.dummyAssets[this.currentAssetType];
            const idx = assets.findIndex(a => a.id === asset.id);
            if (idx !== -1) assets[idx].folderId = targetFolderId;
        }
    }
};

window.AssetManagerModal = AssetManagerModal;
