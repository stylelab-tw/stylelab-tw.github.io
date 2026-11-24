/* ===== 官網報名：LINE 綁定＋課前提醒＋待排課＋今日課務 =====
 * 需要的指令碼屬性（Script Properties）：
 *   LINE414_TOKEN  風格研究所官方 LINE（@414wudac）Messaging API 的 Channel access token（薇薇自己貼）
 *   LINE414_HOOK   Webhook 網址上的暗號（setupCourseRemind 自動產生）
 * Bot.gs 的 doPost 最前面加：if (e && e.parameter && e.parameter.t && e.parameter.t === PROPS.getProperty('LINE414_HOOK')) return lineHook414_(e);
 * 一次性：在編輯器執行 setupCourseRemind（補欄位、建待排課分頁、建每天約 12 點的觸發、印出 Webhook 網址）。
 * 測試：在編輯器執行 remindNow（立刻跑一次提醒＋今日課務，不用等 12 點）。
 */
var TZ = 'Asia/Taipei';
var BIND_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
var REMIND_PREP = {
  ws: '手機（先裝好剪映）、充電線，和一段你想剪的素材',
  claude: '筆電和充電器，先用 Email 註冊好 Claude 帳號'
};

function newBindCode_() {
  var s = '';
  for (var i = 0; i < 6; i++) s += BIND_ABC.charAt(Math.floor(Math.random() * BIND_ABC.length));
  return s;
}
function bindUrl_(code) { return 'https://line.me/R/oaMessage/@414wudac/?' + encodeURIComponent('綁定 ' + code); }
function maskEmail_(e) {
  var p = String(e).split('@');
  return p[0].slice(0, Math.min(3, p[0].length)) + '***@' + (p[1] || '');
}

/* ---------- 讀寫 Applies ---------- */
function applyRows_() {
  var sh = applySheet_();
  var v = sh.getDataRange().getValues();
  var head = v[0], idx = {};
  head.forEach(function (h, i) { idx[h] = i; });
  var rows = [];
  for (var r = 1; r < v.length; r++) {
    if (!v[r][idx.id]) continue;
    var o = { _row: r + 1 };
    head.forEach(function (h, i) { o[h] = v[r][i]; });
    rows.push(o);
  }
  return { sh: sh, idx: idx, rows: rows };
}
function setCell_(t, row, key, val) { t.sh.getRange(row._row, t.idx[key] + 1).setValue(val); row[key] = val; }

function rowKeys_(row) {           // items 欄是完整課名（換行分隔），轉回代號
  var names = String(row.items || '').split('\n');
  return Object.keys(APPLY_ITEMS).filter(function (k) { return names.indexOf(APPLY_ITEMS[k]) >= 0; });
}
function dayStr_(d) {              // 上課日期 → 'yyyy-MM-dd'，可吃日期格或 12/6、2026/12/6 文字
  if (!d) return '';
  if (Object.prototype.toString.call(d) === '[object Date]') return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  var m = String(d).trim().match(/^(?:(\d{4})[\/\-.])?(\d{1,2})[\/\-.](\d{1,2})$/);
  if (!m) return '';
  var y = m[1] || Utilities.formatDate(new Date(), TZ, 'yyyy');
  return y + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
}
function timeStr_(t) {
  if (!t) return '';
  if (Object.prototype.toString.call(t) === '[object Date]') return Utilities.formatDate(t, TZ, 'HH:mm');
  return String(t).trim();
}
function daysUntil_(ds) {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  return Math.round((Date.parse(ds) - Date.parse(today)) / 864e5);
}
function niceDate_(ds) {
  var d = new Date(ds + 'T12:00:00+08:00');
  return Number(ds.slice(5, 7)) + '/' + Number(ds.slice(8)) + '（週' + '日一二三四五六'.charAt(Number(Utilities.formatDate(d, TZ, 'u')) % 7) + '）';
}

