import { generateMultiFloorMaze } from './src/mazeGenerator.js';
import { findShortestPath } from './src/pathfinder.js';

let currentMazeData = null;
let isGuideVisible = false;
let currentFloorIndex = 0;
let lastConfig = null;

// ตัวแปรสำหรับเช็คการลากเมาส์ระบายสี
let isDrawing = false;
window.addEventListener('mousedown', () => isDrawing = true);
window.addEventListener('mouseup', () => isDrawing = false);

// ตรวจจับการกด Spacebar เพื่อใช้ลากจอ
window.isSpaceDown = false;
window.addEventListener('keydown', e => { if (e.code === 'Space') window.isSpaceDown = true; });
window.addEventListener('keyup', e => { if (e.code === 'Space') window.isSpaceDown = false; });

// ระบบ Zoom และ Pan (ลากจอ)
let currentZoom = 1;
let translateX = 0;
let translateY = 0;

window.zoomMaze = function(direction) {
    if (direction > 0) currentZoom += 0.2;
    else if (direction < 0) currentZoom -= 0.2;
    else {
        currentZoom = 1; // Reset
        translateX = 0;
        translateY = 0;
    }
    
    // จำกัดขอบเขตการซูม (20% ถึง 500%)
    currentZoom = Math.max(0.2, Math.min(currentZoom, 5)); 
    const container = document.getElementById('mazeContainer');
    if (container) {
        container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    }
};

// ดักจับ Scroll เมาส์ และระบบ Panning
document.addEventListener('DOMContentLoaded', () => {
    const viewArea = document.getElementById('mazeViewArea');
    const container = document.getElementById('mazeContainer');
    if (!viewArea || !container) return;

    viewArea.addEventListener('wheel', (e) => {
        e.preventDefault(); // ป้องกันเบราว์เซอร์เลื่อนหน้าจอ
        window.zoomMaze(e.deltaY < 0 ? 1 : -1);
    }, { passive: false });

    // ระบบ Panning (ลากเมาส์เลื่อนจอ)
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    viewArea.addEventListener('mousedown', (e) => {
        const isEditMode = document.getElementById('editModeToggle')?.checked;
        // ลากจอได้ถ้า: ไม่ได้เปิด Edit Mode, กด Spacebar, คลิกขวา/กลาง, หรือคลิกซ้ายพื้นที่ว่าง
        if (!isEditMode || window.isSpaceDown || e.button === 1 || e.button === 2 || (e.button === 0 && !e.target.closest('.cell'))) {
            e.preventDefault();
            isPanning = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            viewArea.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            viewArea.style.cursor = 'grab';
        }
    });

    // ป้องกันเมนูคลิกขวาเด้ง เพื่อให้ใช้คลิกขวาลากจอได้ด้วย
    viewArea.addEventListener('contextmenu', e => e.preventDefault());
});

// ตัวช่วยแปลงรหัสบล็อกเป็น Emoji (เพื่อให้ตรงกับแถบ Brush)
function getCellIcon(val) {
    if (val === 'START') return '🏁';
    if (val === 'STAIRS_UP') return '🔼';
    if (val === 'STAIRS_DOWN') return '🔽';
    if (val === 'MONSTER') return '🧟';
    if (val === 'MINI_BOSS') return '👹';
    if (val === 'BOSS') return '💀';
    if (val === 'TRAP') return '⚠️';
    if (val === 'SECRET') return '🎁';
    return ''; // Wall และ Path ไม่มีข้อความ
}

window.toggleEditMode = function() {
    const isEditMode = document.getElementById('editModeToggle').checked;
    const brushContainer = document.getElementById('brushContainer');
    if (isEditMode) {
        brushContainer.style.opacity = '1';
        brushContainer.style.pointerEvents = 'auto';
    } else {
        brushContainer.style.opacity = '0.5';
        brushContainer.style.pointerEvents = 'none';
    }
};

