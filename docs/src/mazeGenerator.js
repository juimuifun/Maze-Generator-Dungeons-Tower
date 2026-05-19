import { placeEntities } from './entityPlacer.js';
import { findShortestPath, findFurthestPoint, findFurthestDeadEnd } from './pathfinder.js';

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

function generateMultiFloorMaze(config) {
    let { width, length, floors, difficulty, seed, startDirection } = config;
    
    // ป้องกันกรณีขนาดเล็กเกินไปจนเกิด Error (ขั้นต่ำ 5x5)
    if (!width || width < 5) width = 5;
    if (!length || length < 5) length = 5;

    const rng = createPRNG(seed || "defaultSeed123");
    
    // บังคับให้ขนาดเขาวงกตเป็นเลขคี่เสมอ เพื่อให้การสร้างทางเดินและกำแพงสมบูรณ์แบบ Grid 
    if (width % 2 === 0) width++;
    if (length % 2 === 0) length++;

    const allFloors = [];
    let startPoint = { x: 1, y: 1 }; // กำหนดจุดเริ่มต้นเริ่มต้นที่ (1, 1) สำหรับชั้นแรก

    for (let floorIndex = 0; floorIndex < floors; floorIndex++) {
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
            
            // สุ่มหาจุดสร้างประตู (ทางเข้าทางเดียว)
            let possibleDoors = [];
            let oddXs = []; for (let x = bx; x < bx + bossW; x += 2) oddXs.push(x);
            let oddYs = []; for (let y = by; y < by + bossH; y += 2) oddYs.push(y);

            if (by > 2) possibleDoors.push({ x: oddXs[Math.floor(rng() * oddXs.length)], y: by - 1 }); 
            if (by + bossH < length - 2) possibleDoors.push({ x: oddXs[Math.floor(rng() * oddXs.length)], y: by + bossH }); 
            if (bx > 2) possibleDoors.push({ x: bx - 1, y: oddYs[Math.floor(rng() * oddYs.length)] }); 
            if (bx + bossW < width - 2) possibleDoors.push({ x: bx + bossW, y: oddYs[Math.floor(rng() * oddYs.length)] }); 

            if (possibleDoors.length > 0) {
                let door = possibleDoors[Math.floor(rng() * possibleDoors.length)];
                bossRoom = { bx, by, bossW, bossH, doorX: door.x, doorY: door.y };
            }
        }

        // อัลกอริทึม Recursive Backtracker (DFS) สำหรับสร้างเขาวงกตที่สมบูรณ์
        let stack = [{x: startPoint.x, y: startPoint.y}];
        grid[startPoint.y][startPoint.x] = 1;

        const dirs = [
            {dx: 0, dy: -2}, {dx: 0, dy: 2},
            {dx: -2, dy: 0}, {dx: 2, dy: 0}
        ];

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
                // สุ่มเลือกทิศทางที่จะไปต่อ
                let next = unvisited[Math.floor(rng() * unvisited.length)];
                // ทุบกำแพงระหว่างช่องปัจจุบันและช่องถัดไป
                grid[current.y + next.dir.dy / 2][current.x + next.dir.dx / 2] = 1;
                // กำหนดให้ช่องถัดไปเป็นทางเดิน
                grid[next.ny][next.nx] = 1;
                stack.push({x: next.nx, y: next.ny});
            } else {
                stack.pop(); // ถอยกลับเมื่อไม่มีทางไป
            }
        }

        // เจาะประตูทางเข้าห้องบอส
        if (bossRoom) {
            grid[bossRoom.doorY][bossRoom.doorX] = 1;
        }

        // ระบบเจาะห้องใหญ่แบบสุ่ม (มีน้อยหน่อย) อิงตามขนาดพื้นที่
        const numRooms = Math.floor((width * length) / 150); // ยิ่งตัวเลขหารเยอะ ห้องยิ่งน้อย
        for (let i = 0; i < numRooms; i++) {
            let roomW = Math.floor(rng() * 2) * 2 + 3; // ขนาด 3x3 หรือ 5x5 (เลขคี่)
            let roomH = Math.floor(rng() * 2) * 2 + 3; 
            
            let rx = Math.floor(rng() * (width - roomW - 1)) + 1;
            let ry = Math.floor(rng() * (length - roomH - 1)) + 1;
            
            if (rx % 2 === 0) rx++;
            if (ry % 2 === 0) ry++;

            let overlap = false;
            if (bossRoom) {
                if (rx < bossRoom.bx + bossRoom.bossW + 2 && rx + roomW > bossRoom.bx - 2 &&
                    ry < bossRoom.by + bossRoom.bossH + 2 && ry + roomH > bossRoom.by - 2) {
                    overlap = true; // ไม่ให้สร้างห้องทับบริเวณห้องบอส
                }
            }
            
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

        // ค้นหาจุดที่เป็น "ทางตัน" ที่อยู่ไกลที่สุด
        let endPoint;
        if (floorIndex === floors - 1 && bossRoom) {
            // ถ้าเป็นชั้นสุดท้าย กำหนดให้ endPoint คือใจกลางห้องบอสเพื่อทำเส้นนำทางไกด์
            endPoint = { x: bossRoom.bx + Math.floor(bossRoom.bossW / 2), y: bossRoom.by + Math.floor(bossRoom.bossH / 2) };
        } else {
            endPoint = findFurthestDeadEnd(grid, startPoint) || findFurthestPoint(grid, startPoint);
        }

        if (floorIndex < floors - 1) {
            grid[endPoint.y][endPoint.x] = 'STAIRS_UP';
        }

        // หาเส้นทางที่สั้นที่สุดสำหรับชั้นนี้ (คำนวณก่อนเพื่อใช้จัดวางมินิบอสกลางทาง)
        const shortestPath = findShortestPath(grid, startPoint, endPoint);

        // ใส่ มอนสเตอร์, บอส, กับดัก อิงตามความยากและระดับชั้น
        grid = placeEntities(grid, floorIndex, floors, difficulty, rng, shortestPath, endPoint);

        allFloors.push({
            floorNumber: floorIndex + 1,
            grid: grid,
            guidePath: shortestPath
        });

        // ตั้งค่าจุดเริ่มต้นของชั้นถัดไป ให้ตรงกับตำแหน่งทางลงของชั้นปัจจุบัน
        startPoint = { x: endPoint.x, y: endPoint.y };
    }

    // หากเลือกให้เริ่มจากด้านบนสุด เราจะกลับด้าน Array เพื่อให้ห้องบอสกลายเป็นชั้นล่างสุด (Floor 1)
    // และสลับบันไดขึ้น-ลงให้สอดคล้องกัน (เช่น ชั้นบนสุดต้องมีแต่บันไดลง)
    if (startDirection === 'top') {
        allFloors.reverse();
        allFloors.forEach((floor, index) => {
            floor.floorNumber = index + 1;
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
