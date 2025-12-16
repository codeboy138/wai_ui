// API Manager Modal Component - 리사이징 추가
// - 좌측: API 종류 선택
// - 우측: 시트 형식 API 키 관리 (CRUD + 대량 붙여넣기)

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
                    id="api-manager-modal-header"
                    class="flex items-center justify-between px-4 py-3 border-b border-ui-border bg-bg-hover cursor-move rounded-t-lg"
                    @mousedown.stop.prevent="onHeaderMouseDown"
                >
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-key text-ui-accent"></i>
                        <span class="text-[14px] font-bold">API 관리</span>
                    </div>
                    <button class="text-[14px] text-text-sub hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-ui-danger transition-colors" @click.stop="$emit('close')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

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
                                    />
                                    <i class="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-text-sub text-[10px]"></i>
                                </div>
                                <select 
                                    v-model="statusFilter"
                                    class="h-7 bg-bg-input border border-ui-border rounded px-2 text-[11px] focus:border-ui-accent focus:outline-none"
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
                                    />
                                </div>
                                
                                <!-- 키이름 -->
                                <div class="w-28 h-10 flex items-center border-r border-ui-border px-1">
                                    <input 
                                        type="text"
                                        class="w-full h-7 bg-transparent border border-transparent hover:border-ui-border focus:border-ui-accent focus:bg-bg-input rounded px-1 text-[11px] transition-colors"
                                        v-model="key.keyName"
                                        @blur="saveKey(key)"
                                    />
                                </div>
                                
                                <!-- API KEY -->
                                <div class="flex-1 h-10 flex items-center border-r border-ui-border px-1">
                                    <input 
                                        :type="showMasked ? 'password' : 'text'"
                                        class="w-full h-7 bg-transparent border border-transparent hover:border-ui-border focus:border-ui-accent focus:bg-bg-input rounded px-1 text-[11px] font-mono transition-colors"
                                        v-model="key.apiKey"
                                        @blur="saveKey(key)"
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
                    <div class="flex
