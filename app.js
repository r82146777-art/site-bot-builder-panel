let bots = JSON.parse(localStorage.getItem('bots') || '[]');
let sites = JSON.parse(localStorage.getItem('sites') || '[]');

const landing = document.getElementById('landing');
const panel = document.getElementById('panel');

document.getElementById('btn-enter').addEventListener('click', () => {
  landing.classList.add('hidden');
  panel.classList.remove('hidden');
  loadGhSettings();
});
document.getElementById('btn-logout').addEventListener('click', () => {
  panel.classList.add('hidden');
  landing.classList.remove('hidden');
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-section').classList.add('active');
  });
});

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

function loadGhSettings() {
  document.getElementById('gh-token').value = localStorage.getItem('gh_token') || '';
  document.getElementById('gh-owner').value = localStorage.getItem('gh_owner') || 'r82146777-art';
  const st = document.getElementById('gh-status');
  if (localStorage.getItem('gh_token')) st.textContent = '✅ توکن گیت‌هاب ذخیره شده است.';
}

document.getElementById('btn-save-gh').addEventListener('click', () => {
  const t = document.getElementById('gh-token').value.trim();
  const o = document.getElementById('gh-owner').value.trim() || 'r82146777-art';
  if (!t) { alert('توکن گیت‌هاب را وارد کنید'); return; }
  localStorage.setItem('gh_token', t);
  localStorage.setItem('gh_owner', o);
  document.getElementById('gh-status').textContent = '✅ ذخیره شد.';
});

function renderBots() {
  const container = document.getElementById('active-bots');
  if (!bots.length) {
    container.innerHTML = '<p class="empty">هنوز رباتی ساخته نشده.</p>';
    return;
  }
  container.innerHTML = bots.map((bot, i) => `
    <div class="item">
      <div class="item-info">
        <h4>ربات ${i + 1} ${bot.deployed ? '🟢 فعال روی گیت‌هاب' : ''}</h4>
        <p>پلتفرم: ${platformName(bot.platform)} | توکن: ${maskToken(bot.token)}</p>
        ${bot.repoUrl ? `<p><a href="${bot.repoUrl}" target="_blank" style="color:#38bdf8">مخزن ربات</a></p>` : ''}
        <span class="badge ${bot.platform}">${platformName(bot.platform)}</span>
      </div>
      <div class="item-actions">
        <button class="btn danger" onclick="deleteBot('${bot.id}')">حذف از لیست</button>
      </div>
    </div>
  `).join('');
}

function renderSites() {
  const container = document.getElementById('active-sites');
  if (!sites.length) {
    container.innerHTML = '<p class="empty">خالی</p>';
    return;
  }
  container.innerHTML = sites.map((s, i) => `
    <div class="item"><div class="item-info"><h4>سایت ${i+1}</h4></div>
    <button class="btn danger" onclick="deleteSite('${s.id}')">حذف</button></div>
  `).join('');
}

