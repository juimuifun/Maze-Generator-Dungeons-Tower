// DungeonsTower Generator V2 - Core Maze Generator Engine (mazeGenerator.js)

// Seeded Pseudo-Random Number Generator (Mulberry32)
export function createPRNG(seedStr) {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
    }
    let a = h;
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Convert 0-indexed grid coordinates (x, y) into Battleship/Chess-style notation (X = A, B, C..., Y = 1, 2, 3...)
export function toGridNotation(x, y) {
    let colLetter = '';
    let tempX = x;
    while (tempX >= 0) {
        colLetter = String.fromCharCode(65 + (tempX % 26)) + colLetter;
        tempX = Math.floor(tempX / 26) - 1;
    }
    const rowNum = y + 1; // 1-indexed row number
    return `${colLetter}${rowNum}`;
}

// Calculate Minecraft 3D Spatial Area (bounding box coordinates)
export function calculateMinecraftArea(x, y, floorNum, pathWidth = 3, floorHeight = 5, widthSpan = 1, heightSpan = 1, foundationHeight = 5, floorGap = 5) {
    const startX = x * pathWidth;
    const endX = (x + widthSpan) * pathWidth - 1;
    const startZ = y * pathWidth;
    const endZ = (y + heightSpan) * pathWidth - 1;
    const startY = foundationHeight + (floorNum - 1) * (floorHeight + floorGap);
    const endY = startY + floorHeight - 1;

    return {
        startX,
        startY,
        startZ,
        endX,
        endY,
        endZ,
        sizeX: (endX - startX + 1),
        sizeY: (endY - startY + 1),
        sizeZ: (endZ - startZ + 1)
    };
}

// Helper to ensure STAIRS_UP and STAIRS_DOWN have only 1 entrance/exit (single path connection)
export function enforceSingleEntranceForStairs(grid, width, length, pos, preferredNeighbor = null) {
    if (!pos || pos.x < 0 || pos.y < 0 || pos.x >= width || pos.y >= length) return;

    const dirs = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }
    ];

    const openNeighbors = [];
    for (const d of dirs) {
        const nx = pos.x + d.dx;
        const ny = pos.y + d.dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < length && grid[ny][nx] !== 0) {
            openNeighbors.push({ x: nx, y: ny });
        }
    }

    if (openNeighbors.length > 1) {
        let keep = null;
        if (preferredNeighbor) {
            keep = openNeighbors.find(n => n.x === preferredNeighbor.x && n.y === preferredNeighbor.y);
        }
        if (!keep) {
            keep = openNeighbors[0];
        }

        for (const n of openNeighbors) {
            if (n.x !== keep.x || n.y !== keep.y) {
                grid[n.y][n.x] = 0; // Wall off extra openings so stairs tile has only 1 entrance/exit
            }
        }
    }
}

// Calculate Shape and Direction matching for grid cells (CORNER, STRAIGHT, T_JUNCTION, CROSSROAD, DEAD_END)
export function calculateTileShape(grid, x, y, width, length) {
    const tileVal = grid[y][x];
    if (tileVal === 0) return 'WALL';


    const n = (y > 0 && grid[y - 1][x] !== 0);
    const s = (y < length - 1 && grid[y + 1][x] !== 0);
    const e = (x < width - 1 && grid[y][x + 1] !== 0);
    const w = (x > 0 && grid[y][x - 1] !== 0);

    const count = (n ? 1 : 0) + (s ? 1 : 0) + (e ? 1 : 0) + (w ? 1 : 0);

    if (count === 4) return 'CROSSROAD';

    if (count === 3) {
        if (!n) return 'T_JUNCTION_E_S_W';
        if (!s) return 'T_JUNCTION_W_N_E';
        if (!e) return 'T_JUNCTION_S_W_N';
        if (!w) return 'T_JUNCTION_N_E_S';
    }

    if (count === 2) {
        if (n && s) return 'STRAIGHT_N_S';
        if (e && w) return 'STRAIGHT_E_W';
        if (n && e) return 'CORNER_N_E';
        if (s && e) return 'CORNER_S_E';
        if (s && w) return 'CORNER_S_W';
        if (n && w) return 'CORNER_N_W';
    }

    if (count === 1) {
        if (n) return 'DEAD_END_N';
        if (s) return 'DEAD_END_S';
        if (e) return 'DEAD_END_E';
        if (w) return 'DEAD_END_W';
    }

    return 'SINGLE_CELL';
}


// Helper to check room overlap with +1 block wall padding
function isRoomOverlap(rx, ry, rw, rh, placedRooms) {
    for (const rm of placedRooms) {
        if (!rm.bounds) continue;
        const b = rm.bounds;
        if (
            rx < b.x + b.width + 1 &&
            rx + rw + 1 > b.x &&
            ry < b.y + b.height + 1 &&
            ry + rh + 1 > b.y
        ) {
            return true;
        }
    }
    return false;
}

