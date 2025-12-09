/**
 * ==========================================
 * RightPanel.js
 * 
 * 역할: 레이어 매트릭스 + 속성 패널
 * 경로: frontend/js/components/RightPanel.js
 * ==========================================
 */

const RightPanel = {
  name: 'RightPanel',
  
  data() {
    return {
      // 레이어 매트릭스 컬럼 (타입별)
      columns: ['Video', 'Image', 'Text', 'Audio', 'Effect'],
      // 레이어 매트릭스 행 개수
      rowCount: 10,
      // 현재 선택된 레이어 ID
      selectedLayerId: null
    };
  },
  
  computed: {
    /**
     * 전체 레이어 목록 (store에서 가져옴)
     * @returns {Array} 레이어 배열
     */
    layers() {
      return this.$root.store.layers || [];
    },
    
    /**
     * 현재 선택된 레이어 객체
     * @returns {Object|null} 선택된 레이어 또는 null
     */
    selectedLayer() {
      if (!this.selectedLayerId) return null;
      return this.layers.find(layer => layer.id === this.selectedLayerId);
    },
    
    /**
     * 레이어 매트릭스 셀 배열 생성
     * @returns {Array} 셀 배열 [{ col, row, layer }, ...]
     */
    matrixCells() {
      const cells = [];
      
      for (let row = 0; row < this.rowCount; row++) {
        for (let col = 0; col < this.columns.length; col++) {
          const columnType = this.columns[col];
          
          // 해당 셀에 배치된 레이어 찾기
          const layer = this.layers.find(
            l => l.matrixCol === col && l.matrixRow === row
          );
          
          cells.push({
            col,
            row,
            columnType,
            layer: layer || null
          });
        }
      }
      
      return cells;
    }
  },
  
  methods: {
    /**
     * 레이어 매트릭스 셀 클릭 핸들러
     * @param {Number} col - 컬럼 인덱스
     * @param {Number} row - 행 인덱스
     */
    selectCell(col, row) {
      const cell = this.matrixCells.find(c => c.col === col && c.row === row);
      
      if (cell && cell.layer) {
        this.selectedLayerId = cell.layer.id;
        console.log('[RightPanel] Layer Selected:', cell.layer);
      } else {
        this.selectedLayerId = null;
      }
    },
    
    /**
     * 새 레이어 추가 핸들러
     * @param {Number} col - 컬럼 인덱스
     * @param {Number} row - 행 인덱스
     */
    addLayer(col, row) {
      const columnType = this.columns[col];
      const newLayer = {
        id: 'layer-' + Date.now(),
        name: `${columnType} ${row + 1}`,
        type: columnType.toLowerCase(),
        matrixCol: col,
        matrixRow: row,
        visible: true,
        locked: false,
        zIndex: this.calculateZIndex(col, row)
      };
      
      this.layers.push(newLayer);
      console.log('[RightPanel] Layer Added:', newLayer);
    },
    
    /**
     * 레이어 삭제 핸들러
     * @param {String} layerId - 삭제할 레이어 ID
     */
    deleteLayer(layerId) {
      const index = this.layers.findIndex(l => l.id === layerId);
      if (index !== -1) {
        this.layers.splice(index, 1);
        console.log('[RightPanel] Layer Deleted:', layerId);
        
        if (this.selectedLayerId === layerId) {
          this.selectedLayerId = null;
        }
      }
    },
    
    /**
     * 레이어 Z-Index 자동 계산 (컬럼 × 100 + 행)
     * @param {Number} col - 컬럼 인덱스
     * @param {Number} row - 행 인덱스
     * @returns {Number} 계산된 Z-Index
     */
    calculateZIndex(col, row) {
      return (col * 100) + row + 20; // Base Content Z-Index: 20
    },
    
    /**
     * 레이어 속성 업데이트 핸들러
     * @param {String} property - 속성명 (x, y, width, height, visible, locked)
     * @param {*} value - 새 속성 값
     */
    updateLayerProperty(property, value) {
      if (this.selectedLayer) {
        this.selectedLayer[property] = value;
        console.log('[RightPanel] Layer Property Updated:', property, value);
      }
    }
  },
  
  template: `
    <div 
      id="right-panel-container"
      class="c-right-panel"
      data-dev='{
        "role": "레이어 매트릭스 + 속성 패널",
        "id": "right-panel-container",
        "func": "레이어 매트릭스 그리드와 선택된 레이어의 속성 편집 UI 제공",
        "goal": "사용자가 레이어를 매트릭스로 관리하고, 선택된 레이어의 속성을 수정",
        "state": {
          "layers": "전체 레이어 배열",
          "selectedLayerId": "현재 선택된 레이어 ID",
          "selectedLayer": "선택된 레이어 객체",
          "matrixCells": "레이어 매트릭스 셀 배열"
        },
        "path": "frontend/js/components/RightPanel.js",
        "py": "",
        "js": "selectCell(col, row), addLayer(col, row), deleteLayer(id), updateLayerProperty(prop, value)"
      }'
    >
      <!-- 레이어 매트릭스 섹션 -->
      <section 
        id="right-panel-matrix-section"
        class="c-right-panel__section"
        data-dev='{
          "role": "레이어 매트릭스 섹션",
          "id": "right-panel-matrix-section",
          "func": "레이어를 타입별 컬럼과 행으로 구성된 그리드에 배치",
          "goal": "사용자가 레이어를 시각적으로 관리하고 Z-Index를 직관적으로 파악",
          "state": { "matrixCells": matrixCells },
          "path": "frontend/js/components/RightPanel.js → matrix section",
          "py": "",
          "js": "selectCell(col, row), addLayer(col, row)"
        }'
      >
        <h3 
          id="matrix-section-title"
          class="c-right-panel__section-title"
          data-dev='{
            "role": "레이어 매트릭스 제목",
            "id": "matrix-section-title",
            "func": "섹션 용도를 나타내는 제목 표시",
            "goal": "사용자가 레이어 매트릭스 섹션임을 인식",
            "state": {},
            "path": "frontend/js/components/RightPanel.js → matrix title",
            "py": "",
            "js": ""
          }'
        >
          Layer Matrix
        </h3>

        <!-- 레이어 매트릭스 그리드 -->
        <div 
          id="layer-matrix"
          class="c-layer-matrix"
          data-dev='{
            "role": "레이어 매트릭스 그리드",
            "id": "layer-matrix",
            "func": "컬럼(타입) × 행(순서) 그리드로 레이어 셀 배치",
            "goal": "사용자가 레이어를 타입별로 구분하여 배치하고 관리",
            "state": {
              "columns": columns,
              "rowCount": rowCount,
              "matrixCells": matrixCells
            },
            "path": "frontend/js/components/RightPanel.js → matrix grid",
            "py": "",
            "js": "selectCell(col, row)"
          }'
        >
          <!-- 컬럼 헤더 -->
          <div 
            id="layer-matrix-header"
            class="c-layer-matrix__header"
            data-dev='{
              "role": "레이어 매트릭스 컬럼 헤더",
              "id": "layer-matrix-header",
              "func": "각 컬럼(Video, Image, Text, Audio, Effect)의 제목 표시",
              "goal": "사용자가 각 컬럼의 레이어 타입을 인식",
              "state": { "columns": columns },
              "path": "frontend/js/components/RightPanel.js → matrix header",
              "py": "",
              "js": ""
            }'
          >
            <div 
              v-for="(column, colIndex) in columns"
              :key="colIndex"
              :id="'layer-matrix-col-' + colIndex"
              class="c-layer-matrix__col-header"
              :data-dev='{
                "role": "컬럼 헤더 셀",
                "id": "layer-matrix-col-" + colIndex,
                "func": "컬럼 타입명 표시 (Video, Image, Text 등)",
                "goal": "사용자가 해당 컬럼의 레이어 타입을 확인",
                "state": { "column": column },
                "path": "frontend/js/components/RightPanel.js → col header",
                "py": "",
                "js": ""
              }'
            >
              {{ column }}
            </div>
          </div>

          <!-- 매트릭스 셀 그리드 -->
          <div 
            id="layer-matrix-body"
            class="c-layer-matrix__body"
            data-dev='{
              "role": "레이어 매트릭스 본문 (셀 그리드)",
              "id": "layer-matrix-body",
              "func": "레이어 셀들을 컬럼 × 행 그리드로 배치",
              "goal": "사용자가 레이어를 클릭하여 선택하거나 빈 셀에 추가",
              "state": { "matrixCells": matrixCells },
              "path": "frontend/js/components/RightPanel.js → matrix body",
              "py": "",
              "js": "selectCell(col, row), addLayer(col, row)"
            }'
          >
            <div
              v-for="cell in matrixCells"
              :key="'cell-' + cell.col + '-' + cell.row"
              :id="'layer-cell-' + cell.col + '-' + cell.row"
              :class="[
                'c-layer-cell',
                { 'c-layer-cell--filled': cell.layer },
                { 'c-layer-cell--selected': cell.layer && cell.layer.id === selectedLayerId }
              ]"
              :data-js-cell="cell.col + '-' + cell.row"
              @click="selectCell(cell.col, cell.row)"
              @dblclick="!cell.layer && addLayer(cell.col, cell.row)"
              :data-dev='{
                "role": "레이어 매트릭스 셀",
                "id": "layer-cell-" + cell.col + "-" + cell.row,
                "func": "레이어 배치 가능한 셀 (클릭: 선택, 더블클릭: 레이어 추가)",
                "goal": "사용자가 레이어를 시각적으로 배치하고 선택",
                "state": {
                  "col": cell.col,
                  "row": cell.row,
                  "columnType": cell.columnType,
                  "layer": cell.layer,
                  "selected": cell.layer && cell.layer.id === selectedLayerId
                },
                "path": "frontend/js/components/RightPanel.js → layer cell",
                "py": "",
                "js": "selectCell(col, row), addLayer(col, row)"
              }'
            >
              <span v-if="cell.layer" class="c-layer-cell__name">
                {{ cell.layer.name }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 레이어 속성 섹션 -->
      <section 
        id="right-panel-properties-section"
        class="c-right-panel__section"
        data-dev='{
          "role": "레이어 속성 패널 섹션",
          "id": "right-panel-properties-section",
          "func": "선택된 레이어의 속성(위치, 크기, 가시성 등) 편집 UI 제공",
          "goal": "사용자가 선택된 레이어의 상세 속성을 수정",
          "state": { "selectedLayer": selectedLayer },
          "path": "frontend/js/components/RightPanel.js → properties section",
          "py": "",
          "js": "updateLayerProperty(prop, value), deleteLayer(id)"
        }'
      >
        <h3 
          id="properties-section-title"
          class="c-right-panel__section-title"
          data-dev='{
            "role": "속성 패널 제목",
            "id": "properties-section-title",
            "func": "섹션 용도를 나타내는 제목 표시",
            "goal": "사용자가 속성 패널 섹션임을 인식",
            "state": {},
            "path": "frontend/js/components/RightPanel.js → properties title",
            "py": "",
            "js": ""
          }'
        >
          Properties
        </h3>

        <!-- 레이어가 선택되지 않았을 때 -->
        <div 
          v-if="!selectedLayer"
          id="properties-empty"
          class="c-properties__empty"
          data-dev='{
            "role": "속성 패널 빈 상태",
            "id": "properties-empty",
            "func": "레이어가 선택되지 않았을 때 안내 메시지 표시",
            "goal": "사용자에게 레이어 선택 필요성을 알림",
            "state": { "visible": !selectedLayer },
            "path": "frontend/js/components/RightPanel.js → properties empty",
            "py": "",
            "js": ""
          }'
        >
          No layer selected. Select a layer from the matrix.
        </div>

        <!-- 레이어가 선택되었을 때 -->
        <div 
          v-else
          id="properties-panel"
          class="c-properties"
          data-dev='{
            "role": "레이어 속성 편집 폼",
            "id": "properties-panel",
            "func": "선택된 레이어의 속성 값을 입력 필드로 표시 및 수정",
            "goal": "사용자가 레이어 속성을 직접 편집",
            "state": { "selectedLayer": selectedLayer },
            "path": "frontend/js/components/RightPanel.js → properties panel",
            "py": "",
            "js": "updateLayerProperty(prop, value)"
          }'
        >
          <!-- 레이어 이름 -->
          <div class="c-properties__field">
            <label for="prop-layer-name" class="c-properties__label">Name:</label>
            <input 
              id="prop-layer-name"
              type="text"
              class="c-properties__input"
              :value="selectedLayer.name"
              @input="updateLayerProperty('name', $event.target.value)"
            />
          </div>

          <!-- X 위치 -->
          <div class="c-properties__field">
            <label for="prop-layer-x" class="c-properties__label">X:</label>
            <input 
              id="prop-layer-x"
              type="number"
              class="c-properties__input"
              :value="selectedLayer.x || 0"
              @input="updateLayerProperty('x', Number($event.target.value))"
            />
          </div>

          <!-- Y 위치 -->
          <div class="c-properties__field">
            <label for="prop-layer-y" class="c-properties__label">Y:</label>
            <input 
              id="prop-layer-y"
              type="number"
              class="c-properties__input"
              :value="selectedLayer.y || 0"
              @input="updateLayerProperty('y', Number($event.target.value))"
            />
          </div>

          <!-- Width -->
          <div class="c-properties__field">
            <label for="prop-layer-width" class="c-properties__label">Width:</label>
            <input 
              id="prop-layer-width"
              type="number"
              class="c-properties__input"
              :value="selectedLayer.width || 100"
              @input="updateLayerProperty('width', Number($event.target.value))"
            />
          </div>

          <!-- Height -->
          <div class="c-properties__field">
            <label for="prop-layer-height" class="c-properties__label">Height:</label>
            <input 
              id="prop-layer-height"
              type="number"
              class="c-properties__input"
              :value="selectedLayer.height || 100"
              @input="updateLayerProperty('height', Number($event.target.value))"
            />
          </div>

          <!-- Visible 체크박스 -->
          <div class="c-properties__field">
            <label for="prop-layer-visible" class="c-properties__label">
              <input 
                id="prop-layer-visible"
                type="checkbox"
                class="c-properties__checkbox"
                :checked="selectedLayer.visible"
                @change="updateLayerProperty('visible', $event.target.checked)"
              />
              Visible
            </label>
          </div>

          <!-- Locked 체크박스 -->
          <div class="c-properties__field">
            <label for="prop-layer-locked" class="c-properties__label">
              <input 
                id="prop-layer-locked"
                type="checkbox"
                class="c-properties__checkbox"
                :checked="selectedLayer.locked"
                @change="updateLayerProperty('locked', $event.target.checked)"
              />
              Locked
            </label>
          </div>

          <!-- 레이어 삭제 버튼 -->
          <button 
            id="btn-delete-layer"
            class="c-properties__btn c-properties__btn--delete"
            data-js-delete-layer
            @click="deleteLayer(selectedLayer.id)"
            title="Delete Layer"
            :data-dev='{
              "role": "레이어 삭제 버튼",
              "id": "btn-delete-layer",
              "func": "선택된 레이어를 삭제",
              "goal": "사용자가 불필요한 레이어를 제거",
              "state": {},
              "path": "frontend/js/components/RightPanel.js → delete button",
              "py": "",
              "js": "deleteLayer(selectedLayer.id)"
            }'
          >
            Delete Layer
          </button>
        </div>
      </section>
    </div>
  `
};

// CommonJS 모듈로 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RightPanel;
}
