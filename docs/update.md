# 📜 DungeonsTower V2 UI & Data Architecture Documentation (`update.md`)

Document Created: 2026-08-05  
Status: **Phase 1 UI Design & State Management Completed ➔ Moving to Phase 2 Maze Generation Core Logic**

---

## 📌 1. ภาพรวมโครงสร้างระบบ (Architecture Overview)

ระบบ UI ของ **DungeonsTower Maze Generator V2** (`docs_v2/`) ถูกออกแบบใหม่ด้วยแนวคิด Modern Web Application (อิงตาม Reference `mazemaking.com`) โดยแบ่งเลย์เอาต์ออกเป็น 3 ส่วนหลัก:

1. **Top Navbar (56px):** แถบด้านบนตรึงแน่น แสดงแบรนด์, Dropdown สลับภาษา (`EN` / `TH`), ปุ่มหลัก `Generate Maze / Regenerate`, และปุ่ม `Export JSON`
2. **2-Tier Sidebar (ฝั่งซ้าย):**
   - **Tier 1 (Mini Icon Sidebar - 68px):** ไอคอนเมนูแนวดิ่งสำหรับเลือกหมวดหมู่ 5 แท็บ (`Maze Settings`, `Special Rooms`, `Keys & Quest Items`, `Tile Painter`, `Export`)
   - **Tier 2 (Options Panel Drawer - 280px):** พาเนลตัวเลือกปรับแต่งแบบ Collapsible สามารถพับเก็บได้ด้วยปุ่มลิ้นชักลอย `<` / `>`
3. **Viewport Workspace (ฝั่งขวา 10/12):** พื้นที่แสดงผลเรนเดอร์ Canvas 2D/3D เขาวงกต พร้อมแถบเครื่องมือลอย Zoom In/Out/Reset และปุ่มเลือกสลับชั้น (Floor Selector)

---

## 🗃️ 2. โครงสร้างข้อมูลและสถานะแอพพลิเคชัน (State & Schemas in `app.js`)

### 🔹 2.1 ภาษาและการแปล (i18n System)
* **`currentLang`**: String (`'en'` | `'th'`)
* **`i18n`**: พจนานุกรมแปลภาษาแบบเรียลไทม์ผ่าน attribute `data-i18n="<key>"`

---

### 🔹 2.2 โครงสร้างข้อมูลห้องพิเศษ (Special Rooms Schema - `window.customSpecialRooms`)
Array ของ Object กำหนดเงื่อนไขห้องพิเศษที่ผู้ใช้สร้างด้วยปุ่ม `+`:
```typescript
interface SpecialRoom {
    id: string;              // Unique ID e.g. "room-boss", "room-17859300"
    name: string;            // ชื่อห้อง / ID e.g. "Boss Chamber", "Secret Vault"
    type: 'BOSS' | 'START' | 'MINI_BOSS' | 'TREASURE' | 'PUZZLE'; // ประเภทห้อง
    width: number;           // ความกว้าง (จำนวนคี่ 1 - 15)
    height: number;          // ความยาว (จำนวนคี่ 1 - 15)
    floorRule: string;       // ชั้นที่เกิด ("first" | "final" | "odd" | "even" | "all" | "floor-X")
    expanded: boolean;       // สถานะการพับเก็บการ์ด Accordion
}
```

---

### 🔹 2.3 โครงสร้างข้อมูลกุญแจและไอเทมเควส (Keys & Quest Items Schema - `window.customQuestItems`)
Array ของ Object กำหนดกุญแจและเงื่อนไขการสุ่มวาง:
```typescript
interface QuestItem {
    id: string;              // Unique ID e.g. "item-boss-key"
    name: string;            // ชื่อไอเทม e.g. "Boss Gate Key"
    keyId: string;           // รหัสอ้างอิง e.g. "boss_key_floor3"
    floorRule: string;       // ชั้นที่เกิด ("first" | "final" | "odd" | "even" | "all" | "floor-X")
    mode: 'auto' | 'room';   // รูปแบบการเกิด ("auto": สุ่มทางตัน/หีบลับ | "room": ล็อคประจำห้องพิเศษ)
    lockedRoomId: string;    // ID ของห้องพิเศษใน customSpecialRooms ที่ต้องการล็อคไอเทมใส่
    expanded: boolean;       // สถานะการพับเก็บการ์ด Accordion
}
```

---

