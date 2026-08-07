// DungeonsTower Generator V2 - Main App Controller & i18n System
import { generateMazeV2, recalculateGuidePath, toGridNotation } from './src/mazeGenerator.js';
import { renderFloorCanvas, TILE_EMOJIS } from './src/canvasRenderer.js';

// Language Dictionaries (Base: EN & TH)
const i18n = {
    en: {
        btn_regenerate: "Regenerate",
        btn_export_json: "Export JSON",
        tab_maze: "Maze Settings",
        tab_rooms: "Special Rooms",
        tab_entities: "Keys & Quest Items",
        nav_keys: "Keys & Items",
        tab_tools: "Tile Painter",
        tab_import: "Import JSON",
        sub_dimensions: "Dimensions",
        sub_algorithm: "Algorithm",
        sub_seed: "Seed",
        sub_dim: "Dimensions",
        sub_algo: "Algorithm",
        lbl_rows: "Rows (Length)",
        lbl_cols: "Columns (Width)",
        lbl_floors: "Floors Count",
        lbl_path_width: "Path Width (Blocks)",
        lbl_floor_height: "Floor Height (Blocks)",
        lbl_foundation_height: "Foundation Height (Blocks)",
        lbl_floor_gap: "Floor Gap / Ceiling (Blocks)",
        lbl_start_direction: "Start Direction",
        lbl_start_dir: "Start Direction",
        dir_bottom: "Bottom ➔ Top (Floor 1 Entrance)",
        dir_top: "Top ➔ Bottom (Floor N Entrance)",
        opt_start_bottom: "Bottom ➔ Top ⬆",
        opt_start_top: "Top ➔ Bottom ⬇",
        help_start_direction: "Set dungeon entrance & stair direction.",
        help_start_dir: "Set dungeon entrance & stair direction.",
        lbl_algorithm: "Generation Algorithm",
        lbl_algo: "Generation Algorithm",
        help_algo_dfs: "🏰 Best for Towers & Castles. Creates long winding corridors and deep dead-ends.",
        help_algo_prim: "🕳️ Best for Natural Caves & Mines. Creates short branching paths with many small junctions.",
        help_algo_kruskal: "🏛️ Best for Ruins & Catacombs. Creates balanced, uniform maze patterns across the map.",
        lbl_complexity: "Maze Path Complexity (0-10)",
        lbl_placement_diff: "Room & Spawn Placement (0-10)",
        lbl_monster_density: "Monster Density (0-10)",
        lbl_miniboss_freq: "MiniBoss Frequency (0-10)",
        lbl_trap_density: "Trap Density (0-10)",
        lbl_secret_freq: "Secret Frequency (0-10)",
        btn_add_room: "Add Room",
        desc_special_rooms: "Configure custom special room rules (Boss, Start, MiniBoss, Treasure) for maze generation:",
        lbl_room_name: "Room Name / Quest ID",
        lbl_room_type: "Room Type",
        lbl_room_size: "Dimensions (W x H)",
        lbl_floor_rule: "Target Floor",
        rule_final: "Final Floor Only",
        rule_first: "First Floor Only",
        rule_odd: "Odd Floors Only",
        rule_all: "All Floors",
        btn_add_item: "Add Key / Item",
        desc_quest_items: "Configure quest keys, emblems, and secret room triggers (Auto-placed or Locked to Special Rooms):",
        lbl_item_name: "Item / Key Name",
        lbl_item_key_id: "Key / Item ID",
        lbl_placement_mode: "Placement Mode",
        mode_auto: "🎲 Auto Placement (Dead-ends / Secrets)",
        mode_room: "🔒 Locked to Special Room",
        lbl_target_room: "Target Special Room",
        lbl_seed: "Seed Text",
        lbl_brush_desc: "Click to select a tile brush to paint on maze grid:",
        brush_path: "Path",
        brush_wall: "Wall",
        brush_start: "Start",
        brush_stairs_up: "Stairs Up",
        brush_stairs_down: "Stairs Dn",
        brush_boss: "Boss",
        brush_miniboss: "MiniBoss",
        brush_monster: "Monster",
        brush_trap: "Trap",
        brush_secret: "Secret",
        brush_door: "Door",
        brush_quest: "Key Item",
        brush_shop: "Shop NPC",
        brush_portal: "Portal",
        brush_breakable: "Breakable",
        desc_import: "Upload a previously exported DungeonsTower JSON file to restore settings, rooms, keys, and canvas grid for editing:",
        lbl_upload_json: "Drag & Drop JSON file here",
        lbl_shortcuts_title: "Keyboard Shortcuts Guide",
        lbl_drag: "Drag Mouse",
        lbl_paint_anywhere: "Hold to Paint Tiles",
        lbl_undo_action: "Undo Last Paint",
        lbl_redo_action: "Redo Action",
        btn_generate: "Generate Maze",
        btn_download_json: "Download JSON",
        btn_reset_defaults: "Reset to Defaults",
        lbl_guide_path: "Guide Path",
        placeholder_title: "DungeonsTower Maze Generator",
        placeholder_desc: "Adjust settings and click \"Regenerate\" to build maze.",
        tile_0: "Wall",
        tile_1: "Path",
        tile_START: "Start Entrance",
        tile_STAIRS_UP: "Stairs Up",
        tile_STAIRS_DOWN: "Stairs Down",
        tile_BOSS: "Boss Room",
        tile_MINI_BOSS: "MiniBoss Room",
        tile_TRAP: "Trap Room",
        tile_SECRET: "Secret Area",
        tile_ROOM: "Special Room",
        tile_TREASURE: "Treasure Room",
        tile_PUZZLE: "Puzzle Room",
        tile_MONSTER: "Monster Spawn",
        tile_DOOR: "Locked Door",
        tile_QUEST_ITEM: "Key / Quest Item",
        tile_SHOP: "Merchant Shop",
        tile_PORTAL: "Teleport Portal",
        tile_BREAKABLE: "Breakable Wall"
    },
    th: {
        btn_regenerate: "สร้างเขาวงกตใหม่",
        btn_export_json: "ส่งออก JSON",
        tab_maze: "ตั้งค่าเขาวงกต",
        tab_rooms: "ห้องพิเศษ & บอส",
        tab_entities: "ไอเทมเควส & กุญแจ",
        nav_keys: "กุญแจ",
        tab_tools: "เครื่องมือระบายสี",
        tab_import: "นำเข้าไฟล์ JSON",
        sub_dimensions: "ขนาดเขาวงกต",
        sub_algorithm: "อัลกอริทึม",
        sub_seed: "Seed",
        sub_dim: "ขนาด",
        sub_algo: "อัลกอริทึม",
        lbl_rows: "ความยาว (Rows)",
        lbl_cols: "ความกว้าง (Columns)",
        lbl_floors: "จำนวนชั้น",
        lbl_path_width: "ความกว้างทางเดิน (บล็อก)",
        lbl_floor_height: "ความสูงต่อชั้น (บล็อก)",
        lbl_start_direction: "ทิศทางเริ่มต้น",
        lbl_start_dir: "ทิศทางเริ่มต้น",
        dir_bottom: "ล่าง ➔ บน (ทางเข้าชั้น 1)",
        dir_top: "บน ➔ ล่าง (ทางเข้าชั้นสูงสุด)",
        opt_start_bottom: "ล่าง ➔ บน ⬆",
        opt_start_top: "บน ➔ ล่าง ⬇",
        help_start_direction: "กำหนดทิศทางจุดเริ่มต้นของดันเจี้ยนและบันได",
        help_start_dir: "ทิศทางจุดเริ่มลุยและบันได",
        lbl_algorithm: "อัลกอริทึมในการสร้าง",
        lbl_algo: "อัลกอริทึมในการสร้าง",
        help_algo_dfs: "🏰 เหมาะกับหอคอย & ปราสาท สร้างทางเดินยาวคดเคี้ยวและทางตันลึก",
        help_algo_prim: "🕳️ เหมาะกับถ้ำธรรมชาติ & เหมือง สร้างทางแยกย่อยสั้นๆ จำนวนมาก",
        help_algo_kruskal: "🏛️ เหมาะกับซากโบราณสถาน & สุสานใต้ดิน สร้างรูปแบบเขาวงกตที่กระจายตัวสมดุล",
        lbl_complexity: "ความซับซ้อนเส้นทาง (0-10)",
        lbl_placement_diff: "การวางห้อง & ระดับความยาก (0-10)",
        lbl_monster_density: "ความหนาแน่นมอนสเตอร์ (0-10)",
        lbl_miniboss_freq: "อัตราเกิด MiniBoss (0-10)",
        lbl_trap_density: "ความหนาแน่นกับดัก (0-10)",
        lbl_secret_freq: "อัตราเกิดพื้นที่ลับ (0-10)",
        btn_add_room: "เพิ่มห้อง",
        desc_special_rooms: "กำหนดเงื่อนไขห้องพิเศษ (ห้องบอส, ห้องเริ่มต้น, ห้องมินิบอส, ห้องสมบัติ) สำหรับสร้างเขาวงกต:",
        lbl_room_name: "ชื่อห้อง / Quest Key ID",
        lbl_room_type: "ประเภทห้อง",
        lbl_room_size: "ขนาดห้อง (กว้าง x ยาว)",
        lbl_floor_rule: "เกิดในชั้น",
        rule_final: "ชั้นสุดท้ายเท่านั้น",
        rule_first: "ชั้นแรกเท่านั้น",
        rule_odd: "ชั้นเลขคี่เท่านั้น",
        rule_all: "ทุกชั้น",
        btn_add_item: "เพิ่มกุญแจ/ไอเทม",
        desc_quest_items: "กำหนดกุญแจเควส ไอเทมเงื่อนไข และกุญแจเข้าห้องลับ (สุ่มวางอัตโนมัติ หรือล็อคประจำห้องพิเศษ):",
        lbl_item_name: "ชื่อไอเทม / กุญแจ",
        lbl_item_key_id: "รหัส Key / Item ID",
        lbl_placement_mode: "รูปแบบการวางตำแหน่ง",
        mode_auto: "🎲 สุ่มวางอัตโนมัติ (ตามทางตัน/หีบลับ)",
        mode_room: "🔒 ล็อคประจำห้องพิเศษ (Special Room)",
        lbl_target_room: "เลือกห้องพิเศษที่ต้องการล็อค",
        lbl_seed: "ข้อความ Seed",
        lbl_boss_room: "ห้อง Boss (ชั้นสุดท้าย 5x5)",
        lbl_miniboss_room: "ห้อง MiniBoss (3x3)",
        lbl_encounter_diff: "ระดับความยากของศัตรู (1-10)",
        lbl_traps: "เกิดกับดัก (Traps)",
        lbl_secrets: "เกิดพื้นที่ลับ (Secrets)",
        lbl_brush_desc: "คลิกเลือกบล็อกสำหรับระบายบนเขาวงกต:",
        brush_path: "ทางเดิน",
        brush_wall: "กำแพง",
        brush_start: "จุดเริ่ม",
        brush_stairs_up: "บันไดขึ้น",
        brush_stairs_down: "บันไดลง",
        brush_boss: "บอส",
        brush_miniboss: "มินิบอส",
        brush_monster: "มอนสเตอร์",
        brush_trap: "กับดัก",
        brush_secret: "จุดลับ",
        brush_door: "ประตู",
        brush_quest: "กุญแจ",
        brush_shop: "ร้านค้า",
        brush_portal: "พอร์ทัล",
        brush_breakable: "กำแพงพัง",
        desc_import: "อัปโหลดไฟล์ DungeonsTower JSON ที่เคยส่งออกไว้ เพื่อดึงการตั้งค่า, ห้องพิเศษ, กุญแจ และบล็อกบน Canvas กลับมาแก้ไขใหม่:",
        lbl_upload_json: "ลากและวางไฟล์ JSON ตรงนี้",
        lbl_shortcuts_title: "คู่มือใช้งานคีย์ลัด (Shortcuts)",
        lbl_drag: "ลากเมาส์",
        lbl_paint_anywhere: "กดค้างเพื่อระบายสีบล็อก",
        lbl_undo_action: "ย้อนกลับการระบายสี",
        lbl_redo_action: "ทำซ้ำการระบายสี",
        btn_generate: "สร้างเขาวงกต",
        btn_download_json: "ดาวน์โหลด JSON",
        btn_reset_defaults: "รีเซ็ตค่าเริ่มต้น",
        lbl_guide_path: "เส้นทางไกด์",
        placeholder_title: "ระบบสร้างเขาวงกต DungeonsTower",
        placeholder_desc: "ปรับแต่งค่าและกดปุ่ม \"Regenerate\" ด้านบนเพื่อเริ่มเรนเดอร์",
        tile_0: "กำแพง (Wall)",
        tile_1: "ทางเดิน (Path)",
        tile_START: "จุดเริ่มต้นดันเจี้ยน (Start)",
        tile_STAIRS_UP: "บันไดขึ้น (Stairs Up)",
        tile_STAIRS_DOWN: "บันไดลง (Stairs Down)",
        tile_BOSS: "ห้องบอส (Boss Room)",
        tile_MINI_BOSS: "ห้องมินิบอส (MiniBoss)",
        tile_TRAP: "ห้องกับดัก (Trap)",
        tile_SECRET: "พื้นที่ลับ (Secret Area)",
        tile_ROOM: "ห้องพิเศษ (Room)",
        tile_TREASURE: "ห้องสมบัติ (Treasure)",
        tile_PUZZLE: "ห้องปริศนา (Puzzle)",
        tile_MONSTER: "จุดเกิดมอนสเตอร์ (Monster)",
        tile_DOOR: "ประตู (Door)",
        tile_QUEST_ITEM: "กุญแจ / ไอเทมเควส (Key Item)",
        tile_SHOP: "ร้านค้า NPC (Shop)",
        tile_PORTAL: "พอร์ทัล (Portal)",
        tile_BREAKABLE: "กำแพงพังได้ (Breakable)"
    }
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
    initNavigationTabs();
    initDrawerCollapse();
    initSubTabs();
    initAlgorithmHelper();
    initSeedGenerator();
    initZoomControls();
    initInputValidation();
    initSpecialRoomsBuilder();
    initQuestItemsBuilder();
    initBrushSelector();
    initResetDefaults();
    initImportJSON();
    initMainGenerateButton();
    initFloorNavigation();
    applyLanguage(currentLang);
});

