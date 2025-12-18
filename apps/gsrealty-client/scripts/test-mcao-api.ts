/**
 * Test MCAO API - Verify property data fetch works
 *
 * Run: npx ts-node scripts/test-mcao-api.ts
 */

const MCAO_BASE_URL = 'https://mcassessor.maricopa.gov'
const MCAO_API_KEY = 'cc6f7947-2054-479b-ae49-f3fa1c57f3d8' // From .env.local

// Test APNs from the screenshot
const TEST_APNS = [
  '173-24-323',
  '173-35-361',
  '128-53-238'
]

async function testMCAOAPI(apn: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing APN: ${apn}`)
  console.log('='.repeat(80))

  try {
    const url = `${MCAO_BASE_URL}/parcel/${encodeURIComponent(apn)}`
    console.log(`URL: ${url}`)

    const startTime = Date.now()

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AUTHORIZATION': MCAO_API_KEY,
        'user-agent': 'null',
        'Accept': 'application/json'
      }
    })

    const elapsed = Date.now() - startTime

    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Time: ${elapsed}ms`)

    if (!response.ok) {
      console.error(`❌ Failed: HTTP ${response.status}`)
      const text = await response.text()
      console.log(`Response: ${text.substring(0, 200)}...`)
      return
    }

    const data = await response.json()

    console.log(`\n✓ Success! Received ${Object.keys(data).length} top-level fields`)
    console.log(`\nTop-level fields:`)
    Object.keys(data).slice(0, 20).forEach((key, i) => {
      const value = typeof data[key] === 'object' ? '{...}' : data[key]
      console.log(`  ${i + 1}. ${key}: ${value}`)
    })

    // Check for specific fields needed in template
    const importantFields = ['MCR', 'PropertyAddress', 'LotSize', 'IsResidential', 'Owner', 'Valuations']
    console.log(`\nImportant fields check:`)
    importantFields.forEach(field => {
      const exists = field in data
      console.log(`  ${exists ? '✓' : '✗'} ${field}: ${exists ? 'Present' : 'Missing'}`)
    })

  } catch (error) {
    console.error(`❌ Error:`, error instanceof Error ? error.message : error)
  }
}

async function main() {
  console.log('MCAO API Test Script')
  console.log(`Base URL: ${MCAO_BASE_URL}`)
  console.log(`API Key: ${MCAO_API_KEY ? MCAO_API_KEY.substring(0, 8) + '...' : 'NOT SET'}`)

  for (const apn of TEST_APNS) {
    await testMCAOAPI(apn)
    await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('Test complete!')
}

main().catch(console.error)
