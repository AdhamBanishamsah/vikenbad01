import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/auth.config'

export async function POST(request: Request) {
  try {
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

    const body = await request.json()
    const { timeLogIds, projectId, userId, startDate, endDate } = body

    console.log('Lock request received:', {
      timeLogIds,
      projectId,
      userId,
      startDate,
      endDate,
      adminId: session.user.id
    })

    if (!timeLogIds || !Array.isArray(timeLogIds) || timeLogIds.length === 0) {
      console.log('No time logs provided for locking')
      return new NextResponse(
        JSON.stringify({ error: 'No time logs provided for locking' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!startDate || !endDate) {
      return new NextResponse(
        JSON.stringify({ error: 'Start date and end date are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify that all time logs exist and are not already locked
    const existingLogs = await prisma.timeLog.findMany({
      where: {
        id: {
          in: timeLogIds
        }
      },
      select: {
        id: true,
        locked: true
      }
    })

    console.log('Existing logs found:', existingLogs.length)
    
    const alreadyLockedLogs = existingLogs.filter(log => log.locked)
    console.log('Already locked logs:', alreadyLockedLogs.length)

    if (existingLogs.length !== timeLogIds.length) {
      return new NextResponse(
        JSON.stringify({ error: 'Some time logs do not exist' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (alreadyLockedLogs.length > 0) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Some time logs are already locked',
          lockedLogIds: alreadyLockedLogs.map(log => log.id)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update time logs to be locked
    const updateData = await prisma.timeLog.updateMany({
      where: {
        id: {
          in: timeLogIds
        },
        ...(projectId && { projectId }),
        ...(userId && { userId }),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        locked: false // Only lock unlocked time logs
      },
      data: {
        locked: true,
        lockedAt: new Date(),
        lockedById: session.user.id
      }
    })

    console.log('Update result:', {
      attempted: timeLogIds.length,
      updated: updateData.count
    })

    if (updateData.count === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No time logs were locked' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the updated time logs to return in response
    const updatedLogs = await prisma.timeLog.findMany({
      where: {
        id: {
          in: timeLogIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        },
        lockedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return new NextResponse(
      JSON.stringify({ 
        message: 'Time logs locked successfully',
        count: updateData.count,
        logs: updatedLogs
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error locking time logs:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to lock time logs',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 