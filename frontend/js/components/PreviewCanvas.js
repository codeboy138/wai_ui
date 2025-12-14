// Preview Canvas Component (DOM 오버레이 스텁)
// - 기존에는 각 레이어 박스를 <div class="canvas-box"> 로 렌더하고
//   드래그/리사이즈/우클릭 등을 모두 DOM에서 처리했음.
// - 현재 단계에서는 인터랙션을 PixiJS 로 이관했기 때문에
//   DOM 오버레이는 비활성화하고, 루트 컨테이너만 남긴다.
// - Inspector / Dev 모드에서 preview-canvas-overlay-root ID는 유지된다.

const PreviewCanvas = {
    props: ['canvasBoxes', 'selectedBoxId'],
    template: `
        <div
            id="preview-canvas-overlay-root"
            class="absolute inset-0 z-30 pointer-events-none"
        ></div>
    `
};

window.PreviewCanvas = PreviewCanvas;
