/* ═══════════════════════════════════════════════════════════════════════════
   WAI-UI ClipBox Manager v6
   파일: js/components/ClipBoxManager.js
   
   v6 변경사항:
   - 레이어 관리 패널 텍스트 크기 완전 통일 (12px 기준)
   - 화면비율 레이블 표시 및 선택 후 비율 표시
   - 보이스 생성 + 전역설정 한 줄 표시
   - 기존 기능 완전 복구
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   블록 1: 전역 네임스페이스 및 상수
   ───────────────────────────────────────────────────────────────────────────── */
window.WAICB = window.WAICB || {};

WAICB.CONST = {
    STORAGE_KEY: 'waicb_v6_data',
    AUTOSAVE_DELAY: 2000,
    TOAST_DURATION: 3000,
    
    ASPECT_RATIOS: {
        '9:16': { w: 1080, h: 1920, label: '9:16' },
        '16:9': { w: 1920, h: 1080, label: '16:9' },
        '1:1': { w: 1080, h: 1080, label: '1:1' },
        '4:5': { w: 1080, h: 1350, label: '4:5' }
    },
    
    SLOT_ROLES: ['full', 'high', 'mid', 'low'],
    SLOT_TYPES: ['bg', 'text', 'effect'],
    
    SLOT_ROLE_LABELS: {
        'full': '전체',
        'high': '상단',
        'mid': '중단',
        'low': '하단'
    },
    
    SLOT_TYPE_LABELS: {
        'bg': '배경',
        'text': '텍스트',
        'effect': '이펙트'
    },
    
    VOICE_ENGINES: [
        { id: 'azure', label: 'Azure TTS' },
        { id: 'google', label: 'Google TTS' },
        { id: 'eleven', label: 'ElevenLabs' }
    ],
    
    IMAGE_ENGINES: [
        { id: 'dalle', label: 'DALL-E 3' },
        { id: 'midjourney', label: 'Midjourney' },
        { id: 'stable', label: 'Stable Diffusion' }
    ],
    
    VOICE_PRESETS: [
        { id: 'ko-KR-InJoonNeural', label: '한국어 남성 (InJoon)', engine: 'azure' },
        { id: 'ko-KR-SunHiNeural', label: '한국어 여성 (SunHi)', engine: 'azure' },
        { id: 'ko-KR-Wavenet-A', label: '한국어 남성 A', engine: 'google' },
        { id: 'ko-KR-Wavenet-B', label: '한국어 여성 B', engine: 'google' }
    ],
    
    IMAGE_STYLES: [
        { id: 'ghibli', label: '지브리 스타일' },
        { id: 'realistic', label: '실사풍' },
        { id: 'anime', label: '애니메이션' },
        { id: 'watercolor', label: '수채화' },
        { id: 'cinematic', label: '시네마틱' }
    ],
    
    COLOR_PALETTE: {
        rainbow: [
            '#ff0000', '#ff4400', '#ff8800', '#ffcc00', '#ffff00', '#ccff00',
            '#88ff00', '#44ff00', '#00ff00', '#00ff44', '#00ff88', '#00ffcc',
            '#00ffff', '#00ccff', '#0088ff', '#0044ff', '#0000ff', '#4400ff',
            '#8800ff', '#cc00ff', '#ff00ff', '#ff00cc', '#ff0088', '#ff0044'
        ],
        frequent: [
            '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
            '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#ffffff',
            '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#000000',
            '#7f1d1d', '#9a3412', '#854d0e', '#713f12', '#365314', '#115e59'
        ],
        basic: [
            '#000000', '#3b82f6', '#1e3a5f', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff'
        ]
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 2: 유틸리티 및 토스트
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Utils = {
    uuid: function() {
        return 'clip_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    },
    
    tokenId: function() {
        return 't_' + Math.random().toString(36).substr(2, 8);
    },
    
    clone: function(obj) {
        if (!obj) return obj;
        return JSON.parse(JSON.stringify(obj));
    },
    
    debounce: function(fn, delay) {
        var timer = null;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function() {
                fn.apply(context, args);
            }, delay);
        };
    },
    
    deepMerge: function(target, source) {
        if (!source) return WAICB.Utils.clone(target);
        if (!target) return WAICB.Utils.clone(source);
        
        var result = WAICB.Utils.clone(target);
        
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = WAICB.Utils.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
};

WAICB.Toast = {
    container: null,
    
    init: function() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.className = 'wai-cb-toast-container';
        this.container.id = 'clipbox-toast-container';
        document.body.appendChild(this.container);
    },
    
    show: function(message, type) {
        var self = this;
        type = type || 'info';
        this.init();
        
        var toast = document.createElement('div');
        toast.className = 'wai-cb-toast wai-cb-toast--' + type;
        toast.textContent = message;
        this.container.appendChild(toast);
        
        requestAnimationFrame(function() {
            toast.classList.add('wai-cb-toast--visible');
        });
        
        setTimeout(function() {
            toast.classList.remove('wai-cb-toast--visible');
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, WAICB.CONST.TOAST_DURATION);
    },
    
    info: function(msg) { this.show(msg, 'info'); },
    success: function(msg) { this.show(msg, 'success'); },
    warning: function(msg) { this.show(msg, 'warning'); },
    error: function(msg) { this.show(msg, 'error'); }
};

WAICB.Events = {
    _listeners: {},
    
    on: function(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
    },
    
    off: function(event, callback) {
        if (!this._listeners[event]) return;
        var idx = this._listeners[event].indexOf(callback);
        if (idx > -1) {
            this._listeners[event].splice(idx, 1);
        }
    },
    
    emit: function(event, data) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(function(cb) {
            try {
                cb(data);
            } catch (e) {
                console.error('[WAICB.Events] Error:', e);
            }
        });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 3: Store (데이터 관리)
   ───────────────────────────────────────────────────────────────────────────── */

WAICB.createDefaultGlobalSettings = function() {
    return {
        project: {
            aspectRatio: '9:16'
        },
        
        selectedPrompt: null,
        
        textStyle: {
            fontFamily: 'Pretendard',
            fontSize: 48,
            fontWeight: 400,
            fontStyle: 'normal',
            fillColor: '#ffffff',
            fillOpacity: 1.0,
            strokeColor: '#000000',
            strokeWidth: 0,
            textAlign: 'center',
            vAlign: 'middle',
            letterSpacing: 0,
            lineHeight: 1.4,
            wordSpacing: 0,
            shadow: {
                enabled: true,
                offsetX: 2,
                offsetY: 2,
                blur: 4,
                color: '#000000',
                opacity: 0.8
            },
            background: {
                enabled: false,
                color: '#000000',
                opacity: 0.5,
                padding: 10,
                radius: 4
            }
        },
        
        mediaDefaults: {
            'full_bg': { src: null, type: 'none', fit: 'cover' },
            'high_bg': { src: null, type: 'none', fit: 'cover' },
            'mid_bg': { src: null, type: 'none', fit: 'cover' },
            'low_bg': { src: null, type: 'none', fit: 'cover' }
        },
        
        voice: {
            engine: 'azure',
            voiceId: 'ko-KR-InJoonNeural',
            speed: 1.0,
            pitch: 0,
            volume: 100,
            defaultDirecting: ''
        },
        
        image: {
            engine: 'dalle',
            style: 'ghibli',
            quality: 'hd',
            aspectRatio: '9:16',
            defaultPrefix: ''
        }
    };
};

WAICB.createDefaultClip = function(order) {
    return {
        id: WAICB.Utils.uuid(),
        order: order || 0,
        rawText: '',
        tokens: [],
        textStyleOverride: null,
        mediaOverride: null,
        voiceOverride: null,
        slotBindings: {},
        imagePrompt: '',
        imageStatus: 'idle',
        imageSrc: null,
        voiceDirecting: '',
        voiceStatus: 'idle',
        voiceSrc: null,
        isExpanded: false,
        useGlobalVoice: true,
        expandedSections: {
            image: false,
            voice: false,
            slots: false
        },
        duration: 5.0,
        startTime: 0
    };
};

WAICB.Store = (function() {
    var _globalSettings = null;
    var _clips = [];
    var _autoSaveTimer = null;
    
    function init() {
        load();
        if (!_globalSettings) {
            _globalSettings = WAICB.createDefaultGlobalSettings();
        }
    }
    
    function save() {
        var data = {
            version: 6,
            globalSettings: _globalSettings,
            clips: _clips,
            savedAt: Date.now()
        };
        
        try {
            localStorage.setItem(WAICB.CONST.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[WAICB.Store] Save failed:', e);
        }
    }
    
    function scheduleAutoSave() {
        clearTimeout(_autoSaveTimer);
        _autoSaveTimer = setTimeout(save, WAICB.CONST.AUTOSAVE_DELAY);
    }
    
    function load() {
        try {
            var raw = localStorage.getItem(WAICB.CONST.STORAGE_KEY);
            if (!raw) return false;
            
            var data = JSON.parse(raw);
            
            if (data.globalSettings) {
                _globalSettings = WAICB.Utils.deepMerge(
                    WAICB.createDefaultGlobalSettings(),
                    data.globalSettings
                );
            }
            
            if (Array.isArray(data.clips)) {
                _clips = data.clips;
            }
            
            return true;
        } catch (e) {
            console.error('[WAICB.Store] Load failed:', e);
            return false;
        }
    }
    
    function getGlobalSettings() {
        return WAICB.Utils.clone(_globalSettings);
    }
    
    function setGlobalSettings(updates) {
        _globalSettings = WAICB.Utils.deepMerge(_globalSettings, updates);
        scheduleAutoSave();
        WAICB.Events.emit('settings:changed', _globalSettings);
    }
    
    function setGlobalField(path, value) {
        var parts = path.split('.');
        var target = _globalSettings;
        
        for (var i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) target[parts[i]] = {};
            target = target[parts[i]];
        }
        
        target[parts[parts.length - 1]] = value;
        scheduleAutoSave();
    }
    
    function getClips() {
        return WAICB.Utils.clone(_clips);
    }
    
    function getClip(id) {
        for (var i = 0; i < _clips.length; i++) {
            if (_clips[i].id === id) {
                return WAICB.Utils.clone(_clips[i]);
            }
        }
        return null;
    }
    
    function addClip(initialData) {
        var clip = WAICB.Utils.deepMerge(
            WAICB.createDefaultClip(_clips.length),
            initialData || {}
        );
        clip.order = _clips.length;
        _clips.push(clip);
        scheduleAutoSave();
        WAICB.Events.emit('clip:added', clip);
        return WAICB.Utils.clone(clip);
    }
    
    function updateClip(id, updates) {
        for (var i = 0; i < _clips.length; i++) {
            if (_clips[i].id === id) {
                var safeUpdates = WAICB.Utils.clone(updates);
                delete safeUpdates.id;
                delete safeUpdates.order;
                
                _clips[i] = WAICB.Utils.deepMerge(_clips[i], safeUpdates);
                scheduleAutoSave();
                WAICB.Events.emit('clip:updated', { id: id, clip: _clips[i] });
                return true;
            }
        }
        return false;
    }
    
    function removeClip(id) {
        for (var i = 0; i < _clips.length; i++) {
            if (_clips[i].id === id) {
                _clips.splice(i, 1);
                
                for (var j = 0; j < _clips.length; j++) {
                    _clips[j].order = j;
                }
                
                scheduleAutoSave();
                WAICB.Events.emit('clip:removed', { id: id });
                return true;
            }
        }
        return false;
    }
    
    function moveClip(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= _clips.length) return false;
        if (toIndex < 0 || toIndex >= _clips.length) return false;
        if (fromIndex === toIndex) return false;
        
        var clip = _clips.splice(fromIndex, 1)[0];
        _clips.splice(toIndex, 0, clip);
        
        for (var i = 0; i < _clips.length; i++) {
            _clips[i].order = i;
        }
        
        scheduleAutoSave();
        return true;
    }
    
    function getClipCount() {
        return _clips.length;
    }
    
    function reset() {
        _globalSettings = WAICB.createDefaultGlobalSettings();
        _clips = [];
        localStorage.removeItem(WAICB.CONST.STORAGE_KEY);
    }
    
    function importFromText(text) {
        if (!text || !text.trim()) return 0;
        
        var lines = text.split(/\n\n+/);
        var count = 0;
        
        lines.forEach(function(block) {
            var trimmed = block.trim();
            if (trimmed) {
                addClip({ rawText: trimmed });
                count++;
            }
        });
        
        return count;
    }
    
    return {
        init: init,
        save: save,
        load: load,
        getGlobalSettings: getGlobalSettings,
        setGlobalSettings: setGlobalSettings,
        setGlobalField: setGlobalField,
        getClips: getClips,
        getClip: getClip,
        addClip: addClip,
        updateClip: updateClip,
        removeClip: removeClip,
        moveClip: moveClip,
        getClipCount: getClipCount,
        reset: reset,
        importFromText: importFromText
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   블록 4: 토큰화 시스템
   ───────────────────────────────────────────────────────────────────────────── */

WAICB.Tokenizer = (function() {
    
    var PARTICLE_PATTERNS = [
        /^(이|가|을|를|은|는|의|와|과|로|으로|에|에서|에게|한테|께|부터|까지|만|도|야|요|죠|네|군|데|지|걸|뿐)$/,
        /^(고|며|면|서|니|라|자|게|어|아|여|해|거|건|걸|군|네|죠|요)$/
    ];
    
    function isParticle(text) {
        if (!text || text.length > 3) return false;
        
        for (var i = 0; i < PARTICLE_PATTERNS.length; i++) {
            if (PARTICLE_PATTERNS[i].test(text)) {
                return true;
            }
        }
        return false;
    }
    
    function tokenize(text) {
        if (!text || !text.trim()) return [];
        
        var lines = text.split(/\n/);
        var result = [];
        
        for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            var line = lines[lineIdx];
            var trimmed = line.trim();
            
            if (!trimmed) {
                if (result.length > 0 && result[result.length - 1].type !== 'linebreak') {
                    result.push({
                        id: WAICB.Utils.tokenId(),
                        type: 'linebreak'
                    });
                }
                continue;
            }
            
            var rawTokens = trimmed.split(/\s+/).filter(function(t) { return t; });
            var merged = [];
            var i = 0;
            
            while (i < rawTokens.length) {
                var current = rawTokens[i];
                var next = rawTokens[i + 1];
                
                if (next && isParticle(next) && current.length >= 2) {
                    merged.push(current + next);
                    i += 2;
                } else {
                    merged.push(current);
                    i++;
                }
            }
            
            for (var j = 0; j < merged.length; j++) {
                result.push({
                    id: WAICB.Utils.tokenId(),
                    type: 'text',
                    text: merged[j]
                });
            }
            
            var hasMoreContent = false;
            for (var k = lineIdx + 1; k < lines.length; k++) {
                if (lines[k].trim()) {
                    hasMoreContent = true;
                    break;
                }
            }
            
            if (hasMoreContent) {
                result.push({
                    id: WAICB.Utils.tokenId(),
                    type: 'linebreak'
                });
            }
        }
        
        return result;
    }
    
    function tokensToText(tokens) {
        if (!tokens || !tokens.length) return '';
        
        var result = '';
        
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            
            if (token.type === 'linebreak') {
                result += '\n';
            } else if (token.type === 'text') {
                if (result && !result.endsWith('\n')) {
                    result += ' ';
                }
                result += token.text;
            }
        }
        
        return result.trim();
    }
    
    function getStats(tokens) {
        if (!tokens) return { textCount: 0, linebreakCount: 0, silenceCount: 0, totalSilence: 0 };
        
        var stats = {
            textCount: 0,
            linebreakCount: 0,
            silenceCount: 0,
            totalSilence: 0
        };
        
        tokens.forEach(function(token) {
            if (token.type === 'text') {
                stats.textCount++;
            } else if (token.type === 'linebreak') {
                stats.linebreakCount++;
            } else if (token.type === 'silence') {
                stats.silenceCount++;
                stats.totalSilence += (token.duration || 0);
            }
        });
        
        return stats;
    }
    
    return {
        tokenize: tokenize,
        tokensToText: tokensToText,
        getStats: getStats,
        isParticle: isParticle
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   블록 5: 병합 함수 (Resolver)
   ───────────────────────────────────────────────────────────────────────────── */

WAICB.Resolver = (function() {
    
    function resolveTextStyle(globalStyle, clipOverride, slotOverride) {
        var result = WAICB.Utils.clone(globalStyle || {});
        if (clipOverride) result = WAICB.Utils.deepMerge(result, clipOverride);
        if (slotOverride) result = WAICB.Utils.deepMerge(result, slotOverride);
        return result;
    }
    
    function resolveMedia(slotKey, globalDefaults, clipOverride) {
        var defaultMedia = { src: null, type: 'none', fit: 'cover' };
        var globalMedia = (globalDefaults && globalDefaults[slotKey]) 
            ? WAICB.Utils.clone(globalDefaults[slotKey]) 
            : defaultMedia;
        if (clipOverride && clipOverride[slotKey]) {
            return WAICB.Utils.deepMerge(globalMedia, clipOverride[slotKey]);
        }
        return globalMedia;
    }
    
    function resolveVoice(globalVoice, clipOverride) {
        var result = WAICB.Utils.clone(globalVoice || {});
        if (clipOverride) result = WAICB.Utils.deepMerge(result, clipOverride);
        return result;
    }
    
    function parseSlotKey(slotKey) {
        if (!slotKey) return null;
        var parts = slotKey.split('_');
        if (parts.length < 2) return null;
        return { role: parts[0], type: parts[1] };
    }
    
    function getSlotLabel(slotKey) {
        var parsed = parseSlotKey(slotKey);
        if (!parsed) return slotKey;
        var roleLabel = WAICB.CONST.SLOT_ROLE_LABELS[parsed.role] || parsed.role;
        var typeLabel = WAICB.CONST.SLOT_TYPE_LABELS[parsed.type] || parsed.type;
        return roleLabel + ' ' + typeLabel;
    }
    
    function getCanvasSize(aspectRatio) {
        var config = WAICB.CONST.ASPECT_RATIOS[aspectRatio];
        if (config) return { w: config.w, h: config.h };
        return { w: 1080, h: 1920 };
    }
    
    return {
        resolveTextStyle: resolveTextStyle,
        resolveMedia: resolveMedia,
        resolveVoice: resolveVoice,
        parseSlotKey: parseSlotKey,
        getSlotLabel: getSlotLabel,
        getCanvasSize: getCanvasSize
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6: Vue 컴포넌트 - ClipBoxColorPicker
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxColorPicker = {
    name: 'ClipBoxColorPicker',
    
    props: {
        currentColor: { type: String, default: '#ffffff' },
        label: { type: String, default: '' }
    },
    
    emits: ['select'],
    
    data: function() {
        return {
            isOpen: false,
            palette: WAICB.CONST.COLOR_PALETTE
        };
    },
    
    methods: {
        togglePicker: function() {
            this.isOpen = !this.isOpen;
        },
        
        closePicker: function() {
            this.isOpen = false;
        },
        
        selectColor: function(color) {
            this.$emit('select', color);
            this.isOpen = false;
        },
        
        onClickOutside: function(e) {
            if (!this.$el.contains(e.target)) {
                this.isOpen = false;
            }
        }
    },
    
    mounted: function() {
        document.addEventListener('click', this.onClickOutside);
    },
    
    beforeUnmount: function() {
        document.removeEventListener('click', this.onClickOutside);
    },
    
    template: '\
<div class="wai-cb-color-picker-wrapper">\
    <div class="wai-cb-color-trigger" @click.stop="togglePicker">\
        <div class="wai-cb-color-preview" :style="{ backgroundColor: currentColor }"></div>\
        <span v-if="label" class="wai-cb-color-label">{{ label }}</span>\
    </div>\
    <div v-if="isOpen" class="wai-cb-color-modal" @click.stop>\
        <div class="wai-cb-color-modal__header">\
            <span class="wai-cb-color-modal__title">색상 선택</span>\
            <button class="wai-cb-btn wai-cb-btn--icon" @click="closePicker"><i class="fas fa-times"></i></button>\
        </div>\
        <div class="wai-cb-color-modal__body">\
            <div class="wai-cb-color-section">\
                <div class="wai-cb-color-section__label">현재 색상</div>\
                <div class="wai-cb-color-current">\
                    <div class="wai-cb-color-current__preview" :style="{ backgroundColor: currentColor }"></div>\
                    <span class="wai-cb-color-current__hex">{{ currentColor.toUpperCase() }}</span>\
                </div>\
            </div>\
            <div class="wai-cb-color-section">\
                <div class="wai-cb-color-section__label">무지개 색상</div>\
                <div class="wai-cb-color-grid">\
                    <div v-for="color in palette.rainbow" :key="\'r-\' + color" class="wai-cb-color-swatch" :class="{ \'wai-cb-color-swatch--selected\': currentColor === color }" :style="{ backgroundColor: color }" @click="selectColor(color)"></div>\
                </div>\
            </div>\
            <div class="wai-cb-color-section">\
                <div class="wai-cb-color-section__label">자주 쓰는 색상</div>\
                <div class="wai-cb-color-grid">\
                    <div v-for="color in palette.frequent" :key="\'f-\' + color" class="wai-cb-color-swatch" :class="{ \'wai-cb-color-swatch--selected\': currentColor === color }" :style="{ backgroundColor: color }" @click="selectColor(color)"></div>\
                </div>\
            </div>\
            <div class="wai-cb-color-section">\
                <div class="wai-cb-color-section__label">기본 팔레트</div>\
                <div class="wai-cb-color-grid wai-cb-color-grid--large">\
                    <div v-for="color in palette.basic" :key="\'b-\' + color" class="wai-cb-color-swatch wai-cb-color-swatch--large" :class="{ \'wai-cb-color-swatch--selected\': currentColor === color }" :style="{ backgroundColor: color }" @click="selectColor(color)"></div>\
                </div>\
            </div>\
        </div>\
    </div>\
</div>\
    '
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6-B: Vue 컴포넌트 - ClipBoxTokens
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxTokens = {
    name: 'ClipBoxTokens',
    props: {
        tokens: { type: Array, default: function() { return []; } },
        clipId: { type: String, required: true }
    },
    
    template: '\
        <div class="wai-cb-tokens">\
            <div v-if="tokens.length === 0" class="wai-cb-tokens__empty">\
                텍스트를 입력하면 토큰이 생성됩니다\
            </div>\
            <div v-else class="wai-cb-tokens__list">\
                <span v-for="(token, idx) in tokens" :key="token.id" class="wai-cb-token" :class="tokenClass(token)">\
                    <template v-if="token.type === \'text\'">{{ token.text }}</template>\
                    <template v-else-if="token.type === \'linebreak\'">↵</template>\
                    <template v-else-if="token.type === \'silence\'">[{{ token.duration.toFixed(1) }}s]</template>\
                </span>\
            </div>\
        </div>\
    ',
    
    methods: {
        tokenClass: function(token) {
            return ['wai-cb-token--' + token.type];
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6-C: Vue 컴포넌트 - ClipBoxSlotSettings
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxSlotSettings = {
    name: 'ClipBoxSlotSettings',
    
    props: {
        clip: { type: Object, required: true },
        globalSettings: { type: Object, required: true },
        activeSlots: { type: Array, default: function() { return []; } }
    },
    
    emits: ['update-binding'],
    
    computed: {
        textSlots: function() {
            return this.activeSlots.filter(function(slot) {
                var parsed = WAICB.Resolver.parseSlotKey(slot.slotKey);
                return parsed && parsed.type === 'text';
            });
        },
        bgSlots: function() {
            return this.activeSlots.filter(function(slot) {
                var parsed = WAICB.Resolver.parseSlotKey(slot.slotKey);
                return parsed && parsed.type === 'bg';
            });
        },
        hasSlots: function() { return this.activeSlots.length > 0; },
        hasTextSlots: function() { return this.textSlots.length > 0; },
        hasBgSlots: function() { return this.bgSlots.length > 0; }
    },
    
    methods: {
        getSlotLabel: function(slotKey) { return WAICB.Resolver.getSlotLabel(slotKey); },
        getBindingText: function(slotKey) {
            var bindings = this.clip.slotBindings || {};
            return bindings[slotKey] ? (bindings[slotKey].text || '') : '';
        },
        usesClipImage: function(slotKey) {
            var bindings = this.clip.slotBindings || {};
            return !bindings[slotKey] || bindings[slotKey].useClipImage !== false;
        },
        onTextChange: function(slotKey, event) {
            this.$emit('update-binding', slotKey, { text: event.target.value });
        },
        onToggleClipImage: function(slotKey) {
            this.$emit('update-binding', slotKey, { useClipImage: !this.usesClipImage(slotKey) });
        },
        copyRawTextToSlot: function(slotKey) {
            this.$emit('update-binding', slotKey, { text: this.clip.rawText || '' });
            WAICB.Toast.success('텍스트가 복사되었습니다');
        },
        clearSlotText: function(slotKey) {
            this.$emit('update-binding', slotKey, { text: '' });
        }
    },
    
    template: '\
<div class="wai-cb-slot-settings">\
    <div v-if="!hasSlots" class="wai-cb-slots-empty">\
        <span class="wai-cb-text--hint">활성화된 슬롯이 없습니다</span>\
    </div>\
    <div v-if="hasTextSlots" class="wai-cb-slot-group">\
        <div class="wai-cb-slot-group__header"><i class="fas fa-font"></i><span>텍스트 슬롯</span></div>\
        <div v-for="slot in textSlots" :key="slot.slotKey" class="wai-cb-slot-item">\
            <div class="wai-cb-slot-item__header">\
                <span class="wai-cb-slot-item__label">{{ getSlotLabel(slot.slotKey) }}</span>\
                <div class="wai-cb-slot-item__actions">\
                    <button class="wai-cb-btn wai-cb-btn--icon" @click="copyRawTextToSlot(slot.slotKey)" title="클립 텍스트 복사"><i class="fas fa-copy"></i></button>\
                    <button class="wai-cb-btn wai-cb-btn--icon" @click="clearSlotText(slot.slotKey)" title="지우기"><i class="fas fa-times"></i></button>\
                </div>\
            </div>\
            <textarea class="wai-cb-textarea" :value="getBindingText(slot.slotKey)" @input="onTextChange(slot.slotKey, $event)" placeholder="슬롯에 표시할 텍스트" rows="1"></textarea>\
        </div>\
    </div>\
    <div v-if="hasBgSlots" class="wai-cb-slot-group">\
        <div class="wai-cb-slot-group__header"><i class="fas fa-image"></i><span>배경 슬롯</span></div>\
        <div v-for="slot in bgSlots" :key="slot.slotKey" class="wai-cb-slot-item">\
            <div class="wai-cb-slot-item__header"><span class="wai-cb-slot-item__label">{{ getSlotLabel(slot.slotKey) }}</span></div>\
            <div class="wai-cb-slot-item__body">\
                <label class="wai-cb-checkbox-label">\
                    <input type="checkbox" class="wai-cb-checkbox" :checked="usesClipImage(slot.slotKey)" @change="onToggleClipImage(slot.slotKey)" />\
                    <span>클립 생성 이미지 사용</span>\
                </label>\
                <div v-if="clip.imageSrc && usesClipImage(slot.slotKey)" class="wai-cb-slot-preview"><img :src="clip.imageSrc" class="wai-cb-slot-preview__img" /></div>\
                <div v-else class="wai-cb-slot-preview wai-cb-slot-preview--empty"><span class="wai-cb-text--hint">이미지 없음</span></div>\
            </div>\
        </div>\
    </div>\
</div>\
    '
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6-D: Vue 컴포넌트 - ClipBoxItem
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxItem = {
    name: 'ClipBoxItem',
    
    components: {
        'clip-box-tokens': ClipBoxTokens,
        'clip-box-slot-settings': ClipBoxSlotSettings,
        'clip-box-color-picker': ClipBoxColorPicker
    },
    
    props: {
        clip: { type: Object, required: true },
        index: { type: Number, required: true },
        globalSettings: { type: Object, required: true },
        activeSlots: { type: Array, default: function() { return []; } }
    },
    
    emits: ['update', 'delete', 'generate-tts', 'generate-image'],
    
    data: function() {
        return {
            localText: this.clip.rawText || '',
            textInputTimer: null
        };
    },
    
    computed: {
        clipNumber: function() { return '#' + (this.index + 1); },
        voiceStatusClass: function() { return 'wai-cb-status--' + (this.clip.voiceStatus || 'idle'); },
        imageStatusClass: function() { return 'wai-cb-status--' + (this.clip.imageStatus || 'idle'); },
        resolvedVoice: function() { return WAICB.Resolver.resolveVoice(this.globalSettings.voice, this.clip.voiceOverride); },
        useGlobalVoice: function() { return this.clip.useGlobalVoice !== false; },
        activeSlotsCount: function() { return this.activeSlots.length; },
        boundSlotsCount: function() {
            var bindings = this.clip.slotBindings || {};
            var count = 0;
            for (var key in bindings) {
                if (bindings.hasOwnProperty(key) && (bindings[key].text || bindings[key].mediaSrc)) count++;
            }
            return count;
        }
    },
    
    watch: {
        'clip.rawText': function(newVal) { this.localText = newVal || ''; }
    },
    
    methods: {
        onTextInput: function(e) {
            var self = this;
            this.localText = e.target.value;
            this.autoResizeTextarea(e.target);
            clearTimeout(this.textInputTimer);
            this.textInputTimer = setTimeout(function() { self.updateText(self.localText); }, 300);
        },
        autoResizeTextarea: function(el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        },
        updateText: function(text) {
            var tokens = WAICB.Tokenizer.tokenize(text);
            this.$emit('update', this.clip.id, { rawText: text, tokens: tokens });
        },
        toggleExpand: function() { this.$emit('update', this.clip.id, { isExpanded: !this.clip.isExpanded }); },
        toggleSection: function(section) {
            var sections = WAICB.Utils.clone(this.clip.expandedSections || {});
            sections[section] = !sections[section];
            this.$emit('update', this.clip.id, { expandedSections: sections });
        },
        isSectionExpanded: function(section) { return this.clip.expandedSections && this.clip.expandedSections[section]; },
        onDelete: function() {
            if (confirm('클립 ' + this.clipNumber + '을(를) 삭제하시겠습니까?')) {
                this.$emit('delete', this.clip.id);
            }
        },
        onImagePromptChange: function(e) {
            this.$emit('update', this.clip.id, { imagePrompt: e.target.value });
            this.autoResizeTextarea(e.target);
        },
        onVoiceDirectingChange: function(e) {
            this.$emit('update', this.clip.id, { voiceDirecting: e.target.value });
            this.autoResizeTextarea(e.target);
        },
        toggleGlobalVoice: function() {
            this.$emit('update', this.clip.id, { useGlobalVoice: !this.useGlobalVoice });
        },
        onVoiceFieldChange: function(field, value) {
            var override = WAICB.Utils.clone(this.clip.voiceOverride || {});
            override[field] = value;
            this.$emit('update', this.clip.id, { voiceOverride: override });
        },
        generateTTS: function() { this.$emit('generate-tts', this.clip.id); },
        generateImage: function() { this.$emit('generate-image', this.clip.id); },
        onSlotBindingUpdate: function(slotKey, bindingData) {
            var bindings = WAICB.Utils.clone(this.clip.slotBindings || {});
            if (!bindings[slotKey]) bindings[slotKey] = {};
            bindings[slotKey] = WAICB.Utils.deepMerge(bindings[slotKey], bindingData);
            this.$emit('update', this.clip.id, { slotBindings: bindings });
        }
    },
    
    mounted: function() {
        var textarea = this.$el.querySelector('.wai-cb-clip__text textarea');
        if (textarea && this.localText) this.autoResizeTextarea(textarea);
    },
    
    created: function() {
        this.voicePresets = WAICB.CONST.VOICE_PRESETS;
    },
    
    template: '\
<div class="wai-cb-clip" :class="{ \'wai-cb-clip--expanded\': clip.isExpanded }">\
    <!-- 클립 헤더 -->\
    <div class="wai-cb-clip__header">\
        <div class="wai-cb-clip__header-left">\
            <button class="wai-cb-btn wai-cb-btn--icon" @click="toggleExpand" :title="clip.isExpanded ? \'접기\' : \'펼치기\'">\
                <i :class="clip.isExpanded ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'"></i>\
            </button>\
            <span class="wai-cb-clip__number">{{ clipNumber }}</span>\
        </div>\
        <div class="wai-cb-clip__header-right">\
            <button class="wai-cb-btn wai-cb-btn--text wai-cb-btn--danger" @click="onDelete">삭제</button>\
        </div>\
    </div>\
    \
    <!-- 토큰 필드 (항상 표시) -->\
    <div class="wai-cb-clip__tokens">\
        <clip-box-tokens :tokens="clip.tokens" :clip-id="clip.id"></clip-box-tokens>\
    </div>\
    \
    <!-- 텍스트 입력 필드 (항상 표시) -->\
    <div class="wai-cb-clip__text">\
        <textarea class="wai-cb-textarea" :value="localText" @input="onTextInput" placeholder="텍스트를 입력하세요" rows="1"></textarea>\
    </div>\
    \
    <!-- 펼침 시 표시되는 섹션들 -->\
    <template v-if="clip.isExpanded">\
        <div class="wai-cb-clip__sections">\
            <!-- 이미지 생성 섹션 -->\
            <div class="wai-cb-section">\
                <div class="wai-cb-section__header" @click="toggleSection(\'image\')">\
                    <i :class="isSectionExpanded(\'image\') ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'" class="wai-cb-section__toggle"></i>\
                    <span class="wai-cb-section__title">이미지 생성</span>\
                    <span class="wai-cb-section__status" :class="imageStatusClass">{{ clip.imageStatus === "done" ? "완료" : clip.imageStatus === "generating" ? "생성중" : "" }}</span>\
                </div>\
                <div class="wai-cb-section__body" v-show="isSectionExpanded(\'image\')">\
                    <textarea class="wai-cb-textarea" :value="clip.imagePrompt" @input="onImagePromptChange" placeholder="이미지 생성 프롬프트" rows="1"></textarea>\
                    <div class="wai-cb-section__actions">\
                        <button class="wai-cb-btn wai-cb-btn--primary" @click="generateImage" :disabled="clip.imageStatus === \'generating\'">생성</button>\
                    </div>\
                    <div v-if="clip.imageSrc" class="wai-cb-section__preview"><img :src="clip.imageSrc" class="wai-cb-img-preview" /></div>\
                </div>\
            </div>\
            \
            <!-- 보이스 생성 섹션 -->\
            <div class="wai-cb-section">\
                <div class="wai-cb-section__header" @click="toggleSection(\'voice\')">\
                    <i :class="isSectionExpanded(\'voice\') ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'" class="wai-cb-section__toggle"></i>\
                    <span class="wai-cb-section__title">보이스 생성</span>\
                    <label class="wai-cb-checkbox-label wai-cb-checkbox-label--inline" @click.stop>\
                        <input type="checkbox" class="wai-cb-checkbox" :checked="useGlobalVoice" @change="toggleGlobalVoice" />\
                        <span>전역설정</span>\
                    </label>\
                    <span class="wai-cb-section__status" :class="voiceStatusClass">{{ clip.voiceStatus === "done" ? "완료" : clip.voiceStatus === "generating" ? "생성중" : "" }}</span>\
                </div>\
                <div class="wai-cb-section__body" v-show="isSectionExpanded(\'voice\')">\
                    <div v-if="!useGlobalVoice" class="wai-cb-voice-override">\
                        <div class="wai-cb-row"><span class="wai-cb-label">음성</span><select class="wai-cb-select" :value="resolvedVoice.voiceId" @change="onVoiceFieldChange(\'voiceId\', $event.target.value)"><option v-for="preset in voicePresets" :key="preset.id" :value="preset.id">{{ preset.label }}</option></select></div>\
                        <div class="wai-cb-row"><span class="wai-cb-label">속도</span><input type="number" class="wai-cb-input wai-cb-input--number" :value="resolvedVoice.speed" @change="onVoiceFieldChange(\'speed\', parseFloat($event.target.value))" min="0.5" max="2.0" step="0.1" /></div>\
                    </div>\
                    <div class="wai-cb-field"><span class="wai-cb-label">디렉팅</span><textarea class="wai-cb-textarea" :value="clip.voiceDirecting" @input="onVoiceDirectingChange" :placeholder="globalSettings.voice.defaultDirecting || \'음성 디렉팅\'"></textarea></div>\
                    <div class="wai-cb-section__actions"><button class="wai-cb-btn wai-cb-btn--primary" @click="generateTTS" :disabled="clip.voiceStatus === \'generating\'">생성</button></div>\
                </div>\
            </div>\
            \
            <!-- 슬롯 설정 섹션 -->\
            <div class="wai-cb-section">\
                <div class="wai-cb-section__header" @click="toggleSection(\'slots\')">\
                    <i :class="isSectionExpanded(\'slots\') ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'" class="wai-cb-section__toggle"></i>\
                    <span class="wai-cb-section__title">슬롯 설정</span>\
                    <span class="wai-cb-section__status">{{ boundSlotsCount }}/{{ activeSlotsCount }}</span>\
                </div>\
                <div class="wai-cb-section__body" v-show="isSectionExpanded(\'slots\')">\
                    <clip-box-slot-settings :clip="clip" :global-settings="globalSettings" :active-slots="activeSlots" @update-binding="onSlotBindingUpdate"></clip-box-slot-settings>\
                </div>\
            </div>\
        </div>\
    </template>\
</div>\
    '
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 7: Vue 컴포넌트 - ClipBoxManager (메인)
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxManager = {
    name: 'ClipBoxManager',
    
    components: {
        'clip-box-item': ClipBoxItem
    },
    
    props: {
        canvasBoxes: { type: Array, default: function() { return []; } }
    },
    
    data: function() {
        return {
            globalSettings: WAICB.createDefaultGlobalSettings(),
            clips: [],
            isCollapsed: false,
            selectedClipId: null,
            selectedPrompt: null,
            ratioSelected: false
        };
    },
    
    computed: {
        clipCount: function() { return this.clips.length; },
        aspectRatioOptions: function() {
            var options = [];
            var ratios = WAICB.CONST.ASPECT_RATIOS;
            for (var key in ratios) {
                if (ratios.hasOwnProperty(key)) {
                    options.push({ value: key, label: ratios[key].label });
                }
            }
            return options;
        },
        currentRatioLabel: function() {
            var ratio = this.globalSettings.project.aspectRatio;
            var config = WAICB.CONST.ASPECT_RATIOS[ratio];
            return config ? config.label : ratio;
        },
        activeSlots: function() {
            if (!this.canvasBoxes || this.canvasBoxes.length === 0) return [];
            return this.canvasBoxes.filter(function(box) { return box.slotKey && !box.isHidden; }).map(function(box) {
                return { slotKey: box.slotKey, colRole: box.colRole, rowType: box.rowType, layerName: box.layerName, color: box.color };
            });
        },
        hasSelectedPrompt: function() { return this.selectedPrompt && this.selectedPrompt.name; }
    },
    
    created: function() {
        var self = this;
        WAICB.Store.init();
        this.loadData();
        
        WAICB.Events.on('clip:added', function() { self.loadData(); });
        WAICB.Events.on('clip:updated', function() { self.loadData(); });
        WAICB.Events.on('clip:removed', function() { self.loadData(); });
        WAICB.Events.on('settings:changed', function() { self.loadData(); });
    },
    
    methods: {
        loadData: function() {
            this.globalSettings = WAICB.Store.getGlobalSettings();
            this.clips = WAICB.Store.getClips();
            if (this.globalSettings.selectedPrompt) {
                this.selectedPrompt = this.globalSettings.selectedPrompt;
            }
        },
        
        toggleCollapse: function() { this.isCollapsed = !this.isCollapsed; },
        
        onAspectRatioChange: function(e) {
            var value = e.target.value;
            WAICB.Store.setGlobalField('project.aspectRatio', value);
            this.globalSettings = WAICB.Store.getGlobalSettings();
            this.ratioSelected = true;
            this.notifyAspectRatioChange(value);
        },
        
        notifyAspectRatioChange: function(aspectRatio) {
            var size = WAICB.Resolver.getCanvasSize(aspectRatio);
            if (this.$root && this.$root.canvasSize) {
                this.$root.canvasSize = size;
                this.$root.aspectRatio = aspectRatio;
            }
            WAICB.Events.emit('aspectRatio:changed', { aspectRatio: aspectRatio, size: size });
            WAICB.Toast.info('화면 비율: ' + aspectRatio);
        },
        
        addClip: function() {
            WAICB.Store.addClip();
            WAICB.Toast.success('클립이 추가되었습니다');
        },
        
        onClipUpdate: function(clipId, updates) { WAICB.Store.updateClip(clipId, updates); },
        onClipDelete: function(clipId) {
            WAICB.Store.removeClip(clipId);
            WAICB.Toast.info('클립이 삭제되었습니다');
        },
        
        selectClip: function(clipId) { this.selectedClipId = clipId; },
        
        onGenerateTTS: function(clipId) {
            var clip = WAICB.Store.getClip(clipId);
            if (!clip || !clip.rawText) { WAICB.Toast.warning('텍스트를 먼저 입력하세요'); return; }
            WAICB.Store.updateClip(clipId, { voiceStatus: 'generating' });
            setTimeout(function() {
                WAICB.Store.updateClip(clipId, { voiceStatus: 'done', voiceSrc: 'dummy_audio_url' });
                WAICB.Toast.success('TTS 생성 완료');
            }, 1500);
        },
        
        onGenerateImage: function(clipId) {
            var clip = WAICB.Store.getClip(clipId);
            if (!clip || !clip.imagePrompt) { WAICB.Toast.warning('이미지 프롬프트를 먼저 입력하세요'); return; }
            WAICB.Store.updateClip(clipId, { imageStatus: 'generating' });
            setTimeout(function() {
                WAICB.Store.updateClip(clipId, { imageStatus: 'done', imageSrc: 'https://via.placeholder.com/1080x1920/333/fff?text=Generated' });
                WAICB.Toast.success('이미지 생성 완료');
            }, 2000);
        },
        
        openPromptManager: function() {
            document.dispatchEvent(new CustomEvent('wai-open-asset-modal', { detail: { tab: 'prompt' } }));
        },
        
        editPrompt: function() {
            if (!this.selectedPrompt) {
                this.openPromptManager();
                return;
            }
            document.dispatchEvent(new CustomEvent('wai-open-asset-modal', { detail: { tab: 'prompt', editId: this.selectedPrompt.id } }));
        }
    },
    
    template: '\
<div id="clipbox-manager-root" class="wai-cb-root">\
    <!-- 헤더 -->\
    <div class="wai-cb-header" @click="toggleCollapse">\
        <div class="wai-cb-header__left">\
            <i :class="isCollapsed ? \'fas fa-chevron-right\' : \'fas fa-chevron-down\'" class="wai-cb-header__toggle"></i>\
            <i class="fas fa-layer-group wai-cb-header__icon"></i>\
            <span class="wai-cb-header__title">클립박스 매니저</span>\
        </div>\
    </div>\
    \
    <template v-if="!isCollapsed">\
        <!-- 옵션 바 -->\
        <div class="wai-cb-options">\
            <span class="wai-cb-options__label">{{ ratioSelected ? currentRatioLabel : \'화면비율\' }}</span>\
            <select class="wai-cb-select wai-cb-select--ratio" :value="globalSettings.project.aspectRatio" @change="onAspectRatioChange" @click.stop>\
                <option v-for="opt in aspectRatioOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>\
            </select>\
            <button class="wai-cb-btn" @click.stop="openPromptManager">프롬프트</button>\
            <button class="wai-cb-btn" @click.stop="editPrompt">편집</button>\
            <button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--icon" @click.stop="addClip" title="클립 추가">\
                <i class="fas fa-plus"></i>\
            </button>\
        </div>\
        \
        <!-- 클립 리스트 -->\
        <div class="wai-cb-clip-list">\
            <div v-if="clips.length === 0" class="wai-cb-empty">\
                <p>클립이 없습니다</p>\
                <p class="wai-cb-text--hint">+ 버튼으로 추가하세요</p>\
            </div>\
            <clip-box-item\
                v-for="(clip, index) in clips"\
                :key="clip.id"\
                :clip="clip"\
                :index="index"\
                :global-settings="globalSettings"\
                :active-slots="activeSlots"\
                :class="{ \'wai-cb-clip--selected\': selectedClipId === clip.id }"\
                @click.native="selectClip(clip.id)"\
                @update="onClipUpdate"\
                @delete="onClipDelete"\
                @generate-tts="onGenerateTTS"\
                @generate-image="onGenerateImage"\
            ></clip-box-item>\
        </div>\
    </template>\
</div>\
    '
};

window.ClipBoxManager = ClipBoxManager;

/* ═══════════════════════════════════════════════════════════════════════════
   END OF ClipBoxManager v6
   ═══════════════════════════════════════════════════════════════════════════ */
