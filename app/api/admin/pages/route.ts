import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'public', 'editable-content', 'pages')

// Ensure the content directory exists
async function ensureContentDir() {
  try {
    await fs.access(CONTENT_DIR)
  } catch {
    await fs.mkdir(CONTENT_DIR, { recursive: true })
  }
}

export async function GET() {
  try {
    await ensureContentDir()
    const files = await fs.readdir(CONTENT_DIR)
    
    const pages = files
      .filter(file => file.endsWith('.html'))
      .map(file => ({
        name: file.replace('.html', ''),
        path: file,
      }))

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Error listing pages:', error)
    return NextResponse.json(
      { error: 'Failed to list pages' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { error: 'Page name is required' },
        { status: 400 }
      )
    }

    // Sanitize the page name
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const filePath = path.join(CONTENT_DIR, `${sanitizedName}.html`)

    // Check if file already exists
    try {
      await fs.access(filePath)
      return NextResponse.json(
        { error: 'Page already exists' },
        { status: 409 }
      )
    } catch {
      // File doesn't exist, create it
      await ensureContentDir()
      await fs.writeFile(filePath, '<p>Start editing your page...</p>')

      return NextResponse.json({
        page: {
          name: sanitizedName,
          path: `${sanitizedName}.html`,
        },
      })
    }
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
} 