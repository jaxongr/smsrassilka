const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8769793226:AAHyCi3OhhvAa1qsNL53BfKJxIi2Z1ATH4w';
const ADMIN_ID = parseInt(process.env.ADMIN_ID || '5475915736', 10);
const BACKEND_URL = process.env.BACKEND_URL || 'http://sms-gateway-backend:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@smsgateway.uz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let accessToken = null;
let refreshToken = null;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ─── Auth ────────────────────────────────────────────────────────────────────

async function login() {
  try {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    accessToken = res.data.accessToken;
    refreshToken = res.data.refreshToken;
    console.log('[voice-bot] Logged in to backend successfully');
  } catch (err) {
    console.error('[voice-bot] Login failed:', err.message);
    throw err;
  }
}

async function refreshAuth() {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/api/auth/refresh`,
      { refreshToken },
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
    accessToken = res.data.accessToken;
    refreshToken = res.data.refreshToken;
    console.log('[voice-bot] Token refreshed');
  } catch {
    console.log('[voice-bot] Refresh failed, re-logging in...');
    await login();
  }
}

function authHeaders() {
  return { Authorization: `Bearer ${accessToken}` };
}

async function apiCall(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.response && err.response.status === 401) {
      await refreshAuth();
      return await fn();
    }
    throw err;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isAdmin(msg) {
  return msg.from.id === ADMIN_ID;
}

function rejectNonAdmin(msg) {
  if (!isAdmin(msg)) {
    bot.sendMessage(msg.chat.id, 'Sizga ruxsat berilmagan.');
    return true;
  }
  return false;
}

function tmpFile(ext) {
  return path.join(os.tmpdir(), `voice_${Date.now()}.${ext}`);
}

function convertToMp3(inputPath) {
  return new Promise((resolve, reject) => {
    const output = tmpFile('mp3');
    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioBitrate(128)
      .on('end', () => resolve(output))
      .on('error', (err) => reject(err))
      .save(output);
  });
}

function formatDuration(seconds) {
  if (!seconds) return 'noma\'lum';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function cleanup(...files) {
  for (const f of files) {
    try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch {}
  }
}

// ─── /start ──────────────────────────────────────────────────────────────────

bot.onText(/\/start/, (msg) => {
  if (rejectNonAdmin(msg)) return;

  bot.sendMessage(msg.chat.id, [
    'SMS Gateway Voice Bot',
    '',
    'Ovozli xabar yuborish:',
    '  - Ovozli xabar yozib yuboring',
    '  - Yoki audio fayl (mp3, wav) yuboring',
    '',
    'Buyruqlar:',
    '  /list - Saqlangan ovozli xabarlar ro\'yxati',
    '  /delete {id} - Ovozli xabarni o\'chirish',
    '  /start - Yo\'riqnoma',
  ].join('\n'));
});

// ─── /list ───────────────────────────────────────────────────────────────────

bot.onText(/\/list/, async (msg) => {
  if (rejectNonAdmin(msg)) return;

  try {
    const res = await apiCall(() =>
      axios.get(`${BACKEND_URL}/api/voice-messages`, { headers: authHeaders() }),
    );

    const messages = res.data;

    if (!messages || messages.length === 0) {
      bot.sendMessage(msg.chat.id, 'Ovozli xabarlar topilmadi.');
      return;
    }

    const lines = messages.map((vm, i) => {
      const dur = vm.duration ? formatDuration(vm.duration) : '-';
      return `${i + 1}. ${vm.name || vm.fileName}\n   ID: ${vm.id}\n   Davomiyligi: ${dur}`;
    });

    bot.sendMessage(msg.chat.id, `Ovozli xabarlar (${messages.length}):\n\n${lines.join('\n\n')}`);
  } catch (err) {
    console.error('[voice-bot] /list error:', err.message);
    bot.sendMessage(msg.chat.id, `Xatolik: ${err.message}`);
  }
});

// ─── /delete ─────────────────────────────────────────────────────────────────

bot.onText(/\/delete\s+(.+)/, async (msg, match) => {
  if (rejectNonAdmin(msg)) return;

  const id = match[1].trim();

  try {
    await apiCall(() =>
      axios.delete(`${BACKEND_URL}/api/voice-messages/${id}`, { headers: authHeaders() }),
    );
    bot.sendMessage(msg.chat.id, `Ovozli xabar o'chirildi: ${id}`);
  } catch (err) {
    console.error('[voice-bot] /delete error:', err.message);
    bot.sendMessage(msg.chat.id, `Xatolik: ${err.message}`);
  }
});

