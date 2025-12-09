// ==========================================
// UI 해상도 계산 로직
// 역할: 화면 비율과 해상도 계산 유틸리티
// 경로: App/Utils/UICustom
// ==========================================

export const UILogic = {
    /**
     * 화면 비율 문자열을 숫자로 변환
     * @param {string} ratioStr - 비율 문자열 (예: "16:9")
     * @returns {number} - 비율 값 (예: 1.777...)
     * @example parseRatio("16:9") → 1.777...
     */
    parseRatio(ratioStr) {
        if (!ratioStr) return 16/9;
        const parts = ratioStr.split(':');
        return parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : 16/9;
    },

    /**
     * 품질별 기본 높이 (픽셀)
     * @type {Object<string, number>}
     */
    qualityBaseHeight: {
        '8K': 4320,
        '6K': 3240,
        '4K': 2160,
        '3K': 1620,
        '2K': 1440,
        'FHD': 1080,
        'HD': 720
    },

    /**
     * 화면 비율에 따른 해상도 목록 생성
     * @param {string} aspectRatioStr - 화면 비율 (예: "16:9")
     * @returns {Array<Object>} - 해상도 목록 [{ label, value }, ...]
     * @example getResolutions("16:9") → [
     *   { label: "8K (7680 x 4320)", value: "8K" },
     *   { label: "4K (3840 x 2160)", value: "4K" },
     *   ...
     * ]
     */
    getResolutions(aspectRatioStr) {
        const ratio = this.parseRatio(aspectRatioStr);
        return Object.entries(this.qualityBaseHeight).map(([label, h]) => {
            const w = Math.round(h * ratio);
            return {
                label: `${label} (${w} x ${h})`,
                value: label
            };
        });
    }
};
