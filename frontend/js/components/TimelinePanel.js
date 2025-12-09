/**
 * ==========================================
 * TimelinePanel.js
 * 
 * 역할: 비디오/오디오 타임라인 관리 패널
 * 경로: frontend/js/components/TimelinePanel.js
 * ==========================================
 */

export default {
  name: 'TimelinePanel',
  
  data() {
    return {
      isPlaying: false,
      currentTime: 0,
      duration: 60 // 기본 60초
    };
  },
  
  computed: {
    /**
     * 비디오/오디오 레이어 목록
     * @returns {Array} 타임라인에 표시할 레이어 배열
     */
    timelineLayers() {
      return this.$store.layers.filter(
        layer => layer.type === 'video' || layer.type === 'audio'
      );
    },
    
    /**
     * 현재 시간 포맷 (00:00)
     * @returns {String} MM:SS 형식
     */
    formattedCurrentTime() {
      return this.formatTime(this.currentTime);
    },
    
    /**
     * 총 길이 포맷 (00:00)
     * @returns {String} MM:SS 형식
     */
    formattedDuration() {
      return this.formatTime(this.duration);
    }
  },
  
  methods: {
    /**
     * 재생/일시정지 토글
     */
    togglePlay() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.startPlayback();
      } else {
        this.pausePlayback();
      }
    },
    
    /**
     * 재생 시작
     */
    startPlayback() {
      // TODO: 실제 비디오 재생 로직 구현
      console.log('재생 시작');
    },
    
    /**
     * 일시정지
     */
    pausePlayback() {
      // TODO: 실제 비디오 일시정지 로직 구현
      console.log('일시정지');
    },
    
    /**
     * 시간 포맷 변환 (초 → MM:SS)
     * @param {Number} seconds - 초 단위 시간
     * @returns {String} MM:SS 형식 문자열
     */
    formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    },
    
    /**
     * 타임라인 클릭 (시간 이동)
     * @param {Event} event - 클릭 이벤트
     */
    handleTimelineClick(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percent = clickX / rect.width;
      this.currentTime = percent * this.duration;
    },
    
    /**
     * 클립 드래그 시작
     * @param {Object} layer - 드래그할 레이어 객체
     */
    startDragClip(layer) {
      console.log('클립 드래그 시작:', layer.name);
      // TODO: Interact.js를 사용한 드래그 구현
    }
  },
  
  template: `
    <div 
      id="timeline-container"
      class="c-timeline-panel"
      :data-dev='{
        "role": "타임라인 패널",
        "id": "timeline-container",
        "func": "비디오/오디오 레이어의 타임라인을 시각화하고 재생 제어",
        "goal": "사용자가 비디오 타이밍을 조정하고 재생 상태를 확인",
        "state": {
          "isPlaying": isPlaying,
          "currentTime": currentTime,
          "duration": duration,
          "timelineLayers": "비디오/오디오 레이어 배열"
        },
        "path": "frontend/js/components/TimelinePanel.js",
        "py": "",
        "js": "togglePlay(), handleTimelineClick(event), startDragClip(layer)"
      }'
    >
      <!-- 타임라인 컨트롤 -->
      <div 
        id="timeline-controls"
        class="c-timeline-controls"
        :data-dev='{
          "role": "타임라인 재생 컨트롤",
          "id": "timeline-controls",
          "func": "재생/일시정지 버튼 및 시간 표시",
          "goal": "사용자가 비디오 재생을 제어하고 현재 시간 확인",
          "state": {
            "isPlaying": isPlaying,
            "currentTime": formattedCurrentTime,
            "duration": formattedDuration
          },
          "path": "frontend/js/components/TimelinePanel.js → controls",
          "py": "",
          "js": "togglePlay()"
        }'
      >
        <!-- 재생/일시정지 버튼 -->
        <button
          id="btn-play"
          class="c-timeline-controls__btn"
          :data-js-play="isPlaying ? 'pause' : 'play'"
          @click="togglePlay"
          :title="isPlaying ? 'Pause' : 'Play'"
          :data-dev='{
            "role": "재생/일시정지 버튼",
            "id": "btn-play",
            "func": "클릭 시 타임라인 재생/일시정지 토글",
            "goal": "사용자가 비디오 재생 상태를 제어",
            "state": {
              "isPlaying": isPlaying
            },
            "path": "frontend/js/components/TimelinePanel.js → controls → play button",
            "py": "",
            "js": "togglePlay()"
          }'
        >
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>
        
        <!-- 현재 시간 / 총 길이 표시 -->
        <div 
          id="timeline-time-display"
          class="c-timeline-controls__time"
          :data-dev='{
            "role": "시간 표시",
            "id": "timeline-time-display",
            "func": "현재 재생 시간 / 총 길이 표시 (MM:SS / MM:SS)",
            "goal": "사용자가 비디오 진행 상황을 시각적으로 확인",
            "state": {
              "currentTime": formattedCurrentTime,
              "duration": formattedDuration
            },
            "path": "frontend/js/components/TimelinePanel.js → controls → time display",
            "py": "",
            "js": "formatTime(seconds)"
          }'
        >
          <span class="c-timeline-controls__current">{{ formattedCurrentTime }}</span>
          <span class="c-timeline-controls__separator">/</span>
          <span class="c-timeline-controls__duration">{{ formattedDuration }}</span>
        </div>
      </div>
      
      <!-- 타임라인 트랙 영역 -->
      <div 
        id="timeline-tracks"
        class="c-timeline-tracks"
        @click="handleTimelineClick"
        :data-dev='{
          "role": "타임라인 트랙 영역",
          "id": "timeline-tracks",
          "func": "비디오/오디오 레이어들을 타임라인 트랙으로 시각화, 클릭 시 시간 이동",
          "goal": "사용자가 레이어별 타이밍을 확인하고 조정",
          "state": {
            "timelineLayers": timelineLayers.length + "개 레이어",
            "currentTime": currentTime,
            "duration": duration
          },
          "path": "frontend/js/components/TimelinePanel.js → tracks",
          "py": "",
          "js": "handleTimelineClick(event)"
        }'
      >
        <!-- 시간 눈금자 -->
        <div 
          id="timeline-ruler"
          class="c-timeline-ruler"
          :data-dev='{
            "role": "타임라인 눈금자",
            "id": "timeline-ruler",
            "func": "시간 눈금 표시 (0초, 10초, 20초...)",
            "goal": "사용자가 타임라인 상의 시간 위치를 직관적으로 파악",
            "state": {
              "duration": duration
            },
            "path": "frontend/js/components/TimelinePanel.js → tracks → ruler",
            "py": "",
            "js": ""
          }'
        >
          <div 
            v-for="tick in Math.ceil(duration / 10)"
            :key="tick"
            :id="'timeline-tick-' + tick"
            class="c-timeline-ruler__tick"
            :style="{ left: (tick * 10 / duration * 100) + '%' }"
            :data-dev='{
              "role": "타임라인 눈금 마크",
              "id": "timeline-tick-" + tick,
              "func": "특정 시간(초)에 눈금선 표시",
              "goal": "사용자가 정확한 시간 위치를 확인",
              "state": {
                "tick": tick,
                "time": tick * 10 + "s"
              },
              "path": "frontend/js/components/TimelinePanel.js → tracks → ruler → tick",
              "py": "",
              "js": ""
            }'
          >
            {{ tick * 10 }}s
          </div>
        </div>
        
        <!-- 현재 시간 인디케이터 -->
        <div 
          id="timeline-playhead"
          class="c-timeline-playhead"
          :style="{ left: (currentTime / duration * 100) + '%' }"
          :data-dev='{
            "role": "타임라인 재생 헤드",
            "id": "timeline-playhead",
            "func": "현재 재생 시간 위치를 수직선으로 표시",
            "goal": "사용자가 현재 재생 중인 시간을 시각적으로 확인",
            "state": {
              "currentTime": currentTime,
              "position": (currentTime / duration * 100) + "%"
            },
            "path": "frontend/js/components/TimelinePanel.js → tracks → playhead",
            "py": "",
            "js": ""
          }'
        ></div>
        
        <!-- 레이어별 타임라인 트랙 -->
        <div 
          v-for="layer in timelineLayers"
          :key="layer.id"
          :id="'timeline-track-' + layer.id"
          class="c-timeline-track"
          :data-dev='{
            "role": "레이어 타임라인 트랙",
            "id": "timeline-track-" + layer.id,
            "func": "특정 레이어의 타임라인 클립 표시 영역",
            "goal": "사용자가 레이어별 타이밍을 개별적으로 관리",
            "state": {
              "layerId": layer.id,
              "layerName": layer.name,
              "layerType": layer.type
            },
            "path": "frontend/js/components/TimelinePanel.js → tracks → track",
            "py": "",
            "js": ""
          }'
        >
          <!-- 레이어 이름 표시 -->
          <div 
            :id="'timeline-track-label-' + layer.id"
            class="c-timeline-track__label"
            :data-dev='{
              "role": "트랙 레이블",
              "id": "timeline-track-label-" + layer.id,
              "func": "레이어 이름 및 타입 표시",
              "goal": "사용자가 어떤 레이어의 트랙인지 확인",
              "state": {
                "layerName": layer.name,
                "layerType": layer.type
              },
              "path": "frontend/js/components/TimelinePanel.js → tracks → track → label",
              "py": "",
              "js": ""
            }'
          >
            <i :class="layer.type === 'video' ? 'fas fa-video' : 'fas fa-volume-up'"></i>
            {{ layer.name }}
          </div>
          
          <!-- 타임라인 클립 -->
          <div 
            :id="'timeline-clip-' + layer.id"
            class="c-timeline-clip"
            :data-js-clip="layer.id"
            @mousedown="startDragClip(layer)"
            :title="'Drag to adjust timing'"
            :data-dev='{
              "role": "타임라인 클립",
              "id": "timeline-clip-" + layer.id,
              "func": "레이어의 타임라인 상 위치 표시, 드래그로 타이밍 조정 가능",
              "goal": "사용자가 레이어의 시작/종료 시간을 조정",
              "state": {
                "layerId": layer.id,
                "startTime": "layer.startTime || 0",
                "endTime": "layer.endTime || duration"
              },
              "path": "frontend/js/components/TimelinePanel.js → tracks → track → clip",
              "py": "",
              "js": "startDragClip(layer)"
            }'
          >
            <!-- 클립 내용 미리보기 (썸네일 등) -->
            <div class="c-timeline-clip__preview">
              <span>{{ layer.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 빈 타임라인 메시지 -->
        <div 
          v-if="timelineLayers.length === 0"
          id="timeline-empty-message"
          class="c-timeline-empty"
          :data-dev='{
            "role": "빈 타임라인 메시지",
            "id": "timeline-empty-message",
            "func": "타임라인에 레이어가 없을 때 안내 메시지 표시",
            "goal": "사용자가 비디오/오디오 레이어를 추가하도록 유도",
            "state": {
              "timelineLayersCount": 0
            },
            "path": "frontend/js/components/TimelinePanel.js → tracks → empty message",
            "py": "",
            "js": ""
          }'
        >
          <i class="fas fa-film"></i>
          <p>No video or audio layers</p>
          <p class="text-zinc-500 text-xs">Add video/audio from the left panel</p>
        </div>
      </div>
    </div>
  `
};
