/* E completed: study model answers. F upcoming: protected, tap-to-reveal questions. */
(function(){
'use strict';
const secret=window.__grsUnlockSecret;
delete window.__grsUnlockSecret;
const eURL=new URL('e-revised.enc.json',document.baseURI).href;
const fURL=new URL('f-questions.enc.json',document.baseURI).href;
const style=document.createElement('style');
style.textContent=[
'.f-access{max-width:420px;padding:24px 0;border-top:1px solid var(--line)}',
'.f-input{display:block;width:100%;margin-top:9px;padding:12px 13px;border:1px solid var(--line);border-radius:3px;color:#172b40;background:#fff;font:inherit}',
'.f-submit{margin-top:13px;background:var(--gold);color:var(--blue);padding:10px 20px;font-weight:700;border:0;border-radius:3px;min-height:46px}',
'.f-submit:disabled{opacity:.65;cursor:wait}',
'.f-error{font-size:14px;color:var(--gold);min-height:24px;margin-top:9px}',
'.f-notice{font-size:14px;color:var(--soft);margin:0 0 19px}',
'.f-card{width:100%;display:block;text-align:left;color:var(--white);background:transparent;border:1px solid var(--line);border-radius:3px;padding:18px 16px;margin:0 0 13px;cursor:pointer}',
'.f-card:hover,.f-card:focus-visible{border-color:var(--gold)}',
'.f-number{display:block;color:var(--gold);font-size:14px;font-weight:700;margin-bottom:11px}',
'.f-question{display:block;font-size:15px;line-height:1.85;overflow-wrap:anywhere;white-space:pre-line;transition:filter .18s ease}',
'.f-question.blurred{filter:blur(9px);user-select:none;pointer-events:none;max-height:143px;overflow:hidden}',
'.f-toggle{display:block;font-size:13px;color:var(--soft);margin-top:12px}',
'nav#nav{display:flex;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch}',
'nav#nav>.tab{flex:0 0 auto;min-width:59px;padding-inline:12px}',
'@media(max-width:520px){.f-card{padding:14px 12px}.f-question{font-size:14px}nav#nav>.tab{min-width:55px;padding-inline:9px}}'
].join('\n');
document.head.appendChild(style);
const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function decompress(buffer){
  if(typeof DecompressionStream!=='function')throw Error('此瀏覽器未支援壓縮內容，請使用最新版瀏覽器。');
  const stream=new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}
async function decryptFile(url,password){
  const result=await fetch(url,{cache:'no-store'});
  if(!result.ok)throw Error('無法載入試卷資料（'+result.status+'）');
  const info=await result.json();
  if(info.algorithm!=='PBKDF2-SHA256-AES-GCM'||info.encoding!=='gzip')throw Error('試卷資料格式不符');
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(info.salt),iterations:info.rounds,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
  const compressed=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(info.nonce)},key,decode(info.data));
  return JSON.parse(await decompress(compressed));
}
let eReady=false,eLoading=null,eError='';
let fQuestions=null;
window.__lockF=function(){fQuestions=null;};
function loadE(){
  if(eReady||eLoading)return eLoading||Promise.resolve();
  if(!secret){eError='無法讀取解鎖資料，請重新整理網頁並再次登入。';return Promise.resolve();}
  eLoading=decryptFile(eURL,secret).then(paper=>{
    if(paper.id!=='E'||!Array.isArray(paper.items)||paper.items.length!==3||paper.items.map(q=>q.id).join(',')!=='E1,E2,E3')throw Error('E卷資料不完整');
    if(!PAPERS.some(p=>p.id==='E'))PAPERS.push(paper);
    eReady=true;eError='';
  }).catch(e=>{eError='E卷參考答案暫時無法載入，請重新整理網站再試。';}).finally(()=>{
    eLoading=null;
    if(current==='E')render();
  });
  return eLoading;
}
function renderF(){
  $('heading').textContent='F卷';
  if(!fQuestions){
    $('content').innerHTML='<div class="f-access"><form id="f-form"><label for="f-password">F卷密碼</label><input id="f-password" class="f-input" type="password" placeholder="輸入F卷密碼" required autocomplete="off"><button class="f-submit" type="submit" id="f-submit">進入F卷</button><div class="f-error" id="f-error" role="status" aria-live="polite"></div></form></div>';
    $('f-form').addEventListener('submit',async ev=>{
      ev.preventDefault();
      const input=$('f-password'),btn=$('f-submit'),error=$('f-error');
      error.textContent='';btn.disabled=true;btn.textContent='正在驗證…';
      try{
        const questions=await decryptFile(fURL,input.value);
        if(!Array.isArray(questions)||questions.length!==3||questions.map(q=>q.id).join(',')!=='F1,F2,F3')throw Error('F卷資料不完整');
        fQuestions=questions;
        if(current==='F')render();
      }catch(e){
        error.textContent=e.name==='OperationError'?'密碼不正確，請重試。':(e.message||'暫時無法開啟F卷，請重試。');
        input.select();
      }finally{btn.disabled=false;btn.textContent='進入F卷';}
    });
    return;
  }
  $('content').innerHTML='<p class="f-notice">60分鐘 · 共三題（中文40分、英文35分、英文25分）。題目預設模糊，輕觸才會顯示，再次輕觸可隱藏。參考答案將於完成練習後加入。</p>'+
    fQuestions.map(q=>'<button type="button" class="f-card" aria-pressed="false"><span class="f-number">'+escapeHTML(q.id)+' · '+(q.lang==='zh-Hant'?'中文':'English')+' · '+q.marks+(q.lang==='zh-Hant'?'分':' marks')+'</span><span class="f-question blurred" lang="'+escapeHTML(q.lang)+'">'+blockText(q.question)+'</span><span class="f-toggle">輕觸顯示題目</span></button>').join('');
  document.querySelectorAll('.f-card').forEach(btn=>btn.addEventListener('click',()=>{
    const q=btn.querySelector('.f-question'),show=q.classList.contains('blurred');
    q.classList.toggle('blurred',!show);
    btn.setAttribute('aria-pressed',String(show));
    btn.querySelector('.f-toggle').textContent=show?'再次輕觸可隱藏題目':'輕觸顯示題目';
  }));
}
render=function(){
  const tabs=[...PAPERS.map(p=>({id:p.id,label:p.id+'卷'}))];
  if(!tabs.some(t=>t.id==='E'))tabs.push({id:'E',label:'E卷'});
  tabs.push({id:'F',label:'F卷'},{id:'P',label:'五年規劃'});
  $('nav').innerHTML=tabs.map(t=>'<button class="tab" type="button" data-tab="'+t.id+'" aria-selected="'+String(t.id===current)+'">'+t.label+'</button>').join('');
  document.querySelectorAll('#nav [data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    const next=btn.dataset.tab;
    if(current==='F'&&next!=='F')fQuestions=null;
    current=next;
    history.replaceState(null,'',next==='P'?'#plan':'#'+next.toLowerCase());
    render();window.scrollTo({top:0,behavior:'instant'});
  }));
  $('expand').style.display=current==='F'?'none':'';
  $('expand').textContent='全部展開';
  if(current==='P')renderPlan();
  else if(current==='F')renderF();
  else if(current==='E'&&!eReady){
    $('heading').textContent='E卷';
    $('content').innerHTML='<p style="color:var(--soft);padding:19px 0">'+(eError||'正在載入E卷參考答案…')+'</p>';
  }else renderPaper();
};
window.addEventListener('hashchange',()=>{
  const next=location.hash.toLowerCase();
  if(next==='#f'){if(current!=='F')current='F';render();}
  else if(current==='F'){fQuestions=null;}
});
if(location.hash.toLowerCase()==='#f')current='F';
render();
loadE();
})();