/**
 * [DATA-DEV: utils.js]
 * - 역할: 유틸리티 함수 모음
 * - 고유ID: utils
 * - 기능: ID 파싱, Spec 조회, 클립보드 복사
 * - 로직: 정규식 매칭, 패턴 검색
 * - 데이터: 없음 (순수 함수)
 * - 경로: frontend/js/utils.js
 * - 명령: 없음 (헬퍼 함수)
 */

/**
 * ID에서 경로/기능 정보 파싱
 * 예: "header-nav-explore-btn" → { area: "header", subArea: "nav", action: "explore", type: "btn" }
 */
export function parseElementId(id) {
  const parts = id.split('-');
  
  if (parts.length < 2) {
    return { area: id, subArea: '', action: '', type: '' };
  }
  
  return {
    area: parts[0] || '',
    subArea: parts[1] || '',
    action: parts[2] || '',
    type: parts[3] || ''
  };
}

/**
 * element-specs.js에서 요소 명세 조회
 * 동적 요소 패턴 매칭 지원
 */
export async function getElementSpec(id) {
  try {
    const specs = await import('./docs/element-specs.js');
    
    // 직접 매칭
    if (specs.elementSpecs[id]) {
      return specs.elementSpecs[id];
    }
    
    // 패턴 매칭 (예: "timeline-clip-{id}" → "timeline-clip-1")
    for (const [key, value] of Object.entries(specs.elementSpecs)) {
      if (key.includes('{')) {
        const pattern = key.replace(/\{[^}]+\}/g, '\\d+');
        const regex = new RegExp('^' + pattern + '$');
        if (regex.test(id)) {
          return value;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('[Utils] element-specs.js 로드 실패:', error);
    return null;
  }
}

/**
 * 클립보드 복사
 */
export function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('[Utils] 클립보드 복사:', text);
    }).catch(err => {
      console.error('[Utils] 클립보드 복사 실패:', err);
    });
  } else {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    console.log('[Utils] 클립보드 복사 (fallback):', text);
  }
}

/**
 * 시간 포맷 (초 → MM:SS:FF)
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  return mins.toString().padStart(2, '0') + ':' + 
         secs.toString().padStart(2, '0') + ':' + 
         frames.toString().padStart(2, '0');
}
