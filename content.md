# 🏰 สรุปโครงสร้างและระบบการสร้าง Maze Dungeons Tower (DungeonsTower Generator System)

เอกสารสรุปภาพรวม กลไกการทำงาน โมดูล/ฟังก์ชันหลัก และขั้นตอนการสร้างเขาวงกตหลากชั้น (Multi-floor Maze Generator) แบบรัดกุม

---

## 📁 1. โครงสร้างไฟล์หลัก (Modules Overview)

ระบบเขียนด้วย JavaScript ES Modules แบ่งแยกหน้าที่ออกเป็น 3 โมดูลหลักใน `docs/src/` และ UI controller ใน `docs/app.js`:

1. **`mazeGenerator.js`**: หัวใจหลักในการสร้างโครงสร้างเขาวงกต (Grid) แต่ละชั้น รวมถึงห้องบอส ห้องมินิบอส และห้องสุ่ม
2. **`entityPlacer.js`**: ระบบวาง Entity (มอนสเตอร์, กับดัก, กล่องความลับ/รางวัล) ตาม Quota และระยะห่างปลอดภัย (Safe Radius)
3. **`pathfinder.js`**: ระบบหาเส้นทาง BFS สำหรับนำทาง (Guide Path) และการสุ่มจุดวางบันไดขึ้น/ลงให้อยู่ไกลที่สุด
4. **`app.js`**: Controller สำหรับรับ Config จัดการ Canvas UI/Inspector และแปลงข้อมูลออกเป็น JSON

---

## ⚙️ 2. ขั้นตอนการทำงานของการสร้างเขาวงกต (`generateMultiFloorMaze`)

กระบวนการสร้างเขาวงกตทำงานตามขั้นตอนดังนี้:

### Step 1: Initialization & Seed Setting
* ใช้ **PRNG (Seeded Random - Math.imul)** สร้างค่าสุ่มจาก Seed เพื่อให้ผลลัพธ์การสุ่มคงที่เมื่อใช้ Seed เดิม
* ปรับขนาด Width / Length ให้เป็น **เลขคี่** เสมอ เพื่อรักษาโครงสร้าง Grid (ทางเดิน + กำแพง)

### Step 2: Special Rooms Allocation (จองพื้นที่ห้องพิเศษ)
* **Boss Room (ชั้นสุดท้าย):** ขนาด 5x5 (หรือ 3x3 บนแมพเล็ก) วางตรงข้ามจุดเริ่ม เจาะประตูเข้าเพียง 1 ช่อง (`getValidHoles`)
* **MiniBoss Room (ชั้นเลขคี่):** ขนาด 3x3 วางแบบ Chokepoint และเจาะประตูทางเข้า 1 ช่อง

### Step 3: Maze Carving (เซาะทางเดินด้วย Recursive Backtracker - DFS)
* **Primary DFS:** ขุดทางเดินจากจุดเริ่มต้น (`startPoint`) โดยใช้ค่า `straightnessProbability` (อิงตามค่า `mazeComplexity`) ในการสุ่มเดินตรงหรือเลี้ยว
* **Secondary Fallback DFS:** สแกนหาพื้นที่กำแพงที่หลงเหลือและยังเข้าไม่ถึง เพื่อเจาะทางเดินเพิ่มเติม ป้องกันแผนที่ขาดออกจากกัน
* **Wall Punching & Large Rooms:** เจาะรูประตู Halo ของห้องบอส/มินิบอส และสุ่มสกัดห้องโถงใหญ่ (ขนาด 3x3 หรือ 5x5) ตามพื้นที่

### Step 4: Stairs & Pathfinding Connection
* กำหนดจุดเริ่มต้น (`START` ชั้นแรก หรือ `STAIRS_DOWN` ชั้นถัดไป)
* หาจุดสิ้นสุดของชั้นโดยใช้ BFS:
  * ชั้นสุดท้าย: หาเส้นทางไปยังห้อง Boss (`findForcedPath`)
  * ชั้นอื่นๆ: หาจุด dead-end หรือจุดไกลสุด (`findFurthestDeadEnd` / `findFurthestPoint`) วาง `STAIRS_UP`
* สร้างเส้นทางไกด์นำทาง (`guidePath`) สำหรับผู้เล่น

### Step 5: Entity & Encounter Placement (`placeEntities`)
* **Quota System:** คำนวณจำนวน MiniBoss, Trap, Monster, Secret ตามพื้นที่แมพและค่า `encounterDifficulty`
* **Safe Radius Spacing:** กำหนดระยะห่างขั้นต่ำ (Manhattan Distance) เพื่อไม่ให้มอนสเตอร์หรือกับดักเกิดติดกันเกินไป
* **Main Path Pacing:** วางทางเดินปลอดภัย (Safe Space อย่างน้อย 3 บล็อก) สลับกับการเจอศัตรูบนเส้นทางนำทาง
* **Off-Path & Dead-Ends:** สุ่มวาง Secret/Reward ในทางตัน (Dead End) และกระจายศัตรูย่อยตามเส้นทางรอง

### Step 6: Top-Down Direction Adjustments
* หากเลือกสร้างแบบลงจากชั้นบน (`startDirection === 'top'`) ระบบจะสลับสัญลักษณ์บันได `STAIRS_UP` ↔ `STAIRS_DOWN`

---

## 🏷️ 3. ค่าสถานะในตาราง Grid (Grid Data Values)

| ค่าใน Grid | ความหมาย / หน้าที่ |
| :--- | :--- |
| `0` | Wall (กำแพงทึบ) |
| `1` | Path (ทางเดินว่าง) |
| `'START'` | จุดเริ่มต้นชั้น 1 |
| `'STAIRS_UP'` | บันไดขึ้นชั้นถัดไป |
| `'STAIRS_DOWN'` | บันไดลงชั้นถัดไป |
| `'BOSS'` | พื้นที่ห้อง Boss |
| `'MINI_BOSS'` | ตำแหน่ง Spawn / ห้อง MiniBoss |
| `'MONSTER'` | ตำแหน่ง Spawn มอนสเตอร์ทั่วไป |
| `'TRAP'` | ตำแหน่งกับดัก |
| `'SECRET'` | หีบสมบัติ / จุดลับ |
| `'DOOR'` | ประตูเงื่อนไข (เช่น ต้องใช้กุญแจ) |

---

## 🛠️ 4. สรุปฟังก์ชันสำคัญในแต่ละ Module

### 🔹 `mazeGenerator.js`
* `generateMultiFloorMaze(config)`: ฟังก์ชันหลักในการสร้างเขาวงกตทั้งหมด
* `createPRNG(seedStr)`: ฟังก์ชันสุ่ม Seed แบบดั้งเดิม
* `getValidHoles(rx, ry, w, h, width, length)`: หาพิกัดเลขคี่สำหรับเจาะประตูเข้าห้อง

### 🔹 `pathfinder.js`
* `findShortestPath(grid, start, end)`: ค้นหาเส้นทางสั้นสุดด้วย BFS
* `findFurthestPoint(grid, start, forbidden)`: หาจุดไกลสุดจากจุดเริ่มต้น
* `findFurthestDeadEnd(grid, start, forbidden)`: หาทางตันที่อยู่ไกลสุดสำหรับวางบันได
* `findForcedPath(grid, waypoints)`: เชื่อมเส้นทางผ่านจุดบังคับ (Waypoints)

### 🔹 `entityPlacer.js`
* `placeEntities(...)`: คำนวณ Quota, เช็ค Safe Radius และกระจาย Entity ลงบน Grid
