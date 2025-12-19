// js/components/TimelinePanel.js
// 타임라인 패널 컴포넌트

class TimelinePanel {
  constructor(container, appState) {
    this.container = container;
    this.appState = appState;
    
    // 타임라인 상태
    this.tracks = [];
    this.clips = [];
    this.selectedClips = new Set();
    this.zoom = 1;
    this.scrollLeft = 0;
    this.playheadPosition = 0;
    this.isPlaying = false;
    this.duration = 300; // 5분 (초)
    this.pixelsPerSecond = 20;
    
    // 드래그 상태
    this.isDragging = false;
    this.dragType = null; // 'move', 'resize-left', 'resize-right'
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragClipStartTime = 0;
    this.dragClipStartDuration = 0;
    this.dragClipStartTrack = null;
    
    // 다중 선택 드래그 상태
    this.multiDragData = [];
    
    // 트랙 높이
    this.trackHeight = 60;
    this.trackHeaderWidth = 150;
    
    // 스냅 설정
    this.snapEnabled = true;
    this.snapThreshold = 10; // 픽셀
    
    // 줌 모드: 'cursor' | 'playhead'
    this.zoomMode = 'cursor';
    
    // 컨텍스트 메뉴
    this.contextMenu = null;
    this.contextMenuTarget = null;
    
    // Undo/Redo 히스토리
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
    
    this.render();
    this.setupEventListeners();
    this.initDefaultTracks();
  }

