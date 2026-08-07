// DungeonsTower Generator V2 - Canvas Renderer Module (canvasRenderer.js)

// Color palette mapping for all tile and room types
const TILE_COLORS = {
    0: '#0f172a',            // Wall (Dark Slate)
    1: '#334155',            // Path (Sleek Slate Blue)
    'START': '#059669',      // Start Room / Entrance (Emerald)
    'STAIRS_UP': '#334155',  // Stairs Up (Path background)
    'STAIRS_DOWN': '#334155',// Stairs Down (Path background)
    'BOSS': '#dc2626',       // Boss Chamber (Crimson Red)
    'MINI_BOSS': '#ea580c',  // MiniBoss Arena (Orange)
    'TRAP': '#334155',       // Trap (Path background)
    'SECRET': '#0891b2',     // Secret Room (Cyan)
    'ROOM': '#4f46e5',       // Normal / Custom Room (Indigo)
    'TREASURE': '#0891b2',   // Legacy Treasure
    'PUZZLE': '#ea580c',     // Legacy Puzzle
    'MONSTER': '#334155',    // Monster Spawn (Path background)
    'DOOR': '#334155',       // Locked Door (Path background)
    'QUEST_ITEM': '#334155', // Key / Quest Item (Path background)
    'SHOP': '#334155',       // Merchant Shop NPC (Path background)
    'PORTAL': '#334155',     // Teleport Portal (Path background)
    'BREAKABLE': '#78350f'   // Breakable Wall (Brown)
};

export const TILE_EMOJIS = {
    'START': '🏁',
    'STAIRS_UP': '⬆️',
    'STAIRS_DOWN': '⬇️',
    'BOSS': '👑',
    'MINI_BOSS': '👹',
    'TRAP': '💣',
    'SECRET': '💎',
    'ROOM': '🏛️',
    'TREASURE': '💎',
    'PUZZLE': '💣',
    'MONSTER': '🧟',
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
    'TRAP': 'rgba(255, 255, 255, 0.7)',
    'SECRET': 'rgba(255, 255, 255, 0.7)',
    'ROOM': 'rgba(255, 255, 255, 0.7)',
    'TREASURE': 'rgba(255, 255, 255, 0.7)',
    'PUZZLE': 'rgba(255, 255, 255, 0.7)'
};

export function renderFloorCanvas(container, floorData, showGuidePath = false, hoveredCell = null) {
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

    // 1. Draw Grid Matrix Tiles (Smooth Continuous Path & Wall Surfaces)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = grid[r][c];
            const x = c * cellSize;
            const y = r * cellSize;

            // Fill solid background color for tile/room
            ctx.fillStyle = TILE_COLORS[val] || TILE_COLORS[1];
            ctx.fillRect(x, y, cellSize, cellSize);

            // Draw Emoji icons ONLY for special tiles (Stairs, Doors, Traps, Monsters, Keys, etc.)
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

    // 4. Hovered Cell Highlight Ring
    if (hoveredCell && hoveredCell.r >= 0 && hoveredCell.r < rows && hoveredCell.c >= 0 && hoveredCell.c < cols) {
        const hx = hoveredCell.c * cellSize;
        const hy = hoveredCell.r * cellSize;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.fillRect(hx, hy, cellSize, cellSize);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
    }

    container.appendChild(canvas);
}
