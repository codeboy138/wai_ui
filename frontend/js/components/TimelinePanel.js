/**
 * ==========================================
 * TimelinePanel.js
 * 
 * 역할: 타임라인 패널 (트랙, 클립, 재생 제어)
 * 경로: frontend/js/components/TimelinePanel.js
 * ==========================================
 */

const TimelinePanel = {
  name: 'TimelinePanel',
  
  data() {
    return {
      // 재생 상태 (playing, paused, stopped)
      playState: 'stopped',
      // 현재 재생 시간 (초)
      currentTime: 0,
      // 전체 지속 시간 (초)
      duration: 60,
      // 타임라인 줌 레벨 (픽셀/초)
      pixelsPerSecond: 10,
      // 현재 선택된 클립 ID
      selectedClipId: null
    };
  },
  
  computed: {
    /**
     * 레이어 기반 타임라인 트랙 목록 생성
     * @returns {Array} 트랙 배열 (각 레이어당 1개 트랙)
     */
    tracks() {
      const layers = this.$root.store.layers || [];
      return layers.map(layer => ({
        id: 'track-' + layer.id,
        layerId: layer.id,
        name: layer.name,
        type: layer.type,
        clips: layer.clips || []
      }));
    },
    
    /**
     * Playhead 위치 (픽셀)
     * @returns {Number} Playhead의 left 위치
     */
    playheadPosition() {
      return this.currentTime * this.pixelsPerSecond;
    },
    
    /**
     * 타임라인 전체 너비 (픽셀)
     * @returns {Number} 타임라인 너비
     */
    timelineWidth() {
      return this.duration * this.pixelsPerSecond;
    }
  },
  
  methods: {
    /**
     * 재생 시작
     */
    play() {
      this.playState = 'playing';
      console.log('[TimelinePanel] Play');
      
      // TODO: 재생 로직 구현 (requestAnimationFrame)
    },
    
    /**
     * 재생 일시정지
     */
    pause() {
      this.playState = 'paused';
      console.log('[TimelinePanel] Pause');
    },
    
    /**
     * 재생 정지 (처음으로)
     */
    stop() {
      this.playState = 'stopped';
      this.currentTime = 0;
      console.log('[TimelinePanel] Stop');
    },
    
    /**
     * Playhead 이동
     * @param {Number} time - 이동할 시간 (초)
     */
    seekTo(time) {
      this.currentTime = Math.max(0, Math.min(this.duration, time));
      console.log('[TimelinePanel] Seek To:', this.currentTime);
    },
    
    /**
     * 타임라인 클릭 시 Playhead 이동
     * @param {Event} event - 마우스 이벤트
     */
    handleTimelineClick(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickTime = clickX / this.pixelsPerSecond;
      this.seekTo(clickTime);
    },
    
    /**
     * 클립 선택 핸들러
     * @param {String} clipId - 선택할 클립 ID
     */
    selectClip(clipId) {
      this.selectedClipId = clipId;
      console.log('[TimelinePanel] Clip Selected:', clipId);
    },
    
    /**
     * 클립 드래그 시작 핸들러
     * @param {Event} event - 마우스 이벤트
     * @param {String} clipId - 드래그 중인 클립 ID
     */
    startClipDrag(event, clipId) {
      console.log('[TimelinePanel] Clip Drag Start:', clipId);
      // TODO: Interact.js 드래그 로직 구현
    },
    
    /**
     * 타임라인 줌 인/아웃
     * @param {Number} delta - 줌 변화량 (+1 또는 -1)
     */
    zoom(delta) {
      this.pixelsPerSecond = Math.max(5, Math.min(50, this.pixelsPerSecond + delta));
      console.log('[TimelinePanel] Zoom Level:', this.pixelsPerSecond);
    },
    
    /**
     * 시간을 MM:SS 형식으로 포맷
     * @param {Number} seconds - 초 단위 시간
     * @returns {String} MM:SS 형식 문자열
     */
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  },
  
  template: `
    <div 
      id="timeline-container"
      class="c-timeline"
      data-dev='{
        "role": "타임라인 패널",
        "id": "timeline-container",
        "func": "레이어별 트랙과 클립을 시간축으로 배치하고 재생 제어 제공",
        "goal": "사용자가 클립을 시간축에 배치하고 편집하며, 재생 시간을 제어",
        "state": {
          "playState": "재생 상태 (playing|paused|stopped)",
          "currentTime": "현재 재생 시간 (초)",
          "duration": "전체 지속 시간 (초)",
          "pixelsPerSecond": "타임라인 줌 레벨 (픽셀/초)",
          "tracks": "타임라인 트랙 배열",
          "selectedClipId": "선택된 클립 ID"
        },
        "path": "frontend/js/components/TimelinePanel.js",
        "py": "",
        "js": "play(), pause(), stop(), seekTo(time), selectClip(id), zoom(delta)"
      }'
    >
      <!-- 타임라인 툴바 (재생 제어) -->
      <div 
        id="timeline-toolbar"
        class="c-timeline__toolbar"
        data-dev='{
          "role": "타임라인 툴바 (재생 제어)",
          "id": "timeline-toolbar",
          "func": "재생, 일시정지, 정지 버튼 및 현재 시간 표시",
          "goal": "사용자가 타임라인 재생을 제어",
          "state": {
            "playState": playState,
            "currentTime": currentTime
          },
          "path": "frontend/js/components/TimelinePanel.js → toolbar",
          "py": "",
          "js": "play(), pause(), stop()"
        }'
      >
        <button 
          id="btn-play"
          class="c-timeline__btn c-timeline__btn--play"
          data-js-play
          @click="play"
          :disabled="playState === 'playing'"
          title="Play"
          :data-dev='{
            "role": "재생 버튼",
            "id": "btn-play",
            "func": "타임라인 재생 시작",
            "goal": "사용자가 프로젝트를 재생",
            "state": { "disabled": playState === "playing" },
            "path": "frontend/js/components/TimelinePanel.js → play button",
            "py": "",
            "js": "play()"
          }'
        >
          ▶
        </button>

        <button 
          id="btn-pause"
          class="c-timeline__btn c-timeline__btn--pause"
          data-js-pause
          @click="pause"
          :disabled="playState !== 'playing'"
          title="Pause"
          :data-dev='{
            "role": "일시정지 버튼",
            "id": "btn-pause",
            "func": "타임라인 재생 일시정지",
            "goal": "사용자가 재생 중인 프로젝트를 일시정지",
            "state": { "disabled": playState !== "playing" },
            "path": "frontend/js/components/TimelinePanel.js → pause button",
            "py": "",
            "js": "pause()"
          }'
        >
          ⏸
        </button>

        <button 
          id="btn-stop"
          class="c-timeline__btn c-timeline__btn--stop"
          data-js-stop
          @click="stop"
          title="Stop"
          :data-dev='{
            "role": "정지 버튼",
            "id": "btn-stop",
            "func": "타임라인 재생 정지 및 처음으로 이동",
            "goal": "사용자가 재생을 멈추고 처음으로 돌아감",
            "state": {},
            "path": "frontend/js/components/TimelinePanel.js → stop button",
            "py": "",
            "js": "stop()"
          }'
        >
          ⏹
        </button>

        <span 
          id="timeline-time-display"
          class="c-timeline__time-display"
          :data-dev='{
            "role": "현재 재생 시간 표시",
            "id": "timeline-time-display",
            "func": "현재 시간 / 전체 시간을 MM:SS 형식으로 표시",
            "goal": "사용자가 현재 재생 위치를 확인",
            "state": {
              "currentTime": currentTime,
              "duration": duration
            },
            "path": "frontend/js/components/TimelinePanel.js → time display",
            "py": "",
            "js": "formatTime(seconds)"
          }'
        >
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </span>

        <!-- 줌 컨트롤 -->
        <div 
          id="timeline-zoom-controls"
          class="c-timeline__zoom-controls"
          :data-dev='{
            "role": "타임라인 줌 컨트롤",
            "id": "timeline-zoom-controls",
            "func": "타임라인 확대/축소 버튼",
            "goal": "사용자가 타임라인 시간축을 확대/축소",
            "state": { "pixelsPerSecond": pixelsPerSecond },
            "path": "frontend/js/components/TimelinePanel.js → zoom controls",
            "py": "",
            "js": "zoom(delta)"
          }'
        >
          <button 
            id="btn-zoom-in-timeline"
            class="c-timeline__zoom-btn"
            @click="zoom(5)"
            title="Zoom In"
          >
            +
          </button>
          <button 
            id="btn-zoom-out-timeline"
            class="c-timeline__zoom-btn"
            @click="zoom(-5)"
            title="Zoom Out"
          >
            -
          </button>
        </div>
      </div>

      <!-- 타임라인 메인 영역 (트랙 + 클립) -->
      <div 
        id="timeline-main"
        class="c-timeline__main"
        @click="handleTimelineClick"
        data-dev='{
          "role": "타임라인 메인 영역",
          "id": "timeline-main",
          "func": "트랙과 클립을 시간축으로 배치하는 스크롤 가능한 영역",
          "goal": "사용자가 클립을 시간축에서 편집하고 Playhead를 이동",
          "state": {
            "tracks": tracks,
            "timelineWidth": timelineWidth
          },
          "path": "frontend/js/components/TimelinePanel.js → main area",
          "py": "",
          "js": "handleTimelineClick(event), selectClip(id)"
        }'
      >
        <!-- Playhead (재생 위치 표시) -->
        <div 
          id="timeline-playhead"
          class="c-playhead"
          :style="{ left: playheadPosition + 'px' }"
          data-js-playhead
          :data-dev='{
            "role": "Playhead (재생 위치 인디케이터)",
            "id": "timeline-playhead",
            "func": "현재 재생 시간을 시각적으로 표시하는 수직선",
            "goal": "사용자가 현재 재생 위치를 시각적으로 확인",
            "state": {
              "currentTime": currentTime,
              "position": playheadPosition
            },
            "path": "frontend/js/components/TimelinePanel.js → playhead",
            "py": "",
            "js": ""
          }'
        ></div>

        <!-- 트랙 리스트 -->
        <div 
          id="timeline-tracks"
          class="c-timeline__tracks"
          :style="{ width: timelineWidth + 'px' }"
          data-dev='{
            "role": "타임라인 트랙 리스트",
            "id": "timeline-tracks",
            "func": "레이어별 트랙을 수직으로 배치",
            "goal": "사용자가 각 레이어의 클립을 시간축에서 관리",
            "state": {
              "tracks": tracks,
              "width": timelineWidth
            },
            "path": "frontend/js/components/TimelinePanel.js → tracks list",
            "py": "",
            "js": ""
          }'
        >
          <div
            v-for="track in tracks"
            :key="track.id"
            :id="track.id"
            class="c-timeline__track"
            :data-js-track="track.id"
            :data-dev='{
              "role": "타임라인 트랙 (레이어별)",
              "id": track.id,
              "func": "특정 레이어의 클립들을 배치하는 수평 트랙",
              "goal": "사용자가 레이어별로 클립을 시간축에 배치",
              "state": {
                "track": track,
                "clips": track.clips
              },
              "path": "frontend/js/components/TimelinePanel.js → track",
              "py": "",
              "js": "selectClip(clipId)"
            }'
          >
            <!-- 트랙 헤더 (레이어명) -->
            <div 
              :id="track.id + '-header'"
              class="c-timeline__track-header"
              :data-dev='{
                "role": "트랙 헤더 (레이어명)",
                "id": track.id + "-header",
                "func": "트랙의 레이어명 표시",
                "goal": "사용자가 트랙이 어느 레이어인지 확인",
                "state": { "name": track.name },
                "path": "frontend/js/components/TimelinePanel.js → track header",
                "py": "",
                "js": ""
              }'
            >
              {{ track.name }}
            </div>

            <!-- 클립 리스트 -->
            <div 
              :id="track.id + '-clips'"
              class="c-timeline__track-clips"
              :data-dev='{
                "role": "트랙 클립 컨테이너",
                "id": track.id + "-clips",
                "func": "트랙 내 클립들을 시간축에 배치",
                "goal": "사용자가 클립을 드래그하여 위치/길이 조정",
                "state": { "clips": track.clips },
                "path": "frontend/js/components/TimelinePanel.js → track clips",
                "py": "",
                "js": "selectClip(clip.id), startClipDrag(event, clip.id)"
              }'
            >
              <div
                v-for="clip in track.clips"
                :key="clip.id"
                :id="'timeline-clip-' + clip.id"
                :class="[
                  'c-timeline__clip',
                  { 'c-timeline__clip--selected': selectedClipId === clip.id }
                ]"
                :style="{
                  left: (clip.startTime * pixelsPerSecond) + 'px',
                  width: (clip.duration * pixelsPerSecond) + 'px'
                }"
                :data-js-clip="clip.id"
                @click.stop="selectClip(clip.id)"
                @mousedown="startClipDrag($event, clip.id)"
                :data-dev='{
                  "role": "타임라인 클립",
                  "id": "timeline-clip-" + clip.id,
                  "func": "미디어 클립을 시간축에 시각화 (드래그, 리사이즈 가능)",
                  "goal": "사용자가 클립을 편집하여 시작/종료 시간 조정",
                  "state": {
                    "clip": clip,
                    "startTime": clip.startTime,
                    "duration": clip.duration,
                    "selected": selectedClipId === clip.id
                  },
                  "path": "frontend/js/components/TimelinePanel.js → clip",
                  "py": "",
                  "js": "selectClip(clip.id), startClipDrag(event, clip.id)"
                }'
              >
                <span class="c-timeline__clip-name">{{ clip.name }}</span>
              </div>
            </div>
          </div>

          <!-- 트랙 없을 때 -->
          <div 
            v-if="tracks.length === 0"
            id="timeline-empty"
            class="c-timeline__empty"
            data-dev='{
              "role": "타임라인 빈 상태",
              "id": "timeline-empty",
              "func": "트랙이 없을 때 안내 메시지 표시",
              "goal": "사용자에게 레이어 추가 필요성을 알림",
              "state": { "visible": tracks.length === 0 },
              "path": "frontend/js/components/TimelinePanel.js → empty state",
              "py": "",
              "js": ""
            }'
          >
            No tracks available. Add layers from the right panel.
          </div>
        </div>
      </div>
    </div>
  `
};

// CommonJS 모듈로 내보내기
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimelinePanel;
}
