const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');
const nodemailer = require('nodemailer');

const CODE_LIFETIME_MS = 15 * 60 * 1000;
const POLL_MS = 5000;
const RETRY_MS = 60 * 1000;
const EMAIL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i;

function validDeliveryAddress(email) {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

function createMailer(env) {
  if (!env.REGISTRATION_SMTP_URL || !env.REGISTRATION_FROM) return null;
  let smtp;
  let auth;
  try {
    smtp = new URL(env.REGISTRATION_SMTP_URL);
    if (smtp.username) auth = {
      user: decodeURIComponent(smtp.username),
      pass: decodeURIComponent(smtp.password)
    };
  } catch {
    throw new Error('Configuração de envio de confirmação inválida.');
  }
  const secure = smtp.protocol === 'smtps:';
  if (!smtp.hostname || (smtp.protocol !== 'smtp:' && !secure) || smtp.search || smtp.hash ||
      (smtp.pathname && smtp.pathname !== '/') || !validDeliveryAddress(env.REGISTRATION_FROM)) {
    throw new Error('Configuração de envio de confirmação inválida.');
  }

  return nodemailer.createTransport({
    host: smtp.hostname,
    port: Number(smtp.port || (secure ? 465 : 587)),
    secure,
    requireTLS: !secure,
    auth,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true
  });
}

function createVerifiedRegistration({ run, get, hashPassword, secret, enabled, env }) {
  const mailer = enabled ? createMailer(env) : null;

  function codeFor(email, nonce) {
    return createHmac('sha256', secret).update('registration-code-v1\0')
      .update(email).update('\0').update(nonce).digest('base64url');
  }

  async function enqueue(email, now = Date.now()) {
    await run('DELETE FROM registration_requests WHERE expiresAt <= ?', [now]);
    const nonce = randomBytes(24).toString('base64url');
    // Keep the public SQL path identical for new and registered email addresses.
    await run(`
      INSERT OR IGNORE INTO registration_requests (email, nonce, expiresAt, nextAttempt)
      SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM registration_requests) < 5000
    `, [email, nonce, now + CODE_LIFETIME_MS, now]);
  }

  async function deliverOne(send, now = Date.now()) {
    const request = await get(`
      SELECT email, nonce FROM registration_requests
      WHERE expiresAt > ? AND nextAttempt <= ? AND sent = 0 AND attempts < 3 LIMIT 1
    `, [now, now]);
    if (!request) return false;
    const { email, nonce } = request;
    const claimed = await run(`
      UPDATE registration_requests SET nextAttempt = ?, attempts = attempts + 1
      WHERE email = ? AND nonce = ? AND expiresAt > ? AND nextAttempt <= ? AND sent = 0 AND attempts < 3
    `, [now + RETRY_MS, email, nonce, now, now]);
    if (claimed.changes !== 1) return false;

    const user = await get('SELECT 1 FROM users WHERE email = ?', [email]);
    if (!user) await send(email, codeFor(email, nonce));
    await run('UPDATE registration_requests SET sent = 1 WHERE email = ? AND nonce = ?', [email, nonce]);
    return true;
  }

  async function createAccount({ email, name, password, code }) {
    if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(code)) return null;
    const request = await get(
      'SELECT nonce FROM registration_requests WHERE email = ? AND expiresAt > ?',
      [email, Date.now()]
    );
    if (!request || !timingSafeEqual(Buffer.from(code), Buffer.from(codeFor(email, request.nonce)))) return null;

    const hashed = await hashPassword(password);
    const inserted = await run(`
      INSERT OR IGNORE INTO users (name, email, password, role, companyName)
      SELECT ?, email, ?, 'candidate', '' FROM registration_requests
      WHERE email = ? AND nonce = ? AND expiresAt > ?
    `, [name, hashed, email, request.nonce, Date.now()]);
    if (inserted.changes !== 1) return null;
    await run('DELETE FROM registration_requests WHERE email = ? AND nonce = ?', [email, request.nonce]);
    return inserted.id;
  }

  function startWorker(server) {
    if (!mailer) return;
    let busy = false;
    let cleanupDue = 0;
    const timer = setInterval(async () => {
      if (busy) return;
      busy = true;
      try {
        const now = Date.now();
        if (now >= cleanupDue) {
          await run('DELETE FROM registration_requests WHERE expiresAt <= ?', [now]);
          cleanupDue = now + RETRY_MS;
        }
        await deliverOne((email, code) => mailer.sendMail({
          from: { address: env.REGISTRATION_FROM, name: 'Oportuniza' },
          to: { address: email, name: '' },
          subject: 'Confirme seu cadastro no Oportuniza',
          text: `Copie este código no formulário de cadastro:\n\n${code}\n\nEle expira em 15 minutos. Se você não pediu cadastro, ignore esta mensagem.`
        }));
      } catch {
        console.error('Falha ao enviar confirmação de cadastro.');
      } finally {
        busy = false;
      }
    }, POLL_MS);
    timer.unref();
    server.once('close', () => { clearInterval(timer); mailer.close(); });
  }

  return { enabled, canDeliver: Boolean(mailer), enqueue, createAccount, deliverOne, startWorker };
}

module.exports = { createVerifiedRegistration, validDeliveryAddress };
