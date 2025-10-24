# Field Alignment Reference

**Property**: 4600 N 68TH ST UNIT 371, SCOTTSDALE, AZ 85251

This document maps field names across MLS, MCAO, and PropertyRadar data sources to facilitate data comparison and validation.

---

## Address & Location

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Full Address | Composite (House Number + Street Name + Unit + City + State + Zip) | PropertyAddress | Address |
| Street Number | House Number | (Part of PropertyAddress) | (Part of Address) |
| Street Name | Street Name | (Part of PropertyAddress) | (Part of Address) |
| Street Suffix | St Suffix | (Part of PropertyAddress) | (Part of Address) |
| Compass Direction | Compass | (Part of PropertyAddress) | (Part of Address) |
| Unit Number | Unit # | (Part of PropertyAddress) | (Part of Address) |
| City | City/Town Code | (Part of PropertyAddress) | SCOTTSDALE |
| State | State/Province | (Part of PropertyAddress) | AZ |
| Zip Code | Zip Code | (Part of PropertyAddress) | 85251 |
| Zip+4 | Zip4 | *Not Available* | *Not Available* |
| County | County Code | *Implicit (Maricopa)* | County |
| Latitude | Geo Lat | Geo_lat | Latitude/Longitude |
| Longitude | Geo Lon | Geo_long | Latitude/Longitude |

## Property Identification

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Parcel Number (APN) | Assessor Number | APN | Assessor Parcel Number |
| Assessor's Book | Assessor's Book # | (Part of APN 173) | *Not Displayed* |
| Assessor's Map | Assessor's Map # | (Part of APN 35) | *Not Displayed* |
| Assessor's Parcel | Assessor's Parcel # | (Part of APN 524) | *Not Displayed* |
| MCR Number | *Not Available* | MCR | *Not Available* |
| Legal Description | Legal Description (Abbrev) / Legal | PropertyDescription | Legal Book/Page/Block/Lot |
| Section/Township/Range | Legal Info (Section/Township/Range) | SectionTownshipRange | Township/Range/Section |

## Property Characteristics

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Property Type | Property Type / Dwelling Type | PropertyType | Advanced Type |
| Year Built | Year Built | ResidentialPropertyData_ConstructionYear | Year Built |
| Original Year Built | *Not Available* | ResidentialPropertyData_OriginalConstructionYear | *Not Available* |
| Square Footage | Approx SQFT | ResidentialPropertyData_LivableSpace | Square Feet |
| Square Footage Source | Source of SqFt | *Not Available* | *Not Available* |
| Lot Size (SqFt) | Approx Lot SqFt | LotSize, ResidentialPropertyData_LotSize | Lot SqFt |
| Lot Source | Source Apx Lot SqFt | *Not Available* | *Not Available* |
| Lot Size (Acres) | Approx Lot Acres | *Not Available* | Lot Acres |
| Bedrooms | # Bedrooms | *Not Available* | Bedrooms |
| Bedrooms Plus | Bedrooms Plus | *Not Available* | *Not Available* |
| Bathrooms | Total Bathrooms | ResidentialPropertyData_BathFixtures | Bathrooms |
| Full Bathrooms | Full Bathrooms | *Not Available* | *Not Available* |
| Half Bathrooms | Half Bathrooms | *Not Available* | *Not Available* |
| Interior Levels | # of Interior Levels | *Not Available* | *Not Available* |
| Stories | Exterior Stories | ResidentialPropertyData_Stories | Stories |
| Units | *Not Available* | *Not Available* | Units |
| Rooms | Rooms | *Not Available* | Rooms |

## Physical Features

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Pool (Private) | Private Pool Y/N | ResidentialPropertyData_Pool | Pool |
| Pool (Community) | Community Pool Y/N | *Not Available* | *Not Available* |
| Garage Spaces | Parking Spaces: Garage Spaces | ResidentialPropertyData_NumberOfGarages | Garage Spaces |
| Carport Spaces | Parking Spaces: Carport Spaces | ResidentialPropertyData_NumberOfCarports | *Not Available* |
| Covered Parking | Parking Spaces: Total Covered Spaces | ResidentialPropertyData_CoveredParking | *Not Available* |
| Parking Type | Features: Parking Features | ResidentialPropertyData_ParkingType | *Not Available* |
| Fireplace | Fireplace YN | *Not Available* | Fireplace |
| Fireplace Count | Fireplaces Total | *Not Available* | *Not Available* |
| Air Conditioning | Features: Cooling | ResidentialPropertyData_Cooling | Air Conditioning |
| Heating | Features: Heating | ResidentialPropertyData_Heating | Heating |
| Exterior Walls | Features: Const - Finish | ResidentialPropertyData_ExteriorWalls | Exterior Wall Type |
| Roof Type | Features: Roofing | ResidentialPropertyData_RoofType | Roof Type |
| Quality/Grade | *Not Available* | ResidentialPropertyData_ImprovementQualityGrade | Quality/Class |
| Condition | *Not Available* | ResidentialPropertyData_PhysicalCondition | Improvement Condition |

