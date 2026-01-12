/**
 * OpenAI Vision Prompt for Call Log Screenshot Extraction
 */

export const CALL_LOG_EXTRACTION_PROMPT = `You are analyzing a phone call log screenshot (from Verizon app or iPhone Recents). Extract all visible call entries and return as valid JSON.

IMPORTANT RULES:
1. Extract EVERY call entry visible in the screenshot
2. Convert call durations to total SECONDS (e.g., "5m 32s" = 332, "1h 2m" = 3720)
3. Phone numbers should include area code when visible
4. For dates, use ISO 8601 format (YYYY-MM-DDTHH:MM:SS)
5. If a field is unclear or not visible, set it to null
6. Return ONLY valid JSON with no markdown formatting

CALL DIRECTION DETECTION:
- "Outgoing" / arrow pointing right / phone icon pointing out → "outgoing"
- "Incoming" / arrow pointing left / phone icon pointing in → "incoming"
- "Missed" / red color / "X" icon / no duration → "missed"
- If missed, duration should be 0

REQUIRED JSON STRUCTURE:
{
  "source": "verizon" | "iphone" | "unknown",
  "calls": [
    {
      "phoneNumber": "string or null",
      "contactName": "string or null",
      "dateTime": "ISO 8601 string or null",
      "durationSeconds": number or null,
      "direction": "incoming" | "outgoing" | "missed" | null
    }
  ],
  "dateRange": {
    "start": "YYYY-MM-DD or null",
    "end": "YYYY-MM-DD or null"
  },
  "totalCallsVisible": number,
  "confidence": 0.0-1.0
}

PHONE NUMBER FORMATTING:
- Keep numbers as seen, include +1 if shown
- Remove parentheses and dashes for consistency: "5551234567"
- If contact name is shown instead of number, try to find the number too

EXAMPLES:
- "Mom, 5m 32s, Outgoing, Today 2:30 PM" →
  { "contactName": "Mom", "durationSeconds": 332, "direction": "outgoing", "dateTime": "2025-01-02T14:30:00" }

- "602-555-1234, Missed, Yesterday" →
  { "phoneNumber": "6025551234", "durationSeconds": 0, "direction": "missed" }

- "Work, 1h 15m, Incoming" →
  { "contactName": "Work", "durationSeconds": 4500, "direction": "incoming" }

Now analyze the screenshot and extract all call data:`;

/**
 * Build the OpenAI API message array for vision request
 */
export function buildVisionMessages(imageBase64: string, mimeType: string = 'image/png') {
  return [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: CALL_LOG_EXTRACTION_PROMPT,
        },
        {
          type: 'image_url' as const,
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
            detail: 'high' as const,
          },
        },
      ],
    },
  ];
}

/**
 * Parse the LLM response JSON, handling potential formatting issues
 */
export function parseExtractionResponse(response: string): Record<string, unknown> | null {
  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // Fall through to next attempt
      }
    }

    // Try to find JSON object in response
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Give up
      }
    }

    console.error('Failed to parse LLM response:', response);
    return null;
  }
}

/**
 * Merge multiple extraction results into a single combined result
 * Deduplicates calls based on phone number + dateTime
 */
export function mergeExtractions(
  extractions: Array<Record<string, unknown>>
): Record<string, unknown> {
  if (extractions.length === 0) {
    return {
      source: 'unknown',
      calls: [],
      dateRange: null,
      totalCallsVisible: 0,
      confidence: 0,
    };
  }

  if (extractions.length === 1) {
    return extractions[0];
  }

  // Merge all calls, deduplicating
  const callMap = new Map<string, Record<string, unknown>>();
  let source = 'unknown';
  let minDate: string | null = null;
  let maxDate: string | null = null;
  let totalConfidence = 0;

  for (const extraction of extractions) {
    // Track source (prefer verizon > iphone > unknown)
    if (extraction.source === 'verizon') source = 'verizon';
    else if (extraction.source === 'iphone' && source !== 'verizon') source = 'iphone';

    // Merge calls
    const calls = extraction.calls as Array<Record<string, unknown>> || [];
    for (const call of calls) {
      const key = `${call.phoneNumber || call.contactName}-${call.dateTime}`;
      if (!callMap.has(key)) {
        callMap.set(key, call);
      }
    }

    // Track date range
    const dateRange = extraction.dateRange as { start?: string; end?: string } | null;
    if (dateRange?.start) {
      if (!minDate || dateRange.start < minDate) minDate = dateRange.start;
    }
    if (dateRange?.end) {
      if (!maxDate || dateRange.end > maxDate) maxDate = dateRange.end;
    }

    // Average confidence
    totalConfidence += (extraction.confidence as number) || 0;
  }

  const calls = Array.from(callMap.values());

  return {
    source,
    calls,
    dateRange: minDate || maxDate ? { start: minDate, end: maxDate } : null,
    totalCallsVisible: calls.length,
    confidence: totalConfidence / extractions.length,
  };
}

/**
 * Validate and normalize a single call entry
 */
export function normalizeCallEntry(call: Record<string, unknown>): Record<string, unknown> | null {
  // Must have at least a phone number or contact name
  if (!call.phoneNumber && !call.contactName) {
    return null;
  }

  // Normalize phone number
  let phoneNumber = call.phoneNumber as string | null;
  if (phoneNumber) {
    // Remove non-digits except leading +
    const hasPlus = phoneNumber.startsWith('+');
    phoneNumber = phoneNumber.replace(/\D/g, '');
    if (hasPlus) phoneNumber = '+' + phoneNumber;
  }

  // Validate direction
  const validDirections = ['incoming', 'outgoing', 'missed'];
  let direction = call.direction as string | null;
  if (direction && !validDirections.includes(direction)) {
    direction = null;
  }

  // Ensure missed calls have 0 duration
  let durationSeconds = call.durationSeconds as number | null;
  if (direction === 'missed') {
    durationSeconds = 0;
  }

  return {
    phoneNumber,
    contactName: call.contactName || null,
    dateTime: call.dateTime || null,
    durationSeconds: durationSeconds ?? null,
    direction,
  };
}
