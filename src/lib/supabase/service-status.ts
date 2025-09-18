// Service status checker for Supabase
export async function checkSupabaseServiceStatus() {
  const results = {
    isHealthy: false,
    services: {
      auth: false,
      database: false,
      api: false
    },
    message: '',
    shouldRetry: false
  }

  try {
    // Check auth service
    const authResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      }
    })
    
    results.services.auth = authResponse.ok
    
    // Check API service
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    })
    
    results.services.api = apiResponse.ok
    results.services.database = apiResponse.ok // API implies database is working
    
    results.isHealthy = results.services.auth && results.services.api
    
    if (!results.isHealthy) {
      if (authResponse.status === 502 || apiResponse.status === 502) {
        results.message = 'Servicio inicializándose (Error 502). Reintentando automáticamente...'
        results.shouldRetry = true
      } else {
        results.message = 'Servicios no disponibles. Verifica la configuración.'
        results.shouldRetry = false
      }
    } else {
      results.message = 'Todos los servicios están operativos'
    }
    
  } catch (error) {
    results.message = 'Error de conectividad. Verifica tu conexión a internet.'
    results.shouldRetry = true
  }

  return results
}

export async function waitForServiceReady(maxWaitTime = 300000) { // 5 minutes
  const startTime = Date.now()
  const checkInterval = 5000 // 5 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkSupabaseServiceStatus()
    
    if (status.isHealthy) {
      return { ready: true, message: 'Servicios listos' }
    }
    
    if (!status.shouldRetry) {
      return { ready: false, message: status.message }
    }
    
    console.log(`Esperando servicios... ${status.message}`)
    await new Promise(resolve => setTimeout(resolve, checkInterval))
  }
  
  return { ready: false, message: 'Tiempo de espera agotado' }
}