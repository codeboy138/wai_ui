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