// 1. Core Multi-Floor Maze Generation Entry Point
export function generateMazeV2(config, customRooms = [], customItems = []) {
    let {
        width = 25,
        length = 25,
        floors = 3,
        pathWidth = 3,
        floorHeight = 5,
        foundationHeight = 5,
        floorGap = 5,
        startDirection = 'bottom',
        algorithm = 'dfs',
        mazeComplexity = 5,
        monsterDensity = 5,
        miniBossFreq = 5,
        trapDensity = 5,
        secretFreq = 5,
        seed = 'Dungeons2026'
    } = config;

    width = parseInt(width) || 25;
    length = parseInt(length) || 25;
    if (width % 2 === 0) width++;
    if (length % 2 === 0) length++;
    if (width < 5) width = 5;
    if (length < 5) length = 5;

    floors = parseInt(floors) || 1;
    pathWidth = parseInt(pathWidth) || 3;
    if (pathWidth % 2 === 0) pathWidth++;
    if (pathWidth < 1) pathWidth = 1;
    floorHeight = parseInt(floorHeight) || 5;
    foundationHeight = parseInt(foundationHeight) !== undefined && !isNaN(parseInt(foundationHeight)) ? parseInt(foundationHeight) : 5;
    floorGap = parseInt(floorGap) !== undefined && !isNaN(parseInt(floorGap)) ? parseInt(floorGap) : 5;

    const rng = createPRNG(seed);
    const generatedFloors = [];
    const autoGeneratedKeys = [];

    // Dynamic Floor Interval Cadence Algorithm
    let miniBossInterval;
    if (floors <= 3) {
        miniBossInterval = 2;
    } else if (floors <= 10) {
        miniBossInterval = Math.max(2, Math.round(11 - parseInt(miniBossFreq)));
    } else {
        const freqFactor = Math.max(1, parseInt(miniBossFreq));
        miniBossInterval = Math.max(3, Math.round((floors / (freqFactor * 2)) + 2));
    }

    let currentStartPoint = { x: 1, y: 1 };

    for (let f = 0; f < floors; f++) {
        const floorNum = f + 1;
        const isFirstFloor = (f === 0);
        const isFinalFloor = (f === floors - 1);
        const floorDoors = [];

        let grid = Array(length).fill(0).map(() => Array(width).fill(0));

        if (algorithm === 'prim') {
            carvePrims(grid, width, length, currentStartPoint, mazeComplexity, rng);
        } else if (algorithm === 'kruskal') {
            carveKruskals(grid, width, length, currentStartPoint, mazeComplexity, rng);
        } else {
            carveDFS(grid, width, length, currentStartPoint, mazeComplexity, rng);
        }

        let startPos = { ...currentStartPoint };

        // Place Special Rooms with Grid Notation Naming & Door-Key Syncing
        const placedRooms = placeSpecialRoomsOnFloor(
            grid, width, length, floorNum, floors,
            customRooms, customItems, autoGeneratedKeys, floorDoors, rng,
            pathWidth, floorHeight, foundationHeight, floorGap, miniBossInterval, startPos
        );
        let exitPos = null;

        const startRoom = placedRooms.find(r => r.type === 'START');

        if (isFirstFloor) {
            if (startRoom && startRoom.center) {
                startPos = { x: startRoom.center.x, y: startRoom.center.y };
            } else {
                grid[startPos.y][startPos.x] = 'START';
            }
        } else {
            if (grid[startPos.y][startPos.x] !== 0) {
                grid[startPos.y][startPos.x] = 'STAIRS_DOWN';
            }
        }

        // Find target destination and guide path from startPos on THIS floor
        let targetTile = null;
        if (isFinalFloor) {
            const bossRoom = placedRooms.find(r => r.type === 'BOSS');
            if (bossRoom) {
                if (bossRoom.center) {
                    targetTile = bossRoom.center;
                } else if (bossRoom.door && bossRoom.door.position) {
                    targetTile = bossRoom.door.position;
                }
            }
        }

        let guidePath = [];

        if (targetTile) {
            exitPos = targetTile;
            guidePath = findShortestPathBFS(grid, width, length, startPos, targetTile);
        } else {
            const pathResult = findFurthestPathBFS(grid, width, length, startPos);
            exitPos = pathResult.exitPos;
            guidePath = pathResult.path;
        }

        if (!isFinalFloor) {
            if (grid[exitPos.y][exitPos.x] === 1) {
                grid[exitPos.y][exitPos.x] = 'STAIRS_UP';
            }
        }

        // Enforce STAIRS_UP and STAIRS_DOWN to have ONLY ONE entrance/exit
        for (let r = 0; r < length; r++) {
            for (let c = 0; c < width; c++) {
                const val = grid[r][c];
                if (val === 'STAIRS_UP' || val === 'STAIRS_DOWN') {
                    let pref = null;
                    if (c === startPos.x && r === startPos.y && guidePath.length > 1) {
                        pref = guidePath[1];
                    } else if (c === exitPos.x && r === exitPos.y && guidePath.length > 1) {
                        pref = guidePath[guidePath.length - 2];
                    }
                    enforceSingleEntranceForStairs(grid, width, length, { x: c, y: r }, pref);
                }
            }
        }

        if (!isFinalFloor) {

            // MiniBoss Cadence Check: Place MiniBoss right before exit stairs ONLY IF no custom MINI_BOSS room was placed on this floor
            const hasCustomMiniBossRoom = placedRooms.some(r => r.type === 'MINI_BOSS');
            if (!hasCustomMiniBossRoom && floorNum % miniBossInterval === 0 && guidePath.length > 3) {
                const miniBossTile = guidePath[guidePath.length - 2];
                if (grid[miniBossTile.y][miniBossTile.x] === 1) {
                    grid[miniBossTile.y][miniBossTile.x] = 'MINI_BOSS';
                }
                
                // Place DOOR in front of MiniBoss on a non-intersection corridor tile
                let doorTile = null;
                for (let idx = guidePath.length - 3; idx >= 1; idx--) {
                    const pt = guidePath[idx];
                    if (grid[pt.y][pt.x] === 1) {
                        let openCount = 0;
                        for (const d of [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }]) {
                            if (grid[pt.y + d.dy] && grid[pt.y + d.dy][pt.x + d.dx] !== 0) openCount++;
                        }
                        if (openCount <= 2) {
                            doorTile = pt;
                            break;
                        }
                    }
                }
                if (!doorTile) doorTile = guidePath[guidePath.length - 3];

                if (doorTile && grid[doorTile.y][doorTile.x] === 1) {
                    grid[doorTile.y][doorTile.x] = 'DOOR';
                    const doorCoord = toGridNotation(doorTile.x, doorTile.y);
                    const miniBossKeyId = `key_miniboss_${doorCoord.toLowerCase()}_f${floorNum}`;
                    const miniBossKeyObj = {
                        id: miniBossKeyId,
                        type: 'KEY',
                        floorRule: `floor-${floorNum}`,
                        targetDoor: { x: doorTile.x, y: doorTile.y, gridNotation: doorCoord }
                    };
                    autoGeneratedKeys.push(miniBossKeyObj);
                    floorDoors.push({
                        id: `door-miniboss-f${floorNum}`,
                        position: { x: doorTile.x, y: doorTile.y, gridNotation: doorCoord },
                        floor: floorNum,
                        targetType: 'MINI_BOSS',
                        requiredKey: miniBossKeyObj,
                        minecraftArea: calculateMinecraftArea(doorTile.x, doorTile.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                    });
                }
            }

            currentStartPoint = { ...exitPos };
        } else {
            // Final Climax Floor: Place Default Boss Room & Guard Door ONLY IF no custom BOSS room was placed on this floor
            const hasCustomBossRoom = placedRooms.some(r => r.type === 'BOSS');
            if (!hasCustomBossRoom && grid[exitPos.y][exitPos.x] === 1) {
                grid[exitPos.y][exitPos.x] = 'BOSS';

                if (guidePath.length > 2) {
                    let doorTile = null;
                    for (let idx = guidePath.length - 2; idx >= 1; idx--) {
                        const pt = guidePath[idx];
                        if (grid[pt.y][pt.x] === 1) {
                            let openCount = 0;
                            for (const d of [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }]) {
                                if (grid[pt.y + d.dy] && grid[pt.y + d.dy][pt.x + d.dx] !== 0) openCount++;
                            }
                            if (openCount <= 2) {
                                doorTile = pt;
                                break;
                            }
                        }
                    }
                    if (!doorTile) doorTile = guidePath[guidePath.length - 2];

                    if (doorTile && grid[doorTile.y][doorTile.x] === 1) {
                        grid[doorTile.y][doorTile.x] = 'DOOR';
                        const doorCoord = toGridNotation(doorTile.x, doorTile.y);
                        const bossKeyId = `key_boss_${doorCoord.toLowerCase()}`;
                        const bossKeyObj = {
                            id: bossKeyId,
                            type: 'KEY',
                            floorRule: 'final',
                            targetDoor: { x: doorTile.x, y: doorTile.y, gridNotation: doorCoord }
                        };
                        autoGeneratedKeys.push(bossKeyObj);
                        floorDoors.push({
                            id: `door-boss-final`,
                            position: { x: doorTile.x, y: doorTile.y, gridNotation: doorCoord },
                            floor: floorNum,
                            targetType: 'BOSS',
                            requiredKey: bossKeyObj,
                            minecraftArea: calculateMinecraftArea(doorTile.x, doorTile.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                        });
                    }
                }
            }
        }

        // Scatter Monsters, Traps, Secrets, and Portals with Safe Radius Enforcement
        const placedEntities = placeFloorEncounters(
            grid, width, length, floorNum, floors,
            monsterDensity, miniBossFreq, trapDensity, secretFreq,
            customItems, guidePath, startPos, exitPos, autoGeneratedKeys, floorDoors, rng,
            pathWidth, floorHeight, foundationHeight, floorGap
        );

        // Build detailed floor cells list with shapes and 3D spatial data
        const floorCells = [];
        for (let r = 0; r < length; r++) {
            for (let c = 0; c < width; c++) {
                const cellVal = grid[r][c];
                if (cellVal !== 0) {
                    let typeStr = (cellVal === 1) ? 'path' : String(cellVal).toLowerCase();
                    floorCells.push({
                        x: c,
                        y: r,
                        gridNotation: toGridNotation(c, r),
                        type: typeStr,
                        shape: calculateTileShape(grid, c, r, width, length),
                        minecraftArea: calculateMinecraftArea(c, r, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                    });
                }
            }
        }

        const finalFloorObj = {
            floor: floorNum,
            minecraftArea: calculateMinecraftArea(0, 0, floorNum, pathWidth, floorHeight, width, length, foundationHeight, floorGap),
            grid: grid,
            cells: floorCells,
            rooms: placedRooms,
            doors: floorDoors,
            entities: placedEntities,
            guidePath: [],
            startPos: {
                ...startPos,
                gridNotation: toGridNotation(startPos.x, startPos.y),
                minecraftArea: calculateMinecraftArea(startPos.x, startPos.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
            },
            exitPos: {
                ...exitPos,
                gridNotation: toGridNotation(exitPos.x, exitPos.y),
                minecraftArea: calculateMinecraftArea(exitPos.x, exitPos.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
            }
        };

        finalFloorObj.guidePath = recalculateGuidePath(finalFloorObj);
        generatedFloors.push(finalFloorObj);
    }

    const formattedCustomItems = customItems.filter(item => item.mode === 'auto').map(item => ({
        id: item.keyId || item.id,
        type: 'KEY',
        floorRule: item.floorRule || 'all'
    }));

    const allAutoEntities = [...formattedCustomItems, ...autoGeneratedKeys];

    return {
        metadata: {
            version: "2.1",
            generator: "DungeonsTower Maze Generator",
            author: "JuiMuiFun",
            createdAt: new Date().toISOString()
        },
        maze: {
            settings: {
                dimensions: {
                    columns: width,
                    rows: length,
                    floors: floors,
                    pathWidth: pathWidth,
                    floorHeight: floorHeight,
                    foundationHeight: foundationHeight,
                    floorGap: floorGap
                },
                algorithm: { type: algorithm.toUpperCase(), complexity: parseInt(mazeComplexity) },
                difficulty: {
                    monsterDensity: parseInt(monsterDensity),
                    minibossFrequency: parseInt(miniBossFreq),
                    trapDensity: parseInt(trapDensity),
                    secretChestFrequency: parseInt(secretFreq)
                },
                seed: seed,
                startDirection: startDirection === 'bottom' ? 'bottom_to_top' : 'top_to_bottom'
            },
            unassignedEntities: allAutoEntities,
            specialRooms: (customRooms && customRooms.length > 0)
                ? customRooms.map(room => {
                    const w = parseInt(room.width) || 3;
                    const h = parseInt(room.height) || 3;
                    const t = room.type || 'BOSS';
                    const n = (room.name && room.name.trim()) ? room.name.trim() : `${t}_${w}x${h}`;
                    return {
                        ...room,
                        type: t,
                        width: w,
                        height: h,
                        name: n
                    };
                })
                : [
                    {
                        type: "BOSS",
                        width: 5,
                        height: 5,
                        name: "BOSS_5x5"
                    },
                    {
                        type: "MINI_BOSS",
                        width: 3,
                        height: 3,
                        name: "MINI_BOSS_3x3"
                    }
                ],
            floors: generatedFloors
        }
    };
}

// 2. DFS Recursive Backtracker Algorithm with Corrected Complexity (1 = Simple/Loops, 10 = Very Complex/Winding/Dead-ends)
function carveDFS(grid, width, length, startPoint, complexity = 5, rng) {
    const stack = [startPoint];
    grid[startPoint.y][startPoint.x] = 1;

    const dirs = [
        { dx: 0, dy: -2 },
        { dx: 2, dy: 0 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 }
    ];

    const compFactor = Math.max(0, Math.min(10, parseInt(complexity) || 5));

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const validNeighbors = [];

        for (const dir of dirs) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < length - 1 && grid[ny][nx] === 0) {
                validNeighbors.push({ dir, nx, ny, wallX: current.x + dir.dx / 2, wallY: current.y + dir.dy / 2 });
            }
        }

        if (validNeighbors.length > 0) {
            // High complexity (7-10): frequent random turns & zig-zags (more dead-ends and confusion)
            // Low complexity (1-4): continuous straight paths (simpler, direct corridors)
            const chosen = validNeighbors[Math.floor(rng() * validNeighbors.length)];
            grid[chosen.wallY][chosen.wallX] = 1;
            grid[chosen.ny][chosen.nx] = 1;
            stack.push({ x: chosen.nx, y: chosen.ny });
        } else {
            stack.pop();
        }
    }

    // Low complexity (1-4): High braiding rate (adds loops to make finding exit easy)
    // High complexity (8-10): Zero braiding (strict single path with deep confusing dead-ends)
    if (compFactor < 7) {
        const extraConnectionsRate = (7 - compFactor) * 0.06; // Low complexity = more open loops/shortcuts
        for (let y = 2; y < length - 2; y += 2) {
            for (let x = 2; x < width - 2; x += 2) {
                if (grid[y][x] === 0 && rng() < extraConnectionsRate) {
                    const horizPath = (grid[y][x - 1] === 1 && grid[y][x + 1] === 1);
                    const vertPath = (grid[y - 1][x] === 1 && grid[y + 1][x] === 1);
                    if (horizPath !== vertPath) {
                        grid[y][x] = 1;
                    }
                }
            }
        }
    }
}