window.activeBrush = '1';

function initBrushSelector() {
    document.querySelectorAll('.brush-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.brush-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            window.activeBrush = card.getAttribute('data-brush');
        });
    });
}

// Special Rooms Builder State & Logic
window.customSpecialRooms = [];

function initSpecialRoomsBuilder() {
    const btnAdd = document.getElementById('btnAddRoom');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const newId = 'room-' + Date.now();
            window.customSpecialRooms.forEach(r => r.expanded = false);
            window.customSpecialRooms.push({
                id: newId,
                name: '',
                type: 'SECRET',
                width: 3,
                height: 3,
                floorMode: 'custom', // 'custom', 'planned', 'all'
                targetFloors: [1], // Used when floorMode is 'custom'
                expanded: true
            });
            renderSpecialRooms();
        });
    }

    const cfgFloors = document.getElementById('cfgFloors');
    if (cfgFloors) {
        cfgFloors.addEventListener('change', renderSpecialRooms);
    }

    document.getElementById('filterRoomFloor')?.addEventListener('change', renderSpecialRooms);
    document.getElementById('filterRoomType')?.addEventListener('change', renderSpecialRooms);

    renderSpecialRooms();
}

function renderSpecialRooms() {
    const container = document.getElementById('specialRoomsList');
    if (!container) return;

    const filterFloorSelect = document.getElementById('filterRoomFloor');
    const filterTypeSelect = document.getElementById('filterRoomType');

    const totalFloors = parseInt(document.getElementById('cfgFloors')?.value) || 3;

    // Dynamically update floor filter options based on cfgFloors
    if (filterFloorSelect && filterFloorSelect.options.length <= 1) {
        const currentSelected = filterFloorSelect.value || 'all';
        let floorFilterHTML = '<option value="all">🏢 All Floors</option>';
        for (let f = 1; f <= totalFloors; f++) {
            const val = f === totalFloors ? 'final' : (f === 1 ? 'first' : `floor-${f}`);
            const tag = f === 1 ? ' (First)' : (f === totalFloors ? ' (Final)' : '');
            floorFilterHTML += `<option value="${val}" ${currentSelected === val ? 'selected' : ''}>🏢 Floor ${f}${tag}</option>`;
        }
        floorFilterHTML += '<option value="odd" data-i18n="rule_odd">Odd Floors</option>';
        floorFilterHTML += '<option value="even">Even Floors</option>';
        filterFloorSelect.innerHTML = floorFilterHTML;
    }

    const selectedFloor = filterFloorSelect ? filterFloorSelect.value : 'all';
    const selectedType = filterTypeSelect ? filterTypeSelect.value : 'all';

    container.innerHTML = '';

    const roomTypeIcons = {
        BOSS: '👑',
        START: '🏁',
        MINI_BOSS: '👹',
        TRAP: '💣',
        SECRET: '💎',
        ROOM: '🏛️'
    };

    // Filter room list by active floor & room type filters
    const filteredRooms = window.customSpecialRooms.filter(room => {
        const matchType = (selectedType === 'all' || room.type === selectedType);
        let matchFloor = true;
        if (selectedFloor !== 'all') {
            if (room.floorMode === 'custom' && Array.isArray(room.targetFloors)) {
                let fNum = 1;
                if (selectedFloor === 'first') fNum = 1;
                else if (selectedFloor === 'final') fNum = totalFloors;
                else if (selectedFloor.startsWith('floor-')) fNum = parseInt(selectedFloor.replace('floor-', '')) || 1;
                matchFloor = room.targetFloors.includes(fNum);
            } else if (room.floorRule) {
                matchFloor = (room.floorRule === 'all' || room.floorRule === selectedFloor);
            }
        }
        return matchType && matchFloor;
    });

    if (filteredRooms.length === 0) {
        container.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 1rem;">No special rooms configured. Click + to add.</div>';
        return;
    }

    filteredRooms.forEach((room) => {
        const displayName = room.name ? `${room.name} (${room.width}x${room.height})` : `${room.type} Room (${room.width}x${room.height})`;

        const floorMode = room.floorMode || 'custom';
        const targetFloors = Array.isArray(room.targetFloors) && room.targetFloors.length > 0 ? room.targetFloors : [1];

        // Build floor pills HTML for Custom Mode
        let floorPillsHTML = '';
        if (floorMode === 'custom') {
            targetFloors.forEach((fNum, idx) => {
                let optionsHTML = '';
                for (let f = 1; f <= totalFloors; f++) {
                    const tag = f === 1 ? ' (First)' : (f === totalFloors ? ' (Final)' : '');
                    optionsHTML += `<option value="${f}" ${fNum === f ? 'selected' : ''}>🏢 Floor ${f}${tag}</option>`;
                }

                floorPillsHTML += `
                    <div class="floor-select-row" style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.35rem;">
                        <select style="flex: 1;" onchange="updateRoomTargetFloor('${room.id}', ${idx}, this.value)">
                            ${optionsHTML}
                        </select>
                        ${targetFloors.length > 1 ? `
                            <button class="btn-delete-room" onclick="removeRoomTargetFloor('${room.id}', ${idx})" title="Remove Floor"><i class="fa-solid fa-xmark"></i></button>
                        ` : ''}
                    </div>
                `;
            });
            floorPillsHTML += `
                <button class="btn btn-outline-sm full-width" style="margin-top: 0.5rem; font-size: 0.72rem;" onclick="addRoomTargetFloor('${room.id}')">
                    <i class="fa-solid fa-plus"></i> เพิ่มชั้นเป้าหมาย
                </button>
            `;
        }

        const card = document.createElement('div');
        card.className = `room-card ${room.expanded ? 'expanded' : ''}`;
        card.setAttribute('data-id', room.id);
        card.innerHTML = `
            <div class="room-card-header" onclick="toggleRoomCard('${room.id}', event)">
                <div class="room-card-header-left">
                    <span class="room-type-badge">${roomTypeIcons[room.type] || '🏛️'} ${displayName}</span>
                </div>
                <div class="room-card-header-right">
                    <button class="btn-delete-room" onclick="deleteSpecialRoom('${room.id}', event)" title="Delete Room"><i class="fa-solid fa-trash"></i></button>
                    <i class="fa-solid fa-chevron-down room-arrow-icon"></i>
                </div>
            </div>
            
            <div class="room-card-body">
                <div class="form-group">
                    <label data-i18n="lbl_room_name">Room Name / Quest ID</label>
                    <input type="text" value="${room.name || ''}" placeholder="e.g. Boss Chamber / boss_key" oninput="updateSpecialRoomName('${room.id}', this.value)">
                </div>

                <div class="form-group">
                    <label data-i18n="lbl_room_type">Room Type</label>
                    <select onchange="updateSpecialRoom('${room.id}', 'type', this.value)">
                        <option value="BOSS" ${room.type === 'BOSS' ? 'selected' : ''}>👑 Boss Room</option>
                        <option value="START" ${room.type === 'START' ? 'selected' : ''}>🏁 Start Room</option>
                        <option value="MINI_BOSS" ${room.type === 'MINI_BOSS' ? 'selected' : ''}>👹 MiniBoss Room</option>
                        <option value="TRAP" ${room.type === 'TRAP' ? 'selected' : ''}>💣 Trap Room</option>
                        <option value="SECRET" ${room.type === 'SECRET' ? 'selected' : ''}>💎 Secret Room</option>
                        <option value="ROOM" ${room.type === 'ROOM' ? 'selected' : ''}>🏛️ Normal Room</option>
                    </select>
                </div>

                <div class="room-size-grid">
                    <div class="form-group">
                        <label>Width (กว้าง)</label>
                        <div class="step-input">
                            <button class="btn-step" onclick="updateRoomSize('${room.id}', 'width', -2)">-</button>
                            <input type="number" value="${room.width}" readonly>
                            <button class="btn-step" onclick="updateRoomSize('${room.id}', 'width', 2)">+</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Height (ยาว)</label>
                        <div class="step-input">
                            <button class="btn-step" onclick="updateRoomSize('${room.id}', 'height', -2)">-</button>
                            <input type="number" value="${room.height}" readonly>
                            <button class="btn-step" onclick="updateRoomSize('${room.id}', 'height', 2)">+</button>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label data-i18n="lbl_floor_rule">Target Floor Mode</label>
                    <select onchange="updateSpecialRoom('${room.id}', 'floorMode', this.value)">
                        <option value="custom" ${floorMode === 'custom' ? 'selected' : ''}>🎯 ระบุชั้นเอง (Custom Floors)</option>
                        <option value="planned" ${floorMode === 'planned' ? 'selected' : ''}>📋 วางแผนไว้แต่แรก (ตามประเภทห้อง)</option>
                        <option value="all" ${floorMode === 'all' ? 'selected' : ''}>🌐 เกิดทุกชั้น (All Floors)</option>
                    </select>
                </div>

                ${floorMode === 'custom' ? `
                    <div class="form-group" style="background: rgba(0, 0, 0, 0.15); padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color);">
                        <label style="font-size: 0.72rem;">ระบุชั้นที่ต้องการ:</label>
                        ${floorPillsHTML}
                    </div>
                ` : ''}
            </div>
        `;
        container.appendChild(card);
    });

    applyLanguage(currentLang);
}

