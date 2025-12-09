/**
 * [DATA-DEV: LayerPanel]
 * - 역할: 레이어 매트릭스 (4x3) 관리
 * - 고유ID: layer-panel
 * - 기능: 레이어 선택, 컬럼 추가/삭제, 템플릿 저장
 * - 로직: 레이어 클릭 → selectedLayer 업데이트 → firePython('select_layer', {id})
 * - 데이터: layers[] (4x3 = 12개)
 * - 경로: frontend/js/components/LayerPanel.js
 * - 명령: firePython('select_layer', {id}), firePython('add_column')
 */

export default {
  name: 'LayerPanel',
  template: '<section id="layer-panel-container" ' +
            'class="c-layer-panel" ' +
            'data-action="js:layerManagement" ' +
            'title="레이어 패널">' +
            
            '<!-- 레이어 패널 헤더 -->' +
            '<div id="layer-panel-header" ' +
            'class="c-layer-panel__header" ' +
            'data-action="js:layerHeader" ' +
            'title="레이어 헤더">' +
            '<button id="layer-panel-add-col-btn" ' +
            'class="c-layer-panel__add-col-btn" ' +
            'data-action="py:add_column" ' +
            'title="컬럼 추가" ' +
            '@click="addColumn">' +
            '<i class="fas fa-plus"></i> 컬럼 추가' +
            '</button>' +
            '<button id="layer-panel-save-template-btn" ' +
            'class="c-layer-panel__save-template-btn" ' +
            'data-action="py:save_template" ' +
            'title="템플릿 저장" ' +
            '@click="saveTemplate">' +
            '<i class="fas fa-save"></i> 템플릿' +
            '</button>' +
            '</div>' +
            
            '<!-- 레이어 매트릭스 (4x3) -->' +
            '<div id="layer-panel-matrix" ' +
            'class="c-layer-panel__matrix" ' +
            'data-action="js:layerMatrix" ' +
            'title="레이어 매트릭스">' +
            '<div v-for="(layer, index) in $root.layers" ' +
            ':key="layer.id" ' +
            ':id="\'layer-panel-cell-\' + layer.id" ' +
            'class="c-layer-panel__cell" ' +
            ':class="{ \'c-layer-panel__cell--selected\': layer.id === $root.selectedLayerId }" ' +
            'data-action="js:selectLayer" ' +
            ':title="\'레이어 \' + layer.name" ' +
            '@click="selectLayer(layer.id)">' +
            '<span class="c-layer-panel__cell-name">{{ layer.name }}</span>' +
            '</div>' +
            '</div>' +
            
            '</section>',
  
  methods: {
    selectLayer(layerId) {
      this.$root.selectedLayerId = layerId;
      console.log('[LayerPanel] 레이어 선택:', layerId);
      this.$root.firePython('select_layer', { id: layerId });
    },
    
    addColumn() {
      console.log('[LayerPanel] 컬럼 추가 요청');
      this.$root.firePython('add_column');
    },
    
    saveTemplate() {
      console.log('[LayerPanel] 템플릿 저장 요청');
      this.$root.firePython('save_template');
    }
  }
};