function buildRubikaBotPy(token) {
  // توکن داخل فایل خصوصی قرار می‌گیرد تا بدون Secret هم کار کند
  return `# -*- coding: utf-8 -*-
import json, os
from pathlib import Path
import requests

TOKEN = os.environ.get("BOT_TOKEN", "").strip() or """${token.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"""
BASE = f"https://botapi.rubika.ir/v3/{TOKEN}"
STATE_FILE = Path("state.json")

def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"offset_id": None, "processed": []}

def save_state(state):
    state["processed"] = (state.get("processed") or [])[-100:]
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

def api(method, data=None):
    r = requests.post(f"{BASE}/{method}", json=data or {}, timeout=30)
    r.raise_for_status()
    return r.json()

def send_message(chat_id, text):
    try:
        return api("sendMessage", {"chat_id": chat_id, "text": text})
    except Exception as e:
        print("send error", e)
        return None

def type_label(t):
    m = {"User":"کاربر","Channel":"کانال","Bot":"ربات","Group":"گروه","user":"کاربر","channel":"کانال","bot":"ربات","group":"گروه"}
    return m.get(str(t), str(t) if t else "نامشخص")

def handle_update(update, state):
    if not isinstance(update, dict):
        return
    if "update" in update and isinstance(update["update"], dict):
        update = update["update"]
    chat_id = update.get("chat_id")
    msg = update.get("new_message") or update.get("message") or {}
    if not chat_id or not msg:
        return
    message_id = str(msg.get("message_id") or "")
    key = f"{chat_id}:{message_id}"
    if message_id and key in state.get("processed", []):
        return
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
            "🆔 آیدی چت مبدأ (گروه/کانال/کاربر):",
            "\`" + from_chat + "\`",
            "",
            "👤 آیدی فرستنده اصلی:",
            ("\`" + from_sender + "\`") if from_sender else "—",
            "",
            "📩 آیدی پیام اصلی:",
            ("\`" + orig_msg_id + "\`") if orig_msg_id else "—",
        ]
        send_message(chat_id, "\\n".join(lines))
        replied = True
    else:
        low = text.lower()
        if low in ("/start", "start", "استارت", "/id", "id", "آیدی", "ایدی"):
            lines = [
                "👋 سلام! ربات آیدی‌دهنده هستم.",
                "",
                "🔹 آیدی عددی شما:",
                "\`" + sender_id + "\`",
                "",
                "🔹 آیدی این چت:",
                "\`" + chat_id + "\`",
                "",
                "📌 برای آیدی گروه/کانال: یک پیام از آن را فوروارد کنید.",
                "",
                "⏱️ هر چند دقیقه یک‌بار پیام‌ها چک می‌شود.",
            ]
            send_message(chat_id, "\\n".join(lines))
            replied = True
        elif text:
            send_message(chat_id, "آیدی شما: \`" + sender_id + "\`\\n\\n/start بزنید یا پیام فوروارد کنید.")
            replied = True
    if replied and message_id:
        state.setdefault("processed", []).append(key)

def main():
    if not TOKEN:
        print("no token")
        return
    print("start")
    state = load_state()
    offset_id = state.get("offset_id")
    try:
        payload = {"limit": 50}
        if offset_id:
            payload["offset_id"] = offset_id
        res = api("getUpdates", payload)
        data = res.get("data") if isinstance(res.get("data"), dict) else res
        updates = data.get("updates") or data.get("update_list") or []
        next_offset = data.get("next_offset_id") or data.get("offset_id")
        print("updates", len(updates))
        for u in updates:
            try:
                handle_update(u, state)
            except Exception as e:
                print("err", e)
        if next_offset:
            state["offset_id"] = next_offset
        save_state(state)
        print("done")
    except Exception as e:
        print("fatal", e)
        save_state(state)
        raise

if __name__ == "__main__":
    main()
`;
}

const WORKFLOW_YML = `name: ربات آیدی روبیکا
on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:
permissions:
  contents: write
jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install requests
      - name: Run bot
        run: python bot.py
      - name: Save state
        run: |
          if [ -f state.json ]; then
            git config user.name "rubika-id-bot"
            git config user.email "bot@users.noreply.github.com"
            git add state.json
            git diff --staged --quiet || git commit -m "chore: state"
            git push
          fi
`;

