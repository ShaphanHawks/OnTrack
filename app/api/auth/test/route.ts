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
  scanType: 'barcode' | 'qr' | 'ocr' | 'mixed';
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
   - Example: "NE5