window.updateRoomTargetFloor = function(id, index, val) {
    const room = window.customSpecialRooms.find(r => r.id === id);
    if (room) {
        if (!Array.isArray(room.targetFloors)) room.targetFloors = [1];
        room.targetFloors[index] = parseInt(val) || 1;
        renderSpecialRooms();
    }
};

window.addRoomTargetFloor = function(id) {
    const room = window.customSpecialRooms.find(r => r.id === id);
    if (room) {
        if (!Array.isArray(room.targetFloors)) room.targetFloors = [1];
        const nextFloor = Math.min(parseInt(document.getElementById('cfgFloors')?.value) || 10, room.targetFloors[room.targetFloors.length - 1] + 1);
        room.targetFloors.push(nextFloor);
        renderSpecialRooms();
    }
};

window.removeRoomTargetFloor = function(id, index) {
    const room = window.customSpecialRooms.find(r => r.id === id);
    if (room && Array.isArray(room.targetFloors) && room.targetFloors.length > 1) {
        room.targetFloors.splice(index, 1);
        renderSpecialRooms();
    }
};

window.updateSpecialRoomName = function (id, nameValue) {
    const room = window.customSpecialRooms.find(r => r.id === id);
    if (room) {
        room.name = nameValue;
        // Update header badge text dynamically
        const badgeEl = document.querySelector(`.room-card[data-id="${id}"] .room-type-badge`);
        if (badgeEl) {
            const roomTypeIcons = { BOSS: '👑', START: '🏁', MINI_BOSS: '👹', TREASURE: '💎', PUZZLE: '🧩' };
            const icon = roomTypeIcons[room.type] || '🏛️';
            const displayName = room.name ? `${room.name} (${room.width}x${room.height})` : `${room.type} Room (${room.width}x${room.height})`;
            badgeEl.innerHTML = `${icon} ${displayName}`;
        }
    }
};