window.generateMaze = function() {
    let seedInput = document.getElementById('seed').value;
    if (!seedInput) {
        seedInput = Math.random().toString(36).substring(2, 10);
        document.getElementById('seed').value = seedInput; // Show generated Seed
    }

    const config = {
        width: parseInt(document.getElementById('width').value),
        length: parseInt(document.getElementById('length').value),
        floors: parseInt(document.getElementById('floors').value),
        pathWidth: parseInt(document.getElementById('pathWidth').value),
        floorHeight: parseInt(document.getElementById('floorHeight').value),
        difficulty: parseInt(document.getElementById('difficulty').value),
        startDirection: document.getElementById('startDirection').value,
        seed: seedInput
    };

    try {
        currentMazeData = generateMultiFloorMaze(config);
        currentFloorIndex = 0;
        lastConfig = config;
        document.getElementById('toggleGuideBtn').disabled = false;
        document.getElementById('exportJsonBtn').disabled = false;
        document.getElementById('floorNavigation').style.display = 'flex';
        
        // Calculate and display Minecraft area requirements
        const actualWidth = currentMazeData[0].grid[0].length;
        const actualLength = currentMazeData[0].grid.length;
        const mcWidth = actualWidth * config.pathWidth;
        const mcLength = actualLength * config.pathWidth;
        const foundationThickness = 5;
        const ceilingThickness = 5;
        const mcTotalHeight = foundationThickness + (config.floors * (config.floorHeight + ceilingThickness));
        const totalVolume = (mcWidth * mcLength * mcTotalHeight).toLocaleString();
        document.getElementById('mcSizeInfo').innerText = `Minecraft Area:\n${mcWidth} x ${mcLength} x ${mcTotalHeight} blocks\nTotal Volume: ${totalVolume} blocks`;

        renderMaze();
    } catch (err) {
        alert('Error: ' + err.message);
    }
};

window.nextFloor = function() {
    if (currentMazeData && currentFloorIndex < currentMazeData.length - 1) {
        currentFloorIndex++;
        renderMaze();
    }
};

window.prevFloor = function() {
    if (currentMazeData && currentFloorIndex > 0) {
        currentFloorIndex--;
        renderMaze();
    }
};

function renderMaze() {
    const container = document.getElementById('mazeContainer');
    container.innerHTML = ''; // Clear old content

    if (!currentMazeData || currentMazeData.length === 0) return;

    const floor = currentMazeData[currentFloorIndex];
    document.getElementById('currentFloorLabel').innerText = `Floor ${floor.floorNumber} / ${currentMazeData.length}`;

    const floorDiv = document.createElement('div');
    floorDiv.className = 'maze-floor';

    const gridDiv = document.createElement('div');
    gridDiv.className = 'maze-grid';
    gridDiv.style.gridTemplateColumns = `repeat(${floor.grid[0].length}, 30px)`;

    // Draw each cell
    for (let y = 0; y < floor.grid.length; y++) {
        for (let x = 0; x < floor.grid[y].length; x++) {
            const cellVal = floor.grid[y][x];
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            cellDiv.id = `cell-${floor.floorNumber}-${x}-${y}`;
            
            // ระบบ Edit Mode: คลิกและลากระบาย
            cellDiv.onmousedown = (e) => { 
                const isEditMode = document.getElementById('editModeToggle')?.checked;
                if (!isEditMode) return;
                if (window.isSpaceDown || e.button !== 0) return;
                e.preventDefault(); 
                updateCell(x, y); 
            };
            cellDiv.onmouseenter = (e) => { 
                const isEditMode = document.getElementById('editModeToggle')?.checked;
                if (!isEditMode) return;
                if (window.isSpaceDown) return;
                if (isDrawing && e.buttons === 1) updateCell(x, y); 
            };

            // Add Class and Symbol according to data
            if (cellVal === 0) cellDiv.classList.add('wall');
            else if (cellVal === 'START') cellDiv.classList.add('start');
            else if (cellVal === 'STAIRS_UP') cellDiv.classList.add('stairs_up');
            else if (cellVal === 'STAIRS_DOWN') cellDiv.classList.add('stairs_down');
            else if (cellVal === 'MONSTER') cellDiv.classList.add('monster');
            else if (cellVal === 'MINI_BOSS') cellDiv.classList.add('mini_boss');
            else if (cellVal === 'BOSS') cellDiv.classList.add('boss');
            else if (cellVal === 'TRAP') cellDiv.classList.add('trap');
            else if (cellVal === 'SECRET') cellDiv.classList.add('secret');

            cellDiv.innerText = getCellIcon(cellVal);
            gridDiv.appendChild(cellDiv);
        }
    }

    floorDiv.appendChild(gridDiv);
    container.appendChild(floorDiv);

    // Draw guide path immediately if visible
    if (isGuideVisible) applyGuideToCurrentFloor();
}

