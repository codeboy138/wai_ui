/* ═══════════════════════════════════════════════════════════════════════════
   WAI-UI ClipBox Manager v8
   파일: js/components/ClipBoxManager.js
   
   v8 변경사항:
   - 클립별 텍스트 스타일 설정 추가 (LayerConfigModal 스타일 적용)
   - ColorPaletteModal 통합 (팝업 모달 방식)
   - 조밀한 레이아웃으로 재배치
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   블록 1: 전역 네임스페이스 및 상수
   ───────────────────────────────────────────────────────────────────────────── */
window.WAICB = window.WAICB || {};

WAICB.CONST = {
    STORAGE_KEY: 'waicb_v8_data',
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
    
    FONT_FAMILIES: [
        { id: 'Pretendard, system-ui, sans-serif', label: '프리텐다드' },
        { id: "'Noto Sans KR', sans-serif", label: '노토산스' },
        { id: "'Nanum Gothic', sans-serif", label: '나눔고딕' },
        { id: "'Nanum Myeongjo', serif", label: '나눔명조' },
        { id: 'Arial, sans-serif', label: 'Arial' },
        { id: "'Times New Roman', serif", label: 'Times' },
        { id: "'Courier New', monospace", label: 'Courier' },
        { id: 'Impact, sans-serif', label: 'Impact' }
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
    },
    
    COLOR_KO_NAMES: {
        '#000000': '블랙',
        '#ffffff': '화이트',
        '#ff0000': '레드',
        '#00ff00': '라임',
        '#0000ff': '블루',
        '#ffff00': '옐로',
        '#00ffff': '시안',
        '#ff00ff': '마젠타',
        '#64748b': '슬레이트',
        '#ef4444': '레드',
        '#22c55e': '그린',
        '#3b82f6': '블루',
        '#0ea
요청이 중단되었습니다

ClipBoxManager.js - 텍스트 스타일 섹션 추가 및 ColorPaletteModal 통합
=========
추가가 아니야 변경이야. 이미 클립박스 매니저/클립박스/텍스트 스타일 섹션이 있어
알겠습니다. 기존 ClipBoxManager의 텍스트 스타일 섹션을 LayerConfigModal 스타일로 변경하는 작업을 진행하겠습니다.

파일을 다시 분석해보니, 현재 ClipBoxManager.js에서:

ClipBoxGlobalSettings 컴포넌트 내에 텍스트 스타일 섹션이 있음
ClipBoxColorPicker 컴포넌트가 이미 존재함
LayerConfigModal에서 가져올 요소:

4행 그리드 레이아웃 (폰트, 크기, 색상, 배경 / 테두리색, 두께, 자간, 행간 / 그림자 ON/OFF, X, Y, 블러, 색상 / 가로정렬, 세로정렬)
ColorPa
요청이 중단되었습니다

클립박스 매니저/전역설정/텍스트스타일 이야. 내부속성을 변경하는거야
LayerConfigModal의 우클릭 모달창 텍스트스타일을 그대로 가져와서 주어진 영역에 맞게 커스텀해서 배치해
알겠습니다. ClipBoxManager의 전역설정 내 텍스트 스타일 섹션을 LayerConfigModal의 텍스트 스타일 구조로 변경하겠습니다.

1. 수정 대상: js/components/ClipBoxManager.js
Copy### [WAI:UPDATE:js/components/ClipBoxManager.js]
/* ═══════════════════════════════════════════════════════════════════════════
   WAI-UI ClipBox Manager v8
   파일: js/components/ClipBoxManager.js
   
   v8 변경사항:
   - 전역 텍스트 스타일을 LayerConfigModal 방식으로 변경
   - ColorPaletteModal 팝업 모달 통합
   - 4행 그리드 레이아웃 (폰트/크기/색상/배경, 테두리/두께/자간/행간, 그림자, 정렬)
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   블록 1: 전역 네임스페이스 및 상수
   ───────────────────────────────────────────────────────────────────────────── */
window.WAICB = window.WAICB || {};

WAICB.CONST = {
    STORAGE_KEY: 'waicb_v8_data',
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
    
    FONT_FAMILIES: [
        { id: 'Pretendard, system-ui, sans-serif', label: '프리텐다드' },
        { id: "'Noto Sans KR', sans-serif", label: '노토산스' },
        { id: "'Nanum Gothic', sans-serif", label: '나눔고딕' },
        { id: "'Nanum Myeongjo', serif", label: '나눔명조' },
        { id: 'Arial, sans-serif', label: 'Arial' },
        { id: "'Times New Roman', serif", label: 'Times' },
        { id: "'Courier New', monospace", label: 'Courier' },
        { id: 'Impact, sans-serif', label: 'Impact' }
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
    },
    
    COLOR_KO_NAMES: {
        '#000000': '블랙',
        '#ffffff': '화이트',
        '#ff0000': '레드',
        '#00ff00': '라임',
        '#0000ff': '블루',
        '#ffff00': '옐로',
        '#00ffff': '시안',
        '#ff00ff': '마젠타',
        '#64748b': '슬레이트',
        '#ef4444': '레드',
        '#22c55e': '그린',
        '#3b82f6': '블루',
        '#0ea5e9': '스카이',
        '#6366f1': '인디고',
        '#a855f7': '퍼플',
        '#ec4899': '핑크',
        '#eab308': '옐로',
        '#f97316': '오렌지',
        '#facc15': '앰버'
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
    },
    
    parseColorToRgb: function(color) {
        if (!color || typeof color !== 'string') return null;
        color = color.trim().toLowerCase();
        if (color[0] === '#') {
            var hex = color.slice(1);
            if (hex.length === 3) hex = hex.split('').map(function(c) { return c + c; }).join('');
            if (hex.length !== 6) return null;
            var num = parseInt(hex, 16);
            return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
        }
        var rgbMatch = color.match(/rgba?\(([^)]+)\)/);
        if (rgbMatch) {
            var parts = rgbMatch[1].split(',').map(function(v) { return parseFloat(v.trim()); });
            if (parts.length >= 3) return { r: parts[0], g: parts[1], b: parts[2] };
        }
        return null;
    },
    
    getContrastColor: function(hexColor) {
        var rgb = WAICB.Utils.parseColorToRgb(hexColor);
        if (!rgb) return '#ffffff';
        var lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return lum > 0.5 ? '#000000' : '#ffffff';
    },
    
    getColorLabel: function(color) {
        if (!color || color === 'transparent') return '투명';
        var code = color.toUpperCase();
        var name = WAICB.CONST.COLOR_KO_NAMES[code.toLowerCase()] || WAICB.CONST.COLOR_KO_NAMES[code];
        return name || code.substring(0, 7);
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
            fontFamily: 'Pretendard, system-ui, sans-serif',
            fontSize: 48,
            fillColor: '#ffffff',
            backgroundColor: 'transparent',
            strokeColor: '#000000',
            strokeWidth: 0,
            letterSpacing: 0,
            lineHeight: 1.4,
            textAlign: 'center',
            vAlign: 'middle',
            shadow: {
                enabled: false,
                offsetX: 2,
                offsetY: 2,
                blur: 4,
                color: '#000000'
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
            version: 8,
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
        reset: reset
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
            if (PARTICLE_PATTERNS[i].test(text)) return true;
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
                    result.push({ id: WAICB.Utils.tokenId(), type: 'linebreak' });
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
                result.push({ id: WAICB.Utils.tokenId(), type: 'text', text: merged[j] });
            }
            
            var hasMoreContent = false;
            for (var k = lineIdx + 1; k < lines.length; k++) {
                if (lines[k].trim()) { hasMoreContent = true; break; }
            }
            if (hasMoreContent) {
                result.push({ id: WAICB.Utils.tokenId(), type: 'linebreak' });
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
                if (result && !result.endsWith('\n')) result += ' ';
                result += token.text;
            }
        }
        return result.trim();
    }
    
    return {
        tokenize: tokenize,
        tokensToText: tokensToText,
        isParticle: isParticle
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   블록 5: Resolver
   ───────────────────────────────────────────────────────────────────────────── */

WAICB.Resolver = (function() {
    
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
        resolveVoice: resolveVoice,
        parseSlotKey: parseSlotKey,
        getSlotLabel: getSlotLabel,
        getCanvasSize: getCanvasSize
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6: Vue 컴포넌트 - ClipBoxColorPaletteModal (LayerConfigModal 스타일)
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxColorPaletteModal = {
    name: 'ClipBoxColorPaletteModal',
    props: {
        currentColor: { type: String, default: '#ffffff' }
    },
    emits: ['close', 'select'],
    data: function() {
        return {
            rainbow: ['#ff0000','#ff7f00','#ffff00','#00ff00','#00ffff','#0000ff','#8b00ff','#ff1493','#ff4500','#ffd700','#7fff00','#00bfff'],
            popular: ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#0ea5e9','#3b82f6','#6366f1','#a855f7','#ec4899','#f97316','#facc15','#4b5563','#9ca3af','#e5e7eb','#10b981','#14b8a6','#06b6d4','#2563eb'],
            basePalette: ['#000000','#111827','#4b5563','#9ca3af','#e5e7eb','#ffffff']
        };
    },
    computed: {
        popularComplements: function() {
            var self = this;
            return this.popular.map(function(c) {
                return self.complementColor(c);
            });
        }
    },
    methods: {
        pick: function(c) {
            this.$emit('select', c.toUpperCase());
        },
        colorLabel: function(c) {
            var code = (c || '#000000').toUpperCase();
            var name = WAICB.CONST.COLOR_KO_NAMES[code.toLowerCase()] || WAICB.CONST.COLOR_KO_NAMES[code] || code;
            if (name && name !== code) return name + ' ' + code;
            return code;
        },
        complementColor: function(hex) {
            var rgb = WAICB.Utils.parseColorToRgb(hex);
            if (!rgb) return hex;
            var r = (255 - rgb.r).toString(16).padStart(2, '0');
            var g = (255 - rgb.g).toString(16).padStart(2, '0');
            var b = (255 - rgb.b).toString(16).padStart(2, '0');
            return ('#' + r + g + b).toUpperCase();
        }
    },
    template: '\
<div class="wai-cb-palette-overlay" @click.self="$emit(\'close\')">\
    <div class="wai-cb-palette-modal" @mousedown.stop>\
        <div class="wai-cb-palette-header">\
            <span class="wai-cb-palette-title">색상 선택</span>\
            <button class="wai-cb-palette-close" @click="$emit(\'close\')">✕</button>\
        </div>\
        <div class="wai-cb-palette-current">\
            <span class="wai-cb-palette-label">현재 색상</span>\
            <div class="wai-cb-palette-current-box">\
                <div class="wai-cb-palette-preview" :style="{ backgroundColor: currentColor }"></div>\
                <span class="wai-cb-palette-hex">{{ colorLabel(currentColor) }}</span>\
            </div>\
        </div>\
        <div class="wai-cb-palette-section">\
            <div class="wai-cb-palette-label">무지개 색상</div>\
            <div class="wai-cb-palette-grid wai-cb-palette-grid--rainbow">\
                <button v-for="c in rainbow" :key="\'r-\' + c" class="wai-cb-palette-swatch" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>\
            </div>\
        </div>\
        <div class="wai-cb-palette-section">\
            <div class="wai-cb-palette-label">자주 쓰는 색상</div>\
            <div class="wai-cb-palette-grid">\
                <button v-for="c in popular" :key="\'p-\' + c" class="wai-cb-palette-swatch" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>\
            </div>\
        </div>\
        <div class="wai-cb-palette-section">\
            <div class="wai-cb-palette-label">보색</div>\
            <div class="wai-cb-palette-grid">\
                <button v-for="c in popularComplements" :key="\'c-\' + c" class="wai-cb-palette-swatch" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>\
            </div>\
        </div>\
        <div class="wai-cb-palette-section">\
            <div class="wai-cb-palette-label">기본 팔레트</div>\
            <div class="wai-cb-palette-grid wai-cb-palette-grid--basic">\
                <button v-for="c in basePalette" :key="\'b-\' + c" class="wai-cb-palette-swatch" :style="{ backgroundColor: c }" :title="colorLabel(c)" @click="pick(c)"></button>\
            </div>\
        </div>\
    </div>\
</div>\
    '
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6-A: Vue 컴포넌트 - ClipBoxColorPicker (인라인 트리거)
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxColorPicker = {
    name: 'ClipBoxColorPicker',
    components: {
        'clip-box-color-palette-modal': ClipBoxColorPaletteModal
    },
    props: {
        currentColor: { type: String, default: '#ffffff' },
        showLabel: { type: Boolean, default: true }
    },
    emits: ['select'],
    data: function() {
        return { isOpen: false };
    },
    computed: {
        buttonStyle: function() {
            var bg = this.currentColor || '#000000';
            var textColor = WAICB.Utils.getContrastColor(bg);
            return { backgroundColor: bg, color: textColor };
        },
        colorLabel: function() {
            return WAICB.Utils.getColorLabel(this.currentColor);
        }
    },
    methods: {
        openPicker: function() { this.isOpen = true; },
        closePicker: function() { this.isOpen = false; },
        onColorSelect: function(color) {
            this.$emit('select', color);
            this.isOpen = false;
        }
    },
    template: '\
<div class="wai-cb-color-picker-inline">\
    <button type="button" class="wai-cb-color-btn" :style="buttonStyle" @click.stop="openPicker">\
        <span v-if="showLabel">{{ colorLabel }}</span>\
    </button>\
    <clip-box-color-palette-modal v-if="isOpen" :current-color="currentColor" @close="closePicker" @select="onColorSelect" />\
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
            <div v-if="tokens.length === 0" class="wai-cb-tokens__empty">텍스트를 입력하면 토큰이 생성됩니다</div>\
            <div v-else class="wai-cb-tokens__list">\
                <span v-for="token in tokens" :key="token.id" class="wai-cb-token" :class="\'wai-cb-token--\' + token.type">\
                    <template v-if="token.type === \'text\'">{{ token.text }}</template>\
                    <template v-else-if="token.type === \'linebreak\'">↵</template>\
                </span>\
            </div>\
        </div>\
    '
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
        }
    },
    template: '\
<div class="wai-cb-slot-settings">\
    <div v-if="!hasSlots" class="wai-cb-slots-empty"><span class="wai-cb-text--hint">활성화된 슬롯이 없습니다</span></div>\
    <div v-if="hasTextSlots" class="wai-cb-slot-group">\
        <div class="wai-cb-slot-group__header"><i class="fas fa-font"></i><span>텍스트 슬롯</span></div>\
        <div v-for="slot in textSlots" :key="slot.slotKey" class="wai-cb-slot-item">\
            <div class="wai-cb-slot-item__header"><span class="wai-cb-slot-item__label">{{ getSlotLabel(slot.slotKey) }}</span></div>\
            <textarea class="wai-cb-textarea" :value="getBindingText(slot.slotKey)" @input="onTextChange(slot.slotKey, $event)" placeholder="슬롯에 표시할 텍스트" rows="1"></textarea>\
        </div>\
    </div>\
    <div v-if="hasBgSlots" class="wai-cb-slot-group">\
        <div class="wai-cb-slot-group__header"><i class="fas fa-image"></i><span>배경 슬롯</span></div>\
        <div v-for="slot in bgSlots" :key="slot.slotKey" class="wai-cb-slot-item">\
            <div class="wai-cb-slot-item__header"><span class="wai-cb-slot-item__label">{{ getSlotLabel(slot.slotKey) }}</span></div>\
            <label class="wai-cb-checkbox-label">\
                <input type="checkbox" class="wai-cb-checkbox" :checked="usesClipImage(slot.slotKey)" @change="onToggleClipImage(slot.slotKey)" />\
                <span>클립 생성 이미지 사용</span>\
            </label>\
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
        return { localText: this.clip.rawText || '', textInputTimer: null };
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
    <div class="wai-cb-clip__tokens"><clip-box-tokens :tokens="clip.tokens" :clip-id="clip.id"></clip-box-tokens></div>\
    <div class="wai-cb-clip__text"><textarea class="wai-cb-textarea" :value="localText" @input="onTextInput" placeholder="텍스트를 입력하세요" rows="1"></textarea></div>\
    <template v-if="clip.isExpanded">\
        <div class="wai-cb-clip__sections">\
            <div class="wai-cb-section">\
                <div class="wai-cb-section__header" @click="toggleSection(\'image\')">\
                    <i :class="isSectionExpanded(\'image\') ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'" class="wai-cb-section__toggle"></i>\
                    <span class="wai-cb-section__title">이미지 생성</span>\
                    <span class="wai-cb-section__status" :class="imageStatusClass">{{ clip.imageStatus === "done" ? "완료" : clip.imageStatus === "generating" ? "생성중" : "" }}</span>\
                </div>\
                <div class="wai-cb-section__body" v-show="isSectionExpanded(\'image\')">\
                    <textarea class="wai-cb-textarea" :value="clip.imagePrompt" @input="onImagePromptChange" placeholder="이미지 생성 프롬프트" rows="1"></textarea>\
                    <div class="wai-cb-section__actions"><button class="wai-cb-btn wai-cb-btn--primary" @click="generateImage" :disabled="clip.imageStatus === \'generating\'">생성</button></div>\
                    <div v-if="clip.imageSrc" class="wai-cb-section__preview"><img :src="clip.imageSrc" class="wai-cb-img-preview" /></div>\
                </div>\
            </div>\
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
                    <div class="wai-cb-field"><span class="wai-cb-label">디렉팅</span><textarea class="wai-cb-textarea" :value="clip.voiceDirecting" @input="onVoiceDirectingChange" placeholder="음성 디렉팅"></textarea></div>\
                    <div class="wai-cb-section__actions"><button class="wai-cb-btn wai-cb-btn--primary" @click="generateTTS" :disabled="clip.voiceStatus === \'generating\'">생성</button></div>\
                </div>\
            </div>\
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
   블록 7-A: Vue 컴포넌트 - ClipBoxGlobalSettings (LayerConfigModal 스타일 텍스트 설정)
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxGlobalSettings = {
    name: 'ClipBoxGlobalSettings',
    components: {
        'clip-box-color-picker': ClipBoxColorPicker
    },
    props: {
        settings: { type: Object, required: true },
        selectedPrompt: { type: Object, default: null }
    },
    emits: ['update', 'generate-all-tts', 'generate-all-images', 'open-prompt-manager', 'edit-prompt'],
    data: function() {
        return {
            expandedSections: {
                project: true,
                textStyle: false,
                voice: false,
                image: false
            }
        };
    },
    computed: {
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
        fontFamilies: function() { return WAICB.CONST.FONT_FAMILIES; },
        voiceEngines: function() { return WAICB.CONST.VOICE_ENGINES; },
        voicePresets: function() { return WAICB.CONST.VOICE_PRESETS; },
        imageEngines: function() { return WAICB.CONST.IMAGE_ENGINES; },
        imageStyles: function() { return WAICB.CONST.IMAGE_STYLES; },
        hasSelectedPrompt: function() { return this.selectedPrompt && this.selectedPrompt.name; },
        textStyle: function() { return this.settings.textStyle || {}; },
        shadow: function() { return this.textStyle.shadow || {}; },
        shadowEnabled: function() { return this.shadow.enabled === true; }
    },
    methods: {
        toggleSection: function(section) { this.expandedSections[section] = !this.expandedSections[section]; },
        updateField: function(path, value) { this.$emit('update', path, value); },
        onAspectRatioChange: function(e) { this.updateField('project.aspectRatio', e.target.value); },
        onTextStyleChange: function(field, value) { this.updateField('textStyle.' + field, value); },
        onShadowChange: function(field, value) { this.updateField('textStyle.shadow.' + field, value); },
        toggleShadow: function() { this.onShadowChange('enabled', !this.shadowEnabled); },
        onVoiceChange: function(field, value) { this.updateField('voice.' + field, value); },
        onImageChange: function(field, value) { this.updateField('image.' + field, value); },
        openPromptManager: function() { this.$emit('open-prompt-manager'); },
        editPrompt: function() { this.$emit('edit-prompt'); },
        alignButtonClass: function(align) {
            var current = this.textStyle.textAlign || 'center';
            return current === align ? 'wai-cb-align-btn--active' : '';
        },
        vAlignButtonClass: function(align) {
            var current = this.textStyle.vAlign || 'middle';
            return current === align ? 'wai-cb-align-btn--active' : '';
        }
    },
    template: '\
<div class="wai-cb-global-settings">\
    <!-- 프로젝트 설정 -->\
    <div class="wai-cb-settings-section">\
        <div class="wai-cb-settings-section__header" @click="toggleSection(\'project\')">\
            <i :class="expandedSections.project ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'" class="wai-cb-settings-section__toggle"></i>\
            <span class="wai-cb-settings-section__title">프로젝트 설정</span>\
        </div>\
        <div class="wai-cb-settings-section__body" v-show="expandedSections.project">\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">비율</span>\
                <select class="wai-cb-select wai-cb-grow" :value="settings.project.aspectRatio" @change="onAspectRatioChange">\
                    <option v-for="opt in aspectRatioOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>\
                </select>\
            </div>\
            <div class="wai-cb-row wai-cb-row--between">\
                <span class="wai-cb-label">프롬프트</span>\
                <div class="wai-cb-prompt-actions">\
                    <button class="wai-cb-btn" @click="openPromptManager">관리</button>\
                    <button class="wai-cb-btn" @click="editPrompt" :disabled="!hasSelectedPrompt">편집</button>\
                </div>\
            </div>\
            <div v-if="hasSelectedPrompt" class="wai-cb-prompt-preview">\
                <div class="wai-cb-prompt-preview__name">{{ selectedPrompt.name }}</div>\
                <div class="wai-cb-prompt-preview__content">{{ selectedPrompt.content.substring(0, 100) }}</div>\
            </div>\
            <div v-else class="wai-cb-prompt-preview wai-cb-prompt-preview--empty">\
                <span class="wai-cb-text--hint">프롬프트 관리에서 선택하세요</span>\
            </div>\
        </div>\
    </div>\
    <!-- 텍스트 스타일 (LayerConfigModal 방식) -->\
    <div class="wai-cb-settings-section">\
        <div class="wai-cb-settings-section__header" @click="toggleSection(\'textStyle\')">\
            <i :class="expandedSections.textStyle ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'" class="wai-cb-settings-section__toggle"></i>\
            <span class="wai-cb-settings-section__title">텍스트 스타일</span>\
        </div>\
        <div class="wai-cb-settings-section__body" v-show="expandedSections.textStyle">\
            <!-- 1행: 폰트, 크기, 색상, 배경 -->\
            <div class="wai-cb-grid wai-cb-grid--4">\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">폰트</span>\
                    <select class="wai-cb-select wai-cb-select--full" :value="textStyle.fontFamily" @change="onTextStyleChange(\'fontFamily\', $event.target.value)">\
                        <option v-for="f in fontFamilies" :key="f.id" :value="f.id">{{ f.label }}</option>\
                    </select>\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">크기 (px)</span>\
                    <input type="number" class="wai-cb-input wai-cb-input--full" :value="textStyle.fontSize" @change="onTextStyleChange(\'fontSize\', parseInt($event.target.value))" min="1" step="1" />\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">색상</span>\
                    <clip-box-color-picker :current-color="textStyle.fillColor || \'#ffffff\'" @select="onTextStyleChange(\'fillColor\', $event)" />\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">배경</span>\
                    <clip-box-color-picker :current-color="textStyle.backgroundColor || \'transparent\'" @select="onTextStyleChange(\'backgroundColor\', $event)" />\
                </div>\
            </div>\
            <!-- 2행: 테두리색, 두께, 자간, 행간 -->\
            <div class="wai-cb-grid wai-cb-grid--4">\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">테두리색</span>\
                    <clip-box-color-picker :current-color="textStyle.strokeColor || \'#000000\'" @select="onTextStyleChange(\'strokeColor\', $event)" />\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">두께 (px)</span>\
                    <input type="number" class="wai-cb-input wai-cb-input--full" :value="textStyle.strokeWidth" @change="onTextStyleChange(\'strokeWidth\', parseInt($event.target.value))" min="0" step="1" />\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">자간 (px)</span>\
                    <input type="number" class="wai-cb-input wai-cb-input--full" :value="textStyle.letterSpacing" @change="onTextStyleChange(\'letterSpacing\', parseInt($event.target.value))" step="1" />\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">행간 (배)</span>\
                    <input type="number" class="wai-cb-input wai-cb-input--full" :value="textStyle.lineHeight" @change="onTextStyleChange(\'lineHeight\', parseFloat($event.target.value))" min="0.5" max="5" step="0.1" />\
                </div>\
            </div>\
            <!-- 3행: 그림자 ON/OFF, X, Y, 블러, 색상 -->\
            <div class="wai-cb-grid wai-cb-grid--5">\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">그림자</span>\
                    <button type="button" class="wai-cb-toggle-btn" :class="{ \'wai-cb-toggle-btn--active\': shadowEnabled }" @click="toggleShadow">{{ shadowEnabled ? \'ON\' : \'OFF\' }}</button>\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">X</span>\
                    <input type="number" class="wai-cb-input wai-cb-input--full" :value="shadow.offsetX || 2" @change="onShadowChange(\'offsetX\', parseInt($event.target.value))" :disabled="!shadowEnabled" step="1" />\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">Y</span>\
                    <input type="number" class="wai-cb-input wai-cb-input--full" :value="shadow.offsetY || 2" @change="onShadowChange(\'offsetY\', parseInt($event.target.value))" :disabled="!shadowEnabled" step="1" />\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">블러</span>\
                    <input type="number" class="wai-cb-input wai-cb-input--full" :value="shadow.blur || 4" @change="onShadowChange(\'blur\', parseInt($event.target.value))" :disabled="!shadowEnabled" min="0" step="1" />\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">색상</span>\
                    <clip-box-color-picker v-if="shadowEnabled" :current-color="shadow.color || \'#000000\'" @select="onShadowChange(\'color\', $event)" />\
                    <div v-else class="wai-cb-color-disabled"></div>\
                </div>\
            </div>\
            <!-- 4행: 가로정렬, 세로정렬 -->\
            <div class="wai-cb-grid wai-cb-grid--2">\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">가로 정렬</span>\
                    <div class="wai-cb-align-group">\
                        <button type="button" class="wai-cb-align-btn" :class="alignButtonClass(\'left\')" @click="onTextStyleChange(\'textAlign\', \'left\')"><i class="fa-solid fa-align-left"></i></button>\
                        <button type="button" class="wai-cb-align-btn" :class="alignButtonClass(\'center\')" @click="onTextStyleChange(\'textAlign\', \'center\')"><i class="fa-solid fa-align-center"></i></button>\
                        <button type="button" class="wai-cb-align-btn" :class="alignButtonClass(\'right\')" @click="onTextStyleChange(\'textAlign\', \'right\')"><i class="fa-solid fa-align-right"></i></button>\
                    </div>\
                </div>\
                <div class="wai-cb-field-col">\
                    <span class="wai-cb-field-label">세로 정렬</span>\
                    <div class="wai-cb-align-group">\
                        <button type="button" class="wai-cb-align-btn" :class="vAlignButtonClass(\'top\')" @click="onTextStyleChange(\'vAlign\', \'top\')">상</button>\
                        <button type="button" class="wai-cb-align-btn" :class="vAlignButtonClass(\'middle\')" @click="onTextStyleChange(\'vAlign\', \'middle\')">중</button>\
                        <button type="button" class="wai-cb-align-btn" :class="vAlignButtonClass(\'bottom\')" @click="onTextStyleChange(\'vAlign\', \'bottom\')">하</button>\
                    </div>\
                </div>\
            </div>\
        </div>\
    </div>\
    <!-- 보이스 설정 -->\
    <div class="wai-cb-settings-section">\
        <div class="wai-cb-settings-section__header" @click="toggleSection(\'voice\')">\
            <i :class="expandedSections.voice ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'" class="wai-cb-settings-section__toggle"></i>\
            <span class="wai-cb-settings-section__title">보이스 설정</span>\
        </div>\
        <div class="wai-cb-settings-section__body" v-show="expandedSections.voice">\
            <div class="wai-cb-row"><span class="wai-cb-label">엔진</span><select class="wai-cb-select wai-cb-grow" :value="settings.voice.engine" @change="onVoiceChange(\'engine\', $event.target.value)"><option v-for="eng in voiceEngines" :key="eng.id" :value="eng.id">{{ eng.label }}</option></select></div>\
            <div class="wai-cb-row"><span class="wai-cb-label">음성</span><select class="wai-cb-select wai-cb-grow" :value="settings.voice.voiceId" @change="onVoiceChange(\'voiceId\', $event.target.value)"><option v-for="preset in voicePresets" :key="preset.id" :value="preset.id">{{ preset.label }}</option></select></div>\
            <div class="wai-cb-row"><span class="wai-cb-label">속도</span><input type="number" class="wai-cb-input wai-cb-input--number" :value="settings.voice.speed" @change="onVoiceChange(\'speed\', parseFloat($event.target.value))" min="0.5" max="2.0" step="0.1" /><span class="wai-cb-label">피치</span><input type="number" class="wai-cb-input wai-cb-input--number" :value="settings.voice.pitch" @change="onVoiceChange(\'pitch\', parseInt($event.target.value))" min="-20" max="20" /></div>\
        </div>\
    </div>\
    <!-- 이미지 설정 -->\
    <div class="wai-cb-settings-section">\
        <div class="wai-cb-settings-section__header" @click="toggleSection(\'image\')">\
            <i :class="expandedSections.image ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'" class="wai-cb-settings-section__toggle"></i>\
            <span class="wai-cb-settings-section__title">이미지 설정</span>\
        </div>\
        <div class="wai-cb-settings-section__body" v-show="expandedSections.image">\
            <div class="wai-cb-row"><span class="wai-cb-label">엔진</span><select class="wai-cb-select wai-cb-grow" :value="settings.image.engine" @change="onImageChange(\'engine\', $event.target.value)"><option v-for="eng in imageEngines" :key="eng.id" :value="eng.id">{{ eng.label }}</option></select></div>\
            <div class="wai-cb-row"><span class="wai-cb-label">스타일</span><select class="wai-cb-select wai-cb-grow" :value="settings.image.style" @change="onImageChange(\'style\', $event.target.value)"><option v-for="sty in imageStyles" :key="sty.id" :value="sty.id">{{ sty.label }}</option></select></div>\
            <div class="wai-cb-row"><span class="wai-cb-label">품질</span><select class="wai-cb-select" :value="settings.image.quality" @change="onImageChange(\'quality\', $event.target.value)"><option value="standard">Standard</option><option value="hd">HD</option></select></div>\
        </div>\
    </div>\
    <!-- 전역 액션 버튼 -->\
    <div class="wai-cb-global-actions">\
        <button class="wai-cb-btn" @click="$emit(\'generate-all-tts\')">전체 TTS</button>\
        <button class="wai-cb-btn" @click="$emit(\'generate-all-images\')">전체 IMG</button>\
    </div>\
</div>\
    '
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 7-B: Vue 컴포넌트 - ClipBoxManager (메인)
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxManager = {
    name: 'ClipBoxManager',
    components: {
        'clip-box-item': ClipBoxItem,
        'clip-box-global-settings': ClipBoxGlobalSettings
    },
    props: {
        canvasBoxes: { type: Array, default: function() { return []; } }
    },
    data: function() {
        return {
            globalSettings: WAICB.createDefaultGlobalSettings(),
            clips: [],
            isCollapsed: false,
            showGlobalSettings: false,
            selectedClipId: null,
            selectedPrompt: null
        };
    },
    computed: {
        clipCount: function() { return this.clips.length; },
        activeSlots: function() {
            if (!this.canvasBoxes || this.canvasBoxes.length === 0) return [];
            return this.canvasBoxes.filter(function(box) { return box.slotKey && !box.isHidden; }).map(function(box) {
                return { slotKey: box.slotKey, colRole: box.colRole, rowType: box.rowType, layerName: box.layerName, color: box.color };
            });
        }
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
        toggleGlobalSettings: function() { this.showGlobalSettings = !this.showGlobalSettings; },
        onGlobalSettingUpdate: function(path, value) {
            WAICB.Store.setGlobalField(path, value);
            this.globalSettings = WAICB.Store.getGlobalSettings();
            if (path === 'project.aspectRatio') this.notifyAspectRatioChange(value);
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
        onGenerateAllTTS: function() {
            var self = this;
            var targets = this.clips.filter(function(c) { return c.rawText && c.voiceStatus !== 'done'; });
            if (targets.length === 0) { WAICB.Toast.warning('생성할 클립이 없습니다'); return; }
            WAICB.Toast.info(targets.length + '개 클립 TTS 생성 시작');
            targets.forEach(function(clip) { self.onGenerateTTS(clip.id); });
        },
        onGenerateAllImages: function() {
            var self = this;
            var targets = this.clips.filter(function(c) { return c.imagePrompt && c.imageStatus !== 'done'; });
            if (targets.length === 0) { WAICB.Toast.warning('생성할 클립이 없습니다'); return; }
            WAICB.Toast.info(targets.length + '개 클립 이미지 생성 시작');
            targets.forEach(function(clip) { self.onGenerateImage(clip.id); });
        },
        openPromptManager: function() {
            document.dispatchEvent(new CustomEvent('wai-open-asset-modal', { detail: { tab: 'prompt' } }));
        },
        editPrompt: function() {
            if (!this.selectedPrompt) {
                WAICB.Toast.warning('선택된 프롬프트가 없습니다');
                return;
            }
            document.dispatchEvent(new CustomEvent('wai-open-asset-modal', { detail: { tab: 'prompt', editId: this.selectedPrompt.id } }));
        }
    },
    template: '\
<div id="clipbox-manager-root" class="wai-cb-root">\
    <div class="wai-cb-header" @click="toggleCollapse">\
        <div class="wai-cb-header__left">\
            <i :class="isCollapsed ? \'fas fa-chevron-right\' : \'fas fa-chevron-down\'" class="wai-cb-header__toggle"></i>\
            <i class="fas fa-layer-group wai-cb-header__icon"></i>\
            <span class="wai-cb-header__title">클립박스 매니저</span>\
        </div>\
        <div class="wai-cb-header__right">\
            <button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--icon" @click.stop="addClip" title="클립 추가"><i class="fas fa-plus"></i></button>\
        </div>\
    </div>\
    <template v-if="!isCollapsed">\
        <div class="wai-cb-settings-toggle" @click="toggleGlobalSettings">\
            <i :class="showGlobalSettings ? \'fas fa-chevron-down\' : \'fas fa-chevron-right\'"></i>\
            <span>전역 설정</span>\
        </div>\
        <div v-if="showGlobalSettings" class="wai-cb-global-panel">\
            <clip-box-global-settings\
                :settings="globalSettings"\
                :selected-prompt="selectedPrompt"\
                @update="onGlobalSettingUpdate"\
                @generate-all-tts="onGenerateAllTTS"\
                @generate-all-images="onGenerateAllImages"\
                @open-prompt-manager="openPromptManager"\
                @edit-prompt="editPrompt"\
            ></clip-box-global-settings>\
        </div>\
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
