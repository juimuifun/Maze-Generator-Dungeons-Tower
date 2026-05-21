function placeEntities(grid, currentFloor, totalFloors, encounterDifficulty, rng, shortestPath, endPoint) {
    const length = grid.length;
    const width = grid[0].length;

    const area = width * length;
    
    // 1. Quota System: Scale limits based on maze area and encounterDifficulty (1-10)
    let quotas = {
        MINI_BOSS: Math.ceil(encounterDifficulty / 3), // Max 1-4 MiniBosses per floor based on diff
        TRAP: Math.ceil((area / 100) * (encounterDifficulty / 3)), 
        MONSTER: Math.ceil((area / 50) * (encounterDifficulty / 3)),
        SECRET: Math.ceil((area / 150) * (encounterDifficulty / 2)) + 1 // Reward Scaling: More secrets at higher difficulties
    };

    // Track placed entities to enforce Safe Radius spacing
    let placed = {
        MINI_BOSS: [],
        TRAP: [],
        MONSTER: [],
        SECRET: []
    };

    // Safe Radius definitions (Manhattan Distance)
    const RADIUS = {
        MINI_BOSS: 5, // Keep mini-bosses far apart
        TRAP: 3,      // Traps shouldn't clump
        MONSTER: 2    // General spawners spacing
    };

    const getDist = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

    function canPlace(x, y, type) {
        if (quotas[type] <= 0) return false;
        
        let minRadius = RADIUS[type];
        if (!minRadius) return true; // Secrets don't strictly need spacing

        // Enforce Same-Type Spacing
        for (let p of placed[type]) {
            if (getDist(x, y, p.x, p.y) < minRadius) return false;
        }
        
        // Cross-Type Spacing: Prevent Traps from spawning right next to MiniBosses (Clumping prevention)
        if (type === 'MINI_BOSS' || type === 'TRAP') {
            for (let p of placed['MINI_BOSS']) {
                if (getDist(x, y, p.x, p.y) < 3) return false;
            }
            for (let p of placed['TRAP']) {
                if (getDist(x, y, p.x, p.y) < 2) return false;
            }
        }

        return true;
    }

    function place(x, y, type) {
        // Only overwrite normal path (1) to prevent breaking STAIRS, START, or PRE-ALLOCATED rooms
        if (grid[y][x] === 1) {
            grid[y][x] = type;
            quotas[type]--;
            placed[type].push({x, y});
        }
    }

    const getConnections = (x, y) => {
        let count = 0;
        if (y > 0 && grid[y-1][x] !== 0) count++;
        if (y < length - 1 && grid[y+1][x] !== 0) count++;
        if (x > 0 && grid[y][x-1] !== 0) count++;
        if (x < width - 1 && grid[y][x+1] !== 0) count++;
        return count;
    };

    // 2. Pacing on the Main Path (Guide Path)
    // Guarantee 'Safe Rooms' (empty spaces) between encounters on the primary route to the exit
    if (shortestPath && shortestPath.length > 0) {
        let cellsSinceLastEncounter = 0;
        for (let i = 1; i < shortestPath.length - 1; i++) {
            let pos = shortestPath[i];
            if (grid[pos.y][pos.x] !== 1) continue; // Skip Pre-allocated rooms

            cellsSinceLastEncounter++;

            // Safe Room check: Guarantee at least 3 blocks of walking space before next encounter
            if (cellsSinceLastEncounter >= 3) {
                let rand = rng();
                
                // Scale placement chances on main path based on difficulty
                let mbChance = 0.05 + (encounterDifficulty * 0.01);
                let trapChance = 0.15 + (encounterDifficulty * 0.02);
                let monsterChance = 0.30 + (encounterDifficulty * 0.03);

                if (rand < mbChance && canPlace(pos.x, pos.y, 'MINI_BOSS')) {
                    place(pos.x, pos.y, 'MINI_BOSS');
                    cellsSinceLastEncounter = 0;
                } else if (rand < trapChance && canPlace(pos.x, pos.y, 'TRAP')) {
                    place(pos.x, pos.y, 'TRAP');
                    cellsSinceLastEncounter = 0;
                } else if (rand < monsterChance && canPlace(pos.x, pos.y, 'MONSTER')) {
                    place(pos.x, pos.y, 'MONSTER');
                    cellsSinceLastEncounter = 0;
                }
            }
        }
    }

    // 3. Off-Path Placement (Dead ends and side loops)
    for (let y = 1; y < length - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (grid[y][x] === 1) {
                let isDeadEnd = getConnections(x, y) === 1;
                let rand = rng();

                // High chance to place rewards/secrets at dead ends (Scales with difficulty)
                if (isDeadEnd) {
                    let secretChance = 0.3 + (encounterDifficulty * 0.05);
                    if (rand < secretChance && canPlace(x, y, 'SECRET')) {
                        place(x, y, 'SECRET');
                        continue; // Skip further checks if placed
                    }
                }

                // Sprinkle remaining quotas into the off-path maze
                let mbChance = 0.01 + (encounterDifficulty * 0.005);
                let trapChance = 0.05 + (encounterDifficulty * 0.01);
                let monsterChance = 0.10 + (encounterDifficulty * 0.02);

                if (rand < mbChance && canPlace(x, y, 'MINI_BOSS')) {
                    place(x, y, 'MINI_BOSS');
                } else if (rand < trapChance && canPlace(x, y, 'TRAP')) {
                    place(x, y, 'TRAP');
                } else if (rand < monsterChance && canPlace(x, y, 'MONSTER')) {
                    place(x, y, 'MONSTER');
                }
            }
        }
    }

    return grid;
}

export { placeEntities };
