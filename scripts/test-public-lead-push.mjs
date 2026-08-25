import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pwgslejhgnoziztpcjjz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-nxT9JPAuRfIgi5Lxc7EFw_yBlh4eoA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPublicLeadPush() {
  console.log('Emulating REAL public lead submission notification dispatch...');

  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      event_type: 'PUBLIC_LEAD_SUBMISSION',
      lead: {
        id: 'real-test-lead-' + Date.now(),
        name: 'Vikas Malhotra',
        loan_type: 'Home',
        requested_amount: 2500000,
      },
    },
  });

  if (error) {
    console.error('❌ Lead push error:', error);
  } else {
    console.log('✅ Lead push response from Edge Function:', data);
  }
}

testPublicLeadPush().catch(console.error);
