import http from 'http';
import { bot } from "./bot.mjs";

// --- Bot Launch ---

// Start the bot using polling
bot.launch(() => {
  console.log('Bot started successfully!');
});


// This server setup is intended for deployment on render.com, it has no other meaning.
const PORT = 3000;
const REDIRECT_URL = 'https://github.com/prantiknoor/p2p-alert-bot';

const server = http.createServer((_req, res) => {
  res.writeHead(302, { Location: REDIRECT_URL });
  res.end();
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