window.toggleRoomCard = function (id, event) {
    if (event.target.closest('.btn-delete-room')) return;
    window.customSpecialRooms.forEach(r => {
        if (r.id === id) {
            r.expanded = !r.expanded;
        } else {
            r.expanded = false; // Close other cards
        }
    });
    renderSpecialRooms();
};

window.updateSpecialRoom = function (id, key, value) {
    const room = window.customSpecialRooms.find(r => r.id === id);
    if (room) {
        room[key] = value;
        renderSpecialRooms();
    }
};

window.updateRoomSize = function (id, key, delta) {
    const room = window.customSpecialRooms.find(r => r.id === id);
    if (room) {
        let val = (room[key] || 3) + delta;
        val = Math.max(1, Math.min(15, val));
        if (val % 2 === 0) val += (delta > 0 ? 1 : -1);
        room[key] = val;
        renderSpecialRooms();
    }
};

window.deleteSpecialRoom = function (id, event) {
    if (event) event.stopPropagation();
    window.customSpecialRooms = window.customSpecialRooms.filter(r => r.id !== id);
    renderSpecialRooms();
};

// Keys & Quest Items Builder State & Logic
window.customQuestItems = [];

function initQuestItemsBuilder() {
    const btnAdd = document.getElementById('btnAddQuestItem');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const newId = 'item-' + Date.now();
            window.customQuestItems.forEach(i => i.expanded = false);
            window.customQuestItems.push({
                id: newId,
                name: 'Golden Key',
                keyId: 'golden_key',
                mode: 'auto',
                lockedRoomId: '',
                floorRule: 'all',
                expanded: true
            });
            renderQuestItems();
        });
    }

    document.getElementById('filterQuestFloor')?.addEventListener('change', renderQuestItems);
    document.getElementById('filterQuestMode')?.addEventListener('change', renderQuestItems);
    document.getElementById('filterQuestRoom')?.addEventListener('change', renderQuestItems);

    renderQuestItems();
}

function renderQuestItems() {
    const container = document.getElementById('questItemsList');
    if (!container) return;

    const filterFloorSelect = document.getElementById('filterQuestFloor');
    const filterModeSelect = document.getElementById('filterQuestMode');
    const filterRoomSelect = document.getElementById('filterQuestRoom');

    const totalFloors = parseInt(document.getElementById('cfgFloors')?.value) || 3;

    // Dynamically update floor filter options based on cfgFloors
    if (filterFloorSelect) {
        const currentSelected = filterFloorSelect.value || 'all';
        let floorFilterHTML = '<option value="all">🏢 All Floors</option>';
        for (let f = 1; f <= totalFloors; f++) {
            const val = f === totalFloors ? 'final' : (f === 1 ? 'first' : `floor-${f}`);
            const tag = f === 1 ? ' (First)' : (f === totalFloors ? ' (Final)' : '');
            floorFilterHTML += `<option value="${val}" ${currentSelected === val ? 'selected' : ''}>🏢 Floor ${f}${tag}</option>`;
        }
        floorFilterHTML += '<option value="all" data-i18n="rule_all">All Floors</option>';
        floorFilterHTML += '<option value="odd" data-i18n="rule_odd">Odd Floors</option>';
        floorFilterHTML += '<option value="even">Even Floors</option>';
        filterFloorSelect.innerHTML = floorFilterHTML;
    }

    // Populate filterQuestRoom dynamically from customSpecialRooms
    if (filterRoomSelect) {
        const currentSelected = filterRoomSelect.value || 'all';
        let roomFilterHTML = '<option value="all">🏛️ All Target Rooms</option>';
        window.customSpecialRooms.forEach(r => {
            const rName = r.name ? r.name : `${r.type} Room`;
            roomFilterHTML += `<option value="${r.id}" ${currentSelected === r.id ? 'selected' : ''}>🏛️ ${rName}</option>`;
        });
        filterRoomSelect.innerHTML = roomFilterHTML;
    }

    const selectedFloor = filterFloorSelect?.value || 'all';
    const selectedMode = filterModeSelect?.value || 'all';
    const selectedRoom = filterRoomSelect?.value || 'all';

    container.innerHTML = '';

    const filteredItems = window.customQuestItems.filter(item => {
        const matchFloor = (selectedFloor === 'all' || item.floorRule === 'all' || item.floorRule === selectedFloor);
        const matchMode = (selectedMode === 'all' || item.mode === selectedMode);
        const matchRoom = (selectedRoom === 'all' || item.lockedRoomId === selectedRoom);
        return matchFloor && matchMode && matchRoom;
    });

    if (filteredItems.length === 0) {
        container.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 1rem;">No keys or quest items match active filters.</div>';
        return;
    }

    filteredItems.forEach((item) => {
        const displayName = item.name || 'Quest Item / Key';

        // Build dynamic floor options for each item card
        let floorOptionsHTML = '';
        for (let f = 1; f <= totalFloors; f++) {
            const val = f === totalFloors ? 'final' : (f === 1 ? 'first' : `floor-${f}`);
            const isSelected = item.floorRule === val || item.floorRule === `floor-${f}`;
            const floorTag = f === 1 ? ' (First)' : (f === totalFloors ? ' (Final)' : '');
            floorOptionsHTML += `<option value="${val}" ${isSelected ? 'selected' : ''}>🏢 Floor ${f}${floorTag}</option>`;
        }
        floorOptionsHTML += `<option value="all" ${item.floorRule === 'all' ? 'selected' : ''} data-i18n="rule_all">All Floors</option>`;
        floorOptionsHTML += `<option value="odd" ${item.floorRule === 'odd' ? 'selected' : ''} data-i18n="rule_odd">Odd Floors</option>`;
        floorOptionsHTML += `<option value="even" ${item.floorRule === 'even' ? 'selected' : ''}>Even Floors</option>`;

        // Options for locked room dropdown (populated from customSpecialRooms)
        let roomOptionsHTML = '<option value="">-- Choose Special Room --</option>';
        window.customSpecialRooms.forEach((r) => {
            const rName = r.name ? r.name : `${r.type} Room`;
            const isSelected = item.lockedRoomId === r.id;
            roomOptionsHTML += `<option value="${r.id}" ${isSelected ? 'selected' : ''}>🏛️ ${rName} (${r.width}x${r.height})</option>`;
        });

        const card = document.createElement('div');
        card.className = `room-card ${item.expanded ? 'expanded' : ''}`;
        card.innerHTML = `
            <div class="room-card-header" onclick="toggleQuestItemCard('${item.id}', event)">
                <div class="room-card-header-left">
                    <span class="room-type-badge">🔑 ${displayName}</span>
                </div>
                <div class="room-card-header-right">
                    <button class="btn-delete-room" onclick="deleteQuestItem('${item.id}', event)" title="Delete Item"><i class="fa-solid fa-trash"></i></button>
                    <i class="fa-solid fa-chevron-down room-arrow-icon"></i>
                </div>
            </div>
            
            <div class="room-card-body">
                <div class="form-group">
                    <label data-i18n="lbl_item_name">Item / Key Name</label>
                    <input type="text" value="${item.name || ''}" placeholder="e.g. Boss Gate Key" oninput="updateQuestItemField('${item.id}', 'name', this.value)">
                </div>

                <div class="form-group">
                    <label data-i18n="lbl_item_key_id">Key / Item ID Code</label>
                    <input type="text" value="${item.keyId || ''}" placeholder="e.g. boss_key_floor3" oninput="updateQuestItemField('${item.id}', 'keyId', this.value)">
                </div>

                <div class="form-group">
                    <label data-i18n="lbl_floor_rule">Target Floor</label>
                    <select onchange="updateQuestItemField('${item.id}', 'floorRule', this.value)">
                        ${floorOptionsHTML}
                    </select>
                </div>

                <div class="form-group">
                    <label data-i18n="lbl_placement_mode">Spawn Location Mode</label>
                    <select onchange="updateQuestItemField('${item.id}', 'mode', this.value)">
                        <option value="auto" ${item.mode === 'auto' ? 'selected' : ''} data-i18n="mode_auto">🎲 Auto (Random Dead-End / Secret)</option>
                        <option value="room" ${item.mode === 'room' ? 'selected' : ''} data-i18n="mode_room">🔒 Lock to Special Room</option>
                    </select>
                </div>

                ${item.mode === 'room' ? `
                <div class="form-group">
                    <label data-i18n="lbl_target_room">Locked Special Room</label>
                    <select onchange="updateQuestItemField('${item.id}', 'lockedRoomId', this.value)">
                        ${roomOptionsHTML}
                    </select>
                </div>
                ` : ''}
            </div>
        `;
        container.appendChild(card);
    });

    applyLanguage(currentLang);
}

