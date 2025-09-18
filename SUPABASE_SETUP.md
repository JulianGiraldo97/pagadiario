# Configuración de Supabase para el CRUD de Cobradores

## Estructura de Datos

**NO necesitas una tabla `collectors` separada.** El sistema usa la tabla `profiles` con un campo `role` para diferenciar entre:
- `admin`: Administradores del sistema
- `collector`: Cobradores

## Configuración Paso a Paso

### Paso 1: Ejecutar el Script de Configuración

1. Ve a **Supabase Dashboard → SQL Editor**
2. Copia y pega el contenido del archivo `setup_admin_profile.sql`
3. **IMPORTANTE**: Cambia `'tu-email@ejemplo.com'` por tu email real en la línea 11
4. Ejecuta el script

### Paso 2: Verificar la Configuración

Después de ejecutar el script, deberías ver:
- Tu perfil de administrador creado
- Políticas RLS configuradas
- RLS habilitado en la tabla profiles

## Problemas Identificados y Soluciones

### 1. Error 406 (Not Acceptable) en consultas a `profiles`

Este error indica que las políticas RLS (Row Level Security) están bloqueando las consultas.

#### Solución: El script `setup_admin_profile.sql` configura automáticamente estas políticas:

```sql
-- Política para permitir que los administradores lean todos los perfiles
CREATE POLICY "Admins can read all profiles" ON profiles
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para permitir que los administradores inserten perfiles de cobradores
CREATE POLICY "Admins can insert collector profiles" ON profiles
FOR INSERT WITH CHECK (
  role = 'collector' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para permitir que los administradores actualicen perfiles de cobradores
CREATE POLICY "Admins can update collector profiles" ON profiles
FOR UPDATE USING (
  role = 'collector' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para permitir que los administradores eliminen perfiles de cobradores
CREATE POLICY "Admins can delete collector profiles" ON profiles
FOR DELETE USING (
  role = 'collector' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 2. Error 403 (Forbidden) en Admin API

La API de administrador de Supabase requiere permisos especiales que no están disponibles en el cliente.

#### Solución Temporal (Desarrollo)

Por ahora, el sistema creará perfiles de cobradores sin usuarios de autenticación asociados. Para producción, necesitarás:

1. **Opción 1: Supabase Edge Functions**
   ```sql
   -- Crear una función de Edge que maneje la creación de usuarios
   -- Esta función tendría acceso a la API de admin
   ```

2. **Opción 2: Función de Base de Datos**
   ```sql
   -- Crear una función en PostgreSQL que maneje la lógica
   CREATE OR REPLACE FUNCTION create_collector_user(
     email text,
     password text,
     full_name text
   )
   RETURNS json
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     new_user_id uuid;
     result json;
   BEGIN
     -- Lógica para crear usuario y perfil
     -- Esto requiere configuración adicional en Supabase
   END;
   $$;
   ```

3. **Opción 3: Invitaciones por Email**
   ```typescript
   // Usar la función de invitación en lugar de creación directa
   const { data, error } = await supabase.auth.admin.inviteUserByEmail(
     email,
     {
       data: {
         full_name: fullName,
         role: 'collector'
       }
     }
   );
   ```

### 3. Configuración Actual (Desarrollo)

El sistema actual:
- ✅ Crea perfiles de cobradores en la tabla `profiles`
- ✅ Valida emails únicos
- ✅ Permite CRUD completo de perfiles
- ⚠️ No crea usuarios de autenticación (requiere configuración adicional)
- ⚠️ El reset de contraseña es solo simulado

### 4. Pasos Inmediatos

1. **Configurar las políticas RLS** (arriba)
2. **Verificar que tu usuario actual tenga rol 'admin'** en la tabla profiles
3. **Probar la creación de cobradores**

### 5. Para Producción

Implementar una de las soluciones para la creación de usuarios de autenticación:
- Edge Functions (recomendado)
- Funciones de base de datos
- Sistema de invitaciones

## Verificación

Después de configurar las políticas, deberías poder:
- ✅ Ver la lista de cobradores
- ✅ Crear nuevos cobradores
- ✅ Editar cobradores existentes
- ✅ Eliminar cobradores (sin rutas activas)
- ✅ Asignar cobradores a rutas

## Comandos SQL Útiles

```sql
-- Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verificar tu rol actual
SELECT role FROM profiles WHERE id = auth.uid();

-- Habilitar RLS si no está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```