/**
 * [DATA-DEV: panelResizer Mixin]
 * - 역할: 패널 크기 조절 (좌/우/타임라인)
 * - 고유ID: mixin-panel-resizer
 * - 기능: 드래그로 패널 너비/높이 조절
 * - 로직: mousedown → mousemove → leftPanelWidth/rightPanelWidth/timelinePanelHeight 업데이트
 * - 데이터: leftPanelWidth, rightPanelWidth, timelinePanelHeight
 * - 경로: frontend/js/mixins/panelResizer.js
 * - 명령: setupLeftPanelResizer(), setupRightPanelResizer(), setupTimelineResizer()
 */

export default {
  methods: {
    setupLeftPanelResizer() {
      console.log('[PanelResizer] 왼쪽 패널 리사이저 설정');
      
      const resizer = document.createElement('div');
      resizer.id = 'left-panel-resizer';
      resizer.className = 'c-panel-resizer c-panel-resizer--vertical';
      resizer.title = '패널 크기 조절';
      
      const leftPanel = document.getElementById('app-main-left-panel');
      if (leftPanel) {
        leftPanel.appendChild(resizer);
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizer.addEventListener('mousedown', (e) => {
          isResizing = true;
          startX = e.clientX;
          startWidth = this.leftPanelWidth;
          document.body.style.cursor = 'ew-resize';
          e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!isResizing) return;
          const dx = e.clientX - startX;
          this.leftPanelWidth = Math.max(200, Math.min(400, startWidth + dx));
        });
        
        document.addEventListener('mouseup', () => {
          if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            console.log('[PanelResizer] 왼쪽 패널 너비:', this.leftPanelWidth);
          }
        });
      }
    },
    
    setupRightPanelResizer() {
      console.log('[PanelResizer] 오른쪽 패널 리사이저 설정');
      
      const resizer = document.createElement('div');
      resizer.id = 'right-panel-resizer';
      resizer.className = 'c-panel-resizer c-panel-resizer--vertical';
      resizer.title = '패널 크기 조절';
      
      const rightPanel = document.getElementById('app-main-right-panel');
      if (rightPanel) {
        rightPanel.insertBefore(resizer, rightPanel.firstChild);
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizer.addEventListener('mousedown', (e) => {
          isResizing = true;
          startX = e.clientX;
          startWidth = this.rightPanelWidth;
          document.body.style.cursor = 'ew-resize';
          e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!isResizing) return;
          const dx = startX - e.clientX;
          this.rightPanelWidth = Math.max(200, Math.min(400, startWidth + dx));
        });
        
        document.addEventListener('mouseup', () => {
          if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            console.log('[PanelResizer] 오른쪽 패널 너비:', this.rightPanelWidth);
          }
        });
      }
    },
    
    setupTimelineResizer() {
      console.log('[PanelResizer] 타임라인 리사이저 설정');
      
      const resizer = document.createElement('div');
      resizer.id = 'timeline-panel-resizer';
      resizer.className = 'c-panel-resizer c-panel-resizer--horizontal';
      resizer.title = '타임라인 높이 조절';
      
      const timeline = document.getElementById('timeline-panel-container');
      if (timeline) {
        timeline.insertBefore(resizer, timeline.firstChild);
        
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        resizer.addEventListener('mousedown', (e) => {
          isResizing = true;
          startY = e.clientY;
          startHeight = this.timelinePanelHeight;
          document.body.style.cursor = 'ns-resize';
          e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!isResizing) return;
          const dy = startY - e.clientY;
          this.timelinePanelHeight = Math.max(150, Math.min(400, startHeight + dy));
        });
        
        document.addEventListener('mouseup', () => {
          if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            console.log('[PanelResizer] 타임라인 높이:', this.timelinePanelHeight);
          }
        });
      }
    },
    
    setupCanvasScaler() {
      console.log('[PanelResizer] 캔버스 스케일러 설정');
    }
  }
};
