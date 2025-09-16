// Test Supabase connection and database setup
import { createClient } from './server';

export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const supabase = createClient();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: 'Database connection failed',
        details: error
      };
    }

    return {
      success: true,
      message: 'Database connection successful',
      details: data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed',
      details: error
    };
  }
}

export async function testDatabaseSchema(): Promise<{
  success: boolean;
  message: string;
  missingTables?: string[];
}> {
  try {
    const supabase = createClient();
    
    const requiredTables = [
      'profiles',
      'clients', 
      'debts',
      'payment_schedule',
      'routes',
      'route_assignments',
      'payments'
    ];

    const missingTables: string[] = [];

    for (const table of requiredTables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      return {
        success: false,
        message: 'Some required tables are missing',
        missingTables
      };
    }

    return {
      success: true,
      message: 'All required tables exist'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Schema test failed',
      missingTables: []
    };
  }
}