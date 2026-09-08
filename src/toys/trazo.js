/* TrazoLoco toy — strokes live as normalized 0..1 coordinates and are re-rendered on resize. */
(function () {
  'use strict';
  var WORDS = ['bicicleta', 'faro', 'tortuga', 'paraguas', 'cactus', 'submarino', 'helado', 'cohete', 'guitarra', 'molino'];
  var COLORS = '000000 666666 ffffff e53935 ff7043 ffd600 8bc34a 1e8e3e 00bcd4 1e88e5 3949ab 8e24aa ec407a 8d6e63 ffab91 fff59d a5d6a7 90caf9'.split(' ');
  var NAMES = 'negro gris blanco rojo naranja amarillo lima verde celeste azul índigo violeta rosa marrón durazno crema menta cielo'.split(' ');
  var SIZES = [4, 8, 16, 30];            // brush width per 1000px of canvas width (normalized, like the coordinates)
  var DOTS = [6, 10, 16, 24];            // swatch dot diameter in the toolbar
  var SIZE_NAMES = ['fino', 'medio', 'grueso', 'gigante'];
  var ROUND = 80000, HINT1 = 0.45, HINT2 = 0.75, CIRC = 106.8;

  function rnd(n) { return Math.floor(Math.random() * n); }

  function mount(section) {
    if (!section || section.__trazo) return;
    section.__trazo = 1;
    var $ = function (s) { return section.querySelector(s); };
    var canvas = $('.tz-canvas'), ctx = canvas.getContext('2d'), board = $('.tz-board');
    var wordEl = $('.tz-word'), secsEl = $('.tz-secs'), ring = $('.tz-ring'), clockEl = $('.tz-clock');
    var note = $('.tz-note'), noteP = $('.tz-note p'), noteS = $('.tz-note small'), hint = $('.tz-hint');
    var colorsEl = $('.tz-colors'), sizesEl = $('.tz-sizes');
    var eraserBtn = $('.tz-eraser'), undoBtn = $('.tz-undo'), clearBtn = $('.tz-clear');

    var W = 0, H = 0, dpr = 1, rect = null;
    var strokes = [], cleared = null, cur = null, pid = null;
    var color = '#000000', size = 1, eraser = false;
    var word = '', slots = [], revealed = 0, elapsed = 0, last = 0, timer = 0;
    var started = false, over = false, visible = false, done = false;

    /* ---------- toolbar ---------- */
    function btn(parent, label, pressed) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      parent.appendChild(b);
      return b;
    }
    COLORS.forEach(function (c, i) {
      var b = btn(colorsEl, 'color ' + NAMES[i], i === 0);
      b.style.setProperty('--c', '#' + c);
      b.dataset.c = '#' + c;
    });
    SIZES.forEach(function (s, i) {
      var b = btn(sizesEl, 'trazo ' + SIZE_NAMES[i], i === 1);
      b.dataset.s = i;
      var dot = document.createElement('i');
      dot.style.setProperty('--d', DOTS[i] + 'px');
      b.appendChild(dot);
    });
    function press(group, target) {
      Array.prototype.forEach.call(group.children, function (b) {
        b.setAttribute('aria-pressed', b === target ? 'true' : 'false');
      });
    }
    function setEraser(on) {
      eraser = on;
      eraserBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      board.classList.toggle('erasing', on);
    }
    colorsEl.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      color = b.dataset.c;
      press(colorsEl, b);
      setEraser(false);
    });
    sizesEl.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      size = +b.dataset.s;
      press(sizesEl, b);
    });
    eraserBtn.addEventListener('click', function () { setEraser(!eraser); });
    undoBtn.addEventListener('click', function () {
      if (strokes.length) strokes.pop();
      else if (cleared) { strokes = cleared; cleared = null; }
      redraw();
      syncBtns();
    });
    clearBtn.addEventListener('click', function () {
      if (!strokes.length) return;
      cleared = strokes;
      strokes = [];
      redraw();
      syncBtns();
    });
    $('.tz-listo').addEventListener('click', function () { finish('listo'); });
    $('.tz-again').addEventListener('click', newRound);
    section.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoBtn.click();
      }
    });
    function syncBtns() {
      undoBtn.disabled = !strokes.length && !cleared;
      clearBtn.disabled = !strokes.length;
    }

    /* ---------- canvas: retina-crisp, re-rendered from normalized strokes ---------- */
    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      redraw();
    }
    function pen(s) {
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = s.e ? 'destination-out' : 'source-over';
      ctx.strokeStyle = s.e ? '#000' : s.c;
      ctx.lineWidth = Math.max(1.5, s.w * W);
    }
    function X(p) { return p[0] * W; }
    function Y(p) { return p[1] * H; }
    function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
    // Full stroke: p0 → mid01, then quadratic through each point to the next midpoint, then → last.
    function path(P) {
      var n = P.length, m;
      ctx.beginPath();
      ctx.moveTo(X(P[0]), Y(P[0]));
      if (n === 1) ctx.lineTo(X(P[0]), Y(P[0]));
      else {
        m = mid(P[0], P[1]);
        ctx.lineTo(X(m), Y(m));
        for (var i = 1; i < n - 1; i++) {
          m = mid(P[i], P[i + 1]);
          ctx.quadraticCurveTo(X(P[i]), Y(P[i]), X(m), Y(m));
        }
        ctx.lineTo(X(P[n - 1]), Y(P[n - 1]));
      }
      ctx.stroke();
    }
    // Live drawing: only the newest piece, identical geometry to path() so the redraw matches.
    function tail(P) {
      var n = P.length, a, m;
      ctx.beginPath();
      if (n === 1) { ctx.moveTo(X(P[0]), Y(P[0])); ctx.lineTo(X(P[0]), Y(P[0])); }
      else if (n === 2) { m = mid(P[0], P[1]); ctx.moveTo(X(P[0]), Y(P[0])); ctx.lineTo(X(m), Y(m)); }
      else {
        a = mid(P[n - 3], P[n - 2]); m = mid(P[n - 2], P[n - 1]);
        ctx.moveTo(X(a), Y(a));
        ctx.quadraticCurveTo(X(P[n - 2]), Y(P[n - 2]), X(m), Y(m));
      }
      ctx.stroke();
    }
    function cap(P) {
      var n = P.length;
      if (n < 2) return;
      var a = mid(P[n - 2], P[n - 1]);
      ctx.beginPath();
      ctx.moveTo(X(a), Y(a));
      ctx.lineTo(X(P[n - 1]), Y(P[n - 1]));
      ctx.stroke();
    }
    function redraw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < strokes.length; i++) { pen(strokes[i]); path(strokes[i].p); }
      if (cur) { pen(cur); path(cur.p); }
    }

    /* ---------- pointer events (mouse, touch, pen) ---------- */
    function norm(e) {
      return [Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
              Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))];
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (pid !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      rect = canvas.getBoundingClientRect();
      pid = e.pointerId;
      try { canvas.setPointerCapture(pid); } catch (x) { /* fine */ }
      cur = { c: color, w: SIZES[size] / 1000 * (eraser ? 2 : 1), e: eraser, p: [norm(e)] };
      pen(cur);
      tail(cur.p);
      hint.hidden = true;
      if (!started && !over) { started = true; sync(); }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid || !cur) return;
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (!evs || !evs.length) evs = [e];
      pen(cur);
      for (var i = 0; i < evs.length; i++) {
        var p = norm(evs[i]), q = cur.p[cur.p.length - 1];
        if (Math.abs(p[0] - q[0]) * W < 1 && Math.abs(p[1] - q[1]) * H < 1) continue;
        cur.p.push(p);
        tail(cur.p);
      }
    });
    function up(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      if (!cur) return;
      pen(cur);
      cap(cur.p);
      strokes.push(cur);
      cur = null;
      cleared = null;
      syncBtns();
      if (strokes.length >= 3) fireDone();
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    window.addEventListener('pointerup', up); // release outside the canvas when capture was not granted

    /* ---------- word + clock ---------- */
    function reveal() {
      var free = [];
      slots.forEach(function (s, i) { if (!s.textContent) free.push(i); });
      if (!free.length) return;
      var i = free[rnd(free.length)];
      slots[i].textContent = word[i];
      slots[i].classList.add('on');
      revealed++;
    }
    function showAll() {
      slots.forEach(function (s, i) { s.textContent = word[i]; s.classList.add('all'); });
    }
    function paintClock(f) {
      var s = Math.max(0, Math.ceil((ROUND - elapsed) / 1000));
      secsEl.textContent = s;
      ring.style.strokeDashoffset = CIRC * f;
      clockEl.classList.toggle('low', s <= 10 && f < 1);
    }
    function tick() {
      var now = performance.now();
      elapsed += now - last;
      last = now;
      var f = Math.min(1, elapsed / ROUND);
      if (revealed < 1 && f >= HINT1) reveal();
      if (revealed < 2 && f >= HINT2) reveal();
      paintClock(f);
      if (f >= 1) finish('time');
    }
    // The clock only runs while the round is live, the section is on screen and the tab is visible.
    function sync() {
      var run = started && !over && visible && !document.hidden;
      if (run && !timer) { last = performance.now(); timer = setInterval(tick, 100); }
      else if (!run && timer) { clearInterval(timer); timer = 0; }
    }
    function finish(why) {
      if (over) return;
      over = true;
      sync();
      showAll();
      if (why === 'time') {
        paintClock(1);
        noteP.textContent = '¡Se acabó el tiempo!';
        noteS.textContent = 'la palabra era ' + word;
      } else {
        noteP.textContent = strokes.length ? '¡Trazo registrado! Estás cerquita 🔥' : '¡Trazo registrado! Minimalismo puro 🔥';
        noteS.textContent = 'la palabra era ' + word;
      }
      note.hidden = false;
      fireDone();
    }
    function newRound() {
      word = WORDS[rnd(WORDS.length)];
      wordEl.textContent = '';
      slots = [];
      for (var i = 0; i < word.length; i++) {
        var s = document.createElement('i');
        wordEl.appendChild(s);
        slots.push(s);
      }
      revealed = 0; elapsed = 0; started = false; over = false;
      strokes = []; cleared = null; cur = null; pid = null;
      note.hidden = true;
      hint.hidden = false;
      paintClock(0);
      redraw();
      syncBtns();
      sync();
    }
    function fireDone() {
      if (done) return;
      done = true;
      section.dispatchEvent(new CustomEvent('toy:done', { bubbles: true, detail: { toy: 'trazo' } }));
    }

    /* ---------- observers ---------- */
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(section);
    } else { visible = true; }
    document.addEventListener('visibilitychange', sync);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(board);
    else { window.addEventListener('resize', resize); resize(); }

    newRound();
  }

  window.Toys = window.Toys || {};
  window.Toys.trazo = { mount: mount };
  function auto() { mount(document.getElementById('trazo')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