window.toggleQuestItemCard = function (id, event) {
    if (event.target.closest('.btn-delete-room')) return;
    window.customQuestItems.forEach(i => {
        if (i.id === id) {
            i.expanded = !i.expanded;
        } else {
            i.expanded = false;
        }
    });
    renderQuestItems();
};

window.updateQuestItemField = function (id, field, val) {
    const item = window.customQuestItems.find(i => i.id === id);
    if (item) {
        item[field] = val;
        renderQuestItems();
    }
};

window.deleteQuestItem = function (id, event) {
    if (event) event.stopPropagation();
    window.customQuestItems = window.customQuestItems.filter(i => i.id !== id);
    renderQuestItems();
};

// Auto-clamp typed number inputs to [min, max]
function initInputValidation() {
    document.querySelectorAll('.step-input input[type="number"]').forEach(input => {
        const clamp = () => {
            let val = parseInt(input.value);
            const min = parseInt(input.min);
            const max = parseInt(input.max);

            if (isNaN(val)) val = min || 1;
            if (!isNaN(min) && val < min) val = min;
            if (!isNaN(max) && val > max) val = max;

            input.value = val;
        };

        input.addEventListener('change', clamp);
        input.addEventListener('blur', clamp);
    });
}

// Dynamic Algorithm Recommendation Helper
function initAlgorithmHelper() {
    const algoSelect = document.getElementById('cfgAlgorithm');
    const helpAlgo = document.getElementById('algoHelpText');

    if (algoSelect && helpAlgo) {
        algoSelect.addEventListener('change', () => {
            const val = algoSelect.value;
            const key = `help_algo_${val}`;
            helpAlgo.setAttribute('data-i18n', key);
            const dictionary = i18n[currentLang] || i18n.en;
            if (dictionary[key]) {
                helpAlgo.textContent = dictionary[key];
            }
        });
    }
}

// Helper for step input buttons (- / +)
window.changeVal = function (id, delta) {
    const input = document.getElementById(id);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 999;
    val = Math.max(min, Math.min(max, val + delta));
    if (['cfgPathWidth', 'cfgLength', 'cfgWidth'].includes(id) && val % 2 === 0) {
        val += (delta < 0 ? -1 : 1);
    }
    if (val < min) val = (min % 2 === 0) ? min + 1 : min;
    input.value = val;
};

// Automatically adjust manually typed even inputs to odd numbers (for PathWidth, Rows, Cols)
function initOddInputEnforcement() {
    const oddInputIds = ['cfgPathWidth', 'cfgLength', 'cfgWidth'];
    oddInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        const validateAndFix = () => {
            let val = parseInt(input.value);
            const min = parseInt(input.min) || 1;
            const max = parseInt(input.max) || 999;

            if (isNaN(val) || val < min) val = min;
            if (val > max) val = max;

            if (val % 2 === 0) {
                val = (val + 1 <= max) ? val + 1 : val - 1;
            }
            if (val < min) val = (min % 2 === 0) ? min + 1 : min;

            input.value = val;
        };

        input.addEventListener('change', validateAndFix);
        input.addEventListener('blur', validateAndFix);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOddInputEnforcement);
} else {
    initOddInputEnforcement();
}

// Language Switcher Logic
function initLanguageSwitcher() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            applyLanguage(currentLang);
        });
    }
}

function triggerMazeGeneration() {
    let rawPathWidth = parseInt(document.getElementById('cfgPathWidth')?.value) || 3;
    if (rawPathWidth % 2 === 0) rawPathWidth++;
    if (rawPathWidth < 1) rawPathWidth = 1;
    const pwInput = document.getElementById('cfgPathWidth');
    if (pwInput) pwInput.value = rawPathWidth;

    let rawLength = parseInt(document.getElementById('cfgLength')?.value) || 25;
    if (rawLength % 2 === 0) rawLength++;
    const lenInput = document.getElementById('cfgLength');
    if (lenInput) lenInput.value = rawLength;

    let rawWidth = parseInt(document.getElementById('cfgWidth')?.value) || 25;
    if (rawWidth % 2 === 0) rawWidth++;
    const widthInput = document.getElementById('cfgWidth');
    if (widthInput) widthInput.value = rawWidth;

    const config = {
        length: rawLength,
        width: rawWidth,
        floors: parseInt(document.getElementById('cfgFloors')?.value) || 3,
        pathWidth: rawPathWidth,
        floorHeight: parseInt(document.getElementById('cfgFloorHeight')?.value) || 5,
        foundationHeight: parseInt(document.getElementById('cfgFoundationHeight')?.value) !== undefined && !isNaN(parseInt(document.getElementById('cfgFoundationHeight')?.value)) ? parseInt(document.getElementById('cfgFoundationHeight')?.value) : 5,
        floorGap: parseInt(document.getElementById('cfgFloorGap')?.value) !== undefined && !isNaN(parseInt(document.getElementById('cfgFloorGap')?.value)) ? parseInt(document.getElementById('cfgFloorGap')?.value) : 5,
        startDirection: document.getElementById('cfgStartDir')?.value || 'bottom',
        algorithm: document.getElementById('cfgAlgorithm')?.value || 'dfs',
        mazeComplexity: parseInt(document.getElementById('cfgMazeComplexity')?.value) || 5,
        monsterDensity: parseInt(document.getElementById('cfgMonsterDensity')?.value) || 5,
        miniBossFreq: parseInt(document.getElementById('cfgMiniBossFreq')?.value) || 5,
        trapDensity: parseInt(document.getElementById('cfgTrapDensity')?.value) || 5,
        secretFreq: parseInt(document.getElementById('cfgSecretFreq')?.value) || 5,
        seed: document.getElementById('cfgSeed')?.value || 'Dungeons2026'
    };

    // Generate multi-floor maze JSON using V2 algorithm engine
    window.currentMazeJSON = generateMazeV2(config, window.customSpecialRooms, []);
    window.activeFloorIndex = 0;

    // Render floor onto HTML5 canvas
    renderCurrentFloor();
    updateFloorBadge();

    console.log('Maze Generated Successfully!', window.currentMazeJSON);
}

function applyLanguage(lang) {
    const dictionary = i18n[lang] || i18n.en;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[key]) {
            el.textContent = dictionary[key];
        }
    });

    updateMainActionButtonUI();
}

