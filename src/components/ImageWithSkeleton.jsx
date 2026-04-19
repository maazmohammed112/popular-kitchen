import { useState, useEffect } from 'react';

export const ImageWithSkeleton = ({ src, alt, className, containerClassName, width, height }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);

  if (!src) {
    return (
      <div className={`relative overflow-hidden ${containerClassName || ''}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-pk-bg-secondary gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-pk-text-muted opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[9px] text-pk-text-muted font-medium uppercase tracking-wide">No Image</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName || ''}`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-pk-bg-secondary animate-pulse" />
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-pk-bg-secondary gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-pk-text-muted opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[9px] text-pk-text-muted font-medium uppercase tracking-wide">No Image</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          loading="eager"
          width={width}
          height={height}
        />
      )}
    </div>
  );
};
