// Friends France Trip Website script
(function(){
  // Gallery data
  const photos = [
    {id:1, src:'snapshot1.jpg', cap:'Notre Dame at Sunset'},
    {id:2, src:'snapshot2.jpg', cap:'Wine Tasting in Bordeaux'},
    {id:3, src:'snapshot3.jpg', cap:'Street Art in Montmartre'},
    {id:4, src:'snapshot4.jpg', cap:'Seine River Cruise'},
    {id:5, src:'snapshot5.jpg', cap:'Local Market Visit'},
    {id:6, src:'snapshot6.jpg', cap:'Eiffel Tower Night'}
  ];
  const gallery = document.getElementById('gallery');
  if(gallery){
    gallery.innerHTML='';
    photos.forEach(p=>{
      const div=document.createElement('div');
      div.className='photo-card';
      div.innerHTML=`<img src='/images/${p.src}' alt='${p.cap}'>\n<p class='caption'>${p.cap}</p>`;
      gallery.appendChild(div);
    });
  }
  // Message board
  const form=document.getElementById('message-form');
  const list=document.getElementById('message-list');
  const load=[];
  const saveMsgs=()=>{
    const msgs=Array.from(list.querySelectorAll('li')).map(li=>({
      user:li.querySelector('strong')?.textContent||'Anonymous',
      text:li.querySelector('.msg-text')?.textContent||'',
      date:li.dataset.date
    }));
    localStorage.setItem('tripMsgs',JSON.stringify(msgs));
  };
  const addMsg=(user,text)=>{
    const li=document.createElement('li');
    const date=new Date().toLocaleString();
    li.innerHTML=`<strong>${user}</strong> <span class='msg-text'>${text}</span> <span class='date'>${date}</span>`;
    li.dataset.date=date;
    list.appendChild(li);
    saveMsgs();
  };
  form?.addEventListener('submit',e=>{e.preventDefault();const inp=document.getElementById('message-input');const txt=inp.value.trim();if(txt){addMsg('You',txt);inp.value='';}});
  // Load persisted
  const persisted=JSON.parse(localStorage.getItem('tripMsgs')||'[]');
  persisted.forEach(m=>addMsg(m.user,m.text));
  // Search/Filter
  const search=document.getElementById('search-input');
  if(search){
    search.addEventListener('input',()=>{
      const term=search.value.toLowerCase();
      list.querySelectorAll('li').forEach(li=>{
        li.style.display=li.textContent.toLowerCase().includes(term)?'';'none';
      });
    });
  }
})();
