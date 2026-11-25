'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  if(!document.querySelector('#main-content')){const target=document.querySelector('header.page-hero, main, section.section');if(target)target.id='main-content';}
  const toggle=document.querySelector('.refresh-nav .nav-toggle');
  const menu=document.querySelector('#main-nav');
  if(toggle&&menu){
    // Existing public-html.js handles the actual show class; observe it for accessibility.
    const sync=()=>toggle.setAttribute('aria-expanded',String(menu.classList.contains('show')));
    new MutationObserver(sync).observe(menu,{attributes:true,attributeFilter:['class']});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('show')){menu.classList.remove('show');toggle.focus();}});
  }
  const tabs=[...document.querySelectorAll('[data-ministry-tab]')];
  const panels=[...document.querySelectorAll('.ministry-panel')];
  if(tabs.length&&panels.length){
    function select(i){tabs.forEach((t,j)=>{t.classList.toggle('selected',i===j);if(i===j)t.setAttribute('aria-current','true');else t.removeAttribute('aria-current');});panels.forEach((p,j)=>p.hidden=i!==j);}
    const initial=panels.findIndex(p=>'#'+p.id===location.hash);select(initial<0?0:initial);
    tabs.forEach((tab,i)=>tab.addEventListener('click',e=>{e.preventDefault();select(i);history.replaceState(null,'','#'+panels[i].id);}));
  }
  const copy=document.querySelector('[data-copy-account]');
  copy?.addEventListener('click',async()=>{
    const number=document.querySelector('#accountNumber');const status=document.querySelector('.copy-status');
    try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(number.textContent.trim());else{const input=document.createElement('textarea');input.value=number.textContent.trim();input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();if(!ok)throw Error('copy unavailable');}status.textContent='Nomor rekening berhasil disalin.';}catch{status.textContent='Tidak dapat menyalin otomatis. Silakan salin nomor rekening secara manual.';}
  });
});
