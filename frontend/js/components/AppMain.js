/**
 * ==========================================
 * AppMain.js - 메인 레이아웃 컴포넌트
 * ==========================================
 */

import PreviewToolbar from './PreviewToolbar.js';
import RulerLine from './RulerLine.js';
import PreviewCanvas from './PreviewCanvas.js';
import TimelinePanel from './TimelinePanel.js';
import LayerPanel from './LayerPanel.js';
import PropertiesPanel from './PropertiesPanel.js';

export default {
    name: 'AppMain',
    
    components: { PreviewToolbar, RulerLine, PreviewCanvas, TimelinePanel, LayerPanel, PropertiesPanel },
    
    props: ['vm'],
    
    computed: {
        canvasScalerStyle() {
            return {
                width: this.vm.canvasSize.w + 'px',
                height: this.vm.canvasSize.h + 'px',
                backgroundColor: '#000',
                transform: 'translate(-50%, -50%) scale(' + this.vm.canvasScale + ')',
                position: 'absolute',
                top: '50%',
                left: '50%'
            };
        }
    },
    
    methods: {
        updateCanvasMouseCoord(e) {
            const wrapper = document.getElementById('canvas-wrapper-main');
            const scaler = document.getElementById('canvas-scaler-transform');
            if (!wrapper || !scaler) return;
            
            const wrapperRect = wrapper.getBoundingClientRect();
            const scalerRect = scaler.getBoundingClientRect();
            const padding = 20;
            
            const mouseX = e.clientX - wrapperRect.left - padding;
            const mouseY = e.clientY - wrapperRect.top - padding;
            
            this.vm.isMouseOverCanvas = mouseX > 0 && mouseY > 0 && 
                mouseX < wrapperRect.width - padding && mouseY < wrapperRect.height - padding;
            
            this.vm.mouseMarkerPos = { x: mouseX + padding, y: mouseY + padding };
            
            const canvasX = e.clientX - scalerRect.left;
            const canvasY = e.clientY - scalerRect.top;
            const scale = this.vm.canvasScale;
            const realX = canvasX / scale;
            const realY = canvasY / scale;
            
            this.vm.mouseCoord = {
                x: Math.min(this.vm.canvasSize.w, Math.max(0, realX)),
                y: Math.min(this.vm.canvasSize.h, Math.max(0, realY))
            };
        }
    },
    
    template: '<main class="c-layout">' +
        '<aside class="c-layout__panel c-layout__panel--left" :style="{ width: vm.leftPanelWidth + \'px\', minWidth: \'180px\' }">' +
        '<div class="c-layout__panel-header"><span>자산 (Assets)</span><button class="c-layout__panel-btn" title="자산 추가" @click="$parent.firePython(\'import_asset\')">+</button></div>' +
        '<div class="c-layout__panel-body c-layout__panel-body--empty"><i class="fa-solid fa-folder-open"></i><div>자산 목록이 비어있습니다.</div></div>' +
        '<div id="layout-resizer-left" class="c-layout__resizer c-layout__resizer--vertical c-layout__resizer--right" title="패널 크기 조절"></div>' +
        '</aside>' +
        '<section class="c-layout__center">' +
        '<div id="preview-container-main" class="c-layout__preview" :style="{ height: vm.previewContainerHeight }">' +
        '<preview-toolbar :vm="vm"></preview-toolbar>' +
        '<div id="canvas-wrapper-main" class="c-layout__preview-canvas" @mousemove="updateCanvasMouseCoord" @mouseleave="vm.mouseCoord = {x: 0, y: 0}; vm.isMouseOverCanvas = false">' +
        '<div class="c-layout__ruler c-layout__ruler--horizontal"><ruler-line orientation="h" :max-size="vm.canvasSize.w" :scale="vm.canvasScale"></ruler-line></div>' +
        '<div class="c-layout__ruler c-layout__ruler--vertical"><ruler-line orientation="v" :max-size="vm.canvasSize.h" :scale="vm.canvasScale"></ruler-line></div>' +
        '<div class="c-layout__crosshair" :style="{paddingLeft: \'20px\', paddingTop: \'20px\'}">' +
        '<div class="c-layout__crosshair-line c-layout__crosshair-line--vertical" :style="{left: vm.mouseMarkerPos.x + \'px\'}" v-show="vm.isMouseOverCanvas"></div>' +
        '<div class="c-layout__crosshair-line c-layout__crosshair-line--horizontal" :style="{top: vm.mouseMarkerPos.y + \'px\'}" v-show="vm.isMouseOverCanvas"></div>' +
        '</div>' +
        '<div class="c-layout__canvas-viewport"><div id="canvas-scaler-transform" class="c-layout__canvas-scaler" :style="canvasScalerStyle">' +
        '<div id="canvas-guide-horizontal" class="c-layout__guide c-layout__guide--horizontal"></div>' +
        '<div id="canvas-guide-vertical" class="c-layout__guide c-layout__guide--vertical"></div>' +
        '<preview-canvas :canvas-boxes="vm.canvasBoxes" :selected-box-id="vm.selectedBoxId" @select-box="vm.setSelectedBoxId" @remove-box="vm.removeBox"></preview-canvas>' +
        '</div></div>' +
        '</div>' +
        '</div>' +
        '<div id="layout-resizer-timeline" class="c-layout__resizer c-layout__resizer--horizontal" title="타임라인 크기 조절"></div>' +
        '<timeline-panel :vm="vm" :style="{ height: vm.timelineContainerHeight }"></timeline-panel>' +
        '</section>' +
        '<aside class="c-layout__panel c-layout__panel--right" :style="{ width: vm.rightPanelWidth + \'px\', minWidth: \'250px\' }">' +
        '<div id="layout-resizer-right" class="c-layout__resizer c-layout__resizer--vertical c-layout__resizer--left" title="패널 크기 조절"></div>' +
        '<div class="c-layout__panel-content">' +
        '<layer-panel :vm="vm"></layer-panel><properties-panel :vm="vm"></properties-panel>' +
        '<div class="c-layout__panel-footer"><div>Effects Library</div></div>' +
        '</div>' +
        '</aside>' +
        '</main>'
};
