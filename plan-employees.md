# Plan: Gestión de Empleados — OmarIA
<!-- /autoplan restore point: /c/Users/luis.riofrio/.gstack/projects/lriofrio915-omaria/main-autoplan-restore-20260410-134108.md -->

**Proyecto:** OmarIA — Sistema de RRHH para SG Consulting Group  
**Rama:** main  
**Fecha:** 2026-04-10

---

## Contexto

Sistema de gestión de Talento Humano para SG Consulting Group. Roles: ADMIN (gestión completa) y EMPLOYEE (solo lectura de su propio perfil). Stack: Next.js 15 App Router, Prisma + Supabase PostgreSQL, Supabase Auth, Tailwind + shadcn/ui.

## Estado actual

El módulo de empleados tiene implementación base:

### Lo que YA existe
- `src/app/(dashboard)/employees/page.tsx` — listado con stats (total/activos)
- `src/app/(dashboard)/employees/[id]/page.tsx` — vista de detalle
- `src/app/(dashboard)/employees/[id]/edit/page.tsx` — edición
- `src/app/(dashboard)/employees/new/page.tsx` — creación
- `src/app/api/employees/route.ts` — GET (lista con filtros) + POST (con creación opcional de cuenta Supabase)
- `src/app/api/employees/[id]/route.ts` — GET + PUT + DELETE
- `src/components/employees/EmployeeList.tsx` — componente de lista
- `src/components/employees/EmployeeForm.tsx` — formulario (crear/editar)
- Prisma schema: `Employee` completo con jerarquía (`managerId`), competencias, perfil extendido

### Brechas identificadas

1. **Búsqueda y filtros en UI** — La API soporta `search`, `status`, `departmentId` pero la UI de EmployeeList no los expone visiblemente
2. **Paginación** — No implementada ni en API ni en UI
3. **Subida de avatar** — Campo `avatarUrl` existe en schema pero no hay lógica de upload a Supabase Storage bucket `avatars`
4. **Gestión de competencias** — El schema tiene `EmployeeCompetency` pero no hay UI para asignar competencias a empleados
5. **Vista de organigrama** — Existe `src/app/(dashboard)/organigram/` pero solo carga datos; la ruta `[companySlug]` no está integrada con el módulo de empleados
6. **Reset de contraseña por admin** — API `employees/[id]/reset-password/route.ts` existe pero no está expuesta en la UI de edición
7. **Soft delete vs hard delete** — El campo `status: TERMINATED` existe pero el DELETE de la API hace hard delete
8. **Permisos de EMPLOYEE** — Un empleado no puede ver la lista de sus colegas (ruta `/employees` es admin-only), pero tampoco hay vista de directorio público para empleados
9. **Validación de unicidad** — `employeeCode` es único pero se genera manualmente; no hay auto-generación
10. **Confirmación de email al crear cuenta** — Cuando `createAccount: true`, se crea usuario en Supabase pero el empleado necesita verificar email antes de poder entrar

## Objetivo del plan

Completar el módulo de Gestión de Empleados con:

### Fase 1 — Pulir CRUD existente (prioridad alta)
- Filtros y búsqueda visibles en EmployeeList (search bar + selector de status + departamento)
- Paginación server-side (10/25/50 por página)
- Soft delete: cambiar DELETE a `status: TERMINATED` con confirmación
- Auto-generación de `employeeCode` (formato: `EMP-{año}-{secuencial}`)
- Exponer reset de contraseña en UI de edición (admin)

### Fase 2 — Avatar y perfil rico (prioridad media)
- Upload de avatar a bucket `avatars` de Supabase Storage
- Vista de perfil completo con tabs: Info General | Competencias | Documentos | Nóminas

### Fase 3 — Directorio para empleados (prioridad media)
- Vista `/employee/directory` — tarjetas de colegas (nombre, cargo, departamento, avatar)
- Sin datos sensibles (sin salario, sin email personal)

### Fase 4 — Competencias (prioridad baja)
- UI para asignar/editar competencias por empleado (admin)
- Visualización de competencias en perfil (empleado)

