// Suika Cats Game - Nyan Cat Style! 🌈
// A Suika-style game with adorable anime cats!

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Mouse, Vector } = Matter;

// Cat types from smallest to largest - Nyan Cat rainbow palette!
const CAT_TYPES = [
    { name: 'Tiny Nyan', radius: 20, color: '#FFB7C5', secondaryColor: '#FF69B4', points: 1, expression: 'happy' },
    { name: 'Mini Nyan', radius: 28, color: '#FFDD94', secondaryColor: '#FFB347', points: 3, expression: 'happy' },
    { name: 'Smol Nyan', radius: 36, color: '#B4F8C8', secondaryColor: '#7FFF00', points: 6, expression: 'blep' },
    { name: 'Nyan', radius: 44, color: '#A0E7E5', secondaryColor: '#40E0D0', points: 10, expression: 'kawaii' },
    { name: 'Nyan+', radius: 52, color: '#B4A7FF', secondaryColor: '#9370DB', points: 15, expression: 'happy' },
    { name: 'Super Nyan', radius: 62, color: '#FFB6D9', secondaryColor: '#FF69B4', points: 21, expression: 'star' },
    { name: 'Mega Nyan', radius: 72, color: '#87CEEB', secondaryColor: '#4169E1', points: 28, expression: 'kawaii' },
    { name: 'Ultra Nyan', radius: 84, color: '#DDA0DD', secondaryColor: '#BA55D3', points: 36, expression: 'love' },
    { name: 'Hyper Nyan', radius: 98, color: '#F0E68C', secondaryColor: '#FFD700', points: 45, expression: 'star' },
    { name: 'Omega Nyan', radius: 115, color: '#FFA07A', secondaryColor: '#FF6347', points: 55, expression: 'love' },
    { name: 'RAINBOW NYAN', radius: 135, color: 'rainbow', secondaryColor: '#FFD700', points: 100, expression: 'rainbow' }
];

// Rainbow colors for effects
const RAINBOW_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

// Game configuration
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const DROP_ZONE_HEIGHT = 80;
const WALL_THICKNESS = 20;
const DROP_COOLDOWN = 500;

// Animation state
let animationFrame = 0;
let sparkles = [];

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
    engine = Engine.create();
    engine.gravity.y = 1;

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

    const walls = [
        Bodies.rectangle(-WALL_THICKNESS/2, GAME_HEIGHT/2, WALL_THICKNESS, GAME_HEIGHT, { 
            isStatic: true, 
            render: { fillStyle: '#8B4513' },
            label: 'wall'
        }),
        Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS/2, GAME_HEIGHT/2, WALL_THICKNESS, GAME_HEIGHT, { 
            isStatic: true, 
            render: { fillStyle: '#8B4513' },
            label: 'wall'
        }),
        Bodies.rectangle(GAME_WIDTH/2, GAME_HEIGHT + WALL_THICKNESS/2, GAME_WIDTH + WALL_THICKNESS*2, WALL_THICKNESS, { 
            isStatic: true, 
            render: { fillStyle: '#8B4513' },
            label: 'wall'
        })
    ];
    
    Composite.add(engine.world, walls);

    Events.on(engine, 'collisionStart', handleCollision);
    Events.on(render, 'afterRender', drawCatFaces);

    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);

    const canvas_element = document.getElementById('game-canvas');
    canvas_element.addEventListener('mousemove', (e) => {
        const rect = canvas_element.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
    });
    
    canvas_element.addEventListener('click', handleClick);
    canvas_element.addEventListener('touchstart', handleTouch);
    canvas_element.addEventListener('touchmove', handleTouchMove);

    document.getElementById('restart-btn').addEventListener('click', restartGame);

    updateScore();
    generateNextCat();
    populateCatGuide();
    
    setInterval(checkGameOver, 1000);
    
    // Animation loop for sparkles
    setInterval(() => {
        animationFrame++;
        // Update sparkles
        sparkles = sparkles.filter(s => s.life > 0);
        sparkles.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.life--;
            s.size *= 0.95;
        });
    }, 50);
}

