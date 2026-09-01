---
name: context7-mcp
description: Fetch up-to-date documentation, API references, and code examples for libraries, frameworks, SDKs, and tools used in FieldForge (e.g. NestJS, Drizzle ORM, Turborepo, React 19, Vite, Tailwind CSS, Redux Toolkit, Expo, React Native, Zod, RabbitMQ/amqplib).
---

When working on FieldForge or answering questions about any library, framework, or tool, use Context7 to fetch up-to-date documentation instead of relying on training data.

## FieldForge Key Library IDs (Quick Reference)

| Category                    | Technology         | Context7 Library ID                  | Version in Project                  |
| :-------------------------- | :----------------- | :----------------------------------- | :---------------------------------- |
| **Backend & Microservices** | NestJS             | `/nestjs/nest` or `/websites/nestjs` | `^12.0.1`                           |
| **Database & ORM**          | Drizzle ORM        | `/drizzle-team/drizzle-orm-docs`     | `^0.45.2` (Drizzle Kit: `^0.31.10`) |
| **Validation**              | Zod                | `/colinhacks/zod`                    | `^4.5.4` / v4                       |
| **Monorepo Orchestration**  | Turborepo          | `/vercel/turborepo`                  | `^2.10.12`                          |
| **Web Frontend**            | React              | `/react/react`                       | `^19.2.8`                           |
| **Web Bundler**             | Vite               | `/vitejs/vite`                       | `^8.2.2`                            |
| **Styling**                 | Tailwind CSS       | `/tailwindlabs/tailwindcss`          | `^4.3.3`                            |
| **State Management**        | Redux Toolkit      | `/reduxjs/redux-toolkit`             | `^2.12.0`                           |
| **Web Routing**             | React Router       | `/remix-run/react-router`            | `^7.18.3`                           |
| **Mobile**                  | React Native       | `/facebook/react-native`             | `0.76.7`                            |
| **Mobile Framework**        | Expo               | `/expo/expo`                         | `~52.0.0`                           |
| **Messaging / Queue**       | amqplib (RabbitMQ) | `/websites/amqp_node`                | `^2.0.1`                            |

## How to Fetch Documentation

### Step 1: Resolve the Library ID

Call `resolve-library-id` with:

- `libraryName`: The library name (or use the table above)
- `query`: What to look up in the library's documentation

### Step 2: Query Documentation

Call `query-docs` with:

- `libraryId`: The selected Context7 library ID (e.g. `/drizzle-team/drizzle-orm-docs`)
- `query`: Concept to look up (e.g. `relations and prepared statements`)
