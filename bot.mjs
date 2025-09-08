
import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { P2PAlertBybit } from './bybit.mjs';

const MIN_AMOUNT = 500.0;
const MAX_OF_MIN = 1000.0
const MAX_PRICE = 1.00;
const WISE_PAYMENT_METHOD = '78';

const BOT_TOKEN = process.env.BOT_TOKEN;

const bot = new Telegraf(BOT_TOKEN);
const p2pAlertBybit = new P2PAlertBybit();

const userState = new Map();

bot.telegram.setMyCommands([
  { command: 'start', description: 'Start the bot and enter amounts' },
  { command: 'stop', description: 'Stop the current running process' },
  { command: 'setmaxprice', description: 'Set the maximum price of USDT (e.g. /setmaxprice 1.05)' }
]);

p2pAlertBybit.on('ad', ({ id, ads }) => {
  const state = userState.get(id);
  const prevSentAds = state?.prevSentAds ?? [];
  const messages = []; let i = prevSentAds.length;

  for (const ad of ads) {
    if (!prevSentAds.includes(ad)) {
      messages.push(`${++i}. ${ad}`);
      prevSentAds.push(ad);
    };
  }

  state.prevSentAds = prevSentAds;
  userState.set(prevSentAds);

  const message = messages.join('\n');

  console.log({ id, ads, message });

  if (message) bot.telegram.sendMessage(id, message, { parse_mode: 'HTML' });
})

bot.start((ctx) => {
  const isAllowed = process.env.WHITE_LIST?.split(",")?.includes(ctx.from.id.toString())

  if (!isAllowed) {
    return ctx.reply('You are not allowed to use the bot.');
  }

  let state = userState.get(ctx.from.id);

  if (state?.isProcessRunning) {
    return ctx.reply('A process is already running. Use /stop to stop it.');
  }

  state = state ?? { isProcessRunning: false }
  state.isAskingAmount = true;

  userState.set(ctx.from.id, state);

  ctx.reply('Welcome! Please enter the amount range as "min-max" (e.g., 200-500) to start the process.');
});

bot.command('stop', (ctx) => {
  const state = userState.get(ctx.from.id);

  if (state && state.isProcessRunning) {
    state.isProcessRunning = false;
    state.prevSentAds = [];
    userState.set(ctx.from.id, state)

    p2pAlertBybit.stop(ctx.from.id)

    ctx.reply('Process has been stopped.');
  } else {
    ctx.reply('No process is currently running.');
  }
});

bot.command('setmaxprice', (ctx) => {
  const state = userState.get(ctx.from.id)
  if (!state) {
    return ctx.reply('Please start the bot first using /start.');
  } else if (state.isProcessRunning) {
    return ctx.reply('You cannot change the maximum price while a process is running. Please use /stop to stop the current process first.');
  }

  const args = ctx.message.text.split(' ').slice(1);
  if (args.length !== 1) {
    return ctx.reply('Usage: /setmaxprice <price>');
  }

  const newPrice = parseFloat(args[0]);
  if (isNaN(newPrice) || newPrice <= 0) {
    return ctx.reply('Please provide a valid positive number for the price.');
  }

  state.MAX_PRICE = newPrice;
  userState.set(ctx.from.id, state)
  ctx.reply(`Maximum price has been set to $${newPrice}`);
});

bot.on('text', (ctx) => {
  const state = userState.get(ctx.from.id);
  const text = ctx.message.text;

  // Check if the bot is currently waiting for an amount range from this user
  if (state && state.isAskingAmount) {
    // Expecting input like "200-500" or "200 500" or "200,500"
    const match = text.match(/^(\d+(?:\.\d+)?)[\s,-]+(\d+(?:\.\d+)?)/);
    if (match) {
      const minAmount = parseFloat(match[1]);
      const maxAmount = parseFloat(match[2]);
      if (minAmount > 0 && maxAmount > 0 && minAmount <= maxAmount) {
        // Update the user's state
        state.isAskingAmount = false;
        state.isProcessRunning = true;
        userState.set(ctx.from.id, state);

        try {
          p2pAlertBybit.start(ctx.from.id, {
            paymentMethod: WISE_PAYMENT_METHOD,
            minAmount: minAmount,
            maxAmount: maxAmount,
            maxPrice: state.MAX_PRICE || MAX_PRICE
          });

        } catch (error) {
          console.log(error);
        }
        console.log(`Process started for user ${ctx.from.id} with minAmount: ${minAmount}, maxAmount: ${maxAmount}`);

        ctx.reply(`Process has started.\n` +
          `Payment Method: Wise\n` +
          `Maximum Price: $${state.MAX_PRICE || MAX_PRICE}\n` +
          `Minimum Amount: $${minAmount}\n` +
          `Maximum Amount: $${maxAmount}`)
      } else {
        ctx.reply('Invalid range. Ensure both numbers are positive and min is less than or equal to max. Example: 200-500');
      }
    } else {
      ctx.reply('Invalid format. Please enter the amount range as "min-max" (e.g., 200-500).');
    }
  } else if (state && state.isProcessRunning) {
    ctx.reply('A process is already running. Use /stop to stop it.');
  } else {
    ctx.reply('Please use the /start command to begin.');
  }
});

// --- Graceful Shutdown ---

// Enable graceful stop on process termination signals
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;