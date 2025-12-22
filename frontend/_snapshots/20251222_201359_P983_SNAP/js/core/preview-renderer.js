// ============================================
// WAI-UI Preview Renderer (Vue 3)
// 파일 위치: frontend/js/core/preview-renderer.js
// 화면 비율 변경 시 캔버스 비율 연동 수정
// ============================================

const PreviewRenderer = {
    // 캔버스 및 앱 인스턴스 참조
    canvas: null,
    ctx: null,
    vm: null,
    masterVolume: 1,
    _canvasSize: { w: 1920, h: 1080 },
    _currentTime: 0,

    // 초기화
    init: function(canvas, vm) {
        if (!canvas) {
            console.warn('[PreviewRenderer] Canvas element not found');
            return;
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.vm = vm;
        
        // 캔버스 크기 설정
        this.updateCanvasSize();
        
        console.log('[PreviewRenderer] Initialized');
    },

    // 캔버스 크기 업데이트
    updateCanvasSize: function() {
        if (!this.canvas || !this.vm) return;
        
        var size = this.vm.canvasSize || { w: 1920, h: 1080 };
        this.canvas.width = size.w;
        this.canvas.height = size.h;
        this._canvasSize = size;
    },

    // 캔버스 크기 설정 (외부 호출용)
    setCanvasSize: function(size) {
        if (size && typeof size.w === 'number' && typeof size.h === 'number') {
            this._canvasSize = { w: size.w, h: size.h };
            if (this.canvas) {
                this.canvas.width = size.w;
                this.canvas.height = size.h;
            }
        }
    },

    // 현재 시간 설정
    setCurrentTime: function(time) {
        this._currentTime = time;
        // 비디오 동기화
        this.syncVideoPlayback(time);
    },

    // 비디오 재생 동기화
    syncVideoPlayback: function(time) {
        var videos = document.querySelectorAll('#preview-canvas-scaler video');
        videos.forEach(function(video) {
            // 클립 시작 시간과 비교하여 동기화
            var clipStart = parseFloat(video.dataset.clipStart) || 0;
            var clipDuration = parseFloat(video.dataset.clipDuration) || video.duration || 0;
            
            if (time >= clipStart && time < clipStart + clipDuration) {
                var videoTime = time - clipStart;
                if (Math.abs(video.currentTime - videoTime) > 0.5) {
                    video.currentTime = videoTime;
                }
            }
        });
    },

    // 마스터 볼륨 설정
    setMasterVolume: function(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.applyVolumeToMedia();
    },

    // 미디어 요소에 볼륨 적용
    applyVolumeToMedia: function() {
        var self = this;
        var mediaElements = document.querySelectorAll('#preview-canvas-scaler video, #preview-canvas-scaler audio');
        mediaElements.forEach(function(el) {
            el.volume = self.masterVolume;
        });
    },

    // 클립 볼륨 업데이트
    updateClipVolume: function(clipId, volume) {
        var videos = document.querySelectorAll('#preview-canvas-scaler video, #preview-canvas-scaler audio');
        videos.forEach(function(el) {
            var parentBox = el.closest('.canvas-box');
            if (parentBox) {
                var boxId = parentBox.id || '';
                if (boxId.indexOf(clipId) >= 0) {
                    el.volume = Math.max(0, Math.min(1, volume));
                }
            }
        });
    },

    // 렌더링 (필요시 확장)
    render: function() {
        if (!this.ctx || !this.canvas) return;
        
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 추가 렌더링 로직이 필요하면 여기에 구현
    },

    // 정리
    destroy: function() {
        this.canvas = null;
        this.ctx = null;
        this.vm = null;
    }
};

window.PreviewRenderer = PreviewRenderer;
