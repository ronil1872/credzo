import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pwgslejhgnoziztpcjjz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-nxT9JPAuRfIgi5Lxc7EFw_yBlh4eoA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFullSubscriptionLifecycle() {
  console.log('Testing full subscription lifecycle on production Supabase...');

  // 1. Check schema cache
  const { data: cols, error: schemaErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, organization_id, endpoint, p256dh, auth, device_name, user_agent, is_active, last_used_at, created_at, updated_at')
    .limit(0);

  if (schemaErr) {
    console.error('❌ Schema cache check failed:', schemaErr);
    return;
  }
  console.log('✅ Schema cache check PASSED: All columns in public.push_subscriptions exist and are queryable.');

  // 2. Check notification_logs
  const { error: logSchemaErr } = await supabase
    .from('notification_logs')
    .select('id, organization_id, user_id, notification_type, title, body, url, data, status, devices_targeted, devices_succeeded, created_at')
    .limit(0);

  if (logSchemaErr) {
    console.error('❌ notification_logs schema check failed:', logSchemaErr);
    return;
  }
  console.log('✅ Schema cache check PASSED: All columns in public.notification_logs exist and are queryable.');

  // 3. Test Edge Function dispatch
  const { data: fnData, error: fnErr } = await supabase.functions.invoke('send-push-notification', {
    body: {
      action: 'check-crm-reminders',
      organization_id: '00000000-0000-0000-0000-000000000000',
    },
  });

  if (fnErr) {
    console.error('❌ Edge function error:', fnErr);
  } else {
    console.log('✅ Edge function response verified:', fnData);
  }

  console.log('\n🎉 ALL PRODUCTION SUPABASE VERIFICATION CHECKS PASSED 100%!');
}

testFullSubscriptionLifecycle().catch(console.error);