// 3. Randomized Prim's Algorithm
function carvePrims(grid, width, length, startPoint, complexity = 5, rng) {
    grid[startPoint.y][startPoint.x] = 1;
    const walls = [];
    const compFactor = Math.max(0, Math.min(10, parseInt(complexity) || 5));

    const addWalls = (x, y) => {
        const dirs = [
            { dx: 0, dy: -2, wx: x, wy: y - 1, nx: x, ny: y - 2 },
            { dx: 2, dy: 0, wx: x + 1, wy: y, nx: x + 2, ny: y },
            { dx: 0, dy: 2, wx: x, wy: y + 1, nx: x, ny: y + 2 },
            { dx: -2, dy: 0, wx: x - 1, wy: y, nx: x - 2, ny: y }
        ];
        for (const d of dirs) {
            if (d.nx > 0 && d.nx < width - 1 && d.ny > 0 && d.ny < length - 1) {
                walls.push(d);
            }
        }
    };

    addWalls(startPoint.x, startPoint.y);

    while (walls.length > 0) {
        const index = Math.floor(rng() * walls.length);
        const wall = walls.splice(index, 1)[0];

        if (grid[wall.ny][wall.nx] === 0) {
            grid[wall.wy][wall.wx] = 1;
            grid[wall.ny][wall.nx] = 1;
            addWalls(wall.nx, wall.ny);
        }
    }

    if (compFactor < 7) {
        const extraConnectionsRate = (7 - compFactor) * 0.05;
        for (let y = 2; y < length - 2; y += 2) {
            for (let x = 2; x < width - 2; x += 2) {
                if (grid[y][x] === 0 && rng() < extraConnectionsRate) {
                    grid[y][x] = 1;
                }
            }
        }
    }
}

