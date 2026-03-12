import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ImageWithFallback from 'src/components/ImageWithFallback';
import ShareButton from 'src/components/ShareButton';
import WishlistButton from 'src/components/WishlistButton';
import { Product as ProductType, ProductSKU } from 'src/types/product.type';
import {
  imageCrossfade,
  staggerContainer,
  staggerItem,
  STAGGER_DELAY,
} from 'src/styles/animations';
import Button from 'src/components/Button';

const FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDcwQzg4LjUgNzAgNzkgNzkuNSA3OSA5MUM3OSAxMDIuNSA4OC41IDExMiAxMDAgMTEyQzExMS41IDExMiAxMjEgMTAyLjUgMTIxIDkxQzEyMSA3OS41IDExMS41IDcwIDEwMCA3MFpNMTAwIDEwNEM5Mi44IDEwNCA4NyA5OC4yIDg3IDkxQzg3IDgzLjggOTIuOCA3OCAxMDAgNzhDMTA3LjIgNzggMTEzIDgzLjggMTEzIDkxQzExMyA5OC4yIDEwNy4yIDEwNCAxMDAgMTA0WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNDAgMTMwSDYwQzU1LjYgMTMwIDUyIDEyNi40IDUyIDEyMlY3OEM1MiA3My42IDU1LjYgNzAgNjAgNzBIMTQwQzE0NC40IDcwIDE0OCA3My42IDE0OCA3OFYxMjJDMTQ4IDEyNi40IDE0NC40IDEzMCAxNDAgMTMwWk02MCA3OFYxMjJIMTQwVjc4SDYwWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==';

interface ProductImagesProps {
  product: ProductType;
  reducedMotion: boolean;
  selectedSKU?: ProductSKU | null;
}

const ProductImages = ({ product, reducedMotion, selectedSKU }: ProductImagesProps) => {
  const { t } = useTranslation('product');
  const imageRef = useRef<HTMLImageElement>(null);
  const [currentIndexImages, setCurrentIndexImages] = useState([0, 5]);
  const [activeImage, setActiveImage] = useState('');
  const [mainImageError, setMainImageError] = useState(false);

  const currentImages = useMemo(
    () => (product ? product.images.slice(...currentIndexImages) : []),
    [product, currentIndexImages],
  );

  useEffect(() => {
    if (product && product.images.length > 0) {
      setActiveImage(product.images[0]);
    }
  }, [product]);

  // Switch to SKU image when a variant with image is selected, fallback to product image
  useEffect(() => {
    if (selectedSKU?.image) {
      setActiveImage(selectedSKU.image);
    } else if (product && product.images.length > 0) {
      setActiveImage(product.images[0]);
    }
  }, [selectedSKU?.image, selectedSKU?._id]);

  useEffect(() => {
    setMainImageError(false);
  }, [activeImage]);

  const hoverActiveImage = (img: string) => {
    setActiveImage(img);
  };

  const handleNextSlider = () => {
    if (currentIndexImages[1] < product.images.length) {
      setCurrentIndexImages((prev) => [prev[0] + 1, prev[1] + 1]);
    }
  };

  const handlePrevSlider = () => {
    if (currentIndexImages[0] > 0) {
      setCurrentIndexImages((prev) => [prev[0] - 1, prev[1] - 1]);
    }
  };

  const handleGalleryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrevSlider();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNextSlider();
    }
  };

  const handleZoom = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const image = imageRef.current as HTMLImageElement;
    const { naturalHeight, naturalWidth } = image;

    const offsetX = event.pageX - (rect.x + window.scrollX);
    const offsetY = event.pageY - (rect.y + window.scrollY);

    const top = offsetY * (1 - naturalHeight / rect.height);
    const left = offsetX * (1 - naturalWidth / rect.width);

    image.style.width = naturalWidth + 'px';
    image.style.height = naturalHeight + 'px';
    image.style.maxWidth = 'unset';
    image.style.top = top + 'px';
    image.style.left = left + 'px';
  };

  const handleRemoveZoom = () => {
    imageRef.current?.removeAttribute('style');
  };

  return (
    <div className="col-span-12 md:col-span-5">
      {/* Main Image with Zoom */}
      <div
        className="relative w-full cursor-zoom-in overflow-hidden pt-[100%]"
        onMouseMove={handleZoom}
        onMouseLeave={handleRemoveZoom}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImage}
            src={mainImageError ? FALLBACK_IMAGE : activeImage}
            alt={product?.name}
            className="pointer-events-none absolute top-0 left-0 h-full w-full cursor-pointer bg-white object-cover dark:bg-slate-700"
            ref={imageRef}
            onError={() => setMainImageError(true)}
            variants={reducedMotion ? undefined : imageCrossfade}
            initial={reducedMotion ? undefined : 'hidden'}
            animate={reducedMotion ? undefined : 'visible'}
            exit={reducedMotion ? undefined : 'exit'}
          />
        </AnimatePresence>
      </div>
      {/* Image Slider */}
      <motion.div
        className="relative mt-4 grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5"
        variants={reducedMotion ? undefined : staggerContainer(STAGGER_DELAY.fast)}
        initial={reducedMotion ? undefined : 'hidden'}
        animate={reducedMotion ? undefined : 'visible'}
        tabIndex={0}
        onKeyDown={handleGalleryKeyDown}
        role="group"
        aria-label={t('images.galleryLabel')}
      >
        <Button
          animated={false}
          onClick={handlePrevSlider}
          className="absolute top-1/2 left-0 z-10 min-h-11 min-w-11 -translate-y-1/2 bg-black/20 text-white"
          aria-label={t('images.previousImage')}
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Button>
        {currentImages.map((img, index) => {
          const isActive = img === activeImage;
          return (
            <motion.div
              className="relative w-full pt-[100%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
              key={img}
              role="button"
              tabIndex={0}
              aria-label={t('images.imageN', { name: product.name, index: index + 1 })}
              onClick={() => hoverActiveImage(img)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  hoverActiveImage(img);
                }
              }}
              onMouseEnter={() => hoverActiveImage(img)}
              variants={reducedMotion ? undefined : staggerItem}
              whileHover={reducedMotion ? undefined : { scale: 1.05 }}
              transition={{ duration: 0.15 }}
            >
              <ImageWithFallback
                src={img}
                alt={t('images.imageN', { name: product.name, index: index + 1 })}
                className="absolute top-0 left-0 h-full w-full cursor-pointer bg-white object-cover dark:bg-slate-700"
              />
              {isActive && <div className="absolute inset-0 border-2 border-orange"></div>}
            </motion.div>
          );
        })}
        <Button
          animated={false}
          onClick={handleNextSlider}
          className="absolute top-1/2 right-0 z-10 min-h-11 min-w-11 -translate-y-1/2 bg-black/20 text-white"
          aria-label={t('images.nextImage')}
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Button>
      </motion.div>
      {/* Share & Wishlist row below thumbnails */}
      <div className="mt-4 flex items-center justify-between">
        <ShareButton
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={product.name}
          description={product.description?.slice(0, 150)}
          image={product.image}
        />
        <WishlistButton productId={product._id} productName={product.name} size="sm" />
      </div>
    </div>
  );
};

export default ProductImages;
