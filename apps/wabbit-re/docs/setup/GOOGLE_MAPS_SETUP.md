# Google Maps Integration Setup Guide

## Prerequisites for Google Maps Integration

To complete the Google Maps integration for the Wabbit platform, you'll need to:

### 1. Google Cloud Console Setup

#### Create a Google Cloud Project:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "Wabbit Real Estate" or similar

#### Enable Required APIs:
Navigate to **APIs & Services > Library** and enable these APIs:
- **Maps JavaScript API** (for map display)
- **Places API** (for address autocomplete)
- **Geocoding API** (for address to coordinates conversion)
- **Distance Matrix API** (for commute time calculations)
- **Maps Static API** (for property thumbnails)

#### Create API Key:
1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > API key**
3. Copy the generated API key
4. Click **RESTRICT KEY** and configure:
   - **Application restrictions**: HTTP referrers (websites)
   - **Website restrictions**: Add your domains:
     - `http://localhost:3000/*` (for development)
     - `https://your-domain.com/*` (for production)
   - **API restrictions**: Select the 5 APIs listed above

### 2. Environment Configuration

Add your API key to `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Required Information From You

I need the following details to finalize the Google Maps integration:

#### **Property Address Coordinates**
For accurate map positioning, please provide:
- Latitude and longitude for sample properties
- Or I can use the Geocoding API to convert addresses automatically

#### **Commute Destinations**
Default commute locations to display:
- Major business districts (e.g., Downtown Phoenix, Scottsdale Airpark)
- Popular employment centers
- Any specific addresses you want pre-configured

#### **Points of Interest Categories**
Confirm which amenities to show on the map:
- **Schools**: Elementary, Middle, High School districts
- **Entertainment**: Fashion Square, Biltmore Fashion Park, etc.
- **Grocery**: Costco, Trader Joe's, Whole Foods, etc.
- **Healthcare**: Hospitals, urgent care centers
- **Recreation**: Parks, golf courses, hiking trails

### 4. Technical Implementation Tasks

Once you provide the API key, I'll implement:

#### **Interactive Map Component** (`/components/map/InteractiveMap.tsx`)
- Property location markers (red pins)
- Commute destination markers (blue pins)
- POI markers with custom icons (schools, shopping, etc.)
- Marker clustering for performance
- Info windows with property details

#### **Map Features**
- Zoom controls and street view
- Satellite/terrain view toggle
- Distance measurement tools
- Traffic layer for commute analysis

#### **Address Services** (`/lib/maps/geocoding.ts`)
- Address validation in forms
- Automatic coordinate generation
- Commute time calculations via Distance Matrix API

#### **Location Intelligence** (`/lib/maps/poi-service.ts`)
- Automated POI discovery around properties
- School district mapping
- Amenity scoring algorithms

### 5. Map Styling Options

Choose your preferred map style:
- **Standard**: Default Google Maps appearance
- **Silver/Grayscale**: Professional, muted colors
- **Dark Mode**: For dark theme compatibility
- **Custom Brand**: Matching Wabbit color scheme

### 6. Performance Considerations

#### **Marker Clustering**
- Using `@googlemaps/markerclusterer` (already in package.json)
- Handles 1000+ properties efficiently
- Custom cluster icons with property counts

#### **Lazy Loading**
- Maps load only when component is visible
- Reduces initial page load time
- Better mobile performance

### 7. Cost Management

#### **API Usage Optimization**
- Maps JavaScript API: ~$7 per 1,000 loads
- Geocoding API: ~$5 per 1,000 requests
- Places API: ~$17 per 1,000 requests

#### **Suggested Monthly Budget**
- Development/Testing: $50-100/month
- Production (1000 users): $200-500/month
- Set billing alerts in Google Cloud Console

### 8. Testing Checklist

Once implemented, test these scenarios:
- [ ] Property markers display correctly
- [ ] Commute destinations show accurate times
- [ ] School data loads for each property
- [ ] Map clusters work with 50+ properties
- [ ] Mobile responsiveness
- [ ] Loading performance under slow connections

### 9. Next Steps for You

**Immediate actions needed:**
1. **Create Google Cloud project and get API key**
2. **Add API key to `.env.local`**
3. **Provide sample property coordinates or addresses**
4. **Confirm POI categories you want displayed**

**Optional but recommended:**
5. Set up Google Cloud billing alerts
6. Choose preferred map styling
7. Define any custom business locations (offices, preferred areas)

### 10. Integration Timeline

Once you provide the API key and requirements:
- **Day 1**: Basic map with property markers
- **Day 2**: Commute destinations and time calculations  
- **Day 3**: POI layers (schools, shopping, etc.)
- **Day 4**: Performance optimization and testing
- **Day 5**: Mobile responsiveness and final polish

### 11. Code Structure Preview

The implementation will create these files:
```
/components/map/
  ├── InteractiveMap.tsx          # Main map component
  ├── PropertyMarker.tsx          # Individual property pins
  ├── CommuteMarker.tsx          # Commute destination pins
  └── POIMarker.tsx              # Points of interest

/lib/maps/
  ├── google-maps-loader.ts      # API initialization
  ├── geocoding-service.ts       # Address ↔ coordinates
  ├── distance-calculator.ts     # Commute time calculations
  └── poi-service.ts            # Nearby amenities
```

### 12. Sample Implementation

Here's what the map will look like in the Rank Feed:
- **Center**: Current property location
- **Zoom level**: Optimal for neighborhood view
- **Markers**: Property (red), commute destinations (blue), amenities (green)
- **Controls**: Zoom, map type, layers toggle
- **Info windows**: Click markers for details

---

**Ready to proceed?** Send me your Google Maps API key and any specific requirements, and I'll implement the complete mapping solution.