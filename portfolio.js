(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const reader = document.querySelector('.book-reader');
  const stage = reader.querySelector('.book-stage');
  const spread = document.querySelector('#book-spread');
  const prev = document.querySelector('#book-prev');
  const next = document.querySelector('#book-next');
  const status = document.querySelector('#book-status');
  // Preserve the supplied sequence: the confirmed artwork has no file 14.
  const sources = [1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17].map(i => `assets/book/${String(i).padStart(2,'0')}.jpg`);
  let index = 0, busy = false;
  function controls() { prev.disabled = busy || index === 0; next.disabled = busy || index === sources.length-1; }
  async function turn(direction) {
    const target = index + direction;
    if (busy || target < 0 || target >= sources.length) return;
    busy = true; controls();
    const loaded = new Image(); loaded.src = sources[target];
    try { await loaded.decode(); } catch { status.textContent='图片未加载，请重试'; busy=false; controls(); return; }
    if (!reduced.matches) {
      stage.classList.add(direction>0 ? 'turn-forward' : 'turn-back');
      stage.querySelector('.book-underlay').style.backgroundImage = `url("${sources[target]}")`;
      stage.querySelector('.leaf-front').style.backgroundImage = `url("${sources[index]}")`;
      stage.querySelector('.leaf-back').style.backgroundImage = `url("${sources[target]}")`;
      const animation = stage.querySelector('.book-leaf').animate([
        {transform:'rotateY(0deg)'},
        {transform:`rotateY(${direction>0 ? -180 : 180}deg)`}
      ], {duration:1100,easing:'cubic-bezier(.3,.05,.2,1)',fill:'forwards'});
      await animation.finished;
      spread.src=sources[target];
      stage.classList.remove('turn-forward','turn-back'); animation.cancel();
    } else spread.src=sources[target];
    index=target; spread.alt=`海洋奇遇，第 ${index+1} 个跨页`;
    status.textContent=`${String(index+1).padStart(2,'0')} / ${sources.length}`;
    busy=false; controls();
    if(sources[index+1]) { const preload = new Image(); preload.src=sources[index+1]; }
  }
  prev.addEventListener('click',()=>turn(-1)); next.addEventListener('click',()=>turn(1));
  reader.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(e.key==='ArrowRight'?1:-1)}});
  let touchStart=null;
  stage.addEventListener('touchstart',e=>{touchStart=[e.touches[0].clientX,e.touches[0].clientY]}, {passive:true});
  stage.addEventListener('touchend',e=>{if(!touchStart)return; const dx=e.changedTouches[0].clientX-touchStart[0],dy=e.changedTouches[0].clientY-touchStart[1];if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy))turn(dx<0?1:-1);touchStart=null;}, {passive:true});
  const wall=document.querySelector('.holiday-wall'),left=document.querySelector('#holiday-prev'),right=document.querySelector('#holiday-next');
  const posters=Array.from(wall.querySelectorAll('figure'));
  let selected=2, frame=0, galleryReady=false;
  const position=i=>posters[i].offsetLeft+posters[i].offsetWidth/2-wall.clientWidth/2;
  function paint(){
    frame=0;if(!galleryReady)return;let nearest=Infinity;
    posters.forEach((poster,i)=>{
      const distance=Math.abs(position(i)-wall.scrollLeft)/(poster.offsetWidth+24);
      if(distance<nearest){nearest=distance;selected=i}
      poster.style.transform=`translateY(${Math.min(distance,2)*12}px) scale(${1-Math.min(distance,2)*.17})`;
      poster.style.opacity=String(Math.max(.12,1-distance*.4));
      poster.style.zIndex=String(10-Math.round(distance));
    });
    posters.forEach((p,i)=>p.setAttribute('aria-current',i===selected?'true':'false'));
    left.disabled=selected===0;right.disabled=selected===posters.length-1;
  }
  function go(i,instant=false){i=Math.max(0,Math.min(posters.length-1,i));wall.scrollTo({left:position(i),behavior:instant||reduced.matches?'instant':'smooth'})}
  function scroll(direction){go(selected+direction)}
  left.addEventListener('click',()=>scroll(-1));right.addEventListener('click',()=>scroll(1));
  wall.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(paint)},{passive:true});
  new ResizeObserver(()=>{wall.style.setProperty('--card-width',`${Math.min(320,wall.clientWidth*(wall.clientWidth<480?.62:.42))}px`);go(galleryReady?selected:2,true);galleryReady=true;paint()}).observe(wall,{box:'border-box'});
  wall.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();scroll(e.key==='ArrowRight'?1:-1)}});
  let wheelAt=0,wheelSum=0;
  wall.addEventListener('wheel',e=>{
    if(e.ctrlKey)return;
    const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    if(!delta || (selected===0&&delta<0)||(selected===posters.length-1&&delta>0))return;
    e.preventDefault();wheelSum+=delta;
    if(performance.now()-wheelAt>350&&Math.abs(wheelSum)>18){scroll(Math.sign(wheelSum));wheelSum=0;wheelAt=performance.now()}
  },{passive:false});
  let drag=null;
  wall.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,left:wall.scrollLeft};wall.setPointerCapture(e.pointerId);wall.classList.add('is-dragging')});
  wall.addEventListener('pointermove',e=>{if(drag)wall.scrollLeft=drag.left-(e.clientX-drag.x)});
  function endDrag(){if(!drag)return;drag=null;paint();wall.classList.remove('is-dragging');go(selected)}
  wall.addEventListener('pointerup',endDrag);wall.addEventListener('pointercancel',endDrag);
})();
