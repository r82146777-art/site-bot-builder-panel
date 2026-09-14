let bots = JSON.parse(localStorage.getItem('panel_bots') || '[]');
let sites = JSON.parse(localStorage.getItem('panel_sites') || '[]');
let localSites = JSON.parse(localStorage.getItem('panel_local_sites') || '[]');

const landing = document.getElementById('landing');
const panel = document.getElementById('panel');

document.getElementById('btn-enter').onclick = () => {
  landing.classList.add('hidden');
  panel.classList.remove('hidden');
  loadGh();
  updateConnLabel();
  renderBots();
  renderSites();
  renderLocalSites();
};
document.getElementById('btn-logout').onclick = () => {
  panel.classList.add('hidden');
  landing.classList.remove('hidden');
};

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-section').classList.add('active');
  };
});

function loadGh() {
  document.getElementById('gh-token').value = localStorage.getItem('gh_token') || '';
  document.getElementById('gh-owner').value = localStorage.getItem('gh_owner') || '';
  document.getElementById('gh-email').value = localStorage.getItem('gh_email') || '';
  if (localStorage.getItem('gh_token')) {
    document.getElementById('gh-status').textContent = '✅ توکن ذخیره شده — روی حساب خودتان کار می‌کند';
    document.getElementById('gh-status').style.color = '#34d399';
  }
}
function updateConnLabel() {
  const o = localStorage.getItem('gh_owner');
  const el = document.getElementById('conn-label');
  if (localStorage.getItem('gh_token') && o) el.textContent = 'متصل به گیت‌هاب: @' + o;
  else el.textContent = 'ابتدا از تب تنظیمات گیت‌هاب متصل شوید';
}

document.getElementById('btn-save-gh').onclick = () => {
  const t = document.getElementById('gh-token').value.trim();
  const o = document.getElementById('gh-owner').value.trim();
  const e = document.getElementById('gh-email').value.trim();
  if (!t) return alert('توکن گیت‌هاب لازم است');
  if (!o) return alert('نام کاربری گیت‌هاب لازم است');
  localStorage.setItem('gh_token', t);
  localStorage.setItem('gh_owner', o);
  localStorage.setItem('gh_email', e);
  document.getElementById('gh-status').style.color = '#34d399';
  document.getElementById('gh-status').textContent = '✅ ذخیره شد. همه کارها روی حساب @' + o + ' انجام می‌شود.';
  updateConnLabel();
};

