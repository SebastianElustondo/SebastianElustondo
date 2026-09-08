/* ===== SPINE JS: reveals facts, runs résumé mode. Toys own everything else. ===== */
(function(){
  var html = document.documentElement;

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

  /* résumé mode */
  function setCV(on, scroll){
    html.classList.toggle('cv', on);
    var t = document.getElementById('cv-toggle');
    if(t) t.setAttribute('aria-pressed', on ? 'true' : 'false');
    try{ localStorage.setItem('se-mode', on ? 'cv' : 'play'); }catch(err){}
    if(on){ document.querySelectorAll('.facts[hidden]').forEach(function(f){ f.hidden = false; }); }
    if(scroll){ window.scrollTo({top:0, behavior:'auto'}); }
  }
  var toggle = document.getElementById('cv-toggle');
  if(toggle) toggle.addEventListener('click', function(){ setCV(!html.classList.contains('cv'), true); });
  document.querySelectorAll('[data-cv="on"]').forEach(function(b){
    b.addEventListener('click', function(){ setCV(true, true); });
  });
  var saved = null;
  try{ saved = localStorage.getItem('se-mode'); }catch(err){}
  if(saved === 'cv') setCV(true, false);
})();
