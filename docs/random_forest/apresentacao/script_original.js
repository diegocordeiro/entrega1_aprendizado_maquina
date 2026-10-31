let c=0,t=document.querySelectorAll('.sl').length,dots=[];
let isPresenter = new URLSearchParams(location.search).get('modo')==='apresentador';
let win=null;

function sh(n){
  document.querySelectorAll('.sl').forEach(s=>s.classList.remove('ac'));
  document.getElementById('s'+(n+1)).classList.add('ac');
  document.getElementById('ctr').textContent=(n+1)+' / '+t;
  dots.forEach(function(b,i){
    var on=i===n;
    b.classList.toggle('ac',on);
    if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  var bp=document.getElementById('bprev'),bn=document.getElementById('bnext');
  if(bp)bp.disabled=n<=0;
  if(bn)bn.disabled=n>=t-1;
}
function nx(){if(c<t-1){c++;sh(c);sync()}}
function pv(){if(c>0){c--;sh(c);sync()}}
function go(n){if(n<0||n>=t||n===c)return;c=n;sh(c);sync()}
function buildDots(){
  var box=document.getElementById('dots');if(!box)return;
  dots=[];box.innerHTML='';
  document.querySelectorAll('.sl').forEach(function(s,i){
    var h=s.querySelector('.slhd h2')||s.querySelector('h1')||s.querySelector('h2');
    var nome=h?h.textContent.trim():'Slide '+(i+1);
    var b=document.createElement('button');
    b.type='button';b.className='dot';b.textContent=i+1;
    b.title=(i+1)+' — '+nome;
    b.setAttribute('aria-label','Ir para o slide '+(i+1)+': '+nome);
    b.onclick=function(){go(i)};
    box.appendChild(b);dots.push(b);
  });
}

let fzLevel=2;
const fzSteps=[0.85,1,1.15,1.3,1.45,1.6];
function fz(d){fzLevel=Math.max(0,Math.min(fzSteps.length-1,fzLevel+(d||0)));applyZoom();sync()}
function applyZoom(){var sc=document.querySelector('.sc');if(sc)sc.style.zoom=fzSteps[fzLevel];var el=document.getElementById('fzpct');if(el)el.textContent=Math.round(fzSteps[fzLevel]*100)+'%';}
fz(0);

function openPresenter(){
  var bp=document.getElementById('bp');
  if(win && !win.closed){win.close();win=null;if(bp)bp.textContent='Modo apresentador';return}
  var url=location.href.split('?')[0].split('#')[0]+'?modo=apresentador&c='+c+'&fz='+fzLevel;
  win=window.open(url,'rf_apresentador','menubar=no,toolbar=no,location=no,width=1280,height=800');
  if(win && bp)bp.textContent='Fechar apresentação';
}
function sync(){
  try{
    if(isPresenter){if(window.opener)window.opener.postMessage({type:'estado',c:c,fz:fzLevel},'*')}
    else if(win && !win.closed){win.postMessage({type:'estado',c:c,fz:fzLevel},'*')}
  }catch(e){}
}
function applyEstado(cn,fzN){
  c=cn;
  if(typeof fzN==='number'){fzLevel=Math.max(0,Math.min(fzSteps.length-1,fzN));applyZoom()}
  sh(c);
}
window.addEventListener('message',function(e){var d=e.data||{};if(d.type==='estado'&&typeof d.c==='number')applyEstado(d.c,d.fz)});

function rv(e){e.classList.toggle('rv')}

function toggleFullscreen(){if(document.fullscreenElement||document.webkitFullscreenElement){if(document.exitFullscreen)document.exitFullscreen();else if(document.webkitExitFullscreen)document.webkitExitFullscreen();}else{var d=document.documentElement;if(d.requestFullscreen)d.requestFullscreen();else if(d.webkitRequestFullscreen)d.webkitRequestFullscreen();}}
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight')nx();else if(e.key==='ArrowLeft')pv();else if(e.key==='Home'){e.preventDefault();go(0)}else if(e.key==='End'){e.preventDefault();go(t-1)}else if(e.key==='f'||e.key==='F')toggleFullscreen()});

if(isPresenter){
  document.body.classList.add('modo-presenter');
  var params=new URLSearchParams(location.search);
  var pc=params.get('c');if(pc!==null&&parseInt(pc)>=0)c=parseInt(pc);
  var pf=params.get('fz');if(pf!==null&&parseInt(pf)>=0)fzLevel=Math.max(0,Math.min(fzSteps.length-1,parseInt(pf)));
  document.title='(Apresentação) — '+document.title;
}
applyZoom();
buildDots();
sh(c);
sync();
