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

    // Convert the file to a byte array
    const imageBytes = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(imageBytes).toString("base64")

    // Direct API call to Gemini 1.5 Flash
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    // Prepare the request payload
    const payload = {
      contents: [
        {
          parts: [
            {
              text: "Please extract and return ONLY the model number and serial number from this appliance tag image. Format your response exactly like this example:\nModel: ABC123\nSerial: XYZ789\nIf you can't find one or both numbers, indicate with 'Not found'.",
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
    }

    console.log("Sending request to Gemini API...")

    // Make the API request
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", response.status, errorText)
      return NextResponse.json(
        {
          success: false,
          error: `Gemini API error: ${response.status} ${response.statusText}. Details: ${errorText}`,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("Gemini API response:", JSON.stringify(data))

    // Extract the text from the response
    let text = ""
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      text = data.candidates[0].content.parts[0].text
    } else {
      return NextResponse.json({ success: false, error: "Unexpected response format from Gemini API" }, { status: 500 })
    }

    console.log("Extracted text:", text)

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
