# drinkjoy.app 🍻✨

A modern, intuitive web application that helps you discover your perfect drink through an interactive matching experience. Answer 5 simple questions and get personalized cocktail, beer, and wine recommendations with detailed recipes and shopping links.

## Features

- **Interactive Drink Wizard**: Answer 5 fun questions about your taste preferences
- **Swipe-Based Discovery**: Navigate through your personalized matches with intuitive gestures
- **Smart Matching Algorithm**: Advanced scoring system based on your flavor, strength, and occasion preferences
- **Personalized Results**: Get curated recommendations with match scores and reasons
- **Detailed Recipes & Shopping**: Complete ingredient lists with direct shopping links
- **Weather Enhancement**: Optional location-based refinements for seasonal recommendations
- **Mobile-First Design**: Optimized gesture controls and responsive interface
- **Dark Mode Support**: Automatic dark mode based on system preferences

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Animations & Gestures**: Framer Motion with drag/swipe controls
- **API**: OpenWeatherMap for optional weather enhancement
- **Icons**: React Icons & Lucide React
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenWeatherMap API key (optional, for weather enhancement features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd drinkjoy-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add environment variables to `.env.local`:
```env
# Optional: Weather enhancement
NEXT_PUBLIC_WEATHER_API_KEY=your_openweather_api_key

# Required for admin system: Random secret for webhook security
SHEETS_WEBHOOK_SECRET=your_random_secret_here

# Google Sheets Integration (NEW - Required for live data)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
```

> **Note**: The app now uses a smart polling system to sync drink data from Google Sheets to a database cache. This provides reliable access to up-to-date drink data even during server restarts or Google Sheets API outages.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Age Verification**: Simple yes/no age gate for responsible drinking
2. **Interactive Wizard**: Answer 5 questions about your preferences:
   - **Flavor Profile**: Sweet, bitter, sour, or smooth
   - **Temperature**: How you like your drinks served  
   - **Adventure Level**: Classic, bold, fruity, or simple
   - **Strength**: From non-alcoholic to strong spirits
   - **Occasion**: Happy hour, celebration, business, or romantic
3. **Smart Matching**: Advanced algorithm scores drinks based on your answers
4. **Swipe Discovery**: Navigate through personalized matches with gesture controls
5. **Detailed Results**: Get recipes, ingredients, and shopping links

## Data Architecture

### NEW: Live Google Sheets Integration

The app now fetches drink data directly from Google Sheets instead of using local JSON files:

- **Primary Source**: Google Sheets API (real-time data)
- **Caching**: In-memory cache with 5-minute TTL for performance
- **Fallback**: Local JSON files (temporary until fully migrated)
- **Webhook Updates**: Instant cache refresh when sheets are edited

### Setting Up Google Sheets Integration

1. Create a Google Cloud Project and enable the Sheets API
2. Create a Service Account and download the credentials JSON
3. Share your Google Sheet with the service account email
4. Add the credentials to your environment variables

### Data Flow

1. **Smart Polling**: Background service polls Google Sheets every 60 seconds
2. **Change Detection**: Only syncs when changes are detected (efficient)
3. **Database Cache**: Data stored in Supabase for persistence across restarts
4. **Fast Access**: API requests served from database cache
5. **Fallback**: Direct Google Sheets fetch if cache is empty
6. **Self-Healing**: Automatic retry logic and error recovery

### Admin Endpoints

- `GET /api/admin/sync-status` - Check sync status and cache statistics
- `POST /api/admin/sync-status` - Trigger manual sync
- `GET /api/admin/monitoring` - Comprehensive system health monitoring
- `POST /api/admin/clear-cache` - Clear database cache

### Testing

Test the polling system:
```bash
npm run test:polling
```

## API Setup (Optional)

### OpenWeatherMap API

Weather data enhances recommendations but isn't required for core functionality.

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key
3. Add it to your `.env.local` file
4. Free tier includes 1,000 calls/day

## Project Structure

```
app/
├── api/                     # API routes
│   ├── weather/            # Weather data endpoints
│   └── drinks/             # Drinks data endpoints
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── wizard/             # Interactive quiz components
│   ├── drinks/             # Drink-related components
│   ├── weather/            # Weather enhancement components
│   └── layout/             # Layout components
├── types/                  # TypeScript type definitions
│   ├── wizard.ts           # Wizard preferences and questions
│   ├── drinks.ts           # Drink data types
│   └── weather.ts          # Weather data types
└── lib/                    # Utility functions
    ├── drinkMatcher.ts     # Smart matching algorithm
    ├── weather.ts          # Weather API integration
    └── utils.ts            # Helper functions
data/
├── drinks/                 # Curated drink database
│   ├── beer.json           # Beer and cider drinks
│   ├── wine.json           # Wine varieties
│   ├── cocktails.json      # Mixed drinks and cocktails
│   ├── spirits.json        # Spirits and hard liquor
│   ├── non-alcoholic.json  # Non-alcoholic beverages
│   └── index.js            # Combined drink exports
└── wizardQuestions.ts      # Interactive quiz questions
```

## Smart Matching Algorithm

The app uses a sophisticated scoring system to match drinks to your preferences:

### Core Scoring (100 points total)

1. **Flavor Profile Matching** (25 points max)
   - Direct matches for sweet, bitter, sour, smooth preferences
   - Bonus for multiple flavor profile alignments

2. **Strength Preference** (20 points max)
   - Perfect matches for non-alcoholic, light, medium, strong
   - Graduated scoring for similar strength levels

3. **Adventure Level** (15 points max)
   - Classic: Traditional, well-known drinks
   - Bold: Experimental, unique flavors
   - Fruity: Fruit-forward profiles
   - Simple: Clean, minimal ingredients

4. **Occasion Matching** (15 points max)
   - Happy hour: Casual, social drinks
   - Celebration: Festive, special occasion
   - Business: Professional, sophisticated
   - Romantic: Elegant, intimate

5. **Temperature Preference** (10 points max)
   - Ice cold, cool, room temperature, warm preferences

### Enhancement Bonuses

6. **Weather Alignment** (15 points bonus)
   - Seasonal appropriateness when location shared
   - Temperature and condition matching

7. **Happy Hour Boost** (10 points bonus)
   - Time-based promotions during 3-6 PM
   - Featured drink highlighting

## Customization

### Admin Management

Drinks are fetched live from Google Sheets via API, with intelligent caching for performance. The system supports both direct API access and webhook-based real-time updates.

### Adding New Drinks Manually

For developers, you can edit the JSON files in `data/drinks/`. Each drink should include:

```json
{
  "id": "unique-id",
  "name": "Drink Name",
  "category": "beer|wine|cocktail|spirit|non-alcoholic",
  "description": "Brief description",
  "ingredients": ["ingredient1", "ingredient2"],
  "abv": 12,
  "flavor_profile": ["sweet", "bitter", "sour"],
  "strength": "light|medium|strong|non-alcoholic",
  "weather_match": {
    "temp_min": 10,
    "temp_max": 25,
    "conditions": ["clear", "clouds"],
    "ideal_temp": 18
  },
  "occasions": ["casual", "celebration"],
  "happy_hour": true,
  "happy_hour_price": "$8",
  "happy_hour_times": "3-6 PM",
  "serving_suggestions": ["Serve chilled"],
  "image_url": "https://example.com/image.jpg",
  "glass_type": "Wine glass",
  "preparation": "Instructions"
}
```

### Theming

Customize colors and styling in:
- `app/globals.css` - Global styles and CSS variables
- Tailwind classes throughout components
- Color schemes in individual components

## Performance

- **Server-Side Rendering**: Fast initial page loads
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component with lazy loading
- **API Caching**: Efficient caching for weather and drink data
- **Debounced Search**: Optimized search input handling

## Accessibility

- WCAG 2.1 compliant design
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios
- Semantic HTML structure

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

Please drink responsibly. This app is for entertainment purposes. Always follow local laws regarding alcohol consumption and never drink and drive.
