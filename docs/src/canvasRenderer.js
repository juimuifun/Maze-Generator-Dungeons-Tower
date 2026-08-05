// DungeonsTower Generator V2 - Canvas Renderer Module (canvasRenderer.js)

// Color palette mapping for all tile and room types
const TILE_COLORS = {
    0: '#0f172a',            // Wall (Dark Slate Black)
    1: '#1e293b',            // Path (Dark Navy Slate)
    'START': '#10b981',      // Start Room / Entrance (Solid Emerald Green)
    'STAIRS_UP': '#3b82f6',  // Stairs Up (Bright Royal Blue)
    'STAIRS_DOWN': '#6366f1',// Stairs Down (Indigo)
    'BOSS': '#ef4444',       // Boss Chamber (Solid Crimson Red)
    'MINI_BOSS': '#f97316',  // MiniBoss Arena (Solid Vibrant Orange)
    'TREASURE': '#eab308',   // Treasure Vault (Solid Gold Yellow)
    'PUZZLE': '#a855f7',     // Puzzle Room (Solid Purple)
    'MONSTER': '#a855f7',   // Monster Spawn (Purple)
    'TRAP': '#eab308',      // Trap / Hazard (Warning Yellow)
    'SECRET': '#06b6d4',    // Secret Chest (Cyan)
    'DOOR': '#84cc16',      // Locked Door (Lime Green)
    'QUEST_ITEM': '#ec4899',// Key / Quest Item (Pink)
    'SHOP': '#14b8a6',      // Merchant Shop NPC (Teal)
    'PORTAL': '#8b5cf6',    // Teleport Portal (Violet)
    'BREAKABLE': '#78350f'  // Breakable Wall (Brown)
};

const TILE_EMOJIS = {
    'START': '🏁',
    'STAIRS_UP': '⬆️',
    'STAIRS_DOWN': '⬇️',
    'BOSS': '👑',
    'MINI_BOSS': '👹',
    'TREASURE': '💎',
    'PUZZLE': '🧩',
    'MONSTER': '🧟',
    'TRAP': '💣',
    'SECRET': '💎',
    'DOOR': '🚪',
    'QUEST_ITEM': '🔑',
    'SHOP': '🛒',
    'PORTAL': '🌀',
    'BREAKABLE': '🧱'
};

const ROOM_STROKES = {
    'BOSS': 'rgba(255, 255, 255, 0.7)',
    'MINI_BOSS': 'rgba(255, 255, 255, 0.7)',
    'START': 'rgba(255, 255, 255, 0.7)',
    'TREASURE': 'rgba(255, 255, 255, 0.7)',
    'PUZZLE': 'rgba(255, 255, 255, 0.7)'
};

export function renderFloorCanvas(container, floorData, showGuidePath = false) {
    if (!container || !floorData) return;

    const grid = floorData.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    // Calculate canvas tile size (min 16px, max 36px based on container dimension)
    const cellSize = Math.max(16, Math.min(36, Math.floor(650 / Math.max(rows, cols))));
    const canvasWidth = cols * cellSize;
    const canvasHeight = rows * cellSize;

    // Clear container and append canvas element
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'mazeCanvas';
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.borderRadius = '8px';
    canvas.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';

    const ctx = canvas.getContext('2d');

    // 1. Draw Grid Matrix Tiles (Solid Room & Path Fill)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = grid[r][c];
            const x = c * cellSize;
            const y = r * cellSize;

            // Fill solid background color for tile/room
            ctx.fillStyle = TILE_COLORS[val] || TILE_COLORS[1];
            ctx.fillRect(x, y, cellSize, cellSize);

            // Cell grid border line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);

            // Draw Emoji icons for all special tiles (START, BOSS, MINI_BOSS, Stairs, Doors, Traps, etc.)
            if (TILE_EMOJIS[val]) {
                ctx.font = `${Math.floor(cellSize * 0.65)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(TILE_EMOJIS[val], x + cellSize / 2, y + cellSize / 2);
            }
        }
    }

    // 2. Draw Special Room Outlines & Center Entity Icons
    if (floorData.rooms && floorData.rooms.length > 0) {
        floorData.rooms.forEach(rm => {
            if (!rm.bounds) return;
            const rx = rm.bounds.x * cellSize;
            const ry = rm.bounds.y * cellSize;
            const rw = rm.bounds.width * cellSize;
            const rh = rm.bounds.height * cellSize;

            // Draw clean white room border outline
            ctx.strokeStyle = ROOM_STROKES[rm.type] || 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(rx, ry, rw, rh);

            // Draw 1 single center emoji icon inside the room
            if (rm.center && TILE_EMOJIS[rm.type]) {
                const cx = rm.center.x * cellSize + cellSize / 2;
                const cy = rm.center.y * cellSize + cellSize / 2;
                ctx.font = `${Math.floor(cellSize * 0.75)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(TILE_EMOJIS[rm.type], cx, cy);
            }

            // Draw Room Title Tag at top-left of the room
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.font = `bold ${Math.max(9, Math.floor(cellSize * 0.42))}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(rm.name || rm.type, rx + 4, ry + 3);
            ctx.shadowBlur = 0; // reset shadow
        });
    }

    // 3. Optional Guide Path Overlay (BFS solution line)
    if (showGuidePath && floorData.guidePath && floorData.guidePath.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = Math.max(3, Math.floor(cellSize * 0.25));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        floorData.guidePath.forEach((pt, idx) => {
            const px = pt.x * cellSize + cellSize / 2;
            const py = pt.y * cellSize + cellSize / 2;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });

        ctx.stroke();
    }

    container.appendChild(canvas);
}
