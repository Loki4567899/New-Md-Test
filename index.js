js
const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const P = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');

const { state, saveState } = useSingleFileAuthState('./auth.json');

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason !== 401) startBot();
    } else if (connection === 'open') {
      console.log('✅ Bot is online');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (text === '.ping') {
      await sock.sendMessage(from, { text: 'Pong 🏓' });
    }
  });
}

startBot();
