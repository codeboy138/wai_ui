/**
 * ==========================================
 * devMode.js - 개발자 모드 Mixin
 * 
 * 역할: Inspector + DATA-DEV 모드
 * 경로: frontend/js/mixins/devMode.js
 * ==========================================
 */

export const devModeMixin = {
    methods: {
        toggleDevMode(mode) {
            if (mode === 'inspect') {
                this.isDevModeActive = !this.isDevModeActive;
                document.body.classList.toggle('dev-mode-active', this.isDevModeActive);
                if (this.isDevModeActive) {
                    this.isDevModeFull = false;
                    document.body.classList.remove('dev-mode-full');
                }
            } else if (mode === 'datadev') {
                this.isDevModeFull = !this.isDevModeFull;
                document.body.classList.toggle('dev-mode-full', this.isDevModeFull);
                if (this.isDevModeFull) {
                    this.isDevModeActive = false;
                    document.body.classList.remove('dev-mode-active');
                }
            }
        },
        
        setupInspectorMode() {
            const self = this;
            
            document.addEventListener('mousemove', async (e) => {
                if (!self.isDevModeActive && !self.isDevModeFull) return;
                
                let target = e.target;
                if (target.classList.contains('c-devmode-overlay__highlight') || 
                    target.classList.contains('c-devmode-overlay__tooltip')) {
                    return;
                }
                
                if (target && target.tagName !== 'HTML' && target.tagName !== 'BODY') {
                    const rect = target.getBoundingClientRect();
                    
                    self.highlightStyle = {
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        top: `${rect.top}px`,
                        left: `${rect.left}px`,
                    };
                    
                    const elementId = target.id || target.className.split(' ')[0] || target.tagName;
                    
                    if (self.isDevModeActive) {
                        self.inspector = {
                            name: elementId,
                            width: Math.round(rect.width),
                            height: Math.round(rect.height)
                        };
                    }
                    
                    if (self.isDevModeFull && target.id) {
                        const spec = await self.getElementSpec(target.id);
                        self.inspector = {
                            id: target.id,
                            action: target.dataset.action || 'N/A',
                            io: spec?.io || 'N/A',
                            logic: spec?.logic || 'N/A'
                        };
                    }
                    
                    self.tooltipStyle = {
                        top: `${rect.top - 50}px`,
                        left: `${rect.left + rect.width + 10}px`,
                        transform: 'translateY(0)'
                    };
                    
                    if (rect.top - 50 < 0) {
                        self.tooltipStyle.top = `${rect.bottom + 10}px`;
                    }
                } else {
                    self.inspector = { name: '', width: 0, height: 0 };
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!self.isDevModeActive) return;
                
                let target = e.target;
                if (target.classList.contains('c-devmode-overlay__highlight') || 
                    target.classList.contains('c-devmode-overlay__tooltip')) {
                    return;
                }
                
                if (target && target.id) {
                    self.copyToClipboard(target.id);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        },
        
        async getElementSpec(id) {
            try {
                const module = await import('../docs/element-specs.js');
                const elementSpecs = module.default;
                
                if (elementSpecs[id]) {
                    return elementSpecs[id];
                }
                
                for (let pattern in elementSpecs) {
                    if (pattern.includes('{id}')) {
                        const regex = new RegExp('^' + pattern.replace('{id}', '.*') + '$');
                        if (regex.test(id)) {
                            return elementSpecs[pattern];
                        }
                    }
                }
                
                return null;
            } catch (err) {
                console.error('element-specs.js 로드 실패:', err);
                return null;
            }
        },
        
        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '복사 완료',
                    text: text,
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#1e1e1e',
                    color: '#fff'
                });
            }).catch(err => {
                console.error('복사 실패:', err);
            });
        }
    }
};
