import http from 'http';
import os from 'os';
import bot from "./bot.mjs";

// This server setup is intended for deployment on render.com, it has no other meaning.
const PORT = 3000;
const REDIRECT_URL = 'https://github.com/prantiknoor/p2p-alert-bot';

// Utility function to get server IP
function getServerIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'Unknown';
}

const server = http.createServer((req, res) => {
  if (req.url !== '/health') {
    console.log(`${req.method} ${req.url} from ${req.socket.remoteAddress}`);
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('OK');
  } else if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('OK');
  } else if (req.url === '/ip') {
    const ip = getServerIP();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ ip }));
  } else {
    res.writeHead(302, { Location: REDIRECT_URL });
  }
  res.end();
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

setTimeout(() => {
  // Start the bot using polling
  bot.launch(() => {
    console.log('Bot started successfully!');
  });
}, 3 * 1000);
