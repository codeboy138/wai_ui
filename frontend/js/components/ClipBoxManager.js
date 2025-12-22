/* ═══════════════════════════════════════════════════════════════════════════
   WAI-UI ClipBox Manager v2.1
   파일: js/components/ClipBoxManager.js
   
   변경사항 (v2.1):
   - 슬롯 설정 UI 구현 완료
   - LayerPanel 연동 (activeSlots)
   - 텍스트/배경 슬롯 바인딩
   
   구조:
   - Part 1: 블록 1~4 (상수, 유틸리티, Store, 토큰화)
   - Part 2: 블록 5~6 (병합 함수, ClipBoxItem 컴포넌트)
   - Part 3: 블록 7 (ClipBoxManager 메인 컴포넌트)
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   블록 1: 전역 네임스페이스 및 상수
   ───────────────────────────────────────────────────────────────────────────── */
window.WAICB = window.WAICB || {};

WAICB.CONST = {
    STORAGE_KEY: 'waicb_v2_data',
    AUTOSAVE_DELAY: 2000,
    TOAST_DURATION: 3000,
    
    // 화면 비율 옵션
    ASPECT_RATIOS: {
        '9:16': { w: 1080, h: 1920, label: '쇼츠 (9:16)' },
        '16:9': { w: 1920, h: 1080, label: '가로 (16:9)' },
        '1:1': { w: 1080, h: 1080, label: '정사각 (1:1)' },
        '4:5': { w: 1080, h: 1350, label: '인스타 (4:5)' }
    },
    
    // 슬롯 정의 (LayerPanel 연동)
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
    
    // 엔진 옵션
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
    
    // 보이스 프리셋
    VOICE_PRESETS: [
        { id: 'ko-KR-InJoonNeural', label: '한국어 남성 (InJoon)', engine: 'azure' },
        { id: 'ko-KR-SunHiNeural', label: '한국어 여성 (SunHi)', engine: 'azure' },
        { id: 'ko-KR-Wavenet-A', label: '한국어 남성 A', engine: 'google' },
        { id: 'ko-KR-Wavenet-B', label: '한국어 여성 B', engine: 'google' }
    ],
    
    // 이미지 스타일 프리셋
    IMAGE_STYLES: [
        { id: 'ghibli', label: '지브리 스타일' },
        { id: 'realistic', label: '실사풍' },
        { id: 'anime', label: '애니메이션' },
        { id: 'watercolor', label: '수채화' },
        { id: 'cinematic', label: '시네마틱' }
    ]
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

/* ─────────────────────────────────────────────────────────────────────────────
   토스트 알림 시스템
   ───────────────────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────────────────
   이벤트 버스 (컴포넌트 간 통신)
   ───────────────────────────────────────────────────────────────────────────── */
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

/* 기본 설정값 생성 함수 */
WAICB.createDefaultGlobalSettings = function() {
    return {
        // 프로젝트 설정
        project: {
            aspectRatio: '9:16'
        },
        
        // 텍스트 스타일
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
        
        // 미디어 기본값 (슬롯별)
        mediaDefaults: {
            'full_bg': { src: null, type: 'none', fit: 'cover' },
            'high_bg': { src: null, type: 'none', fit: 'cover' },
            'mid_bg': { src: null, type: 'none', fit: 'cover' },
            'low_bg': { src: null, type: 'none', fit: 'cover' }
        },
        
        // 보이스 설정
        voice: {
            engine: 'azure',
            voiceId: 'ko-KR-InJoonNeural',
            speed: 1.0,
            pitch: 0,
            volume: 100,
            defaultDirecting: ''
        },
        
        // 이미지 생성 설정
        image: {
            engine: 'dalle',
            style: 'ghibli',
            quality: 'hd',
            aspectRatio: '9:16',
            defaultPrefix: ''
        }
    };
};

/* 기본 클립 데이터 생성 함수 */
WAICB.createDefaultClip = function(order) {
    return {
        id: WAICB.Utils.uuid(),
        order: order || 0,
        
        // 텍스트
        rawText: '',
        tokens: [],
        
        // 오버라이드 (null이면 전역 사용)
        textStyleOverride: null,
        mediaOverride: null,
        voiceOverride: null,
        
        // 슬롯별 바인딩
        slotBindings: {},
        
        // 이미지 생성
        imagePrompt: '',
        imageStatus: 'idle',
        imageSrc: null,
        
        // 보이스 생성
        voiceDirecting: '',
        voiceStatus: 'idle',
        voiceSrc: null,
        
        // UI 상태
        isExpanded: false,
        expandedSections: {
            image: false,
            voice: false,
            slots: false
        },
        
        // 타이밍
        duration: 5.0,
        startTime: 0
    };
};

/* Store 모듈 */
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
            version: 2,
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
    
    function insertSilence(tokens, afterIndex, duration) {
        duration = duration || 0.3;
        
        var silence = {
            id: WAICB.Utils.tokenId(),
            type: 'silence',
            duration: duration
        };
        
        tokens.splice(afterIndex + 1, 0, silence);
        return silence;
    }
    
    function removeToken(tokens, tokenId) {
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i].id === tokenId) {
                tokens.splice(i, 1);
                return true;
            }
        }
        return false;
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
        insertSilence: insertSilence,
        removeToken: removeToken,
        getStats: getStats,
        isParticle: isParticle
    };
})();

/* ═══════════════════════════════════════════════════════════════════════════
   ──── Part 1 끝 (약 480줄) ────
   ──── Part 2 시작: 블록 5~6 (병합 함수, ClipBoxItem) ────
   ═══════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
   ──── Part 1에서 연결 ────
   ──── Part 2: 블록 5~6 (병합 함수, ClipBoxItem 컴포넌트) ────
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   블록 5: 병합 함수 (Resolver)
   
   3단계 상속 구조:
   전역 설정 (ClipBoxManager)
       ↓ 상속 (override 가능)
   클립 오버라이드 (ClipBoxItem)
       ↓ 상속 (override 가능)
   슬롯 오버라이드 (SlotBinding)
   ───────────────────────────────────────────────────────────────────────────── */

