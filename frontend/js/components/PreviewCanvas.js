import { store } from '../store.js';

const InnerRuler = {
    props: ['type', 'len'],
    template: `
        <div class="absolute overflow-hidden pointer-events-none" 
             :class="type==='h' ? 'top-0 left-0 h-5 w-full border-b border-white/20' : 'top-0 left-0 w-5 h-full border-r border-white/20'">
            <div v-for="i in ticks" :key="i" 
                 class="absolute bg-white/40 text-[8px] text-white/60 font-mono" 
                 :style="tickStyle(i)">
                 <span v-if="i % 100 === 0" class="absolute" :style="textStyle">{{ i }}</span>
            </div>
            <div v-if="trackerPos >= 0" 
                 class="absolute bg-red-500 z-50 shadow-[0_0_4px_rgba(239,68,68,1)]" 
                 :style="trackerStyle"></div>
        </div>
    `,
    computed: {
        ticks() { const arr=[]; for(let i=0; i<=this.len; i+=100) arr.push(i); return arr; },
        trackerPos() { return this.type==='h' ? store.status.mouseCoord.x : store.status.mouseCoord.y; },
        trackerStyle() { return this.type==='h' ? { left: this.trackerPos+'px', top:0, height:'100%', width:'1px' } : { top: this.trackerPos+'px', left:0, width:'100%', height:'1px' }; },
        textStyle() { return this.type==='h' ? { top:'2px', left:'2px' } : { left:'2px', top:'2px', writingMode:'vertical-rl' }; }
    },
    methods: { tickStyle(i) { return this.type==='h' ? { left:i+'px', top:0, height:'30%', width:'1px' } : { top:i+'px', left:0, width:'30%', height:'1px' }; } }
};

export default {
    components: { 'inner-ruler': InnerRuler },
    template: `
        <div class="preview-canvas-box" 
             :style="{ width: width + 'px', height: height + 'px' }"
             data-dev="ID: preview-screen | Path: Preview/Screen | Role: Canvas | State: {{width}}x{{height}}">
            
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30 select-none">
                <i class="fa-solid fa-clapperboard text-6xl mb-4 text-white"></i>
                <span class="text-2xl font-bold text-white tracking-widest">PREVIEW</span>
                <span class="text-sm text-white mt-2 font-mono bg-black/50 px-2 rounded">{{ width }} x {{ height }} ({{ store.project.aspectRatio }})</span>
            </div>

            <inner-ruler type="h" :len="width"></inner-ruler>
            <inner-ruler type="v" :len="height"></inner-ruler>

            <div v-for="box in store.canvasBoxes" :key="box.id" 
                 :id="'box-' + box.id" class="canvas-box pointer-events-auto"
                 :class="{ 'selected': store.selection.boxId === box.id }"
                 :style="getBoxStyle(box)"
                 @mousedown.stop="selectBox(box.id)"
                 :data-dev="'ID: box-' + box.id + ' | Path: Preview/Objects/' + box.type + ' | Role: LayerObject | State: Z=' + box.zIndex">
                
                <div class="canvas-label absolute px-1 text-[9px] font-bold text-white rounded-sm pointer-events-none"
                     :style="{ backgroundColor: box.color, bottom: '-18px', left: 0 }">
                    {{ box.type }} (Z:{{ box.zIndex }})
                </div>
                
                <div v-show="store.selection.boxId === box.id">
                    <div class="box-handle bh-tl" data-dev="ID: hdl-tl | Role: ResizeHandle"></div>
                    <div class="box-handle bh-tr" data-dev="ID: hdl-tr | Role: ResizeHandle"></div>
                    <div class="box-handle bh-bl" data-dev="ID: hdl-bl | Role: ResizeHandle"></div>
                    <div class="box-handle bh-br" data-dev="ID: hdl-br | Role: ResizeHandle"></div>
                </div>
            </div>
        </div>
    `,
    data() { return { store }; },
    computed: {
        width() { 
            const mapping = { '8K': 7680, '4K': 3840, '2K': 2560, 'FHD': 1920 };
            return mapping[store.project.resolution] || 1920; 
        },
        height() { 
            const parts = String(store.project.aspectRatio).split(':');
            const ratio = parts.length === 2 ? Number(parts[0])/Number(parts[1]) : 16/9;
            return Math.round(this.width / ratio); 
        }
    },
    methods: {
        selectBox(id) { store.selectBox(id); },
        getBoxStyle(box) { 
            return { 
                left: box.x+'px', top: box.y+'px', width: box.w+'px', height: box.h+'px', 
                zIndex: box.zIndex, borderColor: box.color, borderStyle: 'dashed', borderWidth: '2px' 
            }; 
        },
        initInteract() { 
            interact('.canvas-box').draggable({
                modifiers: [ interact.modifiers.restrictRect({ restriction: 'parent' }) ],
                listeners: {
                    move(e) {
                        const id = e.target.id.replace('box-', '');
                        const box = store.canvasBoxes.find(b => b.id === id);
                        if(box) { box.x += e.dx; box.y += e.dy; }
                    }
                }
            }).resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [ interact.modifiers.restrictEdges({ outer: 'parent' }) ],
                listeners: {
                    move(e) {
                        const id = e.target.id.replace('box-', '');
                        const box = store.canvasBoxes.find(b => b.id === id);
                        if(box) {
                            box.w = e.rect.width; box.h = e.rect.height;
                            box.x += e.deltaRect.left; box.y += e.deltaRect.top;
                        }
                    }
                }
            });
        }
    },
    mounted() { this.initInteract(); }
}