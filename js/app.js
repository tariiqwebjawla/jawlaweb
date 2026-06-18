function escapeHtml(value){
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function normalizeSpaces(s){return String(s||'').replace(/\u200b/g,'').replace(/\s+/g,' ').trim();}
function cleanMealName(name, variant){
  let n = normalizeSpaces(name);
  ['عالي البروتين','خفيف للتنشيف','متوازن','للطاقة قبل التمرين','قبل التمرين','عام','للطاقة قبل'].forEach(v=>{
    n = n.replace(new RegExp('\\s*-?\\s*'+v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),' ');
  });
  n = n.replace(/\s+/g,' ').trim();
  return n || normalizeSpaces(name) || 'وجبة';
}
function cleanVariant(x){
  const text = normalizeSpaces(`${x.variant||''} ${x.name||''} ${x.ingredients||''}`);
  if(text.includes('عالي البروتين')) return 'عالي البروتين';
  if(text.includes('خفيف للتنشيف')) return 'خفيف للتنشيف';
  if(text.includes('متوازن')) return 'متوازن';
  if(text.includes('للطاقة قبل التمرين') || text.includes('قبل التمرين')) return 'للطاقة قبل التمرين';
  return x.variant && x.variant !== 'عام' ? x.variant : 'متوازن';
}
function cleanIngredientText(text, variant){
  let s = normalizeSpaces(text)
    .replace(/تعديل/g,' ')
    .replace(/عالي البروتين|خفيف للتنشيف|متوازن|للطاقة قبل التمرين|قبل التمرين|عام/g,' ')
    .replace(/\.في/g,' في')
    .replace(/\.وقدمه/g,' وقدمه')
    .replace(/\s+/g,' ')
    .trim();
  // إضافة مسافات حول الأرقام والوحدات حتى لا تظهر الكلمات ملتصقة مثل موز100غ
  s = s.replace(/([^\d\s,،])(\d+)/g,'$1 $2');
  s = s.replace(/(\d+)\s*(غ|مل)/g,'$1$2');
  s = s.replace(/\s+,/g,',').replace(/,\s*/g,'، ');
  let parts = s.split(/[،,]/).map(x=>normalizeSpaces(x)).filter(Boolean);
  parts = parts.map(part => part
    .replace(/^غ\s*/,'')
    .replace(/^مل\s*/,'')
    .replace(/\s+غ$/,'غ')
    .replace(/\s+مل$/,'مل')
    .replace(/\s+/g,' ')
    .trim()
  ).filter(part => part && !['غ','مل','-'].includes(part));
  // إزالة التكرار وإبقاء ترتيب المقادير كما يظهر بعد التنظيف
  const seen = new Set();
  parts = parts.filter(p=>{const k=p.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true;});
  return parts.length ? parts : ['حسب الكمية المذكورة في الوصفة'];
}
function preparationSteps(text){
  let s = normalizeSpaces(text)
    .replace(/\.في/g,' في')
    .replace(/\.وقدمه/g,' وقدمه')
    .replace(/\.كوجبة/g,' كوجبة')
    .replace(/\.الكربوهيدرات/g,' الكربوهيدرات')
    .replace(/\s+\./g,'.')
    .replace(/^\./,'')
    .trim();
  let steps = s.split(/(?:\.\s+|،\s*(?=ثم|واستخدم|استخدم|أضف|قدم|قّدم|قدمه|اجعل|اخلط|ضع|اطبخ|اشو|اشِو|شّوح|تّبل|اهِرس|رتب))/)
    .map(x=>normalizeSpaces(x.replace(/^\./,'')))
    .filter(Boolean);
  if(steps.length === 1){
    steps = s.split(/(?: ثم | وقدم| وقدمه|\. )/).map(x=>normalizeSpaces(x)).filter(Boolean);
  }
  return steps.length ? steps : ['اتبع طريقة التحضير المذكورة للوصفة.'];
}
function listHtml(items, cls){
  return `<ul class="${cls}">${items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}
function mealApp(){
  const data=window.MEALS_DATA||[], grid=document.getElementById('grid');
  if(!grid)return;
  const q=document.getElementById('q'), cat=document.getElementById('cat'), goal=document.getElementById('goal'), cal=document.getElementById('cal'), pro=document.getElementById('pro');
  const modal=document.createElement('div');
  modal.className='modal hidden';
  modal.innerHTML='<div class="modal-card"><button class="modal-close" type="button">×</button><div id="mealDetail"></div></div>';
  document.body.appendChild(modal);
  modal.querySelector('.modal-close').onclick=()=>modal.classList.add('hidden');
  modal.addEventListener('click',e=>{ if(e.target===modal) modal.classList.add('hidden') });
  function showMeal(id){
    const x=data.find(m=>String(m.id)===String(id)); if(!x)return;
    const detail=document.getElementById('mealDetail');
    const variant = cleanVariant(x);
    const name = cleanMealName(x.name, variant);
    const ingredients = cleanIngredientText(x.ingredients, variant);
    const steps = preparationSteps(x.preparation);
    detail.innerHTML=`<h2>${escapeHtml(name)}</h2>
      <div class="chips"><span>${escapeHtml(x.category)}</span><span>${escapeHtml(variant)}</span><span>#${String(x.id).padStart(3,'0')}</span></div>
      <div class="macro detail-macro"><div><b>${x.calories??'-'}</b>سعرة</div><div><b>${x.protein??'-'}غ</b>بروتين</div><div><b>${x.carbs??'-'}غ</b>كارب</div><div><b>${x.fat??'-'}غ</b>دهون</div></div>
      <section class="detail-section"><h3>المقادير</h3>${listHtml(ingredients,'ingredient-list')}</section>
      <section class="detail-section"><h3>طريقة التحضير</h3><ol class="steps-list">${steps.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol></section>`;
    modal.classList.remove('hidden');
  }
  function render(){
    document.getElementById('calVal').textContent=cal.value; document.getElementById('proVal').textContent=pro.value;
    let arr=data.filter(x=>{
      const variant = cleanVariant(x);
      return (!q.value||JSON.stringify(x).includes(q.value))&&(!cat.value||x.category===cat.value)&&(!goal.value||variant===goal.value || x.variant===goal.value)&&(x.calories||0)<=+cal.value&&(x.protein||0)>=+pro.value;
    });
    document.getElementById('stats').textContent=`النتائج: ${arr.length} وجبة`;
    grid.innerHTML=arr.slice(0,220).map(x=>{ const variant=cleanVariant(x); return `<article class="meal-card compact-card">
      <div class="card-head"><h3>${String(x.id).padStart(3,'0')} - ${escapeHtml(cleanMealName(x.name,variant))}</h3></div>
      <div class="chips"><span>${escapeHtml(x.category)}</span><span>${escapeHtml(variant)}</span></div>
      <div class="macro"><div><b>${x.calories??'-'}</b>سعرة</div><div><b>${x.protein??'-'}غ</b>بروتين</div><div><b>${x.carbs??'-'}غ</b>كارب</div><div><b>${x.fat??'-'}غ</b>دهون</div></div>
      <button class="primary small-btn" data-meal="${x.id}">عرض المقادير والطريقة</button>
    </article>`}).join('');
    grid.querySelectorAll('[data-meal]').forEach(btn=>btn.addEventListener('click',()=>showMeal(btn.dataset.meal)));
  }
  [q,cat,goal,cal,pro].forEach(e=>e&&e.addEventListener('input',render)); render();
}
function workoutsApp(){
  const data=window.WORKOUTS_DATA||[], box=document.getElementById('workouts'); if(!box)return;
  const select=document.getElementById('program'), q=document.getElementById('wq'), type=document.getElementById('wtype'), level=document.getElementById('wlevel'), stats=document.getElementById('wstats');
  const tabs=[...document.querySelectorAll('[data-mode]')];
  data.forEach(p=>select.insertAdjacentHTML('beforeend',`<option>${escapeHtml(p.program)}</option>`));
  [...new Set(data.map(p=>p.type).filter(Boolean))].forEach(t=>type&&type.insertAdjacentHTML('beforeend',`<option>${escapeHtml(t)}</option>`));
  tabs.forEach(btn=>btn.addEventListener('click',()=>{tabs.forEach(b=>b.classList.remove('active'));btn.classList.add('active'); if(type) type.value=btn.dataset.mode||''; render();}));
  function exerciseRows(exs){
    return `<div class="table-wrap"><table class="exercise-table"><thead><tr><th>#</th><th>التمرين</th><th>التكرارات</th><th>الفيديو</th></tr></thead><tbody>${exs.map((e,i)=>`<tr><td>${i+1}</td><td><b>${escapeHtml(e.name)}</b></td><td>${escapeHtml(e.setsReps)}</td><td>${e.url?`<a class="video-link" target="_blank" rel="noopener" href="${escapeHtml(e.url)}">مشاهدة</a>`:'-'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function render(){
    const query=(q.value||'').trim().toLowerCase();
    let arr=data.filter(p=>(!select.value||p.program===select.value)&&(!type?.value||p.type===type.value)&&(!level?.value||p.level===level.value)&&(!query||JSON.stringify(p).toLowerCase().includes(query)));
    const countDays=arr.reduce((s,p)=>s+(p.days||[]).filter(d=>d.exercises).length,0);
    const countExercises=arr.reduce((s,p)=>s+(p.days||[]).reduce((x,d)=>x+(d.exercises?d.exercises.length:0),0),0);
    if(stats) stats.textContent=`النتائج: ${arr.length} برنامج • ${countDays} يوم تدريبي • ${countExercises} تمرين`;
    box.innerHTML=arr.map(p=>`<details class="program-card" open><summary><span>${escapeHtml(p.program)}</span><small>${escapeHtml(p.type||'')} ${p.level?`• ${escapeHtml(p.level)}`:''}</small></summary>${p.days.map(d=>`<section class="day"><h3>${escapeHtml(d.title)}</h3>${d.muscles?`<div class="chips">${d.muscles.map(m=>`<span>${escapeHtml(m)}</span>`).join('')}</div>`:''}${d.notes?`<p class="small">${escapeHtml(d.notes)}</p>`:''}${d.exercises?exerciseRows(d.exercises):''}</section>`).join('')}</details>`).join('') || '<p class="empty">لا توجد نتائج مطابقة.</p>';
  }
  [select,q,type,level].forEach(e=>e&&e.addEventListener('input',render)); render();
}
mealApp(); workoutsApp();
