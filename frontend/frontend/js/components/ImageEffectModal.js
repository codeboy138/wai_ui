// Image Effect Modal Component - 이미지효과 관리 + 리사이징 + 드래그 + 최소화 + 다중선택 + 타임라인 연동 + 파일업로드

const ImageEffectModal = {
    emits: ['close'],
    template: `
        <div
            id="image-effect-modal-overlay"
            class="modal-overlay"
            @click.self="$emit('close')"
            @contextmenu.prevent
        >
            <input 
                type="file" 
                ref="fileInput" 
                accept="image/*,video/*,.lut,.cube" 
                multiple 
                style="display:none;" 
                @change="onFileSelected"
            />
            
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
                    <!-- 카테고리 탭 + 검색 -->
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
                    <div class="flex-1 flex overflow-hidden">
                        <!-- 폴더 사이드바 -->
                        <div class="w-44 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">
                            <div class="p-2 border-b border-ui-border bg-bg-panel">
                                <span class="text-[10px] text-text-sub font-bold uppercase tracking-wide">폴더</span>
                            </div>
                            <div class="flex-1 overflow-auto p-1">
                                <div 
                                    v-for="folder in effectFolders"
                                    :key="folder.id"
                                    class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-[11px] transition-colors folder-drop-zone"
                                    :class="{
                                        'bg-ui-selected text-white': currentFolderId === folder.id,
                                        'hover:bg-bg-hover': currentFolderId !== folder.id,
                                        'drag-over': dragOverFolderId === folder.id
                                    }"
                                    @click.stop="currentFolderId = folder.id"
                                    @dragover.prevent="onFolderDragOver($event, folder)"
                                    @dragleave="onFolderDragLeave($event, folder)"
                                    @drop.prevent="onFolderDrop($event, folder)"
                                >
                                    <i class="fa-solid fa-folder text-yellow-500"></i>
                                    <span class="truncate flex-1">{{ folder.name }}</span>
                                    <span class="text-[9px] text-text-sub">{{ getFolderEffectCount(folder.id) }}</span>
                                </div>
                            </div>
                            
                            <div class="p-2 border-t border-ui-border">
                                <button class="w-full px-2 py-1 text-[10px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover flex items-center justify-center gap-1" @click.stop="createFolder">
                                    <i class="fa-solid fa-folder-plus"></i> 새 폴더
                                </button>
                            </div>
                        </div>

                        <!-- 효과 그리드 -->
                        <div 
                            class="flex-1 flex flex-col bg-bg-dark overflow-hidden"
                            @dragover.prevent="onContentPanelDragOver"
                            @dragleave="onContentPanelDragLeave"
                            @drop.prevent="onContentPanelDrop"
                        >
                            <div class="flex items-center justify-between px-3 py-1.5 border-b border-ui-border bg-bg-panel text-[10px]">
                                <div class="flex items-center gap-4">
                                    <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ 'text-ui-accent': sortBy === 'name' }" @click.stop="toggleSort('name')">
                                        이름 <i v-if="sortBy === 'name'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                    </span>
                                    <span class="cursor-pointer hover:text-ui-accent flex items-center gap-1" :class="{ 'text-ui-accent': sortBy === 'date' }" @click.stop="toggleSort('date')">
                                        추가일 <i v-if="sortBy === 'date'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                    </span>
                                </div>
                                <span class="text-text-sub">{{ selectedEffectIds.length > 0 ? selectedEffectIds.length + '개 선택됨' : filteredEffects.length + '개 항목' }}</span>
                            </div>

                            <div class="flex-1 overflow-auto p-4" :class="{ 'bg-ui-accent/10': isContentPanelDragOver }">
                                <div v-if="filteredEffects.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">
                                    <i class="fa-solid fa-wand-magic-sparkles text-4xl mb-3"></i>
                                    <p class="text-[12px]">{{ currentCategoryLabel }} 효과가 없습니다</p>
                                    <p class="text-[11px] mt-1">파일을 드래그하거나 추가 버튼을 클릭하세요</p>
                                </div>

                                <div v-else class="grid grid-cols-4 gap-3">
                                    <div
                                        v-for="effect in filteredEffects"
                                        :key="effect.id"
                                        class="bg-bg-input border border-ui-border rounded-lg p-3 cursor-pointer hover:border-ui-accent transition-colors relative"
                                        :class="{ 'border-ui-accent ring-1 ring-ui-accent': isEffectSelected(effect.id) }"
                                        @click.stop="selectEffect($event, effect)"
                                        @dblclick.stop="applyEffect(effect)"
                                        draggable="true"
                                        @dragstart="onEffectDragStart($event, effect)"
                                        @dragend="onDragEnd"
                                    >
                                        <div class="w-full aspect-video bg-bg-dark rounded flex items-center justify-center mb-2 overflow-hidden">
                                            <img v-if="effect.thumbnail" :src="effect.thumbnail" class="w-full h-full object-cover" />
                                            <i v-else :class="effect.icon" class="text-2xl text-ui-accent"></i>
                                        </div>
                                        <div class="text-[11px] font-medium truncate">{{ effect.name }}</div>
                                        <div class="text-[10px] text-text-sub truncate">{{ effect.description }}</div>
                                        <button 
                                            class="asset-quick-add-btn"
                                            @click.stop="addToTimeline(effect)"
                                            title="타임라인에 추가"
                                        >
                                            <i class="fa-solid fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 상태바 -->
                    <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                        <div class="text-text-sub">
                            <span v-if="selectedEffectIds.length > 0">{{ selectedEffectIds.length }}개 선택됨</span>
                            <span v-else>{{ currentCategoryLabel }} - {{ currentFolderName }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button v-if="selectedEffectIds.length > 0" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click.stop="applySelectedEffects">타임라인에 추가</button>
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
            currentFolderId: 'all',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            selectedEffectIds: [],
            dragData: null,
            dragOverFolderId: null,
            isContentPanelDragOver: false,
            
            categoryTabs: [
                { id: 'filter', label: '필터', icon: 'fa-solid fa-sliders' },
                { id: 'transition', label: '전환', icon: 'fa-solid fa-shuffle' },
                { id: 'overlay', label: '오버레이', icon: 'fa-solid fa-layer-group' },
                { id: 'animation', label: '애니메이션', icon: 'fa-solid fa-film' }
            ],
            
            effectFolders: [
                { id: 'all', name: '전체' },
                { id: 'favorites', name: '즐겨찾기' },
                { id: 'recent', name: '최근 사용' }
            ],
            
            dummyEffects: [
                { id: 'f1', name: '블러', description: '가우시안 블러 효과', category: 'filter', folderId: 'all', icon: 'fa-solid fa-circle-half-stroke', duration: 2, dateAdded: Date.now() - 100000, thumbnail: '' },
                { id: 'f2', name: '선명화', description: '이미지 선명도 향상', category: 'filter', folderId: 'all', icon: 'fa-solid fa-diamond', duration: 2, dateAdded: Date.now() - 200000, thumbnail: '' },
                { id: 'f3', name: '흑백', description: '그레이스케일 변환', category: 'filter', folderId: 'all', icon: 'fa-solid fa-circle', duration: 2, dateAdded: Date.now() - 300000, thumbnail: '' },
                { id: 'f4', name: '세피아', description: '빈티지 세피아 톤', category: 'filter', folderId: 'all', icon: 'fa-solid fa-palette', duration: 2, dateAdded: Date.now() - 400000, thumbnail: '' },
                { id: 't1', name: '페이드', description: '부드러운 페이드 효과', category: 'transition', folderId: 'all', icon: 'fa-solid fa-circle-right', duration: 1, dateAdded: Date.now() - 500000, thumbnail: '' },
                { id: 't2', name: '슬라이드', description: '슬라이드 전환', category: 'transition', folderId: 'all', icon: 'fa-solid fa-arrow-right', duration: 1, dateAdded: Date.now() - 600000, thumbnail: '' },
                { id: 'o1', name: '빛 누출', description: '필름 빛 누출 효과', category: 'overlay', folderId: 'all', icon: 'fa-solid fa-sun', duration: 3, dateAdded: Date.now() - 700000, thumbnail: '' },
                { id: 'o2', name: '그레인', description: '필름 그레인 효과', category: 'overlay', folderId: 'all', icon: 'fa-solid fa-braille', duration: 3, dateAdded: Date.now() - 800000, thumbnail: '' },
                { id: 'a1', name: '줌 인', description: '확대 애니메이션', category: 'animation', folderId: 'all', icon: 'fa-solid fa-magnifying-glass-plus', duration: 2, dateAdded: Date.now() - 900000, thumbnail: '' },
                { id: 'a2', name: '회전', description: '회전 애니메이션', category: 'animation', folderId: 'all', icon: 'fa-solid fa-rotate', duration: 2, dateAdded: Date.now() - 1000000, thumbnail: '' }
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
        currentFolderName() {
            const folder = this.effectFolders.find(f => f.id === this.currentFolderId);
            return folder ? folder.name : '전체';
        },
        filteredEffects() {
            let effects = this.dummyEffects.filter(e => e.category === this.currentCategory);
            
            if (this.currentFolderId !== 'all') {
                effects = effects.filter(e => e.folderId === this.currentFolderId);
            }
            
            if (this.searchQuery) { 
                const q = this.searchQuery.toLowerCase(); 
                effects = effects.filter(e => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)); 
            }
            
            effects = effects.slice().sort((a, b) => {
                let cmp;
                if (this.sortBy === 'name') {
                    cmp = a.name.localeCompare(b.name);
                } else if (this.sortBy === 'date') {
                    cmp = (b.dateAdded || 0) - (a.dateAdded || 0);
                } else {
                    cmp = 0;
                }
                return this.sortAsc ? cmp : -cmp;
            });
            
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
            if (e.target.closest('input, button, select, .bg-bg-input, .modal-resize-handle, .folder-drop-zone')) return;
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
        
        toggleSort(field) {
            if (this.sortBy === field) {
                this.sortAsc = !this.sortAsc;
            } else {
                this.sortBy = field;
                this.sortAsc = true;
            }
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
            this.addToTimeline(effect);
        },
        applySelectedEffects() { 
            const effects = this.filteredEffects.filter(e => this.selectedEffectIds.includes(e.id));
            if (effects.length > 0) {
                this.addMultipleToTimeline(effects);
            }
        },
        
        addToTimeline(effect) {
            const transferData = [{
                type: 'effect',
                id: effect.id,
                name: effect.name,
                category: effect.category,
                effectType: this.currentCategory,
                icon: effect.icon,
                duration: effect.duration || 2,
                thumbnail: effect.thumbnail || ''
            }];
            this.dispatchToTimeline(transferData);
            Swal.fire({
                icon: 'success',
                title: '타임라인에 추가',
                text: '"' + effect.name + '" 효과가 타임라인에 추가되었습니다.',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1500,
                showConfirmButton: false
            });
        },
        addMultipleToTimeline(effects) {
            const transferData = effects.map(e => ({
                type: 'effect',
                id: e.id,
                name: e.name,
                category: e.category,
                effectType: this.currentCategory,
                icon: e.icon,
                duration: e.duration || 2,
                thumbnail: e.thumbnail || ''
            }));
            this.dispatchToTimeline(transferData);
            Swal.fire({
                icon: 'success',
                title: '타임라인에 추가',
                text: effects.length + '개 효과가 타임라인에 추가되었습니다.',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1500,
                showConfirmButton: false
            });
        },
        dispatchToTimeline(assetDataArray) {
            const event = new CustomEvent('wai-asset-add-to-timeline', {
                detail: assetDataArray,
                bubbles: true
            });
            document.dispatchEvent(event);
        },
        
        addEffect() {
            // 파일 선택 다이얼로그 열기
            if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },
        
        onFileSelected(e) {
            this.handleFileUpload(e.target.files);
            e.target.value = '';
        },
        
        handleFileUpload(files) {
            if (!files || files.length === 0) return;
            
            const now = new Date();
            const folderName = '업로드_' + now.getFullYear() + 
                String(now.getMonth() + 1).padStart(2, '0') + 
                String(now.getDate()).padStart(2, '0') + '_' + 
                String(now.getHours()).padStart(2, '0') + 
                String(now.getMinutes()).padStart(2, '0') + 
                String(now.getSeconds()).padStart(2, '0');
            const folderId = 'folder_' + Date.now();
            
            this.effectFolders.push({ id: folderId, name: folderName });
            
            let addedCount = 0;
            
            for (let j = 0; j < files.length; j++) {
                const file = files[j];
                const fileName = file.name;
                const fileExt = fileName.split('.').pop().toLowerCase();
                
                // 지원 파일 형식 체크
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');
                const isLut = ['lut', 'cube', '3dl'].includes(fileExt);
                
                if (!isImage && !isVideo && !isLut) continue;
                
                let thumbnail = '';
                let effectIcon = 'fa-solid fa-wand-magic-sparkles';
                let description = '사용자 정의 효과';
                
                if (isImage) {
                    thumbnail = URL.createObjectURL(file);
                    effectIcon = 'fa-solid fa-image';
                    description = '이미지 오버레이 효과';
                } else if (isVideo) {
                    thumbnail = '';
                    effectIcon = 'fa-solid fa-film';
                    description = '비디오 오버레이 효과';
                    // 비디오 썸네일 생성
                    this.generateVideoThumbnail(file).then(thumb => {
                        const effect = this.dummyEffects.find(e => e.id === newEffect.id);
                        if (effect) effect.thumbnail = thumb;
                    });
                } else if (isLut) {
                    effectIcon = 'fa-solid fa-palette';
                    description = 'LUT 컬러 그레이딩';
                }
                
                const newEffect = {
                    id: 'effect_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: fileName.replace(/\.[^/.]+$/, ''),
                    description: description,
                    category: this.currentCategory,
                    folderId: folderId,
                    icon: effectIcon,
                    duration: 2,
                    dateAdded: Date.now(),
                    thumbnail: thumbnail,
                    src: isImage || isVideo ? URL.createObjectURL(file) : '',
                    fileType: isImage ? 'image' : isVideo ? 'video' : 'lut'
                };
                
                this.dummyEffects.push(newEffect);
                addedCount++;
            }
            
            if (addedCount > 0) {
                this.currentFolderId = folderId;
                
                Swal.fire({
                    icon: 'success',
                    title: '효과 업로드 완료',
                    text: addedCount + '개 효과가 "' + folderName + '" 폴더에 추가되었습니다.',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6',
                    timer: 2500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: '업로드 실패',
                    text: '지원하는 효과 파일이 없습니다. (이미지, 비디오, LUT 파일)',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        },
        
        generateVideoThumbnail(file) {
            return new Promise((resolve) => {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.muted = true;
                
                video.onloadeddata = () => {
                    video.currentTime = 1;
                };
                
                video.onseeked = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                    URL.revokeObjectURL(video.src);
                };
                
                video.onerror = () => {
                    resolve('');
                };
                
                video.src = URL.createObjectURL(file);
            });
        },
        
        createFolder() {
            Swal.fire({
                title: '새 폴더',
                input: 'text',
                inputPlaceholder: '폴더 이름',
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            }).then(result => {
                if (result.value) {
                    this.effectFolders.push({ id: 'folder_' + Date.now(), name: result.value });
                }
            });
        },
        
        getFolderEffectCount(folderId) {
            const effects = this.dummyEffects.filter(e => e.category === this.currentCategory);
            if (folderId === 'all') return effects.length;
            return effects.filter(e => e.folderId === folderId).length;
        },
        
        // 컨텐츠 패널 드래그오버/드롭 (파일 업로드용)
        onContentPanelDragOver(e) {
            e.preventDefault();
            // 파일 드래그인지 체크
            if (e.dataTransfer.types.includes('Files')) {
                this.isContentPanelDragOver = true;
            }
        },
        
        onContentPanelDragLeave(e) {
            this.isContentPanelDragOver = false;
        },
        
        onContentPanelDrop(e) {
            e.preventDefault();
            this.isContentPanelDragOver = false;
            
            // 파일 드롭 처리
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.handleFileUpload(e.dataTransfer.files);
                return;
            }
            
            // 내부 효과 이동
            if (this.dragData && this.dragData.type === 'effect' && this.dragData.effects) {
                this.dragData.effects.forEach(effect => {
                    this.moveEffectToFolder(effect, this.currentFolderId);
                });
            }
            this.dragData = null;
        },
        
        // 드래그앤드롭
        onEffectDragStart(e, effect) {
            if (!this.selectedEffectIds.includes(effect.id)) {
                this.selectedEffectIds = [effect.id];
            }
            
            const selectedEffects = this.filteredEffects.filter(ef => this.selectedEffectIds.includes(ef.id));
            this.dragData = { type: 'effect', effects: selectedEffects };
            
            e.dataTransfer.effectAllowed = 'copy';
            const transferData = selectedEffects.map(ef => ({
                type: 'effect',
                id: ef.id,
                name: ef.name,
                category: ef.category,
                effectType: this.currentCategory,
                icon: ef.icon,
                duration: ef.duration || 2,
                thumbnail: ef.thumbnail || ''
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
            this.dragData = null;
            this.dragOverFolderId = null;
            this.isContentPanelDragOver = false;
        },
        
        onFolderDragOver(e, folder) {
            e.preventDefault();
            if (this.dragData) {
                this.dragOverFolderId = folder.id;
            }
        },
        onFolderDragLeave(e, folder) {
            if (this.dragOverFolderId === folder.id) {
                this.dragOverFolderId = null;
            }
        },
        onFolderDrop(e, folder) {
            e.preventDefault();
            if (this.dragData && this.dragData.type === 'effect' && this.dragData.effects) {
                this.dragData.effects.forEach(effect => {
                    this.moveEffectToFolder(effect, folder.id);
                });
            }
            this.dragOverFolderId = null;
            this.dragData = null;
        },
        moveEffectToFolder(effect, targetFolderId) {
            const idx = this.dummyEffects.findIndex(e => e.id === effect.id);
            if (idx !== -1) {
                this.dummyEffects[idx].folderId = targetFolderId;
            }
        }
    }
};

window.ImageEffectModal = ImageEffectModal;
