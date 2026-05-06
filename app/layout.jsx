import './globals.css'

export const metadata = {
  title: 'Friends Hub - Shared Adventure Space',
  description: 'A shared space for all your adventures and memories with friends!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
