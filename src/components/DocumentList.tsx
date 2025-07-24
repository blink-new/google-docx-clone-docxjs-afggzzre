import React, { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  User,
  FileUp,
  Download
} from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface Document {
  id: string
  title: string
  content: string
  owner_user_id: string
  created_at: string
  updated_at: string
}

interface DocumentListProps {
  onDocumentSelect: (documentId: string) => void
  user: any
}

export function DocumentList({ onDocumentSelect, user }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const docs = await blink.db.documents.list({
        where: {
          OR: [
            { owner_user_id: user.id },
            // Add collaborator access later
          ]
        },
        orderBy: { updated_at: 'desc' }
      })
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [user.id, toast])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const createNewDocument = async () => {
    try {
      const newDoc = await blink.db.documents.create({
        id: `doc_${Date.now()}`,
        title: 'Untitled Document',
        content: '',
        owner_user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      onDocumentSelect(newDoc.id)
      toast({
        title: "Success",
        description: "New document created"
      })
    } catch (error) {
      console.error('Failed to create document:', error)
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive"
      })
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">DocxCollab</h1>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <Avatar>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
            <p className="text-gray-600 mt-1">Create and manage your documents</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <FileUp className="h-4 w-4 mr-2" />
              Import DOCX
            </Button>
            <Button onClick={createNewDocument} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
        </div>

        {/* Document Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first document to get started'
              }
            </p>
            {!searchTerm && (
              <Button onClick={createNewDocument}>
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                onClick={() => onDocumentSelect(doc.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-base line-clamp-2">
                    {doc.title}
                  </CardTitle>
                  <CardDescription className="flex items-center text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(doc.updated_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {doc.content ? 
                      doc.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' :
                      'Empty document'
                    }
                  </p>
                  <div className="flex items-center mt-3 text-xs text-gray-500">
                    <User className="h-3 w-3 mr-1" />
                    {doc.owner_user_id === user.id ? 'You' : 'Shared'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}