/* ===== 官網報名：給報名者的確認信（HTML 版） =====
 * applyMailHtml_({name, keys, invoice}) 回傳 HTML 字串，Apply.gs 寄信時當 htmlBody 用。
 * 圖片都放官網 repo，信裡用絕對網址。
 */
var MAIL_ASSET = 'https://stylelab-tw.github.io/assets/';
var APPLY_IMG = { ws_basic: 'line/pick/v2/pick_A.jpg', ws_adv: 'line/pick/v2/pick_A.jpg', ws_pro: 'line/pick/v2/pick_A.jpg', claude: 'line/pick/v2/mail_claude.jpg', coach: 'line/pick/v2/pick_C.jpg' };
var APPLY_TITLE = { ws_basic: '短影音剪輯實戰工作坊', ws_adv: '短影音剪輯實戰工作坊', ws_pro: '短影音剪輯實戰工作坊', claude: 'Claude 初學者課', coach: '14 天短影音陪跑班' };
var APPLY_SUB = { ws_basic: '基礎方案・3 小時', ws_adv: '進階方案・企劃 1 小時＋剪輯 3 小時', ws_pro: 'Pro 專屬一對一', claude: '2 小時・零基礎開始用 AI', coach: '先登記・開班日期確定後通知你' };

function mailEsc_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function applyMailHtml_(o) {
  var C = { bg: '#E6E6E5', card: '#FAFAF9', ink: '#48494B', smoke: '#6B6D70', champ: '#A38C79', line: '#DCDCDA', soft: '#F1EFEC' };
  var F = "font-family:'PingFang TC','Noto Sans TC','Microsoft JhengHei',Helvetica,Arial,sans-serif;";
  var keys = o.keys, coachOnly = keys.length === 1 && keys[0] === 'coach';
  var total = 0;
  var items = keys.map(function (k) {
    total += APPLY_PRICE[k];
    return '<tr><td style="padding:0 0 16px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.soft + ';border-radius:16px"><tr>' +
      '<td style="padding:12px 12px 0"><img src="' + MAIL_ASSET + APPLY_IMG[k] + '" width="480" alt="" style="display:block;width:100%;max-width:480px;height:auto;border-radius:12px;border:0"></td></tr><tr>' +
      '<td style="padding:14px 18px 16px;' + F + '">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="vertical-align:bottom;' + F + '"><div style="font-size:17px;font-weight:600;color:' + C.ink + ';line-height:1.4">' + APPLY_TITLE[k] + '</div>' +
      '<div style="font-size:13px;color:' + C.smoke + ';line-height:1.6;margin-top:2px">' + APPLY_SUB[k] + '</div></td>' +
      '<td align="right" style="vertical-align:bottom;white-space:nowrap;padding-left:10px;' + F + 'font-size:17px;color:' + C.champ + ';font-weight:700">NT$' + APPLY_PRICE[k].toLocaleString() + '</td>' +
      '</tr></table></td></tr></table></td></tr>';
  }).join('');

  var steps = coachOnly
    ? [['先幫你登記', '你已經在陪跑班的優先名單裡了。'], ['日期確定第一個通知你', '開班日期排好後，會用 Email 或 LINE 告訴你。'], ['再決定、再付款', '看完日期再決定要不要參加，現在不用付任何費用。']]
    : [['1～2 天內聯絡你', '我們會用 LINE 或 Email 跟你確認上課時間和地點。'], ['時間確定後再付款', '付款方式會在確認時一起告訴你，現在不用先付。'], ['準時來上課', '記得帶手機，和一段你想剪的素材。']];
  if (!coachOnly && !keys.some(function (k) { return k.indexOf('ws_') === 0; })) steps[2] = ['準時來上課', '記得帶筆電，先註冊好 Claude 帳號。'];
  if (!coachOnly && keys.indexOf('coach') >= 0) steps[2] = ['陪跑班另外通知', '陪跑班開班日期確定後，也會第一個通知你。'];
  var stepHtml = steps.map(function (s, i) {
    return '<tr><td width="40" style="vertical-align:top;padding:0 0 16px">' +
      '<div style="width:28px;height:28px;border-radius:14px;background:' + C.smoke + ';color:#fff;text-align:center;line-height:28px;font-size:14px;' + F + '">' + (i + 1) + '</div></td>' +
      '<td style="vertical-align:top;padding:2px 0 16px;' + F + '">' +
      '<div style="font-size:15px;font-weight:600;color:' + C.ink + ';line-height:1.5">' + s[0] + '</div>' +
      '<div style="font-size:14px;color:' + C.smoke + ';line-height:1.7">' + s[1] + '</div></td></tr>';
  }).join('');

  var invoice = o.invoice ? '<tr><td style="padding:4px 0 0;' + F + 'font-size:13px;color:' + C.smoke + ';line-height:1.7">※ 你有勾選需要發票：工作坊學費另加 5% 營業稅，確認時會一起跟你說金額。</td></tr>' : '';

  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:' + C.bg + '">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + '"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">' +
    // 頁首
    '<tr><td align="center" style="padding:0 0 22px"><img src="' + MAIL_ASSET + 'logo.png" width="96" alt="風格研究所" style="display:block;width:96px;height:auto;border:0">' +
    '<div style="' + F + 'font-size:12px;letter-spacing:5px;color:' + C.smoke + ';margin-top:10px">風格研究所 STYLE LAB</div></td></tr>' +
    // 主卡
    '<tr><td style="background:' + C.card + ';border-radius:22px;padding:34px 28px 26px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="' + F + 'font-size:13px;letter-spacing:3px;color:' + C.champ + ';padding-bottom:8px">REGISTRATION RECEIVED</td></tr>' +
    '<tr><td style="' + F + 'font-size:26px;font-weight:700;color:' + C.ink + ';line-height:1.4;padding-bottom:10px">已收到你的報名</td></tr>' +
    '<tr><td style="' + F + 'font-size:15px;color:' + C.ink + ';line-height:1.8;padding-bottom:22px">' + mailEsc_(o.name) + ' 你好，謝謝你報名！<br>以下是你這次登記的內容：</td></tr>' +
    items +
    (keys.length > 1 ? '<tr><td align="right" style="' + F + 'font-size:14px;color:' + C.smoke + ';padding:0 4px 6px">合計 <span style="font-size:18px;color:' + C.ink + ';font-weight:700">NT$' + total.toLocaleString() + '</span></td></tr>' : '') +
    invoice +
    '<tr><td style="padding:18px 0 14px"><div style="height:1px;background:' + C.line + '"></div></td></tr>' +
    '<tr><td style="' + F + 'font-size:16px;font-weight:700;color:' + C.ink + ';padding-bottom:14px">接下來會這樣進行</td></tr>' +
    '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + stepHtml + '</table></td></tr>' +
    // 綁定 LINE 課前提醒
    (o.bindCode && !coachOnly && PROPS.getProperty('LINE_BIND_ON') === '1' ? '<tr><td style="padding:4px 0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.soft + ';border-radius:16px"><tr><td style="padding:18px 20px;' + F + '">' +
      '<div style="font-size:15px;font-weight:700;color:' + C.ink + '">想在 LINE 收到課前提醒？</div>' +
      '<div style="font-size:13px;color:' + C.smoke + ';line-height:1.7;margin:4px 0 12px">按下面按鈕會打開官方 LINE，訊息已經幫你填好，按送出就完成綁定。上課前 5 天和前 1 天會提醒你。</div>' +
      '<a href="' + bindUrl_(o.bindCode) + '" style="display:inline-block;background:' + C.champ + ';color:#ffffff;text-decoration:none;border-radius:999px;padding:11px 26px;font-size:14px;font-weight:600;' + F + '">綁定 LINE 課前提醒</a>' +
      '<div style="font-size:12px;color:' + C.smoke + ';margin-top:10px">你的綁定碼：' + o.bindCode + '</div>' +
      '</td></tr></table></td></tr>' : '') +
    // LINE 按鈕
    '<tr><td align="center" style="padding:10px 0 6px">' +
    '<a href="https://lin.ee/Q5kmamu" style="display:inline-block;background:' + C.smoke + ';color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 34px;font-size:15px;font-weight:600;' + F + '">加官方 LINE，聯絡更快</a></td></tr>' +
    '<tr><td align="center" style="' + F + 'font-size:12px;color:' + C.smoke + ';padding-bottom:4px">回覆時間每天 10:00～22:00</td></tr>' +
    '</table></td></tr>' +
    // 頁尾
    '<tr><td align="center" style="padding:22px 0 0;' + F + 'font-size:13px;color:' + C.smoke + ';line-height:1.8">' +
    mailEsc_(prop_('TEACHER')) + '｜' + mailEsc_(prop_('BRAND')) + '<br>' +
    '<a href="https://stylelab-tw.github.io" style="color:' + C.champ + ';text-decoration:none">stylelab-tw.github.io</a></td></tr>' +
    '</table></td></tr></table></body></html>';
}

