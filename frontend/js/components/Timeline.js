/**
 * ==========================================
 * Timeline.js - 타임라인 컴포넌트
 * 
 * 역할: 타임라인 UI 및 클립 관리
 * 경로: frontend/js/components/Timeline.js
 * ==========================================
 */

import { formatTime } from '../utils.js';

export default {
  name: 'Timeline',
  
  data() {
    return {
      pixelsPerSecond: 50
    };
  },
  
  computed: {
    tracks() {
      return this.$store.tracks;
    },
    
    clips() {
      return this.$store.clips;
    },
    
    formattedCurrentTime() {
      return formatTime(this.$store.playheadTime);
    },
    
    formattedDuration() {
      return formatTime(this.$store.duration);
    },
    
    playheadPosition() {
      return (this.$store.playheadTime / this.$store.duration) * 100;
    }
  },
  
  methods: {
    togglePlay() {
      this.$store.isPlaying = !this.$store.isPlaying;
    },
    
    getClipsForTrack(trackId) {
      return this.clips.filter(c => c.trackId === trackId);
    },
    
    getClipStyle(clip) {
      const left = clip.startTime * this.pixelsPerSecond;
      const width = clip.duration * this.pixelsPerSecond;
      return {
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: clip.color
      };
    },
    
    handleAddClip() {
      const trackId = this.tracks[1].id; // bgp 트랙
      this.$store.addClip(trackId, 0, 5, 'New Clip', '#3b82f6');
    }
  },
  
  template: `
    <footer class="h-48 bg-bg-panel border-t border-ui-border flex flex-col">
      <!-- Timeline Controls -->
      <div class="flex items-center gap-4 px-6 py-3 border-b border-ui-border">
        <button 
          class="tool-btn"
          :class="{ 'active': $store.isPlaying }"
          @click="togglePlay"
        >
          <i :class="$store.isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>
        
        <div class="text-text-sub text-xs">
          <span>{{ formattedCurrentTime }}</span>
          <span class="mx-1">/</span>
          <span>{{ formattedDuration }}</span>
        </div>
        
        <button class="tool-btn" @click="handleAddClip">
          <i class="fas fa-plus"></i>
        </button>
      </div>
      
      <!-- Timeline Tracks -->
      <div class="flex-1 relative overflow-auto bg-bg-dark">
        <!-- Playhead -->
        <div 
          class="playhead-line"
          :style="{ left: playheadPosition + '%' }"
        >
          <div class="playhead-handle"></div>
        </div>
        
        <!-- Tracks -->
        <div 
          v-for="track in tracks"
          :key="track.id"
          class="flex border-b border-ui-border"
          :style="{ height: track.height + 'px' }"
        >
          <!-- Track Label -->
          <div class="w-32 bg-bg-panel border-r border-ui-border flex items-center px-3 text-xs text-text-main">
            <i 
              :class="track.type === 'audio' ? 'fas fa-volume-up' : 'fas fa-video'"
              class="mr-2 text-text-sub"
            ></i>
            {{ track.name }}
          </div>
          
          <!-- Track Content -->
          <div class="flex-1 relative">
            <div 
              v-for="clip in getClipsForTrack(track.id)"
              :key="clip.id"
              class="clip"
              :style="getClipStyle(clip)"
            >
              <span class="clip-label">{{ clip.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- Empty Message -->
        <div 
          v-if="clips.length === 0"
          class="absolute inset-0 flex items-center justify-center text-text-sub"
        >
          <div class="text-center">
            <i class="fas fa-film text-4xl mb-2"></i>
            <p>No clips yet</p>
            <p class="text-xs mt-1">Click + to add a clip</p>
          </div>
        </div>
      </div>
    </footer>
  `
};
