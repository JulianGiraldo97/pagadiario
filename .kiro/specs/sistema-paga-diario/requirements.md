# Documento de Requerimientos - Sistema de Paga Diario

## Introducción

El Sistema de Paga Diario es una aplicación web diseñada para gestionar el proceso de cobro diario de deudas. La aplicación permite a los administradores gestionar cobradores, clientes, deudas y rutas, mientras que los cobradores pueden registrar pagos e incidencias durante sus recorridos diarios. El sistema utiliza Supabase como backend y Next.js con Bootstrap para el frontend.

## Requerimientos

### Requerimiento 1: Autenticación y Gestión de Roles

**Historia de Usuario:** Como administrador del sistema, quiero poder autenticar usuarios y gestionar roles, para que solo personal autorizado pueda acceder a las funcionalidades correspondientes.

#### Criterios de Aceptación

1. CUANDO un usuario ingrese credenciales válidas ENTONCES el sistema SHALL autenticar al usuario usando Supabase Auth
2. CUANDO un usuario se autentique exitosamente ENTONCES el sistema SHALL redirigir al dashboard correspondiente según su rol
3. IF el usuario tiene rol de administrador THEN el sistema SHALL permitir acceso a todas las funcionalidades
4. IF el usuario tiene rol de cobrador THEN el sistema SHALL restringir el acceso solo a su ruta diaria y registro de pagos
5. WHEN un usuario no autenticado intente acceder a rutas protegidas THEN el sistema SHALL redirigir al login

### Requerimiento 2: Gestión de Clientes y Deudas

**Historia de Usuario:** Como administrador, quiero gestionar la información de clientes y sus deudas, para que pueda mantener un registro actualizado de todos los deudores.

#### Criterios de Aceptación

1. WHEN el administrador cree un cliente THEN el sistema SHALL almacenar nombre, dirección y teléfono
2. WHEN se asigne una deuda a un cliente THEN el sistema SHALL registrar monto total, monto cuota, frecuencia y fecha inicio
3. IF la frecuencia es diaria THEN el sistema SHALL generar cronograma de pagos diarios
4. IF la frecuencia es semanal THEN el sistema SHALL generar cronograma de pagos semanales
5. WHEN se genere un cronograma THEN el sistema SHALL calcular automáticamente las fechas de pago

### Requerimiento 3: Gestión de Rutas de Cobro

**Historia de Usuario:** Como administrador, quiero asignar rutas diarias a los cobradores, para que cada cobrador tenga una lista clara de clientes a visitar.

#### Criterios de Aceptación

1. WHEN el administrador asigne una ruta THEN el sistema SHALL asociar clientes específicos con un cobrador para una fecha determinada
2. WHEN un cobrador acceda al sistema THEN el sistema SHALL mostrar solo los clientes de su ruta del día actual
3. WHEN se visualice una ruta THEN el sistema SHALL mostrar información del cliente y monto a cobrar
4. IF no hay ruta asignada para un cobrador THEN el sistema SHALL mostrar mensaje informativo

### Requerimiento 4: Registro de Pagos e Incidencias

**Historia de Usuario:** Como cobrador, quiero registrar el resultado de cada visita a un cliente, para que quede constancia del estado de cada cobro.

#### Criterios de Aceptación

1. WHEN el cobrador visite un cliente THEN el sistema SHALL permitir marcar como "pagado", "no pagado" o "cliente ausente"
2. WHEN se registre un pago THEN el sistema SHALL almacenar fecha, hora y monto recibido
3. IF el cliente no paga THEN el sistema SHALL permitir subir una foto como evidencia
4. WHEN se registre cualquier incidencia THEN el sistema SHALL guardar timestamp automáticamente
5. WHEN se complete el registro THEN el sistema SHALL actualizar el estado del cliente en la ruta

### Requerimiento 5: Reportes Diarios y Análisis

**Historia de Usuario:** Como administrador, quiero acceder a reportes detallados de la actividad diaria, para que pueda monitorear el desempeño y la recaudación.

#### Criterios de Aceptación

1. WHEN el administrador acceda a reportes THEN el sistema SHALL mostrar lista de clientes que pagaron
2. WHEN se genere un reporte THEN el sistema SHALL mostrar lista de clientes que no pagaron
3. WHEN se calcule la recaudación THEN el sistema SHALL mostrar total recaudado vs total esperado
4. IF se aplican filtros THEN el sistema SHALL permitir filtrar por cobrador, ruta o fecha
5. WHEN se visualicen datos THEN el sistema SHALL presentar información en tablas y gráficos
6. IF el usuario no es administrador THEN el sistema SHALL denegar acceso a reportes

### Requerimiento 6: Arquitectura y Tecnología

**Historia de Usuario:** Como desarrollador, quiero implementar una arquitectura escalable y moderna, para que el sistema sea mantenible y desplegable fácilmente.

#### Criterios de Aceptación

1. WHEN se implemente el backend THEN el sistema SHALL usar Supabase para autenticación y base de datos
2. WHEN se desarrolle el frontend THEN el sistema SHALL usar Next.js como framework
3. WHEN se diseñe la interfaz THEN el sistema SHALL usar Bootstrap para estilos responsive
4. WHEN se configure la base de datos THEN el sistema SHALL incluir tablas: users, clients, debts, payments, routes
5. WHEN se despliegue THEN el sistema SHALL ser compatible con Vercel para el frontend
6. WHEN se integre con Supabase THEN el sistema SHALL usar el SDK oficial

### Requerimiento 7: Experiencia de Usuario Móvil

**Historia de Usuario:** Como cobrador que trabaja en campo, quiero una interfaz optimizada para dispositivos móviles, para que pueda usar la aplicación eficientemente durante mis recorridos.

#### Criterios de Aceptación

1. WHEN se acceda desde dispositivo móvil THEN el sistema SHALL mostrar interfaz responsive
2. WHEN se registren pagos en móvil THEN el sistema SHALL permitir captura de fotos fácilmente
3. WHEN se navegue en móvil THEN el sistema SHALL mantener usabilidad en pantallas pequeñas
4. IF hay conectividad limitada THEN el sistema SHALL mostrar mensajes de estado apropiados