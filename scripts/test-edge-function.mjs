import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pwgslejhgnoziztpcjjz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-nxT9JPAuRfIgi5Lxc7EFw_yBlh4eoA';

console.log('Testing Edge Function send-push-notification at:', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEdgeFunction() {
  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      action: 'check-crm-reminders',
      organization_id: '00000000-0000-0000-0000-000000000000',
    },
  });

  if (error) {
    console.error('❌ Edge function invocation error:', error);
  } else {
    console.log('✅ Edge function invoked successfully! Response:', data);
  }
}

testEdgeFunction().catch(console.error);
