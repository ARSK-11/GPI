document.addEventListener('DOMContentLoaded', () => {
  const navBtn = document.querySelector('[data-toggle-nav]');
  const nav = document.querySelector('[data-nav]');
  if (navBtn && nav) navBtn.addEventListener('click', () => nav.classList.toggle('show'));

  const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';

  async function postForm(action, form) {
    const body = new FormData(form);
    body.append('action', action);
    if (!body.get('csrf_token')) body.append('csrf_token', csrf);
    const res = await fetch('/api', { method: 'POST', body });
    const json = await res.json().catch(() => ({ success:false, message:'Respons server tidak valid.' }));
    if (!json.success) throw new Error(json.message || 'Gagal mengirim data.');
    return json;
  }

  function bindForm(formId, action, msgSelector, successText) {
    const form = document.querySelector(formId);
    const msg = document.querySelector(msgSelector);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const oldText = btn?.textContent;
      if (btn) { btn.disabled = true; btn.textContent = 'Mengirim...'; }
      if (msg) { msg.textContent = ''; msg.className = 'form-msg'; }
      try {
        const json = await postForm(action, form);
        form.reset();
        if (msg) { msg.textContent = json.message || successText; msg.className = 'form-msg success'; }
      } catch (err) {
        if (msg) { msg.textContent = err.message; msg.className = 'form-msg danger'; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = oldText; }
      }
    });
  }

  bindForm('#publicMessageForm', 'public_message', '[data-public-msg]', 'Pesan berhasil dikirim.');
  bindForm('#chatbotForm', 'public_message', '[data-chatbot-msg]', 'Pesan berhasil dikirim.');
  bindForm('#publicMediaForm', 'public_media_upload', '[data-public-media-msg]', 'Media berhasil dikirim dan menunggu review admin.');

  const chatToggle = document.querySelector('[data-chat-toggle]');
  const chatbox = document.querySelector('[data-chatbox]');
  if (chatToggle && chatbox) chatToggle.addEventListener('click', () => chatbox.classList.toggle('show'));
});
