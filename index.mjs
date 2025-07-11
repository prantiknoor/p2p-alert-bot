import http from 'http';
import bot from "./bot.mjs";

// This server setup is intended for deployment on render.com, it has no other meaning.
const PORT = 3000;
const REDIRECT_URL = 'https://github.com/prantiknoor/p2p-alert-bot';

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