// Single Unified Generate / Regenerate Button Controller
let isGenerated = false;

function initMainGenerateButton() {
    const btnMain = document.getElementById('btnMainActionTop');
    const btnSide = document.getElementById('btnGenerateSide');

    const handleAction = () => {
        const seedInput = document.getElementById('cfgSeed');
        if (seedInput) {
            const currentSeed = seedInput.value.trim();
            // Check if seed starts with Dungeons2026 or seed_ or is empty -> randomize!
            if (currentSeed === '' || currentSeed.startsWith('Dungeons2026') || currentSeed.startsWith('seed_') || currentSeed.startsWith('Seed_')) {
                const randomNum = Math.floor(Math.random() * 899999 + 100000);
                seedInput.value = 'seed_' + randomNum;
            }
            // If user typed a custom fixed seed (e.g. MyCustomSeed), keep it unchanged!
        }

        isGenerated = true;
        updateMainActionButtonUI();
        triggerMazeGeneration();
    };

    if (btnMain) btnMain.addEventListener('click', handleAction);
    if (btnSide) btnSide.addEventListener('click', handleAction);

    initExportButtons();
}

function getMazeData(jsonObj) {
    if (!jsonObj) return null;
    return jsonObj.maze ? jsonObj.maze : jsonObj;
}

function initExportButtons() {
    const handleExport = () => {
        if (!window.currentMazeJSON) {
            alert('Please generate a maze first!');
            return;
        }

        const mazeData = getMazeData(window.currentMazeJSON);
        const seed = mazeData?.settings?.seed || 'Dungeons2026';
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.currentMazeJSON, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `dungeon_maze_${seed}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const btnTop = document.getElementById('btnExportTop');
    const btnSide = document.getElementById('btnExportSide');

    if (btnTop) btnTop.addEventListener('click', handleExport);
    if (btnSide) btnSide.addEventListener('click', handleExport);
}

function updateMainActionButtonUI() {
    const btn = document.getElementById('btnMainActionTop');
    if (!btn) return;

    const dictionary = i18n[currentLang] || i18n.en;

    if (!isGenerated) {
        btn.className = 'btn btn-primary';
        btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>${dictionary.btn_generate || 'Generate Maze'}</span>`;
    } else {
        btn.className = 'btn btn-danger';
        btn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> <span>${dictionary.btn_regenerate || 'Regenerate'}</span>`;
    }
}

window.currentMazeJSON = null;
window.activeFloorIndex = 0;
window.showGuidePath = false;
window.hoveredCell = null;

function renderCurrentFloor() {
    const container = document.getElementById('gridContainer');
    const mazeData = getMazeData(window.currentMazeJSON);
    if (!container || !mazeData) return;

    const floorData = mazeData.floors[window.activeFloorIndex];
    renderFloorCanvas(container, floorData, window.showGuidePath, window.hoveredCell);
    initCanvasPaintListeners();
}

function updateFloorBadge() {
    const badge = document.getElementById('floorBadge');
    const mazeData = getMazeData(window.currentMazeJSON);
    if (!badge || !mazeData) return;
    const total = mazeData.floors.length;
    badge.textContent = `Floor ${window.activeFloorIndex + 1} / ${total}`;
}

function initFloorNavigation() {
    const btnPrev = document.getElementById('btnPrevFloor');
    const btnNext = document.getElementById('btnNextFloor');
    const btnGuide = document.getElementById('btnToggleGuide');

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            const mazeData = getMazeData(window.currentMazeJSON);
            if (!mazeData) return;
            if (window.activeFloorIndex > 0) {
                window.activeFloorIndex--;
                renderCurrentFloor();
                updateFloorBadge();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const mazeData = getMazeData(window.currentMazeJSON);
            if (!mazeData) return;
            if (window.activeFloorIndex < mazeData.floors.length - 1) {
                window.activeFloorIndex++;
                renderCurrentFloor();
                updateFloorBadge();
            }
        });
    }

    if (btnGuide) {
        btnGuide.addEventListener('click', () => {
            window.showGuidePath = !window.showGuidePath;
            btnGuide.classList.toggle('active', window.showGuidePath);
            renderCurrentFloor();
        });
    }
}

// 1. Tier 1 Icon Sidebar Tabs Navigation
function initNavigationTabs() {
    const iconItems = document.querySelectorAll('.nav-icon-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const optionsPanel = document.getElementById('optionsPanel');

    iconItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            // Switch active icon item
            iconItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Switch active tab content in panel
            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });



            // If panel was collapsed, open it
            if (optionsPanel && optionsPanel.classList.contains('collapsed')) {
                optionsPanel.classList.remove('collapsed');
            }
        });
    });
}

// 2. Options Panel Drawer Collapse Handle Toggle
function initDrawerCollapse() {
    const optionsPanel = document.getElementById('optionsPanel');
    const toggleBtn = document.getElementById('toggleDrawerBtn');

    if (optionsPanel && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            optionsPanel.classList.toggle('collapsed');
        });
    }
}

// 3. Sub-tabs inside Options Panel
function initSubTabs() {
    const subTabBtns = document.querySelectorAll('.sub-tab, .sub-tab-btn');

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parentTab = btn.closest('.tab-content');
            if (!parentTab) return;

            const targetSub = btn.getAttribute('data-sub');

            // Toggle sub-tabs
            parentTab.querySelectorAll('.sub-tab, .sub-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle sub-contents
            parentTab.querySelectorAll('.sub-content').forEach(sc => {
                if (sc.id === targetSub) {
                    sc.classList.add('active');
                } else {
                    sc.classList.remove('active');
                }
            });
        });
    });
}

// 4. Random Seed Generator
function initSeedGenerator() {
    const seedInput = document.getElementById('cfgSeed');
    const btnRandomSeed = document.getElementById('btnRandomSeed');

    if (seedInput && btnRandomSeed) {
        btnRandomSeed.addEventListener('click', () => {
            const randomSeed = 'Seed_' + Math.random().toString(36).substring(2, 9).toUpperCase();
            seedInput.value = randomSeed;

            // Dice spin animation
            const icon = btnRandomSeed.querySelector('i');
            if (icon) {
                icon.style.transition = 'transform 0.4s ease';
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transition = 'none';
                    icon.style.transform = 'rotate(0deg)';
                }, 400);
            }
        });
    }
}

function initResetDefaults() {
    const btnReset = document.getElementById('btnResetDefaults');
    if (!btnReset) return;

    btnReset.addEventListener('click', () => {
        const confirmReset = confirm("คุณต้องการรีเซ็ตค่าเริ่มต้นทั้งหมด (ตั้งค่าเขาวงกต, ห้องพิเศษ, กุญแจเควส และ Canvas) ใช่หรือไม่?");
        if (!confirmReset) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal('cfgWidth', 25);
        setVal('cfgLength', 25);
        setVal('cfgFloors', 3);
        setVal('cfgPathWidth', 3);
        setVal('cfgFloorHeight', 5);
        setVal('cfgStartDirection', 'bottom');
        setVal('cfgAlgorithm', 'dfs');
        setVal('cfgMazeComplexity', 5);
        setVal('cfgMonsterDensity', 5);
        setVal('cfgMiniBossFreq', 5);
        setVal('cfgTrapDensity', 5);
        setVal('cfgSecretFreq', 5);
        setVal('cfgSeed', 'Dungeons2026');

        window.customSpecialRooms = [];
        window.customQuestItems = [];
        window.editorUndoStack = [];
        window.editorRedoStack = [];

        const chkPaint = document.getElementById('chkPaintMode');
        if (chkPaint) {
            chkPaint.checked = false;
            window.isPaintModeActive = false;
            const lblStatus = document.getElementById('lblPaintModeStatus');
            if (lblStatus) {
                lblStatus.textContent = '🎨 Paint Mode: OFF (Drag to Pan)';
                lblStatus.style.color = 'var(--text-main)';
            }
        }

        renderSpecialRooms();
        renderQuestItems();

        triggerMazeGeneration();
        console.log('Reset to Defaults Completed Successfully!');
    });
}

function initImportJSON() {
    const fileInput = document.getElementById('jsonFileInput');
    const dropZone = document.getElementById('dropZoneJSON');
    const statusMsg = document.getElementById('importStatus');

    if (!fileInput || !dropZone) return;

    const showStatus = (text, isSuccess) => {
        if (!statusMsg) return;
        statusMsg.style.display = 'block';
        statusMsg.className = `import-status-msg ${isSuccess ? 'success' : 'error'}`;
        statusMsg.innerHTML = `<i class="fa-solid ${isSuccess ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${text}`;
    };

    const processFile = (file) => {
        if (!file || !file.name.toLowerCase().endsWith('.json')) {
            showStatus('Please select a valid .json file exported from DungeonsTower.', false);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const mazeData = data.maze ? data.maze : data;

                if (!mazeData.floors || !Array.isArray(mazeData.floors)) {
                    showStatus('Invalid maze JSON format: Missing floors data.', false);
                    return;
                }

                const setVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el && val !== undefined) el.value = val;
                };

                if (mazeData.settings) {
                    if (mazeData.settings.dimensions) {
                        setVal('cfgWidth', mazeData.settings.dimensions.columns);
                        setVal('cfgLength', mazeData.settings.dimensions.rows);
                        setVal('cfgFloors', mazeData.settings.dimensions.floors);
                        setVal('cfgPathWidth', mazeData.settings.dimensions.pathWidth);
                        setVal('cfgFloorHeight', mazeData.settings.dimensions.floorHeight);
                        setVal('cfgFoundationHeight', mazeData.settings.dimensions.foundationHeight !== undefined ? mazeData.settings.dimensions.foundationHeight : 5);
                        setVal('cfgFloorGap', mazeData.settings.dimensions.floorGap !== undefined ? mazeData.settings.dimensions.floorGap : 5);
                    }
                    if (mazeData.settings.algorithm) {
                        setVal('cfgAlgorithm', (mazeData.settings.algorithm.type || 'dfs').toLowerCase());
                        setVal('cfgMazeComplexity', mazeData.settings.algorithm.complexity);
                    }
                    if (mazeData.settings.difficulty) {
                        setVal('cfgMonsterDensity', mazeData.settings.difficulty.monsterDensity);
                        setVal('cfgMiniBossFreq', mazeData.settings.difficulty.minibossFrequency);
                        setVal('cfgTrapDensity', mazeData.settings.difficulty.trapDensity);
                        setVal('cfgSecretFreq', mazeData.settings.difficulty.secretChestFrequency);
                    }
                    if (mazeData.settings.seed) setVal('cfgSeed', mazeData.settings.seed);
                    if (mazeData.settings.startDirection) {
                        const dir = mazeData.settings.startDirection.startsWith('top') ? 'top' : 'bottom';
                        setVal('cfgStartDirection', dir);
                    }
                }

                if (mazeData.specialRooms && Array.isArray(mazeData.specialRooms)) {
                    window.customSpecialRooms = mazeData.specialRooms.map(r => {
                        const w = parseInt(r.width) || 3;
                        const h = parseInt(r.height) || 3;
                        const t = r.type || 'SECRET';
                        return {
                            id: r.id || ('room-' + Math.random().toString(36).substr(2, 9)),
                            name: r.name || '',
                            type: t,
                            width: w,
                            height: h,
                            floorMode: r.floorMode || 'all',
                            targetFloors: Array.isArray(r.targetFloors) ? r.targetFloors : [1],
                            expanded: false
                        };
                    });
                    renderSpecialRooms();
                }

                if (mazeData.unassignedEntities && Array.isArray(mazeData.unassignedEntities)) {
                    window.customQuestItems = [...mazeData.unassignedEntities];
                    renderQuestItems();
                }

                window.currentMazeJSON = data;
                window.activeFloorIndex = 0;
                window.editorUndoStack = [];
                window.editorRedoStack = [];

                renderCurrentFloor();
                updateFloorBadge();

                showStatus(`Successfully imported maze JSON! (${mazeData.floors.length} floors loaded)`, true);
                console.log('Imported Maze JSON successfully!', data);
            } catch (err) {
                console.error('Error parsing JSON:', err);
                showStatus('Error parsing JSON file. Please check file formatting.', false);
            }
        };

        reader.readAsText(file);
    };

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files && dt.files.length > 0) {
            processFile(dt.files[0]);
        }
    });
}

