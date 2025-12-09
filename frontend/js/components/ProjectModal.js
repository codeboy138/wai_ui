import { store } from '../store.js';

export default {
    template: `
        <div class="modal-overlay" @click="$emit('close')">
            <div class="modal-window flex flex-col bg-bg-panel border border-ui-border rounded-lg shadow-2xl overflow-hidden w-[900px] h-[600px]" @click.stop>
                <div class="h-12 border-b border-ui-border flex items-center justify-between px-4 bg-bg-panel shrink-0">
                    <div class="flex items-center gap-3"><i class="fa-solid fa-folder-tree text-ui-accent"></i><span class="font-bold text-text-main">프로젝트 관리</span></div>
                    <div class="flex items-center gap-3">
                        <div class="relative"><i class="fa-solid fa-search absolute left-2 top-1/2 -translate-y-1/2 text-text-sub text-xs"></i><input type="text" placeholder="검색..." v-model="searchQuery" class="bg-bg-input border border-ui-border rounded pl-8 pr-2 py-1 text-xs text-text-main w-48"/></div>
                        <button @click="$emit('close')" class="w-8 h-8 flex items-center justify-center hover:bg-ui-danger hover:text-white rounded text-text-sub"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>

                <div class="flex-1 flex overflow-hidden">
                    <div class="w-60 border-r border-ui-border bg-bg-panel flex flex-col">
                        <div class="p-2 border-b border-ui-border text-[10px] font-bold text-text-sub flex justify-between"><span>EXPLORER</span><i class="fa-solid fa-plus hover:text-white cursor-pointer"></i></div>
                        <div class="flex-1 overflow-y-auto p-2 space-y-1">
                            <div v-for="folder in store.fileSystem.folders" :key="folder.id" class="tree-node" :class="{ 'active': selectedFolderId === folder.id }" @click="selectedFolderId = folder.id">
                                <i class="fa-solid fa-folder text-yellow-500"></i><span>{{ folder.name }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 bg-bg-dark flex flex-col relative" @click="activeFileMenu = null">
                        <div class="h-10 border-b border-ui-border flex items-center px-4 justify-between bg-bg-hover/50">
                            <div class="text-xs text-text-sub">Path: <span class="text-text-main font-bold">/ Root</span></div>
                            <div class="flex gap-2">
                                <button class="tool-btn bg-ui-accent text-white px-3 w-auto gap-1"><i class="fa-solid fa-file-circle-plus"></i> New</button>
                                <button class="tool-btn hover:bg-ui-danger hover:text-white" :disabled="!selectedFileId" @click="deleteFile"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        
                        <div class="file-row header text-[10px] uppercase select-none bg-bg-panel">
                            <div @click="sortBy('name')">Name</div><div @click="sortBy('type')">Type</div><div @click="sortBy('size')">Size</div><div>Action</div>
                        </div>

                        <div class="flex-1 overflow-y-auto">
                            <div v-for="file in filteredFiles" :key="file.id" 
                                 class="file-row group cursor-pointer relative"
                                 :class="{'selected': selectedFileId === file.id}"
                                 @click.stop="selectedFileId = file.id; activeFileMenu = null">
                                <div class="flex items-center gap-2 overflow-hidden"><i :class="getFileIcon(file.type)" class="text-lg shrink-0"></i><span class="truncate">{{ file.name }}</span></div>
                                <div>{{ file.type.toUpperCase() }}</div>
                                <div>{{ file.size }}</div>
                                
                                <div class="flex justify-end">
                                    <button class="w-6 h-6 hover:text-white text-text-sub flex items-center justify-center" 
                                            @click.stop="toggleFileMenu(file.id, $event)">
                                        <i class="fa-solid fa-ellipsis-vertical"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-if="activeFileMenu" class="context-menu" :style="{ top: menuPos.y + 'px', right: '20px' }">
                            <div class="px-3 py-2 hover:bg-ui-accent hover:text-white cursor-pointer text-xs" @click="renameFile(activeFileMenu)">이름 변경</div>
                            <div class="px-3 py-2 hover:bg-ui-accent hover:text-white cursor-pointer text-xs" @click="showInfo(activeFileMenu)">정보 보기</div>
                            <div class="border-t border-[#333] my-1"></div>
                            <div class="px-3 py-2 hover:bg-ui-danger hover:text-white cursor-pointer text-xs" @click="deleteFileById(activeFileMenu)">삭제</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return { 
            store, searchQuery: '', selectedFolderId: 'f1', selectedFileId: null, 
            activeFileMenu: null, menuPos: { x: 0, y: 0 } 
        };
    },
    computed: {
        filteredFiles() { return this.store.fileSystem.files.filter(f => f.name.toLowerCase().includes(this.searchQuery.toLowerCase())); }
    },
    methods: {
        getFileIcon(t) { return t==='video'?'fa-file-video text-blue-400':(t==='image'?'fa-file-image text-purple-400':'fa-file text-gray-500'); },
        toggleFileMenu(fid, e) {
            this.activeFileMenu = (this.activeFileMenu === fid) ? null : fid;
            const rect = e.currentTarget.getBoundingClientRect();
            // 모달 내부 기준 위치 계산 (간소화)
            this.menuPos = { y: rect.top }; // Y만 맞춤, X는 우측 정렬
        },
        deleteFile() { if(this.selectedFileId) this.deleteFileById(this.selectedFileId); },
        deleteFileById(id) { 
            this.store.fileSystem.files = this.store.fileSystem.files.filter(f => f.id !== id);
            this.activeFileMenu = null;
        },
        renameFile(id) { alert('이름 변경 기능 (구현 예정): ' + id); this.activeFileMenu = null; },
        sortBy(k) { console.log('Sort by', k); }
    }
}