/**
 * ==========================================
 * app.js - Vue 3 앱 초기화
 * 
 * 역할: Vue 애플리케이션 생성, 컴포넌트 등록, 마운트
 * 경로: frontend/js/app.js
 * ==========================================
 */

import store from './store.js';
import Header from './components/Header.js';
import AppMain from './components/AppMain.js';
import ProjectModal from './components/ProjectModal.js';
import { devModeMixin } from './mixins/devMode.js';
import { panelResizerMixin } from './mixins/panelResizer.js';
import { pythonBridgeMixin } from './mixins/pythonBridge.js';

const { createApp } = window.Vue;

const App = {
    name: 'App',
    
    mixins: [devModeMixin, panelResizerMixin, pythonBridgeMixin],
    
    data() {
        return store;
    },
    
    mounted() {
        this.$nextTick(() => {
            this.setupPanelResizers();
            this.setupCanvasScaler();
            this.setupInspectorMode();
        });
        window.vm = this;
        console.log('✅ WAI Studio v3.0 시작 완료!');
    },
    
    methods: {
        updateBoxPosition(id, dx, dy, dw, dh, isResizeEnd = false) {
            const index = this.canvasBoxes.findIndex(b => b.id === id);
            if (index === -1) return;
            
            const box = this.canvasBoxes[index];
            const newBoxes = [...this.canvasBoxes];
            
            newBoxes[index] = {
                ...box,
                x: box.x + dx,
                y: box.y + dy,
                w: isResizeEnd ? dw : box.w,
                h: isResizeEnd ? dh : box.h
            };
            this.canvasBoxes = newBoxes;
        },
        
        updateClip(clipId, startChange, durationChange) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index !== -1) {
                const clip = this.clips[index];
                const newClips = [...this.clips];
                
                const newStart = Math.max(0, clip.start + startChange);
                const newDuration = Math.max(0.1, clip.duration + durationChange - (newStart - clip.start));
                
                newClips[index] = {
                    ...clip,
                    start: newStart,
                    duration: newDuration
                };
                this.clips = newClips;
            }
        },
        
        moveClip(clipId, timeChange) {
            const index = this.clips.findIndex(c => c.id === clipId);
            if (index !== -1) {
                const clip = this.clips[index];
                const newClips = [...this.clips];
                newClips[index] = {
                    ...clip,
                    start: Math.max(0, clip.start + timeChange)
                };
                this.clips = newClips;
            }
        }
    },
    
    template: \`
        <div class="app-root">
            <app-header :vm="$data"></app-header>
            <app-main :vm="$data"></app-main>
            <project-modal v-if="isProjectModalOpen" @close="isProjectModalOpen = false"></project-modal>
            
            <div class="c-devmode-overlay" 
                 v-if="isDevModeActive || isDevModeFull">
                <div class="c-devmode-overlay__highlight" 
                     :style="highlightStyle"></div>
                <div class="c-devmode-overlay__tooltip" 
                     :style="tooltipStyle">
                    <div v-if="isDevModeActive">
                        <strong>Name:</strong> {{ inspector.name }}<br>
                        <strong>Size:</strong> {{ inspector.width }} × {{ inspector.height }}<br>
                        <span style="opacity: 0.7; font-size: 9px;">클릭하여 이름 복사</span>
                    </div>
                    <div v-if="isDevModeFull">
                        <strong>ID:</strong> {{ inspector.id }}<br>
                        <strong>Action:</strong> {{ inspector.action }}<br>
                        <strong>IO:</strong> {{ inspector.io }}<br>
                        <strong>Logic:</strong> {{ inspector.logic }}
                    </div>
                </div>
            </div>
        </div>
    \`
};

const app = createApp(App);

app.component('app-header', Header);
app.component('app-main', AppMain);
app.component('project-modal', ProjectModal);

app.mount('#vue-app');
