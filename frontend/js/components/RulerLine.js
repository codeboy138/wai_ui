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
    
    template: `
        <div class="c-ruler" 
             :style="wrapperStyle"
             data-js="ruler-wrapper"
             :title="orientation === 'h' ? '수평 눈금자' : '수직 눈금자'"
             data-dev="요소의 역할: 눈금자 래퍼
요소의 고유ID: component-ruler-wrapper
요소의 기능 목적 정의: 눈금자 렌더링을 위한 컨테이너
요소의 동작 로직 설명: orientation에 따라 수평/수직 눈금 표시, scale에 따라 크기 조정
요소의 입출력 데이터 구조: 입력: orientation, maxSize, scale. 출력: 눈금 틱 렌더링
요소의 경로정보: frontend/js/components/RulerLine.js#wrapper
요소의 수행해야 할 백엔드/JS 명령: 없음">
            <template v-if="orientation === 'h'">
                <div v-for="i in majorTicks" 
                     :key="'h-tick-' + i" 
                     :style="horizontalTickStyle(i)" 
                     class="c-ruler__tick c-ruler__tick--horizontal"
                     :data-js="'ruler-tick-h-' + i"
                     :title="i + 'px'"
                     data-dev="요소의 역할: 수평 눈금 틱
요소의 고유ID: component-ruler-tick-horizontal
요소의 기능 목적 정의: 수평 좌표 표시
요소의 동작 로직 설명: 100px 간격으로 좌표값 표시
요소의 입출력 데이터 구조: 입력: i(좌표값). 출력: 텍스트 + 세로선
요소의 경로정보: frontend/js/components/RulerLine.js#tick-h
요소의 수행해야 할 백엔드/JS 명령: 없음">
                    {{ i }}
                </div>
            </template>
            <template v-else>
                <div v-for="i in majorTicks" 
                     :key="'v-tick-' + i" 
                     :style="verticalTickStyle(i)" 
                     class="c-ruler__tick c-ruler__tick--vertical"
                     :data-js="'ruler-tick-v-' + i"
                     :title="i + 'px'"
                     data-dev="요소의 역할: 수직 눈금 틱
요소의 고유ID: component-ruler-tick-vertical
요소의 기능 목적 정의: 수직 좌표 표시
요소의 동작 로직 설명: 100px 간격으로 좌표값 표시
요소의 입출력 데이터 구조: 입력: i(좌표값). 출력: 텍스트 + 가로선
요소의 경로정보: frontend/js/components/RulerLine.js#tick-v
요소의 수행해야 할 백엔드/JS 명령: 없음">
                    {{ i }}
                </div>
            </template>
        </div>
    `
};
