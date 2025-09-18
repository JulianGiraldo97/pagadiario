# Solución de Problemas de Supabase

## Error 502 Bad Gateway y CORS

### Síntomas
- Error 502 (Bad Gateway) al intentar hacer login
- Error CORS: "No 'Access-Control-Allow-Origin' header is present"
- TypeError: Failed to fetch

### Posibles Causas
1. **Problema temporal del servicio de Supabase**
2. **Configuración incorrecta del proyecto en Supabase**
3. **Problemas de red o firewall**
4. **Configuración incorrecta de variables de entorno**

### Soluciones Implementadas

#### 1. Cliente Supabase Mejorado
- Agregamos configuración explícita de headers y opciones de autenticación
- Mejor manejo de persistencia de sesión

#### 2. Manejo de Errores Mejorado
- Detección específica de errores de conexión y CORS
- Mensajes de error más descriptivos para el usuario
- Logging detallado para debugging

#### 3. Sistema de Diagnósticos
- Función `logDiagnostics()` que prueba:
  - Accesibilidad básica de la URL
  - Endpoint de autenticación
  - Configuración CORS
- Botón de diagnósticos en el formulario de login (modo desarrollo)

### Pasos para Solucionar

#### Paso 1: Verificar Variables de Entorno
```bash
# Verificar que las variables estén configuradas correctamente
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Paso 2: Verificar Estado del Proyecto Supabase
1. Ve a https://supabase.com/dashboard
2. Verifica que tu proyecto esté activo y funcionando
3. Revisa el estado de los servicios en el dashboard

#### Paso 3: Ejecutar Diagnósticos
1. Abre la consola del navegador
2. Ve a la página de login
3. Haz clic en "🔍 Ejecutar Diagnósticos de Conexión"
4. Revisa los resultados en la consola

#### Paso 4: Verificar Configuración CORS en Supabase
1. Ve a Settings > API en tu proyecto Supabase
2. Verifica que `http://localhost:3000` esté en la lista de URLs permitidas
3. Si no está, agrégalo y guarda los cambios

#### Paso 5: Reiniciar Servicios
```bash
# Reiniciar el servidor de desarrollo
npm run dev
```

### Comandos de Diagnóstico Manual

#### Probar Conectividad Básica
```bash
curl -I https://htjasdytdfdzqqebadob.supabase.co/rest/v1/
```

#### Probar Endpoint de Auth
```bash
curl -I https://htjasdytdfdzqqebadob.supabase.co/auth/v1/settings
```

### Soluciones Alternativas

#### Si el problema persiste:
1. **Usar un proxy local** (para desarrollo)
2. **Verificar configuración de firewall/antivirus**
3. **Probar desde una red diferente**
4. **Contactar soporte de Supabase** si es un problema del servicio

### Logs Útiles
- Abrir DevTools > Console
- Buscar mensajes que comiencen con "🔍 Supabase Diagnostics"
- Revisar errores de red en la pestaña Network

### Contacto de Soporte
Si ninguna solución funciona:
1. Capturar screenshot de los errores
2. Ejecutar diagnósticos y capturar resultados
3. Verificar estado de Supabase en https://status.supabase.com/