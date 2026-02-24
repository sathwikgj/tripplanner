# TripPlanner — Travel Destination Explorer

Build a travel destination explorer from scratch using vanilla JavaScript, HTML, and CSS. Discover countries around the world, save favorites to your wishlist, compare destinations side-by-side, and plan your trips.

## Live Demo

[View the finished product](#) <!-- Link will be updated after deployment -->

Use the live demo to understand how the finished product should look and work. Explore every page, try every feature, and pay attention to the details.

## Setup

1. Navigate to this directory in your terminal
2. Run `npx serve .` to start a local dev server
3. Open the URL shown in your terminal (usually `http://localhost:3000`)

> **Note:** You must use a local server (not open the HTML file directly) because `fetch()` doesn't work with the `file://` protocol.

## Pages

| Page | File | Description |
|------|------|-------------|
| Explore | `index.html` | Browse all countries with search, region filter, and sort |
| Country Detail | `country.html` | Detailed view of a single country with borders |
| Wishlist | `wishlist.html` | Saved countries with remove and plan-a-trip link |
| Compare | `compare.html` | Side-by-side comparison of 2-3 countries |
| Planner | `planner.html` | Trip planner with country selection, dates, and notes |

## API

This project uses the **RestCountries** API (free, no authentication required).

| Endpoint | Description |
|----------|-------------|
| `https://restcountries.com/v3.1/all?fields=name,capital,region,subregion,population,flags,cca3,languages,currencies,timezones,borders,latlng,area` | All countries (filtered fields) |
| `https://restcountries.com/v3.1/name/{name}` | Search by country name |
| `https://restcountries.com/v3.1/alpha/{code}` | Get country by CCA3 code |
| `https://restcountries.com/v3.1/region/{region}` | Filter by region |

## Color Theme

- **Primary (Teal):** `#0d9488` (main), `#0f766e` (dark), `#2dd4bf` (light), `#f0fdfa` (bg)
- **Accent (Indigo):** `#6366f1` (main), `#4f46e5` (dark), `#818cf8` (light), `#eef2ff` (bg)

## Guide

Open **`CONCEPTS.md`** for feature descriptions and progressive hints.

The hints are organized in 3 levels:
- **Level 1** (visible) — Feature description that hints at what to build
- **Level 2** (expandable) — Thinking questions to guide your approach
- **Level 3** (expandable) — Direct concept names when you're stuck

Try to solve each feature using only Level 1 first!
