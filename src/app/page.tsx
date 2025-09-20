import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function HomePage() {
  // Redirect to login page by default
  redirect('/login')
}