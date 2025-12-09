/**
 * [DATA-DEV: TimelinePanel]
 * - 역할: 타임라인 UI + 클립 관리
 * - 고유ID: timeline-panel
 * - 기능: 클립 드래그/리사이즈, 트랙 관리, 플레이헤드
 * - 로직: Interact.js → updateClipPosition/Duration → clips 업데이트
 * - 데이터: tracks[], clips[], playhead
 * - 경로: frontend/js/components/TimelinePanel.js
 * - 명령: firePython('update_clip', {id, start, duration})
 */

export default {
  name: 'TimelinePanel',
  template: '<section id="timeline-panel-container" ' +
            'class="c-timeline-panel" ' +
            ':style="{ height: $root.timelinePanelHeight + \'px\' }" ' +
            'data-action="js:timelineInteraction" ' +
            'title="타임라인 패널">' +
            
            '<!-- 타임라인 헤더 -->' +
            '<div id="timeline-panel-header" ' +
            'class="c-timeline-panel__header" ' +
            'data-action="js:timelineHeader" ' +
            'title="타임라인 헤더">' +
            '<button id="timeline-panel-zoom-in-btn" ' +
            'class="c-timeline-panel__zoom-btn" ' +
            'data-action="js:zoomIn" ' +
            'title="확대" ' +
            '@click="zoomIn">' +
            '<i class="fas fa-search-plus"></i>' +
            '</button>' +
            '<button id="timeline-panel-zoom-out-btn" ' +
            'class="c-timeline-panel__zoom-btn" ' +
            'data-action="js:zoomOut" ' +
            'title="축소" ' +
            '@click="zoomOut">' +
            '<i class="fas fa-search-minus"></i>' +
            '</button>' +
            '<span id="timeline-panel-current-time" ' +
            'class="c-timeline-panel__current-time" ' +
            'data-action="js:displayCurrentTime" ' +
            'title="현재 재생 시간">' +
            '{{ formatTime($root.playhead) }}' +
            '</span>' +
            '</div>' +
            
            '<!-- 타임라인 캔버스 -->' +
            '<div id="timeline-panel-canvas" ' +
            'class="c-timeline-panel__canvas" ' +
            'data-action="js:timelineCanvas" ' +
            'title="타임라인 캔버스" ' +
            '@drop="handleDrop" ' +
            '@dragover.prevent>' +
            
            '<!-- 트랙 목록 -->' +
            '<div v-for="track in $root.tracks" ' +
            ':key="track.id" ' +
            ':id="\'timeline-track-\' + track.id" ' +
            'class="c-timeline-panel__track" ' +
            'data-action="js:track" ' +
            ':title="\'트랙 \' + track.name">' +
            
            '<!-- 클립 목록 -->' +
            '<div v-for="clip in getTrackClips(track.id)" ' +
            ':key="clip.id" ' +
            ':id="\'timeline-clip-\' + clip.id" ' +
            'class="c-timeline-panel__clip" ' +
            ':class="{ \'c-timeline-panel__clip--selected\': clip.id === $root.selectedClipId }" ' +
            ':style="{ ' +
            'left: (clip.start * $root.timelineZoom) + \'px\', ' +
            'width: (clip.duration * $root.timelineZoom) + \'px\' ' +
            '}" ' +
            'data-action="js:selectClip" ' +
            ':title="\'클립 \' + clip.name" ' +
            '@click="selectClip(clip.id)">' +
            '<span class="c-timeline-panel__clip-name">{{ clip.name }}</span>' +
            '</div>' +
            '</div>' +
            
            '<!-- 플레이헤드 -->' +
            '<div id="timeline-panel-playhead" ' +
            'class="c-timeline-panel__playhead" ' +
            ':style="{ left: ($root.playhead * $root.timelineZoom) + \'px\' }" ' +
            'data-action="js:playhead" ' +
            'title="플레이헤드">' +
            '</div>' +
            '</div>' +
            
            '</section>',
  
  mounted() {
    this.setupClipInteraction();
    this.setupPlayheadDrag();
  },
  
  methods: {
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const frames = Math.floor((seconds % 1) * 30);
      return mins.toString().padStart(2, '0') + ':' + 
             secs.toString().padStart(2, '0') + ':' + 
             frames.toString().padStart(2, '0');
    },
    
    getTrackClips(trackId) {
      return this.$root.clips.filter(c => c.trackId === trackId);
    },
    
    selectClip(clipId) {
      this.$root.selectedClipId = clipId;
      console.log('[TimelinePanel] 클립 선택:', clipId);
    },
    
    zoomIn() {
      this.$root.timelineZoom = Math.min(this.$root.timelineZoom + 10, 100);
      console.log('[TimelinePanel] 타임라인 확대:', this.$root.timelineZoom);
    },
    
    zoomOut() {
      this.$root.timelineZoom = Math.max(this.$root.timelineZoom - 10, 10);
      console.log('[TimelinePanel] 타임라인 축소:', this.$root.timelineZoom);
    },
    
    handleDrop(e) {
      const assetId = e.dataTransfer.getData('text/plain');
      const trackElement = e.target.closest('.c-timeline-panel__track');
      if (!trackElement) return;
      
      const trackId = parseInt(trackElement.id.replace('timeline-track-', ''));
      const rect = trackElement.getBoundingClientRect();
      const startTime = (e.clientX - rect.left) / this.$root.timelineZoom;
      
      console.log('[TimelinePanel] 에셋 드롭:', assetId, '트랙:', trackId, '시작:', startTime);
      // this.$root.addClipFromAsset(assetId, trackId, startTime);
    },
    
    setupClipInteraction() {
      if (typeof interact === 'undefined') {
        console.warn('[TimelinePanel] Interact.js 미로드');
        return;
      }
      
      interact('.c-timeline-panel__clip')
        .draggable({
          listeners: {
            move: (event) => {
              const clipId = parseInt(event.target.id.replace('timeline-clip-', ''));
              const clip = this.$root.clips.find(c => c.id === clipId);
              if (clip) {
                clip.start += event.dx / this.$root.timelineZoom;
                console.log('[TimelinePanel] 클립 ' + clipId + ' 드래그:', clip.start);
              }
            }
          }
        })
        .resizable({
          edges: { left: true, right: true },
          listeners: {
            move: (event) => {
              const clipId = parseInt(event.target.id.replace('timeline-clip-', ''));
              const clip = this.$root.clips.find(c => c.id === clipId);
              if (clip) {
                clip.duration = event.rect.width / this.$root.timelineZoom;
                clip.start += event.deltaRect.left / this.$root.timelineZoom;
                console.log('[TimelinePanel] 클립 ' + clipId + ' 리사이즈:', clip.duration);
              }
            }
          }
        });
    },
    
    setupPlayheadDrag() {
      if (typeof interact === 'undefined') return;
      
      interact('#timeline-panel-playhead')
        .draggable({
          axis: 'x',
          listeners: {
            move: (event) => {
              this.$root.playhead += event.dx / this.$root.timelineZoom;
              this.$root.playhead = Math.max(0, this.$root.playhead);
              console.log('[TimelinePanel] 플레이헤드 이동:', this.$root.playhead);
            }
          }
        });
    }
  }
};
