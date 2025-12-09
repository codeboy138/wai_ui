/**
 * ==========================================
 * pythonBridge.js - Python 통신 Mixin
 * 
 * 역할: JS → Python 함수 호출 브릿지
 * 경로: frontend/js/mixins/pythonBridge.js
 * ==========================================
 */

export const pythonBridgeMixin = {
    methods: {
        firePython(funcName, params = null) {
            console.log('🐍 Python Call:', funcName, params);
            
            if (window.backend && window.backend[funcName]) {
                window.backend[funcName](params);
            } else {
                console.log(`[DUMMY] Python call: ${funcName}`, params);
            }
        },
        
        handlePyCall(funcName) {
            this.firePython(funcName);
        }
    },
    
    mounted() {
        this.autoBindPythonEvents();
    },
    
    methods: {
        autoBindPythonEvents() {
            document.querySelectorAll('[data-action^="py:"]').forEach(el => {
                const action = el.getAttribute('data-action');
                const funcName = action.replace('py:', '').split('|')[0];
                
                if (!el.__pyBound) {
                    el.addEventListener('click', () => this.firePython(funcName));
                    el.__pyBound = true;
                }
            });
        }
    }
};
