# Wabbit Platform - Subagent Development Plan

## Overview
This document outlines the specialized subagents needed to build the Wabbit real estate platform. Each agent has specific responsibilities and will work in sequence to create the complete application.

## Subagent Definitions

### 1. Database Setup Agent
**Type**: database-setup-agent
**Model**: Claude Sonnet
**Purpose**: Initialize and configure the complete database infrastructure

**Tasks**:
- Set up Supabase project configuration
- Execute database schema SQL
- Create Row Level Security policies
- Import Excel data to PostgreSQL tables
- Set up database triggers and functions
- Create initial seed data
- Configure backup and recovery procedures

**Dependencies**: None (runs first)

**Deliverables**:
- Configured Supabase project
- Populated database tables
- Security policies implemented
- Migration scripts ready

---

### 2. Authentication Agent
**Type**: auth-implementation-agent
**Model**: Claude Sonnet
**Purpose**: Implement complete authentication and user management system

**Tasks**:
- Configure Supabase Auth with magic links
- Create sign-up form with validation
- Implement sign-in flow
- Build user profile management
- Add privacy/marketing preference handling
- Create protected route middleware
- Implement session management
- Build password reset flow

**Dependencies**: Database Setup Agent

**Deliverables**:
- `/components/auth/SignUpForm.tsx`
- `/components/auth/SignInForm.tsx`
- `/lib/auth/client.ts`
- `/middleware.ts` for protected routes
- User profile pages

---

### 3. Form Builder Agent
**Type**: dynamic-form-agent
**Model**: Claude Opus
**Purpose**: Create the sophisticated multi-page preference form system

**Tasks**:
- Build 7-page dynamic form with conditional logic
- Implement user search and auto-populate feature
- Create all field types (dropdowns, multi-select, sliders, etc.)
- Add form state management with React Hook Form
- Implement progress tracking
- Build form validation and error handling
- Create data persistence between pages
- Connect form to buyer_preferences table

**Dependencies**: Database Setup Agent, Authentication Agent

**Deliverables**:
- `/components/form/MultiPageForm.tsx`
- `/components/form/FormStep.tsx`
- `/components/form/fields/*` (all field components)
- `/lib/form/validation.ts`
- `/lib/form/state.ts`

---

### 4. Property Display Agent
**Type**: property-ui-agent
**Model**: Claude Sonnet
**Purpose**: Build the core property viewing and ranking interfaces

**Tasks**:
- Create Rank Feed with 4-tile layout
- Implement property info display
- Build ranking system with 4 metrics
- Create image carousel component
- Develop List View with filtering/sorting
- Add favorite/star functionality
- Implement property detail modal
- Build property card components

**Dependencies**: Database Setup Agent, Form Builder Agent

**Deliverables**:
- `/components/property/RankFeed.tsx`
- `/components/property/ListView.tsx`
- `/components/property/PropertyCard.tsx`
- `/components/property/ImageCarousel.tsx`
- `/components/property/RankingTile.tsx`

---

### 5. Mapping Agent
**Type**: maps-integration-agent
**Model**: Claude Sonnet
**Purpose**: Integrate Google Maps with advanced features

**Tasks**:
- Set up Google Maps API integration
- Implement js-markerclusterer for multiple markers
- Add property location markers
- Display commute destination markers
- Show schools, entertainment, grocery markers
- Create interactive map controls
- Add distance/time calculations
- Implement map styling for light/dark modes

**Dependencies**: Property Display Agent

**Deliverables**:
- `/components/map/InteractiveMap.tsx`
- `/components/map/MarkerCluster.tsx`
- `/lib/maps/google-maps.ts`
- `/lib/maps/location-services.ts`

---

### 6. Integration Agent
**Type**: external-api-agent
**Model**: Claude Opus
**Purpose**: Connect with external services and APIs

**Tasks**:
- Implement OpenAI API for location intelligence
- Create school data enrichment service
- Build entertainment district analyzer
- Develop grocery store locator
- Add Zillow/Redfin/Homes.com placeholder auth
- Create MLS data import system
- Build image storage management with Supabase Storage
- Implement data sync scheduling

**Dependencies**: Database Setup Agent, Property Display Agent