function generateNextCat() {
    currentCatType = nextCatType;
    nextCatType = Math.floor(Math.random() * 5);
    updateNextCatDisplay();
}

function updateNextCatDisplay() {
    const display = document.getElementById('next-cat-display');
    const cat = CAT_TYPES[nextCatType];
    
    // Create a mini canvas for the preview
    display.innerHTML = `<canvas id="preview-canvas" width="50" height="50"></canvas>`;
    const previewCanvas = document.getElementById('preview-canvas');
    const ctx = previewCanvas.getContext('2d');
    
    // Draw mini cat
    drawCatPreview(ctx, 25, 25, Math.min(cat.radius * 0.6, 20), cat, nextCatType);
}

function drawCatPreview(ctx, x, y, r, cat, typeIndex) {
    ctx.save();
    ctx.translate(x, y);
    
    // Body
    const gradient = ctx.createRadialGradient(0, -r * 0.2, 0, 0, 0, r);
    gradient.addColorStop(0, lightenColor(cat.color === 'rainbow' ? '#FFB7C5' : cat.color, 40));
    gradient.addColorStop(1, cat.color === 'rainbow' ? '#FFB7C5' : cat.color);
    
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Simple face
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Blush
    ctx.fillStyle = 'rgba(255, 150, 180, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.5, r * 0.2, r * 0.2, r * 0.12, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.5, r * 0.2, r * 0.2, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function handleClick(e) {
    if (!canDrop || gameOver) return;
    dropCat(mouseX);
}

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

function dropCat(x) {
    const cat = CAT_TYPES[currentCatType];
    
    const minX = cat.radius + 5;
    const maxX = GAME_WIDTH - cat.radius - 5;
    x = Math.max(minX, Math.min(maxX, x));
    
    const body = createCatBody(x, DROP_ZONE_HEIGHT / 2, currentCatType);
    Composite.add(engine.world, body);
    
    setTimeout(() => {
        droppedBodies.add(body.id);
    }, 500);
    
    canDrop = false;
    generateNextCat();
    
    setTimeout(() => {
        canDrop = true;
    }, DROP_COOLDOWN);
}

function createCatBody(x, y, typeIndex) {
    const cat = CAT_TYPES[typeIndex];
    const body = Bodies.circle(x, y, cat.radius, {
        restitution: 0.2,
        friction: 0.5,
        frictionAir: 0.01,
        density: 0.001,
        label: `cat_${typeIndex}`,
        render: {
            fillStyle: 'transparent',
            strokeStyle: 'transparent',
            lineWidth: 0
        }
    });
    body.catType = typeIndex;
    return body;
}

function handleCollision(event) {
    const pairs = event.pairs;
    
    for (let pair of pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        if (bodyA.catType !== undefined && bodyB.catType !== undefined) {
            if (bodyA.catType === bodyB.catType && bodyA.catType < CAT_TYPES.length - 1) {
                pendingMerges.push({ bodyA, bodyB });
            }
        }
    }
}

function processMerges() {
    const processed = new Set();
    
    for (let merge of pendingMerges) {
        const { bodyA, bodyB } = merge;
        
        if (processed.has(bodyA.id) || processed.has(bodyB.id)) continue;
        if (!Composite.get(engine.world, bodyA.id, 'body')) continue;
        if (!Composite.get(engine.world, bodyB.id, 'body')) continue;
        
        processed.add(bodyA.id);
        processed.add(bodyB.id);
        
        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;
        
        Composite.remove(engine.world, bodyA);
        Composite.remove(engine.world, bodyB);
        droppedBodies.delete(bodyA.id);
        droppedBodies.delete(bodyB.id);
        
        const newTypeIndex = bodyA.catType + 1;
        const newBody = createCatBody(midX, midY, newTypeIndex);
        Composite.add(engine.world, newBody);
        droppedBodies.add(newBody.id);
        
        score += CAT_TYPES[newTypeIndex].points;
        updateScore();
        
        createMergeEffect(midX, midY, newTypeIndex);
    }
    
    pendingMerges = [];
}

