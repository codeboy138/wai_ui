// ============================================
// WAI-UI TimelinePanel Component (Vue 3)
// 파일 위치: frontend/js/components/TimelinePanel.js
// 트랙 헤더 좌측 고정 + 높이 컨텍스트 메뉴 수정
// ============================================

const TimelinePanel = {
  name: 'TimelinePanel',
  
  emits: ['time-update', 'duration-change', 'tracks-change', 'asset-to-storage'],

  data() {
    return {
      // 트랙 데이터
      tracks: [
        { id: 'track_1', name: '비디오 1', type: 'video', height: 80, clips: [], muted: false, locked: false, visible: true, color: '#3b82f6' },
        { id: 'track_2', name: '오디오 1', type: 'audio', height: 60, clips: [], muted: false, locked: false, visible: true, color: '#10b981' }
      ],

      // 트랙 높이 프리셋
      trackHeightPresets: {
        low: 40,
        medium: 80,
        high: 120,
        default: 80
      },

      // 재생 상태
      currentTime: 0,
      duration: 60,
      isPlaying: false,
      playInterval: null,

      // 줌/스크롤
      pixelsPerSecond: 50,
      scrollLeft: 0,
      scrollTop: 0,

      // 선택 상태
      selectedClipIds: [],
      selectedTrackId: null,

      // 드래그 상태
      isDraggingClip: false,
      isDraggingPlayhead: false,
      isResizingClip: false,
      resizeEdge: null,
      dragStartX: 0,
      dragStartTime: 0,
      dragClipOriginal: null,

      // 트랙 드래그 (순서 변경)
      isDraggingTrack: false,
      dragTrackId: null,
      dragTrackStartY: 0,
      dragTrackTargetIndex: -1,

      // 볼륨 컨트롤
      masterVolume: 1,
      showVolumeSlider: false,
      isDraggingVolume: false,

      // 스냅/리플
      snapEnabled: true,
      rippleEnabled: false,

      // 뷰 모드
      fitToView: false,
      followPlayhead: false,

      // 컨텍스트 메뉴
      showContextMenu: false,
      contextMenuX: 0,
      contextMenuY: 0,
      contextMenuType: null,
      contextMenuTarget: null,

      // 트랙 헤더 컨텍스트 메뉴
      showTrackHeaderMenu: false,
      trackHeaderMenuX: 0,
      trackHeaderMenuY: 0,
      trackHeaderMenuTrackId: null,

      // 클립 볼륨 팝업
      showClipVolumePopup: false,
      clipVolumePopupX: 0,
      clipVolumePopupY: 0,
      clipVolumeTarget: null,

      // 트랙 레인 영역 참조
      trackLaneRect: null
    };
  },

  computed: {
    // 타임라인 전체 너비
    timelineWidth() {
      return this.duration * this.pixelsPerSecond;
    },

    // 플레이헤드 위치
    playheadPosition() {
      return this.currentTime * this.pixelsPerSecond;
    },

    // 눈금자 마크
    rulerMarks() {
      const marks = [];
      const interval = this.calculateRulerInterval();
      for (let t = 0; t <= this.duration; t += interval) {
        marks.push({
          time: t,
          position: t * this.pixelsPerSecond,
          label: this.formatTime(t),
          isMajor: t % (interval * 5) === 0
        });
      }
      return marks;
    },

    // 선택된 클립이 있는지
    hasSelectedClip() {
      return this.selectedClipIds.length > 0;
    },

    // 볼륨 아이콘 클래스
    volumeIconClass() {
      if (this.masterVolume === 0) return 'fas fa-volume-mute';
      if (this.masterVolume < 0.5) return 'fas fa-volume-down';
      return 'fas fa-volume-up';
    },

    // 모든 트랙의 총 높이
    totalTracksHeight() {
      return this.tracks.reduce((sum, t) => sum + t.height, 0);
    }
  },

  watch: {
    tracks: {
      handler(newTracks) {
        this.$emit('tracks-change', newTracks);
        this.updateDuration();
      },
      deep: true
    },
    currentTime(newTime) {
      this.$emit('time-update', newTime);
    }
  },

  mounted() {
    this.initEventListeners();
    this.updateTrackLaneRect();
    window.addEventListener('resize', this.updateTrackLaneRect);
  },

  beforeUnmount() {
    this.removeEventListeners();
    window.removeEventListener('resize', this.updateTrackLaneRect);
    if (this.playInterval) {
      clearInterval(this.playInterval);
    }
  },

  methods: {
    // === 초기화 ===
    initEventListeners() {
      document.addEventListener('mousemove', this.onGlobalMouseMove);
      document.addEventListener('mouseup', this.onGlobalMouseUp);
      document.addEventListener('keydown', this.onKeyDown);
    },

    removeEventListeners() {
      document.removeEventListener('mousemove', this.onGlobalMouseMove);
      document.removeEventListener('mouseup', this.onGlobalMouseUp);
      document.removeEventListener('keydown', this.onKeyDown);
    },

    updateTrackLaneRect() {
      const laneEl = this.$refs.trackLanes;
      if (laneEl) {
        this.trackLaneRect = laneEl.getBoundingClientRect();
      }
    },

    // === 눈금자 간격 계산 ===
    calculateRulerInterval() {
      if (this.pixelsPerSecond >= 100) return 1;
      if (this.pixelsPerSecond >= 50) return 2;
      if (this.pixelsPerSecond >= 25) return 5;
      if (this.pixelsPerSecond >= 10) return 10;
      return 30;
    },

    // === 시간 포맷 ===
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const frames = Math.floor((seconds % 1) * 30);
      return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    },

    // === 재생 제어 ===
    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    play() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.playInterval = setInterval(() => {
        this.currentTime += 1 / 30;
        if (this.currentTime >= this.duration) {
          this.currentTime = 0;
        }
        if (this.followPlayhead) {
          this.scrollToPlayhead();
        }
      }, 1000 / 30);
    },

    pause() {
      this.isPlaying = false;
      if (this.playInterval) {
        clearInterval(this.playInterval);
        this.playInterval = null;
      }
    },

    stop() {
      this.pause();
      this.currentTime = 0;
    },

    skipBackward() {
      this.currentTime = Math.max(0, this.currentTime - 5);
    },

    skipForward() {
      this.currentTime = Math.min(this.duration, this.currentTime + 5);
    },

    goToStart() {
      this.currentTime = 0;
    },

    goToEnd() {
      this.currentTime = this.duration;
    },

    // === 플레이헤드 ===
    onPlayheadMouseDown(e) {
      e.preventDefault();
      this.isDraggingPlayhead = true;
      this.updatePlayheadFromMouse(e);
    },

    onRulerClick(e) {
      this.updatePlayheadFromMouse(e);
    },

    updatePlayheadFromMouse(e) {
      const rulerEl = this.$refs.ruler;
      if (!rulerEl) return;
      const rect = rulerEl.getBoundingClientRect();
      const x = e.clientX - rect.left + this.scrollLeft;
      const time = x / this.pixelsPerSecond;
      this.currentTime = Math.max(0, Math.min(this.duration, time));
    },

    scrollToPlayhead() {
      const container = this.$refs.trackContainer;
      if (!container) return;
      const viewWidth = container.clientWidth;
      const playheadX = this.playheadPosition;
      if (playheadX < this.scrollLeft || playheadX > this.scrollLeft + viewWidth - 100) {
        this.scrollLeft = Math.max(0, playheadX - viewWidth / 2);
        container.scrollLeft = this.scrollLeft;
      }
    },

    // === 줌 제어 ===
    zoomIn() {
      this.pixelsPerSecond = Math.min(300, this.pixelsPerSecond * 1.2);
    },

    zoomOut() {
      this.pixelsPerSecond = Math.max(10, this.pixelsPerSecond / 1.2);
    },

    onTrackLaneWheel(e) {
      // 트랙 레인 영역 내에서만 줌 작동
      this.updateTrackLaneRect();
      if (!this.trackLaneRect) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // 마우스가 트랙 레인 영역 내에 있는지 확인
      if (
        mouseX < this.trackLaneRect.left ||
        mouseX > this.trackLaneRect.right ||
        mouseY < this.trackLaneRect.top ||
        mouseY > this.trackLaneRect.bottom
      ) {
        return; // 트랙 레인 영역 밖이면 줌 안함
      }

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.pixelsPerSecond = Math.max(10, Math.min(300, this.pixelsPerSecond * delta));
      }
    },

    fitTimelineToView() {
      const container = this.$refs.trackContainer;
      if (!container) return;
      const viewWidth = container.clientWidth - 150; // 트랙 헤더 너비 제외
      if (this.duration > 0) {
        this.pixelsPerSecond = viewWidth / this.duration;
      }
      this.fitToView = true;
      setTimeout(() => { this.fitToView = false; }, 300);
    },

    toggleFollowPlayhead() {
      this.followPlayhead = !this.followPlayhead;
    },

    // === 스냅/리플 토글 ===
    toggleSnap() {
      this.snapEnabled = !this.snapEnabled;
    },

    toggleRipple() {
      this.rippleEnabled = !this.rippleEnabled;
    },

    // === 볼륨 제어 ===
    onVolumeMouseEnter() {
      this.showVolumeSlider = true;
    },

    onVolumeMouseLeave() {
      if (!this.isDraggingVolume) {
        this.showVolumeSlider = false;
      }
    },

    onVolumeSliderMouseDown(e) {
      e.preventDefault();
      this.isDraggingVolume = true;
      this.updateVolumeFromMouse(e);
    },

    updateVolumeFromMouse(e) {
      const sliderEl = this.$refs.volumeSlider;
      if (!sliderEl) return;
      const rect = sliderEl.getBoundingClientRect();
      const y = rect.bottom - e.clientY;
      const height = rect.height;
      this.masterVolume = Math.max(0, Math.min(1, y / height));
    },

    onVolumeWheel(e) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      this.masterVolume = Math.max(0, Math.min(1, this.masterVolume + delta));
    },

    // === 스크롤 동기화 ===
    onTrackScroll(e) {
      this.scrollLeft = e.target.scrollLeft;
      this.scrollTop = e.target.scrollTop;
    },

    // === 트랙 관리 ===
    addTrack(type = 'video') {
      const trackNum = this.tracks.filter(t => t.type === type).length + 1;
      const newTrack = {
        id: `track_${Date.now()}`,
        name: `${type === 'video' ? '비디오' : '오디오'} ${trackNum}`,
        type: type,
        height: this.trackHeightPresets.default,
        clips: [],
        muted: false,
        locked: false,
        visible: true,
        color: type === 'video' ? '#3b82f6' : '#10b981'
      };
      this.tracks.unshift(newTrack);
    },

    deleteTrack(trackId) {
      if (this.tracks.length <= 1) {
        alert('최소 1개의 트랙이 필요합니다.');
        return;
      }
      const idx = this.tracks.findIndex(t => t.id === trackId);
      if (idx !== -1) {
        this.tracks.splice(idx, 1);
      }
    },

    duplicateTrack(trackId) {
      const track = this.tracks.find(t => t.id === trackId);
      if (!track) return;
      const newTrack = {
        ...JSON.parse(JSON.stringify(track)),
        id: `track_${Date.now()}`,
        name: `${track.name} 복사`
      };
      const idx = this.tracks.findIndex(t => t.id === trackId);
      this.tracks.splice(idx + 1, 0, newTrack);
    },

    // === 트랙 헤더 컨텍스트 메뉴 ===
    onTrackHeaderContextMenu(e, track) {
      e.preventDefault();
      this.trackHeaderMenuTrackId = track.id;
      this.trackHeaderMenuX = e.clientX;
      this.trackHeaderMenuY = e.clientY;
      this.showTrackHeaderMenu = true;
    },

    closeTrackHeaderMenu() {
      this.showTrackHeaderMenu = false;
      this.trackHeaderMenuTrackId = null;
    },

    setTrackHeight(trackId, preset) {
      const track = this.tracks.find(t => t.id === trackId);
      if (!track) return;
      track.height = this.trackHeightPresets[preset] || this.trackHeightPresets.default;
      this.closeTrackHeaderMenu();
    },

    toggleTrackMute(trackId) {
      const track = this.tracks.find(t => t.id === trackId);
      if (track) track.muted = !track.muted;
      this.closeTrackHeaderMenu();
    },

    toggleTrackLock(trackId) {
      const track = this.tracks.find(t => t.id === trackId);
      if (track) track.locked = !track.locked;
      this.closeTrackHeaderMenu();
    },

    toggleTrackVisibility(trackId) {
      const track = this.tracks.find(t => t.id === trackId);
      if (track) track.visible = !track.visible;
      this.closeTrackHeaderMenu();
    },

    setMainTrack(trackId) {
      this.tracks.forEach(t => { t.isMain = t.id === trackId; });
      this.closeTrackHeaderMenu();
    },

    // 코드연결지점
    // 코드연결지점

    // === 트랙 드래그 (순서 변경) ===
    onTrackDragStart(e, track) {
      if (track.locked) return;
      this.isDraggingTrack = true;
      this.dragTrackId = track.id;
      this.dragTrackStartY = e.clientY;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', track.id);
    },

    onTrackDragOver(e, targetTrack, targetIndex) {
      if (!this.isDraggingTrack) return;
      if (this.dragTrackId === targetTrack.id) return;
      e.preventDefault();
      this.dragTrackTargetIndex = targetIndex;
    },

    onTrackDragLeave() {
      this.dragTrackTargetIndex = -1;
    },

    onTrackDrop(e, targetTrack, targetIndex) {
      e.preventDefault();
      if (!this.isDraggingTrack || !this.dragTrackId) return;

      const fromIndex = this.tracks.findIndex(t => t.id === this.dragTrackId);
      if (fromIndex === -1 || fromIndex === targetIndex) {
        this.resetTrackDrag();
        return;
      }

      const [movedTrack] = this.tracks.splice(fromIndex, 1);
      const insertIndex = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
      this.tracks.splice(insertIndex, 0, movedTrack);

      this.resetTrackDrag();
    },

    onTrackDragEnd() {
      this.resetTrackDrag();
    },

    resetTrackDrag() {
      this.isDraggingTrack = false;
      this.dragTrackId = null;
      this.dragTrackTargetIndex = -1;
    },

    // === 클립 관리 ===
    addClipFromAsset(asset) {
      const targetTrack = this.tracks.find(t => {
        if (asset.type === 'video' || asset.type === 'image') return t.type === 'video';
        if (asset.type === 'sound') return t.type === 'audio';
        return false;
      });

      if (!targetTrack) {
        this.addTrack(asset.type === 'sound' ? 'audio' : 'video');
        this.$nextTick(() => {
          this.addClipFromAsset(asset);
        });
        return;
      }

      const lastClipEnd = targetTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);

      const newClip = {
        id: `clip_${Date.now()}`,
        name: asset.name,
        type: asset.type,
        src: asset.src,
        startTime: lastClipEnd,
        duration: asset.duration || 5,
        inPoint: 0,
        outPoint: asset.duration || 5,
        volume: 1,
        thumbnail: asset.thumbnail || '',
        waveform: null,
        filmstrip: []
      };

      targetTrack.clips.push(newClip);
      this.selectedClipIds = [newClip.id];
      this.updateDuration();

      // 썸네일/웨이브폼 생성
      if (asset.type === 'video') {
        this.generateFilmstrip(newClip);
      } else if (asset.type === 'sound') {
        this.generateWaveform(newClip);
      }
    },

    deleteSelectedClips() {
      if (this.selectedClipIds.length === 0) return;
      this.tracks.forEach(track => {
        track.clips = track.clips.filter(c => !this.selectedClipIds.includes(c.id));
      });
      this.selectedClipIds = [];
      this.updateDuration();
    },

    splitClipAtPlayhead() {
      const selectedClip = this.getSelectedClip();
      if (!selectedClip) return;

      const track = this.tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
      if (!track) return;

      const splitTime = this.currentTime;
      if (splitTime <= selectedClip.startTime || splitTime >= selectedClip.startTime + selectedClip.duration) {
        return;
      }

      const firstDuration = splitTime - selectedClip.startTime;
      const secondDuration = selectedClip.duration - firstDuration;

      const secondClip = {
        ...JSON.parse(JSON.stringify(selectedClip)),
        id: `clip_${Date.now()}`,
        startTime: splitTime,
        duration: secondDuration,
        inPoint: selectedClip.inPoint + firstDuration
      };

      selectedClip.duration = firstDuration;
      selectedClip.outPoint = selectedClip.inPoint + firstDuration;

      const idx = track.clips.findIndex(c => c.id === selectedClip.id);
      track.clips.splice(idx + 1, 0, secondClip);

      this.selectedClipIds = [secondClip.id];
    },

    getSelectedClip() {
      if (this.selectedClipIds.length === 0) return null;
      for (const track of this.tracks) {
        const clip = track.clips.find(c => c.id === this.selectedClipIds[0]);
        if (clip) return clip;
      }
      return null;
    },

    // === 클립 선택 ===
    onClipClick(e, clip, track) {
      if (e.ctrlKey || e.metaKey) {
        const idx = this.selectedClipIds.indexOf(clip.id);
        if (idx === -1) {
          this.selectedClipIds.push(clip.id);
        } else {
          this.selectedClipIds.splice(idx, 1);
        }
      } else {
        this.selectedClipIds = [clip.id];
      }
      this.selectedTrackId = track.id;
    },

    // === 클립 드래그 ===
    onClipMouseDown(e, clip, track) {
      if (track.locked) return;
      if (e.button !== 0) return;

      const clipEl = e.currentTarget;
      const rect = clipEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      // 리사이즈 핸들 체크 (양쪽 10px)
      if (x < 10) {
        this.startClipResize(e, clip, track, 'left');
      } else if (x > width - 10) {
        this.startClipResize(e, clip, track, 'right');
      } else {
        this.startClipDrag(e, clip, track);
      }
    },

    startClipDrag(e, clip, track) {
      this.isDraggingClip = true;
      this.dragStartX = e.clientX;
      this.dragStartTime = clip.startTime;
      this.dragClipOriginal = { ...clip, trackId: track.id };

      if (!this.selectedClipIds.includes(clip.id)) {
        this.selectedClipIds = [clip.id];
      }
    },

    startClipResize(e, clip, track, edge) {
      this.isResizingClip = true;
      this.resizeEdge = edge;
      this.dragStartX = e.clientX;
      this.dragClipOriginal = { ...clip, trackId: track.id };

      this.selectedClipIds = [clip.id];
    },

    // === 글로벌 마우스 이벤트 ===
    onGlobalMouseMove(e) {
      if (this.isDraggingPlayhead) {
        this.updatePlayheadFromMouse(e);
      }

      if (this.isDraggingVolume) {
        this.updateVolumeFromMouse(e);
      }

      if (this.isDraggingClip && this.dragClipOriginal) {
        const dx = e.clientX - this.dragStartX;
        const dt = dx / this.pixelsPerSecond;
        let newTime = this.dragStartTime + dt;

        if (this.snapEnabled) {
          newTime = this.snapToGrid(newTime);
        }

        newTime = Math.max(0, newTime);

        const track = this.tracks.find(t => t.id === this.dragClipOriginal.trackId);
        if (track) {
          const clip = track.clips.find(c => c.id === this.dragClipOriginal.id);
          if (clip) {
            clip.startTime = newTime;
          }
        }
      }

      if (this.isResizingClip && this.dragClipOriginal) {
        const dx = e.clientX - this.dragStartX;
        const dt = dx / this.pixelsPerSecond;

        const track = this.tracks.find(t => t.id === this.dragClipOriginal.trackId);
        if (!track) return;
        const clip = track.clips.find(c => c.id === this.dragClipOriginal.id);
        if (!clip) return;

        if (this.resizeEdge === 'left') {
          let newStart = this.dragClipOriginal.startTime + dt;
          let newDuration = this.dragClipOriginal.duration - dt;

          if (this.snapEnabled) {
            newStart = this.snapToGrid(newStart);
            newDuration = this.dragClipOriginal.startTime + this.dragClipOriginal.duration - newStart;
          }

          if (newStart >= 0 && newDuration >= 0.1) {
            clip.startTime = newStart;
            clip.duration = newDuration;
            clip.inPoint = this.dragClipOriginal.inPoint + (newStart - this.dragClipOriginal.startTime);
          }
        } else if (this.resizeEdge === 'right') {
          let newDuration = this.dragClipOriginal.duration + dt;

          if (this.snapEnabled) {
            const newEnd = this.snapToGrid(clip.startTime + newDuration);
            newDuration = newEnd - clip.startTime;
          }

          if (newDuration >= 0.1) {
            clip.duration = newDuration;
            clip.outPoint = clip.inPoint + newDuration;
          }
        }
      }
    },

    onGlobalMouseUp() {
      if (this.isDraggingClip || this.isResizingClip) {
        this.updateDuration();
      }

      this.isDraggingPlayhead = false;
      this.isDraggingClip = false;
      this.isResizingClip = false;
      this.resizeEdge = null;
      this.dragClipOriginal = null;

      if (this.isDraggingVolume) {
        this.isDraggingVolume = false;
        if (!this.showVolumeSlider) {
          this.showVolumeSlider = false;
        }
      }
    },

    // === 스냅 ===
    snapToGrid(time) {
      const interval = this.calculateRulerInterval();
      const snapThreshold = interval / 4;
      const nearestMark = Math.round(time / interval) * interval;

      if (Math.abs(time - nearestMark) < snapThreshold) {
        return nearestMark;
      }

      // 다른 클립 경계에 스냅
      for (const track of this.tracks) {
        for (const clip of track.clips) {
          if (this.dragClipOriginal && clip.id === this.dragClipOriginal.id) continue;

          if (Math.abs(time - clip.startTime) < snapThreshold) {
            return clip.startTime;
          }
          if (Math.abs(time - (clip.startTime + clip.duration)) < snapThreshold) {
            return clip.startTime + clip.duration;
          }
        }
      }

      return time;
    },

    // === Duration 업데이트 ===
    updateDuration() {
      let maxEnd = 60;
      this.tracks.forEach(track => {
        track.clips.forEach(clip => {
          const end = clip.startTime + clip.duration;
          if (end > maxEnd) maxEnd = end;
        });
      });
      this.duration = maxEnd + 10;
      this.$emit('duration-change', this.duration);
    },

    // === 키보드 단축키 ===
    onKeyDown(e) {
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
        case 'KeyS':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.splitClipAtPlayhead();
          }
          break;
        case 'KeyN':
          e.preventDefault();
          this.toggleSnap();
          break;
      }
    },

    // === 필름스트립 생성 ===
    generateFilmstrip(clip) {
      if (!clip.src) return;

      const video = document.createElement('video');
      video.src = clip.src;
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const frameCount = Math.min(10, Math.ceil(duration));
        const frames = [];

        const captureFrame = (index) => {
          if (index >= frameCount) {
            clip.filmstrip = frames;
            video.remove();
            return;
          }

          const time = (index / frameCount) * duration;
          video.currentTime = time;
        };

        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 80;
          canvas.height = 45;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          frames.push({
            time: video.currentTime,
            dataUrl: canvas.toDataURL('image/jpeg', 0.6)
          });

          captureFrame(frames.length);
        };

        captureFrame(0);
      };
    },

    // === 웨이브폼 생성 ===
    generateWaveform(clip) {
      if (!clip.src) return;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      fetch(clip.src)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const channelData = audioBuffer.getChannelData(0);
          const samples = 100;
          const blockSize = Math.floor(channelData.length / samples);
          const waveform = [];

          for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(channelData[i * blockSize + j]);
            }
            waveform.push(sum / blockSize);
          }

          const max = Math.max(...waveform);
          clip.waveform = waveform.map(v => v / max);
        })
        .catch(err => {
          console.warn('Waveform 생성 실패:', err);
        });
    },

    // === 클립 스타일 ===
    clipStyle(clip) {
      return {
        left: clip.startTime * this.pixelsPerSecond + 'px',
        width: clip.duration * this.pixelsPerSecond + 'px',
        height: '100%'
      };
    },

    // === 자산을 저장소로 이동 ===
    sendClipToStorage(clip) {
      this.$emit('asset-to-storage', {
        name: clip.name,
        type: clip.type,
        src: clip.src,
        duration: clip.duration,
        thumbnail: clip.thumbnail
      });
    },

    // === 클립 컨텍스트 메뉴 ===
    onClipContextMenu(e, clip, track) {
      e.preventDefault();
      this.contextMenuType = 'clip';
      this.contextMenuTarget = { clip, track };
      this.contextMenuX = e.clientX;
      this.contextMenuY = e.clientY;
      this.showContextMenu = true;
    },

    closeContextMenu() {
      this.showContextMenu = false;
      this.contextMenuType = null;
      this.contextMenuTarget = null;
    },

    // === Undo/Redo (placeholder) ===
    undo() {
      console.log('Undo');
    },

    redo() {
      console.log('Redo');
    }
  },

  template: `
    <div 
      class="timeline-panel flex flex-col h-full bg-bg-dark select-none"
      @click="closeContextMenu(); closeTrackHeaderMenu();"
    >
      <!-- 퀵바 1: 되돌리기, 자르기, 삭제 -->
      <div class="timeline-quickbar flex items-center h-9 px-2 gap-1 border-b border-ui-border bg-bg-panel">
        <div class="flex items-center gap-1 pr-2 border-r border-ui-border">
          <button class="tool-btn" title="되돌리기 (Ctrl+Z)" @click="undo">
            <i class="fas fa-undo"></i>
          </button>
          <button class="tool-btn" title="다시실행 (Ctrl+Y)" @click="redo">
            <i class="fas fa-redo"></i>
          </button>
        </div>
        <div class="flex items-center gap-1 px-2 border-r border-ui-border">
          <button class="tool-btn" title="자르기 (S)" @click="splitClipAtPlayhead" :disabled="!hasSelectedClip">
            <i class="fas fa-cut"></i>
          </button>
          <button class="tool-btn" title="삭제 (Del)" @click="deleteSelectedClips" :disabled="!hasSelectedClip">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="flex items-center gap-1 px-2 border-r border-ui-border">
          <button class="tool-btn" @click="addTrack('video')" title="비디오 트랙 추가">
            <i class="fas fa-film"></i>
            <i class="fas fa-plus text-xs"></i>
          </button>
          <button class="tool-btn" @click="addTrack('audio')" title="오디오 트랙 추가">
            <i class="fas fa-music"></i>
            <i class="fas fa-plus text-xs"></i>
          </button>
        </div>
        <div class="flex-1"></div>
        <!-- 우측: 전체보기, 커서중심, 스냅, 리플 -->
        <div class="flex items-center gap-1">
          <button 
            class="tool-btn" 
            :class="{ 'active': fitToView }" 
            @click="fitTimelineToView" 
            title="전체보기"
          >
            <i class="fas fa-expand"></i>
          </button>
          <button 
            class="tool-btn" 
            :class="{ 'active': followPlayhead }" 
            @click="toggleFollowPlayhead" 
            title="커서중심"
            :style="{ color: followPlayhead ? '#fbbf24' : '' }"
          >
            <i class="fas fa-crosshairs"></i>
          </button>
          <button 
            class="tool-btn" 
            :class="{ 'active': snapEnabled }" 
            @click="toggleSnap" 
            title="스냅"
          >
            <i class="fas fa-magnet"></i>
          </button>
          <button 
            class="tool-btn" 
            :class="{ 'active': rippleEnabled }" 
            @click="toggleRipple" 
            title="리플"
          >
            <i class="fas fa-water"></i>
          </button>
        </div>
      </div>

      <!-- 퀵바 2: 재생 컨트롤, 볼륨, 줌 -->
      <div class="timeline-quickbar flex items-center h-9 px-2 gap-1 border-b border-ui-border bg-bg-panel">
        <div class="flex items-center gap-1 pr-2 border-r border-ui-border">
          <button class="tool-btn" @click="goToStart" title="처음으로">
            <i class="fas fa-step-backward"></i>
          </button>
          <button class="tool-btn" @click="skipBackward" title="5초 뒤로">
            <i class="fas fa-backward"></i>
          </button>
          <button class="tool-btn play-btn" @click="togglePlay" :title="isPlaying ? '일시정지' : '재생'">
            <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
          </button>
          <button class="tool-btn" @click="skipForward" title="5초 앞으로">
            <i class="fas fa-forward"></i>
          </button>
          <button class="tool-btn" @click="goToEnd" title="끝으로">
            <i class="fas fa-step-forward"></i>
          </button>
        </div>
        <div class="flex items-center gap-1 px-2 border-r border-ui-border">
          <span class="text-xs text-text-secondary font-mono w-24 text-center">{{ formatTime(currentTime) }}</span>
        </div>
        <div 
          class="flex items-center gap-1 px-2 border-r border-ui-border volume-control-wrapper"
          @mouseenter="onVolumeMouseEnter"
          @mouseleave="onVolumeMouseLeave"
        >
          <button class="tool-btn" :title="'볼륨: ' + Math.round(masterVolume * 100) + '%'">
            <i :class="volumeIconClass"></i>
          </button>
          <div 
            v-show="showVolumeSlider" 
            class="volume-slider-popup"
            @wheel.prevent="onVolumeWheel"
          >
            <div 
              ref="volumeSlider"
              class="volume-slider-vertical" 
              @mousedown="onVolumeSliderMouseDown"
            >
              <div class="volume-slider-track"></div>
              <div class="volume-slider-fill" :style="{ height: (masterVolume * 100) + '%' }"></div>
              <div class="volume-slider-thumb" :style="{ bottom: 'calc(' + (masterVolume * 100) + '% - 6px)' }"></div>
            </div>
            <span class="volume-slider-value">{{ Math.round(masterVolume * 100) }}%</span>
          </div>
        </div>
        <div class="flex items-center gap-1 px-2">
          <button class="tool-btn" @click="zoomOut" title="축소">
            <i class="fas fa-search-minus"></i>
          </button>
          <input 
            type="range" 
            min="10" 
            max="300" 
            v-model.number="pixelsPerSecond" 
            class="w-20 h-1 bg-bg-input rounded cursor-pointer"
          >
          <button class="tool-btn" @click="zoomIn" title="확대">
            <i class="fas fa-search-plus"></i>
          </button>
        </div>
      </div>

      <!-- 타임라인 본체 -->
      <div class="flex-1 flex overflow-hidden" @wheel="onTrackLaneWheel">
        
        <!-- 트랙 헤더 (좌측 고정) -->
        <div class="track-header-container w-36 flex-shrink-0 border-r border-ui-border bg-bg-panel overflow-hidden">
          <!-- 헤더 상단 (눈금자 영역 높이 맞춤) -->
          <div class="h-6 border-b border-ui-border flex items-center justify-center">
            <button class="tool-btn text-xs" @click="addTrack('video')" title="트랙 추가">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <!-- 트랙 헤더 목록 -->
          <div 
            class="track-headers-list overflow-y-auto"
            :style="{ height: 'calc(100% - 24px)' }"
          >
            <div
              v-for="(track, index) in tracks"
              :key="track.id"
              class="track-header flex items-center px-2 gap-1 border-b border-ui-border cursor-move"
              :style="{ height: track.height + 'px', backgroundColor: track.isMain ? 'rgba(59,130,246,0.1)' : '' }"
              :class="{ 
                'opacity-50': track.muted,
                'track-drag-over': dragTrackTargetIndex === index
              }"
              draggable="true"
              @dragstart="onTrackDragStart($event, track)"
              @dragover="onTrackDragOver($event, track, index)"
              @dragleave="onTrackDragLeave"
              @drop="onTrackDrop($event, track, index)"
              @dragend="onTrackDragEnd"
              @contextmenu="onTrackHeaderContextMenu($event, track)"
            >
              <div 
                class="w-1 h-full rounded-full mr-1"
                :style="{ backgroundColor: track.color }"
              ></div>
              <span class="text-xs truncate flex-1">{{ track.name }}</span>
              <div class="flex items-center gap-0.5">
                <button 
                  class="p-1 rounded hover:bg-bg-hover text-xs"
                  :class="{ 'text-red-500': track.muted }"
                  @click.stop="toggleTrackMute(track.id)"
                  :title="track.muted ? '음소거 해제' : '음소거'"
                >
                  <i :class="track.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up'"></i>
                </button>
                <button 
                  class="p-1 rounded hover:bg-bg-hover text-xs"
                  :class="{ 'text-yellow-500': track.locked }"
                  @click.stop="toggleTrackLock(track.id)"
                  :title="track.locked ? '잠금 해제' : '잠금'"
                >
                  <i :class="track.locked ? 'fas fa-lock' : 'fas fa-unlock'"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 트랙 레인 (스크롤 영역) -->
        <div 
          ref="trackContainer"
          class="flex-1 overflow-auto relative"
          @scroll="onTrackScroll"
        >
          <!-- 눈금자 -->
          <div 
            ref="ruler"
            class="timeline-ruler h-6 sticky top-0 z-20 bg-bg-panel border-b border-ui-border cursor-pointer"
            :style="{ width: timelineWidth + 'px' }"
            @click="onRulerClick"
          >
            <div
              v-for="mark in rulerMarks"
              :key="mark.time"
              class="ruler-mark absolute"
              :class="{ 'major': mark.isMajor }"
              :style="{ left: mark.position + 'px' }"
            >
              <span v-if="mark.isMajor" class="ruler-label">{{ mark.label }}</span>
            </div>
            <!-- 플레이헤드 상단 -->
            <div 
              class="playhead-top absolute top-0 w-4 h-4 bg-red-500 cursor-ew-resize"
              :style="{ left: (playheadPosition - 8) + 'px' }"
              @mousedown.stop="onPlayheadMouseDown"
            >
              <div class="playhead-needle"></div>
            </div>
          </div>

          <!-- 트랙 레인 -->
          <div 
            ref="trackLanes"
            class="track-lanes relative"
            :style="{ width: timelineWidth + 'px', minHeight: totalTracksHeight + 'px' }"
          >
            <!-- 플레이헤드 라인 -->
            <div 
              class="playhead-line absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
              :style="{ left: playheadPosition + 'px' }"
            ></div>

            <!-- 트랙들 -->
            <div
              v-for="track in tracks"
              :key="track.id"
              class="track-lane relative border-b border-ui-border"
              :style="{ height: track.height + 'px' }"
              :class="{ 'opacity-50': !track.visible }"
            >
              <!-- 클립들 -->
              <div
                v-for="clip in track.clips"
                :key="clip.id"
                class="timeline-clip absolute top-1 bottom-1 rounded cursor-pointer"
                :class="{ 
                  'selected': selectedClipIds.includes(clip.id),
                  'clip-video': clip.type === 'video',
                  'clip-audio': clip.type === 'sound'
                }"
                :style="clipStyle(clip)"
                @mousedown="onClipMouseDown($event, clip, track)"
                @click.stop="onClipClick($event, clip, track)"
                @contextmenu="onClipContextMenu($event, clip, track)"
              >
                <!-- 필름스트립 (비디오) -->
                <div v-if="clip.type === 'video' && clip.filmstrip && clip.filmstrip.length" class="clip-filmstrip">
                  <img 
                    v-for="(frame, idx) in clip.filmstrip" 
                    :key="idx"
                    :src="frame.dataUrl"
                    class="filmstrip-frame"
                  />
                </div>

                <!-- 웨이브폼 (오디오) -->
                <div v-if="clip.type === 'sound' && clip.waveform" class="clip-waveform">
                  <svg class="waveform-svg" preserveAspectRatio="none">
                    <path
                      :d="'M0,' + (clip.waveform.length > 0 ? 25 : 0) + ' ' + clip.waveform.map((v, i) => 'L' + (i * 100 / clip.waveform.length) + '%,' + (25 - v * 20)).join(' ')"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1"
                    />
                  </svg>
                </div>

                <!-- 클립 이름 -->
                <div class="clip-label">{{ clip.name }}</div>

                <!-- 리사이즈 핸들 -->
                <div class="clip-resize-handle left"></div>
                <div class="clip-resize-handle right"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 트랙 헤더 컨텍스트 메뉴 -->
      <div 
        v-if="showTrackHeaderMenu"
        class="context-menu fixed z-50 bg-bg-panel border border-ui-border rounded shadow-lg py-1 min-w-40"
        :style="{ left: trackHeaderMenuX + 'px', top: trackHeaderMenuY + 'px' }"
        @click.stop
      >
        <div class="px-2 py-1 text-xs text-text-secondary border-b border-ui-border">트랙 높이</div>
        <button class="context-menu-item" @click="setTrackHeight(trackHeaderMenuTrackId, 'default')">
          <i class="fas fa-undo w-4"></i> 초기화
        </button>
        <button class="context-menu-item" @click="setTrackHeight(trackHeaderMenuTrackId, 'high')">
          <i class="fas fa-arrows-alt-v w-4"></i> 높음
        </button>
        <button class="context-menu-item" @click="setTrackHeight(trackHeaderMenuTrackId, 'medium')">
          <i class="fas fa-minus w-4"></i> 중간
        </button>
        <button class="context-menu-item" @click="setTrackHeight(trackHeaderMenuTrackId, 'low')">
          <i class="fas fa-compress-alt w-4"></i> 낮음
        </button>
        <div class="border-t border-ui-border my-1"></div>
        <button class="context-menu-item" @click="toggleTrackMute(trackHeaderMenuTrackId)">
          <i class="fas fa-volume-mute w-4"></i> 음소거 토글
        </button>
        <button class="context-menu-item" @click="toggleTrackLock(trackHeaderMenuTrackId)">
          <i class="fas fa-lock w-4"></i> 잠금 토글
        </button>
        <button class="context-menu-item" @click="toggleTrackVisibility(trackHeaderMenuTrackId)">
          <i class="fas fa-eye w-4"></i> 표시 토글
        </button>
        <div class="border-t border-ui-border my-1"></div>
        <button class="context-menu-item" @click="setMainTrack(trackHeaderMenuTrackId)">
          <i class="fas fa-star w-4"></i> 메인 트랙 설정
        </button>
        <button class="context-menu-item" @click="duplicateTrack(trackHeaderMenuTrackId)">
          <i class="fas fa-copy w-4"></i> 트랙 복제
        </button>
        <button class="context-menu-item text-red-400" @click="deleteTrack(trackHeaderMenuTrackId)">
          <i class="fas fa-trash w-4"></i> 트랙 삭제
        </button>
      </div>

      <!-- 클립 컨텍스트 메뉴 -->
      <div 
        v-if="showContextMenu && contextMenuType === 'clip'"
        class="context-menu fixed z-50 bg-bg-panel border border-ui-border rounded shadow-lg py-1 min-w-40"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
        @click.stop
      >
        <button class="context-menu-item" @click="splitClipAtPlayhead(); closeContextMenu();">
          <i class="fas fa-cut w-4"></i> 분할
        </button>
        <button class="context-menu-item" @click="sendClipToStorage(contextMenuTarget.clip); closeContextMenu();">
          <i class="fas fa-folder-plus w-4"></i> 자산 저장소로 이동
        </button>
        <button class="context-menu-item text-red-400" @click="deleteSelectedClips(); closeContextMenu();">
          <i class="fas fa-trash w-4"></i> 삭제
        </button>
      </div>
    </div>
  `
};

window.TimelinePanel = TimelinePanel;
