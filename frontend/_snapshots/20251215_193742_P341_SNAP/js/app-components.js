// Dropdown Menu Component (Reusable)
const DropdownMenu = {
    props: ['currentValue', 'items', 'id'],
    template: `
        <div :id="id" class="c-dropdown w-20 h-6 border-none bg-transparent px-0" :class="{ 'open': isOpen }" @click="toggleDropdown" @click.stop>
            <span :id="'val-' + id" class="truncate max-w-[80%]">{{ currentValue }}</span> <i class="fa-solid fa-caret-down ml-auto text-[8px]"></i>
            <div class="c-dropdown-menu">
                <div class="c-dropdown-item" v-for="item in items" :key="item" @click="$emit('select', item); isOpen = false">
                    {{ item }}
                </div>
            </div>
        </div>
    `,
    data() { return { isOpen: false } },
    methods: {
        toggleDropdown() { this.isOpen = !this.isOpen; },
        closeOnOutsideClick(e) { if (!this.$el.contains(e.target)) this.isOpen = false; }
    },
    mounted() { document.addEventListener('click', this.closeOnOutsideClick); },
    beforeUnmount() { document.removeEventListener('click', this.closeOnOutsideClick); }
};

// Ruler Line Component
const RulerLine = {
    props: ['orientation', 'maxSize', 'scale'],
    template: `
        <div class="absolute inset-0 overflow-hidden" :style="wrapperStyle">
            <template v-if="orientation === 'h'">
                <div v-for="i in majorTicks" :key="i" :style="horizontalTickStyle(i)" class="absolute top-0 text-xxs text-text-sub font-mono pl-1 border-l border-ui-border h-full">
                    {{ i }}
                </div>
            </template>
            <template v-else>
                <div v-for="i in majorTicks" :key="i" :style="verticalTickStyle(i)" class="absolute left-0 text-xxs text-text-sub font-mono pt-px border-t border-ui-border w-full">
                    {{ i }}
                </div>
            </template>
        </div>
    `,
    computed: {
        majorTicks() {
            const step = 100; // Major tick every 100px in 4K space
            const ticks = [];
            const maxScaledSize = this.maxSize * this.scale;
            
            for (let i = step; i < this.maxSize; i += step) {
                if (i * this.scale < (this.orientation === 'h' ? 3840 : 2160)) {
                    ticks.push(i);
                }
            }
            return ticks;
        },
        wrapperStyle() {
            return this.orientation === 'h' ? 
                { width: this.maxSize * this.scale + 'px', height: '100%', transformOrigin: 'top left', transform: `scaleX(${1/this.scale})` } : 
                { width: '100%', height: this.maxSize * this.scale + 'px', transformOrigin: 'top left', transform: `scaleY(${1/this.scale})` };
        }
    },
    methods: {
        horizontalTickStyle(val) {
            return { left: val + 'px' };
        },
        verticalTickStyle(val) {
            return { top: val + 'px' };
        }
    }
};

// Project Modal Component
const ProjectModal = {
    template: `
        <div class="modal-overlay" @click="$emit('close')" data-dev="ID: modal-project\nComp: Modal\nNote: 프로젝트 관리 모달창">
            <div class="modal-window" @click.stop>
                <div class="h-10 border-b border-ui-border flex items-center justify-between px-4 bg-bg-panel text-text-main font-bold">
                    프로젝트 관리 
                    <button @click="$emit('close')" class="win-btn close">
                        <i class="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                </div>
                <div class="flex-1 flex">
                    <div class="w-40 border-r border-ui-border p-2 bg-bg-hover">Folders...</div>
                    <div class="flex-1 bg-bg-dark p-4">Files...</div>
                </div>
            </div>
        </div>
    `
};

