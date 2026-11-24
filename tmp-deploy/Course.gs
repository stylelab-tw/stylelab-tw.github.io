/* ========================= 官網課程報名：排課／收款／完課（後台「課程報名／排課」） ========================= */
var COURSE_COLS = ['課程狀態', '收款狀態', '已收金額', '收款方式', '收款日', '完課日期', '證書已寄', '課後問卷', '陪跑班興趣', '備註', '紀錄'];
var COURSE_STATES = ['待排課', '已排課', '改期', '已完課', '沒來', '退款', '取消'];
var PAY_STATES = ['未收款', '已收訂金', '已收全額', '已退款'];

function ensureCourseCols_() {
  var sh = applySheet_();
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var miss = COURSE_COLS.filter(function (h) { return head.indexOf(h) < 0; });
  if (miss.length) sh.getRange(1, sh.getLastColumn() + 1, 1, miss.length).setValues([miss]).setFontWeight('bold');
  return sh;
}

/** 課程狀態：有填就用填的；舊資料照 status／上課日期推 */
function courseState_(r) {
  var s = String(r['課程狀態'] || '');
  if (COURSE_STATES.indexOf(s) >= 0) return s;
  if (r.status === '取消') return '取消';
  return dayStr_(r['上課日期']) ? '已排課' : '待排課';
}
function courseDate_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return dayStr_(v) || String(v).slice(0, 10);
}
function courseFlag_(v) { return v === true || String(v) === '1'; }

function courseView_(r) {
  var keys = rowKeys_(r), ds = dayStr_(r['上課日期']), st = courseState_(r);
  var d = ds ? daysUntil_(ds) : null, total = Number(r.total) || 0;
  return {
    id: String(r.id), ts: tsDay_(r.ts), name: String(r.name || ''), nick: String(r['綽號'] || ''), email: String(r.email || ''),
    phone: String(r.phone || ''), lineName: String(r.lineName || ''), times: String(r.times || ''), note: String(r.note || ''),
    invoice: String(r.invoice || ''), items: keys.map(function (k) { return APPLY_SHORT[k]; }).join('＋') || String(r.items || ''),
    itemsFull: String(r.items || ''), coachOnly: keys.length === 1 && keys[0] === 'coach', total: total,
    ds: ds, d: d, time: timeStr_(r['上課時間']), place: String(r['上課地點'] || ''),
    line: !!r.LINE, lineAt: String(r['LINE綁定時間'] || '').slice(0, 16), r5: String(r['前5天提醒'] || ''), r1: String(r['前1天提醒'] || ''),
    state: st, show: st === '已排課' && d !== null && d < 0 ? '上完待確認' : st,
    pay: PAY_STATES.indexOf(String(r['收款狀態'] || '')) >= 0 ? String(r['收款狀態']) : '未收款',
    paid: Number(r['已收金額']) || 0, payWay: String(r['收款方式'] || ''), payDate: courseDate_(r['收款日']),
    doneDate: courseDate_(r['完課日期']), cert: courseFlag_(r['證書已寄']), survey: courseFlag_(r['課後問卷']),
    coachInt: courseFlag_(r['陪跑班興趣']), memo: String(r['備註'] || ''), log: String(r['紀錄'] || '')
  };
}

function adCourses(k) {
  adm_(k);
  ensureCourseCols_();
  return { today: todayStr_(), rows: applyRows_().rows.map(courseView_) };
}