// 4. Kruskal's Algorithm
function carveKruskals(grid, width, length, startPoint, complexity = 5, rng) {
    const edges = [];
    const sets = {};
    const compFactor = Math.max(0, Math.min(10, parseInt(complexity) || 5));

    for (let y = 1; y < length - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const cellId = `${x},${y}`;
            sets[cellId] = cellId;
            grid[y][x] = 1;

            if (x + 2 < width - 1) edges.push({ x1: x, y1: y, x2: x + 2, y2: y, wx: x + 1, wy: y });
            if (y + 2 < length - 1) edges.push({ x1: x, y1: y, x2: x, y2: y + 2, wx: x, wy: y + 1 });
        }
    }

    const find = (i) => (sets[i] === i ? i : (sets[i] = find(sets[i])));
    const union = (i, j) => { sets[find(i)] = find(j); };

    for (let i = edges.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [edges[i], edges[j]] = [edges[j], edges[i]];
    }

    for (const edge of edges) {
        const set1 = find(`${edge.x1},${edge.y1}`);
        const set2 = find(`${edge.x2},${edge.y2}`);

        if (set1 !== set2) {
            grid[edge.wy][edge.wx] = 1;
            union(set1, set2);
        }
    }

    if (compFactor < 7) {
        const extraConnectionsRate = (7 - compFactor) * 0.05;
        for (let y = 2; y < length - 2; y += 2) {
            for (let x = 2; x < width - 2; x += 2) {
                if (grid[y][x] === 0 && rng() < extraConnectionsRate) {
                    grid[y][x] = 1;
                }
            }
        }
    }
}

