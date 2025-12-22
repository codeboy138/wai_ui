// ============================================
// Timeline Zoom Mixin
// 파일 위치: frontend/js/components/timeline/mixins/timelineZoomMixin.js
// ============================================

window.TimelineZoomMixin = {
    data: function() {
        return {
            zoomMode: 'cursor',
            currentDisplayZoom: 20,
            zoomMin: 1,
            zoomMax: 200,
            scrollLeft: 0,
            viewportWidth: 1000
        };
    },

    computed: {
        pixelsPerSecond: function() {
            return this.currentDisplayZoom;
        },
        zoomDisplayText: function() {
            if (this.pixelsPerSecond >= 60) return Math.round(this.pixelsPerSecond) + 'px/s';
            if (this.pixelsPerSecond >= 1) return this.pixelsPerSecond.toFixed(1) + 'px/s';
            return (this.pixelsPerSecond * 60).toFixed(1) + 'px/m';
        },
        visibleTimeRange: function() {
            return {
                startTime: Math.max(0, this.scrollLeft / this.pixelsPerSecond - 10),
                endTime: (this.scrollLeft + this.viewportWidth) / this.pixelsPerSecond + 10
            };
        }
    },

    methods: {
        // 줌 범위 계산
        calculateDynamicZoomRange: function() {
            var container = document.getElementById('timeline-scroll-container');
            if (!container) return;

            this.zoomMin = Math.max(0.1, (container.clientWidth - 40) / Math.max(60, this.maxClipEnd + 30) / 2);
            if (this.currentDisplayZoom < this.zoomMin) {
                this.currentDisplayZoom = this.zoomMin;
            }
        },

        // 전체 보기 줌
        zoomToFit: function() {
            var container = document.getElementById('timeline-scroll-container');
            if (!container) return;

            this.currentDisplayZoom = Math.max(
                this.zoomMin,
                Math.min(this.zoomMax, (container.clientWidth - 40) / Math.max(10, this.maxClipEnd + 5))
            );
            this.vm.zoom = this.currentDisplayZoom;

            var self = this;
            this.$nextTick(function() {
                container.scrollLeft = 0;
                self.scrollLeft = 0;
            });
        },

        // 줌 모드 토글
        toggleZoomMode: function() {
            this.zoomMode = this.zoomMode === 'cursor' ? 'playhead' : 'cursor';
        },

        // 줌 입력 핸들러
        handleZoomInput: function(e) {
            this.setZoom(Number(e.target.value), this.zoomMode === 'playhead' ? 'playhead' : null);
        },

        // 줌 설정
        setZoom: function(zoom, center) {
            this.currentDisplayZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, zoom));
            this.vm.zoom = this.currentDisplayZoom;

            if (center === 'playhead') {
                var self = this;
                this.$nextTick(function() {
                    var sc = document.getElementById('timeline-scroll-container');
                    if (sc) {
                        sc.scrollLeft = self.vm.currentTime * self.pixelsPerSecond - sc.clientWidth / 2;
                        self.scrollLeft = sc.scrollLeft;
                    }
                });
            }
        },

        // 뷰포트 크기 업데이트
        updateViewportSize: function() {
            var container = document.getElementById('timeline-scroll-container');
            if (container) {
                this.viewportWidth = container.clientWidth;
            }
        },

        // 휠 줌 처리
        handleLaneWheel: function(e) {
            if (!this.isMouseInLane) return;

            var sc = document.getElementById('timeline-scroll-container');
            if (!sc) return;

            if (e.shiftKey || e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();

                var zoomFactor = this.currentDisplayZoom > 10 ? 0.15 : 0.3;
                var delta = e.deltaY > 0 ? -this.currentDisplayZoom * zoomFactor : this.currentDisplayZoom * zoomFactor;
                var newZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, this.currentDisplayZoom + delta));

                if (this.zoomMode === 'playhead') {
                    this.setZoom(newZoom, 'playhead');
                } else {
                    var lane = document.getElementById('timeline-lane-container');
                    if (lane) {
                        var rect = lane.getBoundingClientRect();
                        var cursorX = e.clientX - rect.left;
                        var cursorTime = (sc.scrollLeft + cursorX) / this.pixelsPerSecond;

                        this.currentDisplayZoom = newZoom;
                        this.vm.zoom = newZoom;

                        var self = this;
                        this.$nextTick(function() {
                            sc.scrollLeft = cursorTime * self.pixelsPerSecond - cursorX;
                            self.scrollLeft = sc.scrollLeft;
                        });
                    } else {
                        this.setZoom(newZoom);
                    }
                }
            } else {
                sc.scrollLeft += e.deltaY;
                this.scrollLeft = sc.scrollLeft;
            }
        }
    }
};