  render() {
    this.container.innerHTML = `
      <div class="timeline-panel" id="timeline-panel">
        <!-- 타임라인 툴바 -->
        <div class="timeline-toolbar">
          <div class="toolbar-left">
            <button class="timeline-btn" id="add-track-btn" title="트랙 추가">
              <span class="icon">+</span> 트랙
            </button>
            <div class="toolbar-separator"></div>
            <button class="timeline-btn" id="snap-toggle-btn" title="스냅 토글">
              <span class="icon">🧲</span> 스냅
            </button>
            <button class="timeline-btn" id="zoom-mode-btn" title="줌 모드 전환">
              <span class="icon">🎯</span> <span id="zoom-mode-label">커서 중심</span>
            </button>
          </div>
          <div class="toolbar-center">
            <button class="timeline-btn" id="play-btn" title="재생/일시정지">
              <span class="icon" id="play-icon">▶</span>
            </button>
            <button class="timeline-btn" id="stop-btn" title="정지">
              <span class="icon">⏹</span>
            </button>
            <span class="timecode" id="current-timecode">00:00:00:00</span>
          </div>
          <div class="toolbar-right">
            <button class="timeline-btn" id="zoom-out-btn" title="축소">−</button>
            <input type="range" id="zoom-slider" min="0.1" max="5" step="0.1" value="1">
            <button class="timeline-btn" id="zoom-in-btn" title="확대">+</button>
            <span class="zoom-level" id="zoom-level">100%</span>
          </div>
        </div>

        <!-- 타임라인 본체 -->
        <div class="timeline-body">
          <!-- 트랙 헤더 영역 -->
          <div class="track-headers" id="track-headers">
            <div class="timeline-ruler-header">
              <span>시간</span>
            </div>
          </div>

          <!-- 타임라인 콘텐츠 영역 -->
          <div class="timeline-content" id="timeline-content">
            <!-- 눈금자 -->
            <div class="timeline-ruler" id="timeline-ruler"></div>
            
            <!-- 트랙 영역 -->
            <div class="tracks-container" id="tracks-container">
              <!-- 플레이헤드 -->
              <div class="playhead" id="playhead">
                <div class="playhead-head"></div>
                <div class="playhead-line"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.cacheElements();
    this.renderRuler();
  }

  cacheElements() {
    this.panelEl = this.container.querySelector('#timeline-panel');
    this.trackHeadersEl = this.container.querySelector('#track-headers');
    this.timelineContentEl = this.container.querySelector('#timeline-content');
    this.tracksContainerEl = this.container.querySelector('#tracks-container');
    this.rulerEl = this.container.querySelector('#timeline-ruler');
    this.playheadEl = this.container.querySelector('#playhead');
    this.playBtn = this.container.querySelector('#play-btn');
    this.playIcon = this.container.querySelector('#play-icon');
    this.timecodeEl = this.container.querySelector('#current-timecode');
    this.zoomSlider = this.container.querySelector('#zoom-slider');
    this.zoomLevelEl = this.container.querySelector('#zoom-level');
    this.zoomModeBtn = this.container.querySelector('#zoom-mode-btn');
    this.zoomModeLabel = this.container.querySelector('#zoom-mode-label');
  }

  setupEventListeners() {
    // 트랙 추가 버튼
    this.container.querySelector('#add-track-btn').addEventListener('click', () => {
      this.addTrack();
    });

    // 스냅 토글
    this.container.querySelector('#snap-toggle-btn').addEventListener('click', (e) => {
      this.snapEnabled = !this.snapEnabled;
      e.currentTarget.classList.toggle('active', this.snapEnabled);
    });

    // 줌 모드 토글
    this.zoomModeBtn.addEventListener('click', () => {
      this.toggleZoomMode();
    });

    // 재생 컨트롤
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.container.querySelector('#stop-btn').addEventListener('click', () => this.stop());

    // 줌 컨트롤
    this.container.querySelector('#zoom-in-btn').addEventListener('click', () => {
      this.setZoom(this.zoom + 0.2);
    });
    this.container.querySelector('#zoom-out-btn').addEventListener('click', () => {
      this.setZoom(this.zoom - 0.2);
    });
    this.zoomSlider.addEventListener('input', (e) => {
      this.setZoom(parseFloat(e.target.value));
    });

    // 휠 줌
    this.timelineContentEl.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.setZoom(this.zoom + delta, e.clientX);
      }
    });

    // 스크롤 동기화
    this.timelineContentEl.addEventListener('scroll', () => {
      this.scrollLeft = this.timelineContentEl.scrollLeft;
      this.trackHeadersEl.scrollTop = this.timelineContentEl.scrollTop;
    });

    // 눈금자 클릭 - 플레이헤드 이동
    this.rulerEl.addEventListener('click', (e) => {
      const rect = this.rulerEl.getBoundingClientRect();
      const x = e.clientX - rect.left + this.timelineContentEl.scrollLeft;
      const time = x / (this.pixelsPerSecond * this.zoom);
      this.setPlayheadPosition(Math.max(0, time));
    });

    // 트랙 영역 클릭 - 선택 해제
    this.tracksContainerEl.addEventListener('mousedown', (e) => {
      if (e.target === this.tracksContainerEl || e.target.classList.contains('track')) {
        if (!e.ctrlKey && !e.shiftKey) {
          this.clearSelection();
        }
      }
    });

    // 컨텍스트 메뉴
    this.tracksContainerEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e);
    });

    // 컨텍스트 메뉴 닫기
    document.addEventListener('click', (e) => {
      if (this.contextMenu && !this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // 드래그 이벤트
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
  }

  // 줌 모드 토글
  toggleZoomMode() {
    this.zoomMode = this.zoomMode === 'cursor' ? 'playhead' : 'cursor';
    this.zoomModeLabel.textContent = this.zoomMode === 'cursor' ? '커서 중심' : '플레이헤드 중심';
    this.zoomModeBtn.classList.toggle('active', this.zoomMode === 'playhead');
  }

  handleKeyDown(e) {
    // 입력 필드에서는 단축키 무시
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Undo: Ctrl+Z
    if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      this.undo();
      return;
    }

    // Redo: Ctrl+Y 또는 Ctrl+Shift+Z
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      this.redo();
      return;
    }

    // Delete 키 - 선택된 클립 삭제
    if (e.key === 'Delete' && this.selectedClips.size > 0) {
      e.preventDefault();
      this.saveState();
      this.deleteSelectedClips();
    }

    // Space 키 - 재생/일시정지
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      this.togglePlay();
    }

    // Ctrl+A - 전체 선택
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      this.selectAllClips();
    }
  }

  // 상태 저장 (Undo용)
  saveState() {
    const state = {
      tracks: JSON.parse(JSON.stringify(this.tracks)),
      clips: JSON.parse(JSON.stringify(this.clips))
    };
    
    // 현재 인덱스 이후의 히스토리 제거
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push(state);
    
    // 최대 크기 제한
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  // Undo
  undo() {
    if (this.historyIndex <= 0) {
      console.log('Undo: 더 이상 되돌릴 수 없습니다.');
      return;
    }
    
    this.historyIndex--;
    const state = this.history[this.historyIndex];
    this.restoreState(state);
    console.log('Undo 실행:', this.historyIndex);
  }

  // Redo
  redo() {
    if (this.historyIndex >= this.history.length - 1) {
      console.log('Redo: 더 이상 다시 실행할 수 없습니다.');
      return;
    }
    
    this.historyIndex++;
    const state = this.history[this.historyIndex];
    this.restoreState(state);
    console.log('Redo 실행:', this.historyIndex);
  }

  // 상태 복원
  restoreState(state) {
    this.tracks = JSON.parse(JSON.stringify(state.tracks));
    this.clips = JSON.parse(JSON.stringify(state.clips));
    this.selectedClips.clear();
    this.renderTracks();
    this.renderAllClips();
  }

  initDefaultTracks() {
    // 기본 트랙 생성
    this.addTrack('비디오 1', 'video');
    this.addTrack('오디오 1', 'audio');
    
    // 초기 상태 저장
    this.saveState();
  }

  addTrack(name, type = 'video') {
    const track = {
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `트랙 ${this.tracks.length + 1}`,
      type: type,
      height: this.trackHeight,
      muted: false,
      locked: false,
      visible: true
    };
    
    this.tracks.push(track);
    this.renderTracks();
    return track;
  }

  removeTrack(trackId) {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;
    
    // 트랙의 클립들도 제거
    this.clips = this.clips.filter(c => c.trackId !== trackId);
    this.tracks.splice(index, 1);
    this.renderTracks();
    this.renderAllClips();
  }

  renderTracks() {
    // 트랙 헤더 렌더링
    const existingHeaders = this.trackHeadersEl.querySelectorAll('.track-header');
    existingHeaders.forEach(h => h.remove());
    
    this.tracks.forEach((track, index) => {
      const headerEl = document.createElement('div');
      headerEl.className = 'track-header';
      headerEl.dataset.trackId = track.id;
      headerEl.style.height = `${track.height}px`;
      headerEl.innerHTML = `
        <div class="track-info">
          <span class="track-name">${track.name}</span>
          <span class="track-type">${track.type === 'video' ? '🎬' : '🔊'}</span>
        </div>
        <div class="track-controls">
          <button class="track-btn mute-btn ${track.muted ? 'active' : ''}" title="음소거">M</button>
          <button class="track-btn lock-btn ${track.locked ? 'active' : ''}" title="잠금">🔒</button>
        </div>
      `;
      
      // 트랙 컨트롤 이벤트
      headerEl.querySelector('.mute-btn').addEventListener('click', () => {
        track.muted = !track.muted;
        this.renderTracks();
      });
      
      headerEl.querySelector('.lock-btn').addEventListener('click', () => {
        track.locked = !track.locked;
        this.renderTracks();
      });
      
      this.trackHeadersEl.appendChild(headerEl);
    });

    // 트랙 영역 렌더링
    const existingTracks = this.tracksContainerEl.querySelectorAll('.track');
    existingTracks.forEach(t => t.remove());
    
    this.tracks.forEach((track, index) => {
      const trackEl = document.createElement('div');
      trackEl.className = `track ${track.type}-track`;
      trackEl.dataset.trackId = track.id;
      trackEl.style.height = `${track.height}px`;
      trackEl.style.top = `${this.getTrackTop(index)}px`;
      
      // 트랙에 드롭 이벤트
      trackEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        trackEl.classList.add('drag-over');
        this.showDropIndicator(e, track);
      });
      
      trackEl.addEventListener('dragleave', () => {
        trackEl.classList.remove('drag-over');
        this.hideDropIndicator();
      });
      
      trackEl.addEventListener('drop', (e) => {
        e.preventDefault();
        trackEl.classList.remove('drag-over');
        this.hideDropIndicator();
        this.handleDrop(e, track);
      });
      
      this.tracksContainerEl.appendChild(trackEl);
    });

    this.updateTimelineHeight();
  }

  getTrackTop(index) {
    let top = 0;
    for (let i = 0; i < index; i++) {
      top += this.tracks[i].height;
    }
    return top;
  }

  getTrackAtY(y) {
    let top = 0;
    for (const track of this.tracks) {
      if (y >= top && y < top + track.height) {
        return track;
      }
      top += track.height;
    }
    return null;
  }

  updateTimelineHeight() {
    const totalHeight = this.tracks.reduce((sum, t) => sum + t.height, 0);
    this.tracksContainerEl.style.height = `${Math.max(totalHeight, 200)}px`;
  }

  renderRuler() {
    const width = this.duration * this.pixelsPerSecond * this.zoom;
    this.rulerEl.style.width = `${width}px`;
    
    let html = '';
    const interval = this.calculateRulerInterval();
    
    for (let time = 0; time <= this.duration; time += interval) {
      const x = time * this.pixelsPerSecond * this.zoom;
      const isMajor = time % (interval * 5) === 0;
      
      html += `
        <div class="ruler-mark ${isMajor ? 'major' : 'minor'}" style="left: ${x}px">
          ${isMajor ? `<span class="ruler-time">${this.formatTime(time)}</span>` : ''}
        </div>
      `;
    }
    
    this.rulerEl.innerHTML = html;
  }

  calculateRulerInterval() {
    const pixelsPerInterval = 50;
    const secondsPerInterval = pixelsPerInterval / (this.pixelsPerSecond * this.zoom);
    
    const intervals = [0.1, 0.5, 1, 2, 5, 10, 15, 30, 60];
    for (const interval of intervals) {
      if (secondsPerInterval <= interval) {
        return interval;
      }
    }
    return 60;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatTimecode(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }

  setZoom(value, centerX = null) {
    const oldZoom = this.zoom;
    this.zoom = Math.max(0.1, Math.min(5, value));
    
    this.zoomSlider.value = this.zoom;
    this.zoomLevelEl.textContent = `${Math.round(this.zoom * 100)}%`;
    
    // 줌 중심점 계산
    if (this.zoomMode === 'playhead') {
      // 플레이헤드 중심 줌
      const playheadX = this.playheadPosition * this.pixelsPerSecond * oldZoom;
      const newPlayheadX = this.playheadPosition * this.pixelsPerSecond * this.zoom;
      const scrollDelta = newPlayheadX - playheadX;
      this.timelineContentEl.scrollLeft += scrollDelta;
    } else if (centerX !== null) {
      // 커서 중심 줌
      const rect = this.timelineContentEl.getBoundingClientRect();
      const relativeX = centerX - rect.left + this.timelineContentEl.scrollLeft;
      const time = relativeX / (this.pixelsPerSecond * oldZoom);
      const newX = time * this.pixelsPerSecond * this.zoom;
      this.timelineContentEl.scrollLeft = newX - (centerX - rect.left);
    }
    
    this.renderRuler();
    this.renderAllClips();
    this.updatePlayhead();
  }

  // 드롭 인디케이터 표시
  showDropIndicator(e, track) {
    let indicator = this.tracksContainerEl.querySelector('.drop-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'drop-indicator';
      this.tracksContainerEl.appendChild(indicator);
    }
    
    const rect = this.tracksContainerEl.getBoundingClientRect();
    const x = e.clientX - rect.left + this.timelineContentEl.scrollLeft;
    const time = this.snapToGrid(x / (this.pixelsPerSecond * this.zoom));
    const snappedX = time * this.pixelsPerSecond * this.zoom;
    
    // 드래그 중인 에셋 정보
    const dragData = e.dataTransfer.types.includes('application/json');
    let totalDuration = 5; // 기본값
    let assetCount = 1;
    
    if (window._dragAssets && window._dragAssets.length > 0) {
      assetCount = window._dragAssets.length;
      totalDuration = window._dragAssets.reduce((sum, asset) => sum + (asset.duration || 5), 0);
    }
    
    const indicatorWidth = totalDuration * this.pixelsPerSecond * this.zoom;
    const trackIndex = this.tracks.findIndex(t => t.id === track.id);
    const top = this.getTrackTop(trackIndex);
    
    indicator.style.left = `${snappedX}px`;
    indicator.style.top = `${top}px`;
    indicator.style.width = `${indicatorWidth}px`;
    indicator.style.height = `${track.height}px`;
    
    // 복수 에셋 표시
    if (assetCount > 1) {
      indicator.innerHTML = `<span class="drop-indicator-count">${assetCount}개 에셋 (${totalDuration.toFixed(1)}초)</span>`;
    } else {
      indicator.innerHTML = '';
    }
    
    indicator.style.display = 'block';
  }

  hideDropIndicator() {
    const indicator = this.tracksContainerEl.querySelector('.drop-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  handleDrop(e, track) {
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;
      
      const assets = JSON.parse(jsonData);
      const assetList = Array.isArray(assets) ? assets : [assets];
      
      const rect = this.tracksContainerEl.getBoundingClientRect();
      const x = e.clientX - rect.left + this.timelineContentEl.scrollLeft;
      let startTime = this.snapToGrid(x / (this.pixelsPerSecond * this.zoom));
      
      this.saveState();
      
      assetList.forEach(asset => {
        const duration = asset.duration || 5;
        this.addClip({
          trackId: track.id,
          assetId: asset.id,
          name: asset.name,
          type: asset.type,
          startTime: startTime,
          duration: duration,
          color: this.getClipColor(asset.type)
        });
        startTime += duration;
      });
      
      window._dragAssets = null;
    } catch (err) {
      console.error('Drop error:', err);
    }
  }

  getClipColor(type) {
    const colors = {
      video: '#4a9eff',
      audio: '#4aff9e',
      image: '#ff9e4a',
      text: '#9e4aff'
    };
    return colors[type] || '#888888';
  }

  addClip(clipData) {
    const clip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      trackId: clipData.trackId,
      assetId: clipData.assetId || null,
      name: clipData.name || '클립',
      type: clipData.type || 'video',
      startTime: clipData.startTime || 0,
      duration: clipData.duration || 5,
      color: clipData.color || '#4a9eff',
      volume: clipData.volume !== undefined ? clipData.volume : 1,
      opacity: clipData.opacity !== undefined ? clipData.opacity : 1
    };
    
    this.clips.push(clip);
    this.renderClip(clip);
    
    // app-root의 addClipWithBox 호출
    if (this.appState && typeof this.appState.addClipWithBox === 'function') {
      this.appState.addClipWithBox(clip);
    }
    
    return clip;
  }

  renderClip(clip) {
    const track = this.tracks.find(t => t.id === clip.trackId);
    if (!track) return;
    
    const trackIndex = this.tracks.findIndex(t => t.id === clip.trackId);
    const trackEl = this.tracksContainerEl.querySelector(`[data-track-id="${clip.trackId}"]`);
    if (!trackEl) return;
    
    // 기존 클립 요소 제거
    const existingClip = this.tracksContainerEl.querySelector(`[data-clip-id="${clip.id}"]`);
    if (existingClip) {
      existingClip.remove();
    }
    
    const clipEl = document.createElement('div');
    clipEl.className = `clip ${clip.type}-clip ${this.selectedClips.has(clip.id) ? 'selected' : ''}`;
    clipEl.dataset.clipId = clip.id;
    
    const left = clip.startTime * this.pixelsPerSecond * this.zoom;
    const width = clip.duration * this.pixelsPerSecond * this.zoom;
    const top = this.getTrackTop(trackIndex);
    
    clipEl.style.cssText = `
      left: ${left}px;
      width: ${width}px;
      top: ${top}px;
      height: ${track.height - 4}px;
      background-color: ${clip.color};
    `;
    
    // 클립 내용
    clipEl.innerHTML = `
      <div class="clip-content">
        <div class="clip-thumbnail">${this.getClipThumbnail(clip)}</div>
        <div class="clip-info">
          <span class="clip-name">${clip.name}</span>
          <span class="clip-duration">${clip.duration.toFixed(1)}s</span>
        </div>
        <div class="clip-waveform">${this.generateWaveform(clip)}</div>
      </div>
      <div class="clip-handle left"></div>
      <div class="clip-handle right"></div>
      ${clip.type === 'audio' ? `<div class="clip-volume-bar" style="width: ${clip.volume * 100}%"></div>` : ''}
    `;
    
    // 클립 이벤트
    this.setupClipEvents(clipEl, clip);
    
    this.tracksContainerEl.appendChild(clipEl);
  }

  getClipThumbnail(clip) {
    if (clip.type === 'video' || clip.type === 'image') {
      return `<div class="thumbnail-placeholder">${clip.type === 'video' ? '🎬' : '🖼'}</div>`;
    }
    return '';
  }

  generateWaveform(clip) {
    if (clip.type !== 'audio') return '';
    
    // 클립 ID 기반 시드로 일관된 파형 생성
    const seed = clip.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = (n) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };
    
    let bars = '';
    const barCount = Math.max(10, Math.floor(clip.duration * 4));
    for (let i = 0; i < barCount; i++) {
      const height = 20 + seededRandom(i) * 60;
      bars += `<div class="waveform-bar" style="height: ${height}%"></div>`;
    }
    return bars;
  }

  setupClipEvents(clipEl, clip) {
    // 클릭 - 선택
    clipEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      
      const track = this.tracks.find(t => t.id === clip.trackId);
      if (track && track.locked) return;
      
      e.stopPropagation();
      
      // 핸들 클릭 체크
      const handle = e.target.closest('.clip-handle');
      if (handle) {
        this.startResize(e, clip, handle.classList.contains('left') ? 'left' : 'right');
        return;
      }
      
      // 선택 로직
      if (e.ctrlKey) {
        // Ctrl+클릭: 토글 선택
        if (this.selectedClips.has(clip.id)) {
          this.selectedClips.delete(clip.id);
          clipEl.classList.remove('selected');
        } else {
          this.selectedClips.add(clip.id);
          clipEl.classList.add('selected');
        }
      } else if (!this.selectedClips.has(clip.id)) {
        // 일반 클릭: 단일 선택
        this.clearSelection();
        this.selectedClips.add(clip.id);
        clipEl.classList.add('selected');
      }
      
      // 드래그 시작
      this.startDrag(e, clip);
    });
    
    // 더블클릭 - 클립 편집
    clipEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.editClip(clip);
    });
  }

  startDrag(e, clip) {
    this.isDragging = true;
    this.dragType = 'move';
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragClipStartTime = clip.startTime;
    this.dragClipStartTrack = clip.trackId;
    
    // 다중 선택된 경우 모든 클립의 초기 상태 저장
    this.multiDragData = [];
    this.selectedClips.forEach(clipId => {
      const c = this.clips.find(cl => cl.id === clipId);
      if (c) {
        this.multiDragData.push({
          id: c.id,
          startTime: c.startTime,
          trackId: c.trackId
        });
      }
    });
    
    document.body.style.cursor = 'grabbing';
  }

  startResize(e, clip, direction) {
    this.saveState();
    
    this.isDragging = true;
    this.dragType = direction === 'left' ? 'resize-left' : 'resize-right';
    this.dragStartX = e.clientX;
    this.dragClipStartTime = clip.startTime;
    this.dragClipStartDuration = clip.duration;
    this.resizingClip = clip;
    
    document.body.style.cursor = 'ew-resize';
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.dragStartX;
    const deltaTime = deltaX / (this.pixelsPerSecond * this.zoom);
    
    if (this.dragType === 'move') {
      this.handleClipMove(e, deltaTime);
    } else if (this.dragType === 'resize-left' || this.dragType === 'resize-right') {
      this.handleClipResize(deltaTime);
    }
  }

  handleClipMove(e, deltaTime) {
    const rect = this.tracksContainerEl.getBoundingClientRect();
    const y = e.clientY - rect.top + this.timelineContentEl.scrollTop;
    const newTrack = this.getTrackAtY(y);
    
    this.multiDragData.forEach(dragData => {
      const clip = this.clips.find(c => c.id === dragData.id);
      if (!clip) return;
      
      // 시간 이동
      let newTime = dragData.startTime + deltaTime;
      newTime = Math.max(0, newTime);
      
      if (this.snapEnabled) {
        newTime = this.snapToGrid(newTime);
      }
      
      clip.startTime = newTime;
      
      // 트랙 이동 (드래그 시작한 클립만)
      if (newTrack && dragData.id === this.multiDragData[0].id) {
        const trackDelta = this.tracks.findIndex(t => t.id === newTrack.id) - 
                          this.tracks.findIndex(t => t.id === dragData.trackId);
        
        this.multiDragData.forEach(dd => {
          const c = this.clips.find(cl => cl.id === dd.id);
          if (!c) return;
          
          const originalTrackIndex = this.tracks.findIndex(t => t.id === dd.trackId);
          const newTrackIndex = Math.max(0, Math.min(this.tracks.length - 1, originalTrackIndex + trackDelta));
          c.trackId = this.tracks[newTrackIndex].id;
        });
      }
      
      this.renderClip(clip);
    });
  }

  handleClipResize(deltaTime) {
    const clip = this.resizingClip;
    if (!clip) return;
    
    if (this.dragType === 'resize-left') {
      const newStartTime = Math.max(0, this.dragClipStartTime + deltaTime);
      const maxStartTime = this.dragClipStartTime + this.dragClipStartDuration - 0.5;
      clip.startTime = Math.min(newStartTime, maxStartTime);
      clip.duration = this.dragClipStartDuration - (clip.startTime - this.dragClipStartTime);
    } else {
      const newDuration = Math.max(0.5, this.dragClipStartDuration + deltaTime);
      clip.duration = newDuration;
    }
    
    if (this.snapEnabled) {
      if (this.dragType === 'resize-left') {
        clip.startTime = this.snapToGrid(clip.startTime);
        clip.duration = this.dragClipStartTime + this.dragClipStartDuration - clip.startTime;
      } else {
        const endTime = this.snapToGrid(clip.startTime + clip.duration);
        clip.duration = endTime - clip.startTime;
      }
    }
    
    this.renderClip(clip);
  }

  handleMouseUp(e) {
    if (!this.isDragging) return;
    
    if (this.dragType === 'move' && this.multiDragData.length > 0) {
      // 실제로 이동이 있었는지 확인
      const moved = this.multiDragData.some(dragData => {
        const clip = this.clips.find(c => c.id === dragData.id);
        return clip && (clip.startTime !== dragData.startTime || clip.trackId !== dragData.trackId);
      });
      
      if (moved) {
        this.saveState();
      }
    }
    
    this.isDragging = false;
    this.dragType = null;
    this.resizingClip = null;
    this.multiDragData = [];
    document.body.style.cursor = '';
  }

  snapToGrid(time) {
    if (!this.snapEnabled) return time;
    
    const snapPoints = [0];
    
    // 다른 클립의 시작/끝 지점
    this.clips.forEach(clip => {
      if (!this.selectedClips.has(clip.id)) {
        snapPoints.push(clip.startTime);
        snapPoints.push(clip.startTime + clip.duration);
      }
    });
    
    // 플레이헤드 위치
    snapPoints.push(this.playheadPosition);
    
    // 가장 가까운 스냅 포인트 찾기
    const threshold = this.snapThreshold / (this.pixelsPerSecond * this.zoom);
    let closestPoint = time;
    let minDistance = threshold;
    
    snapPoints.forEach(point => {
      const distance = Math.abs(time - point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    return closestPoint;
  }

  clearSelection() {
    this.selectedClips.forEach(clipId => {
      const clipEl = this.tracksContainerEl.querySelector(`[data-clip-id="${clipId}"]`);
      if (clipEl) {
        clipEl.classList.remove('selected');
      }
    });
    this.selectedClips.clear();
  }

  selectAllClips() {
    this.clips.forEach(clip => {
      this.selectedClips.add(clip.id);
      const clipEl = this.tracksContainerEl.querySelector(`[data-clip-id="${clip.id}"]`);
      if (clipEl) {
        clipEl.classList.add('selected');
      }
    });
  }

  deleteSelectedClips() {
    this.selectedClips.forEach(clipId => {
      const index = this.clips.findIndex(c => c.id === clipId);
      if (index !== -1) {
        this.clips.splice(index, 1);
      }
      
      const clipEl = this.tracksContainerEl.querySelector(`[data-clip-id="${clipId}"]`);
      if (clipEl) {
        clipEl.remove();
      }
      
      // app-root의 박스도 제거
      if (this.appState && this.appState.boxes) {
        const boxIndex = this.appState.boxes.findIndex(b => b.clipId === clipId);
        if (boxIndex !== -1) {
          this.appState.boxes.splice(boxIndex, 1);
          if (this.appState.renderAllBoxes) {
            this.appState.renderAllBoxes();
          }
        }
      }
    });
    
    this.selectedClips.clear();
  }

  renderAllClips() {
    // 기존 클립 요소 모두 제거
    const existingClips = this.tracksContainerEl.querySelectorAll('.clip');
    existingClips.forEach(c => c.remove());
    
    // 모든 클립 다시 렌더링
    this.clips.forEach(clip => {
      this.renderClip(clip);
    });
  }

  editClip(clip) {
    console.log('Edit clip:', clip);
    // 클립 편집 모달 열기 등의 동작
  }

  // 재생 컨트롤
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    this.playIcon.textContent = '⏸';
    this.lastFrameTime = performance.now();
    this.animate();
  }

  pause() {
    this.isPlaying = false;
    this.playIcon.textContent = '▶';
  }

  stop() {
    this.pause();
    this.setPlayheadPosition(0);
  }

  animate() {
    if (!this.isPlaying) return;
    
    const now = performance.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    
    this.playheadPosition += delta;
    
    if (this.playheadPosition >= this.duration) {
      this.playheadPosition = 0;
    }
    
    this.updatePlayhead();
    this.updateTimecode();
    
    requestAnimationFrame(() => this.animate());
  }

  setPlayheadPosition(time) {
    this.playheadPosition = Math.max(0, Math.min(time, this.duration));
    this.updatePlayhead();
    this.updateTimecode();
    
    // 비디오 동기화
    if (this.appState && typeof this.appState.syncVideoPlayback === 'function') {
      this.appState.syncVideoPlayback(this.playheadPosition, this.isPlaying);
    }
  }

  updatePlayhead() {
    const x = this.playheadPosition * this.pixelsPerSecond * this.zoom;
    this.playheadEl.style.left = `${x}px`;
  }

  updateTimecode() {
    this.timecodeEl.textContent = this.formatTimecode(this.playheadPosition);
  }

  // 컨텍스트 메뉴
  showContextMenu(e) {
    this.hideContextMenu();
    
    const clipEl = e.target.closest('.clip');
    const trackEl = e.target.closest('.track');
    
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'timeline-context-menu';
    
    let menuItems = [];
    
    if (clipEl) {
      const clipId = clipEl.dataset.clipId;
      const clip = this.clips.find(c => c.id === clipId);
      
      if (clip && !this.selectedClips.has(clipId)) {
        this.clearSelection();
        this.selectedClips.add(clipId);
        clipEl.classList.add('selected');
      }
      
      menuItems = [
        { label: '클립 편집', action: () => this.editClip(clip) },
        { label: '클립 복제', action: () => this.duplicateSelectedClips() },
        { type: 'separator' },
        { label: '클립 삭제', action: () => { this.saveState(); this.deleteSelectedClips(); } }
      ];
      
      // 볼륨 조절 (오디오 클립)
      if (clip && clip.type === 'audio') {
        menuItems.splice(1, 0, {
          label: `볼륨: ${Math.round(clip.volume * 100)}%`,
          action: () => this.showVolumeSlider(clip)
        });
      }
    } else if (trackEl) {
      const trackId = trackEl.dataset.trackId;
      const track = this.tracks.find(t => t.id === trackId);
      
      menuItems = [
        { label: '트랙 이름 변경', action: () => this.renameTrack(track) },
        { label: '트랙 삭제', action: () => { this.saveState(); this.removeTrack(trackId); } },
        { type: 'separator' },
        { label: '위에 트랙 추가', action: () => this.insertTrackBefore(trackId) },
        { label: '아래에 트랙 추가', action: () => this.insertTrackAfter(trackId) },
        { type: 'separator' },
        { label: '전체 트랙 높이 통일', action: () => this.unifyTrackHeights() }
      ];
    } else {
      menuItems = [
        { label: '비디오 트랙 추가', action: () => this.addTrack(null, 'video') },
        { label: '오디오 트랙 추가', action: () => this.addTrack(null, 'audio') }
      ];
    }
    
    this.contextMenu.innerHTML = menuItems.map(item => {
      if (item.type === 'separator') {
        return '<div class="context-menu-separator"></div>';
      }
      return `<div class="context-menu-item">${item.label}</div>`;
    }).join('');
    
    // 이벤트 연결
    const itemEls = this.contextMenu.querySelectorAll('.context-menu-item');
    let itemIndex = 0;
    menuItems.forEach((item, i) => {
      if (item.type !== 'separator') {
        itemEls[itemIndex].addEventListener('click', () => {
          item.action();
          this.hideContextMenu();
        });
        itemIndex++;
      }
    });
    
    document.body.appendChild(this.contextMenu);
    
    // 위치 조정
    const menuRect = this.contextMenu.getBoundingClientRect();
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuRect.width > window.innerWidth) {
      x = window.innerWidth - menuRect.width - 5;
    }
    if (y + menuRect.height > window.innerHeight) {
      y = window.innerHeight - menuRect.height - 5;
    }
    
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
  }

  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
  }

  duplicateSelectedClips() {
    this.saveState();
    
    const newClips = [];
    this.selectedClips.forEach(clipId => {
      const clip = this.clips.find(c => c.id === clipId);
      if (clip) {
        const newClip = this.addClip({
          ...clip,
          startTime: clip.startTime + clip.duration + 0.5
        });
        newClips.push(newClip);
      }
    });
    
    // 새 클립 선택
    this.clearSelection();
    newClips.forEach(clip => {
      this.selectedClips.add(clip.id);
      const clipEl = this.tracksContainerEl.querySelector(`[data-clip-id="${clip.id}"]`);
      if (clipEl) {
        clipEl.classList.add('selected');
      }
    });
  }

  renameTrack(track) {
    const newName = prompt('트랙 이름:', track.name);
    if (newName && newName.trim()) {
      this.saveState();
      track.name = newName.trim();
      this.renderTracks();
    }
  }

  insertTrackBefore(trackId) {
    this.saveState();
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;
    
    const track = {
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `트랙 ${this.tracks.length + 1}`,
      type: 'video',
      height: this.trackHeight,
      muted: false,
      locked: false,
      visible: true
    };
    
    this.tracks.splice(index, 0, track);
    this.renderTracks();
    this.renderAllClips();
  }

  insertTrackAfter(trackId) {
    this.saveState();
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;
    
    const track = {
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `트랙 ${this.tracks.length + 1}`,
      type: 'video',
      height: this.trackHeight,
      muted: false,
      locked: false,
      visible: true
    };
    
    this.tracks.splice(index + 1, 0, track);
    this.renderTracks();
    this.renderAllClips();
  }

  unifyTrackHeights() {
    if (this.tracks.length === 0) return;
    
    this.saveState();
    
    // 현재 트랙들의 평균 높이 또는 기본 높이 사용
    const targetHeight = this.trackHeight;
    
    this.tracks.forEach(track => {
      track.height = targetHeight;
    });
    
    this.renderTracks();
    this.renderAllClips();
  }

  showVolumeSlider(clip) {
    const value = prompt(`볼륨 (0-100):`, Math.round(clip.volume * 100));
    if (value !== null) {
      const volume = Math.max(0, Math.min(100, parseInt(value) || 0)) / 100;
      this.saveState();
      clip.volume = volume;
      this.renderClip(clip);
    }
  }

  // 외부 API
  getState() {
    return {
      tracks: this.tracks,
      clips: this.clips,
      playheadPosition: this.playheadPosition,
      zoom: this.zoom
    };
  }

  setState(state) {
    if (state.tracks) this.tracks = state.tracks;
    if (state.clips) this.clips = state.clips;
    if (state.playheadPosition !== undefined) this.playheadPosition = state.playheadPosition;
    if (state.zoom !== undefined) this.zoom = state.zoom;
    
    this.renderTracks();
    this.renderAllClips();
    this.updatePlayhead();
    this.updateTimecode();
  }

  // 클립 조회
  getClipById(clipId) {
    return this.clips.find(c => c.id === clipId);
  }

  getClipsInTrack(trackId) {
    return this.clips.filter(c => c.trackId === trackId);
  }

  getClipsAtTime(time) {
    return this.clips.filter(c => time >= c.startTime && time < c.startTime + c.duration);
  }
}
