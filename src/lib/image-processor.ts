/**
 * WordPress Image Processor
 * Downloads images from WordPress at build time and rewrites URLs to local paths
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import * as http from 'node:http';
import { createHash } from 'node:crypto';

// Configuration
const WORDPRESS_DOMAIN = import.meta.env.WORDPRESS_API_URL?.replace('/wp-json/wp/v2', '') || '';
const LOCAL_IMAGE_DIR = 'public/wp-images';
const LOCAL_IMAGE_PATH = '/wp-images';

// Track processed images to avoid duplicates
const processedImages = new Map<string, string>();

/**
 * Extract all image URLs from HTML content
 */
export function extractImageUrls(html: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  const urls: string[] = [];

  // Extract src attributes
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }

  // Extract srcset URLs
  while ((match = srcsetRegex.exec(html)) !== null) {
    if (match[1]) {
      const srcsetUrls = match[1].split(',').map(s => s.trim().split(' ')[0]);
      urls.push(...srcsetUrls);
    }
  }

  // Also check for background images in style attributes
  const styleRegex = /style=["'][^"']*url\(["']?([^"')]+)["']?\)[^"']*["']/gi;
  while ((match = styleRegex.exec(html)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }

  // Filter to only WordPress URLs and remove duplicates
  const wordpressDomain = WORDPRESS_DOMAIN.replace(/^https?:\/\//, '');
  return [...new Set(urls)].filter(url => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === wordpressDomain || 
             url.includes('/wp-content/uploads/');
    } catch {
      return false;
    }
  });
}

/**
 * Generate a unique filename for an image based on its URL
 */
function generateLocalFilename(url: string): string {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // Extract the original filename
  const originalFilename = path.basename(pathname);
  
  // Create a hash of the full URL to ensure uniqueness
  const hash = createHash('md5').update(url).digest('hex').substring(0, 8);
  
  // Get file extension
  const ext = path.extname(originalFilename) || '.jpg';
  const nameWithoutExt = path.basename(originalFilename, ext);
  
  return `${nameWithoutExt}-${hash}${ext}`;
}

/**
 * Download an image from a URL
 */
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, destPath).then(resolve);
          return;
        }
      }

      if (response.statusCode !== 200) {
        console.warn(`Failed to download image: ${url} (status: ${response.statusCode})`);
        resolve(false);
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {}); // Delete partial file
        console.warn(`Error writing image: ${destPath}`, err);
        resolve(false);
      });
    });

    request.on('error', (err) => {
      console.warn(`Error downloading image: ${url}`, err);
      resolve(false);
    });

    // Set timeout
    request.setTimeout(30000, () => {
      request.destroy();
      console.warn(`Timeout downloading image: ${url}`);
      resolve(false);
    });
  });
}

/**
 * Ensure the local image directory exists
 */
function ensureImageDir(): void {
  const dir = path.resolve(process.cwd(), LOCAL_IMAGE_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Process a single image URL - download if needed and return local path
 */
export async function processImageUrl(url: string): Promise<string> {
  // Check if already processed
  if (processedImages.has(url)) {
    return processedImages.get(url)!;
  }

  // Ensure directory exists
  ensureImageDir();

  // Generate local filename
  const localFilename = generateLocalFilename(url);
  const localPath = `${LOCAL_IMAGE_PATH}/${localFilename}`;
  const fullPath = path.resolve(process.cwd(), LOCAL_IMAGE_DIR, localFilename);

  // Check if file already exists (from previous build)
  if (fs.existsSync(fullPath)) {
    processedImages.set(url, localPath);
    return localPath;
  }

  // Download the image
  const success = await downloadImage(url, fullPath);
  
  if (success) {
    processedImages.set(url, localPath);
    console.log(`Downloaded: ${url} -> ${localPath}`);
    return localPath;
  }

  // If download failed, return original URL
  console.warn(`Using original URL for: ${url}`);
  return url;
}

/**
 * Process all images in HTML content
 * Downloads images and rewrites URLs to local paths
 */
export async function processContentImages(html: string): Promise<string> {
  if (!html || !WORDPRESS_DOMAIN) {
    return html;
  }

  const imageUrls = extractImageUrls(html);
  
  if (imageUrls.length === 0) {
    return html;
  }

  let processedHtml = html;

  // Process all images in parallel
  const urlMappings = await Promise.all(
    imageUrls.map(async (url) => {
      const localPath = await processImageUrl(url);
      return { original: url, local: localPath };
    })
  );

  // Replace URLs in content
  for (const { original, local } of urlMappings) {
    if (original !== local) {
      // Escape special regex characters in the URL
      const escapedUrl = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedHtml = processedHtml.replace(new RegExp(escapedUrl, 'g'), local);
    }
  }

  return processedHtml;
}

/**
 * Process featured image URL
 */
export async function processFeaturedImage(url: string | undefined): Promise<string | undefined> {
  if (!url || !WORDPRESS_DOMAIN) {
    return url;
  }

  // Check if it's a WordPress URL
  const wordpressDomain = WORDPRESS_DOMAIN.replace(/^https?:\/\//, '');
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== wordpressDomain && !url.includes('/wp-content/uploads/')) {
      return url;
    }
  } catch {
    return url;
  }

  return processImageUrl(url);
}

/**
 * Clear the processed images cache (useful for fresh builds)
 */
export function clearImageCache(): void {
  processedImages.clear();
}

/**
 * Get statistics about processed images
 */
export function getImageStats(): { total: number; urls: string[] } {
  return {
    total: processedImages.size,
    urls: Array.from(processedImages.keys()),
  };
}
