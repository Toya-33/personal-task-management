# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Time Tracker V2 — a Next.js 16 application for time tracking. Built with TypeScript, Tailwind CSS v4, and React 19.

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint (flat config, `eslint.config.mjs`)

## Architecture

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`
- **Path alias**: `@/*` maps to `./src/*`

### Directory Structure

- `src/app/` — App Router pages and layouts
- `public/` — Static assets

### Key Conventions

- App Router: all routes live under `src/app/` using file-based routing (`page.tsx`, `layout.tsx`, `loading.tsx`, etc.)
- Server Components are the default; add `"use client"` directive only when client interactivity is needed
- ESLint uses the flat config format (`eslint.config.mjs`) with `eslint-config-next`
