// ============================================
// Timeline History Mixin (Undo/Redo)
// 파일 위치: frontend/js/components/timeline/mixins/timelineHistoryMixin.js
// ============================================

window.TimelineHistoryMixin = {
    data: function() {
        return {
            historyStack: [],
            historyIndex: -1,
            maxHistorySize: 50,
            isUndoRedoAction: false
        };
    },

    computed: {
        canUndo: function() {
            return this.historyIndex > 0;
        },
        canRedo: function() {
            return this.historyIndex < this.historyStack.length - 1;
        }
    },

    methods: {
        // 히스토리에 현재 상태 저장
        saveToHistory: function() {
            if (this.isUndoRedoAction) return;

            var state = {
                clips: JSON.parse(JSON.stringify(this.vm.clips)),
                tracks: JSON.parse(JSON.stringify(this.vm.tracks))
            };

            // 현재 위치 이후의 히스토리 제거
            if (this.historyIndex < this.historyStack.length - 1) {
                this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
            }

            this.historyStack.push(state);

            // 최대 크기 초과 시 오래된 항목 제거
            if (this.historyStack.length > this.maxHistorySize) {
                this.historyStack.shift();
            } else {
                this.historyIndex++;
            }
        },

        // 실행 취소
        undo: function() {
            if (!this.canUndo) return;

            this.isUndoRedoAction = true;
            this.historyIndex--;

            var state = this.historyStack[this.historyIndex];
            this.vm.clips = JSON.parse(JSON.stringify(state.clips));
            this.vm.tracks = JSON.parse(JSON.stringify(state.tracks));

            this.selectedClipIds = [];
            this.syncVmSelectedClip();

            var self = this;
            this.$nextTick(function() {
                self.isUndoRedoAction = false;
            });
        },

        // 다시 실행
        redo: function() {
            if (!this.canRedo) return;

            this.isUndoRedoAction = true;
            this.historyIndex++;

            var state = this.historyStack[this.historyIndex];
            this.vm.clips = JSON.parse(JSON.stringify(state.clips));
            this.vm.tracks = JSON.parse(JSON.stringify(state.tracks));

            this.selectedClipIds = [];
            this.syncVmSelectedClip();

            var self = this;
            this.$nextTick(function() {
                self.isUndoRedoAction = false;
            });
        }
    }
};
