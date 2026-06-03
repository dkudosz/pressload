'use client'

import type { Editor as TiptapEditor } from '@tiptap/react'
import { useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SaveStatus } from './Editor'

interface ToolbarProps {
  editor: TiptapEditor | null
  saveStatus: SaveStatus
}

function Btn({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
        isActive && 'bg-accent text-accent-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-border" />
}

export function Toolbar({ editor, saveStatus }: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const linkRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  if (!editor) return <div className="h-10 border-b border-input" />

  function applyLink() {
    if (!linkUrl.trim()) return
    editor!.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run()
    setShowLinkInput(false)
    setLinkUrl('')
  }

  function removeLink() {
    editor!.chain().focus().unsetLink().run()
    setShowLinkInput(false)
  }

  function insertImage() {
    if (!imageUrl.trim()) return
    editor!.chain().focus().setImage({ src: imageUrl.trim() }).run()
    setShowImageInput(false)
    setImageUrl('')
  }

  function openLinkPopover() {
    const existing = editor!.getAttributes('link').href ?? ''
    setLinkUrl(existing)
    setShowImageInput(false)
    setShowLinkInput((v) => !v)
    setTimeout(() => linkRef.current?.focus(), 50)
  }

  function openImagePopover() {
    setImageUrl('')
    setShowLinkInput(false)
    setShowImageInput((v) => !v)
    setTimeout(() => imageRef.current?.focus(), 50)
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
      {/* Inline formatting */}
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
        <Underline className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough className="h-3.5 w-3.5" />
      </Btn>

      <Divider />

      {/* Headings */}
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Btn>

      <Divider />

      {/* Lists */}
      <Btn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Btn>

      <Divider />

      {/* Block types */}
      <Btn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code block"
      >
        <Code2 className="h-3.5 w-3.5" />
      </Btn>

      <Divider />

      {/* Link */}
      <div className="relative">
        <Btn onClick={openLinkPopover} isActive={editor.isActive('link') || showLinkInput} title="Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </Btn>
        {showLinkInput && (
          <div className="absolute left-0 top-full z-20 mt-1 flex w-72 gap-1 rounded-md border border-border bg-card p-2 shadow-lg">
            <input
              ref={linkRef}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyLink()
                if (e.key === 'Escape') setShowLinkInput(false)
              }}
              placeholder="https://..."
              className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={applyLink}
              className="shrink-0 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Set
            </button>
            {editor.isActive('link') && (
              <button
                type="button"
                onClick={removeLink}
                className="shrink-0 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative">
        <Btn onClick={openImagePopover} isActive={showImageInput} title="Insert image (URL)">
          <ImageIcon className="h-3.5 w-3.5" />
        </Btn>
        {showImageInput && (
          <div className="absolute left-0 top-full z-20 mt-1 flex w-72 gap-1 rounded-md border border-border bg-card p-2 shadow-lg">
            <input
              ref={imageRef}
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') insertImage()
                if (e.key === 'Escape') setShowImageInput(false)
              }}
              placeholder="https://image-url.jpg"
              className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={insertImage}
              className="shrink-0 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Insert
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <Btn
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert table"
      >
        <Table className="h-3.5 w-3.5" />
      </Btn>

      {/* Horizontal rule */}
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <Minus className="h-3.5 w-3.5" />
      </Btn>

      <Divider />

      {/* Text alignment */}
      <Btn
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align left"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align center"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align right"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Btn>

      <Divider />

      {/* Undo / Redo */}
      <Btn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </Btn>

      {/* Autosave status */}
      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        {saveStatus === 'saving' && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <Check className="h-3 w-3 text-green-500" />
            Saved
          </>
        )}
      </div>
    </div>
  )
}
