# Full-Stack Blog Platform

A feature rich, production ready blogging platform built with a React frontend and an Express.js/Prisma backend, featuring role based access control, rich text editing, cloud media storage, and comment threads.

## Tech Stack

| Layer             | Technology                                               |
| ----------------- | -------------------------------------------------------- |
| Frontend          | React, Mantine UI, Vite                                  |
| Backend           | Node.js, Express.js                                      |
| Database & ORM    | PostgreSQL (hosted on Neon), Prisma ORM                  |
| Authentication    | JWT (JSON Web Tokens) stored in secure HTTP only cookies |
| Media Storage     | Cloudinary                                               |
| Rich Text Editing | Tiptap Editor                                            |
| Deployment        | Vercel (Frontend) & Render (Backend)                     |

## Key Features

- **Authentication & Authorization** - Secure signup and login utilizing HTTP only cookies with a 3 tier role system (User, Author, Admin).
- **Rich Content Creation** - Blog post authoring powered by the Tiptap rich text editor.
- **Drafts & Publishing** - Authors and Admins can manage draft workflows before making posts public.
- **Interactive Commenting** - Nested comment replies and thread structures.
- **Search & Discovery** - Real time title/content search combined with tag and category filtering that dynamically links back to filtered home page states.
- **Media Uploads** - Seamless image handling for user avatars and post headers via Cloudinary integration.
- **Pagination** - Optimized content delivery across post feeds.

## Project Architecture

This project is structured as a monorepo containing decoupled client and server environments:

```
blog-api/
├── backend/          # Express API, Prisma ORM, routes, middleware and etc.
└── frontend/         # React application, Mantine components, UI views and etc.
```
