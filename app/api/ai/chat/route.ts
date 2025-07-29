import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import drinksData from '@/data/drinks';
const drinks = (drinksData?.drinks || drinksData || []);

// Debug logging for drinks data loading
if (process.env.NODE_ENV === 'development') {
  console.log('AI Chat: Loaded drinks count:', drinks.length);
  const drinksWithImages = drinks.filter((d: any) => d.image_url);
  const drinksWithoutImages = drinks.filter((d: any) => !d.image_url);
  console.log('AI Chat: Drinks with images:', drinksWithImages.length);
  console.log('AI Chat: Drinks without images:', drinksWithoutImages.length);
  if (drinksWithoutImages.length > 0) {
    console.log('AI Chat: Sample drinks without images:', drinksWithoutImages.slice(0, 5).map((d: any) => d.name));
  }
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Smart drink matching with quality scoring
function getSmartDrinkMatches(preferences: {
  category?: string;
  flavor?: string;
  strength?: string;
  occasion?: string;
  allergies?: string[];
}) {
  if (!Array.isArray(drinks)) return { perfectMatches: [], goodMatches: [], otherMatches: [] };
  
  const scoredDrinks = drinks.map(drink => {
    let score = 0;
    const matchReasons = [];

    // Category match (very high priority)
    if (preferences.category && preferences.category !== 'any' && preferences.category !== 'featured') {
      if (drink.category === preferences.category) {
        score += 50; // Much higher bonus for correct category
        matchReasons.push('perfect-category');
      } else {
        // Heavy penalties for wrong category to strongly discourage cross-category suggestions
        if (preferences.category === 'non-alcoholic' && drink.category !== 'non-alcoholic') {
          score -= 50; // Major penalty for alcoholic when non-alcoholic requested
        } else if (preferences.category !== 'non-alcoholic' && drink.category === 'non-alcoholic') {
          score -= 40; // Penalty for non-alcoholic when alcoholic requested
        } else {
          score -= 30; // Heavy penalty for wrong alcoholic category
        }
      }
    } else {
      score += 10; // Some points for any category when no preference
    }

    // Flavor match (high priority)
    if (preferences.flavor && preferences.flavor !== 'any') {
      const flavorMap = {
        'sweet': ['sweet', 'fruity'],
        'sour': ['sour', 'tart', 'citrus', 'funky', 'acidic'],
        'bitter': ['bitter'],
        'smoky': ['smoky'],
        'crisp': ['crisp', 'fresh', 'clean', 'refreshing'],
        'smooth': ['smooth', 'mellow']
      };
      const targetFlavors = flavorMap[preferences.flavor as keyof typeof flavorMap] || [preferences.flavor];
      if (drink.flavor_profile?.some(flavor => targetFlavors.includes(flavor))) {
        score += 30; // Increased flavor match bonus
        matchReasons.push('perfect-flavor');
      } else {
        // Small penalty for flavor mismatch within correct category
        if (preferences.category && drink.category === preferences.category) {
          score -= 5; // Minor penalty to encourage better flavor matches
        }
      }
    }

    // Strength match (medium priority)
    if (preferences.strength) {
      if (drink.strength === preferences.strength) {
        score += 20;
        matchReasons.push('strength');
      }
    }

    // Occasion match (medium priority)
    if (preferences.occasion && preferences.occasion !== 'any') {
      const occasionMap = {
        'casual': 'casual',
        'celebration': 'celebration', 
        'business': 'business',
        'romantic': 'romantic',
        'sports': 'sports',
        'exploring': 'casual',
        'newly21': 'casual',
        'birthday': 'celebration'
      };
      const mappedOccasion = occasionMap[preferences.occasion as keyof typeof occasionMap];
      if (mappedOccasion && drink.occasions?.includes(mappedOccasion)) {
        score += 15;
        matchReasons.push('occasion');
      }
    }

    // Allergy compatibility (critical - subtract points if not compatible)
    let allergyCompatible = true;
    if (preferences.allergies && preferences.allergies.length > 0) {
      // Check gluten allergies
      if (preferences.allergies.includes('gluten')) {
        const glutenIngredients = ['beer', 'wheat', 'barley', 'rye', 'malt'];
        const glutenCategories = ['beer'];
        const isGlutenDrink = drink.category === 'beer' || 
                             glutenCategories.includes(drink.category) ||
                             drink.ingredients?.some(ing => 
                               glutenIngredients.some(gluten => ing.toLowerCase().includes(gluten))
                             );
        
        if (isGlutenDrink) {
          score -= 50;
          allergyCompatible = false;
        } else {
          score += 5;
          matchReasons.push('gluten-free');
        }
      }
      
      // Check dairy allergies
      if (preferences.allergies.includes('dairy')) {
        const dairyIngredients = ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'whey', 'casein', 'lactose'];
        const dairyDrinks = ['white russian', 'mudslide', 'brandy alexander', 'grasshopper'];
        if (drink.ingredients?.some(ing => 
          dairyIngredients.some(dairy => ing.toLowerCase().includes(dairy))
        ) || dairyDrinks.some(dairyDrink => drink.name.toLowerCase().includes(dairyDrink))) {
          score -= 50;
          allergyCompatible = false;
        } else {
          score += 5;
          matchReasons.push('dairy-free');
        }
      }
      
      // Check spirit/ingredient restrictions
      if (preferences.allergies.includes('whiskey') || preferences.allergies.includes('bourbon')) {
        const whiskeyIngredients = ['whiskey', 'bourbon', 'rye whiskey', 'scotch'];
        if (drink.ingredients?.some(ing => 
          whiskeyIngredients.some(whiskey => ing.toLowerCase().includes(whiskey))
        ) || whiskeyIngredients.some(whiskey => drink.name.toLowerCase().includes(whiskey))) {
          score -= 50;
          allergyCompatible = false;
        } else {
          score += 5;
          matchReasons.push('whiskey-free');
        }
      }
      
      // Check gin restrictions
      if (preferences.allergies.includes('gin')) {
        if (drink.ingredients?.some(ing => ing.toLowerCase().includes('gin')) || 
            drink.name.toLowerCase().includes('gin')) {
          score -= 50;
          allergyCompatible = false;
        } else {
          score += 5;
          matchReasons.push('gin-free');
        }
      }
      
      // Check vodka restrictions
      if (preferences.allergies.includes('vodka')) {
        if (drink.ingredients?.some(ing => ing.toLowerCase().includes('vodka')) || 
            drink.name.toLowerCase().includes('vodka')) {
          score -= 50;
          allergyCompatible = false;
        } else {
          score += 5;
          matchReasons.push('vodka-free');
        }
      }

      // Add bonus for being allergy-friendly
      if (allergyCompatible && preferences.allergies.length > 0) {
        score += 5;
      }
    }

    // Cap score at 100 to prevent percentages over 100%
    const cappedScore = Math.min(100, score);
    
    return { drink, score: cappedScore, matchReasons, allergyCompatible };
  });

  // Sort by score
  const sortedDrinks = scoredDrinks.sort((a, b) => b.score - a.score);

  // Categorize matches with adjusted thresholds for better category enforcement
  const perfectMatches = sortedDrinks.filter(item => item.score >= 70 && item.allergyCompatible);
  const goodMatches = sortedDrinks.filter(item => item.score >= 40 && item.score < 70 && item.allergyCompatible);
  const otherMatches = sortedDrinks.filter(item => item.score >= 20 && item.score < 40 && item.allergyCompatible);
  
  // For specific category requests (like beer), prioritize in-category matches even with lower scores
  if (preferences.category && preferences.category !== 'any' && preferences.category !== 'featured') {
    const categoryMatches = sortedDrinks.filter(item => 
      item.drink.category === preferences.category && item.allergyCompatible && item.score > 0
    );
    
    // If we have good category matches, use those instead of cross-category
    if (categoryMatches.length >= 3) {
      const topCategoryMatches = categoryMatches.slice(0, 8);
      return {
        perfectMatches: topCategoryMatches.filter(item => item.score >= 70).slice(0, 3),
        goodMatches: topCategoryMatches.filter(item => item.score >= 40 && item.score < 70).slice(0, 5),
        otherMatches: topCategoryMatches.filter(item => item.score >= 20 && item.score < 40).slice(0, 3)
      };
    }
  }

  return {
    perfectMatches: perfectMatches.slice(0, 5),
    goodMatches: goodMatches.slice(0, 5),
    otherMatches: otherMatches.slice(0, 5)
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, conversationHistory = [] } = await request.json();
    
    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'AI service is not configured properly' },
        { status: 500 }
      );
    }

    // Temporary: Check if AI service is disabled due to billing issues
    if (process.env.DISABLE_AI_CHAT === 'true') {
      return NextResponse.json(
        { error: 'AI chat is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }


    const sampleDrinks = Array.isArray(drinks) ? drinks.slice(0, 5).map(drink => ({
      name: drink.name,
      category: drink.category,
      description: drink.description,
      flavor_profile: drink.flavor_profile,
      strength: drink.strength,
      occasions: drink.occasions,
      abv: drink.abv,
      glass_type: drink.glass_type
    })) : [];

    // Conversational wizard system prompt for beverage recommendations
    const systemPrompt = `You are an expert beverage consultant for Drinkjoy who guides users through discovering their perfect drink preferences in a conversational way. Your role is to systematically gather preference information like the Drinkjoy wizard, but in natural conversation with interactive buttons.

    CORE MISSION:
    You should ask strategic questions to gather the key preference data needed for great drink recommendations. Guide users through the same preference discovery flow as the Drinkjoy wizard, but make it conversational and engaging.

    REQUIRED PREFERENCE GATHERING FLOW:
    1. **Category First**: "What are we drinking today?" - Always start here unless already known
       Options: Cocktails 🍸, Beer/Cider 🍺, Wine 🍷, Spirits 🥃, Non-Alcoholic 🌿, Surprise Me! 🎲, Featured Drinks ⭐
       Map to: cocktail, beer, wine, spirit, non-alcoholic, any, featured

    2. **Flavor Profile**: "What's your vibe?" - Ask about taste preferences
       Options: Crisp ❄️, Smoky 🔥, Sweet Tooth 🍬, Bitter is Better 🌿, Sour Power 🍋, Smooth Operator ✨
       Map to: crisp, smoky, sweet, bitter, sour, smooth

    3. **Strength Level**: "What's your style?" - Determine alcohol preference
       Options: Balanced ⚖️, Easy Going 🌸, Bring the Power 💪
       Map to: medium, light, strong

    4. **Occasion Context**: "What's the occasion?" - Understand the setting
       Options: Happy Hour 🎉, Celebrating 🥂, Business Meeting 💼, Romantic Dinner 🌹, Game Day 🏈, Exploring The Bar 🍸, Newly 21! 🎂, Birthday 🎈
       Map to: casual, celebration, business, romantic, sports, casual, casual, celebration

    5. **Allergy Safety**: "Any allergies we should know about?" - Ensure safety
       Options: No Allergies ✅, Gluten 🌾, Dairy 🥛, Nuts 🥜, Eggs 🥚, Soy 🫘
       Map to: ["none"], ["gluten"], ["dairy"], ["nuts"], ["eggs"], ["soy"]

    CONVERSATION STATE TRACKING:
    Track which preferences have been gathered:
    - missing_prefs: ["category", "flavor", "strength", "occasion", "allergies"] (start with all missing)
    - gathered_prefs: {} (fill as you collect each preference)

    RESPONSE BEHAVIOR BY STATE:
    - **First Message/Greeting**: Welcome and ask about drink category with buttons
    - **Missing Preferences**: Ask next logical question with buttons for quick selection
    - **Preference Conflicts**: Clarify conflicting information naturally
    - **All Gathered**: Set ready=true and let the system provide actual drink matches from database

    CRITICAL: When all preferences are gathered, you MUST set "ready": true in your JSON response. Do NOT describe drinks yourself - the system will automatically provide real drink matches with images from the database.

    When ready=true, your message should be brief like: "Perfect! Based on your preferences for smoky, strong cocktails for celebrating (dairy-free), here are your personalized matches!" Then the system displays actual drinks.

    AVAILABLE DRINK DATABASE SAMPLE:
    ${sampleDrinks.map(drink => 
      `• ${drink.name} (${drink.category}): ${drink.description} - Flavors: ${drink.flavor_profile?.join(', ')} | Strength: ${drink.strength} | Glass: ${drink.glass_type} | ABV: ${drink.abv}%`
    ).join('\n')}

    BUTTON GENERATION RULES:
    Always include interactive buttons for:
    - Wizard option selections (use exact emoji + label from wizard)
    - Quick responses ("Yes", "No", "Tell me more")
    - Navigation ("Start over", "Skip this question")

    RESPONSE FORMAT:
    Always respond with JSON containing preferences, buttons, and message:

    {
      "preferences": {
        "category": "cocktail" | null,
        "flavor": "sweet" | null,
        "strength": "medium" | null, 
        "occasion": "casual" | null,
        "allergies": ["none"] | []
      },
      "missing_prefs": ["strength", "occasion"],
      "confidence": 60,
      "ready": false,
      "buttons": [
        {"text": "Balanced ⚖️", "value": "medium", "type": "strength"},
        {"text": "Easy Going 🌸", "value": "light", "type": "strength"},
        {"text": "Bring the Power 💪", "value": "strong", "type": "strength"}
      ],
      "message": "Great choice on cocktails! Now, what's your style when it comes to strength?"
    }

    CONVERSATION EXAMPLES:

    **First interaction:**
    "Welcome to Drinkjoy! I'm here to help you find the perfect drink. Let's start with the basics - what are we drinking today?"
    [Buttons: Cocktails 🍸, Beer/Cider 🍺, Wine 🍷, etc.]

    **Gathering flavor preferences:**
    "Excellent choice on [category]! Now let's talk flavor - what's your vibe today?"
    [Buttons: Crisp ❄️, Smoky 🔥, Sweet Tooth 🍬, etc.]

    **Ready for recommendations:**
    "Perfect! I've got everything I need. Based on your preferences for [summary], here are some fantastic options..."

    TONE & STYLE:
    - Conversational and friendly, like talking to a knowledgeable bartender
    - Enthusiastic about their choices
    - Ask questions naturally, not like a form
    - Use "Let's", "How about", "What do you think" phrasing
    - Acknowledge their previous answers
    - Build excitement for the final recommendations

    SAFETY PRIORITIES:
    - Always ask about allergies before final recommendations
    - Never recommend drinks that conflict with stated allergies
    - Provide alternatives when allergies limit options

    EFFICIENCY GOALS:
    - Guide through all 5 preference categories
    - Keep questions focused and clear
    - Don't ask unnecessary follow-up questions
    - Move to recommendations once preferences are complete

    Current conversation:`;


    // Build conversation context for Gemini
    let conversationText = systemPrompt + "\n\n";
    conversationHistory.forEach((msg: { role: string; content: string }) => {
      conversationText += `${msg.role}: ${msg.content}\n`;
    });
    conversationText += `user: ${message}\nassistant: `;

    // Call Gemini API
    console.log('Making API call to Gemini with prompt length:', conversationText.length);
    const result = await model.generateContent(conversationText);
    const response = await result.response;
    const responseText = response.text();

    // Try to extract JSON response with conversation state
    let preferences: {
      category?: string;
      flavor?: string;
      strength?: string;
      occasion?: string;
      allergies?: string[];
    } | null = null;
    let confidence = 0;
    let ready = false;
    let extractedMessage = responseText;
    let drinksForMessage = null;
    let buttons: Array<{text: string; value: string; type: string}> = [];
    let missingPrefs: string[] = [];

    // Look for JSON response with preferences, buttons, and message
    const jsonMatch = responseText.match(/\{[\s\S]*("ready"|"preferences"|"message"|"buttons")[\s\S]*\}/);
    if (jsonMatch) {
      try {
        console.log('Found JSON match:', jsonMatch[0]);
        const parsedJson = JSON.parse(jsonMatch[0]);
        console.log('Parsed JSON:', parsedJson);
        preferences = parsedJson.preferences;
        confidence = parsedJson.confidence || 0;
        ready = parsedJson.ready || false;
        buttons = parsedJson.buttons || [];
        missingPrefs = parsedJson.missing_prefs || [];
        extractedMessage = parsedJson.message || responseText.replace(jsonMatch[0], '').trim();

        // If preferences are ready, enhance with specific drink recommendations
        if (ready && preferences) {
          console.log('Getting smart drink matches for preferences:', preferences);
          const { perfectMatches, goodMatches, otherMatches } = getSmartDrinkMatches(preferences);
          console.log(`Smart matches - Perfect: ${perfectMatches.length}, Good: ${goodMatches.length}, Other: ${otherMatches.length}`);
          console.log('Perfect matches:', perfectMatches.map(m => `${m.drink.name} (score: ${m.score})`));
          console.log('Good matches:', goodMatches.map(m => `${m.drink.name} (score: ${m.score})`));

          // Smart fallback logic when no good matches exist
          const allMatches = [];
          
          if (perfectMatches.length > 0) {
            allMatches.push(...perfectMatches.map(item => ({ 
              ...item.drink, 
              matchQuality: 'perfect',
              matchReasons: item.matchReasons,
              score: item.score
            })));
          }
          
          if (goodMatches.length > 0 && allMatches.length < 12) {
            const needed = 12 - allMatches.length;
            allMatches.push(...goodMatches.slice(0, needed).map(item => ({ 
              ...item.drink, 
              matchQuality: 'good',
              matchReasons: item.matchReasons,
              score: item.score
            })));
          }
          
          if (otherMatches.length > 0 && allMatches.length < 12) {
            const needed = 12 - allMatches.length;
            allMatches.push(...otherMatches.slice(0, needed).map(item => ({ 
              ...item.drink, 
              matchQuality: 'other',
              matchReasons: item.matchReasons,
              score: item.score
            })));
          }

          // If we have very few matches and the request was problematic, provide better contextual alternatives
          if (allMatches.length < 3) {
            console.log('Low match count, providing contextual alternatives');
            
            // For gluten-free beer requests, suggest gluten-free alternatives
            if (preferences.category === 'beer' && preferences.allergies?.includes('gluten')) {
              const glutenFreeAlternatives = drinks.filter(drink => 
                (drink.category === 'non-alcoholic' || drink.category === 'cocktail') &&
                !drink.ingredients?.some(ing => 
                  ['beer', 'wheat', 'barley', 'rye', 'malt'].some(gluten => ing.toLowerCase().includes(gluten))
                )
              ).slice(0, 4);
              
              console.log(`Found ${glutenFreeAlternatives.length} gluten-free alternatives for beer request`);
              
              glutenFreeAlternatives.forEach(drink => {
                if (allMatches.length < 12) {
                  allMatches.push({
                    ...drink,
                    matchQuality: 'alternative',
                    matchReasons: ['gluten-free-alternative'],
                    score: 25
                  });
                }
              });
            }
            
            // For category-specific requests with low matches, suggest similar alternatives
            else if (allMatches.length < 3 && preferences && preferences.category) {
              let categoryAlternatives: typeof drinks = [];
              const prefs = preferences; // Type assertion for non-null
              
              if (prefs.category === 'beer') {
                categoryAlternatives = drinks.filter(drink => 
                  (drink.category === 'cocktail' || drink.category === 'wine') &&
                  drink.strength === prefs.strength &&
                  (!prefs.allergies || prefs.allergies.length === 0 || prefs.allergies.includes('none'))
                ).slice(0, 3);
              } else if (prefs.category === 'cocktail') {
                categoryAlternatives = drinks.filter(drink => 
                  (drink.category === 'wine' || drink.category === 'spirit') &&
                  drink.flavor_profile?.some(flavor => 
                    prefs.flavor === 'any' || (prefs.flavor && flavor.includes(prefs.flavor))
                  )
                ).slice(0, 3);
              } else if (prefs.category === 'wine') {
                categoryAlternatives = drinks.filter(drink => 
                  (drink.category === 'cocktail' || drink.category === 'spirit') &&
                  drink.strength === prefs.strength
                ).slice(0, 3);
              } else if (prefs.category === 'spirit') {
                categoryAlternatives = drinks.filter(drink => 
                  drink.category === 'cocktail' &&
                  drink.flavor_profile?.some(flavor => 
                    prefs.flavor === 'any' || (prefs.flavor && flavor.includes(prefs.flavor))
                  )
                ).slice(0, 3);
              } else if (prefs.category === 'non-alcoholic') {
                categoryAlternatives = drinks.filter(drink => 
                  drink.category === 'cocktail' &&
                  drink.strength === 'light'
                ).slice(0, 3);
              }
              
              console.log(`Found ${categoryAlternatives.length} alternatives for ${prefs.category} request`);
              
              categoryAlternatives.forEach(drink => {
                if (allMatches.length < 12) {
                  allMatches.push({
                    ...drink,
                    matchQuality: 'alternative',
                    matchReasons: ['similar-style-alternative'],
                    score: 20
                  });
                }
              });
            }
          }

          if (allMatches.length > 0) {
            // Set drinks data for grid display with match quality and images
            drinksForMessage = allMatches.map(drink => ({
              name: drink.name,
              category: drink.category,
              abv: drink.abv,
              flavor_profile: drink.flavor_profile,
              description: drink.description,
              image_url: drink.image_url || '', // Ensure we always have a string
              matchQuality: drink.matchQuality,
              matchReasons: drink.matchReasons,
              score: drink.score
            }));

            // Debug logging for drinks without images in development
            if (process.env.NODE_ENV === 'development') {
              const drinksWithoutImages = drinksForMessage.filter(d => !d.image_url);
              if (drinksWithoutImages.length > 0) {
                console.log('AI Chat: Drinks without images:', drinksWithoutImages.map(d => d.name));
              }
            }

            // Simplify the message when showing drinks grid
            extractedMessage = extractedMessage.replace(/\n\n🍹[\s\S]*$/, '');
            
            const perfectCount = perfectMatches.length;
            const goodCount = goodMatches.length;
            const alternativeCount = allMatches.filter(m => m.matchQuality === 'alternative').length;
            
            if (perfectCount > 0) {
              extractedMessage += `\n\n🎯 **${perfectCount} Perfect Match${perfectCount > 1 ? 'es' : ''}:**`;
              if (goodCount > 0) {
                // Special case for exactly 3 good matches
                if (goodCount === 3) {
                  extractedMessage += `\n✨ **3 Great Options for You:**`;
                } else {
                  extractedMessage += `\n✨ **Plus ${goodCount} Good Alternative${goodCount > 1 ? 's' : ''}:**`;
                }
              }
            } else if (goodCount > 0) {
              // Special case for exactly 3 good matches when no perfect matches
              if (goodCount === 3) {
                extractedMessage += `\n\n✨ **3 Great Options for You:**`;
              } else {
                extractedMessage += `\n\n✨ **${goodCount} Great Option${goodCount > 1 ? 's' : ''} for You:**`;
              }
            }
            
            // Add alternative options with proper title
            if (alternativeCount > 0) {
              // Special messaging for alternative recommendations by category
              if (preferences.category === 'beer' && preferences.allergies?.includes('gluten')) {
                extractedMessage += `\n\n💡 **Also worth trying (gluten-free alternatives):**`;
              } else if (preferences.category === 'beer') {
                extractedMessage += `\n\n💡 **If you're open to other options:**`;
              } else if (preferences.category === 'cocktail') {
                extractedMessage += `\n\n💡 **Similar spirits & wines you might enjoy:**`;
              } else if (preferences.category === 'wine') {
                extractedMessage += `\n\n💡 **Alternative cocktails & spirits:**`;
              } else if (preferences.category === 'spirit') {
                extractedMessage += `\n\n💡 **Mixed drink alternatives:**`;
              } else if (preferences.category === 'non-alcoholic') {
                extractedMessage += `\n\n💡 **Light alcoholic alternatives:**`;
              } else {
                extractedMessage += `\n\n💡 **Also worth trying:**`;
              }
            } else if (perfectCount === 0 && goodCount === 0) {
              extractedMessage += "\n\n🍹 **Here are some recommendations:**";
            }
          }
        }
      } catch (e) {
        console.error('Error parsing JSON from AI response:', e);
      }
    }

    // Save conversation to database
    const conversationData = {
      user_id: null, // No authentication, all users are anonymous
      session_id: sessionId,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: extractedMessage, timestamp: new Date().toISOString() }
      ],
      extracted_preferences: preferences,
      confidence_score: confidence,
      is_ready: ready,
      missing_preferences: missingPrefs,
      current_buttons: buttons,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Upsert conversation (update if exists, insert if new)
    await supabase
      .from('ai_conversations')
      .upsert(conversationData, { 
        onConflict: 'session_id',
        ignoreDuplicates: false 
      });


    console.log('Final API response with conversation state and buttons');
    
    return NextResponse.json({
      message: extractedMessage,
      preferences,
      confidence,
      ready,
      sessionId,
      drinks: drinksForMessage,
      buttons,
      missingPrefs
    });

  } catch (error: unknown) {
    console.error('Error in AI chat:', error);
    
    // Log the full error object for debugging
    if (error && typeof error === 'object' && 'status' in error) {
      console.error('API Error Status:', (error as { status?: number }).status);
      console.error('API Error Headers:', (error as { headers?: unknown }).headers);
      console.error('API Error Body:', (error as { error?: unknown }).error);
    }
    
    // Provide more specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('authentication') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'API authentication failed. Please check your Google AI API key.' },
          { status: 401 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('rate') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.message.includes('safety') || error.message.includes('blocked')) {
        return NextResponse.json(
          { error: 'Content was blocked by safety filters. Please rephrase your message.' },
          { status: 400 }
        );
      }
      if (error instanceof Error && (error.message.includes('invalid') || (error as { status?: number }).status === 400)) {
        return NextResponse.json(
          { error: 'Invalid request format. Please try again.' },
          { status: 400 }
        );
      }
      // Log the full error for debugging
      if (error instanceof Error) {
        console.error('Full Google AI API error message:', error.message);
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process your message. Please try again.' },
      { status: 500 }
    );
  }
}