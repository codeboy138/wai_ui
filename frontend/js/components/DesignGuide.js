import { store } from '../store.js';

export default {
    template: `
        <div class="c-modal-overlay" 
             @click="$emit('close')"
             data-dev="Role: Overlay | ID: design-guide-overlay | Func: 모달 배경 | Goal: 외부 클릭 시 닫기 | State: visible=true | Path: App/Modal/DesignGuide/Overlay | Py: None | JS: @click=emit('close')">
            
            <div class="c-modal c-modal--design-guide w-[800px] h-[700px] bg-bg-dark border border-ui-border flex flex-col shadow-2xl" 
                 @click.stop
                 data-dev="Role: Modal | ID: design-guide-modal | Func: 디자인 가이드 모달 | Goal: 디자인 시스템 문서 표시 | State: None | Path: App/Modal/DesignGuide | Py: None | JS: @click.stop">
                
                <div class="c-modal__header h-12 border-b border-ui-border flex items-center justify-between px-6 bg-bg-panel shrink-0"
                     data-dev="Role: Header | ID: design-guide-header | Func: 모달 헤더 | Goal: 제목 및 닫기 버튼 표시 | State: None | Path: App/Modal/DesignGuide/Header | Py: None | JS: None">
                    
                    <span class="c-modal__title text-lg font-bold text-ui-accent"
                          data-dev="Role: Label | ID: design-guide-title | Func: 제목 텍스트 | Goal: 모달 제목 표시 | State: text='WAI Design System (Live View)' | Path: App/Modal/DesignGuide/Header/Title | Py: None | JS: None">
                        WAI Design System (Live View)
                    </span>
                    
                    <button @click="$emit('close')" 
                            class="c-modal__close-btn win-btn close rounded"
                            data-js-close="design-guide"
                            data-dev="Role: Button | ID: design-guide-close-btn | Func: 닫기 버튼 | Goal: 모달 닫기 | State: None | Path: App/Modal/DesignGuide/Header/CloseBtn | Py: None | JS: emit('close')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="c-modal__body flex-1 overflow-y-auto p-8 space-y-10"
                     data-dev="Role: Container | ID: design-guide-body | Func: 콘텐츠 영역 | Goal: 디자인 시스템 섹션 표시 | State: sections=4 | Path: App/Modal/DesignGuide/Body | Py: None | JS: None">
                    
                    <section class="c-guide-section"
                             data-dev="Role: Section | ID: design-guide-section-colors | Func: 색상 섹션 | Goal: 시맨틱 색상 표시 | State: None | Path: App/Modal/DesignGuide/Body/Colors | Py: None | JS: None">
                        <h3 class="c-guide-section__title text-sm font-bold text-text-main mb-4 border-b border-ui-border pb-2"
                            data-dev="Role: Heading | ID: design-guide-section-colors-title | Func: 섹션 제목 | Goal: 색상 섹션 제목 표시 | State: text='1. Semantic Colors' | Path: App/Modal/DesignGuide/Body/Colors/Title | Py: None | JS: None">
                            1. Semantic Colors (의미론적 색상)
                        </h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="c-guide-color-item flex items-center gap-4 bg-bg-panel p-2 rounded border border-ui-border"
                                 data-dev="Role: Item | ID: design-guide-color-bg-dark | Func: 색상 샘플 | Goal: bg-bg-dark 색상 표시 | State: color='#09090b' | Path: App/Modal/DesignGuide/Body/Colors/Item | Py: None | JS: None">
                                <div class="c-guide-color-item__swatch w-10 h-10 bg-bg-dark border border-ui-border rounded"></div>
                                <div>
                                    <div class="c-guide-color-item__name text-white text-xs font-bold">bg-bg-dark</div>
                                    <div class="c-guide-color-item__desc text-[10px] text-text-sub">Base Background</div>
                                </div>
                            </div>
                            <div class="c-guide-color-item flex items-center gap-4 bg-bg-panel p-2 rounded border border-ui-border"
                                 data-dev="Role: Item | ID: design-guide-color-bg-panel | Func: 색상 샘플 | Goal: bg-bg-panel 색상 표시 | State: color='#18181b' | Path: App/Modal/DesignGuide/Body/Colors/Item | Py: None | JS: None">
                                <div class="c-guide-color-item__swatch w-10 h-10 bg-bg-panel border border-ui-border rounded"></div>
                                <div>
                                    <div class="c-guide-color-item__name text-white text-xs font-bold">bg-bg-panel</div>
                                    <div class="c-guide-color-item__desc text-[10px] text-text-sub">Panel/Header</div>
                                </div>
                            </div>
                            <div class="c-guide-color-item flex items-center gap-4 bg-bg-panel p-2 rounded border border-ui-border"
                                 data-dev="Role: Item | ID: design-guide-color-ui-selected | Func: 색상 샘플 | Goal: bg-ui-selected 색상 표시 | State: color='#3f3f46' | Path: App/Modal/DesignGuide/Body/Colors/Item | Py: None | JS: None">
                                <div class="c-guide-color-item__swatch w-10 h-10 bg-ui-selected rounded"></div>
                                <div>
                                    <div class="c-guide-color-item__name text-white text-xs font-bold">bg-ui-selected</div>
                                    <div class="c-guide-color-item__desc text-[10px] text-text-sub">Active State</div>
                                </div>
                            </div>
                            <div class="c-guide-color-item flex items-center gap-4 bg-bg-panel p-2 rounded border border-ui-border"
                                 data-dev="Role: Item | ID: design-guide-color-ui-border | Func: 색상 샘플 | Goal: border-ui-border 색상 표시 | State: color='#27272a' | Path: App/Modal/DesignGuide/Body/Colors/Item | Py: None | JS: None">
                                <div class="c-guide-color-item__swatch w-10 h-10 border border-ui-border rounded"></div>
                                <div>
                                    <div class="c-guide-color-item__name text-white text-xs font-bold">border-ui-border</div>
                                    <div class="c-guide-color-item__desc text-[10px] text-text-sub">Dividers</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="c-guide-section"
                             data-dev="Role: Section | ID: design-guide-section-typography | Func: 타이포그래피 섹션 | Goal: 텍스트 및 액센트 색상 표시 | State: None | Path: App/Modal/DesignGuide/Body/Typography | Py: None | JS: None">
                        <h3 class="c-guide-section__title text-sm font-bold text-text-main mb-4 border-b border-ui-border pb-2"
                            data-dev="Role: Heading | ID: design-guide-section-typography-title | Func: 섹션 제목 | Goal: 타이포그래피 섹션 제목 표시 | State: text='2. Typography & Accent' | Path: App/Modal/DesignGuide/Body/Typography/Title | Py: None | JS: None">
                            2. Typography & Accent
                        </h3>
                        <div class="grid grid-cols-3 gap-4 text-center">
                            <div class="c-guide-accent-item p-4 bg-bg-input rounded border border-ui-border"
                                 data-dev="Role: Item | ID: design-guide-accent-blue | Func: 액센트 색상 샘플 | Goal: Accent Blue 표시 | State: color='#3b82f6' | Path: App/Modal/DesignGuide/Body/Typography/Accent | Py: None | JS: None">
                                <span class="text-ui-accent font-bold text-lg">Accent Blue</span>
                                <div class="text-[10px] text-text-sub mt-1">text-ui-accent</div>
                            </div>
                            <div class="c-guide-accent-item p-4 bg-bg-input rounded border border-ui-border"
                                 data-dev="Role: Item | ID: design-guide-accent-danger | Func: 액센트 색상 샘플 | Goal: Danger Red 표시 | State: color='#ef4444' | Path: App/Modal/DesignGuide/Body/Typography/Accent | Py: None | JS: None">
                                <span class="text-ui-danger font-bold text-lg">Danger Red</span>
                                <div class="text-[10px] text-text-sub mt-1">text-ui-danger</div>
                            </div>
                            <div class="c-guide-accent-item p-4 bg-bg-input rounded border border-ui-border"
                                 data-dev="Role: Item | ID: design-guide-accent-success | Func: 액센트 색상 샘플 | Goal: Success Green 표시 | State: color='#22c55e' | Path: App/Modal/DesignGuide/Body/Typography/Accent | Py: None | JS: None">
                                <span class="text-ui-success font-bold text-lg">Success Green</span>
                                <div class="text-[10px] text-text-sub mt-1">text-ui-success</div>
                            </div>
                        </div>
                        <div class="mt-4 space-y-2 p-4 bg-bg-panel rounded border border-ui-border"
                             data-dev="Role: Container | ID: design-guide-text-samples | Func: 텍스트 샘플 | Goal: 텍스트 스타일 예시 표시 | State: None | Path: App/Modal/DesignGuide/Body/Typography/Samples | Py: None | JS: None">
                            <div class="text-text-main text-sm">Main Text (text-text-main) - 본문 및 제목</div>
                            <div class="text-text-sub text-xs">Sub Text (text-text-sub) - 설명 및 라벨</div>
                            <div class="text-zinc-600 text-[10px]">Disabled Text (text-zinc-600) - 비활성</div>
                        </div>
                    </section>

                    <section class="c-guide-section"
                             data-dev="Role: Section | ID: design-guide-section-components | Func: 컴포넌트 섹션 | Goal: UI 컴포넌트 샘플 표시 | State: None | Path: App/Modal/DesignGuide/Body/Components | Py: None | JS: None">
                        <h3 class="c-guide-section__title text-sm font-bold text-text-main mb-4 border-b border-ui-border pb-2"
                            data-dev="Role: Heading | ID: design-guide-section-components-title | Func: 섹션 제목 | Goal: 컴포넌트 섹션 제목 표시 | State: text='3. Components' | Path: App/Modal/DesignGuide/Body/Components/Title | Py: None | JS: None">
                            3. Components
                        </h3>
                        
                        <div class="flex flex-wrap gap-4 items-center mb-6"
                             data-dev="Role: Container | ID: design-guide-buttons-sample | Func: 버튼 샘플 | Goal: 버튼 스타일 예시 표시 | State: None | Path: App/Modal/DesignGuide/Body/Components/Buttons | Py: None | JS: None">
                            <button class="nav-btn">Nav Button</button>
                            <button class="nav-btn active">Active Nav</button>
                            <button class="tool-btn"><i class="fa-solid fa-wrench"></i></button>
                            <button class="tool-btn text-ui-accent"><i class="fa-solid fa-magnet"></i></button>
                            <button class="win-btn">_</button>
                            <button class="win-btn close">X</button>
                        </div>

                        <div class="flex gap-4 items-center"
                             data-dev="Role: Container | ID: design-guide-inputs-sample | Func: 입력 샘플 | Goal: 입력 필드 스타일 예시 표시 | State: None | Path: App/Modal/DesignGuide/Body/Components/Inputs | Py: None | JS: None">
                            <input type="text" value="Input Field" class="bg-bg-input border border-ui-border rounded px-2 py-1 text-xs text-text-main focus:border-ui-accent w-48 outline-none">
                            <div class="px-2 py-1 bg-ui-selected text-xs text-white rounded">Selected Item</div>
                        </div>
                    </section>

                    <section class="c-guide-section"
                             data-dev="Role: Section | ID: design-guide-section-zindex | Func: Z-Index 섹션 | Goal: 레이어 계층 구조 시각화 | State: None | Path: App/Modal/DesignGuide/Body/ZIndex | Py: None | JS: None">
                        <h3 class="c-guide-section__title text-sm font-bold text-text-main mb-4 border-b border-ui-border pb-2"
                            data-dev="Role: Heading | ID: design-guide-section-zindex-title | Func: 섹션 제목 | Goal: Z-Index 섹션 제목 표시 | State: text='4. Z-Index Hierarchy' | Path: App/Modal/DesignGuide/Body/ZIndex/Title | Py: None | JS: None">
                            4. Z-Index Hierarchy
                        </h3>
                        <div class="relative h-32 bg-bg-input rounded border border-ui-border overflow-hidden"
                             data-dev="Role: Visualization | ID: design-guide-zindex-demo | Func: Z-Index 시각화 | Goal: 레이어 계층 구조 표시 | State: layers=4 | Path: App/Modal/DesignGuide/Body/ZIndex/Demo | Py: None | JS: None">
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
