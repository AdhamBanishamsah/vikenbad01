import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function GET() {
  try {
    // Hash the password for admin
    const hashedPassword = await hash("Admin123!!", 12)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@viken.com",
        password: hashedPassword,
        role: "admin"
      }
    })

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ 
      message: "Admin user created successfully",
      adminUser: {
        ...adminUser,
        password: undefined
      },
      allUsers: allUsers
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: "Database operation failed", 
      details: error 
    }, { status: 500 })
  }
} 