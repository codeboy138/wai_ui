/**
 * [DATA-DEV: PreviewCanvas]
 * - 역할: 캔버스 박스 렌더링 + Interact.js 드래그/리사이즈
 * - 고유ID: preview-canvas
 * - 기능: 캔버스 박스 생성, 드래그/리사이즈, 컨텍스트 메뉴
 * - 로직: Interact.js → updateBoxPosition/Size → canvasBoxes 업데이트
 * - 데이터: canvasBoxes[]
 * - 경로: frontend/js/components/PreviewCanvas.js
 * - 명령: firePython('update_box', {id, x, y, w, h})
 */

export default {
  name: 'PreviewCanvas',
  template: '<div id="preview-canvas-container" ' +
            'class="c-preview-canvas" ' +
            'data-action="js:canvasInteraction" ' +
            'title="캔버스 영역" ' +
            '@contextmenu="handleCanvasContextMenu">' +
            '<div v-for="box in $root.canvasBoxes" ' +
            ':key="box.id" ' +
            ':id="\'canvas-box-\' + box.id" ' +
            'class="c-canvas__box" ' +
            ':class="{ \'c-canvas__box--selected\': box.id === $root.selectedCanvasBoxId }" ' +
            ':style="{ ' +
            'left: box.x + \'px\', ' +
            'top: box.y + \'px\', ' +
            'width: box.width + \'px\', ' +
            'height: box.height + \'px\', ' +
            'zIndex: box.zIndex, ' +
            'backgroundColor: box.bgColor || \'transparent\' ' +
            '}" ' +
            'data-action="js:selectBox" ' +
            ':title="\'박스 \' + box.name" ' +
            '@click="selectBox(box.id)" ' +
            '@contextmenu.prevent="handleBoxContextMenu(box, $event)">' +
            '<span class="c-canvas__box-label">{{ box.name }}</span>' +
            '</div>' +
            '</div>',
  
  mounted() {
    this.setupBoxInteraction();
  },
  
  methods: {
    selectBox(boxId) {
      this.$root.selectedCanvasBoxId = boxId;
      console.log('[PreviewCanvas] 박스 선택:', boxId);
    },
    
    handleCanvasContextMenu(e) {
      console.log('[PreviewCanvas] 캔버스 우클릭:', e.offsetX, e.offsetY);
      // 캔버스 빈 영역 우클릭 시 "박스 추가" 메뉴
    },
    
    handleBoxContextMenu(box, e) {
      console.log('[PreviewCanvas] 박스 우클릭:', box.id);
      // 박스 우클릭 시 "삭제", "복사" 등 메뉴
    },
    
    setupBoxInteraction() {
      if (typeof interact === 'undefined') {
        console.warn('[PreviewCanvas] Interact.js 미로드');
        return;
      }
      
      interact('.c-canvas__box')
        .draggable({
          listeners: {
            move: (event) => {
              const boxId = parseInt(event.target.id.replace('canvas-box-', ''));
              const box = this.$root.canvasBoxes.find(b => b.id === boxId);
              if (box) {
                box.x += event.dx;
                box.y += event.dy;
                console.log('[PreviewCanvas] 박스 ' + boxId + ' 드래그:', box.x, box.y);
              }
            }
          }
        })
        .resizable({
          edges: { left: true, right: true, bottom: true, top: true },
          listeners: {
            move: (event) => {
              const boxId = parseInt(event.target.id.replace('canvas-box-', ''));
              const box = this.$root.canvasBoxes.find(b => b.id === boxId);
              if (box) {
                box.width = event.rect.width;
                box.height = event.rect.height;
                box.x += event.deltaRect.left;
                box.y += event.deltaRect.top;
                console.log('[PreviewCanvas] 박스 ' + boxId + ' 리사이즈:', box.width, box.height);
              }
            }
          }
        });
    }
  }
};
