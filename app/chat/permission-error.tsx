"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

export function PermissionErrorCard() {
  return (
    <Card className="max-w-2xl w-full">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <CardTitle>Firebase Permission Error</CardTitle>
        </div>
        <CardDescription>
          Chat requires Firebase security rules to be configured correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Step 1: Update Firestore Rules</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mb-3">
              <li>Go to{" "}
                <Link
                  href="https://console.firebase.google.com/project/causeconnect-49d35/firestore/rules"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Firestore Rules
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>Click "Rules" tab</li>
              <li>Delete all existing code</li>
              <li>Paste the code from <code className="bg-background px-1 py-0.5 rounded text-xs">FIRESTORE_RULES_ONLY.rules</code></li>
              <li>Click "Publish"</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Step 2: Update Storage Rules (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Firebase Storage requires a paid plan. If you don't have Storage enabled, file uploads will be disabled, but text messaging will work normally.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mb-3">
              <li>Go to{" "}
                <Link
                  href="https://console.firebase.google.com/project/causeconnect-49d35/storage/rules"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Storage Rules
                  <ExternalLink className="h-3 w-3" />
                </Link>
                {" "}(only if you have Storage enabled)
              </li>
              <li>Click "Rules" tab</li>
              <li>Delete all existing code</li>
              <li>Paste the code from <code className="bg-background px-1 py-0.5 rounded text-xs">STORAGE_RULES_ONLY.rules</code></li>
              <li>Click "Publish"</li>
            </ol>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>⚠️ <strong>Important:</strong> These are TWO separate rule files. Update them separately!</p>
        </div>
        
        <Button onClick={() => window.location.reload()} className="w-full">
          Refresh After Updating Rules
        </Button>
      </CardContent>
    </Card>
  )
}

