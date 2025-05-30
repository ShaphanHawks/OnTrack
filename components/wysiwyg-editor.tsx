'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useState } from 'react'

interface WysiwygEditorProps {
  content: string
  onSave: (content: string) => void
  onImageUpload: (file: File) => Promise<string>
}

// Define our custom styles
const styles = [
  { id: 'heading1', label: 'Heading 1', tag: 'h1' },
  { id: 'heading2', label: 'Heading 2', tag: 'h2' },
  { id: 'paragraph', label: 'Paragraph', tag: 'p' },
  { id: 'caption', label: 'Caption', tag: 'p', class: 'caption' },
]

export default function WysiwygEditor({ content, onSave, onImageUpload }: WysiwygEditorProps) {
  const [isSaving, setIsSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  })

  const handleImageUpload = async (file: File) => {
    try {
      const imageUrl = await onImageUpload(file)
      editor?.chain().focus().setImage({ src: imageUrl }).run()
    } catch (error) {
      console.error('Failed to upload image:', error)
    }
  }

  const handleSave = async () => {
    if (!editor) return
    
    setIsSaving(true)
    try {
      const html = editor.getHTML()
      await onSave(html)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg shadow-sm">
      <div className="border-b p-2 flex flex-wrap gap-2">
        {/* Style Dropdown */}
        <select
          className="border rounded px-2 py-1"
          onChange={(e) => {
            const style = styles.find(s => s.id === e.target.value)
            if (style) {
              editor.chain().focus().setNode(style.tag, { class: style.class }).run()
            }
          }}
        >
          <option value="">Select Style</option>
          {styles.map(style => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </select>

        {/* Basic Formatting Buttons */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          Bullet List
        </button>

        {/* Image Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleImageUpload(file)
            }
          }}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="px-2 py-1 rounded bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
        >
          Insert Image
        </label>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="ml-auto px-4 py-1 rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <EditorContent editor={editor} className="p-4 min-h-[300px]" />
    </div>
  )
} 