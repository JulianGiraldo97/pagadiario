# Guía para Probar el Sistema de Registro de Pagos

## 🚀 Pasos para Probar el Sistema

### 1. Preparar Datos de Prueba

Primero, ejecuta el script SQL en Supabase para crear datos de prueba:

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `src/scripts/create-test-data.sql`
4. Ejecuta el script

Esto creará:
- 3 clientes de prueba (Juan Pérez, María García, Carlos López)
- Deudas activas para cada cliente
- Cronogramas de pago para los próximos 20 días

### 2. Crear una Ruta de Prueba

1. **Inicia sesión como administrador**
2. Ve a **"Prueba Ruta"** en el menú de navegación
3. Selecciona la fecha de hoy
4. Elige un cobrador de la lista
5. Selecciona uno o más clientes (Juan Pérez, María García, Carlos López)
6. Haz clic en **"Crear Ruta"**

### 3. Probar el Registro de Pagos

1. **Cambia a la cuenta del cobrador** (o inicia sesión como cobrador)
2. Ve al **Dashboard del Cobrador** (`/collector`)
3. Verás los clientes asignados para hoy
4. Cada cliente tendrá un botón **"Registrar Pago"**

### 4. Registrar un Pago

1. Haz clic en **"Registrar Pago"** para cualquier cliente
2. Se abrirá el formulario de registro de pagos
3. Selecciona el estado del pago:
   - **"Pagó"**: Cliente realizó el pago
   - **"No Pagó"**: Cliente no pudo pagar
   - **"Ausente"**: Cliente no estaba en casa

#### Para Pagos Exitosos:
- Selecciona **"Pagó"**
- El campo de monto se mostrará automáticamente
- Puedes usar el botón **"Usar monto esperado"** para llenar automáticamente
- Opcionalmente, toma una foto del recibo
- Agrega notas si es necesario
- Haz clic en **"Registrar"**

#### Para No Pagos o Ausencias:
- Selecciona **"No Pagó"** o **"Ausente"**
- **La foto de evidencia es OBLIGATORIA**
- Toma una foto de la casa/negocio o situación
- Agrega notas explicando la situación
- Haz clic en **"Registrar"**

### 5. Verificar el Registro

1. Después de registrar, serás redirigido al dashboard
2. Verás un mensaje de éxito
3. El cliente ahora mostrará:
   - Badge de estado (Pagado/No Pagó/Ausente)
   - Botón **"Editar Registro"** en lugar de "Registrar Pago"
   - Información del pago registrado

### 6. Funcionalidades Adicionales

#### Captura de Fotos:
- En móviles: Se abre automáticamente la cámara
- En desktop: Permite seleccionar archivos de imagen
- Validación automática de tipo y tamaño de archivo
- Vista previa de la imagen antes de enviar

#### Validaciones:
- Estado de pago es obligatorio
- Monto es obligatorio para pagos exitosos
- Foto es obligatoria para no pagos y ausencias
- Validación de tipos de archivo (solo imágenes)
- Validación de tamaño (máximo 5MB)

#### Navegación:
- Botón "Volver" para regresar al dashboard
- Botón "Cancelar" para cancelar el registro
- Navegación automática después del éxito

## 📱 Experiencia Móvil

El sistema está optimizado para dispositivos móviles:
- Interfaz adaptativa
- Captura de cámara nativa
- Botones grandes y fáciles de usar
- Navegación simplificada

## 🔧 Solución de Problemas

### No veo clientes en mi ruta:
- Verifica que tengas una ruta asignada para la fecha actual
- Usa la página "Prueba Ruta" para crear una ruta
- Verifica que estés logueado como el cobrador correcto

### Error al subir fotos:
- Verifica que el archivo sea una imagen (JPG, PNG, etc.)
- Verifica que el archivo sea menor a 5MB
- Verifica tu conexión a internet

### No puedo registrar pagos:
- Verifica que tengas permisos de cobrador
- Verifica que la ruta esté asignada correctamente
- Revisa la consola del navegador para errores

## 📊 Datos de Prueba Creados

### Clientes:
1. **Juan Pérez**
   - Dirección: Calle 123 #45-67, Barrio Centro
   - Teléfono: 3001234567
   - Deuda: $500,000 en cuotas de $25,000 diarias

2. **María García**
   - Dirección: Carrera 45 #12-34, Barrio Norte
   - Teléfono: 3007654321
   - Deuda: $300,000 en cuotas de $15,000 diarias

3. **Carlos López**
   - Dirección: Avenida 80 #23-45, Barrio Sur
   - Teléfono: 3009876543
   - Deuda: $400,000 en cuotas de $20,000 diarias

Cada cliente tiene cronogramas de pago para los próximos 20 días, por lo que puedes probar con diferentes fechas.

## ✅ Funcionalidades Implementadas

- ✅ Formulario de registro de pagos con opciones de estado
- ✅ Captura de fotos para evidencias
- ✅ Subida de imágenes a Supabase Storage
- ✅ Validaciones y confirmaciones
- ✅ Integración completa con el dashboard del cobrador
- ✅ Experiencia móvil optimizada
- ✅ Manejo de errores y estados de carga
- ✅ Navegación fluida entre pantallas

¡El sistema está completamente funcional y listo para usar! 🎉