import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/auth.config'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const projectId = params.id

    // Fetch project with users and time logs
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        timeLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    if (!project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Calculate total hours
    const totalHours = project.timeLogs.reduce((sum, log) => sum + log.hours, 0)

    // Format the response
    const response = {
      ...project,
      totalHours,
      totalUsers: project.users.length,
    }

    return new NextResponse(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching project details:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch project details',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 