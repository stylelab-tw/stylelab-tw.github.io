/* ========================= 官網課程報名（stylelab-tw.github.io/apply.html） =========================
 * 官網用 fetch(no-cors) 以 form-urlencoded POST 到本網頁網址，帶 form=apply。
 * 寫進試算表「Applies」分頁（第一次自動建立），寄通知給薇薇、寄確認信給報名者。
 * Bot.gs 的 doPost 最前面要加一行：if (e && e.parameter && e.parameter.form === 'apply') return applyPost_(e);
 */
var APPLY_ITEMS = {
  ws_basic: '短影音剪輯實戰工作坊｜基礎方案 NT$5,000',
  ws_adv: '短影音剪輯實戰工作坊｜進階方案 NT$7,300',
  ws_pro: '短影音剪輯實戰工作坊｜Pro 專屬一對一 NT$9,800',
  claude: 'Claude 初學者課（2 小時）NT$3,500',
  coach: '14 天短影音陪跑班 NT$3,500（先登記，日期待定）'
};
var APPLY_SHORT = { ws_basic: '工作坊基礎', ws_adv: '工作坊進階', ws_pro: '工作坊Pro', claude: 'Claude課', coach: '陪跑班登記' };
var APPLY_PRICE = { ws_basic: 5000, ws_adv: 7300, ws_pro: 9800, claude: 3500, coach: 3500 };
var APPLY_HEAD = ['id', 'ts', 'items', 'total', 'name', 'email', 'lineName', 'phone', 'times', 'invoice', 'note', 'source', 'status',
  '綽號', '綁定碼', '上課日期', '上課時間', '上課地點', 'LINE', 'LINE綁定時間', '提醒對應日期', '前5天提醒', '前1天提醒'];

function applySheet_() {
  var ss = SpreadsheetApp.openById(PROPS.getProperty('SHEET_ID'));
  var sh = ss.getSheetByName('Applies');
  if (!sh) {
    sh = ss.insertSheet('Applies');
    sh.appendRow(APPLY_HEAD);
    sh.setFrozenRows(1);
  } else if (sh.getLastColumn() < APPLY_HEAD.length) {
    sh.getRange(1, 1, 1, APPLY_HEAD.length).setValues([APPLY_HEAD]);   // 舊表補新欄位標題
  }
  return sh;
}

function applyPost_(e) {
  var out;
  try { out = applySave_((e && e.parameter) || {}); }
  catch (err) { out = { ok: false, error: String(err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function applySave_(p) {
  if (p.website) return { ok: true };                       // 機器人填了隱藏欄位，假裝成功
  var keys = String(p.items || '').split(',').filter(function (k, i, a) { return APPLY_ITEMS[k] && a.indexOf(k) === i; });
  var ws = keys.filter(function (k) { return k.indexOf('ws_') === 0; });
  if (ws.length > 1) keys = keys.filter(function (k) { return k.indexOf('ws_') !== 0 || k === ws[0]; });
  var name = String(p.name || '').trim().slice(0, 40);
  var email = String(p.email || '').trim().slice(0, 120);
  if (!keys.length) throw new Error('請至少選一堂課');
  if (!name) throw new Error('請填姓名');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email 格式不對');

  var cache = CacheService.getScriptCache();
  if (cache.get('apply_' + email.toLowerCase())) return { ok: true, dup: true };   // 1 分鐘內重送不重複寫
  cache.put('apply_' + email.toLowerCase(), '1', 60);

  var total = keys.reduce(function (s, k) { return s + APPLY_PRICE[k]; }, 0);
  var invoice = p.invoice && ws.length ? '要' : '';
  var row = {
    id: newId_('a'), ts: nowIso_(), items: keys.map(function (k) { return APPLY_ITEMS[k]; }).join('\n'), total: total,
    name: name, email: email, lineName: String(p.lineName || '').trim().slice(0, 60), phone: String(p.phone || '').trim().slice(0, 30),
    times: String(p.times || '').trim().slice(0, 200), invoice: invoice, note: String(p.note || '').trim().slice(0, 800),
    source: String(p.source || '').slice(0, 200), status: '待聯絡',
    '綽號': String(p.nick || '').trim().slice(0, 20), '綁定碼': newBindCode_()
  };
  withLock_(function () { applySheet_().appendRow(APPLY_HEAD.map(function (h) { return safeCell_(row[h]); })); });

  var list = keys.map(function (k) { return '・' + APPLY_ITEMS[k]; }).join('\n');
  try {
    var me = Session.getEffectiveUser().getEmail();
    if (me) sendMail_(me, '【官網報名】' + name + '｜' + keys.map(function (k) { return APPLY_SHORT[k]; }).join('＋') + '｜NT$' + total.toLocaleString(),
      '官網有新的課程報名：\n\n' + list + '\n合計（未稅）：NT$' + total.toLocaleString() + (invoice ? '（要開發票，工作坊另加 5% 營業稅）' : '') +
      '\n\n姓名：' + name + (row['綽號'] ? '（綽號：' + row['綽號'] + '）' : '') + '\nEmail：' + email + '\nLINE：' + (row.lineName || '（未填）') + '\n手機：' + (row.phone || '（未填）') +
      '\n方便時段：' + (row.times || '（未填）') + '\n問題：' + (row.note || '（無）') +
      '\n\n全部報名在試算表「Applies」分頁：https://docs.google.com/spreadsheets/d/' + PROPS.getProperty('SHEET_ID'));
    var coachOnly = keys.length === 1 && keys[0] === 'coach';
    MailApp.sendEmail({ to: email, subject: '【風格研究所】已收到你的課程報名', name: prop_('BRAND'),
      htmlBody: applyMailHtml_({ name: row['綽號'] || name, keys: keys, invoice: !!invoice, bindCode: row['綁定碼'] }),
      body:
      name + ' 你好：\n\n謝謝你報名，我們已經收到了：\n' + list + '\n\n' +
      (coachOnly
        ? '陪跑班的開班日期還在排，日期確定後會第一個通知你，那時再決定要不要參加、再付款就好。'
        : '我們會在 1～2 天內用 LINE 或 Email 跟你確認上課時間、地點和付款方式，時間確定後再付款。' +
          (keys.indexOf('coach') >= 0 ? '\n陪跑班的開班日期確定後，也會第一個通知你。' : '')) +
      (invoice ? '\n\n你有勾選需要發票：工作坊學費另加 5% 營業稅，確認時會一起跟你說金額。' : '') +
      (coachOnly ? '' : '\n\n想在 LINE 收到課前提醒：打開下面網址，按送出就完成綁定\n' + bindUrl_(row['綁定碼'])) +
      '\n\n想更快聯絡，可以直接加官方 LINE：https://lin.ee/Q5kmamu\n\n' + prop_('TEACHER') + '\n' + prop_('BRAND') });
  } catch (err) { Logger.log('官網報名通知信失敗：' + err.message); }
  return { ok: true, id: row.id };
}
