import { placeEntities } from './entityPlacer.js';
import { findShortestPath, findFurthestPoint, findFurthestDeadEnd, findForcedPath } from './pathfinder.js';

// Seeded Random (PRNG) function
function createPRNG(seedStr) {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
    }
    let a = h;
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Helper to find valid edges to punch holes into the Halo (Only at odd coordinates so pathfinder can reach)
function getValidHoles(rx, ry, w, h, width, length) {
    let holes = [];
    if (ry > 1) { // Top Edge
        for (let x = rx; x < rx + w; x += 2) holes.push({x, y: ry - 1, side: 'T'});
    }
    if (ry + h < length - 1) { // Bottom Edge
        for (let x = rx; x < rx + w; x += 2) holes.push({x, y: ry + h, side: 'B'});
    }
    if (rx > 1) { // Left Edge
        for (let y = ry; y < ry + h; y += 2) holes.push({x: rx - 1, y, side: 'L'});
    }
    if (rx + w < width - 1) { // Right Edge
        for (let y = ry; y < ry + h; y += 2) holes.push({x: rx + w, y, side: 'R'});
    }
    return holes;
}

function isOverlap(rx, ry, rw, rh, roomObj) {
    if (!roomObj) return false;
    let ox = roomObj.bx || roomObj.mx, oy = roomObj.by || roomObj.my, ow = roomObj.bossW || roomObj.mbW, oh = roomObj.bossH || roomObj.mbH;
    return (rx < ox + ow + 2 && rx + rw > ox - 2 && ry < oy + oh + 2 && ry + rh > oy - 2);
}

