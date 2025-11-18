import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VideoBackgroundProps {
  videos: string[];
  fallbackImage?: string;
  className?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  videos, 
  fallbackImage = '/u7584567376_httpss.mj.runpklcTHXMsjI_A_3D_cute_and_chubby_pas_8259f089-737b-4565-8a05-205105845b65_1 (1).png',
  className = 'fixed inset-0 w-full h-full object-cover'
}) => {
  const { t } = useLanguage();
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState<{[key: number]: boolean}>({});
  const [activeVideoRef, setActiveVideoRef] = useState<React.RefObject<HTMLVideoElement>>(mainVideoRef);
  const [allVideosLoaded, setAllVideosLoaded] = useState(false);
  const [loadingQuality, setLoadingQuality] = useState<'high' | 'medium' | 'low' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Preload next video
  const preloadNextVideo = (nextIndex: number) => {
    const inactiveVideoRef = activeVideoRef === mainVideoRef ? secondaryVideoRef : mainVideoRef;
    const inactiveVideo = inactiveVideoRef.current;
    
    if (inactiveVideo && videos[nextIndex] && !videoLoadError[nextIndex]) {
      inactiveVideo.src = videos[nextIndex];
      inactiveVideo.load();
      inactiveVideo.currentTime = 0;
    }
  };

  // Handle video transition
  const handleVideoEnd = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const nextIndex = (currentVideoIndex + 1) % videos.length;
    const currentVideo = activeVideoRef.current;
    const nextVideoRef = activeVideoRef === mainVideoRef ? secondaryVideoRef : mainVideoRef;
    const nextVideo = nextVideoRef.current;
    
    if (!currentVideo || !nextVideo) {
      setIsTransitioning(false);
      return;
    }

    // Skip if next video failed to load
    if (videoLoadError[nextIndex]) {
      const followingIndex = (nextIndex + 1) % videos.length;
      setCurrentVideoIndex(followingIndex);
      setIsTransitioning(false);
      return;
    }

    // Start playing next video
    nextVideo.style.opacity = '1';
    nextVideo.style.zIndex = '2';
    nextVideo.play().catch((error) => {
      console.warn('Next video play failed:', error);
      setVideoLoadError(prev => ({ ...prev, [nextIndex]: true }));
      setIsTransitioning(false);
      return;
    });
    
    // Fade out current video
    currentVideo.style.opacity = '0';
    
    // Complete transition after fade
    setTimeout(() => {
      currentVideo.style.zIndex = '1';
      setCurrentVideoIndex(nextIndex);
      setActiveVideoRef(nextVideoRef);
      setIsTransitioning(false);
      
      // Preload next video
      const followingIndex = (nextIndex + 1) % videos.length;
      preloadNextVideo(followingIndex);
    }, 500);
  };

  // Initialize video system with enhanced fallback
  useEffect(() => {
    const initializeVideos = async () => {
      const mainVideo = mainVideoRef.current;
      const secondaryVideo = secondaryVideoRef.current;
      
      if (!mainVideo || !secondaryVideo || videos.length === 0) return;

      // Try loading videos with different quality settings
      const tryLoadVideo = async (video: HTMLVideoElement, src: string, quality: 'high' | 'medium' | 'low') => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            video.removeEventListener('canplaythrough', onLoad);
            video.removeEventListener('error', onError);
            reject(new Error('Video load timeout'));
          }, quality === 'high' ? 15000 : quality === 'medium' ? 10000 : 5000);

          const onLoad = () => {
            clearTimeout(timeout);
            video.removeEventListener('canplaythrough', onLoad);
            video.removeEventListener('error', onError);
            resolve(null);
          };
          
          const onError = () => {
            clearTimeout(timeout);
            video.removeEventListener('canplaythrough', onLoad);
            video.removeEventListener('error', onError);
            reject(new Error('Video load error'));
          };

          video.addEventListener('canplaythrough', onLoad);
          video.addEventListener('error', onError);
          
          // Set video quality attributes
          if (quality === 'medium') {
            video.setAttribute('preload', 'metadata');
          } else if (quality === 'low') {
            video.setAttribute('preload', 'none');
            video.setAttribute('poster', fallbackImage);
          }
          
          video.src = src;
          video.load();
        });
      };

      try {
        const currentVideoSrc = videos[currentVideoIndex];
        
        // Try high quality first
        try {
          setLoadingQuality('high');
          mainVideo.style.opacity = '0';
          mainVideo.style.zIndex = '2';
          await tryLoadVideo(mainVideo, currentVideoSrc, 'high');
          mainVideo.style.opacity = '1';
          await mainVideo.play();
          console.log('High quality video loaded successfully');
          setLoadingQuality(null);
          setIsLoading(false);
        } catch (error) {
          console.warn('High quality video failed, trying medium quality:', error);
          
          // Try medium quality
          try {
            setLoadingQuality('medium');
            await tryLoadVideo(mainVideo, currentVideoSrc, 'medium');
            mainVideo.style.opacity = '1';
            await mainVideo.play();
            console.log('Medium quality video loaded successfully');
            setLoadingQuality(null);
            setIsLoading(false);
          } catch (error2) {
            console.warn('Medium quality video failed, trying low quality:', error2);
            
            // Try low quality / poster mode
            try {
              setLoadingQuality('low');
              await tryLoadVideo(mainVideo, currentVideoSrc, 'low');
              mainVideo.style.opacity = '1';
              await mainVideo.play();
              console.log('Low quality video loaded successfully');
              setLoadingQuality(null);
              setIsLoading(false);
            } catch (error3) {
              console.warn('All video qualities failed, showing fallback image:', error3);
              setVideoLoadError(prev => ({ ...prev, [currentVideoIndex]: true }));
              setLoadingQuality(null);
              setIsLoading(false);
              throw error3;
            }
          }
        }
        
        // Preload next video if available
        if (videos.length > 1) {
          const nextIndex = (currentVideoIndex + 1) % videos.length;
          preloadNextVideo(nextIndex);
        }
        
        setAllVideosLoaded(true);
      } catch (error) {
        console.warn('Video system initialization failed completely:', error);
        setVideoLoadError(prev => ({ ...prev, [currentVideoIndex]: true }));
      }
    };

    if (!allVideosLoaded) {
      initializeVideos();
    }
  }, [videos, currentVideoIndex, allVideosLoaded, fallbackImage]);

  // Add event listeners
  useEffect(() => {
    const currentVideo = activeVideoRef.current;
    if (currentVideo && allVideosLoaded) {
      currentVideo.addEventListener('ended', handleVideoEnd);
    }
    
    return () => {
      if (currentVideo) {
        currentVideo.removeEventListener('ended', handleVideoEnd);
      }
    };
  }, [activeVideoRef, allVideosLoaded, currentVideoIndex, isTransitioning]);

  // Show fallback image if all videos fail
  const allVideosFailed = Object.keys(videoLoadError).length >= videos.length;

  return (
    <>
      {/* Loading indicator */}
      {isLoading && (
        <div className={className} style={{ 
          backgroundColor: '#000', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 3
        }}>
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">
              {loadingQuality === 'high' && t('videoBackground.loadingHighQuality')}
              {loadingQuality === 'medium' && t('videoBackground.loadingMediumQuality')}
              {loadingQuality === 'low' && t('videoBackground.loadingLowQuality')}
              {!loadingQuality && t('videoBackground.loadingVideo')}
            </p>
            <div className="mt-2 text-sm opacity-75">
              {loadingQuality === 'medium' && t('videoBackground.networkSlowStandard')}
              {loadingQuality === 'low' && t('videoBackground.networkSlowLow')}
            </div>
          </div>
        </div>
      )}

      {/* Primary video */}
      <video
        ref={mainVideoRef}
        className={className}
        muted
        playsInline
        style={{
          opacity: 0,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1
        }}
        preload="auto"
        onError={(e) => {
          console.warn('Primary video load error:', e);
          setVideoLoadError(prev => ({ ...prev, [currentVideoIndex]: true }));
        }}
      />

      {/* Secondary video for seamless transitions */}
      <video
        ref={secondaryVideoRef}
        className={className}
        muted
        playsInline
        style={{
          opacity: 0,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1
        }}
        preload="auto"
        onError={(e) => {
          console.warn('Secondary video load error:', e);
          const nextIndex = (currentVideoIndex + 1) % videos.length;
          setVideoLoadError(prev => ({ ...prev, [nextIndex]: true }));
        }}
      />

      {/* Fallback background image if all videos fail */}
      {allVideosFailed && (
        <div 
          className={className}
          style={{
            backgroundImage: `url(${fallbackImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="text-white text-center bg-black/50 p-6 rounded-lg">
            <p className="text-lg mb-2">{t('videoBackground.videoLoadError')}</p>
            <p className="text-sm opacity-75">{t('videoBackground.fallbackMessage')}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoBackground;