import { NextRequest, NextResponse } from 'next/server'
import { toggleLike, getDrinkLikes, getUserLikes } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { drinkId, sessionId } = await request.json()
    
    if (!drinkId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing drinkId or sessionId' },
        { status: 400 }
      )
    }
    
    // Toggle like status automatically
    const result = await toggleLike(drinkId, sessionId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update like status' },
        { status: 500 }
      )
    }
    
    // Get updated like count
    const { count } = await getDrinkLikes(drinkId)
    
    return NextResponse.json({
      success: true,
      likeCount: count,
      liked: result.liked
    })
  } catch (error) {
    console.error('Error in likes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const drinkId = searchParams.get('drinkId')
    const sessionId = searchParams.get('sessionId')
    
    if (drinkId && sessionId) {
      // Get specific drink like status
      const { count } = await getDrinkLikes(drinkId)
      const userLikes = await getUserLikes(sessionId)
      const liked = userLikes.includes(drinkId)
      
      return NextResponse.json({
        drinkId,
        likeCount: count,
        liked
      })
    } else if (sessionId) {
      // Get all user likes
      const likedDrinks = await getUserLikes(sessionId)
      
      return NextResponse.json({
        likedDrinks
      })
    }
    
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in likes GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}