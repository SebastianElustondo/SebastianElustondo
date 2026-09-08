/* COBRO — ¿Cuánto cobro? — a working rate calculator */
(function () {
  'use strict';

  var DEF = { blue: 1450, mep: 1315, oficial: 1290, cripto: 1440 };
  var NAMES = { blue: 'Blue', mep: 'MEP', oficial: 'Oficial', cripto: 'Cripto' };
  var CASA = { blue: 'blue', bolsa: 'mep', oficial: 'oficial', cripto: 'cripto' };
  var API = 'https://dolarapi.com/v1/dolares';

  function fmt(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function fmt1(n) {
    return String(Math.round(n * 10) / 10).replace('.', ',');
  }
  function clamp(v, a, b) {
    v = parseFloat(v);
    if (!isFinite(v)) return a;
    return Math.min(b, Math.max(a, v));
  }
  function hhmm(t) {
    var d = new Date(t);
    return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  }

  function mount(section) {
    if (!section || section.getAttribute('data-mounted')) return;
    section.setAttribute('data-mounted', '1');

    var q = function (s) { return section.querySelector(s); };
    var rateN = q('#cobro-rate'), rateR = q('#cobro-rate-r');
    var hoursR = q('#cobro-hours'), hoursO = q('#cobro-hours-o');
    var factR = q('#cobro-fact'), factO = q('#cobro-fact-o');
    var fxIn = q('#cobro-fx'), fxRow = q('#cobro-fxrow'), src = q('#cobro-src');
    var total = q('#cobro-total'), hr = q('#cobro-hr'), hrs = q('#cobro-hrs');
    var worked = q('#cobro-worked'), fxl = q('#cobro-fxl');
    var copy = q('#cobro-copy'), ok = q('#cobro-ok'), urlBox = q('#cobro-url');
    var radios = section.querySelectorAll('input[name=cobro-dolar]');

    var rates = { blue: DEF.blue, mep: DEF.mep, oficial: DEF.oficial, cripto: DEF.cripto };
    var live = false, edited = false, updated = '';
    var done = false, shown = null, raf = 0, okTimer = 0;
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function dollar() {
      for (var i = 0; i < radios.length; i++) if (radios[i].checked) return radios[i].value;
      return 'blue';
    }
    function setDollar(d) {
      for (var i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === d;
    }
    function fill(r) {
      var min = +r.min, max = +r.max, v = clamp(r.value, min, max);
      r.style.setProperty('--p', ((v - min) / (max - min) * 100).toFixed(2) + '%');
    }

    /* the big number rolls to its new value; jumps under reduced motion */
    function show(target) {
      if (shown === null || reduce || document.hidden) {
        shown = target;
        total.textContent = fmt(target);
        return;
      }
      var from = shown, t0 = performance.now();
      cancelAnimationFrame(raf);
      (function step(now) {
        var k = Math.min(1, (now - t0) / 280);
        k = 1 - Math.pow(1 - k, 3);
        shown = from + (target - from) * k;
        total.textContent = fmt(shown);
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    }

    function state() {
      return {
        rate: clamp(rateR.value, 5, 150),
        hours: clamp(hoursR.value, 5, 60),
        fact: clamp(factR.value, 30, 100),
        dollar: dollar()
      };
    }

    function calc() {
      var s = state(), fx = rates[s.dollar];
      var monthly = s.hours * 52 / 12;
      var billed = monthly * s.fact / 100;
      hoursO.textContent = s.hours;
      factO.textContent = s.fact;
      hr.textContent = fmt(s.rate * fx);
      hrs.textContent = fmt1(billed);
      worked.textContent = fmt1(monthly);
      fxl.textContent = NAMES[s.dollar] + ' · ' + fmt(fx);
      fill(rateR); fill(hoursR); fill(factR);
      show(s.rate * fx * billed);
    }

    function source(msg, cls) {
      src.textContent = '';
      src.className = 'src' + (cls ? ' ' + cls : '');
      src.appendChild(document.createTextNode(msg));
      if (live) {
        src.appendChild(document.createTextNode(' · '));
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'lnk'; b.textContent = 'edit manually';
        b.addEventListener('click', function () { toManual(true); });
        src.appendChild(b);
      }
    }
    function syncFx() { fxIn.value = Math.round(rates[dollar()]); }
    function toManual(byChoice) {
      live = false;
      fxRow.hidden = false;
      syncFx();
      source(byChoice ? 'rates: manual, edit them' : 'rates: manual, edit them (dolarapi.com unreachable)', 'warn');
    }

    /* FX: never block; render with defaults first, upgrade if the network answers */
    function fetchFx() {
      if (typeof window.fetch !== 'function' || typeof window.AbortController !== 'function') { toManual(false); return; }
      var ac = new AbortController();
      var timer = setTimeout(function () { ac.abort(); }, 4000);
      fetch(API, { signal: ac.signal, mode: 'cors' })
        .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
        .then(function (list) {
          clearTimeout(timer);
          var got = 0, when = 0;
          (Array.isArray(list) ? list : []).forEach(function (x) {
            var k = x && CASA[x.casa], v = x && parseFloat(x.venta);
            if (!k || !(v > 0)) return;
            rates[k] = v; got++;
            var t = Date.parse(x.fechaActualizacion);
            if (t > when) when = t;
          });
          if (!got) throw new Error('empty');
          if (edited) return; /* the visitor already typed a rate; keep theirs */
          live = true;
          updated = hhmm(when || Date.now());
          fxRow.hidden = true;
          source('rates: dolarapi.com · updated ' + updated, 'live');
          calc();
        })
        .catch(function () { clearTimeout(timer); if (!edited) toManual(false); });
    }

    /* URL hash: #cobro?tarifa=25&horas=30&fact=60&dolar=mep */
    function readHash() {
      var h = location.hash || '', i = h.indexOf('?');
      if (h.indexOf('#cobro') !== 0 || i < 0 || typeof URLSearchParams !== 'function') return;
      var p = new URLSearchParams(h.slice(i + 1));
      if (p.has('tarifa')) rateR.value = rateN.value = clamp(p.get('tarifa'), 5, 150);
      if (p.has('horas')) hoursR.value = clamp(p.get('horas'), 5, 60);
      if (p.has('fact')) factR.value = clamp(p.get('fact'), 30, 100);
      var d = p.get('dolar');
      if (d && NAMES[d]) setDollar(d);
    }
    function writeHash() {
      var s = state();
      var hash = '#cobro?tarifa=' + s.rate + '&horas=' + s.hours + '&fact=' + s.fact + '&dolar=' + s.dollar;
      try { history.replaceState(null, '', hash); } catch (e) {}
      return location.origin + location.pathname + location.search + hash;
    }
    function flash(msg) {
      ok.textContent = msg;
      ok.classList.add('on');
      clearTimeout(okTimer);
      okTimer = setTimeout(function () { ok.classList.remove('on'); }, 1800);
    }
    function showUrl(url) {
      urlBox.value = url;
      urlBox.hidden = false;
      try { urlBox.focus(); urlBox.select(); } catch (e) {}
      flash('copy it from here');
    }
    copy.addEventListener('click', function () {
      var url = writeHash(), p = null;
      try { p = navigator.clipboard.writeText(url); } catch (e) {}
      if (p && typeof p.then === 'function') {
        p.then(function () { urlBox.hidden = true; flash('link copied'); }, function () { showUrl(url); });
      } else showUrl(url);
    });

    /* done: fire exactly once when any slider or the dollar selector changes */
    function fire() {
      if (done) return;
      done = true;
      section.dispatchEvent(new CustomEvent('toy:done', { bubbles: true, detail: { toy: 'cobro' } }));
    }

    rateR.addEventListener('input', function () { rateN.value = rateR.value; calc(); fire(); });
    rateN.addEventListener('input', function () {
      var v = parseFloat(rateN.value);
      if (isFinite(v)) { rateR.value = clamp(v, 5, 150); calc(); fire(); }
    });
    rateN.addEventListener('change', function () { rateN.value = clamp(rateN.value, 5, 150); rateR.value = rateN.value; calc(); });
    hoursR.addEventListener('input', function () { calc(); fire(); });
    factR.addEventListener('input', function () { calc(); fire(); });
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', function () { if (!live) syncFx(); calc(); fire(); });
    }
    fxIn.addEventListener('input', function () {
      var v = parseFloat(fxIn.value);
      if (!(v > 0)) return;
      rates[dollar()] = v;
      live = false; edited = true;
      source('rates: manual, edited by you', 'warn');
      calc();
    });
    fxIn.addEventListener('change', function () { if (!(parseFloat(fxIn.value) > 0)) syncFx(); });

    /* boot: hash → defaults on screen immediately → network, maybe */
    readHash();
    syncFx();
    fxRow.hidden = false;
    calc();
    fetchFx();
  }

  window.Toys = window.Toys || {};
  window.Toys.cobro = { mount: mount };

  /* self-mount if the spine hasn't already; mount() is idempotent */
  function auto() { var s = document.getElementById('cobro'); if (s) mount(s); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
