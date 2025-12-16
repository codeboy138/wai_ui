// Asset Manager Modal Component
// 영상, 이미지, 사운드 자산 관리 모달
// 레이어 템플릿 모달과 동일한 2패널 파일탐색기 스타일
// 미리보기/미리듣기 옵션 지원

const AssetManagerModal = {
    props: {
        assetType: {
            type: String,
            required: true,
            default: 'video' // 'video' | 'image' | 'sound'
        }
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
                        <span class="text-[11px] text-text-sub">
                            {{ filteredAssets.length }}개 {{ assetTypeLabel }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <!-- 자산 추가 -->
                        <button
                            id="asset-manager-add-btn"
                            class="px-2 py-1 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                            @click="addAsset"
                            :title="'새 ' + assetTypeLabel + ' 추가'"
                        >
                            <i class="fa-solid fa-plus"></i> 추가
                        </button>
                        <!-- 닫기 -->
                        <button
                            id="asset-manager-modal-close-btn"
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
                    <!-- 자산 타입 탭 -->
                    <div class="flex items-center gap-1">
                        <button
                            v-for="tab in assetTabs"
                            :key="tab.type"
                            class="px-3 py-1 text-[11px] rounded transition-colors"
                            :class="currentAssetType === tab.type ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                            @click="switchAssetType(tab.type)"
                        >
                            <i :class="tab.icon" class="mr-1"></i>
                            {{ tab.label }}
                        </button>
                    </div>
                    
                    <!-- 검색/필터/옵션 -->
                    <div class="flex items-center gap-2">
                        <!-- 미리보기/미리듣기 토글 -->
                        <div class="flex items-center gap-1 px-2 py-1 bg-bg-input rounded border border-ui-border">
                            <span class="text-[10px] text-text-sub">{{ previewToggleLabel }}</span>
                            <button
                                class="w-8 h-4 rounded-full transition-colors relative"
                                :class="previewEnabled ? 'bg-ui-accent' : 'bg-ui-border'"
                                @click="previewEnabled = !previewEnabled"
                            >
                                <span 
                                    class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform"
                                    :class="previewEnabled ? 'left-4' : 'left-0.5'"
                                ></span>
                            </button>
                        </div>
                        
                        <div class="w-px h-5 bg-ui-border"></div>
                        
                        <!-- 검색 -->
                        <div class="relative">
                            <input
                                type="text"
                                v-model="searchQuery"
                                :placeholder="assetTypeLabel + ' 검색...'"
                                class="w-48 h-7 bg-bg-input border border-ui-border rounded px-2 pr-7 text-[11px] focus:border-ui-accent focus:outline-none"
                            />
                            <i class="fa-solid fa-search absolute right-2 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                        </div>
                        
                        <!-- 보기 모드 -->
                        <div class="flex border border-ui-border rounded overflow-hidden">
                            <button 
                                class="px-2 py-1 text-[10px]"
                                :class="viewMode === 'grid' ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                                @click="viewMode = 'grid'"
                                title="그리드 보기"
                            >
                                <i class="fa-solid fa-grip"></i>
                            </button>
                            <button 
                                class="px-2 py-1 text-[10px]"
                                :class="viewMode === 'list' ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                                @click="viewMode = 'list'"
                                title="목록 보기"
                            >
                                <i class="fa-solid fa-list"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 메인 컨텐츠: 2패널 -->
                <div class="flex-1 flex overflow-hidden">
                    
                    <!-- 좌측: 폴더 트리 -->
                    <div 
                        id="asset-manager-folder-panel"
                        class="w-48 border-r border-ui-border bg-bg-dark flex flex-col shrink-0"
                    >
                        <div class="p-2 border-b border-ui-border bg-bg-panel">
                            <span class="text-[10px] text-text-sub font-bold uppercase tracking-wide">폴더</span>
                        </div>
                        <div class="flex-1 overflow-auto p-1">
                            <div 
                                v-for="folder in assetFolders"
                                :key="folder.id"
                                class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-[11px] transition-colors"
                                :class="{
                                    'bg-ui-selected text-white': currentFolderId === folder.id,
                                    'hover:bg-bg-hover': currentFolderId !== folder.id
                                }"
                                @click="currentFolderId = folder.id"
                            >
                                <i class="fa-solid fa-folder text-yellow-500"></i>
                                <span class="truncate flex-1">{{ folder.name }}</span>
                                <span class="text-[9px] text-text-sub">{{ getFolderAssetCount(folder.id) }}</span>
                            </div>
                        </div>
                        
                        <!-- 폴더 추가 버튼 -->
                        <div class="p-2 border-t border-ui-border">
                            <button
                                class="w-full px-2 py-1 text-[10px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover flex items-center justify-center gap-1"
                                @click="createFolder"
                            >
                                <i class="fa-solid fa-folder-plus"></i> 새 폴더
                            </button>
                        </div>
                    </div>

                    <!-- 우측: 자산 목록 -->
                    <div 
                        id="asset-manager-content-panel"
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
                                    추가일
                                    <i v-if="sortBy === 'date'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                </span>
                                <span 
                                    class="cursor-pointer hover:text-ui-accent flex items-center gap-1"
                                    :class="{ 'text-ui-accent': sortBy === 'size' }"
                                    @click="toggleSort('size')"
                                >
                                    크기
                                    <i v-if="sortBy === 'size'" :class="sortAsc ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'" class="text-[8px]"></i>
                                </span>
                            </div>
                            <span class="text-text-sub">
                                {{ filteredAssets.length }}개 항목
                            </span>
                        </div>

                        <!-- 자산 목록 -->
                        <div 
                            class="flex-1 overflow-auto p-3"
                            @contextmenu.prevent="openEmptyContextMenu($event)"
                        >
                            <!-- 빈 상태 -->
                            <div
                                v-if="filteredAssets.length === 0"
                                class="flex flex-col items-center justify-center h-full text-text-sub opacity-50"
                            >
                                <i :class="assetTypeIcon" class="text-4xl mb-3"></i>
                                <p class="text-[12px]">{{ assetTypeLabel }}이(가) 없습니다</p>
                                <p class="text-[11px] mt-1">파일을 추가하거나 드래그하여 가져오세요</p>
                            </div>

                            <!-- 그리드 보기 -->
                            <div 
                                v-else-if="viewMode === 'grid'" 
                                class="asset-grid view-grid"
                                :class="{ 'gap-4': previewEnabled }"
                            >
                                <div
                                    v-for="asset in filteredAssets"
                                    :key="asset.id"
                                    class="asset-card"
                                    :class="{ 'selected': selectedAssetId === asset.id }"
                                    @click="selectAsset(asset)"
                                    @dblclick="useAsset(asset)"
                                    @contextmenu.prevent="openAssetContextMenu($event, asset)"
                                    draggable="true"
                                    @dragstart="onAssetDragStart($event, asset)"
                                >
                                    <!-- 썸네일/미리보기 -->
                                    <div class="asset-thumbnail" :class="{ 'aspect-square': currentAssetType === 'sound' }">
                                        <!-- 영상 미리보기 -->
                                        <template v-if="currentAssetType === 'video'">
                                            <video 
                                                v-if="previewEnabled && asset.src"
                                                :src="asset.src"
                                                class="w-full h-full object-cover"
                                                muted
                                                loop
                                                @mouseenter="$event.target.play()"
                                                @mouseleave="$event.target.pause(); $event.target.currentTime = 0;"
                                            ></video>
                                            <img v-else-if="asset.thumbnail" :src="asset.thumbnail" class="w-full h-full object-cover" />
                                            <i v-else class="asset-thumbnail-icon fa-solid fa-film"></i>
                                        </template>
                                        
                                        <!-- 이미지 미리보기 -->
                                        <template v-else-if="currentAssetType === 'image'">
                                            <img 
                                                v-if="previewEnabled && asset.src"
                                                :src="asset.src"
                                                class="w-full h-full object-cover"
                                            />
                                            <img v-else-if="asset.thumbnail" :src="asset.thumbnail" class="w-full h-full object-cover" />
                                            <i v-else class="asset-thumbnail-icon fa-solid fa-image"></i>
                                        </template>
                                        
                                        <!-- 사운드 미리보기 -->
                                        <template v-else-if="currentAssetType === 'sound'">
                                            <div 
                                                v-if="previewEnabled" 
                                                class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-blue-900/30"
                                                @click.stop="toggleAudioPreview(asset)"
                                            >
                                                <div class="flex items-end gap-0.5 h-8">
                                                    <div 
                                                        v-for="i in 5" 
                                                        :key="i"
                                                        class="w-1 bg-ui-accent rounded-t transition-all"
                                                        :style="{ height: (playingAudioId === asset.id ? (Math.random() * 100) : 30) + '%' }"
                                                    ></div>
                                                </div>
                                                <i 
                                                    :class="playingAudioId === asset.id ? 'fa-solid fa-pause' : 'fa-solid fa-play'"
                                                    class="absolute text-white text-xl drop-shadow-lg"
                                                ></i>
                                            </div>
                                            <i v-else class="asset-thumbnail-icon fa-solid fa-music"></i>
                                        </template>
                                    </div>
                                    
                                    <!-- 정보 -->
                                    <div class="asset-info">
                                        <div class="asset-name">{{ asset.name }}</div>
                                        <div class="asset-meta">
                                            {{ formatDuration(asset.duration) }}
                                            <span v-if="asset.resolution"> · {{ asset.resolution }}</span>
                                            <span v-if="asset.size"> · {{ formatSize(asset.size) }}</span>
                                        </div>
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
