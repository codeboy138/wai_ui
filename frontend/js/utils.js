/**
 * ==========================================
 * utils.js - 유틸리티 함수
 * 
 * 역할: 공통으로 사용되는 헬퍼 함수 모음
 * 경로: frontend/js/utils.js
 * 
 * DATA-DEV:
 * 요소의 역할: 시간 포맷, 색상 변환, 스냅 가이드, ID 생성 등 유틸리티
 * 요소의 고유ID: js-utils
 * 요소의 기능 목적 정의: 재사용 가능한 순수 함수 제공
 * 요소의 동작 로직 설명: 입력값을 받아 변환된 값을 반환하는 순수 함수 모음
 * 요소의 입출력 데이터 구조: 입력: 다양(숫자, 문자열). 출력: 변환된 값
 * 요소의 경로정보: frontend/js/utils.js
 * 요소의 수행해야 할 백엔드/JS 명령: 없음 (순수 함수)
 * ==========================================
 */

/**
 * 시간 포맷 변환 (초 → MM:SS)
 */
export function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * HEX → RGB 변환
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
 */
export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * 스냅 가이드라인 계산
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
 * 고유 ID 생성
 */
export function generateId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 비율 문자열 → 숫자 변환
 */
export function parseRatio(ratio) {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
}

/**
 * 해상도 문자열 → 객체 변환
 */
export function parseResolution(resolution) {
    const map = {
        '8K': { width: 7680, height: 4320 },
        '6K': { width: 6144, height: 3456 },
        '4K': { width: 3840, height: 2160 },
        '3K': { width: 3072, height: 1728 },
        '2K': { width: 2048, height: 1152 }
    };
    return map[resolution] || { width: 3840, height: 2160 };
}

/**
 * 디바운스 함수
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
 * 숫자를 특정 범위로 제한
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
