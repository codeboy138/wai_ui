const { createApp } = window.Vue; 
import { store } from './store.js';

if (!store) throw new Error("Critical: Store object failed to initialize.");

import HeaderComp from './components/Header.js';
import LeftPanel from './components/LeftPanel.js';
import RightPanel from './components/RightPanel.js';
import TimelinePanel from './components/TimelinePanel.js';
import PreviewCanvas from './components/PreviewCanvas.js';
import PreviewToolbar from './components/PreviewToolbar.js';
import ProjectModal from './components/ProjectModal.js';
import DesignGuide from './components/DesignGuide.js';

const App = {
    components: {
        'app-header': HeaderComp, 'left-panel': LeftPanel, 'right-panel': RightPanel, 
        'preview-canvas': PreviewCanvas, 'preview-toolbar': PreviewToolbar, 
        'timeline-panel': TimelinePanel, 'project-modal': ProjectModal, 'design-guide': DesignGuide
    },
    setup() {
        const handleResize = (e, panel, dir) => {
            e.preventDefault(); const startX = e.clientX; const startWidth = store.layout[panel];
            const onMove = (ev) => {
                const diff = ev.clientX - startX;
                store.layout[panel] = Math.max(180, panel==='rightPanelWidth' ? startWidth - diff : startWidth + diff);
            };
            const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
            document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
        };

        const handleCanvasMouseMove = (e) => {
            const scaler = document.getElementById('canvas-scaler');
            if (!scaler) return;
            const scale = parseFloat(scaler.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1);
            store.status.canvasScale = scale;
            const rect = scaler.getBoundingClientRect();
            store.status.mouseCoord = { x: Math.max(0, (e.clientX - rect.left)/scale), y: Math.max(0, (e.clientY - rect.top)/scale) };
        };

        // --- DATA DEV INSPECTOR (6-Point Spec) ---
        const inspectorState = Vue.reactive({
            visible: false, 
            style: { top: '0', left: '0', width: '0', height: '0', borderColor: '#3b82f6' },
            tooltipStyle: { top: '0', left: '0' },
            info: { title: '', content: [] }
        });

        const handleInspectorMove = (e) => {
            if (!store.devMode.full) { inspectorState.visible = false; return; }

            inspectorState.visible = false; 
            let target = document.elementFromPoint(e.clientX, e.clientY);
            inspectorState.visible = true;

            const devEl = target?.closest('[data-dev]');

            if (devEl) {
                const rect = devEl.getBoundingClientRect();
                const rawData = devEl.getAttribute('data-dev');
                
                const dataMap = {};
                rawData.split('|').forEach(seg => {
                    const parts = seg.split(':');
                    if (parts.length >= 2) dataMap[parts[0].trim().toLowerCase()] = parts.slice(1).join(':').trim();
                });

                inspectorState.style.top = rect.top + 'px';
                inspectorState.style.left = rect.left + 'px';
                inspectorState.style.width = rect.width + 'px';
                inspectorState.style.height = rect.height + 'px';
                inspectorState.style.borderColor = '#3b82f6';
                
                inspectorState.tooltipStyle = { top: (rect.bottom + 8) + 'px', left: rect.left + 'px' };

                const role = dataMap.role || 'Element';
                const id = dataMap.id || 'Unknown';
                inspectorState.info.title = `[${role}] ${id}`;

                const content = [];
                if (dataMap.func) content.push(`<span class="text-blue-300 w-10 shrink-0">기능:</span> <span class="text-white">${dataMap.func}</span>`);
                if (dataMap.goal) content.push(`<span class="text-green-400 w-10 shrink-0">목표:</span> <span class="text-gray-300">${dataMap.goal}</span>`);
                if (dataMap.path) content.push(`<span class="text-yellow-500 w-10 shrink-0">경로:</span> <span class="text-gray-400">${dataMap.path}</span>`);
                if (dataMap.py) content.push(`<div class="mt-1 pt-1 border-t border-gray-700 text-purple-300 font-mono text-[9px]">🐍 ${dataMap.py}</div>`);

                inspectorState.info.content = content;
            } else {
                inspectorState.visible = false;
            }
        };

        Vue.onMounted(() => { document.addEventListener('mousemove', handleInspectorMove); });

        return { store, handleResize, handleCanvasMouseMove, inspectorState };
    },
    template: `
        <div id="vue-app" class="flex flex-col h-screen text-xs">
            <app-header></app-header>
            <main class="flex-1 flex overflow-hidden relative z-base">
                <left-panel :width="store.layout.leftPanelWidth" @resize-start="handleResize($event, 'leftPanelWidth', 'w')"></left-panel>
                <section class="flex-1 flex flex-col bg-bg-dark min-w-[400px] relative overflow-hidden">
                    <div id="preview-panel-container" style="height: 50%" class="preview-container">
                        <div class="relative z-toolbar"><preview-toolbar></preview-toolbar></div>
                        <div class="preview-stage z-content" id="canvas-wrapper" @mousemove="handleCanvasMouseMove">
                             <div id="canvas-scaler" class="canvas-scaler preview-screen" style="width: 1280px; height: 720px; transform: translate(-50%, -50%) scale(0.5)">
                                <preview-canvas></preview-canvas>
                             </div>
                        </div>
                    </div>
                    <div class="h-1 bg-bg-panel border-y border-ui-border cursor-row-resize hover:bg-ui-accent transition-colors z-content"></div>
                    <timeline-panel style="height: 50%"></timeline-panel>
                </section>
                <right-panel :width="store.layout.rightPanelWidth" @resize-start="handleResize($event, 'rightPanelWidth', 'w')"></right-panel>
            </main>
            <project-modal v-if="store.layout.isProjectModalOpen" @close="store.layout.isProjectModalOpen = false"></project-modal>
            <design-guide v-if="store.layout.isDesignGuideOpen" @close="store.layout.isDesignGuideOpen = false"></design-guide>

            <div v-if="inspectorState.visible" class="fixed inset-0 pointer-events-none z-inspect">
                <div class="absolute border-2 transition-all duration-75 bg-blue-500/10" :style="inspectorState.style"></div>
                <div class="absolute bg-black/95 text-white p-3 rounded border shadow-2xl text-[11px] font-sans leading-relaxed min-w-[250px] max-w-[400px]" 
                     :style="inspectorState.tooltipStyle">
                    <div class="font-bold text-white border-b border-gray-700 pb-1 mb-2 text-xs">{{ inspectorState.info.title }}</div>
                    <div class="flex flex-col gap-1">
                        <div v-for="(line, idx) in inspectorState.info.content" :key="idx" class="flex items-start" v-html="line"></div>
                    </div>
                </div>
            </div>
        </div>
    `
};

createApp(App).mount('#app-root');
window.vm = store;