## Sub-problemas y código existente

| Sub-problema | Código existente | Brecha |
|---|---|---|
| Filtros UI | `api/employees?search=&status=&departmentId=` | `EmployeeList` no renderiza controles |
| Paginación | ninguna | Agregar `page` y `pageSize` a API y UI |
| Soft delete | `EmployeeStatus.TERMINATED` | API hace `prisma.employee.delete()` |
| Avatar upload | `avatarUrl` en schema | Sin endpoint de upload, sin bucket policy |
| Competencias | `EmployeeCompetency` model | Sin API ni UI |
| Directorio empleado | `/employee/` dashboard | Sin ruta de directorio |

## Alcance NO incluido en este plan

- Módulo de nóminas (PayrollRecord) — plan separado
- Módulo de documentos — plan separado
- Integración completa de organigrama — plan separado
- Reportes o exports CSV

## Dependencias

- Supabase Storage bucket `avatars` ya debe existir (en CLAUDE.md)
- `departments` y `positions` ya tienen APIs (`/api/departments`, `/api/positions`)
- Auth middleware ya protege rutas dashboard

## Riesgos

- Hard delete en producción podría borrar datos con relaciones (PayrollRecord, Document)
- Upload de avatar sin validación de tipo/tamaño puede ser vector de abuso
- Auto-generación de employeeCode necesita lock para evitar colisiones en concurrencia

---

## CORRECCIÓN POST-AUDITORÍA

`EmployeeList` ya tiene controles de búsqueda y filtros visibles en UI. La paginación también existe pero es **client-side** (fetch all → slice en JS). Brecha real: rendimiento con volumen, hard delete, avatar, employeeCode race condition.

---

## CEO REVIEW — Phase 1 (auto-run via /autoplan)

### 0A. Premise Challenge
- **Problema correcto:** Sí. El CRUD existe en API pero la UI está incompleta. Hard delete puede destruir historial de nóminas. Sin búsqueda ni paginación el sistema no es usable en producción.
- **Outcome real:** Un admin de RRHH necesita encontrar, editar y nunca perder datos de un empleado.
- **Si no actuamos:** El primer hard delete accidental sobre un empleado con PayrollRecords es un incidente de datos.

### 0B. Existing Code Leverage
| Sub-problema | Código existente | Brecha |
|---|---|---|
| Lista con filtros | `GET /api/employees?search=&status=&departmentId=` | Sin controles en UI |
| Paginación | Ninguna | Agregar `page`/`pageSize` a query + UI |
| Soft delete | `EmployeeStatus.TERMINATED` en schema | DELETE handler hace hard delete |
| Avatar | `avatarUrl` en schema | Sin endpoint de upload ni bucket policy |
| employeeCode | `@unique` en schema | Auto-generación no implementada |
| Reset password | `employees/[id]/reset-password/route.ts` | Sin botón en UI de edición |

### 0C. Dream State
```
CURRENT STATE                THIS PLAN                   12-MONTH IDEAL
─────────────────────        ─────────────────────────   ─────────────────────────────
API CRUD completo            + Search UI + paginación    + Onboarding workflows
UI incompleta                + Soft delete               + Firma digital de contratos
Hard delete peligroso        + Avatar upload             + Competency radar chart
Sin fotos de perfil          + Directorio empleados      + OmarIA insights por empleado
                             + Competencias (básico)     + Org chart clickable completo
```

### 0C-bis. Implementation Alternatives
**APPROACH A:** Parches críticos (minimal) — S effort, Low risk. 6 archivos. Solo: soft delete, search UI, paginación, employeeCode auto, reset password UI. Sin avatar ni directorio.

**APPROACH B:** Plan completo (4 fases) — M effort, Medium risk. 15 archivos. Todo: search+pagination, soft delete, avatar, directorio, competencias.

**APPROACH C:** Profile-first — M effort, Low risk. Profundizar perfil individual sin tocar lista. Deja hard delete sin resolver.

