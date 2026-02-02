import React from 'react';

interface SkeletonProps {
  type: 'product-card' | 'product-grid' | 'text' | 'avatar' | 'button' | 'image' | 'order-card';
  count?: number;
}

export default function Skeleton({ type, count = 1 }: SkeletonProps) {
  const renderProductCard = () => (
    <div className="bg-white rounded-lg border border-arena-light overflow-hidden animate-pulse">
      <div className="aspect-square bg-arena-pale"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-arena-pale rounded w-3/4"></div>
        <div className="h-4 bg-arena-pale rounded w-1/2"></div>
        <div className="h-6 bg-arena-pale rounded w-1/3"></div>
      </div>
    </div>
  );

  const renderOrderCard = () => (
    <div className="bg-white rounded-lg border border-arena-light p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-3 bg-arena-pale rounded w-24"></div>
          <div className="h-6 bg-arena-pale rounded w-20"></div>
        </div>
        <div className="h-6 bg-arena-pale rounded-full w-20"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-arena-pale rounded w-32"></div>
        <div className="h-3 bg-arena-pale rounded w-24"></div>
      </div>
    </div>
  );

  if (type === 'product-card') {
    return renderProductCard();
  }

  if (type === 'product-grid') {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderProductCard()}</div>
        ))}
      </div>
    );
  }

  if (type === 'order-card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderOrderCard()}</div>
        ))}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-arena-pale rounded"
            style={{ width: `${70 + Math.random() * 30}%` }}
          ></div>
        ))}
      </div>
    );
  }

  if (type === 'avatar') {
    return <div className="w-12 h-12 rounded-full bg-arena-pale animate-pulse"></div>;
  }

  if (type === 'button') {
    return <div className="h-12 bg-arena-pale rounded-lg w-32 animate-pulse"></div>;
  }

  if (type === 'image') {
    return <div className="aspect-square bg-arena-pale rounded-lg animate-pulse"></div>;
  }

  return null;
}
