import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { writeFile } from 'fs/promises'

const IMAGES_DIR = path.join(process.cwd(), 'public', 'editable-content', 'images')

// Ensure the images directory exists
async function ensureImagesDir() {
  try {
    await fs.access(IMAGES_DIR)
  } catch {
    await fs.mkdir(IMAGES_DIR, { recursive: true })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const sanitizedName = image.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-')
    const filename = `${timestamp}-${sanitizedName}`
    const filePath = path.join(IMAGES_DIR, filename)

    // Ensure the images directory exists
    await ensureImagesDir()

    // Convert the file to a buffer and save it
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return the relative URL for the image
    const imageUrl = `/editable-content/images/${filename}`
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
} 