// Image optimization utilities for TRIPPIN
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeKB?: number;
}

export interface OptimizedImage {
  file: File;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

// Default optimization settings
const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg',
  maxSizeKB: 500
};

// Supported image formats
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class ImageOptimizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Validate image file
  validateImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'ファイルが選択されていません' };
    }

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return { 
        valid: false, 
        error: `サポートされていない形式です。JPEG、PNG、WebPのみ対応しています。` 
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE / 1024 / 1024}MBまでです。` 
      };
    }

    return { valid: true };
  }

  // Optimize image with given options
  async optimizeImage(
    file: File, 
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Load image
      const img = await this.loadImage(file);
      
      // Calculate new dimensions
      const { width, height } = this.calculateDimensions(
        img.width, 
        img.height, 
        opts.maxWidth, 
        opts.maxHeight
      );
      
      // Resize and compress
      const optimizedDataUrl = await this.resizeAndCompress(img, width, height, opts);
      
      // Convert back to file
      const optimizedFile = await this.dataUrlToFile(
        optimizedDataUrl, 
        `optimized_${file.name}`,
        opts.format
      );
      
      return {
        file: optimizedFile,
        dataUrl: optimizedDataUrl,
        originalSize: file.size,
        optimizedSize: optimizedFile.size,
        compressionRatio: Math.round((1 - optimizedFile.size / file.size) * 100)
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error('画像の最適化に失敗しました');
    }
  }

  // Load image from file
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('画像の読み込みに失敗しました'));
      };
      
      img.src = url;
    });
  }

  // Calculate optimal dimensions maintaining aspect ratio
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // Scale down if too large
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Resize and compress image
  private async resizeAndCompress(
    img: HTMLImageElement,
    width: number,
    height: number,
    options: Required<ImageOptimizationOptions>
  ): Promise<string> {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Enable image smoothing for better quality
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Draw resized image
    this.ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to desired format with quality
    const mimeType = `image/${options.format}`;
    let dataUrl = this.canvas.toDataURL(mimeType, options.quality);
    
    // If still too large, reduce quality iteratively
    if (options.maxSizeKB > 0) {
      let quality = options.quality;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (this.getDataUrlSizeKB(dataUrl) > options.maxSizeKB && 
             quality > 0.1 && 
             attempts < maxAttempts) {
        quality -= 0.1;
        dataUrl = this.canvas.toDataURL(mimeType, quality);
        attempts++;
      }
      
      console.log(`[ImageOptimizer] Final quality: ${quality}, attempts: ${attempts}`);
    }
    
    return dataUrl;
  }

  // Get data URL size in KB
  private getDataUrlSizeKB(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1];
    const bytes = (base64.length * 3) / 4;
    return bytes / 1024;
  }

  // Convert data URL back to File
  private async dataUrlToFile(
    dataUrl: string, 
    filename: string,
    format: string
  ): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    return new File([blob], filename, {
      type: `image/${format}`,
      lastModified: Date.now()
    });
  }

  // Batch optimize multiple images
  async optimizeImages(
    files: File[], 
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage[]> {
    const results: OptimizedImage[] = [];
    
    for (const file of files) {
      try {
        const optimized = await this.optimizeImage(file, options);
        results.push(optimized);
      } catch (error) {
        console.error(`Failed to optimize ${file.name}:`, error);
        // Continue with other files
      }
    }
    
    return results;
  }

  // Create thumbnail
  async createThumbnail(
    file: File,
    size: number = 150
  ): Promise<string> {
    const thumbnailOptions: ImageOptimizationOptions = {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg',
      maxSizeKB: 50
    };
    
    const optimized = await this.optimizeImage(file, thumbnailOptions);
    return optimized.dataUrl;
  }

  // Get image metadata
  async getImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
    lastModified: number;
  }> {
    const img = await this.loadImage(file);
    
    return {
      width: img.width,
      height: img.height,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }
}

// Singleton instance
export const imageOptimizer = new ImageOptimizer();

// Utility functions
export const optimizeImageFile = async (
  file: File,
  options?: ImageOptimizationOptions
): Promise<OptimizedImage> => {
  return imageOptimizer.optimizeImage(file, options);
};

export const createImageThumbnail = async (
  file: File,
  size?: number
): Promise<string> => {
  return imageOptimizer.createThumbnail(file, size);
};

export const validateImageFile = (file: File) => {
  return imageOptimizer.validateImage(file);
};

// Image format conversion
export const convertImageFormat = async (
  file: File,
  targetFormat: 'jpeg' | 'png' | 'webp'
): Promise<File> => {
  const optimized = await imageOptimizer.optimizeImage(file, {
    format: targetFormat,
    quality: 0.9
  });
  
  return optimized.file;
};

// Progressive image loading helper
export const createProgressiveImage = async (
  file: File
): Promise<{
  thumbnail: string;
  medium: string;
  full: string;
}> => {
  const [thumbnail, medium, full] = await Promise.all([
    imageOptimizer.createThumbnail(file, 150),
    imageOptimizer.optimizeImage(file, { maxWidth: 800, quality: 0.7 }),
    imageOptimizer.optimizeImage(file, { maxWidth: 1920, quality: 0.9 })
  ]);
  
  return {
    thumbnail,
    medium: medium.dataUrl,
    full: full.dataUrl
  };
};