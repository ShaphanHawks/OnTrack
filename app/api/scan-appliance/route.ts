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

    // Refined prompt focusing only on Model Number extraction, with strong ambiguity handling and direct output
    const currentPromptText = \`You are an expert in interpreting appliance model number tags.

Your sole goal is to extract ONLY the complete MODEL NUMBER with the highest possible accuracy.

Key Instructions:
-   **Barcode Priority:** Barcode data, when available and clear for the model number, is the most reliable source.
-   **Model Number Scrubbing for Ambiguity:** For model numbers extracted from PRINTED TEXT containing ambiguous characters (from the list below), use your knowledge of common appliance model number formats and patterns to help correct ONLY those identified ambiguous characters.
-   **Ambiguous Characters List for Model Numbers:** [O, 0, S, 5, B, 8, 1, I, L, Z, 2, G, 6, C, D] — if you detect any of these in the model number from printed text, they require special attention and correction based on nomenclature.

Follow these steps:

1.  **Barcode First Scan for Model Number (Highest Priority):**
    * Thoroughly scan all visible barcodes and QR codes first.
    * If a barcode clearly provides the model number, prioritize this value. This is the preferred source.
    * If multiple barcodes offer conflicting model number information, use your best judgment based on clarity and common label layouts.
    * If the model number is confidently found in a barcode, use this value and proceed directly to Step 4 (Apply Mandatory Fixed Pattern Rule).

2.  **Printed Text Scan for Model Number (If Not Found in Barcode):**
    * If the model number is not found in barcodes (or if barcodes are absent, unreadable, or unclear), then scan the printed text on the label.
    * Focus on text near keywords indicating a model number, such as "MODEL", "MOD", "M", or similar identifiers.
    * During this initial scan of printed text for the model number, make your best guess for each character. Internally flag any characters that fall into the 'Ambiguous Characters List' above.

3.  **Mandatory Correction of Ambiguous Characters in MODEL NUMBER from Printed Text:**
    * This step applies ONLY if:
        a. The MODEL NUMBER was derived from printed text (as per Step 2).
        b. AND your initial scan (Step 2) flagged one or more characters within it as belonging to the 'Ambiguous Characters List'.
    * If both conditions (a and b) are met, **YOU MUST ASSUME THE INITIAL SCAN OF THESE FLAGGED AMBIGUOUS CHARACTERS IS POTENTIALLY FAULTY.** Your primary task is now to determine the correct character for each flagged ambiguous position by:
        i.  Strictly adhering to **KNOWN APPLIANCE MODEL NOMENCLATURE AND PATTERNS** for the overall model number structure and for specific segments within it.
        ii. **EXTRAPOLATING** the correct character as necessary based on these established nomenclatures and patterns, considering visual similarity as a secondary factor when multiple characters fit the pattern.
    * **For example:** If an initial scan yields a model number like 'WOS51EC0HS2O' and you've flagged the final 'O' as ambiguous from the list:
        * If your knowledge of this specific model number format (e.g., for a Whirlpool oven nomenclature) indicates it **NEVER ends in a letter**, you must conclude the character is a digit.
        * Then, considering that the ambiguous character 'O' visually resembles '0', and if that particular model format often ends in digits like '0', '1', or '2', you should **extrapolate with high confidence that the final character is '0'**, thereby correcting the model number to 'WOS51EC0HS20'.
    * The goal is to output a model number that is both visually plausible for the ambiguous characters AND strictly conforms to known valid structural patterns of appliance model numbers. Correct only the characters that were initially flagged as ambiguous from the list.
    * If the model number was derived from printed text but contained NO characters flagged as ambiguous from your list during the initial scan (Step 2), then trust that initial interpretation (it will still be checked by Step 4: Apply Mandatory Fixed Pattern Rule).

4.  **Apply Mandatory Fixed Pattern Rule for ALL Model Numbers (Final Structural Check):**
    * "If a model number begins with a three-digit prefix (e.g., 110, 417, 795), this is only a prefix and not a complete model. Always look for additional characters after the prefix, whether or not a period is present. If no additional characters are found after such a prefix, return "Not found" for the model number."
    * This rule applies to the model number obtained from either barcodes (Step 1) or printed text (after any Step 3 scrubbing).

5.  **Final Output Structure:**
    * Your entire response should be ONLY the determined model number string itself.
    * For example, if the model number is "ABC-123", your entire output MUST be: \`ABC-123\`
    * If, after all steps, the model number cannot be confidently determined, your entire output MUST be the exact string: \`Not found\`
    * **Crucially, do NOT include any labels like "Model:", "Serial:", or any other explanatory text, formatting, or markdown in your output.** Only the raw model number string or the "Not found" string.
\`;

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

    console.log("Gemini prompt being sent (Model Number Focused, Direct Output):", requestBody.contents[0].parts[0].text)
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
          error: \`API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ""}\`,
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
      console.log("Extracted text (direct from Gemini, model focused):", extractedText);

      let modelNumber = "Not found";
      const serialNumber = "Not found"; // Serial number is not requested from Gemini in this prompt

      if (extractedText && extractedText.toLowerCase() !== "not found") {
        modelNumber = extractedText;
      } else if (extractedText && extractedText.toLowerCase() === "not found") {
        // This case handles if Gemini explicitly returns "Not found" as the model number
        modelNumber = "Not found"; 
      }
      // If extractedText is empty or something else, modelNumber remains "Not found"

      console.log("Processed model:", modelNumber);
      
      // Increment the scan counter
      try {
        await kv.incr("total_scans")
      } catch (error) {
        console.error("Failed to increment scan counter:", error)
      }

      return NextResponse.json({
        success: true,
        modelNumber,
        serialNumber, // Keep the field for frontend compatibility, will likely be "Not found"
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
