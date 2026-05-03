/**
 * URL Shortener using TinyURL API
 * Free, no API key required
 * API: https://tinyurl.com/api-create.php?url=YOUR_URL
 */

export async function shortenUrl(longUrl: string): Promise<string> {
  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
    );
    
    if (!response.ok) {
      console.error('[URL Shortener] TinyURL API error:', response.status);
      return longUrl; // Fallback to original URL
    }
    
    const shortUrl = await response.text();
    
    // Validate that we got a valid URL back
    if (shortUrl && shortUrl.startsWith('http')) {
      console.log('[URL Shortener] Successfully shortened URL:', shortUrl);
      return shortUrl.trim();
    }
    
    console.warn('[URL Shortener] Invalid response from TinyURL, using original URL');
    return longUrl;
  } catch (error) {
    console.error('[URL Shortener] Error shortening URL:', error);
    return longUrl; // Fallback to original URL on error
  }
}

/**
 * Batch shorten multiple URLs
 */
export async function shortenUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(url => shortenUrl(url)));
}
