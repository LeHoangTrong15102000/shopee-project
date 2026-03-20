import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import ProfileFieldCard from '../components/ProfileFieldCard';
import { PROFILE_FIELDS } from '../profileCompletion.constants';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe('ProfileFieldCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - All Fields Incomplete', () => {
    test('should render all profile fields when none are completed', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      // All 5 fields should be rendered
      expect(screen.getByText('Tên')).toBeInTheDocument();
      expect(screen.getByText('Ảnh đại diện')).toBeInTheDocument();
      expect(screen.getByText('Số điện thoại')).toBeInTheDocument();
      expect(screen.getByText('Địa chỉ')).toBeInTheDocument();
      expect(screen.getByText('Ngày sinh')).toBeInTheDocument();
    });

    test('should show update buttons for all incomplete fields', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      const updateButtons = screen.getAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(5);
    });

    test('should render update links pointing to profile page', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      const updateLinks = screen.getAllByRole('link', { name: /Cập nhật/i });
      expect(updateLinks).toHaveLength(5);
      updateLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/user/profile');
      });
    });

    test('should not show any checkmark icons when no fields are completed', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      const checkmarks = screen.queryAllByLabelText('Đã hoàn thành');
      expect(checkmarks).toHaveLength(0);
    });
  });

  describe('Rendering - Some Fields Completed', () => {
    test('should show checkmark for completed name field', () => {
      const completedFields = [PROFILE_FIELDS[0]]; // name field

      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={completedFields} reducedMotion={false} />
        </TestWrapper>,
      );

      const checkmarks = screen.getAllByLabelText('Đã hoàn thành');
      expect(checkmarks).toHaveLength(1);
    });

    test('should show update buttons only for incomplete fields', () => {
      const completedFields = [PROFILE_FIELDS[0], PROFILE_FIELDS[1]]; // name and avatar

      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={completedFields} reducedMotion={false} />
        </TestWrapper>,
      );

      const updateButtons = screen.getAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(3); // 5 total - 2 completed = 3 incomplete
    });

    test('should render correct mix of completed and incomplete fields', () => {
      const completedFields = [PROFILE_FIELDS[0], PROFILE_FIELDS[2], PROFILE_FIELDS[4]]; // name, phone, date_of_birth

      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={completedFields} reducedMotion={false} />
        </TestWrapper>,
      );

      const checkmarks = screen.getAllByLabelText('Đã hoàn thành');
      expect(checkmarks).toHaveLength(3);

      const updateButtons = screen.getAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(2); // avatar and address
    });
  });

  describe('Rendering - All Fields Completed', () => {
    test('should show checkmarks for all fields when all are completed', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={PROFILE_FIELDS} reducedMotion={false} />
        </TestWrapper>,
      );

      const checkmarks = screen.getAllByLabelText('Đã hoàn thành');
      expect(checkmarks).toHaveLength(5);
    });

    test('should not show any update buttons when all fields are completed', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={PROFILE_FIELDS} reducedMotion={false} />
        </TestWrapper>,
      );

      const updateButtons = screen.queryAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(0);
    });

    test('should render all field labels even when completed', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={PROFILE_FIELDS} reducedMotion={false} />
        </TestWrapper>,
      );

      expect(screen.getByText('Tên')).toBeInTheDocument();
      expect(screen.getByText('Ảnh đại diện')).toBeInTheDocument();
      expect(screen.getByText('Số điện thoại')).toBeInTheDocument();
      expect(screen.getByText('Địa chỉ')).toBeInTheDocument();
      expect(screen.getByText('Ngày sinh')).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    test('should render correctly with reduced motion enabled', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={true} />
        </TestWrapper>,
      );

      expect(screen.getByText('Tên')).toBeInTheDocument();
      expect(screen.getByText('Ảnh đại diện')).toBeInTheDocument();
      const updateButtons = screen.getAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(5);
    });

    test('should render completed fields correctly with reduced motion', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={PROFILE_FIELDS} reducedMotion={true} />
        </TestWrapper>,
      );

      const checkmarks = screen.getAllByLabelText('Đã hoàn thành');
      expect(checkmarks).toHaveLength(5);
    });

    test('should render partial completion with reduced motion', () => {
      const completedFields = [PROFILE_FIELDS[0], PROFILE_FIELDS[2]];

      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={completedFields} reducedMotion={true} />
        </TestWrapper>,
      );

      const checkmarks = screen.getAllByLabelText('Đã hoàn thành');
      expect(checkmarks).toHaveLength(2);

      const updateButtons = screen.getAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(3);
    });
  });

  describe('Field Icons', () => {
    test('should render icons for all fields', () => {
      const { container } = render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      // Each field should have an icon (SVG)
      const svgs = container.querySelectorAll('svg');
      // 5 field icons + 5 arrow icons in update buttons = 10 total
      expect(svgs.length).toBeGreaterThanOrEqual(10);
    });

    test('should render checkmark SVG for completed fields', () => {
      const { container } = render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[PROFILE_FIELDS[0]]} reducedMotion={false} />
        </TestWrapper>,
      );

      // Find checkmark path
      const checkmarkPath = container.querySelector('path[d="M5 13l4 4L19 7"]');
      expect(checkmarkPath).toBeInTheDocument();
    });
  });

  describe('Styling and CSS Classes', () => {
    test('should apply incomplete field styling to incomplete fields', () => {
      const { container } = render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      // Check for orange/amber styling (incomplete fields)
      const incompleteCards = container.querySelectorAll('.border-orange-200\\/60');
      expect(incompleteCards.length).toBeGreaterThan(0);
    });

    test('should apply completed field styling to completed fields', () => {
      const { container } = render(
        <TestWrapper>
          <ProfileFieldCard completedFields={PROFILE_FIELDS} reducedMotion={false} />
        </TestWrapper>,
      );

      // Check for emerald/teal styling (completed fields)
      const completedCards = container.querySelectorAll('.border-emerald-200\\/60');
      expect(completedCards.length).toBeGreaterThan(0);
    });

    test('should apply grid layout classes', () => {
      const { container } = render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty completedFields array', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      const updateButtons = screen.getAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(5);
    });

    test('should handle single completed field', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[PROFILE_FIELDS[0]]} reducedMotion={false} />
        </TestWrapper>,
      );

      const checkmarks = screen.getAllByLabelText('Đã hoàn thành');
      expect(checkmarks).toHaveLength(1);

      const updateButtons = screen.getAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(4);
    });

    test('should handle all but one field completed', () => {
      const completedFields = PROFILE_FIELDS.slice(0, 4); // All except last

      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={completedFields} reducedMotion={false} />
        </TestWrapper>,
      );

      const checkmarks = screen.getAllByLabelText('Đã hoàn thành');
      expect(checkmarks).toHaveLength(4);

      const updateButtons = screen.getAllByText('Cập nhật');
      expect(updateButtons).toHaveLength(1);
    });

    test('should handle duplicate completed fields gracefully', () => {
      const completedFields = [PROFILE_FIELDS[0], PROFILE_FIELDS[0], PROFILE_FIELDS[1]];

      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={completedFields} reducedMotion={false} />
        </TestWrapper>,
      );

      // Should still work correctly despite duplicates
      const checkmarks = screen.getAllByLabelText('Đã hoàn thành');
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('should have proper aria-label for completed field indicators', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[PROFILE_FIELDS[0]]} reducedMotion={false} />
        </TestWrapper>,
      );

      const completedIndicator = screen.getByLabelText('Đã hoàn thành');
      expect(completedIndicator).toBeInTheDocument();
    });

    test('should have proper link roles for update buttons', () => {
      render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      const updateLinks = screen.getAllByRole('link');
      expect(updateLinks.length).toBeGreaterThanOrEqual(5);
    });

    test('should have aria-hidden on decorative SVG elements', () => {
      const { container } = render(
        <TestWrapper>
          <ProfileFieldCard completedFields={[]} reducedMotion={false} />
        </TestWrapper>,
      );

      const ariaHiddenSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(ariaHiddenSvgs.length).toBeGreaterThan(0);
    });
  });
});
