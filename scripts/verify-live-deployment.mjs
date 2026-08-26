import https from 'https';

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return resolve(fetchUrl(nextUrl));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ url, status: res.statusCode, headers: res.headers, body: data }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function verify() {
  console.log('--- Checking Live Production Site ---');
  const page = await fetchUrl('https://credzofin.com');
  console.log('Resolved URL:', page.url);
  console.log('Status:', page.status);
  console.log('Vercel ID:', page.headers['x-vercel-id']);
  
  const scripts = page.body.match(/\/assets\/index-[a-zA-Z0-9_-]+\.js/g);
  console.log('Bundled JS assets found:', scripts);

  console.log('\n--- Checking Live Service Worker ---');
  const sw = await fetchUrl('https://credzofin.com/sw.js?ts=' + Date.now());
  console.log('SW Status:', sw.status);
  console.log('SW contains SKIP_WAITING:', sw.body.includes('SKIP_WAITING'));
  console.log('SW contains [Push Debug] / sw handlers:', sw.body.includes('credzo-notif'));
  
  if (scripts && scripts[0]) {
    const jsUrl = new URL(scripts[0], page.url).href;
    console.log('\n--- Checking Live JS Bundle ---', jsUrl);
    const bundle = await fetchUrl(jsUrl);
    console.log('Bundle contains [Push Debug] Permission request started:', bundle.body.includes('[Push Debug] Permission request started'));
    console.log('Bundle contains [Push Debug] Enable flow completed:', bundle.body.includes('[Push Debug] Enable flow completed'));
    console.log('Bundle contains Notifications Enabled! text:', bundle.body.includes('Notifications Enabled!'));
  }
}

verify().catch(console.error);
