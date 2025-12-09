/**
 * ==========================================
 * Panels.js - Header, LeftPanel, RightPanel 컴포넌트
 * 
 * 역할: 패널 컴포넌트 모음
 * 경로: frontend/js/components/Panels.js
 * ==========================================
 */

import { Dropdown } from './Common.js';

// Header 컴포넌트
const Header = {
  name: 'Header',
  
  components: { Dropdown },
  
  methods: {
    handleNew() {
      this.$store.showProjectModal = true;
      console.log('New Project');
    },
    
    handleOpen() {
      console.log('Open Project');
    },
    
    handleSave() {
      console.log('Save Project:', this.$store.projectName);
    },
    
    handleExport() {
      console.log('Export Video');
    }
  },
  
  template: `
    <header class="c-header">
      <div class="c-header__logo">
        <h1 class="c-header__title">WAI Studio</h1>
        <span class="c-header__project-name">{{ $store.projectName }}</span>
      </div>
      
      <div class="c-header__actions">
        <button class="c-header__btn" @click="handleNew">
          <i class="fas fa-plus"></i>
          <span>New</span>
        </button>
        
        <button class="c-header__btn" @click="handleOpen">
          <i class="fas fa-folder-open"></i>
          <span>Open</span>
        </button>
        
        <button class="c-header__btn" @click="handleSave">
          <i class="fas fa-save"></i>
          <span>Save</span>
        </button>
        
        <button class="c-header__btn c-header__btn--primary" @click="handleExport">
          <i class="fas fa-download"></i>
          <span>Export</span>
        </button>
      </div>
    </header>
  `
};

// LeftPanel 컴포넌트
const LeftPanel = {
  name: 'LeftPanel',
  
  data() {
    return {
      tabs: ['Images', 'Videos', 'Audios', 'Texts']
    };
  },
  
  computed: {
    currentTab() {
      return this.$store.currentAssetTab;
    },
    
    currentAssets() {
      return this.$store.assets[this.currentTab.toLowerCase()] || [];
    }
  },
  
  methods: {
    setTab(tab) {
      this.$store.currentAssetTab = tab.toLowerCase();
    },
    
    handleAdd() {
      console.log('Add Asset');
    },
    
    handleImport() {
      console.log('Import Asset');
    }
  },
  
  template: `
    <aside class="c-left-panel">
      <div class="c-left-panel__header">
        <button 
          v-for="tab in tabs"
          :key="tab"
          class="c-left-panel__tab"
          :class="{ 'c-left-panel__tab--active': currentTab === tab.toLowerCase() }"
          @click="setTab(tab)"
        >
          {{ tab }}
        </button>
      </div>
      
      <div class="c-left-panel__assets">
        <div v-if="currentAssets.length === 0" class="c-left-panel__empty">
          <i class="fas fa-folder-open text-4xl mb-2"></i>
          <p>No {{ currentTab }} yet</p>
        </div>
      </div>
      
      <div class="c-left-panel__actions">
        <button class="c-left-panel__btn" @click="handleAdd">
          <i class="fas fa-plus mr-1"></i> Add
        </button>
        <button class="c-left-panel__btn" @click="handleImport">
          <i class="fas fa-file-import mr-1"></i> Import
        </button>
      </div>
    </aside>
  `
};

// RightPanel 컴포넌트
const RightPanel = {
  name: 'RightPanel',
  
  computed: {
    layerMatrix() {
      const matrix = [];
      for (let row = 0; row < 4; row++) {
        const rowData = [];
        for (let col = 0; col < 4; col++) {
          const layer = this.$store.layers.find(
            l => l.row === row && l.col === col
          );
          rowData.push(layer || null);
        }
        matrix.push(rowData);
      }
      return matrix;
    }
  },
  
  methods: {
    handleCellClick(row, col) {
      const layer = this.layerMatrix[row][col];
      if (layer) {
        this.$store.selectLayer(layer.id);
      } else {
        this.$store.addLayer(row, col);
      }
    },
    
    getAutoLayerNumber(row, col) {
      return `L${row * 4 + col + 1}`;
    }
  },
  
  template: `
    <aside class="c-right-panel">
      <div class="c-right-panel__header">
        <h3 class="c-right-panel__title">Layer Matrix</h3>
      </div>
      
      <div class="c-layer-matrix">
        <div 
          v-for="(rowData, rowIndex) in layerMatrix"
          :key="'row-' + rowIndex"
          class="c-layer-matrix__row"
        >
          <div 
            v-for="(layer, colIndex) in rowData"
            :key="'cell-' + rowIndex + '-' + colIndex"
            class="c-layer-cell"
            :class="{
              'c-layer-cell--active': layer && layer.id === $store.selectedLayerId,
              'c-layer-cell--empty': !layer
            }"
            @click="handleCellClick(rowIndex, colIndex)"
          >
            <span v-if="layer">{{ layer.name }}</span>
            <span v-else>{{ getAutoLayerNumber(rowIndex, colIndex) }}</span>
          </div>
        </div>
      </div>
    </aside>
  `
};

export default {
  Header,
  LeftPanel,
  RightPanel
};