function getReachableTilesFromStart(grid, width, length, startPos) {
    const reachable = Array(length).fill(false).map(() => Array(width).fill(false));
    if (!startPos || startPos.x < 0 || startPos.y < 0) return reachable;

    const queue = [{ x: startPos.x, y: startPos.y }];
    reachable[startPos.y][startPos.x] = true;
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

    while (queue.length > 0) {
        const curr = queue.shift();
        for (const d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < length && !reachable[ny][nx] && grid[ny][nx] !== 0) {
                reachable[ny][nx] = true;
                queue.push({ x: nx, y: ny });
            }
        }
    }
    return reachable;
}

// Helper to guarantee that room doorways connect 100% to the carved maze network
function connectToNearestMazePath(grid, width, length, startX, startY, startPos = null) {
    if (startX <= 0 || startX >= width - 1 || startY <= 0 || startY >= length - 1) return;

    const reachable = getReachableTilesFromStart(grid, width, length, startPos || { x: 1, y: 1 });
    if (grid[startY][startX] === 1 && reachable[startY][startX]) return;

    const queue = [{ x: startX, y: startY, path: [{ x: startX, y: startY }] }];
    const visited = Array(length).fill(false).map(() => Array(width).fill(false));
    visited[startY][startX] = true;

    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    let foundPath = null;

    while (queue.length > 0) {
        const curr = queue.shift();

        const val = grid[curr.y][curr.x];
        if ((val === 1 || val === 'STAIRS_UP' || val === 'STAIRS_DOWN' || val === 'START') && reachable[curr.y][curr.x]) {
            foundPath = curr.path;
            break;
        }

        for (const d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < length - 1 && !visited[ny][nx]) {
                const cellVal = grid[ny][nx];
                if (cellVal === 0 || cellVal === 1 || cellVal === 'STAIRS_UP' || cellVal === 'STAIRS_DOWN') {
                    visited[ny][nx] = true;
                    queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
                }
            }
        }
    }

    if (foundPath) {
        for (const pt of foundPath) {
            if (grid[pt.y][pt.x] === 0) {
                grid[pt.y][pt.x] = 1;
            }
        }
    } else {
        grid[startY][startX] = 1;
    }
}

