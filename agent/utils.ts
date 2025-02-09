/**
 * Extracts and parses JSON from a string that might contain additional text
 */
export function parseJSON(text: string): any {
  try {
    // First attempt: try parsing the entire string
    return JSON.parse(text);
  } catch (e) {
    // Second attempt: try to find JSON array in the text
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Error parsing JSON array:", e);
      }
    }

    // Third attempt: try to find multiple JSON objects
    const jsonObjects = text.match(/\{[\s\S]*?\}/g);
    if (jsonObjects) {
      try {
        return jsonObjects.map(obj => JSON.parse(obj));
      } catch (e) {
        console.error("Error parsing JSON objects:", e);
      }
    }

    throw new Error("Could not parse JSON from response");
  }
}