window.updateCell = function(x, y) {
    if (!currentMazeData) return;
    const brush = document.getElementById('brushSelect').value;
    const floor = currentMazeData[currentFloorIndex];
    
    // แปลงค่าจาก string เป็นรูปแบบที่ระบบใช้ (0 และ 1 เป็น number นอกนั้นเป็น string)
    let val = brush === '0' ? 0 : (brush === '1' ? 1 : brush);
    
    // อัปเดตข้อมูลใน Data Grid
    floor.grid[y][x] = val;
    
    // อัปเดตแค่ UI ของช่องนั้น (เพื่อให้ไวที่สุด โดยไม่ต้อง render ใหม่ทั้งหน้า)
    const cellDiv = document.getElementById(`cell-${floor.floorNumber}-${x}-${y}`);
    if (cellDiv) {
        cellDiv.className = 'cell'; // เคลียร์ Class เก่าทิ้ง
        cellDiv.innerText = '';
        
        if (val === 0) cellDiv.classList.add('wall');
        else if (val === 'START') cellDiv.classList.add('start');
        else if (val === 'STAIRS_UP') cellDiv.classList.add('stairs_up');
        else if (val === 'STAIRS_DOWN') cellDiv.classList.add('stairs_down');
        else if (val === 'MONSTER') cellDiv.classList.add('monster');
        else if (val === 'MINI_BOSS') cellDiv.classList.add('mini_boss');
        else if (val === 'BOSS') cellDiv.classList.add('boss');
        else if (val === 'TRAP') cellDiv.classList.add('trap');
        else if (val === 'SECRET') cellDiv.classList.add('secret');
        
        cellDiv.innerText = getCellIcon(val);
        
        // ถ้ากดแก้ไขช่องใดๆ ให้ดึง class guide-path ออกเพื่อป้องกันสีทับซ้อน
        cellDiv.classList.remove('guide-path');
    }
};

window.toggleGuide = function() {
    isGuideVisible = !isGuideVisible;
    
    if (currentMazeData && isGuideVisible) {
        const floor = currentMazeData[currentFloorIndex];
        if (!floor.guidePath || floor.guidePath.length === 0) {
            alert('Warning: ไม่พบข้อมูลเส้นทาง Guide ในไฟล์นำเข้านี้ (ระบบไม่สามารถคำนวณเส้นทางใหม่ได้)');
        }
    }
    
    applyGuideToCurrentFloor();
};

function applyGuideToCurrentFloor() {
    if (!currentMazeData) return;
    const floor = currentMazeData[currentFloorIndex];
    
    floor.guidePath.forEach(point => {
        const cell = document.getElementById(`cell-${floor.floorNumber}-${point.x}-${point.y}`);
        if (cell && !cell.classList.contains('wall') && !cell.classList.contains('start') && !cell.classList.contains('stairs_up') && !cell.classList.contains('stairs_down') && !cell.classList.contains('boss')) {
            if (isGuideVisible) {
                cell.classList.add('guide-path');
            } else {
                cell.classList.remove('guide-path');
            }
        }
    });
}

// --- JSON Export System ---
function getCellLabel(x, y) {
    // Convert X axis to Letter (A, B... Z, AA) and Y to number starting from 1
    let colName = '';
    let tempX = x;
    while (tempX >= 0) {
        colName = String.fromCharCode((tempX % 26) + 65) + colName;
        tempX = Math.floor(tempX / 26) - 1;
    }
    return `${colName}${y + 1}`;
}

function isPartOfRoom(grid, x, y, width, length) {
    // Check if cell is part of a 2x2 or larger room
    const check2x2 = (cx, cy) => {
        if (cx < 0 || cy < 0 || cx >= width - 1 || cy >= length - 1) return false;
        return grid[cy][cx] !== 0 && grid[cy][cx+1] !== 0 &&
               grid[cy+1][cx] !== 0 && grid[cy+1][cx+1] !== 0;
    };
    return check2x2(x, y) || check2x2(x - 1, y) || check2x2(x, y - 1) || check2x2(x - 1, y - 1);
}

