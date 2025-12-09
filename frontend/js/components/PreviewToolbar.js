/**
 * ==========================================
 * PreviewToolbar.js
 * 
 * 역할: 프리뷰 캔버스 상단 도구 모음 (Ratio, Quality, Resolution 선택)
 * 경로: frontend/js/components/PreviewToolbar.js
 * ==========================================
 */

import UICustom from './UICustom.js';

const PreviewToolbar = {
  name: 'PreviewToolbar',
  
  data() {
    return {
      ratios: ['16:9', '4:3', '1:1', '21:9'],
      qualities: ['4K', 'FHD', 'HD', 'SD']
    };
  },
  
  computed: {
    selectedRatio: {
      get() {
        return this.$store.selectedRatio;  // ← 수정
      },
      set(value) {
        this.$store.selectedRatio = value;  // ← 수정
        this.updateResolutions();
      }
    },
    
    selectedQuality: {
      get() {
        return this.$store.selectedQuality;  // ← 수정
      },
      set(value) {
        this.$store.selectedQuality = value;  // ← 수정
        this.updateResolutions();
      }
    },
    
    selectedResolution: {
      get() {
        return this.$store.selectedResolution;  // ← 수정
      },
      set(value) {
        this.$store.selectedResolution = value;  // ← 수정
      }
    },
    
    availableResolutions() {
      return UICustom.getResolutions(this.selectedRatio, this.selectedQuality);
    }
  },
  
  methods: {
    updateResolutions() {
      if (this.availableResolutions.length > 0) {
        this.selectedResolution = this.availableResolutions[0].label;
      }
    }
  },
  
  mounted() {
    this.updateResolutions();
  },
  
  template: `
    <div 
      id="preview-toolbar-container"
      class="c-preview-toolbar"
    >
      <div 
        id="toolbar-group-ratio"
        class="c-preview-toolbar__group"
      >
        <label 
          for="select-ratio"
          id="label-ratio"
          class="c-preview-toolbar__label"
        >
          Ratio:
        </label>
        
        <select 
          id="select-ratio"
          class="c-preview-toolbar__select"
          v-model="selectedRatio"
          data-js-ratio
        >
          <option 
            v-for="ratio in ratios" 
            :key="ratio" 
            :value="ratio"
          >
            {{ ratio }}
          </option>
        </select>
      </div>

      <div 
        id="toolbar-group-quality"
        class="c-preview-toolbar__group"
      >
        <label 
          for="select-quality"
          id="label-quality"
          class="c-preview-toolbar__label"
        >
          Quality:
        </label>
        
        <select 
          id="select-quality"
          class="c-preview-toolbar__select"
          v-model="selectedQuality"
          data-js-quality
        >
          <option 
            v-for="quality in qualities" 
            :key="quality" 
            :value="quality"
          >
            {{ quality }}
          </option>
        </select>
      </div>

      <div 
        id="toolbar-group-resolution"
        class="c-preview-toolbar__group"
      >
        <label 
          for="select-resolution"
          id="label-resolution"
          class="c-preview-toolbar__label"
        >
          Resolution:
        </label>
        
        <select 
          id="select-resolution"
          class="c-preview-toolbar__select"
          v-model="selectedResolution"
          data-js-resolution
        >
          <option 
            v-for="(res, index) in availableResolutions" 
            :key="index" 
            :value="res.label"
          >
            {{ res.label }}
          </option>
        </select>
      </div>
    </div>
  `
};

export default PreviewToolbar;