// 5. Special Rooms Placement Engine with Grid Coordinates Naming & Door-Key Syncing
function placeSpecialRoomsOnFloor(grid, width, length, floorNum, totalFloors, rooms, customItems, autoGeneratedKeys, floorDoors, rng, pathWidth = 3, floorHeight = 5, foundationHeight = 5, floorGap = 5, miniBossInterval = 2, startPos = null) {
    const placed = [];

    rooms.forEach(room => {
        let matchesFloor = false;

        const mode = room.floorMode || (room.targetFloors ? 'custom' : (room.floorRule === 'all' ? 'all' : (room.floorRule ? 'custom' : 'custom')));

        if (mode === 'all') {
            matchesFloor = true;
        } else if (mode === 'planned') {
            // Mode 2: Planned default floors per type (matches exact dungeon generator cadence)
            if (room.type === 'BOSS' && floorNum === totalFloors) matchesFloor = true;
            else if (room.type === 'START' && floorNum === 1) matchesFloor = true;
            else if (room.type === 'MINI_BOSS' && (floorNum % miniBossInterval === 0 && floorNum !== totalFloors)) matchesFloor = true;
            else if (room.type === 'SECRET' || room.type === 'TRAP' || room.type === 'ROOM') {
                // If targetFloors is specified, respect it; otherwise default to floor 1
                if (Array.isArray(room.targetFloors) && room.targetFloors.length > 0) {
                    matchesFloor = room.targetFloors.includes(floorNum);
                } else if (room.floorRule && room.floorRule !== 'all') {
                    if (room.floorRule === 'first' && floorNum === 1) matchesFloor = true;
                    else if (room.floorRule === 'final' && floorNum === totalFloors) matchesFloor = true;
                    else if (room.floorRule === 'odd' && floorNum % 2 !== 0) matchesFloor = true;
                    else if (room.floorRule === 'even' && floorNum % 2 === 0) matchesFloor = true;
                    else if (room.floorRule === `floor-${floorNum}`) matchesFloor = true;
                } else {
                    matchesFloor = (floorNum === 1);
                }
            }
        } else if (mode === 'custom') {
            // Mode 1: Specific custom floor selection list (targetFloors or legacy floorRule)
            if (Array.isArray(room.targetFloors) && room.targetFloors.length > 0) {
                matchesFloor = room.targetFloors.includes(floorNum);
            } else if (room.floorRule) {
                if (room.floorRule === 'first' && floorNum === 1) matchesFloor = true;
                else if (room.floorRule === 'final' && floorNum === totalFloors) matchesFloor = true;
                else if (room.floorRule === 'odd' && floorNum % 2 !== 0) matchesFloor = true;
                else if (room.floorRule === 'even' && floorNum % 2 === 0) matchesFloor = true;
                else if (room.floorRule === `floor-${floorNum}`) matchesFloor = true;
                else if (room.floorRule === 'all') matchesFloor = true;
            } else {
                matchesFloor = (floorNum === 1);
            }
        }

        if (!matchesFloor) return;

        const rw = room.width || 3;
        const rh = room.height || 3;

        let bestPos = null;
        for (let attempt = 0; attempt < 50; attempt++) {
            let rx = Math.floor(rng() * ((width - rw - 2) / 2)) * 2 + 1;
            let ry = Math.floor(rng() * ((length - rh - 2) / 2)) * 2 + 1;

            if (rx > 0 && ry > 0 && rx + rw < width - 1 && ry + rh < length - 1) {
                if (!isRoomOverlap(rx, ry, rw, rh, placed)) {
                    bestPos = { x: rx, y: ry };
                    break;
                }
            }
        }

        if (bestPos) {
            const symbol = room.type || 'BOSS';

            // 1. Seal outer padding perimeter around the room with WALLS (0) to ensure single entrance
            for (let y = Math.max(0, bestPos.y - 1); y <= Math.min(length - 1, bestPos.y + rh); y++) {
                for (let x = Math.max(0, bestPos.x - 1); x <= Math.min(width - 1, bestPos.x + rw); x++) {
                    if (y === bestPos.y - 1 || y === bestPos.y + rh || x === bestPos.x - 1 || x === bestPos.x + rw) {
                        grid[y][x] = 0; // Solid Wall boundary
                    }
                }
            }

            // 2. Fill room interior with room symbol
            for (let y = bestPos.y; y < bestPos.y + rh; y++) {
                for (let x = bestPos.x; x < bestPos.x + rw; x++) {
                    grid[y][x] = symbol;
                }
            }

            const centerX = bestPos.x + Math.floor(rw / 2);
            const centerY = bestPos.y + Math.floor(rh / 2);
            const centerNotation = toGridNotation(centerX, centerY);

            const roomBaseName = (room.name && room.name.trim()) ? room.name.trim() : `${room.type}_${rw}x${rh}`;
            const fullRoomName = `${roomBaseName} [${centerNotation}]`;
            const roomId = roomBaseName.toLowerCase().replace(/\s+/g, '_');

            // 3. Carve ONLY ONE single doorway entrance on the room border
            const doorX = bestPos.x + Math.floor(rw / 2);
            let doorY;
            let outerY;

            if (bestPos.y <= 2) {
                doorY = bestPos.y + rh;
                outerY = doorY + 1;
            } else {
                doorY = bestPos.y - 1;
                outerY = doorY - 1;
            }

            const doorNotation = toGridNotation(doorX, doorY);

            // Connect outer side of door to maze path network guaranteed
            connectToNearestMazePath(grid, width, length, doorX, outerY, startPos);

            let requiredKeyObj = null;

            // Check if room requires a DOOR
            const linkedQuestItem = customItems.find(item => item.lockedRoomId === room.id);

            if (['BOSS', 'MINI_BOSS', 'PUZZLE'].includes(room.type) || linkedQuestItem) {
                if (doorX >= 0 && doorX < width && doorY >= 0 && doorY < length) {
                    grid[doorY][doorX] = 'DOOR';
                }

                if (linkedQuestItem) {
                    requiredKeyObj = {
                        id: linkedQuestItem.keyId || linkedQuestItem.id,
                        type: 'KEY',
                        floorRule: `floor-${floorNum}`,
                        targetDoor: { x: doorX, y: doorY, gridNotation: doorNotation }
                    };
                } else {
                    const generatedKeyId = `key_${room.type.toLowerCase()}_${doorNotation.toLowerCase()}_f${floorNum}`;
                    requiredKeyObj = {
                        id: generatedKeyId,
                        type: 'KEY',
                        floorRule: `floor-${floorNum}`,
                        targetDoor: { x: doorX, y: doorY, gridNotation: doorNotation }
                    };
                    autoGeneratedKeys.push(requiredKeyObj);
                }

                floorDoors.push({
                    id: `door-${roomId}-f${floorNum}`,
                    position: { x: doorX, y: doorY, gridNotation: doorNotation },
                    floor: floorNum,
                    targetRoom: { id: roomId, name: fullRoomName, type: room.type },
                    requiredKey: requiredKeyObj,
                    minecraftArea: calculateMinecraftArea(doorX, doorY, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                });
            } else {
                if (doorX > 0 && doorX < width - 1 && doorY > 0 && doorY < length - 1) {
                    grid[doorY][doorX] = 1;
                }
            }

            placed.push({
                roomId: roomId,
                gridNotation: centerNotation,
                name: fullRoomName,
                type: room.type,
                center: {
                    x: centerX,
                    y: centerY,
                    gridNotation: centerNotation,
                    minecraftArea: calculateMinecraftArea(centerX, centerY, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                },
                bounds: { x: bestPos.x, y: bestPos.y, width: rw, height: rh },
                minecraftArea: calculateMinecraftArea(bestPos.x, bestPos.y, floorNum, pathWidth, floorHeight, rw, rh, foundationHeight, floorGap),
                door: requiredKeyObj ? {
                    position: { x: doorX, y: doorY, gridNotation: doorNotation },
                    requiredKey: requiredKeyObj,
                    minecraftArea: calculateMinecraftArea(doorX, doorY, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                } : null
            });
        }
    });

    return placed;
}

// 6. BFS Pathfinder to find Exit and Guide Path
export function recalculateGuidePath(floorData) {
    if (!floorData || !floorData.grid) return [];

    const grid = floorData.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    let startPos = floorData.startPos ? { x: floorData.startPos.x, y: floorData.startPos.y } : null;
    let targetPos = floorData.exitPos ? { x: floorData.exitPos.x, y: floorData.exitPos.y } : null;

    // Scan grid to find start and exit positions if not explicit
    let stairsUpPos = null;
    let bossCenterPos = null;
    let stairsDownPos = null;
    let startTilePos = null;
    let firstDoorPos = null;

    // Check if custom BOSS room object exists in floorData.rooms
    if (Array.isArray(floorData.rooms)) {
        const bossRoomObj = floorData.rooms.find(r => r.type === 'BOSS');
        if (bossRoomObj && bossRoomObj.center) {
            bossCenterPos = { x: bossRoomObj.center.x, y: bossRoomObj.center.y };
        }
    }

    // Scan grid for tiles
    let bossTiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = grid[r][c];
            if (val === 'START') startTilePos = { x: c, y: r };
            else if (val === 'STAIRS_DOWN') stairsDownPos = { x: c, y: r };
            else if (val === 'STAIRS_UP') stairsUpPos = { x: c, y: r };
            else if (val === 'BOSS') bossTiles.push({ x: c, y: r });
            else if (val === 'DOOR' && !firstDoorPos) firstDoorPos = { x: c, y: r };
        }
    }

    if (!bossCenterPos && bossTiles.length > 0) {
        // Calculate mathematical center of all BOSS tiles
        const avgX = Math.floor(bossTiles.reduce((sum, pt) => sum + pt.x, 0) / bossTiles.length);
        const avgY = Math.floor(bossTiles.reduce((sum, pt) => sum + pt.y, 0) / bossTiles.length);
        bossCenterPos = { x: avgX, y: avgY };
    }

    if (!startPos) {
        startPos = startTilePos || stairsDownPos || { x: 1, y: 1 };
    }

    // Determine absolute target for this floor
    // Hierarchy: STAIRS_UP > BOSS Room Center > First Door
    if (stairsUpPos) {
        targetPos = stairsUpPos;
    } else if (bossCenterPos) {
        targetPos = bossCenterPos;
    } else if (Array.isArray(floorData.doors) && floorData.doors.length > 0) {
        const bossDoor = floorData.doors.find(d => d.targetRoom?.type === 'BOSS' || d.targetType === 'BOSS');
        if (bossDoor && bossDoor.position) {
            targetPos = { x: bossDoor.position.x, y: bossDoor.position.y };
        }
    }

    if (!targetPos && firstDoorPos) {
        targetPos = firstDoorPos;
    }

    const queue = [{ x: startPos.x, y: startPos.y, path: [{ x: startPos.x, y: startPos.y }] }];
    const visited = Array(rows).fill(false).map(() => Array(cols).fill(false));
    visited[startPos.y][startPos.x] = true;

    let targetPath = null;
    let longestPath = [{ x: startPos.x, y: startPos.y }];

    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

    while (queue.length > 0) {
        const curr = queue.shift();

        if (targetPos && curr.x === targetPos.x && curr.y === targetPos.y) {
            targetPath = curr.path;
            break;
        }

        if (curr.path.length > longestPath.length) {
            if (grid[curr.y][curr.x] !== 0) {
                longestPath = curr.path;
            }
        }

        for (const d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            if (
                nx >= 0 && nx < cols && ny >= 0 && ny < rows &&
                !visited[ny][nx] && grid[ny][nx] !== 0
            ) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
            }
        }
    }

    const finalPath = targetPath || longestPath;
    floorData.guidePath = finalPath;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const val = grid[r][c];
            if (val === 'STAIRS_UP' || val === 'STAIRS_DOWN') {
                let pref = null;
                if (startPos && c === startPos.x && r === startPos.y && finalPath.length > 1) {
                    pref = finalPath[1];
                } else if (targetPos && c === targetPos.x && r === targetPos.y && finalPath.length > 1) {
                    pref = finalPath[finalPath.length - 2];
                }
                enforceSingleEntranceForStairs(grid, cols, rows, { x: c, y: r }, pref);
            }
        }
    }

    return finalPath;
}

