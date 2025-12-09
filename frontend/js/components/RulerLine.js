/**
 * ==========================================
 * RulerLine.js - 눈금자 컴포넌트
 * 
 * 역할: 캔버스 상단/좌측 눈금자 렌더링
 * 경로: frontend/js/components/RulerLine.js
 * 
 * DATA-DEV:
 * 요소의 역할: 캔버스 눈금자 (Ruler) 컴포넌트
 * 요소의 고유ID: component-ruler-line
 * 요소의 기능 목적 정의: 캔버스 좌표 시각화를 위한 눈금자 렌더링
 * 요소의 동작 로직 설명: orientation(h/v), maxSize, scale props를 받아 눈금 계산 후 렌더링
 * 요소의 입출력 데이터 구조: 입력: orientation, maxSize, scale. 출력: 눈금자 렌더링
 * 요소의 경로정보: frontend/js/components/RulerLine.js
 * 요소의 수행해야 할 백엔드/JS 명령: 없음 (순수 렌더링)
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
            const step = 100; // Major tick every 100px
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
                    transform: `scaleX(${1 / this.scale})` 
                } : 
                { 
                    width: '100%', 
                    height: this.maxSize * this.scale + 'px', 
                    transformOrigin: 'top left', 
                    transform: `scaleY(${1 / this.scale})` 
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
    
    template: `
        <div class="absolute inset-0 overflow-hidden" :style="wrapperStyle">
            <template v-if="orientation === 'h'">
                <div v-for="i in majorTicks" 
                     :key="i" 
                     :style="horizontalTickStyle(i)" 
                     class="absolute top-0 text-xxs text-text-sub font-mono pl-1 border-l border-ui-border h-full">
                    {{ i }}
                </div>
            </template>
            <template v-else>
                <div v-for="i in majorTicks" 
                     :key="i" 
                     :style="verticalTickStyle(i)" 
                     class="absolute left-0 text-xxs text-text-sub font-mono pt-px border-t border-ui-border w-full">
                    {{ i }}
                </div>
            </template>
        </div>
    `
};
