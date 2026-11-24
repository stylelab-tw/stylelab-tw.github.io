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