### 🔹 2.4 โครงสร้างประเภทบล็อกระบายสี (Tile Painter Brushes - `window.activeBrush`)
ประเภทบล็อกทั้ง 16 ชนิดในระบบ Grid Data:
```typescript
type TileBrush = 
    | '1'            // Path (ทางเดิน)
    | '0'            // Wall (กำแพงทึบ)
    | 'START'        // Start Point (จุดเริ่มต้น)
    | 'STAIRS_UP'    // Stairs Up (บันไดขึ้น)
    | 'STAIRS_DOWN'  // Stairs Down (บันไดลง)
    | 'BOSS'         // Boss Room Tile
    | 'MINI_BOSS'    // MiniBoss Tile
    | 'MONSTER'      // Monster Spawn Point
    | 'TRAP'         // Trap / Hazard Tile
    | 'SECRET'       // Secret Chest Tile
    | 'DOOR'         // Locked Key Door
    | 'QUEST_ITEM'   // Quest Key Spawn Tile
    | 'SHOP'         // Merchant NPC Tile
    | 'PORTAL'       // Teleportation Portal Tile
    | 'BREAKABLE';   // Breakable / Destructible Wall Tile
```

---

## 🛠️ 3. สรุปฟังก์ชันสำคัญใน `docs_v2/app.js`

| ชื่อฟังก์ชัน | หน้าที่และการทำงาน |
| :--- | :--- |
| **`initLanguageSwitcher()`** | สลับภาษาระหว่าง EN / TH และเรียก `applyLanguage()` |
| **`applyLanguage(lang)`** | สแกนโหนดที่มี `data-i18n` และอัปเดตข้อความแปลตามพจนานุกรม |
| **`initNavigationTabs()`** | จัดการคลิกสลับแท็บเมนูหลักใน Tier-1 Icon Sidebar |
| **`initDrawerCollapse()`** | ซ่อน/กางพาเนลตัวเลือก Tier-2 เมื่อคลิกปุ่มลิ้นชักลอย `<` / `>` |
| **`initSubTabs()`** | สลับแท็บย่อย (Dimensions, Algorithm, Seed) ในแท็บ Maze Settings |
| **`initAlgorithmHelper()`** | แสดงคำแนะนำความเหมาะสมของอัลกอริทึม (DFS, Prim's, Kruskal's) |
| **`initInputValidation()`** | Auto-clamp ตัวเลขในช่อง Step Input ไม่ให้พิมพ์ต่ำกว่า min หรือเกิน max |
| **`initSpecialRoomsBuilder()`** | ผูก Event ปุ่ม `+` เพิ่มห้องพิเศษ และการคัดกรอง Filter (Floor / Room Type) |
| **`renderSpecialRooms()`** | เรนเดอร์การ์ดห้องพิเศษแบบ Collapsible Accordion พร้อมสเกล กว้างxยาว 2 แถวเรียงตั้ง |
| **`toggleRoomCard(id, event)`** | พับเก็บ/กางออกการ์ดห้องพิเศษ (Accordion Toggle) |
| **`updateSpecialRoom(id, key, val)`** | อัปเดตคุณสมบัติของห้องพิเศษแบบเรียลไทม์ |
| **`updateRoomSize(id, key, delta)`** | ปรับขนาดกว้าง-ยาวของห้องพิเศษแบบกด Step `-` / `+` (รักษาสเกลเลขคี่) |
| **`deleteSpecialRoom(id, event)`** | ลบการ์ดห้องพิเศษ |
| **`initQuestItemsBuilder()`** | ผูก Event ปุ่ม `+` เพิ่มกุญแจ/ไอเทมเควส และการคัดกรอง Filter 3 มิติ |
| **`renderQuestItems()`** | เรนเดอร์การ์ดไอเทมเควส พร้อมตัวเลือกล็อคใส่ Special Rooms แบบไดนามิก |
| **`initBrushSelector()`** | จัดการการเลือกแปรงระบายสี 16 บล็อก พร้อมเอฟเฟกต์ไฟเขียวมิ้นท์เรืองแสง (`#34d399`) |
| **`initMainGenerateButton()`** | ผูกปุ่มสร้างหลัก Navbar และตรรกะสุ่ม Seed อัจฉริยะ (สุ่มเฉพาะเมื่อเป็น `Dungeons2026` / `seed_`) |
| **`updateMainActionButtonUI()`** | สลับสถานะปุ่มหลักจาก `Generate Maze` (สีฟ้า) ➔ `Regenerate` (สีแดง) หลังกดครั้งแรก |

---

## 🎨 4. สรุป Class และ Styling หลักใน `docs_v2/style.css`

