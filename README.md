![Oracle](https://img.shields.io/badge/ORACLE-grey?style=for-the-badge)![APEX](https://img.shields.io/badge/APEX-brightgreen?style=for-the-badge)
![Plug-in Type](https://img.shields.io/badge/Plug--in_Type-grey?style=for-the-badge)![Item](https://img.shields.io/badge/Item-blue?style=for-the-badge)

# 🗺️ APEX Map Background Switcher

A custom Oracle APEX **item plugin** for switching the **raster** background layers of a map region at runtime.  
Perfect for users who need to toggle between base layers such as **Satellite**, **Streets**, or **Terrain**.

## 🖼️ Preview

![How it looks](./how_it_looks.gif)

> ⚠️ **Note:** This plugin is designed to switch **raster tile layers only**. It does **not** support vector tiles.

## 📌 Features

- 🗺️ Dynamically switch **raster** map backgrounds
- 🔄 Works with custom tile layers from SQL
- ⚡ Lightweight and responsive
- 🧩 Connects to any APEX map region using its Static ID

## 🔌 Plugin Attributes

- **Source** – SQL query returning `label`, `source_id`, and `tiles_url` for each style.
- **Map Region** – Static ID of the APEX map region to apply the background change.

**SQL Query Format:**

Your query must return **three columns**:

- `label`: Display name for the source (e.g., _Satellite_)
- `source_id`: Unique ID for internal tracking
- `tiles_url`: Raster XYZ Tile layer URL

## 🚀 Installation

1. Import the plugin file into your APEX app.
2. Add a new **Item** of type **Map Background Switcher**.
3. Define the **SQL Source** with your tile layers.
4. Set the **Map Region Static ID** to target the correct map.
5. Enjoy a seamless map background switch experience.

## ⚠️ Limitations & Notes

- 🧱 This plugin **requires you to define at least one custom map background** in **Shared Components > Map Backgrounds**.
- 🧭 Your map region must be configured to use the custom background as its default.
- ❌ Oracle’s **default & built-in base map backgrounds** may not be compatible due to integration issues.
- 🗺️ This plugin works only with **raster tiles**, not vector tiles.

## 🧑‍💻 Author

Built with ❤️ for Oracle APEX by **ABJABJA Salah-Eddine**