**SELECTED: Approach B — SELECTIVE EXPANSION** (P1 completeness, P2 boil the lake, feature enhancement en sistema existente)

### 0E. Temporal Interrogation
- HOUR 1: Bucket `avatars` — ¿público o privado? Público = URL simple. Privado = signed URLs con costo/latencia.
- HOUR 2-3: Soft delete — actualizar `findMany` para filtrar `TERMINATED` por defecto. ¿Organigrama muestra ex-managers?
- HOUR 4-5: `employeeCode` auto-gen necesita `MAX(code)+1` en transacción Prisma para evitar colisiones.
- HOUR 6+: Paginación + filtros simultáneos → state en URL query string (shareable links), no en React state.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Runs | Status | Hallazgos clave |
|--------|---------|------|--------|-----------------|
| CEO Review | `/plan-ceo-review` | 1 | issues_open | Hard delete crítico, make-vs-buy, AI hooks, race condition |
| Subagente CEO | Dual voices | 1 | issues_open | 4 challenges adicionales |
| Design Review | `/plan-design-review` | 1 | issues_open | Empty states, tabs en detalle, avatar |
| Eng Review | `/plan-eng-review` | 1 | issues_open | 8 hallazgos con archivo:línea |

**VERDICT:** APROBADO POR USUARIO — implementar en orden: hotfix soft delete → Fase 1 → Fase 2 → Fase 3 → Fase 4

**ORDEN DE IMPLEMENTACIÓN RECOMENDADO:**
1. **HOTFIX** (PR independiente): soft delete en `employees/[id]/route.ts:132` — deploy inmediato
2. **Fase 1** (PR): server-side pagination + employeeCode con DB SEQUENCE + reset password en UI
3. **Fase 2** (PR): avatar upload + vista de detalle con tabs
4. **Fase 3** (PR): directorio `/employee/directory`
5. **Fase 4** (PR): competencias básicas + hook para agente OmarIA

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|---------|
| 1 | CEO | Skip /office-hours prerequisite | Mechanical | P6 bias toward action | Plan claro, problema bien definido | Run /office-hours |
| 2 | CEO | Approach B (plan completo) | Mechanical | P1+P2 completeness | Hard delete es riesgo crítico, avatar y directorio completan el caso de uso | Approach A (deja hard delete sin resolver), Approach C (misma razón) |
| 3 | CEO | SELECTIVE EXPANSION mode | Mechanical | P3 pragmatic | Feature enhancement en sistema existente | SCOPE EXPANSION (no es greenfield) |

---

## CEO REVIEW — Sections 1-11

### Section 1: Architecture Review

```
ARQUITECTURA ACTUAL — Módulo Empleados
═══════════════════════════════════════════════════════════
  Browser
    │
    ▼
  EmployeeList (client component)
    │  fetch all employees → client-side slice
    │
    ├──▶ GET /api/employees?search=&status=&companyId=
    │         │
    │         ▼
    │    prisma.employee.findMany() — SIN limit/skip
    │         │
    │         ▼
    │    PostgreSQL (Supabase)
    │
    ├──▶ DELETE /api/employees/[id]
    │         │
    │         ▼
    │    prisma.employee.delete() ← HARD DELETE ← CRÍTICO
    │
    └──▶ POST /api/employees (crear + opcional Supabase Auth user)
              │
              ├── employeeCode = count+1 ← RACE CONDITION
              └── createAdminClient().auth.admin.createUser(...)

ACOPLAMIENTO NUEVO:
  + Avatar upload → Supabase Storage (nuevo boundary)
  + Directorio empleados → nueva ruta /employee/directory
  + Competencias → nuevo modelo EmployeeCompetency (ya existe en schema)
```

**Hallazgos críticos:**
1. Hard delete en línea 132 de `employees/[id]/route.ts` puede destruir `PayrollRecord[]` y `Document[]` vinculados si las FK no tienen `onDelete: Restrict`. Verificar constraints en schema.
2. Paginación client-side: con 200+ empleados, el bundle de datos crece linealmente. Server-side es necesario.
3. `employeeCode = count + 1` en POST: si dos requests llegan simultáneamente, ambos calculan el mismo count y generan el mismo código. La constraint `@unique` en DB lo detecta pero devuelve un 500 sin manejo.

