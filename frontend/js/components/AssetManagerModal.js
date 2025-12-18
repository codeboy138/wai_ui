// Asset Manager Modal Component - 드래그앤드롭 지원 + 리사이징 + 복수선택 + 파일업로드

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
                @mousedown.stop\
            >\
                <div class="modal-resize-handle resize-n" @mousedown="startResize($event, \'n\')"></div>\
                <div class="modal-resize-handle resize-s" @mousedown="startResize($event, \'s\')"></div>\
                <div class="modal-resize-handle resize-e" @mousedown="startResize($event, \'e\')"></div>\
                <div class="modal-resize-handle resize-w" @mousedown="startResize($event, \'w\')"></div>\
                <div class="modal-resize-handle resize-nw" @mousedown="startResize($event, \'nw\')"></div>\
                <div class="modal-resize-handle resize-ne" @mousedown="startResize($event, \'ne\')"></div>\
                <div class="modal-resize-handle resize-sw" @mousedown="startResize($event, \'sw\')"></div>\
                <div class="modal-resize-handle resize-se" @mousedown="startResize($event, \'se\')"></div>\
\
                <div\
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"\
                    @mousedown.stop.prevent="onHeaderMouseDown"\
                >\
                    <div class="flex items-center gap-3">\
                        <i :class="assetTypeIcon" class="text-ui-accent"></i>\
                        <span class="text-[14px] font-bold">{{ assetTypeTitle }} 관리</span>\
                        <span class="text-[11px] text-text-sub">{{ filteredAssets.length }}개 {{ assetTypeLabel }}</span>\
                    </div>\
                    <div class="flex items-center gap-2">\
                        <button class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1" @click="addAsset">\
                            <i class="fa-solid fa-plus"></i> 추가\
                        </button>\
                        <button class="text-[14px] text-text-sub hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit(\'close\')">\
                            <i class="fa-solid fa-xmark"></i>\
                        </button>\
                    </div>\
                </div>\
\
                <div class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-panel">\
                    <div class="flex items-center gap-2">\
                        <span class="text-[11px] text-text-sub">{{ assetTypeTitle }} 목록</span>\
                        <span class="text-[10px] text-ui-accent">(Ctrl+클릭: 복수선택 / 드래그: 타임라인 추가)</span>\
                    </div>\
                    \
                    <div class="flex items-center gap-2">\
                        <div class="flex items-center gap-1 px-2 py-1 bg-bg-input rounded border border-ui-border">\
                            <span class="text-[10px] text-text-sub">{{ previewToggleLabel }}</span>\
                            <button\
                                class="w-8 h-4 rounded-full transition-colors relative"\
                                :class="previewEnabled ? \'bg-ui-accent\' : \'bg-ui-border\'"\
                                @click="previewEnabled = !previewEnabled"\
                            >\
                                <span class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform" :class="previewEnabled ? \'left-4\' : \'left-0.5\'"></span>\
                            </button>\
                        </div>\
                        \
                        <div class="w-px h-5 bg-ui-border"></div>\
                        \
                        <div class="relative">\
                            <input type="text" v-model="searchQuery" :placeholder="assetTypeLabel + \' 검색...\'" class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" />\
                            <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>\
                        </div>\
                        \
                        <div class="flex border border-ui-border rounded overflow-hidden">\
                            <button class="px-2 py-1 text-[10px]" :class="viewMode === \'grid\' ? \'bg-ui-accent text-white\' : \'bg-bg-input text-text-sub hover:bg-bg-hover\'" @click="viewMode = \'grid\'">\
                                <i class="fa-solid fa-grip"></i>\
                            </button>\
                            <button class="px-2 py-1 text-[10px]" :class="viewMode === \'list\' ? \'bg-ui-accent text-white\' : \'bg-bg-input text-text-sub hover:bg-bg-hover\'" @click="viewMode = \'list\'">\
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
                                @click="currentFolderId = folder.id"\
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
                            <button class="w-full px-2 py-1 text-[10px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover flex items-center justify-center gap-1" @click="createFolder">\
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
                                <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ \'text-ui-accent\': sortBy === \'name\' }" @click="toggleSort(\'name\')">\
                                    이름 <i v-if="sortBy === \'name\'" :class="sortAsc ? \'fa-solid fa-arrow-up\' : \'fa-solid fa-arrow-down\'" class="text-[8px]"></i>\
                                </span>\
                                <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ \'text-ui-accent\': sortBy === \'date\' }" @click="toggleSort(\'date\')">\
                                    추가일 <i v-if="sortBy === \'date\'" :class="sortAsc ? \'fa-solid fa-arrow-up\' : \'fa-solid fa-arrow-down\'" class="text-[8px]"></i>\
                                </span>\
                            </div>\
                            <span class="text-text-sub">{{ selectedAssetIds.length > 0 ? selectedAssetIds.length + \'개 선택됨\' : filteredAssets.length + \'개 항목\' }}</span>\
                        </div>\
\
                        <div class="flex-1 overflow-auto p-3" :class="{ \'drag-over\': isContentPanelDragOver }">\
                            <div v-if="filteredAssets.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">\
                                <i :class="assetTypeIcon" class="text-4xl mb-3"></i>\
                                <p class="text-[12px]">{{ assetTypeLabel }}이(가) 없습니다</p>\
                                <p class="text-[11px] mt-1">파일을 추가하거나 드래그하여 가져오세요</p>\
                            </div>\
\
                            <div v-else-if="viewMode === \'grid\'" class="asset-grid view-grid" :style="gridStyle">\
                                <div\
                                    v-for="asset in filteredAssets"\
                                    :key="asset.id"\
                                    class="asset-card"\
                                    :class="{ \'selected\': isAssetSelected(asset.id) }"\
                                    @click="selectAsset($event, asset)"\
                                    @dblclick="useAsset(asset)"\
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
                                </div>\
                            </div>\
