/**
 * ==========================================
 * PreviewToolbar.js - 프리뷰 툴바 컴포넌트
 * 
 * 역할: 비율/해상도/스냅 제어
 * 경로: frontend/js/components/PreviewToolbar.js
 * ==========================================
 */

import DropdownMenu from './DropdownMenu.js';

export default {
    name: 'PreviewToolbar',
    
    components: {
        DropdownMenu
    },
    
    props: ['vm'],
    
    template: \`
        <div class="c-layout__preview-toolbar">
            <div class="c-layout__preview-controls">
                <dropdown-menu id="preview-toolbar-ratio-dropdown"
                             :current-value="vm.aspectRatio" 
                             :items="['16:9', '9:16', '1:1']" 
                             @select="vm.aspectRatio = $event"
                             data-action="js:setAspect"></dropdown-menu>
                
                <div class="c-layout__preview-divider"></div>
                
                <div class="c-layout__preview-coord" title="마우스 좌표">
                    <span>{{ Math.round(vm.mouseCoord.x) }}, {{ Math.round(vm.mouseCoord.y) }}</span>
                </div>
                
                <div class="c-layout__preview-divider"></div>
                
                <dropdown-menu id="preview-toolbar-resolution-dropdown"
                             :current-value="vm.resolution" 
                             :items="['8K', '6K', '4K', '3K', '2K']" 
                             @select="vm.resolution = $event"
                             data-action="js:setResolution"></dropdown-menu>
                
                <div class="c-layout__preview-divider"></div>
                
                <div id="preview-toolbar-snap-toggle"
                     class="c-layout__preview-snap" 
                     :class="{'c-layout__preview-snap--active': vm.isMagnet}"
                     data-action="js:toggleSnap"
                     title="스냅 토글"
                     @click="vm.isMagnet = !vm.isMagnet">
                    <i class="fa-solid fa-magnet"></i> SNAP {{ vm.isMagnet ? 'ON' : 'OFF' }}
                </div>
            </div>
        </div>
    \`
};
