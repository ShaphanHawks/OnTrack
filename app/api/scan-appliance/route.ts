import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

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
              text: `[Prompt v3] You are an expert in interpreting appliance model and serial number tags.

Your goal is to extract exactly two values from the image:
1. The complete model number  
2. The complete serial number

Follow these steps:

1. Start with barcodes:
   - Scan all visible barcodes or QR codes in the image.
   - Some barcodes may contain only the model number, some only the serial number, and some may contain both.
   - If a barcode contains both, separate them using your understanding of common appliance model and serial formats.
   - Continue scanning until you find both a model and a serial number, or until you have checked all barcodes.

2. If either value is not found in a barcode, fall back to printed text:
   - Look near labels like "MODEL", "MOD", "SERIAL", or "SN".
   - Avoid confusing these with part numbers, manufacturing codes, or regulatory IDs.

3. Apply this fixed pattern rule:
   - If a model number begins with a three-digit prefix (e.g., 110, 417, 795), this is only a prefix and not a complete model.
   - Always look for additional characters after the prefix, whether or not a period is present.
   - If no additional characters are found, return "Not found" for the model number.

4. Handle visual ambiguity:
   Some characters may be difficult to distinguish due to font style, lighting, or distortion. These include:
   O, 0, S, 5, B, 8, 1, I, L, Z, 2, G, 6, C, D
   Use visual cues, label structure, and known model or serial number formats to determine the most likely character.

5. Apply correction logic:
   If a character or value appears incomplete, invalid, or structurally inconsistent based on typical appliance label formats, refine your answer using pattern reasoning rather than returning a partial or incorrect value.

Return only:
Model: [MODEL_NUMBER]
Serial: [SERIAL_NUMBER]`,
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
        temperature: 0.0,
        maxOutputTokens: 256,
      },
    }

    // Log the prompt text for verification
    console.log("Gemini prompt being sent:", requestBody.contents[0].parts[0].text)

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
      const modelMatch = extractedText.match(/Model:[\s]*([A-Za-z0-9-/]+)/i)

      // Try to find "Serial Number:" or "S/N:" or "Serial:" (case-insensitive)
      const serialMatch = extractedText.match(/Serial:[\s]*([A-Za-z0-9-]+)/i)

      if (modelMatch && modelMatch[1]) {
        modelNumber = modelMatch[1]
      }

      if (serialMatch && serialMatch[1]) {
        serialNumber = serialMatch[1]
      }

      console.log("Extracted model:", modelNumber, "serial:", serialNumber)

      // Increment the scan counter
      try {
        await kv.incr("total_scans")
      } catch (error) {
        console.error("Failed to increment scan counter:", error)
        // Continue with the response even if counter increment fails
      }

      // Only return the extracted model and serial numbers, not the full text
      return NextResponse.json({
        success: true,
        modelNumber,
        serialNumber,
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
