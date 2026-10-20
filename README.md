# 🏡 HomeSync — Household & Shared Expense Management

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![DnD Kit](https://img.shields.io/badge/@dnd--kit-Drag%20%26%20Drop-E11D48)](https://dndkit.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**HomeSync** es una plataforma moderna para la gestión colaborativa del hogar y control financiero compartido. Diseñada con una interfaz reactiva, minimalista y fluida, centraliza la asignación de tareas domésticas (con soporte Drag-and-Drop) y la división equitativa o personalizada de gastos entre compañeros de casa, familias o parejas.

Construida con **React 19**, **Vite** y **Supabase** (PostgreSQL con Row Level Security y autenticación en tiempo real).

---

## ✨ Características Principales

### 1. 📊 Dashboard Centralizado
- Vista panorámica del estado del hogar en tiempo real.
- Indicadores inmediatos de tareas pendientes, completadas y balance financiero global del mes.
- Acceso directo a acciones rápidas y resumen de actividad reciente.

### 2. ✅ Gestión de Tareas Domésticas (Smart Tasks)
- **Tablero interactivo**: Estados *Pendiente*, *En Progreso* y *Completado*.
- **Drag-and-Drop interactivo**: Desarrollado con `@dnd-kit/core` y `@dnd-kit/sortable` para una experiencia táctil y fluida en móvil y escritorio.
- **Generador Inteligente de Tareas**: Motor algorítmico configurable (`taskGenerator.js`) para sugerir y programar rutinas de mantenimiento, compras y limpieza recurrente.
- **Asignación y Fechas Límite**: Atribución por integrante y control de vencimientos (`due_date`).

### 3. 💸 Control Financiero y División de Gastos (Expense Splitter)
- **Registro multi-categoría**: Clasificación por Servicios (Agua, Luz, Gas, Internet), Supermercado, Alquiler, Mantenimiento y Ocio.
- **División de cuentas (Splits)**: Lógica relacional en base de datos para prorratear gastos entre los miembros del hogar.
- **Balance "Quién le debe a Quién"**: Conciliación automática de deudas y saldos pendientes sin necesidad de hojas de cálculo externas.

### 4. 🔒 Seguridad & Arquitectura Cloud
- **Autenticación completa**: Registro e inicio de sesión seguro gestionado por Supabase Auth con listeners reactivos de sesión.
- **PostgreSQL + Row Level Security (RLS)**: Políticas granulares en base de datos para aislar los datos domésticos.
- **Linter de alto rendimiento**: Configurado con Oxlint para garantizar calidad estricta de código.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend Core** | React 19 (Hooks, Context, Composition), React Router DOM v7 |
| **Build & Tooling** | Vite 8, Oxlint |
| **Backend & Base de Datos** | Supabase (PostgreSQL 15+, Auth, Realtime APIs) |
| **Interacción & Drag-and-Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Iconografía & UI** | Lucide React, Glassmorphism CSS nativo |
| **Despliegue** | Netlify / Vercel ready (`netlify.toml` pre-configurado) |

---

## 🏛️ Modelo de Base de Datos (PostgreSQL en Supabase)

El esquema de persistencia se encuentra versionado en [`supabase_schema.sql`](./supabase_schema.sql):

- `home_tasks`: Registro de tareas, asignación, estados y fechas.
- `home_expenses`: Gastos consolidados, monto, categoría, pagador y fecha.
- `home_expense_splits`: Distribución relacional por usuario para conciliación de cuentas.
- *Políticas RLS activadas* para garantizar aislamiento de registros.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js (v20 o superior)
- npm o pnpm
- Proyecto gratuito en [Supabase](https://supabase.com/)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Robgonzalez/homesync-app.git
cd homesync-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia la plantilla `.env.example` a `.env`:
```bash
cp .env.example .env
```
Edita `.env` con las credenciales de tu proyecto en Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

### 4. Ejecutar el esquema en Supabase
Abre el **SQL Editor** en tu consola de Supabase y ejecuta el contenido de [`supabase_schema.sql`](./supabase_schema.sql) para crear las tablas y políticas de seguridad.

### 5. Iniciar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 6. Compilar para producción
```bash
npm run build
```

---

## 👨‍💻 Autor

**Roberto González**  
*Senior Fullstack & AI-Augmented Engineer*  
- 🌐 Portafolio: [robgonzalez.github.io](https://robgonzalez.github.io)  
- 💼 GitHub: [@Robgonzalez](https://github.com/Robgonzalez)

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
