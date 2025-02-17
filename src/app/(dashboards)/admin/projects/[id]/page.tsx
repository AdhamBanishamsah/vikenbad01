import { Metadata } from "next"
import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "تفاصيل المشروع | Viken Bad",
  description: "عرض تفاصيل المشروع وسجل الوقت",
}

export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ]
}

export default function ProjectDetailsPage() {
  return <ClientPage />
} 