\
                            <div v-else class="asset-grid view-list">\
                                <div\
                                    v-for="asset in filteredAssets"\
                                    :key="asset.id"\
                                    class="asset-card"\
                                    :class="{ \'selected\': isAssetSelected(asset.id) }"\
                                    @click="selectAsset($event, asset)"\
                                    @dblclick="useAsset(asset)"\
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
                        <button v-if="selectedAssetIds.length > 0" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click="useSelectedAssets">사용</button>\
                        <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors" @click="$emit(\'close\')">닫기</button>\
                    </div>\
                </div>\
            </div>\
        </div>\
    ',
    data: function() {
        return {
            posX: 0,
            posY: 0,
            width: 900,
            height: 600,
            minWidth: 500,
            minHeight: 350,
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
        windowStyle: function() {
            return {
                position: 'absolute',
                left: this.posX + 'px',
                top: this.posY + 'px',
                width: this.width + 'px',
                height: this.height + 'px'
            };
        },
        gridStyle: function() {
            var contentWidth = this.width - 176 - 24;
            var minCardWidth = 140;
            var cols = Math.max(2, Math.floor(contentWidth / minCardWidth));
            return { gridTemplateColumns: 'repeat(' + cols + ', 1fr)' };
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
        onHeaderMouseDown: function(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX;
            this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX;
            this.dragStartPosY = this.posY;
        },
        startResize: function(e, dir) {
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
            } else {
                this.selectedAssetIds = [asset.id];
            }
        },
        useAsset: function(asset) {
            Swal.fire({
                icon: 'success',
                title: '자산 사용',
                text: '"' + asset.name + '"을(를) 타임라인에 추가합니다.',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1500,
                showConfirmButton: false
            });
            this.$emit('close');
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
                    title: '자산 사용',
                    text: assets.length + '개 자산을 타임라인에 추가합니다: ' + names,
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6',
                    timer: 1500,
                    showConfirmButton: false
                });
                this.$emit('close');
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
                text: files.length + '개 파일 추가됨: ' + fileNames.join(', '),
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 2000,
                showConfirmButton: false
            });
            for (var j = 0; j < files.length; j++) {
                var file = files[j];
                var newAsset = {
                    id: self.assetType + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    folderId: 'all',
                    duration: '00:00',
                    resolution: '',
                    src: URL.createObjectURL(file)
                };
                if (!self.dummyAssets[self.assetType]) {
                    self.dummyAssets[self.assetType] = [];
                }
                self.dummyAssets[self.assetType].push(newAsset);
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
            var assets = this.dummyAssets[this.assetType] || [];
            if (folderId === 'all') return assets.length;
            return assets.filter(function(a) { return a.folderId === folderId; }).length;
        },
        toggleAudioPreview: function(asset) {
            console.log('Playing audio:', asset.name);
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
            e.dataTransfer.effectAllowed = 'copy';
            var transferData = selectedAssets.map(function(a) {
                return {
                    type: self.assetType,
                    id: a.id,
                    name: a.name,
                    src: a.src || '',
                    duration: a.duration || '',
                    resolution: a.resolution || ''
                };
            });
            e.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            var dragImage = document.createElement('div');
            var icon = self.assetType === 'video' ? '🎬' : '🎵';
            if (selectedAssets.length > 1) {
                dragImage.textContent = icon + ' ' + selectedAssets.length + '개 항목';
            } else {
                dragImage.textContent = icon + ' ' + asset.name;
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
            var assets = this.dummyAssets[this.assetType] || [];
            var idx = -1;
            for (var i = 0; i < assets.length; i++) {
                if (assets[i].id === asset.id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) {
                assets[idx].folderId = targetFolderId;
            }
        }
    }
};

window.AssetManagerModal = AssetManagerModal;