function adSaveCourse(k, id, f) {
  adm_(k);
  f = f || {};
  return withLock_(function () {
    ensureCourseCols_();
    var t = applyRows_();
    var r = t.rows.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!r) throw new Error('找不到這筆報名');
    var b = courseView_(r), log = [];
    var put = function (key, val, text) {                     // text：用文字存，避免試算表自動轉成日期／時間
      val = val === null || val === undefined ? '' : val;
      if (String(r[key] === null || r[key] === undefined ? '' : r[key]) === String(val)) return;
      var cell = t.sh.getRange(r._row, t.idx[key] + 1);
      if (text) cell.setNumberFormat('@');
      cell.setValue(typeof val === 'string' ? safeCell_(val) : val);
      r[key] = val;
    };
    var state = COURSE_STATES.indexOf(f.state) >= 0 ? f.state : b.state;
    var ds = '';
    if (f.date) { ds = dayStr_(f.date); if (!ds) throw new Error('上課日期格式不對'); }
    if (state === '改期' && b.state !== '改期') {
      if (b.ds) log.push('改期（原 ' + b.ds + (b.time ? ' ' + b.time : '') + '）');
      if (ds === b.ds) ds = '';                               // 沒填新日期 → 先清掉，回到待排課清單
    }
    if ((state === '待排課' || state === '改期') && ds) state = '已排課';   // 填了日期就自動變已排課
    if (state === '已排課' && !ds) throw new Error('「已排課」要填上課日期');
    var time = String(f.time === undefined ? b.time : f.time).trim().slice(0, 40);
    var place = String(f.place === undefined ? b.place : f.place).trim().slice(0, 200);
    if (ds !== b.ds) {
      put('上課日期', ds, true); put('提醒對應日期', ds, true); put('前5天提醒', ''); put('前1天提醒', '');
      if (ds) log.push('排課 ' + ds + (time ? ' ' + time : ''));
    } else if (time !== b.time && ds) log.push('改時間 ' + time);
    put('上課時間', time, true);
    if (place !== b.place) { put('上課地點', place); if (place) log.push('地點：' + place); }

    if (state !== b.state) log.push('狀態：' + b.state + ' → ' + state);
    put('課程狀態', state);
    if (state === '取消') put('status', '取消'); else if (r.status === '取消') put('status', '已處理');

    var pay = PAY_STATES.indexOf(f.pay) >= 0 ? f.pay : b.pay;
    if (state === '退款') pay = '已退款';
    var paid = f.paid === undefined || f.paid === '' ? b.paid : Math.max(0, Math.round(Number(f.paid) || 0));
    if (pay === '已收全額' && !paid) paid = b.total;
    var payWay = String(f.payWay === undefined ? b.payWay : f.payWay).trim().slice(0, 60);
    var payDate = f.payDate === undefined ? b.payDate : (f.payDate ? dayStr_(f.payDate) : '');
    if ((pay === '已收訂金' || pay === '已收全額') && !payDate) payDate = todayStr_();
    if (pay !== b.pay || paid !== b.paid) log.push('收款：' + pay + (paid ? ' ' + paid.toLocaleString() : '') + (payWay ? '（' + payWay + '）' : ''));
    put('收款狀態', pay); put('已收金額', paid || ''); put('收款方式', payWay); put('收款日', payDate, true);

    var doneDate = f.doneDate === undefined ? b.doneDate : (f.doneDate ? dayStr_(f.doneDate) : '');
    if (state === '已完課' && !doneDate) doneDate = ds || b.ds || todayStr_();
    put('完課日期', doneDate, true);
    [['cert', '證書已寄', '證書已寄'], ['survey', '課後問卷', '課後問卷已傳'], ['coachInt', '陪跑班興趣', '有興趣陪跑班']].forEach(function (x) {
      if (f[x[0]] === undefined) return;
      var on = !!f[x[0]];
      if (on !== b[x[0]]) log.push((on ? '' : '取消：') + x[2]);
      put(x[1], on ? '1' : '');
    });
    if (f.memo !== undefined) put('備註', String(f.memo).slice(0, 2000));

    if (log.length) {
      var stamp = Utilities.formatDate(new Date(), TZ, 'MM/dd HH:mm');
      put('紀錄', (log.map(function (x) { return stamp + '　' + x; }).join('\n') + (b.log ? '\n' + b.log : '')).slice(0, 5000));
    }
    return courseView_(r);
  });
}

/** 一次性：補欄位＋重建「待排課」分頁（加上課程狀態條件） */
function setupCourseAdmin() {
  ensureCourseCols_();
  setupCourseRemind();
  Logger.log('OK：課程報名／排課欄位已補上');
}
