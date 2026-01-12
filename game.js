// Suika Cats Game
// A Suika-style game with adorable cats!

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Mouse, Vector } = Matter;

// Cat types from smallest to largest
const CAT_TYPES = [
    { name: 'Kitten', radius: 20, color: '#FFB6C1', points: 1, emoji: '🐱' },
    { name: 'Tabby', radius: 28, color: '#FFA07A', points: 3, emoji: '😺' },
    { name: 'Ginger', radius: 36, color: '#FF8C00', points: 6, emoji: '😸' },
    { name: 'Siamese', radius: 44, color: '#DEB887', points: 10, emoji: '😹' },
    { name: 'Persian', radius: 52, color: '#F5F5DC', points: 15, emoji: '😻' },
    { name: 'Maine Coon', radius: 62, color: '#CD853F', points: 21, emoji: '😼' },
    { name: 'Chonker', radius: 72, color: '#808080', points: 28, emoji: '😽' },
    { name: 'Chungus', radius: 84, color: '#4169E1', points: 36, emoji: '🙀' },
    { name: 'Absolute Unit', radius: 98, color: '#9932CC', points: 45, emoji: '😾' },
    { name: 'Mega Cat', radius: 115, color: '#FFD700', points: 55, emoji: '😿' },
    { name: 'ULTIMATE CAT', radius: 135, color: '#FF1493', points: 100, emoji: '😸✨' }
];

// Game configuration
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const DROP_ZONE_HEIGHT = 80;
const WALL_THICKNESS = 20;
const DROP_COOLDOWN = 500; // ms between drops

// Game state
let engine, render, runner;
let score = 0;
let bestScore = parseInt(localStorage.getItem('suikaCatsBest')) || 0;
let nextCatType = 0;
let currentCatType = 0;
let canDrop = true;
let gameOver = false;
let mouseX = GAME_WIDTH / 2;
let pendingMerges = [];
let droppedBodies = new Set();

// Initialize the game
function init() {
    // Create engine
    engine = Engine.create();
    engine.gravity.y = 1;

    // Create renderer
    const canvas = document.getElementById('game-canvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            wireframes: false,
            background: 'transparent'
        }
    });

    // Create walls
    const walls = [
        // Left wall
        Bodies.rectangle(-WALL_THICKNESS/2, GAME_HEIGHT/2, WALL_THICKNESS, GAME_HEIGHT, { 
            isStatic: true, 
            render: { fillStyle: '#8B4513' },
            label: 'wall'
        }),
        // Right wall
        Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS/2, GAME_HEIGHT/2, WALL_THICKNESS, GAME_HEIGHT, { 
            isStatic: true, 
            render: { fillStyle: '#8B4513' },
            label: 'wall'
        }),
        // Bottom
        Bodies.rectangle(GAME_WIDTH/2, GAME_HEIGHT + WALL_THICKNESS/2, GAME_WIDTH + WALL_THICKNESS*2, WALL_THICKNESS, { 
            isStatic: true, 
            render: { fillStyle: '#8B4513' },
            label: 'wall'
        })
    ];
    
    Composite.add(engine.world, walls);

    // Set up collision detection
    Events.on(engine, 'collisionStart', handleCollision);
    
    // Set up custom rendering for cats
    Events.on(render, 'afterRender', drawCatFaces);

    // Start the engine and renderer
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);

    // Set up mouse tracking
    const canvas_element = document.getElementById('game-canvas');
    canvas_element.addEventListener('mousemove', (e) => {
        const rect = canvas_element.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
    });
    
    canvas_element.addEventListener('click', handleClick);
    canvas_element.addEventListener('touchstart', handleTouch);
    canvas_element.addEventListener('touchmove', handleTouchMove);

    // Set up restart button
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    // Initialize UI
    updateScore();
    generateNextCat();
    populateCatGuide();
    
    // Start game over check loop
    setInterval(checkGameOver, 1000);
}

