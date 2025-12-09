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
export function parseRatio(ratio) {
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
 * - 4K:  2160px (3840 × 2160)
 * - FHD: 1080px (1920 × 1080)
 * - HD:  720px  (1280 × 720)
 * - SD:  480px  (640 × 480)
 */
export function qualityBaseHeight(quality) {
  const qualityMap = {
    '4K': 2160,
    'FHD': 1080,
    'HD': 720,
    'SD': 480
  };
  
  return qualityMap[quality] || 1080; // 기본값: FHD
}

/**
 * Ratio와 Quality 조합으로 사용 가능한 해상도 목록 생성
 * 
 * @function getResolutions
 * @param {String} ratio - 화면 비율 ('16:9', '4:3', '1:1', '21:9')
 * @param {String} quality - 영상 품질 ('4K', 'FHD', 'HD', 'SD')
 * @returns {Array<Object>} 해상도 객체 배열
 * 
 * @example
 * getResolutions('16:9', 'FHD')
 * // [
 * //   { label: '1920 × 1080', width: 1920, height: 1080 },
 * //   { label: '1280 × 720', width: 1280, height: 720 },
 * //   { label: '640 × 360', width: 640, height: 360 }
 * // ]
 * 
 * @description
 * 주어진 비율과 품질에 따라 3단계 해상도를 생성:
 * 1. 최대 해상도 (품질 기준)
 * 2. 중간 해상도 (최대의 2/3)
 * 3. 최소 해상도 (최대의 1/3)
 */
export function getResolutions(ratio, quality) {
  const [ratioW, ratioH] = parseRatio(ratio);
  const baseHeight = qualityBaseHeight(quality);
  
  // 기준 높이에서 너비 계산
  const baseWidth = Math.round((baseHeight * ratioW) / ratioH);
  
  // 3단계 해상도 생성 (100%, 66%, 33%)
  const resolutions = [
    {
      label: `${baseWidth} × ${baseHeight}`,
      width: baseWidth,
      height: baseHeight
    },
    {
      label: `${Math.round(baseWidth * 0.66)} × ${Math.round(baseHeight * 0.66)}`,
      width: Math.round(baseWidth * 0.66),
      height: Math.round(baseHeight * 0.66)
    },
    {
      label: `${Math.round(baseWidth * 0.33)} × ${Math.round(baseHeight * 0.33)}`,
      width: Math.round(baseWidth * 0.33),
      height: Math.round(baseHeight * 0.33)
    }
  ];
  
  return resolutions;
}

// 기본 export (전체 유틸리티)
export default {
  parseRatio,
  qualityBaseHeight,
  getResolutions
};
