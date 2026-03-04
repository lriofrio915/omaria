# OmarIA — CLAUDE.md

Agente IA y sistema de gestión para el departamento de **Talento Humano de SG Consulting Group**.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Base de datos | PostgreSQL vía Supabase |
| ORM | Prisma |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| IA | Anthropic Claude (`claude-sonnet-4-6`) |
| Deploy | Vercel (frontend) + Supabase (backend) |

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/          # login, register — sin layout de dashboard
│   ├── (dashboard)/     # rutas protegidas con layout compartido
│   │   ├── admin/       # dashboard del administrador
│   │   ├── employee/    # dashboard del empleado
│   │   ├── employees/   # CRUD de empleados (solo admin)
│   │   ├── documents/   # gestión de documentos
│   │   ├── payroll/     # nóminas y recibos
│   │   ├── organigram/  # organigrama interactivo
│   │   └── ai-agent/    # chat con OmarIA
│   └── api/             # API routes (Next.js server)
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Sidebar, Navbar, etc.
│   ├── employees/       # componentes de empleados
│   ├── documents/       # componentes de documentos
│   ├── payroll/         # componentes de nómina
│   ├── organigram/      # árbol interactivo
│   └── ai/              # chat interface
├── lib/
│   ├── prisma/          # cliente de Prisma (singleton)
│   ├── supabase/        # client.ts, server.ts, middleware.ts
│   └── anthropic/       # cliente de Anthropic + system prompt
├── types/               # tipos TypeScript globales
├── hooks/               # custom React hooks
└── middleware.ts        # protección de rutas con Supabase Auth
```

## Roles de usuario

| Rol | Acceso |
|---|---|
| `ADMIN` | Todo: gestión de empleados, documentos, nóminas, configuración |
| `EMPLOYEE` | Solo lectura: su perfil, sus documentos, sus recibos de nómina |

El rol se guarda en `user_metadata` de Supabase Auth y se valida en el middleware y API routes.

## Módulos

1. **Autenticación** — Login/logout con Supabase Auth, protección de rutas vía middleware
2. **Dashboard** — Métricas y accesos rápidos, diferenciado por rol
3. **Gestión de empleados** — CRUD completo (admin): ficha, contrato, organigrama jerárquico
4. **Documentos** — Subida y consulta: análisis de puestos, organigramas, flujogramas, manuales, políticas
5. **Nóminas** — Subida de recibos PDF por admin, descarga por empleado
6. **Organigrama interactivo** — Árbol visual de la estructura organizacional
7. **Agente IA (OmarIA)** — Chat con Claude para consultas de RRHH

## Prisma

El schema está en `prisma/schema.prisma`. Tablas principales:
- `departments` / `positions` — estructura organizacional
- `employees` — datos de empleados (vinculados a Supabase Auth por `userId`)
- `documents` — archivos subidos a Supabase Storage
- `payroll_records` — registros de nómina con URL al recibo
- `chat_sessions` / `chat_messages` — historial del agente IA
- `audit_logs` — auditoría de acciones

```bash
# Migrar base de datos
npx prisma migrate dev --name <nombre>

# Generar cliente
npx prisma generate

# Ver datos
npx prisma studio
```

## Supabase Storage

Buckets a crear en el proyecto de Supabase:
- `documents` — documentos de RRHH (acceso controlado por RLS)
- `payroll-receipts` — recibos de nómina (solo el empleado dueño puede leer)
- `avatars` — fotos de perfil de empleados (público)

## Variables de entorno

Ver `.env.example`. Configurar antes de ejecutar:
- `DATABASE_URL` y `DIRECT_URL` — de Supabase (connection pooling vs directo)
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — solo server-side, nunca exponer al cliente
- `ANTHROPIC_API_KEY`

## Convenciones de código

- **Componentes**: PascalCase, un componente por archivo
- **API routes**: `src/app/api/[recurso]/route.ts`
- **Server actions**: en el mismo archivo del componente o `actions.ts` del módulo
- **Validación**: Zod en API routes y formularios con react-hook-form
- **Errores**: respuestas `{ error: string }` en API, sonner para toasts en UI
- **Responsive**: mobile-first, usar clases `sm:`, `md:`, `lg:` de Tailwind
- **Modelo de IA**: usar `claude-sonnet-4-6` como modelo por defecto

## Comandos útiles

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run lint         # linter
npx prisma studio    # GUI de base de datos
npx prisma migrate dev --name <nombre>  # nueva migración
```

## Despliegue

- **Vercel**: conectar el repo de GitHub, configurar variables de entorno en el dashboard
- **Supabase**: crear proyecto, ejecutar migraciones con `prisma migrate deploy`
- **Storage**: crear buckets y configurar RLS policies desde el dashboard de Supabase
