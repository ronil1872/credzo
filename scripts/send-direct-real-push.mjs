import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pwgslejhgnoziztpcjjz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-nxT9JPAuRfIgi5Lxc7EFw_yBlh4eoA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDirectRealPush() {
  console.log('Sending direct REAL test push to active subscriber endpoint...');

  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      action: 'send-real-direct-push',
      notification: {
        title: '🔔 REAL DIRECT PUSH TEST',
        body: 'If you see this on your PC screen, Web Push delivery is 100% working!',
        type: 'TEST',
        url: '/admin',
        tag: `direct-test-${Date.now()}`,
      },
    },
  });

  if (error) {
    console.error('❌ Direct push invocation error:', error);
  } else {
    console.log('✅ Direct push response from Edge Function:', data);
  }
}

testDirectRealPush().catch(console.error);
