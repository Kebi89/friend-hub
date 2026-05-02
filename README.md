# Friends France Trip 2024

A modern web experience for friends sharing their annual trip memories.

## Features

📸 **Photo Gallery** - Beautiful grid layout for trip memories  
💬 **Message Board** - Interactive discussion with localStorage persistence  
📅 **Trip Calendar** - Google Calendar integration for scheduling  
🎨 **Modern UI** - Built with Next.js + Tailwind CSS + Shadcn Components  
📱 **Responsive** - Works perfectly on mobile and desktop  

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI Components
- **Language**: JavaScript (TypeScript optional)
- **Deployment**: Vercel ready

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this project to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Deploy automatically with one click

## Project Structure

```
.
├── app/                    # Next.js App Router
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── styles/            # Global styles
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── lib/                  # Utility functions
├── public/               # Static assets
├── styles/               # CSS files (legacy)
└── ...config files
```

## Customization

- Update colors in `globals.css`
- Modify components in `components/ui/`
- Add more features like user authentication
- Integrate real image hosting
- Add calendar API integration