**Deliverables**:
- `/lib/api/openai-service.ts`
- `/lib/api/location-intelligence.ts`
- `/lib/api/third-party-auth.ts`
- `/lib/storage/image-manager.ts`
- `/scripts/import-mls-data.ts`

---

### 7. UI/UX Agent
**Type**: ui-polish-agent
**Model**: Claude Haiku
**Purpose**: Implement design system and UI polish

**Tasks**:
- Implement wireframe designs exactly
- Create responsive layouts for all screens
- Add dark/light mode toggle with next-themes
- Build settings/preferences page
- Implement font size controls
- Add loading states and skeletons
- Create toast notifications
- Ensure accessibility compliance

**Dependencies**: All display agents

**Deliverables**:
- `/components/ui/*` (all UI components)
- `/styles/globals.css`
- `/lib/theme/provider.tsx`
- `/components/layout/Navigation.tsx`
- `/components/settings/SettingsPage.tsx`

---

### 8. Multi-User Agent
**Type**: collaboration-agent
**Model**: Claude Sonnet
**Purpose**: Implement collaborative features for shared accounts

**Tasks**:
- Build invitation system with unique codes
- Create shared account management
- Implement collaborative ranking views
- Add average score calculations
- Build vote count indicators
- Create activity feed for partners
- Add real-time sync for shared rankings
- Implement notification system

**Dependencies**: Authentication Agent, Property Display Agent

**Deliverables**:
- `/components/collaboration/InviteModal.tsx`
- `/components/collaboration/SharedRankings.tsx`
- `/components/collaboration/ActivityFeed.tsx`
- `/lib/collaboration/shared-accounts.ts`

---

### 9. Testing Agent
**Type**: testing-automation-agent
**Model**: Claude Sonnet
**Purpose**: Create comprehensive test coverage

**Tasks**:
- Write unit tests for all components
- Create integration tests for API routes
- Build E2E tests with Playwright
- Add form validation testing
- Test authentication flows
- Verify database operations
- Test responsive design
- Create performance benchmarks

**Dependencies**: All other agents

**Deliverables**:
- `/__tests__/*` (all test files)
- `/e2e/*` (E2E test scenarios)
- Test configuration files
- CI/CD pipeline configuration

---

### 10. Deployment Agent
**Type**: deployment-config-agent
**Model**: Claude Haiku
**Purpose**: Configure production deployment

**Tasks**:
- Set up Vercel deployment configuration
- Configure environment variables
- Set up Cloudflare CDN
- Implement monitoring with Vercel Analytics
- Configure error tracking with Sentry
- Set up database backups
- Create deployment documentation
- Implement CI/CD workflows

**Dependencies**: All other agents

**Deliverables**:
- `vercel.json`
- `.env.example`
- GitHub Actions workflows
- Deployment documentation
- Monitoring dashboard setup

---

## Execution Timeline

### Phase 1: Foundation (Week 1)
1. Database Setup Agent
2. Authentication Agent

### Phase 2: Core Features (Week 2)
3. Form Builder Agent
4. Property Display Agent

### Phase 3: Advanced Features (Week 3)
5. Mapping Agent
6. Integration Agent

### Phase 4: Polish & Collaboration (Week 4)
7. UI/UX Agent
8. Multi-User Agent

### Phase 5: Quality & Deployment (Week 5)
9. Testing Agent
10. Deployment Agent

---

## Agent Communication Protocol

Each agent should:
1. Read the PRD and this plan document
2. Check work completed by previous agents
3. Create detailed implementation plans
4. Write clean, documented code
5. Test their implementations
6. Document any deviations or improvements
7. Pass context to the next agent

## Success Criteria

- All features from PRD implemented
- Database fully operational with seed data
- Authentication working with magic links
- 7-page form capturing all preferences
- Property display with ranking system
- Interactive maps with all markers
- Multi-user collaboration functional
- All tests passing
- Successfully deployed to production

## Notes for Agent Creators

When creating each subagent:
1. Provide the full PRD document
2. Reference this plan document
3. Include relevant wireframe images
4. Share database schema
5. Specify exact deliverables needed
6. Set clear success criteria
7. Include any API keys or credentials needed

## Risk Mitigation

- Each agent should create rollback procedures
- Implement feature flags for gradual rollout
- Create comprehensive logging
- Build with scalability in mind
- Follow security best practices
- Document all architectural decisions