import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/auth.config'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (session.user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse request body
    const body = await request.json()

    // 3. Fetch time logs based on filters
    const timeLogs = await prisma.timeLog.findMany({
      where: {
        date: {
          gte: new Date(body.startDate),
          lte: new Date(body.endDate)
        },
        ...(body.userId && { userId: body.userId }),
        ...(body.projectId && { projectId: body.projectId })
      },
      include: {
        user: true,
        project: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // 4. Calculate total hours
    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0)

    // 5. Format the data for response
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        period: {
          start: body.startDate,
          end: body.endDate
        },
        filters: {
          userId: body.userId || 'all',
          projectId: body.projectId || 'all'
        },
        totalHours
      },
      timeLogs: timeLogs.map(log => ({
        date: log.date,
        user: {
          id: log.user.id,
          name: log.user.name
        },
        project: {
          id: log.project.id,
          title: log.project.title
        },
        hours: log.hours,
        description: log.description || ''
      }))
    }

    return new NextResponse(
      JSON.stringify(reportData),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in report generation:', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })

    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 