// 5. Interactive Zoom, Pan, and Fullscreen Viewport Controls
let zoomLevel = 100;
let panX = 0;
let panY = 0;

function initZoomControls() {
    const zoomText = document.getElementById('zoomPercent');
    const btnIn = document.getElementById('btnZoomIn');
    const btnOut = document.getElementById('btnZoomOut');
    const btnReset = document.getElementById('btnResetZoom');
    const gridContainer = document.getElementById('gridContainer');
    const viewportArea = document.getElementById('viewport');

    const updateViewportTransform = () => {
        if (gridContainer) {
            gridContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel / 100})`;
            gridContainer.style.transition = 'transform 0.15s ease-out';
        }
        if (zoomText) {
            zoomText.textContent = `${zoomLevel}%`;
        }
    };

    if (btnIn) {
        btnIn.addEventListener('click', () => {
            zoomLevel = Math.min(300, zoomLevel + 10);
            updateViewportTransform();
        });
    }

    if (btnOut) {
        btnOut.addEventListener('click', () => {
            zoomLevel = Math.max(30, zoomLevel - 10);
            updateViewportTransform();
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            zoomLevel = 100;
            panX = 0;
            panY = 0;
            updateViewportTransform();
        });
    }

    // Mouse Wheel Zooming over viewport area
    if (viewportArea) {
        viewportArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomLevel = Math.min(300, zoomLevel + 10);
            } else {
                zoomLevel = Math.max(30, zoomLevel - 10);
            }
            updateViewportTransform();
        }, { passive: false });

        // Mouse Drag Panning (Only when Paint Mode is OFF and Shift key is not held)
        let isPanning = false;
        let startX = 0;
        let startY = 0;

        viewportArea.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && !window.isPaintModeActive && !window.isShiftHeld)) {
                isPanning = true;
                startX = e.clientX - panX;
                startY = e.clientY - panY;
                viewportArea.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            if (gridContainer) {
                gridContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel / 100})`;
                gridContainer.style.transition = 'none';
            }
        });

        window.addEventListener('mouseup', () => {
            if (isPanning) {
                isPanning = false;
                viewportArea.style.cursor = 'grab';
            }
        });
    }

    initEditorUndoRedo();
    initTilePainter();
}

// Editor Maze - Tile Painter & History Stack Engine
window.editorUndoStack = [];
window.editorRedoStack = [];
window.activeBrush = '1';
window.isPaintModeActive = false;
window.isShiftHeld = false;