function findFurthestPathBFS(grid, width, length, start) {
    const queue = [{ x: start.x, y: start.y, path: [{ x: start.x, y: start.y }] }];
    const visited = Array(length).fill(false).map(() => Array(width).fill(false));
    visited[start.y][start.x] = true;

    let longestPath = [{ x: start.x, y: start.y }];
    let exitPos = { x: start.x, y: start.y };

    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

    while (queue.length > 0) {
        const curr = queue.shift();

        if (curr.path.length > longestPath.length) {
            if (grid[curr.y][curr.x] === 1 || grid[curr.y][curr.x] === 'STAIRS_UP' || grid[curr.y][curr.x] === 'STAIRS_DOWN') {
                longestPath = curr.path;
                exitPos = { x: curr.x, y: curr.y };
            }
        }

        for (const d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            if (
                nx > 0 && nx < width - 1 && ny > 0 && ny < length - 1 &&
                !visited[ny][nx] && grid[ny][nx] !== 0
            ) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
            }
        }
    }

    return { exitPos, path: longestPath };
}

export function findShortestPathBFS(grid, width, length, start, target) {
    const queue = [{ x: start.x, y: start.y, path: [{ x: start.x, y: start.y }] }];
    const visited = Array(length).fill(false).map(() => Array(width).fill(false));
    visited[start.y][start.x] = true;

    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

    while (queue.length > 0) {
        const curr = queue.shift();

        if (curr.x === target.x && curr.y === target.y) {
            return curr.path;
        }

        for (const d of dirs) {
            const nx = curr.x + d.dx;
            const ny = curr.y + d.dy;
            if (
                nx >= 0 && nx < width && ny >= 0 && ny < length &&
                !visited[ny][nx] && grid[ny][nx] !== 0
            ) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
            }
        }
    }

    return findFurthestPathBFS(grid, width, length, start).path;
}

