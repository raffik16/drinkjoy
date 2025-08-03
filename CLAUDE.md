# Drinkjoy Project Context

## Project Overview
Drinkjoy is a beverage recommendation application that helps users find drinks based on their preferences and dietary restrictions. The application is fully powered by live Google Sheets data with real-time synchronization.

## Complete Feature List

### Core Drink Discovery Features
- **Interactive Drink Wizard**: 5-question personality quiz with animated interface
  - Category selection (Cocktails, Beer/Cider, Wine, Spirits, Non-Alcoholic, Surprise Me, Featured)
  - Flavor preferences (Crisp, Smoky, Sweet Tooth, Bitter is Better, Sour Power, Smooth Operator)
  - Strength preferences (Balanced, Easy Going, Bring the Power)
  - Occasion matching (Happy Hour, Celebrating, Business Meeting, Romantic Dinner, Game Day, Exploring The Bar, Newly 21, Birthday)
  - Allergy filtering (Gluten, Dairy, Nuts, Eggs, Soy)
- **Smart Matching Algorithm**: Sophisticated scoring system (100 points total)
  - Flavor profile matching (25 points)
  - Strength preference (20 points)
  - Adventure level (15 points)
  - Occasion matching (15 points)
  - Temperature preference (10 points)
  - Weather alignment bonus (15 points)
  - Happy Hour boost (10 points bonus during 3-6 PM)
  - Popularity bonus (up to 10 points based on likes)

### User Experience Features
- **Swipe-Based Navigation**: Intuitive gesture controls for browsing drink matches
- **Match Reveal Animation**: Engaging visual reveal of personalized recommendations
- **Loading Animations**: Color splash and "overwhelmed" animations during processing
- **Dark Mode Support**: Automatic and manual dark theme with persistent preferences
- **PWA Support**: Progressive Web App capabilities with install prompt
- **Mobile-First Design**: Optimized for touch interactions and responsive layouts
- **Age Gate**: Responsible drinking verification system

### Personalization Features
- **Weather-Based Recommendations**: Optional location-based drink refinements
  - Temperature-based suggestions
  - Weather condition matching
  - Seasonal drink recommendations
  - 30-minute weather data caching
- **Allergy Detection System**: Comprehensive allergen filtering
  - Smart ingredient scanning for gluten, dairy, nuts, eggs, soy
  - Safety warnings and filtering
- **Session Management**: Anonymous UUID-based tracking for preferences
- **Inactivity Detection**: Smart session management with timeout handling

### Social & Engagement Features
- **Like System**: Heart button for favorite drinks
  - Real-time like counts
  - Optimistic UI updates
  - Popularity tracking
- **Order Tracking**: "Order Now" functionality
  - Order count tracking
  - User order history
- **Email Capture & Sharing**: Save and email drink matches
  - Beautiful HTML email templates
  - Personalized recommendations
- **Social Proof**: Popularity indicators (Well-liked, Popular choice, Crowd favorite)

### Data & Analytics Features
- **Analytics Dashboard** (`/analytics`):
  - Total likes, active users, popular drinks ranking
  - Total orders and order users analytics
  - Real-time statistics via Supabase
- **Popular Drinks Widget**: Top 10 drinks visualization

### Happy Hour Features
- **Time-Based Promotions**: 3-6 PM automatic activation
- **Happy Hour Indicators**: Visual badges and pricing
- **Dynamic Scoring**: 25-point bonus during happy hour
- **Featured Drinks**: Special happy hour drink highlighting

### Drink Information Features
- **Detailed Drink Cards**: ABV, ingredients, serving suggestions, glass types, preparation
- **Recipe Modal**: Detailed cocktail recipes
- **Advanced Filtering**: Category, flavor, strength, occasion, and search

### API & Backend Features
- **RESTful API Endpoints**:
  - `/api/drinks` - Live drink data from Google Sheets
  - `/api/beers`, `/api/wines` - Category-specific endpoints
  - `/api/likes`, `/api/orders` - Interaction management
  - `/api/weather` - Weather integration
  - `/api/email/save-matches` - Email capture
  - `/api/analytics/*` - Analytics endpoints
  - `/api/ai/chat` - AI chatbot with live drink data
  - `/api/admin/sheets-sync` - Google Sheets webhook endpoint

### Data Management & Real-time Sync
- **Google Sheets Integration**: Live data source for all drink information
  - Real-time webhook updates via `/api/admin/sheets-sync`
  - In-memory caching with TTL (Time To Live) for performance
  - Automatic cache invalidation on data updates
- **Supabase Database**: User interactions and analytics
  - Like management, order tracking, email signups
  - Popular drinks view, real-time subscriptions

### External Integrations
- **Google Sheets API**: Primary data source with API key authentication
- **OpenWeatherMap API**: Weather-based recommendations
- **Resend Email Service**: Transactional emails
- **Google Generative AI (Gemini)**: AI chatbot with live drink recommendations

### Development & Admin Features
- **Form Builder Demo** (`/form-builder-demo`): Interactive form creation tools
- **AI Chatbot**: Conversational drink recommendations using live Google Sheets data
- Comprehensive TypeScript type system
- Utility libraries for matching algorithms, weather, sessions, allergen detection

### Performance Features
- Server-Side Rendering, code splitting, image optimization
- In-memory caching with automatic invalidation, debounced search
- Weather caching (30-min), Google Sheets data caching (5-min TTL)

### Accessibility Features
- WCAG 2.1 compliance, keyboard navigation
- Screen reader support, high contrast, semantic HTML
- Responsive design optimized for mobile and desktop

## Project Architecture

### Data Flow
1. **Google Sheets** → Primary data source (48+ drinks)
2. **Webhook** → Real-time updates via `/api/admin/sheets-sync`
3. **In-Memory Cache** → Performance optimization with TTL
4. **API Endpoints** → Serve cached data to frontend
5. **AI Chatbot** → Uses live data for intelligent recommendations

### Key Components
- `/lib/drinkDataService.server.ts` - Server-side Google Sheets integration
- `/lib/googleSheetsService.ts` - Google Sheets API client
- `/lib/cache.ts` - In-memory caching system
- `/app/api/admin/sheets-sync/route.ts` - Webhook handler
- `/app/api/ai/chat/route.ts` - AI chatbot with live data

## Development Guidelines
- Use TypeScript for type safety
- Follow existing code patterns and conventions
- Test changes thoroughly before committing
- All drink data comes from Google Sheets - no local JSON files
- Use server-side data service for Google Sheets integration
- Client-side components should use API endpoints for data

## Environment Configuration
Required environment variables:
```
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOGOLE_SHEETS_API_KEY=your_api_key
GOOGLE_AI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

## Testing & Build
- **Build**: `npm run build` - Compiles TypeScript and generates optimized build
- **Development**: `npm run dev` - Starts development server with hot reload
- **Linting**: `npm run lint` - TypeScript type checking and code quality

## Google Sheets Structure
Your spreadsheet should have these sheets with proper column mapping:
- **Beer** - Beer and cider recommendations
- **Wine** - Wine selections  
- **Cocktail** - Cocktail recipes and recommendations
- **Spirit** - Spirits and liquors
- **Non_Alcoholic** - Non-alcoholic beverages

Column structure: ID, Name, Category, Description, Ingredients, Prices, ABV, Flavor Profile, etc.

## Recent Migrations Completed
- ✅ Migrated from local JSON files to live Google Sheets
- ✅ Implemented real-time webhook synchronization  
- ✅ Connected AI chatbot to live data
- ✅ Cleaned up unused files and debug endpoints
- ✅ Fixed all TypeScript compilation issues
- ✅ Responsive email modal implementation