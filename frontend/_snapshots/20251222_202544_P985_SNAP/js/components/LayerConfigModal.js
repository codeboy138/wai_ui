const COLOR_KO_NAMES = {
    '#000000': '블랙',
    '#ffffff': '화이트',
    '#ff0000': '레드',
    '#00ff00': '라임',
    '#0000ff': '블루',
    '#ffff00': '옐로',
    '#00ffff': '시안',
    '#ff00ff': '마젠타',
    '#64748b': '슬레이트',
    '#ef4444': '레드',
    '#22c55e': '그린',
    '#3b82f6': '블루',
    '#0ea5e9': '스카이',
    '#6366f1': '인디고',
    '#a855f7': '퍼플',
    '#ec4899': '핑크',
    '#eab308': '옐로',
    '#f97316': '오렌지',
    '#facc15': '앰버'
};

function parseColorToRgbLocal(color) {
    if (!color || typeof color !== 'string') return null;
    color = color.trim().toLowerCase();
    if (color[0] === '#') {
        let hex = color.slice(1);
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length !== 6) return null;
        const num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }
    const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch) {
        const parts = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
        if (parts.length >= 3) return { r: parts[0], g: parts[1], b: parts[2] };
    }
    return null;
}

function rgbToHexLocal(r, g, b) {
    const h = (n) => n.toString(16).padStart(2, '0');
    return '#' + h(r) + h(g) + h(b);
}

function complementColorLocal(hex) {
    const rgb = parseColorToRgbLocal(hex);
    if (!rgb) return hex;
    return rgbToHexLocal(255 - rgb.r, 255 - rgb.g, 255 - rgb.b).toUpperCase();
}

