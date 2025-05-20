import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: Request) {
  try {
    // Get API key from environment variables
    const apiKey = process.env.API_KEY

    if (!apiKey) {
      console.error("API_KEY environment variable is not set")
      return NextResponse.json({ success: false, error: "API_KEY environment variable is not set" }, { status: 500 })
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey)

    // Parse the multipart form data
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 })
    }

    console.log("Image received:", imageFile.name, imageFile.type, imageFile.size)

    // Convert the file to a byte array
    const imageBytes = await imageFile.arrayBuffer()

    // Create a model instance - using the correct model name format
    // The correct format is "gemini-pro-vision" (not "gemini-1.0-pro-vision")
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" })

    // Prepare the image for the API
    const imageData = [...new Uint8Array(imageBytes)]
    const imagePart = {
      inlineData: {
        data: Buffer.from(imageData).toString("base64"),
        mimeType: imageFile.type,
      },
    }

    console.log("Sending request to Gemini API...")

    // Generate content with the image
    const result = await model.generateContent([
      "Please extract and return ONLY the model number and serial number from this appliance tag image. Format your response exactly like this example:\nModel: ABC123\nSerial: XYZ789\nIf you can't find one or both numbers, indicate with 'Not found'.",
      imagePart,
    ])

    const response = await result.response
    const text = response.text()

    console.log("Gemini API response:", text)

    // Parse the model and serial numbers from the response
    const modelMatch = text.match(/Model:?\s*([^\n]+)/i)
    const serialMatch = text.match(/Serial:?\s*([^\n]+)/i)

    const modelNumber = modelMatch ? modelMatch[1].trim() : "Not found"
    const serialNumber = serialMatch ? serialMatch[1].trim() : "Not found"

    console.log("Extracted model:", modelNumber, "serial:", serialNumber)

    return NextResponse.json({
      success: true,
      modelNumber,
      serialNumber,
    })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
