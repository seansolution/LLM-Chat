import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap'
})

export const metadata = {
  title: 'SEAN - AI Assistant',
  description: 'AI Assistant powered by Mistral',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/*
          Anti-flash theme script — runs synchronously before React hydrates
          so there is no dark→light flicker on page load.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: light)').matches;if(t==='light'||(t===null&&p))document.documentElement.classList.add('light-mode');}catch(e){}})();`
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