- **`.app-container`**: เลย์เอาต์หลักคลุมทั้งหน้าจอแบบ Flex Column (`100vh`)
- **`.top-navbar`**: แถบ Navbar บนสุด ตรึงความสูง `56px` ดีไซน์เข้มหรู
- **`.icon-sidebar`**: แถบไอคอนสลิมซ้ายมือ ความกว้าง `68px`
- **`.options-panel`**: พาเนลตัวเลือก Tier-2 ความกว้าง `280px` พร้อม `overflow-x: hidden` ป้องกัน Scrollbar แนวนอน
- **`.drawer-toggle-handle`**: ปุ่มลิ้นชักพับเก็บ `<` / `>` อยู่ตรงกลางความสูง (`top: 50%`) ยื่นออกนอกพาเนล `right: -24px`
- **`.room-card` & `.room-card-body`**: การ์ด Accordion สำหรับห้องพิเศษและกุญแจเควส
- **`.filter-bar` & `.filter-bar-3col`**: แถบดร็อปดาวน์คัดกรอง 2 และ 3 คอลัมน์
- **`.brush-grid-4col` & `.brush-icon-box`**: ตารางแปรงระบายสี 4 คอลัมน์ กล่องไอคอนสี่เหลี่ยมมนเรืองแสง พร้อมชื่ออยู่ด้านล่าง
- **`.step-input`**: กล่องปุ่มกดตัวเลข `-` `5` `+` ซ่อนลูกศร Spinner ดั้งเดิมของเบราว์เซอร์

---

## 🚀 5. ขั้นตอนถัดไป (Next Steps for Logic Implementation)

1. **สร้าง Core Generator Modules ใน `docs_v2/src/`**:
   - `mazeGenerator.js`: สร้างเขาวงกตอิงตาม PRNG Seed และอัลกอริทึมที่เลือก (DFS, Prim's, Kruskal's)
   - `roomPlacer.js`: สุ่มวางห้องพิเศษตาม `window.customSpecialRooms` (Boss, Start, MiniBoss, Treasure)
   - `itemPlacer.js`: สุ่มวางกุญแจและไอเทมเควสตาม `window.customQuestItems`
   - `canvasRenderer.js`: เรนเดอร์แผนที่เขาวงกต multi-floor ลงบน Canvas 2D/3D

---

## 📐 6. มาตรฐานโครงสร้างไฟล์ส่งออก JSON (DungeonsTower V2 JSON Schema)

โครงสร้าง JSON มาตรฐานใหม่สำหรับนำไปใช้กับ Minecraft Plugin และระบบ WorldEdit/FAWE Schematics:

```json
{
  "metadata": {
    "version": "2.0",
    "generator": "DungeonsTower Maze Generator",
    "createdAt": "2026-08-05T19:46:25.000Z"
  },

  "settings": {
    "dimensions": {
      "columns": 21,
      "rows": 21,
      "floors": 3
    },
    "algorithm": {
      "type": "DFS",
      "straightnessProbability": 0.5,
      "complexity": 5
    },
    "difficulty": {
      "monsterDensity": 5,
      "minibossFrequency": 5,
      "trapDensity": 5,
      "secretChestFrequency": 5
    },
    "seed": "seed_849201",
    "startDirection": "bottom_to_top"
  },

  "unassignedEntities": [
    {
      "id": "key-free-1",
      "name": "Entrance Key",
      "keyId": "key_entrance",
      "type": "KEY",
      "floorRule": "first",
      "mode": "auto"
    }
  ],

  "specialRooms": [
    {
      "id": "room-start",
      "name": "Dungeon Entrance",
      "type": "START",
      "width": 3,
      "height": 3,
      "floorRule": "first",
      "assignedEntities": []
    },
    {
      "id": "room-boss",
      "name": "Boss Chamber",
      "type": "BOSS",
      "width": 5,
      "height": 5,
      "floorRule": "final",
      "assignedEntities": [
        {
          "id": "item-boss-key",
          "name": "Boss Gate Key",
          "keyId": "boss_key_floor3",
          "type": "KEY"
        }
      ]
    }
  ],

  "floors": [
    {
      "floor": 1,
      "grid": [
        [0, 0, 0, 0, 0],
        [0, "START", 1, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 1, "STAIRS_UP", 0],
        [0, 0, 0, 0, 0]
      ],
      "rooms": [
        {
          "roomId": "room-start",
          "bounds": { "x": 1, "y": 1, "width": 3, "height": 3 }
        }
      ],
      "entities": [
        {
          "id": "key-free-1",
          "position": { "x": 3, "y": 1 }
        }
      ],
      "guidePath": [
        { "x": 1, "y": 1 },
        { "x": 2, "y": 1 },
        { "x": 3, "y": 1 }
      ]
    }
  ]
}
```

---

## 🧩 7. สรุปกฎตรรกะและความสัมพันธ์ในการสุ่มสร้างดันเจี้ยน (Dungeon Logic Rules)

1. **จุดเริ่มต้นเดียว (`START`)**:
   - สุ่มวางจุด `START` เพียงจุดเดียวเฉพาะใน **ชั้นเริ่มต้นเท่านั้น** (ชั้น 1 หากเริ่มจากล่างขึ้นบน หรือชั้น N หากเริ่มจากบนลงล่าง)

