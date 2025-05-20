"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, Copy, Loader2, AlertCircle, Clipboard } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ApplianceScanner() {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [modelNumber, setModelNumber] = useState<string | null>(null)
  const [serialNumber, setSerialNumber] = useState<string | null>(null)
  const [fullText, setFullText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Reset states for new image processing
  const resetStates = () => {
    setError(null)
    setModelNumber(null)
    setSerialNumber(null)
    setFullText(null)
  }

  // Process image data (common function for both upload and paste)
  const processImageData = async (imageData: File | Blob, mimeType: string) => {
    setIsProcessing(true)

    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append("image", imageData)

      // Send image to API for processing
      const response = await fetch("/api/scan-appliance", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setModelNumber(data.modelNumber || "Not found")
        setSerialNumber(data.serialNumber || "Not found")
        setFullText(data.fullText || "")
      } else {
        throw new Error(data.error || "Failed to extract information")
      }
    } catch (error) {
      console.error("Error processing image:", error)
      setError(error instanceof Error ? error.message : "Failed to process image")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    resetStates()

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create image preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      setIsUploading(false)

      // Process the image
      await processImageData(file, file.type)
    } catch (error) {
      console.error("Error handling file:", error)
      setIsUploading(false)
      setError(error instanceof Error ? error.message : "Failed to process image")
    }
  }

  // Handle clipboard paste
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      e.preventDefault()

      if (!e.clipboardData) return

      resetStates()

      // Check if clipboard has images
      const items = e.clipboardData.items
      let imageItem = null

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          imageItem = items[i]
          break
        }
      }

      if (!imageItem) {
        toast({
          title: "No image found",
          description: "No image data found in clipboard",
          variant: "destructive",
        })
        return
      }

      // Get image as blob
      const blob = imageItem.getAsFile()
      if (!blob) return

      setIsUploading(true)

      try {
        // Create image preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(blob)

        setIsUploading(false)

        // Process the image
        await processImageData(blob, blob.type)
      } catch (error) {
        console.error("Error handling paste:", error)
        setIsUploading(false)
        setError(error instanceof Error ? error.message : "Failed to process pasted image")
      }
    },
    [toast],
  )

  // Set up paste event listener
  const setupPasteListener = useCallback(() => {
    const pasteArea = pasteAreaRef.current
    if (!pasteArea) return

    pasteArea.addEventListener("paste", handlePaste)
    return () => {
      pasteArea.removeEventListener("paste", handlePaste)
    }
  }, [handlePaste])

  // Set up paste event listener when component mounts
  React.useEffect(() => {
    const cleanup = setupPasteListener()
    return cleanup
  }, [setupPasteListener])

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Handle paste area click
  const handlePasteAreaClick = () => {
    // Focus the paste area to make it ready for paste events
    pasteAreaRef.current?.focus()

    toast({
      title: "Ready for paste",
      description: "Press Ctrl+V to paste an image from clipboard",
    })
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-base">Appliance Model Tag Scanner</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {/* File Upload Area */}
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-2 h-40 cursor-pointer"
                onClick={handleUploadClick}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Appliance tag preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Upload Image</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, JPEG</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
              </div>

              {/* Clipboard Paste Area */}
              <div
                ref={pasteAreaRef}
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-2 h-40 cursor-pointer"
                onClick={handlePasteAreaClick}
                tabIndex={0} // Make it focusable
                onPaste={(e: React.ClipboardEvent) => handlePaste(e.nativeEvent)}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Appliance tag preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <Clipboard className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Paste from Clipboard</p>
                    <p className="text-xs text-muted-foreground">Ctrl+V or ⌘+V</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleUploadClick} disabled={isUploading || isProcessing} className="w-full" size="sm">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1 h-3 w-3" />
                    Upload
                  </>
                )}
              </Button>

              <Button
                onClick={handlePasteAreaClick}
                disabled={isUploading || isProcessing}
                className="w-full"
                size="sm"
                variant="outline"
              >
                <Clipboard className="mr-1 h-3 w-3" />
                Paste
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Extracted Information:</p>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs ml-2">{error}</AlertDescription>
                </Alert>
              )}

              {isProcessing ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Processing image...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground">Model Number:</p>
                      <p className="text-sm font-medium">{modelNumber || "Upload an image to extract"}</p>
                    </div>
                    {modelNumber && modelNumber !== "Not found" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(modelNumber, "Model number")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">Copy model number</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground">Serial Number:</p>
                      <p className="text-sm font-medium">{serialNumber || "Upload an image to extract"}</p>
                    </div>
                    {serialNumber && serialNumber !== "Not found" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(serialNumber, "Serial number")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">Copy serial number</span>
                      </Button>
                    )}
                  </div>

                  {fullText && (
                    <div className="mt-3 p-2 bg-muted/30 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Full AI Response:</p>
                      <p className="text-xs whitespace-pre-wrap">{fullText}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Upload or paste an image of an appliance tag to automatically extract the model and serial numbers.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