## Tax & Valuation

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Annual Property Taxes | Taxes | *Calculated from Assessed Value* | Annual Taxes |
| Tax Year | Tax Year | Valuations_X_TaxYear | *Current Year* |
| Tax Municipality | Tax Municipality | LocalJusidiction | *Not Available* |
| Tax Area Code | *Not Available* | TaxAreaCode | Tax Area Code |
| Assessed Value (Total) | *Not Available* | Valuations_X_AssessedLPV | Assessed Value |
| Assessed Land Value | *Not Available* | *Not Separated* | Assessed Land Value |
| Assessed Improvements | *Not Available* | *Not Separated* | Assessed Improvements |
| Full Cash Value | *Not Available* | Valuations_X_FullCashValue | *Not Available* |
| Limited Property Value | *Not Available* | Valuations_X_LimitedPropertyValue | *Not Available* |
| Assessment Ratio | *Not Available* | Valuations_X_AssessmentRatioPercentage | Assessment Ratio |
| Legal Classification | *Not Available* | Valuations_X_LegalClassification | *Not Available* |
| Property Use Code | *Not Available* | PropertyUseCode | *Not Available* |
| Estimated Value | *Not Available* | *Not Available* | Estimated Value |
| Purchase Price (Current) | *Not Available (Historical)* | Owner_SalePrice | Purchase Price |

## Sales & Pricing

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Original List Price | Original List Price | *Not Available* | *Not Available* |
| Current List Price | List Price | *Not Available* | List Price (if listed) |
| Sold Price | Sold Price | Owner_SalePrice | *Shown in Transactions* |
| Sale Date | Close of Escrow Date | Owner_SaleDate | Purchase Date |
| Price per SqFt | Price/SqFt | *Calculated* | *Calculated* |
| Days on Market | Days on Market | *Not Available* | DOM |
| List Date | List Date | *Not Available* | *Not Available* |
| Under Contract Date | Under Contract Date | *Not Available* | *Not Available* |
| Status | Status | *Not Available* | Listing Status |
| Status Change Date | Status Change Date | *Not Available* | Status Date |

## Ownership

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Owner Name | Ownr/Occ Name - DND2 | Owner_Ownership | Owner Name (Contacts tab) |
| Co-Owners | *Not Available* | Owner_ContoOwnership | *Not Available* |
| Ownership Type | Ownership | *Not Available* | *Not Available* |
| Mailing Address | *Not Available* | Owner_FullMailingAddress | Mailing Address |
| Primary Residence | *Not Available* | *Derived from Legal Classification* | Primary Residence |
| Owner Since | *Not Available (MLS shows listing date)* | Owner_SaleDate | Owned Since |

## Deed Information

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Deed Number | *Not Available* | Owner_MostCurrentDeed | Doc # (Transactions) |
| Deed Date | *Not Available* | Owner_DeedDate | Rec Date (Transactions) |
| Deed Type | *Not Available* | Owner_DeedType | Type (Transactions) |

## Rental Information

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Is Rental | Features: Occupant (Tenant) | IsRental | *Not Direct Field* |
| Rental Registration | *Not Available* | RentalInformation_DateRegistered | *Not Available* |
| Rental Last Update | *Not Available* | RentalInformation_LastUpdate | *Not Available* |

## Community & Schools

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Subdivision | Subdivision | SubdivisionName | Subdivision |
| Elementary School | Elementary School | ElementarySchoolDistrict | *Not Available* |
| Jr. High School | Jr. High School | *Not Available* | *Not Available* |
| High School | High School | HighSchoolDistrict | *Not Available* |
| School District | *Composite of school fields* | HighSchoolDistrict | School Tax District |

