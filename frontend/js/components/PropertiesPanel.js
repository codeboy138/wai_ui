/**
 * [DATA-DEV: PropertiesPanel]
 * - 역할: 선택된 요소의 속성 표시 + 수정
 * - 고유ID: properties-panel
 * - 기능: 클립/박스 속성 표시, 삭제 버튼
 * - 로직: selectedClipId/selectedCanvasBoxId 변경 시 업데이트
 * - 데이터: selectedClip, selectedCanvasBox
 * - 경로: frontend/js/components/PropertiesPanel.js
 * - 명령: firePython('delete_clip', {id}), firePython('update_box_property', {id, key, value})
 */

export default {
  name: 'PropertiesPanel',
  template: '<section id="properties-panel-container" ' +
            'class="c-properties-panel" ' +
            'data-action="js:propertiesDisplay" ' +
            'title="속성 패널">' +
            
            '<!-- 선택된 요소 없음 -->' +
            '<div v-if="!selectedItem" ' +
            'id="properties-panel-empty" ' +
            'class="c-properties-panel__empty" ' +
            'data-action="js:emptyState" ' +
            'title="선택된 요소 없음">' +
            '<p>선택된 요소가 없습니다</p>' +
            '</div>' +
            
            '<!-- 클립 속성 -->' +
            '<div v-if="selectedClip" ' +
            'id="properties-panel-clip" ' +
            'class="c-properties-panel__clip" ' +
            'data-action="js:clipProperties" ' +
            'title="클립 속성">' +
            '<h3 class="c-properties-panel__title">클립: {{ selectedClip.name }}</h3>' +
            '<div class="c-properties-panel__field">' +
            '<label>시작 시간:</label>' +
            '<input type="number" v-model.number="selectedClip.start" />' +
            '</div>' +
            '<div class="c-properties-panel__field">' +
            '<label>길이:</label>' +
            '<input type="number" v-model.number="selectedClip.duration" />' +
            '</div>' +
            '<button id="properties-panel-delete-clip-btn" ' +
            'class="c-properties-panel__delete-btn" ' +
            'data-action="py:delete_clip" ' +
            'title="클립 삭제" ' +
            '@click="deleteClip">' +
            '<i class="fas fa-trash"></i> 삭제' +
            '</button>' +
            '</div>' +
            
            '<!-- 박스 속성 -->' +
            '<div v-if="selectedBox" ' +
            'id="properties-panel-box" ' +
            'class="c-properties-panel__box" ' +
            'data-action="js:boxProperties" ' +
            'title="박스 속성">' +
            '<h3 class="c-properties-panel__title">박스: {{ selectedBox.name }}</h3>' +
            '<div class="c-properties-panel__field">' +
            '<label>X:</label>' +
            '<input type="number" v-model.number="selectedBox.x" />' +
            '</div>' +
            '<div class="c-properties-panel__field">' +
            '<label>Y:</label>' +
            '<input type="number" v-model.number="selectedBox.y" />' +
            '</div>' +
            '<div class="c-properties-panel__field">' +
            '<label>너비:</label>' +
            '<input type="number" v-model.number="selectedBox.width" />' +
            '</div>' +
            '<div class="c-properties-panel__field">' +
            '<label>높이:</label>' +
            '<input type="number" v-model.number="selectedBox.height" />' +
            '</div>' +
            '<button id="properties-panel-delete-box-btn" ' +
            'class="c-properties-panel__delete-btn" ' +
            'data-action="py:delete_box" ' +
            'title="박스 삭제" ' +
            '@click="deleteBox">' +
            '<i class="fas fa-trash"></i> 삭제' +
            '</button>' +
            '</div>' +
            
            '</section>',
  
  computed: {
    selectedItem() {
      return this.selectedClip || this.selectedBox;
    },
    selectedClip() {
      return this.$root.clips.find(c => c.id === this.$root.selectedClipId);
    },
    selectedBox() {
      return this.$root.canvasBoxes.find(b => b.id === this.$root.selectedCanvasBoxId);
    }
  },
  
  methods: {
    deleteClip() {
      if (!this.selectedClip) return;
      console.log('[PropertiesPanel] 클립 삭제:', this.selectedClip.id);
      this.$root.firePython('delete_clip', { id: this.selectedClip.id });
      this.$root.selectedClipId = null;
    },
    
    deleteBox() {
      if (!this.selectedBox) return;
      console.log('[PropertiesPanel] 박스 삭제:', this.selectedBox.id);
      this.$root.firePython('delete_box', { id: this.selectedBox.id });
      this.$root.selectedCanvasBoxId = null;
    }
  }
};
