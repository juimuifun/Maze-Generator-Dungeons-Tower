function findShortestPath(grid, start, end) {
    const length = grid.length;
    const width = grid[0].length;

    // ทิศทาง: บน, ล่าง, ซ้าย, ขวา
    const dirs = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
    
    // ใช้คิวสำหรับการค้นหาแบบ BFS
    let queue = [{ x: start.x, y: start.y, path: [] }];
    
    let visited = Array(length).fill().map(() => Array(width).fill(false));
    visited[start.y][start.x] = true;
    
    while (queue.length > 0) {
        let current = queue.shift();
        
        if (current.x === end.x && current.y === end.y) {
            return current.path;
        }
        
        for (let dir of dirs) {
            let nx = current.x + dir.x;
            let ny = current.y + dir.y;
            
            // ตรวจสอบให้อยู่ในขอบเขตและยังไม่เคยเดินไป และไม่เป็นกำแพง (0)
            if (nx >= 0 && nx < width && ny >= 0 && ny < length && !visited[ny][nx] && grid[ny][nx] !== 0) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny, path: [...current.path, {x: nx, y: ny}] });
            }
        }
    }
    
    return []; // ในกรณีที่หาทางไม่เจอ
}

function findFurthestPoint(grid, start) {
    const length = grid.length;
    const width = grid[0].length;
    const dirs = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
    let queue = [{ x: start.x, y: start.y, dist: 0 }];
    
    let visited = Array(length).fill().map(() => Array(width).fill(false));
    visited[start.y][start.x] = true;
    
    let furthest = { x: start.x, y: start.y };
    let maxDist = 0;

    while (queue.length > 0) {
        let current = queue.shift();
        
        // บังคับให้จุดที่เป็นบันไดลง/ขึ้น ต้องอยู่ใน Grid หลัก (พิกัดเลขคี่) 
        // เพื่อป้องกันไม่ให้โครงสร้างกำแพงของเขาวงกตชั้นถัดไปเหลื่อมกัน
        if (current.dist > maxDist && current.x % 2 !== 0 && current.y % 2 !== 0) {
            maxDist = current.dist;
            furthest = { x: current.x, y: current.y };
        }
        
        for (let dir of dirs) {
            let nx = current.x + dir.x;
            let ny = current.y + dir.y;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < length && !visited[ny][nx] && grid[ny][nx] !== 0) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny, dist: current.dist + 1 });
            }
        }
    }
    
    return furthest;
}

function findFurthestDeadEnd(grid, start) {
    const length = grid.length;
    const width = grid[0].length;
    const dirs = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
    let queue = [{ x: start.x, y: start.y, dist: 0 }];
    
    let visited = Array(length).fill().map(() => Array(width).fill(false));
    visited[start.y][start.x] = true;
    
    let furthest = { x: start.x, y: start.y };
    let maxDist = 0;

    while (queue.length > 0) {
        let current = queue.shift();
        
        // นับจำนวนทางเชื่อมต่อ เพื่อดูว่าเป็นทางตันหรือไม่ (ต้องมีแค่ 1 ทาง)
        let connections = 0;
        for (let dir of dirs) {
            let nx = current.x + dir.x;
            let ny = current.y + dir.y;
            if (nx >= 0 && nx < width && ny >= 0 && ny < length && grid[ny][nx] !== 0) {
                connections++;
            }
        }
        
        if (current.dist > maxDist && connections === 1 && current.x % 2 !== 0 && current.y % 2 !== 0) {
            // ต้องไม่ใช่จุดเริ่มต้น
            if (current.x !== start.x || current.y !== start.y) {
                maxDist = current.dist;
                furthest = { x: current.x, y: current.y };
            }
        }
        
        for (let dir of dirs) {
            let nx = current.x + dir.x;
            let ny = current.y + dir.y;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < length && !visited[ny][nx] && grid[ny][nx] !== 0) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny, dist: current.dist + 1 });
            }
        }
    }
    
    if (maxDist === 0) return null;
    return furthest;
}

function findForcedPath(grid, waypoints) {
    let fullPath = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        let segment = findShortestPath(grid, waypoints[i], waypoints[i+1]);
        if (segment.length === 0) continue; // Skip if unreachable
        if (i > 0) segment.shift(); // Remove duplicate overlap coordinate at connection points
        fullPath = fullPath.concat(segment);
    }
    return fullPath;
}

export { findShortestPath, findFurthestPoint, findFurthestDeadEnd, findForcedPath };
