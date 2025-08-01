import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Assuming Vercel KV is used. Adjust import if necessary.
import { kv } from "@vercel/kv";

interface ScanResult {
  modelNumber: string;
  serialNumber: string;
  confidence: string;
  corrections: string;
  scanType: 'barcode' | 'qr' | 'ocr' | 'mixed'; // Ensure scanType matches one of these
  timestamp: string;
}

async function logScanResult(result: ScanResult): Promise<void> {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'scan_log.txt');

    // Ensure logs directory exists
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }

    // Create log entry
    const logEntry = `${result.timestamp} | ${result.modelNumber} | ${result.serialNumber} | ${result.scanType.toUpperCase()} | ${result.corrections.toUpperCase()}\n`;

    // Append to log file
    await fs.appendFile(logFile, logEntry, 'utf8');
    console.log('Scan logged successfully');
  } catch (error) {
    console.error('Failed to write to log file:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

// 🚨 CRITICAL: Ensure your complete prompt text is within these backticks.
// My instructional comment "[!!! YOUR PROVIDED TEXT...!!!]" MUST be replaced with your actual content.
const enhancedPromptText = `You are an expert in interpreting appliance model number tags with advanced OCR error correction.

Your goal is to extract BOTH the MODEL NUMBER and SERIAL NUMBER with the highest possible accuracy by recognizing and correcting various OCR anomalies.

CRITICAL: You must also identify HOW you obtained the information - whether from barcode, QR code, or text OCR.

Key Instructions:
- **Barcode Priority:** Barcode data, when available and clear, is the most reliable source.
- **QR Code Priority:** QR code data is also highly reliable when present.
- **Multi-Type OCR Error Correction:** Handle various types of scanning anomalies beyond simple character ambiguity.
- **Source Identification:** Clearly identify whether data came from barcode, QR code, or OCR text reading.

**SCAN TYPE IDENTIFICATION:**
- BARCODE: Information extracted from traditional barcodes (linear barcodes)
- QR: Information extracted from QR codes or 2D matrix codes
- OCR: Information extracted from reading printed text
- MIXED: Some information from codes, some from text

**COMMON OCR VIOLATIONS TO DETECT AND CORRECT:**

1. **Character Ambiguity:** [O, 0, S, 5, B, 8, 1, I, L, Z, 2, G, 6, C, D] - use pattern knowledge to correct when confident.
   **Mandatory Review Protocol for High-Risk Characters:**
   The following characters are designated as 'High-Risk OCR Characters': [O, 0, S, 5, B, 8, 1, I, L, Z, 2, G, 6, C, D].
   RULE: If your initial OCR process identifies ANY of these High-Risk OCR Characters within the potential Model Number or Serial Number, the following protocol is MANDATORY:
   1. Automatic Flagging: The character(s) and the entire string containing them are to be immediately flagged for 'High-Risk Character Review'.
   2. Override Initial Confidence: For these flagged High-Risk Characters, your initial visual OCR confidence is to be considered insufficient. A deeper validation is required.
   3. Forced Pattern Validation Sequence: You MUST execute the following sequence for each flagged High-Risk Character:
      a. Systematically test plausible alternative interpretations for the flagged character (e.g., if 'B' is flagged, test '8'; if 'O' is flagged, test '0').
      b. Validate each interpretation against all available brand-specific patterns (e.g., Kenmore "111.########", Whirlpool "W" prefixes, etc.) and general alphanumeric structural rules.
      c. The interpretation that creates the strongest valid match with known patterns MUST be selected.
      d. If multiple interpretations yield valid patterns, or if no pattern definitively resolves the ambiguity, this must be noted in the 'Corrections' field or a dedicated 'AmbiguityNotes' field.
   4. This 'Mandatory Review Protocol' is a distinct step that must be performed *before* finalizing the Model Number or Serial Number if High-Risk Characters are present. The 'Corrections' field should reflect if this protocol led to a change.
   **CRITICAL FINAL CHARACTER RULE FOR MODEL NUMBERS:**
   - All appliance model numbers MUST end in a numeric digit (0-9).
   - If the character visually identified at the very end of a model number is the letter 'O', it MUST be corrected to the numeral '0'. This rule takes precedence over initial visual interpretation for the final character if it is an 'O'.

2. **Line Break Violations:** Model numbers split across lines
   - Example: "111. 6126222" should be "111.61262220" 
   - Look for: prefix on one line, continuation below
   - Kenmore pattern: "111.########" often appears as "111. ######" with suffix on next line

3. **Spacing Anomalies:** Extra spaces inserted in model numbers
   - Example: "W OS51 EC0HS20" should be "WOS51EC0HS20"
   - Example: "NE59 M4320SS" should be "NE59M4320SS"
   // - Example: "NE5... [!!! YOUR PROVIDED TEXT FOR THE PROMPT WAS CUT OFF AROUND HERE. PLEASE COMPLETE THE REST OF YOUR PROMPT TEXT AND ENSURE IT ENDS WITH A BACKTICK !!!]" // <-- REPLACE THIS LINE WITH YOUR ACTUAL CONTENT

4. **Missing Decimal Points:** Numbers that should have decimals
   - Example: "11161262220" might need to be "111.61262220" for Kenmore
   - Look for 3-digit prefixes that typically have periods

5. **Character Substitution Errors:** - Dashes interpreted as other characters: "WOS51-EC0HS20" vs "WOS51EC0HS20"
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

1. **Barcode/QR Code First Scan (Highest Priority):**
   * Scan all visible barcodes and QR codes first for both model and serial numbers.
   * If clear barcode or QR code data exists, note this as the source type.

2. **Multi-Line Text Analysis:**
   * Read ALL text on the label, paying attention to line relationships.
   * Look for model number components that may span multiple lines.
   * Check for common split patterns (prefix on one line, suffix below).

3. **Violation Detection and Correction (incorporating Mandatory Review Protocol):**
   * **Line Break Correction:** If you see a 3-digit number with period/space followed by numbers on the next line, consider combining them.
   * **Spacing Removal:** Remove inappropriate spaces within likely model numbers.
   * **Character Correction:** Apply ambiguous character fixes by following the 'Mandatory Review Protocol for High-Risk Characters' and the 'CRITICAL FINAL CHARACTER RULE FOR MODEL NUMBERS'.
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
   Corrections: [NONE/SPACING/LINEBREAK/CHARACTERS/MULTIPLE/AMBIGUOUS_UNRESOLVED]
   ScanType: [BARCODE/QR/OCR/MIXED]

   * SCANTYPE field must indicate the primary source of information:
     - BARCODE: Model/Serial primarily from traditional barcode
     - QR: Model/Serial primarily from QR code
     - OCR: Model/Serial primarily from text reading
     - MIXED: Some data from codes, some from text

   * CORRECTIONS field should indicate what type(s) of corrections were applied:
     - NONE: No corrections needed
     - SPACING: Removed inappropriate spaces
     - LINEBREAK: Combined text from multiple lines
     - CHARACTERS: Fixed ambiguous character substitutions following protocols
     - MULTIPLE: Applied multiple correction types
     - AMBIGUOUS_UNRESOLVED: If a High-Risk Character's ambiguity could not be definitively resolved by patterns.

   * CONFIDENCE levels:
     - HIGH: Clear barcode/QR read OR clear text with minimal corrections not involving High-Risk Characters.
     - MEDIUM: Text required corrections following protocols, and patterns provided a clear resolution.
     - LOW: Multiple corrections applied, pattern uncertain, or High-Risk Character ambiguity remains.

   Examples:
   Model: 111.61262220
   Serial: FT220001234
   Confidence: MEDIUM
   Corrections: LINEBREAK
   ScanType: OCR

   Model: WOS51EC0HS20
   Serial: Not found
   Confidence: HIGH
   Corrections: NONE
   ScanType: BARCODE
\`; // <<< Correctly placed single closing backtick for enhancedPromptText

export async function POST(request: NextRequest) {
  try {
    console.log("Received request to process appliance tag.");

    // Initialize variables for storing extracted data
    let modelNumber: string = "Not found";
    let serialNumber: string = "Not found";
    let confidence: string = "LOW";
    let corrections: string = "NONE";
    let scanType: ScanResult['scanType'] = "ocr"; // Default value

    // --- TODO: Implement your request processing logic here ---
    // This section will depend on how you send data to this API endpoint.
    // For example, if sending JSON with image data:
    // const body = await request.json();
    // const imageData = body.imageData; // Assuming 'imageData' is the key

    // Or if sending FormData (e.g., for file uploads):
    // const formData = await request.formData();
    // const imageFile = formData.get('image') as File | null;
    // if (!imageFile) {
    //   return NextResponse.json({ success: false, message: "No image provided." }, { status: 400 });
    // }
    // Process imageFile (e.g., convert to base64 or buffer to send to AI)

    // --- Placeholder: Call your AI model ---
    // This is where you would send `imageData` (processed from request) 
    // and `enhancedPromptText` to Gemini or another AI model.
    // The AI should return text in the specified "Final Output Structure".
    // For demonstration, we'll use a mock `extractedTextFromAI`. Replace with actual AI call.
    console.log("Simulating AI call with enhancedPromptText...");
    const extractedTextFromAI = `Model: FRT15O3JWO
Serial: BA82123524
Confidence: LOW
Corrections: CHARACTERS
ScanType: OCR`; 
    // --- End AI Call Placeholder ---

    // Parse the AI's response
    const lines = extractedTextFromAI.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().startsWith('model:')) {
        modelNumber = trimmedLine.substring(6).trim();
      } else if (trimmedLine.toLowerCase().startsWith('serial:')) {
        serialNumber = trimmedLine.substring(7).trim();
      } else if (trimmedLine.toLowerCase().startsWith('confidence:')) {
        confidence = trimmedLine.substring(11).trim();
      } else if (trimmedLine.toLowerCase().startsWith('corrections:')) {
        corrections = trimmedLine.substring(12).trim();
      } else if (trimmedLine.toLowerCase().startsWith('scantype:')) {
        const st = trimmedLine.substring(9).trim().toLowerCase();
        if (st === 'barcode' || st === 'qr' || st === 'ocr' || st === 'mixed') {
          scanType = st as ScanResult['scanType'];
        } else {
          scanType = 'ocr'; // fallback to default if invalid
          console.warn(`Invalid ScanType received from AI: "${st}", defaulting to 'ocr'.`);
        }
      }
    }

    console.log("Processed model:", modelNumber);
    console.log("Processed serial:", serialNumber);
    console.log("Confidence level:", confidence);
    console.log("Corrections applied:", corrections);
    console.log("Scan type:", scanType);

    // Prepare data for logging
    const scanDataToLog: ScanResult = {
      modelNumber,
      serialNumber,
      confidence: confidence, // Log the confidence as processed by AI
      corrections: corrections, // Log corrections as processed by AI
      scanType: scanType,       // Log scanType as processed by AI
      timestamp: new Date().toISOString(),
    };
    await logScanResult(scanDataToLog);

    // Increment KV counters (optional, remove if not using Vercel KV)
    try {
      await kv.incr("total_scans");
      await kv.incr(`scans_${confidence.toLowerCase()}`);
      await kv.incr(`corrections_${corrections.toLowerCase()}`);
      await kv.incr(`scantype_${scanType.toLowerCase()}`);
    } catch (kvError) {
      console.error("Failed to increment KV counters:", kvError);
      // Continue even if KV fails
    }

    // Return the successful response
    return NextResponse.json({
      success: true,
      modelNumber,
      serialNumber,
      confidence: confidence.toLowerCase(),
      corrections: corrections.toLowerCase(),
      scanType: scanType.toLowerCase(),
    });

  } catch (error) {
    console.error("Error in /api/scan-appliance POST handler:", error);
    let errorMessage = "An unknown error occurred while processing the scan request.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, message: "Failed to process scan request.", error: errorMessage },
      { status: 500 }
    );
  }
}

// You can also define other HTTP method handlers if your API needs them:
export async function GET() {
  // --- Placeholder: Call your AI model ---
  // This is where you would send imageData (processed from request)
  // to Gemini or another AI model.
  // and enhancedPromptText to Gemini or another AI model.
  // For demonstration, we'll use a mock extractedTextFromAI.
  // For demonstration, we'll use a mock extractedTextFromAI. Replace with actual AI call.
  return NextResponse.json({ message: "Test endpoint working" });
}