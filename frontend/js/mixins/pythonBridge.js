/**
 * [DATA-DEV: pythonBridge Mixin]
 * - 역할: JS → Python 함수 호출 브릿지
 * - 고유ID: mixin-python-bridge
 * - 기능: firePython(funcName, params) 전역 제공
 * - 로직: window.backend 객체 확인 → Python 함수 호출
 * - 데이터: 없음 (메서드만 제공)
 * - 경로: frontend/js/mixins/pythonBridge.js
 * - 명령: firePython(funcName, params)
 */

export default {
  methods: {
    firePython(funcName, params = {}) {
      console.log('[PythonBridge] 호출:', funcName, params);
      
      if (typeof window.backend === 'undefined') {
        console.warn('[PythonBridge] window.backend 미정의 (Python 미연결)');
        return;
      }
      
      if (typeof window.backend[funcName] !== 'function') {
        console.warn('[PythonBridge] 함수 없음:', funcName);
        return;
      }
      
      try {
        window.backend[funcName](params);
        console.log('[PythonBridge] 실행 완료:', funcName);
      } catch (error) {
        console.error('[PythonBridge] 오류:', funcName, error);
      }
    }
  }
};
