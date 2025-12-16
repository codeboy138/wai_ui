// Project Modal Component - 2패널 파일탐색기 스타일
// 레이어 템플릿 모달과 동일한 구조

const ProjectModal = {
    emits: ['close'],
    template: `
        <div
            id="project-modal-overlay"
            class="modal-overlay"
            @click.self="$emit('close')"
            @contextmenu.prevent
        >
            <div
                id="project-modal-window"
                class="project-manager-window bg-bg-panel border border-ui-border rounded-lg shadow-2xl text-[12px] text-text-main flex flex-col"
                :style="windowStyle"
                @mousedown.stop
            >
                <!-- 헤더 -->
                <div
                    id="project-modal-header"
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-folder-open text-ui-accent"></i>
                        <span class="text-[14px] font-bold">프로젝트 관리</span>
                        <span class="text-[11px] text-text-sub">
                            {{ allProjects.length }}개 프로젝트 · {{ allFolders.length - 1 }}개 폴더
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <!-- 새 폴더 -->
                        <button
                            id="project-modal-new-folder-btn"
                            class="px-2 py-1 text-[11px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors flex items-center gap-1"
                            @click="createNewFolder"
                            title="새 폴더 만들기"
                        >
                            <i class="fa-solid fa-folder-plus"></i> 새 폴더
                        </button>
                        <!-- 새 프로젝트 -->
                        <button
                            id="project-modal-new-project-btn"
                            class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                            @click="createNewProject"
                            title="새 프로젝트 만들기"
                        >
                            <i class="fa-solid fa-plus"></i> 새 프로젝트
                        </button>
                        <!-- 닫기 -->
                        <button
                            id="project-modal-close-btn"
                            class="text-[14px] text-text-sub hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-ui-danger transition-colors"
                            @click.stop="$emit('close')"
                            title="닫기"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <!-- 툴바 -->
                <div class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-panel">
                    <!-- 경로 표시 (Breadcrumb) -->
                    <div class="flex items-center gap-1 text-[11px]">
                        <template v-for="(crumb, idx) in breadcrumbs" :key="crumb.id">
                            <span 
                                class="text-text-sub hover:text-ui-accent cursor-pointer px-1 py-0.5 rounded hover:bg-bg-hover"
                                @click="navigateToFolder(crumb.id)"
                            >
                                {{ crumb.name }}
                            </span>
                            <i v-if="idx < breadcrumbs.length - 1" class="fa-solid fa-chevron-right text-[8px] text-text-sub"></i>
                        </template>
                    </div>
                    
                    <!-- 검색/필터 -->
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <input
                                type="text"
                                v-model="searchQuery"
                                placeholder="프로젝트 검색..."
                                class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none"
                            />
                            <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                        </div>
                        <!-- 보기 모드 -->
                        <div class="flex border border-ui-border rounded overflow-hidden">
                            <button 
                                class="px-2 py-1 text-[10px]"
                                :class="viewMode === 'list' ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                                @click="viewMode = 'list'"
                                title="목록 보기"
                            >
                                <i class="fa-solid fa-list"></i>
                            </button>
                            <button 
                                class="px-2 py-1 text-[10px]"
                                :class="viewMode === 'grid' ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                                @click="viewMode = 'grid'"
                                title="그리드 보기"
                            >
                                <i class="fa-solid fa-grip"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 메인 컨텐츠: 2패널 -->
                <div class="flex-1 flex overflow-hidden">
                    
                    <!-- 좌측: 폴더 트리 -->
                    <div 
                        id="project-modal-folder-panel"
                        class="w-52 border-r border-ui-border bg-bg-dark flex flex-col shrink-0"
                        :style="{ width: leftPanelWidth + 'px' }"
                    >
                        <div class="p-2 border-b border-ui-border bg-bg-panel">
                            <span class="text-[10px] text-text-sub font-bold uppercase tracking-wide">폴더</span>
                        </div>
                        <div class="flex-1 overflow-auto p-1">
                            <div 
                                v-for="folder in rootFolders"
                                :key="folder.id"
                            >
                                <project-folder-item
                                    :folder="folder"
                                    :all-folders="allFolders"
                                    :selected-folder-id="currentFolderId"
                                    @select="selectFolder"
                                    @toggle="toggleFolder"
                                    @contextmenu="openFolderContextMenu"
                                ></project-folder-item>
                            </div>
                        </div>
                    </div>

                    <!-- 우측: 프로젝트 목록 -->
                    <div 
                        id="project-modal-file-panel"
                        class="flex-1 flex flex-col bg-bg-dark overflow-hidden"
                    >
                        <!-- 정렬 바 -->
                        <div class="flex items-center justify-between px-3 py-1.5 border-b border-ui-border bg-bg-panel text-[10px]">
                            <div class="flex items-center gap-4">
                                <span 
                                    class="cursor-pointer hover:text-ui-accent flex items-center gap-1"
                                    :class="{ 'text-ui-accent': sortBy === 'name' }"
                                    @click="toggleSort('name')"
                                >
                                    이름
                                    <i v-if="sortBy === 'name'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                </span>
                                <span 
                                    class="cursor-pointer hover:text-ui-accent flex items-center gap-1"
                                    :class="{ 'text-ui-accent': sortBy === 'date' }"
                                    @click="toggleSort('date')"
                                >
                                    수정일
                                    <i v-if="sortBy === 'date'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                </span>
                            </div>
                            <span class="text-text-sub">
                                {{ filteredItems.length }}개 항목
                            </span>
                        </div>

                        <!-- 프로젝트/폴더 목록 -->
                        <div 
                            class="flex-1 overflow-auto p-2"
                            @contextmenu.prevent="openEmptyAreaContextMenu($event)"
                        >
                            <!-- 빈 상태 -->
                            <div
                                v-if="filteredItems.length === 0 && !searchQuery"
                                class="flex flex-col items-center justify-center h-full text-text-sub opacity-50"
                            >
                                <i class="fa-solid fa-folder-open text-4xl mb-3"></i>
                                <p class="text-[12px]">이 폴더는 비어있습니다</p>
                                <p class="text-[11px] mt-1">새 프로젝트를 생성하거나 폴더를 만드세요</p>
                            </div>

                            <!-- 검색 결과 없음 -->
                            <div
                                v-else-if="filteredItems.length === 0 && searchQuery"
                                class="flex flex-col items-center justify-center h-full text-text-sub opacity-50"
                            >
                                <i class="fa-solid fa-search text-3xl mb-3"></i>
                                <p class="text-[12px]">"{{ searchQuery }}" 검색 결과가 없습니다</p>
                            </div>

                            <!-- 목록 보기 -->
                            <div v-else-if="viewMode === 'list'" class="space-y-0.5">
                                <!-- 하위 폴더들 -->
                                <div
                                    v-for="folder in childFolders"
                                    :key="'folder-' + folder.id"
                                    class="flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-bg-hover group transition-colors"
                                    :class="{ 'bg-ui-selected': selectedItems.includes('folder:' + folder.id) }"
                                    @click="onItemClick($event, 'folder', folder)"
                                    @dblclick="navigateToFolder(folder.id)"
                                    @contextmenu.prevent="openFolderContextMenu($event, folder)"
                                >
                                    <i class="fa-solid fa-folder text-yellow-500 text-[14px]"></i>
                                    <span class="flex-1 truncate">{{ folder.name }}</span>
                                    <span class="text-[10px] text-text-sub opacity-0 group-hover:opacity-100">
                                        {{ getChildCount(folder.id) }}개 항목
                                    </span>
                                </div>

                                <!-- 프로젝트들 -->
                                <div
                                    v-for="project in filteredProjects"
                                    :key="'proj-' + project.id"
                                    class="flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-bg-hover group transition-colors"
                                    :class="{ 'bg-ui-selected': selectedItems.includes('project:' + project.id) }"
                                    @click="onItemClick($event, 'project', project)"
                                    @dblclick="openProject(project)"
                                    @contextmenu.prevent="openProjectContextMenu($event, project)"
                                >
                                    <i class="fa-solid fa-film text-ui-accent text-[14px]"></i>
                                    <div class="flex-1 min-w-0">
                                        <div class="truncate">{{ project.name }}</div>
                                        <div class="text-[10px] text-text-sub">
                                            {{ formatDate(project.updatedAt) }} · {{ project.resolution || 'FHD' }}
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                        <button 
                                            class="w-6 h-6 rounded hover:bg-ui-accent hover:text-white flex items-center justify-center"
                                            @click.stop="openProject(project)"
                                            title="열기"
                                        >
                                            <i class="fa-solid fa-folder-open text-[10px]"></i>
                                        </button>
                                        <button 
                                            class="w-6 h-6 rounded hover:bg-ui-danger hover:text-white flex items-center justify-center"
                                            @click.stop="deleteProject(project)"
                                            title="삭제"
                                        >
                                            <i class="fa-solid fa-trash text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- 그리드 보기 -->
                            <div v-else class="grid grid-cols-4 gap-2">
                                <!-- 하위 폴더들 -->
                                <div
                                    v-for="folder in childFolders"
                                    :key="'folder-' + folder.id"
                                    class="flex flex-col items-center p-3 rounded-lg cursor-pointer hover:bg-bg-hover group transition-colors"
                                    :class="{ 'bg-ui-selected': selectedItems.includes('folder:' + folder.id) }"
                                    @click="onItemClick($event, 'folder', folder)"
                                    @dblclick="navigateToFolder(folder.id)"
                                    @contextmenu.prevent="openFolderContextMenu($event, folder)"
                                >
                                    <i class="fa-solid fa-folder text-yellow-500 text-3xl mb-2"></i>
                                    <span class="text-[11px] truncate max-w-full text-center">{{ folder.name }}</span>
                                </div>

                                <!-- 프로젝트들 -->
                                <div
                                    v-for="project in filteredProjects"
                                    :key="'proj-' + project.id"
                                    class="flex flex-col items-center p-3 rounded-lg cursor-pointer hover:bg-bg-hover group transition-colors relative"
                                    :class="{ 'bg-ui-selected': selectedItems.includes('project:' + project.id) }"
                                    @click="onItemClick($event, 'project', project)"
                                    @dblclick="openProject(project)"
                                    @contextmenu.prevent="openProjectContextMenu($event, project)"
                                >
                                    <div class="w-full aspect-video bg-bg-input rounded-lg flex items-center justify-center mb-2 border border-ui-border overflow-hidden">
                                        <img v-if="project.thumbnail" :src="project.thumbnail" class="w-full h-full object-cover" />
                                        <i v-else class="fa-solid fa-film text-ui-accent text-xl"></i>
                                    </div>
                                    <span class="text-[11px] truncate max-w-full text-center">{{ project.name }}</span>
                                    <span class="text-[9px] text-text-sub">{{ formatDate(project.updatedAt) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 상태바 -->
                <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                    <div class="flex items-center gap-4 text-text-sub">
                        <span v-if="selectedItems.length > 0">
                            {{ selectedItems.length }}개 선택됨
                        </span>
                        <span v-else>
                            {{ currentFolderName }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            v-if="selectedItems.length === 1 && selectedItems[0].startsWith('project:')"
                            class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors"
                            @click="openSelectedProject"
                        >
                            열기
                        </button>
                        <button
                            class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors"
                            @click="$emit('close')"
                        >
                            닫기
                        </button>
                    </div>
                </div>

                <!-- 컨텍스트 메뉴 -->
                <div
                    v-if="contextMenu.show"
                    class="context-menu fixed bg-bg-panel border border-ui-border rounded shadow-xl py-1 min-w-40"
                    :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px', zIndex: 10001 }"
                    @click.stop
                >
                    <!-- 폴더 컨텍스트 메뉴 -->
                    <template v-if="contextMenu.type === 'folder'">
                        <div class="ctx-item" @click="openContextFolder">
                            <i class="fa-solid fa-folder-open w-4"></i>
                            <span>열기</span>
                        </div>
                        <div class="ctx-item" @click="renameItem">
                            <i class="fa-solid fa-pen w-4"></i>
                            <span>이름 바꾸기</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item text-red-400 hover:!bg-ui-danger hover:!text-white" @click="deleteContextFolder">
                            <i class="fa-solid fa-trash w-4"></i>
                            <span>삭제</span>
                        </div>
                    </template>

                    <!-- 프로젝트 컨텍스트 메뉴 -->
                    <template v-else-if="contextMenu.type === 'project'">
                        <div class="ctx-item" @click="openContextProject">
                            <i class="fa-solid fa-folder-open w-4"></i>
                            <span>열기</span>
                        </div>
                        <div class="ctx-item" @click="renameItem">
                            <i class="fa-solid fa-pen w-4"></i>
                            <span>이름 바꾸기</span>
                        </div>
                        <div class="ctx-item" @click="duplicateProject">
                            <i class="fa-solid fa-copy w-4"></i>
                            <span>복제</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item text-red-400 hover:!bg-ui-danger hover:!text-white" @click="deleteContextProject">
                            <i class="fa-solid fa-trash w-4"></i>
                            <span>삭제</span>
                        </div>
                    </template>

                    <!-- 빈 영역 컨텍스트 메뉴 -->
                    <template v-else-if="contextMenu.type === 'empty'">
                        <div class="ctx-item" @click="createNewFolder">
                            <i class="fa-solid fa-folder-plus w-4"></i>
                            <span>새 폴더</span>
                        </div>
                        <div class="ctx-item" @click="createNewProject">
                            <i class="fa-solid fa-plus w-4"></i>
                            <span>새 프로젝트</span>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    `,
    components: {
        'project-folder-item': {
            props: ['folder', 'allFolders', 'selectedFolderId', 'depth'],
            emits: ['select', 'toggle', 'contextmenu'],
            template: `
                <div>
                    <div
                        class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-[11px] transition-colors"
                        :class="{
                            'bg-ui-selected text-white': selectedFolderId === folder.id,
                            'hover:bg-bg-hover': selectedFolderId !== folder.id
                        }"
                        :style="{ paddingLeft: ((depth || 0) * 12 + 8) + 'px' }"
                        @click="$emit('select', folder)"
                        @contextmenu.prevent.stop="$emit('contextmenu', $event, folder)"
                    >
                        <i 
                            v-if="hasChildren"
                            class="fa-solid text-[8px] w-3 cursor-pointer"
                            :class="folder.isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"
                            @click.stop="$emit('toggle', folder)"
                        ></i>
                        <span v-else class="w-3"></span>
                        <i :class="folder.isExpanded && hasChildren ? 'fa-solid fa-folder-open' : 'fa-solid fa-folder'" class="text-yellow-500"></i>
                        <span class="truncate flex-1">{{ folder.name }}</span>
                    </div>
                    <div v-if="folder.isExpanded && hasChildren">
                        <project-folder-item
                            v-for="child in childFolders"
                            :key="child.id"
                            :folder="child"
                            :all-folders="allFolders"
                            :selected-folder-id="selectedFolderId"
                            :depth="(depth || 0) + 1"
                            @select="$emit('select', $event)"
                            @toggle="$emit('toggle', $event)"
                            @contextmenu="$emit('contextmenu', $event[0], $event[1])"
                        ></project-folder-item>
                    </div>
                </div>
            `,
            computed: {
                childFolders() {
                    return this.allFolders.filter(f => f.parentId === this.folder.id);
                },
                hasChildren() {
                    return this.childFolders.length > 0;
                }
            }
        }
    },
    data() {
        return {
            // 창 위치/크기
            posX: 0,
            posY: 0,
            dragging: false,
            dragStartMouseX: 0,
            dragStartMouseY: 0,
            dragStartPosX: 0,
            dragStartPosY: 0,
            
            // 패널 크기
            leftPanelWidth: 200,
            
            // 뷰 상태
            currentFolderId: 'root',
            viewMode: 'list',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            
            // 선택 상태
            selectedItems: [],
            
            // 컨텍스트 메뉴
            contextMenu: {
                show: false,
                x: 0,
                y: 0,
                type: null,
                target: null
            },
            
            // 내부 데이터 (더미)
            internalFolders: [
                { id: 'root', name: '전체 프로젝트', parentId: null, isExpanded: true },
                { id: 'folder1', name: '2024 프로젝트', parentId: 'root', isExpanded: false },
                { id: 'folder2', name: '2025 프로젝트', parentId: 'root', isExpanded: false }
            ],
            internalProjects: [
                { id: 'proj1', name: '뉴스 인트로', folderId: 'root', updatedAt: '2025-01-15T10:30:00', resolution: '4K' },
                { id: 'proj2', name: '광고 영상', folderId: 'root', updatedAt: '2025-01-14T15:20:00', resolution: 'FHD' },
                { id: 'proj3', name: '유튜브 쇼츠', folderId: 'folder2', updatedAt: '2025-01-13T09:00:00', resolution: '9:16' }
            ]
        };
    },
    computed: {
        windowStyle() {
            return {
                position: 'absolute',
                left: this.posX + 'px',
                top: this.posY + 'px'
            };
        },
        allFolders() {
            return this.internalFolders;
        },
        allProjects() {
            return this.internalProjects;
        },
        rootFolders() {
            return this.allFolders.filter(f => f.parentId === null);
        },
        childFolders() {
            return this.allFolders.filter(f => f.parentId === this.currentFolderId);
        },
        currentFolderProjects() {
            return this.allProjects.filter(p => (p.folderId || 'root') === this.currentFolderId);
        },
        filteredProjects() {
            let projects = this.currentFolderProjects;
            
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                projects = projects.filter(p => p.name.toLowerCase().includes(q));
            }
            
            projects = [...projects].sort((a, b) => {
                let cmp = 0;
                if (this.sortBy === 'name') {
                    cmp = a.name.localeCompare(b.name);
                } else if (this.sortBy === 'date') {
                    cmp = new Date(b.updatedAt) - new Date(a.updatedAt);
                }
                return this.sortAsc ? cmp : -cmp;
            });
            
            return projects;
        },
        filteredItems() {
            return [...this.childFolders, ...this.filteredProjects];
        },
        breadcrumbs() {
            const crumbs = [];
            let folderId = this.currentFolderId;
            while (folderId) {
                const folder = this.allFolders.find(f => f.id === folderId);
                if (folder) {
                    crumbs.unshift(folder);
                    folderId = folder.parentId;
                } else {
                    break;
                }
            }
            return crumbs;
        },
        currentFolderName() {
            const folder = this.allFolders.find(f => f.id === this.currentFolderId);
            return folder ? folder.name : '전체 프로젝트';
        }
    },
    mounted() {
        this.centerWindow();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
        document.addEventListener('click', this.closeContextMenu);
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
        document.removeEventListener('click', this.closeContextMenu);
    },
    methods: {
        centerWindow() {
            const vw = window.innerWidth || 1280;
            const vh = window.innerHeight || 720;
            this.posX = Math.max(20, (vw - 900) / 2);
            this.posY = Math.max(20, (vh - 600) / 2);
        },
        onHeaderMouseDown(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX;
            this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX;
            this.dragStartPosY = this.posY;
        },
        onGlobalMouseMove(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
            }
        },
        onGlobalMouseUp() {
            this.dragging = false;
        },
        
        // 폴더 네비게이션
        selectFolder(folder) {
            this.currentFolderId = folder.id;
            this.selectedItems = [];
        },
        navigateToFolder(folderId) {
            this.currentFolderId = folderId;
            this.selectedItems = [];
        },
        toggleFolder(folder) {
            const idx = this.internalFolders.findIndex(f => f.id === folder.id);
            if (idx !== -1) {
                this.internalFolders[idx].isExpanded = !this.internalFolders[idx].isExpanded;
            }
        },
        
        // 선택
        onItemClick(e, type, item) {
            const key = `${type}:${item.id}`;
            if (e.ctrlKey || e.metaKey) {
                const idx = this.selectedItems.indexOf(key);
                if (idx === -1) {
                    this.selectedItems.push(key);
                } else {
                    this.selectedItems.splice(idx, 1);
                }
            } else {
                this.selectedItems = [key];
            }
        },
        
        // 정렬
        toggleSort(field) {
            if (this.sortBy === field) {
                this.sortAsc = !this.sortAsc;
            } else {
                this.sortBy = field;
                this.sortAsc = true;
            }
        },
        
        // 컨텍스트 메뉴
        openFolderContextMenu(e, folder) {
            this.contextMenu = {
                show: true,
                x: e.clientX,
                y: e.clientY,
                type: 'folder',
                target: folder
            };
        },
        openProjectContextMenu(e, project) {
            this.contextMenu = {
                show: true,
                x: e.clientX,
                y: e.clientY,
                type: 'project',
                target: project
            };
        },
        openEmptyAreaContextMenu(e) {
            this.contextMenu = {
                show: true,
                x: e.clientX,
                y: e.clientY,
                type: 'empty',
                target: null
            };
        },
        closeContextMenu() {
            this.contextMenu.show = false;
        },
        
        // CRUD
        async createNewFolder() {
            this.closeContextMenu();
            const { value: name } = await Swal.fire({
                title: '새 폴더',
                input: 'text',
                inputPlaceholder: '폴더 이름',
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            });
            if (name) {
                const newFolder = {
                    id: `folder_${Date.now()}`,
                    name,
                    parentId: this.currentFolderId,
                    isExpanded: false
                };
                this.internalFolders.push(newFolder);
            }
        },
        async createNewProject() {
            this.closeContextMenu();
            const { value: name } = await Swal.fire({
                title: '새 프로젝트',
                input: 'text',
                inputPlaceholder: '프로젝트 이름',
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            });
            if (name) {
                const newProject = {
                    id: `proj_${Date.now()}`,
                    name,
                    folderId: this.currentFolderId,
                    updatedAt: new Date().toISOString(),
                    resolution: 'FHD'
                };
                this.internalProjects.push(newProject);
            }
        },
        openProject(project) {
            Swal.fire({
                icon: 'info',
                title: '프로젝트 열기',
                text: `"${project.name}" 프로젝트를 엽니다.`,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            });
            this.$emit('close');
        },
        openSelectedProject() {
            const selected = this.selectedItems[0];
            if (selected && selected.startsWith('project:')) {
                const id = selected.replace('project:', '');
                const project = this.allProjects.find(p => p.id === id);
                if (project) this.openProject(project);
            }
        },
        openContextProject() {
            this.closeContextMenu();
            this.openProject(this.contextMenu.target);
        },
        openContextFolder() {
            this.closeContextMenu();
            this.navigateToFolder(this.contextMenu.target.id);
        },
        async deleteProject(project) {
            const result = await Swal.fire({
                title: '프로젝트 삭제',
                text: `"${project.name}" 프로젝트를 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
            if (result.isConfirmed) {
                this.internalProjects = this.internalProjects.filter(p => p.id !== project.id);
            }
        },
        deleteContextProject() {
            this.closeContextMenu();
            this.deleteProject(this.contextMenu.target);
        },
        async deleteContextFolder() {
            this.closeContextMenu();
            const folder = this.contextMenu.target;
            if (folder.id === 'root') {
                Swal.fire({ icon: 'error', title: '루트 폴더는 삭제할 수 없습니다', background: '#1e1e1e', color: '#fff' });
                return;
            }
            
            const result = await Swal.fire({
                title: '폴더 삭제',
                text: `"${folder.name}" 폴더를 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
            
            if (result.isConfirmed) {
                this.internalFolders = this.internalFolders.filter(f => f.id !== folder.id);
                if (this.currentFolderId === folder.id) {
                    this.currentFolderId = folder.parentId || 'root';
                }
            }
        },
        async renameItem() {
            const target = this.contextMenu.target;
            const type = this.contextMenu.type;
            this.closeContextMenu();
            
            const { value: name } = await Swal.fire({
                title: '이름 바꾸기',
                input: 'text',
                inputValue: target.name,
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            });
            if (name && name !== target.name) {
                if (type === 'folder') {
                    const idx = this.internalFolders.findIndex(f => f.id === target.id);
                    if (idx !== -1) this.internalFolders[idx].name = name;
                } else if (type === 'project') {
                    const idx = this.internalProjects.findIndex(p => p.id === target.id);
                    if (idx !== -1) this.internalProjects[idx].name = name;
                }
            }
        },
        async duplicateProject() {
            this.closeContextMenu();
            const project = this.contextMenu.target;
            const newProject = {
                ...project,
                id: `proj_${Date.now()}`,
                name: `${project.name} (복사본)`,
                updatedAt: new Date().toISOString()
            };
            this.internalProjects.push(newProject);
        },
        
        // 유틸리티
        formatDate(isoString) {
            if (!isoString) return '-';
            try {
                const date = new Date(isoString);
                const now = new Date();
                const diff = now - date;
                
                if (diff < 60000) return '방금 전';
                if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
                if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
                if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
                
                return date.toLocaleDateString('ko-KR');
            } catch (e) {
                return isoString;
            }
        },
        getChildCount(folderId) {
            const folderCount = this.allFolders.filter(f => f.parentId === folderId).length;
            const projectCount = this.allProjects.filter(p => (p.folderId || 'root') === folderId).length;
            return folderCount + projectCount;
        }
    }
};

window.ProjectModal = ProjectModal;