// Generate the next cat to drop
function generateNextCat() {
    currentCatType = nextCatType;
    // Only spawn small cats (first 5 types)
    nextCatType = Math.floor(Math.random() * 5);
    updateNextCatDisplay();
}

// Update the next cat preview display
function updateNextCatDisplay() {
    const display = document.getElementById('next-cat-display');
    const cat = CAT_TYPES[nextCatType];
    display.innerHTML = `<div style="
        width: ${Math.min(cat.radius * 1.5, 40)}px;
        height: ${Math.min(cat.radius * 1.5, 40)}px;
        background: ${cat.color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.min(cat.radius * 0.8, 20)}px;
        border: 2px solid rgba(0,0,0,0.2);
        box-shadow: inset 0 -3px 6px rgba(0,0,0,0.1);
    ">${cat.emoji.charAt(0) === '😸' && cat.emoji.length > 2 ? '😸' : cat.emoji}</div>`;
}

// Handle mouse click to drop cat
function handleClick(e) {
    if (!canDrop || gameOver) return;
    dropCat(mouseX);
}

// Handle touch events
function handleTouch(e) {
    e.preventDefault();
    if (!canDrop || gameOver) return;
    const rect = e.target.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    mouseX = touchX;
    dropCat(touchX);
}

function handleTouchMove(e) {
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
}

// Drop a cat at the specified x position
function dropCat(x) {
    const cat = CAT_TYPES[currentCatType];
    
    // Clamp x position to stay within walls
    const minX = cat.radius + 5;
    const maxX = GAME_WIDTH - cat.radius - 5;
    x = Math.max(minX, Math.min(maxX, x));
    
    const body = createCatBody(x, DROP_ZONE_HEIGHT / 2, currentCatType);
    Composite.add(engine.world, body);
    
    // Mark as dropped after a short delay (to allow it to fall a bit)
    setTimeout(() => {
        droppedBodies.add(body.id);
    }, 500);
    
    canDrop = false;
    generateNextCat();
    
    setTimeout(() => {
        canDrop = true;
    }, DROP_COOLDOWN);
}

// Create a cat body
function createCatBody(x, y, typeIndex) {
    const cat = CAT_TYPES[typeIndex];
    const body = Bodies.circle(x, y, cat.radius, {
        restitution: 0.2,
        friction: 0.5,
        frictionAir: 0.01,
        density: 0.001,
        label: `cat_${typeIndex}`,
        render: {
            fillStyle: cat.color,
            strokeStyle: 'rgba(0,0,0,0.3)',
            lineWidth: 2
        }
    });
    body.catType = typeIndex;
    return body;
}

// Handle collisions
function handleCollision(event) {
    const pairs = event.pairs;
    
    for (let pair of pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Check if both are cats of the same type
        if (bodyA.catType !== undefined && bodyB.catType !== undefined) {
            if (bodyA.catType === bodyB.catType && bodyA.catType < CAT_TYPES.length - 1) {
                // Queue merge (don't modify during collision callback)
                pendingMerges.push({ bodyA, bodyB });
            }
        }
    }
}

// Process pending merges (called in game loop)
function processMerges() {
    const processed = new Set();
    
    for (let merge of pendingMerges) {
        const { bodyA, bodyB } = merge;
        
        // Skip if already processed or removed
        if (processed.has(bodyA.id) || processed.has(bodyB.id)) continue;
        if (!Composite.get(engine.world, bodyA.id, 'body')) continue;
        if (!Composite.get(engine.world, bodyB.id, 'body')) continue;
        
        processed.add(bodyA.id);
        processed.add(bodyB.id);
        
        // Calculate merge position (midpoint)
        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;
        
        // Remove old cats
        Composite.remove(engine.world, bodyA);
        Composite.remove(engine.world, bodyB);
        droppedBodies.delete(bodyA.id);
        droppedBodies.delete(bodyB.id);
        
        // Create new bigger cat
        const newTypeIndex = bodyA.catType + 1;
        const newBody = createCatBody(midX, midY, newTypeIndex);
        Composite.add(engine.world, newBody);
        droppedBodies.add(newBody.id);
        
        // Update score
        score += CAT_TYPES[newTypeIndex].points;
        updateScore();
        
        // Create merge effect
        createMergeEffect(midX, midY, CAT_TYPES[newTypeIndex].color);
    }
    
    pendingMerges = [];
}

