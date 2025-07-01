# P2P Alert Bot

This project is a simple alert bot for monitoring P2P (peer-to-peer) trading activity, likely focused on cryptocurrency exchanges. It is designed to help users track specific trading events or price changes and send notifications or alerts based on custom criteria.

## Features
- Monitors P2P trading activity (e.g., on Bybit or similar platforms)
- Sends alerts or notifications based on user-defined rules
- Easily configurable and extendable

## Getting Started
1. **Install dependencies:**
   ```sh
   pnpm install
   ```
2. **Run the bot:**
   ```sh
   pnpm start
   ```
   Or directly:
   ```sh
   node bot.mjs
   ```

## Files
- `bot.mjs`: Main bot logic and entry point
- `bybit.mjs`: Bybit exchange integration and utilities
- `package.json`: Project metadata and scripts

## Requirements
- Node.js (v18 or higher recommended)
- pnpm (or npm/yarn)

## License
MIT
