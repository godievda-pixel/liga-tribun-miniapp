(function(){
  'use strict';
  var API='https://dkefzepiiudehhzbbrjn.supabase.co/functions/v1/qptg-live';
  var busy=false;

  function isAdminVisible(){
    var n=document.getElementById('adminNav');
    return !!(n&&!n.hidden);
  }

  function organizerCleanup(){
    if(isAdminVisible()) return;
    document.querySelectorAll('.profile-tab-section').forEach(function(sec){
      var h=sec.querySelector('.profile-tab-section-head h2');
      if(h&&String(h.textContent||'').trim()==='Организатор') sec.style.display='none';
    });
  }

  function installLinkForm(){
    organizerCleanup();
    var card=[].slice.call(document.querySelectorAll('.profile-tab-empty')).find(function(el){
      return String(el.textContent||'').indexOf('Профиль пока не привязан')>=0;
    });
    if(!card||card.querySelector('[data-profile-link-form]')) return;

    var old=card.querySelector('span');
    if(old) old.textContent='Если у тебя нет @username или имя в Telegram отличается от имени участника, введи одноразовый код от организатора.';

    var form=document.createElement('form');
    form.setAttribute('data-profile-link-form','1');
    form.className='profile-link-external';
    form.innerHTML='<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="12" placeholder="Код привязки" required><button type="submit">Привязать профиль</button><small data-profile-link-error></small>';
    card.appendChild(form);

    form.addEventListener('submit',async function(ev){
      ev.preventDefault();
      if(busy) return;
      var tg=window.Telegram&&window.Telegram.WebApp;
      if(!tg||!tg.initData){show('Открой приложение именно из Telegram.');return;}
      var code=String(new FormData(form).get('code')||'').trim();
      if(!code){show('Введи код привязки.');return;}
      busy=true;
      var btn=form.querySelector('button'); if(btn)btn.disabled=true;
      try{
        var r=await fetch(API+'?app=link-profile',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({initData:tg.initData,code:code}),
          cache:'no-store'
        });
        var d=await r.json();
        if(!r.ok||!d.ok) throw new Error(d.error||'link_failed');
        if(tg.HapticFeedback)try{tg.HapticFeedback.notificationOccurred('success')}catch(_){}
        location.reload();
      }catch(e){
        var m='Код не подошёл. Проверь цифры.';
        if(e&&e.message==='code_used')m='Этот код уже использован.';
        if(e&&e.message==='code_expired')m='Срок действия кода истёк.';
        if(e&&e.message==='participant_already_linked')m='Этот участник уже привязан к другому Telegram.';
        show(m);
      }finally{
        busy=false;
        if(btn)btn.disabled=false;
      }
      function show(m){
        var el=form.querySelector('[data-profile-link-error]');
        if(el)el.textContent=m;
      }
    });
  }

  var style=document.createElement('style');
  style.textContent='.profile-link-external{width:100%;max-width:340px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:17px}.profile-link-external input{min-width:0;height:44px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:#080c09;color:#f1f5f2;padding:0 13px;font-size:14px;letter-spacing:.08em;text-align:center;outline:none}.profile-link-external input:focus{border-color:rgba(38,206,41,.45);box-shadow:0 0 0 3px rgba(38,206,41,.055)}.profile-link-external button{min-height:44px;border:1px solid rgba(38,206,41,.18);border-radius:14px;background:rgba(38,206,41,.10);color:#55ea59;padding:0 14px;font-size:9px;font-weight:950}.profile-link-external small{grid-column:1/-1;color:#d98585;font-size:8px;min-height:12px}@media(max-width:390px){.profile-link-external{grid-template-columns:1fr}.profile-link-external button{width:100%}}';
  document.head.appendChild(style);

  new MutationObserver(installLinkForm).observe(document.documentElement,{childList:true,subtree:true});
  installLinkForm();
})();