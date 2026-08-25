import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pwgslejhgnoziztpcjjz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-nxT9JPAuRfIgi5Lxc7EFw_yBlh4eoA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectProductionState() {
  console.log('================================================================');
  console.log(' INSPECTING PRODUCTION SUPABASE STATE');
  console.log('================================================================\n');

  // 1. Check Push Subscriptions
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('*');

  console.log('1. Active Push Subscriptions in DB:', subsErr || subs);

  // 2. Check Notification Logs
  const { data: logs, error: logsErr } = await supabase
    .from('notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n2. Notification Logs in DB:', logsErr || logs);

  // 3. Check Organizations
  const { data: orgs, error: orgsErr } = await supabase
    .from('organizations')
    .select('*');

  console.log('\n3. Organizations in DB:', orgsErr || orgs);

  // 4. Check Profiles (Staff/Admin users)
  const { data: profiles, error: profsErr } = await supabase
    .from('profiles')
    .select('*');

  console.log('\n4. Profiles in DB:', profsErr || profiles);

  // 5. Check Recent Leads
  const { data: leads, error: leadsErr } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n5. Recent Leads in DB:', leadsErr || leads);
}

inspectProductionState().catch(console.error);
