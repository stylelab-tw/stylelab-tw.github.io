/* ===== 薇薇｜小幫手：每天約 12:10 推「今日課務」給薇薇 =====
 * 讀官網報名試算表的「Applies」分頁（同一個 Google 帳號，用 openById）。
 * 需要指令碼屬性：APPLIES_SHEET_ID（報名試算表 ID）；沿用既有 LINE_TOKEN、OWNER_USER_ID。
 * 一次性：在編輯器執行 setupCourseDigest（建觸發）。測試：執行 courseDigestNow。
 */
function courseDigest() {
  var P = PropertiesService.getScriptProperties();
  var sh = SpreadsheetApp.openById(P.getProperty('APPLIES_SHEET_ID')).getSheetByName('Applies');
  if (!sh) return;
  var v = sh.getDataRange().getValues(), h = v[0], ix = {};
  h.forEach(function (k, i) { ix[k] = i; });
  var tz = 'Asia/Taipei', today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var ds = function (d) {
    if (!d) return '';
    if (Object.prototype.toString.call(d) === '[object Date]') return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    var m = String(d).trim().match(/^(?:(\d{4})[\/\-.])?(\d{1,2})[\/\-.](\d{1,2})$/);
    return m ? (m[1] || today.slice(0, 4)) + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : '';
  };
  var tm = function (t) { return Object.prototype.toString.call(t) === '[object Date]' ? Utilities.formatDate(t, tz, 'HH:mm') : String(t || ''); };
  var days = function (a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); };
  var short = function (items) { return String(items || '').split('\n').map(function (s) { return s.split('｜')[0].split('（')[0].replace(/ NT\$.*/, ''); }).join('＋'); };
  var pend = [], up = [], sent = [];
  for (var r = 1; r < v.length; r++) {
    var row = v[r]; if (!row[ix.id] || row[ix.status] === '取消') continue;
    var items = String(row[ix.items]);
    if (/^14 天短影音陪跑班/.test(items) && items.indexOf('\n') < 0) continue;
    var d = ds(row[ix['上課日期']]), name = row[ix.name], nick = row[ix['綽號']];
    if (!d) pend.push({ t: name + (nick ? '（' + nick + '）' : '') + '｜' + short(items), w: days(String(row[ix.ts]).slice(0, 10), today) || 0 });
    else if (days(today, d) >= 0 && days(today, d) <= 7) up.push({ d: d, t: Number(d.slice(5, 7)) + '/' + Number(d.slice(8)) + ' ' + tm(row[ix['上課時間']]) + '｜' + name + '｜' + short(items) });
    [['前5天提醒', '前5天'], ['前1天提醒', '前1天']].forEach(function (c) {
      if (String(row[ix[c[0]]] || '').slice(0, 10) === new Date().toISOString().slice(0, 10)) sent.push(name + '｜' + c[1]);
    });
  }
  if (!pend.length && !up.length && !sent.length) return;
  pend.sort(function (a, b) { return b.w - a.w; }); up.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  var s = '【今日課務】' + Utilities.formatDate(new Date(), tz, 'M/d');
  s += '\n\n還沒約時間：' + pend.length + ' 位' + pend.map(function (x) { return '\n・' + (x.w > 3 ? '⚠ ' : '') + x.t + '｜等 ' + x.w + ' 天'; }).join('');
  s += '\n\n7 天內的課：' + (up.length ? up.map(function (x) { return '\n・' + x.t; }).join('') : '無');
  if (sent.length) s += '\n\n今天已提醒：' + sent.map(function (x) { return '\n・' + x; }).join('');
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + P.getProperty('LINE_TOKEN') },
    payload: JSON.stringify({ to: P.getProperty('OWNER_USER_ID'), messages: [{ type: 'text', text: s.slice(0, 4900) }] })
  });
}
function courseDigestNow() { courseDigest(); }
function setupCourseDigest() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'courseDigest') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('courseDigest').timeBased().everyDays(1).atHour(12).nearMinute(10).inTimezone('Asia/Taipei').create();
}
