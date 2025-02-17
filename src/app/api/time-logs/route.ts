import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/auth.config'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { projectId, date, hours, description } = body

    // Validate required fields
    if (!projectId || !date || !hours) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate hours is a positive number
    const hoursNum = parseFloat(hours)
    if (isNaN(hoursNum) || hoursNum <= 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Hours must be a positive number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if project exists and user is assigned to it
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        status: 'active',
        users: {
          some: {
            id: session.user.id
          }
        }
      }
    })

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or user not assigned' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create time log
    const timeLog = await prisma.timeLog.create({
      data: {
        date: new Date(date),
        hours: hoursNum,
        description: description || null,
        userId: session.user.id,
        projectId
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
      }
    })

    return new NextResponse(
      JSON.stringify(timeLog),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating time log:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to create time log',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 