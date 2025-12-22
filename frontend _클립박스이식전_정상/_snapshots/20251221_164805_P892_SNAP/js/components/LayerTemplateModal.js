// Layer Template Modal Component (레이어 템플릿 관리 모달)
// AssetManagerModal 스타일 - 2패널 파일 탐색기, 리사이징, 드래그앤드롭 지원 + 최소화

const LayerTemplateModal = {
    props: {
        templates: {
            type: Array,
            required: true,
            default: () => []
        },
        folders: {
            type: Array,
            required: false,
            default: () => [{ id: 'root', name: '전체 템플릿', parentId: null, isExpanded: true }]
        }
    },
    emits: ['close', 'delete-template', 'load-template', 'update-templates', 'update-folders'],
    template: `
        <div
            id="layer-template-modal-overlay"
            class="modal-overlay"
            @click.self="$emit('close')"
            @contextmenu.prevent
        >
            <div
                id="layer-template-modal-window"
                class="layer-template-window bg-bg-panel border border-ui-border rounded-lg shadow-2xl text-[12px] text-text-main flex flex-col"
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
                    id="layer-template-modal-header"
                    class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-hover rounded-t-lg"
                    :class="isMinimized ? 'cursor-pointer' : 'cursor-move'"
                    @mousedown.stop="onHeaderMouseDown"
                    @dblclick="toggleMinimize"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-folder-tree text-ui-accent"></i>
                        <span class="text-[14px] font-bold">레이어 템플릿 관리</span>
                        <span v-if="!isMinimized" class="text-[11px] text-text-sub">
                            {{ allTemplates.length }}개 템플릿 · {{ allFolders.length - 1 }}개 폴더
                        </span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button
                            v-if="!isMinimized"
                            class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                            @click.stop="createNewFolder"
                            title="새 폴더 만들기"
                        >
                            <i class="fa-solid fa-folder-plus"></i> 새 폴더
                        </button>
                        <button
                            class="text-[14px] text-text-sub hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-bg-input transition-colors"
                            @click.stop="toggleMinimize"
                            :title="isMinimized ? '확장' : '최소화'"
                        >
                            <i :class="isMinimized ? 'fa-solid fa-expand' : 'fa-solid fa-minus'"></i>
                        </button>
                        <button
                            id="layer-template-modal-close-btn"
                            class="text-[14px] text-text-sub hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-ui-danger transition-colors"
                            @click.stop="$emit('close')"
                            title="닫기"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <template v-if="!isMinimized">
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
                                    placeholder="템플릿 검색..."
                                    class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none"
                                    @mousedown.stop
                                />
                                <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                            </div>
                            <!-- 보기 모드 -->
                            <div class="flex border border-ui-border rounded overflow-hidden">
                                <button 
                                    class="px-2 py-1 text-[10px]"
                                    :class="viewMode === 'list' ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                                    @click.stop="viewMode = 'list'"
                                    title="목록 보기"
                                >
                                    <i class="fa-solid fa-list"></i>
                                </button>
                                <button 
                                    class="px-2 py-1 text-[10px]"
                                    :class="viewMode === 'grid' ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                                    @click.stop="viewMode = 'grid'"
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
                            id="layer-template-folder-panel"
                            class="w-48 border-r border-ui-border bg-bg-dark flex flex-col shrink-0"
                        >
                            <div class="p-2 border-b border-ui-border bg-bg-panel">
                                <span class="text-[10px] text-text-sub font-bold uppercase tracking-wide">폴더</span>
                            </div>
                            <div class="flex-1 overflow-auto p-1">
                                <div 
                                    v-for="folder in rootFolders"
                                    :key="folder.id"
                                >
                                    <folder-tree-item
                                        :folder="folder"
                                        :all-folders="allFolders"
                                        :selected-folder-id="currentFolderId"
                                        :drag-over-folder-id="dragOverFolderId"
                                        @select="selectFolder"
                                        @toggle="toggleFolder"
                                        @contextmenu="openFolderContextMenu"
                                        @dragover="onFolderDragOver"
                                        @dragleave="onFolderDragLeave"
                                        @drop="onFolderDrop"
                                    ></folder-tree-item>
                                </div>
                            </div>
                        </div>

                        <!-- 우측: 파일 목록 -->
                        <div 
                            id="layer-template-file-panel"
                            class="flex-1 flex flex-col bg-bg-dark overflow-hidden"
                            @dragover.prevent="onFilePanelDragOver"
                            @dragleave="onFilePanelDragLeave"
                            @drop="onFilePanelDrop"
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
                                    <span 
                                        class="cursor-pointer hover:text-ui-accent flex items-center gap-1"
                                        :class="{ 'text-ui-accent': sortBy === 'layers' }"
                                        @click="toggleSort('layers')"
                                    >
                                        레이어 수
                                        <i v-if="sortBy === 'layers'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                    </span>
                                </div>
                                <span class="text-text-sub">
                                    {{ filteredItems.length }}개 항목
                                </span>
                            </div>

                            <!-- 파일/폴더 목록 -->
                            <div 
                                class="flex-1 overflow-auto p-2"
                                :class="{ 'drag-over': isFilePanelDragOver }"
                                @contextmenu.prevent="openEmptyAreaContextMenu($event)"
                            >
                                <!-- 빈 상태 -->
                                <div
                                    v-if="filteredItems.length === 0 && !searchQuery"
                                    class="flex flex-col items-center justify-center h-full text-text-sub opacity-50"
                                >
                                    <i class="fa-solid fa-folder-open text-4xl mb-3"></i>
                                    <p class="text-[12px]">이 폴더는 비어있습니다</p>
                                    <p class="text-[11px] mt-1">템플릿을 저장하거나 드래그하여 이동하세요</p>
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
                                        draggable="true"
                                        @dragstart="onDragStart($event, 'folder', folder)"
                                        @dragend="onDragEnd"
                                    >
                                        <i class="fa-solid fa-folder text-yellow-500 text-[14px]"></i>
                                        <span class="flex-1 truncate">{{ folder.name }}</span>
                                        <span class="text-[10px] text-text-sub opacity-0 group-hover:opacity-100">
                                            {{ getChildCount(folder.id) }}개 항목
                                        </span>
                                    </div>

                                    <!-- 템플릿들 -->
                                    <div
                                        v-for="tpl in filteredTemplates"
                                        :key="'tpl-' + tpl.id"
                                        class="flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-bg-hover group transition-colors"
                                        :class="{ 'bg-ui-selected': selectedItems.includes('template:' + tpl.id) }"
                                        @click="onItemClick($event, 'template', tpl)"
                                        @dblclick="loadTemplate(tpl)"
                                        @contextmenu.prevent="openTemplateContextMenu($event, tpl)"
                                        draggable="true"
                                        @dragstart="onDragStart($event, 'template', tpl)"
                                        @dragend="onDragEnd"
                                    >
                                        <i class="fa-solid fa-layer-group text-ui-accent text-[14px]"></i>
                                        <div class="flex-1 min-w-0">
                                            <div class="truncate">{{ tpl.name }}</div>
                                            <div class="text-[10px] text-text-sub">
                                                {{ formatDate(tpl.createdAt) }} · {{ getBoxCount(tpl) }}개 레이어
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                            <button 
                                                class="w-6 h-6 rounded hover:bg-ui-accent hover:text-white flex items-center justify-center"
                                                @click.stop="loadTemplate(tpl)"
                                                title="불러오기"
                                            >
                                                <i class="fa-solid fa-download text-[10px]"></i>
                                            </button>
                                            <button 
                                                class="w-6 h-6 rounded hover:bg-ui-danger hover:text-white flex items-center justify-center"
                                                @click.stop="deleteTemplate(tpl)"
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
                                        draggable="true"
                                        @dragstart="onDragStart($event, 'folder', folder)"
                                        @dragend="onDragEnd"
                                    >
                                        <i class="fa-solid fa-folder text-yellow-500 text-3xl mb-2"></i>
                                        <span class="text-[11px] truncate max-w-full text-center">{{ folder.name }}</span>
                                    </div>

                                    <!-- 템플릿들 -->
                                    <div
                                        v-for="tpl in filteredTemplates"
                                        :key="'tpl-' + tpl.id"
                                        class="flex flex-col items-center p-3 rounded-lg cursor-pointer hover:bg-bg-hover group transition-colors relative"
                                        :class="{ 'bg-ui-selected': selectedItems.includes('template:' + tpl.id) }"
                                        @click="onItemClick($event, 'template', tpl)"
                                        @dblclick="loadTemplate(tpl)"
                                        @contextmenu.prevent="openTemplateContextMenu($event, tpl)"
                                        draggable="true"
                                        @dragstart="onDragStart($event, 'template', tpl)"
                                        @dragend="onDragEnd"
                                    >
                                        <div class="w-12 h-12 bg-bg-input rounded-lg flex items-center justify-center mb-2 border border-ui-border">
                                            <i class="fa-solid fa-layer-group text-ui-accent text-xl"></i>
                                        </div>
                                        <span class="text-[11px] truncate max-w-full text-center">{{ tpl.name }}</span>
                                        <span class="text-[9px] text-text-sub">{{ getBoxCount(tpl) }}개 레이어</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 상태바 -->
                    <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                        <div class="text-text-sub">
                            <span v-if="selectedItems.length > 0">
                                {{ selectedItems.length }}개 선택됨
                            </span>
                            <span v-else>
                                {{ currentFolderName }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                v-if="selectedItems.length === 1 && selectedItems[0].startsWith('template:')"
                                class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors"
                                @click="loadSelectedTemplate"
                            >
                                불러오기
                            </button>
                            <button
                                class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors"
                                @click="$emit('close')"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </template>

                <!-- 컨텍스트 메뉴 -->
                <div
                    v-if="contextMenu.show"
                    class="context-menu fixed bg-bg-panel border border-ui-border rounded shadow-xl py-1 min-w-40 z-50"
                    :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
                    @click.stop
                >
                    <!-- 폴더 컨텍스트 메뉴 -->
                    <template v-if="contextMenu.type === 'folder'">
                        <div class="ctx-item" @click="openFolder">
                            <i class="fa-solid fa-folder-open w-4"></i>
                            <span>열기</span>
                        </div>
                        <div class="ctx-item" @click="renameItem">
                            <i class="fa-solid fa-pen w-4"></i>
                            <span>이름 바꾸기</span>
                            <span class="text-[9px] text-text-sub ml-auto">F2</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item" @click="createSubFolder">
                            <i class="fa-solid fa-folder-plus w-4"></i>
                            <span>하위 폴더 만들기</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item text-red-400 hover:!bg-ui-danger hover:!text-white" @click="deleteFolder">
                            <i class="fa-solid fa-trash w-4"></i>
                            <span>삭제</span>
                            <span class="text-[9px] ml-auto">Del</span>
                        </div>
                    </template>

                    <!-- 템플릿 컨텍스트 메뉴 -->
                    <template v-else-if="contextMenu.type === 'template'">
                        <div class="ctx-item" @click="loadContextTemplate">
                            <i class="fa-solid fa-download w-4"></i>
                            <span>불러오기</span>
                        </div>
                        <div class="ctx-item" @click="renameItem">
                            <i class="fa-solid fa-pen w-4"></i>
                            <span>이름 바꾸기</span>
                            <span class="text-[9px] text-text-sub ml-auto">F2</span>
                        </div>
                        <div class="ctx-item" @click="duplicateTemplate">
                            <i class="fa-solid fa-copy w-4"></i>
                            <span>복제</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item" @click="moveToFolder">
                            <i class="fa-solid fa-folder-arrow-up w-4"></i>
                            <span>다른 폴더로 이동</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item" @click="showTemplateInfo">
                            <i class="fa-solid fa-circle-info w-4"></i>
                            <span>상세 정보</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item text-red-400 hover:!bg-ui-danger hover:!text-white" @click="deleteContextTemplate">
                            <i class="fa-solid fa-trash w-4"></i>
                            <span>삭제</span>
                            <span class="text-[9px] ml-auto">Del</span>
                        </div>
                    </template>

                    <!-- 빈 영역 컨텍스트 메뉴 -->
                    <template v-else-if="contextMenu.type === 'empty'">
                        <div class="ctx-item" @click="createNewFolder">
                            <i class="fa-solid fa-folder-plus w-4"></i>
                            <span>새 폴더</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item" @click="pasteItem" :class="{ 'opacity-50 cursor-not-allowed': !clipboard }">
                            <i class="fa-solid fa-paste w-4"></i>
                            <span>붙여넣기</span>
                            <span class="text-[9px] text-text-sub ml-auto">Ctrl+V</span>
                        </div>
                        <div class="h-px bg-ui-border my-1"></div>
                        <div class="ctx-item" @click="selectAll">
                            <i class="fa-solid fa-check-double w-4"></i>
                            <span>모두 선택</span>
                            <span class="text-[9px] text-text-sub ml-auto">Ctrl+A</span>
                        </div>
                    </template>
                </div>

                <!-- 폴더 이동 모달 -->
                <div
                    v-if="moveModal.show"
                    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    @click.self="moveModal.show = false"
                >
                    <div class="bg-bg-panel border border-ui-border rounded-lg shadow-xl w-80 max-h-96 flex flex-col">
                        <div class="px-4 py-3 border-b border-ui-border font-bold text-[13px]">
                            이동할 폴더 선택
                        </div>
                        <div class="flex-1 overflow-auto p-2">
                            <div
                                v-for="folder in allFolders"
                                :key="folder.id"
                                class="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-bg-hover"
                                :class="{ 'bg-ui-selected': moveModal.targetFolderId === folder.id }"
                                :style="{ paddingLeft: (getFolderDepth(folder.id) * 16 + 12) + 'px' }"
                                @click="moveModal.targetFolderId = folder.id"
                            >
                                <i class="fa-solid fa-folder text-yellow-500"></i>
                                <span>{{ folder.name }}</span>
                            </div>
                        </div>
                        <div class="px-4 py-3 border-t border-ui-border flex justify-end gap-2">
                            <button
                                class="px-3 py-1.5 bg-bg-input border border-ui-border rounded text-[11px] hover:bg-bg-hover"
                                @click="moveModal.show = false"
                            >
                                취소
                            </button>
                            <button
                                class="px-3 py-1.5 bg-ui-accent text-white rounded text-[11px] hover:bg-blue-600"
                                @click="confirmMove"
                            >
                                이동
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 상세 정보 모달 -->
                <div
                    v-if="infoModal.show"
                    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    @click.self="infoModal.show = false"
                >
                    <div class="bg-bg-panel border border-ui-border rounded-lg shadow-xl w-96 flex flex-col">
                        <div class="px-4 py-3 border-b border-ui-border font-bold text-[13px] flex items-center justify-between">
                            <span>템플릿 상세 정보</span>
                            <button class="text-text-sub hover:text-white" @click="infoModal.show = false">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div class="p-4 space-y-3 text-[12px]" v-if="infoModal.template">
                            <div class="flex justify-between">
                                <span class="text-text-sub">이름</span>
                                <span class="font-bold">{{ infoModal.template.name }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-sub">생성일</span>
                                <span>{{ formatDateFull(infoModal.template.createdAt) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-sub">레이어 수</span>
                                <span>{{ getBoxCount(infoModal.template) }}개</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-text-sub">폴더</span>
                                <span>{{ getFolderName(infoModal.template.folderId) }}</span>
                            </div>
                            <div class="border-t border-ui-border pt-3">
                                <div class="text-text-sub mb-2">JSON 데이터</div>
                                <div class="bg-bg-dark border border-ui-border rounded p-2 max-h-32 overflow-auto">
                                    <pre class="text-[10px] text-text-sub font-mono whitespace-pre-wrap">{{ infoModal.template.matrixJson }}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    components: {
        'folder-tree-item': {
            props: ['folder', 'allFolders', 'selectedFolderId', 'dragOverFolderId', 'depth'],
            emits: ['select', 'toggle', 'contextmenu', 'dragover', 'dragleave', 'drop'],
            template: `
                <div>
                    <div
                        class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-[11px] transition-colors folder-drop-zone"
                        :class="{
                            'bg-ui-selected text-white': selectedFolderId === folder.id,
                            'hover:bg-bg-hover': selectedFolderId !== folder.id,
                            'drag-over': dragOverFolderId === folder.id
                        }"
                        :style="{ paddingLeft: ((depth || 0) * 12 + 8) + 'px' }"
                        @click="$emit('select', folder)"
                        @contextmenu.prevent.stop="$emit('contextmenu', $event, folder)"
                        @dragover.prevent="$emit('dragover', $event, folder)"
                        @dragleave="$emit('dragleave', $event, folder)"
                        @drop.prevent="$emit('drop', $event, folder)"
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
                        <folder-tree-item
                            v-for="child in childFolders"
                            :key="child.id"
                            :folder="child"
                            :all-folders="allFolders"
                            :selected-folder-id="selectedFolderId"
                            :drag-over-folder-id="dragOverFolderId"
                            :depth="(depth || 0) + 1"
                            @select="$emit('select', $event)"
                            @toggle="$emit('toggle', $event)"
                            @contextmenu="(e, f) => $emit('contextmenu', e, f)"
                            @dragover="(e, f) => $emit('dragover', e, f)"
                            @dragleave="(e, f) => $emit('dragleave', e, f)"
                            @drop="(e, f) => $emit('drop', e, f)"
                        ></folder-tree-item>
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
            width: 900,
            height: 600,
            minWidth: 600,
            minHeight: 400,
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
            
            // 리사이즈
            resizing: false,
            resizeDir: '',
            resizeStartX: 0,
            resizeStartY: 0,
            resizeStartW: 0,
            resizeStartH: 0,
            resizeStartPosX: 0,
            resizeStartPosY: 0,
            
            // 뷰 상태
            currentFolderId: 'root',
            viewMode: 'list',
            searchQuery: '',
            sortBy: 'name',
            sortAsc: true,
            
            // 선택 상태
            selectedItems: [],
            
            // 드래그 상태
            dragData: null,
            dragOverFolderId: null,
            isFilePanelDragOver: false,
            
            // 컨텍스트 메뉴
            contextMenu: {
                show: false,
                x: 0,
                y: 0,
                type: null,
                target: null
            },
            
            // 폴더 이동 모달
            moveModal: {
                show: false,
                items: [],
                targetFolderId: 'root'
            },
            
            // 상세 정보 모달
            infoModal: {
                show: false,
                template: null
            },
            
            // 클립보드
            clipboard: null,
            
            // 내부 데이터
            internalFolders: [],
            internalTemplates: []
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
        allFolders() {
            return this.internalFolders.length > 0 ? this.internalFolders : this.folders;
        },
        allTemplates() {
            return this.internalTemplates.length > 0 ? this.internalTemplates : this.templates;
        },
        rootFolders() {
            return this.allFolders.filter(f => f.parentId === null);
        },
        childFolders() {
            return this.allFolders.filter(f => f.parentId === this.currentFolderId);
        },
        currentFolderTemplates() {
            return this.allTemplates.filter(t => (t.folderId || 'root') === this.currentFolderId);
        },
        filteredTemplates() {
            let templates = this.currentFolderTemplates;
            
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                templates = templates.filter(t => t.name.toLowerCase().includes(q));
            }
            
            templates = [...templates].sort((a, b) => {
                let cmp = 0;
                if (this.sortBy === 'name') {
                    cmp = a.name.localeCompare(b.name);
                } else if (this.sortBy === 'date') {
                    cmp = new Date(b.createdAt) - new Date(a.createdAt);
                } else if (this.sortBy === 'layers') {
                    cmp = this.getBoxCount(b) - this.getBoxCount(a);
                }
                return this.sortAsc ? cmp : -cmp;
            });
            
            return templates;
        },
        filteredItems() {
            return [...this.childFolders, ...this.filteredTemplates];
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
            return folder ? folder.name : '전체 템플릿';
        }
    },
    watch: {
        templates: {
            immediate: true,
            handler(newVal) {
                this.internalTemplates = newVal.map(t => ({ ...t, folderId: t.folderId || 'root' }));
            }
        },
        folders: {
            immediate: true,
            handler(newVal) {
                if (newVal && newVal.length > 0) {
                    this.internalFolders = newVal.map(f => ({ ...f }));
                } else {
                    this.internalFolders = [{ id: 'root', name: '전체 템플릿', parentId: null, isExpanded: true }];
                }
            }
        }
    },
    mounted() {
        this.centerWindow();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
        document.addEventListener('click', this.closeContextMenu);
        document.addEventListener('keydown', this.onKeyDown);
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
        document.removeEventListener('click', this.closeContextMenu);
        document.removeEventListener('keydown', this.onKeyDown);
    },
    methods: {
        // 창 위치
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
            if (e.target.closest('input, button, select, .folder-drop-zone, .modal-resize-handle')) return;
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
            } else if (e.shiftKey) {
                this.selectedItems = [key];
            } else {
                this.selectedItems = [key];
            }
        },
        selectAll() {
            this.selectedItems = [
                ...this.childFolders.map(f => `folder:${f.id}`),
                ...this.filteredTemplates.map(t => `template:${t.id}`)
            ];
            this.closeContextMenu();
        },
        
        // 드래그 앤 드롭
        onDragStart(e, type, item) {
            this.dragData = { type, item };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({ type, id: item.id }));
        },
        onDragEnd() {
            this.dragData = null;
            this.dragOverFolderId = null;
            this.isFilePanelDragOver = false;
        },
        onFolderDragOver(e, folder) {
            e.preventDefault();
            if (this.dragData && folder.id !== this.dragData.item.id) {
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
            if (this.dragData) {
                this.moveItemToFolder(this.dragData.type, this.dragData.item, folder.id);
            }
            this.dragOverFolderId = null;
            this.dragData = null;
        },
        onFilePanelDragOver(e) {
            e.preventDefault();
            this.isFilePanelDragOver = true;
        },
        onFilePanelDragLeave(e) {
            this.isFilePanelDragOver = false;
        },
        onFilePanelDrop(e) {
            e.preventDefault();
            if (this.dragData) {
                this.moveItemToFolder(this.dragData.type, this.dragData.item, this.currentFolderId);
            }
            this.dragData = null;
            this.isFilePanelDragOver = false;
        },
        moveItemToFolder(type, item, targetFolderId) {
            if (type === 'template') {
                const idx = this.internalTemplates.findIndex(t => t.id === item.id);
                if (idx !== -1) {
                    this.internalTemplates[idx].folderId = targetFolderId;
                    this.$emit('update-templates', this.internalTemplates);
                }
            } else if (type === 'folder') {
                if (item.id === targetFolderId || this.isDescendant(item.id, targetFolderId)) {
                    return;
                }
                const idx = this.internalFolders.findIndex(f => f.id === item.id);
                if (idx !== -1) {
                    this.internalFolders[idx].parentId = targetFolderId;
                    this.$emit('update-folders', this.internalFolders);
                }
            }
        },
        isDescendant(parentId, childId) {
            let current = this.allFolders.find(f => f.id === childId);
            while (current) {
                if (current.parentId === parentId) return true;
                current = this.allFolders.find(f => f.id === current.parentId);
            }
            return false;
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
        openTemplateContextMenu(e, tpl) {
            this.contextMenu = {
                show: true,
                x: e.clientX,
                y: e.clientY,
                type: 'template',
                target: tpl
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
        
        // 폴더 CRUD
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
                this.$emit('update-folders', this.internalFolders);
            }
        },
        async createSubFolder() {
            this.closeContextMenu();
            const parentFolder = this.contextMenu.target;
            const { value: name } = await Swal.fire({
                title: '하위 폴더 만들기',
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
                    parentId: parentFolder.id,
                    isExpanded: false
                };
                this.internalFolders.push(newFolder);
                const idx = this.internalFolders.findIndex(f => f.id === parentFolder.id);
                if (idx !== -1) {
                    this.internalFolders[idx].isExpanded = true;
                }
                this.$emit('update-folders', this.internalFolders);
            }
        },
        async deleteFolder() {
            this.closeContextMenu();
            const folder = this.contextMenu.target;
            if (folder.id === 'root') {
                Swal.fire({ icon: 'error', title: '루트 폴더는 삭제할 수 없습니다', background: '#1e1e1e', color: '#fff' });
                return;
            }
            
            const childCount = this.getChildCount(folder.id);
            const result = await Swal.fire({
                title: '폴더 삭제',
                text: childCount > 0 ? `"${folder.name}" 폴더와 포함된 ${childCount}개 항목을 삭제하시겠습니까?` : `"${folder.name}" 폴더를 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
            
            if (result.isConfirmed) {
                const foldersToDelete = this.getAllDescendantFolders(folder.id);
                foldersToDelete.push(folder.id);
                
                this.internalFolders = this.internalFolders.filter(f => !foldersToDelete.includes(f.id));
                this.internalTemplates = this.internalTemplates.filter(t => !foldersToDelete.includes(t.folderId));
                
                if (foldersToDelete.includes(this.currentFolderId)) {
                    this.currentFolderId = folder.parentId || 'root';
                }
                
                this.$emit('update-folders', this.internalFolders);
                this.$emit('update-templates', this.internalTemplates);
            }
        },
        getAllDescendantFolders(folderId) {
            const descendants = [];
            const children = this.allFolders.filter(f => f.parentId === folderId);
            for (const child of children) {
                descendants.push(child.id);
                descendants.push(...this.getAllDescendantFolders(child.id));
            }
            return descendants;
        },
        openFolder() {
            this.closeContextMenu();
            this.navigateToFolder(this.contextMenu.target.id);
        },
        
        // 템플릿 CRUD
        async loadTemplate(tpl) {
            const result = await Swal.fire({
                title: '템플릿 불러오기',
                text: `"${tpl.name}" 템플릿을 불러오시겠습니까?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '불러오기',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            });
            if (result.isConfirmed) {
                this.$emit('load-template', tpl);
                this.$emit('close');
            }
        },
        loadContextTemplate() {
            this.closeContextMenu();
            this.loadTemplate(this.contextMenu.target);
        },
        loadSelectedTemplate() {
            const selected = this.selectedItems[0];
            if (selected && selected.startsWith('template:')) {
                const id = selected.replace('template:', '');
                const tpl = this.allTemplates.find(t => t.id === id);
                if (tpl) this.loadTemplate(tpl);
            }
        },
        async deleteTemplate(tpl) {
            const result = await Swal.fire({
                title: '템플릿 삭제',
                text: `"${tpl.name}" 템플릿을 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
            if (result.isConfirmed) {
                this.internalTemplates = this.internalTemplates.filter(t => t.id !== tpl.id);
                this.$emit('update-templates', this.internalTemplates);
                this.$emit('delete-template', tpl.id);
            }
        },
        deleteContextTemplate() {
            this.closeContextMenu();
            this.deleteTemplate(this.contextMenu.target);
        },
        async duplicateTemplate() {
            this.closeContextMenu();
            const tpl = this.contextMenu.target;
            const { value: name } = await Swal.fire({
                title: '템플릿 복제',
                input: 'text',
                inputValue: `${tpl.name} (복사본)`,
                showCancelButton: true,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            });
            if (name) {
                const newTpl = {
                    ...tpl,
                    id: `tpl_${Date.now()}`,
                    name,
                    createdAt: new Date().toISOString()
                };
                this.internalTemplates.push(newTpl);
                this.$emit('update-templates', this.internalTemplates);
            }
        },
        
        // 이름 변경
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
                    if (idx !== -1) {
                        this.internalFolders[idx].name = name;
                        this.$emit('update-folders', this.internalFolders);
                    }
                } else if (type === 'template') {
                    const idx = this.internalTemplates.findIndex(t => t.id === target.id);
                    if (idx !== -1) {
                        this.internalTemplates[idx].name = name;
                        this.$emit('update-templates', this.internalTemplates);
                    }
                }
            }
        },
        
        // 이동 모달
        moveToFolder() {
            this.closeContextMenu();
            this.moveModal.items = [{ type: 'template', item: this.contextMenu.target }];
            this.moveModal.targetFolderId = this.currentFolderId;
            this.moveModal.show = true;
        },
        confirmMove() {
            for (const { type, item } of this.moveModal.items) {
                this.moveItemToFolder(type, item, this.moveModal.targetFolderId);
            }
            this.moveModal.show = false;
        },
        
        // 상세 정보
        showTemplateInfo() {
            this.closeContextMenu();
            this.infoModal.template = this.contextMenu.target;
            this.infoModal.show = true;
        },
        
        // 붙여넣기
        pasteItem() {
            this.closeContextMenu();
            if (!this.clipboard) return;
        },
        
        // 키보드 단축키
        onKeyDown(e) {
            if (!this.$el) return;
            
            if (e.key === 'Delete' && this.selectedItems.length > 0) {
                e.preventDefault();
            }
            if (e.key === 'F2' && this.selectedItems.length === 1) {
                e.preventDefault();
            }
            if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.selectAll();
            }
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
        formatDateFull(isoString) {
            if (!isoString) return '-';
            try {
                return new Date(isoString).toLocaleString('ko-KR');
            } catch (e) {
                return isoString;
            }
        },
        getBoxCount(tpl) {
            if (tpl.matrixJson) {
                try {
                    const parsed = JSON.parse(tpl.matrixJson);
                    if (parsed.canvasBoxes && Array.isArray(parsed.canvasBoxes)) {
                        return parsed.canvasBoxes.length;
                    }
                } catch (e) {}
            }
            return 0;
        },
        getChildCount(folderId) {
            const folderCount = this.allFolders.filter(f => f.parentId === folderId).length;
            const templateCount = this.allTemplates.filter(t => (t.folderId || 'root') === folderId).length;
            return folderCount + templateCount;
        },
        getFolderDepth(folderId) {
            let depth = 0;
            let current = this.allFolders.find(f => f.id === folderId);
            while (current && current.parentId) {
                depth++;
                current = this.allFolders.find(f => f.id === current.parentId);
            }
            return depth;
        },
        getFolderName(folderId) {
            const folder = this.allFolders.find(f => f.id === folderId);
            return folder ? folder.name : '전체 템플릿';
        }
    }
};

window.LayerTemplateModal = LayerTemplateModal;