// ─── Voice / Audio handler ───────────────────────────────────────────────────

async function handleVoiceOrAudio(msg) {
  if (rejectNonAdmin(msg)) return;

  const chatId = msg.chat.id;
  const voice = msg.voice;
  const audio = msg.audio;
  const source = voice || audio;

  if (!source) return;

  const fileId = source.file_id;
  const duration = source.duration || null;
  const mimeType = source.mime_type || '';
  const originalName = audio?.file_name || `voice_${Date.now()}`;

  const statusMsg = await bot.sendMessage(chatId, 'Fayl yuklanmoqda...');

  let downloadedPath = null;
  let mp3Path = null;

  try {
    // Download file from Telegram
    downloadedPath = await bot.downloadFile(fileId, os.tmpdir());

    // Determine if conversion is needed
    const ext = path.extname(downloadedPath).toLowerCase();
    const needsConversion = ['.ogg', '.oga', '.opus'].includes(ext);

    let uploadPath = downloadedPath;
    if (needsConversion) {
      await bot.editMessageText('Formatni o\'zgartirish (mp3)...', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
      mp3Path = await convertToMp3(downloadedPath);
      uploadPath = mp3Path;
    }

    // Prepare name
    const baseName = path.basename(originalName, path.extname(originalName));
    const name = baseName || `voice_${Date.now()}`;

    // Upload to backend
    await bot.editMessageText('Backend\'ga yuklanmoqda...', {
      chat_id: chatId,
      message_id: statusMsg.message_id,
    });

    const form = new FormData();
    form.append('file', fs.createReadStream(uploadPath), {
      filename: `${name}.mp3`,
      contentType: 'audio/mpeg',
    });
    form.append('name', name);

    const res = await apiCall(() =>
      axios.post(`${BACKEND_URL}/api/voice-messages`, form, {
        headers: {
          ...authHeaders(),
          ...form.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }),
    );

    const saved = res.data;
    const durationText = duration ? formatDuration(duration) : 'noma\'lum';

    await bot.editMessageText(
      [
        'Ovozli xabar saqlandi!',
        '',
        `Nomi: ${saved.name || name}`,
        `Davomiyligi: ${durationText}`,
        `ID: ${saved.id}`,
      ].join('\n'),
      { chat_id: chatId, message_id: statusMsg.message_id },
    );
  } catch (err) {
    console.error('[voice-bot] Upload error:', err.message);
    await bot.editMessageText(`Xatolik: ${err.message}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id,
    }).catch(() => {});
  } finally {
    cleanup(downloadedPath, mp3Path);
  }
}

bot.on('voice', handleVoiceOrAudio);
bot.on('audio', handleVoiceOrAudio);

// ─── Startup ─────────────────────────────────────────────────────────────────

async function start() {
  console.log('[voice-bot] Starting...');

  // Retry login until backend is ready
  let retries = 0;
  const maxRetries = 30;
  while (retries < maxRetries) {
    try {
      await login();
      break;
    } catch {
      retries++;
      console.log(`[voice-bot] Backend not ready, retrying (${retries}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  if (!accessToken) {
    console.error('[voice-bot] Could not connect to backend after retries. Exiting.');
    process.exit(1);
  }

  console.log('[voice-bot] Bot is running and polling for messages.');
}

start();