/* ---------- LINE ---------- */
function line414_(path, body) {
  var tok = PROPS.getProperty('LINE414_TOKEN');
  if (!tok) throw new Error('還沒設定 LINE414_TOKEN');
  var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/' + path, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + tok }, payload: JSON.stringify(body)
  });
  if (res.getResponseCode() >= 300) throw new Error('LINE ' + path + ' ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 200));
}
function lineReply414_(token, text) { line414_('reply', { replyToken: token, messages: [{ type: 'text', text: text }] }); }
function linePush414_(to, text) { line414_('push', { to: to, messages: [{ type: 'text', text: text }] }); }

function lineHook414_(e) {
  try {
    var body = JSON.parse((e.postData && e.postData.contents) || '{}');
    (body.events || []).forEach(function (ev) {
      if (ev.type !== 'message' || !ev.message || ev.message.type !== 'text' || !ev.source || !ev.source.userId) return;
      var text = String(ev.message.text).trim();
      if (/^綁定/.test(text)) withLock_(function () { lineReply414_(ev.replyToken, bindLine_(ev.source.userId, text)); });
      else if (text === '不是我') withLock_(function () { lineReply414_(ev.replyToken, unbindLine_(ev.source.userId)); });
      // 其他訊息不處理，交給官方帳號原本的關鍵字自動回應
    });
  } catch (err) { Logger.log('LINE webhook 失敗：' + err.message); }
  return ContentService.createTextOutput('OK');
}

function bindLine_(uid, text) {
  var rest = text.replace(/^綁定\s*/, '').trim();
  var t = applyRows_(), hit = [];
  var code = rest.toUpperCase().match(/^[A-Z0-9]{6}$/);
  if (code) {
    hit = t.rows.filter(function (r) { return String(r['綁定碼']).toUpperCase() === code[0]; });
  } else {
    var m = rest.match(/^(.+?)\s+([^\s@]+@[^\s@]+\.[^\s@]+)$/);
    if (!m) return '請傳「綁定 本名 Email」，例如：\n綁定 王小美 abc@gmail.com\n\n或直接按報名確認信裡的「綁定 LINE 課前提醒」按鈕，最快。';
    hit = t.rows.filter(function (r) {
      return String(r.name).trim() === m[1].trim() && String(r.email).trim().toLowerCase() === m[2].toLowerCase();
    });
  }
  if (!hit.length) return '找不到符合的報名資料。\n請確認本名和 Email 跟報名時填的一樣，或按確認信裡的「綁定 LINE 課前提醒」按鈕。\n還是不行的話直接留言，請等候回覆。';
  var now = nowIso_();
  hit.forEach(function (r) { setCell_(t, r, 'LINE', uid); setCell_(t, r, 'LINE綁定時間', now); });
  var r0 = hit[0];
  var courses = [];
  hit.forEach(function (r) { rowKeys_(r).forEach(function (k) { if (courses.indexOf(APPLY_TITLE[k]) < 0) courses.push(APPLY_TITLE[k]); }); });
  return '綁定完成\n' + r0.name + '｜' + maskEmail_(r0.email) + '\n' + courses.join('、') +
    '\n\n上課前 5 天和前 1 天會在這裡提醒你。\n如果這不是你，請回「不是我」。';
}
function unbindLine_(uid) {
  var t = applyRows_(), n = 0;
  t.rows.forEach(function (r) { if (r.LINE === uid) { setCell_(t, r, 'LINE', ''); setCell_(t, r, 'LINE綁定時間', ''); n++; } });
  return n ? '已經取消綁定。請按你自己報名確認信裡的「綁定 LINE 課前提醒」按鈕重新綁定。' : '你目前沒有綁定任何報名資料。';
}

