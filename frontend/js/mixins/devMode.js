/**
 * [DATA-DEV: devMode Mixin]
 * - 역할: Inspector + DATA-DEV 모드 구현
 * - 고유ID: mixin-devmode
 * - 기능: 요소 검사, 하이라이트, 정보 표시
 * - 로직: body 클래스 토글 → 호버 이벤트 등록 → 툴팁 표시
 * - 데이터: devMode (null | 'inspect' | 'data-dev')
 * - 경로: frontend/js/mixins/devMode.js
 * - 명령: toggleDevMode(mode), setupInspectorMode()
 */

import { getElementSpec } from '../utils.js';

export default {
  methods: {
    toggleDevMode(mode) {
      if (this.devMode === mode) {
        this.devMode = null;
        document.body.classList.remove('dev-mode-inspect', 'dev-mode-data-dev');
        console.log('[DevMode] 모드 해제');
      } else {
        this.devMode = mode;
        document.body.classList.remove('dev-mode-inspect', 'dev-mode-data-dev');
        document.body.classList.add('dev-mode-' + mode);
        console.log('[DevMode] 모드 활성:', mode);
        
        if (mode === 'inspect') {
          this.setupInspectorMode();
        } else if (mode === 'data-dev') {
          this.setupDataDevMode();
        }
      }
    },
    
    setupInspectorMode() {
      console.log('[DevMode] Inspector 모드 설정');
      
      document.addEventListener('mouseover', this.handleInspectorHover);
      document.addEventListener('click', this.handleInspectorClick);
    },
    
    handleInspectorHover(e) {
      if (this.devMode !== 'inspect') return;
      
      const target = e.target;
      if (!target.id) return;
      
      target.style.outline = '2px solid red';
      
      const rect = target.getBoundingClientRect();
      const info = target.id + ' (' + Math.round(rect.width) + 'x' + Math.round(rect.height) + ')';
      
      console.log('[Inspector] 호버:', info);
    },
    
    handleInspectorClick(e) {
      if (this.devMode !== 'inspect') return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target;
      if (!target.id) return;
      
      this.copyToClipboard(target.id);
      
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: '복사 완료',
          text: target.id,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        alert('복사 완료: ' + target.id);
      }
      
      console.log('[Inspector] 클릭 복사:', target.id);
    },
    
    setupDataDevMode() {
      console.log('[DevMode] DATA-DEV 모드 설정');
      
      document.addEventListener('mouseover', this.handleDataDevHover);
    },
    
    async handleDataDevHover(e) {
      if (this.devMode !== 'data-dev') return;
      
      const target = e.target;
      if (!target.id) return;
      
      target.style.outline = '2px solid blue';
      
      const spec = await getElementSpec(target.id);
      
      if (spec) {
        const info = 'ID: ' + target.id + '\n' +
                     'Action: ' + (target.dataset.action || '-') + '\n' +
                     'IO: ' + (spec.io || '-') + '\n' +
                     'Logic: ' + (spec.logic || '-');
        
        console.log('[DATA-DEV] 정보:\n' + info);
      }
    },
    
    copyToClipboard(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    }
  }
};