**Rollback:** Soft delete es reversible (cambiar status). Avatar upload es reversible (delete del bucket). Server-side pagination es backward-compatible. Sin migraciones destructivas en este plan.

### Section 2: Error & Rescue Map

```
CODEPATH                          | FALLA POSIBLE              | MANEJADO?
─────────────────────────────────|────────────────────────────|──────────
DELETE /api/employees/[id]        | FK constraint (PayrollRecord)| NO → 500
POST /api/employees               | employeeCode duplicate key  | NO → 500
POST /api/employees               | Supabase Auth createUser fail| Parcial → employee creado sin cuenta
Avatar upload                     | Archivo > límite size       | NO (no implementado)
Avatar upload                     | Tipo de archivo inválido    | NO (no implementado)
Avatar upload                     | Supabase Storage error      | NO (no implementado)
GET /api/employees (sin paginación)| Timeout con 1000+ registros| NO → timeout silencioso
employeeCode race condition        | PrismaClientKnownRequestError P2002 | NO → 500
```

**Gaps a resolver en el plan:**
- DELETE: cambiar a `update({ status: "TERMINATED" })` resuelve el FK problem
- employeeCode: usar `MAX(employeeCode)` en transacción o UUID con formato
- POST con createAccount: si Supabase falla post-employee-create, rollback en Prisma (employee creado sin user → inconsistencia)
- Avatar: validar `content-type` y `size` antes de upload

### Section 3: Security & Threat Model

| Amenaza | Likelihood | Impact | Mitigado en plan |
|---|---|---|---|
| IDOR: admin ve/edita empleado de otra empresa | Medium | High | Parcial — API filtra por companyId pero no valida que el admin pertenece a esa company |
| Avatar upload: ejecutable disfrazado de imagen | Low | High | No — necesita validar MIME type server-side |
| employeeCode enumeration | Low | Low | OK — no expone datos sensibles |
| Salary en GET response | Medium | Medium | Salary no aparece en include del findMany — OK |
| Admin crea usuario Supabase sin límite de rate | Medium | Medium | Sin rate limiting en POST /api/employees |
| Hard delete sin audit log | High | High | Resuelto al hacer soft delete |

**Acción concreta:** La validación de MIME en avatar no puede ser solo client-side. Debe verificarse con `file.type` en el endpoint server-side. Aceptar solo `image/jpeg`, `image/png`, `image/webp`. Max 2MB.

### Section 4: Data Flow — Avatar Upload

```
INPUT (File) ──▶ CLIENT VALIDATION ──▶ API ENDPOINT ──▶ SUPABASE STORAGE ──▶ DB UPDATE
   │                    │                    │                  │                  │
   ▼                    ▼                    ▼                  ▼                  ▼
[nil?]→error     [type invalid?]→reject  [size >2MB?]→400  [bucket error?]→500  [update fail?]→orphan
[>2MB?]→warn     [not image?]→reject    [auth check]       [CDN URL returned]   [file exists, no URL in DB]
```

**Interacciones edge cases:**
| Interacción | Edge case | Plan lo cubre? |
|---|---|---|
| Eliminar empleado | Double-click en botón delete | Sí — dialog de confirmación |
| Eliminar empleado | Status TERMINATED ya puesto | Idempotente con soft delete |
| Upload avatar | Usuario navega antes de confirmar | Archivo subido, DB no actualizada → orphan file |
| Filtro + paginación | Cambiar filtro en página 5 | Reset a página 1 (ya implementado en EmployeeList) |
| employeeCode | Dos admins crean empleado a la vez | Race condition → P2002 → 500 sin mensaje útil |

### Section 5: Test Plan Gaps