/* ===== 課前提醒信、今日課務信（同一套版型） ===== */
function mailShell_(kicker, title, inner) {
  var C = { bg: '#E6E6E5', card: '#FAFAF9', ink: '#48494B', smoke: '#6B6D70', champ: '#A38C79' };
  var F = "font-family:'PingFang TC','Noto Sans TC','Microsoft JhengHei',Helvetica,Arial,sans-serif;";
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:' + C.bg + '">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + '"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">' +
    '<tr><td align="center" style="padding:0 0 22px"><img src="' + MAIL_ASSET + 'logo.png" width="96" alt="風格研究所" style="display:block;width:96px;height:auto;border:0">' +
    '<div style="' + F + 'font-size:12px;letter-spacing:5px;color:' + C.smoke + ';margin-top:10px">風格研究所 STYLE LAB</div></td></tr>' +
    '<tr><td style="background:' + C.card + ';border-radius:22px;padding:34px 28px 26px;' + F + '">' +
    '<div style="font-size:13px;letter-spacing:3px;color:' + C.champ + ';padding-bottom:8px">' + kicker + '</div>' +
    '<div style="font-size:26px;font-weight:700;color:' + C.ink + ';line-height:1.4;padding-bottom:14px">' + title + '</div>' + inner +
    '</td></tr><tr><td align="center" style="padding:22px 0 0;' + F + 'font-size:13px;color:' + C.smoke + ';line-height:1.8">' +
    mailEsc_(prop_('TEACHER')) + '｜' + mailEsc_(prop_('BRAND')) + '<br><a href="https://stylelab-tw.github.io" style="color:' + C.champ + ';text-decoration:none">stylelab-tw.github.io</a></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function remindMailHtml_(row, ds, kind, m) {
  var ink = '#48494B', smoke = '#6B6D70', soft = '#F1EFEC';
  var keys = rowKeys_(row), img = keys.length ? APPLY_IMG[keys[0]] : '';
  var line = function (k, v) { return '<tr><td width="64" style="padding:6px 0;font-size:14px;color:' + smoke + ';vertical-align:top">' + k + '</td><td style="padding:6px 0;font-size:15px;color:' + ink + ';line-height:1.6">' + mailEsc_(v) + '</td></tr>'; };
  var inner = '<div style="font-size:15px;color:' + ink + ';line-height:1.8;padding-bottom:18px">' + mailEsc_(m.call) + ' 你好，' + (kind === 1 ? '明天就要上課囉，期待見到你！' : '提醒你，再 5 天就要上課囉。') + '</div>' +
    (img ? '<img src="' + MAIL_ASSET + img + '" width="504" alt="" style="display:block;width:100%;max-width:504px;height:auto;border-radius:14px;border:0;margin-bottom:16px">' : '') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + soft + ';border-radius:16px"><tr><td style="padding:14px 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    line('課程', m.course) + line('時間', niceDate_(ds) + ' ' + timeStr_(row['上課時間'])) + line('地點', m.place) + (m.prep ? line('要帶', m.prep) : '') +
    '</table></td></tr></table>' +
    '<div style="font-size:14px;color:' + smoke + ';line-height:1.8;padding:18px 0 14px">時間不方便的話，直接在官方 LINE 跟我們說就可以了。</div>' +
    '<div style="text-align:center;padding-bottom:6px"><a href="https://lin.ee/Q5kmamu" style="display:inline-block;background:#6B6D70;color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 34px;font-size:15px;font-weight:600">打開官方 LINE</a></div>';
  return mailShell_(kind === 1 ? 'SEE YOU TOMORROW' : 'CLASS REMINDER', kind === 1 ? '明天上課提醒' : niceDate_(ds) + ' 上課提醒', inner);
}

