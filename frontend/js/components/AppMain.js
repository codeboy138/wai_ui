/**
 * [DATA-DEV: AppMain]
 * - 역할: 메인 레이아웃 (3패널 구조)
 * - 고유ID: app-main
 * - 기능: 좌/중앙/우측 패널 렌더링
 * - 로직: LayerPanel + PreviewCanvas + PropertiesPanel 조합
 * - 데이터: leftPanelWidth, rightPanelWidth (store.js)
 * - 경로: frontend/js/components/AppMain.js
 * - 명령: 없음 (레이아웃 전용)
 */

import PreviewToolbar from './PreviewToolbar.js';
import RulerLine from './RulerLine.js';
import PreviewCanvas from './PreviewCanvas.js';
import TimelinePanel from './TimelinePanel.js';
import LayerPanel from './LayerPanel.js';
import PropertiesPanel from './PropertiesPanel.js';

export default {
  name: 'AppMain',
  components: {
    PreviewToolbar,
    RulerLine,
    PreviewCanvas,
    TimelinePanel,
    LayerPanel,
    PropertiesPanel
  },
  template: '<main id="app-main-container" ' +
            'class="c-app-main" ' +
            'data-action="js:layoutMain" ' +
            'title="메인 작업 영역">' +
            
            '<!-- 왼쪽 패널 -->' +
            '<section id="app-main-left-panel" ' +
            'class="c-app-main__left-panel" ' +
            ':style="{ width: $root.leftPanelWidth + \'px\' }" ' +
            'data-action="js:leftPanel" ' +
            'title="왼쪽 레이어 패널">' +
            '<layer-panel></layer-panel>' +
            '</section>' +
            
            '<!-- 중앙 패널 -->' +
            '<section id="app-main-center-panel" ' +
            'class="c-app-main__center-panel" ' +
            'data-action="js:centerPanel" ' +
            'title="중앙 작업 영역">' +
            '<preview-toolbar></preview-toolbar>' +
            '<div id="app-main-canvas-container" ' +
            'class="c-app-main__canvas-container" ' +
            'data-action="js:canvasContainer" ' +
            'title="캔버스 컨테이너">' +
            '<ruler-line direction="horizontal"></ruler-line>' +
            '<ruler-line direction="vertical"></ruler-line>' +
            '<preview-canvas></preview-canvas>' +
            '</div>' +
            '<timeline-panel></timeline-panel>' +
            '</section>' +
            
            '<!-- 오른쪽 패널 -->' +
            '<section id="app-main-right-panel" ' +
            'class="c-app-main__right-panel" ' +
            ':style="{ width: $root.rightPanelWidth + \'px\' }" ' +
            'data-action="js:rightPanel" ' +
            'title="오른쪽 속성 패널">' +
            '<properties-panel></properties-panel>' +
            '</section>' +
            
            '</main>'
};
