// Asset Manager Modal Component - 드래그앤드롭 + 리사이징 + 복수선택 + 파일업로드 + 최소화 + 타임라인 연동
// 업로드/추가 완료 팝업 제거 버전

var AssetManagerModal = {
    props: {
        assetType: { type: String, required: true, default: 'video' }
    },
    emits: ['close'],
    template: '\
        <div\
            id="asset-manager-modal-overlay"\
            class="modal-overlay"\
            @click.self="$emit(\'close\')"\
            @contextmenu.prevent\
        >\
            <input \
                type="file" \
                ref="fileInput" \
                :accept="fileAcceptTypes" \
                multiple \
                style="display:none;" \
                @change="onFileSelected"\
            />\
            \
            <div\
                id="asset-manager-modal-window"\
                class="asset-manager-window bg-bg-panel border border-ui-border rounded-lg shadow-2xl text-[12px] text-text-main flex flex-col"\
                :style="windowStyle"\
                @mousedown="onWindowMouseDown"\
            >\
                <div class="modal-resize-handle resize-n" @mousedown.stop="startResize($event, \'n\')"></div>\
                <div class="modal-resize-handle resize-s" @mousedown.stop="startResize($event, \'s\')"></div>\
                <div class="modal-resize-handle resize-e" @mousedown.stop="startResize($event, \'e\')"></div>\
                <div class="modal-resize-handle resize-w" @mousedown.stop="startResize($event, \'w\')"></div>\
                <div class="modal-resize-handle resize-nw" @mousedown.stop="startResize($event, \'nw\')"></div>\
                <div class="modal-resize-handle resize-ne" @mousedown.stop="startResize($event, \'ne\')"></div>\
                <div class="modal-resize-handle resize-sw" @mousedown.stop="startResize($event, \'sw\')"></div>\
                <div class="modal-resize-handle resize-se" @mousedown.stop="startResize($event, \'se\')"></div>\
\
                <div\
                    class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-hover rounded-t-lg"\
                    :class="isMinimized ? \'cursor-pointer\' : \'cursor-move\'"\
                    @mousedown.stop="onHeaderMouseDown"\
                    @dblclick="toggleMinimize"\
                >\
                    <div class="flex items-center gap-3">\
                        <i :class="assetTypeIcon" class="text-ui-accent"></i>\
                        <span class="text-[14px] font-bold">{{ assetTypeTitle }} 관리</span>\
                        <span v-if="!isMinimized" class="text-[11px] text-text-sub">{{ filteredAssets.length }}개 {{ assetTypeLabel }}</span>\
                    </div>\
                    <div class="flex items-center gap-1">\
                        <button v-if="!isMinimized" class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1" @click.stop="addAsset">\
                            <i class="fa-solid fa-plus"></i> 추가\
                        </button>\
                        <button class="text-[14px] text-text-sub hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-bg-input transition-colors" @click.stop="toggleMinimize" :title="isMinimized ? \'확장\' : \'최소화\'">\
                            <i :class="isMinimized ? \'fa-solid fa-expand\' : \'fa-solid fa-minus\'"></i>\
                        </button>\
                        <button class="text-[14px] text-text-sub hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit(\'close\')">\
                            <i class="fa-solid fa-xmark"></i>\
                        </button>\
                    </div>\
                </div>\
\
                <template v-if="!isMinimized">\
                    <div class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-panel">\
                        <div class="flex items-center gap-2">\
                            <span class="text-[11px] text-text-sub">{{ assetTypeTitle }} 목록</span>\
                            <span class="text-[10px] text-ui-accent">(Ctrl+클릭: 복수선택 / Shift+클릭: 범위선택)</span>\
                        </div>\
                        \
                        <div class="flex items-center gap-2">\
                            <div class="flex items-center gap-1 px-2 py-1 bg-bg-input rounded border border-ui-border">\
                                <span class="text-[10px] text-text-sub">{{ previewToggleLabel }}</span>\
                                <button\
                                    class="w-8 h-4 rounded-full transition-colors relative"\
                                    :class="previewEnabled ? \'bg-ui-accent\' : \'bg-ui-border\'"\
                                    @click.stop="previewEnabled = !previewEnabled"\
                                >\
                                    <span class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="previewEnabled ? \'left-4\' : \'left-0.5\'"></span>\
                                </button>\
                            </div>\
                            \
                            <div class="w-px h-5 bg-ui-border"></div>\
                            \
                            <div class="relative">\
                                <input type="text" v-model="searchQuery" :placeholder="assetTypeLabel + \' 검색...\'" class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" @mousedown.stop />\
                                <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>\
                            </div>\
                            \
                            <div class="flex border border-ui-border rounded overflow-hidden">\
                                <button class="px-2 py-1 text-[10px]" :class="viewMode === \'grid\' ? \'bg-ui-accent text-white\' : \'bg-bg-input text-text-sub hover:bg-bg-hover\'" @click.stop="viewMode = \'grid\'">\
                                    <i class="fa-solid fa-grip"></i>\
                                </button>\
                                <button class="px-2 py-1 text-[10px]" :class="viewMode === \'list\' ? \'bg-ui-accent text-white\' : \'bg-bg-input text-text-sub hover:bg-bg-hover\'" @click.stop="viewMode = \'list\'">\
                                    <i class="fa-solid fa-list"></i>\
                                </button>\
                            </div>\
                        </div>\
                    </div>\
\
                    <div class="flex-1 flex overflow-hidden">\
                        <div class="w-44 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">\
                            <div class="p-2 border-b border-ui-border bg-bg-panel">\
                                <span class="text-[10px] text-text-sub font-bold uppercase tracking-wide">폴더</span>\
                            </div>\
                            <div class="flex-1 overflow-auto p-1">\
                                <div \
                                    v-for="folder in assetFolders"\
                                    :key="folder.id"\
                                    class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-[11px] transition-colors folder-drop-zone"\
                                    :class="{\
                                        \'bg-ui-selected text-white\': currentFolderId === folder.id,\
                                        \'hover:bg-bg-hover\': currentFolderId !== folder.id,\
                                        \'drag-over\': dragOverFolderId === folder.id\
                                    }"\
                                    @click.stop="currentFolderId = folder.id"\
                                    @dragover.prevent="onFolderDragOver($event, folder)"\
                                    @dragleave="onFolderDragLeave($event, folder)"\
                                    @drop.prevent="onFolderDrop($event, folder)"\
                                >\
                                    <i class="fa-solid fa-folder text-yellow-500"></i>\
                                    <span class="truncate flex-1">{{ folder.name }}</span>\
                                    <span class="text-[9px] text-text-sub">{{ getFolderAssetCount(folder.id) }}</span>\
                                </div>\
                            </div>\
                            \
                            <div class="p-2 border-t border-ui-border">\
                                <button class="w-full px-2 py-1 text-[10px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover flex items-center justify-center gap-1" @click.stop="createFolder">\
                                    <i class="fa-solid fa-folder-plus"></i> 새 폴더\
                                </button>\
                            </div>\
                        </div>\
\
                        <div \
                            class="flex-1 flex flex-col bg-bg-dark overflow-hidden"\
                            @dragover.prevent="onContentPanelDragOver"\
                            @drop.prevent="onContentPanelDrop"\
                            @click="onContentAreaClick"\
                        >\
                            <div class="flex items-center justify-between px-3 py-1.5 border-b border-ui-border bg-bg-panel text-[10px]">\
                                <div class="flex items-center gap-4">\
                                    <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ \'text-ui-accent\': sortBy === \'name\' }" @click.stop="toggleSort(\'name\')">\
                                        이름 <i v-if="sortBy === \'name\'" :class="sortAsc ? \'fa-solid fa-arrow-up\' : \'fa-solid fa-arrow-down\'" class="text-[8px]"></i>\
                                    </span>\
                                    <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ \'text-ui-accent\': sortBy === \'date\' }" @click.stop="toggleSort(\'date\')">\
                                        추가일 <i v-if="sortBy === \'date\'" :class="sortAsc ? \'fa-solid fa-arrow-up\' : \'fa-solid fa-arrow-down\'" class="text-[8px]"></i>\
                                    </span>\
                                    <button v-if="selectedAssetIds.length > 0" class="text-red-400 hover:text-red-300 ml-2" @click.stop="clearSelection" title="선택 해제">\
                                        <i class="fa-solid fa-xmark"></i> 선택해제\
                                    </button>\
                                </div>\
                                <span class="text-text-sub">{{ selectedAssetIds.length > 0 ? selectedAssetIds.length + \'개 선택됨\' : filteredAssets.length + \'개 항목\' }}</span>\
                            </div>\
\
                            <div class="flex-1 overflow-auto p-3" :class="{ \'drag-over\': isContentPanelDragOver }" @click="onGridAreaClick">\
                                <div v-if="filteredAssets.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">\
                                    <i :class="assetTypeIcon" class="text-4xl mb-3"></i>\
                                    <p class="text-[12px]">{{ assetTypeLabel }}이(가) 없습니다</p>\
                                    <p class="text-[11px] mt-1">파일을 추가하거나 드래그하여 가져오세요</p>\
                                </div>\
\
                                <div v-else-if="viewMode === \'grid\'" class="asset-grid view-grid" :style="gridStyle">\
                                    <div\
                                        v-for="(asset, index) in filteredAssets"\
                                        :key="asset.id"\
                                        class="asset-card relative"\
                                        :class="{ \'selected\': isAssetSelected(asset.id) }"\
                                        @click.stop="handleAssetClick($event, asset, index)"\
                                        @dblclick.stop="useAsset(asset)"\
                                        draggable="true"\
                                        @dragstart="onAssetDragStart($event, asset)"\
                                        @dragend="onDragEnd"\
                                    >\
                                        <div class="asset-thumbnail">\
                                            <template v-if="assetType === \'video\'">\
                                                <video \
                                                    v-if="previewEnabled && asset.src" \
                                                    :src="asset.src" \
                                                    class="w-full h-full object-cover" \
                                                    muted \
                                                    loop \
                                                    @mouseenter="$event.target.play()" \
                                                    @mouseleave="$event.target.pause(); $event.target.currentTime = 0;"\
                                                ></video>\
                                                <div v-else class="asset-thumbnail-placeholder">\
                                                    <i class="fa-solid fa-film asset-thumbnail-icon-center"></i>\
                                                </div>\
                                            </template>\
                                            <template v-else-if="assetType === \'sound\'">\
                                                <div class="asset-thumbnail-placeholder sound" @click.stop="toggleAudioPreview(asset)">\
                                                    <div class="flex items-end gap-0.5 h-8">\
                                                        <div v-for="i in 5" :key="i" class="w-1 bg-ui-accent rounded-t" :style="{ height: (20 + Math.random() * 60) + \'%\' }"></div>\
                                                    </div>\
                                                    <i class="fa-solid fa-play asset-thumbnail-icon-center"></i>\
                                                </div>\
                                            </template>\
                                        </div>\
                                        <div class="asset-info">\
                                            <div class="asset-name">{{ asset.name }}</div>\
                                            <div class="asset-meta">{{ asset.duration || \'\' }}<span v-if="asset.resolution"> - {{ asset.resolution }}</span></div>\
                                        </div>\
                                        <button \
                                            class="asset-quick-add-btn"\
                                            @click.stop="addToTimeline(asset)"\
                                            title="타임라인에 추가"\
                                        >\
                                            <i class="fa-solid fa-plus"></i>\
                                        </button>\
                                    </div>\
                                </div>\
\
                                <div v-else class="asset-grid view-list">\
                                    <div\
                                        v-for="(asset, index) in filteredAssets"\
                                        :key="asset.id"\
                                        class="asset-card relative"\
                                        :class="{ \'selected\': isAssetSelected(asset.id) }"\
                                        @click.stop="handleAssetClick($event, asset, index)"\
                                        @dblclick.stop="useAsset(asset)"\
                                        draggable="true"\
                                        @dragstart="onAssetDragStart($event, asset)"\
                                        @dragend="onDragEnd"\
                                    >\
                                        <div class="asset-thumbnail">\
                                            <i :class="assetTypeIcon" class="asset-thumbnail-icon-center"></i>\
                                        </div>\
                                        <div class="asset-info">\
                                            <div class="flex-1">\
                                                <div class="asset-name">{{ asset.name }}</div>\
                                                <div class="asset-meta">{{ asset.duration || \'\' }}</div>\
                                            </div>\
                                            <div class="text-[10px] text-text-sub">{{ asset.resolution || \'\' }}</div>\
                                        </div>\
                                        <button \
                                            class="asset-quick-add-btn"\
                                            @click.stop="addToTimeline(asset)"\
                                            title="타임라인에 추가"\
                                        >\
                                            <i class="fa-solid fa-plus"></i>\
                                        </button>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
\
                    <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">\
                        <div class="text-text-sub">\
                            <span v-if="selectedAssetIds.length > 0">{{ selectedAssetIds.length }}개 선택됨 - 드래그하여 타임라인에 추가</span>\
                            <span v-else>{{ currentFolderName }}</span>\
                        </div>\
                        <div class="flex items-center gap-2">\
                            <button v-if="selectedAssetIds.length > 0" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click.stop="useSelectedAssets">타임라인에 추가</button>\
                            <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors" @click.stop="$emit(\'close\')">닫기</button>\
                        </div>\
                    </div>\
                </template>\
            </div>\
        </div>\
    ',
    data: function() {
        return {
            posX: 0,
            posY: 0,
            width: 900,
            height: 600,
            minWidth: 400,
            minHeight: 300,
            minimizedWidth: 280,
            minimizedHeight: 45,
            prevWidth: 900,
            prevHeight: 600,
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
            currentFolderId: 'all',
            viewMode: 'grid',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            previewEnabled: true,
            selectedAssetIds: [],
            lastSelectedIndex: -1,
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
                    { id: 'v1', name: 'Big Buck Bunny', duration: '00:10', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', dateAdded: Date.now() - 100000 },
                    { id: 'v2', name: 'Elephant Dream', duration: '00:15', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', dateAdded: Date.now() - 200000 },
                    { id: 'v3', name: 'Sintel Trailer', duration: '00:52', resolution: '4K', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', dateAdded: Date.now() - 300000 },
                    { id: 'v4', name: 'Tears of Steel', duration: '00:12', resolution: 'FHD', folderId: 'all', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', dateAdded: Date.now() - 400000 }
                ],
                sound: [
                    { id: 's1', name: 'bgm_corporate.mp3', duration: '03:24', folderId: 'all', src: '', dateAdded: Date.now() - 100000 },
                    { id: 's2', name: 'sfx_whoosh.wav', duration: '00:02', folderId: 'all', src: '', dateAdded: Date.now() - 200000 },
                    { id: 's3', name: 'voiceover_intro.mp3', duration: '00:45', folderId: 'all', src: '', dateAdded: Date.now() - 300000 }
                ]
            }
        };
    },
    computed: {
        windowStyle: function() {
            return {
                position: 'absolute',
                left: this.posX + 'px',
                top: this.posY + 'px',
                width: (this.isMinimized ? this.minimizedWidth : this.width) + 'px',
                height: (this.isMinimized ? this.minimizedHeight : this.height) + 'px'
            };
        },
        gridStyle: function() {
            var sidebarWidth = 176;
            var padding = 24;
            var contentWidth = this.width - sidebarWidth - padding;
            var minCardWidth = 80;
            var maxCardWidth = 160;
            var gap = 12;
            var cols = Math.max(1, Math.floor((contentWidth + gap) / (minCardWidth + gap)));
            cols = Math.min(cols, 8);
            var cardWidth = Math.floor((contentWidth - (cols - 1) * gap) / cols);
            cardWidth = Math.max(minCardWidth, Math.min(maxCardWidth, cardWidth));
            return {
                display: 'grid',
                gridTemplateColumns: 'repeat(' + cols + ', 1fr)',
                gap: gap + 'px'
            };
        },
        assetTypeIcon: function() {
            var icons = { video: 'fa-solid fa-film', sound: 'fa-solid fa-music' };
            return icons[this.assetType] || 'fa-solid fa-file';
        },
        assetTypeTitle: function() {
            var titles = { video: '영상', sound: '사운드' };
            return titles[this.assetType] || '자산';
        },
        assetTypeLabel: function() {
            var labels = { video: '영상', sound: '사운드' };
            return labels[this.assetType] || '자산';
        },
        previewToggleLabel: function() {
            return this.assetType === 'sound' ? '미리듣기' : '미리보기';
        },
        currentFolderName: function() {
            var self = this;
            var folder = this.assetFolders.find(function(f) { return f.id === self.currentFolderId; });
            return folder ? folder.name : '전체';
        },
        fileAcceptTypes: function() {
            if (this.assetType === 'video') return 'video/*';
            if (this.assetType === 'sound') return 'audio/*';
            return '*/*';
        },
        filteredAssets: function() {
            var self = this;
            var assets = this.dummyAssets[this.assetType] || [];
            if (this.currentFolderId !== 'all') {
                assets = assets.filter(function(a) { return a.folderId === self.currentFolderId; });
            }
            if (this.searchQuery) {
                var q = this.searchQuery.toLowerCase();
                assets = assets.filter(function(a) { return a.name.toLowerCase().indexOf(q) >= 0; });
            }
            assets = assets.slice().sort(function(a, b) {
                var cmp;
                if (self.sortBy === 'name') {
                    cmp = a.name.localeCompare(b.name);
                } else if (self.sortBy === 'date') {
                    cmp = (b.dateAdded || 0) - (a.dateAdded || 0);
                } else {
                    cmp = 0;
                }
                return self.sortAsc ? cmp : -cmp;
            });
            return assets;
        }
    },
    mounted: function() {
        this.centerWindow();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
        document.addEventListener('keydown', this.onKeyDown);
    },
    beforeUnmount: function() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
    },
    methods: {
        centerWindow: function() {
            var vw = window.innerWidth || 1280;
            var vh = window.innerHeight || 720;
            this.posX = Math.max(20, (vw - this.width) / 2);
            this.posY = Math.max(20, (vh - this.height) / 2);
        },
        clampPosition: function() {
            var vw = window.innerWidth || 1280;
            var vh = window.innerHeight || 720;
            var w = this.isMinimized ? this.minimizedWidth : this.width;
            var h = this.isMinimized ? this.minimizedHeight : this.height;
            var minVisible = 100;
            if (this.posX < -w + minVisible) this.posX = -w + minVisible;
            if (this.posX > vw - minVisible) this.posX = vw - minVisible;
            if (this.posY < 0) this.posY = 0;
            if (this.posY > vh - minVisible) this.posY = vh - minVisible;
        },
        toggleMinimize: function() {
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
        onWindowMouseDown: function(e) {
            if (e.target.closest('input, button, select, .asset-card, .folder-drop-zone, .modal-resize-handle')) return;
            this.startDrag(e);
        },
        onHeaderMouseDown: function(e) {
            if (e.target.closest('button')) return;
            this.startDrag(e);
        },
        startDrag: function(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX;
            this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX;
            this.dragStartPosY = this.posY;
        },
        startResize: function(e, dir) {
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
        onGlobalMouseMove: function(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
                this.clampPosition();
            }
            if (this.resizing) {
                var dx = e.clientX - this.resizeStartX;
                var dy = e.clientY - this.resizeStartY;
                var dir = this.resizeDir;
                var newW = this.resizeStartW;
                var newH = this.resizeStartH;
                var newX = this.resizeStartPosX;
                var newY = this.resizeStartPosY;
                if (dir.indexOf('e') >= 0) newW = Math.max(this.minWidth, this.resizeStartW + dx);
                if (dir.indexOf('w') >= 0) {
                    newW = Math.max(this.minWidth, this.resizeStartW - dx);
                    newX = this.resizeStartPosX + (this.resizeStartW - newW);
                }
                if (dir.indexOf('s') >= 0) newH = Math.max(this.minHeight, this.resizeStartH + dy);
                if (dir.indexOf('n') >= 0) {
                    newH = Math.max(this.minHeight, this.resizeStartH - dy);
                    newY = this.resizeStartPosY + (this.resizeStartH - newH);
                }
                this.width = newW;
                this.height = newH;
                this.posX = newX;
                this.posY = newY;
            }
        },
        onGlobalMouseUp: function() {
            this.dragging = false;
            this.resizing = false;
        },
        onKeyDown: function(e) {
            if (e.key === 'Escape') {
                this.clearSelection();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            }
        },
        toggleSort: function(field) {
            if (this.sortBy === field) {
                this.sortAsc = !this.sortAsc;
            } else {
                this.sortBy = field;
                this.sortAsc = true;
            }
        },
        isAssetSelected: function(assetId) {
            return this.selectedAssetIds.indexOf(assetId) >= 0;
        },
        clearSelection: function() {
            this.selectedAssetIds = [];
            this.lastSelectedIndex = -1;
        },
        selectAll: function() {
            var self = this;
            this.selectedAssetIds = this.filteredAssets.map(function(a) { return a.id; });
            this.lastSelectedIndex = this.filteredAssets.length - 1;
        },
        onContentAreaClick: function(e) {
            if (e.target.closest('.asset-card')) return;
            this.clearSelection();
        },
        onGridAreaClick: function(e) {
            if (e.target.closest('.asset-card')) return;
            this.clearSelection();
        },
        handleAssetClick: function(e, asset, index) {
            var self = this;
            
            if (e.ctrlKey || e.metaKey) {
                var idx = this.selectedAssetIds.indexOf(asset.id);
                if (idx >= 0) {
                    this.selectedAssetIds.splice(idx, 1);
                } else {
                    this.selectedAssetIds.push(asset.id);
                }
                this.lastSelectedIndex = index;
            } else if (e.shiftKey && this.lastSelectedIndex >= 0) {
                var start = Math.min(this.lastSelectedIndex, index);
                var end = Math.max(this.lastSelectedIndex, index);
                var newSelection = [];
                for (var i = start; i <= end; i++) {
                    if (this.filteredAssets[i]) {
                        newSelection.push(this.filteredAssets[i].id);
                    }
                }
                var combined = this.selectedAssetIds.slice();
                newSelection.forEach(function(id) {
                    if (combined.indexOf(id) < 0) {
                        combined.push(id);
                    }
                });
                this.selectedAssetIds = combined;
            } else {
                this.selectedAssetIds = [asset.id];
                this.lastSelectedIndex = index;
            }
        },
        useAsset: function(asset) {
            this.addToTimeline(asset);
        },
        useSelectedAssets: function() {
            var self = this;
            var assets = this.filteredAssets.filter(function(a) {
                return self.selectedAssetIds.indexOf(a.id) >= 0;
            });
            if (assets.length > 0) {
                this.addMultipleToTimeline(assets);
            }
        },
        addToTimeline: function(asset) {
            var self = this;
            var transferData = [{
                type: this.assetType,
                id: asset.id,
                name: asset.name,
                src: asset.src || '',
                duration: asset.duration || '00:10',
                resolution: asset.resolution || ''
            }];
            this.dispatchToTimeline(transferData);
        },
        addMultipleToTimeline: function(assets) {
            var self = this;
            var transferData = assets.map(function(a) {
                return {
                    type: self.assetType,
                    id: a.id,
                    name: a.name,
                    src: a.src || '',
                    duration: a.duration || '00:10',
                    resolution: a.resolution || ''
                };
            });
            this.dispatchToTimeline(transferData);
        },
        dispatchToTimeline: function(assetDataArray) {
            var event = new CustomEvent('wai-asset-add-to-timeline', {
                detail: assetDataArray,
                bubbles: true
            });
            document.dispatchEvent(event);
        },
        addAsset: function() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },
        onFileSelected: function(e) {
            this.handleFileUpload(e.target.files);
            e.target.value = '';
        },
        handleFileUpload: function(files) {
            var self = this;
            if (!files || files.length === 0) return;
            
            var now = new Date();
            var folderName = '업로드_' + now.getFullYear() + 
                String(now.getMonth() + 1).padStart(2, '0') + 
                String(now.getDate()).padStart(2, '0') + '_' + 
                String(now.getHours()).padStart(2, '0') + 
                String
