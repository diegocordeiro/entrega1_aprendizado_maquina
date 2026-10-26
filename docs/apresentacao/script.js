
let c=0,t=15;
let isPresenter = new URLSearchParams(location.search).get('modo')==='apresentador';
let win=null;

function sh(n){document.querySelectorAll('.sl').forEach(s=>s.classList.remove('ac'));document.getElementById('s'+(n+1)).classList.add('ac');document.getElementById('ctr').textContent=(n+1)+' / '+t}
function nx(){if(c<t-1){c++;sh(c);sync()}}
function pv(){if(c>0){c--;sh(c);sync()}}
function tn(){var e=document.getElementById('n'+(c+1));if(e)e.classList.toggle('sh');document.getElementById('bn').textContent=e&&e.classList.contains('sh')?'Esconder notas':'Notas do apresentador'}

let fzLevel=2;
const fzSteps=[0.85,1,1.15,1.3,1.45,1.6];
function fz(d){fzLevel=Math.max(0,Math.min(fzSteps.length-1,fzLevel+(d||0)));applyZoom();sync()}
function applyZoom(){var sc=document.querySelector('.sc');if(sc)sc.style.zoom=fzSteps[fzLevel];var el=document.getElementById('fzpct');if(el)el.textContent=Math.round(fzSteps[fzLevel]*100)+'%';}
fz(0);

function openPresenter(){
  var bp=document.getElementById('bp');
  if(win && !win.closed){win.close();win=null;if(bp)bp.textContent='Modo apresentador';return}
  var url=location.href.split('?')[0].split('#')[0]+'?modo=apresentador&c='+c+'&fz='+fzLevel;
  win=window.open(url,'ifguia_apresentador','menubar=no,toolbar=no,location=no,width=1280,height=800');
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
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight')nx();else if(e.key==='ArrowLeft')pv();else if(e.key==='n'&&!isPresenter)tn();else if(e.key==='f'||e.key==='F')toggleFullscreen()});

if(isPresenter){
  document.body.classList.add('modo-presenter');
  var params=new URLSearchParams(location.search);
  var pc=params.get('c');if(pc!==null&&parseInt(pc)>=0)c=parseInt(pc);
  var pf=params.get('fz');if(pf!==null&&parseInt(pf)>=0)fzLevel=Math.max(0,Math.min(fzSteps.length-1,parseInt(pf)));
  document.title='(Apresentação) — '+document.title;
}
applyZoom();
sh(c);
sync();