function digestMailHtml_(res, pend, up) {
  var ink = '#48494B', smoke = '#6B6D70', soft = '#F1EFEC';
  var h2 = function (t) { return '<div style="font-size:16px;font-weight:700;color:' + ink + ';padding:18px 0 8px">' + t + '</div>'; };
  var li = function (t, warn) { return '<div style="font-size:14px;line-height:1.7;padding:8px 12px;margin-bottom:6px;border-radius:10px;background:' + (warn ? '#F6D5D0' : soft) + ';color:' + ink + '">' + t + '</div>'; };
  var none = '<div style="font-size:14px;color:' + smoke + '">無</div>';
  var inner = h2('還沒約時間：' + pend.length + ' 位') + (pend.length ? pend.map(function (x) {
      return li((x.wait > 3 ? '⚠ ' : '') + '<b>' + mailEsc_(x.name) + '</b>' + (x.nick ? '（' + mailEsc_(x.nick) + '）' : '') + '｜' + x.course + '｜等 ' + x.wait + ' 天｜LINE ' + x.line + (x.phone ? '｜' + mailEsc_(x.phone) : ''), x.wait > 3);
    }).join('') : none) +
    h2('7 天內的課') + (up.length ? up.map(function (x) { return li(niceDate_(x.ds) + ' ' + mailEsc_(x.time) + '｜<b>' + mailEsc_(x.name) + '</b>｜' + x.course + '｜LINE ' + x.line); }).join('') : none) +
    h2('今天寄出的提醒') + (res.sent.length ? res.sent.map(function (x) { return li(mailEsc_(x.name) + '｜' + x.course + '｜' + (x.kind === 1 ? '前 1 天' : '前 5 天') + '（' + x.how + '）'); }).join('') : none) +
    (res.fails.length ? h2('寄送失敗') + res.fails.map(function (f) { return li(mailEsc_(f), true); }).join('') : '') +
    '<div style="font-size:13px;color:' + smoke + ';padding-top:16px">約好時間後，到試算表「Applies」填上課日期、時間、地點就好。</div>';
  return mailShell_('TODAY', '今日課務 ' + Utilities.formatDate(new Date(), TZ, 'M/d'), inner);
}
