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

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all time logs with project and user details
    const timeLogs = await prisma.timeLog.findMany({
      select: {
        id: true,
        date: true,
        hours: true,
        description: true,
        locked: true,
        lockedAt: true,
        project: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        },
        lockedBy: {
          select: {
            id: true,
            name: true
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
    console.error('Error fetching all time logs:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch time logs',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 