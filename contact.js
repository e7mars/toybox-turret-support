/* Private support. No analytics, cookies, URL credentials or automatic network calls. */
(() => {
  'use strict';
  const endpoint = 'https://toybox-ranking.toybox-turret.workers.dev/support/conversation';
  const key = 'toybox-private-web-support-v1';
  const form = document.getElementById('support-form'), field = document.getElementById('message');
  const topic = document.getElementById('topic'), send = document.getElementById('send');
  const refresh = document.getElementById('refresh'), status = document.getElementById('status');
  const conversation = document.getElementById('conversation');
  let busy = false;
  function load() {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || !/^[a-f0-9]{64}$/.test(value.secret) || value.endpoint !== endpoint) throw Error('This browser’s private conversation could not be opened. Try the in-game Help & privacy screen.');
    return value;
  }
  function random() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join(''); }
  function restore(value) {
    if (value?.pending) { field.value = value.pending.message; topic.value = value.pending.topic; field.readOnly = true; topic.disabled = true; send.textContent = 'Retry message'; }
  }
  function render(messages) {
    if (!Array.isArray(messages) || messages.length > 40 || messages.some(m => !m || !['player','support'].includes(m.sender) || typeof m.message !== 'string' || Array.from(m.message).length > 400)) throw Error('The conversation could not be opened.');
    conversation.textContent = messages.map(m => `${m.sender === 'support' ? 'Toybox Turret support' : 'You'}\n${m.message}`).join('\n\n') || 'No messages yet.';
  }
  async function call(value, payload) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Toybox-Support-Secret': value.secret }, body: JSON.stringify(payload), signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw Error(response.status === 429 ? 'Please wait a minute, then retry.' : 'Support could not connect. Your message is kept here to retry.');
      const raw = await response.text();
      if (raw.length > 80000) throw Error('The reply could not be opened.');
      const result = JSON.parse(raw); render(result.messages);
    } finally { clearTimeout(timer); }
  }
  async function run(operation) {
    if (busy) return;
    busy = true; send.disabled = refresh.disabled = true; status.textContent = 'Connecting…';
    try { await operation(); }
    catch (error) { status.textContent = error.name === 'AbortError' ? 'The connection timed out. Please retry.' : error.message; }
    finally { busy = false; send.disabled = refresh.disabled = false; }
  }
  try { restore(load()); } catch (error) { status.textContent = error.message; }
  form.addEventListener('submit', event => { event.preventDefault(); void run(async () => {
    const message = field.value.trim();
    if (!message || Array.from(message).length > 400) throw Error('Write 1–400 characters.');
    const value = load() || { secret: random(), endpoint };
    if (value.pending && (value.pending.message !== message || value.pending.topic !== topic.value)) throw Error('Retry the original message first.');
    value.pending ||= { id: crypto.randomUUID(), topic: topic.value, message };
    localStorage.setItem(key, JSON.stringify(value)); restore(value);
    await call(value, { action: 'send', ...value.pending });
    delete value.pending; localStorage.setItem(key, JSON.stringify(value));
    field.value = ''; field.readOnly = false; topic.disabled = false; send.textContent = 'Send private message';
    status.textContent = 'Message received. Return here and check replies; no email will be sent.';
  }); });
  refresh.addEventListener('click', () => { void run(async () => {
    const value = load();
    if (!value) { status.textContent = 'No conversation yet. Write a message to start one.'; return; }
    await call(value, { action: 'read' }); status.textContent = 'Conversation checked.';
  }); });
})();
