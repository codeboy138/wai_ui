/* ═══════════════════════════════════════════════════════════════════════════
   WAI-UI ClipBox Manager Component
   Vue 3 컴포넌트 - 좌측 패널에 삽입
   
   네이밍 규칙:
   - CSS 클래스: wai-cb-*
   - ID: clipbox-*
   - 전역 객체: window.WAICB
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 1: 글로벌 네임스페이스 및 상수
   ───────────────────────────────────────────────────────────────────────────── */
window.WAICB = window.WAICB || {};

WAICB.CONST = {
    STORAGE_KEY: 'waicb_clips_v1',
    AUTOSAVE_DELAY: 2000,
    TOAST_DURATION: 3000,
    LONG_PRESS_DELAY: 500,
    SILENCE: {
        MIN: 0.1,
        MAX: 5.0,
        DEFAULT: 0.3,
        STEP: 0.1,
        LINE_BREAK: 0.5
    },
    SPEED: {
        MIN: 0.25,
        MAX: 4.0,
        PADDING: { top: 12, right: 8, bottom: 8, left: 28 },
        DIAMOND_SIZE: 5,
        DIAMOND_GAP: 3
    },
    EVENTS: {
        CLIP_ADDED: 'clip:added',
        CLIP_UPDATED: 'clip:updated',
        CLIP_REMOVED: 'clip:removed',
        BULK_APPLIED: 'bulk:applied',
        SETTINGS_CHANGED: 'settings:changed',
        LAYER_ADDED: 'layer:added',
        LAYER_REMOVED: 'layer:removed',
        LAYER_UPDATED: 'layer:updated'
    }
};

WAICB.DEFAULTS = {
    playbackSpeed: 1.0,
    tts: {
        voice: 'ko-KR-InJoonNeural',
        speed: 1.0,
        pitch: 0.0
    },
    audio: {
        bgm: 'none',
        volume: 50
    },
    layout: {
        template: 'default-intro'
    }
};