Tests críticos que el plan debe incluir:
1. **Soft delete no rompe PayrollRecord** — verify `findMany` excluye TERMINATED, verify PayrollRecord sigue existente
2. **employeeCode único bajo concurrencia** — mock dos POST simultáneos
3. **Avatar: solo imágenes < 2MB** — test con PDF, test con 3MB JPEG
4. **Paginación server-side** — page=2, pageSize=10 devuelve registros correctos
5. **IDOR: admin no accede a employee de otra company** — test con companyId manipulado

### Section 6: Observability

Actualmente: ningún log estructurado en las API routes. Plan debe agregar:
- Log cuando se hace soft delete (quién, cuándo, qué empleado)
- Log de errores en upload de avatar (tipo de archivo rechazado, tamaño)
- Métrica: tiempo de response de `GET /api/employees` con pagination

### Section 7-11: Remaining sections

**Secc. 7 (Dependencies):** No hay deps nuevas. Supabase Storage SDK ya está en el proyecto.

**Secc. 8 (Deployment):** Sin migraciones destructivas. Soft delete es backward-compatible. Bucket `avatars` necesita crearse en Supabase Dashboard y configurar política de acceso público antes del deploy.

**Secc. 9 (Performance):** Server-side pagination resuelve el problema principal. Query actual hace JOIN con department, position, company — agregar `take`/`skip` a `findMany` es suficiente.

**Secc. 10 (DX):** Solo ADMIN usa estas APIs. No aplica DX externo.

**Secc. 11 (Design scope):** UI scope detectado. Pasar a Phase 2 (Design Review).

---

## ENG REVIEW — Phase 3 (auto-run via /autoplan)

### Section 1: Architecture — ASCII Dependency Graph

```
MÓDULO EMPLEADOS — DEPENDENCY GRAPH (actual + plan)

  (dashboard)/employees/page.tsx
       │
       └──▶ EmployeeList (client)
                 │  fetch all → client-side slice  ← CAMBIAR a server-side
                 ├──▶ GET /api/employees?search=&status=&companyId=&page=&pageSize=
                 │         └──▶ prisma.employee.findMany({ take, skip })  ← AGREGAR
                 │
                 ├──▶ DELETE /api/employees/[id]
                 │         └──▶ prisma.employee.delete()  ← CAMBIAR a update(TERMINATED)
                 │
  (dashboard)/employees/new/page.tsx
       └──▶ EmployeeForm
                 └──▶ POST /api/employees
                           ├── count() + 1  ← RACE CONDITION → usar $queryRaw MAX
                           ├── adminClient.auth.admin.createUser()  ← sin rollback
                           └── prisma.employee.create()

  (dashboard)/employees/[id]/edit/page.tsx
       └──▶ EmployeeForm (modo edición)
                 └──▶ PUT /api/employees/[id]

  [NUEVO] POST /api/employees/[id]/avatar
                 └──▶ validate MIME + size
                 └──▶ supabase.storage.from('avatars').upload()
                 └──▶ prisma.employee.update({ avatarUrl })

  [NUEVO] GET /employee/directory  (rol EMPLOYEE)
                 └──▶ prisma.employee.findMany({ select: safe fields only })
```

**Coupling nuevo:** Avatar endpoint acopla Supabase Storage con Prisma. Si Storage sube pero Prisma falla → archivo huérfano. Plan debe incluir compensación (delete del archivo si update falla).

### Section 2: Code Quality

1. **employeeCode race condition** (`employees/route.ts:101`):
   ```ts
   // ACTUAL (roto bajo concurrencia)
   const count = await prisma.employee.count();
   const employeeCode = `SG${String(count + 1).padStart(4, "0")}`;
   
   // FIX: usar MAX en transacción
   const result = await prisma.$queryRaw<[{max: string|null}]>`
     SELECT MAX("employeeCode") as max FROM employees WHERE "employeeCode" LIKE 'SG%'
   `;
   const lastNum = result[0]?.max ? parseInt(result[0].max.replace('SG','')) : 0;
   const employeeCode = `SG${String(lastNum + 1).padStart(4, "0")}`;
   // Nota: la constraint @unique en DB es el safety net final si hay colisión
   ```

