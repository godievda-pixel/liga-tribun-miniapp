(function(){
'use strict';
var API='https://dkefzepiiudehhzbbrjn.supabase.co/functions/v1/qptg-live';
var tg=window.Telegram&&window.Telegram.WebApp;
var autoUsers=false,overlay=null;
function html(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var style=document.createElement('style');
style.textContent='.dm-admin-entry{width:100%;margin:12px 0!important;cursor:pointer}.dm-row-button{border:1px solid rgba(38,206,41,.28);border-radius:10px;background:rgba(38,206,41,.10);color:#66ec6e;font-size:9px;font-weight:900;padding:9px 6px;white-space:nowrap;min-height:32px}.dm-row-actions{display:flex;flex-direction:column;gap:5px;align-items:stretch;min-width:83px}.dm-row-actions .admin-user-write{padding:5px;font-size:8px;min-height:26px}.dm-panel{max-height:92dvh;overflow-y:auto}.dm-panel form{display:grid;gap:13px;margin:14px 0}.dm-panel form label{display:grid;gap:6px;color:#e4f1e5;font-size:11px;font-weight:800}.dm-panel textarea,.dm-panel input[type=url]{width:100%;min-width:0;box-sizing:border-box;padding:12px;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:#101a13;color:white;font:inherit;font-size:13px}.dm-panel textarea{min-height:105px;resize:vertical}.dm-panel input[type=file]{width:100%;min-width:0;box-sizing:border-box;background:#101a13;border:1px dashed rgba(255,255,255,.18);border-radius:11px;padding:10px;color:#cfe2d2;font-size:11px}.dm-panel label small,.dm-notes{color:#9aab9b;font-size:10px;line-height:1.5}.dm-preview{font-size:11px;line-height:1.55;color:#b9cbbb;white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;background:rgba(0,0,0,.19);border:1px solid rgba(255,255,255,.08);border-radius:12px}.dm-send{min-height:46px;border-radius:12px;background:#26ce29;color:#051105;border:0;font-weight:900}.dm-send:disabled{opacity:.5}.dm-state{font-size:11px;line-height:1.6;color:#ec9990}.dm-state.good{color:#7bef83}.dm-notes{padding-top:10px;border-top:1px solid rgba(255,255,255,.08)}';
document.head.appendChild(style);
function setup(){
 var admin=document.querySelector('.admin-page');
 if(admin&&!admin.querySelector('[data-dm-directory]')){
  var existing=admin.querySelector('[data-admin-broadcast]')||admin.querySelector('[data-admin-users]'),card=document.createElement('button');
  card.type='button';card.className='admin-users-card dm-admin-entry';card.setAttribute('data-dm-directory','');
  card.innerHTML='<span class="admin-users-icon">✉</span><span class="admin-users-copy"><b>Личные сообщения и чеки</b><small>Написать одному пользователю от бота · отправить чек «Мой налог»</small></span><i>›</i>';
  if(existing&&existing.parentNode)existing.parentNode.insertBefore(card,existing);
  card.addEventListener('click',function(){
   var users=admin.querySelector('[data-admin-users]');
   autoUsers=true;
   if(users)users.click();
  });
 }
 var sheet=document.querySelector('#admin-users-sheet');
 if(sheet&&autoUsers){
  var scope=sheet.querySelector('[data-admin-users-scope="users"]');
  if(scope){autoUsers=false;if(scope.getAttribute('aria-pressed')!=='true')scope.click()}
 }
 document.querySelectorAll('#admin-users-sheet .admin-user-row').forEach(function(row){
  if(row.querySelector('[data-dm-to]'))return;
  var sel=row.querySelector('[data-admin-telegram-id]'),id=sel&&Number(sel.getAttribute('data-admin-telegram-id')||0);
  if(!Number.isSafeInteger(id)||id<=0)return;
  var name=String(row.querySelector('.admin-user-main b')?.textContent||'Участник'),old=row.querySelector('.admin-user-write');
  var actions=document.createElement('div');actions.className='dm-row-actions';
  var btn=document.createElement('button');btn.type='button';btn.className='dm-row-button';btn.setAttribute('data-dm-to',String(id));btn.textContent='От бота ✉';
  actions.appendChild(btn);if(old)actions.appendChild(old);
  row.appendChild(actions);
  btn.addEventListener('click',function(){showForm(id,name)});
 });
}
function closeForm(){
 if(overlay){overlay.remove();overlay=null}
 if(!document.querySelector('.admin-reg-sheet'))document.body.style.overflow='';
}
function showForm(userId,recipient){
 if(!tg||!tg.initData){if(tg&&tg.showAlert)tg.showAlert('Открой приложение через Telegram');return}
 closeForm();
 var id=Number(userId),name=String(recipient||'Участник');
 overlay=document.createElement('div');overlay.className='admin-reg-sheet';overlay.id='dm-compose-sheet';
 overlay.innerHTML='<div class="admin-reg-panel dm-panel"><div class="admin-reg-head"><div><span class="kicker">Лига Трибун · сообщение от бота</span><h2>Написать участнику</h2><small>'+html(name)+' · один получатель</small></div><button type="button" data-dm-close aria-label="Закрыть">×</button></div>'+
  '<form id="dmComposeForm"><label>Текст сообщения<textarea name="message" rows="5" maxlength="3600" placeholder="Например: отправляю вам чек за участие"></textarea></label>'+
  '<label>Ссылка на чек «Мой налог» (необязательно)<input type="url" name="receiptUrl" maxlength="1600" placeholder="https://..." inputmode="url"></label>'+
  '<label>Файл чека (необязательно)<input type="file" name="receiptFile" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp"><small>PDF, PNG, JPG, WebP · до 6 МБ · без публичного хранения</small></label>'+
  '<div class="dm-preview" data-dm-preview>Напиши текст или приложи чек.</div><button type="submit" class="dm-send">Отправить от имени бота →</button><p class="dm-state" role="status" aria-live="polite"></p></form>'+
  '<p class="dm-notes">Бот сможет доставить сообщение только пользователю, который запускал его через /start и не блокировал.</p></div>';
 document.body.appendChild(overlay);document.body.style.overflow='hidden';
 var root=overlay,form=root.querySelector('#dmComposeForm'),message=form.elements.namedItem('message'),url=form.elements.namedItem('receiptUrl'),fileInput=form.elements.namedItem('receiptFile'),preview=root.querySelector('[data-dm-preview]'),state=root.querySelector('.dm-state'),send=root.querySelector('.dm-send');
 root.addEventListener('click',function(ev){if(ev.target===root||ev.target.closest('[data-dm-close]'))closeForm()});
 function refresh(){
  var file=fileInput.files&&fileInput.files[0];message.maxLength=file?800:3600;
  preview.textContent=[message.value.slice(0,180),url.value,file?'Чек: '+file.name+' ('+Math.round(file.size/1024)+' КБ)':''].filter(Boolean).join('\n\n')||'Добавь сообщение, ссылку или файл.';
 }
 message.addEventListener('input',refresh);url.addEventListener('input',refresh);fileInput.addEventListener('change',refresh);refresh();
 form.addEventListener('submit',async function(ev){
  ev.preventDefault();state.textContent='';state.className='dm-state';
  var txt=message.value.trim(),link=url.value.trim(),file=fileInput.files&&fileInput.files[0],mime=file&&file.type||'';
  if(!txt&&!link&&!file){state.textContent='Введи текст, ссылку или выбери чек.';return}
  if(link&&!/^https:\/\/\S+$/.test(link)){state.textContent='Ссылка должна начинаться с https://';return}
  if(txt.length>(file?800:3600)||txt.length+link.length>(file?950:3900)){state.textContent='Укороти текст. С файлом допускается до 950 символов вместе со ссылкой.';return}
  if(file&&!mime){if(/\.pdf$/i.test(file.name))mime='application/pdf';else if(/\.png$/i.test(file.name))mime='image/png';else if(/\.jpe?g$/i.test(file.name))mime='image/jpeg';else if(/\.webp$/i.test(file.name))mime='image/webp'}
  if(file&&(file.size<100||file.size>6*1024*1024||!['application/pdf','image/png','image/jpeg','image/webp'].includes(mime))){state.textContent='Чек должен быть PDF или изображением до 6 МБ.';return}
  if(!confirm('Отправить сообщение только пользователю «'+name+'»?'+(file?'\nФайл: '+file.name:'')+(link?'\nСсылка: '+link.slice(0,150):'')))return;
  send.disabled=true;send.textContent='Отправляем…';
  try{
   var payload={initData:tg.initData,telegramUserId:id,message:txt,receiptUrl:link};
   if(file){
    var data=await new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(String(r.result||'').split(',')[1]||'')};r.onerror=function(){reject(new Error('file_read_failed'))};r.readAsDataURL(file)});
    payload.file={mime:mime,name:file.name,base64:data};
   }
   var resp=await fetch(API+'?app=admin-direct-message',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),cache:'no-store'}),body=await resp.json();
   if(!resp.ok||!body.ok)throw new Error(body.error||'delivery_failed');
   state.className='dm-state good';state.textContent='Отправлено: Telegram подтвердил отправку пользователю '+name+'.';
   form.reset();refresh();
  }catch(err){
   var code=String(err&&err.message||'');
   var messages={bot_blocked:'Пользователь заблокировал бота.',bot_chat_unavailable:'Пользователь ещё не запускал бота. Попроси нажать /start.',recipient_opted_out:'Получатель отключил сообщения бота. Попроси нажать /start.',send_cooldown:'Подожди несколько секунд.',invalid_file:'Неподдерживаемый или повреждённый файл.',invalid_link:'Ссылка должна быть корректным https:// адресом.',message_too_long:'Сообщение слишком длинное.',file_read_failed:'Не удалось прочитать файл.'};
   state.textContent=messages[code]||'Ошибка доставки. Сообщение не отправлено.';
  }finally{send.disabled=false;send.textContent='Отправить от имени бота →'}
 });
}
var observer=new MutationObserver(setup);
observer.observe(document.body,{childList:true,subtree:true});
setup();
})();