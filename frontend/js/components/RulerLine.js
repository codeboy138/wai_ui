/**
 * [DATA-DEV: RulerLine]
 * - 역할: 캔버스 눈금자 (가로/세로)
 * - 고유ID: ruler-line
 * - 기능: 캔버스 가이드 눈금 표시
 * - 로직: direction prop에 따라 가로/세로 렌더링
 * - 데이터: direction (horizontal | vertical)
 * - 경로: frontend/js/components/RulerLine.js
 * - 명령: 없음 (표시 전용)
 */

export default {
  name: 'RulerLine',
  props: {
    direction: {
      type: String,
      default: 'horizontal',
      validator: (value) => ['horizontal', 'vertical'].includes(value)
    }
  },
  template: '<div :id="rulerId" :class="rulerClass" :data-action="dataAction" :title="title"></div>',
  
  computed: {
    rulerId() {
      return 'ruler-line-' + this.direction;
    },
    rulerClass() {
      return 'c-ruler-line c-ruler-line--' + this.direction;
    },
    dataAction() {
      return 'js:ruler-' + this.direction;
    },
    title() {
      return this.direction === 'horizontal' ? '가로 눈금자' : '세로 눈금자';
    }
  },
  
  mounted() {
    console.log('[RulerLine] 마운트:', this.direction);
  }
};
