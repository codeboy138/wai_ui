// PreviewCanvas Vue Component
// - Pixi 렌더러(PreviewRenderer)를 Vue 컴포넌트로 래핑
// - DOM 컨테이너 제공 및 라이프사이클 관리

const PreviewCanvas = {
    template: `
        <div class="relative w-full h-full">
            <!-- Pixi 렌더 캔버스는 preview-renderer.js에서 관리 -->
        </div>
    `,
    props: {
        canvasBoxes: {
            type: Array,
            default: () => []
        },
        selectedBoxId: {
            type: String,
            default: null
        }
    },
    mounted() {
        // PreviewRenderer는 app-root.js의 initPreviewRenderer에서 초기화
        console.log('[PreviewCanvas] Component mounted');
    },
    beforeUnmount() {
        console.log('[PreviewCanvas] Component unmounting');
    },
    methods: {
        setSelectedBoxId(id) {
            this.$emit('select-box', id);
        }
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.PreviewCanvas = PreviewCanvas;
}
