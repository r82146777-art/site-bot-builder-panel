// ========== داده‌ها ==========
let bots = JSON.parse(localStorage.getItem('bots') || '[]');
let sites = JSON.parse(localStorage.getItem('sites') || '[]');
let editingId = null;
let editingType = null;

// ========== ورود / خروج ==========
const landing = document.getElementById('landing');
const panel = document.getElementById('panel');

document.getElementById('btn-enter').addEventListener('click', () => {
  landing.classList.add('hidden');
  panel.classList.remove('hidden');
});
document.getElementById('btn-logout').addEventListener('click', () => {
  panel.classList.add('hidden');
  landing.classList.remove('hidden');
});

// ========== تب‌ها ==========
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-section').classList.add('active');
    if (btn.dataset.tab === 'test') refreshTestSelects();
  });
});

// ========== توابع کمکی ==========
function platformName(p) {
  return { telegram: 'تلگرام', rubika: 'روبیکا', bale: 'بله' }[p] || p;
}
function maskToken(t) {
  if (!t || t.length < 10) return t || '—';
  return t.slice(0, 6) + '...' + t.slice(-4);
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function ensureBlobUrl(site) {
  if (site.blobUrl) return site.blobUrl;
  const blob = new Blob([site.code], { type: 'text/html' });
  site.blobUrl = URL.createObjectURL(blob);
  return site.blobUrl;
}

// ========== رندر ربات‌ها ==========
function renderBots() {
  const container = document.getElementById('active-bots');
  if (bots.length === 0) {
    container.innerHTML = '<p class="empty">هنوز رباتی ساخته نشده.</p>';
    return;
  }
  container.innerHTML = bots.map((bot, i) => `
    <div class="item">
      <div class="item-info">
        <h4>ربات ${i + 1}</h4>
        <p>پلتفرم: ${platformName(bot.platform)} | توکن: ${maskToken(bot.token)}</p>
        <span class="badge ${bot.platform}">${platformName(bot.platform)}</span>
      </div>
      <div class="item-actions">
        <button class="btn success" onclick="openBotDetails('${bot.id}')">جزئیات و کد</button>
        <button class="btn edit" onclick="editBot('${bot.id}')">ویرایش</button>
        <button class="btn danger" onclick="deleteBot('${bot.id}')">حذف</button>
      </div>
    </div>
  `).join('');
}

// ========== رندر سایت‌ها ==========
function renderSites() {
  const container = document.getElementById('active-sites');
  if (sites.length === 0) {
    container.innerHTML = '<p class="empty">هنوز سایتی ساخته نشده.</p>';
    return;
  }
  container.innerHTML = sites.map((site, i) => {
    const url = ensureBlobUrl(site);
    return `
    <div class="item">
      <div class="item-info">
        <h4>سایت ${i + 1}</h4>
        <p>مالک: ${escapeHtml(site.owner) || '—'}</p>
        <div class="link-box">
          <a href="${url}" target="_blank" rel="noopener">باز کردن سایت</a>
          &nbsp;|&nbsp;
          <button class="btn success" style="padding:2px 8px;font-size:0.75rem" onclick="copyText('${url}')">کپی لینک</button>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn success" onclick="openSite('${site.id}')">باز کردن</button>
        <button class="btn edit" onclick="editSite('${site.id}')">ویرایش</button>
        <button class="btn danger" onclick="deleteSite('${site.id}')">حذف</button>
      </div>
    </div>`;
  }).join('');
  localStorage.setItem('sites', JSON.stringify(sites));
}

// ========== ساخت ربات ==========
document.getElementById('btn-save-bot').addEventListener('click', () => {
  const platform = document.getElementById('bot-platform').value;
  const token = document.getElementById('bot-token').value.trim();
  const allowedIds = document.getElementById('bot-allowed-ids').value.trim();
  const code = document.getElementById('bot-code').value.trim();

  if (!token) { alert('توکن ربات را وارد کنید.'); return; }

  const bot = {
    id: generateId(),
    platform,
    token,
    allowedIds,
    code: code || `if (text === '/start') return 'سلام! خوش آمدید';\nreturn 'پیام شما: ' + text;`,
    createdAt: new Date().toISOString()
  };

  bots.push(bot);
  localStorage.setItem('bots', JSON.stringify(bots));
  renderBots();
  clearBotForm();
  openBotDetails(bot.id);
});

document.getElementById('btn-clear-bot').addEventListener('click', clearBotForm);
function clearBotForm() {
  document.getElementById('bot-platform').value = 'telegram';
  document.getElementById('bot-token').value = '';
  document.getElementById('bot-allowed-ids').value = '';
  document.getElementById('bot-code').value = '';
}

// ========== ساخت سایت ==========
document.getElementById('btn-save-site').addEventListener('click', () => {
  const owner = document.getElementById('site-owner').value.trim();
  let code = document.getElementById('site-code').value.trim();

  if (!code) { alert('کد سایت را وارد کنید.'); return; }

  if (!code.toLowerCase().includes('<html')) {
    code = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سایت من</title>
  <style>body{font-family:Tahoma,sans-serif;padding:20px;background:#f8fafc;color:#1e293b;}</style>
</head>
<body>
${code}
</body>
</html>`;
  }

  const blob = new Blob([code], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);

  const site = {
    id: generateId(),
    owner,
    code,
    blobUrl,
    createdAt: new Date().toISOString()
  };

  sites.push(site);
  localStorage.setItem('sites', JSON.stringify(sites));
  renderSites();
  clearSiteForm();

  window.open(blobUrl, '_blank');
  alert('سایت ساخته شد!\nلینک در لیست قرار گرفت. می‌توانید کپی کنید.');
});

document.getElementById('btn-clear-site').addEventListener('click', clearSiteForm);
function clearSiteForm() {
  document.getElementById('site-owner').value = '';
  document.getElementById('site-code').value = '';
}

function openSite(id) {
  const site = sites.find(s => s.id === id);
  if (!site) return;
  const url = ensureBlobUrl(site);
  window.open(url, '_blank');
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => alert('لینک کپی شد!')).catch(() => {
    prompt('لینک را کپی کنید:', text);
  });
}

// ========== تب تست ==========
function refreshTestSelects() {
  const botSel = document.getElementById('test-bot-select');
  const siteSel = document.getElementById('test-site-select');

  botSel.innerHTML = bots.length
    ? bots.map((b, i) => `<option value="${b.id}">ربات ${i + 1} (${platformName(b.platform)})</option>`).join('')
    : '<option value="">رباتی وجود ندارد</option>';

  siteSel.innerHTML = sites.length
    ? sites.map((s, i) => `<option value="${s.id}">سایت ${i + 1}</option>`).join('')
    : '<option value="">سایتی وجود ندارد</option>';
}

document.getElementById('btn-test-sim').addEventListener('click', () => {
  const id = document.getElementById('test-bot-select').value;
  const bot = bots.find(b => b.id === id);
  if (!bot) { alert('رباتی انتخاب نشده.'); return; }

  const input = document.getElementById('test-sim-input');
  const text = input.value.trim();
  if (!text) return;

  const messages = document.getElementById('test-sim-messages');
  messages.innerHTML += `<div class="sim-msg user">شما: ${escapeHtml(text)}</div>`;

  let reply = 'پاسخی تولید نشد';
  try {
    const fn = new Function('text', bot.code.includes('return') ? bot.code : `return (${bot.code})`);
    reply = fn(text);
  } catch (e) {
    reply = 'خطا در کد: ' + e.message;
  }

  messages.innerHTML += `<div class="sim-msg bot">ربات: ${escapeHtml(String(reply))}</div>`;
  messages.scrollTop = messages.scrollHeight;
  input.value = '';
});

document.getElementById('btn-preview-site').addEventListener('click', () => {
  const id = document.getElementById('test-site-select').value;
  const site = sites.find(s => s.id === id);
  if (!site) { alert('سایتی انتخاب نشده.'); return; }
  const url = ensureBlobUrl(site);
  const frame = document.getElementById('site-preview-frame');
  frame.src = url;
  frame.style.display = 'block';
});

document.getElementById('btn-copy-site-link').addEventListener('click', () => {
  const id = document.getElementById('test-site-select').value;
  const site = sites.find(s => s.id === id);
  if (!site) { alert('سایتی انتخاب نشده.'); return; }
  copyText(ensureBlobUrl(site));
});

// ========== جزئیات ربات ==========
function openBotDetails(id) {
  const bot = bots.find(b => b.id === id);
  if (!bot) return;

  const pythonCode = generatePythonBot(bot);

  document.getElementById('bot-modal-title').textContent = `ربات ${platformName(bot.platform)} آماده است`;
  document.getElementById('bot-modal-body').innerHTML = `
    <p style="margin-bottom:12px;color:#94a3b8;font-size:0.9rem;">
      کد آماده پایتون ساخته شد. آن را دانلود و روی کامپیوتر یا سرور رایگان اجرا کنید تا ربات در تلگرام/روبیکا/بله پاسخ دهد.
    </p>
    <h4 style="margin:14px 0 6px;">دانلود کد</h4>
    <button class="btn primary" onclick="downloadBotCode('${bot.id}')">دانلود فایل bot.py</button>
    <h4 style="margin:18px 0 6px;">نحوه اجرا</h4>
    <ol style="padding-right:20px;color:#cbd5e1;font-size:0.9rem;line-height:1.8;">
      <li>پایتون را نصب کنید</li>
      <li><code style="background:#0f172a;padding:2px 6px;border-radius:4px;">pip install python-telegram-bot</code></li>
      <li><code style="background:#0f172a;padding:2px 6px;border-radius:4px;">python bot.py</code></li>
    </ol>
    <h4 style="margin:18px 0 6px;">کد تولیدشده</h4>
    <div class="code-block" id="code-preview">${escapeHtml(pythonCode)}</div>
    <button class="btn secondary" onclick="copyCode()">کپی کل کد</button>
  `;

  document.getElementById('bot-modal').classList.remove('hidden');
  window.currentBotCode = pythonCode;
}

function generatePythonBot(bot) {
  const allowed = bot.allowedIds
    ? bot.allowedIds.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const allowedStr = allowed.length ? JSON.stringify(allowed) : 'None';
  let userLogic = bot.code || '';

  return `from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

TOKEN = "${bot.token}"
ALLOWED_IDS = ${allowedStr}

def process_message(text: str) -> str:
    text = text or ""
    try:
${userLogic.split('\n').map(l => '        ' + l).join('\n')}
    except Exception as e:
        return f"خطا: {e}"
    return "پیام دریافت شد"

async def handle(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id if update.effective_user else 0
    if ALLOWED_IDS is not None:
        allowed = [str(x) for x in ALLOWED_IDS]
        if str(user_id) not in allowed:
            return
    text = update.message.text if update.message else ""
    reply = process_message(text)
    if reply:
        await update.message.reply_text(str(reply))

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT | filters.COMMAND, handle))
    print("ربات روشن شد...")
    app.run_polling()

if __name__ == "__main__":
    main()
`;
}

function downloadBotCode(id) {
  const bot = bots.find(b => b.id === id);
  if (!bot) return;
  const code = generatePythonBot(bot);
  const blob = new Blob([code], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bot_${bot.platform}_${bot.id}.py`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyCode() {
  if (window.currentBotCode) {
    navigator.clipboard.writeText(window.currentBotCode).then(() => alert('کد کپی شد!'));
  }
}

document.getElementById('bot-modal-close').addEventListener('click', () => {
  document.getElementById('bot-modal').classList.add('hidden');
});

// ========== حذف و ویرایش ==========
function deleteBot(id) {
  if (!confirm('حذف این ربات؟')) return;
  bots = bots.filter(b => b.id !== id);
  localStorage.setItem('bots', JSON.stringify(bots));
  renderBots();
}
function deleteSite(id) {
  if (!confirm('حذف این سایت؟')) return;
  sites = sites.filter(s => s.id !== id);
  localStorage.setItem('sites', JSON.stringify(sites));
  renderSites();
}

function editBot(id) {
  const bot = bots.find(b => b.id === id);
  if (!bot) return;
  editingId = id;
  editingType = 'bot';
  document.getElementById('modal-title').textContent = 'ویرایش ربات';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>پلتفرم</label>
      <select id="edit-platform">
        <option value="telegram" ${bot.platform==='telegram'?'selected':''}>تلگرام</option>
        <option value="rubika" ${bot.platform==='rubika'?'selected':''}>روبیکا</option>
        <option value="bale" ${bot.platform==='bale'?'selected':''}>بله</option>
      </select>
    </div>
    <div class="form-group">
      <label>توکن</label>
      <input type="text" id="edit-token" value="${escapeHtml(bot.token)}" />
    </div>
    <div class="form-group">
      <label>آیدی‌های مجاز</label>
      <input type="text" id="edit-allowed" value="${escapeHtml(bot.allowedIds)}" />
    </div>
    <div class="form-group">
      <label>کد</label>
      <textarea id="edit-code" rows="8">${escapeHtml(bot.code)}</textarea>
    </div>`;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function editSite(id) {
  const site = sites.find(s => s.id === id);
  if (!site) return;
  editingId = id;
  editingType = 'site';
  document.getElementById('modal-title').textContent = 'ویرایش سایت';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>مالک</label>
      <input type="text" id="edit-owner" value="${escapeHtml(site.owner)}" />
    </div>
    <div class="form-group">
      <label>کد سایت</label>
      <textarea id="edit-code" rows="10">${escapeHtml(site.code)}</textarea>
    </div>`;
  document.getElementById('edit-modal').classList.remove('hidden');
}

document.getElementById('modal-save').addEventListener('click', () => {
  if (editingType === 'bot') {
    const bot = bots.find(b => b.id === editingId);
    if (bot) {
      bot.platform = document.getElementById('edit-platform').value;
      bot.token = document.getElementById('edit-token').value.trim();
      bot.allowedIds = document.getElementById('edit-allowed').value.trim();
      bot.code = document.getElementById('edit-code').value;
      localStorage.setItem('bots', JSON.stringify(bots));
      renderBots();
    }
  } else if (editingType === 'site') {
    const site = sites.find(s => s.id === editingId);
    if (site) {
      site.owner = document.getElementById('edit-owner').value.trim();
      site.code = document.getElementById('edit-code').value;
      const blob = new Blob([site.code], { type: 'text/html' });
      site.blobUrl = URL.createObjectURL(blob);
      localStorage.setItem('sites', JSON.stringify(sites));
      renderSites();
    }
  }
  closeEditModal();
});

document.getElementById('modal-cancel').addEventListener('click', closeEditModal);
function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingId = null;
  editingType = null;
}

// شروع
renderBots();
renderSites();
