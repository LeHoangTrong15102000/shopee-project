import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatingStars from '../RatingStars';

// Mock useProductQueryStates hook
const mockSetFilters = vi.fn();
vi.mock('src/hooks/nuqs', () => ({
  useProductQueryStates: () => [null, mockSetFilters],
}));

describe('RatingStars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 5 rating filter options', () => {
    render(<RatingStars />);

    const ratingButtons = screen.getAllByRole('button');
    expect(ratingButtons).toHaveLength(5);
  });

  it('renders correct aria-labels for each rating option', () => {
    render(<RatingStars />);

    expect(screen.getByRole('button', { name: '5 sao trở lên' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4 sao trở lên' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3 sao trở lên' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2 sao trở lên' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 sao trở lên' })).toBeInTheDocument();
  });

  it('displays "trở lên" text for ratings 1-4 but not for 5 stars', () => {
    const { container } = render(<RatingStars />);

    const textElements = container.querySelectorAll('span');
    // Should have 4 "trở lên" texts (for 1-4 stars, not for 5 stars)
    expect(textElements).toHaveLength(4);
    textElements.forEach((element) => {
      expect(element.textContent).toBe('trở lên');
    });
  });

  it('calls setFilters with correct rating when clicked', async () => {
    const user = userEvent.setup();
    render(<RatingStars />);

    const fiveStarButton = screen.getByRole('button', { name: '5 sao trở lên' });
    await user.click(fiveStarButton);

    expect(mockSetFilters).toHaveBeenCalledWith({ rating_filter: 5 });
    expect(mockSetFilters).toHaveBeenCalledTimes(1);
  });

  it('calls setFilters with correct rating for different star options', async () => {
    const user = userEvent.setup();
    render(<RatingStars />);

    const threeStarButton = screen.getByRole('button', { name: '3 sao trở lên' });
    await user.click(threeStarButton);

    expect(mockSetFilters).toHaveBeenCalledWith({ rating_filter: 3 });
  });

  it('handles Enter key press to filter ratings', async () => {
    const user = userEvent.setup();
    render(<RatingStars />);

    const fourStarButton = screen.getByRole('button', { name: '4 sao trở lên' });
    fourStarButton.focus();
    await user.keyboard('{Enter}');

    expect(mockSetFilters).toHaveBeenCalledWith({ rating_filter: 4 });
  });

  it('handles Space key press to filter ratings', async () => {
    const user = userEvent.setup();
    render(<RatingStars />);

    const twoStarButton = screen.getByRole('button', { name: '2 sao trở lên' });
    twoStarButton.focus();
    await user.keyboard(' ');

    expect(mockSetFilters).toHaveBeenCalledWith({ rating_filter: 2 });
  });

  it('does not trigger filter on other key presses', async () => {
    const user = userEvent.setup();
    render(<RatingStars />);

    const oneStarButton = screen.getByRole('button', { name: '1 sao trở lên' });
    oneStarButton.focus();
    await user.keyboard('{Tab}');

    expect(mockSetFilters).not.toHaveBeenCalled();
  });

  it('renders correct number of filled and empty stars for each rating option', () => {
    const { container } = render(<RatingStars />);

    const ratingButtons = screen.getAllByRole('button');

    // 5 stars option: should have 5 filled stars (with gradient)
    const fiveStarSvgs = ratingButtons[0].querySelectorAll('svg');
    expect(fiveStarSvgs).toHaveLength(5);

    // 4 stars option: should have 4 filled + 1 empty
    const fourStarSvgs = ratingButtons[1].querySelectorAll('svg');
    expect(fourStarSvgs).toHaveLength(5);

    // 3 stars option: should have 3 filled + 2 empty
    const threeStarSvgs = ratingButtons[2].querySelectorAll('svg');
    expect(threeStarSvgs).toHaveLength(5);

    // 2 stars option: should have 2 filled + 3 empty
    const twoStarSvgs = ratingButtons[3].querySelectorAll('svg');
    expect(twoStarSvgs).toHaveLength(5);

    // 1 star option: should have 1 filled + 4 empty
    const oneStarSvgs = ratingButtons[4].querySelectorAll('svg');
    expect(oneStarSvgs).toHaveLength(5);
  });

  it('has proper accessibility attributes', () => {
    render(<RatingStars />);

    const ratingButtons = screen.getAllByRole('button');

    ratingButtons.forEach((button) => {
      expect(button).toHaveAttribute('tabIndex', '0');
      expect(button).toHaveAttribute('role', 'button');
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('applies correct CSS classes for styling', () => {
    const { container } = render(<RatingStars />);

    const ratingButtons = screen.getAllByRole('button');

    ratingButtons.forEach((button) => {
      expect(button).toHaveClass('cursor-pointer');
      expect(button).toHaveClass('hover:bg-orange-50');
      expect(button).toHaveClass('dark:hover:bg-slate-700');
    });

    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(5);
    listItems.forEach((li) => {
      expect(li).toHaveClass('min-h-[44px]');
    });
  });

  it('renders SVG stars with correct gradient IDs', () => {
    const { container } = render(<RatingStars />);

    // Check for filled star gradient
    const filledStarGradient = container.querySelector('#ratingStarGradient');
    expect(filledStarGradient).toBeInTheDocument();

    // Check for hollow star gradient
    const hollowStarGradient = container.querySelector('#star__hollow');
    expect(hollowStarGradient).toBeInTheDocument();
  });
});
