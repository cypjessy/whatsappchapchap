// URL Shortener for order links
// Creates short, memorable links for WhatsApp messages

const URL_SHORTENER_KEY = process.env.URL_SHORTENER_KEY || '';
const URL_SHORTENER_API = process.env.URL_SHORTENER_API || '';

/**
 * Shorten a long URL using an external service
 * Returns a short URL like: https://short.link/abc123
 */
export async function shortenURL(longURL: string): Promise<string> {
  try {
    // If no API configured, return original URL
    if (!URL_SHORTENER_API || !URL_SHORTENER_KEY) {
      return longURL;
    }

    const response = await fetch(URL_SHORTENER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${URL_SHORTENER_KEY}`,
      },
      body: JSON.stringify({
        url: longURL,
      }),
    });

    if (!response.ok) {
      console.error('[URL Shortener] API error:', response.status);
      return longURL; // Fallback to original
    }

    const data = await response.json();
    return data.shortUrl || data.short_url || longURL;
  } catch (error) {
    console.error('[URL Shortener] Error:', error);
    return longURL; // Fallback to original
  }
}

/**
 * Format order link for WhatsApp with vibrant styling
 * Returns a formatted string with emojis and clickable link
 */
export function formatOrderLink(orderLink: string, shortUrl?: string): string {
  const displayUrl = shortUrl || orderLink;
  
  // WhatsApp button-style format with vibrant emojis
  return `\n🛒 *ORDER NOW:* ${displayUrl}`;
}

/**
 * Create a short product code for manual entry (fallback)
 * Example: "ORD-ABC123"
 */
export function generateProductCode(productId: string): string {
  // Create a short code from product ID
  const hash = productId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
  return `ORD-${code}`;
}
