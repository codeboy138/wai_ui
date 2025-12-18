// API Manager Modal Component
// - 좌측: API 종류 선택
// - 우측: 시트 형식 API 키 관리 (CRUD + 대량 붙여넣기)
// - 리사이징 핸들: 모서리/변 드래그로 크기 조절
// - 최소화 지원

const ApiManagerModal = {
    emits: ['close'],
    template: `
        <div
            id="api-manager-modal-overlay"
            class="modal-overlay"
            @click.self="$emit('close')"
            @contextmenu.prevent
        >
            <div
                id="api-manager-modal-window"
                class="api-manager-window bg-bg-panel border border-ui-border rounded-lg shadow-2xl text-[12px] text-text-main flex flex-col"
                :style="windowStyle"
                @mousedown="onWindowMouseDown"
            >
                <!-- 리사이징 핸들 -->
                <div class="modal-resize-handle resize-n" @mousedown.stop.prevent="onResizeStart($event, 'n')"></div>
                <div class="modal-resize-handle resize-s" @mousedown.stop.prevent="onResizeStart($event, 's')"></div>
                <div class="modal-resize-handle resize-e" @mousedown.stop.prevent="onResizeStart($event, 'e')"></div>
                <div class="modal-resize-handle resize-w" @mousedown.stop.prevent="onResizeStart($event, 'w')"></div>
                <div class="modal-resize-handle resize-nw" @mousedown.stop.prevent="onResizeStart($event, 'nw')"></div>
                <div class="modal-resize-handle resize-ne" @mousedown.stop.prevent="onResizeStart($event, 'ne')"></div>
                <div class="modal-resize-handle resize-sw" @mousedown.stop.prevent="onResizeStart($event, 'sw')"></div>
                <div class="modal-resize-handle resize-se" @mousedown.stop.prevent="onResizeStart($event, 'se')"></div>

                <!-- 헤더 -->
                <div
                    id="api-manager-modal-header"
                    class="flex items-center justify-between px-4 py-2 border-b border-ui-border bg-bg-hover rounded-t-lg"
                    :class="isMinimized ? 'cursor-pointer' : 'cursor-move'"
                    @mousedown.stop="onHeaderMouseDown"
                    @dblclick="toggleMinimize"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-key text-ui-accent"></i>
                        <span class="text-[14px] font-bold">API 관리</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button class="text-[14px] text-text-sub hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-bg-input transition-colors" @click.stop="toggleMinimize" :title="isMinimized ? '확장' : '최소화'">
                            <i :class="isMinimized ? 'fa-solid fa-expand' : 'fa-solid fa-minus'"></i>
                        </button>
                        <button class="text-[14px] text-text-sub hover:text-white w-7 h-7 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit('close')">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <template v-if="!isMinimized">
                    <!-- 메인 컨텐츠 -->
                    <div class="flex-1 flex overflow-hidden">
                        <!-- 좌측: API 종류 -->
                        <div class="w-48 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">
                            <div class="p-3 border-b border-ui-border bg-bg-panel">
                                <span class="text-[11px] text-text-sub font-bold">API 종류</span>
                            </div>
                            <div class="flex-1 overflow-auto p-2 space-y-1">
                                <div
                                    v-for="service in services"
                                    :key="service.id"
                                    class="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors"
                                    :class="currentService === service.id ? 'bg-ui-accent text-white' : 'hover:bg-bg-hover text-text-sub'"
                                    @click="selectService(service.id)"
                                >
                                    <i :class="service.icon" class="w-4 text-center"></i>
                                    <span class="flex-1 text-[11px]">{{ service.label }}</span>
                                    <span class="text-[10px] px-1.5 py-0.5 rounded" :class="currentService === service.id ? 'bg-white/20' : 'bg-bg-panel'">
                                        {{ getServiceCount(service.id) }}
                                    </span>
                                </div>
                            </div>
                            <div class="p-2 border-t border-ui-border">
                                <button 
                                    class="w-full px-3 py-2 text-[11px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors flex items-center justify-center gap-2"
                                    @click="openAddServiceModal"
                                >
                                    <i class="fa-solid fa-plus"></i> API 종류 추가
                                </button>
                            </div>
                        </div>

                        <!-- 우측: API 키 시트 -->
                        <div class="flex-1 flex flex-col bg-bg-dark overflow-hidden">
                            <!-- 툴바 -->
                            <div class="flex items-center justify-between px-3 py-2 border-b border-ui-border bg-bg-panel gap-2">
                                <div class="flex items-center gap-2">
                                    <button 
                                        class="px-3 py-1.5 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                                        @click="addNewKey"
                                    >
                                        <i class="fa-solid fa-plus"></i> 추가
                                    </button>
                                    <button 
                                        class="px-3 py-1.5 text-[11px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors flex items-center gap-1"
                                        @click="openBulkPasteModal"
                                    >
                                        <i class="fa-solid fa-paste"></i> 붙여넣기
                                    </button>
                                    <button 
                                        class="px-3 py-1.5 text-[11px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors flex items-center gap-1"
                                        @click="exportKeys"
                                    >
                                        <i class="fa-solid fa-download"></i> 내보내기
                                    </button>
                                    <button 
                                        class="px-3 py-1.5 text-[11px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors flex items-center gap-1"
                                        :class="{ 'text-ui-accent': showMasked }"
                                        @click="showMasked = !showMasked"
                                    >
                                        <i :class="showMasked ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                    </button>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="relative">
                                        <input 
                                            type="text" 
                                            v-model="searchQuery"
                                            class="w-48 h-7 bg-bg-input border border-ui-border rounded pl-8 pr-3 text-[11px] focus:border-ui-accent focus:outline-none"
                                            placeholder="검색..."
                                            @mousedown.stop
                                        />
                                        <i class="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                                    </div>
                                    <select 
                                        v-model="statusFilter"
                                        class="h-7 bg-bg-input border border-ui-border rounded px-2 text-[11px] focus:border-ui-accent focus:outline-none"
                                        @mousedown.stop
                                    >
                                        <option value="all">전체 상태</option>
                                        <option value="active">활성</option>
                                        <option value="standby">대기</option>
                                        <option value="error">오류</option>
                                    </select>
                                </div>
                            </div>

                            <!-- 시트 헤더 -->
                            <div class="flex items-center bg-bg-panel border-b border-ui-border text-[10px] text-text-sub font-bold">
                                <div class="w-10 h-8 flex items-center justify-center border-r border-ui-border">
                                    <input 
                                        type="checkbox" 
                                        class="w-3 h-3"
                                        :checked="isAllSelected"
                                        @change="toggleSelectAll"
                                    />
                                </div>
                                <div class="w-16 h-8 flex items-center justify-center border-r border-ui-border">상태</div>
                                <div class="w-20 h-8 flex items-center justify-center border-r border-ui-border">사용량</div>
                                <div class="w-28 h-8 flex items-center px-2 border-r border-ui-border">계정명</div>
                                <div class="w-28 h-8 flex items-center px-2 border-r border-ui-border">키이름</div>
                                <div class="flex-1 h-8 flex items-center px-2 border-r border-ui-border">API KEY</div>
                                <div class="w-32 h-8 flex items-center px-2 border-r border-ui-border">메모</div>
                                <div class="w-24 h-8 flex items-center justify-center">작업</div>
                            </div>

                            <!-- 시트 바디 -->
                            <div class="flex-1 overflow-auto">
                                <div v-if="filteredKeys.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">
                                    <i class="fa-solid fa-key text-3xl mb-3"></i>
                                    <p class="text-[12px]">등록된 API 키가 없습니다</p>
                                    <p class="text-[10px] mt-1">위의 '추가' 또는 '붙여넣기' 버튼을 사용하세요</p>
                                </div>
                                
                                <div 
                                    v-for="(key, index) in filteredKeys" 
                                    :key="key.id"
                                    class="flex items-center border-b border-ui-border hover:bg-bg-hover/50 transition-colors"
                                    :class="{ 'bg-ui-accent/10': selectedKeys.includes(key.id) }"
                                >
                                    <!-- 체크박스 -->
                                    <div class="w-10 h-10 flex items-center justify-center border-r border-ui-border">
                                        <input 
                                            type="checkbox" 
                                            class="w-3 h-3"
                                            :checked="selectedKeys.includes(key.id)"
                                            @change="toggleSelect(key.id)"
                                        />
                                    </div>
                                    
                                    <!-- 상태 -->
                                    <div class="w-16 h-10 flex items-center justify-center border-r border-ui-border">
                                        <button 
                                            class="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                            :class="getStatusButtonClass(key.status)"
                                            @click="cycleStatus(key)"
                                            :title="getStatusTitle(key.status)"
                                        >
                                            <i :class="getStatusIcon(key.status)" class="text-[10px]"></i>
                                        </button>
                                    </div>
                                    
                                    <!-- 사용량 -->
                                    <div class="w-20 h-10 flex items-center justify-center border-r border-ui-border">
                                        <div class="w-14 h-2 bg-bg-input rounded-full overflow-hidden" :title="key.usage + '/' + key.quota">
                                            <div 
                                                class="h-full transition-all"
                                                :class="getUsageBarClass(key)"
                                                :style="{ width: getUsagePercent(key) + '%' }"
                                            ></div>
                                        </div>
                                        <span class="text-[9px] text-text-sub ml-1">{{ getUsagePercent(key) }}%</span>
                                    </div>
                                    
                                    <!-- 계정명 -->
                                    <div class="w-28 h-10 flex items-center border-r border-ui-border px-1">
                                        <input 
                                            type="text"
                                            class="w-full h-7 bg-transparent border border-transparent hover:border-ui-border focus:border-ui-accent focus:bg-bg-input rounded px-1 text-[11px] transition-colors"
                                            v-model="key.accountName"
                                            @blur="saveKey(key)"
                                            @mousedown.stop
                                        />
                                    </div>
                                    
                                    <!-- 키이름 -->
                                    <div class="w-28 h-10 flex items-center border-r border-ui-border px-1">
                                        <input 
                                            type="text"
                                            class="w-full h-7 bg-transparent border border-transparent hover:border-ui-border focus:border-ui-accent focus:bg-bg-input rounded px-1 text-[11px] transition-colors"
                                            v-model="key.keyName"
                                            @blur="saveKey(key)"
                                            @mousedown.stop
                                        />
                                    </div>
                                    
                                    <!-- API KEY -->
                                    <div class="flex-1 h-10 flex items-center border-r border-ui-border px-1">
                                        <input 
                                            :type="showMasked ? 'password' : 'text'"
                                            class="w-full h-7 bg-transparent border border-transparent hover:border-ui-border focus:border-ui-accent focus:bg-bg-input rounded px-1 text-[11px] font-mono transition-colors"
                                            v-model="key.apiKey"
                                            @blur="saveKey(key)"
                                            @mousedown.stop
                                        />
                                    </div>
                                    
                                    <!-- 메모 -->
                                    <div class="w-32 h-10 flex items-center border-r border-ui-border px-1">
                                        <input 
                                            type="text"
                                            class="w-full h-7 bg-transparent border border-transparent hover:border-ui-border focus:border-ui-accent focus:bg-bg-input rounded px-1 text-[11px] transition-colors"
                                            v-model="key.memo"
                                            placeholder="메모..."
                                            @blur="saveKey(key)"
                                            @mousedown.stop
                                        />
                                    </div>
                                    
                                    <!-- 작업 -->
                                    <div class="w-24 h-10 flex items-center justify-center gap-1">
                                        <button 
                                            class="w-6 h-6 rounded flex items-center justify-center text-text-sub hover:text-ui-accent hover:bg-bg-hover transition-colors"
                                            @click="testKey(key)"
                                            title="연결 테스트"
                                        >
                                            <i class="fa-solid fa-plug text-[10px]"></i>
                                        </button>
                                        <button 
                                            class="w-6 h-6 rounded flex items-center justify-center text-text-sub hover:text-white hover:bg-bg-hover transition-colors"
                                            @click="copyKey(key)"
                                            title="키 복사"
                                        >
                                            <i class="fa-solid fa-copy text-[10px]"></i>
                                        </button>
                                        <button 
                                            class="w-6 h-6 rounded flex items-center justify-center text-text-sub hover:text-ui-danger hover:bg-bg-hover transition-colors"
                                            @click="deleteKey(key)"
                                            title="삭제"
                                        >
                                            <i class="fa-solid fa-trash text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- 선택 항목 액션 바 -->
                            <div v-if="selectedKeys.length > 0" class="flex items-center justify-between px-3 py-2 border-t border-ui-border bg-bg-panel">
                                <span class="text-[11px] text-text-sub">{{ selectedKeys.length }}개 선택됨</span>
                                <div class="flex items-center gap-2">
                                    <button 
                                        class="px-3 py-1 text-[11px] bg-ui-success text-white rounded hover:bg-green-600 transition-colors"
                                        @click="activateSelected"
                                    >
                                        활성화
                                    </button>
                                    <button 
                                        class="px-3 py-1 text-[11px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors"
                                        @click="testSelected"
                                    >
                                        일괄 테스트
                                    </button>
                                    <button 
                                        class="px-3 py-1 text-[11px] bg-ui-danger text-white rounded hover:bg-red-600 transition-colors"
                                        @click="deleteSelected"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 상태바 -->
                    <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                        <div class="flex items-center gap-4 text-text-sub">
                            <span>총 <span class="text-text-main font-bold">{{ currentServiceKeys.length }}</span>개 API 키</span>
                            <span>활성 <span class="text-ui-success font-bold">{{ activeCount }}</span>개</span>
                            <span v-if="autoRotation" class="text-ui-accent"><i class="fa-solid fa-sync mr-1"></i>자동 순환</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <span class="text-text-sub">자동 순환</span>
                                <button
                                    class="w-10 h-5 rounded-full transition-colors relative"
                                    :class="autoRotation ? 'bg-ui-accent' : 'bg-ui-border'"
                                    @click="autoRotation = !autoRotation"
                                >
                                    <span class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="autoRotation ? 'left-5' : 'left-0.5'"></span>
                                </button>
                            </label>
                            <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors ml-2" @click="$emit('close')">닫기</button>
                        </div>
                    </div>
                </template>
            </div>

            <!-- 대량 붙여넣기 모달 -->
            <div v-if="bulkPasteModal.isOpen" class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60" @click.self="closeBulkPasteModal">
                <div class="bg-bg-panel border border-ui-border rounded-lg shadow-2xl w-[600px] max-w-[95vw]" @mousedown.stop>
                    <div class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover rounded-t-lg">
                        <span class="text-[13px] font-bold">대량 붙여넣기</span>
                        <button class="text-text-sub hover:text-white" @click="closeBulkPasteModal">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="p-4 space-y-4">
                        <div>
                            <label class="block text-[11px] text-text-sub mb-2">붙여넣기 형식 선택</label>
                            <div class="flex gap-2">
                                <button 
                                    v-for="fmt in pasteFormats"
                                    :key="fmt.id"
                                    class="px-3 py-1.5 text-[11px] rounded border transition-colors"
                                    :class="bulkPasteModal.format === fmt.id ? 'bg-ui-accent text-white border-ui-accent' : 'bg-bg-input border-ui-border hover:bg-bg-hover'"
                                    @click="bulkPasteModal.format = fmt.id"
                                >
                                    {{ fmt.label }}
                                </button>
                            </div>
                            <p class="text-[10px] text-text-sub mt-2">{{ getFormatDescription(bulkPasteModal.format) }}</p>
                        </div>
                        <div>
                            <label class="block text-[11px] text-text-sub mb-2">데이터 붙여넣기 (탭/줄바꿈 구분)</label>
                            <textarea 
                                v-model="bulkPasteModal.data"
                                class="w-full h-48 bg-bg-input border border-ui-border rounded p-3 text-[11px] font-mono focus:border-ui-accent focus:outline-none resize-none"
                                placeholder="엑셀이나 스프레드시트에서 복사한 데이터를 붙여넣으세요...&#10;&#10;예시 (계정명/키이름/API KEY):&#10;main	key1	AIzaSyB1234567890&#10;sub	key2	AIzaSyC0987654321"
                                @paste="handleBulkPaste"
                                @mousedown.stop
                            ></textarea>
                        </div>
                        <div v-if="bulkPasteModal.preview.length > 0" class="border border-ui-border rounded overflow-hidden">
                            <div class="bg-bg-panel px-3 py-2 text-[11px] font-bold border-b border-ui-border">
                                미리보기 ({{ bulkPasteModal.preview.length }}개)
                            </div>
                            <div class="max-h-32 overflow-auto">
                                <div 
                                    v-for="(item, idx) in bulkPasteModal.preview.slice(0, 5)" 
                                    :key="idx"
                                    class="flex items-center px-3 py-1.5 text-[10px] border-b border-ui-border last:border-b-0"
                                >
                                    <span class="w-6 text-text-sub">{{ idx + 1 }}</span>
                                    <span class="flex-1 truncate">{{ item.accountName || '-' }}</span>
                                    <span class="flex-1 truncate">{{ item.keyName || '-' }}</span>
                                    <span class="flex-1 truncate font-mono">{{ maskApiKey(item.apiKey) }}</span>
                                </div>
                                <div v-if="bulkPasteModal.preview.length > 5" class="px-3 py-1.5 text-[10px] text-text-sub text-center">
                                    ... 외 {{ bulkPasteModal.preview.length - 5 }}개
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 px-4 py-3 border-t border-ui-border bg-bg-panel rounded-b-lg">
                        <button 
                            class="px-4 py-1.5 text-[11px] bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors"
                            @click="closeBulkPasteModal"
                        >
                            취소
                        </button>
                        <button 
                            class="px-4 py-1.5 text-[11px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors"
                            :disabled="bulkPasteModal.preview.length === 0"
                            @click="applyBulkPaste"
                        >
                            {{ bulkPasteModal.preview.length }}개 추가
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            // 윈도우 위치/크기
            posX: 0, 
            posY: 0,
            width: 1000,
            height: 650,
            minWidth: 700,
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
            
            // 리사이징 상태
            resizing: false,
            resizeDirection: null,
            resizeStartMouseX: 0,
            resizeStartMouseY: 0,
            resizeStartPosX: 0,
            resizeStartPosY: 0,
            resizeStartWidth: 0,
            resizeStartHeight: 0,
            
            // 서비스 목록
            services: [
                { id: 'youtube', label: 'YouTube Data API', icon: 'fa-brands fa-youtube' },
                { id: 'gemini', label: 'Gemini API', icon: 'fa-solid fa-robot' },
                { id: 'openai', label: 'OpenAI API', icon: 'fa-solid fa-brain' },
                { id: 'claude', label: 'Claude API', icon: 'fa-solid fa-comments' }
            ],
            currentService: 'youtube',
            
            // API 키 데이터
            apiKeys: [
                { id: 'yt1', service: 'youtube', status: 'active', usage: 3420, quota: 10000, accountName: 'main', keyName: 'primary', apiKey: 'AIzaSyB1234567890abcdefghijklmnop', memo: '메인 프로젝트용' },
                { id: 'yt2', service: 'youtube', status: 'standby', usage: 0, quota: 10000, accountName: 'sub', keyName: 'backup', apiKey: 'AIzaSyC0987654321zyxwvutsrqponmlk', memo: '백업용' },
                { id: 'gm1', service: 'gemini', status: 'active', usage: 12, quota: 60, accountName: 'main', keyName: 'gemini-1', apiKey: 'sk-gemini-abcdef123456789', memo: 'AI 기능용' }
            ],
            
            // 선택/필터
            selectedKeys: [],
            searchQuery: '',
            statusFilter: 'all',
            showMasked: true,
            autoRotation: true,
            
            // 붙여넣기 형식
            pasteFormats: [
                { id: 'full', label: '계정명/키이름/API KEY' },
                { id: 'key-only', label: 'API KEY만' },
                { id: 'name-key', label: '키이름/API KEY' }
            ],
            
            // 대량 붙여넣기 모달
            bulkPasteModal: {
                isOpen: false,
                format: 'full',
                data: '',
                preview: []
            }
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
        currentServiceKeys() {
            return this.apiKeys.filter(k => k.service === this.currentService);
        },
        filteredKeys() {
            let keys = this.currentServiceKeys;
            
            // 상태 필터
            if (this.statusFilter !== 'all') {
                keys = keys.filter(k => k.status === this.statusFilter);
            }
            
            // 검색
            if (this.searchQuery.trim()) {
                const q = this.searchQuery.toLowerCase();
                keys = keys.filter(k => 
                    (k.accountName && k.accountName.toLowerCase().includes(q)) ||
                    (k.keyName && k.keyName.toLowerCase().includes(q)) ||
                    (k.apiKey && k.apiKey.toLowerCase().includes(q)) ||
                    (k.memo && k.memo.toLowerCase().includes(q))
                );
            }
            
            return keys;
        },
        isAllSelected() {
            return this.filteredKeys.length > 0 && this.filteredKeys.every(k => this.selectedKeys.includes(k.id));
        },
        activeCount() {
            return this.currentServiceKeys.filter(k => k.status === 'active').length;
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
        // 윈도우 중앙 배치
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
        
        // 창 전체 드래그
        onWindowMouseDown(e) {
            if (e.target.closest('input, button, select, textarea, .modal-resize-handle')) return;
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
        
        // 리사이징 시작
        onResizeStart(e, direction) {
            if (this.isMinimized) return;
            this.resizing = true;
            this.resizeDirection = direction;
            this.resizeStartMouseX = e.clientX;
            this.resizeStartMouseY = e.clientY;
            this.resizeStartPosX = this.posX;
            this.resizeStartPosY = this.posY;
            this.resizeStartWidth = this.width;
            this.resizeStartHeight = this.height;
        },
        
        // 전역 마우스 이동
        onGlobalMouseMove(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
                this.clampPosition();
            } else if (this.resizing) {
                const dx = e.clientX - this.resizeStartMouseX;
                const dy = e.clientY - this.resizeStartMouseY;
                const dir = this.resizeDirection;
                
                let newX = this.resizeStartPosX;
                let newY = this.resizeStartPosY;
                let newW = this.resizeStartWidth;
                let newH = this.resizeStartHeight;
                
                // 방향별 크기/위치 조정
                if (dir.includes('e')) {
                    newW = Math.max(this.minWidth, this.resizeStartWidth + dx);
                }
                if (dir.includes('w')) {
                    const proposedW = this.resizeStartWidth - dx;
                    if (proposedW >= this.minWidth) {
                        newW = proposedW;
                        newX = this.resizeStartPosX + dx;
                    } else {
                        newW = this.minWidth;
                        newX = this.resizeStartPosX + (this.resizeStartWidth - this.minWidth);
                    }
                }
                if (dir.includes('s')) {
                    newH = Math.max(this.minHeight, this.resizeStartHeight + dy);
                }
                if (dir.includes('n')) {
                    const proposedH = this.resizeStartHeight - dy;
                    if (proposedH >= this.minHeight) {
                        newH = proposedH;
                        newY = this.resizeStartPosY + dy;
                    } else {
                        newH = this.minHeight;
                        newY = this.resizeStartPosY + (this.resizeStartHeight - this.minHeight);
                    }
                }
                
                this.posX = newX;
                this.posY = newY;
                this.width = newW;
                this.height = newH;
            }
        },
        
        // 전역 마우스 업
        onGlobalMouseUp() { 
            this.dragging = false;
            this.resizing = false;
            this.resizeDirection = null;
        },
        
        // 서비스 선택
        selectService(serviceId) {
            this.currentService = serviceId;
            this.selectedKeys = [];
        },
        getServiceCount(serviceId) {
            return this.apiKeys.filter(k => k.service === serviceId).length;
        },
        
        // 상태 관련
        getStatusButtonClass(status) {
            switch(status) {
                case 'active': return 'bg-ui-success text-white';
                case 'standby': return 'bg-bg-input border border-ui-border text-text-sub';
                case 'error': return 'bg-ui-danger text-white';
                default: return 'bg-bg-input border border-ui-border text-text-sub';
            }
        },
        getStatusIcon(status) {
            switch(status) {
                case 'active': return 'fa-solid fa-check';
                case 'standby': return 'fa-solid fa-pause';
                case 'error': return 'fa-solid fa-xmark';
                default: return 'fa-solid fa-question';
            }
        },
        getStatusTitle(status) {
            switch(status) {
                case 'active': return '활성 (클릭하여 변경)';
                case 'standby': return '대기 (클릭하여 변경)';
                case 'error': return '오류 (클릭하여 변경)';
                default: return '상태 변경';
            }
        },
        cycleStatus(key) {
            const states = ['active', 'standby', 'error'];
            const idx = states.indexOf(key.status);
            key.status = states[(idx + 1) % states.length];
        },
        
        // 사용량
        getUsagePercent(key) {
            if (!key.quota) return 0;
            return Math.min(100, Math.round((key.usage / key.quota) * 100));
        },
        getUsageBarClass(key) {
            const pct = this.getUsagePercent(key);
            if (pct >= 90) return 'bg-ui-danger';
            if (pct >= 70) return 'bg-yellow-500';
            return 'bg-ui-accent';
        },
        
        // 선택
        toggleSelect(id) {
            const idx = this.selectedKeys.indexOf(id);
            if (idx >= 0) {
                this.selectedKeys.splice(idx, 1);
            } else {
                this.selectedKeys.push(id);
            }
        },
        toggleSelectAll() {
            if (this.isAllSelected) {
                this.selectedKeys = [];
            } else {
                this.selectedKeys = this.filteredKeys.map(k => k.id);
            }
        },
        
        // CRUD
        addNewKey() {
            const newKey = {
                id: `key_${Date.now()}`,
                service: this.currentService,
                status: 'standby',
                usage: 0,
                quota: this.currentService === 'youtube' ? 10000 : 60,
                accountName: '',
                keyName: '',
                apiKey: '',
                memo: ''
            };
            this.apiKeys.push(newKey);
        },
        saveKey(key) {
            // 중복 검사
            const duplicate = this.apiKeys.find(k => 
                k.id !== key.id && 
                k.apiKey === key.apiKey && 
                key.apiKey.trim() !== ''
            );
            if (duplicate) {
                Swal.fire({
                    icon: 'warning',
                    title: '중복 키',
                    text: '동일한 API 키가 이미 등록되어 있습니다.',
                    background: '#1e1e1e',
                    color: '#fff',
                    confirmButtonColor: '#3b82f6'
                });
            }
            // 실제로는 여기서 저장 로직 수행
        },
        async deleteKey(key) {
            const result = await Swal.fire({
                title: '삭제 확인',
                text: `"${key.keyName || key.accountName || 'API 키'}"를 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
            if (result.isConfirmed) {
                const idx = this.apiKeys.findIndex(k => k.id === key.id);
                if (idx >= 0) {
                    this.apiKeys.splice(idx, 1);
                    this.selectedKeys = this.selectedKeys.filter(id => id !== key.id);
                }
            }
        },
        async deleteSelected() {
            if (this.selectedKeys.length === 0) return;
            
            const result = await Swal.fire({
                title: '일괄 삭제',
                text: `선택한 ${this.selectedKeys.length}개의 API 키를 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
            if (result.isConfirmed) {
                this.apiKeys = this.apiKeys.filter(k => !this.selectedKeys.includes(k.id));
                this.selectedKeys = [];
            }
        },
        
        // 기타 액션
        copyKey(key) {
            navigator.clipboard.writeText(key.apiKey);
            Swal.fire({
                icon: 'success',
                title: '복사됨',
                text: 'API 키가 클립보드에 복사되었습니다.',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1000,
                showConfirmButton: false
            });
        },
        async testKey(key) {
            Swal.fire({
                title: '테스트 중...',
                text: 'API 연결을 확인하고 있습니다.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); },
                background: '#1e1e1e',
                color: '#fff'
            });
            
            await new Promise(r => setTimeout(r, 1500));
            
            // 시뮬레이션: 랜덤 결과
            const success = Math.random() > 0.2;
            key.status = success ? 'active' : 'error';
            
            Swal.fire({
                icon: success ? 'success' : 'error',
                title: success ? '연결 성공' : '연결 실패',
                text: success ? 'API 키가 정상적으로 작동합니다.' : 'API 키를 확인해주세요.',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1500,
                showConfirmButton: false
            });
        },
        async testSelected() {
            if (this.selectedKeys.length === 0) return;
            
            for (const id of this.selectedKeys) {
                const key = this.apiKeys.find(k => k.id === id);
                if (key) await this.testKey(key);
            }
        },
        activateSelected() {
            for (const id of this.selectedKeys) {
                const key = this.apiKeys.find(k => k.id === id);
                if (key) key.status = 'active';
            }
            this.selectedKeys = [];
        },
        
        // 내보내기
        exportKeys() {
            const keys = this.currentServiceKeys;
            const csv = [
                ['상태', '사용량', '할당량', '계정명', '키이름', 'API KEY', '메모'].join('\t'),
                ...keys.map(k => [
                    k.status,
                    k.usage,
                    k.quota,
                    k.accountName,
                    k.keyName,
                    k.apiKey,
                    k.memo
                ].join('\t'))
            ].join('\n');
            
            const blob = new Blob([csv], { type: 'text/tab-separated-values' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `api-keys-${this.currentService}-${Date.now()}.tsv`;
            a.click();
            URL.revokeObjectURL(url);
        },
        
        // 대량 붙여넣기
        openBulkPasteModal() {
            this.bulkPasteModal.isOpen = true;
            this.bulkPasteModal.data = '';
            this.bulkPasteModal.preview = [];
        },
        closeBulkPasteModal() {
            this.bulkPasteModal.isOpen = false;
        },
        getFormatDescription(format) {
            switch(format) {
                case 'full': return '탭으로 구분된 3열: 계정명, 키이름, API KEY';
                case 'key-only': return 'API KEY만 한 줄에 하나씩';
                case 'name-key': return '탭으로 구분된 2열: 키이름, API KEY';
                default: return '';
            }
        },
        handleBulkPaste(e) {
            // 붙여넣기 이벤트에서 데이터 파싱
            setTimeout(() => this.parseBulkData(), 10);
        },
        parseBulkData() {
            const data = this.bulkPasteModal.data.trim();
            if (!data) {
                this.bulkPasteModal.preview = [];
                return;
            }
            
            const lines = data.split('\n').filter(l => l.trim());
            const format = this.bulkPasteModal.format;
            const preview = [];
            
            for (const line of lines) {
                const parts = line.split('\t').map(p => p.trim());
                let item = {
                    accountName: '',
                    keyName: '',
                    apiKey: ''
                };
                
                switch(format) {
                    case 'full':
                        item.accountName = parts[0] || '';
                        item.keyName = parts[1] || '';
                        item.apiKey = parts[2] || parts[0] || '';
                        break;
                    case 'key-only':
                        item.apiKey = parts[0] || '';
                        item.keyName = `key-${preview.length + 1}`;
                        break;
                    case 'name-key':
                        item.keyName = parts[0] || '';
                        item.apiKey = parts[1] || parts[0] || '';
                        break;
                }
                
                if (item.apiKey) {
                    preview.push(item);
                }
            }
            
            this.bulkPasteModal.preview = preview;
        },
        applyBulkPaste() {
            const preview = this.bulkPasteModal.preview;
            if (preview.length === 0) return;
            
            for (const item of preview) {
                // 중복 검사
                const exists = this.apiKeys.find(k => k.apiKey === item.apiKey);
                if (exists) continue;
                
                this.apiKeys.push({
                    id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    service: this.currentService,
                    status: 'standby',
                    usage: 0,
                    quota: this.currentService === 'youtube' ? 10000 : 60,
                    accountName: item.accountName,
                    keyName: item.keyName,
                    apiKey: item.apiKey,
                    memo: ''
                });
            }
            
            Swal.fire({
                icon: 'success',
                title: '추가 완료',
                text: `${preview.length}개의 API 키가 추가되었습니다.`,
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6',
                timer: 1500,
                showConfirmButton: false
            });
            
            this.closeBulkPasteModal();
        },
        
        // 유틸
        maskApiKey(key) {
            if (!key || key.length < 10) return '••••••••';
            return key.substring(0, 6) + '••••••' + key.substring(key.length - 4);
        },
        openAddServiceModal() {
            Swal.fire({
                title: 'API 종류 추가',
                input: 'text',
                inputPlaceholder: 'API 이름 (예: Custom API)',
                showCancelButton: true,
                confirmButtonText: '추가',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#3b82f6'
            }).then(result => {
                if (result.isConfirmed && result.value) {
                    const id = result.value.toLowerCase().replace(/\s+/g, '-');
                    if (!this.services.find(s => s.id === id)) {
                        this.services.push({
                            id,
                            label: result.value,
                            icon: 'fa-solid fa-key'
                        });
                        this.currentService = id;
                    }
                }
            });
        }
    },
    watch: {
        'bulkPasteModal.data'() {
            this.parseBulkData();
        },
        'bulkPasteModal.format'() {
            this.parseBulkData();
        }
    }
};

window.ApiManagerModal = ApiManagerModal;
