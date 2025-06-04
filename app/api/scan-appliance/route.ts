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

    // Using gemini-1.5-flash model
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    // Updated prompt to extract both model and serial numbers with proper ambiguity handling
    const currentPromptText = `You are an expert in interpreting appliance model number tags.

Your goal is to extract BOTH the MODEL NUMBER and SERIAL NUMBER with the highest possible accuracy.

Key Instructions:
- **Barcode Priority:** Barcode data, when available and clear, is the most reliable source.
- **Model Number Ambiguity Handling:** For model numbers extracted from PRINTED TEXT containing ambiguous characters, use pattern-based analysis but avoid assumptions that certain characters are "always wrong."
- **Ambiguous Characters List:** [O, 0, S, 5, B, 8, 1, I, L, Z, 2, G, 6, C, D] — these require careful analysis when found in model numbers from printed text.

Follow these steps:

1. **Barcode First Scan (Highest Priority):**
   * Thoroughly scan all visible barcodes and QR codes first.
   * If barcodes clearly provide the model number and/or serial number, prioritize these values.
   * If multiple barcodes offer conflicting information, use your best judgment based on clarity and common label layouts.

2. **Printed Text Scan (If Not Found in Barcode):**
   * If the model number or serial number is not found in barcodes, then scan the printed text on the label.
   * Focus on text near keywords indicating a model number: "MODEL", "MOD", "M", or similar identifiers.
   * Focus on text near keywords indicating a serial number: "SERIAL", "SER", "S/N", "SN", or similar identifiers.
   * During this initial scan of printed text for the model number, make your best guess for each character. Internally flag any characters that fall into the 'Ambiguous Characters List' above.

3. **Pattern-Based Analysis for Ambiguous Characters in Model Number:**
   * This step applies ONLY if the MODEL NUMBER was derived from printed text AND contains ANY characters from the ambiguous list [O, 0, S, 5, B, 8, 1, I, L, Z, 2, G, 6, C, D].
   * **Critical Rule:** Do NOT assume any character is "always wrong" - both letters and numbers can be valid in different model number formats.
   * **Pattern-Based Correction Approach:**
     - **High Confidence Corrections:** Only when appliance nomenclature patterns can definitively determine the correct character (e.g., S/5 ambiguity where the pattern clearly indicates only numbers are valid in that specific position for that brand/format).
     - **Low Confidence Situations:** When patterns cannot definitively rule out either option (e.g., I vs L, or O vs 0 where both could be valid), make your best visual assessment but do NOT force changes just for the sake of changing.
     - **Examples:**
       * If 'WOS51EC0HS2S' and you know this Whirlpool format ends in numbers, and the final 'S' is clearly meant to be '5', then correct it.
       * If 'MODEL3I7' and both 'I' and 'L' could be valid letters in that position, make your best judgment without forcing a change.
       * If 'ABC12O34' and both 'O' and '0' are commonly used in that position for this brand, choose based on visual clarity, not assumptions.

4. **Apply Fixed Pattern Rule for Model Numbers:**
   * If a model number begins with a three-digit prefix (e.g., 110, 417, 795), this is only a prefix and not a complete model. Always look for additional characters after the prefix, whether or not a period is present. If no additional characters are found after such a prefix, return "Not found" for the model number.

5. **Final Output Structure:**
   * Your response must be in EXACTLY this format:
   Model: [MODEL_NUMBER]
   Serial: [SERIAL_NUMBER]
   
   * Replace [MODEL_NUMBER] with the actual model number you determined (after any pattern-based analysis), or "Not found" if no model number could be determined.
   * Replace [SERIAL_NUMBER] with the actual serial number you found, or "Not found" if no serial number could be determined.
   * Do NOT include any other text, explanations, or formatting beyond this exact structure.
   
   Examples:
   Model: WOS51EC0HS25
   Serial: FT220001234
   
   Or if not found:
   Model: Not found
   Serial: Not found`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: currentPromptText,
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

    console.log("Gemini prompt being sent (Model and Serial Number Extraction):", requestBody.contents[0].parts[0].text)
    console.log("Sending request to Gemini API...")

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
        { status: response.status },
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
      const extractedText = data.candidates[0].content.parts[0].text.trim();
      console.log("Extracted text from Gemini:", extractedText);

      let modelNumber = "Not found";
      let serialNumber = "Not found";

      // Parse the structured response
      const lines = extractedText.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().startsWith('model:')) {
          modelNumber = trimmedLine.substring(6).trim(); // Remove "Model:" prefix
        } else if (trimmedLine.toLowerCase().startsWith('serial:')) {
          serialNumber = trimmedLine.substring(7).trim(); // Remove "Serial:" prefix
        }
      }

      console.log("Processed model:", modelNumber);
      console.log("Processed serial:", serialNumber);
      
      // Increment the scan counter
      try {
        await kv.incr("total_scans")
      } catch (error) {
        console.error("Failed to increment scan counter:", error)
      }

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
