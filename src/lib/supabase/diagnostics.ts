// Diagnostic utilities for Supabase connection issues

export async function diagnoseSupabaseConnection() {
  const results = {
    environment: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV
    },
    tests: [] as Array<{ name: string; success: boolean; error?: string; details?: any }>
  }

  // Test 1: Basic URL accessibility
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    })
    
    results.tests.push({
      name: 'Basic URL accessibility',
      success: response.ok,
      details: { status: response.status, statusText: response.statusText }
    })
  } catch (error) {
    results.tests.push({
      name: 'Basic URL accessibility',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 2: Auth endpoint accessibility
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/settings', {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      }
    })
    
    results.tests.push({
      name: 'Auth endpoint accessibility',
      success: response.ok,
      details: { status: response.status, statusText: response.statusText }
    })
  } catch (error) {
    results.tests.push({
      name: 'Auth endpoint accessibility',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 3: CORS preflight
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/token', {
      method: 'OPTIONS'
    })
    
    results.tests.push({
      name: 'CORS preflight',
      success: response.ok,
      details: { 
        status: response.status, 
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers')
        }
      }
    })
  } catch (error) {
    results.tests.push({
      name: 'CORS preflight',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return results
}

export function logDiagnostics() {
  console.group('🔍 Supabase Diagnostics')
  
  diagnoseSupabaseConnection().then(results => {
    console.log('Environment:', results.environment)
    
    results.tests.forEach(test => {
      if (test.success) {
        console.log(`✅ ${test.name}`, test.details)
      } else {
        console.error(`❌ ${test.name}`, test.error, test.details)
      }
    })
    
    console.groupEnd()
  }).catch(error => {
    console.error('Failed to run diagnostics:', error)
    console.groupEnd()
  })
}