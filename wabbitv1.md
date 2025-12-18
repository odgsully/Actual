# Wabbit v1 Development Outline
*Date: 07.02.25*

---

## Table of Contents

- [Part I: Recap](#part-i-recap)
  - [Core Thesis](#core-thesis)
  - [User Permissions](#user-permissions)
  - [Zapier Blog System](#zapier-blog-system)
  - [Revisions Made](#revisions-made)
  - [API Integrations](#api-integrations)
- [Part II: Current Development Tasks](#part-ii-current-development-tasks)
  - [Remove Zapier](#remove-zapier)
  - [Admin Dashboard](#admin-dashboard)
  - [Clean up/Delete Unused](#clean-updelete-unused)
  - [Touch up Blog Rank page](#touch-up-blog-rank-page)
  - [Client-Side New Pages](#client-side-new-pages)
  - [Mobile, Desktop and Tablet View](#mobile-desktop-and-tablet-view)
  - [Navigation: Hamburger View Details](#navigation-hamburger-view-details)
  - [Runway API Setup](#runway-api-setup)
  - [Other Development Items](#other-development-items)
- [Part III: Look Ahead](#part-iii-look-ahead)
  - [Plug-In Unified Architecture](#plug-in-unified-architecture)
  - [Technical Feasibility Study](#technical-feasibility-study)
  - [Development Time Estimates](#development-time-estimates)
  - [Future UI Enhancements](#future-ui-enhancements)
  - [Agent Optimization Level](#agent-optimization-level)

---

## Part I: Recap

### Core Thesis
The thesis is that AI generation is a quantity game. Providing a product that advocates for higher generation output regardless of text, image, video, etc for companies coupled with a cohesive team vision will yield a higher ROI than ad hoc one-off generations.

### User Permissions

#### Supervisor Permissions
- Higher RAVG weight
- Access to adjustable sliders for:
  - Token usage
  - Model selection
  - Tool usage
  - Agent Optimization Level

#### Regular Rank Permissions
- Templated approach to help skyrocket team collaboration
- Provides valuable insights into employees relating to real [content]

### Zapier Blog System

#### Blog Prompt
We are a SaaS product called Wabbit, an AI generated content team-aware ranking and scheduling platform help automate small to medium size business & need recyclable branding direction. Create a concise but substantial blog post that describes the pain points and hope of AI automated content.

#### User Logic
- User #1 and #2 logic for clone2_bloghome unseen non-repeating records to rank (using Unique ID as reference)
- Correcting logic for consistency for:
  - Blog Caption
  - Blog Content
  - Picture Image Description

#### Ranking System
- Keep User 1 'User 1 Rank' and User 2 'User 2 Rank' in Data tab's 'TEST BLOGS'
- Upon last user to submit their Rank, update that singular 'TEST BLOGS' record's RAVG (Rank Average)
  - Updates count of 'user responses'
  - Updates username of Voted Users (List)

#### Submit Button Logic (Based on RAVG)
- **RAVG 8+**: → [B] POST TABLE
- **RAVG 4-7.9**: → [B] MAYBE Table
- **RAVG 0-3.9**: → Delete Record

#### Table Management Reference

##### Maybe Table
- Constantly changing table with middle-of-the-road generations
- Biweekly basis: Bottom ¾'s of records removed (chopping block)
- Keeps revolving door of highest RAVG posts having chance to make it to Post table

##### Post Table
- Not a chopping block
- Way to ascend to a POST
- Two times per week: Top RAVG posts (not already marked "Y" in Posted? column) get posted as blog
- After posting: Marked "Y" in Posted? column

#### RAVG Logic Definitions
- **RAVG**: Rank Average (2 users)
- **r**: responses
- **tb**: text box revisions
- **rv**: reversions
- **dnu**: do not use

#### Conditional Logic Rules
- If 2r, AND 0-3.9 RAVG, 0 tb, THEN Delete Record (still in ALL EVER Table)
- If 2r, AND 0-3.9 RAVG, >1tb, THEN Create New Record AND Delete Current Record
- If 2r, AND 4-7.9 RAVG, 0 tb, THEN Send to [B] MAYBE Table
- If 2r, AND 4-7.9 RAVG, >1tb, THEN Create New Record AND Delete Current Record
- If END of BI-WK, THEN Delete Bottom 75% from [B] MAYBE Table
- If 2r, AND 8-10 RAVG, 0 tb, THEN send to [B] POST Table
- If 2r, AND 8-10 RAVG, >1tb, THEN Create New Record AND Delete Current Record
  - THEN, Send Original to [B] POST Table
  - THEN, Send New to Users Front of STACK
  - Filter: If Original Posted, Send New to [B] MAYBE Table

**Notes:**
- All records regardless of RAVG saved to ALL EVER Table
- Refrain from using the [I] and [J] Tables
- Cutting block: Delete bottom 75% of [B] MAYBE Table records based on RAVG (once every 2 weeks)
- ALL EVER logic added to workflow for tracking purposes

### Revisions Made
- Two pictures like in video:
  - One reference (Parent set of all 4's)
  - One full (1/4 of a Set)
- Currently populating with Parent not as reference but as its own Record
- When all records for User have been voted on: Pop-Up
  - Title: "You're all Caught Up"
  - Subtitle: "There are no more generations for you to vote on at this time"

### API Integrations
- ImagineAPI dynamic pull for Images (currently static in Bubble API Connector)
- OpenAI Batch processing assistance

#### Resources
- LLM Batch: https://platform.openai.com/docs/guides/batch
- ImagineAPI: https://docs.imagineapi.dev/self-host-install/requirements
- Need fully setup Imagine API Self Host Install with new database (Airtable, AWS, or Azure?)

---

## Part II: Current Development Tasks

### Remove Zapier
Without deleting the functioning zap, fully remove Zapier steps to be done with same results in Bubble. Full integration inside Bubble with ChatGPT, ImagineAPI/Midjourney.

### Admin Dashboard

#### Dropdowns
- **All Clients List** (*required field*)
  - Centered at near top of Admin Dashboard
  - Data currently in app should be assigned to client #1: "pbiapo"

#### Buttons (*dependent on All Clients List Dropdown*)
**At Top Corner:**
- Onboard New Client (also in hamburger menu of Admin's)
  - Company Name (*required field*)
  - Description of Company (*required field*)
  - Initial Image prompt (*required field*)
  - Optional: Button Price breakdowns .pdf download

#### Live Client-side Features
- **Rank page View**
  - Stylized Rank table view
  - Pulls directly from Data table for that client with cleaner UI
  - Depending on Admin User profile logged in, favorite certain rows feature
  - Stored in new data type 'Admin clientside-Favorites'

- **Stylized Prompt table view**
  - View table of all prompts given for generations
  - Average duration of prompt till cancel/re-prompted
  - Number of generations for this prompt
  - Average Ranking of all generations with this prompt
  - Date prompt made
  - Date prompt cancel/re-prompted

#### Toggle Team Permissions
- Can view all Users of every team
- Dropdown next to names with permission level
- Documents hyperlinked on page:
  - From Rank to Post.pdf
  - Getting Started.pdf
  - Data Usage Price Table

### Clean up/Delete Unused
Delete all unnecessary based on previous working version with full understanding of goal for 2nd round.

### Touch up Blog Rank page

#### Search Menu Bar
**Client-side & Admin-side:**
- Need unique identifier on every record of Blog Rank pages
- If click on, Selected Record

**Client-side Selected Record:**
- Show Voting history page
- Only search records currently in MAYBE table
- Likeliness update to be deleted (italics) in new Viewport showing:
  - Ranking Voting history of when generated
  - All voted users & when they voted
  - Currently in TEST BLOG, MAYBE or POST Table?
  - Likeliness to be deleted on Date calculation

**Admin-side:**
- Searches all Client records
- Client Name identified alongside Menu Results page (narrow view)
- Shows BEST MATCHES:
  - Image on far right
  - Ranking (if any) in middle
  - Image description on right
  - Client Name above each record (small italicized font)
  - Show top 25
- Ability to Filter for all Gen Builds
  - Ex: pbiapo only has one called Blog (does both image & text generation)
  - If added another, should be way to toggle between the two

### Client-Side New Pages

Blog Rank page is now one of few pages for client view. All other pages in Hamburger Menu.

#### Other Pages:

1. **Suggested Prompt Ranking**
   - Suggestion typed by Administrators
   - Sent to similar Ranking view as Gen Rank for clients (but only for prompts)

2. **Team Rank History**
   - Contains Dropdown: Team Member (*required field*, defaults to Current Client User)
   - Shows every other team member
   - Team member view like Instagram gallery
   - See all voted/unvoted:
     - If voted: Rank # and opacity grey 50%
     - If unvoted: Can click on & opens preview condensed view
     - Can still vote from there
     - Option "Go to Full Vote View" Button to head back to main BLOG RANK page

3. **Supervisor (Super Rank) View Only**
   - 2nd dashboard/permission access to rank specific for supervisor
   - Holds stronger weight ranking
   - Only populates when all Users or percent of Users give Ranking
   - Future: If Supervisor wants to be hidden from view, checkbox to remain visible or hidden from subordinate Team Client Users
   - "Team Updates" area down low (Ex: Tom updated a...)

**Not a page but in Hamburger Menu:**
- Light mode/Dark mode button
- Invite Team member – Jumps to email link to create profile & bypass

### Mobile, Desktop and Tablet View
Amazing views for Mobile, Desktop, and Tablet

### Navigation: Hamburger View Details

#### Admin Side
**Admin View (*new*):**
- Hamburger:
  - Profile
  - Onboard New Client Button
  - Admin Dashboard (Default Home upon bootup)
  - Light/Dark mode

#### Client Side
**Supervisor User View (*new*):**
- Hamburger:
  - Profile
  - Team Dashboard
  - Light/Dark mode

**Regular User View:**
- Hamburger:
  - Rank Home (Default Home upon bootup)
  - Profile
  - Light/Dark mode

### Runway API Setup
- New Zap triggering once a week for highest rated in POST Table
- Once generated, new value in Posted? (Y/N) column marked in Bubble (ensure no repeats)
- Resources:
  - https://docs.dev.runwayml.com/
  - https://docs.dev.runwayml.com/api/#tag/Task-management/paths/~1v1~1tasks~1%7Bid%7D/get

### Other Development Items

#### Working Check-In Meetings
- Couple hours pre-determined dates/times blocked out
- Meet first couple days to get project done quicker than last time
- Documentation for what's being deleted, etc.

#### More Cool Features
Color API Options:
- **Adobe Color**: Available through Adobe Creative Cloud API (requires developer account)
- **Colormind.io**: Offers simple API returning JSON data with color palettes
- **ImageColorPicker.com**: Has basic API available for commercial use

Alternatives with robust APIs for color extraction [to be determined]

#### Swift Notes
- 20px padding on screen sides
- Large enough to be visible
- UI in Figma Boards
- 50-150 Wireframes

---

## Part III: Look Ahead

### Plug-In Unified Architecture
**Purpose:** To MAXIMIZE DEVELOPMENT OVERLAP for creating plug-ins for:
- Slack (Slack App Directory)
- Teams (App Store)
- Google Workspace (Marketplace)
- Zoom (App Marketplace)
- Plus Documentation

### Technical Feasibility Study

#### Platform Compatibility
- Identify APIs for Microsoft Teams and Slack
- Review functionalities supported by APIs:
  - Messaging
  - File sharing
  - User management
- Ensure plug-in design aligns with these functionalities

#### Development Tools and Resources
- Microsoft Bot Framework and Microsoft Graph API for Teams
- Slack API and SDKs for Slack integrations
- Comprehensive documentation and support from both platforms

#### Data Security and Privacy
- Implement OAuth for secure authentication
- Ensure data encryption during transmission
- Adhere to security protocols of Teams and Slack to maintain user trust

### Development Time Estimates

- **Zoom**:
  - Basic plugin: 20-40 hours
  - Complex integrations: 80-120 hours

- **Slack**:
  - Basic integrations: 20-40 hours
  - Complex: 80-150 hours

- **Microsoft Teams**:
  - Simple plugin: 30-50 hours
  - Complex: 100-200 hours

- **Google Workspace**:
  - Straightforward: 30-60 hours
  - Advanced features: 100-150 hours

### Future UI Enhancements

#### Rank UI
Second User Rank view like Instagram gallery:
- See all voted/unvoted
- If voted: Show (#) and opacity grey 50%
- If unvoted: Can click on

### Agent Optimization Level
Configurable automation levels:

- **No**: Will disable any Agent background decisions
- **Low**: Will always ask for Agent decisions to Supervisor prior to implement
- **Medium (recommended)**: Will make obvious decisions without asking
- **High**: Will not prompt Supervisor with changes geared for optimizing and staying up to date with rapidly evolving new tools outperforming previously established ones