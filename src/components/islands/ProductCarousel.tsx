import React, { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category?: { name: string };
}

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  autoPlay?: boolean;
  interval?: number;
}

export default function ProductCarousel({ 
  products, 
  title = "Nuestros Productos",
  autoPlay = true,
  interval = 4000 
}: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Número de productos visibles según el tamaño de pantalla
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  };

  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || isHovered || products.length <= visibleCount) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => 
        prev >= products.length - visibleCount ? 0 : prev + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, isHovered, products.length, visibleCount]);

  const goTo = (index: number) => {
    if (index < 0) {
      setCurrentIndex(products.length - visibleCount);
    } else if (index > products.length - visibleCount) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(index);
    }
  };

  const prev = () => goTo(currentIndex - 1);
  const next = () => goTo(currentIndex + 1);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && (
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 text-center mb-8">
          {title}
        </h2>
      )}

      <div className="relative overflow-hidden">
        {/* Botón Anterior */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-800 hover:text-arena transition-all hover:scale-110"
          aria-label="Anterior"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Carrusel */}
        <div 
          ref={carouselRef}
          className="flex transition-transform duration-500 ease-out"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / visibleCount}%` }}
            >
              <a 
                href={`/producto/${product.id}`}
                className="block group"
              >
                <div className="bg-white rounded-xl overflow-hidden border border-arena-light shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                  {/* Imagen */}
                  <div className="aspect-square overflow-hidden bg-arena-pale">
                    <img
                      src={product.image_url || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    {product.category && (
                      <span className="text-xs text-arena font-medium uppercase tracking-wide">
                        {product.category.name}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mt-1 group-hover:text-arena transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xl font-bold text-arena mt-2">
                      €{product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-800 hover:text-arena transition-all hover:scale-110"
          aria-label="Siguiente"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Indicadores */}
      {products.length > visibleCount && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(products.length - visibleCount + 1) }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex 
                  ? 'bg-arena w-6' 
                  : 'bg-arena-light hover:bg-arena'
              }`}
              aria-label={`Ir a slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
