import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { hasExceededDailyLimit, trackQuery } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const exceeded = await hasExceededDailyLimit(userId)

    if (exceeded) {
      return NextResponse.json(
        { error: 'Daily query limit exceeded. Please upgrade to continue.' },
        { status: 429 }
      )
    }

    // Get the query details from the request body
    const queryDetails = await request.json()

    // Process the query here
    // ... your query processing logic ...

    // Track the query
    await trackQuery(userId, queryDetails)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Query error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 