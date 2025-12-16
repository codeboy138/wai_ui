// Asset Manager Modal Component - 드래그앤드롭 지원 + 리사이징

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
                    <div class="flex items-center gap-2">
                        <span class="text-[11px] text-text-sub">{{ assetTypeTitle }} 목록</span>
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
                                <p class="text-[11px] mt-
