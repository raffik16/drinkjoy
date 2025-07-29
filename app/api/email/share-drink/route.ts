import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { Drink } from '@/app/types/drinks'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, drink, senderMessage, senderName } = await request.json()
    
    if (!email || !drink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Send email with drink recommendation
    try {
      const { error } = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Drinkjoy <onboarding@resend.dev>',
        to: [email],
        subject: `🍹 ${senderName ? `${senderName} recommends` : 'Someone recommends'}: ${drink.name}`,
        html: generateShareEmailHTML(drink, senderMessage, senderName)
      })
      
      if (error) {
        console.error('Error sending drink share email:', error)
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Drink recommendation sent successfully!'
      })
    } catch (emailError) {
      console.error('Error sending drink share email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in drink share API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateShareEmailHTML(drink: Drink, senderMessage?: string, senderName?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${senderName ? `${senderName} recommends` : 'Someone recommends'}: ${drink.name}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 20px; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
            <div style="font-size: 40px; margin-bottom: 16px;">🍹</div>
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #FFF !important;">
              ${senderName ? `${senderName} thinks you'll love this drink!` : 'Someone thinks you\'ll love this drink!'}
            </h1>
            <p style="margin: 0; font-size: 16px; color: #FFF !important; opacity: 0.9;">A personal recommendation just for you</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 20px;">
            
            ${senderMessage ? `
            <!-- Personal Message -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
              <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">💌 Personal Message</h3>
              <p style="margin: 0; color: #92400e; font-size: 14px; font-style: italic;">"${senderMessage}"</p>
            </div>
            ` : ''}
            
            <!-- Drink Card -->
            <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 16px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="margin-bottom: 20px;">
                ${drink.image_url ? `
                  <img src="${drink.image_url}?w=400" alt="${drink.name}" style="width: 100%; max-width: 400px; height: 200px; border-radius: 12px; object-fit: cover; border: 2px solid #e2e8f0; margin-bottom: 16px;">
                ` : `
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%; height: 200px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 64px; border: 2px solid #e2e8f0; margin-bottom: 16px;">
                    ${drink.category === 'cocktail' ? '🍹' : drink.category === 'beer' ? '🍺' : drink.category === 'wine' ? '🍷' : drink.category === 'spirit' ? '🥃' : '🥤'}
                  </div>
                `}
                <div style="width: 100%;">
                  <h2 style="margin: 0 0 12px 0; color: #1e293b; font-size: 24px; font-weight: 700;">${drink.name}</h2>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                    <span style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      ${drink.category}
                    </span>
                    <span style="display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600;">
                      ${drink.abv}% ABV
                    </span>
                  </div>
                </div>
              </div>
              
              <p style="margin: 0 0 20px 0; color: #64748b; font-size: 16px; line-height: 1.5;">${drink.description}</p>
              
              <!-- Drink Details -->
              <div style="background: white; border-radius: 8px; padding: 16px; margin-top: 16px;">
                <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Drink Details</h3>
                <div style="display: block; font-size: 14px;">
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #94a3b8; font-weight: 500;">Strength:</span>
                    <span style="color: #475569; text-transform: capitalize; font-weight: 600;">${drink.strength}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: #94a3b8; font-weight: 500;">Glass:</span>
                    <span style="color: #475569;">${drink.glass_type || 'Standard'}</span>
                  </div>
                </div>
                
                ${drink.ingredients ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                  <span style="color: #94a3b8; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Ingredients:</span>
                  <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">${drink.ingredients.join(', ')}</p>
                </div>
                ` : ''}
                
                ${drink.preparation ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                  <span style="color: #94a3b8; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Preparation:</span>
                  <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">${drink.preparation}</p>
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- CTA Section -->
            <div style="text-align: center; margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%); border-radius: 12px;">
              <h3 style="margin: 0 0 12px 0; color: #3730a3; font-size: 18px; font-weight: 600;">Want more personalized recommendations?</h3>
              <p style="margin: 0 0 20px 0; color: #4338ca; font-size: 14px;">Discover drinks perfectly matched to your taste preferences!</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://drinkjoy.app'}/app" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                🪄 Try Drinkjoy Free
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Cheers! 🥂<br>
                <strong style="color: #667eea;">The Drinkjoy Team</strong>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}