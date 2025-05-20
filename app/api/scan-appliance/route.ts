import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get API key from environment variables
    const apiKey = process.env.API_KEY

    if (!apiKey) {
      console.error("API_KEY environment variable is not set")
      return NextResponse.json({ success: false, error: "API_KEY environment variable is not set" }, { status: 500 })
    }

    // Parse the multipart form data
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 })
    }

    console.log("Image received:", imageFile.name, imageFile.type, imageFile.size)

    // Convert the file to a base64 string
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")

    // Using gemini-1.5-flash model as in the working example
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    // Match the exact request structure from the working example
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "From the following image of an appliance model tag, extract ONLY the model number and serial number. Return them in this exact format without any additional text or markdown:\nModel: [MODEL_NUMBER]\nSerial: [SERIAL_NUMBER]",
            },
            {
              inline_data: {
                mime_type: imageFile.type,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
      },
    }

    console.log("Sending request to Gemini API...")

    // Make the API request
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("API Error:", errorData)
      return NextResponse.json(
        {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ""}`,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("API Response:", data)

    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0
    ) {
      const extractedText = data.candidates[0].content.parts[0].text
      console.log("Extracted text:", extractedText)

      // Parse the model and serial numbers from the response
      let modelNumber = "Not found"
      let serialNumber = "Not found"

      // Try to find "Model Number:" or "Model:" (case-insensitive)
      const modelMatch = extractedText.match(/Model:[\s]*([A-Za-z0-9-]+)/i)

      // Try to find "Serial Number:" or "S/N:" or "Serial:" (case-insensitive)
      const serialMatch = extractedText.match(/Serial:[\s]*([A-Za-z0-9-]+)/i)

      if (modelMatch && modelMatch[1]) {
        modelNumber = modelMatch[1]
      }

      if (serialMatch && serialMatch[1]) {
        serialNumber = serialMatch[1]
      }

      console.log("Extracted model:", modelNumber, "serial:", serialNumber)

      return NextResponse.json({
        success: true,
        modelNumber,
        serialNumber,
        fullText: extractedText,
      })
    } else {
      throw new Error("No content found in Gemini response or unexpected response structure.")
    }
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