// Create visual effect for merging
function createMergeEffect(x, y, color) {
    // Create particles using temporary DOM elements
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        
        particle.style.left = (rect.left + x) + 'px';
        particle.style.top = (rect.top + y) + 'px';
        
        document.body.appendChild(particle);
        
        const angle = (i / 8) * Math.PI * 2;
        const distance = 50;
        const targetX = rect.left + x + Math.cos(angle) * distance;
        const targetY = rect.top + y + Math.sin(angle) * distance;
        
        particle.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, opacity: 0 }
        ], {
            duration: 400,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

// Draw cat faces on top of physics bodies
function drawCatFaces() {
    const ctx = render.context;
    const bodies = Composite.allBodies(engine.world);
    
    // Draw drop zone indicator
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, DROP_ZONE_HEIGHT);
    ctx.lineTo(GAME_WIDTH, DROP_ZONE_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    
    // Draw preview of cat to drop
    if (canDrop && !gameOver) {
        const cat = CAT_TYPES[currentCatType];
        const previewX = Math.max(cat.radius + 5, Math.min(GAME_WIDTH - cat.radius - 5, mouseX));
        
        // Draw drop line
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(previewX, DROP_ZONE_HEIGHT / 2 + cat.radius);
        ctx.lineTo(previewX, GAME_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        
        // Draw preview cat
        ctx.save();
        ctx.globalAlpha = 0.6;
        drawCat(ctx, previewX, DROP_ZONE_HEIGHT / 2, cat, currentCatType);
        ctx.restore();
    }
    
    // Draw actual cats
    for (let body of bodies) {
        if (body.catType !== undefined) {
            const cat = CAT_TYPES[body.catType];
            drawCat(ctx, body.position.x, body.position.y, cat, body.catType, body.angle);
        }
    }
    
    // Process any pending merges
    processMerges();
}

// Draw a single cat
function drawCat(ctx, x, y, cat, typeIndex, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    const r = cat.radius;
    
    // Body (circle with gradient)
    const gradient = ctx.createRadialGradient(0, -r * 0.2, 0, 0, 0, r);
    gradient.addColorStop(0, lightenColor(cat.color, 30));
    gradient.addColorStop(1, cat.color);
    
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Ears
    const earSize = r * 0.35;
    const earOffset = r * 0.6;
    
    // Left ear
    ctx.beginPath();
    ctx.moveTo(-earOffset, -r * 0.5);
    ctx.lineTo(-earOffset - earSize * 0.5, -r - earSize * 0.3);
    ctx.lineTo(-earOffset + earSize * 0.5, -r * 0.6);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.fill();
    ctx.stroke();
    
    // Left ear inner
    ctx.beginPath();
    ctx.moveTo(-earOffset, -r * 0.6);
    ctx.lineTo(-earOffset - earSize * 0.25, -r - earSize * 0.1);
    ctx.lineTo(-earOffset + earSize * 0.25, -r * 0.65);
    ctx.closePath();
    ctx.fillStyle = '#FFB6C1';
    ctx.fill();
    
    // Right ear
    ctx.beginPath();
    ctx.moveTo(earOffset, -r * 0.5);
    ctx.lineTo(earOffset + earSize * 0.5, -r - earSize * 0.3);
    ctx.lineTo(earOffset - earSize * 0.5, -r * 0.6);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.fill();
    ctx.stroke();
    
    // Right ear inner
    ctx.beginPath();
    ctx.moveTo(earOffset, -r * 0.6);
    ctx.lineTo(earOffset + earSize * 0.25, -r - earSize * 0.1);
    ctx.lineTo(earOffset - earSize * 0.25, -r * 0.65);
    ctx.closePath();
    ctx.fillStyle = '#FFB6C1';
    ctx.fill();
    
    // Eyes
    const eyeY = -r * 0.15;
    const eyeSpacing = r * 0.35;
    const eyeSize = r * 0.2;
    
    // Eye whites
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY, eyeSize * 0.5, eyeSize * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeSpacing, eyeY, eyeSize * 0.5, eyeSize * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-eyeSpacing - eyeSize * 0.15, eyeY - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing - eyeSize * 0.15, eyeY - eyeSize * 0.2, eyeSize * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.1);
    ctx.lineTo(-r * 0.08, r * 0.2);
    ctx.lineTo(r * 0.08, r * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Mouth
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.2);
    ctx.lineTo(0, r * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, r * 0.35);
    ctx.quadraticCurveTo(-r * 0.15, r * 0.45, -r * 0.2, r * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, r * 0.35);
    ctx.quadraticCurveTo(r * 0.15, r * 0.45, r * 0.2, r * 0.35);
    ctx.stroke();
    
    // Whiskers
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // Left whiskers
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.25);
    ctx.lineTo(-r * 0.7, r * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.3);
    ctx.lineTo(-r * 0.7, r * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.35);
    ctx.lineTo(-r * 0.7, r * 0.45);
    ctx.stroke();
    
    // Right whiskers
    ctx.beginPath();
    ctx.moveTo(r * 0.2, r * 0.25);
    ctx.lineTo(r * 0.7, r * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.2, r * 0.3);
    ctx.lineTo(r * 0.7, r * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.2, r * 0.35);
    ctx.lineTo(r * 0.7, r * 0.45);
    ctx.stroke();
    
    // Blush
    ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.5, r * 0.2, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.5, r * 0.2, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Size indicator for larger cats
    if (typeIndex >= 5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${r * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cat.name.split(' ')[0], 0, r * 0.65);
    }
    
    ctx.restore();
}

