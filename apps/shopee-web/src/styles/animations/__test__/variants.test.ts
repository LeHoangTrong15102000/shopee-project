import { describe, it, expect } from 'vitest';
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  staggerContainer,
  staggerItem,
  pageTransition,
  pageTransitionReduced,
  buttonHover,
  cartItemExit,
  badgeBounce,
  errorSlideIn,
  imageCrossfade,
  sectionEntrance,
} from '../variants';
import { ANIMATION_DURATION, STAGGER_DELAY } from '../motion.config';

describe('variants', () => {
  describe('fadeIn', () => {
    it('should have hidden and visible states', () => {
      expect(fadeIn).toHaveProperty('hidden');
      expect(fadeIn).toHaveProperty('visible');
    });

    it('should have opacity 0 in hidden state', () => {
      expect(fadeIn.hidden).toEqual({ opacity: 0 });
    });

    it('should have opacity 1 in visible state', () => {
      expect(fadeIn.visible).toMatchObject({ opacity: 1 });
    });

    it('should have exit state', () => {
      expect(fadeIn).toHaveProperty('exit');
      expect(fadeIn.exit).toMatchObject({ opacity: 0 });
    });
  });

  describe('fadeInUp', () => {
    it('should have hidden and visible states', () => {
      expect(fadeInUp).toHaveProperty('hidden');
      expect(fadeInUp).toHaveProperty('visible');
    });

    it('should have opacity 0 and y: 20 in hidden state', () => {
      expect(fadeInUp.hidden).toEqual({ opacity: 0, y: 20 });
    });

    it('should have opacity 1 and y: 0 in visible state', () => {
      expect(fadeInUp.visible).toMatchObject({ opacity: 1, y: 0 });
    });
  });

  describe('fadeInDown', () => {
    it('should have hidden and visible states', () => {
      expect(fadeInDown).toHaveProperty('hidden');
      expect(fadeInDown).toHaveProperty('visible');
    });

    it('should have opacity 0 and y: -20 in hidden state', () => {
      expect(fadeInDown.hidden).toEqual({ opacity: 0, y: -20 });
    });

    it('should have opacity 1 and y: 0 in visible state', () => {
      expect(fadeInDown.visible).toMatchObject({ opacity: 1, y: 0 });
    });
  });

  describe('fadeInLeft', () => {
    it('should have hidden and visible states', () => {
      expect(fadeInLeft).toHaveProperty('hidden');
      expect(fadeInLeft).toHaveProperty('visible');
    });

    it('should have opacity 0 and x: -20 in hidden state', () => {
      expect(fadeInLeft.hidden).toEqual({ opacity: 0, x: -20 });
    });

    it('should have opacity 1 and x: 0 in visible state', () => {
      expect(fadeInLeft.visible).toMatchObject({ opacity: 1, x: 0 });
    });
  });

  describe('fadeInRight', () => {
    it('should have hidden and visible states', () => {
      expect(fadeInRight).toHaveProperty('hidden');
      expect(fadeInRight).toHaveProperty('visible');
    });

    it('should have opacity 0 and x: 20 in hidden state', () => {
      expect(fadeInRight.hidden).toEqual({ opacity: 0, x: 20 });
    });

    it('should have opacity 1 and x: 0 in visible state', () => {
      expect(fadeInRight.visible).toMatchObject({ opacity: 1, x: 0 });
    });
  });

  describe('scaleIn', () => {
    it('should have hidden and visible states', () => {
      expect(scaleIn).toHaveProperty('hidden');
      expect(scaleIn).toHaveProperty('visible');
    });

    it('should have opacity 0 and scale: 0.9 in hidden state', () => {
      expect(scaleIn.hidden).toEqual({ opacity: 0, scale: 0.9 });
    });

    it('should have opacity 1 and scale: 1 in visible state', () => {
      expect(scaleIn.visible).toMatchObject({ opacity: 1, scale: 1 });
    });
  });

  describe('slideUp', () => {
    it('should have hidden and visible states', () => {
      expect(slideUp).toHaveProperty('hidden');
      expect(slideUp).toHaveProperty('visible');
    });

    it('should have opacity 0 and y: 30 in hidden state', () => {
      expect(slideUp.hidden).toEqual({ opacity: 0, y: 30 });
    });

    it('should have opacity 1 and y: 0 in visible state', () => {
      expect(slideUp.visible).toMatchObject({ opacity: 1, y: 0 });
    });
  });

  describe('slideDown', () => {
    it('should have hidden and visible states', () => {
      expect(slideDown).toHaveProperty('hidden');
      expect(slideDown).toHaveProperty('visible');
    });

    it('should have opacity 0 and y: -30 in hidden state', () => {
      expect(slideDown.hidden).toEqual({ opacity: 0, y: -30 });
    });
  });

  describe('slideLeft', () => {
    it('should have hidden and visible states', () => {
      expect(slideLeft).toHaveProperty('hidden');
      expect(slideLeft).toHaveProperty('visible');
    });

    it('should have opacity 0 and x: -50 in hidden state', () => {
      expect(slideLeft.hidden).toEqual({ opacity: 0, x: -50 });
    });
  });

  describe('slideRight', () => {
    it('should have hidden and visible states', () => {
      expect(slideRight).toHaveProperty('hidden');
      expect(slideRight).toHaveProperty('visible');
    });

    it('should have opacity 0 and x: 50 in hidden state', () => {
      expect(slideRight.hidden).toEqual({ opacity: 0, x: 50 });
    });
  });

  describe('staggerContainer', () => {
    it('should return variants with staggerChildren', () => {
      const variants = staggerContainer();
      expect(variants).toHaveProperty('hidden');
      expect(variants).toHaveProperty('visible');
      expect(variants.visible).toHaveProperty('transition');
      expect(variants.visible.transition).toHaveProperty('staggerChildren');
    });

    it('should use default STAGGER_DELAY.normal', () => {
      const variants = staggerContainer();
      expect(variants.visible.transition?.staggerChildren).toBe(STAGGER_DELAY.normal);
    });

    it('should accept custom delay', () => {
      const customDelay = 0.05;
      const variants = staggerContainer(customDelay);
      expect(variants.visible.transition?.staggerChildren).toBe(customDelay);
    });

    it('should have delayChildren property', () => {
      const variants = staggerContainer();
      expect(variants.visible.transition?.delayChildren).toBe(0.1);
    });
  });

  describe('staggerItem', () => {
    it('should have hidden and visible states', () => {
      expect(staggerItem).toHaveProperty('hidden');
      expect(staggerItem).toHaveProperty('visible');
    });

    it('should have opacity 0 and y: 20 in hidden state', () => {
      expect(staggerItem.hidden).toEqual({ opacity: 0, y: 20 });
    });
  });

  describe('pageTransition', () => {
    it('should have initial, animate, and exit states', () => {
      expect(pageTransition).toHaveProperty('initial');
      expect(pageTransition).toHaveProperty('animate');
      expect(pageTransition).toHaveProperty('exit');
    });

    it('should have opacity 0 and y: 10 in initial state', () => {
      expect(pageTransition.initial).toEqual({ opacity: 0, y: 10 });
    });

    it('should have opacity 1 and y: 0 in animate state', () => {
      expect(pageTransition.animate).toMatchObject({ opacity: 1, y: 0 });
    });

    it('should use fast duration', () => {
      expect(pageTransition.animate.transition?.duration).toBe(ANIMATION_DURATION.fast);
    });
  });

  describe('pageTransitionReduced', () => {
    it('should have initial, animate, and exit states', () => {
      expect(pageTransitionReduced).toHaveProperty('initial');
      expect(pageTransitionReduced).toHaveProperty('animate');
      expect(pageTransitionReduced).toHaveProperty('exit');
    });

    it('should have shorter durations than pageTransition', () => {
      expect(pageTransitionReduced.animate.transition?.duration).toBe(0.1);
      expect(pageTransitionReduced.exit.transition?.duration).toBe(0.1);
      expect(pageTransitionReduced.animate.transition?.duration).toBeLessThan(
        ANIMATION_DURATION.fast,
      );
    });

    it('should only animate opacity', () => {
      expect(pageTransitionReduced.initial).toEqual({ opacity: 0 });
      expect(pageTransitionReduced.animate).toMatchObject({ opacity: 1 });
    });
  });

  describe('buttonHover', () => {
    it('should have whileHover and whileTap properties', () => {
      expect(buttonHover).toHaveProperty('whileHover');
      expect(buttonHover).toHaveProperty('whileTap');
    });

    it('should scale up on hover', () => {
      expect(buttonHover.whileHover).toEqual({ scale: 1.02 });
    });

    it('should scale down on tap', () => {
      expect(buttonHover.whileTap).toEqual({ scale: 0.98 });
    });

    it('should have transition property', () => {
      expect(buttonHover).toHaveProperty('transition');
      expect(buttonHover.transition).toMatchObject({ duration: ANIMATION_DURATION.fast });
    });
  });

  describe('cartItemExit', () => {
    it('should have initial and exit states', () => {
      expect(cartItemExit).toHaveProperty('initial');
      expect(cartItemExit).toHaveProperty('exit');
    });

    it('should have opacity 1, x: 0, and height auto in initial state', () => {
      expect(cartItemExit.initial).toEqual({ opacity: 1, x: 0, height: 'auto' });
    });

    it('should slide right and collapse on exit', () => {
      expect(cartItemExit.exit).toMatchObject({ opacity: 0, x: 100, height: 0 });
    });
  });

  describe('badgeBounce', () => {
    it('should have initial and bounce states', () => {
      expect(badgeBounce).toHaveProperty('initial');
      expect(badgeBounce).toHaveProperty('bounce');
    });

    it('should have scale 1 in initial state', () => {
      expect(badgeBounce.initial).toEqual({ scale: 1 });
    });

    it('should have scale array in bounce state', () => {
      expect(badgeBounce.bounce).toHaveProperty('scale');
      expect(badgeBounce.bounce.scale).toEqual([1, 1.4, 1]);
    });

    it('should have transition with duration and ease', () => {
      expect(badgeBounce.bounce.transition).toMatchObject({
        duration: 0.4,
        ease: 'easeOut',
      });
    });
  });

  describe('errorSlideIn', () => {
    it('should have hidden, visible, and exit states', () => {
      expect(errorSlideIn).toHaveProperty('hidden');
      expect(errorSlideIn).toHaveProperty('visible');
      expect(errorSlideIn).toHaveProperty('exit');
    });

    it('should have opacity 0, y: -10, and height 0 in hidden state', () => {
      expect(errorSlideIn.hidden).toEqual({ opacity: 0, y: -10, height: 0 });
    });

    it('should have opacity 1, y: 0, and height auto in visible state', () => {
      expect(errorSlideIn.visible).toMatchObject({ opacity: 1, y: 0, height: 'auto' });
    });

    it('should collapse on exit', () => {
      expect(errorSlideIn.exit).toMatchObject({ opacity: 0, y: -10, height: 0 });
    });
  });

  describe('imageCrossfade', () => {
    it('should have hidden, visible, and exit states', () => {
      expect(imageCrossfade).toHaveProperty('hidden');
      expect(imageCrossfade).toHaveProperty('visible');
      expect(imageCrossfade).toHaveProperty('exit');
    });

    it('should only animate opacity', () => {
      expect(imageCrossfade.hidden).toEqual({ opacity: 0 });
      expect(imageCrossfade.visible).toMatchObject({ opacity: 1 });
      expect(imageCrossfade.exit).toMatchObject({ opacity: 0 });
    });

    it('should use normal duration for visible', () => {
      expect(imageCrossfade.visible.transition?.duration).toBe(ANIMATION_DURATION.normal);
    });
  });

  describe('sectionEntrance', () => {
    it('should have hidden and visible states', () => {
      expect(sectionEntrance).toHaveProperty('hidden');
      expect(sectionEntrance).toHaveProperty('visible');
    });

    it('should have opacity 0 and y: 20 in hidden state', () => {
      expect(sectionEntrance.hidden).toEqual({ opacity: 0, y: 20 });
    });

    it('should have opacity 1 and y: 0 in visible state', () => {
      expect(sectionEntrance.visible).toMatchObject({ opacity: 1, y: 0 });
    });

    it('should use slow duration', () => {
      expect(sectionEntrance.visible.transition?.duration).toBe(ANIMATION_DURATION.slow);
    });
  });
});
