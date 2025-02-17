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

    // Fetch active projects that the user is assigned to
    const projects = await prisma.project.findMany({
      where: {
        status: 'active',
        users: {
          some: {
            id: session.user.id
          }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true
      },
      orderBy: {
        title: 'asc'
      }
    })

    return new NextResponse(
      JSON.stringify(projects),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching active projects:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch active projects',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 