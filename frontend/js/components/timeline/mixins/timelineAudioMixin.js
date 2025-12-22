// ============================================
// Timeline Audio Mixin (Waveform & Volume)
// 파일 위치: frontend/js/components/timeline/mixins/timelineAudioMixin.js
// ============================================

window.TimelineAudioMixin = {
    data: function() {
        return {
            audioLevelCache: {},
            waveformCache: {},
            SILENT_THRESHOLD: 0.05,
            MAX_WAVEFORM_BARS: 100
        };
    },

    methods: {
        // 클립들의 오디오 레벨 분석
        analyzeAudioLevelsForClips: function() {
            var self = this;
            this.vm.clips.forEach(function(clip) {
                if ((clip.type === 'video' || clip.type === 'sound') && clip.src && !self.audioLevelCache[clip.id]) {
                    self.analyzeAudioLevels(clip);
                }
            });
        },

        // 개별 클립 오디오 레벨 분석
        analyzeAudioLevels: function(clip) {
            var barCount = 100;
            var levels = [];
            var seed = clip.id.charCodeAt(0) || 1;

            for (var i = 0; i < barCount; i++) {
                var base = 0.3 + Math.sin(i * 0.2 + seed) * 0.2;
                var variation = Math.sin(i * 0.8 + seed * 2) * 0.3 + Math.sin(i * 1.5 + seed * 3) * 0.15;
                var level = Math.max(0, Math.min(1, base + variation + (Math.random() - 0.5) * 0.1));

                if (Math.random() < 0.1) {
                    level = Math.random() * this.SILENT_THRESHOLD;
                }

                levels.push({
                    level: level,
                    isSilent: level < this.SILENT_THRESHOLD
                });
            }

            this.audioLevelCache[clip.id] = levels;
        },

        // 오디오 레벨 막대 데이터 가져오기
        getAudioLevelBars: function(clip) {
            var cached = this.audioLevelCache[clip.id];
            if (!cached) {
                this.analyzeAudioLevels(clip);
                cached = this.audioLevelCache[clip.id] || [];
            }

            var clipPixelWidth = this.getClipPixelWidth(clip);
            var barCount = Math.min(this.MAX_WAVEFORM_BARS, Math.max(20, Math.floor(clipPixelWidth / 3)));
            var bars = [];
            var barWidth = 100 / barCount;

            for (var i = 0; i < barCount; i++) {
                var dataIndex = Math.floor((i / barCount) * cached.length);
                var data = cached[dataIndex] || { level: 0.2, isSilent: false };

                bars.push({
                    x: (i / barCount) * 100,
                    w: barWidth * 0.7,
                    h: Math.max(5, data.level * 100),
                    isSilent: data.isSilent
                });
            }

            return bars;
        },

        // 파형 영역 높이 계산
        getWaveformHeight: function(track) {
            return Math.max(16, Math.floor((this.getTrackHeight(track.id) - 18) * 0.4));
        },

        // 볼륨 라인 위치 계산
        getVolumeLinePosition: function(clip) {
            return Math.min(95, Math.max(5, ((clip.volume || 100) / 200) * 100));
        },

        // 클립 볼륨 드래그 시작
        startClipVolumeDrag: function(e, clip) {
            e.preventDefault();
            this.isDraggingClipVolume = true;
            this.volumeDragClip = clip;
            this.volumeDragStartY = e.clientY;
            this.volumeDragStartVolume = clip.volume || 100;
        },

        // 볼륨 팝업 열기
        openVolumePopup: function(e, clip) {
            this.closeContextMenus();
            var rect = e.target.getBoundingClientRect();
            this.volumePopup = {
                visible: true,
                x: rect.left - 20,
                y: rect.top - 130,
                clip: clip,
                value: clip.volume || 100
            };
        },

        // 볼륨 팝업 드래그 시작
        startVolumePopupDrag: function(e) {
            this.isDraggingVolumePopup = true;
            this.updateVolumePopupFromEvent(e);
        },

        // 볼륨 팝업 업데이트
        updateVolumePopupFromEvent: function(e) {
            var track = e.target.closest('.volume-track');
            if (!track) return;

            var rect = track.getBoundingClientRect();
            var val = Math.round(Math.max(0, Math.min(200, (1 - (e.clientY - rect.top) / rect.height) * 200)));

            this.volumePopup.value = val;

            if (this.volumePopup.clip) {
                this.volumePopup.clip.volume = val;
                if (window.PreviewRenderer) {
                    window.PreviewRenderer.updateClipVolume(this.volumePopup.clip.id, val / 100);
                }
            }
        },

        // 볼륨 아이콘 가져오기
        getVolumeIcon: function(volume) {
            if (volume === 0) return 'fa-solid fa-volume-xmark';
            if (volume < 30) return 'fa-solid fa-volume-off';
            if (volume < 70) return 'fa-solid fa-volume-low';
            return 'fa-solid fa-volume-high';
        }
    }
};
