import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/auth.config'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch time logs for the user
    const timeLogs = await prisma.timeLog.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        date: true,
        hours: true,
        description: true,
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return new NextResponse(
      JSON.stringify(timeLogs),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching time logs:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch time logs',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 