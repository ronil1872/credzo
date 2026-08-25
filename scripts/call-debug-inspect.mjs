import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pwgslejhgnoziztpcjjz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-nxT9JPAuRfIgi5Lxc7EFw_yBlh4eoA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectLiveDb() {
  console.log('Querying Edge Function debug-inspect-state...');
  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: { action: 'debug-inspect-state' },
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n--- 1. Subscriptions in DB (' + (data.subscriptions?.length || 0) + ') ---');
  console.dir(data.subscriptions, { depth: null });

  console.log('\n--- 2. Profiles in DB (' + (data.profiles?.length || 0) + ') ---');
  console.dir(data.profiles, { depth: null });

  console.log('\n--- 3. Notification Logs in DB (' + (data.logs?.length || 0) + ') ---');
  console.dir(data.logs, { depth: null });

  console.log('\n--- 4. Recent Leads in DB (' + (data.leads?.length || 0) + ') ---');
  console.dir(data.leads, { depth: null });
}

inspectLiveDb().catch(console.error);
