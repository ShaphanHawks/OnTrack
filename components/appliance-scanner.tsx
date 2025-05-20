"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Copy, Loader2, AlertCircle } from "lucide-react"
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
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset previous results and errors
    setError(null)
    setModelNumber(null)
    setSerialNumber(null)

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

      // Create form data for upload
      const formData = new FormData()
      formData.append("image", file)

      setIsUploading(false)
      setIsProcessing(true)

      // Send image to API for processing
      const response = await fetch("/api/scan-appliance", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setModelNumber(data.modelNumber || "Not found")
        setSerialNumber(data.serialNumber || "Not found")
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

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

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
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 h-40 cursor-pointer"
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
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload an image of an appliance tag</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 5MB)</p>
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
            <Button onClick={handleUploadClick} disabled={isUploading || isProcessing} className="w-full" size="sm">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
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
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Upload a clear image of an appliance tag to automatically extract the model and serial numbers.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