function initTilePainter() {
    const brushCards = document.querySelectorAll('.brush-card');
    const chkPaintMode = document.getElementById('chkPaintMode');
    const lblStatus = document.getElementById('lblPaintModeStatus');

    brushCards.forEach(card => {
        card.addEventListener('click', () => {
            brushCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            window.activeBrush = card.getAttribute('data-brush') || card.dataset.brush;
        });
    });

    if (chkPaintMode) {
        chkPaintMode.addEventListener('change', () => {
            window.isPaintModeActive = chkPaintMode.checked;
            if (lblStatus) {
                lblStatus.textContent = window.isPaintModeActive 
                    ? '🎨 Paint Mode: ON (Drag to Paint)' 
                    : '🎨 Paint Mode: OFF (Drag to Pan)';
                lblStatus.style.color = window.isPaintModeActive ? '#10b981' : 'var(--text-main)';
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') {
            window.isShiftHeld = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            window.isShiftHeld = false;
        }
    });

    initCanvasPaintListeners();
}

let isCanvasPaintMouseDown = false;

function initCanvasPaintListeners() {
    const gridContainer = document.getElementById('gridContainer');
    if (!gridContainer) return;

    if (gridContainer._hasPaintListeners) return;
    gridContainer._hasPaintListeners = true;

    const tooltipEl = document.getElementById('cellTooltip');

    const updateHoverInspector = (e) => {
        const mazeData = getMazeData(window.currentMazeJSON);
        if (!mazeData || !mazeData.floors) {
            if (tooltipEl) tooltipEl.style.display = 'none';
            return;
        }

        const canvas = document.querySelector('#gridContainer canvas');
        if (!canvas) {
            if (tooltipEl) tooltipEl.style.display = 'none';
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const floorData = mazeData.floors[window.activeFloorIndex];
        if (!floorData || !floorData.grid) return;

        const grid = floorData.grid;
        const rows = grid.length;
        const cols = grid[0].length;

        const c = Math.floor((e.clientX - rect.left) / rect.width * cols);
        const r = Math.floor((e.clientY - rect.top) / rect.height * rows);

        if (c < 0 || c >= cols || r < 0 || r >= rows) {
            if (tooltipEl) tooltipEl.style.display = 'none';
            if (window.hoveredCell) {
                window.hoveredCell = null;
                renderCurrentFloor();
            }
            return;
        }

        // Check if hovered cell changed
        const prevHovered = window.hoveredCell;
        if (!prevHovered || prevHovered.r !== r || prevHovered.c !== c) {
            window.hoveredCell = { r, c };
            renderCurrentFloor();
        }

        // Update Floating Tooltip UI
        if (tooltipEl) {
            const val = grid[r][c];
            const dictionary = i18n[currentLang] || i18n.en;
            const tileName = dictionary[`tile_${val}`] || val;
            const emoji = TILE_EMOJIS[val] || (val === 0 ? '⬛' : (val === 1 ? '🟦' : '📍'));

            const tooltipEmoji = document.getElementById('tooltipEmoji');
            const tooltipTitle = document.getElementById('tooltipTitle');
            const tooltipSub = document.getElementById('tooltipSub');
            const tooltipItem = document.getElementById('tooltipItem');
            const tooltipCoords = document.getElementById('tooltipCoords');

            if (tooltipEmoji) tooltipEmoji.textContent = emoji;
            if (tooltipTitle) tooltipTitle.textContent = tileName;

            // 1. Room info check
            let roomName = '';
            if (floorData.rooms) {
                const rm = floorData.rooms.find(m => m.bounds && c >= m.bounds.x && c < m.bounds.x + m.bounds.width && r >= m.bounds.y && r < m.bounds.y + m.bounds.height);
                if (rm) roomName = rm.name || rm.type;
            }
            if (tooltipSub) {
                if (roomName) {
                    tooltipSub.style.display = 'block';
                    tooltipSub.textContent = `🏛️ Room: ${roomName}`;
                } else {
                    tooltipSub.style.display = 'none';
                }
            }

            // 2. Key / Item / Entity info check
            let entityName = '';
            if (floorData.entities) {
                const ent = floorData.entities.find(e => e.x === c && e.y === r);
                if (ent) entityName = ent.name || ent.keyId || ent.type;
            }
            if (!entityName && floorData.doors) {
                const dr = floorData.doors.find(d => d.x === c && d.y === r);
                if (dr) entityName = `Door (${dr.keyId || dr.type})`;
            }
            if (tooltipItem) {
                if (entityName) {
                    tooltipItem.style.display = 'block';
                    tooltipItem.textContent = `🔑 Key/Item: ${entityName}`;
                } else {
                    tooltipItem.style.display = 'none';
                }
            }

            // 3. Grid Coordinates Notation
            const notation = toGridNotation(c, r);
            if (tooltipCoords) {
                tooltipCoords.textContent = `Pos: ${notation} (Col ${c + 1}, Row ${r + 1})`;
            }

            // Position calculation with edge detection
            const tooltipWidth = tooltipEl.offsetWidth || 160;
            const tooltipHeight = tooltipEl.offsetHeight || 80;
            let left = e.clientX + 14;
            let top = e.clientY + 14;

            if (left + tooltipWidth > window.innerWidth - 10) {
                left = e.clientX - tooltipWidth - 10;
            }
            if (top + tooltipHeight > window.innerHeight - 10) {
                top = e.clientY - tooltipHeight - 10;
            }

            tooltipEl.style.left = `${left}px`;
            tooltipEl.style.top = `${top}px`;
            tooltipEl.style.display = 'block';
        }
    };

    const handlePaint = (e) => {
        if (e.button === 0 && (window.isPaintModeActive || window.isShiftHeld)) {
            paintTileAtMouse(e);
        }
    };

    gridContainer.addEventListener('mousedown', (e) => {
        if (e.button === 0 && (window.isPaintModeActive || window.isShiftHeld)) {
            isCanvasPaintMouseDown = true;
            if (window.currentMazeJSON) {
                window.editorUndoStack.push(JSON.stringify(window.currentMazeJSON));
                window.editorRedoStack = [];
            }
            handlePaint(e);
        }
    });

    gridContainer.addEventListener('mousemove', (e) => {
        if (isCanvasPaintMouseDown && (window.isPaintModeActive || window.isShiftHeld)) {
            handlePaint(e);
        }
        updateHoverInspector(e);
    });

    gridContainer.addEventListener('mouseleave', () => {
        if (tooltipEl) tooltipEl.style.display = 'none';
        if (window.hoveredCell) {
            window.hoveredCell = null;
            renderCurrentFloor();
        }
    });

    window.addEventListener('mouseup', () => {
        isCanvasPaintMouseDown = false;
    });
}

function paintTileAtMouse(e) {
    const mazeData = getMazeData(window.currentMazeJSON);
    if (!mazeData || !mazeData.floors) return;
    const canvas = document.querySelector('#gridContainer canvas') || document.querySelector('.viewport-area canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const floorData = mazeData.floors[window.activeFloorIndex];
    if (!floorData || !floorData.grid) return;

    const grid = floorData.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    const cellSize = rect.width / cols;
    if (!cellSize || cellSize <= 0) return;

    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    if (x < 0 || x >= cols || y < 0 || y >= rows) return;

    let brush = window.activeBrush || '1';
    // Get active brush from active card if needed
    const activeCard = document.querySelector('.brush-card.active');
    if (activeCard) {
        brush = activeCard.getAttribute('data-brush') || brush;
    }

    if (brush === '1') brush = 1;
    if (brush === '0') brush = 0;

    if (grid[y][x] === brush) return;

    // Direct paint tile to grid
    grid[y][x] = brush;

    // Dynamically recalculate Guide Path
    recalculateGuidePath(floorData);

    renderCurrentFloor();
}

function executeUndo() {
    if (window.editorUndoStack.length > 0) {
        const previousState = window.editorUndoStack.pop();
        if (window.currentMazeJSON) {
            window.editorRedoStack.push(JSON.stringify(window.currentMazeJSON));
            window.currentMazeJSON = JSON.parse(previousState);
            renderCurrentFloor();
            console.log('Undo executed successfully');
        }
    }
}

function executeRedo() {
    if (window.editorRedoStack.length > 0) {
        const nextState = window.editorRedoStack.pop();
        if (window.currentMazeJSON) {
            window.editorUndoStack.push(JSON.stringify(window.currentMazeJSON));
            window.currentMazeJSON = JSON.parse(nextState);
            renderCurrentFloor();
            console.log('Redo executed successfully');
        }
    }
}

function initEditorUndoRedo() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');

    if (btnUndo) btnUndo.addEventListener('click', executeUndo);
    if (btnRedo) btnRedo.addEventListener('click', executeRedo);

    // Keyboard Shortcuts: Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
            return; // Ignore shortcuts while user is typing inside form inputs
        }

        const isZ = (e.code === 'KeyZ') || (e.key && e.key.toLowerCase() === 'z') || e.key === 'ผ';
        const isY = (e.code === 'KeyY') || (e.key && e.key.toLowerCase() === 'y') || e.key === 'ั';

        if ((e.ctrlKey || e.metaKey) && isZ) {
            if (e.shiftKey) {
                e.preventDefault();
                executeRedo();
            } else {
                e.preventDefault();
                executeUndo();
            }
        } else if ((e.ctrlKey || e.metaKey) && isY) {
            e.preventDefault();
            executeRedo();
        }
    });
}
