# Sistema de Paga Diario

Sistema de gestión de cobros diarios desarrollado con Next.js y Supabase.

## Tecnologías

- **Frontend**: Next.js 14 con TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: Bootstrap 5
- **Formularios**: React Hook Form
- **Gráficos**: Chart.js

## Configuración del Proyecto

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Configuración de Variables de Entorno

Copia el archivo `.env.local.example` a `.env.local` y configura las variables:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_de_supabase
```

### 3. Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta las migraciones de base de datos (se implementarán en tareas posteriores)
3. Configura las políticas de Row Level Security

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas del dashboard
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI básicos
│   ├── forms/            # Componentes de formularios
│   ├── tables/           # Componentes de tablas
│   └── charts/           # Componentes de gráficos
├── lib/                  # Utilidades y configuración
│   ├── supabase/         # Cliente de Supabase
│   ├── types/            # Tipos de TypeScript
│   └── utils/            # Funciones utilitarias
└── hooks/                # Custom hooks de React
```

## Roles de Usuario

- **Administrador**: Acceso completo al sistema
- **Cobrador**: Acceso limitado a su ruta diaria y registro de pagos

## Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en modo producción
- `npm run lint` - Ejecutar linter

## Próximos Pasos

1. Configurar Supabase y esquema de base de datos
2. Implementar sistema de autenticación
3. Desarrollar componentes de gestión de clientes
4. Implementar sistema de rutas y pagos