function generateMultiFloorMaze(config) {
    let { width, length, floors, difficulty, mazeComplexity, encounterDifficulty, seed, startDirection } = config;
    
    // ป้องกันกรณีขนาดเล็กเกินไปจนเกิด Error (ขั้นต่ำ 5x5)
    if (!width || width < 5) width = 5;
    if (!length || length < 5) length = 5;

    const rng = createPRNG(seed || "defaultSeed123");
    
    // ใช้ encounterDifficulty เป็นหลัก หรือถอยกลับไปใช้ difficulty ในกรณีที่เป็น JSON เก่า
    let baseEncounterDiff = encounterDifficulty || difficulty || 5;
    let baseMazeComplexity = mazeComplexity || difficulty || 5;

    // บังคับให้ขนาดเขาวงกตเป็นเลขคี่เสมอ เพื่อให้การสร้างทางเดินและกำแพงสมบูรณ์แบบ Grid 
    if (width % 2 === 0) width++;
    if (length % 2 === 0) length++;

    const allFloors = [];
    let startPoint = { x: 1, y: 1 }; // กำหนดจุดเริ่มต้นเริ่มต้นที่ (1, 1) สำหรับชั้นแรก

    for (let floorIndex = 0; floorIndex < floors; floorIndex++) {
        // Progressive Scaling: เพิ่มความยากตามระดับชั้น (Cap ที่ 10)
        let scaledEncounterDiff = Math.min(10, baseEncounterDiff + (floorIndex * 0.25));
        let scaledMazeComplexity = Math.min(10, baseMazeComplexity + (floorIndex * 0.25));

        let grid = Array(length).fill().map(() => Array(width).fill(0));

        // การสร้างห้องบอส (เฉพาะชั้นสุดท้าย)
        let bossRoom = null;
        if (floorIndex === floors - 1) {
            let bossW = rng() > 0.5 ? 5 : 3;
            let bossH = rng() > 0.5 ? 5 : 3;
            
            if (bossW > width - 4) bossW = 3;
            if (bossH > length - 4) bossH = 3;
            
            let bx, by;
            // พยายามวางห้องบอสให้อยู่คนละฝั่งกับจุดเริ่มต้น
            if (startPoint.x < width / 2) {
                bx = width - bossW - 2;
                if (bx % 2 === 0) bx--;
            } else { bx = 1; }
            
            if (startPoint.y < length / 2) {
                by = length - bossH - 2;
                if (by % 2 === 0) by--;
            } else { by = 1; }
            
            bx = Math.max(1, bx);
            by = Math.max(1, by);
            
            // กำหนดพื้นที่ภายในเป็น BOSS เพื่อกันไม่ให้ทางเดินปกติเจาะเข้ามา
            for (let y = by; y < by + bossH; y++) {
                for (let x = bx; x < bx + bossW; x++) {
                    grid[y][x] = 'BOSS';
                }
            }
            
            // Pick exactly ONE entrance hole
            let holes = getValidHoles(bx, by, bossW, bossH, width, length);
            let hole = holes.length > 0 ? holes[Math.floor(rng() * holes.length)] : null;
            bossRoom = { bx, by, bossW, bossH, hole };
        }

        // การสร้างห้อง Miniboss (เฉพาะชั้นเว้นชั้น) แบบ Chokepoint
        let miniBossRoom = null;
        if (floorIndex < floors - 1 && floorIndex % 2 === 1) {
            let mbW = rng() > 0.5 ? 5 : 3;
            let mbH = rng() > 0.5 ? 5 : 3;
            if (mbW > width - 4) mbW = 3;
            if (mbH > length - 4) mbH = 3;

            let mx = Math.floor(rng() * (width - mbW - 2)) + 1;
            let my = Math.floor(rng() * (length - mbH - 2)) + 1;
            if (mx < 5 && my < 5) mx = 5; // Push away from StartPoint (1,1)
            if (mx % 2 === 0) mx++;
            if (my % 2 === 0) my++;

            for (let y = my; y < my + mbH; y++) {
                for (let x = mx; x < mx + mbW; x++) {
                    grid[y][x] = 'MINI_BOSS';
                }
            }

            // Pick TWO holes preferably on opposite sides
            let holes = getValidHoles(mx, my, mbW, mbH, width, length);
            let hole1 = holes.splice(Math.floor(rng() * holes.length), 1)[0];
            let diffSide = holes.filter(h => h.side !== hole1.side);
            let hole2 = diffSide.length > 0 ? diffSide[Math.floor(rng() * diffSide.length)] : holes[Math.floor(rng() * holes.length)];
            miniBossRoom = { mx, my, mbW, mbH, hole1, hole2 };
        }

        // อัลกอริทึม Recursive Backtracker (DFS) สำหรับสร้างเขาวงกตที่สมบูรณ์
        let stack = [{x: startPoint.x, y: startPoint.y, lastDir: null}];
        grid[startPoint.y][startPoint.x] = 1;

        const dirs = [
            {dx: 0, dy: -2}, {dx: 0, dy: 2},
            {dx: -2, dy: 0}, {dx: 2, dy: 0}
        ];
        
        // โอกาสที่จะเดินตรงไปทิศทางเดิม (ความซับซ้อนต่ำ = โอกาสตรงสูง)
        let straightnessProbability = Math.max(0, 1.0 - (scaledMazeComplexity / 10.0));

        while(stack.length > 0) {
            let current = stack[stack.length - 1];
            let unvisited = [];

            for (let dir of dirs) {
                let nx = current.x + dir.dx;
                let ny = current.y + dir.dy;
                // ตรวจสอบว่าอยู่ในขอบเขตและยังไม่ถูกเยี่ยมชม (ยังเป็นกำแพง)
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < length - 1 && grid[ny][nx] === 0) {
                    unvisited.push({nx, ny, dir});
                }
            }

            if (unvisited.length > 0) {
                let next;
                let straightOption = current.lastDir ? unvisited.find(u => u.dir.dx === current.lastDir.dx && u.dir.dy === current.lastDir.dy) : null;
                
                // ตรวจสอบว่าจะพยายามเดินตรงหรือไม่
                if (straightOption && rng() < straightnessProbability) {
                    next = straightOption;
                } else {
                    // บังคับเลี้ยว (ถ้ามีทางเลือกอื่น)
                    let turnOptions = straightOption ? unvisited.filter(u => u !== straightOption) : unvisited;
                    if (turnOptions.length > 0) {
                        next = turnOptions[Math.floor(rng() * turnOptions.length)];
                    } else {
                        next = unvisited[Math.floor(rng() * unvisited.length)];
                    }
                }
                
                // ทุบกำแพงระหว่างช่องปัจจุบันและช่องถัดไป
                grid[current.y + next.dir.dy / 2][current.x + next.dir.dx / 2] = 1;
                // กำหนดให้ช่องถัดไปเป็นทางเดิน
                grid[next.ny][next.nx] = 1;
                stack.push({x: next.nx, y: next.ny, lastDir: next.dir});
            } else {
                stack.pop(); // ถอยกลับเมื่อไม่มีทางไป
            }
        }
        
        // Secondary fallback Backtracker เพื่อป้องกันกรณีห้องใหญ่ตัดแผนที่ขาดออกจากกัน
        for (let startY = 1; startY < length; startY += 2) {
            for (let startX = 1; startX < width; startX += 2) {
                if (grid[startY][startX] === 0) {
                    let subStack = [{x: startX, y: startY, lastDir: null}];
                    grid[startY][startX] = 1;
                    while(subStack.length > 0) {
                        let current = subStack[subStack.length - 1];
                        let unvisited = [];
                        for (let dir of dirs) {
                            let nx = current.x + dir.dx, ny = current.y + dir.dy;
                            if (nx > 0 && nx < width - 1 && ny > 0 && ny < length - 1 && grid[ny][nx] === 0) {
                                unvisited.push({nx, ny, dir});
                            }
                        }
                        if (unvisited.length > 0) {
                            let next;
                            let straightOption = current.lastDir ? unvisited.find(u => u.dir.dx === current.lastDir.dx && u.dir.dy === current.lastDir.dy) : null;
                            
                            if (straightOption && rng() < straightnessProbability) {
                                next = straightOption;
                            } else {
                                let turnOptions = straightOption ? unvisited.filter(u => u !== straightOption) : unvisited;
                                if (turnOptions.length > 0) {
                                    next = turnOptions[Math.floor(rng() * turnOptions.length)];
                                } else {
                                    next = unvisited[Math.floor(rng() * unvisited.length)];
                                }
                            }
                            
                            grid[current.y + next.dir.dy / 2][current.x + next.dir.dx / 2] = 1;
                            grid[next.ny][next.nx] = 1;
                            subStack.push({x: next.nx, y: next.ny, lastDir: next.dir});
                        } else subStack.pop();
                    }
                }
            }
        }

        // เจาะกำแพงประตู Halo ให้เข้า-ออกห้องได้
        if (bossRoom && bossRoom.hole) grid[bossRoom.hole.y][bossRoom.hole.x] = 1;
        if (miniBossRoom) { grid[miniBossRoom.hole1.y][miniBossRoom.hole1.x] = 1; grid[miniBossRoom.hole2.y][miniBossRoom.hole2.x] = 1; }

        // ระบบเจาะห้องใหญ่แบบสุ่ม (มีน้อยหน่อย) อิงตามขนาดพื้นที่
        const numRooms = Math.floor((width * length) / 150); // ยิ่งตัวเลขหารเยอะ ห้องยิ่งน้อย
        for (let i = 0; i < numRooms; i++) {
            let roomW = Math.floor(rng() * 2) * 2 + 3; // ขนาด 3x3 หรือ 5x5 (เลขคี่)
            let roomH = Math.floor(rng() * 2) * 2 + 3; 
            
            let rx = Math.floor(rng() * (width - roomW - 1)) + 1;
            let ry = Math.floor(rng() * (length - roomH - 1)) + 1;
            
            if (rx % 2 === 0) rx++;
            if (ry % 2 === 0) ry++;

            let overlap = isOverlap(rx, ry, roomW, roomH, bossRoom) || isOverlap(rx, ry, roomW, roomH, miniBossRoom);

            if (!overlap) {
                for (let ry_i = ry; ry_i < ry + roomH && ry_i < length - 1; ry_i++) {
                    for (let rx_i = rx; rx_i < rx + roomW && rx_i < width - 1; rx_i++) {
                        if (rx_i === startPoint.x && ry_i === startPoint.y) continue;
                        grid[ry_i][rx_i] = 1;
                    }
                }
            }
        }

        // กำหนดจุดเริ่มต้น (S) และทางลง/ขึ้น (D/U)
        if (floorIndex === 0) {
            grid[startPoint.y][startPoint.x] = 'START';
        } else {
            grid[startPoint.y][startPoint.x] = 'STAIRS_DOWN';
        }

        let endPoint;
        let guidePath = [];
        
        if (floorIndex === floors - 1 && bossRoom) {
            endPoint = { x: bossRoom.bx + Math.floor(bossRoom.bossW / 2), y: bossRoom.by + Math.floor(bossRoom.bossH / 2) };
            guidePath = findForcedPath(grid, [startPoint, bossRoom.hole, endPoint]);
        } else if (miniBossRoom) {
            endPoint = findFurthestDeadEnd(grid, miniBossRoom.hole2) || findFurthestPoint(grid, miniBossRoom.hole2);
            guidePath = findForcedPath(grid, [
                startPoint, 
                miniBossRoom.hole1, 
                { x: miniBossRoom.mx + Math.floor(miniBossRoom.mbW / 2), y: miniBossRoom.my + Math.floor(miniBossRoom.mbH / 2) },
                miniBossRoom.hole2, 
                endPoint
            ]);
        } else {
            endPoint = findFurthestDeadEnd(grid, startPoint) || findFurthestPoint(grid, startPoint);
            guidePath = findShortestPath(grid, startPoint, endPoint);
        }

        if (floorIndex < floors - 1) {
            grid[endPoint.y][endPoint.x] = 'STAIRS_UP';
        }

        grid = placeEntities(grid, floorIndex, floors, scaledEncounterDiff, rng, guidePath, endPoint);

        allFloors.push({
            floorNumber: floorIndex + 1,
            grid: grid,
            guidePath: guidePath
        });

        // ตั้งค่าจุดเริ่มต้นของชั้นถัดไป ให้ตรงกับตำแหน่งทางลงของชั้นปัจจุบัน
        startPoint = { x: endPoint.x, y: endPoint.y };
    }

    // หากเลือกให้เริ่มจากด้านบนสุด เราจะไม่กลับด้าน Array เพื่อให้ Floor 1 ยังคงเป็นจุดเริ่มต้น (Start)
    // แต่เราจะสลับบันไดขึ้น-ลงให้สอดคล้องกัน (Floor 1 จะมีบันไดลงไปเรื่อยๆ จนถึงห้องบอส)
    if (startDirection === 'top') {
        allFloors.forEach((floor) => {
            for (let y = 0; y < floor.grid.length; y++) {
                for (let x = 0; x < floor.grid[y].length; x++) {
                    if (floor.grid[y][x] === 'STAIRS_UP') {
                        floor.grid[y][x] = 'STAIRS_DOWN';
                    } else if (floor.grid[y][x] === 'STAIRS_DOWN') {
                        floor.grid[y][x] = 'STAIRS_UP';
                    }
                }
            }
        });
    }

    return allFloors;
}

export { generateMultiFloorMaze };
