// Image Asset Modal Component - 이미지 관리 + 리사이징 + 드래그 + 최소화 + 다중선택

var ImageAssetModal = {
    emits: ['close'],
    template: '\
        <div\
            id="image-asset-modal-overlay"\
            class="modal-overlay"\
            @click.self="$emit(\'close\')"\
            @contextmenu.prevent\
        >\
            <input \
                type="file" \
                ref="fileInput" \
                accept="image/*" \
                multiple \
                style="display:none;" \
                @change="onFileSelected"\
            />\
            \
            <div\
                id="image-asset-modal-window"\
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
                    id="image-asset-modal-header"\
                    class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-hover rounded-t-lg"\
                    :class="isMinimized ? \'cursor-pointer\' : \'cursor-move\'"\
                    @mousedown.stop="onHeaderMouseDown"\
                    @dblclick="toggleMinimize"\
                >\
                    <div class="flex items-center gap-3">\
                        <i class="fa-solid fa-image text-ui-accent"></i>\
                        <span class="text-[14px] font-bold">이미지 관리</span>\
                        <span v-if="!isMinimized" class="text-[11px] text-text-sub">{{ filteredAssets.length }}개 이미지</span>\
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
                    <div class="flex items-center px-4 py-2 border-b border-ui-border bg-bg-panel gap-1">\
                        <button\
                            v-for="tab in categoryTabs"\
                            :key="tab.id"\
                            class="px-4 py-1.5 text-[11px] rounded transition-colors"\
                            :class="currentCategory === tab.id ? \'bg-ui-accent text-white\' : \'bg-bg-input text-text-sub hover:bg-bg-hover\'"\
                            @click.stop="currentCategory = tab.id"\
                        >\
                            <i :class="tab.icon" class="mr-1"></i>{{ tab.label }}\
                        </button>\
                        \
                        <div class="flex-1"></div>\
                        \
                        <div class="flex items-center gap-2">\
                            <div class="relative">\
                                <input type="text" v-model="searchQuery" placeholder="이미지 검색..." class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" @mousedown.stop />\
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
                        <div class="w-48 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">\
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
                        >\
                            <div class="flex items-center justify-between px-3 py-1.5 border-b border-ui-border bg-bg-panel text-[10px]">\
                                <div class="flex items-center gap-4">\
                                    <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ \'text-ui-accent\': sortBy === \'name\' }" @click.stop="toggleSort(\'name\')">\
                                        이름 <i v-if="sortBy === \'name\'" :class="sortAsc ? \'fa-solid fa-arrow-up\' : \'fa-solid fa-arrow-down\'" class="text-[8px]"></i>\
                                    </span>\
                                    <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ \'text-ui-accent\': sortBy === \'date\' }" @click.stop="toggleSort(\'date\')">\
                                        추가일 <i v-if="sortBy === \'date\'" :class="sortAsc ? \'fa-solid fa-arrow-up\' : \'fa-solid fa-arrow-down\'" class="text-[8px]"></i>\
                                    </span>\
                                </div>\
                                <span class="text-text-sub">{{ selectedAssetIds.length > 0 ? selectedAssetIds.length + \'개 선택됨\' : filteredAssets.length + \'개 항목\' }}</span>\
                            </div>\
\
                            <div class="flex-1 overflow-auto p-3" :class="{ \'drag-over\': isContentPanelDragOver }">\
                                <div v-if="filteredAssets.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">\
                                    <i class="fa-solid fa-image text-4xl mb-3"></i>\
                                    <p class="text-[12px]">{{ currentCategoryLabel }} 이미지가 없습니다</p>\
                                    <p class="text-[11px] mt-1">파일을 추가하거나 드래그하여 가져오세요</p>\
                                </div>\
\
                                <div v-else-if="viewMode === \'grid\'" class="asset-grid view-grid">\
                                    <div\
                                        v-for="asset in filteredAssets"\
                                        :key="asset.id"\
                                        class="asset-card"\
                                        :class="{ \'selected\': isAssetSelected(asset.id) }"\
                                        @click.stop="selectAsset($event, asset)"\
                                        @dblclick.stop="useAsset(asset)"\
                                        draggable="true"\
                                        @dragstart="onAssetDragStart($event, asset)"\
                                        @dragend="onDragEnd"\
                                    >\
                                        <div class="asset-thumbnail">\
                                            <img v-if="asset.src" :src="asset.src" class="w-full h-full object-cover" draggable="false" />\
                                            <i v-else class="asset-thumbnail-icon fa-solid fa-image"></i>\
                                        </div>\
                                        <div class="asset-info">\
                                            <div class="asset-name">{{ asset.name }}</div>\
                                            <div class="asset-meta">{{ asset.resolution || \'\' }}</div>\
                                        </div>\
                                    </div>\
                                </div>\
\
                                <div v-else class="asset-grid view-list">\
                                    <div\
                                        v-for="asset in filteredAssets"\
                                        :key="asset.id"\
                                        class="asset-card"\
                                        :class="{ \'selected\': isAssetSelected(asset.id) }"\
                                        @click.stop="selectAsset($event, asset)"\
                                        @dblclick.stop="useAsset(asset)"\
                                        draggable="true"\
                                        @dragstart="onAssetDragStart($event, asset)"\
                                        @dragend="onDragEnd"\
                                    >\
                                        <div class="asset-thumbnail">\
                                            <i class="asset-thumbnail-icon fa-solid fa-image"></i>\
                                        </div>\
                                        <div class="asset-info">\
                                            <div class="flex-1">\
                                                <div class="asset-name">{{ asset.name }}</div>\
                                                <div class="asset-meta">{{ asset.resolution || \'\' }}</div>\
                                            </div>\
                                            <div class="text-[10px] text-text-sub">{{ asset.category }}</div>\
                                        </div>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
\
                    <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">\
                        <div class="text-text-sub">\
                            <span v-if="selectedAssetIds.length > 0">{{ selectedAssetIds.length }}개 선택됨</span>\
                            <span v-else>{{ currentCategoryLabel }} - {{ currentFolderName }}</span>\
                        </div>\
                        <div class="flex items-center gap-2">\
                            <button v-if="selectedAssetIds.length > 0" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click.stop="useSelectedAssets">사용</button>\
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
            currentCategory: 'background',
            currentFolderId: 'all',
            viewMode: 'grid',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            selectedAssetIds: [],
            dragData: null,
            dragOverFolderId: null,
            isContentPanelDragOver: false,
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
                { id: 'bg1', name: 'city_skyline.jpg', resolution: '3840x2160', category: 'background', folderId: 'all', src: '' },
                { id: 'bg2', name: 'nature_forest.jpg', resolution: '1920x1080', category: 'background', folderId: 'all', src: '' },
                { id: 'bg3', name: 'studio_backdrop.png', resolution: '4096x2160', category: 'background', folderId: 'all', src: '' },
                { id: 'p1', name: 'presenter_male.png', resolution: '1080x1920', category: 'person', folderId: 'all', src: '' },
                { id: 'p2', name: 'presenter_female.png', resolution: '1080x1920', category: 'person', folderId: 'all', src: '' },
                { id: 'o1', name: 'logo_icon.png', resolution: '512x512', category: 'object', folderId: 'all', src: '' },
                { id: 'o2', name: 'lower_third.png', resolution: '1920x200', category: 'object', folderId: 'all', src: '' }
            ]
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
        currentCategoryLabel: function() {
            var self = this;
            var tab = this.categoryTabs.find(function(t) { return t.id === self.currentCategory; });
            return tab ? tab.label : '전체';
        },
        currentFolderName: function() {
            var self = this;
            var folder = this.assetFolders.find(function(f) { return f.id === self.currentFolderId; });
            return folder ? folder.name : '전체';
        },
        filteredAssets: function() {
            var self = this;
            var assets = this.dummyAssets.filter(function(a) { return a.category === self.currentCategory; });
            if (this.currentFolderId !== 'all') {
                assets = assets.filter(function(a) { return a.folderId === self.currentFolderId; });
            }
            if (this.searchQuery) {
                var q = this.searchQuery.toLowerCase();
                assets = assets.filter(function(a) { return a.name.toLowerCase().indexOf(q) >= 0; });
            }
            assets = assets.slice().sort(function(a, b) {
                var cmp = self.sortBy === 'name' ? a.name.localeCompare(b.name) : 0;
                return self.sortAsc ? cmp : -cmp;
            });
            return assets;
        }
    },
    mounted: function() {
        this.centerWindow();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
    },
    beforeUnmount: function() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
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
        selectAsset: function(e, asset) {
            if (e.ctrlKey || e.metaKey) {
                var idx = this.selectedAssetIds.indexOf(asset.id);
                if (idx > -1) {
                    this.selectedAssetIds.splice(idx, 1);
                } else {
                    this.selectedAssetIds.push(asset.id);
                }
            } else if (e.shiftKey && this.selectedAssetIds.length > 0) {
                var lastId = this.selectedAssetIds[this.selectedAssetIds.length - 1];
                var assets = this.filteredAssets;
                var lastIdx = -1, curIdx = -1;
                for (var i = 0; i < assets.length; i++) {
                    if (assets[i].id === lastId) lastIdx = i;
                    if (assets[i].id === asset.id) curIdx = i;
                }
                if (lastIdx >= 0 && curIdx >= 0) {
                    var minIdx = Math.min(lastIdx, curIdx);
                    var maxIdx = Math.max(lastIdx, curIdx);
                    this.selectedAssetIds = [];
                    for (var j = minIdx; j <= maxIdx; j++) {
                        this.selectedAssetIds.push(assets[j].id);
                    }
                }
            } else {
                this.selectedAssetIds = [asset.id];
            }
        },
        useAsset: function(asset) {
            Swal.fire({
                icon: 'success',
                title: '이미지 사용',
                text: '"' + asset.name + '"을(를) 캔버스에 추가합니다.',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1500,
                showConfirmButton: false
            });
        },
        useSelectedAssets: function() {
            var self = this;
            var assets = this.filteredAssets.filter(function(a) {
                return self.selectedAssetIds.indexOf(a.id) >= 0;
            });
            if (assets.length > 0) {
                var names = assets.map(function(a) { return a.name; }).join(', ');
                Swal.fire({
                    icon: 'success',
                    title: '이미지 사용',
                    text: assets.length + '개 이미지를 캔버스에 추가합니다.',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
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
            var fileNames = [];
            for (var i = 0; i < files.length; i++) {
                fileNames.push(files[i].name);
            }
            Swal.fire({
                icon: 'success',
                title: '파일 업로드',
                text: files.length + '개 파일 추가됨',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 2000,
                showConfirmButton: false
            });
            for (var j = 0; j < files.length; j++) {
                var file = files[j];
                var newAsset = {
                    id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    category: this.currentCategory,
                    folderId: 'all',
                    resolution: '',
                    src: URL.createObjectURL(file)
                };
                this.dummyAssets.push(newAsset);
            }
        },
        createFolder: function() {
            var self = this;
            Swal.fire({
                title: '새 폴더',
                input: 'text',
                inputPlaceholder: '폴더 이름',
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            }).then(function(result) {
                if (result.value) {
                    self.assetFolders.push({ id: 'folder_' + Date.now(), name: result.value });
                }
            });
        },
        getFolderAssetCount: function(folderId) {
            var self = this;
            var assets = this.dummyAssets.filter(function(a) { return a.category === self.currentCategory; });
            if (folderId === 'all') return assets.length;
            return assets.filter(function(a) { return a.folderId === folderId; }).length;
        },
        onAssetDragStart: function(e, asset) {
            var self = this;
            if (this.selectedAssetIds.indexOf(asset.id) < 0) {
                this.selectedAssetIds = [asset.id];
            }
            var selectedAssets = this.filteredAssets.filter(function(a) {
                return self.selectedAssetIds.indexOf(a.id) >= 0;
            });
            this.dragData = { type: 'asset', assets: selectedAssets };
            e.dataTransfer.effectAllowed = 'copyMove';
            var transferData = selectedAssets.map(function(a) {
                return {
                    type: 'image',
                    id: a.id,
                    name: a.name,
                    src: a.src || '',
                    resolution: a.resolution || '',
                    category: a.category
                };
            });
            e.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            var dragImage = document.createElement('div');
            if (selectedAssets.length > 1) {
                dragImage.textContent = '🖼️ ' + selectedAssets.length + '개 이미지';
            } else {
                dragImage.textContent = '🖼️ ' + asset.name;
            }
            dragImage.style.cssText = 'position:absolute;top:-1000px;padding:8px 16px;background:#3b82f6;color:#fff;border-radius:6px;font-size:12px;font-weight:bold;white-space:nowrap;';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(function() {
                document.body.removeChild(dragImage);
            }, 0);
        },
        onDragEnd: function() {
            this.dragData = null;
            this.dragOverFolderId = null;
            this.isContentPanelDragOver = false;
        },
        onFolderDragOver: function(e, folder) {
            e.preventDefault();
            if (this.dragData) {
                this.dragOverFolderId = folder.id;
            }
        },
        onFolderDragLeave: function(e, folder) {
            if (this.dragOverFolderId === folder.id) {
                this.dragOverFolderId = null;
            }
        },
        onFolderDrop: function(e, folder) {
            var self = this;
            e.preventDefault();
            if (this.dragData && this.dragData.type === 'asset' && this.dragData.assets) {
                this.dragData.assets.forEach(function(asset) {
                    self.moveAssetToFolder(asset, folder.id);
                });
            }
            this.dragOverFolderId = null;
            this.dragData = null;
        },
        onContentPanelDragOver: function(e) {
            e.preventDefault();
            this.isContentPanelDragOver = true;
        },
        onContentPanelDrop: function(e) {
            var self = this;
            e.preventDefault();
            if (this.dragData && this.dragData.type === 'asset' && this.dragData.assets) {
                this.dragData.assets.forEach(function(asset) {
                    self.moveAssetToFolder(asset, self.currentFolderId);
                });
            }
            this.isContentPanelDragOver = false;
            this.dragData = null;
        },
        moveAssetToFolder: function(asset, targetFolderId) {
            var idx = -1;
            for (var i = 0; i < this.dummyAssets.length; i++) {
                if (this.dummyAssets[i].id === asset.id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) {
                this.dummyAssets[idx].folderId = targetFolderId;
            }
        }
    }
};

window.ImageAssetModal = ImageAssetModal;
