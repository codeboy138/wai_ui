/**
 * ==========================================
 * Canvas.js - 프리뷰 캔버스 컴포넌트
 * 
 * 역할: 프리뷰 캔버스 UI 및 박스 관리
 * 경로: frontend/js/components/Canvas.js
 * ==========================================
 */

import { Dropdown } from './Common.js';
import { parseRatio, parseResolution } from '../utils.js';

export default {
  name: 'Canvas',
  
  components: { Dropdown },
  
  data() {
    return {
      ratioOptions: ['16:9', '9:16', '1:1', '4:3'],
      qualityOptions: ['FHD', 'HD', '4K'],
      resolutionMap: {
        'FHD': '1920 × 1080',
        'HD': '1280 × 720',
        '4K': '3840 × 2160'
      }
    };
  },
  
  computed: {
    canvasBoxes() {
      return this.$store.canvasBoxes;
    },
    
    canvasStyle() {
      const ratio = parseRatio(this.$store.selectedRatio);
      const resolution = parseResolution(this.$store.selectedResolution);
      
      return {
        width: '80%',
        aspectRatio: ratio,
        maxWidth: '1000px',
        maxHeight: '80vh'
      };
    }
  },
  
  methods: {
    handleRatioChange(ratio) {
      this.$store.selectedRatio = ratio;
    },
    
    handleQualityChange(quality) {
      this.$store.selectedQuality = quality;
      this.$store.selectedResolution = this.resolutionMap[quality];
    },
    
    handleAddBox() {
      this.$store.addCanvasBox(100, 100, 200, 200, 'New Box');
    },
    
    getBoxStyle(box) {
      return {
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        transform: `rotate(${box.rotation}deg)`,
        opacity: box.opacity
      };
    },
    
    selectBox(boxId) {
      this.$store.selectCanvasBox(boxId);
    }
  },
  
  template: `
    <section class="flex-1 flex flex-col bg-bg-dark">
      <!-- Preview Toolbar -->
      <div class="flex items-center gap-6 px-6 py-3 bg-bg-panel border-b border-ui-border">
        <Dropdown 
          label="Ratio"
          :value="$store.selectedRatio"
          :items="ratioOptions"
          @change="handleRatioChange"
        />
        
        <Dropdown 
          label="Quality"
          :value="$store.selectedQuality"
          :items="qualityOptions"
          @change="handleQualityChange"
        />
        
        <div class="flex items-center gap-2">
          <span class="text-text-sub text-xs">Resolution:</span>
          <span class="text-text-main text-xs font-medium">{{ $store.selectedResolution }}</span>
        </div>
        
        <button class="tool-btn ml-auto" @click="handleAddBox">
          <i class="fas fa-plus"></i>
        </button>
      </div>
      
      <!-- Preview Canvas -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div 
          class="canvas-scaler relative"
          :style="canvasStyle"
        >
          <!-- Canvas Boxes -->
          <div 
            v-for="box in canvasBoxes"
            :key="box.id"
            class="canvas-box"
            :class="{ 'selected': box.id === $store.selectedBoxId }"
            :style="getBoxStyle(box)"
            @click="selectBox(box.id)"
          >
            <span class="canvas-label">{{ box.name }}</span>
            
            <!-- Resize Handles (only for selected box) -->
            <template v-if="box.id === $store.selectedBoxId">
              <div class="box-handle bh-tl"></div>
              <div class="box-handle bh-tr"></div>
              <div class="box-handle bh-bl"></div>
              <div class="box-handle bh-br"></div>
            </template>
          </div>
          
          <!-- Empty Message -->
          <div 
            v-if="canvasBoxes.length === 0"
            class="absolute inset-0 flex items-center justify-center text-text-sub"
          >
            <div class="text-center">
              <i class="fas fa-square text-4xl mb-2"></i>
              <p>No layers on canvas</p>
              <p class="text-xs mt-1">Click + to add a box</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
};