// 7. Scatter Monsters, Traps, Secrets, and Portals with Safe Radius Enforcement
function placeFloorEncounters(grid, width, length, floorNum, totalFloors, monsterDensity, miniBossFreq, trapDensity, secretFreq, customItems, guidePath, startPos, exitPos, autoGeneratedKeys, floorDoors, rng, pathWidth = 3, floorHeight = 5, foundationHeight = 5, floorGap = 5) {
    const placedEntities = [];

    const emptyPathTiles = [];
    const deadEndTiles = [];

    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    const getDist = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

    for (let y = 1; y < length - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (grid[y][x] === 1) {
                if (getDist(x, y, startPos.x, startPos.y) <= 4) {
                    continue;
                }

                let nearSpecialRoom = false;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const checkY = y + dy;
                        const checkX = x + dx;
                        if (checkY >= 0 && checkY < length && checkX >= 0 && checkX < width) {
                            const v = grid[checkY][checkX];
                            // Only exclude tiles near multi-cell rooms and stairs, not single-cell entities
                            if (v === 'BOSS' || v === 'MINI_BOSS' || v === 'ROOM' ||
                                v === 'START' || v === 'STAIRS_UP' || v === 'STAIRS_DOWN' ||
                                v === 'DOOR') {
                                nearSpecialRoom = true;
                                break;
                            }
                        }
                    }
                    if (nearSpecialRoom) break;
                }
                if (nearSpecialRoom) continue;

                let wallCount = 0;
                let openNeighbor = null;

                for (const d of dirs) {
                    if (grid[y + d.dy][x + d.dx] === 0) wallCount++;
                    else openNeighbor = { x: x + d.dx, y: y + d.dy };
                }

                if (wallCount === 3 && openNeighbor) {
                    deadEndTiles.push({ x, y, gridNotation: toGridNotation(x, y), frontTile: openNeighbor });
                } else {
                    emptyPathTiles.push({ x, y, gridNotation: toGridNotation(x, y) });
                }
            }
        }
    }

    const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    };

    shuffle(emptyPathTiles);
    shuffle(deadEndTiles);

    // Place SECRET Chests at Dead-Ends guarded by BREAKABLE wall or DOOR
    // Layout: [corridor] --> [DOOR or BREAKABLE at frontTile] --> [SECRET at deadEnd]
    // deadEnd = tip of dead-end (3 walls), frontTile = single open corridor neighbor
    const secretCount = Math.min(deadEndTiles.length, Math.floor((secretFreq / 10) * 3));
    for (let i = 0; i < secretCount && deadEndTiles.length > 0; i++) {
        const deadEnd = deadEndTiles.pop();
        const deadEndCoord = toGridNotation(deadEnd.x, deadEnd.y);

        // Place SECRET at the dead-end tip
        grid[deadEnd.y][deadEnd.x] = 'SECRET';

        // Place DOOR or BREAKABLE at the frontTile (corridor entry to dead-end) if it's still an open path
        const ft = deadEnd.frontTile;
        if (ft && grid[ft.y][ft.x] === 1) {
            const isDoorGuard = (rng() > 0.4);
            const ftCoord = toGridNotation(ft.x, ft.y);

            grid[ft.y][ft.x] = isDoorGuard ? 'DOOR' : 'BREAKABLE';

            if (isDoorGuard) {
                const secretKeyObj = {
                    id: `key_secret_${ftCoord.toLowerCase()}_f${floorNum}`,
                    type: 'KEY',
                    floorRule: `floor-${floorNum}`,
                    targetDoor: { x: ft.x, y: ft.y, gridNotation: ftCoord }
                };
                autoGeneratedKeys.push(secretKeyObj);
                floorDoors.push({
                    id: `door-secret-${ftCoord.toLowerCase()}-f${floorNum}`,
                    position: { x: ft.x, y: ft.y, gridNotation: ftCoord },
                    floor: floorNum,
                    targetType: 'SECRET',
                    requiredKey: secretKeyObj,
                    minecraftArea: calculateMinecraftArea(ft.x, ft.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                });
            } else {
                placedEntities.push({
                    type: 'BREAKABLE',
                    x: ft.x,
                    y: ft.y,
                    gridNotation: ftCoord,
                    minecraftArea: calculateMinecraftArea(ft.x, ft.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                });
            }
        }

        placedEntities.push({
            type: 'SECRET',
            x: deadEnd.x,
            y: deadEnd.y,
            gridNotation: deadEndCoord,
            minecraftArea: calculateMinecraftArea(deadEnd.x, deadEnd.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
        });
    }

    // Place TRAPS (Chokepoints & Dead-End Lures)
    const trapCount = Math.floor((emptyPathTiles.length + deadEndTiles.length) * (trapDensity / 10) * 0.08);
    for (let i = 0; i < trapCount; i++) {
        if (i % 2 === 0 && guidePath.length > 6) {
            const pathIdx = Math.floor(rng() * (guidePath.length - 4)) + 2;
            const chokepoint = guidePath[pathIdx];
            if (grid[chokepoint.y][chokepoint.x] === 1 && getDist(chokepoint.x, chokepoint.y, startPos.x, startPos.y) > 4) {
                grid[chokepoint.y][chokepoint.x] = 'TRAP';
                placedEntities.push({
                    type: 'TRAP',
                    style: 'chokepoint',
                    x: chokepoint.x,
                    y: chokepoint.y,
                    gridNotation: toGridNotation(chokepoint.x, chokepoint.y),
                    minecraftArea: calculateMinecraftArea(chokepoint.x, chokepoint.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
                });
            }
        } else if (deadEndTiles.length > 0) {
            const deadEnd = deadEndTiles.pop();
            grid[deadEnd.y][deadEnd.x] = 'TRAP';
            placedEntities.push({
                type: 'TRAP',
                style: 'lure_deadend',
                x: deadEnd.x,
                y: deadEnd.y,
                gridNotation: deadEnd.gridNotation,
                minecraftArea: calculateMinecraftArea(deadEnd.x, deadEnd.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
            });
        }
    }

    // Progressive floor difficulty scaling
    const floorProgress = 1 + ((floorNum - 1) / Math.max(1, totalFloors - 1)) * 0.5;

    // Place Monsters outside Safe Zone
    const monsterCount = Math.floor(emptyPathTiles.length * (monsterDensity / 10) * 0.12 * floorProgress);
    for (let i = 0; i < monsterCount && emptyPathTiles.length > 0; i++) {
        const tile = emptyPathTiles.pop();
        grid[tile.y][tile.x] = 'MONSTER';
        placedEntities.push({
            type: 'MONSTER',
            x: tile.x,
            y: tile.y,
            gridNotation: tile.gridNotation,
            minecraftArea: calculateMinecraftArea(tile.x, tile.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
        });
    }

    // Place PORTAL randomly at a Dead-End outside Safe Zone
    if (deadEndTiles.length > 0 && rng() > 0.4) {
        const portalDeadEnd = deadEndTiles.pop();
        grid[portalDeadEnd.y][portalDeadEnd.x] = 'PORTAL';
        placedEntities.push({
            type: 'PORTAL',
            x: portalDeadEnd.x,
            y: portalDeadEnd.y,
            gridNotation: portalDeadEnd.gridNotation,
            minecraftArea: calculateMinecraftArea(portalDeadEnd.x, portalDeadEnd.y, floorNum, pathWidth, floorHeight, 1, 1, foundationHeight, floorGap)
        });
    }

    // Register Custom Quest Items metadata
    customItems.forEach(item => {
        let matchesFloor = false;
        if (item.floorRule === 'all') matchesFloor = true;
        else if (item.floorRule === 'first' && floorNum === 1) matchesFloor = true;
        else if (item.floorRule === 'final' && floorNum === totalFloors) matchesFloor = true;
        else if (item.floorRule === `floor-${floorNum}`) matchesFloor = true;

        if (matchesFloor) {
            placedEntities.push({
                id: item.keyId || item.id,
                type: 'KEY',
                floorRule: item.floorRule || `floor-${floorNum}`
            });
        }
    });

    return placedEntities;
}
