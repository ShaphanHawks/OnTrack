import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONTENT_DIR = path.join(process.cwd(), 'public', 'editable-content', 'pages')

export async function GET(
  request: Request,
  { params }: { params: { path: string } }
) {
  try {
    const filePath = path.join(CONTENT_DIR, params.path)

    // Validate the path is within the content directory
    if (!filePath.startsWith(CONTENT_DIR)) {
      return NextResponse.json(
        { error: 'Invalid page path' },
        { status: 400 }
      )
    }

    const content = await fs.readFile(filePath, 'utf-8')
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error reading page:', error)
    return NextResponse.json(
      { error: 'Failed to read page' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { path: string } }
) {
  try {
    const { content } = await request.json()
    const filePath = path.join(CONTENT_DIR, params.path)

    // Validate the path is within the content directory
    if (!filePath.startsWith(CONTENT_DIR)) {
      return NextResponse.json(
        { error: 'Invalid page path' },
        { status: 400 }
      )
    }

    await fs.writeFile(filePath, content)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    )
  }
} 