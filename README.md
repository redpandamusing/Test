# 🐱 Suika Cats 🐱

A fun physics-based puzzle game inspired by Suika Game (Watermelon Game), but with adorable cats!

![Suika Cats Game](https://img.shields.io/badge/Game-Suika%20Cats-ff69b4)
![Made with](https://img.shields.io/badge/Made%20with-Matter.js-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 How to Play

1. **Drop cats** by clicking anywhere in the game area
2. **Merge matching cats** - when two cats of the same type touch, they combine into a bigger cat!
3. **Score points** by creating bigger cats through merges
4. **Don't let cats overflow** - the game ends if cats stack above the drop line

## 🐱 Cat Evolution

Cats evolve from smallest to largest:

1. 🐱 **Kitten** (smallest)
2. 😺 **Tabby**
3. 😸 **Ginger**
4. 😹 **Siamese**
5. 😻 **Persian**
6. 😼 **Maine Coon**
7. 😽 **Chonker**
8. 🙀 **Chungus**
9. 😾 **Absolute Unit**
10. 😿 **Mega Cat**
11. 😸✨ **ULTIMATE CAT** (largest - the goal!)

## 🚀 Getting Started

### Option 1: Open directly in browser
Simply open `index.html` in any modern web browser!

### Option 2: Use a local server
For the best experience, run a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 🎯 Game Features

- **Physics-based gameplay** using Matter.js
- **Cute cat graphics** with hand-drawn style faces
- **Score tracking** with local storage for best scores
- **Visual effects** for cat merges
- **Responsive design** for different screen sizes
- **Touch support** for mobile devices

## 🛠️ Tech Stack

- **HTML5 Canvas** for rendering
- **CSS3** for styling and animations
- **JavaScript (ES6+)** for game logic
- **Matter.js** for physics simulation

## 📁 Project Structure

```
suika-cats/
├── index.html      # Main HTML file
├── styles.css      # Game styling
├── game.js         # Game logic and physics
└── README.md       # This file
```

## 🎨 Customization

You can easily customize the game by modifying `game.js`:

- **CAT_TYPES array** - Change cat sizes, colors, names, and points
- **GAME_WIDTH/HEIGHT** - Adjust game dimensions
- **DROP_COOLDOWN** - Change time between drops
- **Physics properties** - Adjust gravity, bounce, friction

## 📱 Controls

- **Desktop**: Click to drop cats, move mouse to aim
- **Mobile**: Tap to drop, drag to aim

## 🏆 Tips for High Scores

1. Try to keep bigger cats at the bottom
2. Plan your merges to create chain reactions
3. Don't let small cats accumulate at the top
4. Aim for the ULTIMATE CAT!

## 📄 License

MIT License - feel free to use and modify!

---

Made with 💜 and lots of cat pictures as inspiration 🐱
