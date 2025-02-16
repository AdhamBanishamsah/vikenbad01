import React from "react"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const cairo = Cairo({ subsets: ["arabic"] })

export const metadata: Metadata = {
  title: "Viken Bad - نظام إدارة المشاريع",
  description: "نظام تتبع وقت الموظفين وإدارة المشاريع",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
} 