const ColorPaletteModal = {
    props: ['currentColor'],
    emits: ['close', 'select'],
    template: `
        <div class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60" @click.self="$emit('close')">
            <div class="bg-bg-panel border border-ui-border rounded shadow-lg p-3 text-[11px] text-text-main w-[480px] max-w-[95vw] max-h-[90vh] overflow-auto" @mousedown.stop>
                <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-[12px]">색상 선택</span>
                    <button class="text-[10px] text-text-sub hover:text-white" @click="$emit('close')">✕</button>
                </div>
                <div class="mb-3 flex items-center gap-2">
                    <span class="text-[10px] text-text-sub w-16">현재 색상</span>
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 border border-ui-border rounded" :style="{ backgroundColor: currentColor || '#000000' }"></div>
                        <span class="text-[11px]">{{ colorLabel(currentColor || '#000000') }}</span>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="text-[10px] text-text-sub mb-1">무지개 색상</div>
                    <div class="flex flex-wrap gap-1">
                        <button v-for="c in rainbow" :key="'rainbow-' + c" class="w-7 h-7 rounded border border-ui-border" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="text-[10px] text-text-sub mb-1">자주 쓰는 색상</div>
                    <div class="grid grid-cols-10 gap-1">
                        <button v-for="c in popular" :key="'popular-' + c" class="w-7 h-7 rounded border border-ui-border" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="text-[10px] text-text-sub mb-1">보색</div>
                    <div class="grid grid-cols-10 gap-1">
                        <button v-for="c in popularComplements" :key="'compl-' + c" class="w-7 h-7 rounded border border-ui-border" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>
                    </div>
                </div>
                <div>
                    <div class="text-[10px] text-text-sub mb-1">기본 팔레트</div>
                    <div class="flex flex-wrap gap-1">
                        <button v-for="c in basePalette" :key="'base-' + c" class="w-7 h-7 rounded border border-ui-border" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        const rainbow = ['#ff0000','#ff7f00','#ffff00','#00ff00','#00ffff','#0000ff','#8b00ff','#ff1493','#ff4500','#ffd700','#7fff00','#00bfff'];
        let popular = [];
        if (typeof COLORS !== 'undefined' && Array.isArray(COLORS) && COLORS.length > 0) {
            popular = COLORS.slice(0, 20).map(c => c.toUpperCase());
        } else {
            popular = ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#0ea5e9','#3b82f6','#6366f1','#a855f7','#ec4899','#f97316','#facc15','#4b5563','#9ca3af','#e5e7eb','#10b981','#14b8a6','#06b6d4','#2563eb'];
        }
        const popularComplements = popular.map(c => complementColorLocal(c));
        const basePalette = ['#000000','#111827','#4b5563','#9ca3af','#e5e7eb','#ffffff'];
        return { rainbow, popular, popularComplements, basePalette };
    },
    methods: {
        pick(c) { this.$emit('select', c.toUpperCase()); },
        colorLabel(c) {
            const code = (c || '#000000').toUpperCase();
            const name = COLOR_KO_NAMES[code.toLowerCase()] || COLOR_KO_NAMES[code] || code;
            if (name && name !== code) return `${name} ${code}`;
            return code;
        }
    }
};

const LayerConfigModal = {
    components: { 'color-palette-modal': ColorPaletteModal },
    props: ['box'],
    emits: ['close', 'delete', 'delete-layer'],
    template: `
        <div v-if="box" class="fixed inset-0 z-[10000] bg-black/60" @click.self="onClose">
            <div ref="win" class="layer-config-window bg-bg-panel border border-ui-border rounded shadow-lg text-xs text-text-main flex flex-col" :style="combinedWindowStyle" @mousedown="onWindowMouseDown">
                <div class="flex items-center justify-between px-3 py-2 border-b border-ui-border bg-bg-hover" :class="isMinimized ? 'cursor-pointer' : 'cursor-move'" @mousedown.stop="onHeaderMouseDown" @dblclick="toggleMinimize">
                    <div class="flex flex-col">
                        <span class="text-[11px] font-bold">레이어 설정</span>
                        <span v-if="!isMinimized" class="text-[10px] text-text-sub">{{ headerLabel }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button class="text-[10px] text-text-sub hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-bg-input" @click.stop="toggleMinimize" :title="isMinimized ? '확장' : '최소화'">
                            <i :class="isMinimized ? 'fa-solid fa-expand' : 'fa-solid fa-minus'"></i>
                        </button>
                        <button class="text-[10px] text-text-sub hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-ui-danger" @click.stop="onClose">✕</button>
                    </div>
                </div>

                <template v-if="!isMinimized">
                    <div class="flex-1 overflow-auto px-3 py-2 space-y-3">
                        <!-- 미디어 설정 (이미지/동영상) -->
                        <div class="border border-ui-border rounded p-2 bg-bg-dark/30">
                            <div class="text-[10px] text-text-sub mb-2 font-bold">미디어</div>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <select 
                                        v-model="box.mediaType" 
                                        class="flex-1 h-6 bg-bg-input border border-ui-border rounded px-2 text-[10px]"
                                        @mousedown.stop @click.stop
                                    >
                                        <option value="none">없음</option>
                                        <option value="image">이미지</option>
                                        <option value="video">동영상</option>
                                    </select>
                                    <select 
                                        v-model="box.mediaFit" 
                                        class="w-20 h-6 bg-bg-input border border-ui-border rounded px-1 text-[10px]"
                                        @mousedown.stop @click.stop
                                    >
                                        <option value="cover">채우기</option>
                                        <option value="contain">맞추기</option>
                                        <option value="fill">늘리기</option>
                                    </select>
                                </div>
                                <div v-if="box.mediaType && box.mediaType !== 'none'" class="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        v-model="box.mediaSrc"
                                        class="flex-1 h-6 bg-bg-input border border-ui-border rounded px-2 text-[10px]"
                                        placeholder="URL 또는 파일 경로..."
                                        @mousedown.stop @click.stop
                                    />
                                    <label class="px-2 h-6 bg-ui-accent text-white rounded text-[10px] flex items-center cursor-pointer hover:bg-blue-600">
                                        <i class="fa-solid fa-upload mr-1"></i>
                                        <span>선택</span>
                                        <input 
                                            type="file" 
                                            :accept="box.mediaType === 'image' ? 'image/*' : 'video/*'"
                                            class="hidden"
                                            @change="onMediaFileSelect"
                                        />
                                    </label>
                                </div>
                                <div v-if="box.mediaSrc" class="text-[9px] text-text-sub truncate">
                                    {{ box.mediaSrc.substring(0, 50) }}{{ box.mediaSrc.length > 50 ? '...' : '' }}
                                </div>
                            </div>
                        </div>

                        <!-- 텍스트 입력 필드 (텍스트 레이어만) -->
                        <div v-if="isTextLayer">
                            <label class="block text-[10px] mb-1 text-text-sub">텍스트 내용</label>
                            <textarea 
                                class="w-full bg-bg-input border border-ui-border rounded px-2 py-2 text-[11px] resize-y text-text-main" 
                                rows="3" 
                                v-model="box.textContent" 
                                :placeholder="textPlaceholder"
                                @mousedown.stop
                                @click.stop
                                @focus.stop
                            ></textarea>
                        </div>

                        <!-- 텍스트 스타일 (텍스트 입력 바로 아래) -->
                        <div v-if="isTextLayer" class="border border-ui-border rounded p-2 bg-bg-dark/30">
                            <div class="text-[10px] text-text-sub mb-2 font-bold">텍스트 스타일</div>
                            <div class="space-y-2">
                                <!-- 1행: 폰트, 폰트크기, 폰트색상, 텍스트배경 -->
                                <div class="grid grid-cols-4 gap-1">
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">폰트</span>
                                        <select 
                                            v-model="fontFamily" 
                                            class="h-6 bg-bg-input border border-ui-border rounded px-1 text-[9px]"
                                            @mousedown.stop @click.stop
                                        >
                                            <option value="Pretendard, system-ui, sans-serif">프리텐다드</option>
                                            <option value="'Noto Sans KR', sans-serif">노토산스</option>
                                            <option value="'Nanum Gothic', sans-serif">나눔고딕</option>
                                            <option value="'Nanum Myeongjo', serif">나눔명조</option>
                                            <option value="Arial, sans-serif">Arial</option>
                                            <option value="'Times New Roman', serif">Times</option>
                                            <option value="'Courier New', monospace">Courier</option>
                                            <option value="Impact, sans-serif">Impact</option>
                                        </select>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">크기 (px)</span>
                                        <input type="number" min="1" step="1" class="h-6 bg-bg-input border border-ui-border rounded px-1 text-[10px]" v-model.number="pixelFontSize" @mousedown.stop @click.stop />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">색상</span>
                                        <button type="button" class="h-6 rounded border border-ui-border text-[9px] px-1 truncate" :style="colorButtonStyle(box.textStyle.fillColor)" @click.stop="openColorPicker('textFill')">{{ colorLabelShort(box.textStyle.fillColor || '#ffffff') }}</button>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">배경</span>
                                        <button type="button" class="h-6 rounded border border-ui-border text-[9px] px-1 truncate" :style="colorButtonStyle(box.textStyle.backgroundColor)" @click.stop="openColorPicker('textBg')">{{ colorLabelShort(box.textStyle.backgroundColor || 'transparent') }}</button>
                                    </div>
                                </div>

                                <!-- 2행: 테두리색상, 테두리두께, 자간, 행간 -->
                                <div class="grid grid-cols-4 gap-1">
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">테두리색</span>
                                        <button type="button" class="h-6 rounded border border-ui-border text-[9px] px-1 truncate" :style="colorButtonStyle(box.textStyle.strokeColor)" @click.stop="openColorPicker('textStroke')">{{ colorLabelShort(box.textStyle.strokeColor || '#000000') }}</button>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">두께 (px)</span>
                                        <input type="number" min="0" step="1" class="h-6 bg-bg-input border border-ui-border rounded px-1 text-[10px]" v-model.number="box.textStyle.strokeWidth" @mousedown.stop @click.stop />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">자간 (px)</span>
                                        <input type="number" step="1" class="h-6 bg-bg-input border border-ui-border rounded px-1 text-[10px]" v-model.number="letterSpacing" @mousedown.stop @click.stop />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">행간 (배)</span>
                                        <input type="number" min="0.5" max="5" step="0.1" class="h-6 bg-bg-input border border-ui-border rounded px-1 text-[10px]" v-model.number="lineHeight" @mousedown.stop @click.stop />
                                    </div>
                                </div>

                                <!-- 3행: 그림자, X, Y, 블러, 색상 -->
                                <div class="grid grid-cols-5 gap-1">
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">그림자</span>
                                        <button 
                                            type="button" 
                                            class="h-6 rounded border text-[9px] px-1 flex items-center justify-center"
                                            :class="shadowEnabled ? 'bg-ui-accent text-white border-ui-accent' : 'bg-bg-input text-text-sub border-ui-border'"
                                            @click.stop="toggleShadow"
                                        >
                                            {{ shadowEnabled ? 'ON' : 'OFF' }}
                                        </button>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">X</span>
                                        <input type="number" step="1" class="h-6 bg-bg-input border border-ui-border rounded px-1 text-[10px]" :disabled="!shadowEnabled" v-model.number="shadowOffsetX" @mousedown.stop @click.stop />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">Y</span>
                                        <input type="number" step="1" class="h-6 bg-bg-input border border-ui-border rounded px-1 text-[10px]" :disabled="!shadowEnabled" v-model.number="shadowOffsetY" @mousedown.stop @click.stop />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">블러</span>
                                        <input type="number" min="0" step="1" class="h-6 bg-bg-input border border-ui-border rounded px-1 text-[10px]" :disabled="!shadowEnabled" v-model.number="shadowBlur" @mousedown.stop @click.stop />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">색상</span>
                                        <button type="button" class="h-6 rounded border border-ui-border text-[9px] px-1" :disabled="!shadowEnabled" :style="shadowEnabled ? colorButtonStyle(shadowColor) : { backgroundColor: '#333', color: '#666' }" @click.stop="shadowEnabled && openColorPicker('shadowColor')"></button>
                                    </div>
                                </div>

                                <!-- 4행: 가로정렬, 세로정렬 -->
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">가로 정렬</span>
                                        <div class="flex gap-0.5">
                                            <button type="button" class="flex-1 h-6 rounded text-[10px] flex items-center justify-center" :class="alignButtonClass('left')" @click.stop="setTextAlign('left')"><i class="fa-solid fa-align-left"></i></button>
                                            <button type="button" class="flex-1 h-6 rounded text-[10px] flex items-center justify-center" :class="alignButtonClass('center')" @click.stop="setTextAlign('center')"><i class="fa-solid fa-align-center"></i></button>
                                            <button type="button" class="flex-1 h-6 rounded text-[10px] flex items-center justify-center" :class="alignButtonClass('right')" @click.stop="setTextAlign('right')"><i class="fa-solid fa-align-right"></i></button>
                                        </div>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[9px] text-text-sub mb-0.5">세로 정렬</span>
                                        <div class="flex gap-0.5">
                                            <button type="button" class="flex-1 h-6 rounded text-[10px] flex items-center justify-center" :class="vAlignButtonClass('top')" @click.stop="setTextVAlign('top')">상</button>
                                            <button type="button" class="flex-1 h-6 rounded text-[10px] flex items-center justify-center" :class="vAlignButtonClass('middle')" @click.stop="setTextVAlign('middle')">중</button>
                                            <button type="button" class="flex-1 h-6 rounded text-[10px] flex items-center justify-center" :class="vAlignButtonClass('bottom')" @click.stop="setTextVAlign('bottom')">하</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 좌표 / 크기 (픽셀 단위) -->
                        <div>
                            <label class="block text-[10px] mb-1 text-text-sub">좌표 / 크기 (px)</label>
                            <div class="grid grid-cols-4 gap-1">
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-text-sub mb-0.5">X</span>
                                    <input type="number" min="0" step="1" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[10px]" v-model.number="pixelX" @mousedown.stop @click.stop />
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-text-sub mb-0.5">Y</span>
                                    <input type="number" min="0" step="1" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[10px]" v-model.number="pixelY" @mousedown.stop @click.stop />
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-text-sub mb-0.5">W</span>
                                    <input type="number" min="10" step="1" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[10px]" v-model.number="pixelW" @mousedown.stop @click.stop />
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-text-sub mb-0.5">H</span>
                                    <input type="number" min="10" step="1" class="w-full bg-bg-input border border-ui-border rounded px-1 py-0.5 text-[10px]" v-model.number="pixelH" @mousedown.stop @click.stop />
                                </div>
                            </div>
                            <div class="text-[9px] text-text-sub mt-1 opacity-60">캔버스: {{ canvasWidth }} × {{ canvasHeight }}px</div>
                        </div>

                        <!-- 레이어 숨기기 -->
                        <div class="flex items-center gap-2">
                            <input id="layer-config-hidden" type="checkbox" class="w-3 h-3" v-model="box.isHidden" @click.stop />
                            <label for="layer-config-hidden" class="text-[10px] text-text-sub select-none">레이어 숨기기</label>
                        </div>

                        <!-- 레이어 색상 / 배경 -->
                        <div>
                            <label class="block text-[10px] mb-1 text-text-sub">레이어 색상 / 배경</label>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-text-sub mb-0.5">레이어 색상</span>
                                    <button type="button" class="h-6 rounded border border-ui-border text-[10px] px-1" :style="colorButtonStyle(box.color)" @click.stop="openColorPicker('layerColor')">{{ colorLabelShort(box.color || '#000000') }}</button>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-text-sub mb-0.5">레이어 배경</span>
                                    <button type="button" class="h-6 rounded border border-ui-border text-[10px] px-1" :style="colorButtonStyle(box.layerBgColor)" @click.stop="openColorPicker('layerBg')">{{ colorLabelShort(box.layerBgColor || '#000000') }}</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="px-3 py-2 border-t border-ui-border flex justify-between items-center">
                        <button class="text-[11px] text-red-400 hover:text-red-300" @click.stop="onDelete">레이어 삭제</button>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-bg-hover border border-ui-border cursor-se-resize" @mousedown.stop.prevent="onResizeMouseDown" title="드래그하여 창 크기 조절"></div>
                        </div>
                    </div>
                </template>

                <color-palette-modal v-if="colorPicker.isOpen" :current-color="currentPickedColor" @close="colorPicker.isOpen = false" @select="onColorPicked" />
            </div>
        </div>
    `,
    data() {
        return {
            baseWidth: 380,
            baseHeight: 620,
            posX: 0,
            posY: 0,
            width: 380,
            height: 620,
            minimizedWidth: 200,
            minimizedHeight: 45,
            prevWidth: 380,
            prevHeight: 620,
            isMinimized: false,
            dragging: false,
            dragStartMouseX: 0,
            dragStartMouseY: 0,
            dragStartPosX: 0,
            dragStartPosY: 0,
            resizing: false,
            resizeStartMouseX: 0,
            resizeStartMouseY: 0,
            resizeStartW: 0,
            resizeStartH: 0,
            textPlaceholder: '텍스트를 입력하세요...',
            colorPicker: { isOpen: false, target: null }
        };
    },
    computed: {
        combinedWindowStyle() {
            return {
                position: 'absolute',
                left: this.posX + 'px',
                top: this.posY + 'px',
                width: (this.isMinimized ? this.minimizedWidth : this.width) + 'px',
                height: (this.isMinimized ? this.minimizedHeight : this.height) + 'px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                minWidth: '200px',
                minHeight: '45px'
            };
        },
        isTextLayer() { return this.box && this.box.rowType === 'TXT'; },
        headerLabel() {
            if (!this.box) return '';
            const colLabel = this.getColLabel(this.box.colRole);
            const rowLabel = this.getRowLabel(this.box.rowType);
            const name = this.box.layerName || '';
            const parts = [];
            if (name) parts.push(name);
            if (colLabel && rowLabel) parts.push(`${colLabel}/${rowLabel}`);
            return parts.join(' · ');
        },
        currentPickedColor() {
            if (!this.box) return '#000000';
            const t = this.colorPicker.target;
            if (t === 'layerColor') return this.box.color || '#000000';
            if (t === 'layerBg') return this.box.layerBgColor || '#000000';
            if (t === 'shadowColor') return this.shadowColor;
            if (!this.box.textStyle) return '#000000';
            if (t === 'textFill') return this.box.textStyle.fillColor || '#ffffff';
            if (t === 'textStroke') return this.box.textStyle.strokeColor || '#000000';
            if (t === 'textBg') return this.box.textStyle.backgroundColor || '#000000';
            return '#000000';
        },
        canvasWidth() {
            const root = this.$root;
            return (root && root.canvasSize) ? root.canvasSize.w : 1920;
        },
        canvasHeight() {
            const root = this.$root;
            return (root && root.canvasSize) ? root.canvasSize.h : 1080;
        },
        pixelX: {
            get() {
                const box = this.box;
                if (!box) return 0;
                return Math.round(box.x || 0);
            },
            set(v) {
                const box = this.box;
                if (!box) return;
                const cw = this.canvasWidth;
                const w = box.w || 0;
                let x = Math.max(0, parseInt(v) || 0);
                if (x + w > cw) x = Math.max(0, cw - w);
                box.x = x;
                box.nx = x / cw;
            }
        },
        pixelY: {
            get() {
                const box = this.box;
                if (!box) return 0;
                return Math.round(box.y || 0);
            },
            set(v) {
                const box = this.box;
                if (!box) return;
                const ch = this.canvasHeight;
                const h = box.h || 0;
                let y = Math.max(0, parseInt(v) || 0);
                if (y + h > ch) y = Math.max(0, ch - h);
                box.y = y;
                box.ny = y / ch;
            }
        },
        pixelW: {
            get() {
                const box = this.box;
                if (!box) return 0;
                return Math.round(box.w || 0);
            },
            set(v) {
                const box = this.box;
                if (!box) return;
                const cw = this.canvasWidth;
                const x = box.x || 0;
                let w = Math.max(10, parseInt(v) || 10);
                if (x + w > cw) w = Math.max(10, cw - x);
                box.w = w;
                box.nw = w / cw;
            }
        },
        pixelH: {
            get() {
                const box = this.box;
                if (!box) return 0;
                return Math.round(box.h || 0);
            },
            set(v) {
                const box = this.box;
                if (!box) return;
                const ch = this.canvasHeight;
                const y = box.y || 0;
                let h = Math.max(10, parseInt(v) || 10);
                if (y + h > ch) h = Math.max(10, ch - h);
                box.h = h;
                box.nh = h / ch;
            }
        },
        fontFamily: {
            get() {
                if (!this.box || !this.box.textStyle) return 'Pretendard, system-ui, sans-serif';
                return this.box.textStyle.fontFamily || 'Pretendard, system-ui, sans-serif';
            },
            set(v) {
                if (!this.box) return;
                if (!this.box.textStyle) this.box.textStyle = {};
                this.box.textStyle.fontFamily = v;
            }
        },
        pixelFontSize: {
            get() {
                if (!this.box || !this.box.textStyle) return 48;
                return Math.round(this.box.textStyle.fontSize || 48);
            },
            set(v) {
                if (!this.box) return;
                if (!this.box.textStyle) this.box.textStyle = {};
                this.box.textStyle.fontSize = Math.max(1, parseInt(v) || 1);
            }
        },
        letterSpacing: {
            get() {
                if (!this.box || !this.box.textStyle) return 0;
                return this.box.textStyle.letterSpacing || 0;
            },
            set(v) {
                if (!this.box) return;
                if (!this.box.textStyle) this.box.textStyle = {};
                this.box.textStyle.letterSpacing = parseInt(v) || 0;
            }
        },
        lineHeight: {
            get() {
                if (!this.box || !this.box.textStyle) return 1.4;
                return this.box.textStyle.lineHeight || 1.4;
            },
            set(v) {
                if (!this.box) return;
                if (!this.box.textStyle) this.box.textStyle = {};
                this.box.textStyle.lineHeight = Math.max(0.5, parseFloat(v) || 1.4);
            }
        },
        shadowEnabled: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return false;
                return this.box.textStyle.shadow.enabled !== false;
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.enabled = v;
            }
        },
        shadowOffsetX: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return 2;
                return this.box.textStyle.shadow.offsetX || 2;
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.offsetX = parseInt(v) || 0;
            }
        },
        shadowOffsetY: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return 2;
                return this.box.textStyle.shadow.offsetY || 2;
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.offsetY = parseInt(v) || 0;
            }
        },
        shadowBlur: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return 4;
                return this.box.textStyle.shadow.blur || 4;
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.blur = Math.max(0, parseInt(v) || 0);
            }
        },
        shadowColor: {
            get() {
                if (!this.box || !this.box.textStyle || !this.box.textStyle.shadow) return '#000000';
                return this.box.textStyle.shadow.color || '#000000';
            },
            set(v) {
                this.ensureShadow();
                this.box.textStyle.shadow.color = v;
            }
        }
    },
    mounted() {
        this.centerWindow();
        this.ensureBoxDefaults();
        document.addEventListener('mousemove', this.onGlobalMouseMove);
        document.addEventListener('mouseup', this.onGlobalMouseUp);
    },
    beforeUnmount() {
        document.removeEventListener('mousemove', this.onGlobalMouseMove);
        document.removeEventListener('mouseup', this.onGlobalMouseUp);
    },
    methods: {
        ensureBoxDefaults() {
            if (!this.box) return;
            if (!this.box.mediaType) this.box.mediaType = 'none';
            if (!this.box.mediaFit) this.box.mediaFit = 'cover';
            if (!this.box.mediaSrc) this.box.mediaSrc = '';
            if (!this.box.textStyle) this.box.textStyle = {};
            if (this.box.textStyle.letterSpacing === undefined) this.box.textStyle.letterSpacing = 0;
            if (this.box.textStyle.lineHeight === undefined) this.box.textStyle.lineHeight = 1.4;
            if (!this.box.textStyle.fontFamily) this.box.textStyle.fontFamily = 'Pretendard, system-ui, sans-serif';
        },
        ensureShadow() {
            if (!this.box) return;
            if (!this.box.textStyle) this.box.textStyle = {};
            if (!this.box.textStyle.shadow) {
                this.box.textStyle.shadow = { enabled: true, offsetX: 2, offsetY: 2, blur: 4, color: '#000000' };
            }
        },
        toggleShadow() {
            this.ensureShadow();
            this.box.textStyle.shadow.enabled = !this.box.textStyle.shadow.enabled;
        },
        centerWindow() {
            const vw = window.innerWidth || 1280;
            const vh = window.innerHeight || 720;
            this.width = this.baseWidth;
            this.height = this.baseHeight;
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
            if (e.target.closest('input, button, select, textarea, label, .cursor-se-resize')) return;
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
        onResizeMouseDown(e) {
            if (this.isMinimized) return;
            this.resizing = true;
            this.resizeStartMouseX = e.clientX;
            this.resizeStartMouseY = e.clientY;
            this.resizeStartW = this.width;
            this.resizeStartH = this.height;
        },
        onGlobalMouseMove(e) {
            if (this.dragging) {
                this.posX = this.dragStartPosX + (e.clientX - this.dragStartMouseX);
                this.posY = this.dragStartPosY + (e.clientY - this.dragStartMouseY);
                this.clampPosition();
            } else if (this.resizing) {
                let newW = this.resizeStartW + (e.clientX - this.resizeStartMouseX);
                let newH = this.resizeStartH + (e.clientY - this.resizeStartMouseY);
                if (newW < 320) newW = 320;
                if (newH < 400) newH = 400;
                this.width = newW;
                this.height = newH;
            }
        },
        onGlobalMouseUp() { 
            this.dragging = false; 
            this.resizing = false; 
        },
        onClose() { this.$emit('close'); },
        onDelete() { this.$emit('delete'); this.$emit('delete-layer'); },
        onMediaFileSelect(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const url = URL.createObjectURL(file);
            this.box.mediaSrc = url;
            
            if (file.type.startsWith('image/')) {
                this.box.mediaType = 'image';
            } else if (file.type.startsWith('video/')) {
                this.box.mediaType = 'video';
            }
        },
        colorLabel(c) {
            if (!c || c === 'transparent') return '투명';
            const code = c.toUpperCase();
            const name = COLOR_KO_NAMES[code.toLowerCase()] || COLOR_KO_NAMES[code] || code;
            if (name && name !== code) return `${name} ${code}`;
            return code;
        },
        colorLabelShort(c) {
            if (!c || c === 'transparent') return '투명';
            const code = c.toUpperCase();
            const name = COLOR_KO_NAMES[code.toLowerCase()] || COLOR_KO_NAMES[code];
            return name || code.substring(0, 7);
        },
        colorButtonStyle(c) {
            if (!c || c === 'transparent') return { backgroundColor: 'transparent', color: '#ffffff' };
            const rgb = parseColorToRgbLocal(c);
            let textColor = '#000000';
            if (rgb) {
                const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
                textColor = lum > 0.5 ? '#000000' : '#ffffff';
            }
            return { backgroundColor: c, color: textColor };
        },
        openColorPicker(target) {
            this.colorPicker.target = target;
            this.colorPicker.isOpen = true;
        },
        onColorPicked(color) {
            if (!this.box) return;
            const t = this.colorPicker.target;
            if (t === 'layerColor') this.box.color = color;
            else if (t === 'layerBg') this.box.layerBgColor = color;
            else if (t === 'shadowColor') { this.ensureShadow(); this.box.textStyle.shadow.color = color; }
            else {
                if (!this.box.textStyle) this.box.textStyle = {};
                if (t === 'textFill') this.box.textStyle.fillColor = color;
                if (t === 'textStroke') this.box.textStyle.strokeColor = color;
                if (t === 'textBg') this.box.textStyle.backgroundColor = color;
            }
            this.colorPicker.isOpen = false;
        },
        alignButtonClass(targetAlign) {
            const current = (this.box && this.box.textStyle && this.box.textStyle.textAlign) || 'center';
            return current === targetAlign ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub border border-ui-border';
        },
        setTextAlign(align) {
            if (!this.box) return;
            if (!this.box.textStyle) this.box.textStyle = {};
            this.box.textStyle.textAlign = align;
        },
        vAlignButtonClass(targetAlign) {
            const current = (this.box && this.box.textStyle && this.box.textStyle.vAlign) || 'middle';
            return current === targetAlign ? 'bg-ui-accent text-white' : 'bg-bg-input text-text-sub border border-ui-border';
        },
        setTextVAlign(align) {
            if (!this.box) return;
            if (!this.box.textStyle) this.box.textStyle = {};
            this.box.textStyle.vAlign = align;
        },
        getColLabel(colRole) {
            if (colRole === 'full') return '전체';
            if (colRole === 'high') return '상단';
            if (colRole === 'mid') return '중단';
            if (colRole === 'low') return '하단';
            return colRole || '';
        },
        getRowLabel(rowType) {
            if (rowType === 'EFF') return '이펙트';
            if (rowType === 'TXT') return '텍스트';
            if (rowType === 'BG') return '배경';
            return '';
        }
    }
};

window.LayerConfigModal = LayerConfigModal;