2. **บันไดเชื่อมต่อแนวตั้ง 1:1 (Vertical 1:1 Stairs Alignment)**:
   - บันไดขึ้น (`STAIRS_UP`) ในชั้นล่าง และบันไดลง (`STAIRS_DOWN`) ในชั้นถัดไป จะมี **พิกัด (X, Y) ตรงกันเป๊ะ 100%** เพื่อความสมจริงเมื่อเคลื่อนที่ระหว่างชั้น

3. **การเก็บค่า `pathWidth` และ `floorHeight` ใน JSON**:
   - เพิ่มค่า `pathWidth` (ความกว้างทางเดิน e.g. 3 บล็อก) และ `floorHeight` (ความสูงต่อชั้น e.g. 5 บล็อก) ใน `settings.dimensions` สำหรับ Minecraft Plugin

4. **การคำนวณช่วงชั้นเกิดศัตรูและห้องพิเศษ (Floor Interval Cadence)**:
   - กรณีดันเจี้ยนมีหลายชั้น (เช่น 50-100 ชั้น) ระบบจะคำนวณระยะห่างช่วงชั้น (Interval) เพื่อวาง MiniBoss และห้องพิเศษกระจายอย่างเหมาะสม (เช่น ทุกๆ 5 หรือ 10 ชั้น)

5. **เงื่อนไขและความสัมพันธ์ของห้องและบล็อกพิเศษ**:
   - 🚪 **DOOR (ประตูเงื่อนไข)**: วางขวางหน้าห้อง `BOSS` และ `MINI_BOSS` โดยระบบจะสร้างรายการกุญแจ (`KEY`) ใน `unassignedEntities` ให้อัตโนมัติสำหรับนำไปตั้งค่าดร็อปใน Plugin
   - 💎 **SECRET (ห้องลับ)**: วางเฉพาะจุด **ทางตัน (Dead-End)** และมีกำแพงพังได้ **`BREAKABLE`** หรือ **`DOOR`** วางปิดขวางทางเข้าเสมอ
   - 💣 **TRAP (กับดัก)**: วาง 2 รูปแบบ คือ **Chokepoint** ขวางทางเดินบังคับผ่านบนเส้นทางหลัก (Guide Path) และ **Dead-End Lure** หลอกล่อทางตัน
   - 👑 **BOSS (ห้องบอส)**: วางจุดสิ้นสุดของชั้นสุดท้ายเท่านั้น มีทางเข้าทางเดียวขวางด้วย `DOOR` และไม่มีบันไดไปต่อ
   - 👹 **MINI_BOSS (มินิบอส)**: วางก่อนถึงบันไดขึ้นชั้นถัดไปในแต่ละช่วงชั้น
   - 🌀 **PORTAL (พอร์ทัลวาร์ป)**: สุ่มวางในจุดทางตัน (Dead-End) และบันทึกพิกัดไว้สำหรับ Plugin

---

## 🔑 8. ระบบการตั้งชื่อรหัสห้อง (Room Naming) และการเชื่อมโยงประตู-กุญแจ (Door-Key Syncing)

1. **การตั้งชื่อรหัสพิกัดตาราง Grid Notation (Battleship / Chess Grid Notation)**:
   - **แกน X (Columns / ความกว้าง)**: ใช้ตัวอักษรภาษาอังกฤษตามลำดับคอลัมน์ (**`A`**, **`B`**, **`C`**, **`D`**, **`E`**...)
   - **แกน Y (Rows / ความยาว)**: ใช้ตัวเลขลำดับแถว (**`1`**, **`2`**, **`3`**, **`4`**, **`5`**...)
   - **ตัวอย่างรหัสพิกัด**: พิกัด `(x: 2, y: 4)` จะเปลี่ยนเป็นรหัสพิกัด **`C5`**

2. **การกำหนดยืนยันตัวตนรหัสประจำห้อง (Unique Room Identifier)**:
   - ทุกห้องพิเศษที่ถูกสุ่มวางจะได้รับรหัสพิกัดจุดศูนย์กลางห้อง เช่น **`Boss Chamber [C5]`**, **`MiniBoss Arena [F12]`**
   - บันทึกค่า `roomId` และ `gridNotation` ประจำห้องแบบ Unique เช่น `room_c5`, `room_f12`

3. **การเชื่อมโยงประตูเงื่อนไข (`DOOR`) กับกุญแจเควส (`KEY`)**:
   - ประตูหน้าห้องจะถูกบันทึกตำแหน่งพิกัดแบบ Grid Notation เช่น `position: { x: 12, y: 4, gridNotation: "M5" }`
   - ผูกค่า **`requiredKeyId`** ที่ตรงกับกุญแจประจำห้อง เช่น `key_room_c5` หรือผูกกับ Custom Quest Item ที่ล็อคไว้กับห้องนั้นให้อัตโนมัติ!



