/**
 * ==========================================
 * panelResizer.js - 패널 리사이저 Mixin
 * 
 * 역할: 좌/우/타임라인 패널 크기 조절
 * 경로: frontend/js/mixins/panelResizer.js
 * ==========================================
 */

export const panelResizerMixin = {
    methods: {
        setupPanelResizers() {
            this.setupLeftPanelResizer();
            this.setupRightPanelResizer();
            this.setupTimelineResizer();
        },
        
        setupLeftPanelResizer() {
            const resizer = document.getElementById('layout-resizer-left');
            if (!resizer) return;
            
            let startWidth, startX;
            const self = this;
            
            const onMove = (e) => {
                const diff = e.clientX - startX;
                self.leftPanelWidth = Math.max(180, startWidth + diff);
            };
            
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startWidth = self.leftPanelWidth;
                startX = e.clientX;
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        },
        
        setupRightPanelResizer() {
            const resizer = document.getElementById('layout-resizer-right');
            if (!resizer) return;
            
            let startWidth, startX;
            const self = this;
            
            const onMove = (e) => {
                const diff = startX - e.clientX;
                self.rightPanelWidth = Math.max(250, startWidth + diff);
            };
            
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startWidth = self.rightPanelWidth;
                startX = e.clientX;
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        },
        
        setupTimelineResizer() {
            const resizer = document.getElementById('layout-resizer-timeline');
            if (!resizer) return;
            
            const self = this;
            const headerHeight = 48;
            
            const onMove = (e) => {
                const targetHeight = e.clientY - headerHeight - 2;
                const effectiveHeight = Math.max(100, targetHeight);
                
                self.previewContainerHeight = `${effectiveHeight}px`;
                self.timelineContainerHeight = `calc(100% - ${effectiveHeight}px)`;
            };
            
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        },
        
        setupCanvasScaler() {
            const wrapper = document.getElementById('canvas-wrapper-main');
            if (!wrapper) return;
            
            const updateScale = () => {
                const padding = 20;
                const scale = Math.min(
                    (wrapper.clientWidth - padding) / this.canvasSize.w, 
                    (wrapper.clientHeight - padding) / this.canvasSize.h
                );
                this.canvasScale = scale;
            };
            
            updateScale();
            new ResizeObserver(updateScale).observe(wrapper);
        }
    }
};
