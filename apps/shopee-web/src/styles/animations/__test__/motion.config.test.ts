import { describe, it, expect } from 'vitest';
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  ANIMATION_SPRING,
  STAGGER_DELAY,
} from '../motion.config';

describe('motion.config', () => {
  describe('ANIMATION_DURATION', () => {
    it('should have correct duration values', () => {
      expect(ANIMATION_DURATION.instant).toBe(0);
      expect(ANIMATION_DURATION.fast).toBe(0.15);
      expect(ANIMATION_DURATION.normal).toBe(0.3);
      expect(ANIMATION_DURATION.slow).toBe(0.5);
      expect(ANIMATION_DURATION.slower).toBe(0.8);
    });

    it('should have all duration keys', () => {
      expect(Object.keys(ANIMATION_DURATION)).toEqual([
        'instant',
        'fast',
        'normal',
        'slow',
        'slower',
      ]);
    });
  });

  describe('ANIMATION_EASING', () => {
    it('should have 3 easing types', () => {
      expect(Object.keys(ANIMATION_EASING)).toEqual(['easeOut', 'easeIn', 'easeInOut']);
    });

    it('should have easeOut with 4 values', () => {
      expect(ANIMATION_EASING.easeOut).toHaveLength(4);
      expect(ANIMATION_EASING.easeOut).toEqual([0.25, 0.46, 0.45, 0.94]);
    });

    it('should have easeIn with 4 values', () => {
      expect(ANIMATION_EASING.easeIn).toHaveLength(4);
      expect(ANIMATION_EASING.easeIn).toEqual([0.42, 0, 1, 1]);
    });

    it('should have easeInOut with 4 values', () => {
      expect(ANIMATION_EASING.easeInOut).toHaveLength(4);
      expect(ANIMATION_EASING.easeInOut).toEqual([0.42, 0, 0.58, 1]);
    });

    it('should have all easing values as numbers', () => {
      Object.values(ANIMATION_EASING).forEach((easing) => {
        easing.forEach((value) => {
          expect(typeof value).toBe('number');
        });
      });
    });
  });

  describe('ANIMATION_SPRING', () => {
    it('should have 3 spring types', () => {
      expect(Object.keys(ANIMATION_SPRING)).toEqual(['default', 'bouncy', 'gentle']);
    });

    it('should have default spring with type spring', () => {
      expect(ANIMATION_SPRING.default.type).toBe('spring');
      expect(ANIMATION_SPRING.default.stiffness).toBe(300);
      expect(ANIMATION_SPRING.default.damping).toBe(25);
    });

    it('should have bouncy spring with type spring', () => {
      expect(ANIMATION_SPRING.bouncy.type).toBe('spring');
      expect(ANIMATION_SPRING.bouncy.stiffness).toBe(400);
      expect(ANIMATION_SPRING.bouncy.damping).toBe(20);
    });

    it('should have gentle spring with type spring', () => {
      expect(ANIMATION_SPRING.gentle.type).toBe('spring');
      expect(ANIMATION_SPRING.gentle.stiffness).toBe(200);
      expect(ANIMATION_SPRING.gentle.damping).toBe(30);
    });

    it('should have all springs with required properties', () => {
      Object.values(ANIMATION_SPRING).forEach((spring) => {
        expect(spring).toHaveProperty('type');
        expect(spring).toHaveProperty('stiffness');
        expect(spring).toHaveProperty('damping');
        expect(spring.type).toBe('spring');
        expect(typeof spring.stiffness).toBe('number');
        expect(typeof spring.damping).toBe('number');
      });
    });
  });

  describe('STAGGER_DELAY', () => {
    it('should have correct delay values', () => {
      expect(STAGGER_DELAY.fast).toBe(0.015);
      expect(STAGGER_DELAY.normal).toBe(0.01);
      expect(STAGGER_DELAY.slow).toBe(0.1);
    });

    it('should have all delay keys', () => {
      expect(Object.keys(STAGGER_DELAY)).toEqual(['fast', 'normal', 'slow']);
    });

    it('should have all delays as positive numbers', () => {
      Object.values(STAGGER_DELAY).forEach((delay) => {
        expect(typeof delay).toBe('number');
        expect(delay).toBeGreaterThan(0);
      });
    });
  });
});
