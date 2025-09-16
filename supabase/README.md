# Sistema de Paga Diario - Database Setup

Este directorio contiene las migraciones y configuraciones de base de datos para el Sistema de Paga Diario.

## Estructura de Archivos

- `migrations/001_initial_schema.sql` - Esquema inicial con todas las tablas
- `migrations/002_rls_policies.sql` - Políticas de Row Level Security
- `migrations/003_performance_indexes.sql` - Índices para optimización de performance
- `migrations/004_functions_and_views.sql` - Funciones y vistas útiles
- `seed.sql` - Datos de prueba para desarrollo

## Configuración Inicial

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una nueva cuenta
2. Crea un nuevo proyecto
3. Anota la URL del proyecto y la clave anónima (anon key)
4. Configura las variables de entorno en tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 2. Ejecutar Migraciones

#### Opción A: Usando Supabase CLI (Recomendado)

1. Instala Supabase CLI:
```bash
npm install -g supabase
```

2. Inicializa el proyecto:
```bash
supabase init
```

3. Vincula tu proyecto:
```bash
supabase link --project-ref tu-project-ref 
```

4. Ejecuta las migraciones:
```bash
supabase db push
```

#### Opción B: Usando SQL Editor de Supabase

1. Ve al SQL Editor en tu dashboard de Supabase
2. Ejecuta cada archivo de migración en orden:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_performance_indexes.sql`
   - `004_functions_and_views.sql`

### 3. Configurar Storage (Para fotos de evidencia)

1. Ve a Storage en tu dashboard de Supabase
2. Crea un bucket llamado `evidence-photos`
3. Configura las políticas de acceso:

```sql
-- Política para permitir subida de fotos por cobradores
CREATE POLICY "Collectors can upload evidence photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'evidence-photos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'collector'
  )
);

-- Política para permitir lectura de fotos por administradores y cobradores
CREATE POLICY "Authenticated users can view evidence photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'evidence-photos' AND
  auth.role() = 'authenticated'
);
```

### 4. Configurar Datos de Prueba

1. Crea usuarios de prueba usando el sistema de autenticación de Supabase
2. Obtén los UUIDs de los usuarios creados desde la tabla `auth.users`
3. Ejecuta la función de configuración de datos de prueba:

```sql
SELECT setup_sample_data(
  'uuid-del-admin',
  'uuid-del-cobrador1',
  'uuid-del-cobrador2'
);
```

## Esquema de Base de Datos

### Tablas Principales

- **profiles**: Perfiles de usuario extendidos de auth.users
- **clients**: Información de clientes deudores
- **debts**: Deudas asignadas a clientes
- **payment_schedule**: Cronograma de pagos generado automáticamente
- **routes**: Rutas diarias asignadas a cobradores
- **route_assignments**: Asignación de clientes específicos a rutas
- **payments**: Registro de pagos e incidencias

### Funciones Útiles

- `generate_payment_schedule()`: Genera cronograma de pagos para una deuda
- `update_overdue_payments()`: Actualiza pagos vencidos
- `get_collector_daily_route()`: Obtiene la ruta diaria de un cobrador
- `setup_sample_data()`: Configura datos de prueba

### Vistas

- `daily_collection_summary`: Resumen diario de recaudación por cobrador
- `client_debt_summary`: Resumen de deudas por cliente

## Seguridad

El sistema implementa Row Level Security (RLS) con las siguientes políticas:

- **Administradores**: Acceso completo a todos los datos
- **Cobradores**: Solo pueden ver y modificar datos de sus rutas asignadas
- **Usuarios**: Solo pueden ver y modificar su propio perfil

## Mantenimiento

### Actualizar Pagos Vencidos

Ejecuta periódicamente (recomendado: diariamente):

```sql
SELECT update_overdue_payments();
```

### Backup

Configura backups automáticos en Supabase o ejecuta manualmente:

```bash
supabase db dump --file backup.sql
```

## Troubleshooting

### Error: "relation does not exist"
- Verifica que todas las migraciones se ejecutaron correctamente
- Revisa que las tablas se crearon en el esquema público

### Error: "RLS policy violation"
- Verifica que el usuario esté autenticado
- Confirma que el perfil del usuario existe en la tabla `profiles`
- Revisa que el rol del usuario sea correcto

### Performance Issues
- Verifica que los índices se crearon correctamente
- Revisa las consultas lentas en el dashboard de Supabase
- Considera agregar índices adicionales según los patrones de uso