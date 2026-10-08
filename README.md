# Texas Hold'em Poker 🃏

A single-player Texas Hold'em poker game with AI bots, built with React, TypeScript, and Tailwind CSS.

## 🎮 Features

- **4 AI Opponents** with distinct personalities (Conservative, Aggressive, Caller, Trickster)
- **Full Texas Hold'em rules** - blinds, betting rounds, showdown
- **Animated cards & chips** - smooth, physical feel
- **Sound effects** - Web Audio API
- **Progressive Web App** - install on Chromebook/desktop/mobile
- **Offline support** - play anywhere

## 🚀 Quick Start

### Option 1: Run Locally (Development)

```bash
# Clone the repo
git clone https://github.com/nikolaysto-png/Poker..git
cd Poker.

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Option 2: Build & Serve (Production)

```bash
# Build for production
npm run build

# Serve the build
npx serve dist
```

Open the URL shown in terminal (usually `http://localhost:3000`).

## 💻 Run on Chromebook

### Method 1: GitHub Pages (Easiest)

1. Push your code to GitHub (you've already done this!)

2. Go to your repo: `https://github.com/nikolaysto-png/Poker..git`

3. Click **Settings** → **Pages**

4. Under "Source", select **Deploy from a branch**

5. Select branch: **main**, folder: **/dist** (or **/ (root)** if you don't have a dist folder committed)

6. Click **Save**

7. Wait 1-2 minutes, then visit: `https://nikolaysto-png.github.io/Poker./`

8. **Install as app**: Click the install icon (⊕) in Chrome's address bar → "Install Poker"

### Method 2: Netlify (Free, No GitHub Config)

1. Go to [netlify.com](https://netlify.com) and sign up (free)

2. Click **Add new site** → **Deploy manually**

3. Drag and drop the `dist` folder

4. Get your live URL (e.g., `https://poker-game-123.netlify.app`)

5. Open on Chromebook and install as app

### Method 3: Vercel (Free, Auto-deploys)

1. Go to [vercel.com](https://vercel.com) and sign up (free)

2. Click **New Project** → Import your GitHub repo

3. Vercel auto-detects Vite, click **Deploy**

4. Get your live URL (e.g., `https://poker.vercel.app`)

5. Open on Chromebook and install as app

### Method 4: Local Server on Chromebook

If you have Linux (Crostini) enabled on your Chromebook:

```bash
# Enable Linux in Chromebook settings
# Open Terminal (Linux)

# Clone and run
git clone https://github.com/nikolaysto-png/Poker..git
cd Poker.
npm install
npm run build
npx serve dist

# Open http://localhost:3000 in Chrome
```

## 📱 Install as PWA

Once deployed, you can install it as an app:

### Chrome/Chromebook:
1. Open the game URL in Chrome
2. Look for the install icon (⊕) in the address bar
3. Click **Install**
4. The game now appears in your app launcher!

### Mobile (iOS/Android):
1. Open the game URL in Safari/Chrome
2. Tap **Share** → **Add to Home Screen**
3. The game now appears as an app icon!

## 🎯 How to Play

1. Click **Sit Down** to start
2. You start with $1,000 chips
3. Blinds are $10/$20
4. Use the action buttons:
   - **Fold** - discard your hand
   - **Check** - pass (if no bet to call)
   - **Call** - match the current bet
   - **Raise** - increase the bet
   - **All-In** - bet all your chips

5. Bots have different personalities:
   - **Viktor** (Conservative) - plays tight, folds often
   - **Sofia** (Aggressive) - raises frequently, bluffs
   - **Marcus** (Caller) - calls a lot, sees many flops
   - **Luna** (Trickster) - unpredictable, mixes it up

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run dev server with hot reload
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck

# Preview production build
npm run preview
```

## 📂 Project Structure

```
src/
├── App.tsx                    # Entry point
├── main.tsx                   # React mount
├── index.css                  # Tailwind + custom styles
├── components/
│   └── PokerGame.tsx          # Full UI: table, cards, chips, controls
└── poker/
    ├── types.ts               # TypeScript interfaces
    ├── evaluator.ts           # Hand evaluation (all 10 hand ranks)
    ├── ai.ts                  # Bot personalities & decision logic
    ├── sound.ts               # Web Audio API sound system
    └── useGame.ts             # Game state machine hook

public/
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker (offline support)
└── icon.svg                   # App icon
```

## 🤖 Bot AI

The bots use **rule-based heuristics** (no LLM/neural net):

1. **Hand evaluation** - calculates hand strength from hole cards + community cards
2. **Pot odds** - `callAmount / (pot + callAmount)`
3. **Personality modifiers** - each bot has thresholds for fold/call/raise/bluff
4. **Randomness** - difficulty level adds noise (easy bots make mistakes 25% of the time)

Example decision tree:
```ts
if (handStrength < foldThreshold) return 'fold';
if (handStrength >= raiseThreshold) return 'raise';
if (Math.random() < bluffChance) return 'raise'; // bluff!
return 'call';
```

## 🎨 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Web Audio API** - Sound effects

## 📝 License

MIT

## 🐛 Troubleshooting

### "npm: command not found"
Install Node.js from [nodejs.org](https://nodejs.org/)

### Port already in use
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### PWA won't install
- Make sure you're using HTTPS (required for PWA)
- Clear browser cache and reload
- Check browser console for errors

---

**Enjoy the game!** 🎰
