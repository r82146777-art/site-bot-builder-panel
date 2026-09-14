let bots = JSON.parse(localStorage.getItem('panel_bots') || '[]');
let sites = JSON.parse(localStorage.getItem('panel_sites') || '[]');
let localSites = JSON.parse(localStorage.getItem('panel_local_sites') || '[]');

const landing = document.getElementById('landing');
const panel = document.getElementById('panel');

document.getElementById('btn-enter').onclick = function () {
  landing.classList.add('hidden');
  panel.classList.remove('hidden');
  loadGh();
  updateConnLabel();
  renderBots();
  renderSites();
  renderLocalSites();
};
document.getElementById('btn-logout').onclick = function () {
  panel.classList.add('hidden');
  landing.classList.remove('hidden');
};

document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.onclick = function () {
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-section').classList.add('active');
  };
});

function loadGh() {
  var t = document.getElementById('gh-token');
  var o = document.getElementById('gh-owner');
  var e = document.getElementById('gh-email');
  if (t) t.value = localStorage.getItem('gh_token') || '';
  if (o) o.value = localStorage.getItem('gh_owner') || '';
  if (e) e.value = localStorage.getItem('gh_email') || '';
  if (localStorage.getItem('gh_token')) {
    var st = document.getElementById('gh-status');
    if (st) {
      st.textContent = 'توکن ذخیره شده — روی حساب خودتان کار می‌کند';
      st.style.color = '#34d399';
    }
  }
}
function updateConnLabel() {
  var o = localStorage.getItem('gh_owner');
  var el = document.getElementById('conn-label');
  if (!el) return;
  if (localStorage.getItem('gh_token') && o) el.textContent = 'متصل به گیت‌هاب: @' + o;
  else el.textContent = 'ابتدا از تب تنظیمات گیت‌هاب متصل شوید';
}

document.getElementById('btn-save-gh').onclick = function () {
  var t = document.getElementById('gh-token').value.trim();
  var o = document.getElementById('gh-owner').value.trim();
  var e = document.getElementById('gh-email').value.trim();
  if (!t) return alert('توکن گیت‌هاب لازم است');
  if (!o) return alert('نام کاربری گیت‌هاب لازم است');
  localStorage.setItem('gh_token', t);
  localStorage.setItem('gh_owner', o);
  localStorage.setItem('gh_email', e);
  var st = document.getElementById('gh-status');
  st.style.color = '#34d399';
  st.textContent = 'ذخیره شد. همه کارها روی حساب @' + o + ' انجام می‌شود.';
  updateConnLabel();
};

document.getElementById('btn-test-gh').onclick = async function () {
  var st = document.getElementById('gh-status');
  st.style.color = '#38bdf8';
  st.textContent = 'در حال تست...';
  try {
    var me = await ghApi('/user');
    st.style.color = '#34d399';
    st.textContent = 'اتصال موفق: @' + me.login + (me.email ? ' | ' + me.email : '');
    if (!document.getElementById('gh-owner').value) {
      document.getElementById('gh-owner').value = me.login;
      localStorage.setItem('gh_owner', me.login);
    }
    updateConnLabel();
  } catch (err) {
    st.style.color = '#f87171';
    st.textContent = 'خطا: ' + err.message;
  }
};

