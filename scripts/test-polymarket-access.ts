/**
 * Script pour tester l'accès à l'API Polymarket
 * Usage: deno run --allow-net scripts/test-polymarket-access.ts
 */

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

async function testEndpoint(name: string, url: string) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    const duration = Date.now() - startTime;

    console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   📦 Content-Type: ${response.headers.get('content-type')}`);

    if (response.status === 200) {
      const text = await response.text();
      console.log(`   📊 Response size: ${text.length} bytes`);

      // Vérifier si c'est du JSON valide
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          console.log(`   ✅ Valid JSON array with ${json.length} items`);
        } else {
          console.log(`   ✅ Valid JSON object`);
        }
      } catch (e) {
        console.log(`   ⚠️  Response is not valid JSON`);
      }
    } else if (response.status === 403) {
      console.log(`   ❌ BLOCKED: Access forbidden (403)`);
    } else if (response.status === 429) {
      console.log(`   ❌ RATE LIMITED: Too many requests (429)`);
    } else {
      const text = await response.text();
      console.log(`   ❌ Error: ${text.substring(0, 200)}`);
    }

    return response.status;
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       🧪 POLYMARKET API ACCESS TEST                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const endpoints = [
    { name: 'Markets List', url: `${POLYMARKET_API}/markets` },
    { name: 'Single Market', url: `${POLYMARKET_API}/markets?id=12` },
    { name: 'Markets with limit', url: `${POLYMARKET_API}/markets?limit=5` },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const status = await testEndpoint(endpoint.name, endpoint.url);
    results.push({ ...endpoint, status });

    // Wait 1 second between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));

  const allSuccess = results.every(r => r.status === 200);
  const anyBlocked = results.some(r => r.status === 403);
  const anyRateLimited = results.some(r => r.status === 429);

  if (allSuccess) {
    console.log('✅ All endpoints accessible - NO BLOCKING DETECTED');
  } else if (anyBlocked) {
    console.log('❌ BLOCKED: Polymarket is blocking your requests (403)');
    console.log('💡 Solution: Use a US VPN or proxy');
  } else if (anyRateLimited) {
    console.log('⚠️  RATE LIMITED: You are making too many requests (429)');
    console.log('💡 Solution: Reduce request frequency');
  } else {
    console.log('⚠️  Some endpoints failed - check details above');
  }

  console.log('\n' + '═'.repeat(60));
}

main();