function getPathShape(grid, x, y, width, length) {
    // Check connections (0 = wall, else path)
    const n = y > 0 && grid[y - 1][x] !== 0;
    const s = y < length - 1 && grid[y + 1][x] !== 0;
    const w = x > 0 && grid[y][x - 1] !== 0;
    const e = x < width - 1 && grid[y][x + 1] !== 0;

    const connections = (n ? 1 : 0) + (s ? 1 : 0) + (w ? 1 : 0) + (e ? 1 : 0);
    const cellVal = grid[y][x];

    let shape = 'ISOLATED';

    if (connections === 4) {
        shape = isPartOfRoom(grid, x, y, width, length) ? 'ROOM' : 'CROSSROAD';
    }
    else if (connections === 3) {
        if (!s) shape = 'T_JUNCTION_N_E_W';
        else if (!n) shape = 'T_JUNCTION_S_E_W';
        else if (!w) shape = 'T_JUNCTION_N_S_E';
        else if (!e) shape = 'T_JUNCTION_N_S_W';
    }
    else if (connections === 2) {
        if (n && s) shape = 'STRAIGHT_N_S';
        else if (e && w) shape = 'STRAIGHT_E_W';
        else if (n && e) shape = 'CORNER_N_E';
        else if (n && w) shape = 'CORNER_N_W';
        else if (s && e) shape = 'CORNER_S_E';
        else if (s && w) shape = 'CORNER_S_W';
    }
    else if (connections === 1) {
        if (n) shape = 'DEADEND_N';
        else if (s) shape = 'DEADEND_S';
        else if (e) shape = 'DEADEND_E';
        else if (w) shape = 'DEADEND_W';
    }

    if (cellVal === 'STAIRS_UP' || cellVal === 'STAIRS_DOWN') {
        if (connections === 1) {
            if (n) return `${cellVal}_N`;
            if (s) return `${cellVal}_S`;
            if (e) return `${cellVal}_E`;
            if (w) return `${cellVal}_W`;
        }
        return cellVal; 
    }

    return shape;
}

