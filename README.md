<div align="center">
  <img src=".github/header.png" width="640" alt="NoxVR" />
  <h1>Front</h1>
  <p>Web frontend for the NoxVR federated social VR platform.</p>

  ![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
  ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06b6d4?logo=tailwindcss&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)
  ![License](https://img.shields.io/badge/License-AGPL--3.0-22c55e)

  <p>Part of the <a href="https://github.com/AtelierVR"><strong>NoxVR</strong></a> ecosystem</p>
</div>

---

## Overview

**NoxVR Front** is the main web interface for the NoxVR platform. It provides user-facing pages for authentication, profiles, worlds, avatars, and settings, as well as a dashboard for managing content. It consumes the REST API exposed by the [node](https://github.com/AtelierVR/node) backend.

## Features

- **Authentication** — login, registration, email verification, 2FA (TOTP), session management
- **User Profiles** — view profiles, bios, tags, presence status, follow/unfollow
- **Worlds** — browse, create, edit, upload thumbnails and assets
- **Avatars** — browse, create, edit, upload assets per platform
- **Dashboard** — account settings, profile editing, session management
- **Internationalization** — multi-language support via `react-i18next`
- **Design System** — custom UI components with Tailwind CSS and semantic CSS variables
- **Dark Mode** — full light/dark theme support via `next-themes`

## Tech Stack

| Category | Technology |
|:---|:---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 + `tw-animate-css` |
| Components | Radix UI, Base UI, shadcn/ui |
| Icons | Iconify (Material Symbols) |
| Forms | react-hook-form + zod |
| Tables | TanStack Table |
| i18n | react-i18next + i18next |
| Charts | Recharts |
| Markdown | react-markdown + Shiki |

## Getting Started

```bash
npm install
npm run dev        # start dev server at http://localhost:3000
npm run build      # production build
npm run lint       # eslint
```

Visit `/design` in dev mode to browse the live design system gallery.

---

<div align="center">
  <p>Made with ♥ by <a href="https://github.com/AtelierVR">AtelierVR</a> &nbsp;·&nbsp; <a href="https://www.gnu.org/licenses/agpl-3.0">AGPL-3.0</a></p>
  <p>Part of the <strong>NoxVR</strong> project — a federated social VR platform</p>
</div>