2. **Sin transacción Auth+DB** (`employees/route.ts:105-142`):
   ```
   ACTUAL:  createUser() → [falla Prisma] → usuario Auth huérfano
   FIX:     createUser() → create employee → if error: adminClient.auth.admin.deleteUser(userId)
   ```

3. **Hard delete sin manejo de FK** (`employees/[id]/route.ts:132`):
   ```ts
   // ACTUAL
   await prisma.employee.delete({ where: { id } });
   
   // FIX
   await prisma.employee.update({ 
     where: { id }, 
     data: { status: "TERMINATED", endDate: new Date() }
   });
   ```

4. **GET sin paginación server-side** — `findMany` sin `take`/`skip`. Con 300 empleados transfiere ~300KB JSON innecesario. Fix: agregar `take: pageSize, skip: (page-1)*pageSize` y devolver `{ data, total }`.

5. **Catch genérico en todos los handlers** — el catch en DELETE no distingue `P2002` (unique constraint) de `P2025` (record not found) de un timeout. Minimal fix: detectar `err.code` de Prisma.

### Section 3: Test Diagram

```
FLUJOS NUEVOS → COBERTURA DE TESTS
═══════════════════════════════════════════════════════════

Soft delete
  ├── DELETE /api/employees/[id] → status=TERMINATED ✓ (nuevo)
  ├── GET /api/employees sin ?showTerminated → excluye TERMINATED ✓ (nuevo)
  └── PayrollRecord del empleado sigue existiendo post-soft-delete ✓ (nuevo)

employeeCode auto-gen
  ├── Primer empleado → SG0001 ✓
  ├── Con 10 empleados → SG0011 ✓
  └── P2002 en colisión → retry o 409 con mensaje claro ✓

Avatar upload
  ├── JPEG válido < 2MB → 200, avatarUrl en DB ✓
  ├── PDF → 400 "tipo no permitido" ✓
  ├── JPEG > 2MB → 400 "archivo demasiado grande" ✓
  └── Storage falla → 500, archivo no queda huérfano ✓

Server-side pagination
  ├── page=1, pageSize=10 → primeros 10 ✓
  ├── page=2, pageSize=10 + search="Ana" → correctos ✓
  └── page=99 (fuera de rango) → última página, no error ✓

Directorio empleados
  ├── Rol EMPLOYEE → ve solo campos seguros (no salary) ✓
  └── Rol ADMIN → 403 en ruta /employee/directory (admin usa /employees) ✓
```

### Section 4: Performance

- `findMany` actual: JOINs con `department`, `position`, `company` en cada row. Con paginación server-side este costo baja de O(n_total) a O(pageSize).
- Avatar: Supabase Storage CDN sirve las imágenes — no hay costo de bandwidth en el servidor Next.js.
- Directorio empleados: `select` restringido (sin salary, sin personalEmail) — query liviana.

### Section 5: Security (complemento a CEO Secc. 3)

La validación de MIME en avatar **debe** ser server-side. El `content-type` del header HTTP puede ser manipulado por el cliente. La validación correcta es con `file-type` package o leyendo los primeros bytes (magic bytes).

Opción pragmática sin dependencia extra: Supabase Storage puede configurarse con políticas de tipo de archivo a nivel bucket. Documentar esto como requisito de setup.

### Section 6: Deployment

Prerrequisitos antes de deploy:
1. Bucket `avatars` creado en Supabase Storage con policy: `SELECT` público, `INSERT/UPDATE` solo autenticados
2. No hay migraciones destructivas en este plan — solo cambios de lógica
3. Soft delete es backward-compatible con datos existentes

### Eng Completion Summary

