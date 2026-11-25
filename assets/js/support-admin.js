'use strict';
(() => {
 const panel=document.querySelector('#section-support');if(!panel)return;
 const $=s=>panel.querySelector(s),csrf=document.querySelector('meta[name="csrf-token"]')?.content||'';
 let threads=[],articles=[],selected=null,timer=null,busy=false;
 const say=(selector,text)=>{const el=$(selector);if(el)el.textContent=text||'';};
 async function request(path,{method='GET',body}={}){
  const config={method,cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}};
  if(body){config.headers['Content-Type']='application/json';config.headers['X-CSRF-Token']=csrf;config.body=JSON.stringify(body);}
  const r=await fetch('/support-api/admin/'+path,config);const j=await r.json().catch(()=>({success:false,message:'Respons tidak valid.'}));if(!r.ok||!j.success)throw Error(j.message||'Permintaan gagal.');return j;
 }
 function elem(tag,klass,text){const e=document.createElement(tag);if(klass)e.className=klass;if(text!==undefined)e.textContent=text;return e;}
 function formatDate(date){const d=date&&new Date(date);return d&&!Number.isNaN(d.getTime())?d.toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'-';}
 function renderThreads(){const list=$('#supportAdminThreads');list.replaceChildren();if(!threads.length){list.append(elem('p','muted','Belum ada pengunjung yang memulai chat.'));return;}threads.forEach(t=>{
  const b=elem('button',String(selected)===String(t.id)?'selected':'');b.type='button';const title=elem('strong','',t.visitor_name+' · '+t.department),note=elem('small','',t.city+' · '+t.status+' · '+formatDate(t.last_message_at)),preview=elem('small','',(t.latest_message||'Percakapan baru').slice(0,85));b.append(title,note,preview);b.addEventListener('click',()=>{selected=String(t.id);renderThreads();loadThread();});list.append(b);
 });}
 async function loadThreads(){if(busy)return;busy=true;try{const j=await request('threads');threads=j.threads||[];renderThreads();if(selected)await loadThread();}catch(err){say('#supportAdminMessage',err.message);}finally{busy=false;}}
 async function loadThread(){if(!selected)return;try{const j=await request('thread?id='+encodeURIComponent(selected)),t=j.thread,log=$('#supportAdminMessages'),previous=log.scrollHeight-log.scrollTop-log.clientHeight<80;$('#supportAdminDetail').replaceChildren();const title=elem('h3','',t.visitor_name+' · '+t.department),summary=elem('p','muted','Kota: '+t.city+' · WhatsApp: '+t.phone+(t.email?' · Email: '+t.email:'')+' · Status: '+t.status);$('#supportAdminDetail').append(title,summary);log.replaceChildren();if(!j.messages.length)log.append(elem('p','muted','Percakapan belum memiliki pesan.'));
  j.messages.forEach(m=>{const bubble=elem('div','gpi-support-admin-bubble '+(m.sender==='admin'?'admin':'visitor')),tag=elem('small','',m.sender==='admin'?'Admin · '+formatDate(m.created_at):t.visitor_name+' · '+formatDate(m.created_at)),p=elem('p','',m.body);bubble.append(tag,p);log.append(bubble);});if(previous)log.scrollTop=log.scrollHeight;$('#supportAdminReply').hidden=false;say('#supportAdminMessage','');
 }catch(err){say('#supportAdminMessage',err.message);}}
 $('#supportAdminRefresh').addEventListener('click',loadThreads);
 $('#supportAdminReply').addEventListener('submit',async e=>{e.preventDefault();if(!selected)return;const form=e.currentTarget,pesan=form.elements.pesan.value.trim(),button=form.querySelector('[type=submit]');if(!pesan)return;button.disabled=true;try{await request('reply',{method:'POST',body:{id:selected,pesan}});form.reset();await loadThreads();say('#supportAdminMessage','Balasan berhasil dikirim ke percakapan pengunjung.');}catch(err){say('#supportAdminMessage',err.message);}finally{button.disabled=false;}});
 $('#supportAdminClose').addEventListener('click',async()=>{if(!selected)return;try{await request('status',{method:'POST',body:{id:selected,status:'selesai'}});await loadThreads();say('#supportAdminMessage','Percakapan ditandai selesai.');}catch(e){say('#supportAdminMessage',e.message);}});
 async function loadArticles(){try{articles=(await request('articles')).articles||[];renderArticles();}catch(e){say('#supportArticleMessage',e.message);}}
 function editArticle(a){const f=$('#supportArticleForm');f.hidden=false;for(const name of ['id','title','category','summary','body','link_path'])f.elements[name].value=a?.[name]||'';f.elements.active.checked=a?!!Number(a.active):true;f.scrollIntoView({block:'nearest',behavior:'smooth'});}
 function renderArticles(){const parent=$('#supportAdminArticles');parent.replaceChildren();articles.forEach(a=>{const b=elem('button');b.type='button';b.append(elem('strong','',a.title),elem('small','',a.category+(Number(a.active)?'':' · Disembunyikan')));b.addEventListener('click',()=>editArticle(a));parent.append(b);});}
 $('#supportArticleNew').addEventListener('click',()=>editArticle(null));$('#supportArticleCancel').addEventListener('click',()=>{$('#supportArticleForm').reset();$('#supportArticleForm').hidden=true;});
 $('#supportArticleForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('[type=submit]'),data=Object.fromEntries(new FormData(f));data.active=f.elements.active.checked?'1':'0';b.disabled=true;try{await request('article',{method:'POST',body:data});say('#supportArticleMessage','Artikel tersimpan.');await loadArticles();f.hidden=true;}catch(err){say('#supportArticleMessage',err.message);}finally{b.disabled=false;}});
 function active(){return panel.classList.contains('active');}
 function refreshWhenActive(){if(active()){loadThreads();loadArticles();}}
 document.querySelector('[data-section="support"]')?.addEventListener('click',refreshWhenActive);
 window.addEventListener('hashchange',refreshWhenActive);
 setTimeout(refreshWhenActive,0);
 timer=setInterval(()=>{if(active()&&!document.hidden)loadThreads();},6500);
})();
