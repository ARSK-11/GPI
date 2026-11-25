'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  const buttons=[...document.querySelectorAll('[data-doc-filter]')];
  const cards=[...document.querySelectorAll('[data-doc-type]')];
  for(const b of buttons)b.addEventListener('click',()=>{
    const filter=b.dataset.docFilter;
    for(const v of buttons){const active=v===b;v.classList.toggle('is-active',active);v.setAttribute('aria-pressed',String(active));}
    for(const card of cards)card.hidden=filter!=='all'&&card.dataset.docType!==filter;
  });
  // When configured, Drive API generates native photo/video/PDF cards.
  // Otherwise (or if the API is unavailable), the embedded public folder stays visible.
  for(const album of document.querySelectorAll('[data-drive-album]')){
    const id=Number(album.dataset.driveAlbum);
    if(!Number.isSafeInteger(id)||id<=0)continue;
    fetch('/documentation/drive/'+id,{credentials:'same-origin'})
      .then(r=>r.ok?r.json():null)
      .then(data=>{
        if(!data?.configured||!Array.isArray(data.files)||!data.files.length)return;
        const grid=album.querySelector('.service-drive-native');
        const frag=document.createDocumentFragment();
        for(const item of data.files){
          if(!/^[a-zA-Z0-9_-]{10,200}$/.test(item.id)||!['photo','video','pdf'].includes(item.type))continue;
          const article=document.createElement('article');
          const a=document.createElement('a');a.href='https://drive.google.com/file/d/'+item.id+'/view';a.target='_blank';a.rel='noopener noreferrer';
          const thumb=document.createElement('div');thumb.className='thumb';
          if(item.type==='photo'){const img=document.createElement('img');img.loading='lazy';img.alt='';img.src='https://drive.google.com/thumbnail?id='+item.id+'&sz=w600';thumb.append(img);}else thumb.textContent=item.type.toUpperCase();
          const p=document.createElement('p');p.textContent=String(item.title||'Dokumentasi');
          a.append(thumb,p);article.append(a);frag.append(article);
        }
        if(frag.childElementCount){grid.append(frag);grid.hidden=false;}
      }).catch(()=>{});
  }
});