WAICB.Resolver = (function() {
    
    /**
     * 텍스트 스타일 병합 (전역 → 클립 → 슬롯)
     */
    function resolveTextStyle(globalStyle, clipOverride, slotOverride) {
        var result = WAICB.Utils.clone(globalStyle || {});
        
        if (clipOverride) {
            result = WAICB.Utils.deepMerge(result, clipOverride);
        }
        
        if (slotOverride) {
            result = WAICB.Utils.deepMerge(result, slotOverride);
        }
        
        return result;
    }
    
    /**
     * 미디어 설정 병합 (전역 → 클립)
     */
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
    
    /**
     * 보이스 설정 병합 (전역 → 클립)
     */
    function resolveVoice(globalVoice, clipOverride) {
        var result = WAICB.Utils.clone(globalVoice || {});
        
        if (clipOverride) {
            result = WAICB.Utils.deepMerge(result, clipOverride);
        }
        
        return result;
    }
    
    /**
     * 이미지 설정 병합 (전역 → 클립)
     */
    function resolveImage(globalImage, clipOverride) {
        var result = WAICB.Utils.clone(globalImage || {});
        
        if (clipOverride) {
            result = WAICB.Utils.deepMerge(result, clipOverride);
        }
        
        return result;
    }
    
    /**
     * 슬롯 바인딩에서 텍스트 가져오기
     */
    function getSlotText(clip, slotKey) {
        if (!clip || !clip.slotBindings || !clip.slotBindings[slotKey]) {
            return '';
        }
        return clip.slotBindings[slotKey].text || '';
    }
    
    /**
     * 슬롯 바인딩 설정
     */
    function setSlotBinding(clip, slotKey, binding) {
        if (!clip.slotBindings) {
            clip.slotBindings = {};
        }
        
        if (!clip.slotBindings[slotKey]) {
            clip.slotBindings[slotKey] = {};
        }
        
        clip.slotBindings[slotKey] = WAICB.Utils.deepMerge(
            clip.slotBindings[slotKey],
            binding
        );
    }
    
    /**
     * 슬롯 키 파싱 (예: 'mid_text' → { role: 'mid', type: 'text' })
     */
    function parseSlotKey(slotKey) {
        if (!slotKey) return null;
        var parts = slotKey.split('_');
        if (parts.length < 2) return null;
        return {
            role: parts[0],
            type: parts[1]
        };
    }
    
    /**
     * 슬롯 레이블 생성
     */
    function getSlotLabel(slotKey) {
        var parsed = parseSlotKey(slotKey);
        if (!parsed) return slotKey;
        
        var roleLabel = WAICB.CONST.SLOT_ROLE_LABELS[parsed.role] || parsed.role;
        var typeLabel = WAICB.CONST.SLOT_TYPE_LABELS[parsed.type] || parsed.type;
        
        return roleLabel + ' ' + typeLabel;
    }
    
    /**
     * 슬롯 아이콘 반환
     */
    function getSlotIcon(slotKey) {
        var parsed = parseSlotKey(slotKey);
        if (!parsed) return '📦';
        
        if (parsed.type === 'text') return '📝';
        if (parsed.type === 'bg') return '🖼';
        if (parsed.type === 'effect') return '✨';
        return '📦';
    }
    
    /**
     * 클립을 캔버스 박스에 적용
     */
    function applyClipToCanvas(clip, canvasBoxes, globalSettings) {
        if (!clip || !canvasBoxes || !globalSettings) return;
        
        canvasBoxes.forEach(function(box) {
            var slotKey = box.slotKey;
            if (!slotKey) return;
            
            var binding = clip.slotBindings ? clip.slotBindings[slotKey] : null;
            var parsed = parseSlotKey(slotKey);
            
            // 텍스트 슬롯인 경우
            if (parsed && parsed.type === 'text') {
                if (binding && binding.text !== undefined) {
                    box.textContent = binding.text;
                }
                
                box.textStyle = resolveTextStyle(
                    globalSettings.textStyle,
                    clip.textStyleOverride,
                    binding ? binding.textStyleOverride : null
                );
            }
            
            // 배경 슬롯인 경우
            if (parsed && parsed.type === 'bg') {
                // 바인딩에서 클립 이미지 사용 여부 확인
                var useClipImage = !binding || binding.useClipImage !== false;
                
                if (useClipImage && clip.imageSrc && clip.imageStatus === 'done') {
                    box.mediaSrc = clip.imageSrc;
                    box.mediaType = 'image';
                    box.mediaFit = 'cover';
                } else if (binding && binding.mediaSrc) {
                    box.mediaSrc = binding.mediaSrc;
                    box.mediaType = binding.mediaType || 'image';
                    box.mediaFit = binding.mediaFit || 'cover';
                } else {
                    var media = resolveMedia(
                        slotKey,
                        globalSettings.mediaDefaults,
                        clip.mediaOverride
                    );
                    box.mediaSrc = media.src;
                    box.mediaType = media.type;
                    box.mediaFit = media.fit;
                }
            }
        });
    }
    
    /**
     * 화면 비율에 따른 캔버스 크기 계산
     */
    function getCanvasSize(aspectRatio) {
        var config = WAICB.CONST.ASPECT_RATIOS[aspectRatio];
        if (config) {
            return { w: config.w, h: config.h };
        }
        return { w: 1080, h: 1920 };
    }
    
    /**
     * 클립의 전체 설정 해석 (미리보기용)
     */
    function resolveClipSettings(clip, globalSettings) {
        return {
            textStyle: resolveTextStyle(
                globalSettings.textStyle,
                clip.textStyleOverride,
                null
            ),
            voice: resolveVoice(
                globalSettings.voice,
                clip.voiceOverride
            ),
            image: resolveImage(
                globalSettings.image,
                null
            ),
            voiceDirecting: clip.voiceDirecting || globalSettings.voice.defaultDirecting || '',
            imagePrompt: clip.imagePrompt || ''
        };
    }
    
    return {
        resolveTextStyle: resolveTextStyle,
        resolveMedia: resolveMedia,
        resolveVoice: resolveVoice,
        resolveImage: resolveImage,
        getSlotText: getSlotText,
        setSlotBinding: setSlotBinding,
        parseSlotKey: parseSlotKey,
        getSlotLabel: getSlotLabel,
        getSlotIcon: getSlotIcon,
        applyClipToCanvas: applyClipToCanvas,
        getCanvasSize: getCanvasSize,
        resolveClipSettings: resolveClipSettings
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6: Vue 컴포넌트 - ClipBoxTokens
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
                <span\
                    v-for="(token, idx) in tokens"\
                    :key="token.id"\
                    class="wai-cb-token"\
                    :class="tokenClass(token)"\
                    @contextmenu.prevent="onContextMenu($event, token, idx)"\
                >\
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
        },
        
        onContextMenu: function(e, token, idx) {
            this.$emit('token-context', { event: e, token: token, index: idx });
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6-B: Vue 컴포넌트 - ClipBoxSlotSettings (신규)
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
            var self = this;
            return this.activeSlots.filter(function(slot) {
                var parsed = WAICB.Resolver.parseSlotKey(slot.slotKey);
                return parsed && parsed.type === 'text';
            });
        },
        
        bgSlots: function() {
            var self = this;
            return this.activeSlots.filter(function(slot) {
                var parsed = WAICB.Resolver.parseSlotKey(slot.slotKey);
                return parsed && parsed.type === 'bg';
            });
        },
        
        effectSlots: function() {
            var self = this;
            return this.activeSlots.filter(function(slot) {
                var parsed = WAICB.Resolver.parseSlotKey(slot.slotKey);
                return parsed && parsed.type === 'effect';
            });
        },
        
        hasSlots: function() {
            return this.activeSlots.length > 0;
        },
        
        hasTextSlots: function() {
            return this.textSlots.length > 0;
        },
        
        hasBgSlots: function() {
            return this.bgSlots.length > 0;
        }
    },
    
    methods: {
        getSlotLabel: function(slotKey) {
            return WAICB.Resolver.getSlotLabel(slotKey);
        },
        
        getSlotIcon: function(slotKey) {
            return WAICB.Resolver.getSlotIcon(slotKey);
        },
        
        getBindingText: function(slotKey) {
            var bindings = this.clip.slotBindings || {};
            var binding = bindings[slotKey];
            return binding ? (binding.text || '') : '';
        },
        
        usesClipImage: function(slotKey) {
            var bindings = this.clip.slotBindings || {};
            var binding = bindings[slotKey];
            return !binding || binding.useClipImage !== false;
        },
        
        hasCustomMedia: function(slotKey) {
            var bindings = this.clip.slotBindings || {};
            var binding = bindings[slotKey];
            return binding && binding.mediaSrc;
        },
        
        onTextChange: function(slotKey, event) {
            this.$emit('update-binding', slotKey, { text: event.target.value });
        },
        
        onToggleClipImage: function(slotKey) {
            var current = this.usesClipImage(slotKey);
            this.$emit('update-binding', slotKey, { useClipImage: !current });
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
    <!-- 슬롯 없음 -->\
    <div v-if="!hasSlots" class="wai-cb-slots-empty">\
        <span class="wai-cb-text--hint">활성화된 슬롯이 없습니다.</span>\
        <span class="wai-cb-text--hint">LayerPanel에서 슬롯을 추가하세요.</span>\
    </div>\
    \
    <!-- 텍스트 슬롯 -->\
    <div v-if="hasTextSlots" class="wai-cb-slot-group">\
        <div class="wai-cb-slot-group__header">\
            <span class="wai-cb-label">📝 텍스트 슬롯</span>\
        </div>\
        <div v-for="slot in textSlots" :key="slot.slotKey" class="wai-cb-slot-item">\
            <div class="wai-cb-slot-item__header">\
                <span class="wai-cb-slot-item__label">{{ getSlotLabel(slot.slotKey) }}</span>\
                <div class="wai-cb-slot-item__actions">\
                    <button \
                        class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" \
                        @click="copyRawTextToSlot(slot.slotKey)" \
                        title="클립 텍스트 복사"\
                    >📋</button>\
                    <button \
                        class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" \
                        @click="clearSlotText(slot.slotKey)" \
                        title="지우기"\
                    >✕</button>\
                </div>\
            </div>\
            <textarea \
                class="wai-cb-textarea wai-cb-textarea--sm" \
                :value="getBindingText(slot.slotKey)" \
                @input="onTextChange(slot.slotKey, $event)" \
                placeholder="슬롯에 표시할 텍스트..." \
                rows="2"\
            ></textarea>\
        </div>\
    </div>\
    \
    <!-- 배경 슬롯 -->\
    <div v-if="hasBgSlots" class="wai-cb-slot-group">\
        <div class="wai-cb-slot-group__header">\
            <span class="wai-cb-label">🖼 배경 슬롯</span>\
        </div>\
        <div v-for="slot in bgSlots" :key="slot.slotKey" class="wai-cb-slot-item">\
            <div class="wai-cb-slot-item__header">\
                <span class="wai-cb-slot-item__label">{{ getSlotLabel(slot.slotKey) }}</span>\
            </div>\
            <div class="wai-cb-slot-item__body">\
                <label class="wai-cb-checkbox-label">\
                    <input \
                        type="checkbox" \
                        class="wai-cb-checkbox" \
                        :checked="usesClipImage(slot.slotKey)" \
                        @change="onToggleClipImage(slot.slotKey)" \
                    />\
                    <span>클립 생성 이미지 사용</span>\
                </label>\
                <div v-if="!usesClipImage(slot.slotKey)" class="wai-cb-slot-media">\
                    <span class="wai-cb-text--hint">커스텀 미디어 선택 (추후 구현)</span>\
                </div>\
                <div v-else-if="clip.imageSrc" class="wai-cb-slot-preview">\
                    <img :src="clip.imageSrc" class="wai-cb-slot-preview__img" />\
                </div>\
                <div v-else class="wai-cb-slot-preview wai-cb-slot-preview--empty">\
                    <span class="wai-cb-text--hint">이미지 생성 필요</span>\
                </div>\
            </div>\
        </div>\
    </div>\
</div>\
    '
};

/* ─────────────────────────────────────────────────────────────────────────────
   블록 6-C: Vue 컴포넌트 - ClipBoxItem (메인)
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxItem = {
    name: 'ClipBoxItem',
    
    components: {
        'clip-box-tokens': ClipBoxTokens,
        'clip-box-slot-settings': ClipBoxSlotSettings
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
        clipNumber: function() {
            return '#' + (this.index + 1);
        },
        
        voiceStatusIcon: function() {
            var status = this.clip.voiceStatus;
            if (status === 'done') return '🎙●';
            if (status === 'generating') return '🎙◐';
            if (status === 'error') return '🎙✕';
            return '🎙○';
        },
        
        imageStatusIcon: function() {
            var status = this.clip.imageStatus;
            if (status === 'done') return '🖼●';
            if (status === 'generating') return '🖼◐';
            if (status === 'error') return '🖼✕';
            return '🖼○';
        },
        
        voiceStatusClass: function() {
            return 'wai-cb-status--' + (this.clip.voiceStatus || 'idle');
        },
        
        imageStatusClass: function() {
            return 'wai-cb-status--' + (this.clip.imageStatus || 'idle');
        },
        
        tokenStats: function() {
            return WAICB.Tokenizer.getStats(this.clip.tokens);
        },
        
        resolvedVoice: function() {
            return WAICB.Resolver.resolveVoice(
                this.globalSettings.voice,
                this.clip.voiceOverride
            );
        },
        
        useGlobalVoice: function() {
            return !this.clip.voiceOverride;
        },
        
        activeSlotsCount: function() {
            return this.activeSlots.length;
        },
        
        boundSlotsCount: function() {
            var bindings = this.clip.slotBindings || {};
            var count = 0;
            for (var key in bindings) {
                if (bindings.hasOwnProperty(key) && (bindings[key].text || bindings[key].mediaSrc)) {
                    count++;
                }
            }
            return count;
        }
    },
    
    watch: {
        'clip.rawText': function(newVal) {
            this.localText = newVal || '';
        }
    },
    
    methods: {
        onTextInput: function(e) {
            var self = this;
            var text = e.target.value;
            this.localText = text;
            
            clearTimeout(this.textInputTimer);
            this.textInputTimer = setTimeout(function() {
                self.updateText(text);
            }, 300);
        },
        
        updateText: function(text) {
            var tokens = WAICB.Tokenizer.tokenize(text);
            this.$emit('update', this.clip.id, {
                rawText: text,
                tokens: tokens
            });
        },
        
        toggleExpand: function() {
            this.$emit('update', this.clip.id, {
                isExpanded: !this.clip.isExpanded
            });
        },
        
        toggleSection: function(section) {
            var sections = WAICB.Utils.clone(this.clip.expandedSections || {});
            sections[section] = !sections[section];
            this.$emit('update', this.clip.id, {
                expandedSections: sections
            });
        },
        
        isSectionExpanded: function(section) {
            return this.clip.expandedSections && this.clip.expandedSections[section];
        },
        
        onDelete: function() {
            if (confirm('클립 ' + this.clipNumber + '을(를) 삭제하시겠습니까?')) {
                this.$emit('delete', this.clip.id);
            }
        },
        
        openSettings: function() {
            WAICB.Toast.info('클립 설정 (구현 예정)');
        },
        
        onImagePromptChange: function(e) {
            this.$emit('update', this.clip.id, {
                imagePrompt: e.target.value
            });
        },
        
        onVoiceDirectingChange: function(e) {
            this.$emit('update', this.clip.id, {
                voiceDirecting: e.target.value
            });
        },
        
        toggleGlobalVoice: function() {
            if (this.useGlobalVoice) {
                this.$emit('update', this.clip.id, {
                    voiceOverride: WAICB.Utils.clone(this.globalSettings.voice)
                });
            } else {
                this.$emit('update', this.clip.id, {
                    voiceOverride: null
                });
            }
        },
        
        onVoiceFieldChange: function(field, value) {
            var override = WAICB.Utils.clone(this.clip.voiceOverride || {});
            override[field] = value;
            this.$emit('update', this.clip.id, {
                voiceOverride: override
            });
        },
        
        generateTTS: function() {
            this.$emit('generate-tts', this.clip.id);
        },
        
        generateImage: function() {
            this.$emit('generate-image', this.clip.id);
        },
        
        onTokenContext: function(data) {
            console.log('Token context:', data);
        },
        
        // 슬롯 바인딩 업데이트
        onSlotBindingUpdate: function(slotKey, bindingData) {
            var bindings = WAICB.Utils.clone(this.clip.slotBindings || {});
            
            if (!bindings[slotKey]) {
                bindings[slotKey] = {};
            }
            
            bindings[slotKey] = WAICB.Utils.deepMerge(bindings[slotKey], bindingData);
            
            this.$emit('update', this.clip.id, {
                slotBindings: bindings
            });
        }
    },
    
    created: function() {
        this.voicePresets = WAICB.CONST.VOICE_PRESETS;
    },
    
    template: '\
<div class="wai-cb-panel wai-cb-clip" :class="{ \'wai-cb-clip--expanded\': clip.isExpanded }">\
    <!-- 헤더 -->\
    <div class="wai-cb-clip__header">\
        <div class="wai-cb-clip__title">\
            <span class="wai-cb-clip__number">{{ clipNumber }}</span>\
            <span class="wai-cb-clip__status" :class="voiceStatusClass">{{ voiceStatusIcon }}</span>\
            <span class="wai-cb-clip__status" :class="imageStatusClass">{{ imageStatusIcon }}</span>\
        </div>\
        <div class="wai-cb-clip__actions">\
            <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="openSettings" title="클립 설정">\
                <span>⚙</span>\
            </button>\
            <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="toggleExpand" :title="clip.isExpanded ? \'접기\' : \'펼치기\'">\
                <span>{{ clip.isExpanded ? "▲" : "▼" }}</span>\
            </button>\
        </div>\
    </div>\
    \
    <!-- 텍스트 입력 (항상 표시) -->\
    <div class="wai-cb-clip__text">\
        <textarea\
            class="wai-cb-textarea"\
            :value="localText"\
            @input="onTextInput"\
            placeholder="텍스트를 입력하세요..."\
            rows="2"\
        ></textarea>\
    </div>\
    \
    <!-- 토큰 미리보기 (항상 표시) -->\
    <div class="wai-cb-clip__tokens">\
        <clip-box-tokens\
            :tokens="clip.tokens"\
            :clip-id="clip.id"\
            @token-context="onTokenContext"\
        ></clip-box-tokens>\
    </div>\
    \
    <!-- 접이식 섹션들 -->\
    <div class="wai-cb-clip__sections">\
        \
        <!-- 이미지 생성 섹션 -->\
        <div class="wai-cb-section">\
            <div class="wai-cb-section__header" @click="toggleSection(\'image\')">\
                <span class="wai-cb-section__toggle">{{ isSectionExpanded("image") ? "▼" : "▶" }}</span>\
                <span class="wai-cb-section__title">이미지 생성</span>\
                <span class="wai-cb-section__status" :class="imageStatusClass">{{ clip.imageStatus === "done" ? "완료" : clip.imageStatus === "generating" ? "생성중..." : "" }}</span>\
            </div>\
            <div class="wai-cb-section__body" v-show="isSectionExpanded(\'image\')">\
                <textarea\
                    class="wai-cb-textarea wai-cb-textarea--sm"\
                    :value="clip.imagePrompt"\
                    @input="onImagePromptChange"\
                    placeholder="이미지 생성 프롬프트..."\
                    rows="2"\
                ></textarea>\
                <div class="wai-cb-section__actions">\
                    <button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--xs" @click="generateImage" :disabled="clip.imageStatus === \'generating\'">\
                        생성\
                    </button>\
                    <button v-if="clip.imageSrc" class="wai-cb-btn wai-cb-btn--xs">미리보기</button>\
                </div>\
                <div v-if="clip.imageSrc" class="wai-cb-section__preview">\
                    <img :src="clip.imageSrc" class="wai-cb-img-preview" />\
                </div>\
            </div>\
        </div>\
        \
        <!-- 보이스 생성 섹션 -->\
        <div class="wai-cb-section">\
            <div class="wai-cb-section__header" @click="toggleSection(\'voice\')">\
                <span class="wai-cb-section__toggle">{{ isSectionExpanded("voice") ? "▼" : "▶" }}</span>\
                <span class="wai-cb-section__title">보이스 생성</span>\
                <span class="wai-cb-section__status" :class="voiceStatusClass">{{ clip.voiceStatus === "done" ? "완료" : clip.voiceStatus === "generating" ? "생성중..." : "" }}</span>\
            </div>\
            <div class="wai-cb-section__body" v-show="isSectionExpanded(\'voice\')">\
                <div class="wai-cb-row">\
                    <label class="wai-cb-checkbox-label">\
                        <input type="checkbox" class="wai-cb-checkbox" :checked="useGlobalVoice" @change="toggleGlobalVoice" />\
                        <span>전역 설정 사용</span>\
                    </label>\
                </div>\
                <div v-if="!useGlobalVoice" class="wai-cb-voice-override">\
                    <div class="wai-cb-row">\
                        <span class="wai-cb-label">음성</span>\
                        <select class="wai-cb-select wai-cb-grow" :value="resolvedVoice.voiceId" @change="onVoiceFieldChange(\'voiceId\', $event.target.value)">\
                            <option v-for="preset in voicePresets" :key="preset.id" :value="preset.id">{{ preset.label }}</option>\
                        </select>\
                    </div>\
                    <div class="wai-cb-row">\
                        <span class="wai-cb-label">속도</span>\
                        <input type="number" class="wai-cb-input wai-cb-input--number" :value="resolvedVoice.speed" @change="onVoiceFieldChange(\'speed\', parseFloat($event.target.value))" min="0.5" max="2.0" step="0.1" />\
                    </div>\
                </div>\
                <div class="wai-cb-field">\
                    <span class="wai-cb-label">디렉팅</span>\
                    <textarea\
                        class="wai-cb-textarea wai-cb-textarea--sm"\
                        :value="clip.voiceDirecting"\
                        @input="onVoiceDirectingChange"\
                        :placeholder="globalSettings.voice.defaultDirecting || \'음성 디렉팅 (예: 차분하고 무게감 있게)\'"\
                        rows="2"\
                    ></textarea>\
                </div>\
                <div class="wai-cb-section__actions">\
                    <button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--xs" @click="generateTTS" :disabled="clip.voiceStatus === \'generating\'">\
                        생성\
                    </button>\
                    <button v-if="clip.voiceSrc" class="wai-cb-btn wai-cb-btn--xs">미리듣기</button>\
                </div>\
            </div>\
        </div>\
        \
        <!-- 슬롯 설정 섹션 (v2.1 신규) -->\
        <div class="wai-cb-section">\
            <div class="wai-cb-section__header" @click="toggleSection(\'slots\')">\
                <span class="wai-cb-section__toggle">{{ isSectionExpanded("slots") ? "▼" : "▶" }}</span>\
                <span class="wai-cb-section__title">슬롯 설정</span>\
                <span class="wai-cb-section__status">{{ boundSlotsCount }}/{{ activeSlotsCount }}</span>\
            </div>\
            <div class="wai-cb-section__body" v-show="isSectionExpanded(\'slots\')">\
                <clip-box-slot-settings\
                    :clip="clip"\
                    :global-settings="globalSettings"\
                    :active-slots="activeSlots"\
                    @update-binding="onSlotBindingUpdate"\
                ></clip-box-slot-settings>\
            </div>\
        </div>\
        \
    </div>\
    \
    <!-- 하단 액션 (확장 시에만) -->\
    <div v-if="clip.isExpanded" class="wai-cb-clip__footer">\
        <button class="wai-cb-btn wai-cb-btn--danger wai-cb-btn--xs" @click="onDelete">\
            삭제\
        </button>\
    </div>\
</div>\
    '
};

/* ═══════════════════════════════════════════════════════════════════════════
   ──── Part 2 끝 (약 650줄) ────
   ──── Part 3 시작: 블록 7 (ClipBoxManager 메인, 전역 설정, CSS 추가) ────
   ═══════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
   ──── Part 2에서 연결 ────
   ──── Part 3: 블록 7 (ClipBoxManager 메인, 전역 설정 컴포넌트) ────
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   블록 7-A: Vue 컴포넌트 - ClipBoxGlobalSettings
   ───────────────────────────────────────────────────────────────────────────── */

var ClipBoxGlobalSettings = {
    name: 'ClipBoxGlobalSettings',
    
    props: {
        settings: { type: Object, required: true }
    },
    
    emits: ['update', 'generate-all-tts', 'generate-all-images'],
    
    data: function() {
        return {
            expandedSections: {
                project: true,
                textStyle: false,
                media: false,
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
        
        voiceEngines: function() {
            return WAICB.CONST.VOICE_ENGINES;
        },
        
        voicePresets: function() {
            return WAICB.CONST.VOICE_PRESETS;
        },
        
        imageEngines: function() {
            return WAICB.CONST.IMAGE_ENGINES;
        },
        
        imageStyles: function() {
            return WAICB.CONST.IMAGE_STYLES;
        }
    },
    
    methods: {
        toggleSection: function(section) {
            this.expandedSections[section] = !this.expandedSections[section];
        },
        
        updateField: function(path, value) {
            this.$emit('update', path, value);
        },
        
        onAspectRatioChange: function(e) {
            this.updateField('project.aspectRatio', e.target.value);
        },
        
        onTextStyleChange: function(field, value) {
            this.updateField('textStyle.' + field, value);
        },
        
        onVoiceChange: function(field, value) {
            this.updateField('voice.' + field, value);
        },
        
        onImageChange: function(field, value) {
            this.updateField('image.' + field, value);
        }
    },
    
    template: '\
<div class="wai-cb-global-settings">\
    \
    <!-- 프로젝트 설정 -->\
    <div class="wai-cb-settings-section">\
        <div class="wai-cb-settings-section__header" @click="toggleSection(\'project\')">\
            <span class="wai-cb-settings-section__toggle">{{ expandedSections.project ? "▼" : "▶" }}</span>\
            <span class="wai-cb-settings-section__title">프로젝트 설정</span>\
        </div>\
        <div class="wai-cb-settings-section__body" v-show="expandedSections.project">\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">화면 비율</span>\
                <select class="wai-cb-select wai-cb-grow" :value="settings.project.aspectRatio" @change="onAspectRatioChange">\
                    <option v-for="opt in aspectRatioOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>\
                </select>\
            </div>\
        </div>\
    </div>\
    \
    <!-- 텍스트 스타일 -->\
    <div class="wai-cb-settings-section">\
        <div class="wai-cb-settings-section__header" @click="toggleSection(\'textStyle\')">\
            <span class="wai-cb-settings-section__toggle">{{ expandedSections.textStyle ? "▼" : "▶" }}</span>\
            <span class="wai-cb-settings-section__title">텍스트 스타일</span>\
        </div>\
        <div class="wai-cb-settings-section__body" v-show="expandedSections.textStyle">\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">폰트</span>\
                <select class="wai-cb-select wai-cb-grow" :value="settings.textStyle.fontFamily" @change="onTextStyleChange(\'fontFamily\', $event.target.value)">\
                    <option value="Pretendard">Pretendard</option>\
                    <option value="Noto Sans KR">Noto Sans KR</option>\
                    <option value="Nanum Gothic">나눔고딕</option>\
                </select>\
            </div>\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">크기</span>\
                <input type="number" class="wai-cb-input wai-cb-input--number" :value="settings.textStyle.fontSize" @change="onTextStyleChange(\'fontSize\', parseInt($event.target.value))" min="12" max="200" />\
                <span class="wai-cb-label--unit">px</span>\
            </div>\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">색상</span>\
                <input type="color" class="wai-cb-input wai-cb-input--color" :value="settings.textStyle.fillColor" @change="onTextStyleChange(\'fillColor\', $event.target.value)" />\
                <span class="wai-cb-label">테두리</span>\
                <input type="color" class="wai-cb-input wai-cb-input--color" :value="settings.textStyle.strokeColor" @change="onTextStyleChange(\'strokeColor\', $event.target.value)" />\
                <input type="number" class="wai-cb-input wai-cb-input--number" :value="settings.textStyle.strokeWidth" @change="onTextStyleChange(\'strokeWidth\', parseInt($event.target.value))" min="0" max="20" />\
            </div>\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">정렬</span>\
                <select class="wai-cb-select" :value="settings.textStyle.textAlign" @change="onTextStyleChange(\'textAlign\', $event.target.value)">\
                    <option value="left">좌측</option>\
                    <option value="center">중앙</option>\
                    <option value="right">우측</option>\
                </select>\
                <select class="wai-cb-select" :value="settings.textStyle.vAlign" @change="onTextStyleChange(\'vAlign\', $event.target.value)">\
                    <option value="top">상단</option>\
                    <option value="middle">중앙</option>\
                    <option value="bottom">하단</option>\
                </select>\
            </div>\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">행간</span>\
                <input type="number" class="wai-cb-input wai-cb-input--number" :value="settings.textStyle.lineHeight" @change="onTextStyleChange(\'lineHeight\', parseFloat($event.target.value))" min="0.8" max="3" step="0.1" />\
                <span class="wai-cb-label">자간</span>\
                <input type="number" class="wai-cb-input wai-cb-input--number" :value="settings.textStyle.letterSpacing" @change="onTextStyleChange(\'letterSpacing\', parseInt($event.target.value))" min="-10" max="50" />\
            </div>\
        </div>\
    </div>\
    \
    <!-- 보이스 설정 -->\
    <div class="wai-cb-settings-section">\
        <div class="wai-cb-settings-section__header" @click="toggleSection(\'voice\')">\
            <span class="wai-cb-settings-section__toggle">{{ expandedSections.voice ? "▼" : "▶" }}</span>\
            <span class="wai-cb-settings-section__title">보이스 설정</span>\
        </div>\
        <div class="wai-cb-settings-section__body" v-show="expandedSections.voice">\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">엔진</span>\
                <select class="wai-cb-select wai-cb-grow" :value="settings.voice.engine" @change="onVoiceChange(\'engine\', $event.target.value)">\
                    <option v-for="eng in voiceEngines" :key="eng.id" :value="eng.id">{{ eng.label }}</option>\
                </select>\
            </div>\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">음성</span>\
                <select class="wai-cb-select wai-cb-grow" :value="settings.voice.voiceId" @change="onVoiceChange(\'voiceId\', $event.target.value)">\
                    <option v-for="preset in voicePresets" :key="preset.id" :value="preset.id">{{ preset.label }}</option>\
                </select>\
            </div>\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">속도</span>\
                <input type="number" class="wai-cb-input wai-cb-input--number" :value="settings.voice.speed" @change="onVoiceChange(\'speed\', parseFloat($event.target.value))" min="0.5" max="2.0" step="0.1" />\
                <span class="wai-cb-label">피치</span>\
                <input type="number" class="wai-cb-input wai-cb-input--number" :value="settings.voice.pitch" @change="onVoiceChange(\'pitch\', parseInt($event.target.value))" min="-20" max="20" />\
            </div>\
            <div class="wai-cb-field">\
                <span class="wai-cb-label">기본 디렉팅</span>\
                <textarea class="wai-cb-textarea wai-cb-textarea--sm" :value="settings.voice.defaultDirecting" @change="onVoiceChange(\'defaultDirecting\', $event.target.value)" placeholder="기본 음성 디렉팅 (예: 차분하고 명확한 톤)" rows="2"></textarea>\
            </div>\
        </div>\
    </div>\
    \
    <!-- 이미지 생성 설정 -->\
    <div class="wai-cb-settings-section">\
        <div class="wai-cb-settings-section__header" @click="toggleSection(\'image\')">\
            <span class="wai-cb-settings-section__toggle">{{ expandedSections.image ? "▼" : "▶" }}</span>\
            <span class="wai-cb-settings-section__title">이미지 생성 설정</span>\
        </div>\
        <div class="wai-cb-settings-section__body" v-show="expandedSections.image">\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">엔진</span>\
                <select class="wai-cb-select wai-cb-grow" :value="settings.image.engine" @change="onImageChange(\'engine\', $event.target.value)">\
                    <option v-for="eng in imageEngines" :key="eng.id" :value="eng.id">{{ eng.label }}</option>\
                </select>\
            </div>\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">스타일</span>\
                <select class="wai-cb-select wai-cb-grow" :value="settings.image.style" @change="onImageChange(\'style\', $event.target.value)">\
                    <option v-for="sty in imageStyles" :key="sty.id" :value="sty.id">{{ sty.label }}</option>\
                </select>\
            </div>\
            <div class="wai-cb-row">\
                <span class="wai-cb-label">품질</span>\
                <select class="wai-cb-select" :value="settings.image.quality" @change="onImageChange(\'quality\', $event.target.value)">\
                    <option value="standard">Standard</option>\
                    <option value="hd">HD</option>\
                </select>\
            </div>\
            <div class="wai-cb-field">\
                <span class="wai-cb-label">기본 프롬프트 접두사</span>\
                <textarea class="wai-cb-textarea wai-cb-textarea--sm" :value="settings.image.defaultPrefix" @change="onImageChange(\'defaultPrefix\', $event.target.value)" placeholder="모든 이미지 프롬프트 앞에 추가될 텍스트" rows="2"></textarea>\
            </div>\
        </div>\
    </div>\
    \
    <!-- 일괄 생성 버튼 -->\
    <div class="wai-cb-global-actions">\
        <button class="wai-cb-btn wai-cb-btn--xs" @click="$emit(\'generate-all-tts\')">전체 TTS 생성</button>\
        <button class="wai-cb-btn wai-cb-btn--xs" @click="$emit(\'generate-all-images\')">전체 IMG 생성</button>\
    </div>\
    \
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
        // app-root.js에서 전달받는 canvasBoxes (LayerPanel 연동)
        canvasBoxes: { type: Array, default: function() { return []; } }
    },
    
    data: function() {
        return {
            globalSettings: WAICB.createDefaultGlobalSettings(),
            clips: [],
            showGlobalSettings: false,
            isImporting: false,
            selectedClipId: null
        };
    },
    
    computed: {
        clipCount: function() {
            return this.clips.length;
        },
        
        ttsCompleteCount: function() {
            return this.clips.filter(function(c) { return c.voiceStatus === 'done'; }).length;
        },
        
        imageCompleteCount: function() {
            return this.clips.filter(function(c) { return c.imageStatus === 'done'; }).length;
        },
        
        // LayerPanel에서 생성된 활성 슬롯 목록
        activeSlots: function() {
            var self = this;
            if (!this.canvasBoxes || this.canvasBoxes.length === 0) {
                return [];
            }
            
            return this.canvasBoxes
                .filter(function(box) {
                    return box.slotKey && !box.isHidden;
                })
                .map(function(box) {
                    return {
                        slotKey: box.slotKey,
                        colRole: box.colRole,
                        rowType: box.rowType,
                        layerName: box.layerName,
                        color: box.color
                    };
                });
        },
        
        activeSlotsCount: function() {
            return this.activeSlots.length;
        }
    },
    
    created: function() {
        var self = this;
        
        // Store 초기화 및 데이터 로드
        WAICB.Store.init();
        this.loadData();
        
        // 이벤트 리스너 등록
        WAICB.Events.on('clip:added', function() { self.loadData(); });
        WAICB.Events.on('clip:updated', function() { self.loadData(); });
        WAICB.Events.on('clip:removed', function() { self.loadData(); });
        WAICB.Events.on('settings:changed', function() { self.loadData(); });
    },
    
    watch: {
        // canvasBoxes 변경 감지 (LayerPanel 연동)
        canvasBoxes: {
            handler: function(newVal) {
                // 슬롯 변경 시 필요한 처리
                // console.log('[ClipBoxManager] canvasBoxes updated:', newVal.length);
            },
            deep: true
        }
    },
    
    methods: {
        // 데이터 로드
        loadData: function() {
            this.globalSettings = WAICB.Store.getGlobalSettings();
            this.clips = WAICB.Store.getClips();
        },
        
        // 전역 설정 토글
        toggleGlobalSettings: function() {
            this.showGlobalSettings = !this.showGlobalSettings;
        },
        
        // 전역 설정 업데이트
        onGlobalSettingUpdate: function(path, value) {
            WAICB.Store.setGlobalField(path, value);
            this.globalSettings = WAICB.Store.getGlobalSettings();
            
            // 화면 비율 변경 시 app-root에 알림
            if (path === 'project.aspectRatio') {
                this.notifyAspectRatioChange(value);
            }
        },
        
        // 화면 비율 변경 알림 (app-root 연동)
        notifyAspectRatioChange: function(aspectRatio) {
            var size = WAICB.Resolver.getCanvasSize(aspectRatio);
            
            // app-root의 canvasSize 업데이트 시도
            if (this.$root && this.$root.canvasSize) {
                this.$root.canvasSize = size;
                this.$root.aspectRatio = aspectRatio;
            }
            
            // 이벤트 발생
            WAICB.Events.emit('aspectRatio:changed', { aspectRatio: aspectRatio, size: size });
            WAICB.Toast.info('화면 비율: ' + aspectRatio);
        },
        
        // 클립 추가
        addClip: function() {
            WAICB.Store.addClip();
            WAICB.Toast.success('클립이 추가되었습니다');
        },
        
        // 클립 업데이트
        onClipUpdate: function(clipId, updates) {
            WAICB.Store.updateClip(clipId, updates);
        },
        
        // 클립 삭제
        onClipDelete: function(clipId) {
            WAICB.Store.removeClip(clipId);
            WAICB.Toast.info('클립이 삭제되었습니다');
        },
        
        // 클립 선택
        selectClip: function(clipId) {
            this.selectedClipId = clipId;
            
            // 선택된 클립을 캔버스에 적용
            var clip = WAICB.Store.getClip(clipId);
            if (clip && this.canvasBoxes) {
                WAICB.Resolver.applyClipToCanvas(clip, this.canvasBoxes, this.globalSettings);
            }
        },
        
        // TTS 생성 (개별)
        onGenerateTTS: function(clipId) {
            var clip = WAICB.Store.getClip(clipId);
            if (!clip || !clip.rawText) {
                WAICB.Toast.warning('텍스트를 먼저 입력하세요');
                return;
            }
            
            WAICB.Store.updateClip(clipId, { voiceStatus: 'generating' });
            
            // TODO: 실제 API 호출
            var self = this;
            setTimeout(function() {
                WAICB.Store.updateClip(clipId, { 
                    voiceStatus: 'done',
                    voiceSrc: 'dummy_audio_url'
                });
                WAICB.Toast.success('TTS 생성 완료');
            }, 1500);
        },
        
        // 이미지 생성 (개별)
        onGenerateImage: function(clipId) {
            var clip = WAICB.Store.getClip(clipId);
            if (!clip || !clip.imagePrompt) {
                WAICB.Toast.warning('이미지 프롬프트를 먼저 입력하세요');
                return;
            }
            
            WAICB.Store.updateClip(clipId, { imageStatus: 'generating' });
            
            // TODO: 실제 API 호출
            var self = this;
            setTimeout(function() {
                WAICB.Store.updateClip(clipId, { 
                    imageStatus: 'done',
                    imageSrc: 'https://via.placeholder.com/1080x1920/333/fff?text=Generated'
                });
                WAICB.Toast.success('이미지 생성 완료');
            }, 2000);
        },
        
        // 전체 TTS 생성
        onGenerateAllTTS: function() {
            var self = this;
            var targets = this.clips.filter(function(c) { 
                return c.rawText && c.voiceStatus !== 'done'; 
            });
            
            if (targets.length === 0) {
                WAICB.Toast.warning('생성할 클립이 없습니다');
                return;
            }
            
            WAICB.Toast.info(targets.length + '개 클립 TTS 생성 시작');
            targets.forEach(function(clip) {
                self.onGenerateTTS(clip.id);
            });
        },
        
        // 전체 이미지 생성
        onGenerateAllImages: function() {
            var self = this;
            var targets = this.clips.filter(function(c) { 
                return c.imagePrompt && c.imageStatus !== 'done'; 
            });
            
            if (targets.length === 0) {
                WAICB.Toast.warning('생성할 클립이 없습니다');
                return;
            }
            
            WAICB.Toast.info(targets.length + '개 클립 이미지 생성 시작');
            targets.forEach(function(clip) {
                self.onGenerateImage(clip.id);
            });
        },
        
        // 텍스트 파일 가져오기
        openImportDialog: function() {
            this.$refs.importInput.click();
        },
        
        onImportFile: function(e) {
            var self = this;
            var file = e.target.files[0];
            if (!file) return;
            
            var reader = new FileReader();
            reader.onload = function(ev) {
                var text = ev.target.result;
                var count = WAICB.Store.importFromText(text);
                
                if (count > 0) {
                    WAICB.Toast.success(count + '개 클립을 가져왔습니다');
                    self.loadData();
                } else {
                    WAICB.Toast.warning('가져올 텍스트가 없습니다');
                }
            };
            reader.readAsText(file);
            
            // 입력 초기화 (같은 파일 재선택 가능하도록)
            e.target.value = '';
        },
        
        // 캔버스에 현재 클립 적용
        applyCurrentClipToCanvas: function() {
            if (!this.selectedClipId) {
                WAICB.Toast.warning('클립을 먼저 선택하세요');
                return;
            }
            
            var clip = WAICB.Store.getClip(this.selectedClipId);
            if (clip && this.canvasBoxes) {
                WAICB.Resolver.applyClipToCanvas(clip, this.canvasBoxes, this.globalSettings);
                WAICB.Toast.success('캔버스에 적용되었습니다');
            }
        }
    },
    
    template: '\
<div id="clipbox-manager-root" class="wai-cb-root">\
    \
    <!-- 헤더 -->\
    <div class="wai-cb-manager__header">\
        <div class="wai-cb-manager__title-row">\
            <span class="wai-cb-manager__title">Clips</span>\
            <span class="wai-cb-manager__count">[{{ clipCount }}]</span>\
            <span v-if="activeSlotsCount > 0" class="wai-cb-manager__slots-badge" title="활성 슬롯 수">\
                📍{{ activeSlotsCount }}\
            </span>\
        </div>\
        <div class="wai-cb-manager__actions">\
            <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="toggleGlobalSettings" :class="{ \'wai-cb-btn--active\': showGlobalSettings }" title="전역 설정">\
                <span>⚙</span>\
            </button>\
            <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="openImportDialog" title="텍스트 가져오기">\
                <span>📥</span>\
            </button>\
            <button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--xs" @click="addClip" title="클립 추가">\
                <span>+</span>\
            </button>\
            <input type="file" ref="importInput" accept=".txt" style="display:none" @change="onImportFile" />\
        </div>\
    </div>\
    \
    <!-- 전역 설정 패널 (토글) -->\
    <div v-if="showGlobalSettings" class="wai-cb-panel wai-cb-global-panel">\
        <div class="wai-cb-global-panel__header">\
            <span class="wai-cb-global-panel__title">전역 설정</span>\
            <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="toggleGlobalSettings">접기 ▲</button>\
        </div>\
        <clip-box-global-settings\
            :settings="globalSettings"\
            @update="onGlobalSettingUpdate"\
            @generate-all-tts="onGenerateAllTTS"\
            @generate-all-images="onGenerateAllImages"\
        ></clip-box-global-settings>\
    </div>\
    \
    <!-- 클립 리스트 -->\
    <div class="wai-cb-clip-list">\
        <div v-if="clips.length === 0" class="wai-cb-empty">\
            <p>클립이 없습니다.</p>\
            <p class="wai-cb-text--hint">+ 버튼으로 추가하거나 📥 버튼으로 텍스트를 가져오세요.</p>\
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
    \
</div>\
    '
};

// 전역 등록
window.ClipBoxManager = ClipBoxManager;

/* ═══════════════════════════════════════════════════════════════════════════
   END OF ClipBoxManager v2.1
   ═══════════════════════════════════════════════════════════════════════════ */