async function ghApi(path, method, body) {
  const token = localStorage.getItem('gh_token');
  const res = await fetch('https://api.github.com' + path, {
    method: method || 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data.message || text || String(res.status));
  return data;
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function putFile(owner, repo, path, content, message) {
  let sha;
  try {
    const existing = await ghApi('/repos/' + owner + '/' + repo + '/contents/' + path);
    sha = existing.sha;
  } catch (e) {}
  const body = {
    message: message || ('update ' + path),
    content: toBase64(content),
    branch: 'main'
  };
  if (sha) body.sha = sha;
  return ghApi('/repos/' + owner + '/' + repo + '/contents/' + path, 'PUT', body);
}

async function ensureRepo(owner, name) {
  try {
    return await ghApi('/repos/' + owner + '/' + name);
  } catch (e) {
    return ghApi('/user/repos', 'POST', {
      name: name,
      private: true,
      auto_init: true,
      description: 'ربات روبیکا — هر ۵ دقیقه'
    });
  }
}

async function deployRubikaBot(bot) {
  const owner = localStorage.getItem('gh_owner') || 'r82146777-art';
  const repoName = 'rubika-id-bot';
  const status = document.getElementById('deploy-status');
  status.style.color = '#38bdf8';
  status.textContent = 'در حال آماده‌سازی مخزن...';

  await ensureRepo(owner, repoName);
  status.textContent = 'آپلود کد ربات...';
  await putFile(owner, repoName, 'bot.py', buildRubikaBotPy(bot.token), 'deploy bot from panel');
  status.textContent = 'آپلود workflow...';
  await putFile(owner, repoName, '.github/workflows/run.yml', WORKFLOW_YML, 'deploy workflow');
  await putFile(owner, repoName, 'state.json', JSON.stringify({ offset_id: null, processed: [] }, null, 2), 'init state');
  await putFile(owner, repoName, 'requirements.txt', 'requests>=2.31.0\\n', 'requirements');

  status.textContent = 'اجرای اول...';
  try {
    const wfs = await ghApi('/repos/' + owner + '/' + repoName + '/actions/workflows');
    const wf = (wfs.workflows || []).find(w => (w.path || '').includes('run.yml'));
    if (wf) {
      await ghApi('/repos/' + owner + '/' + repoName + '/actions/workflows/' + wf.id + '/dispatches', 'POST', { ref: 'main' });
    }
  } catch (e) {
    console.warn(e);
  }

  bot.deployed = true;
  bot.repoUrl = 'https://github.com/' + owner + '/' + repoName;
  status.style.color = '#34d399';
  status.textContent = '✅ ربات فعال شد — هر ۵ دقیقه پیام‌ها را چک می‌کند. ' + bot.repoUrl;
  return bot;
}

document.getElementById('btn-save-bot').addEventListener('click', async () => {
  const platform = document.getElementById('bot-platform').value;
  const token = document.getElementById('bot-token').value.trim();
  const allowedIds = document.getElementById('bot-allowed-ids').value.trim();
  const code = document.getElementById('bot-code').value.trim();

  if (!token) { alert('توکن ربات را وارد کنید'); return; }

  if (platform === 'rubika') {
    if (!localStorage.getItem('gh_token')) {
      alert('اول تب «تنظیمات گیت‌هاب» را باز کنید و توکن گیت‌هاب را ذخیره کنید.');
      return;
    }
    const bot = {
      id: generateId(),
      platform: platform,
      token: token,
      allowedIds: allowedIds,
      code: code,
      createdAt: new Date().toISOString(),
      deployed: false
    };
    const btn = document.getElementById('btn-save-bot');
    btn.disabled = true;
    try {
      await deployRubikaBot(bot);
      bots.push(bot);
      localStorage.setItem('bots', JSON.stringify(bots));
      renderBots();
      clearBotForm();
      alert('ربات روی گیت‌هاب استارت شد.\\nهر ۵ دقیقه پیام‌های خصوصی روبیکا را چک می‌کند و جواب می‌دهد.\\n(به کانال وصل نیست — فقط پاسخ به پیام شما)');
    } catch (e) {
      document.getElementById('deploy-status').style.color = '#f87171';
      document.getElementById('deploy-status').textContent = 'خطا: ' + e.message;
      alert('خطا: ' + e.message);
    }
    btn.disabled = false;
    return;
  }

  const bot = { id: generateId(), platform: platform, token: token, allowedIds: allowedIds, code: code, createdAt: new Date().toISOString() };
  bots.push(bot);
  localStorage.setItem('bots', JSON.stringify(bots));
  renderBots();
  clearBotForm();
  alert('برای تلگرام/بله فعلاً فقط در لیست ذخیره می‌شود. استارت زنده برای روبیکا است.');
});

document.getElementById('btn-clear-bot').addEventListener('click', clearBotForm);
function clearBotForm() {
  document.getElementById('bot-token').value = '';
  document.getElementById('bot-allowed-ids').value = '';
  document.getElementById('bot-code').value = '';
}

document.getElementById('btn-save-site').addEventListener('click', () => {
  let code = document.getElementById('site-code').value.trim();
  if (!code) { alert('کد سایت را وارد کنید'); return; }
  const site = { id: generateId(), owner: document.getElementById('site-owner').value.trim(), code: code };
  sites.push(site);
  localStorage.setItem('sites', JSON.stringify(sites));
  renderSites();
  alert('سایت ذخیره شد');
});

function deleteBot(id) {
  if (!confirm('حذف از لیست؟')) return;
  bots = bots.filter(b => b.id !== id);
  localStorage.setItem('bots', JSON.stringify(bots));
  renderBots();
}
function deleteSite(id) {
  sites = sites.filter(s => s.id !== id);
  localStorage.setItem('sites', JSON.stringify(sites));
  renderSites();
}

renderBots();
renderSites();
