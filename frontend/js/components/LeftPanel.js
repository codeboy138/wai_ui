/**
 * ==========================================
 * LeftPanel.js
 * 
 * 역할: 자산 라이브러리 패널 (이미지, 비디오, 오디오, 텍스트 관리)
 * 경로: frontend/js/components/LeftPanel.js
 * ==========================================
 */

const LeftPanel = {
  name: 'LeftPanel',
  
  data() {
    return {
      selectedCategory: 'Images'
    };
  },
  
  computed: {
    currentAssets() {
      const store = this.$store;  // ← 수정: this.$root.store → this.$store
      
      switch(this.selectedCategory) {
        case 'Images':
          return store.assets.images;
        case 'Videos':
          return store.assets.videos;
        case 'Audios':
          return store.assets.audios;
        case 'Texts':
          return store.assets.texts;
        default:
          return [];
      }
    }
  },
  
  methods: {
    selectCategory(category) {
      this.selectedCategory = category;
    },
    
    addAsset() {
      console.log('[LeftPanel] Add Asset:', this.selectedCategory);
    },
    
    importAsset() {
      console.log('[LeftPanel] Import Asset:', this.selectedCategory);
    },
    
    selectAsset(asset) {
      console.log('[LeftPanel] Asset Selected:', asset);
    }
  },
  
  template: `
    <div 
      id="left-panel-container"
      class="c-left-panel"
      data-dev='{
        "role": "자산 라이브러리 패널",
        "id": "left-panel-container",
        "func": "이미지·비디오·오디오·텍스트 자산 관리 및 프리뷰 캔버스로 추가",
        "goal": "프로젝트에서 사용할 미디어 자산을 카테고리별로 관리하고, 클릭 시 캔버스에 추가",
        "state": {
          "selectedCategory": "현재 선택된 자산 카테고리",
          "currentAssets": "선택된 카테고리의 자산 배열"
        },
        "path": "frontend/js/components/LeftPanel.js",
        "py": "",
        "js": "selectCategory(category), addAsset(), importAsset(), selectAsset(asset)"
      }'
    >
      <div 
        id="left-panel-header"
        class="c-left-panel__header"
      >
        <button 
          v-for="cat in ['Images', 'Videos', 'Audios', 'Texts']"
          :key="cat"
          :id="'asset-tab-' + cat.toLowerCase()"
          :class="[
            'c-left-panel__tab',
            { 'c-left-panel__tab--active': selectedCategory === cat }
          ]"
          :data-js-tab="cat"
          @click="selectCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>

      <div 
        id="left-panel-assets"
        class="c-left-panel__assets"
      >
        <div
          v-for="(asset, index) in currentAssets"
          :key="asset.id"
          :id="'asset-item-' + asset.id"
          class="c-asset-list__item"
          :data-js-item="asset.id"
          @click="selectAsset(asset)"
        >
          <div 
            :id="'asset-thumbnail-' + asset.id"
            class="c-asset-list__thumbnail"
            :style="{ backgroundImage: 'url(' + asset.url + ')' }"
          ></div>

          <div 
            :id="'asset-name-' + asset.id"
            class="c-asset-list__name"
          >
            {{ asset.name }}
          </div>
        </div>

        <div 
          v-if="currentAssets.length === 0"
          id="left-panel-empty"
          class="c-left-panel__empty"
        >
          No {{ selectedCategory }} available. Add or import assets.
        </div>
      </div>

      <div 
        id="left-panel-actions"
        class="c-left-panel__actions"
      >
        <button 
          id="left-panel-btn-add"
          class="c-left-panel__btn c-left-panel__btn--add"
          data-js-add
          @click="addAsset"
          title="Add"
        >
          Add
        </button>

        <button 
          id="left-panel-btn-import"
          class="c-left-panel__btn c-left-panel__btn--import"
          data-js-import
          @click="importAsset"
          title="Import"
        >
          Import
        </button>
      </div>
    </div>
  `
};

export default LeftPanel;
