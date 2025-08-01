// Add these imports at the top of your existing file
import { promises as fs } from 'fs'
import path from 'path'

// Add this interface near the top after your existing imports
interface ScanResult {
  modelNumber: string
  serialNumber: string
  confidence: string
  corrections: string
  scanType: 'barcode' | 'qr' | 'ocr' | 'mixed'
  timestamp: string
}

// Add this logging function - place it before your main POST function
async function logScanResult(result: ScanResult): Promise<void> {
  try {
    const logDir = path.join(process.cwd(), 'logs')
    const logFile = path.join(logDir, 'scan_log.txt')

    // Ensure logs directory exists
    try {
      await fs.access(logDir)
    } catch {
      await fs.mkdir(logDir, { recursive: true })
    }

    // Create log entry
    const logEntry = `${result.timestamp} | ${result.modelNumber} | ${result.serialNumber} | ${result.scanType.toUpperCase()} | ${result.corrections.toUpperCase()}\n`

    // Append to log file
    await fs.appendFile(logFile, logEntry, 'utf8')
    console.log('Scan logged successfully')
  } catch (error) {
    console.error('Failed to write to log file:', error)
    // Don't throw - logging failure shouldn't break the main flow
  }
}

// REPLACE your existing prompt with this enhanced version that explicitly asks for scan type detection:
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

1. **Barcode/QR Code First Scan (Highest Priority):**
   * Scan all visible barcodes and QR codes first for both model and serial numbers.
   * If clear barcode or QR code data exists, note this as the source type.

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
     - CHARACTERS: Fixed ambiguous character substitutions
     - MULTIPLE: Applied multiple correction types

   * CONFIDENCE levels:
     - HIGH: Clear barcode/QR read OR clear text with minimal corrections
     - MEDIUM: Text required corrections but pattern-confident
     - LOW: Multiple corrections applied or pattern uncertain

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
   ScanType: BARCODE`;

// MODIFY your response parsing section to extract the new scanType field:
// Replace the existing parsing loop with this enhanced version:

const lines = extractedText.split('\n');
let confidence = "LOW"; // default
let corrections = "NONE"; // default
let scanType = "OCR"; // default

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
    scanType = trimmedLine.substring(9).trim();
  }
}

console.log("Processed model:", modelNumber);
console.log("Processed serial:", serialNumber);
console.log("Confidence level:", confidence);
console.log("Corrections applied:", corrections);
console.log("Scan type:", scanType);

// CREATE scan result object for logging
const scanResult: ScanResult = {
  modelNumber,
  serialNumber,
  confidence: confidence.toLowerCase(),
  corrections: corrections.toLowerCase(),
  scanType: scanType.toLowerCase() as 'barcode' | 'qr' | 'ocr' | 'mixed',
  timestamp: new Date().toISOString()
};

// LOG the scan result
await logScanResult(scanResult);

// MODIFY your existing KV tracking to include scan type:
try {
  await kv.incr("total_scans")
  await kv.incr(`scans_${confidence.toLowerCase()}`)
  await kv.incr(`corrections_${corrections.toLowerCase()}`)
  await kv.incr(`scantype_${scanType.toLowerCase()}`) // NEW: Track scan types
} catch (error) {
  console.error("Failed to increment scan counter:", error)
}

// MODIFY your return statement to include scanType:
    return NextResponse.json({
      success: true,
      modelNumber,
      serialNumber,
      confidence: confidence.toLowerCase(),
      corrections: corrections.toLowerCase(),
      scanType: scanType.toLowerCase() // NEW: Include scan type in response
    });