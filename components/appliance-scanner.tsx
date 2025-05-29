"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Upload, Copy, Loader2, AlertCircle, Clipboard, Camera, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useIsMobile } from "@/hooks/use-mobile"

interface ApplianceScannerProps {
  onModelNumberChange: (modelNumber: string) => void
  initialModel?: string
  initialSerial?: string
}

export function ApplianceScanner({ onModelNumberChange, initialModel, initialSerial }: ApplianceScannerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [modelNumber, setModelNumber] = useState<string | null>(initialModel || null)
  const [serialNumber, setSerialNumber] = useState<string | null>(initialSerial || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Update model number when initialModel changes
  useEffect(() => {
    if (initialModel) {
      setModelNumber(initialModel)
      onModelNumberChange(initialModel)
    }
  }, [initialModel, onModelNumberChange])

  // Update serial number when initialSerial changes
  useEffect(() => {
    if (initialSerial) {
      setSerialNumber(initialSerial)
    }
  }, [initialSerial])

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
        // Remove any existing entries with the same model number
        history = history.filter((item: any) => item.modelNumber !== newModelNumber)
        // Add the new scan result at the beginning of the array
        history.unshift(scanResult)
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

  // Handle camera capture
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    resetStates()

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please capture an image",
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
      console.error("Error handling camera capture:", error)
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

  // Handle camera button click
  const handleCameraClick = () => {
    cameraInputRef.current?.click()
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

  const renderMobileUploadArea = () => {
    if (imagePreview) {
      return (
        <div className="relative w-full aspect-square">
          <div className="relative w-full h-full">
            <Image
              src={imagePreview}
              alt="Appliance tag preview"
              fill
              className="object-contain rounded-md"
              unoptimized
            />
          </div>
          <Button
            size="sm"
            className="absolute bottom-2 right-2 bg-[#F26D4B] text-white hover:bg-[#e05c36]"
            onClick={() => {
              setImagePreview(null)
              setModelNumber(null)
              setSerialNumber(null)
              setError(null)
            }}
          >
            Start Over
          </Button>
        </div>
      )
    }

    return (
      <div className="flex flex-col w-full aspect-square">
        {/* Camera Zone - 45% height */}
        <div
          className="h-[45%] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleCameraClick}
        >
          <Camera className="h-16 w-16 text-gray-400 opacity-70" />
        </div>

        {/* Divider Zone - 10% height */}
        <div className="h-[10%] flex items-center justify-center">
          <span className="text-lg font-bold text-gray-400">▼ Or ▲</span>
        </div>

        {/* Upload Zone - 45% height */}
        <div
          className="h-[45%] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleUploadClick}
        >
          <Upload className="h-16 w-16 text-gray-400 opacity-70" />
        </div>
      </div>
    )
  }

  return (
    <Card className="w-[95vw] max-w-xl sm:mx-auto mx-[2.5vw] bg-white border border-orange-500 rounded-lg p-4 shadow-md hover:shadow-lg transition">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">Appliance Model Tag Scanner</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col items-center w-full">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex flex-col gap-3 items-center">
            <div className="w-full flex flex-col md:flex-row gap-2 items-center justify-center">
              {/* File Upload Area */}
              <div className="relative w-full">
                {isMobile ? (
                  <div className="border-2 border-dashed rounded-md p-2">
                    {renderMobileUploadArea()}
                  </div>
                ) : (
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
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleCameraCapture}
                  accept="image/*"
                  capture="environment"
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
