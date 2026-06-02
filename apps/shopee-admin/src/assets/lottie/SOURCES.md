# Lottie Animation Sources

All Lottie JSON files in this directory are used for UI micro-animations.

## no-results.json

- **Description**: Empty box / no results animation
- **License**: MIT (inline — custom minimal animation)
- **Origin**: Hand-crafted minimal Lottie JSON for no-results empty state

## loading.json

- **Description**: Spinning dots loading indicator
- **License**: MIT (inline — custom minimal animation)
- **Origin**: Hand-crafted minimal Lottie JSON for loading state

## Usage

These files are imported as ES modules (Vite handles JSON imports natively).
They are bundled into the build output — no runtime network requests.

## Adding New Animations

When sourcing from LottieFiles or similar:

1. Verify the license is permissive (CC0, MIT, or similar)
2. Test with lottie-react before committing
3. Document the source URL and license here
4. Prefer simple path/shape animations (no expressions, no effects)
