// Location data service for fetching schools, entertainment, and grocery information

export interface SchoolData {
  name: string
  type: 'Private' | 'Public'
  grades: string
  distance: number
  studentPopulation: number
  latitude: number
  longitude: number
}

export interface EntertainmentDistrict {
  name: string
  address: string
  distance: number
  latitude: number
  longitude: number
}

export interface GroceryStore {
  name: string
  address: string
  type?: string
  latitude: number
  longitude: number
}

// Sample data for Phoenix/Scottsdale area
export const getSchoolsNearProperty = (propertyLat: number, propertyLng: number): SchoolData[] => {
  // Sample schools data for Phoenix area
  const schools: SchoolData[] = [
    {
      name: 'Phoenix Country Day School',
      type: 'Private',
      grades: 'K-12',
      distance: 2.3,
      studentPopulation: 750,
      latitude: 33.5665,
      longitude: -111.9605
    },
    {
      name: 'Brophy College Preparatory',
      type: 'Private', 
      grades: '9-12',
      distance: 4.1,
      studentPopulation: 1400,
      latitude: 33.4920,
      longitude: -112.0130
    },
    {
      name: 'Xavier College Preparatory',
      type: 'Private',
      grades: '9-12',
      distance: 4.5,
      studentPopulation: 1200,
      latitude: 33.4860,
      longitude: -112.0040
    },
    {
      name: 'Scottsdale Unified School District',
      type: 'Public',
      grades: 'K-12',
      distance: 0.5,
      studentPopulation: 23000,
      latitude: 33.5092,
      longitude: -111.8990
    },
    {
      name: 'Cochise Elementary School',
      type: 'Public',
      grades: 'K-5',
      distance: 1.2,
      studentPopulation: 650,
      latitude: 33.5720,
      longitude: -111.9180
    },
    {
      name: 'Cocopah Middle School',
      type: 'Public',
      grades: '6-8',
      distance: 1.8,
      studentPopulation: 900,
      latitude: 33.5580,
      longitude: -111.9250
    },
    {
      name: 'Chaparral High School',
      type: 'Public',
      grades: '9-12',
      distance: 2.5,
      studentPopulation: 2300,
      latitude: 33.5752,
      longitude: -111.9471
    }
  ]

  // Sort by distance and return top results
  return schools
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6) // Return top 6 schools
}

export const getEntertainmentDistricts = (propertyLat: number, propertyLng: number): EntertainmentDistrict[] => {
  // Sample entertainment districts for Phoenix/Scottsdale area
  const districts: EntertainmentDistrict[] = [
    {
      name: 'Scottsdale Fashion Square',
      address: '7014 E Camelback Rd, Scottsdale, AZ 85251',
      distance: 3.2,
      latitude: 33.5022,
      longitude: -111.9293
    },
    {
      name: 'Biltmore Fashion Park',
      address: '2502 E Camelback Rd, Phoenix, AZ 85016',
      distance: 5.8,
      latitude: 33.5090,
      longitude: -112.0301
    },
    {
      name: 'Kierland Commons',
      address: '15205 N Kierland Blvd, Scottsdale, AZ 85254',
      distance: 4.5,
      latitude: 33.6239,
      longitude: -111.9285
    },
    {
      name: 'Old Town Scottsdale',
      address: 'Downtown Scottsdale, AZ 85251',
      distance: 4.0,
      latitude: 33.4942,
      longitude: -111.9261
    },
    {
      name: 'Desert Ridge Marketplace',
      address: '21001 N Tatum Blvd, Phoenix, AZ 85050',
      distance: 8.2,
      latitude: 33.6778,
      longitude: -111.9778
    },
    {
      name: 'Scottsdale Quarter',
      address: '15059 N Scottsdale Rd, Scottsdale, AZ 85254',
      distance: 4.8,
      latitude: 33.6227,
      longitude: -111.9248
    }
  ]

  // Sort by distance
  return districts.sort((a, b) => a.distance - b.distance)
}

export const getGroceryStores = (propertyLat: number, propertyLng: number): GroceryStore[] => {
  // Sample grocery stores for Phoenix/Scottsdale area
  const stores: GroceryStore[] = [
    {
      name: 'Trader Joe\'s',
      address: '7720 E McDowell Rd, Scottsdale, AZ 85257',
      type: 'Specialty',
      latitude: 33.4660,
      longitude: -111.9230
    },
    {
      name: 'Costco Wholesale',
      address: '15255 N Hayden Rd, Scottsdale, AZ 85260',
      type: 'Warehouse',
      latitude: 33.6225,
      longitude: -111.9090
    },
    {
      name: 'Whole Foods Market',
      address: '10810 N Tatum Blvd, Phoenix, AZ 85028',
      type: 'Organic',
      latitude: 33.5850,
      longitude: -111.9770
    },
    {
      name: 'Safeway',
      address: '7525 E Camelback Rd, Scottsdale, AZ 85251',
      type: 'Traditional',
      latitude: 33.5020,
      longitude: -111.9220
    },
    {
      name: 'AJ\'s Fine Foods',
      address: '7141 E Lincoln Dr, Scottsdale, AZ 85253',
      type: 'Upscale',
      latitude: 33.5320,
      longitude: -111.9280
    },
    {
      name: 'Sprouts Farmers Market',
      address: '14605 N Scottsdale Rd, Scottsdale, AZ 85254',
      type: 'Natural',
      latitude: 33.6150,
      longitude: -111.9248
    }
  ]

  // Find nearest of each type
  const nearestCostco = stores.find(s => s.name.includes('Costco'))
  const nearestTraderJoes = stores.find(s => s.name.includes('Trader Joe'))
  const otherStores = stores.filter(s => !s.name.includes('Costco') && !s.name.includes('Trader Joe'))

  // Return required stores
  const result: GroceryStore[] = []
  if (nearestCostco) result.push(nearestCostco)
  if (nearestTraderJoes) result.push(nearestTraderJoes)
  if (otherStores.length > 0) result.push(otherStores[0])

  return result
}

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRad = (value: number): number => {
  return value * Math.PI / 180
}