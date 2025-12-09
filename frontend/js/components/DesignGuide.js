import { store } from '../store.js';

export default {
    template: `
        <div class="modal-overlay" @click="$emit('close')">
            <div class="modal-window w-[800px] h-[700px] bg-bg-dark border border-ui-border flex flex-col shadow-2xl" @click.stop>
                <div class="h-12 border-b border-ui-border flex items-center justify-between px-6 bg-bg-panel shrink-0">
                    <span class="text-lg font-bold text-ui-accent">WAI Design System (Live View)</span>
                    <button @click="$emit('close')" class="win-btn close rounded"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="flex-1 overflow-y-auto p-8 space-y-10">
                    
                    <section>
                        <h3 class="text-sm font-bold text-text-main mb-4 border-b border-ui-border pb-2">1. Semantic Colors (의미론적 색상)</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex items-center gap-4 bg-bg-panel p-2 rounded border border-ui-border">
                                <div class="w-10 h-10 bg-bg-dark border border-ui-border rounded"></div>
                                <div><div class="text-white text-xs font-bold">bg-bg-dark</div><div class="text-[10px] text-text-sub">Base Background</div></div>
                            </div>
                            <div class="flex items-center gap-4 bg-bg-panel p-2 rounded border border-ui-border">
                                <div class="w-10 h-10 bg-bg-panel border border-ui-border rounded"></div>
                                <div><div class="text-white text-xs font-bold">bg-bg-panel</div><div class="text-[10px] text-text-sub">Panel/Header</div></div>
                            </div>
                            <div class="flex items-center gap-4 bg-bg-panel p-2 rounded border border-ui-border">
                                <div class="w-10 h-10 bg-ui-selected rounded"></div>
                                <div><div class="text-white text-xs font-bold">bg-ui-selected</div><div class="text-[10px] text-text-sub">Active State</div></div>
                            </div>
                            <div class="flex items-center gap-4 bg-bg-panel p-2 rounded border border-ui-border">
                                <div class="w-10 h-10 border border-ui-border rounded"></div>
                                <div><div class="text-white text-xs font-bold">border-ui-border</div><div class="text-[10px] text-text-sub">Dividers</div></div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 class="text-sm font-bold text-text-main mb-4 border-b border-ui-border pb-2">2. Typography & Accent</h3>
                        <div class="grid grid-cols-3 gap-4 text-center">
                            <div class="p-4 bg-bg-input rounded border border-ui-border">
                                <span class="text-ui-accent font-bold text-lg">Accent Blue</span>
                                <div class="text-[10px] text-text-sub mt-1">text-ui-accent</div>
                            </div>
                            <div class="p-4 bg-bg-input rounded border border-ui-border">
                                <span class="text-ui-danger font-bold text-lg">Danger Red</span>
                                <div class="text-[10px] text-text-sub mt-1">text-ui-danger</div>
                            </div>
                            <div class="p-4 bg-bg-input rounded border border-ui-border">
                                <span class="text-ui-success font-bold text-lg">Success Green</span>
                                <div class="text-[10px] text-text-sub mt-1">text-ui-success</div>
                            </div>
                        </div>
                        <div class="mt-4 space-y-2 p-4 bg-bg-panel rounded border border-ui-border">
                            <div class="text-text-main text-sm">Main Text (text-text-main) - 본문 및 제목</div>
                            <div class="text-text-sub text-xs">Sub Text (text-text-sub) - 설명 및 라벨</div>
                            <div class="text-zinc-600 text-[10px]">Disabled Text (text-zinc-600) - 비활성</div>
                        </div>
                    </section>

                    <section>
                        <h3 class="text-sm font-bold text-text-main mb-4 border-b border-ui-border pb-2">3. Components</h3>
                        
                        <div class="flex flex-wrap gap-4 items-center mb-6">
                            <button class="nav-btn">Nav Button</button>
                            <button class="nav-btn active">Active Nav</button>
                            <button class="tool-btn"><i class="fa-solid fa-wrench"></i></button>
                            <button class="tool-btn text-ui-accent"><i class="fa-solid fa-magnet"></i></button>
                            <button class="win-btn">_</button>
                            <button class="win-btn close">X</button>
                        </div>

                        <div class="flex gap-4 items-center">
                            <input type="text" value="Input Field" class="bg-bg-input border border-ui-border rounded px-2 py-1 text-xs text-text-main focus:border-ui-accent w-48 outline-none">
                            <div class="px-2 py-1 bg-ui-selected text-xs text-white rounded">Selected Item</div>
                        </div>
                    </section>

                    <section>
                        <h3 class="text-sm font-bold text-text-main mb-4 border-b border-ui-border pb-2">4. Z-Index Hierarchy</h3>
                        <div class="relative h-32 bg-bg-input rounded border border-ui-border overflow-hidden">
                            <div class="absolute top-2 left-2 w-20 h-20 bg-gray-700 flex items-center justify-center text-[10px] text-white shadow-lg" style="z-index: 10;">Base (10)</div>
                            <div class="absolute top-4 left-8 w-20 h-20 bg-blue-900 flex items-center justify-center text-[10px] text-white shadow-lg" style="z-index: 20;">Content (20)</div>
                            <div class="absolute top-6 left-16 w-20 h-20 bg-green-900 flex items-center justify-center text-[10px] text-white shadow-lg" style="z-index: 40;">Sticky (40)</div>
                            <div class="absolute top-8 left-24 w-20 h-20 bg-red-900 flex items-center justify-center text-[10px] text-white shadow-lg" style="z-index: 1000;">Float (1000)</div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    `,
    data() { return { store } }
}