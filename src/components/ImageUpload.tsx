import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { imageOptimizer, validateImageFile, OptimizedImage } from '../utils/imageOptimizer';

interface ImageUploadProps {
  onImageSelect: (optimizedImage: OptimizedImage) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  acceptedFormats?: string[];
  maxSizeKB?: number;
  className?: string;
  showPreview?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onError,
  maxFiles = 1,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeKB = 500,
  className = '',
  showPreview = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<OptimizedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const fileArray = Array.from(files).slice(0, maxFiles);
      const optimizedImages: OptimizedImage[] = [];

      for (const file of fileArray) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          onError?.(validation.error || 'Invalid file');
          continue;
        }

        // Check format
        if (!acceptedFormats.includes(file.type)) {
          const error = `サポートされていない形式: ${file.type}`;
          setError(error);
          onError?.(error);
          continue;
        }

        try {
          // Optimize image
          const optimized = await imageOptimizer.optimizeImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'jpeg',
            maxSizeKB
          });

          optimizedImages.push(optimized);
          onImageSelect(optimized);
        } catch (optimizationError) {
          console.error('Image optimization failed:', optimizationError);
          const error = `画像の最適化に失敗しました: ${file.name}`;
          setError(error);
          onError?.(error);
        }
      }

      if (showPreview) {
        setUploadedImages(prev => [...prev, ...optimizedImages]);
      }
    } catch (error) {
      console.error('File processing failed:', error);
      const errorMessage = 'ファイルの処理に失敗しました';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-purple-400 bg-purple-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedFormats.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <Loader className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-purple-600 font-medium">画像を最適化中...</p>
              <p className="text-sm text-gray-500 mt-1">品質を保ちながらファイルサイズを削減しています</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">エラーが発生しました</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                もう一度試す
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                画像をドラッグ&ドロップ
              </p>
              <p className="text-sm text-gray-500 mb-4">
                またはクリックしてファイルを選択
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>対応形式: JPEG, PNG, WebP</p>
                <p>最大サイズ: {maxSizeKB}KB (自動最適化)</p>
                <p>最大ファイル数: {maxFiles}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Images */}
      {showPreview && uploadedImages.length > 0 && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {uploadedImages.map((image, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={image.dataUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300" />
                
                {/* Remove button */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Optimization info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>元サイズ:</span>
                      <span>{formatFileSize(image.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>最適化後:</span>
                      <span>{formatFileSize(image.optimizedSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>圧縮率:</span>
                      <span className="text-green-300">{image.compressionRatio}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Upload Summary */}
      {uploadedImages.length > 0 && (
        <motion.div
          className="bg-green-50 border border-green-200 rounded-xl p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">
              {uploadedImages.length}枚の画像を最適化しました
            </span>
          </div>
          <div className="text-sm text-green-700">
            総削減サイズ: {formatFileSize(
              uploadedImages.reduce((total, img) => total + (img.originalSize - img.optimizedSize), 0)
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageUpload;