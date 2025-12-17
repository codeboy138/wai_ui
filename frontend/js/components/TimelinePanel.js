/**
 * TimelinePanel.js
 * - 타임라인 패널 컴포넌트
 * - 트랙/클립 관리, 재생헤드, 드래그앤드롭
 * - 클립 다중선택, 스냅, 충돌방지
 */

const TimelinePanel = {
    name: 'TimelinePanel',
    
    props: {
        vm: { type: Object, default: null }
    },
    
    data() {
        return {
            // 트랙 데이터
            tracks: [
                { id: 1, name: '비디오 1', type: 'video', height: 60, muted: false, locked: false },
                { id: 2, name: '비디오 2', type: 'video', height: 60, muted: false, locked: false },
                { id: 3, name: '오디오 1', type: 'audio', height: 50, muted: false, locked: false },
                { id: 4, name: '오디오 2', type: 'audio', height: 50, muted: false, locked: false }
            ],
            
            // 클립 데이터
            clips: [],
            
            // 재생 상태
            isPlaying: false,
            currentTime: 0,
            duration: 60,
            
            // 타임라인 설정
            pixelsPerSecond: 50,
            scrollLeft: 0,
            
            // 선택 상태
            selectedClipIds: [],
            
            // 드래그 상태
            isDraggingClip: false,
            dragClipId: null,
            dragStartX: 0,
            dragStartTime: 0,
            
            // 리사이즈 상태
            isResizingClip: false,
            resizeClipId: null,
            resizeEdge: null,
            resizeStartX: 0,
            resizeStartTime: 0,
            resizeStartDuration: 0,
            
            // 플레이헤드 드래그
            isDraggingPlayhead: false,
            
            // 스냅 설정
            snapEnabled: true,
            snapThreshold: 10,
            snapAlignTime: null,
            
            // 트랙 높이 조절
            isResizingTrack: false,
            resizeTrackId: null,
            resizeTrackStartY: 0,
            resizeTrackStartHeight: 0,
            
            // 헤더 너비
            headerWidth: 120,
            isResizingHeader: false,
            headerResizeStartX: 0,
            headerResizeStartWidth: 0,
            
            // 타임라인 접기
            isTimelineCollapsed: false,
            
            // 애니메이션 프레임
            animationFrameId: null
        };
    },
    
    computed: {
        // 전체 타임라인 너비
        timelineWidth() {
            return this.duration * this.pixelsPerSecond;
        },
        
        // 플레이헤드 위치 (px)
        playheadPosition() {
            return this.currentTime * this.pixelsPerSecond;
        },
        
        // 눈금 생성
        rulerMarks() {
            const marks = [];
            const majorInterval = this.getMajorInterval();
            const minorInterval = majorInterval / 4;
            
            for (let t = 0; t <= this.duration; t += minorInterval) {
                const isMajor = Math.abs(t % majorInterval) < 0.001;
                marks.push({
                    time: t,
                    position: t * this.pixelsPerSecond,
                    isMajor,
                    label: isMajor ? this.formatTime(t) : null
                });
            }
            
            return marks;
        },
        
        // 타임라인 전체 높이 (접힌 상태 고려)
        timelineBodyHeight() {
            if (this.isTimelineCollapsed) {
                return '0px';
            }
            return 'auto';
        }
    },
    
    methods: {
        // ========== 시간 포맷 ==========
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            const frames = Math.floor((seconds % 1) * 30);
            return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
        },
        
        formatTimeShort(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        getMajorInterval() {
            if (this.pixelsPerSecond >= 100) return 1;
            if (this.pixelsPerSecond >= 50) return 2;
            if (this.pixelsPerSecond >= 25) return 5;
            return 10;
        },
        
        // ========== 재생 컨트롤 ==========
        togglePlay() {
            this.isPlaying = !this.isPlaying;
            
            if (this.isPlaying) {
                this.startPlayback();
            } else {
                this.stopPlayback();
            }
        },
        
        startPlayback() {
            const startTime = performance.now();
            const startCurrentTime = this.currentTime;
            
            const animate = (now) => {
                if (!this.isPlaying) return;
                
                const elapsed = (now - startTime) / 1000;
                this.currentTime = startCurrentTime + elapsed;
                
                if (this.currentTime >= this.duration) {
                    this.currentTime = 0;
                    this.isPlaying = false;
                    return;
                }
                
                this.animationFrameId = requestAnimationFrame(animate);
            };
            
            this.animationFrameId = requestAnimationFrame(animate);
        },
        
        stopPlayback() {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        },
        
        goToStart() {
            this.currentTime = 0;
            this.stopPlayback();
            this.isPlaying = false;
        },
        
        goToEnd() {
            this.currentTime = this.duration;
            this.stopPlayback();
            this.isPlaying = false;
        },
        
        stepBackward() {
            this.currentTime = Math.max(0, this.currentTime - 1/30);
        },
        
        stepForward() {
            this.currentTime = Math.min(this.duration, this.currentTime + 1/30);
        },
        
        // ========== 플레이헤드 드래그 ==========
        startPlayheadDrag(e) {
            this.isDraggingPlayhead = true;
            this.updatePlayheadFromEvent(e);
            
            document.addEventListener('mousemove', this.onPlayheadDrag);
            document.addEventListener('mouseup', this.stopPlayheadDrag);
        },
        
        onPlayheadDrag(e) {
            if (!this.isDraggingPlayhead) return;
            this.updatePlayheadFromEvent(e);
        },
        
        stopPlayheadDrag() {
            this.isDraggingPlayhead = false;
            document.removeEventListener('mousemove', this.onPlayheadDrag);
            document.removeEventListener('mouseup', this.stopPlayheadDrag);
        },
        
        updatePlayheadFromEvent(e) {
            const rulerEl = this.$refs.rulerArea;
            if (!rulerEl) return;
            
            const rect = rulerEl.getBoundingClientRect();
            const x = e.clientX - rect.left + this.scrollLeft;
            const time = Math.max(0, Math.min(this.duration, x / this.pixelsPerSecond));
            this.currentTime = time;
        },
        
        // ========== 눈금자 클릭 ==========
        onRulerClick(e) {
            this.updatePlayheadFromEvent(e);
        },
        
        // ========== 클립 관리 ==========
        getClipsForTrack(trackId) {
            return this.clips.filter(c => c.trackId === trackId);
        },
        
        getClipStyle(clip) {
            const isSelected = this.selectedClipIds.includes(clip.id);
            const left = clip.startTime * this.pixelsPerSecond;
            const width = clip.duration * this.pixelsPerSecond;
            
            let bgColor = '#3b82f6';
            if (clip.type === 'audio') bgColor = '#22c55e';
            if (clip.type === 'image') bgColor = '#f59e0b';
            
            return {
                position: 'absolute',
                left: left + 'px',
                width: width + 'px',
                top: '4px',
                bottom: '4px',
                backgroundColor: bgColor,
                borderRadius: '4px',
                cursor: 'move',
                border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                boxShadow: isSelected ? '0 0 0 1px #3b82f6' : 'none',
                overflow: 'hidden'
            };
        },
        
        // ========== 클립 선택 ==========
        selectClip(e, clip) {
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+클릭: 토글 선택
                const idx = this.selectedClipIds.indexOf(clip.id);
                if (idx >= 0) {
                    this.selectedClipIds.splice(idx, 1);
                } else {
                    this.selectedClipIds.push(clip.id);
                }
            } else if (e.shiftKey && this.selectedClipIds.length > 0) {
                // Shift+클릭: 범위 선택
                const trackClips = this.getClipsForTrack(clip.trackId)
                    .sort((a, b) => a.startTime - b.startTime);
                const lastSelectedId = this.selectedClipIds[this.selectedClipIds.length - 1];
                const lastClip = trackClips.find(c => c.id === lastSelectedId);
                
                if (lastClip) {
                    const startIdx = trackClips.indexOf(lastClip);
                    const endIdx = trackClips.indexOf(clip);
                    const minIdx = Math.min(startIdx, endIdx);
                    const maxIdx = Math.max(startIdx, endIdx);
                    
                    for (let i = minIdx; i <= maxIdx; i++) {
                        if (!this.selectedClipIds.includes(trackClips[i].id)) {
                            this.selectedClipIds.push(trackClips[i].id);
                        }
                    }
                }
            } else {
                // 일반 클릭: 단일 선택
                this.selectedClipIds = [clip.id];
            }
        },
        
        clearSelection() {
            this.selectedClipIds = [];
        },
        
        // ========== 클립 드래그 ==========
        startClipDrag(e, clip) {
            if (e.button !== 0) return;
            
            this.selectClip(e, clip);
            
            this.isDraggingClip = true;
            this.dragClipId = clip.id;
            this.dragStartX = e.clientX;
            this.dragStartTime = clip.startTime;
            
            document.addEventListener('mousemove', this.onClipDrag);
            document.addEventListener('mouseup', this.stopClipDrag);
        },
        
        onClipDrag(e) {
            if (!this.isDraggingClip || !this.dragClipId) return;
            
            const dx = e.clientX - this.dragStartX;
            const dt = dx / this.pixelsPerSecond;
            let newTime = Math.max(0, this.dragStartTime + dt);
            
            const clip = this.clips.find(c => c.id === this.dragClipId);
            if (!clip) return;
            
            // 스냅 처리
            if (this.snapEnabled) {
                const snapResult = this.checkSnap(clip, newTime);
                if (snapResult.snapped) {
                    newTime = snapResult.time;
                    this.snapAlignTime = snapResult.alignTime;
                } else {
                    this.snapAlignTime = null;
                }
            }
            
            // 충돌 검사
            const endTime = newTime + clip.duration;
            const hasCollision = this.checkCollision(clip.id, clip.trackId, newTime, endTime);
            
            if (!hasCollision) {
                clip.startTime = newTime;
            }
        },
        
        stopClipDrag() {
            // 스냅 플래시 효과
            if (this.snapAlignTime !== null && this.dragClipId) {
                this.triggerSnapFlash(this.dragClipId);
            }
            
            this.isDraggingClip = false;
            this.dragClipId = null;
            this.snapAlignTime = null;
            
            document.removeEventListener('mousemove', this.onClipDrag);
            document.removeEventListener('mouseup', this.stopClipDrag);
        },
        
        // ========== 클립 리사이즈 ==========
        startClipResize(e, clip, edge) {
            e.stopPropagation();
            
            this.isResizingClip = true;
            this.resizeClipId = clip.id;
            this.resizeEdge = edge;
            this.resizeStartX = e.clientX;
            this.resizeStartTime = clip.startTime;
            this.resizeStartDuration = clip.duration;
            
            document.addEventListener('mousemove', this.onClipResize);
            document.addEventListener('mouseup', this.stopClipResize);
        },
        
        onClipResize(e) {
            if (!this.isResizingClip || !this.resizeClipId) return;
            
            const clip = this.clips.find(c => c.id === this.resizeClipId);
            if (!clip) return;
            
            const dx = e.clientX - this.resizeStartX;
            const dt = dx / this.pixelsPerSecond;
            
            if (this.resizeEdge === 'left') {
                const newStart = Math.max(0, this.resizeStartTime + dt);
                const newDuration = this.resizeStartDuration - (newStart - this.resizeStartTime);
                
                if (newDuration >= 0.1) {
                    const hasCollision = this.checkCollision(clip.id, clip.trackId, newStart, newStart + newDuration);
                    if (!hasCollision) {
                        clip.startTime = newStart;
                        clip.duration = newDuration;
                    }
                }
            } else {
                const newDuration = Math.max(0.1, this.resizeStartDuration + dt);
                const endTime = clip.startTime + newDuration;
                
                const hasCollision = this.checkCollision(clip.id, clip.trackId, clip.startTime, endTime);
                if (!hasCollision) {
                    clip.duration = newDuration;
                }
            }
        },
        
        stopClipResize() {
            this.isResizingClip = false;
            this.resizeClipId = null;
            this.resizeEdge = null;
            
            document.removeEventListener('mousemove', this.onClipResize);
            document.removeEventListener('mouseup', this.stopClipResize);
        },
        
        // ========== 스냅 & 충돌 ==========
        checkSnap(clip, newTime) {
            const threshold = this.snapThreshold / this.pixelsPerSecond;
            const clipEnd = newTime + clip.duration;
            
            // 다른 클립들과 스냅 검사
            for (const other of this.clips) {
                if (other.id === clip.id) continue;
                
                const otherStart = other.startTime;
                const otherEnd = other.startTime + other.duration;
                
                // 시작점 -> 다른 클립 끝점
                if (Math.abs(newTime - otherEnd) < threshold) {
                    return { snapped: true, time: otherEnd, alignTime: otherEnd };
                }
                
                // 끝점 -> 다른 클립 시작점
                if (Math.abs(clipEnd - otherStart) < threshold) {
                    return { snapped: true, time: otherStart - clip.duration, alignTime: otherStart };
                }
                
                // 시작점 정렬
                if (Math.abs(newTime - otherStart) < threshold) {
                    return { snapped: true, time: otherStart, alignTime: otherStart };
                }
                
                // 끝점 정렬
                if (Math.abs(clipEnd - otherEnd) < threshold) {
                    return { snapped: true, time: otherEnd - clip.duration, alignTime: otherEnd };
                }
            }
            
            // 플레이헤드 스냅
            if (Math.abs(newTime - this.currentTime) < threshold) {
                return { snapped: true, time: this.currentTime, alignTime: this.currentTime };
            }
            
            return { snapped: false };
        },
        
        checkCollision(clipId, trackId, startTime, endTime) {
            for (const other of this.clips) {
                if (other.id === clipId || other.trackId !== trackId) continue;
                
                const otherStart = other.startTime;
                const otherEnd = other.startTime + other.duration;
                
                // 겹침 검사
                if (startTime < otherEnd && endTime > otherStart) {
                    return true;
                }
            }
            return false;
        },
        
        triggerSnapFlash(clipId) {
            const clipEl = this.$el.querySelector(`[data-clip-id="${clipId}"]`);
            if (clipEl) {
                clipEl.classList.add('snap-flash-left', 'snap-flash-right');
                setTimeout(() => {
                    clipEl.classList.remove('snap-flash-left', 'snap-flash-right');
                }, 1000);
            }
        },
        
        // ========== 드래그앤드롭 (자산 모달에서) ==========
        handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        },
        
        handleDrop(e) {
            e.preventDefault();
            
            // 자산 데이터 가져오기
            const assetDataStr = e.dataTransfer.getData('text/wai-asset');
            if (!assetDataStr) {
                console.log('[Timeline] No wai-asset data');
                return;
            }
            
            let assetData;
            try {
                assetData = JSON.parse(assetDataStr);
            } catch (err) {
                console.error('[Timeline] Failed to parse asset data:', err);
                return;
            }
            
            console.log('[Timeline] Dropped asset:', assetData);
            
            // 드롭 위치에서 트랙과 시간 계산
            const trackEl = e.target.closest('[data-track-id]');
            let trackId = 1;
            
            if (trackEl) {
                trackId = parseInt(trackEl.dataset.trackId, 10);
            } else {
                // 기본 트랙 결정 (비디오/이미지 -> 비디오트랙, 오디오 -> 오디오트랙)
                if (assetData.type === 'audio' || assetData.type === 'sound') {
                    trackId = 3;
                }
            }
            
            // 드롭 위치 시간 계산
            const timelineArea = this.$refs.timelineArea;
            let dropTime = 0;
            
            if (timelineArea) {
                const rect = timelineArea.getBoundingClientRect();
                const x = e.clientX - rect.left + this.scrollLeft - this.headerWidth;
                dropTime = Math.max(0, x / this.pixelsPerSecond);
            }
            
            // 새 클립 생성
            const newClip = {
                id: Date.now(),
                trackId: trackId,
                name: assetData.name || 'New Clip',
                type: assetData.type || 'video',
                startTime: dropTime,
                duration: assetData.duration || 5,
                assetId: assetData.id,
                thumbnail: assetData.thumbnail,
                src: assetData.src || assetData.path
            };
            
            // 충돌 검사 후 추가
            const hasCollision = this.checkCollision(
                newClip.id, 
                newClip.trackId, 
                newClip.startTime, 
                newClip.startTime + newClip.duration
            );
            
            if (hasCollision) {
                // 충돌 시 빈 공간 찾기
                newClip.startTime = this.findEmptySpace(newClip.trackId, newClip.duration);
            }
            
            this.clips.push(newClip);
            this.selectedClipIds = [newClip.id];
            
            // 토스트 메시지
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: '클립 추가됨',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        },
        
        findEmptySpace(trackId, duration) {
            const trackClips = this.getClipsForTrack(trackId)
                .sort((a, b) => a.startTime - b.startTime);
            
            if (trackClips.length === 0) return 0;
            
            // 마지막 클립 뒤에 배치
            const lastClip = trackClips[trackClips.length - 1];
            return lastClip.startTime + lastClip.duration;
        },
        
        // ========== 클립 삭제 ==========
        deleteSelectedClips() {
            if (this.selectedClipIds.length === 0) return;
            
            this.clips = this.clips.filter(c => !this.selectedClipIds.includes(c.id));
            this.selectedClipIds = [];
        },
        
        // ========== 퀵바 액션 ==========
        cutClip() {
            if (this.selectedClipIds.length !== 1) return;
            
            const clipId = this.selectedClipIds[0];
            const clip = this.clips.find(c => c.id === clipId);
            if (!clip) return;
            
            const cutTime = this.currentTime;
            
            // 클립 내부에서만 자르기
            if (cutTime <= clip.startTime || cutTime >= clip.startTime + clip.duration) {
                return;
            }
            
            const leftDuration = cutTime - clip.startTime;
            const rightDuration = clip.duration - leftDuration;
            
            // 원본 클립 수정 (왼쪽)
            clip.duration = leftDuration;
            
            // 새 클립 생성 (오른쪽)
            const newClip = {
                ...clip,
                id: Date.now(),
                startTime: cutTime,
                duration: rightDuration
            };
            
            this.clips.push(newClip);
        },
        
        cutAndRemoveLeft() {
            if (this.selectedClipIds.length !== 1) return;
            
            const clipId = this.selectedClipIds[0];
            const clip = this.clips.find(c => c.id === clipId);
            if (!clip) return;
            
            const cutTime = this.currentTime;
            
            if (cutTime <= clip.startTime || cutTime >= clip.startTime + clip.duration) {
                return;
            }
            
            const newDuration = clip.startTime + clip.duration - cutTime;
            clip.startTime = cutTime;
            clip.duration = newDuration;
        },
        
        cutAndRemoveRight() {
            if (this.selectedClipIds.length !== 1) return;
            
            const clipId = this.selectedClipIds[0];
            const clip = this.clips.find(c => c.id === clipId);
            if (!clip) return;
            
            const cutTime = this.currentTime;
            
            if (cutTime <= clip.startTime || cutTime >= clip.startTime + clip.duration) {
                return;
            }
            
            clip.duration = cutTime - clip.startTime;
        },
        
        // ========== 트랙 높이 조절 ==========
        startTrackResize(e, track) {
            e.preventDefault();
            
            this.isResizingTrack = true;
            this.resizeTrackId = track.id;
            this.resizeTrackStartY = e.clientY;
            this.resizeTrackStartHeight = track.height;
            
            document.addEventListener('mousemove', this.onTrackResize);
            document.addEventListener('mouseup', this.stopTrackResize);
        },
        
        onTrackResize(e) {
            if (!this.isResizingTrack) return;
            
            const track = this.tracks.find(t => t.id === this.resizeTrackId);
            if (!track) return;
            
            const dy = e.clientY - this.resizeTrackStartY;
            track.height = Math.max(30, Math.min(200, this.resizeTrackStartHeight + dy));
        },
        
        stopTrackResize() {
            this.isResizingTrack = false;
            this.resizeTrackId = null;
            
            document.removeEventListener('mousemove', this.onTrackResize);
            document.removeEventListener('mouseup', this.stopTrackResize);
        },
        
        // ========== 헤더 너비 조절 ==========
        startHeaderResize(e) {
            e.preventDefault();
            
            this.isResizingHeader = true;
            this.headerResizeStartX = e.clientX;
            this.headerResizeStartWidth = this.headerWidth;
            
            document.addEventListener('mousemove', this.onHeaderResize);
            document.addEventListener('mouseup', this.stopHeaderResize);
        },
        
        onHeaderResize(e) {
            if (!this.isResizingHeader) return;
            
            const dx = e.clientX - this.headerResizeStartX;
            this.headerWidth = Math.max(0, Math.min(300, this.headerResizeStartWidth + dx));
        },
        
        stopHeaderResize() {
            this.isResizingHeader = false;
            
            document.removeEventListener('mousemove', this.onHeaderResize);
            document.removeEventListener('mouseup', this.stopHeaderResize);
        },
        
        // ========== 타임라인 접기 ==========
        toggleTimelineCollapse() {
            this.isTimelineCollapsed = !this.isTimelineCollapsed;
        },
        
        // ========== 줌 ==========
        zoomIn() {
            this.pixelsPerSecond = Math.min(200, this.pixelsPerSecond * 1.2);
        },
        
        zoomOut() {
            this.pixelsPerSecond = Math.max(10, this.pixelsPerSecond / 1.2);
        },
        
        // ========== 트랙 컨트롤 ==========
        toggleTrackMute(track) {
            track.muted = !track.muted;
        },
        
        toggleTrackLock(track) {
            track.locked = !track.locked;
        },
        
        // ========== 스크롤 ==========
        onTimelineScroll(e) {
            this.scrollLeft = e.target.scrollLeft;
        },
        
        // ========== 키보드 단축키 ==========
        handleKeyDown(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteSelectedClips();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToStart();
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToEnd();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.stepBackward();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.stepForward();
                    break;
            }
        }
    },
    
    mounted() {
        document.addEventListener('keydown', this.handleKeyDown);
    },
    
    beforeUnmount() {
        this.stopPlayback();
        document.removeEventListener('keydown', this.handleKeyDown);
    },
    
    template: `
        <div class="timeline-panel flex flex-col bg-bg-panel border-t border-ui-border" @click.self="clearSelection">
            <!-- Playback Bar -->
            <div class="h-8 flex items-center px-2 gap-2 border-b border-ui-border bg-bg-dark shrink-0">
                <!-- 타임라인 접기 버튼 -->
                <button 
                    class="w-6 h-6 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-hover rounded"
                    @click="toggleTimelineCollapse"
                    :title="isTimelineCollapsed ? '타임라인 펼치기' : '타임라인 접기'"
                >
                    <i :class="isTimelineCollapsed ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
                </button>
                
                <div class="w-px h-4 bg-ui-border"></div>
                
                <!-- Transport Controls -->
                <button class="w-6 h-6 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-hover rounded" @click="goToStart" title="처음으로">
                    <i class="fa-solid fa-backward-fast"></i>
                </button>
                <button class="w-6 h-6 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-hover rounded" @click="stepBackward" title="이전 프레임">
                    <i class="fa-solid fa-backward-step"></i>
                </button>
                <button 
                    class="w-8 h-6 flex items-center justify-center rounded"
                    :class="isPlaying ? 'bg-ui-accent text-white' : 'text-text-sub hover:text-text-main hover:bg-bg-hover'"
                    @click="togglePlay" 
                    title="재생/정지"
                >
                    <i :class="isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
                </button>
                <button class="w-6 h-6 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-hover rounded" @click="stepForward" title="다음 프레임">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
                <button class="w-6 h-6 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-hover rounded" @click="goToEnd" title="끝으로">
                    <i class="fa-solid fa-forward-fast"></i>
                </button>
                
                <div class="w-px h-4 bg-ui-border"></div>
                
                <!-- Time Display -->
                <div class="text-xs text-text-main font-mono px-2 bg-bg-input rounded h-5 flex items-center min-w-[80px] justify-center">
                    {{ formatTime(currentTime) }}
                </div>
                
                <div class="flex-1"></div>
                
                <!-- Quick Actions -->
                <button class="px-2 h-5 text-xxs text-text-sub hover:text-text-main hover:bg-bg-hover rounded flex items-center gap-1" @click="cutAndRemoveLeft" title="자르고 좌측 제거">
                    <i class="fa-solid fa-scissors"></i>
                    <span>좌제거</span>
                </button>
                <button class="px-2 h-5 text-xxs text-text-sub hover:text-text-main hover:bg-bg-hover rounded flex items-center gap-1" @click="cutAndRemoveRight" title="자르고 우측 제거">
                    <i class="fa-solid fa-scissors"></i>
                    <span>우제거</span>
                </button>
                <button class="px-2 h-5 text-xxs text-text-sub hover:text-text-main hover:bg-bg-hover rounded flex items-center gap-1" @click="cutClip" title="자르기">
                    <i class="fa-solid fa-scissors"></i>
                    <span>자르기</span>
                </button>
                <button class="px-2 h-5 text-xxs text-text-sub hover:text-ui-danger hover:bg-bg-hover rounded flex items-center gap-1" @click="deleteSelectedClips" title="삭제">
                    <i class="fa-solid fa-trash"></i>
                    <span>삭제</span>
                </button>
                
                <div class="w-px h-4 bg-ui-border"></div>
                
                <!-- Snap Toggle -->
                <button 
                    class="px-2 h-5 text-xxs rounded flex items-center gap-1"
                    :class="snapEnabled ? 'text-ui-accent bg-ui-accent/20' : 'text-text-sub hover:text-text-main hover:bg-bg-hover'"
                    @click="snapEnabled = !snapEnabled"
                    title="스냅 토글"
                >
                    <i class="fa-solid fa-magnet"></i>
                    <span>스냅</span>
                </button>
                
                <!-- Zoom Controls -->
                <button class="w-6 h-6 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-hover rounded" @click="zoomOut" title="축소">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <button class="w-6 h-6 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-bg-hover rounded" @click="zoomIn" title="확대">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
            
            <!-- Timeline Body (Collapsible) -->
            <div 
                class="flex-1 flex flex-col overflow-hidden transition-all duration-200"
                :style="{ display: isTimelineCollapsed ? 'none' : 'flex' }"
            >
                <!-- Ruler + Tracks Container -->
                <div 
                    ref="timelineArea"
                    class="flex-1 overflow-auto relative"
                    @scroll="onTimelineScroll"
                    @dragover="handleDragOver"
                    @drop="handleDrop"
                >
                    <!-- Sticky Header Column -->
                    <div 
                        class="sticky left-0 z-20 bg-bg-panel"
                        :style="{ width: headerWidth + 'px', minWidth: headerWidth + 'px' }"
                    >
                        <!-- Ruler Header -->
                        <div class="h-6 border-b border-ui-border flex items-center justify-end pr-1">
                            <!-- Header Resize Handle -->
                            <div 
                                class="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-ui-accent"
                                @mousedown="startHeaderResize"
                            ></div>
                        </div>
                        
                        <!-- Track Headers -->
                        <div 
                            v-for="track in tracks" 
                            :key="'header-' + track.id"
                            class="relative border-b border-ui-border bg-bg-panel flex items-center px-2 gap-1"
                            :style="{ height: track.height + 'px' }"
                        >
                            <span class="text-xxs text-text-main truncate flex-1">{{ track.name }}</span>
                            
                            <button 
                                class="w-4 h-4 flex items-center justify-center text-xxs rounded"
                                :class="track.muted ? 'text-ui-warning' : 'text-text-sub hover:text-text-main'"
                                @click="toggleTrackMute(track)"
                                title="음소거"
                            >
                                <i :class="track.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'"></i>
                            </button>
                            
                            <button 
                                class="w-4 h-4 flex items-center justify-center text-xxs rounded"
                                :class="track.locked ? 'text-ui-warning' : 'text-text-sub hover:text-text-main'"
                                @click="toggleTrackLock(track)"
                                title="잠금"
                            >
                                <i :class="track.locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'"></i>
                            </button>
                            
                            <!-- Track Height Resize Handle -->
                            <div 
                                class="track-height-handle"
                                @mousedown="startTrackResize($event, track)"
                            ></div>
                        </div>
                    </div>
                    
                    <!-- Timeline Content Area -->
                    <div 
                        class="absolute top-0 left-0"
                        :style="{ 
                            left: headerWidth + 'px',
                            width: timelineWidth + 'px'
                        }"
                    >
                        <!-- Ruler -->
                        <div 
                            ref="rulerArea"
                            class="h-6 relative border-b border-ui-border bg-bg-dark cursor-pointer"
                            @click="onRulerClick"
                            @mousedown="startPlayheadDrag"
                        >
                            <template v-for="mark in rulerMarks" :key="'mark-' + mark.time">
                                <div 
                                    v-if="mark.isMajor"
                                    class="ruler-mark-major"
                                    :style="{ left: mark.position + 'px' }"
                                ></div>
                                <div 
                                    v-else
                                    class="ruler-mark-minor"
                                    :style="{ left: mark.position + 'px' }"
                                ></div>
                                <span 
                                    v-if="mark.label"
                                    class="ruler-time-label"
                                    :style="{ left: (mark.position + 4) + 'px' }"
                                >{{ mark.label }}</span>
                            </template>
                            
                            <!-- Playhead Handle -->
                            <div 
                                class="playhead-handle"
                                :style="{ left: playheadPosition + 'px' }"
                            ></div>
                        </div>
                        
                        <!-- Tracks -->
                        <div 
                            v-for="track in tracks" 
                            :key="'track-' + track.id"
                            :data-track-id="track.id"
                            class="relative border-b border-ui-border"
                            :style="{ height: track.height + 'px', backgroundColor: 'var(--bg-dark)' }"
                        >
                            <!-- Clips -->
                            <div 
                                v-for="clip in getClipsForTrack(track.id)"
                                :key="clip.id"
                                :data-clip-id="clip.id"
                                :style="getClipStyle(clip)"
                                @mousedown="startClipDrag($event, clip)"
                                @click.stop="selectClip($event, clip)"
                            >
                                <!-- Clip Content -->
                                <div class="absolute inset-0 flex items-center px-2 overflow-hidden">
                                    <span class="text-xxs text-white truncate">{{ clip.name }}</span>
                                </div>
                                
                                <!-- Resize Handles -->
                                <div 
                                    class="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                    @mousedown.stop="startClipResize($event, clip, 'left')"
                                ></div>
                                <div 
                                    class="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                    @mousedown.stop="startClipResize($event, clip, 'right')"
                                ></div>
                            </div>
                        </div>
                        
                        <!-- Playhead Line -->
                        <div 
                            class="playhead-line"
                            :style="{ left: playheadPosition + 'px' }"
                        ></div>
                        
                        <!-- Snap Alignment Line -->
                        <div 
                            v-if="snapAlignTime !== null"
                            class="snap-align-line"
                            :style="{ left: (snapAlignTime * pixelsPerSecond) + 'px' }"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// Vue 앱에 컴포넌트 등록
if (typeof window !== 'undefined') {
    window.TimelinePanel = TimelinePanel;
}
