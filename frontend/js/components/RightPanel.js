/**
 * ==========================================
 * RightPanel.js
 * 
 * 역할: 4x4 레이어 행렬(Layer Matrix) 관리 패널
 * 경로: frontend/js/components/RightPanel.js
 * ==========================================
 */

export default {
  name: 'RightPanel',
  
  data() {
    return {
      rows: 4,
      cols: 4
    };
  },
  
  computed: {
    /**
     * 레이어 행렬 데이터 (4x4)
     * @returns {Array<Array>} 2D 배열 [ [{layer}, ...], [{layer}, ...], ... ]
     */
    layerMatrix() {
      const matrix = [];
      for (let row = 0; row < this.rows; row++) {
        const rowData = [];
        for (let col = 0; col < this.cols; col++) {
          const layer = this.$store.layers.find(
            l => l.row === row && l.col === col
          );
          rowData.push(layer || null);
        }
        matrix.push(rowData);
      }
      return matrix;
    }
  },
  
  methods: {
    /**
     * 셀 클릭 핸들러
     * @param {Number} row - 행 인덱스 (0~3)
     * @param {Number} col - 열 인덱스 (0~3)
     */
    handleCellClick(row, col) {
      const layer = this.layerMatrix[row][col];
      if (layer) {
        this.$store.selectLayer(layer.id);
      } else {
        this.$store.addLayerToMatrix(row, col);
      }
    },
    
    /**
     * 레이어 삭제
     * @param {String} layerId - 삭제할 레이어 ID
     */
    deleteLayer(layerId) {
      this.$store.deleteLayer(layerId);
    },
    
    /**
     * 자동 레이어 번호 생성
     * @param {Number} row - 행 인덱스
     * @param {Number} col - 열 인덱스
     * @returns {String} 레이어 번호 (예: 'L1', 'L5')
     */
    getAutoLayerNumber(row, col) {
      const index = row * this.cols + col + 1;
      return `L${index}`;
    }
  },
  
  template: `
    <div 
      id="right-panel-container"
      class="c-right-panel"
      :data-dev='{
        "role": "레이어 행렬 매니저 패널",
        "id": "right-panel-container",
        "func": "4x4 레이어 행렬을 시각적으로 표시하고, 각 셀 클릭으로 레이어 추가/선택 가능",
        "goal": "사용자가 레이어 구조를 직관적으로 파악하고 관리",
        "state": {
          "layerMatrix": "4x4 레이어 배열 (null이면 빈 셀)",
          "rows": 4,
          "cols": 4
        },
        "path": "frontend/js/components/RightPanel.js",
        "py": "",
        "js": "handleCellClick(row, col), deleteLayer(layerId), getAutoLayerNumber(row, col)"
      }'
    >
      <!-- 패널 헤더 -->
      <div 
        id="right-panel-header"
        class="c-right-panel__header"
        :data-dev='{
          "role": "패널 헤더",
          "id": "right-panel-header",
          "func": "패널 제목 표시",
          "goal": "사용자가 현재 패널이 레이어 매니저임을 인식",
          "state": {},
          "path": "frontend/js/components/RightPanel.js → header",
          "py": "",
          "js": ""
        }'
      >
        <h3 class="c-right-panel__title">Layer Matrix</h3>
      </div>
      
      <!-- 레이어 행렬 (4x4 Grid) -->
      <div 
        id="layer-matrix"
        class="c-layer-matrix"
        :data-dev='{
          "role": "4x4 레이어 행렬 그리드",
          "id": "layer-matrix",
          "func": "4행 4열 그리드로 레이어 배치 시각화",
          "goal": "사용자가 레이어 위치를 그리드 형태로 직관적으로 파악",
          "state": {
            "layerMatrix": "2D 배열 [4][4]",
            "rows": 4,
            "cols": 4
          },
          "path": "frontend/js/components/RightPanel.js → layer-matrix",
          "py": "",
          "js": "handleCellClick(row, col)"
        }'
      >
        <div 
          v-for="(rowData, rowIndex) in layerMatrix"
          :key="'row-' + rowIndex"
          :id="'layer-row-' + rowIndex"
          class="c-layer-matrix__row"
          :data-dev='{
            "role": "레이어 행렬 행(Row)",
            "id": "layer-row-" + rowIndex,
            "func": "행렬의 한 행(4개 셀) 묶음",
            "goal": "사용자가 행 단위로 레이어 배치를 인식",
            "state": {
              "rowIndex": rowIndex,
              "rowData": "해당 행의 4개 셀 데이터"
            },
            "path": "frontend/js/components/RightPanel.js → layer-matrix → row",
            "py": "",
            "js": ""
          }'
        >
          <div 
            v-for="(layer, colIndex) in rowData"
            :key="'cell-' + rowIndex + '-' + colIndex"
            :id="'layer-cell-' + colIndex + '-' + rowIndex"
            :class="[
              'c-layer-cell',
              { 'c-layer-cell--empty': !layer },
              { 'c-layer-cell--active': layer && layer.id === $store.selectedLayerId }
            ]"
            :data-js-cell="rowIndex + '-' + colIndex"
            @click="handleCellClick(rowIndex, colIndex)"
            :title="layer ? 'Layer: ' + layer.name : 'Empty Cell'"
            :data-dev='{
              "role": "레이어 행렬 셀",
              "id": "layer-cell-" + colIndex + "-" + rowIndex,
              "func": "레이어가 할당된 셀(또는 빈 셀) 표시, 클릭 시 레이어 선택 또는 추가",
              "goal": "사용자가 레이어를 선택하거나 빈 셀에 새 레이어 추가",
              "state": {
                "layer": layer ? { "id": layer.id, "name": layer.name } : null,
                "row": rowIndex,
                "col": colIndex,
                "isEmpty": !layer,
                "isActive": layer && layer.id === $store.selectedLayerId
              },
              "path": "frontend/js/components/RightPanel.js → layer-matrix → cell",
              "py": "",
              "js": "handleCellClick(row, col)"
            }'
          >
            <!-- 레이어가 있는 경우 -->
            <div 
              v-if="layer"
              :id="'layer-content-' + layer.id"
              class="c-layer-cell__content"
              :data-dev='{
                "role": "레이어 셀 내용",
                "id": "layer-content-" + layer.id,
                "func": "레이어 이름과 삭제 버튼 표시",
                "goal": "사용자가 레이어 정보를 확인하고 삭제",
                "state": {
                  "layerId": layer.id,
                  "layerName": layer.name
                },
                "path": "frontend/js/components/RightPanel.js → layer-matrix → cell → content",
                "py": "",
                "js": "deleteLayer(layerId)"
              }'
            >
              <span class="c-layer-cell__name">{{ layer.name }}</span>
              <button
                :id="'btn-delete-layer-' + layer.id"
                class="c-layer-cell__delete"
                :data-js-delete-layer="layer.id"
                @click.stop="deleteLayer(layer.id)"
                title="Delete Layer"
                :data-dev='{
                  "role": "레이어 삭제 버튼",
                  "id": "btn-delete-layer-" + layer.id,
                  "func": "클릭 시 해당 레이어 삭제",
                  "goal": "사용자가 불필요한 레이어를 제거",
                  "state": {
                    "layerId": layer.id
                  },
                  "path": "frontend/js/components/RightPanel.js → layer-matrix → cell → delete button",
                  "py": "",
                  "js": "deleteLayer(layerId)"
                }'
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- 빈 셀인 경우 자동 번호 표시 -->
            <div 
              v-else
              :id="'layer-empty-' + rowIndex + '-' + colIndex"
              class="c-layer-cell__empty"
              :data-dev='{
                "role": "빈 레이어 셀 표시",
                "id": "layer-empty-" + rowIndex + "-" + colIndex,
                "func": "빈 셀에 자동 번호(L1, L2 등) 표시",
                "goal": "사용자가 레이어 추가 가능한 위치를 시각적으로 확인",
                "state": {
                  "row": rowIndex,
                  "col": colIndex,
                  "autoNumber": getAutoLayerNumber(rowIndex, colIndex)
                },
                "path": "frontend/js/components/RightPanel.js → layer-matrix → cell → empty",
                "py": "",
                "js": "getAutoLayerNumber(row, col)"
              }'
            >
              {{ getAutoLayerNumber(rowIndex, colIndex) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
