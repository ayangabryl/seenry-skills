const preview = document.querySelector('.preview-window');
const frame = preview.querySelector('iframe');
function fitPreview(){const width=preview.clientWidth;const sourceWidth=width<600?390:1280;const sourceHeight=width<600?900:780;frame.style.width=sourceWidth+'px';frame.style.height=sourceHeight+'px';frame.style.transform=`scale(${width/sourceWidth})`;preview.style.height=(sourceHeight*width/sourceWidth)+'px';}
new ResizeObserver(fitPreview).observe(preview);fitPreview();
const dialog=document.querySelector('#install-dialog');let opener;
document.querySelectorAll('[data-install]').forEach(button=>button.addEventListener('click',()=>{opener=button;dialog.showModal();}));
dialog.addEventListener('close',()=>opener?.focus());
document.querySelectorAll('[data-layout]').forEach(button=>{if(button.tagName!=='BUTTON')return;button.addEventListener('click',()=>{document.querySelector('.composition').dataset.layout=button.dataset.layout;document.querySelectorAll('button[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('.layout-note').textContent=button.dataset.layout==='story'?'The introduction leads; the photograph supports it.':'The photograph leads; the introduction follows it.';});});
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{let message;try{await navigator.clipboard.writeText('npx skills add ayangabryl/seenry-skills');message='Copied. Paste the command into your terminal.';}catch{message='Copy unavailable. Select and copy the visible command.';}document.querySelector('#copy-status').textContent=message;document.querySelector('.dialog-feedback').textContent=message;}));
