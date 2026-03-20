import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OptimizedImage from '../OptimizedImage';

describe('OptimizedImage', () => {
  describe('basic img rendering (no webpSrc/avifSrc)', () => {
    it('should render a plain img element', () => {
      render(<OptimizedImage src="/photo.jpg" alt="test" />);
      const img = screen.getByAltText('test');
      expect(img.tagName).toBe('IMG');
      expect(img.closest('picture')).toBeNull();
    });

    it('should apply lazy loading by default', () => {
      render(<OptimizedImage src="/photo.jpg" alt="test" />);
      expect(screen.getByAltText('test')).toHaveAttribute('loading', 'lazy');
    });

    it('should apply eager loading when specified', () => {
      render(<OptimizedImage src="/photo.jpg" alt="test" loading="eager" />);
      expect(screen.getByAltText('test')).toHaveAttribute('loading', 'eager');
    });

    it('should support srcSet and sizes', () => {
      render(
        <OptimizedImage
          src="/photo.jpg"
          alt="test"
          srcSet="/photo-300.jpg 300w, /photo-600.jpg 600w"
          sizes="(max-width: 600px) 300px, 600px"
        />,
      );
      const img = screen.getByAltText('test');
      expect(img).toHaveAttribute('srcSet', '/photo-300.jpg 300w, /photo-600.jpg 600w');
      expect(img).toHaveAttribute('sizes', '(max-width: 600px) 300px, 600px');
    });

    it('should set width and height attributes', () => {
      render(<OptimizedImage src="/photo.jpg" alt="test" width={300} height={200} />);
      const img = screen.getByAltText('test');
      expect(img).toHaveAttribute('width', '300');
      expect(img).toHaveAttribute('height', '200');
    });
  });

  describe('picture element rendering', () => {
    it('should wrap in picture when webpSrc provided', () => {
      const { container } = render(
        <OptimizedImage src="/photo.jpg" alt="test" webpSrc="/photo.webp" />,
      );
      expect(container.querySelector('picture')).toBeInTheDocument();
      expect(container.querySelector('source[type="image/webp"]')).toHaveAttribute(
        'srcSet',
        '/photo.webp',
      );
    });

    it('should wrap in picture when avifSrc provided', () => {
      const { container } = render(
        <OptimizedImage src="/photo.jpg" alt="test" avifSrc="/photo.avif" />,
      );
      expect(container.querySelector('source[type="image/avif"]')).toHaveAttribute(
        'srcSet',
        '/photo.avif',
      );
    });

    it('should preserve img attributes when webpSrc is provided', () => {
      render(
        <OptimizedImage
          src="/photo.jpg"
          alt="test"
          webpSrc="/photo.webp"
          loading="eager"
          width={300}
          height={200}
        />,
      );
      const img = screen.getByAltText('test');
      expect(img).toHaveAttribute('loading', 'eager');
      expect(img).toHaveAttribute('width', '300');
      expect(img).toHaveAttribute('height', '200');
    });
  });

  describe('error handling and callbacks', () => {
    it('should switch to fallback src on first error', () => {
      render(<OptimizedImage src="/broken.jpg" alt="test" fallbackSrc="/fallback.jpg" />);
      const img = screen.getByAltText('test');
      fireEvent.error(img);
      expect(img).toHaveAttribute('src', '/fallback.jpg');
    });

    it('should call onError after fallback also fails', () => {
      const onError = vi.fn();
      render(
        <OptimizedImage
          src="/broken.jpg"
          alt="test"
          fallbackSrc="/also-broken.jpg"
          onError={onError}
        />,
      );
      const img = screen.getByAltText('test');
      fireEvent.error(img);
      fireEvent.error(img);
      expect(onError).toHaveBeenCalled();
    });

    it('should call onLoad when image loads successfully', () => {
      const onLoad = vi.fn();
      render(<OptimizedImage src="/photo.jpg" alt="test" onLoad={onLoad} />);
      fireEvent.load(screen.getByAltText('test'));
      expect(onLoad).toHaveBeenCalled();
    });

    it('should show skeleton during loading when showSkeleton is true', () => {
      const { container } = render(
        <OptimizedImage src="/photo.jpg" alt="test" showSkeleton={true} />,
      );
      expect(container.querySelector('.animate-pulse')).not.toBeNull();
    });

    it('should not show skeleton when showSkeleton is false', () => {
      const { container } = render(
        <OptimizedImage src="/photo.jpg" alt="test" showSkeleton={false} />,
      );
      expect(container.querySelector('.animate-pulse')).toBeNull();
    });
  });

  describe('aspect ratio and object fit', () => {
    it('should render inline-block container for auto aspect ratio', () => {
      const { container } = render(
        <OptimizedImage src="/photo.jpg" alt="test" aspectRatio="auto" />,
      );
      expect(container.firstChild).toHaveClass('inline-block');
    });

    it('should render aspect ratio container for 16:9', () => {
      const { container } = render(
        <OptimizedImage src="/photo.jpg" alt="test" aspectRatio="16:9" />,
      );
      expect(container.firstChild).toHaveClass('pt-[56.25%]');
    });

    it('should render aspect ratio container for 1:1', () => {
      const { container } = render(
        <OptimizedImage src="/photo.jpg" alt="test" aspectRatio="1:1" />,
      );
      expect(container.firstChild).toHaveClass('pt-[100%]');
    });

    it('should apply object-cover by default', () => {
      render(<OptimizedImage src="/photo.jpg" alt="test" />);
      expect(screen.getByAltText('test')).toHaveClass('object-cover');
    });

    it('should apply object-contain when specified', () => {
      render(<OptimizedImage src="/photo.jpg" alt="test" objectFit="contain" />);
      expect(screen.getByAltText('test')).toHaveClass('object-contain');
    });
  });

  describe('custom classes', () => {
    it('should apply custom className to img', () => {
      render(<OptimizedImage src="/photo.jpg" alt="test" className="custom-img" />);
      expect(screen.getByAltText('test')).toHaveClass('custom-img');
    });

    it('should apply containerClassName', () => {
      const { container } = render(
        <OptimizedImage src="/photo.jpg" alt="test" containerClassName="wrapper" />,
      );
      expect(container.firstChild).toHaveClass('wrapper');
    });
  });
});
