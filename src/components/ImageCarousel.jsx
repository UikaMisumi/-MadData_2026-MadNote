import React, { useState } from 'react';
import './ImageCarousel.css';

function ImageCarousel({ images, alt = "Post image" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // 如果只有一张图片，不显示箭头
  const isSingleImage = images.length === 1;

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="image-carousel">
      <div className="carousel-container">
        <img 
          src={typeof images[currentIndex] === 'string' ? images[currentIndex] : images[currentIndex].url}
          alt={`${alt} ${currentIndex + 1} of ${images.length}`}
          className="carousel-image"
        />
        
        {!isSingleImage && (
          <>
            <button 
              className="carousel-arrow carousel-arrow-left"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/>
              </svg>
            </button>
            
            <button 
              className="carousel-arrow carousel-arrow-right"
              onClick={goToNext}
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
              </svg>
            </button>
          </>
        )}
        
        {!isSingleImage && (
          <div className="carousel-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageCarousel;