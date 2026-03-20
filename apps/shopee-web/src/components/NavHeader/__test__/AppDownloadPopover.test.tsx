import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AppDownloadPopover from '../components/AppDownloadPopover';

describe('AppDownloadPopover', () => {
  it('renders without crashing', () => {
    const { container } = render(<AppDownloadPopover />);
    expect(screen.getByAltText('QR_Shopee')).toBeInTheDocument();
  });

  it('renders QR code image', () => {
    render(<AppDownloadPopover />);
    const qrImage = screen.getByAltText('QR_Shopee');
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute(
      'src',
      'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/d91264e165ed6facc6178994d5afae79.png',
    );
  });

  it('renders App Store logo', () => {
    render(<AppDownloadPopover />);
    const appStoreLogo = screen.getByAltText('Logo_AppStore');
    expect(appStoreLogo).toBeInTheDocument();
    expect(appStoreLogo).toHaveAttribute(
      'src',
      'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/39f189e19764dab688d3850742f13718.png',
    );
  });

  it('renders Google Play logo', () => {
    render(<AppDownloadPopover />);
    const playStoreLogo = screen.getByAltText('Logo_CHPlay');
    expect(playStoreLogo).toBeInTheDocument();
    expect(playStoreLogo).toHaveAttribute(
      'src',
      'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/f4f5426ce757aea491dce94201560583.png',
    );
  });

  it('renders App Gallery logo', () => {
    render(<AppDownloadPopover />);
    const appGalleryLogo = screen.getByAltText('Logo_AppGallery');
    expect(appGalleryLogo).toBeInTheDocument();
    expect(appGalleryLogo).toHaveAttribute(
      'src',
      'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/1ae215920a31f2fc75b00d4ee9ae8551.png',
    );
  });

  it('renders all three store logos', () => {
    render(<AppDownloadPopover />);
    const appStoreLogo = screen.getByAltText('Logo_AppStore');
    const playStoreLogo = screen.getByAltText('Logo_CHPlay');
    const appGalleryLogo = screen.getByAltText('Logo_AppGallery');

    expect(appStoreLogo).toBeInTheDocument();
    expect(playStoreLogo).toBeInTheDocument();
    expect(appGalleryLogo).toBeInTheDocument();
  });

  it('has correct styling classes for container', () => {
    const { container } = render(<AppDownloadPopover />);
    const popover = container.firstChild as HTMLElement;
    expect(popover.className).toContain('rounded-lg');
    expect(popover.className).toContain('border');
    expect(popover.className).toContain('border-gray-200');
    expect(popover.className).toContain('bg-white');
    expect(popover.className).toContain('shadow-md');
  });

  it('QR code has correct size classes', () => {
    render(<AppDownloadPopover />);
    const qrImage = screen.getByAltText('QR_Shopee');
    expect(qrImage.className).toContain('h-45');
    expect(qrImage.className).toContain('w-45');
  });

  it('renders store logos container with correct dimensions', () => {
    const { container } = render(<AppDownloadPopover />);
    const logosContainer = container.querySelector('.h-\\[54\\.5px\\]');
    expect(logosContainer).toBeInTheDocument();
    expect(logosContainer?.className).toContain('w-[180px]');
  });

  it('each store logo has correct width class', () => {
    const { container } = render(<AppDownloadPopover />);
    const logoWrappers = container.querySelectorAll('.w-17\\.5');
    expect(logoWrappers.length).toBe(3);
  });

  it('renders with cursor-pointer class', () => {
    const { container } = render(<AppDownloadPopover />);
    const popover = container.firstChild as HTMLElement;
    expect(popover.className).toContain('cursor-pointer');
  });

  it('has relative positioning', () => {
    const { container } = render(<AppDownloadPopover />);
    const popover = container.firstChild as HTMLElement;
    expect(popover.className).toContain('relative');
  });

  it('QR code has overflow-clip class', () => {
    render(<AppDownloadPopover />);
    const qrImage = screen.getByAltText('QR_Shopee');
    expect(qrImage.className).toContain('overflow-clip');
  });

  it('store logos container has flex layout', () => {
    const { container } = render(<AppDownloadPopover />);
    const logosContainer = container.querySelector('.h-\\[54\\.5px\\]');
    expect(logosContainer?.className).toContain('flex');
    expect(logosContainer?.className).toContain('flex-wrap');
    expect(logosContainer?.className).toContain('items-center');
    expect(logosContainer?.className).toContain('justify-between');
  });

  it('renders inner div with after pseudo-element classes', () => {
    const { container } = render(<AppDownloadPopover />);
    const innerDiv = container.querySelector('.after\\:absolute');
    expect(innerDiv).toBeInTheDocument();
    expect(innerDiv?.className).toContain('after:top-0');
    expect(innerDiv?.className).toContain('after:left-0');
  });

  it('all images are rendered', () => {
    render(<AppDownloadPopover />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(4); // QR + 3 store logos
  });
});
