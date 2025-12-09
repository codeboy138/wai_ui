/**
 * ==========================================
 * RulerLine.js - 눈금자 컴포넌트
 * 
 * 역할: 캔버스 상단/좌측 눈금자 렌더링
 * 경로: frontend/js/components/RulerLine.js
 * ==========================================
 */

export default {
    name: 'RulerLine',
    
    props: {
        orientation: {
            type: String,
            required: true,
            validator: (value) => ['h', 'v'].includes(value)
        },
        maxSize: {
            type: Number,
            required: true
        },
        scale: {
            type: Number,
            required: true
        }
    },
    
    computed: {
        majorTicks() {
            const step = 100;
            const ticks = [];
            
            for (let i = step; i < this.maxSize; i += step) {
                if (i * this.scale < (this.orientation === 'h' ? 3840 : 2160)) {
                    ticks.push(i);
                }
            }
            return ticks;
        },
        
        wrapperStyle() {
            return this.orientation === 'h' ? 
                { 
                    width: this.maxSize * this.scale + 'px', 
                    height: '100%', 
                    transformOrigin: 'top left', 
                    transform: \`scaleX(\${1 / this.scale})\` 
                } : 
                { 
                    width: '100%', 
                    height: this.maxSize * this.scale + 'px', 
                    transformOrigin: 'top left', 
                    transform: \`scaleY(\${1 / this.scale})\` 
                };
        }
    },
    
    methods: {
        horizontalTickStyle(val) {
            return { left: val + 'px' };
        },
        
        verticalTickStyle(val) {
            return { top: val + 'px' };
        }
    },
    
    template: \`
        <div class="c-ruler" 
             :style="wrapperStyle"
             :title="orientation === 'h' ? '수평 눈금자' : '수직 눈금자'">
            <template v-if="orientation === 'h'">
                <div v-for="i in majorTicks" 
                     :key="'h-tick-' + i" 
                     :style="horizontalTickStyle(i)" 
                     class="c-ruler__tick c-ruler__tick--horizontal"
                     :title="i + 'px'">
                    {{ i }}
                </div>
            </template>
            <template v-else>
                <div v-for="i in majorTicks" 
                     :key="'v-tick-' + i" 
                     :style="verticalTickStyle(i)" 
                     class="c-ruler__tick c-ruler__tick--vertical"
                     :title="i + 'px'">
                    {{ i }}
                </div>
            </template>
        </div>
    \`
};