function createMergeEffect(x, y, typeIndex) {
    // Add sparkles
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        sparkles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 20,
            size: 8 + Math.random() * 8,
            color: RAINBOW_COLORS[i % RAINBOW_COLORS.length],
            type: Math.random() > 0.5 ? 'star' : 'circle'
        });
    }
    
    // Create DOM particles
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        const color = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
        particle.innerHTML = ['✨', '⭐', '💖', '🌟', '💫'][Math.floor(Math.random() * 5)];
        particle.style.cssText = `
            position: fixed;
            font-size: 20px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        
        particle.style.left = (rect.left + x) + 'px';
        particle.style.top = (rect.top + y) + 'px';
        
        document.body.appendChild(particle);
        
        const angle = (i / 8) * Math.PI * 2;
        const distance = 60;
        
        particle.animate([
            { transform: 'scale(0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(1.5) rotate(360deg)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

function drawCatFaces() {
    const ctx = render.context;
    const bodies = Composite.allBodies(engine.world);
    
    // Draw sparkles first (background)
    drawSparkles(ctx);
    
    // Draw drop zone indicator
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, DROP_ZONE_HEIGHT);
    ctx.lineTo(GAME_WIDTH, DROP_ZONE_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    
    // Draw preview
    if (canDrop && !gameOver) {
        const cat = CAT_TYPES[currentCatType];
        const previewX = Math.max(cat.radius + 5, Math.min(GAME_WIDTH - cat.radius - 5, mouseX));
        
        // Rainbow drop line
        ctx.save();
        const lineGradient = ctx.createLinearGradient(0, DROP_ZONE_HEIGHT, 0, GAME_HEIGHT);
        RAINBOW_COLORS.forEach((color, i) => {
            lineGradient.addColorStop(i / (RAINBOW_COLORS.length - 1), color + '60');
        });
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(previewX, DROP_ZONE_HEIGHT / 2 + cat.radius);
        ctx.lineTo(previewX, GAME_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        
        // Draw preview cat
        ctx.save();
        ctx.globalAlpha = 0.7;
        drawNyanCat(ctx, previewX, DROP_ZONE_HEIGHT / 2, cat, currentCatType);
        ctx.restore();
    }
    
    // Draw actual cats
    for (let body of bodies) {
        if (body.catType !== undefined) {
            const cat = CAT_TYPES[body.catType];
            drawNyanCat(ctx, body.position.x, body.position.y, cat, body.catType, body.angle);
        }
    }
    
    processMerges();
}

function drawSparkles(ctx) {
    for (let sparkle of sparkles) {
        ctx.save();
        ctx.translate(sparkle.x, sparkle.y);
        ctx.globalAlpha = sparkle.life / 20;
        ctx.fillStyle = sparkle.color;
        
        if (sparkle.type === 'star') {
            drawStar(ctx, 0, 0, 5, sparkle.size, sparkle.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, sparkle.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// Main Nyan Cat drawing function - KAWAII STYLE!
function drawNyanCat(ctx, x, y, cat, typeIndex, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    const r = cat.radius;
    const isRainbow = cat.color === 'rainbow';
    const bobOffset = Math.sin(animationFrame * 0.3 + typeIndex) * 2;
    
    // Rainbow trail for special cats (type 8+)
    if (typeIndex >= 8) {
        drawRainbowTrail(ctx, r);
    }
    
    // Pop-tart body (rounded rectangle like Nyan Cat!)
    ctx.save();
    ctx.translate(0, bobOffset);
    
    // Body base color
    let bodyColor = isRainbow ? getRainbowGradient(ctx, r) : cat.color;
    let bodyGradient;
    
    if (isRainbow) {
        bodyGradient = ctx.createLinearGradient(-r, -r, r, r);
        RAINBOW_COLORS.forEach((color, i) => {
            bodyGradient.addColorStop(i / (RAINBOW_COLORS.length - 1), color);
        });
    } else {
        bodyGradient = ctx.createRadialGradient(0, -r * 0.3, 0, 0, 0, r);
        bodyGradient.addColorStop(0, lightenColor(cat.color, 50));
        bodyGradient.addColorStop(0.7, cat.color);
        bodyGradient.addColorStop(1, darkenColor(cat.color, 10));
    }
    
    // Main body (slightly rounded square like pop-tart)
    const bodySize = r * 0.85;
    ctx.beginPath();
    roundedRect(ctx, -bodySize, -bodySize, bodySize * 2, bodySize * 2, r * 0.3);
    ctx.fillStyle = bodyGradient;
    ctx.fill();
    
    // Pop-tart frosting/sprinkles pattern
    if (typeIndex >= 3) {
        drawSprinkles(ctx, bodySize, cat.secondaryColor);
    }
    
    // Outer glow for bigger cats
    if (typeIndex >= 6) {
        ctx.shadowColor = cat.secondaryColor;
        ctx.shadowBlur = 15;
    }
    
    // Cat face area (gray overlay)
    const faceSize = r * 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, faceSize, 0, Math.PI * 2);
    ctx.fillStyle = '#808080';
    ctx.fill();
    
    // Ears
    drawKawaiiEars(ctx, r, '#808080', '#FFB6C1');
    
    // Face based on expression
    drawKawaiiFace(ctx, r, cat.expression, typeIndex);
    
    ctx.restore(); // Remove bob offset
    
    // Floating stars/hearts for special cats
    if (typeIndex >= 5) {
        drawFloatingEffects(ctx, r, typeIndex);
    }
    
    ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

function drawSprinkles(ctx, size, color) {
    ctx.save();
    const sprinkleColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + animationFrame * 0.02;
        const dist = size * 0.5;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;
        
        ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
        ctx.beginPath();
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
    }
    ctx.restore();
}

function drawRainbowTrail(ctx, r) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    
    const trailLength = r * 1.5;
    RAINBOW_COLORS.forEach((color, i) => {
        const yOffset = (i - 3) * (r * 0.15);
        ctx.fillStyle = color;
        ctx.fillRect(-r - trailLength, yOffset - r * 0.06, trailLength, r * 0.12);
    });
    
    ctx.restore();
}

function drawKawaiiEars(ctx, r, baseColor, innerColor) {
    const earSize = r * 0.4;
    const earOffset = r * 0.45;
    const earY = -r * 0.55;
    
    // Left ear
    ctx.beginPath();
    ctx.moveTo(-earOffset - earSize * 0.4, earY);
    ctx.lineTo(-earOffset, earY - earSize);
    ctx.lineTo(-earOffset + earSize * 0.4, earY);
    ctx.closePath();
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Left ear inner
    ctx.beginPath();
    ctx.moveTo(-earOffset - earSize * 0.2, earY - earSize * 0.1);
    ctx.lineTo(-earOffset, earY - earSize * 0.6);
    ctx.lineTo(-earOffset + earSize * 0.2, earY - earSize * 0.1);
    ctx.closePath();
    ctx.fillStyle = innerColor;
    ctx.fill();
    
    // Right ear
    ctx.beginPath();
    ctx.moveTo(earOffset - earSize * 0.4, earY);
    ctx.lineTo(earOffset, earY - earSize);
    ctx.lineTo(earOffset + earSize * 0.4, earY);
    ctx.closePath();
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.stroke();
    
    // Right ear inner
    ctx.beginPath();
    ctx.moveTo(earOffset - earSize * 0.2, earY - earSize * 0.1);
    ctx.lineTo(earOffset, earY - earSize * 0.6);
    ctx.lineTo(earOffset + earSize * 0.2, earY - earSize * 0.1);
    ctx.closePath();
    ctx.fillStyle = innerColor;
    ctx.fill();
}

function drawKawaiiFace(ctx, r, expression, typeIndex) {
    const eyeSpacing = r * 0.25;
    const eyeY = -r * 0.1;
    const eyeSize = r * 0.18;
    
    switch(expression) {
        case 'happy':
            drawHappyEyes(ctx, eyeSpacing, eyeY, eyeSize);
            break;
        case 'kawaii':
            drawKawaiiEyes(ctx, eyeSpacing, eyeY, eyeSize);
            break;
        case 'blep':
            drawBlepFace(ctx, eyeSpacing, eyeY, eyeSize, r);
            break;
        case 'star':
            drawStarEyes(ctx, eyeSpacing, eyeY, eyeSize);
            break;
        case 'love':
            drawLoveEyes(ctx, eyeSpacing, eyeY, eyeSize);
            break;
        case 'rainbow':
            drawRainbowEyes(ctx, eyeSpacing, eyeY, eyeSize);
            break;
        default:
            drawHappyEyes(ctx, eyeSpacing, eyeY, eyeSize);
    }
    
    // Nose (small pink triangle)
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.05);
    ctx.lineTo(-r * 0.06, r * 0.15);
    ctx.lineTo(r * 0.06, r * 0.15);
    ctx.closePath();
    ctx.fill();
    
    // Mouth - cute "w" shape or ":3"
    if (expression !== 'blep') {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // :3 mouth
        ctx.beginPath();
        ctx.arc(-r * 0.1, r * 0.25, r * 0.08, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(r * 0.1, r * 0.25, r * 0.08, 0, Math.PI);
        ctx.stroke();
    }
    
    // Whiskers
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    
    // Left whiskers
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.25, r * 0.2 + i * r * 0.08);
        ctx.lineTo(-r * 0.55, r * 0.15 + i * r * 0.12);
        ctx.stroke();
    }
    
    // Right whiskers
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(r * 0.25, r * 0.2 + i * r * 0.08);
        ctx.lineTo(r * 0.55, r * 0.15 + i * r * 0.12);
        ctx.stroke();
    }
    
    // Blush circles
    ctx.fillStyle = 'rgba(255, 150, 180, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, r * 0.15, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.4, r * 0.15, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawHappyEyes(ctx, spacing, y, size) {
    // Big sparkly anime eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(-spacing, y, size, size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(spacing, y, size, size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Sparkle/shine
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-spacing - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(spacing - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Small secondary shine
    ctx.beginPath();
    ctx.arc(-spacing + size * 0.2, y + size * 0.2, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(spacing + size * 0.2, y + size * 0.2, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
}

function drawKawaiiEyes(ctx, spacing, y, size) {
    // ^_^ closed happy eyes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Left eye arc
    ctx.beginPath();
    ctx.arc(-spacing, y, size, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    
    // Right eye arc
    ctx.beginPath();
    ctx.arc(spacing, y, size, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
}

function drawBlepFace(ctx, spacing, y, size, r) {
    // Normal eyes
    drawHappyEyes(ctx, spacing, y, size);
    
    // Tongue sticking out (blep!)
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.35, r * 0.08, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E05080';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawStarEyes(ctx, spacing, y, size) {
    // Star-shaped eyes!
    ctx.fillStyle = '#FFD700';
    drawStar(ctx, -spacing, y, 5, size * 1.2, size * 0.5);
    drawStar(ctx, spacing, y, 5, size * 1.2, size * 0.5);
    
    // Inner star shine
    ctx.fillStyle = 'white';
    drawStar(ctx, -spacing, y, 5, size * 0.5, size * 0.2);
    drawStar(ctx, spacing, y, 5, size * 0.5, size * 0.2);
}

function drawLoveEyes(ctx, spacing, y, size) {
    // Heart-shaped eyes!
    ctx.fillStyle = '#FF69B4';
    drawHeart(ctx, -spacing, y, size * 1.5);
    drawHeart(ctx, spacing, y, size * 1.5);
    
    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(-spacing - size * 0.2, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(spacing - size * 0.2, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawRainbowEyes(ctx, spacing, y, size) {
    // Rainbow spiral eyes for the ultimate cat!
    const time = animationFrame * 0.1;
    
    for (let i = 0; i < 7; i++) {
        const ringSize = size * (1.3 - i * 0.15);
        ctx.fillStyle = RAINBOW_COLORS[(i + Math.floor(time)) % RAINBOW_COLORS.length];
        ctx.beginPath();
        ctx.arc(-spacing, y, ringSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(spacing, y, ringSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Center shine
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-spacing, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(spacing, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, size * 0.1, 0, size * 0.8);
    ctx.bezierCurveTo(size, size * 0.1, size * 0.5, -size * 0.3, 0, size * 0.3);
    ctx.fill();
    ctx.restore();
}

function drawFloatingEffects(ctx, r, typeIndex) {
    const time = animationFrame * 0.1;
    const numEffects = Math.min(typeIndex - 4, 4);
    
    for (let i = 0; i < numEffects; i++) {
        const angle = time + (i / numEffects) * Math.PI * 2;
        const dist = r * 1.3;
        const ex = Math.cos(angle) * dist;
        const ey = Math.sin(angle) * dist + Math.sin(time * 2) * 5;
        
        ctx.save();
        ctx.translate(ex, ey);
        ctx.globalAlpha = 0.8;
        
        if (i % 2 === 0) {
            // Star
            ctx.fillStyle = '#FFD700';
            drawStar(ctx, 0, 0, 5, 8, 4);
        } else {
            // Heart
            ctx.fillStyle = '#FF69B4';
            drawHeart(ctx, 0, 0, 6);
        }
        
        ctx.restore();
    }
}

function getRainbowGradient(ctx, r) {
    const gradient = ctx.createLinearGradient(-r, -r, r, r);
    RAINBOW_COLORS.forEach((color, i) => {
        gradient.addColorStop(i / (RAINBOW_COLORS.length - 1), color);
    });
    return gradient;
}

function lightenColor(color, percent) {
    if (color === 'rainbow') return '#FFFFFF';
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

function darkenColor(color, percent) {
    if (color === 'rainbow') return '#888888';
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('suikaCatsBest', bestScore);
    }
    document.getElementById('best-score').textContent = bestScore;
}

function checkGameOver() {
    if (gameOver) return;
    
    const bodies = Composite.allBodies(engine.world);
    
    for (let body of bodies) {
        if (body.catType !== undefined && droppedBodies.has(body.id)) {
            if (body.position.y - CAT_TYPES[body.catType].radius < DROP_ZONE_HEIGHT) {
                const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
                if (speed < 0.5) {
                    triggerGameOver();
                    return;
                }
            }
        }
    }
}

function triggerGameOver() {
    gameOver = true;
    canDrop = false;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-overlay').classList.remove('hidden');
}

function restartGame() {
    const bodies = Composite.allBodies(engine.world);
    for (let body of bodies) {
        if (body.label !== 'wall') {
            Composite.remove(engine.world, body);
        }
    }
    
    score = 0;
    gameOver = false;
    canDrop = true;
    droppedBodies.clear();
    pendingMerges = [];
    sparkles = [];
    
    updateScore();
    generateNextCat();
    document.getElementById('game-over-overlay').classList.add('hidden');
}

function populateCatGuide() {
    const guideList = document.getElementById('cat-guide-list');
    guideList.innerHTML = '';
    
    CAT_TYPES.forEach((cat, index) => {
        const item = document.createElement('div');
        item.className = 'guide-cat';
        const bgColor = cat.color === 'rainbow' ? 
            'linear-gradient(45deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' : 
            cat.color;
        item.innerHTML = `
            <div class="guide-cat-icon" style="background: ${bgColor};">
                <span style="font-size: 14px;">🐱</span>
            </div>
            <span>${cat.name}</span>
        `;
        guideList.appendChild(item);
    });
}

window.addEventListener('load', init);
