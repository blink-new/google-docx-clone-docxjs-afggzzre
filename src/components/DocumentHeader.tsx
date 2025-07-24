import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  ArrowLeft, 
  Share2, 
  FileDown, 
  MoreVertical,
  Users,
  Save
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface DocumentData {
  id: string
  title: string
  content: string
  owner_user_id: string
  created_at: string
  updated_at: string
}

interface DocumentHeaderProps {
  document: DocumentData
  onTitleChange: (title: string) => void
  onBack: () => void
  user: any
  collaborators: any[]
  saving: boolean
  onExport: () => void
}

export function DocumentHeader({ 
  document, 
  onTitleChange, 
  onBack, 
  user, 
  collaborators, 
  saving,
  onExport 
}: DocumentHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(document.title)

  const handleTitleSubmit = () => {
    if (titleValue.trim() && titleValue !== document.title) {
      onTitleChange(titleValue.trim())
    } else {
      setTitleValue(document.title)
    }
    setEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setTitleValue(document.title)
      setEditingTitle(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-3">
            {editingTitle ? (
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleTitleKeyDown}
                className="text-lg font-medium border-none p-0 h-auto focus:ring-0 focus:border-none shadow-none"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                onClick={() => setEditingTitle(true)}
              >
                {document.title}
              </h1>
            )}
            
            <div className="flex items-center space-x-1">
              {saving && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Save className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Collaborators */}
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {collaborators.slice(0, 3).map((collaborator, index) => (
                <Avatar key={index} className="h-8 w-8 border-2 border-white">
                  <AvatarImage src={collaborator.avatar} />
                  <AvatarFallback className="text-xs bg-gray-500 text-white">
                    {collaborator.name?.charAt(0).toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {collaborators.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{collaborators.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Share Button */}
          <Button size="sm" variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          {/* Export Button */}
          <Button size="sm" variant="outline" onClick={onExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Manage Access
              </DropdownMenuItem>
              <DropdownMenuItem>
                Version History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Make a Copy
              </DropdownMenuItem>
              <DropdownMenuItem>
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}