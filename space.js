const projects=[
 {title:'凯洛格 · 企业传播视觉系统',meta:'Branding / Graphic Design',type:'design',image:'assets/projects/keylogic-long.jpg',imageAlt:'凯洛格品牌策略、视觉识别与应用案例完整长图',expandIntro:true},
 {title:'孤独的章鱼',meta:'Picture Book / Illustration',type:'design',image:'assets/projects/lonely-octopus-long.jpg',imageAlt:'孤独的章鱼绘本项目完整作品介绍长图'},
 {title:'CROCO',meta:'Character / IP Design',type:'design',image:'assets/projects/croco-long.jpg',imageAlt:'CROCO IP 项目完整作品介绍长图'},
 {title:'NIHAO · PETSHIOP',meta:'Branding / IP Design',type:'design',image:'assets/projects/nihao-petshop-long.png',imageAlt:'NIHAO PETSHOP 品牌与 IP 设计完整作品介绍长图'},
 {title:'蔚蓝',meta:'Branding / Design',type:'design',image:'assets/projects/weilan-long.jpg',imageAlt:'蔚蓝海洋生态保护主题桌游完整作品介绍长图'},
 {title:'AI实战工作坊',meta:'Event Visual / Design',type:'design',image:'assets/projects/workshop-long.png',imageAlt:'AI实战工作坊项目完整作品介绍长图'},
 {title:'2026开年十二讲系列活动',meta:'Media Design',type:'ai',image:'assets/projects/twelve-talks-long.png',imageAlt:'2026开年十二讲系列活动完整作品介绍长图'},
 {title:'关于我',meta:'designer',type:'about'}
];
const $=s=>document.querySelector(s),works=$('#works'),detail=$('#detail'),list=$('#project-list'),backdrop=$('#project-backdrop');
const supportsWebp=(()=>{try{return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp')}catch{return false}})();
const preferredImage=path=>supportsWebp?path.replace(/\.(png|jpe?g)$/i,'.webp'):path;
const scroller=works.querySelector('.works-inner'),panelHead=works.querySelector('.panel-head'),returnControl=works.querySelector('.detail-return');
let selected=0,orbit=false,panelState='closed',panelTimer=0,backdropIndex=-1,returnFocus=null;
const pad=n=>String(n).padStart(2,'0'),reducedPanels=matchMedia('(prefers-reduced-motion: reduce)'),compactBackdrop=matchMedia('(max-width:700px), (pointer:coarse) and (orientation:portrait)');
// Only projects with a foldout entry replace the original detail backdrop.
const foldoutProjects=[
 {key:'01-keylogic',caption:'KEYLOGIC / BRAND IDENTITY',angle:'-72deg',left:'50%',top:'35%',secondary:{angle:'79deg',left:'49%',top:'69%'}},
 {key:'02-octopus',caption:'THE OCTOPUS WHO LIVES ALONE',angle:'-76deg',left:'50%',top:'50%',prefix:'square-'},
 {key:'03-croco',caption:'CROCO / IP DESIGN',angle:'74deg',left:'51%',top:'49%'},
 {key:'04-nihao',caption:'NIHAO / IP DESIGN',angle:'68deg',left:'48%',top:'52%',extension:'png'},
 {key:'05-weilan',caption:'WEILAN / OCEAN CARDS',angle:'-80deg',left:'50%',top:'35%',secondary:{angle:'71deg',left:'52%',top:'67%'}},
 {key:'06-workshop',caption:'AI WORKSHOP / EVENT VISUAL',angle:'82deg',left:'50%',top:'50%'},
 null, // Keep the original backdrop for the twelve-talks project.
 {key:'08-about',caption:'LI YUSHU / MY INFO',angle:'74deg',left:'47%',top:'78%',portrait:'assets/foldouts/08-about/portrait.png'}
];
const foldoutStage=$('#foldout-stage');
let foldoutFrame=0,foldoutScrollFrame=0;
function clearFoldout(){
 cancelAnimationFrame(foldoutFrame);foldoutFrame=0;
 cancelAnimationFrame(foldoutScrollFrame);foldoutScrollFrame=0;
 foldoutStage.replaceChildren();foldoutStage.hidden=true;
 foldoutStage.classList.remove('is-primed','is-unrolling');backdrop.classList.remove('has-foldout');
}
function foldoutTrack(project,placement,secondary=false){
 const track=document.createElement('div');track.className=`foldout-track${secondary?' is-secondary':' '}${project.secondary&&!secondary?' is-rear':''}`;
 track.dataset.project=project.key;
 track.style.setProperty('--foldout-angle',placement.angle);
 track.style.setProperty('--foldout-left',placement.left);
 track.style.setProperty('--foldout-top',placement.top);
 const paper=document.createElement('div');paper.className='foldout-paper';
 for(let index=0;index<8;index++){
  const number=pad(index+1),card=document.createElement('section'),art=document.createElement('img'),caption=document.createElement('div');
  card.className='foldout-card';art.className='foldout-art';art.alt='';art.loading='eager';art.decoding='async';art.fetchPriority='low';
  art.src=preferredImage(project.portrait||`assets/foldouts/${project.key}/${secondary?'secondary-':project.prefix||''}${number}.${secondary?'jpg':project.extension||'jpg'}`);
  caption.className='foldout-caption';
  const label=document.createElement('span'),title=document.createElement('span');
  label.className='foldout-number';label.textContent=pad(index+1+(secondary?8:0));
  title.className='foldout-title';title.textContent=project.caption;
  caption.append(label,title);
  if(project.portrait){
   const frame=document.createElement('div');frame.className='foldout-portrait-frame';
   frame.style.setProperty('--portrait-position',['50% 22%','50% 36%','50% 15%','50% 52%','50% 29%','50% 48%','50% 18%','50% 40%'][index]);
   frame.style.setProperty('--portrait-zoom',[1,1.03,1,1.05,1,1.04,1,1.03][index]);
   frame.append(art);card.append(frame,caption);
  }else card.append(art,caption);
  paper.append(card);
 }
 const roller=document.createElement('div');roller.className='foldout-roller';
 const motion=document.createElement('div');motion.className='foldout-motion';
 const repeat=paper.cloneNode(true);
 if(secondary)motion.append(repeat,paper);else motion.append(paper,repeat);
 track.append(motion,roller);return track;
}
function syncFoldoutScroll(){
 if(foldoutScrollFrame||panelState!=='detail'||foldoutStage.hidden||reducedPanels.matches)return;
 foldoutScrollFrame=requestAnimationFrame(()=>{
  foldoutScrollFrame=0;
  // One eight-card sequence is repeated on either side of the seam.
  const cycle=880*96/25.4;
  foldoutStage.querySelectorAll('.foldout-track').forEach(track=>{
   const speed=track.dataset.project==='08-about'?.06:.16;
   const distance=(scroller.scrollTop*speed)%cycle;
   const direction=track.classList.contains('is-secondary')?1:-1;
   track.style.setProperty('--foldout-scroll',`${direction*distance}px`);
  });
 });
}
scroller.addEventListener('scroll',syncFoldoutScroll,{passive:true});
function renderFoldout(i){
 clearFoldout();const project=foldoutProjects[i];
 if(compactBackdrop.matches||!project)return;
 foldoutStage.append(foldoutTrack(project,project));
 if(project.secondary)foldoutStage.append(foldoutTrack(project,project.secondary,true));
 if(!reducedPanels.matches)foldoutStage.classList.add('is-primed');
 foldoutStage.hidden=false;backdrop.classList.add('has-foldout');
 if(!reducedPanels.matches)foldoutFrame=requestAnimationFrame(()=>{
  foldoutStage.classList.remove('is-primed');foldoutStage.classList.add('is-unrolling');foldoutFrame=0;
 });
}
const reel=$('#number-reel');reel.innerHTML=projects.map((_,i)=>`<span aria-hidden="true">${pad(i+1)}</span>`).join('');$('#total-number').textContent=pad(projects.length);
function hideBackdrop(immediate=false){
 clearFoldout();backdropIndex=-1;backdrop.classList.remove('is-visible','is-detail','is-switching');
 backdrop.classList.toggle('is-suspended',immediate);
}
function showBackdrop(i,showGallery=true){
 const p=projects[i];
 if(compactBackdrop.matches||(!p?.image&&!foldoutProjects[i])){hideBackdrop();return}
 backdrop.classList.remove('is-suspended');
 // The detail foldout covers the gallery, so avoid painting a second huge image behind it.
 if(!showGallery){backdrop.classList.add('is-visible');return}
 if(backdropIndex!==i){
  if(backdropIndex>=0&&!reducedPanels.matches){backdrop.classList.remove('is-switching');void backdrop.offsetWidth;backdrop.classList.add('is-switching')}
  backdrop.style.setProperty('--gallery-image',`url("${preferredImage(p.image)}")`);backdropIndex=i;
 }
 backdrop.classList.add('is-visible');
}
compactBackdrop.addEventListener('change',()=>{
 if(panelState!=='detail')return;
 if(!foldoutProjects[selected]){hideBackdrop();return}
 showBackdrop(selected,false);renderFoldout(selected);
});
function setNumber(i){
 reel.querySelectorAll('span').forEach((number,index)=>number.classList.toggle('active',index===i));
 works.querySelector('.number-display').setAttribute('aria-label',`当前作品编号 ${pad(i+1)} / ${pad(projects.length)}`);
 list.querySelectorAll('.project-row').forEach(row=>row.classList.toggle('is-active',Number(row.dataset.index)===i));
}
function render(){
 list.replaceChildren();
 projects.forEach((p,i)=>{
  const b=document.createElement('button');b.className='project-row';b.dataset.index=i;b.style.setProperty('--row-order',i);
  b.innerHTML=`<span class="row-number">${pad(i+1)}</span><strong>${p.title}</strong><small>// ${p.meta}</small><span class="row-cover" aria-hidden="true"></span>`;
  b.addEventListener('pointerenter',()=>{if(panelState==='index')setNumber(i)});
  b.addEventListener('focus',()=>{if(panelState==='index')setNumber(i)});
  b.addEventListener('click',()=>showDetail(i));list.append(b);
 });
 setNumber(0);
}
function measureOrigin(){
 const rect=$('.view-works').getBoundingClientRect();
 works.style.setProperty('--origin-top',`${rect.top+rect.height/2-3.5}px`);
 works.style.setProperty('--origin-left',`${rect.left}px`);
 works.style.setProperty('--origin-width',`${rect.width}px`);
 works.style.setProperty('--origin-height','7px');
}
function finishAfter(ms,callback){clearTimeout(panelTimer);if(reducedPanels.matches){callback();return}panelTimer=setTimeout(callback,ms)}
function openWorks(){
 if(panelState==='detail'){returnToIndex();return}
 if(panelState!=='closed')return;
 returnFocus=document.activeElement;measureOrigin();
 works.hidden=false;scroller.inert=true;scroller.scrollTop=0;
 works.getBoundingClientRect(); // Establish the button-sized starting box once.
 panelState='opening';document.body.classList.add('panel-open');$('#home').inert=true;
 works.classList.add('is-open');
 finishAfter(1100,()=>{panelState='index';scroller.inert=false;works.querySelector('.close').focus({preventScroll:true})});
}
function returnToIndex(){
 if(panelState!=='detail')return;
 panelState='returning';scroller.inert=true;
 hideBackdrop(true);
 if(!reducedPanels.matches){
  $('#return-preview-number').textContent=pad(selected+1);
  $('#return-preview-title').textContent=projects[selected].title;
  $('#home').classList.add('is-returning');works.classList.add('is-returning');
 }
 detail.hidden=true;works.classList.remove('is-detail');returnControl.hidden=true;
 panelHead.inert=false;list.inert=false;scroller.scrollTop=0;
 finishAfter(840,()=>{
  $('#home').classList.remove('is-returning');works.classList.remove('is-returning');
  panelState='index';scroller.inert=false;
  list.querySelector(`[data-index="${selected}"]`).focus({preventScroll:true});
 });
}
function closePanel(){
 if(panelState==='closed'||panelState==='closing')return;
 $('#home').classList.remove('is-returning');works.classList.remove('is-returning');
 hideBackdrop();
 clearTimeout(panelTimer);measureOrigin();panelState='closing';scroller.inert=true;returnControl.hidden=true;
 works.classList.remove('is-open');document.body.classList.add('panel-closing');
 finishAfter(1000,()=>{
  works.hidden=true;detail.hidden=true;works.classList.remove('is-detail');panelHead.inert=false;list.inert=false;
  document.body.classList.remove('panel-open','panel-closing');$('#home').inert=false;panelState='closed';
  (returnFocus||$('.view-works')).focus({preventScroll:true});
 });
}
function keylogicMarkup(p){return `<div class="keylogic-intro-clip"><img class="detail-long-image" src="${preferredImage(p.image)}" alt="凯洛格案例首图与项目简介" loading="lazy" decoding="async" fetchpriority="high"></div>
  <section class="keylogic-expand" aria-label="凯洛格项目介绍"><button class="keylogic-expand-button" type="button" aria-controls="keylogic-description" aria-expanded="false">展开完整内容 ↗</button>
    <div class="keylogic-description" id="keylogic-description" hidden>
      <p>凯洛格成立于 2004 年，专注于咨询培训领域。以战略引领、人才驱动为方向，为企业提供体系咨询、面授培训和数字化学习相结合的人才管理解决方案。</p>
      <p>凯洛格恪守“专业主义”的价值观，践行“赋能于人”的使命。品牌视觉以清晰、理性的表达呈现专业知识，同时在不同媒介中保持一致的识别。</p>
      <h3>可视化专业协作</h3>
      <p>从战略咨询、组织能力到领导力培养，凯洛格的工作始终围绕人与组织共同成长。设计以深蓝和白色建立明确对比，用有秩序的文字层级和视觉节奏承载复杂信息。</p>
      <h3>面向多元场景</h3>
      <p>品牌语言延展至报告、数字页面、活动传播与线下物料，让研究洞察和人才发展内容在不同触点都能被清楚识别。</p>
    </div>
  </section>
  <div class="keylogic-rest-clip"><img class="detail-long-image" src="${preferredImage(p.image)}" alt="凯洛格视觉识别与品牌应用展示长图后续" loading="lazy" decoding="async"></div>`}
function detailImageAttrs(p){return supportsWebp&&p.image.endsWith('nihao-petshop-long.png')?' srcset="assets/projects/nihao-petshop-long-2400.webp 2400w, assets/projects/nihao-petshop-long.webp 4320w" sizes="(max-width:700px) 100vw, 1000px"':''}
function workMarkup(i){const p=projects[i];const media=p.image?(p.expandIntro?keylogicMarkup(p):`<img class="detail-long-image" src="${preferredImage(p.image)}" alt="${p.imageAlt}" loading="lazy" decoding="async" fetchpriority="high"${detailImageAttrs(p)}>`):`<div class="detail-placeholder"><span>${pad(i+1)}</span><p>作品即将呈现 / Coming soon</p></div>`;return `<div class="detail-lede"><p>作品展示 / Project showcase</p><div class="detail-facts"><span>CATEGORY<br><b>${p.meta}</b></span><span>INDEX<br><b>${pad(i+1)} / ${pad(projects.length)}</b></span></div></div><div class="detail-media">${media}</div>`}
function aboutMarkup(){return `
  <div class="resume-sheet">
    <div class="resume-opening"><p>GRAPHIC DESIGNER & CREATIVE PRACTITIONER</p><h3>LI YUSHU <span>李钰姝</span></h3></div>
    <section class="resume-section"><h4>✳ About</h4><p>我以创造价值为驱动，关注设计、技术与商业思维的结合，擅长将复杂信息转化为清晰、有辨识度的视觉表达。</p><p>从品牌传播、营销视觉到插画与 AI 创意实践，我享受团队协作中的灵感碰撞，也持续探索更高效的设计工作流。</p></section>
    <section class="resume-section"><h4>✳ Skillset</h4><div class="resume-skillset"><span>Photoshop</span><span>Illustrator</span><span>Premiere Pro</span><span>3ds Max</span><span>Midjourney</span><span>AI Design Workflow</span></div></section>
    <section class="resume-section"><h4>✳ Work Experience</h4><div class="resume-entry"><strong>凯洛格化成（北京）咨询有限公司</strong><span>// 品牌传播</span><small>2025.09 — 至今</small><p>品牌视觉内容运营、营销活动视觉、VI 延展及 AI 设计工作流建设。</p></div><div class="resume-entry"><strong>科大讯飞股份有限公司</strong><span>// 产品助理 · 研发平台 AI 工程院</span><small>2024.08 — 2024.12</small><p>参与讯飞星火大模型创新应用，负责需求调研、产品策划及上线体验优化，推动“海龟汤之谜”“先知”等项目落地。</p></div><div class="resume-entry"><strong>东方甄选（北京）科技有限公司</strong><span>// 展品设计</span><small>2024.02 — 2024.06</small><p>直播间场景、展品与营销活动视觉设计。</p></div><div class="resume-entry"><strong>北京声智科技有限公司</strong><span>// 品牌传播</span><small>2023.10 — 2024.02</small><p>内容策划、社交媒体视觉与团队协作。</p></div></section>
    <section class="resume-section"><h4>✳ Education</h4><div class="resume-entry"><strong>中央财经大学</strong><span>// 艺术 · 硕士研究生</span><small>2022.09 — 2025.06</small></div><div class="resume-entry"><strong>四川师范大学</strong><span>// 数字媒体艺术 · 本科</span><small>2016.01 — 2020.01</small></div></section>
    <section class="resume-section"><h4>✳ Contact</h4><p><a href="mailto:liyushu3589@foxmail.com">liyushu3589@foxmail.com ↗</a></p></section>
  </div>
  <a class="info-film" href="assets/网页版简历-工作请联系邮箱.pdf" download="网页版简历-工作请联系邮箱.pdf" aria-label="下载李钰姝的 PDF 简历"><span class="resume-motion" aria-hidden="true"><span>RESUME ☺ RESUME ☺ RESUME ☺ RESUME ☺</span><span>RESUME ☺ RESUME ☺ RESUME ☺ RESUME ☺</span></span><span class="info-film-label"><small>VIEW / RESUME</small><strong>点击下载简历 ↗</strong></span></a>`}
function showDetail(i){
 if(i<0||i>=projects.length||!['index','detail'].includes(panelState))return;
 selected=i;const p=projects[i];setNumber(i);
 if(foldoutProjects[i]){
  showBackdrop(i,false);renderFoldout(i);backdrop.classList.toggle('is-detail',!compactBackdrop.matches);
 }else hideBackdrop(); // Unapproved projects keep the original plain background.
 detail.classList.toggle('is-info',p.type==='about');
 $('#detail-title').textContent=p.type==='about'?'My Info.':p.title;$('#detail-meta').textContent=p.meta;
 $('#detail-code').textContent=`${pad(i+1)} / ${pad(projects.length)} · ${p.type==='about'?'ABOUT':'SELECTED WORK'}`;
 $('#detail-count').textContent=`${pad(i+1)} — ${pad(projects.length)}`;
 $('#previous').disabled=i===0;$('#next').disabled=i===projects.length-1;
 $('#detail-body').innerHTML=p.type==='about'?aboutMarkup():workMarkup(i);
 detail.hidden=false;works.classList.add('is-detail');panelState='detail';panelHead.inert=true;list.inert=true;
 returnControl.hidden=false;scroller.scrollTop=0;$('#back').focus({preventScroll:true});
}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',openWorks));
works.querySelector('.close').addEventListener('click',closePanel);
$('#back').addEventListener('click',returnToIndex);
$('#previous').addEventListener('click',()=>showDetail(selected-1));$('#next').addEventListener('click',()=>showDetail(selected+1));
detail.addEventListener('click',e=>{
 const button=e.target.closest('.keylogic-expand-button');if(!button||!detail.contains(button))return;
 const content=detail.querySelector('#keylogic-description');if(!content)return;
 const expanded=button.getAttribute('aria-expanded')==='true';
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  content.hidden=expanded;
  content.classList.toggle('is-open',!expanded);
  content.style.height=expanded?'0px':'auto';
  button.setAttribute('aria-expanded',String(!expanded));
  button.textContent=expanded?'展开完整内容 ↗':'收起内容 ↖';
  return;
 }
 const currentHeight=content.getBoundingClientRect().height;
 content.hidden=false;
 content.style.height=`${currentHeight}px`;
 void content.offsetHeight;
 button.setAttribute('aria-expanded',String(!expanded));
 button.textContent=expanded?'展开完整内容 ↗':'收起内容 ↖';
 requestAnimationFrame(()=>{
  content.classList.toggle('is-open',!expanded);
  content.style.height=expanded?'0px':`${content.scrollHeight}px`;
 });
});
detail.addEventListener('transitionend',e=>{
 const content=e.target;
 if(!content.classList.contains('keylogic-description')||e.propertyName!=='height')return;
 const button=detail.querySelector('.keylogic-expand-button');
 if(!button)return;
 if(button.getAttribute('aria-expanded')==='true')content.style.height='auto';
 else{content.hidden=true;content.style.height='0px'}
});
$('#back').addEventListener('pointermove',e=>{if(reducedPanels.matches||e.pointerType==='touch')return;const rect=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--rx',`${-(e.clientY-rect.top-rect.height/2)/rect.height*15}deg`);e.currentTarget.style.setProperty('--ry',`${(e.clientX-rect.left-rect.width/2)/rect.width*15}deg`)});
$('#back').addEventListener('pointerleave',e=>{e.currentTarget.style.removeProperty('--rx');e.currentTarget.style.removeProperty('--ry')});
window.addEventListener('resize',measureOrigin,{passive:true});
document.addEventListener('keydown',e=>{
 if(panelState==='closed')return;
 if(e.key==='Escape'){e.preventDefault();panelState==='detail'?returnToIndex():closePanel();return}
 if(e.key!=='Tab')return;
 const focusable=[...works.querySelectorAll('button,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&!el.closest('[hidden],[inert]'));
 if(!focusable.length){e.preventDefault();return}
 const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
const scene=$('.scene img'),motion=$('#motion'),reduced=matchMedia('(prefers-reduced-motion: reduce)');function reset(){scene.style.transform='';orbit=false;motion.setAttribute('aria-pressed','false');motion.innerHTML='Orbit Off <kbd>O</kbd>';resetMask()}function toggle(){orbit=!orbit;motion.setAttribute('aria-pressed',String(orbit));motion.innerHTML=`Orbit ${orbit?'On':'Off'} <kbd>O</kbd>`;if(!orbit)scene.style.transform=''}motion.addEventListener('click',toggle);$('#rewind').addEventListener('click',reset);$('#home').addEventListener('pointermove',e=>{if(panelState!=='closed'||!orbit||reduced.matches||e.pointerType==='touch')return;const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;scene.style.transform=`scale(1.08) rotateY(${x*8}deg) rotateX(${-y*6}deg) translate(${x*12}px,${y*12}px)`});document.addEventListener('keydown',e=>{if(panelState!=='closed'||e.target.closest('button,a'))return;if(e.key.toLowerCase()==='o')toggle();if(e.key.toLowerCase()==='r')reset()});render();

// A real, persistent alpha mask: only the cover is erased, never the photo.
const home=$('#home'),mask=document.createElement('canvas');mask.className='reveal-mask';mask.setAttribute('aria-hidden','true');home.append(mask);
const hint=document.createElement('div');hint.className='reveal-hint';hint.innerHTML='<span>MOVE TO REVEAL</span><p>移动鼠标，擦开我的世界</p><button type="button">一键显形 ↗</button>';home.append(hint);
const cursor=document.createElement('div');cursor.className='paint-cursor';cursor.setAttribute('aria-hidden','true');cursor.innerHTML='<svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 54 28 35l9 9-19 19-12 3 3-12Z" fill="white" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="m28 35 7-7 9 9-7 7M35 28l14-14c3-3 7-3 10 0s3 7 0 10L44 37" fill="white" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="m8 66 11-4M12 51l11 11M51 11l11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';home.append(cursor);
const ctx=mask.getContext('2d');let last=null,pending=null,frame=0,uncovered=false,w=0,h=0;
function dab(x,y,r,angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='rgba(0,0,0,1)';ctx.fillRect(-r*.17,-r*.43,r*.34,r*.86);for(let i=0;i<9;i++){const lane=(i-4)*r*.105,grain=Math.sin(x*.17+y*.31+i*7.3);if(Math.abs(lane)<r*.31||grain>.12){ctx.fillRect(-r*(.14+.02*(i%3)),lane-r*.027,r*(.29+.05*(i%4)),r*.054)}}ctx.restore()}
function stroke(a,b,r){const dx=b.x-a.x,dy=b.y-a.y,angle=Math.atan2(dy,dx),length=Math.hypot(dx,dy),n=Math.max(1,Math.ceil(length/(r*.12)));for(let i=0;i<=n;i++)dab(a.x+dx*i/n,a.y+dy*i/n,r,angle);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#d9dcdd';for(let i=0;i<length/7;i++){const t=(i+.5)*7/Math.max(length,1),cross=(Math.sin(i*19.19+a.x*.13+a.y*.27)*.5)*r,along=Math.cos(i*7.31+b.x*.11)*3,x=a.x+dx*t-Math.sin(angle)*cross+Math.cos(angle)*along,y=a.y+dy*t+Math.cos(angle)*cross+Math.sin(angle)*along;ctx.fillRect(x,y,1.2+(i%3)*.6,1+(i%2))}ctx.globalCompositeOperation='destination-out'}
function paintMask(force=false){const bounds=home.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),nextW=Math.round(bounds.width*dpr),nextH=Math.round(bounds.height*dpr);if(!force&&mask.width===nextW&&mask.height===nextH)return;let previous=null;if(!force&&mask.width&&mask.height&&!uncovered){previous=document.createElement('canvas');previous.width=mask.width;previous.height=mask.height;previous.getContext('2d').drawImage(mask,0,0)}w=bounds.width;h=bounds.height;mask.width=nextW;mask.height=nextH;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);if(previous)ctx.drawImage(previous,0,0,w,h);else if(!uncovered){ctx.fillStyle='#d9dcdd';ctx.fillRect(0,0,w,h)}ctx.globalCompositeOperation='destination-out';last=null}
function flushStroke(){frame=0;if(!pending)return;const {p,r}=pending,a=last||p;pending=null;ctx.globalCompositeOperation='destination-out';stroke(a,p,r);last=p;hint.classList.add('used')}
function resetMask(){if(frame)cancelAnimationFrame(frame);frame=0;pending=null;uncovered=false;last=null;hint.classList.remove('used');hint.hidden=false;paintMask(true)}
function erase(e){const blocked=panelState!=='closed'||!!e.target.closest('header,footer,button');cursor.classList.toggle('active',!blocked&&e.pointerType!=='touch');cursor.style.left=`${e.clientX}px`;cursor.style.top=`${e.clientY}px`;if(uncovered||blocked){if(pending)flushStroke();last=null;return}const rect=home.getBoundingClientRect(),p={x:e.clientX-rect.left,y:e.clientY-rect.top},r=Math.max(55,Math.min(110,w*.092));pending={p,r};if(!frame)frame=requestAnimationFrame(flushStroke)}
home.addEventListener('pointermove',erase);home.addEventListener('pointerdown',erase);['pointerleave','pointerup','pointercancel'].forEach(t=>home.addEventListener(t,()=>{if(pending)flushStroke();last=null;if(t!=='pointerup')cursor.classList.remove('active')}));hint.querySelector('button').addEventListener('click',()=>{uncovered=true;if(frame)cancelAnimationFrame(frame);frame=0;pending=null;ctx.clearRect(0,0,w,h);hint.hidden=true});new ResizeObserver(()=>paintMask()).observe(home);resetMask();
