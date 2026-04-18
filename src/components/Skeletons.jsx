export const ProductSkeleton = () => {
  return (
    <div className="bg-pk-surface rounded-2xl overflow-hidden flex flex-col h-[320px] animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-pk-bg-secondary"></div>
      
      {/* Content Skeleton */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="w-3/4 h-4 rounded bg-pk-bg-secondary"></div>
        <div className="w-1/2 h-3 rounded bg-pk-bg-secondary mt-1"></div>
        <div className="flex-1"></div>
        <div className="flex items-center justify-between mt-auto">
          <div className="w-1/3 h-5 rounded bg-pk-bg-secondary"></div>
          <div className="w-8 h-8 rounded-full bg-pk-bg-secondary"></div>
        </div>
      </div>
    </div>
  );
};

export const CartSkeleton = () => {
  return (
    <div className="flex gap-4 animate-pulse p-4 border-b border-pk-bg-secondary/50">
      <div className="w-20 h-20 bg-pk-bg-secondary rounded-xl flex-shrink-0"></div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="w-3/4 h-4 rounded bg-pk-bg-secondary"></div>
        <div className="w-1/2 h-3 rounded bg-pk-bg-secondary"></div>
        <div className="mt-auto flex justify-between items-center">
          <div className="w-16 h-4 rounded bg-pk-bg-secondary"></div>
          <div className="w-20 h-6 rounded bg-pk-bg-secondary"></div>
        </div>
      </div>
    </div>
  );
};
