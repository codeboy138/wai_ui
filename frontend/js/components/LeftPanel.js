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
      // 현재 선택된 자산 카테고리 (Images/Videos/Audios/Texts)
      selectedCategory: 'Images'
    };
  },
  
  computed: {
    /**
     * 현재 카테고리에 해당하는 자산 목록 반환
     * @returns {Array} 현재 선택된 카테고리의 자산 배열
     */
    currentAssets() {
      const store = this.$root.store;
      
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
    /**
     * 자산 카테고리 선택 핸들러
     * @param {String} category - 선택된 카테고리명 (Images, Videos, Audios, Texts)
     */
    selectCategory(category) {
      this.selectedCategory = category;
    },
    
    /**
     * 새 자산 추가 핸들러 (Python 백엔드 호출 필요)
     */
    addAsset() {
      console.log('[LeftPanel] Add Asset:', this.selectedCategory);
      // TODO: 백엔드 IPC 호출 - 파일 선택 다이얼로그
      // window.electronAPI?.addAsset(this.selectedCategory);
    },
    
    /**
     * 자산 가져오기 (Import) 핸들러
     */
    importAsset() {
      console.log('[LeftPanel] Import Asset:', this.selectedCategory);
      // TODO: 백엔드 IPC 호출 - 파일 임포트
      // window.electronAPI?.importAsset(this.selectedCategory);
    },
    
    /**
     * 자산 항목 클릭 핸들러 (프리뷰 캔버스에 추가)
     * @param {Object} asset - 클릭된 자산 객체 { id, name, url, type }
     */
    selectAsset(asset) {
      console.log('[LeftPanel] Asset Selected:', asset);
      
      // 레이어 매트릭스에 자산 추가 (RightPanel과 연동)
      this.$root.addLayer({
        name: asset.name,
        type: asset.type,
        visible: true,
        locked: false,
        asset: asset
      });
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
          "selectedCategory": "현재 선택된 자산 카테고리 (Images|Videos|Audios|Texts)",
          "currentAssets": "선택된 카테고리의 자산 배열 (store.assets[category])"
        },
        "path": "frontend/js/components/LeftPanel.js",
        "py": "window.electronAPI.addAsset(category), window.electronAPI.importAsset(category)",
        "js": "selectCategory(category), addAsset(), importAsset(), selectAsset(asset)"
      }'
    >
      <!-- 패널 헤더 (카테고리 탭) -->
      <div 
        id="left-panel-header"
        class="c-left-panel__header"
        data-dev='{
          "role": "자산 카테고리 탭 컨테이너",
          "id": "left-panel-header",
          "func": "자산 종류별 탭(Images/Videos/Audios/Texts) 선택 UI",
          "goal": "사용자가 보고 싶은 자산 카테고리를 클릭으로 전환",
          "state": { "selectedCategory": "활성화된 탭" },
          "path": "frontend/js/components/LeftPanel.js → template → header",
          "py": "",
          "js": "selectCategory(category)"
        }'
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
          :data-dev='{
            "role": "자산 카테고리 탭 버튼",
            "id": "asset-tab-" + cat.toLowerCase(),
            "func": "클릭 시 해당 카테고리의 자산 목록으로 전환",
            "goal": "사용자가 원하는 자산 타입(Images/Videos/Audios/Texts)을 선택",
            "state": { "active": selectedCategory === cat },
            "path": "frontend/js/components/LeftPanel.js → template → tab button",
            "py": "",
            "js": "selectCategory(cat)"
          }'
        >
          {{ cat }}
        </button>
      </div>

      <!-- 자산 목록 컨테이너 -->
      <div 
        id="left-panel-assets"
        class="c-left-panel__assets"
        data-dev='{
          "role": "자산 목록 스크롤 컨테이너",
          "id": "left-panel-assets",
          "func": "현재 카테고리의 자산 항목들을 수직 스크롤 리스트로 표시",
          "goal": "자산을 썸네일+이름 형태로 보여주고, 클릭 시 캔버스에 추가",
          "state": { "currentAssets": "표시 중인 자산 배열" },
          "path": "frontend/js/components/LeftPanel.js → template → assets container",
          "py": "",
          "js": "selectAsset(asset)"
        }'
      >
        <!-- 자산 항목 리스트 -->
        <div
          v-for="(asset, index) in currentAssets"
          :key="asset.id"
          :id="'asset-item-' + asset.id"
          class="c-asset-list__item"
          :data-js-item="asset.id"
          @click="selectAsset(asset)"
          :data-dev='{
            "role": "자산 항목 카드",
            "id": "asset-item-" + asset.id,
            "func": "자산의 썸네일과 이름을 표시하고, 클릭 시 캔버스에 추가",
            "goal": "사용자가 자산을 시각적으로 확인하고 선택 가능하게 함",
            "state": {
              "asset": { "id": asset.id, "name": asset.name, "url": asset.url, "type": asset.type }
            },
            "path": "frontend/js/components/LeftPanel.js → template → asset item",
            "py": "",
            "js": "selectAsset(asset)"
          }'
        >
          <!-- 자산 썸네일 -->
          <div 
            :id="'asset-thumbnail-' + asset.id"
            class="c-asset-list__thumbnail"
            :style="{ backgroundImage: 'url(' + asset.url + ')' }"
            :data-dev='{
              "role": "자산 썸네일 이미지",
              "id": "asset-thumbnail-" + asset.id,
              "func": "자산의 미리보기 이미지 표시 (background-image)",
              "goal": "사용자가 자산을 시각적으로 빠르게 인식",
              "state": { "url": asset.url },
              "path": "frontend/js/components/LeftPanel.js → template → thumbnail",
              "py": "",
              "js": ""
            }'
          ></div>

          <!-- 자산 이름 -->
          <div 
            :id="'asset-name-' + asset.id"
            class="c-asset-list__name"
            :data-dev='{
              "role": "자산 이름 텍스트",
              "id": "asset-name-" + asset.id,
              "func": "자산의 파일명 또는 이름 표시",
              "goal": "사용자가 자산을 텍스트로 식별",
              "state": { "name": asset.name },
              "path": "frontend/js/components/LeftPanel.js → template → name",
              "py": "",
              "js": ""
            }'
          >
            {{ asset.name }}
          </div>
        </div>

        <!-- 자산 없을 때 -->
        <div 
          v-if="currentAssets.length === 0"
          id="left-panel-empty"
          class="c-left-panel__empty"
          data-dev='{
            "role": "자산 없음 안내 메시지",
            "id": "left-panel-empty",
            "func": "현재 카테고리에 자산이 없을 때 표시되는 안내 문구",
            "goal": "사용자에게 자산 추가 필요성을 알림",
            "state": { "visible": currentAssets.length === 0 },
            "path": "frontend/js/components/LeftPanel.js → template → empty state",
            "py": "",
            "js": ""
          }'
        >
          No {{ selectedCategory }} available. Add or import assets.
        </div>
      </div>

      <!-- 하단 액션 버튼 (Add / Import) -->
      <div 
        id="left-panel-actions"
        class="c-left-panel__actions"
        data-dev='{
          "role": "자산 추가·가져오기 액션 버튼 컨테이너",
          "id": "left-panel-actions",
          "func": "자산을 새로 추가하거나 외부에서 가져오는 버튼 그룹",
          "goal": "사용자가 자산을 프로젝트에 추가할 수 있도록 함",
          "state": {},
          "path": "frontend/js/components/LeftPanel.js → template → actions",
          "py": "window.electronAPI.addAsset(category), window.electronAPI.importAsset(category)",
          "js": "addAsset(), importAsset()"
        }'
      >
        <button 
          id="left-panel-btn-add"
          class="c-left-panel__btn c-left-panel__btn--add"
          data-js-add
          @click="addAsset"
          title="Add"
          :data-dev='{
            "role": "자산 추가 버튼",
            "id": "left-panel-btn-add",
            "func": "클릭 시 자산 추가 다이얼로그 호출 (Python 백엔드)",
            "goal": "사용자가 새로운 자산을 프로젝트에 추가",
            "state": {},
            "path": "frontend/js/components/LeftPanel.js → template → add button",
            "py": "window.electronAPI.addAsset(selectedCategory)",
            "js": "addAsset()"
          }'
        >
          Add
        </button>

        <button 
          id="left-panel-btn-import"
          class="c-left-panel__btn c-left-panel__btn--import"
          data-js-import
          @click="importAsset"
          title="Import"
          :data-dev='{
            "role": "자산 가져오기 버튼",
            "id": "left-panel-btn-import",
            "func": "클릭 시 외부 파일 가져오기 다이얼로그 호출 (Python 백엔드)",
            "goal": "사용자가 기존 파일을 프로젝트로 임포트",
            "state": {},
            "path": "frontend/js/components/LeftPanel.js → template → import button",
            "py": "window.electronAPI.importAsset(selectedCategory)",
            "js": "importAsset()"
          }'
        >
          Import
        </button>
      </div>
    </div>
  `
};

// CommonJS 모듈로 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LeftPanel;
}