// Layer Panel Component (Matrix UI 구현)
const LayerPanel = {
    props: ['vm'],
    template: `
        <div class="border-b border-ui-border bg-bg-panel select-none" data-dev="ID: layer-panel\nComp: RightPanel/Layer\nNote: 레이어 매트릭스 및 관리">
            <div class="h-8 bg-bg-hover flex items-center justify-between px-3 cursor-pointer border-b border-ui-border" @click="isCollapsed = !isCollapsed" data-dev="ID: layer-header">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-text-main flex items-center gap-2"><i class="fa-solid fa-layer-group"></i> 레이어 관리</span>
                    <span v-if="vm.layerMainName" class="text-[10px] text-ui-accent border border-ui-accent px-1 rounded">{{ vm.layerMainName }}</span>
                </div>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']" class="text-text-sub text-xs"></i>
            </div>
            <div v-if="!isCollapsed" class="p-3">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] text-text-sub">매트릭스 (우클릭: 색상)</span>
                    <button class="text-[10px] hover:text-white bg-ui-selected px-2 rounded" @click="addColumn">+ 컬럼</button>
                </div>
                <div class="overflow-x-auto pb-2">
                    <div class="flex gap-1 mb-1 min-w-max">
                        <div class="w-10 shrink-0"></div>
                        <div v-for="(col, i) in vm.layerCols" :key="col.id" 
                             class="w-[50px] text-center py-1 rounded text-[10px] font-bold text-white cursor-context-menu hover:brightness-110 relative group" 
                             :style="{ backgroundColor: col.color }" 
                             @contextmenu.prevent="openContextMenu($event, col.id, i)">
                            <input type="text" :value="col.name" @input="updateColName(col.id, $event.target.value)" class="bg-transparent text-center w-full outline-none" @click.stop />
                            <div class="absolute top-0 right-0 text-[8px] opacity-0 group-hover:opacity-100 p-0.5 bg-black/50 rounded">Z:{{ getZIndex(i, 'VID') }}</div>
                        </div>
                    </div>
                    <div v-for="row in rows" :key="row.type" class="flex gap-1 mb-1 min-w-max">
                        <div class="w-10 shrink-0 text-[9px] flex items-center justify-end pr-2 font-bold" :style="{ color: row.color }">{{ row.label }}</div>
                        <div v-for="(col, i) in vm.layerCols" :key="col.id + row.type"
                            :class="{ 'opacity-100 ring-1 ring-white': isActive(i, row.type), 'opacity-30 grayscale': !isActive(i, row.type) }"
                            class="w-[50px] h-6 border border-ui-border rounded flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all" 
                            :style="{ backgroundColor: '#27272a' }" 
                            @click="vm.addLayerBox(i, row.type, col.color)" 
                            :data-dev="'ID: cell-' + i + '-' + row.type + '\\nZ: ' + getZIndex(i, row.type)">
                            <span class="text-[10px] font-bold text-white drop-shadow-md" style="text-shadow: 0 0 3px black">{{ getZIndex(i, row.type) }}</span>
                        </div>
                    </div>
                </div>
                <div class="mt-2 flex justify-end">
                    <button class="text-xs bg-ui-accent text-white px-3 py-1 rounded hover:bg-blue-600" @click="saveLayerTemplate">저장</button>
                </div>
            </div>
            <div v-if="contextMenu" class="context-menu" :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}">
                <div class="color-grid">
                    <div v-for="c in COLORS" :key="c" class="color-swatch" :style="{ backgroundColor: c }" @click="handleColColor(c)"></div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            isCollapsed: false,
            contextMenu: null,
            rows: [
                { type: 'EFF', label: 'Effect', color: '#ef4444', offset: 80 }, 
                { type: 'TXT', label: 'Text', color: '#eab308', offset: 40 }, 
                { type: 'BG', label: 'BG', color: '#3b82f6', offset: 20 }
            ],
            COLORS: COLORS
        }
    },
    methods: {
        getZIndex(colIdx, type) {
            const base = (colIdx * 100) + 100;
            const row = this.rows.find(r => r.type === type);
            const offset = row ? row.offset : 0;
            return base + offset;
        },
        isActive(colIdx, type) {
            return this.vm.canvasBoxes.some(b => b.colIdx === colIdx && b.type === type);
        },
        addColumn() {
            const newCol = { id: `lc_${Date.now()}`, name: 'New', color: '#333' };
            this.vm.layerCols.push(newCol);
        },
        updateColName(id, name) {
            const col = this.vm.layerCols.find(c => c.id === id);
            if (col) col.name = name;
        },
        openContextMenu(e, id, index) {
            this.contextMenu = { x: e.clientX, y: e.clientY, colId: id, colIndex: index };
        },
        handleColColor(color) {
            const colId = this.contextMenu.colId;
            this.vm.layerCols = this.vm.layerCols.map(col => 
                col.id === colId ? { ...col, color: color } : col
            );
            this.contextMenu = null;
        },
        async saveLayerTemplate() {
            const { value: name } = await Swal.fire({ 
                title: '레이어 템플릿 저장', 
                input: 'text', 
                inputLabel: '메인 레이어 이름', 
                inputPlaceholder: '예: News_Layout', 
                showCancelButton: true, 
                background: '#1e1e1e', 
                color: '#fff', 
                confirmButtonColor: '#3b82f6' 
            });
            if (name) { 
                this.vm.saveLayerTemplate(name); 
                Swal.fire({icon:'success', title:'저장됨', background:'#1e1e1e', color:'#fff', confirmButtonColor:'#3b82f6'}); 
            }
        }
    }
};

// Properties Panel Component
const PropertiesPanel = {
    props: ['vm'],
    template: `
        <div class="border-b border-ui-border bg-bg-panel" data-dev="ID: props-panel\nComp: RightPanel/Properties\nNote: 클립/박스 속성 표시">
            <div class="h-8 bg-bg-hover flex items-center justify-between px-2 cursor-pointer select-none border-b border-ui-border" @click="isCollapsed = !isCollapsed" data-dev="ID: props-header">
                <span class="text-xs font-bold text-text-main"><i class="fa-solid fa-sliders mr-2"></i>속성</span>
                <i :class="['fa-solid', isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up']" class="text-text-sub text-xs"></i>
            </div>
            <div v-if="!isCollapsed" class="p-3 space-y-3">
                <div v-if="!vm.selectedClip && !vm.selectedBoxId" class="text-text-sub text-center text-[10px] py-4 opacity-50">선택된 요소 없음</div>
                
                <div v-else-if="vm.selectedClip" class="animate-fade-in space-y-2">
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">CLIP</div>
                        <div class="text-sm font-bold text-text-main truncate">{{ vm.selectedClip.name }}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[10px] text-text-sub">Start</label>
                            <input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="vm.selectedClip.start.toFixed(1)" readonly/>
                        </div>
                        <div>
                            <label class="text-[10px] text-text-sub">Dur</label>
                            <input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="vm.selectedClip.duration.toFixed(1)" readonly/>
                        </div>
                    </div>
                    <button class="w-full bg-ui-border hover:bg-ui-danger hover:text-white border border-ui-border text-text-sub py-1 rounded text-[10px] transition-colors" @click="deleteClip(vm.selectedClip.id)">
                        <i class="fa-solid fa-trash mr-1"></i> 삭제
                    </button>
                </div>
                
                <div v-else-if="selectedBox" class="animate-fade-in space-y-2">
                    <div class="bg-bg-input p-2 rounded border border-ui-border">
                        <div class="text-[10px] text-ui-accent font-bold mb-1">BOX (Z:{{ selectedBox.zIndex }})</div>
                        <div class="text-sm font-bold text-text-main truncate">({{ selectedBox.type }})</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div><label class="text-[10px] text-text-sub">X</label><input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="Math.round(selectedBox.x)" readonly/></div>
                        <div><label class="text-[10px] text-text-sub">Y</label><input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="Math.round(selectedBox.y)" readonly/></div>
                        <div><label class="text-[10px] text-text-sub">W</label><input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="Math.round(selectedBox.w)" readonly/></div>
                        <div><label class="text-[10px] text-text-sub">H</label><input type="text" class="w-full bg-bg-dark border border-ui-border rounded p-1 text-[10px] text-text-main" :value="Math.round(selectedBox.h)" readonly/></div>
                    </div>
                    <button class="w-full bg-ui-border hover:bg-ui-danger hover:text-white border border-ui-border text-text-sub py-1 rounded text-[10px] transition-colors" @click="vm.removeBox(vm.selectedBoxId)">
                        <i class="fa-solid fa-trash mr-1"></i> 삭제
                    </button>
                </div>
            </div>
        </div>
    `,
    data() { return { isCollapsed: false } },
    computed: {
        selectedBox() {
            return this.vm.canvasBoxes.find(b => b.id === this.vm.selectedBoxId);
        }
    },
    methods: {
        deleteClip(id) {
            this.vm.removeClip(id);
            this.vm.selectedClip = null;
        }
    }
};

// Preview Canvas Component
const PreviewCanvas = {
    props: ['canvasBoxes', 'selectedBoxId'],
    template: `
        <div ref="container" class="absolute inset-0 z-30 pointer-events-none" @click="contextMenu = null; $emit('select-box', null)">
            <div v-for="box in canvasBoxes" :key="box.id" 
                 :id="'box-' + box.id"
                 class="canvas-box pointer-events-auto"
                 :class="{ 'selected': selectedBoxId === box.id }"
                 :style="{ left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px', borderColor: box.color, zIndex: box.zIndex }"
                 @mousedown.stop="$emit('select-box', box.id)"
                 @contextmenu.prevent="handleContext($event, box.id)"
                 data-x="0" data-y="0"
                 :data-dev="'ID: box-' + box.id + '\\nComp: CanvasBox\\nZ: ' + box.zIndex"
            >
                <div class="canvas-label" :style="{ backgroundColor: box.color }">Z:{{ box.zIndex }}</div>
                <div class="box-handle bh-tl"></div><div class="box-handle bh-tr"></div><div class="box-handle bh-bl"></div><div class="box-handle bh-br"></div>
            </div>
            <div v-if="contextMenu" class="context-menu pointer-events-auto" :style="{top: contextMenu.y + 'px', left: contextMenu.x + 'px'}">
                <div class="ctx-item" @click="handleContextAction('top')">맨 위로</div>
                <div class="ctx-item" @click="handleContextAction('delete')">삭제</div>
            </div>
        </div>
    `,
    data() { return { contextMenu: null } },
    mounted() { this.initInteract(); },
    updated() { this.initInteract(); }, 
    methods: {
        initInteract() {
            const self = this;
            interact('.canvas-box').unset(); 
            
            interact('.canvas-box').draggable({
                modifiers: [ interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true }) ],
                listeners: {
                    move(e) {
                        const target = e.target;
                        const scaler = document.getElementById('canvas-scaler');
                        const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let x = (parseFloat(target.getAttribute('data-x')) || 0) + (e.dx / scale);
                        let y = (parseFloat(target.getAttribute('data-y')) || 0) + (e.dy / scale);
                        
                        const cx = x + (e.rect.width/2); 
                        const centerX = 3840/2;
                        document.getElementById('guide-v').style.display = Math.abs(cx - centerX) < 20 ? 'block' : 'none';

                        target.style.transform = `translate(${x}px, ${y}px)`; 
                        target.setAttribute('data-x', x); target.setAttribute('data-y', y);
                    },
                    end(e) {
                        document.getElementById('guide-v').style.display = 'none';

                        const boxId = e.target.id.replace('box-', '');
                        const dx = parseFloat(e.target.getAttribute('data-x')) || 0;
                        const dy = parseFloat(e.target.getAttribute('data-y')) || 0;
                        
                        self.$parent.updateBoxPosition(boxId, dx, dy, e.rect.width, e.rect.height);
                        
                        e.target.removeAttribute('data-x'); 
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = `translate(0, 0)`; 
                    }
                }
            }).resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [ interact.modifiers.restrictEdges({ outer: 'parent' }) ],
                listeners: {
                    move: function (e) {
                        const scaler = document.getElementById('canvas-scaler');
                        const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        let { x, y } = e.target.dataset;
                        x = (parseFloat(x) || 0) + (e.deltaRect.left / scale);
                        y = (parseFloat(y) || 0) + (e.deltaRect.top / scale);
                        Object.assign(e.target.style, { width: `${e.rect.width/scale}px`, height: `${e.rect.height/scale}px`, transform: `translate(${x}px, ${y}px)` });
                        Object.assign(e.target.dataset, { x, y });
                    },
                    end: function(e) {
                        const scaler = document.getElementById('canvas-scaler');
                        const scaleMatch = scaler.style.transform.match(/scale\(([^)]+)\)/);
                        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;
                        
                        const boxId = e.target.id.replace('box-', '');
                        const dx = parseFloat(e.target.dataset.x) || 0;
                        const dy = parseFloat(e.target.dataset.y) || 0;
                        
                        self.$parent.updateBoxPosition(boxId, dx, dy, e.rect.width / scale, e.rect.height / scale, true); 
                        e.target.removeAttribute('data-x'); 
                        e.target.removeAttribute('data-y');
                        e.target.style.transform = `translate(0, 0)`; 
                        e.target.style.width = null;
                        e.target.style.height = null;
                    }
                }
            });
        },
        handleContext(e, boxId) { 
            this.contextMenu = { x: e.clientX, y: e.clientY, boxId }; 
        },
        handleContextAction(action) { 
            if (action === 'delete') this.$emit('remove-box', this.contextMenu.boxId);
            this.contextMenu = null;
        }
    }
};

// Timeline Panel Component
const TimelinePanel = {
    props: ['vm'],
    template: `
        <div class="flex flex-col h-full bg-bg-panel select-none" @wheel.prevent="handleWheel" data-dev="ID: timeline-area\nComp: Timeline">
            <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center px-2 justify-between shrink-0">
                <div class="flex items-center gap-2">
                    <button class="hover:text-text-main w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover" @click="toggleCollapse">
                        <i :class="['fa-solid', vm.isTimelineCollapsed ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                    </button>
                    <span class="text-xs font-mono text-ui-accent font-bold">{{ formattedTime }}</span>
                </div>
                <input type="range" min="10" max="100" :value="vm.zoom" @input="vm.zoom = Number($event.target.value)" class="w-20 accent-ui-accent h-1"/>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" class="h-5 bg-bg-hover border-b border-ui-border flex items-center px-2 justify-between shrink-0 text-xxs" data-dev="ID: quick-bar">
                <div class="flex gap-1">
                    <button class="tool-btn" title="Cut" data-dev="ID: tool-cut"><i class="fa-solid fa-scissors"></i></button>
                    <button class="tool-btn" title="Delete" data-dev="ID: tool-delete"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="flex gap-2 items-center">
                    <button :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isMagnet, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isMagnet }" 
                            class="flex items-center gap-1 px-2 rounded border" 
                            @click="vm.isMagnet = !vm.isMagnet" 
                            data-dev="ID: tool-magnet">
                        <i class="fa-solid fa-magnet"></i>
                    </button>
                    <button :class="{ 'bg-bg-input border-ui-accent text-ui-accent': vm.isAutoRipple, 'border-transparent hover:bg-ui-selected text-text-sub': !vm.isAutoRipple }" 
                            class="flex items-center gap-1 px-2 rounded border" 
                            @click="vm.isAutoRipple = !vm.isAutoRipple" 
                            data-dev="ID: tool-ripple">
                        <i class="fa-solid fa-link"></i>
                    </button>
                    <div class="w-px h-3 bg-ui-border mx-1"></div>
                    <button class="tool-btn bg-ui-selected text-white px-2 py-0" data-dev="ID: btn-normalize">Normalize</button>
                    <i class="fa-solid fa-volume-high text-text-sub cursor-pointer hover:text-white" data-dev="ID: vol-control"></i>
                </div>
            </div>
            
            <div v-show="!vm.isTimelineCollapsed" class="flex-1 overflow-auto timeline-grid relative" id="timeline-scroll-area" style="grid-template-columns: 180px 1fr" 
                 @dragover="handleDragOver" @drop="handleDrop">
                
                <div class="sticky-col z-30 bg-bg-panel border-r border-ui-border">
                    <div class="h-6 border-b border-ui-border flex items-center justify-between px-2 text-[9px] font-bold text-text-sub bg-bg-panel z-40 sticky top-0"><span>TRACKS</span></div>
                    <div v-for="(track, index) in vm.tracks" :key="track.id" 
                         class="h-10 border-b border-ui-border flex items-center px-2 group hover:bg-bg-hover cursor-move bg-bg-panel relative" 
                         draggable @dragstart="onTrackDragStart($event, index)" @dragenter="onTrackDragEnter($event, index)" @dragend="onTrackDragEnd" @dragover.prevent 
                         :data-dev="'ID: track-' + track.id">
                        <div class="w-1 h-2/3 rounded mr-2" :style="{ backgroundColor: track.color || '#666' }"></div>
                        <span class="text-xs truncate flex-1 text-text-main" contenteditable suppressContentEditableWarning>{{ track.name }}</span>
                    </div>
                </div>

                <div class="relative bg-bg-dark min-w-max" @mousedown="handlePlayheadDrag($event)">
                    
                    <div class="h-6 border-b border-ui-border sticky top-0 bg-bg-dark z-20 flex text-[9px] text-text-sub sticky-ruler">
                        <div v-for="i in 50" :key="i" class="border-l border-ui-border pl-1 pt-2" :style="{ width: vm.zoom * 5 + 'px' }">{{ (i - 1) * 5 }}s</div>
                    </div>
                    
                    <div v-for="track in vm.tracks" :key="track.id" class="h-10 border-b border-ui-border relative">
                        <div v-for="clip in vm.clips.filter(c => c.trackId === track.id)" :key="clip.id"
                             :id="'clip-' + clip.id"
                             class="clip absolute top-1 h-8 rounded cursor-pointer overflow-hidden" 
                             :class="{ 'selected': vm.selectedClip && vm.selectedClip.id === clip.id }"
                             :style="{ left: clip.start * vm.zoom + 'px', width: clip.duration * vm.zoom + 'px', backgroundColor: 'transparent' }"
                             @click.stop="vm.setSelectedClip(clip)" 
                             :data-dev="'ID: clip-' + clip.id"
                             data-x="0" data-y="0"
                        >
                            <div class="absolute inset-0 opacity-30" :style="{backgroundColor: track.type === 'audio' ? '#3b82f6' : track.color}"></div>
                            
                            <template v-if="track.type === 'audio'">
                                <svg class="waveform" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 50 Q 10 20, 20 50 T 40 50 T 60 50 T 80 50 T 100 50" stroke="white" fill="transparent" stroke-width="2" vector-effect="non-scaling-stroke"/>
                                </svg>
                                <div class="volume-line" title="Volume"></div>
                            </template>
                            
                            <div class="text-[9px] px-2 text-white truncate font-bold drop-shadow-md relative z-10 pointer-events-none">{{ clip.name }}</div>
                        </div>
                    </div>
                    
                    <div class="playhead-line" :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                    <div class="playhead-handle" :style="{ left: vm.currentTime * vm.zoom + 'px' }"></div>
                </div>
            </div>
        </div>
    `,
    computed: {
        formattedTime() {
            const totalSeconds = this.vm.currentTime;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);
            const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 100); 
            
            const pad = (num, length = 2) => String(num).padStart(length, '0');
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(milliseconds)}`;
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.initClipInteractions();
            this.adjustLayout();
            window.addEventListener('resize', this.adjustLayout);
        });
    },
    beforeUnmount() {
         window.removeEventListener('resize', this.adjustLayout);
    },
    watch: {
        'vm.clips': { handler() { this.$nextTick(this.initClipInteractions); }, deep: true },
        'vm.isMagnet': { handler() { this.$nextTick(this.initClipInteractions); } } 
    },
    methods: {
        adjustLayout() {
            const p = document.getElementById('preview-container');
            if (this.vm.isTimelineCollapsed) {
                p.style.height = 'calc(100% - 32px)';
            } else {
                p.style.height = '50%';
            }
        },
        initClipInteractions() {
            const self = this;
            interact('.clip').unset(); 

            const snapModifier = this.vm.isMagnet ? [
                interact.modifiers.snap({
                    targets: [
                        ({ x, y }) => {
                            const snaps = [];
                            const zoom = self.vm.zoom;
                            self.vm.clips.forEach(clip => {
                                snaps.push({ x: clip.start * zoom, range: 10 }); 
                                snaps.push({ x: (clip.start + clip.duration) * zoom, range: 10 }); 
                            });
                            // Snap to Playhead
                            snaps.push({ x: self.vm.currentTime * zoom, range: 10 });
                            return snaps;
                        }
                    ],
                    relativePoints: [{x: 0, y: 0}, {x: 1, y: 0}] 
                })
            ] : [];
            
            interact('.clip').resizable({ 
                edges: { left: true, right: true, bottom: false, top: false },
                modifiers: snapModifier,
                listeners: { 
                    move (e) { 
                        let { x } = e.target.dataset; 
                        x = (parseFloat(x) || 0) + e.deltaRect.left; 
                        Object.assign(e.target.style, { width: `${e.rect.width}px`, transform: `translate(${x}px, 0)` }); 
                        Object.assign(e.target.dataset, { x }); 
                    }, 
                    end (e) { 
                        const clipId = e.target.id.replace('clip-', '');
                        const startChange = (parseFloat(e.target.dataset.x) || 0) / self.vm.zoom;
                        const durationChange = (e.rect.width - e.rect.initialSize.width) / self.vm.zoom;
                        
                        self.$parent.updateClip(clipId, startChange, durationChange);

                        e.target.removeAttribute('data-x'); 
                        e.target.style.transform='none'; 
                    } 
                } 
            }).draggable({ 
                modifiers: snapModifier,
                listeners: { 
                    move(e) { 
                        const target = e.target; 
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + e.dx; 
                        target.style.transform = `translate(${x}px, 0)`; 
                        target.setAttribute('data-x', x); 
                    }, 
                    end(e) { 
                        const clipId = e.target.id.replace('clip-', '');
                        const timeChange = (parseFloat(e.target.getAttribute('data-x')) || 0) / self.vm.zoom;
                        
                        self.$parent.moveClip(clipId, timeChange);

                        e.target.style.transform='none'; 
                        e.target.removeAttribute('data-x'); 
                    } 
                } 
            });
        },
        handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; },
        handleDrop(e) { 
            e.preventDefault(); 
            let assetData;
            try {
                assetData = JSON.parse(e.dataTransfer.getData('text/wai-asset'));
            } catch (error) {
                return; 
            }

            const rect = e.currentTarget.getBoundingClientRect(); 
            const y = e.clientY - rect.top - 24; 
            const trackIndex = Math.floor(y / 40); 
            
            const scrollArea = document.getElementById('timeline-scroll-area');
            const x = e.clientX - rect.left + scrollArea.scrollLeft - 180; 
            const time = Math.max(0, x / this.vm.zoom); 
            
            this.vm.addClipFromDrop(assetData.type, trackIndex, time, assetData.name);
        },
        onTrackDragStart(e, index) { this.vm.dragItemIndex = index; },
        onTrackDragEnter(e, index) { this.vm.dragOverItemIndex = index; },
        onTrackDragEnd() { 
            this.vm.moveTrack(this.vm.dragItemIndex, this.vm.dragOverItemIndex); 
            this.vm.dragItemIndex = null; 
            this.vm.dragOverItemIndex = null; 
        },
        handleWheel(e) { 
            const scrollArea = document.getElementById('timeline-scroll-area');
            if (e.shiftKey) { 
                const delta = e.deltaY > 0 ? -2 : 2; 
                this.vm.zoom = Math.max(10, Math.min(100, this.vm.zoom + delta)); 
            } else { 
                scrollArea.scrollLeft += e.deltaY; 
            } 
        },
        toggleCollapse() { 
            this.vm.isTimelineCollapsed = !this.vm.isTimelineCollapsed;
            this.adjustLayout();
        },
        handlePlayheadDrag(e) {
            const target = e.target;
            if (!target.className.includes('sticky-ruler') && !target.className.includes('playhead-handle')) return;

            e.preventDefault(); 
            
            const scrollArea = document.getElementById('timeline-scroll-area');
            const rect = scrollArea.getBoundingClientRect();
            const scrollLeft = scrollArea.scrollLeft;
            const headerWidth = 180; 
            const zoom = this.vm.zoom;

            const updateTime = (event) => {
                let newX = event.clientX - rect.left + scrollLeft - headerWidth;
                
                // Snap Logic for Playhead
                if (this.vm.isMagnet) {
                     let minDiff = Infinity;
                     let snapTime = null;

                     this.vm.clips.forEach(clip => {
                         const startPx = clip.start * zoom;
                         const endPx = (clip.start + clip.duration) * zoom;
                         
                         [startPx, endPx].forEach(px => {
                             const diff = Math.abs(newX - px);
                             if (diff < 10 && diff < minDiff) { 
                                 minDiff = diff;
                                 snapTime = px / zoom;
                             }
                         });
                     });

                     if (snapTime !== null) {
                         this.vm.currentTime = snapTime;
                         return; 
                     }
                }

                this.vm.currentTime = Math.max(0, newX / zoom);
            };

            const onMove = (event) => updateTime(event);
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            updateTime(e);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }
    }
};