## HOA & Fees

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| HOA Name | Association & Fees: HOA Name | *Not Available* | *Not Available* |
| HOA Fee | Association & Fees: HOA Fee | *Not Available* | *Not Available* |
| HOA Frequency | Association & Fees: HOA Paid Frequency | *Not Available* | *Not Available* |
| HOA Phone | Association & Fees: HOA Telephone | *Not Available* | *Not Available* |
| Land Lease Fee | Association & Fees: Land Lease Fee | *Not Available* | *Not Available* |
| Total Monthly Fee | Association & Fees: Ttl Mthly Fee Equiv | *Not Available* | *Not Available* |

## Zoning & Flood

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| Zoning | *Not Available* | *Not Available* | Zoning |
| Flood Zone | Flood Zone | *Not Available* | Flood Zone Code |
| Flood Risk | *Not Available* | *Not Available* | Flood Risk |
| FEMA Map Number | *Not Available* | *Not Available* | FEMA Map Number |
| FEMA Effective Date | *Not Available* | *Not Available* | FEMA Effective Date |

## Listing Information

| Concept | MLS Field | MCAO Field | PropertyRadar Field |
|---------|-----------|------------|---------------------|
| List Number | List Number | *Not Available* | *Not Available* |
| Listing Agent | Listing Agent | *Not Available* | *Not Available* |
| Listing Agency | Agency Name | *Not Available* | *Not Available* |
| Agency Phone | Agency Phone | *Not Available* | *Not Available* |
| Public Remarks | Public Remarks | *Not Available* | *Not Available* |

## Unique to MLS

| Field | Description |
|-------|-------------|
| Selling Agency | Agency that sold the property |
| Selling Agent | Agent who sold the property |
| Co-Listing Agent | Additional listing agent |
| Co-Selling Agent | Additional selling agent |
| Photo URL | Link to property photo |
| Map Code/Grid | MLS internal mapping code |
| Detailed Features | Extensive list of property features and amenities |

## Unique to MCAO

| Field | Description |
|-------|-------------|
| Similar Parcels (Comparables) | Up to 5 comparable properties with details |
| Valuation History | 6 years of tax valuations |
| Property Sketches | Building footprint diagrams (Base64 encoded) |
| Map IDs | Links to various county maps (Parcel, Subdivision, MCR, S/T/R, Book/Map) |
| Area/Neighborhood Code | Assessor's market area classification |
| Number of Parcels in Subdivision | Count of units in development |
| Parcel Status | Active/Inactive status |

## Unique to PropertyRadar

| Field | Description |
|-------|-------------|
| Estimated Value | PropertyRadar's automated valuation |
| Estimated Land Value | Estimated value of land only |
| Estimated Improvement Value | Estimated value of structures |
| Equity | Calculated equity in property |
| Est. LTV | Estimated loan-to-value ratio |
| Census Tract | Census geographic identifier |
| Carrier Route | USPS delivery route |
| Neighborhood Demographics | Population, income, education, housing stats by ZIP |
| Housing Risk Metrics | Equity risk, time to resell, affordability, foreclosure risk, turnover, primary residence % |
| Environment Data | Elevation, temperature, precipitation |
| Comparable Analysis | Automated comparable sales analysis |
| Transaction Timeline | Full transaction and event history |
| Interest Level | User-defined rating system |
| Activities | Tracking of views, changes, and milestones |

---

## Data Format Differences

### Dates
- **MLS**: YYYY-MM-DD format
- **MCAO**: MM/DD/YYYY format
- **PropertyRadar**: Various formats (MM/DD/YYYY, "Mon YYYY")

### Currency
- **MLS**: Decimal format (229000.00)
- **MCAO**: Integer format (215000)
- **PropertyRadar**: Dollar format with commas ($215,000)

### Boolean Values
- **MLS**: Y/N, Yes/No, True/False (inconsistent)
- **MCAO**: True/False, Yes/No
- **PropertyRadar**: Yes/No, Present/Absent

### Property Type
- **MLS**: "Residential" / "Apartment"
- **MCAO**: "Condo"
- **PropertyRadar**: "Condominium"

### Square Footage
- **MLS**: 702.00 (decimal)
- **MCAO**: 702 (integer)
- **PropertyRadar**: 702 (integer)

---

## Notes on Field Availability

- **MLS**: Strongest in listing details, agent information, and property features/amenities
- **MCAO**: Strongest in tax history, legal descriptions, and government records
- **PropertyRadar**: Strongest in analytics, estimates, demographics, and user tracking features

