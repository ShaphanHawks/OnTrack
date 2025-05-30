'use client'

// Content Editor Page - Central hub for managing editable pages
import { useState, useEffect } from 'react'
import WysiwygEditor from '@/components/wysiwyg-editor'
import { useRouter } from 'next/navigation'

interface Page {
  name: string
  path: string
}

export default function EditorPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [newPageName, setNewPageName] = useState('')
  const router = useRouter()

  // Load pages on mount
  useEffect(() => {
    loadPages()
  }, [])

  // Load content when a page is selected
  useEffect(() => {
    if (selectedPage) {
      loadPageContent(selectedPage)
    }
  }, [selectedPage])

  const loadPages = async () => {
    try {
      const response = await fetch('/api/admin/pages')
      if (!response.ok) throw new Error('Failed to load pages')
      const data = await response.json()
      setPages(data.pages)
    } catch (error) {
      console.error('Error loading pages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPageContent = async (pagePath: string) => {
    try {
      const response = await fetch(`/api/admin/pages/${encodeURIComponent(pagePath)}`)
      if (!response.ok) throw new Error('Failed to load page content')
      const data = await response.json()
      setContent(data.content)
    } catch (error) {
      console.error('Error loading page content:', error)
    }
  }

  const handleSave = async (newContent: string) => {
    if (!selectedPage) return

    try {
      const response = await fetch(`/api/admin/pages/${encodeURIComponent(selectedPage)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      })

      if (!response.ok) throw new Error('Failed to save page')
    } catch (error) {
      console.error('Error saving page:', error)
      throw error
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/admin/upload-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    const data = await response.json()
    return data.imageUrl
  }

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPageName) return

    try {
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPageName }),
      })

      if (!response.ok) throw new Error('Failed to create page')

      const data = await response.json()
      setPages([...pages, data.page])
      setSelectedPage(data.page.path)
      setNewPageName('')
    } catch (error) {
      console.error('Error creating page:', error)
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h1 className="text-2xl font-bold mb-4">Content Editor</h1>
          
          {/* Page List */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Pages</h2>
            <div className="flex gap-2 mb-4">
              <form onSubmit={handleCreatePage} className="flex gap-2">
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="New page name (e.g., about-us)"
                  className="border rounded px-2 py-1"
                />
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Page
                </button>
              </form>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {pages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => setSelectedPage(page.path)}
                  className={`p-2 text-left rounded ${
                    selectedPage === page.path
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {page.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          {selectedPage ? (
            <WysiwygEditor
              content={content}
              onSave={handleSave}
              onImageUpload={handleImageUpload}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a page to edit or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 