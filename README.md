# 🏰 DungeonsTower [Early Access / Beta]

**Welcome to the Early Access of DungeonsTower!** A powerful Minecraft plugin (1.21+) for automatically generating multi-floor tower dungeons and mazes from JSON data using WorldEdit/FAWE schematics.

Perfect for RPG, Survival, and Dungeon-based servers. Build massive structures asynchronously without lagging your server!

---

### ⚠️ Early Access Notice
This plugin is currently in Beta. It is fully functional and safe to use, but I am releasing it to gather feedback and test the core generation mechanics.

**Why Early Access?** As a solo hobbyist developer with busy personal milestones and a tight schedule ahead, I want to ensure the foundation is rock solid before expanding the system.

**The Future is Free:** This entire system—both the Minecraft plugin and the full visual web creator—will remain **100% FREE** for everyone. There will be no paywalls, no premium locked versions, and no hidden fees. I believe in open access for the community. However, maintaining the code and hosting the web tool takes time and resources. If this project helps your server, a small coffee donation goes a long way in keeping me fueled and motivated!

---

## ⚡ Breakthrough Performance (New in 0.0.4-Beta!)
We've completely revolutionized the generation engine! By optimizing the biome mapping to match Minecraft's native 4x4x4 3D grid, the processing overhead has been slashed from over 90 million iterations down to just 1.3 million.

**The Benchmark:**
Generating a colossal **765 x 765 x 155** block maze (over **90.7 million blocks** & **~25,000 rooms**) used to take up to 14 minutes.
Now? It generates in an astonishing **10 seconds**! *(Tested on AMD Ryzen 5 7600)*. Zero lag, instant massive dungeons.

## ✨ Key Features

- **Smart 3-Step Safe Generation**: 
  1. *Solid Fill:* Generates the base block structure asynchronously.
  2. *Carve Air:* Precisely hollows out pathways, multi-block rooms, and multi-floor stair connections.
  3. *Paste Schematics:* Automatically places predefined `.schem` files into the carved spaces, ensuring clean, glitch-free dungeons that don't mess up your world.
- **Auto-Rotation**: Build just one schematic (e.g., North facing) and the plugin automatically rotates it for all directions.
- **Multi-Floor & Multi-Tower**: Handles complex vertical structures. Automatically splits dungeons into multiple adjacent towers if the world height limit is exceeded.
- **Large Custom Rooms**: Supports standard 1x1 paths and massive multi-block custom rooms (e.g., `BOSS_3x3`, `MINI_BOSS_2x2`).
- **Builder Tools**: In-game commands to help map makers spawn building platforms and design rooms perfectly to scale.
- **🌟 Exclusive Web Generator (Beta)**: Skip the JSON coding! Use our intuitive visual web-based grid editor to design your maze and export it directly to the plugin.

## 📦 Dependencies

To use DungeonsTower, your server **must** have the following plugins installed:
- FastAsyncWorldEdit (FAWE) *(Highly Recommended)* or WorldEdit.
- **Multiverse-Core** *(Required to automatically generate and manage the safe, isolated `world_dungeon` void world).*

## 🚀 Installation

1. Download the `DungeonsTower.jar` and place it into your server's `plugins` folder.
2. Make sure you have FAWE and Multiverse-Core installed.
3. Start the server (The plugin will automatically create a Multiverse void world named `world_dungeon`).
4. Place your dungeon data `.json` files into `plugins/DungeonsTower/muze/`. (An `example.json` is generated for you).
5. Join the game and type `/dt maze build example` to watch the magic happen!

## 📚 Documentation & Wiki

Looking for the **Commands List**, **Room Shapes**, **PlaceholderAPI**, or a detailed **Setup Guide**? 

👉 **Check out our Official Wiki!** 

---