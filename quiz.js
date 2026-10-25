/* 50-question postgraduate knowledge quiz loaded after the outer access screen */
(function () {
 'use strict';
 const bankUrl = new URL('quiz-bank.json', document.baseURI).href;
 const style = document.createElement('style');
 style.textContent = "\nnav#nav{display:flex;gap:0;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:thin}\nnav#nav .tab{flex:0 0 auto;min-width:62px;padding:14px 11px 18px}\nnav#nav .tab[data-tab=\"P\"],nav#nav .tab[data-tab=\"Q\"]{min-width:91px}\n.q-intro{font-size:14px;color:var(--soft);margin:0 0 16px}\n.q-progress{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 0 15px;border-bottom:1px solid var(--line);margin-bottom:10px}\n.q-score{font-size:22px;font-weight:700;color:var(--white);font-variant-numeric:tabular-nums}\n.q-count{font-size:14px;color:var(--soft);font-variant-numeric:tabular-nums}\n.q-card{padding:22px 0 24px;border-bottom:1px solid var(--line)}\n.q-kicker{color:var(--gold);font-size:13px;font-weight:650;margin-bottom:9px}\n.q-title{font-size:16px;font-weight:640;line-height:1.7;margin:0 0 15px;white-space:normal;overflow-wrap:anywhere}\n.q-options{display:flex;flex-direction:column;gap:9px}\n.q-option{display:flex;align-items:flex-start;gap:11px;text-align:left;width:100%;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--white);padding:12px 13px;border-radius:4px;font-size:15px;line-height:1.65;cursor:pointer}\n.q-option:hover:not(:disabled),.q-option:focus-visible:not(:disabled){border-color:var(--gold);background:rgba(255,212,70,.08)}\n.q-option:disabled{cursor:default;opacity:.65}\n.q-option.q-correct{border:2px solid #87dab4;background:rgba(93,185,134,.12);opacity:1}\n.q-option.q-wrong{border:2px solid #f3a0a0;background:rgba(215,99,99,.11);opacity:1}\n.q-letter{display:inline-flex;flex:0 0 23px;justify-content:center;font-weight:750;flex-shrink:0;color:var(--gold)}\n.q-option.q-correct .q-letter{color:#9aeabf}\n.q-option.q-wrong .q-letter{color:#ffb0b0}\n.q-result{margin-top:14px;font-size:14px;line-height:1.7;border-left:3px solid var(--gold);padding:5px 0 4px 12px}\n.q-result strong{display:block;font-size:15px;margin-bottom:3px}\n.q-result p{margin:7px 0 5px;color:var(--soft)}\n.q-result a{color:var(--gold);text-decoration:underline;text-underline-offset:2px}\n.q-final{margin:16px 0 9px;padding:18px 0;border-block:1px solid var(--line)}\n.q-final strong{display:block;font-size:23px}\n.q-final span{display:block;font-size:14px;color:var(--soft);margin-top:4px}\n@media(max-width:520px){nav#nav .tab{font-size:14px;min-width:58px;padding:13px 9px 16px}nav#nav .tab[data-tab=\"P\"],nav#nav .tab[data-tab=\"Q\"]{min-width:80px}.q-title{font-size:15px}.q-card{padding:18px 0 20px}.q-option{font-size:14px;padding:11px 10px}}";
 document.head.appendChild(style);
 const quizTabStyle=document.createElement('style');
 quizTabStyle.textContent='nav#nav .tab[data-tab="Q"]{color:var(--gold);font-weight:750;border-right:1px solid var(--line)}';
 document.head.appendChild(quizTabStyle);
 const esc = value => String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shuffle = list => {const arr=list.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;};
 let round=null, loading=null;
 function bank() {
  if(round)return Promise.resolve(round);
  if(loading)return loading;
  loading=fetch(bankUrl,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(data=>{
   if(!Array.isArray(data.questions)||data.questions.length!==50)throw Error('Incomplete bank');
   const zh=data.questions.filter(x=>x.lang==='zh'),en=data.questions.filter(x=>x.lang==='en');
   if(zh.length!==25||en.length!==25)throw Error('Wrong language balance');
   if(data.questions.some(x=>!Array.isArray(x.choices)||x.choices.length!==3||![0,1,2].includes(x.answer)))throw Error('Invalid choices');
   round={items:shuffle([...shuffle(zh).slice(0,5),...shuffle(en).slice(0,5)]),answers:new Map(),sources:data.sources||{}};
   return round;
  }).catch(e=>{loading=null;throw e;});
  return loading;
 }
 function draw() {
  if(current!=='Q'||!round)return;
  const answered=round.answers.size,correct=round.items.filter(x=>round.answers.get(x.id)===x.answer).length,points=correct*10;
  let html='<p class="q-intro">50題題庫，每次隨機抽取10題（中文5題、English 5 questions）。每題10分，選擇後即時顯示結果，不得重答。重新整理頁面可抽取新一局。</p>'+
  '<div class="q-progress"><span class="q-score">'+points+' / 100</span><span class="q-count">已作答 '+answered+' / 10</span></div>';
  if(answered===10)html+='<div class="q-final"><strong>本局成績：'+points+' / 100</strong><span>10題已完成。重新整理頁面可以開始新一局。</span></div>';
  html+=round.items.map((q,i)=>{
   const en=q.lang==='en',done=round.answers.has(q.id),chosen=round.answers.get(q.id),ok=chosen===q.answer,letter=['A','B','C'][q.answer];
   const choices=q.choices.map((value,j)=>{
    const cls=done&&j===q.answer?' q-correct':done&&j===chosen?' q-wrong':'';
    return '<button type="button" class="q-option'+cls+'" data-i="'+i+'" data-j="'+j+'"'+(done?' disabled':'')+'><span class="q-letter">'+['A','B','C'][j]+'</span><span>'+esc(value)+'</span></button>';
   }).join('');
   let result='';
   if(done){
    const src=round.sources[q.source];
    const link=Array.isArray(src)&&/^https:\/\//.test(src[1])?'<a href="'+esc(src[1])+'" target="_blank" rel="noopener noreferrer">'+(en?'Official source':'官方資料來源')+'</a>':'';
    result='<div class="q-result"><strong>'+(ok?(en?'Correct · +10 points':'答對了 · +10分'):(en?'Incorrect · +0 points':'答錯了 · +0分'))+'</strong>'+
     '<div>'+(en?'Correct answer: ':'正確答案：')+letter+'. '+esc(q.choices[q.answer])+'</div><p>'+esc(q.why)+'</p>'+link+'</div>';
   }
   return '<section class="q-card"><div class="q-kicker">'+(en?'Question ':'第')+(i+1)+(en?' · English':'題 · 中文')+' · 10'+(en?' points':'分')+'</div>'+
    '<h2 class="q-title" lang="'+(en?'en':'zh-Hant')+'">'+esc(q.q)+'</h2><div class="q-options">'+choices+'</div>'+result+'</section>';
  }).join('');
  const body=document.getElementById('content');
  body.innerHTML=html;
  body.querySelectorAll('.q-option:not(:disabled)').forEach(btn=>btn.addEventListener('click',()=>{
   const q=round.items[Number(btn.dataset.i)],sel=Number(btn.dataset.j);
   if(!q||round.answers.has(q.id))return;
   round.answers.set(q.id,sel);
   const y=window.scrollY;draw();window.scrollTo(0,y);
  }));
 }
 function show() {
  document.getElementById('heading').textContent='研究生院知識測驗';
  document.getElementById('expand').style.display='none';
  document.getElementById('content').innerHTML='<p class="q-intro">正在載入題庫…</p>';
  bank().then(draw).catch(()=>{if(current==='Q')document.getElementById('content').innerHTML='<p class="q-intro">暫時無法載入題庫，請重新整理網頁再試。</p>';});
 }
 const prevRender=render;
 function tab() {
  const nav=document.getElementById('nav');
  if(!nav.querySelector('[data-tab="Q"]')){
   const b=document.createElement('button');b.type='button';b.className='tab';b.dataset.tab='Q';b.textContent='知識測驗';
   b.title='每局10題 · 100分滿分';
   b.addEventListener('click',()=>{
    if(current==='E')eQuestions=null;
    current='Q';history.replaceState(null,'','#quiz');render();window.scrollTo({top:0,behavior:'instant'});
   });
   nav.insertBefore(b, nav.firstChild);
  }
  nav.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===current)));
 }
 render=function(){
  if(current==='Q'){current='A';prevRender();current='Q';tab();show();}
  else{prevRender();tab();}
 };
 window.addEventListener('hashchange',()=>{if(location.hash.toLowerCase()==='#quiz'){current='Q';render();}});
 if(location.hash.toLowerCase()==='#quiz')current='Q';
 render();
})();