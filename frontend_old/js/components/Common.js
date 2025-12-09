/**
 * ==========================================
 * Common.js
 * 
 * 역할: 공통 UI 컴포넌트 (드롭다운 메뉴, 눈금자 등)
 * 경로: frontend/js/components/Common.js
 * ==========================================
 */

/**
 * ==========================================
 * DropdownMenu 컴포넌트
 * 
 * 역할: 우클릭 컨텍스트 메뉴 또는 버튼 클릭 드롭다운 메뉴
 * ==========================================
 */
export const DropdownMenu = {
  name: 'DropdownMenu',
  
  props: {
    // 메뉴 항목 배열 [{ label: 'Copy', action: 'copy', divider: false }, ...]
    items: {
      type: Array,
      required: true
    },
    // 메뉴 표시 위치 { x: number, y: number }
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    // 메뉴 표시 여부
    visible: {
      type: Boolean,
      default: false
    }
  },
  
  methods: {
    /**
     * 메뉴 항목 클릭 핸들러
     * @param {Object} item - 클릭된 메뉴 항목 { label, action }
     */
    handleItemClick(item) {
      if (item.action) {
        this.$emit('select', item.action);
      }
      this.close();
    },
    
    /**
     * 메뉴 닫기
     */
    close() {
      this.$emit('close');
    }
  },
  
  mounted() {
    // 외부 클릭 시 메뉴 닫기
    document.addEventListener('click', this.close);
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.close);
  },
  
  template: `
    <div 
      v-if="visible"
      :id="'dropdown-menu-' + _uid"
      class="c-dropdown"
      :style="{
        left: position.x + 'px',
        top: position.y + 'px'
      }"
      @click.stop
      :data-dev='{
        "role": "드롭다운 컨텍스트 메뉴",
        "id": "dropdown-menu-" + _uid,
        "func": "우클릭 또는 버튼 클릭 시 메뉴 항목 목록 표시",
        "goal": "사용자가 선택 가능한 액션 목록을 제공하고, 클릭 시 해당 액션 실행",
        "state": {
          "visible": "메뉴 표시 여부 (Boolean)",
          "position": "메뉴 위치 { x: number, y: number }",
          "items": "메뉴 항목 배열 [{ label, action, divider }]"
        },
        "path": "frontend/js/components/Common.js → DropdownMenu",
        "py": "",
        "js": "handleItemClick(item), close()"
      }'
    >
      <div 
        :id="'dropdown-menu-list-' + _uid"
        class="c-dropdown__menu"
        :data-dev='{
          "role": "드롭다운 메뉴 항목 리스트",
          "id": "dropdown-menu-list-" + _uid,
          "func": "메뉴 항목들을 수직 리스트로 표시",
          "goal": "사용자가 메뉴 항목을 스캔하고 선택",
          "state": { "items": "표시 중인 메뉴 항목 배열" },
          "path": "frontend/js/components/Common.js → DropdownMenu → menu list",
          "py": "",
          "js": "handleItemClick(item)"
        }'
      >
        <template v-for="(item, index) in items" :key="index">
          <!-- 구분선 -->
          <div 
            v-if="item.divider"
            :id="'dropdown-divider-' + _uid + '-' + index"
            class="c-dropdown__divider"
            :data-dev='{
              "role": "메뉴 항목 구분선",
              "id": "dropdown-divider-" + _uid + "-" + index,
              "func": "메뉴 항목 그룹을 시각적으로 구분",
              "goal": "사용자가 메뉴 항목의 논리적 그룹을 인식",
              "state": {},
              "path": "frontend/js/components/Common.js → DropdownMenu → divider",
              "py": "",
              "js": ""
            }'
          ></div>
          
          <!-- 메뉴 항목 -->
          <div 
            v-else
            :id="'dropdown-item-' + _uid + '-' + index"
            class="c-dropdown__item"
            :data-js-item="item.action"
            @click="handleItemClick(item)"
            :data-dev='{
              "role": "드롭다운 메뉴 항목",
              "id": "dropdown-item-" + _uid + "-" + index,
              "func": "클릭 시 해당 액션 실행 및 메뉴 닫기",
              "goal": "사용자가 원하는 작업(Copy, Delete 등)을 선택",
              "state": {
                "item": { "label": item.label, "action": item.action }
              },
              "path": "frontend/js/components/Common.js → DropdownMenu → menu item",
              "py": "",
              "js": "handleItemClick(item)"
            }'
          >
            {{ item.label }}
          </div>
        </template>
      </div>
    </div>
  `
};

/**
 * ==========================================
 * RulerLine 컴포넌트
 * 
 * 역할: 캔버스 눈금자 (가로/세로)
 * ==========================================
 */
export const RulerLine = {
  name: 'RulerLine',
  
  props: {
    // 눈금자 방향 ('horizontal' | 'vertical')
    direction: {
      type: String,
      default: 'horizontal',
      validator: (value) => ['horizontal', 'vertical'].includes(value)
    },
    // 눈금자 길이 (px)
    length: {
      type: Number,
      default: 1000
    },
    // 눈금 간격 (px)
    interval: {
      type: Number,
      default: 50
    }
  },
  
  computed: {
    /**
     * 눈금 배열 생성
     * @returns {Array} 눈금 위치 배열 [0, 50, 100, 150, ...]
     */
    ticks() {
      const result = [];
      for (let i = 0; i <= this.length; i += this.interval) {
        result.push(i);
      }
      return result;
    }
  },
  
  template: `
    <div 
      :id="'ruler-line-' + direction + '-' + _uid"
      :class="[
        'c-ruler',
        'c-ruler--' + direction
      ]"
      :data-dev='{
        "role": "캔버스 눈금자",
        "id": "ruler-line-" + direction + "-" + _uid,
        "func": "캔버스의 가로 또는 세로 눈금을 표시하여 객체 위치 파악 지원",
        "goal": "사용자가 캔버스 상의 픽셀 위치를 시각적으로 확인",
        "state": {
          "direction": "눈금자 방향 (horizontal | vertical)",
          "length": "눈금자 전체 길이 (px)",
          "interval": "눈금 간격 (px)",
          "ticks": "눈금 위치 배열"
        },
        "path": "frontend/js/components/Common.js → RulerLine",
        "py": "",
        "js": ""
      }'
    >
      <div 
        v-for="tick in ticks"
        :key="tick"
        :id="'ruler-tick-' + direction + '-' + _uid + '-' + tick"
        class="c-ruler__tick"
        :style="direction === 'horizontal' 
          ? { left: tick + 'px' } 
          : { top: tick + 'px' }
        "
        :data-dev='{
          "role": "눈금자 눈금 마크",
          "id": "ruler-tick-" + direction + "-" + _uid + "-" + tick,
          "func": "특정 픽셀 위치에 눈금선 표시",
          "goal": "사용자가 정확한 픽셀 단위 위치를 확인",
          "state": {
            "position": tick,
            "direction": direction
          },
          "path": "frontend/js/components/Common.js → RulerLine → tick",
          "py": "",
          "js": ""
        }'
      >
        <span class="c-ruler__label">{{ tick }}</span>
      </div>
    </div>
  `
};

// 기본 export
export default {
  DropdownMenu,
  RulerLine
};