| Hallazgo | Archivo | Línea | Acción |
|---|---|---|---|
| Hard delete | `employees/[id]/route.ts` | 132 | `update({ status: "TERMINATED" })` |
| Race condition employeeCode | `employees/route.ts` | 101 | `$queryRaw MAX()` |
| Sin rollback Auth+DB | `employees/route.ts` | 105-142 | Cleanup en catch |
| Paginación client-side | `EmployeeList.tsx` | ~148 | Server-side `take`/`skip` |
| GET sin total count | `employees/route.ts` | GET handler | Devolver `{ data, total }` |
| Avatar: MIME sin validar | [nuevo endpoint] | — | Validar server-side o bucket policy |
| Empty states faltantes | `EmployeeList.tsx` | render section | Agregar empty state components |
| aria-label en search | `EmployeeList.tsx` | search Input | Agregar `aria-label="Buscar colaboradores"` |

**Test plan guardado en:** `~/.gstack/projects/lriofrio915-omaria/main-test-plan-20260410-164554.md`

**Phase 3 complete.** 8 hallazgos eng documentados con archivos y líneas específicas.

---

## CEO DUAL VOICES — CONSENSUS TABLE

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                            Claude   Subagente   Consensus
  ─────────────────────────────────── ──────── ─────────── ──────────
  1. Premises válidas?                 Sí       Parcial*    DISAGREE
  2. Problema correcto a resolver?     Sí       Sí          CONFIRMED
  3. Scope calibrado correctamente?    Sí       DISAGREE**  DISAGREE
  4. Alternativas bien exploradas?     Sí       No***       DISAGREE
  5. Riesgos competitivos cubiertos?   N/A      Make-vs-buy DISAGREE
  6. Trayectoria 6 meses sana?         Sí       Riesgo AI   DISAGREE
═══════════════════════════════════════════════════════════════
* Subagente cuestiona: bucket avatars asumido, modelo tenancy no claro,
  tamaño real de empleados no validado
