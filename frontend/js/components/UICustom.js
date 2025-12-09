/**
 * ==========================================
 * UICustom.js
 * 
 * 역할: UI 관련 유틸리티 함수 모음 (Ratio 파싱, 해상도 계산 등)
 * 경로: frontend/js/components/UICustom.js
 * 
 * 주요 기능:
 * - parseRatio: 비율 문자열(16:9) → 숫자 배열 변환
 * - qualityBaseHeight: 품질(4K, FHD 등) → 기준 높이(px) 변환
 * - getResolutions: Ratio + Quality → 사용 가능한 해상도 목록 반환
 * ==========================================
 */

/**
 * Ratio 문자열을 [width, height] 배열로 변환
 * 
 * @function parseRatio
 * @param {String} ratio - 비율 문자열 (예: '16:9', '4:3', '1:1')
 * @returns {Array<Number>} [너비, 높이] 형식의 배열 (예: [16, 9])
 * 
 * @example
 * parseRatio('16:9')   // [16, 9]
 * parseRatio('4:3')    // [4, 3]
 * parseRatio('21:9')   // [21, 9]
 */
function parseRatio(ratio) {
  return ratio.split(':').map(Number);
}

/**
 * 품질(Quality) 문자열을 기준 높이(px)로 변환
 * 
 * @function qualityBaseHeight
 * @param {String} quality - 품질 문자열 ('4K', 'FHD', 'HD', 'SD')
 * @returns {Number} 해당 품질의 기준 높이 (px)
 * 
 * @example
 * qualityBaseHeight('4K')   // 2160
 * qualityBaseHeight('FHD')  // 1080
 * qualityBaseHeight('HD')   // 720
 * qualityBaseHeight('SD')   // 480
 * 
 * @description
 * 지원 품질: