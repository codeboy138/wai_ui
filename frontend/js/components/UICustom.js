// UI 해상도 계산 로직
export const UILogic = {
    parseRatio(ratioStr) {
        if (!ratioStr) return 16/9;
        const parts = ratioStr.split(':');
        return parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : 16/9;
    },
    qualityBaseHeight: {
        '8K': 4320, '6K': 3240, '4K': 2160,
        '3K': 1620, '2K': 1440, 'FHD': 1080, 'HD': 720
    },
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