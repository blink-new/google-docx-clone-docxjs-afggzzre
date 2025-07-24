import React, { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import { blink } from '../blink/client'
import { DocumentToolbar } from './DocumentToolbar'
import { DocumentHeader } from './DocumentHeader'
import { useToast } from '../hooks/use-toast'
import { Document, Paragraph, TextRun, Packer } from 'docx'
import { Users } from 'lucide-react'

interface DocumentEditorProps {
  documentId: string
  onBack: () => void
  user: any
}

interface DocumentData {
  id: string
  title: string
  content: string
  owner_user_id: string
  created_at: string
  updated_at: string
}

// Utility function for debouncing
function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function DocumentEditor({ documentId, onBack, user }: DocumentEditorProps) {
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [wordCount, setWordCount] = useState(0)
  const { toast } = useToast()

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true)
      const docs = await blink.db.documents.list({
        where: { id: documentId },
        limit: 1
      })
      
      if (docs.length === 0) {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive"
        })
        onBack()
        return
      }
      
      setDocument(docs[0])
    } catch (error) {
      console.error('Failed to load document:', error)
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive"
      })
      onBack()
    } finally {
      setLoading(false)
    }
  }, [documentId, onBack, toast])

  const saveDocument = useCallback(async (content?: string) => {
    if (!document || saving) return
    
    try {
      setSaving(true)
      const contentToSave = content || ''
      
      await blink.db.documents.update(document.id, {
        content: contentToSave,
        updated_at: new Date().toISOString()
      })
      
      setDocument(prev => prev ? { ...prev, content: contentToSave, updated_at: new Date().toISOString() } : null)
    } catch (error) {
      console.error('Failed to save document:', error)
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }, [document, saving, toast])

  // Debounced save function
  const debouncedSave = useCallback((content: string) => {
    const timeoutId = setTimeout(() => {
      if (document && !saving) {
        saveDocument(content)
      }
    }, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [document, saving, saveDocument])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color.configure({ types: [TextStyle.name] }),
      TextStyle,
      FontFamily.configure({
        types: [TextStyle.name],
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      setWordCount(text.split(/\s+/).filter(word => word.length > 0).length)
      debouncedSave(editor.getHTML())
    },
  })

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  useEffect(() => {
    if (document && editor && !editor.getHTML()) {
      editor.commands.setContent(document.content || '')
    }
  }, [document, editor])

  const updateTitle = async (newTitle: string) => {
    if (!document) return
    
    try {
      await blink.db.documents.update(document.id, {
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      
      setDocument(prev => prev ? { ...prev, title: newTitle } : null)
      toast({
        title: "Success",
        description: "Document title updated"
      })
    } catch (error) {
      console.error('Failed to update title:', error)
      toast({
        title: "Error",
        description: "Failed to update title",
        variant: "destructive"
      })
    }
  }

  const exportToDocx = async () => {
    if (!document || !editor) return
    
    try {
      const content = editor.getText()
      const paragraphs = content.split('\n').filter(p => p.trim()).map(
        text => new Paragraph({
          children: [new TextRun(text)],
        })
      )
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs.length > 0 ? paragraphs : [
            new Paragraph({
              children: [new TextRun('Empty document')],
            })
          ],
        }],
      })
      
      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = `${document.title}.docx`
      link.click()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Document exported successfully"
      })
    } catch (error) {
      console.error('Failed to export document:', error)
      toast({
        title: "Error",
        description: "Failed to export document",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DocumentHeader
        document={document}
        onTitleChange={updateTitle}
        onBack={onBack}
        user={user}
        collaborators={collaborators}
        saving={saving}
        onExport={exportToDocx}
      />
      
      {/* Toolbar */}
      <div className="border-b bg-white px-6 py-2">
        <DocumentToolbar editor={editor} />
      </div>
      
      {/* Editor */}
      <div className="flex-1 flex justify-center px-6 py-8">
        <div className="w-full max-w-4xl">
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg min-h-[600px]">
            <div className="p-12">
              <EditorContent 
                editor={editor}
                className="prose prose-lg max-w-none focus:outline-none min-h-[500px]"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>{wordCount} words</span>
          <div className="flex items-center space-x-1">
            <div className={`h-2 w-2 rounded-full ${saving ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span>{saving ? 'Saving...' : 'Saved'}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>{collaborators.length + 1} collaborators</span>
        </div>
      </div>
    </div>
  )
}