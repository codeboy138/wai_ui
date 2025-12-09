/**
 * [DATA-DEV: PreviewToolbar]
 * - 역할: 비율/해상도/스냅 제어 툴바
 * - 고유ID: preview-toolbar
 * - 기능: 화면비율 선택, 해상도 선택, 스냅 토글
 * - 로직: 선택 변경 시 canvasRatio/canvasResolution/snapEnabled 업데이트
 * - 데이터: canvasRatio, canvasResolution, snapEnabled
 * - 경로: frontend/js/components/PreviewToolbar.js
 * - 명령: firePython('set_canvas_ratio', {ratio}), firePython('set_snap', {enabled})
 */

export default {
  name: 'PreviewToolbar',
  template: '<div id="preview-toolbar-container" class="c-preview-toolbar" data-action="js:previewToolbar" title="프리뷰 툴바">' +
            '<div id="preview-toolbar-ratio-group" class="c-preview-toolbar__group" data-action="js:ratioControl" title="화면 비율">' +
            '<label class="c-preview-toolbar__label">비율:</label>' +
            '<select id="preview-toolbar-ratio-select" class="c-preview-toolbar__select" v-model="$root.canvasRatio" data-action="py:set_canvas_ratio" title="화면 비율 선택" @change="changeRatio">' +
            '<option value="16:9">16:9</option>' +
            '<option value="4:3">4:3</option>' +
            '<option value="1:1">1:1</option>' +
            '<option value="9:16">9:16 (세로)</option>' +
            '</select>' +
            '</div>' +
            '<div id="preview-toolbar-resolution-group" class="c-preview-toolbar__group" data-action="js:resolutionControl" title="해상도">' +
            '<label class="c-preview-toolbar__label">해상도:</label>' +
            '<select id="preview-toolbar-resolution-select" class="c-preview-toolbar__select" v-model="$root.canvasResolution" data-action="py:set_canvas_resolution" title="해상도 선택" @change="changeResolution">' +
            '<option value="1920x1080">1920x1080 (FHD)</option>' +
            '<option value="1280x720">1280x720 (HD)</option>' +
            '<option value="3840x2160">3840x2160 (4K)</option>' +
            '</select>' +
            '</div>' +
            '<div id="preview-toolbar-snap-group" class="c-preview-toolbar__group" data-action="js:snapControl" title="스냅">' +
            '<label class="c-preview-toolbar__label">스냅:</label>' +
            '<button id="preview-toolbar-snap-toggle-btn" class="c-preview-toolbar__snap-btn" data-action="py:set_snap" title="스냅 토글" @click="toggleSnap">' +
            '<i class="fas fa-magnet"></i> <span>SNAP</span>' +
            '</button>' +
            '</div>' +
            '</div>',
  
  methods: {
    changeRatio() {
      console.log('[PreviewToolbar] 비율 변경:', this.$root.canvasRatio);
      this.$root.firePython('set_canvas_ratio', { ratio: this.$root.canvasRatio });
    },
    
    changeResolution() {
      console.log('[PreviewToolbar] 해상도 변경:', this.$root.canvasResolution);
      this.$root.firePython('set_canvas_resolution', { resolution: this.$root.canvasResolution });
    },
    
    toggleSnap() {
      this.$root.snapEnabled = !this.$root.snapEnabled;
      console.log('[PreviewToolbar] 스냅 토글:', this.$root.snapEnabled);
      this.$root.firePython('set_snap', { enabled: this.$root.snapEnabled });
    }
  }
};
