import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATEGORY_ICON_KEYS } from '@/lib/category-appearance';
import { CategoryIconPicker } from './category-icon-picker';

function iconButtons() {
  return within(
    screen.getByRole('group', { name: 'Category icon' }),
  ).getAllByRole('button');
}

describe('CategoryIconPicker', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders one button per curated icon, each with its circle', () => {
    render(<CategoryIconPicker onChange={vi.fn()} />);

    const buttons = iconButtons();

    expect(buttons).toHaveLength(CATEGORY_ICON_KEYS.length);
    buttons.forEach((button, index) => {
      const key = CATEGORY_ICON_KEYS[index];
      expect(
        button.querySelector('[data-slot="category-icon"]'),
      ).not.toBeNull();
      expect(button.querySelector(`svg.tabler-icon-${key}`)).not.toBeNull();
    });
  });

  it('names the buttons from the key, dropping numeric parts', () => {
    render(<CategoryIconPicker onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'shopping cart' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'tools kitchen' })).toBeDefined();
  });

  it('calls onChange with the key of the clicked icon', () => {
    const onChange = vi.fn();
    render(<CategoryIconPicker onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'shopping cart' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('shopping-cart');
  });

  it('marks only the selected icon as pressed', () => {
    render(<CategoryIconPicker value="car" onChange={vi.fn()} />);

    const pressed = iconButtons().filter(
      (button) => button.getAttribute('aria-pressed') === 'true',
    );

    expect(pressed).toHaveLength(1);
    expect(pressed[0]?.getAttribute('aria-label')).toBe('car');
    expect(
      iconButtons().every((button) => button.hasAttribute('aria-pressed')),
    ).toBe(true);
  });

  it.each([
    ['null', null],
    ['an unknown key', 'not-an-icon'],
  ])('shows the generic icon as pressed for %s', (_label, value) => {
    render(<CategoryIconPicker value={value} onChange={vi.fn()} />);

    expect(
      screen
        .getByRole('button', { name: 'category' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('previews every icon in the given color', () => {
    render(<CategoryIconPicker color="#ef4444" onChange={vi.fn()} />);

    for (const button of iconButtons()) {
      const circle = button.querySelector<HTMLElement>(
        '[data-slot="category-icon"]',
      );
      expect(circle?.style.backgroundColor).toBe('rgb(239, 68, 68)');
    }
  });

  it('previews every icon on grey when no color is given', () => {
    render(<CategoryIconPicker color={null} onChange={vi.fn()} />);

    for (const button of iconButtons()) {
      const circle = button.querySelector<HTMLElement>(
        '[data-slot="category-icon"]',
      );
      expect(circle?.style.backgroundColor).toBe('rgb(107, 114, 128)');
    }
  });

  it('does not submit the surrounding form on click', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <CategoryIconPicker onChange={vi.fn()} />
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'car' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('is named by an external label through aria-labelledby', () => {
    render(
      <div>
        <span id="icon-label">Icon</span>
        <CategoryIconPicker aria-labelledby="icon-label" onChange={vi.fn()} />
      </div>,
    );

    expect(screen.getByRole('group', { name: 'Icon' })).toBeDefined();
  });
});
