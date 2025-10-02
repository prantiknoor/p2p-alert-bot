import http from 'http';
import https from 'https';
import os from 'os';
import bot from "./bot.mjs";

const PORT = 3000;
const REDIRECT_URL = 'https://github.com/prantiknoor/p2p-alert-bot';

// Utility: Get local (private) IP
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'Unknown';
}

// Utility: Get public IP
function getPublicIP(callback) {
  https.get('https://api.ipify.org?format=json', (resp) => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => {
      try {
        const json = JSON.parse(data);
        callback(json.ip);
      } catch {
        callback('Error');
      }
    });
  }).on("error", () => {
    callback('Error');
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/ip') {
    getPublicIP((publicIp) => {
      const localIp = getLocalIP();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ localIp, publicIp }));
    });
  } else if (req.url === '/health' || req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(302, { Location: REDIRECT_URL });
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

setTimeout(() => {
  bot.launch(() => {
    console.log('Bot started successfully!');
  });
}, 3 * 1000);
