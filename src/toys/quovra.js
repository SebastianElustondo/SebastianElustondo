/* QUOVRA — flip modules on, watch the client's site change. One IIFE, ES2019, no deps. */
(function () {
  'use strict';

  var NAME = 'quovra';
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function mount(root) {
    var section = root || document.getElementById(NAME);
    if (!section || section.__qvMounted) return;
    section.__qvMounted = true;

    var switches = [].slice.call(section.querySelectorAll('.qv-sw[role="switch"][data-mod]'));
    var screen = section.querySelector('.qv-screen');
    var site = section.querySelector('.qv-site');
    var toast = section.querySelector('.qv-toast');
    var counter = section.querySelector('.qv-onb-n');
    var secs = {};
    [].forEach.call(section.querySelectorAll('.qv-sec[data-sec]'), function (el) {
      secs[el.getAttribute('data-sec')] = el;
    });

    var done = false;
    var toastTimer = 0;
    var scrollTimer = 0;

    function isOn(sw) { return sw.getAttribute('aria-checked') === 'true'; }
    function motionless() { return reduce.matches; }

    // Scroll the phone screen (never the page) so the section that just appeared is in view.
    function reveal(sec) {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var top = Math.max(0, sec.offsetTop - 56);
        if (screen.scrollTo) screen.scrollTo({ top: top, behavior: motionless() ? 'auto' : 'smooth' });
        else screen.scrollTop = top;
      }, motionless() ? 0 : 120);
    }

    // Owner-only toast: "reportes" changes nothing on the public site.
    function showToast() {
      clearTimeout(toastTimer);
      toast.classList.add('show');
      toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3200);
    }

    function update() {
      var n = switches.filter(isOn).length;
      counter.textContent = n + (n === 1 ? ' module live.' : ' modules live.');
      if (!done && n >= 3) {
        done = true;
        section.dispatchEvent(new CustomEvent('toy:done', { bubbles: true, detail: { toy: NAME } }));
      }
    }

    function setMod(sw, on, silent) {
      var mod = sw.getAttribute('data-mod');
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
      var row = sw.parentNode;
      if (row && row.classList) row.classList.toggle('on', on);

      var sec = secs[mod];
      if (sec) {
        sec.classList.toggle('on', on);
        if (on && !silent && !site.classList.contains('unpub')) reveal(sec);
      }
      if (mod === 'sitio') {
        site.classList.toggle('unpub', !on);
        if (on && !silent) reveal(sec || site);
      }
      if (mod === 'reportes' && on && !silent) showToast();
      if (!silent) update();
    }

    // Wire the switches. Native <button> gives us Space/Enter for free; click covers mouse,
    // touch and pen via the browser's pointer pipeline.
    switches.forEach(function (sw) {
      sw.addEventListener('click', function (e) {
        e.stopPropagation();
        setMod(sw, !isOn(sw));
      });
      // The whole row is a hit target, but only the switch is focusable.
      var row = sw.parentNode;
      row.addEventListener('click', function (e) {
        if (e.target === sw || sw.contains(e.target)) return;
        sw.click();
      });
    });

    // Initial state from markup: only "sitio" starts on.
    switches.forEach(function (sw) { setMod(sw, isOn(sw), true); });
    update();
  }

  window.Toys = window.Toys || {};
  window.Toys[NAME] = { mount: mount };

  // Self-mount if the spine does not call mount(); mount() is idempotent.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mount(); });
  } else {
    mount();
  }
})();
