function placeEntities(grid, currentFloor, totalFloors, difficulty, rng, shortestPath, endPoint) {
    const length = grid.length;
    const width = grid[0].length;

    // ตั้งค่าความหนาแน่นตามความยาก (1-10)
    let monsterChance = (difficulty / 10) * 0.25; // สูงสุดโอกาสเกิด 25% ต่อช่องทางเดิน
    let trapChance = (difficulty / 10) * 0.15;    // สูงสุด 15%

    // วางมินิบอส (ขวางเส้นทางหลักตรงกึ่งกลางทางพอดี)
    if (currentFloor % 2 === 1 && shortestPath && shortestPath.length > 2) {
        let midIndex = Math.floor(shortestPath.length / 2);
        let miniBossPos = shortestPath[midIndex];
        if (grid[miniBossPos.y][miniBossPos.x] === 1) {
            grid[miniBossPos.y][miniBossPos.x] = 'MINI_BOSS';
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

    for (let y = 0; y < length; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] === 1) { // ถ้าเป็นทางเดิน
                let rand = rng();
                if (getConnections(x, y) === 1 && rand > 0.8) {
                    grid[y][x] = 'SECRET'; // ห้องลับ/ทางลัด (เกิดในพื้นที่ที่เป็นทางตันเท่านั้น)
                } else if (rand < trapChance) {
                    grid[y][x] = 'TRAP'; // กับดัก
                } else if (rand < trapChance + monsterChance) {
                    grid[y][x] = 'MONSTER'; // มอนสเตอร์ทั่วไป
                }
            }
        }
    }

    return grid;
}

export { placeEntities };
