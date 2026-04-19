import { useState } from 'react';

export const ImageWithSkeleton = ({ src, alt, className, containerClassName, width, height }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName || ''}`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-pk-bg-secondary animate-pulse" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-pk-bg-secondary text-pk-text-muted text-[10px]">
          Failed to load
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          width={width}
          height={height}
        />
      )}
    </div>
  );
};
