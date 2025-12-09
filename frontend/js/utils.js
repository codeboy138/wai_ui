/**
 * ==========================================
 * utils.js - 유틸리티 함수
 * 
 * 역할: 공통으로 사용되는 헬퍼 함수 모음
 * 경로: frontend/js/utils.js
 * ==========================================
 */

/**
 * 시간 포맷 변환 (초 → MM:SS)
 * @param {Number} seconds - 초 단위 시간
 * @returns {String} MM:SS 형식 문자열
 */
export function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * HEX → RGB 변환
 * @param {String} hex - HEX 색상 코드 (예: "#3b82f6")
 * @returns {Object} { r, g, b }
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * RGB → HEX 변환
 * @param {Number} r - Red (0-255)
 * @param {Number} g - Green (0-255)
 * @param {Number} b - Blue (0-255)
 * @returns {String} HEX 색상 코드 (예: "#3b82f6")
 */
export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * 스냅 가이드라인 계산
 * @param {Number} value - 현재 좌표
 * @param {Number} threshold - 스냅 허용 범위 (px)
 * @param {Array} guides - 스냅 기준선 배열
 * @returns {Number|null} 스냅된 좌표 또는 null
 */
export function snapToGuide(value, threshold, guides) {
  for (let guide of guides) {
    if (Math.abs(value - guide) < threshold) {
      return guide;
    }
  }
  return null;
}

/**
 * Canvas 중앙/균등 분할 가이드라인 생성
 * @param {Number} canvasWidth - 캔버스 너비
 * @param {Number} canvasHeight - 캔버스 높이
 * @returns {Object} { horizontal: [], vertical: [] }
 */
export function generateCanvasGuides(canvasWidth, canvasHeight) {
  return {
    horizontal: [
      0,
      canvasHeight / 3,
      canvasHeight / 2,
      (canvasHeight * 2) / 3,
      canvasHeight
    ],
    vertical: [
      0,
      canvasWidth / 3,
      canvasWidth / 2,
      (canvasWidth * 2) / 3,
      canvasWidth
    ]
  };
}

/**
 * 고유 ID 생성
 * @param {String} prefix - ID 접두사 (기본값: 'id')
 * @returns {String} 고유 ID (예: "clip-abc123def456")
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 비율 문자열 → 숫자 변환
 * @param {String} ratio - 비율 문자열 (예: "16:9")
 * @returns {Number} 비율 값 (예: 1.777...)
 */
export function parseRatio(ratio) {
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
}

/**
 * 해상도 문자열 → 객체 변환
 * @param {String} resolution - 해상도 문자열 (예: "1920 × 1080")
 * @returns {Object} { width, height }
 */
export function parseResolution(resolution) {
  const [width, height] = resolution.split('×').map(s => parseInt(s.trim()));
  return { width, height };
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {Number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 쓰로틀 함수
 * @param {Function} func - 실행할 함수
 * @param {Number} limit - 최소 실행 간격 (ms)
 * @returns {Function} 쓰로틀된 함수
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 숫자를 특정 범위로 제한
 * @param {Number} value - 값
 * @param {Number} min - 최소값
 * @param {Number} max - 최대값
 * @returns {Number} 제한된 값
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