/* ---------- 課前提醒 ---------- */
function remindText_(row, ds, kind) {
  var keys = rowKeys_(row), call = row['綽號'] || row.name;
  var course = keys.map(function (k) { return APPLY_TITLE[k]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join('＋');
  var prep = [];
  if (keys.some(function (k) { return k.indexOf('ws_') === 0; })) prep.push(REMIND_PREP.ws);
  if (keys.indexOf('claude') >= 0) prep.push(REMIND_PREP.claude);
  var when = (kind === 1 ? '明天 ' : niceDate_(ds) + ' ') + (timeStr_(row['上課時間']) || '');
  return {
    course: course, when: when.trim(), place: String(row['上課地點'] || '我們會再跟你確認'), prep: prep.join('；'), call: call,
    line: call + ' 你好，' + (kind === 1 ? '明天就要上課囉。' : '提醒你，再 5 天就要上課囉。') +
      '\n\n課程：' + course + '\n時間：' + (niceDate_(ds) + ' ' + (timeStr_(row['上課時間']) || '')).trim() +
      '\n地點：' + String(row['上課地點'] || '我們會再跟你確認') + (prep.length ? '\n記得帶：' + prep.join('；') : '') +
      '\n\n時間不方便的話直接回這裡跟我們說，請等候回覆。'
  };
}

function remindRun_() {
  var t = applyRows_(), sent = [], fails = [];
  t.rows.forEach(function (r) {
    var ds = dayStr_(r['上課日期']);
    if (!ds || r.status === '取消') return;
    var keys = rowKeys_(r);
    if (!keys.length || (keys.length === 1 && keys[0] === 'coach')) return;     // 陪跑班由作業站寄
    if (String(r['提醒對應日期']) !== ds) {                                    // 改了上課日期 → 重新寄
      setCell_(t, r, '提醒對應日期', ds); setCell_(t, r, '前5天提醒', ''); setCell_(t, r, '前1天提醒', '');
    }
    var d = daysUntil_(ds), kind = d === 1 ? 1 : (d === 5 ? 5 : 0);   // 不到 5 天才排好的，只會寄前 1 天
    var col = kind === 1 ? '前1天提醒' : '前5天提醒';
    if (!kind || r[col]) return;
    var m = remindText_(r, ds, kind), how = [];
    try {
      MailApp.sendEmail({ to: r.email, name: prop_('BRAND'),
        subject: kind === 1 ? '【風格研究所】明天上課提醒｜' + m.course : '【風格研究所】上課提醒｜' + niceDate_(ds) + ' ' + m.course,
        body: m.line + '\n\n官方 LINE：https://lin.ee/Q5kmamu\n\n' + prop_('TEACHER') + '\n' + prop_('BRAND'),
        htmlBody: remindMailHtml_(r, ds, kind, m) });
      how.push('Email');
    } catch (err) { fails.push(r.name + ' Email：' + err.message); }
    if (r.LINE) {
      try { linePush414_(r.LINE, m.line); how.push('LINE'); }
      catch (err) { fails.push(r.name + ' LINE：' + err.message); }
    }
    if (how.length) { setCell_(t, r, col, nowIso_() + ' ' + how.join('＋')); sent.push({ name: r.name, course: m.course, kind: kind, how: how.join('＋'), ds: ds }); }
  });
  return { sent: sent, fails: fails, t: t };
}

/* ---------- 待排課／今日課務 ---------- */
function pendingList_(t) {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  return t.rows.filter(function (r) {
    var keys = rowKeys_(r);
    return !dayStr_(r['上課日期']) && r.status !== '取消' && keys.length && !(keys.length === 1 && keys[0] === 'coach');
  }).map(function (r) {
    return { name: r.name, nick: r['綽號'], course: rowKeys_(r).map(function (k) { return APPLY_SHORT[k]; }).join('＋'),
      wait: Math.round((Date.parse(today) - Date.parse(String(r.ts).slice(0, 10))) / 864e5) || 0, line: r.LINE ? '已綁' : '未綁', phone: r.phone };
  }).sort(function (a, b) { return b.wait - a.wait; });
}
function upcoming_(t) {
  return t.rows.map(function (r) { return { r: r, ds: dayStr_(r['上課日期']) }; })
    .filter(function (x) { return x.ds && x.r.status !== '取消' && daysUntil_(x.ds) >= 0 && daysUntil_(x.ds) <= 7; })
    .sort(function (a, b) { return a.ds < b.ds ? -1 : 1; })
    .map(function (x) { return { name: x.r.name, course: rowKeys_(x.r).map(function (k) { return APPLY_SHORT[k]; }).join('＋'), ds: x.ds, time: timeStr_(x.r['上課時間']), line: x.r.LINE ? '已綁' : '未綁' }; });
}
function digestText_(res, pend, up) {
  var s = '【今日課務】' + Utilities.formatDate(new Date(), TZ, 'M/d') + '\n';
  s += '\n今天寄出的提醒：' + (res.sent.length ? '' : '無');
  res.sent.forEach(function (x) { s += '\n・' + x.name + '｜' + x.course + '｜' + (x.kind === 1 ? '前1天' : '前5天') + '（' + x.how + '）'; });
  if (res.fails.length) s += '\n\n寄送失敗：\n・' + res.fails.join('\n・');
  s += '\n\n7 天內的課：' + (up.length ? '' : '無');
  up.forEach(function (x) { s += '\n・' + niceDate_(x.ds) + ' ' + x.time + '｜' + x.name + '｜' + x.course + '｜LINE ' + x.line; });
  s += '\n\n還沒約時間：' + pend.length + ' 位';
  pend.forEach(function (x) { s += '\n・' + (x.wait > 3 ? '⚠ ' : '') + x.name + (x.nick ? '（' + x.nick + '）' : '') + '｜' + x.course + '｜等 ' + x.wait + ' 天'; });
  return s;
}

function dailyCourse() {
  var res = remindRun_();
  var t = applyRows_(), pend = pendingList_(t), up = upcoming_(t);
  if (!res.sent.length && !res.fails.length && !pend.length && !up.length) return;   // 沒事就不寄
  var me = Session.getEffectiveUser().getEmail();
  var html = digestMailHtml_(res, pend, up);
  if (me) MailApp.sendEmail({ to: me, name: prop_('BRAND'), subject: '【今日課務】還沒約時間 ' + pend.length + ' 位' + (res.sent.length ? '｜寄出提醒 ' + res.sent.length + ' 則' : ''),
    body: digestText_(res, pend, up), htmlBody: html });
}
function remindNow() { dailyCourse(); }

/* ---------- 一次性設定 ---------- */
function setupCourseRemind() {
  var sh = applySheet_();
  if (!PROPS.getProperty('LINE414_HOOK')) PROPS.setProperty('LINE414_HOOK', Utilities.getUuid().replace(/-/g, ''));
  var t = applyRows_();
  t.rows.forEach(function (r) { if (!r['綁定碼']) setCell_(t, r, '綁定碼', newBindCode_()); });   // 舊報名補綁定碼
  // 待排課分頁：公式即時更新，填了上課日期就自動消失
  var ss = sh.getParent(), p = ss.getSheetByName('待排課') || ss.insertSheet('待排課');
  var L = function (h) { var n = t.idx[h] + 1, s = ''; while (n) { s = String.fromCharCode(65 + (n - 1) % 26) + s; n = Math.floor((n - 1) / 26); } return 'Applies!' + s + '2:' + s; };
  p.clear();
  p.getRange('A1:H1').setValues([['姓名', '綽號', '報名課程', '報名時間', '已等幾天', 'LINE', '手機', 'Email']]).setFontWeight('bold');
  p.setFrozenRows(1);
  p.getRange('A2').setFormula('=IFERROR(FILTER({' + [L('name'), L('綽號'), L('items'), 'LEFT(' + L('ts') + ',10)', 'TODAY()-IFERROR(DATEVALUE(LEFT(' + L('ts') + ',10)),TODAY())', 'IF(' + L('LINE') + '="","未綁","已綁")', L('phone'), L('email')].join(',') +
    '},' + L('id') + '<>"",' + L('上課日期') + '="",' + L('status') + '<>"取消",' + L('items') + '<>"' + APPLY_ITEMS.coach + '"),"目前沒有待排課的學員")');
  var rule = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2>3').setBackground('#F6D5D0').setRanges([p.getRange('A2:H500')]).build();
  p.setConditionalFormatRules([rule]);
  p.setColumnWidth(3, 280);
  // 每天約 12 點跑一次
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === 'dailyCourse') ScriptApp.deleteTrigger(tr); });
  ScriptApp.newTrigger('dailyCourse').timeBased().everyDays(1).atHour(12).nearMinute(0).inTimezone(TZ).create();
  Logger.log('Webhook 網址：' + ScriptApp.getService().getUrl() + '?t=' + PROPS.getProperty('LINE414_HOOK'));
}
