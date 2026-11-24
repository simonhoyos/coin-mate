import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CATEGORY_COLOR_NAMES,
  CATEGORY_COLORS,
} from '@/lib/category-appearance';
import { CategoryColorPicker } from './category-color-picker';

function colorButtons() {
  return within(
    screen.getByRole('group', { name: 'Category color' }),
  ).getAllByRole('button');
}

function circleOf(button: HTMLElement) {
  return button.querySelector<HTMLElement>('[data-slot="category-icon"]');
}

describe('CategoryColorPicker', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders only the palette swatches, named and colored from the palette', () => {
    render(<CategoryColorPicker onChange={vi.fn()} />);

    const buttons = colorButtons();

    expect(buttons).toHaveLength(12);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual(
      CATEGORY_COLORS.map((hex) => CATEGORY_COLOR_NAMES[hex]),
    );
    expect(
      buttons.map((button) => circleOf(button)?.style.backgroundColor),
    ).toEqual([
      'rgb(107, 114, 128)',
      'rgb(239, 68, 68)',
      'rgb(249, 115, 22)',
      'rgb(245, 158, 11)',
      'rgb(234, 179, 8)',
      'rgb(34, 197, 94)',
      'rgb(20, 184, 166)',
      'rgb(6, 182, 212)',
      'rgb(59, 130, 246)',
      'rgb(99, 102, 241)',
      'rgb(168, 85, 247)',
      'rgb(236, 72, 153)',
    ]);
  });

  it('calls onChange with the hex of the clicked swatch', () => {
    const onChange = vi.fn();
    render(<CategoryColorPicker onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Red' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('#ef4444');
  });

  it('marks only the selected swatch as pressed', () => {
    render(<CategoryColorPicker value="#3b82f6" onChange={vi.fn()} />);

    const pressed = colorButtons().filter(
      (button) => button.getAttribute('aria-pressed') === 'true',
    );

    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.getAttribute('aria-label')).toBe('Blue');
    expect(
      colorButtons().every((button) => button.hasAttribute('aria-pressed')),
    ).toBe(true);
  });

  it.each([
    ['null', null],
    ['an off-palette color', '#123456'],
  ])('shows grey as pressed for %s', (_label, value) => {
    render(<CategoryColorPicker value={value} onChange={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Grey' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('previews every swatch with the given icon', () => {
    render(<CategoryColorPicker icon="car" onChange={vi.fn()} />);

    for (const button of colorButtons()) {
      expect(button.querySelector('svg.tabler-icon-car')).not.toBeNull();
    }
  });

  it('previews every swatch with the generic icon when no icon is given', () => {
    render(<CategoryColorPicker icon={null} onChange={vi.fn()} />);

    for (const button of colorButtons()) {
      expect(button.querySelector('svg.tabler-icon-category')).not.toBeNull();
    }
  });

  it('does not submit the surrounding form on click', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <CategoryColorPicker onChange={vi.fn()} />
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Red' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
