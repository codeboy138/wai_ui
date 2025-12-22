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
    TOAST_DURATION: 3000,
    SILENCE: {
        MIN: 0.1,
        MAX: 5.0,
        DEFAULT: 0.3,
        STEP: 0.1
    },
    SPEED: {
        MIN: 0.25,
        MAX: 4.0,
        PADDING: { top: 12, right: 8, bottom: 8, left: 28 }
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
        }
    },
    envelope: {
        flat: [
            { t: 0, v: 1 },
            { t: 1, v: 1 }
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
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 3: 토스트 알림
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
   SECTION 4: 세그먼트 시스템
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Segment = (function() {
    var states = {};
    var SILENCE = WAICB.CONST.SILENCE;

    // 한국어 조사 패턴
    var PARTICLE_PATTERNS = [
        /^(이|가|을|를|은|는|의|와|과|로|으로|에|에서|에게|한테|께|부터|까지|만|도|야|요|죠|네|군|데|지|걸|뿐)$/,
        /^(고|며|면|서|니|라|자|게|어|아|여|해|거|건|걸|군|네|죠|요)$/
    ];

    function getState(layerId) {
        if (!states[layerId]) {
            states[layerId] = {
                layerId: layerId,
                segments: [],
                selectedId: null
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

            // 줄바꿈 무음 추가
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
                    id: WAICB.Utils.uuid(),
                    type: 'silence',
                    duration: SILENCE.DEFAULT * 1.5,
                    isLineBreak: true
                };
            }
            return {
                id: WAICB.Utils.uuid(),
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
            id: WAICB.Utils.uuid(),
            type: 'silence',
            duration: WAICB.Utils.clamp(duration, SILENCE.MIN, SILENCE.MAX)
        };

        var insertIdx = position === 'after' ? idx + 1 : idx;
        state.segments.splice(insertIdx, 0, silence);
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
        return true;
    }

    function reset(layerId) {
        var state = getState(layerId);
        state.segments = [];
        state.selectedId = null;
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

/* 코드연결지점 */
/* 코드연결지점 */

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 5: 속도 에디터
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
                activePreset: 'flat'
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

    function createPresetIcon(points) {
        var w = 36, h = 18, pad = 2;
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

    function draw(clipId, canvas) {
        if (!canvas) return;

        var state = getState(clipId);
        var ctx = canvas.getContext('2d');
        var rect = canvas.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;

        // 캔버스 크기 설정
        var dpr = window.devicePixelRatio || 1;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, w, h);

        // 배경 영역
        var baseline1x = valueToY(1, h);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
        ctx.fillRect(SPEED.PADDING.left, SPEED.PADDING.top,
            w - SPEED.PADDING.left - SPEED.PADDING.right,
            baseline1x - SPEED.PADDING.top);
        ctx.fillStyle = 'rgba(234, 179, 8, 0.03)';
        ctx.fillRect(SPEED.PADDING.left, baseline1x,
            w - SPEED.PADDING.left - SPEED.PADDING.right,
            h - SPEED.PADDING.bottom - baseline1x);

        // 그리드
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

        // 기준선 (1x)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.moveTo(SPEED.PADDING.left, baseline1x);
        ctx.lineTo(w - SPEED.PADDING.right, baseline1x);
        ctx.stroke();

        // 속도 곡선
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
                var dx = x2 - x1;
                ctx.bezierCurveTo(x1 + dx * 0.6, y1, x2 - dx * 0.6, y2L, x2, y2L);
            }
            ctx.stroke();
        }

        // 플레이헤드
        var phX = tToX(state.playheadT, w);
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(phX, SPEED.PADDING.top);
        ctx.lineTo(phX, h - SPEED.PADDING.bottom);
        ctx.stroke();

        // 플레이헤드 화살표
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(phX - 4, SPEED.PADDING.top - 2);
        ctx.lineTo(phX + 4, SPEED.PADDING.top - 2);
        ctx.lineTo(phX, SPEED.PADDING.top + 5);
        ctx.closePath();
        ctx.fill();

        // 포인트들
        for (var k = 0; k < points.length; k++) {
            var p = points[k];
            var px = tToX(p.t, w);
            var py = valueToY(p.vL, h);
            var isSelected = state.selectedIdx === k;

            ctx.beginPath();
            ctx.moveTo(px, py - 5);
            ctx.lineTo(px + 5, py);
            ctx.lineTo(px, py + 5);
            ctx.lineTo(px - 5, py);
            ctx.closePath();

            ctx.fillStyle = isSelected ? '#fff' : '#ef4444';
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#eab308' : '#fff';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.stroke();
        }
    }

    function selectPreset(clipId, presetKey) {
        var state = getState(clipId);
        var preset = WAICB.PRESETS.speed[presetKey];
        if (!preset) return;

        state.points = WAICB.Utils.clone(preset.points);
        state.selectedIdx = null;
        state.activePreset = presetKey;
    }

    function addPoint(clipId) {
        var state = getState(clipId);
        var t = state.playheadT;
        var points = state.points;

        // 이미 가까운 포인트가 있는지 확인
        for (var i = 0; i < points.length; i++) {
            if (Math.abs(points[i].t - t) < 0.03) return;
        }

        // 현재 위치의 속도 계산
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

        // 새 포인트 선택
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
    }

    function getSpeedInfo(clipId) {
        var state = getState(clipId);
        var points = state.points;
        var t = state.playheadT;

        // 현재 위치의 속도 계산
        var v = 1;
        for (var i = 0; i < points.length - 1; i++) {
            if (t >= points[i].t && t <= points[i + 1].t) {
                var localT = (t - points[i].t) / (points[i + 1].t - points[i].t);
                v = points[i].vR + (points[i + 1].vL - points[i].vR) * localT;
                break;
            }
        }

        // 결과 듀레이션 계산
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
            selectedPoint: state.selectedIdx !== null ? ('P' + (state.selectedIdx + 1)) : '-'
        };
    }

    function handleCanvasEvent(clipId, canvas, eventType, clientX, clientY) {
        var state = getState(clipId);
        var rect = canvas.getBoundingClientRect();
        var x = clientX - rect.left;
        var y = clientY - rect.top;
        var w = rect.width;
        var h = rect.height;

        if (eventType === 'mousedown') {
            // 포인트 히트 테스트
            var hitRadius = 10;
            for (var i = 0; i < state.points.length; i++) {
                var p = state.points[i];
                var px = tToX(p.t, w);
                var py = valueToY(p.vL, h);
                if (Math.hypot(x - px, y - py) < hitRadius) {
                    state.selectedIdx = i;
                    state.dragging = 'point';
                    return true;
                }
            }
            // 플레이헤드 이동
            state.selectedIdx = null;
            state.playheadT = xToT(x, w);
            state.dragging = 'playhead';
            return true;
        }

        if (eventType === 'mousemove' && state.dragging) {
            if (state.dragging === 'playhead') {
                state.playheadT = xToT(x, w);
            } else if (state.dragging === 'point' && state.selectedIdx !== null) {
                var point = state.points[state.selectedIdx];
                var newV = yToValue(y, h);
                point.vL = newV;
                point.vR = newV;
            }
            return true;
        }

        if (eventType === 'mouseup') {
            state.dragging = null;
            return true;
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

/* 코드연결지점 */
/* 코드연결지점 */

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 6: 엔벨로프 에디터
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
        var pad = 6;

        var dpr = window.devicePixelRatio || 1;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, w, h);

        // 그리드
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (var i = 0; i <= 4; i++) {
            var y = pad + (i / 4) * (h - pad * 2);
            ctx.beginPath();
            ctx.moveTo(pad, y);
            ctx.lineTo(w - pad, y);
            ctx.stroke();
        }

        // 엔벨로프 곡선
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

            // 채우기
            ctx.lineTo(pad + (w - pad * 2), h - pad);
            ctx.lineTo(pad, h - pad);
            ctx.closePath();
            ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.fill();
        }

        // 포인트들
        var pointRadius = 4;
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
        var pad = 6;

        if (eventType === 'mousedown') {
            var hitRadius = 10;
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

            // 첫/마지막 포인트는 t 고정
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
   SECTION 7: 레이어 시스템
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
            id: 'layer-' + WAICB.Utils.uuid(),
            type: type,
            name: name,
            order: order,
            visible: true,
            collapsed: false,
            text: '',
            segments: []
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

        state.layers.splice(idx, 1);
        for (var j = 0; j < state.layers.length; j++) {
            state.layers[j].order = j;
        }

        if (state.selectedId === layerId) {
            state.selectedId = state.layers[Math.min(idx, state.layers.length - 1)].id;
        }

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
        newLayer.id = 'layer-' + WAICB.Utils.uuid();
        newLayer.name = original.name + ' 복사';
        newLayer.order = state.layers.length;

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

    function getLayer(clipId, layerId) {
        var state = getState(clipId);
        for (var i = 0; i < state.layers.length; i++) {
            if (state.layers[i].id === layerId) {
                return state.layers[i];
            }
        }
        return null;
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
        getLayer: getLayer,
        init: init
    };
})();

/* 코드연결지점 */
/* 코드연결지점 */

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 8: 클립 스토어
   ───────────────────────────────────────────────────────────────────────────── */
WAICB.Store = (function() {
    var clips = {};
    var clipOrder = [];
    var globalSettings = WAICB.Utils.clone(WAICB.DEFAULTS);

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
            playbackSpeed: 1.0
        };
    }

    function getClip(id) {
        return clips[id] ? WAICB.Utils.clone(clips[id]) : null;
    }

    function getAllClips() {
        return clipOrder.map(function(id) {
            return WAICB.Utils.clone(clips[id]);
        });
    }

    function getClipCount() {
        return clipOrder.length;
    }

    function addClip(initial) {
        initial = initial || {};
        var id = initial.id || ('clip-' + WAICB.Utils.uuid());
        var order = clipOrder.length;
        var clip = Object.assign({}, createClipDefaults(id, order), initial, { id: id, order: order });

        clips[id] = clip;
        clipOrder.push(id);

        // 레이어 초기화
        WAICB.Layer.init(id);

        return WAICB.Utils.clone(clip);
    }

    function updateClip(id, updates) {
        if (!clips[id]) return false;

        var safeUpdates = {};
        for (var key in updates) {
            if (key !== 'id' && key !== 'order') {
                safeUpdates[key] = updates[key];
            }
        }
        Object.assign(clips[id], safeUpdates);
        return true;
    }

    function removeClip(id) {
        if (!clips[id]) return false;

        delete clips[id];
        var idx = clipOrder.indexOf(id);
        if (idx > -1) {
            clipOrder.splice(idx, 1);
        }

        // 순서 재정렬
        for (var i = 0; i < clipOrder.length; i++) {
            clips[clipOrder[i]].order = i;
        }

        return true;
    }

    function getSelectedIds() {
        return clipOrder.filter(function(id) {
            return clips[id] && clips[id].isSelected;
        });
    }

    function selectAll() {
        for (var i = 0; i < clipOrder.length; i++) {
            clips[clipOrder[i]].isSelected = true;
        }
    }

    function deselectAll() {
        for (var i = 0; i < clipOrder.length; i++) {
            clips[clipOrder[i]].isSelected = false;
        }
    }

    function getGlobal() {
        return WAICB.Utils.clone(globalSettings);
    }

    function setGlobal(updates) {
        Object.assign(globalSettings, updates);
    }

    function setGlobalTts(updates) {
        Object.assign(globalSettings.tts, updates);
    }

    function reset() {
        clips = {};
        clipOrder = [];
        globalSettings = WAICB.Utils.clone(WAICB.DEFAULTS);
    }

    return {
        getClip: getClip,
        getAllClips: getAllClips,
        getClipCount: getClipCount,
        addClip: addClip,
        updateClip: updateClip,
        removeClip: removeClip,
        getSelectedIds: getSelectedIds,
        selectAll: selectAll,
        deselectAll: deselectAll,
        getGlobal: getGlobal,
        setGlobal: setGlobal,
        setGlobalTts: setGlobalTts,
        reset: reset
    };
})();

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 9: Vue 컴포넌트 - 클립 아이템
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxClipItem = {
    props: ['clip', 'index'],
    emits: ['update', 'delete', 'select'],
    template: `
        <div 
            :id="'clipbox-clip-' + clip.id"
            class="wai-cb-panel wai-cb-clip"
            :class="{ 'wai-cb-clip--collapsed': clip.isCollapsed }"
        >
            <!-- 클립 헤더 -->
            <div class="wai-cb-clip__header">
                <div class="wai-cb-clip__title">
                    <input 
                        type="checkbox" 
                        class="wai-cb-checkbox"
                        :checked="clip.isSelected"
                        @change="toggleSelect"
                    />
                    <span class="wai-cb-clip__order">#{{ index + 1 }}</span>
                    <span class="wai-cb-clip__handle">⋮⋮</span>
                    <input 
                        type="text" 
                        class="wai-cb-input wai-cb-clip__name"
                        :value="clip.label"
                        @input="updateLabel($event.target.value)"
                    />
                    <select 
                        class="wai-cb-select"
                        :value="clip.type"
                        @change="updateType($event.target.value)"
                    >
                        <option value="narration">나레이션</option>
                        <option value="music">음악</option>
                        <option value="other">기타</option>
                    </select>
                </div>
                <div class="wai-cb-clip__controls">
                    <div class="wai-cb-clip__speed">
                        <span class="wai-cb-label">속도</span>
                        <input 
                            type="number" 
                            step="0.1" 
                            min="0.1" 
                            max="3.0" 
                            class="wai-cb-input wai-cb-input--number"
                            :value="clip.playbackSpeed"
                            @input="updateSpeed($event.target.value)"
                        />
                        <span class="wai-cb-label">x</span>
                    </div>
                    <div class="wai-cb-clip__actions">
                        <button class="wai-cb-btn" @click="playClip" title="재생">▶</button>
                        <button class="wai-cb-btn wai-cb-btn--ghost" @click="toggleCollapse" title="접기/펼치기">
                            {{ clip.isCollapsed ? '▼' : '▲' }}
                        </button>
                        <button class="wai-cb-btn wai-cb-btn--danger" @click="deleteClip" title="삭제">✕</button>
                    </div>
                </div>
            </div>

            <!-- 클립 바디 -->
            <div class="wai-cb-clip__body" v-show="!clip.isCollapsed">
                <!-- 탭 네비게이션 -->
                <div class="wai-cb-tabs">
                    <button 
                        v-for="tab in tabs" 
                        :key="tab.id"
                        class="wai-cb-tab"
                        :class="{ 'wai-cb-tab--active': clip.activeTab === tab.id }"
                        @click="setActiveTab(tab.id)"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <!-- BASIC 탭 -->
                <div 
                    class="wai-cb-tab-content"
                    :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'basic' }"
                >
                    <clip-box-layers :clip-id="clip.id"></clip-box-layers>
                </div>

                <!-- TTS 탭 -->
                <div 
                    class="wai-cb-tab-content"
                    :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'tts' }"
                >
                    <div class="wai-cb-row">
                        <span class="wai-cb-label">음성</span>
                        <select class="wai-cb-select wai-cb-grow">
                            <option value="ko-KR-InJoonNeural">한국어 남성 (InJoon)</option>
                            <option value="ko-KR-SunHiNeural">한국어 여성 (SunHi)</option>
                        </select>
                    </div>
                    <div class="wai-cb-row">
                        <button class="wai-cb-btn wai-cb-btn--primary" @click="generateTts">
                            🎙️ TTS 생성
                        </button>
                        <span class="wai-cb-badge wai-cb-badge--warning">미생성</span>
                    </div>
                </div>

                <!-- SPEED 탭 -->
                <div 
                    class="wai-cb-tab-content"
                    :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'speed' }"
                >
                    <clip-box-speed-editor :clip-id="clip.id"></clip-box-speed-editor>
                </div>

                <!-- IMAGE 탭 -->
                <div 
                    class="wai-cb-tab-content"
                    :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'image' }"
                >
                    <span class="wai-cb-label--section">이미지 프롬프트</span>
                    <textarea 
                        class="wai-cb-textarea" 
                        placeholder="이미지 생성을 위한 프롬프트..."
                    ></textarea>
                    <div class="wai-cb-row">
                        <button class="wai-cb-btn wai-cb-btn--primary">🖼️ 이미지 생성</button>
                        <span class="wai-cb-badge wai-cb-badge--warning">미생성</span>
                    </div>
                </div>

                <!-- AUDIO 탭 -->
                <div 
                    class="wai-cb-tab-content"
                    :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'audio' }"
                >
                    <clip-box-audio-editor :clip-id="clip.id"></clip-box-audio-editor>
                </div>

                <!-- NOTES 탭 -->
                <div 
                    class="wai-cb-tab-content"
                    :class="{ 'wai-cb-tab-content--active': clip.activeTab === 'notes' }"
                >
                    <textarea 
                        class="wai-cb-textarea" 
                        placeholder="메모를 입력하세요."
                    ></textarea>
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            tabs: [
                { id: 'basic', label: 'BASIC' },
                { id: 'tts', label: 'TTS' },
                { id: 'speed', label: 'SPEED' },
                { id: 'image', label: 'IMAGE' },
                { id: 'audio', label: 'AUDIO' },
                { id: 'notes', label: 'NOTES' }
            ]
        };
    },
    methods: {
        toggleSelect: function() {
            this.$emit('update', this.clip.id, { isSelected: !this.clip.isSelected });
        },
        updateLabel: function(value) {
            this.$emit('update', this.clip.id, { label: value });
        },
        updateType: function(value) {
            this.$emit('update', this.clip.id, { type: value });
        },
        updateSpeed: function(value) {
            this.$emit('update', this.clip.id, { playbackSpeed: parseFloat(value) || 1.0 });
        },
        toggleCollapse: function() {
            this.$emit('update', this.clip.id, { isCollapsed: !this.clip.isCollapsed });
        },
        setActiveTab: function(tabId) {
            this.$emit('update', this.clip.id, { activeTab: tabId });
        },
        deleteClip: function() {
            if (confirm('클립을 삭제하시겠습니까?')) {
                this.$emit('delete', this.clip.id);
            }
        },
        playClip: function() {
            WAICB.Toast.info('클립 재생 (구현 예정)');
        },
        generateTts: function() {
            WAICB.Toast.info('TTS 생성 (API 연동 필요)');
        }
    }
};

/* 코드연결지점 */
/* 코드연결지점 */

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 10: Vue 컴포넌트 - 레이어 패널
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxLayers = {
    props: ['clipId'],
    template: `
        <div class="wai-cb-layers" :id="'clipbox-layers-' + clipId">
            <div class="wai-cb-layers__header">
                <div class="wai-cb-layers__title">
                    <span>📑 레이어</span>
                    <span class="wai-cb-layers__count">{{ layers.length }}</span>
                </div>
                <div class="wai-cb-layers__actions">
                    <button 
                        class="wai-cb-btn wai-cb-btn--ghost" 
                        @click="collapseAll(true)" 
                        title="모두 접기"
                    >⊟</button>
                    <button 
                        class="wai-cb-btn wai-cb-btn--ghost" 
                        @click="collapseAll(false)" 
                        title="모두 펼치기"
                    >⊞</button>
                    <button 
                        class="wai-cb-btn wai-cb-btn--primary" 
                        @click="toggleAddMenu"
                    >+ 추가</button>
                    <div 
                        class="wai-cb-layer-add-menu"
                        :class="{ 'wai-cb-layer-add-menu--visible': showAddMenu }"
                    >
                        <div 
                            v-for="(info, type) in layerTypes" 
                            :key="type"
                            class="wai-cb-layer-add-menu__item"
                            @click="addLayer(type)"
                        >
                            <span :class="'wai-cb-layer__icon ' + info.iconClass">{{ info.icon }}</span>
                            <span>{{ info.label }} 레이어</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="wai-cb-layers__list">
                <div 
                    v-if="layers.length === 0" 
                    class="wai-cb-layers__empty"
                >
                    레이어가 없습니다. + 추가 버튼을 클릭하세요.
                </div>
                <div
                    v-for="layer in layers"
                    :key="layer.id"
                    class="wai-cb-layer"
                    :class="{
                        'wai-cb-layer--selected': layerState.selectedId === layer.id,
                        'wai-cb-layer--collapsed': layer.collapsed,
                        'wai-cb-layer--hidden': !layer.visible
                    }"
                >
                    <div class="wai-cb-layer__header" @click="selectLayer(layer.id)">
                        <span class="wai-cb-layer__drag">⋮⋮</span>
                        <span 
                            class="wai-cb-layer__visibility" 
                            @click.stop="toggleVisibility(layer.id)"
                            :title="layer.visible ? '숨김' : '표시'"
                        >
                            <span v-if="layer.visible">👁</span>
                            <span v-else style="opacity:0.5">👁</span>
                        </span>
                        <span :class="'wai-cb-layer__icon ' + getLayerIconClass(layer.type)">
                            {{ getLayerIcon(layer.type) }}
                        </span>
                        <div class="wai-cb-layer__name">
                            <input 
                                type="text" 
                                class="wai-cb-layer__name-input"
                                :value="layer.name"
                                @input="renameLayer(layer.id, $event.target.value)"
                                @click.stop
                            />
                        </div>
                        <span class="wai-cb-layer__type">{{ getLayerLabel(layer.type) }}</span>
                        <div class="wai-cb-layer__actions">
                            <button 
                                class="wai-cb-layer__action" 
                                @click.stop="duplicateLayer(layer.id)"
                                title="복제"
                            >📋</button>
                            <button 
                                class="wai-cb-layer__action" 
                                @click.stop="moveLayer(layer.id, 'up')"
                                title="위로"
                            >↑</button>
                            <button 
                                class="wai-cb-layer__action" 
                                @click.stop="moveLayer(layer.id, 'down')"
                                title="아래로"
                            >↓</button>
                            <button 
                                class="wai-cb-layer__action wai-cb-layer__action--delete" 
                                @click.stop="deleteLayer(layer.id)"
                                title="삭제"
                            >✕</button>
                        </div>
                        <span 
                            class="wai-cb-layer__toggle"
                            @click.stop="toggleCollapse(layer.id)"
                        >▼</span>
                    </div>
                    <div class="wai-cb-layer__body" v-show="!layer.collapsed">
                        <!-- 텍스트 레이어 -->
                        <template v-if="layer.type === 'text'">
                            <div class="wai-cb-segment">
                                <div class="wai-cb-segment__header">
                                    <span class="wai-cb-label--section">세그먼트</span>
                                    <div class="wai-cb-row wai-cb-shrink">
                                        <button 
                                            class="wai-cb-btn wai-cb-btn--ghost"
                                            @click="syncSegments(layer.id)"
                                        >동기화</button>
                                        <button 
                                            class="wai-cb-btn wai-cb-btn--ghost"
                                            @click="resetSegments(layer.id)"
                                        >초기화</button>
                                    </div>
                                </div>
                                <div class="wai-cb-segment__track">
                                    <span 
                                        v-for="seg in getSegments(layer.id)"
                                        :key="seg.id"
                                        class="wai-cb-seg-token"
                                        :class="{
                                            'wai-cb-seg-token--text': seg.type === 'text',
                                            'wai-cb-seg-token--silence': seg.type === 'silence',
                                            'wai-cb-seg-token--linebreak': seg.isLineBreak
                                        }"
                                    >
                                        <template v-if="seg.type === 'text'">{{ seg.text }}</template>
                                        <template v-else>{{ seg.isLineBreak ? '↵ ' : '' }}[{{ seg.duration.toFixed(1) }}s]</template>
                                    </span>
                                </div>
                            </div>
                            <span class="wai-cb-label--section">스크립트 / 텍스트</span>
                            <textarea 
                                class="wai-cb-textarea"
                                :value="layer.text"
                                @input="setLayerText(layer.id, $event.target.value)"
                                placeholder="텍스트를 입력하세요."
                            ></textarea>
                        </template>
                        <!-- 이미지 레이어 -->
                        <template v-else-if="layer.type === 'image'">
                            <span class="wai-cb-label--section">이미지 소스</span>
                            <div class="wai-cb-row">
                                <input 
                                    type="text" 
                                    class="wai-cb-input wai-cb-grow" 
                                    placeholder="이미지 URL 또는 파일 선택"
                                />
                                <button class="wai-cb-btn">찾아보기</button>
                            </div>
                        </template>
                        <!-- 도형 레이어 -->
                        <template v-else-if="layer.type === 'shape'">
                            <div class="wai-cb-row">
                                <span class="wai-cb-label">도형</span>
                                <select class="wai-cb-select wai-cb-grow">
                                    <option value="rectangle">사각형</option>
                                    <option value="ellipse">타원</option>
                                    <option value="triangle">삼각형</option>
                                </select>
                            </div>
                        </template>
                        <!-- 오디오 레이어 -->
                        <template v-else-if="layer.type === 'audio'">
                            <span class="wai-cb-label--section">오디오 소스</span>
                            <div class="wai-cb-row">
                                <input 
                                    type="text" 
                                    class="wai-cb-input wai-cb-grow" 
                                    placeholder="오디오 URL 또는 파일 선택"
                                />
                                <button class="wai-cb-btn">찾아보기</button>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            showAddMenu: false,
            layerTypes: WAICB.Layer.TYPES
        };
    },
    computed: {
        layerState: function() {
            return WAICB.Layer.getState(this.clipId);
        },
        layers: function() {
            return this.layerState.layers;
        }
    },
    mounted: function() {
        var self = this;
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.wai-cb-layers__actions')) {
                self.showAddMenu = false;
            }
        });
    },
    methods: {
        toggleAddMenu: function() {
            this.showAddMenu = !this.showAddMenu;
        },
        addLayer: function(type) {
            WAICB.Layer.addLayer(this.clipId, type);
            this.showAddMenu = false;
            this.$forceUpdate();
            WAICB.Toast.success('레이어가 추가되었습니다');
        },
        deleteLayer: function(layerId) {
            if (WAICB.Layer.deleteLayer(this.clipId, layerId)) {
                this.$forceUpdate();
                WAICB.Toast.info('레이어가 삭제되었습니다');
            }
        },
        duplicateLayer: function(layerId) {
            if (WAICB.Layer.duplicateLayer(this.clipId, layerId)) {
                this.$forceUpdate();
                WAICB.Toast.success('레이어가 복제되었습니다');
            }
        },
        moveLayer: function(layerId, direction) {
            if (WAICB.Layer.moveLayer(this.clipId, layerId, direction)) {
                this.$forceUpdate();
            }
        },
        selectLayer: function(layerId) {
            this.layerState.selectedId = layerId;
            this.$forceUpdate();
        },
        toggleVisibility: function(layerId) {
            WAICB.Layer.toggleVisibility(this.clipId, layerId);
            this.$forceUpdate();
        },
        toggleCollapse: function(layerId) {
            WAICB.Layer.toggleCollapse(this.clipId, layerId);
            this.$forceUpdate();
        },
        renameLayer: function(layerId, name) {
            var layer = WAICB.Layer.getLayer(this.clipId, layerId);
            if (layer) {
                layer.name = name;
            }
        },
        setLayerText: function(layerId, text) {
            WAICB.Layer.setLayerText(this.clipId, layerId, text);
        },
        collapseAll: function(collapse) {
            var layers = this.layers;
            for (var i = 0; i < layers.length; i++) {
                layers[i].collapsed = collapse;
            }
            this.$forceUpdate();
        },
        getLayerIcon: function(type) {
            return this.layerTypes[type] ? this.layerTypes[type].icon : '?';
        },
        getLayerIconClass: function(type) {
            return this.layerTypes[type] ? this.layerTypes[type].iconClass : '';
        },
        getLayerLabel: function(type) {
            return this.layerTypes[type] ? this.layerTypes[type].label : type;
        },
        getSegments: function(layerId) {
            return WAICB.Segment.getState(layerId).segments;
        },
        syncSegments: function(layerId) {
            var layer = WAICB.Layer.getLayer(this.clipId, layerId);
            if (layer && layer.text) {
                WAICB.Segment.syncFromText(layerId, layer.text);
                this.$forceUpdate();
            } else {
                WAICB.Toast.warning('텍스트를 먼저 입력하세요');
            }
        },
        resetSegments: function(layerId) {
            WAICB.Segment.reset(layerId);
            this.$forceUpdate();
            WAICB.Toast.info('세그먼트가 초기화되었습니다');
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 11: Vue 컴포넌트 - 속도 에디터
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxSpeedEditor = {
    props: ['clipId'],
    template: `
        <div class="wai-cb-speed-editor" :id="'clipbox-speed-' + clipId">
            <!-- 프리셋 -->
            <div class="wai-cb-speed-presets">
                <div 
                    v-for="(preset, key) in presets"
                    :key="key"
                    class="wai-cb-speed-preset"
                    :class="{ 'wai-cb-speed-preset--active': state.activePreset === key }"
                    @click="selectPreset(key)"
                    v-html="getPresetIcon(key) + '<span class=\\'wai-cb-speed-preset__name\\'>' + preset.name + '</span>'"
                >
                </div>
            </div>
            
            <!-- 에디터 본체 -->
            <div class="wai-cb-speed-editor__header">
                <span class="wai-cb-label--section">속도 곡선</span>
                <div class="wai-cb-speed-duration">
                    <span class="wai-cb-speed-duration__value">{{ speedInfo.originalDuration }}s</span>
                    <span class="wai-cb-speed-duration__arrow">→</span>
                    <span class="wai-cb-speed-duration__value">{{ speedInfo.resultDuration }}s</span>
                </div>
            </div>
            
            <div class="wai-cb-speed-canvas-wrap">
                <div class="wai-cb-speed-y-labels">
                    <span>4x</span>
                    <span>2x</span>
                    <span class="wai-cb-speed-y-labels__baseline">1x</span>
                    <span>0.5x</span>
                    <span>0.25x</span>
                </div>
                <canvas 
                    ref="speedCanvas"
                    class="wai-cb-speed-canvas"
                    @mousedown="onCanvasMouseDown"
                    @mousemove="onCanvasMouseMove"
                    @mouseup="onCanvasMouseUp"
                    @mouseleave="onCanvasMouseUp"
                ></canvas>
            </div>
            
            <div class="wai-cb-speed-info">
                <div class="wai-cb-speed-info__item">
                    <div class="wai-cb-speed-info__label">위치</div>
                    <div class="wai-cb-speed-info__value">{{ speedInfo.time }}s</div>
                </div>
                <div class="wai-cb-speed-info__item">
                    <div class="wai-cb-speed-info__label">속도</div>
                    <div 
                        class="wai-cb-speed-info__value"
                        :class="getSpeedClass()"
                    >{{ speedInfo.speed }}x</div>
                </div>
                <div class="wai-cb-speed-info__item">
                    <div class="wai-cb-speed-info__label">포인트</div>
                    <div class="wai-cb-speed-info__value">{{ speedInfo.selectedPoint }}</div>
                </div>
            </div>
            
            <div class="wai-cb-speed-controls">
                <button class="wai-cb-btn wai-cb-btn--ghost" @click="resetSpeed">초기화</button>
                <button class="wai-cb-btn" @click="addPoint">+ 포인트</button>
            </div>
        </div>
    `,
    data: function() {
        return {
            presets: WAICB.PRESETS.speed
        };
    },
    computed: {
        state: function() {
            return WAICB.SpeedEditor.getState(this.clipId);
        },
        speedInfo: function() {
            return WAICB.SpeedEditor.getSpeedInfo(this.clipId);
        }
    },
    mounted: function() {
        this.drawCanvas();
    },
    methods: {
        getPresetIcon: function(key) {
            var preset = this.presets[key];
            return WAICB.SpeedEditor.createPresetIcon(preset.points);
        },
        selectPreset: function(key) {
            WAICB.SpeedEditor.selectPreset(this.clipId, key);
            this.drawCanvas();
            this.$forceUpdate();
        },
        addPoint: function() {
            WAICB.SpeedEditor.addPoint(this.clipId);
            this.drawCanvas();
            this.$forceUpdate();
        },
        resetSpeed: function() {
            WAICB.SpeedEditor.reset(this.clipId);
            this.drawCanvas();
            this.$forceUpdate();
        },
        drawCanvas: function() {
            var canvas = this.$refs.speedCanvas;
            if (canvas) {
                WAICB.SpeedEditor.draw(this.clipId, canvas);
            }
        },
        onCanvasMouseDown: function(e) {
            WAICB.SpeedEditor.handleCanvasEvent(this.clipId, this.$refs.speedCanvas, 'mousedown', e.clientX, e.clientY);
            this.drawCanvas();
            this.$forceUpdate();
        },
        onCanvasMouseMove: function(e) {
            if (WAICB.SpeedEditor.handleCanvasEvent(this.clipId, this.$refs.speedCanvas, 'mousemove', e.clientX, e.clientY)) {
                this.drawCanvas();
                this.$forceUpdate();
            }
        },
        onCanvasMouseUp: function(e) {
            WAICB.SpeedEditor.handleCanvasEvent(this.clipId, this.$refs.speedCanvas, 'mouseup', e.clientX, e.clientY);
        },
        getSpeedClass: function() {
            var speed = parseFloat(this.speedInfo.speed);
            if (speed > 1.1) return 'wai-cb-speed-info__value--fast';
            if (speed < 0.9) return 'wai-cb-speed-info__value--slow';
            return 'wai-cb-speed-info__value--normal';
        }
    }
};

/* 코드연결지점 */
/* 코드연결지점 */

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 12: Vue 컴포넌트 - 오디오 에디터
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxAudioEditor = {
    props: ['clipId'],
    template: `
        <div :id="'clipbox-audio-' + clipId">
            <div class="wai-cb-audio-section">
                <div class="wai-cb-audio-section__title">배경음악</div>
                <div class="wai-cb-bgm-selector">
                    <div 
                        v-for="option in bgmOptions"
                        :key="option.value"
                        class="wai-cb-bgm-option"
                        :class="{ 'wai-cb-bgm-option--active': selectedBgm === option.value }"
                        @click="selectBgm(option.value)"
                    >{{ option.label }}</div>
                </div>
            </div>
            <div class="wai-cb-audio-section">
                <div class="wai-cb-audio-section__title">볼륨</div>
                <div class="wai-cb-slider">
                    <span class="wai-cb-label">0%</span>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        :value="volume"
                        @input="setVolume($event.target.value)"
                    />
                    <span class="wai-cb-slider__value">{{ volume }}%</span>
                </div>
            </div>
            <div class="wai-cb-audio-section">
                <div class="wai-cb-audio-section__title">볼륨 엔벨로프</div>
                <div class="wai-cb-envelope-wrap">
                    <canvas 
                        ref="envelopeCanvas"
                        class="wai-cb-envelope-canvas"
                        @mousedown="onEnvelopeMouseDown"
                        @mousemove="onEnvelopeMouseMove"
                        @mouseup="onEnvelopeMouseUp"
                        @mouseleave="onEnvelopeMouseUp"
                        @dblclick="onEnvelopeDblClick"
                    ></canvas>
                </div>
                <div class="wai-cb-row wai-cb-row--between" style="margin-top: 8px;">
                    <span class="wai-cb-text--small">더블클릭: 추가</span>
                    <button class="wai-cb-btn wai-cb-btn--ghost" @click="resetEnvelope">초기화</button>
                </div>
            </div>
        </div>
    `,
    data: function() {
        return {
            bgmOptions: [
                { value: 'none', label: '없음' },
                { value: 'ambient', label: 'Ambient' },
                { value: 'upbeat', label: 'Upbeat' },
                { value: 'cinematic', label: 'Cinematic' }
            ],
            selectedBgm: 'none',
            volume: 50
        };
    },
    mounted: function() {
        this.drawEnvelope();
    },
    methods: {
        selectBgm: function(value) {
            this.selectedBgm = value;
        },
        setVolume: function(value) {
            this.volume = parseInt(value);
        },
        drawEnvelope: function() {
            var canvas = this.$refs.envelopeCanvas;
            if (canvas) {
                WAICB.EnvelopeEditor.draw(this.clipId, canvas);
            }
        },
        onEnvelopeMouseDown: function(e) {
            WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'mousedown', e.clientX, e.clientY);
            this.drawEnvelope();
        },
        onEnvelopeMouseMove: function(e) {
            if (WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'mousemove', e.clientX, e.clientY)) {
                this.drawEnvelope();
            }
        },
        onEnvelopeMouseUp: function(e) {
            WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'mouseup', e.clientX, e.clientY);
        },
        onEnvelopeDblClick: function(e) {
            WAICB.EnvelopeEditor.handleCanvasEvent(this.clipId, this.$refs.envelopeCanvas, 'dblclick', e.clientX, e.clientY);
            this.drawEnvelope();
        },
        resetEnvelope: function() {
            WAICB.EnvelopeEditor.reset(this.clipId);
            this.drawEnvelope();
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 13: Vue 컴포넌트 - 일괄 설정 패널
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxBulkPanel = {
    props: ['clipCount', 'selectedCount'],
    emits: ['selectAll', 'deselectAll', 'applyAll'],
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
                    <!-- 탭 -->
                    <div class="wai-cb-bulk-tabs">
                        <button 
                            v-for="tab in tabs"
                            :key="tab.id"
                            class="wai-cb-bulk-tab"
                            :class="{ 'wai-cb-bulk-tab--active': activeTab === tab.id }"
                            @click="activeTab = tab.id"
                        >
                            <span>{{ tab.icon }}</span>
                            <span>{{ tab.label }}</span>
                        </button>
                    </div>

                    <!-- TTS 탭 -->
                    <div 
                        class="wai-cb-bulk-tab-content"
                        :class="{ 'wai-cb-bulk-tab-content--active': activeTab === 'tts' }"
                    >
                        <div class="wai-cb-bulk-group">
                            <div class="wai-cb-bulk-group__title">음성 설정</div>
                            <div class="wai-cb-bulk-row">
                                <span class="wai-cb-bulk-row__label">음성</span>
                                <div class="wai-cb-bulk-row__control">
                                    <select class="wai-cb-select" v-model="ttsSettings.voice">
                                        <option value="ko-KR-InJoonNeural">한국어 남성 (InJoon)</option>
                                        <option value="ko-KR-SunHiNeural">한국어 여성 (SunHi)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="wai-cb-bulk-row">
                                <span class="wai-cb-bulk-row__label">속도</span>
                                <div class="wai-cb-bulk-row__control">
                                    <div class="wai-cb-slider">
                                        <input type="range" min="0.5" max="2.0" step="0.1" v-model="ttsSettings.speed"/>
                                        <span class="wai-cb-slider__value">{{ ttsSettings.speed }}x</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 오디오 탭 -->
                    <div 
                        class="wai-cb-bulk-tab-content"
                        :class="{ 'wai-cb-bulk-tab-content--active': activeTab === 'audio' }"
                    >
                        <div class="wai-cb-bulk-group">
                            <div class="wai-cb-bulk-group__title">BGM 설정</div>
                            <div class="wai-cb-bulk-row">
                                <span class="wai-cb-bulk-row__label">BGM</span>
                                <div class="wai-cb-bulk-row__control">
                                    <select class="wai-cb-select" v-model="audioSettings.bgm">
                                        <option value="none">없음</option>
                                        <option value="ambient">Ambient</option>
                                        <option value="upbeat">Upbeat</option>
                                    </select>
                                </div>
                            </div>
                            <div class="wai-cb-bulk-row">
                                <span class="wai-cb-bulk-row__label">볼륨</span>
                                <div class="wai-cb-bulk-row__control">
                                    <div class="wai-cb-slider">
                                        <input type="range" min="0" max="100" step="1" v-model="audioSettings.volume"/>
                                        <span class="wai-cb-slider__value">{{ audioSettings.volume }}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 속도 탭 -->
                    <div 
                        class="wai-cb-bulk-tab-content"
                        :class="{ 'wai-cb-bulk-tab-content--active': activeTab === 'speed' }"
                    >
                        <div class="wai-cb-bulk-group">
                            <div class="wai-cb-bulk-group__title">전역 재생속도</div>
                            <div class="wai-cb-bulk-row">
                                <span class="wai-cb-bulk-row__label">속도</span>
                                <div class="wai-cb-bulk-row__control">
                                    <div class="wai-cb-slider">
                                        <input type="range" min="0.25" max="3.0" step="0.05" v-model="speedSettings.speed"/>
                                        <span class="wai-cb-slider__value">{{ speedSettings.speed }}x</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 액션 버튼 -->
                    <div class="wai-cb-bulk-actions">
                        <button class="wai-cb-btn wai-cb-btn--ghost" @click="$emit('selectAll')">전체 선택</button>
                        <button class="wai-cb-btn wai-cb-btn--ghost" @click="$emit('deselectAll')">선택 해제</button>
                        <button 
                            class="wai-cb-btn wai-cb-btn--primary"
                            :disabled="selectedCount === 0"
                            @click="applyToSelected"
                        >적용 ({{ selectedCount }})</button>
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
                { id: 'audio', icon: '🎵', label: 'AUDIO' },
                { id: 'speed', icon: '⚡', label: '속도' }
            ],
            ttsSettings: {
                voice: 'ko-KR-InJoonNeural',
                speed: 1.0
            },
            audioSettings: {
                bgm: 'none',
                volume: 50
            },
            speedSettings: {
                speed: 1.0
            }
        };
    },
    methods: {
        toggleExpand: function() {
            this.isExpanded = !this.isExpanded;
        },
        applyToSelected: function() {
            this.$emit('applyAll', {
                tts: this.ttsSettings,
                audio: this.audioSettings,
                speed: this.speedSettings
            });
        }
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 14: 메인 ClipBoxManager Vue 컴포넌트
   ───────────────────────────────────────────────────────────────────────────── */
var ClipBoxManager = {
    components: {
        'clip-box-clip-item': ClipBoxClipItem,
        'clip-box-layers': ClipBoxLayers,
        'clip-box-speed-editor': ClipBoxSpeedEditor,
        'clip-box-audio-editor': ClipBoxAudioEditor,
        'clip-box-bulk-panel': ClipBoxBulkPanel
    },
    template: `
        <div id="clipbox-manager-root" class="wai-cb-root">
            <!-- 매니저 헤더 -->
            <div class="wai-cb-panel" id="clipbox-manager-header">
                <div class="wai-cb-manager__header">
                    <div>
                        <h2 class="wai-cb-manager__title">ClipBox Manager</h2>
                        <p class="wai-cb-manager__meta">클립을 관리하고 일괄 설정을 적용하세요.</p>
                    </div>
                    <div class="wai-cb-manager__actions">
                        <button class="wai-cb-btn wai-cb-btn--primary" @click="addClip">
                            <span>+</span>
                            <span>클립 추가</span>
                        </button>
                    </div>
                </div>
                <div class="wai-cb-manager__badges" style="margin-top: 8px;">
                    <span class="wai-cb-badge">클립 {{ clips.length }}</span>
                    <span class="wai-cb-badge wai-cb-badge--warning">TTS 미생성 {{ ttsMissingCount }}</span>
                </div>

                <!-- 일괄 설정 패널 -->
                <clip-box-bulk-panel
                    :clip-count="clips.length"
                    :selected-count="selectedCount"
                    @select-all="selectAll"
                    @deselect-all="deselectAll"
                    @apply-all="applyToSelected"
                ></clip-box-bulk-panel>
            </div>

            <!-- 클립 목록 -->
            <div id="clipbox-clip-list">
                <div v-if="clips.length === 0" class="wai-cb-panel">
                    <div class="wai-cb-text--hint" style="padding: 20px;">
                        클립이 없습니다. + 클립 추가 버튼을 클릭하세요.
                    </div>
                </div>
                <clip-box-clip-item
                    v-for="(clip, index) in clips"
                    :key="clip.id"
                    :clip="clip"
                    :index="index"
                    @update="updateClip"
                    @delete="deleteClip"
                ></clip-box-clip-item>
            </div>
        </div>
    `,
    data: function() {
        return {
            clips: []
        };
    },
    computed: {
        selectedCount: function() {
            return this.clips.filter(function(c) { return c.isSelected; }).length;
        },
        ttsMissingCount: function() {
            return this.clips.filter(function(c) { return c.ttsStatus === 'idle'; }).length;
        }
    },
    mounted: function() {
        // 초기 클립 추가
        this.addClip();
    },
    methods: {
        addClip: function() {
            var clip = WAICB.Store.addClip();
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
        selectAll: function() {
            WAICB.Store.selectAll();
            this.clips = WAICB.Store.getAllClips();
        },
        deselectAll: function() {
            WAICB.Store.deselectAll();
            this.clips = WAICB.Store.getAllClips();
        },
        applyToSelected: function(settings) {
            var selectedIds = WAICB.Store.getSelectedIds();
            if (selectedIds.length === 0) {
                WAICB.Toast.warning('선택된 클립이 없습니다');
                return;
            }
            WAICB.Toast.success(selectedIds.length + '개 클립에 설정이 적용되었습니다');
        }
    }
};

// 전역 등록
window.ClipBoxManager = ClipBoxManager;
/* ═══════════════════════════════════════════════════════════════════════════
   END OF CLIPBOX MANAGER COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
