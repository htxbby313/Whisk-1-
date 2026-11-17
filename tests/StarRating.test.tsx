import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { StarRating } from '../App';

describe('StarRating', () => {
  it('renders correct number of filled stars for rating 3', () => {
    const { container } = render(<StarRating rating={3} interactive={false} />);
    const filledStars = container.querySelectorAll('.fill-amber-400');
    expect(filledStars.length).toBe(3);
  });

  it('renders 0 filled stars when rating is 0', () => {
    const { container } = render(<StarRating rating={0} interactive={false} />);
    const filledStars = container.querySelectorAll('.fill-amber-400');
    expect(filledStars.length).toBe(0);
  });

  it('renders 5 filled stars when rating is 5', () => {
    const { container } = render(<StarRating rating={5} interactive={false} />);
    const filledStars = container.querySelectorAll('.fill-amber-400');
    expect(filledStars.length).toBe(5);
  });
});