window.exportJSON = function() {
    if (!currentMazeData || !lastConfig) return;

    const actualWidth = currentMazeData[0].grid[0].length;
    const actualLength = currentMazeData[0].grid.length;
    const foundationThickness = 5;
    const ceilingThickness = 5; 
    const roomHeight = lastConfig.floorHeight;
    const totalHeight = foundationThickness + (currentMazeData.length * (roomHeight + ceilingThickness));

    const exportData = {
        metadata: {
            config: lastConfig,
            minecraftInfo: {
                totalWidth: actualWidth * lastConfig.pathWidth,
                totalLength: actualLength * lastConfig.pathWidth,
                totalHeight: totalHeight,
                foundationThickness: foundationThickness,
                ceilingThickness: ceilingThickness,
                roomHeight: roomHeight
            },
            generatedAt: new Date().toISOString()
        },
        floors: []
    };

    currentMazeData.forEach((floor, floorIndex) => {
        // Calculate starting Y for the floor
        const startY = foundationThickness + (floorIndex * (roomHeight + ceilingThickness));
        
        const floorData = {
            floorNumber: floor.floorNumber,
            startY: startY,
            guidePath: floor.guidePath,
            cells: []
        };

        for (let y = 0; y < floor.grid.length; y++) {
            for (let x = 0; x < floor.grid[y].length; x++) {
                const cellVal = floor.grid[y][x];
                
                // Only save paths, ignore walls (0) to save file size
                if (cellVal !== 0) {
                    const startX = x * lastConfig.pathWidth;
                    const startZ = y * lastConfig.pathWidth;

                    floorData.cells.push({
                        label: getCellLabel(x, y), // เช่น A1, B5
                        gridCoordinates: { x: x, y: y },
                        minecraftArea: {
                            startX: startX,
                            startY: startY,
                            startZ: startZ,
                            endX: startX + lastConfig.pathWidth - 1,
                            endY: startY + roomHeight - 1,
                            endZ: startZ + lastConfig.pathWidth - 1,
                            width: lastConfig.pathWidth,
                            height: roomHeight,
                            length: lastConfig.pathWidth
                        },
                        type: cellVal === 1 ? 'PATH' : cellVal, // PATH, MONSTER, BOSS, etc.
                        shape: getPathShape(floor.grid, x, y, actualWidth, actualLength)
                    });
                }
            }
        }
        exportData.floors.push(floorData);
    });

    // Convert Object to JSON String
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Simulate button click to download
    const a = document.createElement('a');
    a.href = url;
    a.download = `maze_seed_${lastConfig.seed}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// --- JSON Import System ---
window.importJSON = function(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            loadImportedData(data);
        } catch (err) {
            alert('Error reading JSON file: ' + err.message);
        }
    };
    reader.readAsText(file);
    
    // Reset input to allow selecting the same file again
    fileInput.value = '';
};

function loadImportedData(data) {
    if (!data || !data.metadata || !data.floors || !data.metadata.minecraftInfo) {
        alert('Invalid or unsupported JSON file format');
        return;
    }

    lastConfig = data.metadata.config;
    const pathWidth = lastConfig ? (lastConfig.pathWidth || 3) : 3;
    
    // Calculate original grid width/length
    const actualWidth = Math.round(data.metadata.minecraftInfo.totalWidth / pathWidth);
    const actualLength = Math.round(data.metadata.minecraftInfo.totalLength / pathWidth);

    currentMazeData = data.floors.map(floor => {
        let grid = Array(actualLength).fill().map(() => Array(actualWidth).fill(0));
        
        let startPos = null;
        let endPos = null;
        
        if (floor.cells) {
            floor.cells.forEach(cell => {
                if (cell.gridCoordinates) {
                    const x = cell.gridCoordinates.x;
                    const y = cell.gridCoordinates.y;
                    if (y >= 0 && y < actualLength && x >= 0 && x < actualWidth) {
                        grid[y][x] = cell.type === 'PATH' ? 1 : cell.type;
                        
                        // ค้นหาพิกัดเริ่มต้นและสิ้นสุด เพื่อสร้างเส้น Guide ใหม่สำหรับไฟล์ JSON รุ่นเก่า
                        if (cell.type === 'START') {
                            startPos = { x, y };
                        } else if (cell.type === 'STAIRS_UP' || cell.type === 'STAIRS_DOWN') {
                            if (!startPos) startPos = { x, y };
                            else endPos = { x, y };
                        } else if (cell.type === 'BOSS' && !endPos) {
                            endPos = { x, y }; 
                        }
                    }
                }
            });
        }
        
        let gPath = floor.guidePath;
        if ((!gPath || gPath.length === 0) && startPos && endPos) {
            gPath = findShortestPath(grid, startPos, endPos);
        }
        
        return {
            floorNumber: floor.floorNumber,
            grid: grid,
            guidePath: gPath || [] 
        };
    });

    currentFloorIndex = 0;
    isGuideVisible = false;

    document.getElementById('toggleGuideBtn').disabled = false;
    document.getElementById('exportJsonBtn').disabled = false;
    document.getElementById('floorNavigation').style.display = 'flex';
    
    // Update UI settings
    if (lastConfig) {
        document.getElementById('width').value = lastConfig.width || '';
        document.getElementById('length').value = lastConfig.length || '';
        document.getElementById('floors').value = lastConfig.floors || '';
        document.getElementById('pathWidth').value = lastConfig.pathWidth || '';
        document.getElementById('floorHeight').value = lastConfig.floorHeight || '';
        document.getElementById('difficulty').value = lastConfig.difficulty || '';
        if (lastConfig.startDirection) {
            document.getElementById('startDirection').value = lastConfig.startDirection;
        }
        document.getElementById('seed').value = lastConfig.seed || '';
    }

    const mcTotalHeight = data.metadata.minecraftInfo.totalHeight;
    const totalVolumeImported = (data.metadata.minecraftInfo.totalWidth * data.metadata.minecraftInfo.totalLength * mcTotalHeight).toLocaleString();
    document.getElementById('mcSizeInfo').innerText = `Minecraft Area:\n${data.metadata.minecraftInfo.totalWidth} x ${data.metadata.minecraftInfo.totalLength} x ${mcTotalHeight} blocks\nTotal Volume: ${totalVolumeImported} blocks\n(Imported)`;

    renderMaze();
}
