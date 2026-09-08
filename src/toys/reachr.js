/* Reachr. — drag a lead through the pipeline. One IIFE, no deps. */
(function () {
  'use strict';
  var STAGES = ['lead', 'contactado', 'cerrado', 'cobrado'];
  var LABEL = { lead: 'Lead', contactado: 'Contactado', cerrado: 'Cerrado', cobrado: 'Cobrado' };
  var CHIP = { contactado: 'seguimiento: mañana', cerrado: 'factura: vence el 10', cobrado: 'al día · cobrado' };
  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function $(root, sel) { return root.querySelector(sel); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function mount(section) {
    section = section || document.getElementById('reachr');
    if (!section || section.__rx) return;
    section.__rx = true;

    var board = $(section, '.board');
    var tally = $(section, '.tally output');
    var live = $(section, '.sr');
    var chat = $(section, '.chat');
    var ui = {
      to: $(chat, '.to'), wait: $(chat, '.wait'), bubble: $(chat, '.bubble'),
      txt: $(chat, '.txt'), caret: $(chat, '.caret'), meta: $(chat, '.meta'), time: $(chat, '.time')
    };
    var cols = {};
    STAGES.forEach(function (s) { cols[s] = $(board, '.col[data-stage="' + s + '"]'); });

    var done = false, inView = true, typer = 0, drag = null;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }).observe(section);
    }

    /* ---- pipeline state ---- */
    function stageOf(card) { return card.closest('.col').getAttribute('data-stage'); }

    function count() {
      var n = 0;
      STAGES.forEach(function (s) {
        var k = cols[s].querySelectorAll('.card').length;
        $(cols[s], '.n').textContent = k;
        if (s === 'cobrado') n = k;
      });
      if (tally.textContent !== String(n)) {
        tally.textContent = n;
        tally.classList.remove('bump');
        void tally.offsetWidth;
        tally.classList.add('bump');
      }
    }

    function chip(card, stage) {
      var c = $(card, '.chip');
      c.textContent = stage === 'lead' ? card.getAttribute('data-chip') : CHIP[stage];
      c.classList.toggle('late', stage === 'lead' && card.getAttribute('data-late') === '1');
      c.classList.toggle('ok', stage === 'cobrado');
    }

    function move(card, stage) {
      if (stageOf(card) === stage) return false;
      $(cols[stage], '.cards').appendChild(card);
      chip(card, stage);
      count();
      live.textContent = $(card, '.biz').textContent + ' → ' + LABEL[stage];
      if (stage === 'cobrado') collected(card);
      return true;
    }

    function collected(card) {
      if (!done) {
        done = true;
        section.dispatchEvent(new CustomEvent('toy:done', { bubbles: true, detail: { toy: 'reachr' } }));
      }
      compose(card);
    }

    /* ---- the reminder composes itself ---- */
    function text(card) {
      var to = card.getAttribute('data-to'), amt = card.getAttribute('data-amt'), svc = card.getAttribute('data-svc');
      return 'Hola ' + to + ', te escribo de Quovra 👋 Te paso el recordatorio del mes: USD ' + amt +
        ' por ' + svc + ', vence el 10. ¿Lo pasás por transferencia o MP? ¡Gracias!';
    }

    function compose(card) {
      clearTimeout(typer);
      var chars = Array.from(text(card)), i = 0;
      ui.to.textContent = 'para: ' + card.getAttribute('data-to') + ' · ' + $(card, '.biz').textContent;
      ui.wait.hidden = true;
      ui.bubble.hidden = false;
      ui.meta.hidden = true;
      ui.txt.textContent = '';
      if (reduced.matches) {
        ui.txt.textContent = chars.join('');
        sent(card);
        return;
      }
      chat.classList.add('typing');
      ui.caret.hidden = false;
      typer = setTimeout(function step() {
        if (document.hidden || !inView) { typer = setTimeout(step, 250); return; }
        if (i >= chars.length) { sent(card); return; }
        var ch = chars[i++];
        ui.txt.textContent += ch;
        var wait = 16 + Math.random() * 34;
        if (ch.length > 1) wait += 260;                 /* the emoji */
        else if (/[,.?!]/.test(ch)) wait += 150;
        else if (ch === ' ' && Math.random() < 0.15) wait += 80;
        typer = setTimeout(step, wait);
      }, 420);
    }

    function sent(card) {
      var d = new Date();
      chat.classList.remove('typing');
      ui.caret.hidden = true;
      ui.time.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
      ui.meta.hidden = false;
      live.textContent = 'Recordatorio enviado a ' + card.getAttribute('data-to');
    }

    /* ---- drag & drop (Pointer Events + capture) ---- */
    board.addEventListener('pointerdown', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (!card || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = {
        card: card, id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX,
        on: false, tilt: 0, ox: 0, oy: 0, ghost: null, layer: null, over: null, from: card.closest('.col')
      };
      try { card.setPointerCapture(e.pointerId); } catch (err) { /* older engines */ }
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerup', onUp);
      card.addEventListener('pointercancel', onCancel);
    });

    function unbind(card) {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onCancel);
    }

    function lift(e) {
      var card = drag.card, r = card.getBoundingClientRect();
      var layer = document.createElement('div');
      layer.className = 'w-reachr rx-layer';
      var g = card.cloneNode(true);
      g.classList.add('ghost');
      g.removeAttribute('tabindex');
      g.removeAttribute('aria-describedby');
      g.setAttribute('aria-hidden', 'true');
      g.style.width = r.width + 'px';
      g.style.height = r.height + 'px';
      layer.appendChild(g);
      document.body.appendChild(layer);
      drag.on = true;
      drag.ox = e.clientX - r.left;
      drag.oy = e.clientY - r.top;
      drag.ghost = g;
      drag.layer = layer;
      card.classList.add('lift');
      section.classList.add('dragging');
      place(e.clientX, e.clientY, 0, 1);
      /* next frame: settle into the "lifted" pose so the pick-up reads as motion */
      requestAnimationFrame(function () { if (drag && drag.ghost === g) { g.classList.add('snap'); place(drag.lx, drag.ly, 2 + drag.tilt, 1.03); } });
    }

    function place(x, y, rot, sc) {
      drag.ghost.style.transform = 'translate3d(' + (x - drag.ox) + 'px,' + (y - drag.oy) + 'px,0) rotate(' + rot + 'deg) scale(' + sc + ')';
    }

    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (dx * dx + dy * dy < 36) return;
        drag.ly = e.clientY;
        lift(e);
      } else if (drag.ghost.classList.contains('snap')) {
        drag.ghost.classList.remove('snap');
      }
      /* tilt follows horizontal velocity, eased */
      drag.tilt = clamp(drag.tilt * 0.7 + (e.clientX - drag.lx) * 0.06, -2.5, 2.5);
      drag.lx = e.clientX; drag.ly = e.clientY;
      place(e.clientX, e.clientY, 2 + drag.tilt, 1.03);

      var el = document.elementFromPoint(e.clientX, e.clientY);
      var col = el && el.closest ? el.closest('.col') : null;
      if (col && (!board.contains(col) || col === drag.from)) col = null;
      if (col !== drag.over) {
        if (drag.over) drag.over.classList.remove('over');
        if (col) col.classList.add('over');
        drag.over = col;
      }
      /* nudge the board when dragging near its edges (phones) */
      var b = board.getBoundingClientRect();
      if (e.clientX < b.left + 40) board.scrollLeft -= 14;
      else if (e.clientX > b.right - 40) board.scrollLeft += 14;
    }

    function onUp(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag, card = d.card;
      drag = null;
      unbind(card);
      if (!d.on) return;
      if (d.over) {
        d.over.classList.remove('over');
        move(card, d.over.getAttribute('data-stage'));
      }
      var r = card.getBoundingClientRect();
      var fin = function () {
        if (d.layer.parentNode) d.layer.parentNode.removeChild(d.layer);
        card.classList.remove('lift');
        section.classList.remove('dragging');
      };
      if (reduced.matches) { fin(); return; }
      d.ghost.classList.add('snap');
      d.ghost.style.transform = 'translate3d(' + r.left + 'px,' + r.top + 'px,0) rotate(0deg) scale(1)';
      setTimeout(fin, 210);
    }

    function onCancel(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.over) { drag.over.classList.remove('over'); drag.over = null; }
      onUp(e);
    }

    /* ---- keyboard path: → / ← (Home / End) move the focused card ---- */
    board.addEventListener('keydown', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (!card) return;
      var i = STAGES.indexOf(stageOf(card)), k = e.key, j;
      j = k === 'ArrowRight' ? i + 1 : k === 'ArrowLeft' ? i - 1 : k === 'End' ? 3 : k === 'Home' ? 0 : -1;
      if (j < 0 || j > 3 || j === i) return;
      e.preventDefault();
      if (move(card, STAGES[j])) card.focus({ preventScroll: true });
    });

    /* initial chips + counts */
    Array.prototype.forEach.call(board.querySelectorAll('.card'), function (c) { chip(c, stageOf(c)); });
    count();
  }

  window.Toys = window.Toys || {};
  window.Toys.reachr = { mount: mount };

  function boot() { mount(document.getElementById('reachr')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
