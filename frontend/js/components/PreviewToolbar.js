/**
 * ==========================================
 * PreviewToolbar.js
 * 
 * 역할: 프리뷰 캔버스 상단 도구 모음 (Ratio, Quality, Resolution 선택)
 * 경로: frontend/js/components/PreviewToolbar.js
 * ==========================================
 */

const PreviewToolbar = {
  name: 'PreviewToolbar',
  
  data() {
    return {
      // 사용 가능한 화면 비율 목록
      ratios: ['16:9', '4:3', '1:1', '21:9'],
      // 사용 가능한 품질 목록
      qualities: ['4K', 'FHD', 'HD', 'SD']
    };
  },
  
  computed: {
    /**
     * 현재 선택된 Ratio (store에서 가져옴)
     */
    selectedRatio: {
      get() {
        return this.$root.store.canvas.ratio;
      },
      set(value) {
        this.$root.store.canvas.ratio = value;
        this.updateResolutions();
      }
    },
    
    /**
     * 현재 선택된 Quality (store에서 가져옴)
     */
    selectedQuality: {
      get() {
        return this.$root.store.canvas.quality;
      },
      set(value) {
        this.$root.store.canvas.quality = value;
        this.updateResolutions();
      }
    },
    
    /**
     * 현재 선택된 Resolution (store에서 가져옴)
     */
    selectedResolution: {
      get() {
        return this.$root.store.canvas.resolution;
      },
      set(value) {
        this.$root.store.canvas.resolution = value;
      }
    },
    
    /**
     * 현재 Ratio와 Quality 조합에 따라 사용 가능한 해상도 목록 생성
     * @returns {Array} 해상도 객체 배열 [{ label, width, height }, ...]
     */
    availableResolutions() {
      // UICustom.js의 getResolutions 함수 사용
      if (typeof getResolutions === 'function') {
        return getResolutions(this.selectedRatio, this.selectedQuality);
      }
      return [];
    }
  },
  
  methods: {
    /**
     * Ratio 또는 Quality 변경 시 Resolution 업데이트
     */
    updateResolutions() {
      if (this.availableResolutions.length > 0) {
        // 첫 번째 해상도로 자동 설정
        this.selectedResolution = this.availableResolutions[0].label;
      }
    }
  },
  
  mounted() {
    // 초기 해상도 설정
    this.updateResolutions();
  },
  
  template: `
    <div 
      id="preview-toolbar-container"
      class="c-preview-toolbar"
      data-dev='{
        "role": "프리뷰 캔버스 도구 모음",
        "id": "preview-toolbar-container",
        "func": "Ratio, Quality, Resolution 선택 UI 제공",
        "goal": "사용자가 캔버스의 화면 비율, 품질, 해상도를 설정",
        "state": {
          "selectedRatio": "현재 선택된 화면 비율 (16:9, 4:3, 1:1, 21:9)",
          "selectedQuality": "현재 선택된 품질 (4K, FHD, HD, SD)",
          "selectedResolution": "현재 선택된 해상도 (예: 1920 × 1080)",
          "availableResolutions": "선택 가능한 해상도 목록"
        },
        "path": "frontend/js/components/PreviewToolbar.js",
        "py": "",
        "js": "updateResolutions()"
      }'
    >
      <!-- Ratio 선택 -->
      <div 
        id="toolbar-group-ratio"
        class="c-preview-toolbar__group"
        data-dev='{
          "role": "Ratio 선택 그룹",
          "id": "toolbar-group-ratio",
          "func": "화면 비율 선택 UI (16:9, 4:3, 1:1, 21:9)",
          "goal": "사용자가 프로젝트의 화면 비율 설정",
          "state": { "selectedRatio": "선택된 비율" },
          "path": "frontend/js/components/PreviewToolbar.js → ratio group",
          "py": "",
          "js": "selectedRatio setter"
        }'
      >
        <label 
          for="select-ratio"
          id="label-ratio"
          class="c-preview-toolbar__label"
          data-dev='{
            "role": "Ratio 라벨",
            "id": "label-ratio",
            "func": "Ratio 선택 필드 설명 텍스트",
            "goal": "사용자가 선택 필드의 용도를 인식",
            "state": {},
            "path": "frontend/js/components/PreviewToolbar.js → ratio label",
            "py": "",
            "js": ""
          }'
        >
          Ratio:
        </label>
        
        <select 
          id="select-ratio"
          class="c-preview-toolbar__select"
          v-model="selectedRatio"
          data-js-ratio
          :data-dev='{
            "role": "Ratio 선택 드롭다운",
            "id": "select-ratio",
            "func": "화면 비율 선택 시 store.canvas.ratio 업데이트 및 해상도 재계산",
            "goal": "사용자가 원하는 화면 비율을 선택",
            "state": { "value": selectedRatio, "options": ratios },
            "path": "frontend/js/components/PreviewToolbar.js → ratio select",
            "py": "",
            "js": "selectedRatio setter → updateResolutions()"
          }'
        >
          <option 
            v-for="ratio in ratios" 
            :key="ratio" 
            :value="ratio"
            :id="'option-ratio-' + ratio.replace(':', '-')"
          >
            {{ ratio }}
          </option>
        </select>
      </div>

      <!-- Quality 선택 -->
      <div 
        id="toolbar-group-quality"
        class="c-preview-toolbar__group"
        data-dev='{
          "role": "Quality 선택 그룹",
          "id": "toolbar-group-quality",
          "func": "영상 품질 선택 UI (4K, FHD, HD, SD)",
          "goal": "사용자가 프로젝트의 영상 품질 설정",
          "state": { "selectedQuality": "선택된 품질" },
          "path": "frontend/js/components/PreviewToolbar.js → quality group",
          "py": "",
          "js": "selectedQuality setter"
        }'
      >
        <label 
          for="select-quality"
          id="label-quality"
          class="c-preview-toolbar__label"
          data-dev='{
            "role": "Quality 라벨",
            "id": "label-quality",
            "func": "Quality 선택 필드 설명 텍스트",
            "goal": "사용자가 선택 필드의 용도를 인식",
            "state": {},
            "path": "frontend/js/components/PreviewToolbar.js → quality label",
            "py": "",
            "js": ""
          }'
        >
          Quality:
        </label>
        
        <select 
          id="select-quality"
          class="c-preview-toolbar__select"
          v-model="selectedQuality"
          data-js-quality
          :data-dev='{
            "role": "Quality 선택 드롭다운",
            "id": "select-quality",
            "func": "영상 품질 선택 시 store.canvas.quality 업데이트 및 해상도 재계산",
            "goal": "사용자가 원하는 영상 품질을 선택",
            "state": { "value": selectedQuality, "options": qualities },
            "path": "frontend/js/components/PreviewToolbar.js → quality select",
            "py": "",
            "js": "selectedQuality setter → updateResolutions()"
          }'
        >
          <option 
            v-for="quality in qualities" 
            :key="quality" 
            :value="quality"
            :id="'option-quality-' + quality.toLowerCase()"
          >
            {{ quality }}
          </option>
        </select>
      </div>

      <!-- Resolution 선택 -->
      <div 
        id="toolbar-group-resolution"
        class="c-preview-toolbar__group"
        data-dev='{
          "role": "Resolution 선택 그룹",
          "id": "toolbar-group-resolution",
          "func": "해상도 선택 UI (Ratio + Quality 조합에 따라 동적 생성)",
          "goal": "사용자가 프로젝트의 정확한 해상도 설정",
          "state": { 
            "selectedResolution": "선택된 해상도",
            "availableResolutions": "선택 가능한 해상도 목록"
          },
          "path": "frontend/js/components/PreviewToolbar.js → resolution group",
          "py": "",
          "js": "selectedResolution setter"
        }'
      >
        <label 
          for="select-resolution"
          id="label-resolution"
          class="c-preview-toolbar__label"
          data-dev='{
            "role": "Resolution 라벨",
            "id": "label-resolution",
            "func": "Resolution 선택 필드 설명 텍스트",
            "goal": "사용자가 선택 필드의 용도를 인식",
            "state": {},
            "path": "frontend/js/components/PreviewToolbar.js → resolution label",
            "py": "",
            "js": ""
          }'
        >
          Resolution:
        </label>
        
        <select 
          id="select-resolution"
          class="c-preview-toolbar__select"
          v-model="selectedResolution"
          data-js-resolution
          :data-dev='{
            "role": "Resolution 선택 드롭다운",
            "id": "select-resolution",
            "func": "해상도 선택 시 store.canvas.resolution 업데이트",
            "goal": "사용자가 원하는 정확한 해상도를 선택",
            "state": { 
              "value": selectedResolution, 
              "options": availableResolutions 
            },
            "path": "frontend/js/components/PreviewToolbar.js → resolution select",
            "py": "",
            "js": "selectedResolution setter"
          }'
        >
          <option 
            v-for="(res, index) in availableResolutions" 
            :key="index" 
            :value="res.label"
            :id="'option-resolution-' + index"
          >
            {{ res.label }}
          </option>
        </select>
      </div>
    </div>
  `
};

// CommonJS 모듈로 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PreviewToolbar;
}