function platformName(p) {
  return { rubika: 'روبیکا', telegram: 'تلگرام', bale: 'بله' }[p] || p;
}
function mask(t) {
  return !t || t.length < 10 ? (t || '—') : t.slice(0, 6) + '...' + t.slice(-4);
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function renderBots() {
  var c = document.getElementById('active-bots');
  if (!bots.length) { c.innerHTML = '<p class="empty">هنوز رباتی نیست.</p>'; return; }
  c.innerHTML = bots.map(function (b, i) {
    return '<div class="item"><div class="item-info"><h4>ربات ' + (i + 1) + (b.deployed ? ' 🟢' : '') + '</h4>' +
      '<p>' + platformName(b.platform) + ' | ' + mask(b.token) + ' | هر ' + (b.interval || 5) + ' دقیقه' + (b.heartbeat ? ' ❤️' : '') + '</p>' +
      (b.repoUrl ? '<p><a href="' + b.repoUrl + '" target="_blank" style="color:#38bdf8">' + b.repoUrl + '</a></p>' : '') +
      '<span class="badge ' + b.platform + '">' + platformName(b.platform) + '</span></div>' +
      '<div class="item-actions"><button class="btn danger" onclick="deleteBot(\'' + b.id + '\')">حذف از لیست</button></div></div>';
  }).join('');
}
function renderSites() {
  var c = document.getElementById('active-sites');
  if (!sites.length) { c.innerHTML = '<p class="empty">خالی</p>'; return; }
  c.innerHTML = sites.map(function (s, i) {
    return '<div class="item"><div class="item-info"><h4>سایت ' + (i + 1) + '</h4>' +
      (s.pagesUrl ? '<p><a href="' + s.pagesUrl + '" target="_blank" style="color:#38bdf8">' + s.pagesUrl + '</a></p>' : '') +
      (s.repoUrl ? '<p><a href="' + s.repoUrl + '" target="_blank" style="color:#94a3b8">مخزن</a></p>' : '') +
      '</div><div class="item-actions"><button class="btn danger" onclick="deleteSite(\'' + s.id + '\')">حذف</button></div></div>';
  }).join('');
}
function renderLocalSites() {
  var c = document.getElementById('local-sites');
  if (!localSites.length) { c.innerHTML = '<p class="empty">خالی</p>'; return; }
  c.innerHTML = localSites.map(function (s, i) {
    return '<div class="item"><div class="item-info"><h4>محلی ' + (i + 1) + '</h4></div>' +
      '<div class="item-actions"><button class="btn success" onclick="previewLocal(\'' + s.id + '\')">باز کردن</button>' +
      '<button class="btn danger" onclick="deleteLocal(\'' + s.id + '\')">حذف</button></div></div>';
  }).join('');
}

async function ghApi(path, method, body) {
  var token = localStorage.getItem('gh_token');
  if (!token) throw new Error('توکن گیت‌هاب تنظیم نشده');
  var res = await fetch('https://api.github.com' + path, {
    method: method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  var text = await res.text();
  var data;
  try { data = JSON.parse(text); } catch (e) { data = { message: text }; }
  if (!res.ok) throw new Error(data.message || String(res.status));
  return data;
}
function b64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
async function putFile(owner, repo, path, content, message) {
  var apiPath = '/repos/' + owner + '/' + repo + '/contents/' + path;
  var sha2;
  try { sha2 = (await ghApi(apiPath)).sha; } catch (e) {}
  var body = { message: message || 'update', content: b64(content), branch: 'main' };
  if (sha2) body.sha = sha2;
  return ghApi(apiPath, 'PUT', body);
}
async function ensureRepo(owner, name, isPrivate) {
  try {
    var r = await ghApi('/repos/' + owner + '/' + name);
    if (typeof isPrivate === 'boolean' && r.private !== isPrivate) {
      try { await ghApi('/repos/' + owner + '/' + name, 'PATCH', { private: isPrivate }); } catch (e) {}
    }
    return r;
  } catch (e) {
    return ghApi('/user/repos', 'POST', {
      name: name,
      private: !!isPrivate,
      auto_init: true,
      description: 'ساخته‌شده با پنل ربات/سایت'
    });
  }
}
async function enablePages(owner, repo) {
  try {
    await ghApi('/repos/' + owner + '/' + repo + '/pages', 'POST', { source: { branch: 'main', path: '/' } });
  } catch (e) {}
}

function cronFromInterval(minutes) {
  var m = parseInt(minutes, 10) || 5;
  if (m <= 5) return '*/5 * * * *';
  if (m === 10) return '*/10 * * * *';
  if (m === 15) return '*/15 * * * *';
  if (m === 30) return '*/30 * * * *';
  if (m === 60) return '0 * * * *';
  if (m === 120) return '0 */2 * * *';
  return '*/5 * * * *';
}

function buildBotPy(bot) {
  var token = String(bot.token || '').replace(/\\/g, '\\\\');
  var fromH = parseInt(bot.fromHour, 10);
  var toH = parseInt(bot.toHour, 10);
  if (!Number.isFinite(fromH)) fromH = 0;
  if (!Number.isFinite(toH)) toH = 23;
  var channel = String(bot.channelId || '').replace(/\\/g, '\\\\');
  var ownerId = String(bot.ownerId || '').replace(/\\/g, '\\\\');

  // Python source built without nested JS template literals
  var lines = [];
  lines.push('# -*- coding: utf-8 -*-');
  lines.push('import json, os');
  lines.push('from pathlib import Path');
  lines.push('from datetime import datetime, timezone, timedelta');
  lines.push('import requests');
  lines.push('');
  lines.push('TOKEN = os.environ.get("BOT_TOKEN", "").strip() or """' + token + '"""');
  lines.push('BASE = f"https://botapi.rubika.ir/v3/{TOKEN}"');
  lines.push('STATE_FILE = Path("state.json")');
  lines.push('FROM_HOUR = ' + fromH);
  lines.push('TO_HOUR = ' + toH);
  lines.push('CHANNEL_ID = """' + channel + '""".strip()');
  lines.push('OWNER_ID = """' + ownerId + '""".strip()');
  lines.push('');
  lines.push('def tehran_hour():');
  lines.push('    now = datetime.now(timezone.utc) + timedelta(hours=3, minutes=30)');
  lines.push('    return now.hour');
  lines.push('');
  lines.push('def in_window():');
  lines.push('    h = tehran_hour()');
  lines.push('    if FROM_HOUR <= TO_HOUR:');
  lines.push('        return FROM_HOUR <= h <= TO_HOUR');
  lines.push('    return h >= FROM_HOUR or h <= TO_HOUR');
  lines.push('');
  lines.push('def load_state():');
  lines.push('    if STATE_FILE.exists():');
  lines.push('        try:');
  lines.push('            return json.loads(STATE_FILE.read_text(encoding="utf-8"))');
  lines.push('        except Exception:');
  lines.push('            pass');
  lines.push('    return {"offset_id": None, "processed": []}');
  lines.push('');
  lines.push('def save_state(state):');
  lines.push('    state["processed"] = (state.get("processed") or [])[-120:]');
  lines.push('    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")');
  lines.push('');
  lines.push('def api(method, data=None):');
  lines.push('    r = requests.post(f"{BASE}/{method}", json=data or {}, timeout=30)');
  lines.push('    r.raise_for_status()');
  lines.push('    return r.json()');
  lines.push('');
  lines.push('def send_message(chat_id, text):');
  lines.push('    try:');
  lines.push('        return api("sendMessage", {"chat_id": chat_id, "text": text})');
  lines.push('    except Exception as e:');
  lines.push('        print("send", e)');
  lines.push('        return None');
  lines.push('');
  lines.push('def type_label(t):');
  lines.push('    m = {"User":"کاربر","Channel":"کانال","Bot":"ربات","Group":"گروه","user":"کاربر","channel":"کانال","bot":"ربات","group":"گروه"}');
  lines.push('    return m.get(str(t), str(t) if t else "نامشخص")');
  lines.push('');
  lines.push('def handle_update(update, state):');
  lines.push('    if not isinstance(update, dict):');
  lines.push('        return');
  lines.push('    if "update" in update and isinstance(update["update"], dict):');
  lines.push('        update = update["update"]');
  lines.push('    chat_id = update.get("chat_id")');
  lines.push('    msg = update.get("new_message") or update.get("message") or {}');
  lines.push('    if not chat_id or not msg:');
  lines.push('        return');
  lines.push('    message_id = str(msg.get("message_id") or "")');
  lines.push('    key = f"{chat_id}:{message_id}"');
  lines.push('    if message_id and key in state.get("processed", []):');
  lines.push('        return');
  lines.push('    text = (msg.get("text") or "").strip()');
  lines.push('    sender_id = msg.get("sender_id") or ""');
  lines.push('    forwarded = msg.get("forwarded_from")');
  lines.push('    replied = False');
  lines.push('    if forwarded and isinstance(forwarded, dict):');
  lines.push('        from_chat = forwarded.get("from_chat_id") or ""');
  lines.push('        from_sender = forwarded.get("from_sender_id") or ""');
  lines.push('        orig_msg_id = forwarded.get("message_id") or ""');
  lines.push('        type_from = forwarded.get("type_from") or ""');
  lines.push('        body = "✅ اطلاعات پیام فورواردشده:\\n\\n"');
  lines.push('        body += "📌 نوع منبع: " + type_label(type_from) + "\\n"');
  lines.push('        body += "🆔 آیدی چت مبدأ:\\n`" + from_chat + "`\\n\\n"');
  lines.push('        body += "👤 آیدی فرستنده اصلی:\\n" + (("`" + from_sender + "`") if from_sender else "—") + "\\n\\n"');
  lines.push('        body += "📩 آیدی پیام:\\n" + (("`" + orig_msg_id + "`") if orig_msg_id else "—")');
  lines.push('        send_message(chat_id, body)');
  lines.push('        replied = True');
  lines.push('    else:');
  lines.push('        low = text.lower()');
  lines.push('        if low in ("/start", "start", "استارت", "/id", "id", "آیدی", "ایدی"):');
  lines.push('            body = "👋 ربات آیدی‌دهنده\\n\\n"');
  lines.push('            body += "🔹 آیدی شما:\\n`" + sender_id + "`\\n\\n"');
  lines.push('            body += "🔹 آیدی این چت:\\n`" + chat_id + "`\\n\\n"');
  lines.push('            body += "📌 پیام گروه/کانال را فوروارد کنید."');
  lines.push('            send_message(chat_id, body)');
  lines.push('            replied = True');
  lines.push('        elif text:');
  lines.push('            send_message(chat_id, "آیدی شما: `" + sender_id + "`\\n/start یا فوروارد کنید.")');
  lines.push('            replied = True');
  lines.push('    if replied and message_id:');
  lines.push('        state.setdefault("processed", []).append(key)');
  lines.push('');
  lines.push('def main():');
  lines.push('    if not TOKEN:');
  lines.push('        print("no token"); return');
  lines.push('    if not in_window():');
  lines.push('        print("outside time window"); return');
  lines.push('    print("run")');
  lines.push('    state = load_state()');
  lines.push('    offset_id = state.get("offset_id")');
  lines.push('    try:');
  lines.push('        payload = {"limit": 50}');
  lines.push('        if offset_id: payload["offset_id"] = offset_id');
  lines.push('        res = api("getUpdates", payload)');
  lines.push('        data = res.get("data") if isinstance(res.get("data"), dict) else res');
  lines.push('        updates = data.get("updates") or data.get("update_list") or []');
  lines.push('        next_offset = data.get("next_offset_id") or data.get("offset_id")');
  lines.push('        print("updates", len(updates))');
  lines.push('        for u in updates:');
  lines.push('            try: handle_update(u, state)');
  lines.push('            except Exception as e: print("err", e)');
  lines.push('        if next_offset: state["offset_id"] = next_offset');
  lines.push('        save_state(state)');
  lines.push('    except Exception as e:');
  lines.push('        print("fatal", e)');
  lines.push('        save_state(state)');
  lines.push('        raise');
  lines.push('');
  lines.push('if __name__ == "__main__":');
  lines.push('    main()');
  lines.push('');
  return lines.join('\n');
}

function buildWorkflow(cronExpr) {
  return [
    'name: bot-runner',
    'on:',
    '  schedule:',
    "    - cron: '" + cronExpr + "'",
    '  workflow_dispatch:',
    'permissions:',
    '  contents: write',
    'jobs:',
    '  run:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-python@v5',
    '        with:',
    "          python-version: '3.11'",
    '      - run: pip install requests',
    '      - run: python bot.py',
    '      - name: save state',
    '        run: |',
    '          if [ -f state.json ]; then',
    '            git config user.name "panel-bot"',
    '            git config user.email "bot@users.noreply.github.com"',
    '            git add state.json',
    '            git diff --staged --quiet || git commit -m "chore: state"',
    '            git push',
    '          fi',
    ''
  ].join('\n');
}

document.getElementById('btn-save-bot').onclick = async function () {
  if (!localStorage.getItem('gh_token') || !localStorage.getItem('gh_owner')) {
    alert('اول تب تنظیمات گیت‌هاب: توکن و نام کاربری را ذخیره کنید');
    return;
  }
  var token = document.getElementById('bot-token').value.trim();
  if (!token) return alert('توکن ربات لازم است');

  var platform = document.getElementById('bot-platform').value;
  var interval = document.getElementById('bot-interval').value;
  var heartbeat = document.getElementById('bot-heartbeat').checked;
  if (heartbeat) interval = '5';

  var bot = {
    id: uid(),
    platform: platform,
    token: token,
    ownerId: document.getElementById('bot-owner-id').value.trim(),
    code: document.getElementById('bot-code').value.trim(),
    interval: interval,
    heartbeat: heartbeat,
    fromHour: document.getElementById('bot-from-hour').value,
    toHour: document.getElementById('bot-to-hour').value,
    channelId: document.getElementById('bot-channel-id').value.trim(),
    visibility: document.querySelector('input[name="bot-visibility"]:checked').value,
    createdAt: new Date().toISOString(),
    deployed: false
  };

  if (platform !== 'rubika') {
    bots.push(bot);
    localStorage.setItem('panel_bots', JSON.stringify(bots));
    renderBots();
    alert('فعلاً استقرار خودکار برای روبیکا کامل است. تلگرام/بله در لیست ذخیره شد.');
    return;
  }

  var owner = localStorage.getItem('gh_owner');
  var repoName = 'rubika-bot-' + bot.id;
  var st = document.getElementById('deploy-status');
  var btn = document.getElementById('btn-save-bot');
  btn.disabled = true;
  st.style.color = '#38bdf8';

  try {
    st.textContent = 'ساخت مخزن...';
    await ensureRepo(owner, repoName, bot.visibility === 'private');
    st.textContent = 'آپلود bot.py ...';
    await putFile(owner, repoName, 'bot.py', buildBotPy(bot), 'deploy bot');
    st.textContent = 'آپلود workflow ...';
    await putFile(owner, repoName, '.github/workflows/run.yml', buildWorkflow(cronFromInterval(bot.interval)), 'workflow');
    await putFile(owner, repoName, 'state.json', JSON.stringify({ offset_id: null, processed: [] }, null, 2), 'state');
    await putFile(owner, repoName, 'requirements.txt', 'requests>=2.31.0\n', 'deps');

    try {
      var wfs = await ghApi('/repos/' + owner + '/' + repoName + '/actions/workflows');
      var wf = (wfs.workflows || [])[0];
      if (wf) await ghApi('/repos/' + owner + '/' + repoName + '/actions/workflows/' + wf.id + '/dispatches', 'POST', { ref: 'main' });
    } catch (e) { console.warn(e); }

    bot.deployed = true;
    bot.repoUrl = 'https://github.com/' + owner + '/' + repoName;
    bots.push(bot);
    localStorage.setItem('panel_bots', JSON.stringify(bots));
    renderBots();
    st.style.color = '#34d399';
    st.textContent = 'ربات فعال شد: ' + bot.repoUrl;
    alert('ربات روی گیت‌هاب شما ساخته و استارت شد.\nهر ' + bot.interval + ' دقیقه پیام‌ها را چک می‌کند.');
    document.getElementById('bot-token').value = '';
    document.getElementById('bot-code').value = '';
  } catch (e) {
    st.style.color = '#f87171';
    st.textContent = 'خطا: ' + e.message;
    alert('خطا: ' + e.message);
  }
  btn.disabled = false;
};

document.getElementById('btn-clear-bot').onclick = function () {
  document.getElementById('bot-token').value = '';
  document.getElementById('bot-owner-id').value = '';
  document.getElementById('bot-code').value = '';
  document.getElementById('bot-channel-id').value = '';
};

document.getElementById('btn-save-site').onclick = async function () {
  if (!localStorage.getItem('gh_token') || !localStorage.getItem('gh_owner')) {
    return alert('اول تنظیمات گیت‌هاب');
  }
  var name = document.getElementById('site-repo-name').value.trim().replace(/[^a-zA-Z0-9._-]/g, '-');
  var code = document.getElementById('site-code').value.trim();
  if (!name) return alert('نام مخزن لازم است');
  if (!code) return alert('کد سایت لازم است');
  if (code.toLowerCase().indexOf('<html') === -1) {
    code = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site</title></head><body>' + code + '</body></html>';
  }
  var vis = document.querySelector('input[name="site-visibility"]:checked').value;
  var owner = localStorage.getItem('gh_owner');
  var st = document.getElementById('site-deploy-status');
  st.style.color = '#38bdf8';
  try {
    st.textContent = 'ساخت مخزن سایت...';
    await ensureRepo(owner, name, vis === 'private');
    st.textContent = 'آپلود index.html ...';
    await putFile(owner, name, 'index.html', code, 'site deploy');
    await enablePages(owner, name);
    var site = {
      id: uid(),
      name: name,
      owner: document.getElementById('site-owner').value.trim(),
      repoUrl: 'https://github.com/' + owner + '/' + name,
      pagesUrl: 'https://' + owner + '.github.io/' + name + '/',
      createdAt: new Date().toISOString()
    };
    sites.push(site);
    localStorage.setItem('panel_sites', JSON.stringify(sites));
    renderSites();
    st.style.color = '#34d399';
    st.textContent = 'سایت: ' + site.pagesUrl + ' (۱–۲ دقیقه تا فعال شود)';
    alert('سایت ساخته شد.\nلینک: ' + site.pagesUrl);
  } catch (e) {
    st.style.color = '#f87171';
    st.textContent = 'خطا: ' + e.message;
    alert(e.message);
  }
};

document.getElementById('btn-test-preview').onclick = function () {
  var code = document.getElementById('test-site-code').value.trim();
  if (!code) return alert('کد را وارد کنید');
  if (code.toLowerCase().indexOf('<html') === -1) {
    code = '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"></head><body>' + code + '</body></html>';
  }
  var url = URL.createObjectURL(new Blob([code], { type: 'text/html' }));
  var f = document.getElementById('site-preview-frame');
  f.src = url;
  f.style.display = 'block';
};
document.getElementById('btn-test-save-local').onclick = function () {
  var code = document.getElementById('test-site-code').value.trim();
  if (!code) return alert('کد خالی است');
  localSites.push({ id: uid(), code: code, createdAt: new Date().toISOString() });
  localStorage.setItem('panel_local_sites', JSON.stringify(localSites));
  renderLocalSites();
  alert('در پنل ذخیره شد');
};

window.deleteBot = function (id) {
  if (!confirm('حذف از لیست؟')) return;
  bots = bots.filter(function (b) { return b.id !== id; });
  localStorage.setItem('panel_bots', JSON.stringify(bots));
  renderBots();
};
window.deleteSite = function (id) {
  sites = sites.filter(function (s) { return s.id !== id; });
  localStorage.setItem('panel_sites', JSON.stringify(sites));
  renderSites();
};
window.deleteLocal = function (id) {
  localSites = localSites.filter(function (s) { return s.id !== id; });
  localStorage.setItem('panel_local_sites', JSON.stringify(localSites));
  renderLocalSites();
};
window.previewLocal = function (id) {
  var s = localSites.find(function (x) { return x.id === id; });
  if (!s) return;
  var code = s.code;
  if (code.toLowerCase().indexOf('<html') === -1) {
    code = '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"></head><body>' + code + '</body></html>';
  }
  window.open(URL.createObjectURL(new Blob([code], { type: 'text/html' })), '_blank');
};
