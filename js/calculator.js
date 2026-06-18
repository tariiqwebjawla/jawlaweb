function round(n){ return Math.round(n); }
function bmiClass(bmi){
  if (bmi < 18.5) return 'نحافة';
  if (bmi < 25) return 'وزن طبيعي';
  if (bmi < 30) return 'زيادة وزن';
  if (bmi < 35) return 'سمنة درجة أولى';
  if (bmi < 40) return 'سمنة درجة ثانية';
  return 'سمنة شديدة';
}
function goalLabel(t){
  return {
    lossModerate:'خسارة وزن معتدلة',
    lossFast:'خسارة وزن سريعة',
    cut:'تنشيف',
    maintain:'المحافظة على الوزن',
    leanBulk:'بناء عضل نظيف',
    bulk:'تضخيم سريع'
  }[t] || 'هدفك';
}
function caloriesForGoal(tdee, target){
  if (target === 'lossFast') return tdee * 0.80;
  if (target === 'lossModerate') return tdee * 0.85;
  if (target === 'cut') return tdee * 0.82;
  if (target === 'leanBulk') return tdee * 1.10;
  if (target === 'bulk') return tdee * 1.15;
  return tdee;
}
function calc(){
  const g = document.getElementById('gender').value;
  const a = +document.getElementById('age').value;
  const h = +document.getElementById('height').value;
  const w = +document.getElementById('weight').value;
  const gw = +document.getElementById('goalWeight').value;
  const act = +document.getElementById('activity').value;
  const t = document.getElementById('target').value;
  const result = document.getElementById('result');

  if(!a || !h || !w){
    result.innerHTML = '<div class="warn">أدخل العمر والطول والوزن عشان تطلع لك النتائج.</div>';
    return;
  }

  const bmr = (g === 'male') ? (10*w + 6.25*h - 5*a + 5) : (10*w + 6.25*h - 5*a - 161);
  const tdee = bmr * act;
  const targetCal = caloriesForGoal(tdee, t);

  const proteinPerKg = (t === 'lossFast' || t === 'lossModerate' || t === 'cut') ? 2.2 : (t === 'maintain' ? 1.8 : 2.0);
  const protein = w * proteinPerKg;
  const fat = w * 0.8;
  const carbs = Math.max(0, (targetCal - (protein*4 + fat*9)) / 4);
  const bmi = w / ((h/100) ** 2);
  const water = w * 0.035;

  const diff = gw ? Math.max(0, w - gw) : 0;
  let lossBox = '';
  if (gw && gw < w) {
    lossBox = `
      <div class="result-card wide">
        <h3>خطة خسارة الوزن</h3>
        <p>تحتاج تخسر: <b>${diff.toFixed(1)} كجم</b></p>
        <p>بمعدل 0.5 كجم أسبوعياً: <b>${Math.ceil(diff / 0.5)} أسبوع</b></p>
        <p>بمعدل 0.75 كجم أسبوعياً: <b>${Math.ceil(diff / 0.75)} أسبوع</b></p>
        <p>بمعدل 1 كجم أسبوعياً: <b>${Math.ceil(diff)} أسبوع</b></p>
      </div>`;
  } else if (gw && gw >= w) {
    lossBox = `<div class="result-card wide"><h3>ملاحظة</h3><p>الوزن المستهدف أعلى أو يساوي وزنك الحالي، لذلك لا توجد خطة خسارة وزن.</p></div>`;
  }

  result.innerHTML = `
    <h2>نتيجتك</h2>
    <div class="result-grid">
      <div class="result-card"><small>معدل الأيض الأساسي</small><b>${round(bmr)}</b><span>سعرة</span></div>
      <div class="result-card"><small>احتياج المحافظة</small><b>${round(tdee)}</b><span>سعرة يومياً</span></div>
      <div class="result-card"><small>${goalLabel(t)}</small><b>${round(targetCal)}</b><span>سعرة يومياً</span></div>
      <div class="result-card"><small>مؤشر كتلة الجسم</small><b>${bmi.toFixed(1)}</b><span>${bmiClass(bmi)}</span></div>
    </div>

    <div class="result-card wide">
      <h3>الماكروز اليومية</h3>
      <div class="macro">
        <div><b>${round(protein)}</b><span>غ بروتين</span></div>
        <div><b>${round(carbs)}</b><span>غ كارب</span></div>
        <div><b>${round(fat)}</b><span>غ دهون</span></div>
      </div>
    </div>

    <div class="result-card wide">
      <h3>الماء المقترح</h3>
      <p>احتياجك التقريبي: <b>${water.toFixed(1)} لتر يومياً</b></p>
    </div>

    ${lossBox}
  `;
}
