import { store } from '../store.js';

export default {
    template: `
        <div class="h-8 bg-bg-panel border-b border-ui-border flex items-center justify-between px-2 shrink-0 z-toolbar"
             data-dev="ID: preview-toolbar | Path: App/Preview/Toolbar | Role: Bar">
            
            <div class="flex items-center gap-2">
                <div class="px-2 flex items-center bg-bg-input rounded h-6 border border-ui-border min-w-[80px] justify-center" 
                     data-dev="ID: coord-display | Path: Preview/Toolbar/Coords | Role: Indicator | State: store.status.mouseCoord">
                    <i class="fa-solid fa-crosshairs text-[8px] text-text-sub mr-2"></i>
                    <span class="text-xxs font-mono text-ui-accent">
                        {{ Math.round(store.status.mouseCoord.x) }}, {{ Math.round(store.status.mouseCoord.y) }}
                    </span>
                </div>
            </div>

            <div class="flex items-center bg-bg-input rounded h-6 border border-ui-border">
                
                <div class="tb-dropdown relative" 
                     @click.stop="toggleDropdown('ratio')"
                     data-dev="ID: dd-ratio | Path: Preview/Toolbar/Ratio | Role: Dropdown">
                    <span class="text-[10px] text-text-sub mr-1">Ratio:</span>
                    <span class="text-[10px] text-text-main font-bold">{{ store.project.aspectRatio }}</span>
                    <i class="fa-solid fa-caret-down text-[8px] ml-2 text-text-sub"></i>
                    
                    <div class="tb-dropdown-menu" :class="{ 'show': activeDropdown === 'ratio' }">
                        <div class="tb-dropdown-item" v-for="r in ['16:9', '9:16', '1:1', '21:9', '4:3']" 
                             @click.stop="setRatio(r)">{{ r }}</div>
                    </div>
                </div>

                <div class="w-px h-full bg-ui-border"></div>

                <div class="tb-dropdown relative" 
                     @click.stop="toggleDropdown('res')"
                     data-dev="ID: dd-res | Path: Preview/Toolbar/Resolution | Role: Dropdown">
                    <span class="text-[10px] text-text-sub mr-1">Res:</span>
                    <span class="text-[10px] text-text-main font-bold">{{ store.project.resolution }}</span>
                    <i class="fa-solid fa-caret-down text-[8px] ml-2 text-text-sub"></i>
                    
                    <div class="tb-dropdown-menu" :class="{ 'show': activeDropdown === 'res' }">
                        <div class="tb-dropdown-item" v-for="r in resolutionList" 
                             @click.stop="setRes(r)">{{ r }}</div>
                    </div>
                </div>
                
                <div class="w-px h-full bg-ui-border"></div>

                <div class="cursor-pointer flex items-center gap-1 hover:text-white text-[10px] font-bold px-3 h-full transition-colors" 
                     @click="store.project.isMagnet = !store.project.isMagnet" 
                     :class="store.project.isMagnet ? 'text-ui-accent bg-bg-hover' : 'text-text-sub'"
                     data-dev="ID: btn-magnet | Path: Preview/Toolbar/Magnet | Role: Toggle | Py: ui.toggle_magnet()">
                    <i class="fa-solid fa-magnet"></i>
                </div>
            </div>

            <div class="w-[80px]"></div>
        </div>
    `,
    setup() {
        const activeDropdown = Vue.ref(null);

        const toggleDropdown = (id) => {
            activeDropdown.value = activeDropdown.value === id ? null : id;
        };

        const closeDropdowns = () => { activeDropdown.value = null; };

        // Close dropdown when clicking anywhere else
        Vue.onMounted(() => document.addEventListener('click', closeDropdowns));
        Vue.onUnmounted(() => document.removeEventListener('click', closeDropdowns));

        return { store, activeDropdown, toggleDropdown };
    },
    computed: {
        resolutionList() {
            return ['8K', '4K', '2K', 'FHD', 'HD'];
        }
    },
    methods: {
        setRatio(val) { 
            store.project.aspectRatio = val; 
            this.activeDropdown = null; 
        },
        setRes(val) { 
            store.project.resolution = val; 
            this.activeDropdown = null; 
        }
    }
}