WAICB.PRESETS = {
    speed: {
        flat: {
            name: '균일',
            points: [
                { t: 0, vL: 1, vR: 1 },
                { t: 1, vL: 1, vR: 1 }
            ]
        },
        slowStart: {
            name: '느린시작',
            points: [
                { t: 0, vL: 0.5, vR: 0.5 },
                { t: 0.3, vL: 1, vR: 1 },
                { t: 1, vL: 1, vR: 1 }
            ]
        },
        slowEnd: {
            name: '느린끝',
            points: [
                { t: 0, vL: 1, vR: 1 },
                { t: 0.7, vL: 1, vR: 1 },
                { t: 1, vL: 0.5, vR: 0.5 }
            ]
        },
        fastMid: {
            name: '중간빠름',
            points: [
                { t: 0, vL: 1, vR: 1 },
                { t: 0.3, vL: 1.5, vR: 1.5 },
                { t: 0.7, vL: 1.5, vR: 1.5 },
                { t: 1, vL: 1, vR: 1 }
            ]
        },
        dramatic: {
            name: '드라마틱',
            points: [
                { t: 0, vL: 0.5, vR: 0.5 },
                { t: 0.2, vL: 1.2, vR: 1.2 },
                { t: 0.5, vL: 0.7, vR: 0.7 },
                { t: 0.8, vL: 1.5, vR: 1.5 },
                { t: 1, vL: 0.8, vR: 0.8 }
            ]
        }
    },
    envelope: {
        flat: [
            { t: 0, v: 1 },
            { t: 1, v: 1 }
        ],
        fadeIn: [
            { t: 0, v: 0 },
            { t: 0.3, v: 1 },
            { t: 1, v: 1 }
        ],
        fadeOut: [
            { t: 0, v: 1 },
            { t: 0.7, v: 1 },
            { t: 1, v: 0 }
        ],
        fadeInOut: [
            { t: 0, v: 0 },
            { t: 0.2, v: 1 },
            { t: 0.8, v: 1 },
            { t: 1, v: 0 }
        ]
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 2: 유틸리티 함수
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Utils = {
    $(sel, ctx) {
        ctx = ctx || document;
        return ctx.querySelector(sel);
    },



    $$(sel, ctx) {
        ctx = ctx || document;
        return Array.from(ctx.querySelectorAll(sel));
    },

    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    },

    shortId() {
        return 'xxxxxxxx'.replace(/[x]/g, function() {
            return (Math.random() * 16 | 0).toString(16);
        });
    },

    clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    },

    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    isTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    isMobile() {
        return window.innerWidth < 768;
    },

    debounce(fn, delay) {
        var timer;
        return function() {
            var args = arguments;
            var self = this;
            clearTimeout(timer);
            timer = setTimeout(function() {
                fn.apply(self, args);
            }, delay);
        };
    },

    throttle(fn, limit) {
        var inThrottle;
        return function() {
            var args = arguments;
            var self = this;
            if (!inThrottle) {
                fn.apply(self, args);
                inThrottle = true;
                setTimeout(function() { inThrottle = false; }, limit);
            }
        };
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 3: 아이콘 SVG
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Icons = {
    eye: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 4: 이벤트 버스
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Events = (function() {
    var listeners = {};

    return {
        on: function(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
            var self = this;
            return function() { self.off(event, callback); };
        },

        off: function(event, callback) {
            if (!listeners[event]) return;
            var idx = listeners[event].indexOf(callback);
            if (idx > -1) listeners[event].splice(idx, 1);
        },

        emit: function(event, data) {
            if (!listeners[event]) return;
            listeners[event].forEach(function(cb) {
                try { cb(data); } catch (e) { console.error('[WAICB.Events] Error in ' + event + ':', e); }
            });
        },

        once: function(event, callback) {
            var self = this;
            var wrapper = function(data) {
                self.off(event, wrapper);
                callback(data);
            };
            this.on(event, wrapper);
        }
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 5: 토스트 알림
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
   SECTION 6: 모달 관리
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Modal = {
    open: function(id) {
        var modal = WAICB.Utils.$('#' + id);
        if (!modal) return;
        modal.classList.add('wai-cb-modal-overlay--visible');
        document.body.style.overflow = 'hidden';
        var firstInput = WAICB.Utils.$('input, textarea, button', modal);
        if (firstInput) setTimeout(function() { firstInput.focus(); }, 100);
    },

    close: function(id) {
        var modal = WAICB.Utils.$('#' + id);
        if (!modal) return;
        modal.classList.remove('wai-cb-modal-overlay--visible');
        document.body.style.overflow = '';
    },

    bindEvents: function() {
        WAICB.Utils.$$('.wai-cb-modal-overlay').forEach(function(overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    overlay.classList.remove('wai-cb-modal-overlay--visible');
                    document.body.style.overflow = '';
                }
            });
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                WAICB.Utils.$$('.wai-cb-modal-overlay--visible').forEach(function(modal) {
                    modal.classList.remove('wai-cb-modal-overlay--visible');
                });
                document.body.style.overflow = '';
            }
        });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 7: 클립 스토어
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Store = (function() {
    var clips = {};
    var clipOrder = [];
    var globalSettings = WAICB.Utils.clone(WAICB.DEFAULTS);
    var isDirty = false;
    var autoSaveTimer = null;

    function createClipDefaults(id, order) {
        return {
            id: id,
            order: order,
            label: '클립 ' + (order + 1),
            type: 'narration',
            text: '',
            isSelected: false,
            isCollapsed: false,
            activeTab: 'basic',
            ttsStatus: 'idle',
            imageStatus: 'idle',
            ttsOverride: null,
            audioOverride: null,
            layoutOverride: null,
            playbackSpeedOverride: null,
            playbackSpeed: 1.0
        };
    }

    function scheduleAutoSave() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(save, WAICB.CONST.AUTOSAVE_DELAY);
    }

    function save() {
        var data = {
            version: 1,
            global: globalSettings,
            clips: clipOrder.map(function(id) { return clips[id]; }),
            savedAt: Date.now()
        };
        try {
            localStorage.setItem(WAICB.CONST.STORAGE_KEY, JSON.stringify(data));
            isDirty = false;
        } catch (e) {
            console.error('[WAICB.Store] Save failed:', e);
        }
    }

    function load() {
        try {
            var raw = localStorage.getItem(WAICB.CONST.STORAGE_KEY);
            if (!raw) return false;
            var data = JSON.parse(raw);
            if (data.global) globalSettings = Object.assign({}, WAICB.DEFAULTS, data.global);
            if (Array.isArray(data.clips)) {
                clips = {};
                clipOrder = [];
                data.clips.forEach(function(c) {
                    clips[c.id] = c;
                    clipOrder.push(c.id);
                });
            }
            return true;
        } catch (e) {
            console.error('[WAICB.Store] Load failed:', e);
            return false;
        }
    }

    return {
        init: function() { load(); },

        getGlobal: function() { return WAICB.Utils.clone(globalSettings); },

        setGlobal: function(updates) {
            Object.assign(globalSettings, updates);
            isDirty = true;
            WAICB.Events.emit(WAICB.CONST.EVENTS.SETTINGS_CHANGED, globalSettings);
            scheduleAutoSave();
        },

        setGlobalTts: function(updates) {
            Object.assign(globalSettings.tts, updates);
            isDirty = true;
            scheduleAutoSave();
        },

        setGlobalSpeed: function(speed) {
            this.setGlobal({ playbackSpeed: speed });
        },

        getClip: function(id) {
            return clips[id] ? WAICB.Utils.clone(clips[id]) : null;
        },

        getAllClips: function() {
            return clipOrder.map(function(id) {
                return WAICB.Utils.clone(clips[id]);
            });
        },

        getClipIds: function() {
            return clipOrder.slice();
        },

        getClipCount: function() {
            return clipOrder.length;
        },

        addClip: function(initial) {
            initial = initial || {};
            var id = initial.id || ('clip-' + WAICB.Utils.shortId());
            var order = clipOrder.length;
            var clip = Object.assign({}, createClipDefaults(id, order), initial, { id: id, order: order });

            clips[id] = clip;
            clipOrder.push(id);
            isDirty = true;

            WAICB.Events.emit(WAICB.CONST.EVENTS.CLIP_ADDED, { clipId: id, clip: WAICB.Utils.clone(clip) });
            scheduleAutoSave();

            return WAICB.Utils.clone(clip);
        },

        updateClip: function(id, updates) {
            if (!clips[id]) return false;

            var prev = WAICB.Utils.clone(clips[id]);
            var safeUpdates = {};
            for (var key in updates) {
                if (key !== 'id' && key !== 'order') {
                    safeUpdates[key] = updates[key];
                }
            }
            Object.assign(clips[id], safeUpdates);
            isDirty = true;

            WAICB.Events.emit(WAICB.CONST.EVENTS.CLIP_UPDATED, { clipId: id, prev: prev, current: WAICB.Utils.clone(clips[id]) });
            scheduleAutoSave();
            return true;
        },

        removeClip: function(id) {
            if (!clips[id]) return false;

            var removed = clips[id];
            delete clips[id];
            var idx = clipOrder.indexOf(id);
            if (idx > -1) clipOrder.splice(idx, 1);

            clipOrder.forEach(function(cid, i) {
                if (clips[cid]) clips[cid].order = i;
            });

            isDirty = true;
            WAICB.Events.emit(WAICB.CONST.EVENTS.CLIP_REMOVED, { clipId: id, clip: removed });
            scheduleAutoSave();
            return true;
        },

        setClipOverride: function(id, type, value) {
            if (!clips[id]) return false;
            clips[id][type + 'Override'] = value;
            isDirty = true;
            scheduleAutoSave();
            return true;
        },

        clearClipOverrides: function(id) {
            return this.updateClip(id, {
                ttsOverride: null,
                audioOverride: null,
                layoutOverride: null,
                playbackSpeedOverride: null
            });
        },

        getSelectedIds: function() {
            return clipOrder.filter(function(id) {
                return clips[id] && clips[id].isSelected;
            });
        },

        selectAll: function() {
            clipOrder.forEach(function(id) {
                if (clips[id]) clips[id].isSelected = true;
            });
            isDirty = true;
        },

        deselectAll: function() {
            clipOrder.forEach(function(id) {
                if (clips[id]) clips[id].isSelected = false;
            });
            isDirty = true;
        },

        bulkApply: function(ids, options) {
            var count = 0;
            ids.forEach(function(id) {
                var clip = clips[id];
                if (!clip) return;
                if (options.tts) clip.ttsOverride = null;
                if (options.audio) clip.audioOverride = null;
                if (options.layout) clip.layoutOverride = null;
                if (options.speed) clip.playbackSpeedOverride = null;
                count++;
            });

            if (count > 0) {
                isDirty = true;
                WAICB.Events.emit(WAICB.CONST.EVENTS.BULK_APPLIED, { ids: ids, options: options, count: count });
                scheduleAutoSave();
            }
            return count;
        },

        bulkApplyAll: function(options) {
            return this.bulkApply(clipOrder, options);
        },

        save: save,
        load: load,
        isDirty: function() { return isDirty; },

        reset: function() {
            globalSettings = WAICB.Utils.clone(WAICB.DEFAULTS);
            clips = {};
            clipOrder = [];
            isDirty = true;
            localStorage.removeItem(WAICB.CONST.STORAGE_KEY);
        }
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 8: 세그먼트 시스템
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Segment = (function() {
    var states = {};
    var SILENCE = WAICB.CONST.SILENCE;

    var PARTICLE_PATTERNS = [
        /^(이|가|을|를|은|는|의|와|과|로|으로|에|에서|에게|한테|께|부터|까지|만|도|야|요|죠|네|군|데|지|걸|뿐)$/,
        /^(고|며|면|서|니|라|자|게|어|아|여|해|거|건|걸|군|네|죠|요)$/
    ];

    function getState(layerId) {
        if (!states[layerId]) {
            states[layerId] = {
                layerId: layerId,
                segments: [],
                selectedId: null,
                isDirty: false
            };
        }
        return states[layerId];
    }

    function isParticle(text) {
        if (!text || text.length > 3) return false;
        for (var i = 0; i < PARTICLE_PATTERNS.length; i++) {
            if (PARTICLE_PATTERNS[i].test(text)) return true;
        }
        return false;
    }

    function tokenize(text) {
        if (!text) return [];

        var lines = text.split(/\n+/);
        var result = [];

        for (var lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            var line = lines[lineIdx];
            var trimmed = line.trim();
            if (!trimmed) continue;

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
                result.push({ type: 'text', text: merged[j] });
            }

            var hasMoreLines = false;
            for (var k = lineIdx + 1; k < lines.length; k++) {
                if (lines[k].trim()) {
                    hasMoreLines = true;
                    break;
                }
            }
            if (hasMoreLines) {
                result.push({ type: 'linebreak' });
            }
        }

        return result;
    }

    function tokensToSegments(tokens) {
        return tokens.map(function(token) {
            if (token.type === 'linebreak') {
                return {
                    id: WAICB.Utils.shortId(),
                    type: 'silence',
                    duration: SILENCE.LINE_BREAK,
                    isLineBreak: true
                };
            }
            return {
                id: WAICB.Utils.shortId(),
                type: 'text',
                text: token.text
            };
        });
    }

    function syncFromText(layerId, text) {
        var state = getState(layerId);
        var tokens = tokenize(text);
        state.segments = tokensToSegments(tokens);
        state.selectedId = null;
        state.isDirty = true;

        var textCount = state.segments.filter(function(s) { return s.type === 'text'; }).length;
        var silenceCount = state.segments.filter(function(s) { return s.type === 'silence'; }).length;

        WAICB.Toast.success('세그먼트: 텍스트 ' + textCount + '개, 무음 ' + silenceCount + '개');

        return state.segments;
    }

    function insertSilence(layerId, afterId, duration, position) {
        duration = duration || SILENCE.DEFAULT;
        position = position || 'after';

        var state = getState(layerId);
        var idx = -1;
        for (var i = 0; i < state.segments.length; i++) {
            if (state.segments[i].id === afterId) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return null;

        var silence = {
            id: WAICB.Utils.shortId(),
            type: 'silence',
            duration: WAICB.Utils.clamp(duration, SILENCE.MIN, SILENCE.MAX)
        };

        var insertIdx = position === 'after' ? idx + 1 : idx;
        state.segments.splice(insertIdx, 0, silence);
        state.isDirty = true;
        return silence;
    }

    function updateSilenceDuration(layerId, segmentId, duration) {
        var state = getState(layerId);
        var segment = null;
        for (var i = 0; i < state.segments.length; i++) {
            if (state.segments[i].id === segmentId) {
                segment = state.segments[i];
                break;
            }
        }
        if (!segment || segment.type !== 'silence') return false;

        segment.duration = Math.round(WAICB.Utils.clamp(duration, SILENCE.MIN, SILENCE.MAX) * 10) / 10;
        state.isDirty = true;
        return true;
    }

    function deleteSegment(layerId, segmentId) {
        var state = getState(layerId);
        var idx = -1;
        for (var i = 0; i < state.segments.length; i++) {
            if (state.segments[i].id === segmentId) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return false;

        state.segments.splice(idx, 1);
        if (state.selectedId === segmentId) state.selectedId = null;
        state.isDirty = true;
        return true;
    }

    function reset(layerId) {
        var state = getState(layerId);
        state.segments = [];
        state.selectedId = null;
        state.isDirty = true;
    }

    return {
        getState: getState,
        tokenize: tokenize,
        syncFromText: syncFromText,
        insertSilence: insertSilence,
        updateSilenceDuration: updateSilenceDuration,
        deleteSegment: deleteSegment,
        reset: reset
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 9: 속도 에디터 (TimelinePanel에서 사용하기 위해 유지)
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.SpeedEditor = (function() {
    var states = {};
    var SPEED = WAICB.CONST.SPEED;

    function getState(clipId) {
        if (!states[clipId]) {
            states[clipId] = {
                points: WAICB.Utils.clone(WAICB.PRESETS.speed.flat.points),
                playheadT: 0.5,
                selectedIdx: null,
                dragging: null,
                originalDuration: 5,
                activePreset: 'flat',
                splitMode: {}
            };
        }
        return states[clipId];
    }

    function tToX(t, w) {
        return SPEED.PADDING.left + t * (w - SPEED.PADDING.left - SPEED.PADDING.right);
    }

    function xToT(x, w) {
        return WAICB.Utils.clamp(
            (x - SPEED.PADDING.left) / (w - SPEED.PADDING.left - SPEED.PADDING.right),
            0, 1
        );
    }

    function valueToY(v, h) {
        var clamped = WAICB.Utils.clamp(v, SPEED.MIN, SPEED.MAX);
        var logV = Math.log2(clamped);
        var normalized = (logV + 2) / 4;
        return h - SPEED.PADDING.bottom - normalized * (h - SPEED.PADDING.top - SPEED.PADDING.bottom);
    }

    function yToValue(y, h) {
        var normalized = (h - SPEED.PADDING.bottom - y) / (h - SPEED.PADDING.top - SPEED.PADDING.bottom);
        var logV = normalized * 4 - 2;
        return WAICB.Utils.clamp(Math.pow(2, logV), SPEED.MIN, SPEED.MAX);
    }

    function isUnified(p) {
        return Math.abs(p.vL - p.vR) < 0.01;
    }

    function createPresetIcon(points) {
        var w = 32, h = 16, pad = 2;
        var pathD = '';
        var startY = h - pad - ((Math.log2(Math.max(0.25, points[0].vR)) + 2) / 4) * (h - pad * 2);
        pathD = 'M ' + pad + ' ' + startY;

        for (var i = 1; i < points.length; i++) {
            var p1 = points[i - 1];
            var p2 = points[i];
            var x1 = pad + p1.t * (w - pad * 2);
            var y1 = h - pad - ((Math.log2(Math.max(0.25, p1.vR)) + 2) / 4) * (h - pad * 2);
            var x2 = pad + p2.t * (w - pad * 2);
            var y2 = h - pad - ((Math.log2(Math.max(0.25, p2.vL)) + 2) / 4) * (h - pad * 2);
            var dx = x2 - x1;
            pathD += ' C ' + (x1 + dx * 0.6) + ' ' + y1 + ', ' + (x2 - dx * 0.6) + ' ' + y2 + ', ' + x2 + ' ' + y2;
        }

        return '<svg class="wai-cb-speed-preset__icon" viewBox="0 0 ' + w + ' ' + h + '">' +
            '<line x1="' + pad + '" y1="' + (h/2) + '" x2="' + (w-pad) + '" y2="' + (h/2) + '" stroke="#333" stroke-width="0.5"/>' +
            '<path d="' + pathD + '" fill="none" stroke="#ef4444" stroke-width="1.5"/>' +
            '</svg>';
    }

    function drawDiamond(ctx, x, y, size, isSelected, type) {
        type = type || 'full';
        ctx.beginPath();
        if (type === 'full') {
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
        } else if (type === 'left') {
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y);
            ctx.lineTo(x, y + size);
        } else {
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
        }
        ctx.closePath();

        ctx.fillStyle = isSelected ? '#fff' : '#ef4444';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#eab308' : '#fff';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
    }

    function draw(clipId, canvas) {
        if (!canvas) return;

        var state = getState(clipId);
        var ctx = canvas.getContext('2d');
        var rect = canvas.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;

        var dpr = window.devicePixelRatio || 1;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, w, h);

        var baseline1x = valueToY(1, h);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
        ctx.fillRect(SPEED.PADDING.left, SPEED.PADDING.top,
            w - SPEED.PADDING.left - SPEED.PADDING.right,
            baseline1x - SPEED.PADDING.top);
        ctx.fillStyle = 'rgba(234, 179, 8, 0.03)';
        ctx.fillRect(SPEED.PADDING.left, baseline1x,
            w - SPEED.PADDING.left - SPEED.PADDING.right,
            h - SPEED.PADDING.bottom - baseline1x);

        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        var gridValues = [0.25, 0.5, 1, 2, 4];
        for (var i = 0; i < gridValues.length; i++) {
            var y = valueToY(gridValues[i], h);
            ctx.beginPath();
            ctx.moveTo(SPEED.PADDING.left, y);
            ctx.lineTo(w - SPEED.PADDING.right, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.moveTo(SPEED.PADDING.left, baseline1x);
        ctx.lineTo(w - SPEED.PADDING.right, baseline1x);
        ctx.stroke();

        var points = state.points;
        if (points.length >= 2) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tToX(points[0].t, w), valueToY(points[0].vR, h));

            for (var j = 1; j < points.length; j++) {
                var p1 = points[j - 1];
                var p2 = points[j];
                var x1 = tToX(p1.t, w);
                var y1 = valueToY(p1.vR, h);
                var x2 = tToX(p2.t, w);
                var y2L = valueToY(p2.vL, h);
                var y2R = valueToY(p2.vR, h);
                var dx = x2 - x1;
                ctx.bezierCurveTo(x1 + dx * 0.6, y1, x2 - dx * 0.6, y2L, x2, y2L);
                if (!isUnified(p2) && j < points.length - 1) {
                    ctx.lineTo(x2, y2R);
                }
            }
            ctx.stroke();
        }

        var phX = tToX(state.playheadT, w);
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = state.selectedIdx !== null ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(phX, SPEED.PADDING.top);
        ctx.lineTo(phX, h - SPEED.PADDING.bottom);
        ctx.stroke();

        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(phX - 4, SPEED.PADDING.top - 2);
        ctx.lineTo(phX + 4, SPEED.PADDING.top - 2);
        ctx.lineTo(phX, SPEED.PADDING.top + 5);
        ctx.closePath();
        ctx.fill();

        for (var k = 0; k < points.length; k++) {
            var p = points[k];
            var px = tToX(p.t, w);
            var pyL = valueToY(p.vL, h);
            var pyR = valueToY(p.vR, h);
            var isSelected = state.selectedIdx === k;
            var isFirst = k === 0;
            var isLast = k === points.length - 1;
            var isSplit = state.splitMode[k];

            if (isFirst) {
                drawDiamond(ctx, px, pyR, SPEED.DIAMOND_SIZE, isSelected, 'right');
            } else if (isLast) {
                drawDiamond(ctx, px, pyL, SPEED.DIAMOND_SIZE, isSelected, 'left');
            } else if (!isSplit) {
                drawDiamond(ctx, px, pyL, SPEED.DIAMOND_SIZE, isSelected, 'full');
            } else {
                drawDiamond(ctx, px - SPEED.DIAMOND_GAP, pyL, SPEED.DIAMOND_SIZE,
                    isSelected && state.dragging === 'L', 'left');
                drawDiamond(ctx, px + SPEED.DIAMOND_GAP, pyR, SPEED.DIAMOND_SIZE,
                    isSelected && state.dragging === 'R', 'right');
            }
        }
    }

    function selectPreset(clipId, presetKey) {
        var state = getState(clipId);
        var preset = WAICB.PRESETS.speed[presetKey];
        if (!preset) return;

        state.points = WAICB.Utils.clone(preset.points);
        state.selectedIdx = null;
        state.activePreset = presetKey;
        state.splitMode = {};
    }

    function addPoint(clipId) {
        var state = getState(clipId);
        var t = state.playheadT;
        var points = state.points;

        for (var i = 0; i < points.length; i++) {
            if (Math.abs(points[i].t - t) < 0.03) return;
        }

        var v = 1;
        for (var j = 0; j < points.length - 1; j++) {
            if (t >= points[j].t && t <= points[j + 1].t) {
                var localT = (t - points[j].t) / (points[j + 1].t - points[j].t);
                v = points[j].vR + (points[j + 1].vL - points[j].vR) * localT;
                break;
            }
        }

        points.push({ t: t, vL: v, vR: v });
        points.sort(function(a, b) { return a.t - b.t; });

        for (var k = 0; k < points.length; k++) {
            if (Math.abs(points[k].t - t) < 0.001) {
                state.selectedIdx = k;
                break;
            }
        }
    }

    function reset(clipId) {
        var state = getState(clipId);
        state.points = WAICB.Utils.clone(WAICB.PRESETS.speed.flat.points);
        state.selectedIdx = null;
        state.playheadT = 0.5;
        state.activePreset = 'flat';
        state.splitMode = {};
    }

    function getSpeedInfo(clipId) {
        var state = getState(clipId);
        var points = state.points;
        var t = state.playheadT;

        var v = 1;
        for (var i = 0; i < points.length - 1; i++) {
            if (t >= points[i].t && t <= points[i + 1].t) {
                var localT = (t - points[i].t) / (points[i + 1].t - points[i].t);
                v = points[i].vR + (points[i + 1].vL - points[i].vR) * localT;
                break;
            }
        }

        var resultDuration = 0;
        var steps = 50;
        for (var s = 0; s < steps; s++) {
            var st = s / steps;
            var sv = 1;
            for (var j = 0; j < points.length - 1; j++) {
                if (st >= points[j].t && st <= points[j + 1].t) {
                    var lt = (st - points[j].t) / (points[j + 1].t - points[j].t);
                    sv = points[j].vR + (points[j + 1].vL - points[j].vR) * lt;
                    break;
                }
            }
            resultDuration += (state.originalDuration / steps) / Math.max(0.1, sv);
        }

        return {
            time: (t * state.originalDuration).toFixed(2),
            speed: v.toFixed(2),
            originalDuration: state.originalDuration.toFixed(2),
            resultDuration: resultDuration.toFixed(2),
            selectedPoint: state.selectedIdx !== null ? ('P' + (state.selectedIdx + 1) + (state.splitMode[state.selectedIdx] ? ' 분리' : '')) : '-'
        };
    }

    function getHitTarget(x, y, w, h, state) {
        var hitRadius = WAICB.Utils.isTouch() ? 15 : 8;

        for (var i = 0; i < state.points.length; i++) {
            var p = state.points[i];
            var px = tToX(p.t, w);
            var yL = valueToY(p.vL, h);
            var yR = valueToY(p.vR, h);
            var isFirst = i === 0;
            var isLast = i === state.points.length - 1;
            var isSplit = state.splitMode[i];

            if (isFirst) {
                if (Math.hypot(x - px, y - yR) < hitRadius) return { type: 'R', index: i };
            } else if (isLast) {
                if (Math.hypot(x - px, y - yL) < hitRadius) return { type: 'L', index: i };
            } else if (!isSplit) {
                if (Math.hypot(x - px, y - yL) < hitRadius) return { type: 'both', index: i };
            } else {
                if (Math.hypot(x - (px - SPEED.DIAMOND_GAP), y - yL) < hitRadius) return { type: 'L', index: i };
                if (Math.hypot(x - (px + SPEED.DIAMOND_GAP), y - yR) < hitRadius) return { type: 'R', index: i };
            }
        }
        return null;
    }

    function handleCanvasEvent(clipId, canvas, eventType, clientX, clientY) {
        var state = getState(clipId);
        var rect = canvas.getBoundingClientRect();
        var x = clientX - rect.left;
        var y = clientY - rect.top;
        var w = rect.width;
        var h = rect.height;

        if (eventType === 'mousedown') {
            var hit = getHitTarget(x, y, w, h, state);
            if (hit) {
                if (state.selectedIdx === hit.index) {
                    state.dragging = hit.type;
                } else {
                    state.selectedIdx = hit.index;
                    state.playheadT = state.points[hit.index].t;
                    state.dragging = null;
                }
            } else {
                state.selectedIdx = null;
                state.playheadT = xToT(x, w);
                state.dragging = 'playhead';
            }
            return true;
        }

        if (eventType === 'mousemove' && state.dragging) {
            if (state.dragging === 'playhead') {
                state.playheadT = xToT(x, w);
            } else if (state.selectedIdx !== null) {
                var point = state.points[state.selectedIdx];
                var newV = yToValue(y, h);
                if (state.dragging === 'L') point.vL = newV;
                else if (state.dragging === 'R') point.vR = newV;
                else if (state.dragging === 'both') {
                    point.vL = newV;
                    point.vR = newV;
                }
            }
            return true;
        }

        if (eventType === 'mouseup') {
            state.dragging = null;
            return true;
        }

        if (eventType === 'dblclick') {
            var dblHit = getHitTarget(x, y, w, h, state);
            if (dblHit && dblHit.index > 0 && dblHit.index < state.points.length - 1) {
                var p = state.points[dblHit.index];
                if (!state.splitMode[dblHit.index]) {
                    state.splitMode[dblHit.index] = true;
                } else {
                    var avg = (p.vL + p.vR) / 2;
                    p.vL = avg;
                    p.vR = avg;
                    delete state.splitMode[dblHit.index];
                }
                state.selectedIdx = dblHit.index;
                state.playheadT = p.t;
                return true;
            }
        }

        if (eventType === 'contextmenu') {
            var ctxHit = getHitTarget(x, y, w, h, state);
            if (ctxHit && ctxHit.index > 0 && ctxHit.index < state.points.length - 1) {
                state.points.splice(ctxHit.index, 1);
                delete state.splitMode[ctxHit.index];
                var newSplitMode = {};
                for (var key in state.splitMode) {
                    var idx = parseInt(key);
                    if (idx > ctxHit.index) newSplitMode[idx - 1] = true;
                    else if (idx < ctxHit.index) newSplitMode[idx] = true;
                }
                state.splitMode = newSplitMode;
                state.selectedIdx = null;
                return true;
            }
        }

        return false;
    }

    return {
        getState: getState,
        createPresetIcon: createPresetIcon,
        draw: draw,
        selectPreset: selectPreset,
        addPoint: addPoint,
        reset: reset,
        getSpeedInfo: getSpeedInfo,
        handleCanvasEvent: handleCanvasEvent
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 10: 엔벨로프 에디터
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.EnvelopeEditor = (function() {
    var states = {};

    function getState(clipId) {
        if (!states[clipId]) {
            states[clipId] = {
                points: WAICB.Utils.clone(WAICB.PRESETS.envelope.flat),
                selectedIdx: null,
                dragging: false
            };
        }
        return states[clipId];
    }

    function draw(clipId, canvas) {
        if (!canvas) return;

        var state = getState(clipId);
        var ctx = canvas.getContext('2d');
        var rect = canvas.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;
        var pad = 4;

        var dpr = window.devicePixelRatio || 1;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (var i = 0; i <= 4; i++) {
            var y = pad + (i / 4) * (h - pad * 2);
            ctx.beginPath();
            ctx.moveTo(pad, y);
            ctx.lineTo(w - pad, y);
            ctx.stroke();
        }

        var points = state.points.slice().sort(function(a, b) { return a.t - b.t; });
        if (points.length >= 2) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (var j = 0; j < points.length; j++) {
                var p = points[j];
                var x = pad + p.t * (w - pad * 2);
                var y = h - pad - p.v * (h - pad * 2);
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            ctx.lineTo(pad + (w - pad * 2), h - pad);
            ctx.lineTo(pad, h - pad);
            ctx.closePath();
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fill();
        }

        var pointRadius = WAICB.Utils.isTouch() ? 6 : 4;
        for (var k = 0; k < points.length; k++) {
            var pt = points[k];
            var px = pad + pt.t * (w - pad * 2);
            var py = h - pad - pt.v * (h - pad * 2);

            ctx.fillStyle = state.selectedIdx === k ? '#fff' : '#3b82f6';
            ctx.beginPath();
            ctx.arc(px, py, pointRadius, 0, Math.PI * 2);
            ctx.fill();

            if (state.selectedIdx === k) {
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    function reset(clipId) {
        var state = getState(clipId);
        state.points = WAICB.Utils.clone(WAICB.PRESETS.envelope.flat);
        state.selectedIdx = null;
    }

    function handleCanvasEvent(clipId, canvas, eventType, clientX, clientY) {
        var state = getState(clipId);
        var rect = canvas.getBoundingClientRect();
        var x = clientX - rect.left;
        var y = clientY - rect.top;
        var w = rect.width;
        var h = rect.height;
        var pad = 4;

        if (eventType === 'mousedown') {
            var hitRadius = WAICB.Utils.isTouch() ? 15 : 10;
            for (var i = 0; i < state.points.length; i++) {
                var p = state.points[i];
                var px = pad + p.t * (w - pad * 2);
                var py = h - pad - p.v * (h - pad * 2);
                if (Math.hypot(x - px, y - py) < hitRadius) {
                    state.selectedIdx = i;
                    state.dragging = true;
                    return true;
                }
            }
            state.selectedIdx = null;
            return true;
        }

        if (eventType === 'mousemove' && state.dragging && state.selectedIdx !== null) {
            var point = state.points[state.selectedIdx];
            var newT = (x - pad) / (w - pad * 2);
            var newV = 1 - (y - pad) / (h - pad * 2);

            if (state.selectedIdx === 0) newT = 0;
            if (state.selectedIdx === state.points.length - 1) newT = 1;

            point.t = WAICB.Utils.clamp(newT, 0, 1);
            point.v = WAICB.Utils.clamp(newV, 0, 1);
            return true;
        }

        if (eventType === 'mouseup') {
            state.dragging = false;
            return true;
        }

        if (eventType === 'dblclick') {
            var t = WAICB.Utils.clamp((x - pad) / (w - pad * 2), 0, 1);
            var v = WAICB.Utils.clamp(1 - (y - pad) / (h - pad * 2), 0, 1);
            state.points.push({ t: t, v: v });
            state.points.sort(function(a, b) { return a.t - b.t; });
            return true;
        }

        if (eventType === 'contextmenu') {
            var hitRadius2 = WAICB.Utils.isTouch() ? 15 : 10;
            for (var j = 1; j < state.points.length - 1; j++) {
                var pt = state.points[j];
                var ptx = pad + pt.t * (w - pad * 2);
                var pty = h - pad - pt.v * (h - pad * 2);
                if (Math.hypot(x - ptx, y - pty) < hitRadius2) {
                    state.points.splice(j, 1);
                    state.selectedIdx = null;
                    return true;
                }
            }
        }

        return false;
    }

    return {
        getState: getState,
        draw: draw,
        reset: reset,
        handleCanvasEvent: handleCanvasEvent
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 11: 레이어 시스템
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Layer = (function() {
    var states = {};

    var LAYER_TYPES = {
        text: { icon: 'T', label: '텍스트', iconClass: 'wai-cb-layer__icon--text' },
        image: { icon: '🖼', label: '이미지', iconClass: 'wai-cb-layer__icon--image' },
        shape: { icon: '◇', label: '도형', iconClass: 'wai-cb-layer__icon--shape' },
        audio: { icon: '♪', label: '오디오', iconClass: 'wai-cb-layer__icon--audio' }
    };

    function getState(clipId) {
        if (!states[clipId]) {
            states[clipId] = {
                layers: [],
                selectedId: null,
                counter: 0
            };
        }
        return states[clipId];
    }

    function createLayerData(type, name, order) {
        return {
            id: 'layer-' + WAICB.Utils.shortId(),
            type: type,
            name: name,
            order: order,
            visible: true,
            collapsed: false,
            text: '',
            segments: [],
            layout: {
                template: 'inherit',
                x: 120,
                y: 80 + (order * 50),
                w: 640,
                h: 100,
                align: 'center',
                valign: 'middle'
            }
        };
    }

    function addLayer(clipId, type, name) {
        var state = getState(clipId);
        state.counter++;
        var typeInfo = LAYER_TYPES[type];
        var layerName = name || (typeInfo.label + ' ' + state.counter);
        var layer = createLayerData(type, layerName, state.layers.length);

        state.layers.push(layer);
        state.selectedId = layer.id;

        WAICB.Events.emit(WAICB.CONST.EVENTS.LAYER_ADDED, { clipId: clipId, layer: layer });

        return layer;
    }

    function deleteLayer(clipId, layerId) {
        var state = getState(clipId);
        var idx = -1;
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return false;

        if (state.layers.length === 1) {
            WAICB.Toast.warning('최소 1개의 레이어가 필요합니다');
            return false;
        }

        var removed = state.layers.splice(idx, 1)[0];
        for (var j = 0; j < state.layers.length; j++) {
            state.layers[j].order = j;
        }

        if (state.selectedId === layerId) {
            state.selectedId = state.layers[Math.min(idx, state.layers.length - 1)].id;
        }

        WAICB.Events.emit(WAICB.CONST.EVENTS.LAYER_REMOVED, { clipId: clipId, layerId: layerId });

        return true;
    }

    function duplicateLayer(clipId, layerId) {
        var state = getState(clipId);
        var original = null;
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                original = state.layers[i];
                break;
            }
        }
        if (!original) return null;

        state.counter++;
        var newLayer = WAICB.Utils.clone(original);
        newLayer.id = 'layer-' + WAICB.Utils.shortId();
        newLayer.name = original.name + ' 복사';
        newLayer.order = state.layers.length;
        newLayer.layout.y += 30;

        state.layers.push(newLayer);
        state.selectedId = newLayer.id;

        return newLayer;
    }

    function moveLayer(clipId, layerId, direction) {
        var state = getState(clipId);
        var idx = -1;
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                idx = i;
                break;
            }
        }
        if (idx === -1) return false;

        var newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= state.layers.length) return false;

        var temp = state.layers[idx];
        state.layers[idx] = state.layers[newIdx];
        state.layers[newIdx] = temp;

        for (var j = 0; j < state.layers.length; j++) {
            state.layers[j].order = j;
        }

        return true;
    }

    function toggleVisibility(clipId, layerId) {
        var state = getState(clipId);
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                state.layers[i].visible = !state.layers[i].visible;
                return true;
            }
        }
        return false;
    }

    function toggleCollapse(clipId, layerId) {
        var state = getState(clipId);
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                state.layers[i].collapsed = !state.layers[i].collapsed;
                return true;
            }
        }
        return false;
    }

    function setLayerText(clipId, layerId, text) {
        var state = getState(clipId);
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                state.layers[i].text = text;
                return true;
            }
        }
        return false;
    }

    function setLayerLayoutField(clipId, layerId, field, value) {
        var state = getState(clipId);
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                if (state.layers[i].layout) {
                    state.layers[i].layout[field] = value;
                    return true;
                }
            }
        }
        return false;
    }

    function getLayer(clipId, layerId) {
        var state = getState(clipId);
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                return state.layers[i];
            }
        }
        return null;
    }

    function getLayers(clipId) {
        return getState(clipId).layers;
    }

    function init(clipId) {
        var state = getState(clipId);
        if (state.layers.length === 0) {
            state.counter = 1;
            var defaultLayer = createLayerData('text', '제목', 0);
            defaultLayer.text = '';
            state.layers.push(defaultLayer);
            state.selectedId = defaultLayer.id;
        }
    }

    function collapseAll(clipId, collapse) {
        var state = getState(clipId);
        for (var i = 0; i < state.layers.length; i++) {
            state.layers[i].collapsed = collapse;
        }
    }

    return {
        TYPES: LAYER_TYPES,
        getState: getState,
        addLayer: addLayer,
        deleteLayer: deleteLayer,
        duplicateLayer: duplicateLayer,
        moveLayer: moveLayer,
        toggleVisibility: toggleVisibility,
        toggleCollapse: toggleCollapse,
        setLayerText: setLayerText,
        setLayerLayoutField: setLayerLayoutField,
        getLayer: getLayer,
        getLayers: getLayers,
        init: init,
        collapseAll: collapseAll
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 12: 컨텍스트 메뉴
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.ContextMenu = (function() {
    var isOpen = false;
    var targetLayerId = null;
    var targetSegmentId = null;
    var targetSegmentType = null;

    function getMenu() {
        return WAICB.Utils.$('#clipbox-ctx-menu');
    }

    function getOverlay() {
        return WAICB.Utils.$('#clipbox-ctx-overlay');
    }

    function open(e, layerId, segmentId, segmentType) {
        e.preventDefault();
        e.stopPropagation();

        var menuEl = getMenu();
        var overlayEl = getOverlay();
        if (!menuEl || !overlayEl) return;

        isOpen = true;
        targetLayerId = layerId;
        targetSegmentId = segmentId;
        targetSegmentType = segmentType;

        var header = WAICB.Utils.$('#clipbox-ctx-header', menuEl);
        if (header) {
            if (segmentType === 'text') {
                var state = WAICB.Segment.getState(layerId);
                var seg = null;
                for (var i = 0; i < state.segments.length; i++) {
                    if (state.segments[i].id === segmentId) {
                        seg = state.segments[i];
                        break;
                    }
                }
                var text = seg ? seg.text : '토큰';
                header.textContent = '"' + (text.length > 15 ? text.slice(0, 15) + '...' : text) + '"';
            } else {
                var state2 = WAICB.Segment.getState(layerId);
                var seg2 = null;
                for (var j = 0; j < state2.segments.length; j++) {
                    if (state2.segments[j].id === segmentId) {
                        seg2 = state2.segments[j];
                        break;
                    }
                }
                var prefix = seg2 && seg2.isLineBreak ? '↵ ' : '';
                header.textContent = prefix + '무음 [' + ((seg2 ? seg2.duration : 0.3).toFixed(1)) + 's]';
            }
        }

        var deleteItem = WAICB.Utils.$('#clipbox-ctx-delete', menuEl);
        if (deleteItem) {
            deleteItem.style.display = segmentType === 'silence' ? 'flex' : 'none';
        }

        WAICB.Utils.$$('[data-ctx-action="insertSilenceAfter"], [data-ctx-action="insertSilenceBefore"]', menuEl)
            .forEach(function(item) {
                item.style.display = segmentType === 'text' ? 'flex' : 'none';
            });

        if (WAICB.Utils.isMobile()) {
            menuEl.style.cssText = 'left: 8px; right: 8px; bottom: 8px; top: auto;';
        } else {
            var x = e.clientX;
            var y = e.clientY;
            if (x + 160 > window.innerWidth) x = window.innerWidth - 170;
            if (y + 240 > window.innerHeight) y = window.innerHeight - 250;
            menuEl.style.cssText = 'left: ' + x + 'px; top: ' + y + 'px;';
        }

        overlayEl.classList.add('wai-cb-ctx-overlay--visible');
        menuEl.classList.add('wai-cb-ctx-menu--visible');
    }

    function close() {
        var menuEl = getMenu();
        var overlayEl = getOverlay();

        if (menuEl) {
            menuEl.classList.remove('wai-cb-ctx-menu--visible');
            menuEl.style.cssText = '';
        }
        if (overlayEl) {
            overlayEl.classList.remove('wai-cb-ctx-overlay--visible');
        }

        isOpen = false;
        targetLayerId = null;
        targetSegmentId = null;
        targetSegmentType = null;
    }

    function executeAction(action, params) {
        params = params || {};

        if (!targetLayerId || !targetSegmentId) {
            close();
            return;
        }

        switch (action) {
            case 'insertSilenceAfter':
                if (targetSegmentType === 'text') {
                    WAICB.Segment.insertSilence(targetLayerId, targetSegmentId, params.duration || 0.3, 'after');
                }
                break;

            case 'insertSilenceBefore':
                if (targetSegmentType === 'text') {
                    WAICB.Segment.insertSilence(targetLayerId, targetSegmentId, params.duration || 0.3, 'before');
                }
                break;

            case 'setSilence':
                var duration = parseFloat(params.duration);
                if (!isNaN(duration)) {
                    if (targetSegmentType === 'silence') {
                        WAICB.Segment.updateSilenceDuration(targetLayerId, targetSegmentId, duration);
                    } else {
                        WAICB.Segment.insertSilence(targetLayerId, targetSegmentId, duration, 'after');
                    }
                }
                break;

            case 'deleteToken':
                if (targetSegmentType === 'silence') {
                    WAICB.Segment.deleteSegment(targetLayerId, targetSegmentId);
                }
                break;
        }

        close();
    }

    function bindEvents() {
        var overlayEl = getOverlay();
        if (overlayEl) {
            overlayEl.addEventListener('click', close);
        }

        var menuEl = getMenu();
        if (menuEl) {
            menuEl.addEventListener('click', function(e) {
                var item = e.target.closest('.wai-cb-ctx-menu__item');
                if (!item || item.classList.contains('wai-cb-ctx-menu__item--disabled')) return;

                var action = item.dataset.ctxAction;
                var duration = item.dataset.duration;
                if (action) executeAction(action, { duration: duration });
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) close();
        });
    }

    return {
        open: open,
        close: close,
        executeAction: executeAction,
        bindEvents: bindEvents,
        isOpen: function() { return isOpen; }
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 13: Vue 컴포넌트 - 세그먼트 트랙
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxSegmentTrack = {
    props: ['clipId', 'layerId'],
    template: `
        <div class="wai-cb-segment" :data-layer-id="layerId">
            <div class="wai-cb-segment__header">
                <span class="wai-cb-label--section">세그먼트</span>
                <div class="wai-cb-row wai-cb-shrink">
                    <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="syncSegments">동기화</button>
                    <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="resetSegments">초기화</button>
                </div>
            </div>
            <div class="wai-cb-segment__track" @contextmenu="onContextMenu">
                <template v-if="segments.length === 0">
                    <span class="wai-cb-segment__empty">동기화 버튼을 클릭하여 텍스트를 토큰화하세요</span>
                </template>
                <span 
                    v-for="(seg, idx) in segments"
                    :key="seg.id"
                    class="wai-cb-seg-token"
                    :class="getTokenClass(seg)"
                    :data-segment-id="seg.id"
                    :data-segment-type="seg.type"
                    :data-layer-id="layerId"
                    @click="selectToken(seg)"
                    @contextmenu.stop="onTokenContextMenu($event, seg)"
                    @wheel="onTokenWheel($event, seg)"
                >
                    <template v-if="seg.type === 'text'">{{ seg.text }}</template>
                    <template v-else>{{ seg.isLineBreak ? '↵ ' : '' }}[{{ seg.duration.toFixed(1) }}s]</template>
                </span>
            </div>
        </div>
    `,
    computed: {
        segments: function() {
            return WAICB.Segment.getState(this.layerId).segments;
        }
    },
    methods: {
        getTokenClass: function(seg) {
            var classes = {};
            classes['wai-cb-seg-token--' + seg.type] = true;
            if (seg.isLineBreak) classes['wai-cb-seg-token--linebreak'] = true;
            return classes;
        },
        syncSegments: function() {
            var layer = WAICB.Layer.getLayer(this.clipId, this.layerId);
            if (layer && layer.text) {
                WAICB.Segment.syncFromText(this.layerId, layer.text);
                this.$forceUpdate();
            } else {
                WAICB.Toast.warning('텍스트를 먼저 입력하세요');
            }
        },
        resetSegments: function() {
            WAICB.Segment.reset(this.layerId);
            this.$forceUpdate();
            WAICB.Toast.info('세그먼트가 초기화되었습니다');
        },
        selectToken: function(seg) {
            var state = WAICB.Segment.getState(this.layerId);
            state.selectedId = seg.id;
        },
        onContextMenu: function(e) {
            e.preventDefault();
        },
        onTokenContextMenu: function(e, seg) {
            WAICB.ContextMenu.open(e, this.layerId, seg.id, seg.type);
        },
        onTokenWheel: function(e, seg) {
            if (seg.type !== 'silence') return;
            e.preventDefault();
            var delta = e.deltaY > 0 ? -WAICB.CONST.SILENCE.STEP : WAICB.CONST.SILENCE.STEP;
            var newDuration = seg.duration + delta;
            if (newDuration >= WAICB.CONST.SILENCE.MIN && newDuration <= WAICB.CONST.SILENCE.MAX) {
                WAICB.Segment.updateSilenceDuration(this.layerId, seg.id, newDuration);
                this.$forceUpdate();
            }
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 14: Vue 컴포넌트 - 레이어 패널
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxLayers = {
    props: ['clipId'],
    components: {
        'clip-box-segment-track': ClipBoxSegmentTrack
    },
    template: `
        <div class="wai-cb-layers" :id="'clipbox-layers-' + clipId">
            <div class="wai-cb-layers__header">
                <div class="wai-cb-layers__title">
                    <span>📑 레이어</span>
                    <span class="wai-cb-layers__count">{{ layers.length }}</span>
                </div>
                <div class="wai-cb-layers__actions">
                    <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="collapseAll(true)" title="모두 접기">⊟</button>
                    <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="collapseAll(false)" title="모두 펼치기">⊞</button>
                    <button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--xs" @click="toggleAddMenu">+ 추가</button>
                    <div class="wai-cb-layer-add-menu" :class="{ 'wai-cb-layer-add-menu--visible': showAddMenu }">
                        <div v-for="(info, type) in layerTypes" :key="type" class="wai-cb-layer-add-menu__item" @click="addLayer(type)">
                            <span :class="'wai-cb-layer__icon ' + info.iconClass">{{ info.icon }}</span>
                            <span>{{ info.label }} 레이어</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="wai-cb-layers__list">
                <div v-if="layers.length === 0" class="wai-cb-layers__empty">레이어가 없습니다. + 추가 버튼을 클릭하세요.</div>
                <div
                    v-for="layer in layers"
                    :key="layer.id"
                    class="wai-cb-layer"
                    :class="{ 'wai-cb-layer--selected': layerState.selectedId === layer.id, 'wai-cb-layer--collapsed': layer.collapsed, 'wai-cb-layer--hidden': !layer.visible }"
                >
                    <div class="wai-cb-layer__header" @click="selectLayer(layer.id)">
                        <span class="wai-cb-layer__drag">⋮⋮</span>
                        <span class="wai-cb-layer__visibility" @click.stop="toggleVisibility(layer.id)" :title="layer.visible ? '숨김' : '표시'" v-html="layer.visible ? eyeIcon : eyeOffIcon"></span>
                        <span :class="'wai-cb-layer__icon ' + getLayerIconClass(layer.type)">{{ getLayerIcon(layer.type) }}</span>
                        <div class="wai-cb-layer__name">
                            <input type="text" class="wai-cb-layer__name-input" :value="layer.name" @input="renameLayer(layer.id, $event.target.value)" @click.stop />
                        </div>
                        <span class="wai-cb-layer__type">{{ getLayerLabel(layer.type) }}</span>
                        <div class="wai-cb-layer__actions">
                            <button class="wai-cb-layer__action" @click.stop="duplicateLayer(layer.id)" title="복제">📋</button>
                            <button class="wai-cb-layer__action" @click.stop="moveLayer(layer.id, 'up')" title="위로">↑</button>
                            <button class="wai-cb-layer__action" @click.stop="moveLayer(layer.id, 'down')" title="아래로">↓</button>
                            <button class="wai-cb-layer__action wai-cb-layer__action--delete" @click.stop="deleteLayer(layer.id)" title="삭제">✕</button>
                        </div>
                        <span class="wai-cb-layer__toggle" @click.stop="toggleCollapse(layer.id)">▼</span>
                    </div>
                    <div class="wai-cb-layer__body" v-show="!layer.collapsed">
                        <template v-if="layer.type === 'text'">
                            <clip-box-segment-track :clip-id="clipId" :layer-id="layer.id"></clip-box-segment-track>
                            <span class="wai-cb-label--section">스크립트 / 텍스트</span>
                            <textarea class="wai-cb-textarea" :value="layer.text" @input="setLayerText(layer.id, $event.target.value)" placeholder="텍스트를 입력하세요."></textarea>
                        </template>
                        <template v-else-if="layer.type === 'image'">
                            <span class="wai-cb-label--section">이미지 소스</span>
                            <div class="wai-cb-row"><input type="text" class="wai-cb-input wai-cb-grow" placeholder="이미지 URL 또는 파일 선택" /><button class="wai-cb-btn wai-cb-btn--xs">찾아보기</button></div>
                        </template>
                        <template v-else-if="layer.type === 'shape'">
                            <div class="wai-cb-row"><span class="wai-cb-label">도형</span><select class="wai-cb-select wai-cb-grow"><option value="rectangle">사각형</option><option value="ellipse">타원</option><option value="triangle">삼각형</option></select></div>
                        </template>
                        <template v-else-if="layer.type === 'audio'">
                            <span class="wai-cb-label--section">오디오 소스</span>
                            <div class="wai-cb-row"><input type="text" class="wai-cb-input wai-cb-grow" placeholder="오디오 URL 또는 파일 선택" /><button class="wai-cb-btn wai-cb-btn--xs">찾아보기</button></div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            showAddMenu: false,
            layerTypes: WAICB.Layer.TYPES,
            eyeIcon: WAICB.Icons.eye,
            eyeOffIcon: WAICB.Icons.eyeOff
        };
    },
    computed: {
        layerState: function() { return WAICB.Layer.getState(this.clipId); },
        layers: function() { return this.layerState.layers; }
    },
    mounted: function() {
        var self = this;
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.wai-cb-layers__actions')) self.showAddMenu = false;
        });
    },
    methods: {
        toggleAddMenu: function() { this.showAddMenu = !this.showAddMenu; },
        addLayer: function(type) { WAICB.Layer.addLayer(this.clipId, type); this.showAddMenu = false; this.$forceUpdate(); WAICB.Toast.success('레이어가 추가되었습니다'); },
        deleteLayer: function(layerId) { if (WAICB.Layer.deleteLayer(this.clipId, layerId)) { this.$forceUpdate(); WAICB.Toast.info('레이어가 삭제되었습니다'); } },
        duplicateLayer: function(layerId) { if (WAICB.Layer.duplicateLayer(this.clipId, layerId)) { this.$forceUpdate(); WAICB.Toast.success('레이어가 복제되었습니다'); } },
        moveLayer: function(layerId, direction) { if (WAICB.Layer.moveLayer(this.clipId, layerId, direction)) this.$forceUpdate(); },
        selectLayer: function(layerId) { this.layerState.selectedId = layerId; this.$forceUpdate(); },
        toggleVisibility: function(layerId) { WAICB.Layer.toggleVisibility(this.clipId, layerId); this.$forceUpdate(); },
        toggleCollapse: function(layerId) { WAICB.Layer.toggleCollapse(this.clipId, layerId); this.$forceUpdate(); },
        renameLayer: function(layerId, name) { var layer = WAICB.Layer.getLayer(this.clipId, layerId); if (layer) layer.name = name; },
        setLayerText: function(layerId, text) { WAICB.Layer.setLayerText(this.clipId, layerId, text); },
        collapseAll: function(collapse) { WAICB.Layer.collapseAll(this.clipId, collapse); this.$forceUpdate(); },
        getLayerIcon: function(type) { return this.layerTypes[type] ? this.layerTypes[type].icon : '?'; },
        getLayerIconClass: function(type) { return this.layerTypes[type] ? this.layerTypes[type].iconClass : ''; },
        getLayerLabel: function(type) { return this.layerTypes[type] ? this.layerTypes[type].label : type; }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 15: Vue 컴포넌트 - 오디오 에디터
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxAudioEditor = {
    props: ['clipId'],
    template: `
        <div :id="'clipbox-audio-' + clipId">
            <div class="wai-cb-audio-section">
                <div class="wai-cb-audio-section__title">배경음악</div>
                <div class="wai-cb-bgm-selector">
                    <div v-for="option in bgmOptions" :key="option.value" class="wai-cb-bgm-option" :class="{ 'wai-cb-bgm-option--active': selectedBgm === option.value }" @click="selectBgm(option.value)">{{ option.label }}</div>
                </div>
            </div>
            <div class="wai-cb-audio-section">
                <div class="wai-cb-audio-section__title">볼륨</div>
                <div class="wai-cb-slider"><span class="wai-cb-label">0%</span><input type="range" min="0" max="100" :value="volume" @input="setVolume($event.target.value)" /><span class="wai-cb-slider__value">{{ volume }}%</span></div>
            </div>
            <div class="wai-cb-audio-section">
                <div class="wai-cb-audio-section__title">볼륨 엔벨로프</div>
                <div class="wai-cb-envelope-wrap"><canvas ref="envelopeCanvas" class="wai-cb-envelope-canvas" @mousedown="onEnvelopeMouseDown" @mousemove="onEnvelopeMouseMove" @mouseup="onEnvelopeMouseUp" @mouseleave="onEnvelopeMouseUp" @dblclick="onEnvelopeDblClick" @contextmenu.prevent="onEnvelopeRightClick"></canvas></div>
                <div class="wai-cb-row wai-cb-row--between" style="margin-top: 4px;"><span class="wai-cb-text--small">더블클릭: 추가 | 우클릭: 삭제</span><button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="resetEnvelope">초기화</button></div>
            </div>
        </div>
    `,
    data: function() { return { bgmOptions: [{ value: 'none', label: '없음' }, { value: 'ambient', label: 'Ambient' }, { value: 'upbeat', label: 'Upbeat' }, { value: 'cinematic', label: 'Cinematic' }], selectedBgm: 'none', volume: 50 }; },
    mounted: function() { this.drawEnvelope(); },
    methods: {
        selectBgm: function(value) { this.selectedBgm = value; },
        setVolume: function(value) { this.volume = parseInt(value); },
        drawEnvelope: function() { if (this.$refs.envelopeCanvas) WAICB.EnvelopeEditor.draw(this.clipId, this.$refs.envelopeCanvas); },
        onEnvelopeMouseDown: function(e) { WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'mousedown', e.clientX, e.clientY); this.drawEnvelope(); },
        onEnvelopeMouseMove: function(e) { if (WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'mousemove', e.clientX, e.clientY)) this.drawEnvelope(); },
        onEnvelopeMouseUp: function(e) { WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'mouseup', e.clientX, e.clientY); },
        onEnvelopeDblClick: function(e) { if (WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'dblclick', e.clientX, e.clientY)) this.drawEnvelope(); },
        onEnvelopeRightClick: function(e) { if (WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'contextmenu', e.clientX, e.clientY)) this.drawEnvelope(); },
        resetEnvelope: function() { WAICB.EnvelopeEditor.reset(this.clipId); this.drawEnvelope(); }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 16: Vue 컴포넌트 - 레이아웃 에디터
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxLayoutEditor = {
    props: ['clipId'],
    template: `
        <div :id="'clipbox-layout-' + clipId">
            <div class="wai-cb-row wai-cb-row--between" style="margin-bottom: 6px;">
                <div class="wai-cb-row wai-cb-grow">
                    <span class="wai-cb-label">전역 템플릿</span>
                    <select class="wai-cb-select wai-cb-grow" v-model="globalTemplate">
                        <option value="default-intro">기본 인트로</option>
                        <option value="center-title">중앙 제목</option>
                        <option value="bottom-caption">하단 자막</option>
                        <option value="custom">사용자 정의</option>
                    </select>
                </div>
                <button class="wai-cb-btn wai-cb-btn--xs" @click="resetAllLayouts">전체 초기화</button>
            </div>
            <div class="wai-cb-layout-layers">
                <div v-if="layers.length === 0" class="wai-cb-layout-empty">BASIC 탭에서 레이어를 추가하세요.</div>
                <div v-for="layer in layers" :key="layer.id" class="wai-cb-layout-layer" :class="{ 'wai-cb-layout-layer--collapsed': layerCollapsed[layer.id] }">
                    <div class="wai-cb-layout-layer__header" @click="toggleLayoutLayer(layer.id)">
                        <div class="wai-cb-layout-layer__title">
                            <span :class="'wai-cb-layer__icon ' + getLayerIconClass(layer.type)">{{ getLayerIcon(layer.type) }}</span>
                            <span>{{ layer.name }}</span>
                        </div>
                        <span class="wai-cb-layout-layer__toggle">▼</span>
                    </div>
                    <div class="wai-cb-layout-layer__body" v-show="!layerCollapsed[layer.id]">
                        <div class="wai-cb-row" style="margin-bottom: 4px;">
                            <span class="wai-cb-label">템플릿</span>
                            <select class="wai-cb-select wai-cb-grow" :value="layer.layout.template" @change="setLayerTemplate(layer.id, $event.target.value)">
                                <option value="inherit">전역 설정 따름</option>
                                <option value="top-left">좌상단</option>
                                <option value="top-center">상단 중앙</option>
                                <option value="center">정중앙</option>
                                <option value="bottom-center">하단 중앙</option>
                                <option value="custom">사용자 정의</option>
                            </select>
                            <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="resetLayerLayout(layer.id)">초기화</button>
                        </div>
                        <span class="wai-cb-label--section">위치 / 크기 (px)</span>
                        <div class="wai-cb-layout-grid">
                            <div class="wai-cb-layout-grid__header">
                                <span></span><span class="wai-cb-layout-grid__label">X</span><span class="wai-cb-layout-grid__label">Y</span><span class="wai-cb-layout-grid__label">W</span><span class="wai-cb-layout-grid__label">H</span>
                            </div>
                            <div class="wai-cb-layout-grid__row">
                                <span class="wai-cb-label">위치</span>
                                <div class="wai-cb-spinbox">
                                    <button class="wai-cb-spinbox__btn" @click="adjustField(layer.id, 'x', -10)">−</button>
                                    <input type="number" class="wai-cb-input wai-cb-input--number" :value="layer.layout.x" @change="setField(layer.id, 'x', $event.target.value)" />
                                    <button class="wai-cb-spinbox__btn" @click="adjustField(layer.id, 'x', 10)">+</button>
                                </div>
                                <div class="wai-cb-spinbox">
                                    <button class="wai-cb-spinbox__btn" @click="adjustField(layer.id, 'y', -10)">−</button>
                                    <input type="number" class="wai-cb-input wai-cb-input--number" :value="layer.layout.y" @change="setField(layer.id, 'y', $event.target.value)" />
                                    <button class="wai-cb-spinbox__btn" @click="adjustField(layer.id, 'y', 10)">+</button>
                                </div>
                                <input type="number" class="wai-cb-input wai-cb-input--number" :value="layer.layout.w" @change="setField(layer.id, 'w', $event.target.value)" />
                                <input type="number" class="wai-cb-input wai-cb-input--number" :value="layer.layout.h" @change="setField(layer.id, 'h', $event.target.value)" />
                            </div>
                        </div>
                        <div class="wai-cb-row" style="margin-top: 6px;">
                            <span class="wai-cb-label">정렬</span>
                            <select class="wai-cb-select" :value="layer.layout.align" @change="setField(layer.id, 'align', $event.target.value)"><option value="left">좌측</option><option value="center">중앙</option><option value="right">우측</option></select>
                            <span class="wai-cb-label">세로</span>
                            <select class="wai-cb-select" :value="layer.layout.valign" @change="setField(layer.id, 'valign', $event.target.value)"><option value="top">상단</option><option value="middle">중앙</option><option value="bottom">하단</option></select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function() { return { globalTemplate: 'default-intro', layerCollapsed: {} }; },
    computed: {
        layers: function() { return WAICB.Layer.getLayers(this.clipId); }
    },
    methods: {
        getLayerIcon: function(type) { return WAICB.Layer.TYPES[type] ? WAICB.Layer.TYPES[type].icon : '?'; },
        getLayerIconClass: function(type) { return WAICB.Layer.TYPES[type] ? WAICB.Layer.TYPES[type].iconClass : ''; },
        toggleLayoutLayer: function(layerId) { this.$set(this.layerCollapsed, layerId, !this.layerCollapsed[layerId]); },
        setLayerTemplate: function(layerId, value) { WAICB.Layer.setLayerLayoutField(this.clipId, layerId, 'template', value); this.$forceUpdate(); },
        setField: function(layerId, field, value) { WAICB.Layer.setLayerLayoutField(this.clipId, layerId, field, parseInt(value) || value); this.$forceUpdate(); },
        adjustField: function(layerId, field, delta) { var layer = WAICB.Layer.getLayer(this.clipId, layerId); if (layer && layer.layout) { layer.layout[field] = (layer.layout[field] || 0) + delta; this.$forceUpdate(); } },
        resetLayerLayout: function(layerId) { var layer = WAICB.Layer.getLayer(this.clipId, layerId); if (layer) { layer.layout = { template: 'inherit', x: 120, y: 80, w: 640, h: 100, align: 'center', valign: 'middle' }; this.$forceUpdate(); WAICB.Toast.info('레이아웃이 초기화되었습니다'); } },
        resetAllLayouts: function() { var self = this; if (confirm('모든 레이어의 레이아웃을 초기화하시겠습니까?')) { this.layers.forEach(function(layer, idx) { layer.layout = { template: 'inherit', x: 120, y: 80 + idx * 50, w: 640, h: 100, align: 'center', valign: 'middle' }; }); this.$forceUpdate(); WAICB.Toast.info('모든 레이아웃이 초기화되었습니다'); } }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 17: Vue 컴포넌트 - 클립 아이템 (SPEED 탭 제거됨)
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxClipItem = {
    props: ['clip', 'index'],
    emits: ['update', 'delete', 'select'],
    components: {
        'clip-box-layers': ClipBoxLayers,
        'clip-box-audio-editor': ClipBoxAudioEditor,
        'clip-box-layout-editor': ClipBoxLayoutEditor
    },
    template: `
        <div :id="'clipbox-clip-' + clip.id" class="wai-cb-panel wai-cb-clip" :class="{ 'wai-cb-clip--collapsed': clip.isCollapsed }">
            <div class="wai-cb-clip__header">
                <div class="wai-cb-clip__title">
                    <input type="checkbox" class="wai-cb-checkbox" :checked="clip.isSelected" @change="toggleSelect" />
                    <span class="wai-cb-clip__order">#{{ index + 1 }}</span>
                    <span class="wai-cb-clip__handle">⋮⋮</span>
                    <input type="text" class="wai-cb-input wai-cb-clip__name" :value="clip.label" @input="updateLabel($event.target.value)" />
                    <select class="wai-cb-select" :value="clip.type" @change="updateType($event.target.value)">
                        <option value="narration">나레이션</option>
                        <option value="music">음악</option>
                        <option value="other">기타</option>
                    </select>
                </div>
                <div class="wai-cb-clip__controls">
                    <div class="wai-cb-clip__speed"><span class="wai-cb-label">속도</span><input type="number" step="0.1" min="0.1" max="3.0" class="wai-cb-input wai-cb-input--number" :value="clip.playbackSpeed" @input="updateSpeed($event.target.value)" /><span class="wai-cb-label">x</span></div>
                    <div class="wai-cb-clip__actions">
                        <button class="wai-cb-btn wai-cb-btn--xs" @click="playClip" title="재생">▶</button>
                        <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="toggleCollapse" title="접기/펼치기">{{ clip.isCollapsed ? '▼' : '▲' }}</button>
                        <button class="wai-cb-btn wai-cb-btn--danger wai-cb-btn--xs" @click="deleteClip" title="삭제">✕</button>
                    </div>
                </div>
            </div>
            <div class="wai-cb-clip__body" v-show="!clip.isCollapsed">
                <div class="wai-cb-tabs">
                    <button v-for="tab in tabs" :key="tab.id" class="wai-cb-tab" :class="{ 'wai-cb-tab--active': clip.activeTab === tab.id }" @click="setActiveTab(tab.id)">{{ tab.label }}</button>
                </div>
                <div class="wai-cb-tab-content" :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'basic' }"><clip-box-layers :clip-id="clip.id"></clip-box-layers></div>
                <div class="wai-cb-tab-content" :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'tts' }">
                    <div class="wai-cb-row"><span class="wai-cb-label">음성</span><select class="wai-cb-select wai-cb-grow"><option value="ko-KR-InJoonNeural">한국어 남성 (InJoon)</option><option value="ko-KR-SunHiNeural">한국어 여성 (SunHi)</option></select></div>
                    <div class="wai-cb-row"><button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--xs" @click="generateTts">🎙️ TTS 생성</button><span class="wai-cb-badge wai-cb-badge--warning">미생성</span></div>
                </div>
                <div class="wai-cb-tab-content" :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'image' }">
                    <span class="wai-cb-label--section">이미지 프롬프트</span>
                    <textarea class="wai-cb-textarea" placeholder="이미지 생성을 위한 프롬프트..."></textarea>
                    <div class="wai-cb-row"><button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--xs">🖼️ 이미지 생성</button><span class="wai-cb-badge wai-cb-badge--warning">미생성</span></div>
                </div>
                <div class="wai-cb-tab-content" :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'audio' }"><clip-box-audio-editor :clip-id="clip.id"></clip-box-audio-editor></div>
                <div class="wai-cb-tab-content" :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'layout' }"><clip-box-layout-editor :clip-id="clip.id"></clip-box-layout-editor></div>
                <div class="wai-cb-tab-content" :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'notes' }"><textarea class="wai-cb-textarea" placeholder="메모를 입력하세요."></textarea></div>
            </div>
        </div>
    `,
    data: function() { 
        return { 
            tabs: [
                { id: 'basic', label: 'BASIC' }, 
                { id: 'tts', label: 'TTS' }, 
                { id: 'image', label: 'IMAGE' }, 
                { id: 'audio', label: 'AUDIO' }, 
                { id: 'layout', label: 'LAYOUT' }, 
                { id: 'notes', label: 'NOTES' }
            ] 
        }; 
    },
    methods: {
        toggleSelect: function() { this.$emit('update', this.clip.id, { isSelected: !this.clip.isSelected }); },
        updateLabel: function(value) { this.$emit('update', this.clip.id, { label: value }); },
        updateType: function(value) { this.$emit('update', this.clip.id, { type: value }); },
        updateSpeed: function(value) { this.$emit('update', this.clip.id, { playbackSpeed: parseFloat(value) || 1.0 }); },
        toggleCollapse: function() { this.$emit('update', this.clip.id, { isCollapsed: !this.clip.isCollapsed }); },
        setActiveTab: function(tabId) { this.$emit('update', this.clip.id, { activeTab: tabId }); },
        deleteClip: function() { if (confirm('클립을 삭제하시겠습니까?')) this.$emit('delete', this.clip.id); },
        playClip: function() { WAICB.Toast.info('클립 재생 (구현 예정)'); },
        generateTts: function() { WAICB.Toast.info('TTS 생성 (API 연동 필요)'); }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 18: Vue 컴포넌트 - 일괄 설정 패널 (속도 탭 제거됨)
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxBulkPanel = {
    props: ['clipCount', 'selectedCount', 'ttsMissingCount', 'imgMissingCount'],
    emits: ['selectAll', 'deselectAll', 'applyAll', 'applySelected'],
    template: `
        <div class="wai-cb-bulk" :class="{ 'wai-cb-bulk--expanded': isExpanded }">
            <div class="wai-cb-bulk__header" @click="toggleExpand">
                <div class="wai-cb-bulk__header-left">
                    <span class="wai-cb-bulk__title">⚙️ 일괄 설정</span>
                    <span class="wai-cb-bulk__count">{{ selectedCount }}개 선택</span>
                </div>
                <span class="wai-cb-bulk__toggle">▼</span>
            </div>
            <div class="wai-cb-bulk__body">
                <div class="wai-cb-bulk__content">
                    <div class="wai-cb-stats">
                        <div class="wai-cb-stats__card"><div class="wai-cb-stats__value">{{ clipCount }}</div><div class="wai-cb-stats__label">전체 클립</div></div>
                        <div class="wai-cb-stats__card wai-cb-stats__card--warning"><div class="wai-cb-stats__value">{{ ttsMissingCount }}</div><div class="wai-cb-stats__label">TTS 미생성</div></div>
                        <div class="wai-cb-stats__card wai-cb-stats__card--warning"><div class="wai-cb-stats__value">{{ imgMissingCount }}</div><div class="wai-cb-stats__label">IMG 미생성</div></div>
                        <div class="wai-cb-stats__card"><div class="wai-cb-stats__value">{{ selectedCount }}</div><div class="wai-cb-stats__label">선택됨</div></div>
                    </div>
                    <div class="wai-cb-bulk-tabs">
                        <button v-for="tab in tabs" :key="tab.id" class="wai-cb-bulk-tab" :class="{ 'wai-cb-bulk-tab--active': activeTab === tab.id }" @click="activeTab = tab.id"><span>{{ tab.icon }}</span><span>{{ tab.label }}</span></button>
                    </div>
                    <div class="wai-cb-bulk-tab-content" :class="{ 'wai-cb-bulk-tab-content--active': activeTab === 'tts' }">
                        <div class="wai-cb-bulk-group"><div class="wai-cb-bulk-group__title">음성 설정</div>
                            <div class="wai-cb-bulk-row"><span class="wai-cb-bulk-row__label">음성</span><div class="wai-cb-bulk-row__control"><select class="wai-cb-select" v-model="ttsSettings.voice"><option value="ko-KR-InJoonNeural">한국어 남성 (InJoon)</option><option value="ko-KR-SunHiNeural">한국어 여성 (SunHi)</option></select></div></div>
                            <div class="wai-cb-bulk-row"><span class="wai-cb-bulk-row__label">속도</span><div class="wai-cb-bulk-row__control"><div class="wai-cb-slider"><input type="range" min="0.5" max="2.0" step="0.1" v-model="ttsSettings.speed"/><span class="wai-cb-slider__value">{{ ttsSettings.speed }}x</span></div></div></div>
                        </div>
                    </div>
                    <div class="wai-cb-bulk-tab-content" :class="{ 'wai-cb-bulk-tab-content--active': activeTab === 'audio' }">
                        <div class="wai-cb-bulk-group"><div class="wai-cb-bulk-group__title">BGM 설정</div>
                            <div class="wai-cb-bulk-row"><span class="wai-cb-bulk-row__label">BGM</span><div class="wai-cb-bulk-row__control"><select class="wai-cb-select" v-model="audioSettings.bgm"><option value="none">없음</option><option value="ambient">Ambient</option><option value="upbeat">Upbeat</option></select></div></div>
                            <div class="wai-cb-bulk-row"><span class="wai-cb-bulk-row__label">볼륨</span><div class="wai-cb-bulk-row__control"><div class="wai-cb-slider"><input type="range" min="0" max="100" step="1" v-model="audioSettings.volume"/><span class="wai-cb-slider__value">{{ audioSettings.volume }}%</span></div></div></div>
                        </div>
                    </div>
                    <div class="wai-cb-bulk-actions">
                        <div class="wai-cb-checkbox-group">
                            <label class="wai-cb-checkbox-item"><input type="checkbox" v-model="applyOptions.tts" /><span>TTS</span></label>
                            <label class="wai-cb-checkbox-item"><input type="checkbox" v-model="applyOptions.audio" /><span>AUDIO</span></label>
                        </div>
                        <div class="wai-cb-bulk-actions__right">
                            <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="$emit('selectAll')">전체 선택</button>
                            <button class="wai-cb-btn wai-cb-btn--ghost wai-cb-btn--xs" @click="$emit('deselectAll')">선택 해제</button>
                            <button class="wai-cb-btn wai-cb-btn--xs" :disabled="selectedCount === 0" @click="applyToSelected">적용 ({{ selectedCount }})</button>
                            <button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--xs" @click="applyToAll">전체 적용</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            isExpanded: false,
            activeTab: 'tts',
            tabs: [
                { id: 'tts', icon: '🎙️', label: 'TTS' }, 
                { id: 'audio', icon: '🎵', label: 'AUDIO' }
            ],
            ttsSettings: { voice: 'ko-KR-InJoonNeural', speed: 1.0 },
            audioSettings: { bgm: 'none', volume: 50 },
            applyOptions: { tts: true, audio: true }
        };
    },
    methods: {
        toggleExpand: function() { this.isExpanded = !this.isExpanded; },
        applyToSelected: function() { this.$emit('applySelected', { tts: this.ttsSettings, audio: this.audioSettings, options: this.applyOptions }); },
        applyToAll: function() { this.$emit('applyAll', { tts: this.ttsSettings, audio: this.audioSettings, options: this.applyOptions }); }
    }
};
/* 코드연결지점 - 이전 코드에서 계속 */

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 19: 메인 ClipBoxManager Vue 컴포넌트
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxManager = {
    components: {
        'clip-box-clip-item': ClipBoxClipItem,
        'clip-box-bulk-panel': ClipBoxBulkPanel
    },
    template: `
        <div id="clipbox-manager-root" class="wai-cb-root">
            <div class="wai-cb-panel" id="clipbox-manager-header">
                <div class="wai-cb-manager__header">
                    <div>
                        <h2 class="wai-cb-manager__title">ClipBox Manager</h2>
                        <p class="wai-cb-manager__meta">클립을 관리하고 일괄 설정을 적용하세요.</p>
                    </div>
                    <div class="wai-cb-manager__actions">
                        <button class="wai-cb-btn wai-cb-btn--xs" @click="openPromptModal" title="프롬프트 설정">📝</button>
                        <button class="wai-cb-btn wai-cb-btn--xs" @click="openApiModal" title="API 설정">🔑</button>
                        <button class="wai-cb-btn wai-cb-btn--primary wai-cb-btn--xs" @click="addClip"><span>+</span><span>클립 추가</span></button>
                    </div>
                </div>
                <div class="wai-cb-manager__filters">
                    <div class="wai-cb-manager__search">
                        <span class="wai-cb-label">검색</span>
                        <input type="text" class="wai-cb-input wai-cb-grow" placeholder="제목, 키워드..." v-model="searchQuery" />
                    </div>
                    <div class="wai-cb-row">
                        <span class="wai-cb-label">타입</span>
                        <select class="wai-cb-select" v-model="filterType">
                            <option value="all">전체</option>
                            <option value="narration">나레이션</option>
                            <option value="music">음악</option>
                            <option value="other">기타</option>
                        </select>
                    </div>
                </div>
                <div class="wai-cb-manager__stats">
                    <div class="wai-cb-row">
                        <span class="wai-cb-label">전역 속도</span>
                        <input type="number" step="0.1" min="0.1" max="3.0" class="wai-cb-input wai-cb-input--number" v-model.number="globalSpeed" />
                        <span class="wai-cb-label">x</span>
                    </div>
                    <div class="wai-cb-manager__badges">
                        <span class="wai-cb-badge">클립 {{ clips.length }}</span>
                        <span class="wai-cb-badge wai-cb-badge--warning">TTS 미생성 {{ ttsMissingCount }}</span>
                    </div>
                </div>
                <clip-box-bulk-panel
                    :clip-count="clips.length"
                    :selected-count="selectedCount"
                    :tts-missing-count="ttsMissingCount"
                    :img-missing-count="imgMissingCount"
                    @select-all="selectAll"
                    @deselect-all="deselectAll"
                    @apply-selected="applyToSelected"
                    @apply-all="applyToAll"
                ></clip-box-bulk-panel>
            </div>
            <div id="clipbox-clip-list">
                <div v-if="filteredClips.length === 0" class="wai-cb-panel"><div class="wai-cb-text--hint" style="padding: 16px;">클립이 없습니다. + 클립 추가 버튼을 클릭하세요.</div></div>
                <clip-box-clip-item
                    v-for="(clip, index) in filteredClips"
                    :key="clip.id"
                    :clip="clip"
                    :index="index"
                    @update="updateClip"
                    @delete="deleteClip"
                ></clip-box-clip-item>
            </div>
            <div class="wai-cb-ctx-overlay" id="clipbox-ctx-overlay"></div>
            <div class="wai-cb-ctx-menu" id="clipbox-ctx-menu">
                <div class="wai-cb-ctx-menu__header" id="clipbox-ctx-header">토큰 선택됨</div>
                <div class="wai-cb-ctx-menu__item" data-ctx-action="insertSilenceAfter"><span class="wai-cb-ctx-menu__icon">⏸</span><span>뒤에 무음 추가</span><span class="wai-cb-ctx-menu__shortcut">0.3s</span></div>
                <div class="wai-cb-ctx-menu__item" data-ctx-action="insertSilenceBefore"><span class="wai-cb-ctx-menu__icon">⏸</span><span>앞에 무음 추가</span><span class="wai-cb-ctx-menu__shortcut">0.3s</span></div>
                <div class="wai-cb-ctx-menu__divider"></div>
                <div class="wai-cb-ctx-menu__item" data-ctx-action="setSilence" data-duration="0.1"><span class="wai-cb-ctx-menu__icon">⚡</span><span>짧은 무음</span><span class="wai-cb-ctx-menu__shortcut">0.1s</span></div>
                <div class="wai-cb-ctx-menu__item" data-ctx-action="setSilence" data-duration="0.5"><span class="wai-cb-ctx-menu__icon">⏳</span><span>중간 무음</span><span class="wai-cb-ctx-menu__shortcut">0.5s</span></div>
                <div class="wai-cb-ctx-menu__item" data-ctx-action="setSilence" data-duration="1.0"><span class="wai-cb-ctx-menu__icon">⏰</span><span>긴 무음</span><span class="wai-cb-ctx-menu__shortcut">1.0s</span></div>
                <div class="wai-cb-ctx-menu__divider"></div>
                <div class="wai-cb-ctx-menu__item wai-cb-ctx-menu__item--danger" data-ctx-action="deleteToken" id="clipbox-ctx-delete"><span class="wai-cb-ctx-menu__icon">✕</span><span>무음 삭제</span></div>
            </div>
        </div>
    `,
    data: function() {
        return {
            clips: [],
            searchQuery: '',
            filterType: 'all',
            globalSpeed: 1.0
        };
    },
    computed: {
        filteredClips: function() {
            var self = this;
            return this.clips.filter(function(clip) {
                if (self.filterType !== 'all' && clip.type !== self.filterType) return false;
                if (self.searchQuery) {
                    var query = self.searchQuery.toLowerCase();
                    if (!clip.label.toLowerCase().includes(query)) return false;
                }
                return true;
            });
        },
        selectedCount: function() { return this.clips.filter(function(c) { return c.isSelected; }).length; },
        ttsMissingCount: function() { return this.clips.filter(function(c) { return c.ttsStatus === 'idle'; }).length; },
        imgMissingCount: function() { return this.clips.filter(function(c) { return c.imageStatus === 'idle'; }).length; }
    },
    mounted: function() {
        WAICB.Store.init();
        WAICB.ContextMenu.bindEvents();
        WAICB.Modal.bindEvents();
        this.addClip();
    },
    methods: {
        addClip: function() {
            var clip = WAICB.Store.addClip();
            WAICB.Layer.init(clip.id);
            this.clips = WAICB.Store.getAllClips();
            WAICB.Toast.success('클립 #' + (clip.order + 1) + '이(가) 추가되었습니다');
        },
        updateClip: function(clipId, updates) {
            WAICB.Store.updateClip(clipId, updates);
            this.clips = WAICB.Store.getAllClips();
        },
        deleteClip: function(clipId) {
            WAICB.Store.removeClip(clipId);
            this.clips = WAICB.Store.getAllClips();
            WAICB.Toast.info('클립이 삭제되었습니다');
        },
        selectAll: function() { WAICB.Store.selectAll(); this.clips = WAICB.Store.getAllClips(); },
        deselectAll: function() { WAICB.Store.deselectAll(); this.clips = WAICB.Store.getAllClips(); },
        applyToSelected: function(settings) {
            var selectedIds = WAICB.Store.getSelectedIds();
            if (selectedIds.length === 0) { WAICB.Toast.warning('선택된 클립이 없습니다'); return; }
            WAICB.Store.bulkApply(selectedIds, settings.options);
            WAICB.Toast.success(selectedIds.length + '개 클립에 설정이 적용되었습니다');
        },
        applyToAll: function(settings) {
            var count = WAICB.Store.bulkApplyAll(settings.options);
            WAICB.Toast.success(count + '개 클립에 설정이 적용되었습니다');
        },
        openPromptModal: function() { WAICB.Toast.info('프롬프트 설정 (구현 예정)'); },
        openApiModal: function() { WAICB.Toast.info('API 설정 (구현 예정)'); }
    }
};

window.ClipBoxManager = ClipBoxManager;

/* ═══════════════════════════════════════════════════════════════════════════
   END OF CLIPBOX MANAGER COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */


