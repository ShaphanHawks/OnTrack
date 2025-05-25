"use client"

import React from "react"
import { useState, useRef, useCallback } from "react"
import { Upload, Copy, Loader2, AlertCircle, Clipboard } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useIsMobile } from "@/hooks/use-mobile"

interface ApplianceScannerProps {
  onModelNumberChange: (modelNumber: string) => void
}

export function ApplianceScanner({ onModelNumberChange }: ApplianceScannerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [modelNumber, setModelNumber] = useState<string | null>(null)
  const [serialNumber, setSerialNumber] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Reset states for new image processing
  const resetStates = () => {
    setError(null)
    setModelNumber(null)
    setSerialNumber(null)
    onModelNumberChange("")
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
        const newModelNumber = data.modelNumber || "Not found"
        setModelNumber(newModelNumber)
        setSerialNumber(data.serialNumber || "Not found")
        onModelNumberChange(newModelNumber)
        // Save to localStorage scan history
        const scanResult = {
          modelNumber: newModelNumber,
          serialNumber: data.serialNumber || "Not found",
          date: Date.now(),
        }
        let history = JSON.parse(localStorage.getItem("scanHistory") || "[]")
        history.push(scanResult)
        localStorage.setItem("scanHistory", JSON.stringify(history))
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
        // Silently ignore non-image pastes
        return
      }

      // Reset states for new processing
      resetStates()

      // Get image as blob
      const blob = imageItem.getAsFile()
      if (!blob) return

      try {
        // Create image preview
        const reader = new FileReader()
        reader.onload = async (e) => {
          setImagePreview(e.target?.result as string)

          // Auto-trigger processing immediately after preview is set
          await processImageData(blob, blob.type)
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error("Error handling paste:", error)
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
      <CardContent className="p-3 flex flex-col items-center w-full">
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className="w-full flex flex-col gap-3 items-center">
            <div className="w-full flex flex-col md:flex-row gap-2 items-center justify-center">
              {/* File Upload Area */}
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-2 h-40 w-full cursor-pointer"
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

              {/* Clipboard Paste Area - Only show on desktop */}
              {!isMobile && (
                <div
                  ref={pasteAreaRef}
                  className="flex flex-col items-center justify-center border border-input rounded-md p-2 h-40 w-full md:w-64 cursor-text bg-background"
                  onClick={handlePasteAreaClick}
                  tabIndex={0}
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
                      <Clipboard className="h-5 w-5 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Paste image here</p>
                      <p className="text-xs text-muted-foreground">(Ctrl+V)</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isProcessing ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Processing image...</span>
              </div>
            ) : (
              <>
                {modelNumber && (
                  <div className="flex items-center gap-2 w-full">
                    <p className="text-sm font-medium">Model Number:</p>
                    <p className="text-sm">{modelNumber}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(modelNumber, "Model number")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {serialNumber && (
                  <div className="flex items-center gap-2 w-full">
                    <p className="text-sm font-medium">Serial Number:</p>
                    <p className="text-sm">{serialNumber}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(serialNumber, "Serial number")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Start Over Button */}
            {(imagePreview || modelNumber || serialNumber || error) && (
              <Button
                className="w-full mt-2"
                size="sm"
                onClick={() => {
                  setImagePreview(null)
                  setModelNumber(null)
                  setSerialNumber(null)
                  setError(null)
                }}
                disabled={isProcessing}
              >
                Start Over
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
