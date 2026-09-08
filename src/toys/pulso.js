/* pulso — a blip orbits a ring; tap when it crosses the red arc. One IIFE; exposes window.Toys.pulso = { mount }. */
(function () {
  'use strict';
  var C = { bg: '#06090a', sig: '#39ff8f', red: '#ff3b3b', gold: '#ffcc33', dim: '#1f6b45', dtx: '#6fae86', wht: '#eafff5' };
  var TAU = Math.PI * 2;
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // QRS complex + an irregular "arritmia" burst, as ECG strip samples (px offsets from baseline).
  var QRS = [0, -2, -4, -2, 0, 3, -6, -14, -28, -16, -2, 6, 10, 5, 0, 0, 2, 3, 2, 0];
  var ARR = [0, 6, -10, 14, -6, 18, -22, 8, -4, 12, -9, 3, 0];

  function wrap(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function mount(section) {
    section = section || document.getElementById('pulso');
    if (!section || section.__pulso) return;
    section.__pulso = true;
    var $ = function (s) { return section.querySelector(s); };
    var crt = $('.crt'), cv = $('canvas'), ctx = cv.getContext('2d');
    var elBpm = $('.bpm'), elBest = $('.best'), elLives = $('.lives'), elSt = $('.status');
    var over = $('.over'), overSc = $('.over .sc'), again = $('.again');
    var font = (getComputedStyle(section).getPropertyValue('--mono') || '').trim() || 'ui-monospace, monospace';
    var W = 0, H = 0, R = 0, dpr = 1, raf = 0, last = 0, inView = false, fitted = false;
    var S = { best: 0, done: false };
    var ecg = [], ecgQ = [], ecgAcc = 0;
    var fx = { pulses: [], pops: [], flash: 0, shake: 0, core: 0 };

    // ---- state -------------------------------------------------------------
    function reset(state) {
      S.state = state; S.th = -Math.PI / 2; S.dir = 1; S.w = state === 'play' ? 1.9 : 1.5; S.h = 0.42;
      S.bpm = 0; S.lives = 3; S.hits = 0; S.flT = 0; S.beatT = 0; S.passed = false;
      place(); hud();
    }
    function start() {
      reset('play'); over.hidden = true; say('señal en curso', '');
      fx.pulses.length = fx.pops.length = 0; fx.flash = 0; ecgQ.length = 0;
    }
    function place() {
      S.a = wrap(S.th + S.dir * (1.4 + Math.random() * 2.4));
      S.passed = false; S.gold = (S.hits + 1) % 5 === 0;
    }
    function fg() { return S.w * 0.07 + 0.03; } // forgiveness: ~70 ms of travel + a hair
    function hud() {
      elBpm.textContent = pad(S.bpm); elBest.textContent = pad(S.best);
      elLives.textContent = '◉◉◉'.slice(0, S.lives) + '◎◎◎'.slice(S.lives);
    }
    function say(t, cls) { elSt.textContent = t; elSt.className = 'status ' + cls; }
    function done() {
      if (S.done) return; S.done = true;
      section.dispatchEvent(new CustomEvent('toy:done', { bubbles: true, detail: { toy: 'pulso' } }));
    }
    function tap() {
      var st = S.state;
      if (st === 'dead') { start(); return; }
      if (st !== 'play' && st !== 'idle') return;
      var inArc = Math.abs(wrap(S.th - S.a)) <= S.h + fg();
      if (st === 'idle') { S.state = 'play'; S.w = 1.9; say('señal en curso', ''); if (!inArc) return; }
      if (inArc) hit(); else miss();
    }
    function hit() {
      var gold = S.gold, pts = gold ? 3 : 1, bx = W / 2 + R * Math.cos(S.th), by = H / 2 + R * Math.sin(S.th);
      S.hits++; S.bpm += pts; if (S.bpm > S.best) S.best = S.bpm;
      S.h = Math.max(0.13, S.h * 0.94); S.w = Math.min(6.2, S.w * 1.05);
      if (Math.random() < 0.3) S.dir = -S.dir;
      place(); hud(); say('señal captada' + (gold ? ' · pico dorado' : ''), gold ? 'gold' : 'hit');
      fx.pulses.push({ t: 0, c: gold ? C.gold : C.sig }); fx.core = 0.14;
      fx.pops.push({ x: bx, y: by, t: 0, s: '+' + pts, c: gold ? C.gold : C.wht });
      enqueue(QRS, gold ? 1.3 : 1);
      if (S.bpm >= 10) done();
    }
    function miss() {
      S.lives--; fx.flash = 1; fx.shake = 0.18; place(); hud(); enqueue(ARR, 1);
      if (S.lives > 0) { say('arritmia', 'miss'); return; }
      S.state = 'over'; S.flT = 0; say('flatline', 'dead'); done();
    }
    function enqueue(p, k) { for (var i = 0; i < p.length; i++) ecgQ.push(p[i] * k); }

    // ---- simulation ---------------------------------------------------------
    function update(dt) {
      var st = S.state, i;
      fx.flash = Math.max(0, fx.flash - dt * 3); fx.shake = Math.max(0, fx.shake - dt); fx.core = Math.max(0, fx.core - dt);
      for (i = fx.pulses.length - 1; i >= 0; i--) if ((fx.pulses[i].t += dt) > 0.45) fx.pulses.splice(i, 1);
      for (i = fx.pops.length - 1; i >= 0; i--) if ((fx.pops[i].t += dt) > 0.75) fx.pops.splice(i, 1);
      // ECG strip: a faint autonomous beat every 1.4 s; hits and misses inject their own waveform.
      if (st === 'idle' || st === 'play') {
        S.beatT += dt; if (S.beatT > 1.4) { S.beatT = 0; if (!ecgQ.length) enqueue(QRS, 0.35); }
      }
      ecgAcc += dt * 110;
      while (ecgAcc >= 1) {
        ecgAcc -= 1;
        ecg.push(ecgQ.length ? ecgQ.shift() : (st === 'over' || st === 'dead') ? 0 : (Math.random() - 0.5) * 1.2);
        ecg.shift();
      }
      if (st === 'idle' || st === 'play') {
        var d0 = wrap(S.th - S.a);
        S.th = wrap(S.th + S.dir * S.w * dt);
        var d1 = wrap(S.th - S.a);
        if (d0 * S.dir < 0 && d1 * S.dir >= 0 && Math.abs(d1 - d0) < Math.PI) S.passed = true; // crossed the arc centre
        if (S.passed && Math.abs(d1) > S.h + fg()) { if (st === 'play') miss(); else place(); }
      } else if (st === 'over') {
        S.flT += dt;
        for (i = 0; i < ecg.length; i++) ecg[i] *= 0.86;
        if (S.flT > (RM ? 0.9 : 1.7)) {
          S.state = 'dead'; overSc.textContent = S.bpm + ' bpm · best ' + S.best; over.hidden = false;
          if (section.contains(document.activeElement)) { try { again.focus({ preventScroll: true }); } catch (e) { again.focus(); } }
        }
      }
    }

    // ---- rendering ----------------------------------------------------------
    function glow(c, b) { ctx.shadowColor = c; ctx.shadowBlur = b; ctx.strokeStyle = ctx.fillStyle = c; }
    function noglow() { ctx.shadowBlur = 0; }
    function draw() {
      if (!fitted) return;
      var cx = W / 2, cy = H / 2, st = S.state, dead = st === 'over' || st === 'dead', i, a;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      if (fx.shake > 0 && !RM) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
      ctx.lineCap = 'round';
      // dial ticks + dim ring
      ctx.globalAlpha = dead ? 0.3 : 1; ctx.strokeStyle = C.dim; ctx.lineWidth = 1; ctx.beginPath();
      for (i = 0; i < 60; i++) {
        a = i / 60 * TAU; var r0 = R + 12, r1 = r0 + (i % 5 ? 3 : 7);
        ctx.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)); ctx.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
      }
      ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
      // the critical arc
      if (!dead) {
        glow(S.gold ? C.gold : C.red, 22); ctx.lineWidth = 12; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.arc(cx, cy, R, S.a - S.h, S.a + S.h); ctx.stroke(); noglow(); ctx.lineCap = 'round';
      }
      // ECG strip through the centre
      var L = R * 1.4, x0 = cx - L / 2, step = L / (ecg.length - 1);
      glow(C.sig, 8); ctx.globalAlpha = dead ? 0.35 : 0.6; ctx.lineWidth = 1.5; ctx.beginPath();
      for (i = 0; i < ecg.length; i++) ctx.lineTo(x0 + i * step, cy + ecg[i]);
      ctx.stroke(); noglow(); ctx.globalAlpha = 1;
      // hit pulses
      for (i = 0; i < fx.pulses.length; i++) {
        var p = fx.pulses[i], k = p.t / 0.45;
        ctx.globalAlpha = (1 - k) * 0.7; glow(p.c, 16); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, R + k * 34, 0, TAU); ctx.stroke();
      }
      noglow(); ctx.globalAlpha = 1;
      // trail + blip
      var bx = cx + R * Math.cos(S.th), by = cy + R * Math.sin(S.th);
      if (!dead) {
        glow(C.sig, 14); ctx.globalAlpha = 0.35; ctx.lineWidth = 5; ctx.beginPath();
        var tl = Math.min(0.7, 0.18 + S.w * 0.08);
        if (S.dir > 0) ctx.arc(cx, cy, R, S.th - tl, S.th); else ctx.arc(cx, cy, R, S.th, S.th + tl);
        ctx.stroke(); ctx.globalAlpha = 1;
        glow(fx.core > 0 ? C.wht : C.sig, 24); ctx.beginPath(); ctx.arc(bx, by, 7, 0, TAU); ctx.fill();
        if (fx.core > 0) { ctx.beginPath(); ctx.arc(bx, by, 11, 0, TAU); ctx.globalAlpha = fx.core / 0.14; ctx.fill(); ctx.globalAlpha = 1; }
        noglow();
      } else {
        ctx.fillStyle = C.dim; ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill();
      }
      // score pops
      ctx.font = '700 15px ' + font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (i = 0; i < fx.pops.length; i++) {
        var q = fx.pops[i], u = q.t / 0.75, ang = Math.atan2(q.y - cy, q.x - cx);
        ctx.globalAlpha = 1 - u * u; glow(q.c, 10);
        ctx.fillText(q.s, q.x + Math.cos(ang) * (18 + u * 26), q.y + Math.sin(ang) * (18 + u * 26));
      }
      noglow(); ctx.globalAlpha = 1;
      // prompts
      ctx.font = '500 12px ' + font;
      if (st === 'idle') {
        ctx.fillStyle = C.sig; ctx.fillText('tap · click · space', cx, cy + R * 0.5);
        ctx.fillStyle = C.dtx; ctx.fillText('to start', cx, cy + R * 0.5 + 18);
      } else if (st === 'play') {
        ctx.fillStyle = C.dtx; ctx.globalAlpha = 0.7; ctx.fillText(S.gold ? 'pico dorado · ×3' : 'bpm ' + pad(S.bpm), cx, cy + R * 0.5); ctx.globalAlpha = 1;
      }
      // the miss flash
      if (fx.flash > 0) { ctx.fillStyle = 'rgba(255,59,59,' + (fx.flash * 0.28).toFixed(3) + ')'; ctx.fillRect(-8, -8, W + 16, H + 16); }
      // flatline: a bright horizontal line drawn across the whole screen
      if (dead) {
        var pr = Math.min(1, S.flT / (RM ? 0.35 : 0.95));
        glow(C.sig, 18); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, cy); ctx.lineTo(-8 + (W + 16) * pr, cy); ctx.stroke(); noglow();
      }
    }

    // ---- loop / lifecycle ---------------------------------------------------
    function loop(t) {
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      update(dt); draw(); raf = requestAnimationFrame(loop);
    }
    function setRun() {
      var should = inView && !document.hidden && fitted;
      if (should && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
      else if (!should && raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    function fit() {
      var r = crt.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = Math.round(r.width); H = Math.round(r.height); dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      R = Math.min(210, Math.max(120, Math.min(W, H) / 2 - 24));
      var n = Math.max(24, Math.floor(R * 1.4 / 2));
      if (ecg.length !== n) { ecg = []; for (var i = 0; i < n; i++) ecg.push(0); }
      fitted = true; draw(); setRun();
    }

    // ---- input --------------------------------------------------------------
    crt.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || e.target === again || S.state === 'dead' || S.state === 'over') return;
      e.preventDefault();
      try { crt.focus({ preventScroll: true }); } catch (err) { crt.focus(); }
      tap();
    });
    crt.addEventListener('keydown', function (e) {
      if (e.target === again || (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Enter')) return;
      e.preventDefault(); if (!e.repeat) tap();
    });
    document.addEventListener('keydown', function (e) {
      if (S.state !== 'play' || !inView || crt.contains(document.activeElement)) return;
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); if (!e.repeat) tap(); }
    });
    again.addEventListener('click', function () { start(); try { crt.focus({ preventScroll: true }); } catch (e) { crt.focus(); } });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; setRun(); }, { threshold: 0 }).observe(section);
    } else { inView = true; }
    document.addEventListener('visibilitychange', setRun);
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(crt); else window.addEventListener('resize', fit);

    reset('idle'); fit();
    return section;
  }

  window.Toys = window.Toys || {};
  window.Toys.pulso = { mount: mount };
  // Self-mount when the fragment is already on the page; mount() is idempotent, so a spine calling it again is harmless.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(); });
  else mount();
})();