** Subagente: hard delete fix debe ser hotfix independiente primero
*** Subagente: dismissal de Approach A es lógicamente inválido
CONFIRMED = ambos acuerdan. DISAGREE = modelos difieren → surfaced en gate.
```

**Hallazgos exclusivos del subagente (no capturados en revisión primaria):**
1. **Make-vs-buy no evaluado** — Factorial HR, BambooHR, Rippling ofrecen esto out-of-box para LATAM. Debe haber un log de decisión explícito.
2. **Hard delete fix = hotfix independiente** — debe deployarse antes del resto del plan, no como Fase 1.
3. **AI integration hooks ausentes** — el plan no reserva ningún hook para que OmarIA (Claude agent) pueda consultar datos de empleados.
4. **Race condition fix incompleto** — MAX() query sigue teniendo ventana; DB-native SEQUENCE sería race-free.

---

## DESIGN REVIEW — Phase 2 (auto-run via /autoplan)

**Design scope inicial: 6/10** — Lista bien construida, detalle básico.

### Dim 1: Information Hierarchy

Lista: El usuario ve nombre → empresa → cargo → estado. Orden correcto para RRHH.
Detalle: Page actual muestra datos en cards planas, sin tabs ni jerarquía clara entre info crítica (contrato, salario) e info secundaria (subordinados, documentos recientes).

**Hallazgo:** La vista de detalle mezcla 6 tipos de información en un scroll lineal. Con tabs (Info General | Documentos | Nóminas | Competencias) el admin encuentra lo que busca 3x más rápido.

### Dim 2: Estados faltantes

| Estado | Lista | Detalle | Plan lo incluye? |
|---|---|---|---|
| Loading skeleton | Sí (loading=true) | No — spinner genérico | No — agregar skeleton en detalle |
| Empty state (0 empleados) | No — tabla vacía sin mensaje | N/A | Agregar mensaje "Agrega tu primer colaborador" |
| Empty state (0 resultados de búsqueda) | No | N/A | Agregar mensaje "Sin resultados para X" |
| Error de fetch | No — fallo silencioso | No | Agregar toast de error |
| Soft deleted employee (TERMINATED) | Aparece en lista con badge rojo | Detail muestra igual | Ocultar de la lista por defecto, con toggle "Mostrar terminados" |
| Avatar loading / broken image | N/A (sin avatar) | N/A | Fallback a iniciales (ya existe en EmployeeList para la lista) |

### Dim 3: Jerarquía de interacciones

Lista: Search → Filtros → Tabla → Acciones por fila (ver/editar/eliminar). Correcto.
Eliminar: El botón rojo con ícono trash2 está en la misma fila que Ver y Editar — demasiado cerca de acciones no destructivas. Riesgo de click accidental.

**Hallazgo:** El botón Eliminar debe estar separado visualmente (margen izquierdo extra, o moverlo al menú de 3 puntos). Con soft delete el riesgo es menor, pero el patrón de UX correcto es confirmar siempre la acción destructiva (el plan ya tiene dialog de confirmación — bien).

### Dim 4: Responsive

La toolbar (search + filtros + nuevo) colapsa correctamente en mobile con clases `sm:`. La tabla usa `hidden sm:table-cell` pattern implícito pero no está explícito. En mobile la tabla completa puede ser difícil — las columnas ciudad y código pueden ocultarse en xs.

### Dim 5: Accesibilidad

El search input tiene `placeholder` pero no `aria-label`. El dialog de confirmación usa DialogTitle/Description — bien. Los badges de status son solo color — necesitan texto (ya tienen texto — bien).

### Dim 6: Avatar en lista vs detalle

Al agregar avatars, la lista debe mostrar la imagen real si existe, con fallback a iniciales. La lógica de `colorFromString` ya genera colores deterministas — mantenerla como fallback es el patrón correcto.

### Dim 7: Directorio de empleados (nueva vista)

Vista `/employee/directory` para rol EMPLOYEE. Diseño sugerido: grid de tarjetas (nombre, cargo, departamento, avatar/iniciales). Sin datos sensibles. Búsqueda por nombre. Sin paginación en primera versión (directorio suele ser <100 personas).

**Design Litmus Scorecard:**

| Dimensión | Score | Hallazgo clave |
|---|---|---|
| Jerarquía de información | 7/10 | Detalle necesita tabs |
| Estados (loading/empty/error) | 5/10 | Empty states y error handling ausentes |
| Flujo de usuario | 8/10 | Eliminación demasiado cerca de acciones no destructivas |
| Responsive | 7/10 | Columnas extras en mobile no controladas |
| Accesibilidad | 7/10 | aria-label en search input |
| Avatar/imagen | 0/10 | No implementado aún |
| Directorio empleados | 0/10 | Vista nueva por implementar |
| **Overall** | **4.9/10** | Reflejan funcionalidad existente más brechas del plan |

---

**Phase 2 complete.** 7 dimensiones evaluadas. Pasando a Phase 3 (Eng Review).

---

### NOT in scope (deferred)

- Módulo nóminas — plan separado
- Módulo documentos — plan separado  
- Firma digital de contratos — plan separado
- Organigrama interactivo completo — plan separado
- Export CSV de empleados — TODOS.md
- Rate limiting en API routes — TODOS.md (infraestructura transversal)

### What Already Exists

- `EmployeeList` con search + filtros + paginación client-side
- `EmployeeForm` con todos los campos del schema
- `GET/POST /api/employees` funcional con validación Zod
- `GET/PUT/DELETE /api/employees/[id]`  
- `POST /api/employees/[id]/reset-password`
- Schema Prisma completo con `EmployeeCompetency`, `EmployeeProfile`

### CEO Completion Summary

| Dimension | Hallazgo | Severidad | Acción |
|---|---|---|---|
| Hard delete | `prisma.employee.delete()` destruye historial | CRÍTICO | Cambiar a soft delete en este plan |
| Race condition employeeCode | count+1 en concurrencia | ALTO | Transacción con MAX() o retry loop |
| Paginación client-side | Fetch all → JS slice → no escala | ALTO | Server-side `take`/`skip` |
| Avatar sin validación MIME | Cualquier archivo sube | MEDIO | Validar server-side |
| Post createAccount atomic | Employee crea pero Supabase falla → inconsistencia | MEDIO | Rollback o saga pattern |
| IDOR company scope | Admin podría ver employees de otra company | MEDIO | Validar `companyId` del admin en cada request |

