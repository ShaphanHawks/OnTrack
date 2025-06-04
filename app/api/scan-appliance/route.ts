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

    // Updated prompt to handle multiple types of OCR violations and anomalies
    const currentPromptText = `You are an expert in interpreting appliance model number tags with advanced OCR error correction.

Your goal is to extract BOTH the MODEL NUMBER and SERIAL NUMBER with the highest possible accuracy by recognizing and correcting various OCR anomalies.

Key Instructions:
- **Barcode Priority:** Barcode data, when available and clear, is the most reliable source.
- **Multi-Type OCR Error Correction:** Handle various types of scanning anomalies beyond simple character ambiguity.

**COMMON OCR VIOLATIONS TO DETECT AND CORRECT:**

1. **Character Ambiguity:** [O, 0, S, 5, B, 8, 1, I, L, Z, 2, G, 6, C, D] - use pattern knowledge to correct when confident.

2. **Line Break Violations:** Model numbers split across lines
   - Example: "111. 6126222" should be "111.61262220" 
   - Look for: prefix on one line, continuation below
   - Kenmore pattern: "111.########" often appears as "111. ######" with suffix on next line

3. **Spacing Anomalies:** Extra spaces inserted in model numbers
   - Example: "W OS51 EC0HS20" should be "WOS51EC0HS20"
   - Example: "NE59 M4320SS" should be "NE59M4320SS"

4. **Missing Decimal Points:** Numbers that should have decimals
   - Example: "11161262220" might need to be "111.61262220" for Kenmore
   - Look for 3-digit prefixes that typically have periods

5. **Character Substitution Errors:** 
   - Dashes interpreted as other characters: "WOS51-EC0HS20" vs "WOS51EC0HS20"
   - Periods as commas or other punctuation
   - Letters as numbers in unexpected positions

6. **Incomplete Scans:** Partial model numbers due to poor image quality
   - Look for obvious truncation patterns
   - Check if visible portion matches known prefixes

7. **Case Sensitivity Issues:** All caps vs mixed case interpretation

**BRAND-SPECIFIC VIOLATION PATTERNS:**
- **Kenmore:** Frequently "111.########" appears as "111. #######" (missing final digit on second line)
- **Whirlpool:** "W" prefix sometimes read as "VV" or split
- **GE:** Letter-number boundaries often have spacing issues

Follow these steps:

1. **Barcode First Scan (Highest Priority):**
   * Scan all visible barcodes and QR codes first for both model and serial numbers.
   * If clear barcode data exists, use it and proceed to final validation.

2. **Multi-Line Text Analysis:**
   * Read ALL text on the label, paying attention to line relationships.
   * Look for model number components that may span multiple lines.
   * Check for common split patterns (prefix on one line, suffix below).

3. **Violation Detection and Correction:**
   * **Line Break Correction:** If you see a 3-digit number with period/space followed by numbers on the next line, consider combining them.
   * **Spacing Removal:** Remove inappropriate spaces within likely model numbers.
   * **Character Correction:** Apply ambiguous character fixes only when pattern-confident.
   * **Decimal Addition:** For Kenmore-style numbers, add missing decimal if pattern suggests it.
   * **Completion:** If a model appears truncated but you can see a clear pattern, note the incomplete status.

4. **Pattern Validation:**
   * Validate corrected model numbers against known brand patterns.
   * Cross-check that corrections make logical sense for the detected brand.

5. **Final Output Structure:**
   * Your response must be in EXACTLY this format:
   Model: [MODEL_NUMBER]
   Serial: [SERIAL_NUMBER]
   Confidence: [HIGH/MEDIUM/LOW]
   Corrections: [NONE/SPACING/LINEBREAK/CHARACTERS/MULTIPLE]
   
   * CORRECTIONS field should indicate what type(s) of corrections were applied:
     - NONE: No corrections needed
     - SPACING: Removed inappropriate spaces
     - LINEBREAK: Combined text from multiple lines
     - CHARACTERS: Fixed ambiguous character substitutions
     - MULTIPLE: Applied multiple correction types
   
   * CONFIDENCE levels:
     - HIGH: Clear barcode read OR clear text with minimal corrections
     - MEDIUM: Text required corrections but pattern-confident
     - LOW: Multiple corrections applied or pattern uncertain
   
   Examples:
   Model: 111.61262220
   Serial: FT220001234
   Confidence: MEDIUM
   Corrections: LINEBREAK
   
   Model: WOS51EC0HS20
   Serial: Not found
   Confidence: HIGH
   Corrections: NONE`;

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
      let confidence = "LOW"; // default
      let corrections = "NONE"; // default
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().startsWith('model:')) {
          modelNumber = trimmedLine.substring(6).trim(); // Remove "Model:" prefix
        } else if (trimmedLine.toLowerCase().startsWith('serial:')) {
          serialNumber = trimmedLine.substring(7).trim(); // Remove "Serial:" prefix
        } else if (trimmedLine.toLowerCase().startsWith('confidence:')) {
          confidence = trimmedLine.substring(11).trim(); // Remove "Confidence:" prefix
        } else if (trimmedLine.toLowerCase().startsWith('corrections:')) {
          corrections = trimmedLine.substring(12).trim(); // Remove "Corrections:" prefix
        }
      }

      console.log("Processed model:", modelNumber);
      console.log("Processed serial:", serialNumber);
      console.log("Confidence level:", confidence);
      console.log("Corrections applied:", corrections);
      
      // Increment the scan counter with detailed tracking
      try {
        await kv.incr("total_scans")
        // Track confidence levels
        await kv.incr(`scans_${confidence.toLowerCase()}`)
        // Track correction types
        await kv.incr(`corrections_${corrections.toLowerCase()}`)
      } catch (error) {
        console.error("Failed to increment scan counter:", error)
      }

      return NextResponse.json({
        success: true,
        modelNumber,
        serialNumber,
        confidence: confidence.toLowerCase(),
        corrections: corrections.toLowerCase(),
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
