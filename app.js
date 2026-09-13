// ========== داده‌ها از localStorage ==========
let bots = JSON.parse(localStorage.getItem('bots') || '[]');
let sites = JSON.parse(localStorage.getItem('sites') || '[]');
let editingId = null;
let editingType = null; // 'bot' | 'site'

// ========== تب‌ها ==========
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-section').classList.add('active');
  });
});

// ========== رندر لیست ربات‌ها ==========
function renderBots() {
  const container = document.getElementById('active-bots');
  if (bots.length === 0) {
    container.innerHTML = '<p class="empty">هنوز هیچ رباتی ساخته نشده است.</p>';
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
        <button class="btn edit" onclick="editBot('${bot.id}')">ویرایش</button>
        <button class="btn danger" onclick="deleteBot('${bot.id}')">حذف</button>
      </div>
    </div>
  `).join('');
}

// ========== رندر لیست سایت‌ها ==========
function renderSites() {
  const container = document.getElementById('active-sites');
  if (sites.length === 0) {
    container.innerHTML = '<p class="empty">هنوز هیچ سایتی ساخته نشده است.</p>';
    return;
  }
  container.innerHTML = sites.map((site, i) => `
    <div class="item">
      <div class="item-info">
        <h4>سایت ${i + 1}</h4>
        <p>مالک: ${site.owner || '—'}</p>
      </div>
      <div class="item-actions">
        <button class="btn edit" onclick="editSite('${site.id}')">ویرایش</button>
        <button class="btn danger" onclick="deleteSite('${site.id}')">حذف</button>
      </div>
    </div>
  `).join('');
}

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

// ========== ذخیره ربات ==========
document.getElementById('btn-save-bot').addEventListener('click', () => {
  const platform = document.getElementById('bot-platform').value;
  const token = document.getElementById('bot-token').value.trim();
  const allowedIds = document.getElementById('bot-allowed-ids').value.trim();
  const code = document.getElementById('bot-code').value.trim();

  if (!token) {
    alert('لطفاً توکن ربات را وارد کنید.');
    return;
  }

  const bot = {
    id: generateId(),
    platform,
    token,
    allowedIds,
    code,
    createdAt: new Date().toISOString()
  };

  bots.push(bot);
  localStorage.setItem('bots', JSON.stringify(bots));
  renderBots();
  clearBotForm();
  alert('ربات با موفقیت ذخیره و استارت شد! (شبیه‌سازی)');
});

document.getElementById('btn-clear-bot').addEventListener('click', clearBotForm);

function clearBotForm() {
  document.getElementById('bot-platform').value = 'telegram';
  document.getElementById('bot-token').value = '';
  document.getElementById('bot-allowed-ids').value = '';
  document.getElementById('bot-code').value = '';
}

// ========== ذخیره سایت ==========
document.getElementById('btn-save-site').addEventListener('click', () => {
  const owner = document.getElementById('site-owner').value.trim();
  const code = document.getElementById('site-code').value.trim();

  if (!code) {
    alert('لطفاً کد سایت را وارد کنید.');
    return;
  }

  const site = {
    id: generateId(),
    owner,
    code,
    createdAt: new Date().toISOString()
  };

  sites.push(site);
  localStorage.setItem('sites', JSON.stringify(sites));
  renderSites();
  clearSiteForm();
  alert('سایت با موفقیت ساخته شد!');
});

document.getElementById('btn-clear-site').addEventListener('click', clearSiteForm);

function clearSiteForm() {
  document.getElementById('site-owner').value = '';
  document.getElementById('site-code').value = '';
}

// ========== حذف ==========
function deleteBot(id) {
  if (!confirm('آیا از حذف این ربات مطمئن هستید؟')) return;
  bots = bots.filter(b => b.id !== id);
  localStorage.setItem('bots', JSON.stringify(bots));
  renderBots();
}

function deleteSite(id) {
  if (!confirm('آیا از حذف این سایت مطمئن هستید؟')) return;
  sites = sites.filter(s => s.id !== id);
  localStorage.setItem('sites', JSON.stringify(sites));
  renderSites();
}

// ========== ویرایش ربات ==========
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
        <option value="telegram" ${bot.platform === 'telegram' ? 'selected' : ''}>تلگرام</option>
        <option value="rubika" ${bot.platform === 'rubika' ? 'selected' : ''}>روبیکا</option>
        <option value="bale" ${bot.platform === 'bale' ? 'selected' : ''}>بله</option>
      </select>
    </div>
    <div class="form-group">
      <label>توکن ربات</label>
      <input type="text" id="edit-token" value="${escapeHtml(bot.token)}" />
    </div>
    <div class="form-group">
      <label>آیدی‌های مجاز</label>
      <input type="text" id="edit-allowed" value="${escapeHtml(bot.allowedIds)}" />
    </div>
    <div class="form-group">
      <label>کد ربات</label>
      <textarea id="edit-code" rows="10">${escapeHtml(bot.code)}</textarea>
    </div>
  `;
  document.getElementById('edit-modal').classList.remove('hidden');
}

// ========== ویرایش سایت ==========
function editSite(id) {
  const site = sites.find(s => s.id === id);
  if (!site) return;
  editingId = id;
  editingType = 'site';

  document.getElementById('modal-title').textContent = 'ویرایش سایت';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>مالک / دسترسی مدیریت</label>
      <input type="text" id="edit-owner" value="${escapeHtml(site.owner)}" />
    </div>
    <div class="form-group">
      <label>کد سایت</label>
      <textarea id="edit-code" rows="12">${escapeHtml(site.code)}</textarea>
    </div>
  `;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ========== ذخیره تغییرات مودال ==========
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
      localStorage.setItem('sites', JSON.stringify(sites));
      renderSites();
    }
  }
  closeModal();
  alert('تغییرات ذخیره شد.');
});

document.getElementById('modal-cancel').addEventListener('click', closeModal);

function closeModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingId = null;
  editingType = null;
}

// ========== شروع ==========
renderBots();
renderSites();
