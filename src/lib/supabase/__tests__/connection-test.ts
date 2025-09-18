import { supabase } from '../client'

// Simple connection test
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Connection test failed:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Connection test successful')
    return { success: true, data }
  } catch (err) {
    console.error('Connection test error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Test auth endpoint specifically
export async function testAuthEndpoint() {
  try {
    console.log('Testing auth endpoint...')
    
    // Try to get current session (should not fail even if no user)
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Auth endpoint test failed:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Auth endpoint test successful')
    return { success: true, data }
  } catch (err) {
    console.error('Auth endpoint test error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}