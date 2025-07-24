import React, { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { DocumentEditor } from './components/DocumentEditor'
import { DocumentList } from './components/DocumentList'
import { Toaster } from './components/ui/toaster'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading DocxCollab...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold text-primary mb-4">DocxCollab</h1>
          <p className="text-muted-foreground mb-6">
            Collaborative document editing with real-time synchronization
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {currentDocumentId ? (
        <DocumentEditor
          documentId={currentDocumentId}
          onBack={() => setCurrentDocumentId(null)}
          user={user}
        />
      ) : (
        <DocumentList
          onDocumentSelect={setCurrentDocumentId}
          user={user}
        />
      )}
      <Toaster />
    </div>
  )
}

export default App