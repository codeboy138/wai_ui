// Asset Manager Modal Component - 프롬프트 탭 추가 버전
// 드래그앤드롭 + 리사이징 + 복수선택 + 파일업로드 + 최소화 + 타임라인 연동
// v2: 프롬프트 관리 탭 추가

var AssetManagerModal = {
    props: {
        assetType: { type: String, required: true, default: 'video' },
        initialTab: { type: String, default: '' }
    },
    emits: ['close', 'prompt-selected'],
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
                        <i :class="currentTabIcon" class="text-ui-accent"></i>\
                        <span class="text-[14px] font-bold">{{ currentTabTitle }} 관리</span>\
                        <span v-if="!isMinimized" class="text-[11px] text-text-sub">{{ currentAssetCount }}개 {{ currentTabLabel }}</span>\
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
                    <!-- 탭 네비게이션 -->\
                    <div class="flex items-center border-b border-ui-border bg-bg-panel px-2">\
                        <button \
                            v-for="tab in tabs" \
                            :key="tab.id" \
                            class="px-3 py-2 text-[11px] border-b-2 transition-colors"\
                            :class="currentTab === tab.id ? \'border-ui-accent text-ui-accent\' : \'border-transparent text-text-sub hover:text-text-main\'"\
                            @click.stop="switchTab(tab.id)"\
                        >\
                            <i :class="tab.icon" class="mr-1"></i>{{ tab.label }}\
                        </button>\
                    </div>\
\
                    <div class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-panel">\
                        <div class="flex items-center gap-2">\
                            <span class="text-[11px] text-text-sub">{{ currentTabLabel }} 목록</span>\
                            <span v-if="currentTab !== \'prompt\'" class="text-[10px] text-ui-accent">(Ctrl+클릭: 복수선택 / Shift+클릭: 범위선택)</span>\
                        </div>\
                        \
                        <div class="flex items-center gap-2">\
                            <div v-if="currentTab !== \'prompt\'" class="flex items-center gap-1 px-2 py-1 bg-bg-input rounded border border-ui-border">\
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
                            <div v-if="currentTab !== \'prompt\'" class="w-px h-5 bg-ui-border"></div>\
                            \
                            <div class="relative">\
                                <input type="text" v-model="searchQuery" :placeholder="currentTabLabel + \' 검색...\'" class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none" @mousedown.stop />\
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
                                    v-for="folder in currentFolders"\
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
                                <!-- 프롬프트 탭 콘텐츠 -->\
                                <template v-if="currentTab === \'prompt\'">\
                                    <div v-if="filteredPrompts.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">\
                                        <i class="fa-solid fa-file-lines text-4xl mb-3"></i>\
                                        <p class="text-[12px]">프롬프트가 없습니다</p>\
                                        <p class="text-[11px] mt-1">+ 추가 버튼으로 새 프롬프트를 만드세요</p>\
                                    </div>\
\
                                    <div v-else-if="viewMode === \'grid\'" class="asset-grid view-grid" :style="gridStyle">\
                                        <div\
                                            v-for="(prompt, index) in filteredPrompts"\
                                            :key="prompt.id"\
                                            class="asset-card relative"\
                                            :class="{ \'selected\': isAssetSelected(prompt.id) }"\
                                            @click.stop="handleAssetClick($event, prompt, index)"\
                                            @dblclick.stop="editPrompt(prompt)"\
                                            @contextmenu.prevent="openPromptContextMenu($event, prompt)"\
                                            draggable="true"\
                                            @dragstart="onPromptDragStart($event, prompt)"\
                                            @dragend="onDragEnd"\
                                        >\
                                            <div class="asset-thumbnail bg-gradient-to-br from-purple-600/20 to-blue-600/20">\
                                                <div class="absolute inset-0 p-2 flex flex-col justify-center">\
                                                    <i class="fa-solid fa-file-lines text-2xl text-purple-400 mx-auto mb-1"></i>\
                                                    <p class="text-[9px] text-text-sub text-center line-clamp-2 leading-tight">{{ prompt.content.substring(0, 50) }}...</p>\
                                                </div>\
                                            </div>\
                                            <div class="asset-info">\
                                                <div class="asset-name">{{ prompt.name }}</div>\
                                                <div class="asset-meta">{{ prompt.category || \'일반\' }}</div>\
                                            </div>\
                                        </div>\
                                    </div>\
\
                                    <div v-else class="asset-grid view-list">\
                                        <div\
                                            v-for="(prompt, index) in filteredPrompts"\
                                            :key="prompt.id"\
                                            class="asset-card relative"\
                                            :class="{ \'selected\': isAssetSelected(prompt.id) }"\
                                            @click.stop="handleAssetClick($event, prompt, index)"\
                                            @dblclick.stop="editPrompt(prompt)"\
                                            @contextmenu.prevent="openPromptContextMenu($event, prompt)"\
                                            draggable="true"\
                                            @dragstart="onPromptDragStart($event, prompt)"\
                                            @dragend="onDragEnd"\
                                        >\
                                            <div class="asset-thumbnail">\
                                                <i class="fa-solid fa-file-lines asset-thumbnail-icon-center text-purple-400"></i>\
                                            </div>\
                                            <div class="asset-info">\
                                                <div class="flex-1">\
                                                    <div class="asset-name">{{ prompt.name }}</div>\
                                                    <div class="asset-meta text-[9px] line-clamp-1">{{ prompt.content.substring(0, 80) }}...</div>\
                                                </div>\
                                                <div class="text-[10px] text-text-sub">{{ prompt.category || \'일반\' }}</div>\
                                            </div>\
                                        </div>\
                                    </div>\
                                </template>\
\
                                <!-- 기존 자산 탭 콘텐츠 -->\
                                <template v-else>\
                                    <div v-if="filteredAssets.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">\
                                        <i :class="currentTabIcon" class="text-4xl mb-3"></i>\
                                        <p class="text-[12px]">{{ currentTabLabel }}이(가) 없습니다</p>\
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
                                                <template v-if="currentTab === \'video\'">\
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
                                                <template v-else-if="currentTab === \'sound\'">\
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
                                                <i :class="currentTabIcon" class="asset-thumbnail-icon-center"></i>\
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
                                </template>\
                            </div>\
                        </div>\
                    </div>\
\
                    <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">\
                        <div class="text-text-sub">\
                            <span v-if="selectedAssetIds.length > 0">{{ selectedAssetIds.length }}개 선택됨</span>\
                            <span v-else>{{ currentFolderName }}</span>\
                        </div>\
                        <div class="flex items-center gap-2">\
                            <button v-if="selectedAssetIds.length > 0 && currentTab === \'prompt\'" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click.stop="applySelectedPrompt">적용</button>\
                            <button v-if="selectedAssetIds.length > 0 && currentTab !== \'prompt\'" class="px-3 py-1 bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors" @click.stop="useSelectedAssets">타임라인에 추가</button>\
                            <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors" @click.stop="$emit(\'close\')">닫기</button>\
                        </div>\
                    </div>\
                </template>\
            </div>\
\
            <!-- 프롬프트 컨텍스트 메뉴 -->\
            <div \
                v-if="promptContextMenu" \
                class="context-menu context-menu--compact"\
                :style="{ top: promptContextMenu.y + \'px\', left: promptContextMenu.x + \'px\' }"\
                @click.stop\
            >\
                <div class="ctx-item" @click="applyPromptFromContext">\
                    <i class="fa-solid fa-check"></i>\
                    <span>적용</span>\
                </div>\
                <div class="ctx-item" @click="editPromptFromContext">\
                    <i class="fa-solid fa-pen"></i>\
                    <span>편집</span>\
                </div>\
                <div class="ctx-item" @click="copyPromptFromContext">\
                    <i class="fa-solid fa-copy"></i>\
                    <span>복사</span>\
                </div>\
                <div class="ctx-item" @click="duplicatePromptFromContext">\
                    <i class="fa-solid fa-clone"></i>\
                    <span>복제</span>\
                </div>\
                <div class="ctx-item text-red-400 hover:!bg-ui-danger" @click="deletePromptFromContext">\
                    <i class="fa-solid fa-trash"></i>\
                    <span>삭제</span>\
                </div>\
            </div>\
\
            <!-- 프롬프트 편집 모달 -->\
            <div v-if="promptEditModal.isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" @click.self="closePromptEditModal">\
                <div class="bg-bg-panel border border-ui-border rounded-lg w-[500px] max-h-[80vh] flex flex-col shadow-2xl">\
                    <div class="flex items-center justify-between px-4 py-3 border-b border-ui-border">\
                        <span class="text-[13px] font-bold">{{ promptEditModal.isNew ? \'새 프롬프트\' : \'프롬프트 편집\' }}</span>\
                        <button class="text-text-sub hover:text-white" @click="closePromptEditModal">\
                            <i class="fa-solid fa-xmark"></i>\
                        </button>\
                    </div>\
                    <div class="flex-1 overflow-auto p-4 space-y-3">\
                        <div>\
                            <label class="text-[10px] text-text-sub block mb-1">이름</label>\
                            <input \
                                type="text" \
                                v-model="promptEditModal.name" \
                                class="w-full h-8 bg-bg-input border border-ui-border rounded px-3 text-[11px] focus:border-ui-accent focus:outline-none"\
                                placeholder="프롬프트 이름..."\
                            />\
                        </div>\
                        <div>\
                            <label class="text-[10px] text-text-sub block mb-1">카테고리</label>\
                            <select \
                                v-model="promptEditModal.category" \
                                class="w-full h-8 bg-bg-input border border-ui-border rounded px-2 text-[11px] focus:border-ui-accent focus:outline-none"\
                            >\
                                <option value="일반">일반</option>\
                                <option value="이미지">이미지</option>\
                                <option value="텍스트">텍스트</option>\
                                <option value="보이스">보이스</option>\
                                <option value="스타일">스타일</option>\
                            </select>\
                        </div>\
                        <div>\
                            <label class="text-[10px] text-text-sub block mb-1">내용</label>\
                            <textarea \
                                v-model="promptEditModal.content" \
                                class="w-full h-40 bg-bg-input border border-ui-border rounded p-3 text-[11px] focus:border-ui-accent focus:outline-none resize-none"\
                                placeholder="프롬프트 내용을 입력하세요..."\
                            ></textarea>\
                        </div>\
                    </div>\
                    <div class="flex justify-end gap-2 px-4 py-3 border-t border-ui-border">\
                        <button \
                            class="px-4 py-1.5 text-[11px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover"\
                            @click="closePromptEditModal"\
                        >취소</button>\
                        <button \
                            class="px-4 py-1.5 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600"\
                            @click="savePromptEdit"\
                        >저장</button>\
                    </div>\
                </div>\
            </div>\
        </div>\
    ',
    data: function() {
        return {
            currentTab: this.initialTab || this.assetType || 'video',
            tabs: [
                { id: 'video', label: '영상', icon: 'fa-solid fa-film' },
                { id: 'sound', label: '사운드', icon: 'fa-solid fa-music' },
                { id: 'prompt', label: '프롬프트', icon: 'fa-solid fa-file-lines' }
            ],
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
            promptContextMenu: null,
            promptEditModal: {
                isOpen: false,
                isNew: true,
                id: null,
                name: '',
                content: '',
                category: '일반'
            },
            assetFolders: [
                { id: 'all', name: '전체' },
                { id: 'recent', name: '최근 사용' },
                { id: 'favorites', name: '즐겨찾기' }
            ],
            promptFolders: [
                { id: 'all', name: '전체' },
                { id: 'image', name: '이미지용' },
                { id: 'text', name: '텍스트용' },
                { id: 'voice', name: '보이스용' },
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
            },
            prompts: [
                { id: 'p1', name: '지브리 스타일', content: 'Studio Ghibli style, soft lighting, warm colors, hand-drawn animation aesthetic, peaceful atmosphere, detailed backgrounds', category: '이미지', folderId: 'image', dateAdded: Date.now() - 100000 },
                { id: 'p2', name: '시네마틱 장면', content: 'Cinematic composition, dramatic lighting, film grain, anamorphic lens flare, movie poster quality, professional cinematography', category: '이미지', folderId: 'image', dateAdded: Date.now() - 200000 },
                { id: 'p3', name: '차분한 나레이션', content: '차분하고 신뢰감 있는 톤으로, 약간 낮은 목소리로 천천히 또박또박 읽어주세요. 문장 끝에서 짧은 휴지를 넣어주세요.', category: '보이스', folderId: 'voice', dateAdded: Date.now() - 300000 },
                { id: 'p4', name: '뉴스 앵커 스타일', content: '전문적이고 명확한 발음으로, 뉴스 앵커처럼 중립적인 톤을 유지하면서 중요한 단어에 약간의 강세를 넣어주세요.', category: '보이스', folderId: 'voice', dateAdded: Date.now() - 400000 },
                { id: 'p5', name: '제목 스타일', content: '굵은 글씨체, 그림자 효과, 중앙 정렬, 애니메이션 페이드인', category: '텍스트', folderId: 'text', dateAdded: Date.now() - 500000 }
            ]
        };
    },
/* 코드연결지점 */
/* 코드연결지점 */
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
            var gap = 12;
            var cols = Math.max(1, Math.floor((contentWidth + gap) / (minCardWidth + gap)));
            cols = Math.min(cols, 8);
            return {
                display: 'grid',
                gridTemplateColumns: 'repeat(' + cols + ', 1fr)',
                gap: gap + 'px'
            };
        },
        currentTabIcon: function() {
            var tab = this.tabs.find(function(t) { return t.id === this.currentTab; }.bind(this));
            return tab ? tab.icon : 'fa-solid fa-file';
        },
        currentTabTitle: function() {
            var titles = { video: '영상', sound: '사운드', prompt: '프롬프트' };
            return titles[this.currentTab] || '자산';
        },
        currentTabLabel: function() {
            var labels = { video: '영상', sound: '사운드', prompt: '프롬프트' };
            return labels[this.currentTab] || '자산';
        },
        currentAssetCount: function() {
            if (this.currentTab === 'prompt') {
                return this.filteredPrompts.length;
            }
            return this.filteredAssets.length;
        },
        previewToggleLabel: function() {
            return this.currentTab === 'sound' ? '미리듣기' : '미리보기';
        },
        currentFolderName: function() {
            var folders = this.currentFolders;
            var self = this;
            var folder = folders.find(function(f) { return f.id === self.currentFolderId; });
            return folder ? folder.name : '전체';
        },
        currentFolders: function() {
            if (this.currentTab === 'prompt') {
                return this.promptFolders;
            }
            return this.assetFolders;
        },
        fileAcceptTypes: function() {
            if (this.currentTab === 'video') return 'video/*';
            if (this.currentTab === 'sound') return 'audio/*';
            return '*/*';
        },
        filteredAssets: function() {
            var self = this;
            if (this.currentTab === 'prompt') return [];
            
            var assets = this.dummyAssets[this.currentTab] || [];
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
        },
        filteredPrompts: function() {
            var self = this;
            var prompts = this.prompts.slice();
            
            if (this.currentFolderId !== 'all') {
                prompts = prompts.filter(function(p) { return p.folderId === self.currentFolderId; });
            }
            if (this.searchQuery) {
                var q = this.searchQuery.toLowerCase();
                prompts = prompts.filter(function(p) { 
                    return p.name.toLowerCase().indexOf(q) >= 0 || p.content.toLowerCase().indexOf(q) >= 0; 
                });
            }
            prompts = prompts.sort(function(a, b) {
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
            return prompts;
        }
    },
    mounted: function() {
        this.centerWindow();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('click', this.closeContextMenus);
        
        if (this.initialTab) {
            this.currentTab = this.initialTab;
        }
    },
    beforeUnmount: function() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('click', this.closeContextMenus);
    },
    methods: {
        switchTab: function(tabId) {
            this.currentTab = tabId;
            this.currentFolderId = 'all';
            this.clearSelection();
            this.searchQuery = '';
        },
        closeContextMenus: function() {
            this.promptContextMenu = null;
        },
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
            if (e.target.closest('input, button, select, textarea, .asset-card, .folder-drop-zone, .modal-resize-handle, .context-menu')) return;
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
                this.closeContextMenus();
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
            if (this.currentTab === 'prompt') {
                this.selectedAssetIds = this.filteredPrompts.map(function(p) { return p.id; });
                this.lastSelectedIndex = this.filteredPrompts.length - 1;
            } else {
                this.selectedAssetIds = this.filteredAssets.map(function(a) { return a.id; });
                this.lastSelectedIndex = this.filteredAssets.length - 1;
            }
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
            if (e.ctrlKey || e.metaKey) {
                var idx = this.selectedAssetIds.indexOf(asset.id);
                if (idx >= 0) {
                    this.selectedAssetIds.splice(idx, 1);
                } else {
                    this.selectedAssetIds.push(asset.id);
                }
                this.lastSelectedIndex = index;
            } else if (e.shiftKey && this.lastSelectedIndex >= 0) {
                var items = this.currentTab === 'prompt' ? this.filteredPrompts : this.filteredAssets;
                var start = Math.min(this.lastSelectedIndex, index);
                var end = Math.max(this.lastSelectedIndex, index);
                var newSelection = [];
                for (var i = start; i <= end; i++) {
                    if (items[i]) {
                        newSelection.push(items[i].id);
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
        
        // 프롬프트 관련 메서드
        openPromptContextMenu: function(e, prompt) {
            e.preventDefault();
            this.promptContextMenu = {
                x: e.clientX,
                y: e.clientY,
                prompt: prompt
            };
        },
        applyPromptFromContext: function() {
            if (this.promptContextMenu && this.promptContextMenu.prompt) {
                this.$emit('prompt-selected', this.promptContextMenu.prompt);
                this.showToast('프롬프트가 적용되었습니다', 'success');
            }
            this.promptContextMenu = null;
        },
        editPromptFromContext: function() {
            if (this.promptContextMenu && this.promptContextMenu.prompt) {
                this.editPrompt(this.promptContextMenu.prompt);
            }
            this.promptContextMenu = null;
        },
        copyPromptFromContext: function() {
            if (this.promptContextMenu && this.promptContextMenu.prompt) {
                var content = this.promptContextMenu.prompt.content;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(content);
                    this.showToast('클립보드에 복사되었습니다', 'success');
                }
            }
            this.promptContextMenu = null;
        },
        duplicatePromptFromContext: function() {
            if (this.promptContextMenu && this.promptContextMenu.prompt) {
                var original = this.promptContextMenu.prompt;
                var newPrompt = {
                    id: 'p_' + Date.now(),
                    name: original.name + ' (복사본)',
                    content: original.content,
                    category: original.category,
                    folderId: original.folderId,
                    dateAdded: Date.now()
                };
                this.prompts.push(newPrompt);
                this.showToast('프롬프트가 복제되었습니다', 'success');
            }
            this.promptContextMenu = null;
        },
        deletePromptFromContext: function() {
            var self = this;
            if (this.promptContextMenu && this.promptContextMenu.prompt) {
                var promptId = this.promptContextMenu.prompt.id;
                this.prompts = this.prompts.filter(function(p) { return p.id !== promptId; });
                this.selectedAssetIds = this.selectedAssetIds.filter(function(id) { return id !== promptId; });
                this.showToast('프롬프트가 삭제되었습니다', 'info');
            }
            this.promptContextMenu = null;
        },
        editPrompt: function(prompt) {
            this.promptEditModal = {
                isOpen: true,
                isNew: false,
                id: prompt.id,
                name: prompt.name,
                content: prompt.content,
                category: prompt.category || '일반'
            };
        },
        addAsset: function() {
            if (this.currentTab === 'prompt') {
                this.promptEditModal = {
                    isOpen: true,
                    isNew: true,
                    id: null,
                    name: '',
                    content: '',
                    category: '일반'
                };
            } else if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        },
        closePromptEditModal: function() {
            this.promptEditModal.isOpen = false;
        },
        savePromptEdit: function() {
            var self = this;
            if (!this.promptEditModal.name.trim()) {
                this.showToast('프롬프트 이름을 입력하세요', 'warning');
                return;
            }
            if (!this.promptEditModal.content.trim()) {
                this.showToast('프롬프트 내용을 입력하세요', 'warning');
                return;
            }
            
            if (this.promptEditModal.isNew) {
                var newPrompt = {
                    id: 'p_' + Date.now(),
                    name: this.promptEditModal.name,
                    content: this.promptEditModal.content,
                    category: this.promptEditModal.category,
                    folderId: this.getFolderIdByCategory(this.promptEditModal.category),
                    dateAdded: Date.now()
                };
                this.prompts.push(newPrompt);
                this.showToast('프롬프트가 추가되었습니다', 'success');
            } else {
                var idx = -1;
                for (var i = 0; i < this.prompts.length; i++) {
                    if (this.prompts[i].id === this.promptEditModal.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx >= 0) {
                    this.prompts[idx] = Object.assign({}, this.prompts[idx], {
                        name: this.promptEditModal.name,
                        content: this.promptEditModal.content,
                        category: this.promptEditModal.category,
                        folderId: this.getFolderIdByCategory(this.promptEditModal.category)
                    });
                }
                this.showToast('프롬프트가 저장되었습니다', 'success');
            }
            
            this.closePromptEditModal();
        },
        getFolderIdByCategory: function(category) {
            var map = {
                '이미지': 'image',
                '텍스트': 'text',
                '보이스': 'voice',
                '스타일': 'all',
                '일반': 'all'
            };
            return map[category] || 'all';
        },
        applySelectedPrompt: function() {
            var self = this;
            if (this.selectedAssetIds.length === 0) return;
            
            var prompt = this.prompts.find(function(p) { 
                return p.id === self.selectedAssetIds[0]; 
            });
            if (prompt) {
                this.$emit('prompt-selected', prompt);
                this.showToast('프롬프트가 적용되었습니다', 'success');
            }
        },
        onPromptDragStart: function(e, prompt) {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/wai-prompt', JSON.stringify(prompt));
            
            var dragImage = document.createElement('div');
            dragImage.textContent = '📝 ' + prompt.name;
            dragImage.style.cssText = 'position:absolute;top:-1000px;padding:8px 16px;background:#8b5cf6;color:#fff;border-radius:6px;font-size:12px;font-weight:bold;white-space:nowrap;';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            setTimeout(function() {
                document.body.removeChild(dragImage);
            }, 0);
        },
        showToast: function(message, type) {
            if (typeof WAICB !== 'undefined' && WAICB.Toast) {
                WAICB.Toast[type || 'info'](message);
            } else if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info',
                    title: message,
                    showConfirmButton: false,
                    timer: 2000,
                    background: '#1e1e1e',
                    color: '#fff'
                });
            }
        },
        
        // 기존 자산 관련 메서드
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
            var transferData = [{
                type: this.currentTab,
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
                    type: self.currentTab,
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
                String(now.getMinutes()).padStart(2, '0') + 
                String(now.getSeconds()).padStart(2, '0');
            var folderId = 'folder_' + Date.now();
            
            this.assetFolders.push({ id: folderId, name: folderName });
            
            if (!this.dummyAssets[this.currentTab]) {
                this.dummyAssets[this.currentTab] = [];
            }
            
            var addedCount = 0;
            var expectedType = this.currentTab === 'video' ? 'video/' : 'audio/';
            
            for (var j = 0; j < files.length; j++) {
                var file = files[j];
                if (!file.type.startsWith(expectedType)) continue;
                
                var newAsset = {
                    id: self.currentTab + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    folderId: folderId,
                    duration: '00:00',
                    resolution: '',
                    src: URL.createObjectURL(file),
                    dateAdded: Date.now()
                };
                
                if (self.currentTab === 'video') {
                    (function(asset) {
                        var video = document.createElement('video');
                        video.preload = 'metadata';
                        video.onloadedmetadata = function() {
                            var dur = video.duration;
                            var min = Math.floor(dur / 60);
                            var sec = Math.floor(dur % 60);
                            asset.duration = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
                            asset.resolution = video.videoWidth + 'x' + video.videoHeight;
                        };
                        video.src = asset.src;
                    })(newAsset);
                } else if (self.currentTab === 'sound') {
                    (function(asset) {
                        var audio = document.createElement('audio');
                        audio.preload = 'metadata';
                        audio.onloadedmetadata = function() {
                            var dur = audio.duration;
                            var min = Math.floor(dur / 60);
                            var sec = Math.floor(dur % 60);
                            asset.duration = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
                        };
                        audio.src = asset.src;
                    })(newAsset);
                }
                
                this.dummyAssets[this.currentTab].push(newAsset);
                addedCount++;
            }
            
            if (addedCount > 0) {
                this.currentFolderId = folderId;
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
                    if (self.currentTab === 'prompt') {
                        self.promptFolders.push({ id: 'folder_' + Date.now(), name: result.value });
                    } else {
                        self.assetFolders.push({ id: 'folder_' + Date.now(), name: result.value });
                    }
                }
            });
        },
        getFolderAssetCount: function(folderId) {
            if (this.currentTab === 'prompt') {
                var prompts = this.prompts;
                if (folderId === 'all') return prompts.length;
                return prompts.filter(function(p) { return p.folderId === folderId; }).length;
            }
            
            var assets = this.dummyAssets[this.currentTab] || [];
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
                    type: self.currentTab,
                    id: a.id,
                    name: a.name,
                    src: a.src || '',
                    duration: a.duration || '00:10',
                    resolution: a.resolution || ''
                };
            });
            e.dataTransfer.setData('text/wai-asset', JSON.stringify(transferData));
            var dragImage = document.createElement('div');
            var icon = self.currentTab === 'video' ? '🎬' : '🎵';
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
            var assets = this.dummyAssets[this.currentTab] || [];
            for (var i = 0; i < assets.length; i++) {
                if (assets[i].id === asset.id) {
                    assets[i].folderId = targetFolderId;
                    break;
                }
            }
        }
    }
};

window.AssetManagerModal = AssetManagerModal;
