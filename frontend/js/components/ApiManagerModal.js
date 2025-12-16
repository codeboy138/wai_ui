// API Manager Modal Component - YouTube Data API v3 / Gemini API 순환관리 및 CRUD

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
                @mousedown.stop
            >
                <!-- 헤더 -->
                <div
                    id="api-manager-modal-header"
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-key text-ui-accent"></i>
                        <span class="text-[14px] font-bold">API 관리</span>
                        <span class="text-[11px] text-text-sub">{{ totalApiCount }}개 API 키 등록됨</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="text-[14px] text-text-sub hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit('close')">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <!-- 서비스 탭 -->
                <div class="flex items-center px-4 py-2 border-b border-ui-border bg-bg-panel gap-2">
                    <button
                        v-for="tab in serviceTabs"
                        :key="tab.id"
                        class="px-4 py-1.5 text-[11px] rounded transition-colors flex items-center gap-2"
                        :class="currentService === tab.id ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub hover:bg-bg-hover'"
                        @click="currentService = tab.id"
                    >
                        <i :class="tab.icon"></i>{{ tab.label }}
                        <span class="px-1.5 py-0.5 rounded text-[9px]" :class="currentService === tab.id ? 'bg-white/20' : 'bg-bg-hover'">{{ getServiceApiCount(tab.id) }}</span>
                    </button>
                </div>

                <!-- 메인 컨텐츠 -->
                <div class="flex-1 flex overflow-hidden">
                    <!-- 좌측: API 목록 -->
                    <div class="w-72 border-r border-ui-border bg-bg-dark flex flex-col shrink-0">
                        <div class="p-3 border-b border-ui-border bg-bg-panel flex items-center justify-between">
                            <span class="text-[11px] text-text-sub font-bold">{{ currentServiceLabel }} API 키</span>
                            <button 
                                class="px-2 py-1 text-[10px] bg-ui-accent text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                                @click="addNewApi"
                            >
                                <i class="fa-solid fa-plus"></i> 추가
                            </button>
                        </div>
                        
                        <div class="flex-1 overflow-auto p-2 space-y-2">
                            <div v-if="currentServiceApis.length === 0" class="flex flex-col items-center justify-center h-full text-text-sub opacity-50">
                                <i class="fa-solid fa-key text-2xl mb-2"></i>
                                <p class="text-[11px]">등록된 API 키가 없습니다</p>
                            </div>
                            
                            <div
                                v-for="(api, index) in currentServiceApis"
                                :key="api.id"
                                class="api-card p-3 cursor-pointer"
                                :class="{ 
                                    'active': api.isActive,
                                    'border-ui-accent': selectedApiId === api.id 
                                }"
                                @click="selectApi(api)"
                            >
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-[11px] font-medium truncate flex-1">{{ api.name }}</span>
                                    <div class="flex items-center gap-1">
                                        <span v-if="api.isActive" class="px-1.5 py-0.5 text-[9px] bg-ui-success text-white rounded">활성</span>
                                        <span class="text-[9px] text-text-sub">#{{ index + 1 }}</span>
                                    </div>
                                </div>
                                <div class="text-[10px] text-text-sub font-mono truncate">{{ maskApiKey(api.key) }}</div>
                                <div class="flex items-center justify-between mt-2 text-[9px] text-text-sub">
                                    <span>사용량: {{ api.usage || 0 }} / {{ api.quota || '무제한' }}</span>
                                    <span :class="getStatusClass(api.status)">{{ api.status }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 순환 설정 -->
                        <div class="p-3 border-t border-ui-border bg-bg-panel">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-[10px] text-text-sub font-bold">자동 순환</span>
                                <button
                                    class="w-10 h-5 rounded-full transition-colors relative"
                                    :class="rotationEnabled ? 'bg-ui-accent' : 'bg-ui-border'"
                                    @click="rotationEnabled = !rotationEnabled"
                                >
                                    <span class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform" :class="rotationEnabled ? 'left-5' : 'left-0.5'"></span>
                                </button>
                            </div>
                            <p class="text-[9px] text-text-sub">할당량 초과 시 다음 API 키로 자동 전환</p>
                        </div>
                    </div>

                    <!-- 우측: API 상세 정보 / 편집 -->
                    <div class="flex-1 flex flex-col bg-bg-dark overflow-hidden">
                        <div v-if="!selectedApi" class="flex-1 flex flex-col items-center justify-center text-text-sub opacity-50">
                            <i class="fa-solid fa-arrow-left text-3xl mb-3"></i>
                            <p class="text-[12px]">좌측에서 API 키를 선택하세요</p>
                        </div>
                        
                        <template v-else>
                            <!-- 상세 정보 헤더 -->
                            <div class="p-4 border-b border-ui-border bg-bg-panel">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h3 class="text-[14px] font-bold">{{ selectedApi.name }}</h3>
                                        <p class="text-[10px] text-text-sub mt-1">{{ currentServiceLabel }} API</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button 
                                            v-if="!selectedApi.isActive"
                                            class="px-3 py-1.5 text-[11px] bg-ui-success text-white rounded hover:bg-green-600 transition-colors"
                                            @click="activateApi(selectedApi)"
                                        >
                                            <i class="fa-solid fa-check mr-1"></i> 활성화
                                        </button>
                                        <button 
                                            class="px-3 py-1.5 text-[11px] bg-ui-danger text-white rounded hover:bg-red-600 transition-colors"
                                            @click="deleteApi(selectedApi)"
                                        >
                                            <i class="fa-solid fa-trash mr-1"></i> 삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 편집 폼 -->
                            <div class="flex-1 overflow-auto p-4 space-y-4">
                                <!-- 이름 -->
                                <div>
                                    <label class="block text-[10px] text-text-sub mb-1 font-bold">API 이름</label>
                                    <input 
                                        type="text" 
                                        v-model="selectedApi.name"
                                        class="w-full h-8 bg-bg-input border border-ui-border rounded px-3 text-[11px] focus:border-ui-accent focus:outline-none"
                                        placeholder="예: 메인 YouTube API"
                                    />
                                </div>
                                
                                <!-- API 키 -->
                                <div>
                                    <label class="block text-[10px] text-text-sub mb-1 font-bold">API 키</label>
                                    <div class="flex gap-2">
                                        <input 
                                            :type="showApiKey ? 'text' : 'password'"
                                            v-model="selectedApi.key"
                                            class="flex-1 h-8 bg-bg-input border border-ui-border rounded px-3 text-[11px] font-mono focus:border-ui-accent focus:outline-none api-key-input"
                                            placeholder="API 키를 입력하세요"
                                        />
                                        <button 
                                            class="px-3 h-8 bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors"
                                            @click="showApiKey = !showApiKey"
                                        >
                                            <i :class="showApiKey ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-[10px]"></i>
                                        </button>
                                        <button 
                                            class="px-3 h-8 bg-bg-input border border-ui-border rounded hover:bg-bg-hover transition-colors"
                                            @click="copyApiKey"
                                        >
                                            <i class="fa-solid fa-copy text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- 할당량 설정 -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-[10px] text-text-sub mb-1 font-bold">일일 할당량</label>
                                        <input 
                                            type="number" 
                                            v-model.number="selectedApi.quota"
                                            class="w-full h-8 bg-bg-input border border-ui-border rounded px-3 text-[11px] focus:border-ui-accent focus:outline-none"
                                            placeholder="10000"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-[10px] text-text-sub mb-1 font-bold">현재 사용량</label>
                                        <input 
                                            type="number" 
                                            v-model.number="selectedApi.usage"
                                            class="w-full h-8 bg-bg-input border border-ui-border rounded px-3 text-[11px] focus:border-ui-accent focus:outline-none"
                                            placeholder="0"
                                            readonly
                                        />
                                    </div>
                                </div>
                                
                                <!-- 사용량 프로그레스 바 -->
                                <div>
                                    <div class="flex items-center justify-between text-[10px] text-text-sub mb-1">
                                        <span>사용량</span>
                                        <span>{{ getUsagePercent(selectedApi) }}%</span>
                                    </div>
                                    <div class="w-full h-2 bg-bg-input rounded-full overflow-hidden">
                                        <div 
                                            class="h-full transition-all duration-300"
                                            :class="getUsageBarClass(selectedApi)"
                                            :style="{ width: getUsagePercent(selectedApi) + '%' }"
                                        ></div>
                                    </div>
                                </div>
                                
                                <!-- 메모 -->
                                <div>
                                    <label class="block text-[10px] text-text-sub mb-1 font-bold">메모</label>
                                    <textarea 
                                        v-model="selectedApi.memo"
                                        class="w-full h-20 bg-bg-input border border-ui-border rounded px-3 py-2 text-[11px] focus:border-ui-accent focus:outline-none resize-none"
                                        placeholder="API에 대한 메모를 입력하세요..."
                                    ></textarea>
                                </div>
                                
                                <!-- 테스트 버튼 -->
                                <div class="flex gap-2">
                                    <button 
                                        class="flex-1 h-9 bg-bg-input border border-ui-border rounded text-[11px] hover:bg-bg-hover transition-colors flex items-center justify-center gap-2"
                                        @click="testApiConnection"
                                        :disabled="isTesting"
                                    >
                                        <i :class="isTesting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plug'"></i>
                                        {{ isTesting ? '테스트 중...' : '연결 테스트' }}
                                    </button>
                                    <button 
                                        class="flex-1 h-9 bg-ui-accent text-white rounded text-[11px] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                        @click="saveApiChanges"
                                    >
                                        <i class="fa-solid fa-save"></i>
                                        저장
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- 상태바 -->
                <div class="px-4 py-2 border-t border-ui-border bg-bg-panel flex justify-between items-center text-[11px] rounded-b-lg">
                    <div class="text-text-sub flex items-center gap-3">
                        <span>활성 API: <span class="text-ui-success font-bold">{{ activeApiName }}</span></span>
                        <span v-if="rotationEnabled" class="text-ui-accent"><i class="fa-solid fa-sync mr-1"></i>자동 순환 활성</span>
                    </div>
                    <button class="px-3 py-1 bg-bg-input border border-ui-border text-text-sub rounded hover:bg-bg-hover transition-colors" @click="$emit('close')">닫기</button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            posX: 0, posY: 0,
            dragging: false, dragStartMouseX: 0, dragStartMouseY: 0, dragStartPosX: 0, dragStartPosY: 0,
            
            currentService: 'youtube',
            selectedApiId: null,
            showApiKey: false,
            rotationEnabled: true,
            isTesting: false,
            
            serviceTabs: [
                { id: 'youtube', label: 'YouTube Data API v3', icon: 'fa-brands fa-youtube' },
                { id: 'gemini', label: 'Gemini API', icon: 'fa-solid fa-robot' }
            ],
            
            apiList: [
                { id: 'yt1', service: 'youtube', name: '메인 YouTube API', key: 'AIzaSyB1234567890abcdefghijklmnop', quota: 10000, usage: 3420, status: '정상', isActive: true, memo: '메인 프로젝트용 API 키' },
                { id: 'yt2', service: 'youtube', name: '백업 YouTube API', key: 'AIzaSyC0987654321zyxwvutsrqponmlk', quota: 10000, usage: 0, status: '대기', isActive: false, memo: '할당량 초과 시 사용' },
                { id: 'gm1', service: 'gemini', name: '메인 Gemini API', key: 'sk-gemini-abcdef123456789', quota: 60, usage: 12, status: '정상', isActive: true, memo: 'AI 기능용 Gemini API' },
                { id: 'gm2', service: 'gemini', name: '테스트 Gemini API', key: 'sk-gemini-test-987654321', quota: 60, usage: 0, status: '대기', isActive: false, memo: '개발 테스트용' }
            ]
        };
    },
    computed: {
        windowStyle() { return { position: 'absolute', left: this.posX + 'px', top: this.posY + 'px' }; },
        currentServiceLabel() { 
            const tab = this.serviceTabs.find(t => t.id === this.currentService);
            return tab ? tab.label : '';
        },
        currentServiceApis() {
            return this.apiList.filter(a => a.service === this.currentService);
        },
        selectedApi() {
            return this.apiList.find(a => a.id === this.selectedApiId) || null;
        },
        totalApiCount() {
            return this.apiList.length;
        },
        activeApiName() {
            const activeApi = this.apiList.find(a => a.service === this.currentService && a.isActive);
            return activeApi ? activeApi.name : '없음';
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
            this.posX = Math.max(20, (vw - 800) / 2);
            this.posY = Math.max(20, (vh - 600) / 2);
        },
        onHeaderMouseDown(e) {
            this.dragging = true;
            this.dragStartMouseX = e.clientX; this.dragStartMouseY = e.clientY;
            this.dragStartPosX = this.posX; this.dragStartPosY = this.posY;
        },
        onGlobalMouseMove(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
            }
        },
        onGlobalMouseUp() { this.dragging = false; },
        
        getServiceApiCount(serviceId) {
            return this.apiList.filter(a => a.service === serviceId).length;
        },
        
        maskApiKey(key) {
            if (!key || key.length < 10) return '••••••••';
            return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
        },
        
        getStatusClass(status) {
            if (status === '정상') return 'text-ui-success';
            if (status === '오류') return 'text-ui-danger';
            return 'text-text-sub';
        },
        
        getUsagePercent(api) {
            if (!api || !api.quota) return 0;
            return Math.min(100, Math.round((api.usage / api.quota) * 100));
        },
        
        getUsageBarClass(api) {
            const percent = this.getUsagePercent(api);
            if (percent >= 90) return 'bg-ui-danger';
            if (percent >= 70) return 'bg-yellow-500';
            return 'bg-ui-accent';
        },
        
        selectApi(api) {
            this.selectedApiId = api.id;
            this.showApiKey = false;
        },
        
        async addNewApi() {
            const { value: name } = await Swal.fire({ 
                title: '새 API 키 추가', 
                input: 'text', 
                inputPlaceholder: 'API 이름', 
                showCancelButton: true, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6' 
            });
            if (name) {
                const newApi = {
                    id: `api_${Date.now()}`,
                    service: this.currentService,
                    name,
                    key: '',
                    quota: this.currentService === 'youtube' ? 10000 : 60,
                    usage: 0,
                    status: '미설정',
                    isActive: false,
                    memo: ''
                };
                this.apiList.push(newApi);
                this.selectedApiId = newApi.id;
            }
        },
        
        activateApi(api) {
            // 같은 서비스의 다른 API 비활성화
            this.apiList.forEach(a => {
                if (a.service === api.service) {
                    a.isActive = (a.id === api.id);
                    a.status = a.isActive ? '정상' : '대기';
                }
            });
            Swal.fire({ icon: 'success', title: 'API 활성화', text: `"${api.name}"이(가) 활성화되었습니다.`, background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
        },
        
        async deleteApi(api) {
            const result = await Swal.fire({
                title: 'API 키 삭제',
                text: `"${api.name}"을(를) 삭제하시겠습니까?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                background: '#1e1e1e',
                color: '#fff',
                confirmButtonColor: '#ef4444'
            });
            if (result.isConfirmed) {
                this.apiList = this.apiList.filter(a => a.id !== api.id);
                if (this.selectedApiId === api.id) {
                    this.selectedApiId = null;
                }
            }
        },
        
        copyApiKey() {
            if (this.selectedApi && this.selectedApi.key) {
                navigator.clipboard.writeText(this.selectedApi.key);
                Swal.fire({ icon: 'success', title: '복사됨', text: 'API 키가 클립보드에 복사되었습니다.', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1000, showConfirmButton: false });
            }
        },
        
        async testApiConnection() {
            this.isTesting = true;
            // 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.isTesting = false;
            
            if (this.selectedApi) {
                this.selectedApi.status = '정상';
                Swal.fire({ icon: 'success', title: '연결 성공', text: 'API 연결 테스트가 성공했습니다.', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
            }
        },
        
        saveApiChanges() {
            Swal.fire({ icon: 'success', title: '저장됨', text: 'API 설정이 저장되었습니다.', background: '#1e1e1e', color: '#fff', confirmButtonColor: '#3b82f6', timer: 1500, showConfirmButton: false });
        }
    }
};

window.ApiManagerModal = ApiManagerModal;