// Lighten a color
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('suikaCatsBest', bestScore);
    }
    document.getElementById('best-score').textContent = bestScore;
}

// Check for game over
function checkGameOver() {
    if (gameOver) return;
    
    const bodies = Composite.allBodies(engine.world);
    
    for (let body of bodies) {
        if (body.catType !== undefined && droppedBodies.has(body.id)) {
            // Check if any cat is above the drop zone and has settled
            if (body.position.y - CAT_TYPES[body.catType].radius < DROP_ZONE_HEIGHT) {
                // Check if the cat has settled (low velocity)
                const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
                if (speed < 0.5) {
                    triggerGameOver();
                    return;
                }
            }
        }
    }
}

// Trigger game over
function triggerGameOver() {
    gameOver = true;
    canDrop = false;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-overlay').classList.remove('hidden');
}

// Restart the game
function restartGame() {
    // Clear all bodies except walls
    const bodies = Composite.allBodies(engine.world);
    for (let body of bodies) {
        if (body.label !== 'wall') {
            Composite.remove(engine.world, body);
        }
    }
    
    // Reset state
    score = 0;
    gameOver = false;
    canDrop = true;
    droppedBodies.clear();
    pendingMerges = [];
    
    // Update UI
    updateScore();
    generateNextCat();
    document.getElementById('game-over-overlay').classList.add('hidden');
}

// Populate cat guide
function populateCatGuide() {
    const guideList = document.getElementById('cat-guide-list');
    guideList.innerHTML = '';
    
    CAT_TYPES.forEach((cat, index) => {
        const item = document.createElement('div');
        item.className = 'guide-cat';
        item.innerHTML = `
            <div class="guide-cat-icon" style="background: ${cat.color}; font-size: ${Math.min(12 + index, 18)}px;">
                ${cat.emoji.charAt(0) === '😸' && cat.emoji.length > 2 ? '😸' : cat.emoji}
            </div>
            <span>${cat.name}</span>
        `;
        guideList.appendChild(item);
    });
}

// Initialize game when page loads
window.addEventListener('load', init);
