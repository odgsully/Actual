/**
 * Debug Script: Analyze MCAO Subject Property Data Structure
 *
 * This script helps diagnose why subject property MCAO data isn't fully populating.
 * It checks:
 * 1. What structure the MCAO API returns
 * 2. How the data flows through the generate-excel route
 * 3. What fields are present vs missing
 */

async function debugMCAOSubject(apn: string) {
  console.log('='.repeat(80))
  console.log('MCAO SUBJECT PROPERTY DEBUG')
  console.log('='.repeat(80))
  console.log(`APN: ${apn}`)
  console.log('')

  // Step 1: Call MCAO Lookup API (same as frontend)
  console.log('[STEP 1] Calling MCAO Lookup API...')
  const lookupResponse = await fetch('http://localhost:3000/api/admin/mcao/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apn }),
  })

  const lookupResult = await lookupResponse.json()

  if (!lookupResult.success) {
    console.error('❌ MCAO API call failed:', lookupResult.error)
    return
  }

  console.log('✓ MCAO API call successful')
  console.log(`  Source: ${lookupResult.source}`)
  console.log(`  Field Count: ${lookupResult.fieldCount}`)
  console.log('')

  // Step 2: Analyze response structure
  console.log('[STEP 2] Analyzing Response Structure...')
  console.log(`  Top-level keys: ${Object.keys(lookupResult).join(', ')}`)
  console.log('')

  if (lookupResult.data) {
    console.log('  lookupResult.data keys (first 20):')
    const dataKeys = Object.keys(lookupResult.data)
    dataKeys.slice(0, 20).forEach(key => {
      const value = lookupResult.data[key]
      const valueType = value === null ? 'null' :
                       value === undefined ? 'undefined' :
                       value === '' ? 'empty string' :
                       Array.isArray(value) ? `array[${value.length}]` :
                       typeof value === 'object' ? 'object' :
                       typeof value
      console.log(`    ${key}: ${valueType}`)
    })
    console.log(`  Total data keys: ${dataKeys.length}`)
    console.log('')
  }

  // Step 3: Check critical fields
  console.log('[STEP 3] Checking Critical Subject Property Fields...')
  const criticalFields = [
    'apn',
    'propertyAddress',
    'propertyAddress.fullAddress',
    'bedrooms',
    'bathrooms',
    'improvementSize',
    'lotSize',
    'yearBuilt',
    'propertyType',
    'Owner_SalePrice',
    'Owner_SaleDate',
  ]

  criticalFields.forEach(field => {
    let value
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      value = lookupResult.data?.[parent]?.[child]
    } else {
      value = lookupResult.data?.[field]
    }

    const status = value !== null && value !== undefined && value !== '' ? '✓' : '✗'
    const displayValue = value === null ? 'null' :
                        value === undefined ? 'undefined' :
                        value === '' ? 'empty string' :
                        typeof value === 'object' ? JSON.stringify(value).slice(0, 50) + '...' :
                        value

    console.log(`  ${status} ${field}: ${displayValue}`)
  })
  console.log('')

  // Step 4: Simulate backend processing
  console.log('[STEP 4] Simulating Backend Processing...')
  const mcaoData = lookupResult.data // This is what gets passed as mcaoData.data

  if (!mcaoData) {
    console.error('❌ No data property in MCAO response!')
    return
  }

  // Simulate flattening (from route.ts)
  const flattened = flattenObject(mcaoData)
  console.log(`  Flattened fields count: ${Object.keys(flattened).length}`)
  console.log('  First 30 flattened keys:')
  Object.keys(flattened).slice(0, 30).forEach(key => {
    console.log(`    ${key}: ${flattened[key]}`)
  })
  console.log('')

  // Step 5: Check for specific issues
  console.log('[STEP 5] Diagnosing Potential Issues...')

  const issues: string[] = []

  if (Object.keys(flattened).length < 10) {
    issues.push('⚠️  Very few fields in flattened data (< 10). MCAO API likely returned sparse data.')
  }

  if (!flattened['apn'] && !mcaoData.apn) {
    issues.push('⚠️  No APN in MCAO data')
  }

  if (!mcaoData.propertyAddress?.fullAddress) {
    issues.push('⚠️  No fullAddress in propertyAddress (will show "Subject Property" as address)')
  }

  if (!flattened['Owner_SalePrice'] && !flattened['owner_saleprice']) {
    issues.push('⚠️  No Owner_SalePrice field (SELLER_BASIS will be empty in Analysis sheet)')
  }

  if (!flattened['Owner_SaleDate'] && !flattened['owner_saledate']) {
    issues.push('⚠️  No Owner_SaleDate field (SELLER_BASIS_DATE will be empty in Analysis sheet)')
  }

  if (issues.length === 0) {
    console.log('✓ No obvious issues detected')
  } else {
    issues.forEach(issue => console.log(issue))
  }
  console.log('')

  // Step 6: Recommendations
  console.log('[STEP 6] Recommendations...')
  if (issues.some(i => i.includes('sparse data'))) {
    console.log('  → This is a DATA QUALITY issue, not a code bug')
    console.log('  → The MCAO database has incomplete data for this APN')
    console.log('  → Solutions:')
    console.log('    1. Verify APN is correct on MCAO website: https://www.mcassessor.maricopa.gov/')
    console.log('    2. Add manual data entry option in UI')
    console.log('    3. Use alternative data sources (MLS, PropertyRadar, etc.)')
  } else {
    console.log('  → Data appears complete. If still seeing issues, check:')
    console.log('    1. Template column header matching (case-sensitive)')
    console.log('    2. Frontend is passing complete response as mcaoData')
    console.log('    3. Backend logging in generate-excel route')
  }

  console.log('')
  console.log('='.repeat(80))
  console.log('DEBUG COMPLETE')
  console.log('='.repeat(80))
}

// Flatten object helper (matches route.ts logic)
function flattenObject(obj: any, prefix = '', result: any = {}): any {
  if (prefix.split('_').length > 10) {
    return result
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}_${key}` : key

      // CRITICAL: This skips null/undefined/empty - same as route.ts
      if (value === undefined || value === null || value === '') {
        continue
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        result[newKey] = value
      } else if (value instanceof Date) {
        result[newKey] = value
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item !== null && typeof item === 'object' && !(item instanceof Date)) {
            flattenObject(item, `${newKey}_${index}`, result)
          } else if (item !== undefined && item !== null && item !== '') {
            result[`${newKey}_${index}`] = item
          }
        })
      } else if (typeof value === 'object') {
        flattenObject(value, newKey, result)
      }
    }
  }
  return result
}

// Run for the example APN from the ULTRATHINK report
const exampleAPN = process.argv[2] || '173-35-524'
debugMCAOSubject(exampleAPN)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
