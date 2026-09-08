(function(){
  'use strict';
  var html = document.documentElement;
  var BA_TZ = 'America/Argentina/Buenos_Aires';

  /* ---------- hour override for previewing: ?ba=HH ---------- */
  var forced = null;
  try{ var m = /[?&]ba=(\d{1,2})/.exec(location.search); if(m) forced = Math.min(23, parseInt(m[1],10)); }catch(e){}

  function partsIn(tz, d){
    try{
      var f = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:tz});
      var p = f.formatToParts(d), o = {};
      p.forEach(function(x){ o[x.type] = x.value; });
      return {h: parseInt(o.hour,10) % 24, m: parseInt(o.minute,10)};
    }catch(e){ return {h: d.getHours(), m: d.getMinutes()}; }
  }
  function two(n){ return (n<10?'0':'')+n; }
  function baNow(){
    var d = new Date(), p = partsIn(BA_TZ, d);
    if(forced !== null) p.h = forced;
    return p;
  }

  /* ---------- palette by hour ---------- */
  var STATES = {
    night:   {sky1:'#0A0E22',sky2:'#1D1A40',horizon:'#3E2C3C',plaster:'#2B2637',plaster2:'#241F30',slab:'#181423',frame:'#15111F',sill:'#3A3348',glass:'#111328',glass2:'#1C2040',ink:'#F1E9DC',dim:'#AEA6BE',rule:'rgba(241,233,220,.16)',lamp:'#F0A64A','lamp-glow':'rgba(240,166,74,.55)',sign:'#F2B45C',walk:'#2A2735','walk-line':'#1E1B28',curb:'#4A4458',asphalt:'#141220',bar:'rgba(10,14,34,.82)',stars:1,moon:1,'lit-boost':1},
    dawn:    {sky1:'#1B2150',sky2:'#7A5375',horizon:'#E6A377',plaster:'#3C3448',plaster2:'#322B3D',slab:'#231D2E',frame:'#1C1727',sill:'#544A62',glass:'#2A2B4E',glass2:'#4A4270',ink:'#F6EEE0',dim:'#C4B8CC',rule:'rgba(246,238,224,.18)',lamp:'#F0A64A','lamp-glow':'rgba(240,166,74,.4)',sign:'#F5C079',walk:'#39323F','walk-line':'#2A2431',curb:'#5A5165',asphalt:'#1E1A28',bar:'rgba(27,33,80,.82)',stars:.35,moon:.6,'lit-boost':.8},
    day:     {sky1:'#6FA8DC',sky2:'#BDD6EA',horizon:'#E6ECF0',plaster:'#DCD2C4',plaster2:'#C6BAAA',slab:'#9E9081',frame:'#5C5148',sill:'#B3A697',glass:'#5C7291',glass2:'#8AA3BF',ink:'#1E1A2A',dim:'#5C5468',rule:'rgba(30,26,42,.16)',lamp:'#B8792A','lamp-glow':'rgba(184,121,42,0)',sign:'#7A4E14',walk:'#B9B0A3','walk-line':'#9E958A',curb:'#8B8073',asphalt:'#4B4A52',bar:'rgba(189,214,234,.82)',stars:0,moon:0,'lit-boost':.45},
    dusk:    {sky1:'#1F2352',sky2:'#7B4A66',horizon:'#E48D4C',plaster:'#3A3040',plaster2:'#2F2735',slab:'#201A28',frame:'#191420',sill:'#54485C',glass:'#2A2748',glass2:'#5A4270',ink:'#F3EBDD',dim:'#C0B3C4',rule:'rgba(243,235,221,.18)',lamp:'#F0A64A','lamp-glow':'rgba(240,166,74,.5)',sign:'#F5C079',walk:'#332C3A','walk-line':'#251F2C',curb:'#564C60',asphalt:'#1B1725',bar:'rgba(31,35,82,.82)',stars:.45,moon:.8,'lit-boost':.9},
    evening: {sky1:'#0E1230',sky2:'#2B2150',horizon:'#5A3A48',plaster:'#2F2940',plaster2:'#272236',slab:'#1A1526',frame:'#161222',sill:'#3F374F',glass:'#141630',glass2:'#22224A',ink:'#F1E9DC',dim:'#B3AAC2',rule:'rgba(241,233,220,.16)',lamp:'#F0A64A','lamp-glow':'rgba(240,166,74,.55)',sign:'#F2B45C',walk:'#2B2839','walk-line':'#1F1C2B',curb:'#4C465A',asphalt:'#151223',bar:'rgba(14,18,48,.82)',stars:.85,moon:1,'lit-boost':1}
  };
  function stateFor(h){
    if(h < 5) return 'night';
    if(h < 7) return 'dawn';
    if(h < 18) return 'day';
    if(h < 20) return 'dusk';
    return 'evening';
  }
  var currentState = null;
  function applyState(name){
    if(name === currentState) return;
    currentState = name;
    var s = STATES[name];
    for(var k in s){ html.style.setProperty('--'+k, String(s[k])); }
    html.setAttribute('data-state', name);
  }

  /* ---------- clocks + the dry line ---------- */
  var youTz = null;
  try{ youTz = Intl.DateTimeFormat().resolvedOptions().timeZone || null; }catch(e){}
  var whereEl = document.getElementById('clock-you-where');
  var city = youTz ? youTz.split('/').pop().replace(/_/g,' ') : 'Where you are';
  if(forced !== null) city = 'Where you are';
  var sameClock = false;
  function dryLine(h, t, diffH){
    var where = '';
    if(sameClock) where = ' Same clock as you.';
    else if(diffH !== null && diffH !== 0){ var a = Math.abs(diffH); where = ' ' + (a===1?'One hour':a+' hours') + (diffH>0?' ahead of you.':' behind you.'); }
    var line;
    if(h < 4)       line = "It's "+t+" here. I'm probably awake. This is the hour the five upstairs got built.";
    else if(h < 6)  line = "It's "+t+" here. If a light is on, it's a bug that wouldn't wait until morning.";
    else if(h < 9)  line = "It's "+t+" here. Coffee, then the day job. Write now; I read before I leave.";
    else if(h < 18) line = "It's "+t+" here. I'm at the day job. Write anyway; I answer after dark.";
    else if(h < 20) line = "It's "+t+" here. Day job's done. The lights upstairs are about to come on.";
    else            line = "It's "+t+" here. Night shift. Everything upstairs is running, and so am I.";
    return line + where;
  }
  var youEl = document.getElementById('clock-you'), baEl = document.getElementById('clock-ba'), dryEl = document.getElementById('dry');
  function tick(){
    var d = new Date();
    var you = partsIn(youTz || undefined, d);
    var ba = baNow();
    var t = two(ba.h)+':'+two(ba.m);
    youEl.textContent = two(you.h)+':'+two(you.m);
    baEl.textContent = t;
    var diff = null;
    if(forced === null){
      diff = (ba.h*60+ba.m) - (you.h*60+you.m);
      if(diff > 720) diff -= 1440; if(diff < -720) diff += 1440;
      diff = Math.round(diff/60);
      sameClock = (diff === 0);
    }
    whereEl.textContent = sameClock ? 'You, same clock' : city;
    dryEl.textContent = dryLine(ba.h, t, diff);
    var st = stateFor(ba.h);
    applyState(st);
  }
  tick();
  setInterval(tick, 10000);

  /* ---------- the block: 6 floors x 5 windows, exactly five lit ---------- */
  var COLS = ['A','B','C','D','E'];
  var LIT = {
    pulso: {floor:6,col:1,name:'Pulso',kind:'arcade',say:'Catch a heartbeat',bg:'#06090a',glow:'#39ff8f',ink:'#39ff8f',
      svg:'<svg viewBox="0 0 80 60" aria-hidden="true"><rect x="12" y="8" width="56" height="34" rx="2" fill="none" stroke="#39ff8f" stroke-width="3"/><polyline points="18,26 30,26 35,16 41,36 46,22 50,26 62,26" fill="none" stroke="#39ff8f" stroke-width="2.5" stroke-linejoin="round"/><rect x="34" y="44" width="12" height="6" fill="#39ff8f"/><rect x="24" y="50" width="32" height="3" fill="#39ff8f"/></svg>'},
    trazo: {floor:5,col:3,name:'TrazoLoco',kind:'multiplayer',say:'Draw a bicycle in 80 seconds',bg:'#f7f3e9',glow:'#ffe3ae',ink:'#2b2620',
      svg:'<svg viewBox="0 0 80 60" aria-hidden="true"><path d="M8 48 L8 16 Q24 10 40 16 L40 48 Q24 42 8 48 Z" fill="#fff" stroke="#2b2620" stroke-width="2.5"/><path d="M40 16 Q56 10 72 16 L72 48 Q56 42 40 48 Z" fill="#fff" stroke="#2b2620" stroke-width="2.5"/><circle cx="22" cy="34" r="6" fill="none" stroke="#d23b2f" stroke-width="2"/><circle cx="58" cy="34" r="6" fill="none" stroke="#2f6bd2" stroke-width="2"/><path d="M22 34 L34 22 L46 34 L58 34 M34 22 L44 22" fill="none" stroke="#2b2620" stroke-width="2"/><rect x="60" y="4" width="4" height="22" transform="rotate(35 62 15)" fill="#e0b52c" stroke="#2b2620" stroke-width="1.5"/></svg>'},
    quovra:{floor:4,col:0,name:'Quovra',kind:'SaaS platform',say:"Switch a barbershop's business on",bg:'#171310',glow:'#7fc99a',ink:'#F1EAE0',
      svg:'<svg viewBox="0 0 80 60" aria-hidden="true"><rect x="14" y="10" width="52" height="32" rx="2" fill="#221c17" stroke="#F1EAE0" stroke-width="2.5"/><rect x="18" y="14" width="44" height="24" fill="#2b241e"/><rect x="22" y="18" width="18" height="3" fill="#F1EAE0" opacity=".85"/><rect x="22" y="24" width="30" height="2" fill="#F1EAE0" opacity=".45"/><rect x="22" y="29" width="24" height="2" fill="#F1EAE0" opacity=".45"/><circle cx="56" cy="20" r="3.5" fill="#5FBF86"/><rect x="8" y="44" width="64" height="4" rx="1" fill="#F1EAE0"/></svg>'},
    reachr:{floor:3,col:2,name:'Reachr',kind:'CRM',say:'Collect a debt by dragging it',bg:'#FAF7F0',glow:'#cfe6c9',ink:'#2E6B4B',
      svg:'<svg viewBox="0 0 80 60" aria-hidden="true"><rect x="30" y="6" width="22" height="44" rx="4" fill="#fff" stroke="#2E6B4B" stroke-width="2.5"/><rect x="34" y="12" width="14" height="28" fill="#DCEBDD"/><circle cx="41" cy="45" r="1.8" fill="#2E6B4B"/><path d="M22 20 Q14 28 22 36" fill="none" stroke="#2E6B4B" stroke-width="2.5"/><path d="M58 20 Q66 28 58 36" fill="none" stroke="#2E6B4B" stroke-width="2.5"/><path d="M15 15 Q4 28 15 41" fill="none" stroke="#2E6B4B" stroke-width="2" opacity=".5"/><path d="M65 15 Q76 28 65 41" fill="none" stroke="#2E6B4B" stroke-width="2" opacity=".5"/></svg>'},
    cobro: {floor:2,col:4,name:'¿Cuánto cobro?',kind:'tool',say:'Price your hour in pesos',bg:'#FAF7F0',glow:'#f7e2b0',ink:'#1C1813',
      svg:'<svg viewBox="0 0 80 60" aria-hidden="true"><rect x="16" y="6" width="48" height="48" fill="#fff" stroke="#1C1813" stroke-width="2.5"/><line x1="22" y1="18" x2="58" y2="18" stroke="#1C1813" stroke-width="2"/><line x1="22" y1="27" x2="50" y2="27" stroke="#1C1813" stroke-width="1.5" opacity=".6"/><line x1="22" y1="34" x2="54" y2="34" stroke="#1C1813" stroke-width="1.5" opacity=".6"/><line x1="22" y1="41" x2="46" y2="41" stroke="#1C1813" stroke-width="1.5" opacity=".6"/><text x="44" y="51" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#1F7A45">$</text></svg>'}
  };
  var byPos = {};
  Object.keys(LIT).forEach(function(k){ var w = LIT[k]; byPos[w.floor+'-'+w.col] = k; });

  var floors = document.getElementById('floors');
  var frag = document.createDocumentFragment();
  for(var f = 6; f >= 1; f--){
    var row = document.createElement('div'); row.className = 'floor';
    for(var c = 0; c < 5; c++){
      var cell = document.createElement('div'); cell.className = 'cell';
      var key = byPos[f+'-'+c];
      var win;
      if(key){
        var w = LIT[key];
        win = document.createElement('a');
        win.href = '#'+key;
        win.className = 'win lit';
        win.setAttribute('data-win', key);
        win.setAttribute('aria-label', f+'º '+COLS[c]+'. '+w.say+'. '+w.name+', '+w.kind+'.');
        win.style.setProperty('--wc', w.bg);
        win.style.setProperty('--wg', w.glow);
        win.innerHTML = w.svg;
      }else{
        win = document.createElement('div'); win.className = 'win'; win.setAttribute('aria-hidden','true');
      }
      cell.appendChild(win);
      if(c === 0 || c === 4){ var r = document.createElement('div'); r.className = 'rail'; cell.appendChild(r); }
      row.appendChild(cell);
    }
    frag.appendChild(row);
  }
  floors.appendChild(frag);

  /* hover / focus: brighten the window, print its sentence, echo it in the directory */
  var caption = document.getElementById('caption');
  var defaultCaption = caption.textContent;
  var dir = document.getElementById('dir');
  function hot(key, on){
    document.querySelectorAll('[data-win="'+key+'"]').forEach(function(el){ el.classList.toggle('hot', on); });
    if(on){
      var w = LIT[key];
      caption.innerHTML = '<span class="apt">'+w.floor+'º '+COLS[w.col]+'</span><b>'+w.say+'</b><br>'+w.name+' · '+w.kind+'. Click to go in.';
    }else{
      caption.textContent = defaultCaption;
    }
  }
  function wire(root){
    root.addEventListener('mouseover', function(e){ var a = e.target.closest('[data-win]'); if(a) hot(a.getAttribute('data-win'), true); });
    root.addEventListener('mouseout',  function(e){ var a = e.target.closest('[data-win]'); if(a) hot(a.getAttribute('data-win'), false); });
    root.addEventListener('focusin',   function(e){ var a = e.target.closest('[data-win]'); if(a) hot(a.getAttribute('data-win'), true); });
    root.addEventListener('focusout',  function(e){ var a = e.target.closest('[data-win]'); if(a) hot(a.getAttribute('data-win'), false); });
  }
  wire(floors); wire(dir);

  /* ---------- intercom ---------- */
  var DRAFTS = {
    role: {subject:'A remote role', body:"Hi Sebastián,\n\nI'm [name] at [company]. We're hiring a [role] on a remote team ([time zone]). Your years at Mercado Libre and Conekta, plus the fact that you ship and run your own products, caught my eye.\n\nCould we talk this week?\n\n[name]"},
    build:{subject:'A fixed-scope build', body:"Hi Sebastián,\n\nI need [what] built. Rough scope: [scope]. Budget range: [range]. Timeline: [when].\n\nWould you take it on, and what do you need from me to quote it?\n\n[name]"},
    talk: {subject:'Just saying hi', body:"Hi Sebastián,\n\nNo job, no brief. I found the building and [what caught your eye].\n\n[whatever is on your mind]\n\n[name]"}
  };
  var about = null;
  var msg = document.getElementById('msg'), led = document.getElementById('led'), hint = document.getElementById('ring-hint');
  var btns = document.querySelectorAll('.about button');
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      about = b.getAttribute('data-about');
      btns.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      msg.value = DRAFTS[about].body;
      led.classList.add('on');
      hint.textContent = 'line open';
      msg.focus();
      try{ msg.setSelectionRange(msg.value.indexOf('['), msg.value.indexOf(']')+1); }catch(e){}
    });
  });
  document.getElementById('intercom').addEventListener('submit', function(e){
    e.preventDefault();
    var subject = about ? DRAFTS[about].subject : 'Ringing from your portfolio';
    var body = msg.value.trim() || 'Hi Sebastián,\n\n';
    hint.textContent = 'ringing…';
    location.href = 'mailto:sebastianelustondo@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    setTimeout(function(){ hint.textContent = about ? 'line open' : 'pick one'; }, 1600);
  });

  /* the street lamp's cone starts at the lamp head, wherever the layout put it */
  function aimCone(){
    var g = document.getElementById('ground'), lamp = g.querySelector('.lamp'), cone = g.querySelector('.cone');
    var gr = g.getBoundingClientRect(), lr = lamp.getBoundingClientRect();
    cone.style.setProperty('--cx', ((lr.left + lr.width/2 - gr.left) / gr.width * 100).toFixed(2) + '%');
    cone.style.setProperty('--cy', ((lr.top - gr.top) / gr.height * 100).toFixed(2) + '%');
    var fi = document.querySelector('.foot-in'), fr = fi.getBoundingClientRect();
    fi.style.setProperty('--lampx', Math.round(lr.left + lr.width/2 - fr.left) + 'px');
  }
  aimCone();
  window.addEventListener('resize', aimCone);

  /* ---------- facts reveal + résumé mode (spine) ---------- */
  function reveal(section){
    if(!section) return;
    var facts = section.querySelector('.facts');
    if(!facts || !facts.hidden) return;
    facts.hidden = false;
    section.classList.add('is-done');
    var peek = section.querySelector('.peek');
    if(peek) peek.setAttribute('aria-expanded','true');
  }
  document.addEventListener('toy:done', function(e){
    var section = e.target.closest ? e.target.closest('.world') : null;
    reveal(section);
  });
  document.querySelectorAll('.peek').forEach(function(btn){
    btn.setAttribute('aria-expanded','false');
    btn.addEventListener('click', function(){ reveal(btn.closest('.world')); });
  });
  var toggle = document.getElementById('cv-toggle');
  function setCV(on, scroll){
    html.classList.toggle('cv', on);
    if(toggle) toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    try{ localStorage.setItem('se-mode', on ? 'cv' : 'play'); }catch(err){}
    if(on){ document.querySelectorAll('.facts[hidden]').forEach(function(f){ f.hidden = false; }); }
    if(scroll){ window.scrollTo({top:0, behavior:'auto'}); }
    setTimeout(aimCone, 50);
  }
  if(toggle) toggle.addEventListener('click', function(){ setCV(!html.classList.contains('cv'), true); });
  document.querySelectorAll('[data-cv="on"]').forEach(function(b){ b.addEventListener('click', function(){ setCV(true, true); }); });
  var saved = null;
  try{ saved = localStorage.getItem('se-mode'); }catch(err){}
  if(saved === 'cv') setCV(true, false);
})();