document.getElementById('btn-test-gh').onclick = async () => {
  const st = document.getElementById('gh-status');
  st.style.color = '#38bdf8';
  st.textContent = 'در حال تست...';
  try {
    const me = await ghApi('/user');
    st.style.color = '#34d399';
    st.textContent = '✅ اتصال موفق: @' + me.login + (me.email ? ' | ' + me.email : '');
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
  const c = document.getElementById('active-bots');
  if (!bots.length) { c.innerHTML = '<p class="empty">هنوز رباتی نیست.</p>'; return; }
  c.innerHTML = bots.map((b, i) => `
    <div class="item">
      <div class="item-info">
        <h4>ربات ${i + 1} ${b.deployed ? '🟢' : ''}</h4>
        <p>${platformName(b.platform)} | ${mask(b.token)} | هر ${b.interval || 5} دقیقه ${b.heartbeat ? '❤️' : ''}</p>
        ${b.repoUrl ? `<p><a href="${b.repoUrl}" target="_blank" style="color:#38bdf8">${b.repoUrl}</a></p>` : ''}
        <span class="badge ${b.platform}">${platformName(b.platform)}</span>
      </div>
      <div class="item-actions">
        <button class="btn danger" onclick="deleteBot('${b.id}')">حذف از لیست</button>
      </div>
    </div>`).join('');
}
function renderSites() {
  const c = document.getElementById('active-sites');
  if (!sites.length) { c.innerHTML = '<p class="empty">خالی</p>'; return; }
  c.innerHTML = sites.map((s, i) => `
    <div class="item">
      <div class="item-info">
        <h4>سایت ${i + 1}</h4>
        ${s.pagesUrl ? `<p><a href="${s.pagesUrl}" target="_blank" style="color:#38bdf8">${s.pagesUrl}</a></p>` : ''}
        ${s.repoUrl ? `<p><a href="${s.repoUrl}" target="_blank" style="color:#94a3b8">مخزن</a></p>` : ''}
      </div>
      <div class="item-actions"><button class="btn danger" onclick="deleteSite('${s.id}')">حذف</button></div>
    </div>`).join('');
}
function renderLocalSites() {
  const c = document.getElementById('local-sites');
  if (!localSites.length) { c.innerHTML = '<p class="empty">خالی</p>'; return; }
  c.innerHTML = localSites.map((s, i) => `
    <div class="item">
      <div class="item-info"><h4>محلی ${i + 1}</h4></div>
      <div class="item-actions">
        <button class="btn success" onclick="previewLocal('${s.id}')">باز کردن</button>
        <button class="btn danger" onclick="deleteLocal('${s.id}')">حذف</button>
      </div>
    </div>`).join('');
}

async function ghApi(path, method, body) {
  const token = localStorage.getItem('gh_token');
  if (!token) throw new Error('توکن گیت‌هاب تنظیم نشده');
  const res = await fetch('https://api.github.com' + path, {
    method: method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data.message || String(res.status));
  return data;
}
function b64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
async function putFile(owner, repo, path, content, message) {
  let sha;
  try { sha = (await ghApi(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`)).sha; } catch (e) {}
  // path may have slashes - use raw path
  const apiPath = `/repos/${owner}/${repo}/contents/${path}`;
  let sha2;
  try { sha2 = (await ghApi(apiPath)).sha; } catch (e) {}
  const body = { message: message || 'update', content: b64(content), branch: 'main' };
  if (sha2) body.sha = sha2;
  return ghApi(apiPath, 'PUT', body);
}
async function ensureRepo(owner, name, isPrivate) {
  try {
    const r = await ghApi(`/repos/${owner}/${name}`);
    // update visibility if needed
    if (typeof isPrivate === 'boolean' && r.private !== isPrivate) {
      try { await ghApi(`/repos/${owner}/${name}`, 'PATCH', { private: isPrivate }); } catch (e) {}
    }
    return r;
  } catch (e) {
    return ghApi('/user/repos', 'POST', {
      name,
      private: !!isPrivate,
      auto_init: true,
      description: 'ساخته‌شده با پنل ربات/سایت'
    });
  }
}
async function enablePages(owner, repo) {
  try {
    await ghApi(`/repos/${owner}/${repo}/pages`, 'POST', { source: { branch: 'main', path: '/' } });
  } catch (e) {
    // maybe already enabled
  }
}

function cronFromInterval(minutes) {
  const m = parseInt(minutes, 10) || 5;
  if (m <= 5) return '*/5 * * * *';
  if (m === 10) return '*/10 * * * *';
  if (m === 15) return '*/15 * * * *';
  if (m === 30) return '*/30 * * * *';
  if (m === 60) return '0 * * * *';
  if (m === 120) return '0 */2 * * *';
  return '*/5 * * * *';
}

function buildBotPy(bot) {
  const token = (bot.token || '').replace(/\\/g, '\\\\').replace(/"""/g, '');
  const fromH = parseInt(bot.fromHour, 10);
  const toH = parseInt(bot.toHour, 10);
  const channel = (bot.channelId || '').replace(/\\/g, '\\\\');
  const ownerId = (bot.ownerId || '').replace(/\\/g, '\\\\');

  return `# -*- coding: utf-8 -*-
import json, os
from pathlib import Path
from datetime import datetime, timezone, timedelta
import requests

TOKEN = os.environ.get("BOT_TOKEN", "").strip() or """${token}"""
BASE = f"https://botapi.rubika.ir/v3/{TOKEN}"
STATE_FILE = Path("state.json")
FROM_HOUR = ${Number.isFinite(fromH) ? fromH : 0}
TO_HOUR = ${Number.isFinite(toH) ? toH : 23}
CHANNEL_ID = """${channel}""".strip()
OWNER_ID = """${ownerId}""".strip()

def tehran_hour():
    # UTC+3:30 تقریبی
    now = datetime.now(timezone.utc) + timedelta(hours=3, minutes=30)
    return now.hour

def in_window():
    h = tehran_hour()
    if FROM_HOUR <= TO_HOUR:
        return FROM_HOUR <= h <= TO_HOUR
    return h >= FROM_HOUR or h <= TO_HOUR

def load_state():
    if STATE_FILE.exists():
        try: return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except: pass
    return {"offset_id": None, "processed": []}

def save_state(state):
    state["processed"] = (state.get("processed") or [])[-120:]
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

def api(method, data=None):
    r = requests.post(f"{BASE}/{method}", json=data or {}, timeout=30)
    r.raise_for_status()
    return r.json()

def send_message(chat_id, text):
    try:
        return api("sendMessage", {"chat_id": chat_id, "text": text})
    except Exception as e:
        print("send", e)
        return None

def type_label(t):
    m = {"User":"کاربر","Channel":"کانال","Bot":"ربات","Group":"گروه","user":"کاربر","channel":"کانال","bot":"ربات","group":"گروه"}
    return m.get(str(t), str(t) if t else "نامشخص")

def handle_update(update, state):
    if not isinstance(update, dict): return
    if "update" in update and isinstance(update["update"], dict):
        update = update["update"]
    chat_id = update.get("chat_id")
    msg = update.get("new_message") or update.get("message") or {}
    if not chat_id or not msg: return
    message_id = str(msg.get("message_id") or "")
    key = f"{chat_id}:{message_id}"
    if message_id and key in state.get("processed", []): return
    text = (msg.get("text") or "").strip()
    sender_id = msg.get("sender_id") or ""
    forwarded = msg.get("forwarded_from")
    replied = False

    if forwarded and isinstance(forwarded, dict):
        from_chat = forwarded.get("from_chat_id") or ""
        from_sender = forwarded.get("from_sender_id") or ""
        orig_msg_id = forwarded.get("message_id") or ""
        type_from = forwarded.get("type_from") or ""
        lines = [
            "✅ اطلاعات پیام فورواردشده:",
            "",
            "📌 نوع منبع: " + type_label(type_from),
            "🆔 آیدی چت مبدأ:",
            "`" + from_chat + "`",
            "",
            "👤 آیدی فرستنده اصلی:",
            ("`" + from_sender + "`") if from_sender else "—",
            "",
            "📩 آیدی پیام:",
            ("`" + orig_msg_id + "`") if orig_msg_id else "—",
        ]
        send_message(chat_id, "\\n".join(lines))
        replied = True
    else:
        low = text.lower()
        if low in ("/start", "start", "استارت", "/id", "id", "آیدی", "ایدی"):
            lines = [
                "👋 ربات آیدی‌دهنده",
                "",
                "🔹 آیدی شما:",
                "`" + sender_id + "`",
                "",
                "🔹 آیدی این چت:",
                "`" + chat_id + "`",
                "",
                "📌 پیام گروه/کانال را فوروارد کنید.",
            ]
            send_message(chat_id, "\\n".join(lines))
            replied = True
        elif text:
            send_message(chat_id, "آیدی شما: `" + sender_id + "`\\n/start یا فوروارد کنید.")
            replied = True

    if replied and message_id:
        state.setdefault("processed", []).append(key)

def main():
    if not TOKEN:
        print("no token"); return
    if not in_window():
        print("outside time window"); return
    print("run")
    state = load_state()
    offset_id = state.get("offset_id")
    try:
        payload = {"limit": 50}
        if offset_id: payload["offset_id"] = offset_id
        res = api("getUpdates", payload)
        data = res.get("data") if isinstance(res.get("data"), dict) else res
        updates = data.get("updates") or data.get("update_list") or []
        next_offset = data.get("next_offset_id") or data.get("offset_id")
        print("updates", len(updates))
        for u in updates:
            try: handle_update(u, state)
            except Exception as e: print("err", e)
        if next_offset: state["offset_id"] = next_offset
        save_state(state)
    except Exception as e:
        print("fatal", e)
        save_state(state)
        raise

if __name__ == "__main__":
    main()
`;
}

function buildWorkflow(cronExpr) {
  return `name: bot-runner
on:
  schedule:
    - cron: '${cronExpr}'
  workflow_dispatch:
permissions:
  contents: write
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install requests
      - run: python bot.py
      - name: save state
        run: |
          if [ -f state.json ]; then
            git config user.name "panel-bot"
            git config user.email "bot@users.noreply.github.com"
            git add state.json
            git diff --staged --quiet || git commit -m "chore: state"
            git push
          fi
`;
}

document.getElementById('btn-save-bot').onclick = async () => {
  if (!localStorage.getItem('gh_token') || !localStorage.getItem('gh_owner')) {
    alert('اول تب تنظیمات گیت‌هاب: توکن و نام کاربری را ذخیره کنید');
    return;
  }
  const token = document.getElementById('bot-token').value.trim();
  if (!token) return alert('توکن ربات لازم است');

  const platform = document.getElementById('bot-platform').value;
  let interval = document.getElementById('bot-interval').value;
  const heartbeat = document.getElementById('bot-heartbeat').checked;
  if (heartbeat) interval = '5';

  const bot = {
    id: uid(),
    platform,
    token,
    ownerId: document.getElementById('bot-owner-id').value.trim(),
    code: document.getElementById('bot-code').value.trim(),
    interval,
    heartbeat,
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
    alert('فعلاً استقرار خودکار Actions برای روبیکا کامل است. تلگرام/بله در لیست ذخیره شد.');
    return;
  }

  const owner = localStorage.getItem('gh_owner');
  const repoName = 'rubika-bot-' + bot.id;
  const st = document.getElementById('deploy-status');
  const btn = document.getElementById('btn-save-bot');
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
      const wfs = await ghApi(`/repos/${owner}/${repoName}/actions/workflows`);
      const wf = (wfs.workflows || [])[0];
      if (wf) await ghApi(`/repos/${owner}/${repoName}/actions/workflows/${wf.id}/dispatches`, 'POST', { ref: 'main' });
    } catch (e) { console.warn(e); }

    bot.deployed = true;
    bot.repoUrl = `https://github.com/${owner}/${repoName}`;
    bots.push(bot);
    localStorage.setItem('panel_bots', JSON.stringify(bots));
    renderBots();
    st.style.color = '#34d399';
    st.textContent = '✅ ربات فعال شد: ' + bot.repoUrl;
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

document.getElementById('btn-clear-bot').onclick = () => {
  document.getElementById('bot-token').value = '';
  document.getElementById('bot-owner-id').value = '';
  document.getElementById('bot-code').value = '';
  document.getElementById('bot-channel-id').value = '';
};

document.getElementById('btn-save-site').onclick = async () => {
  if (!localStorage.getItem('gh_token') || !localStorage.getItem('gh_owner')) {
    return alert('اول تنظیمات گیت‌هاب');
  }
  let name = document.getElementById('site-repo-name').value.trim().replace(/[^a-zA-Z0-9._-]/g, '-');
  let code = document.getElementById('site-code').value.trim();
  if (!name) return alert('نام مخزن لازم است');
  if (!code) return alert('کد سایت لازم است');
  if (!code.toLowerCase().includes('<html')) {
    code = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site</title></head><body>' + code + '</body></html>';
  }
  const vis = document.querySelector('input[name="site-visibility"]:checked').value;
  const owner = localStorage.getItem('gh_owner');
  const st = document.getElementById('site-deploy-status');
  st.style.color = '#38bdf8';
  try {
    st.textContent = 'ساخت مخزن سایت...';
    await ensureRepo(owner, name, vis === 'private');
    st.textContent = 'آپلود index.html ...';
    await putFile(owner, name, 'index.html', code, 'site deploy');
    await enablePages(owner, name);
    const site = {
      id: uid(),
      name,
      owner: document.getElementById('site-owner').value.trim(),
      repoUrl: `https://github.com/${owner}/${name}`,
      pagesUrl: `https://${owner}.github.io/${name}/`,
      createdAt: new Date().toISOString()
    };
    sites.push(site);
    localStorage.setItem('panel_sites', JSON.stringify(sites));
    renderSites();
    st.style.color = '#34d399';
    st.textContent = '✅ سایت: ' + site.pagesUrl + ' (۱–۲ دقیقه تا فعال شود)';
    alert('سایت ساخته شد.\nلینک: ' + site.pagesUrl);
  } catch (e) {
    st.style.color = '#f87171';
    st.textContent = 'خطا: ' + e.message;
    alert(e.message);
  }
};

document.getElementById('btn-test-preview').onclick = () => {
  let code = document.getElementById('test-site-code').value.trim();
  if (!code) return alert('کد را وارد کنید');
  if (!code.toLowerCase().includes('<html')) {
    code = '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"></head><body>' + code + '</body></html>';
  }
  const url = URL.createObjectURL(new Blob([code], { type: 'text/html' }));
  const f = document.getElementById('site-preview-frame');
  f.src = url;
  f.style.display = 'block';
};
document.getElementById('btn-test-save-local').onclick = () => {
  const code = document.getElementById('test-site-code').value.trim();
  if (!code) return alert('کد خالی است');
  localSites.push({ id: uid(), code, createdAt: new Date().toISOString() });
  localStorage.setItem('panel_local_sites', JSON.stringify(localSites));
  renderLocalSites();
  alert('در پنل ذخیره شد');
};

window.deleteBot = (id) => {
  if (!confirm('حذف از لیست؟')) return;
  bots = bots.filter(b => b.id !== id);
  localStorage.setItem('panel_bots', JSON.stringify(bots));
  renderBots();
};
window.deleteSite = (id) => {
  sites = sites.filter(s => s.id !== id);
  localStorage.setItem('panel_sites', JSON.stringify(sites));
  renderSites();
};
window.deleteLocal = (id) => {
  localSites = localSites.filter(s => s.id !== id);
  localStorage.setItem('panel_local_sites', JSON.stringify(localSites));
  renderLocalSites();
};
window.previewLocal = (id) => {
  const s = localSites.find(x => x.id === id);
  if (!s) return;
  let code = s.code;
  if (!code.toLowerCase().includes('<html')) code = '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"></head><body>' + code + '</body></html>';
  window.open(URL.createObjectURL(new Blob([code], { type: 'text/html' })), '_blank');
};
