"use client";

import Icon from "./icon";

type RatingStarsProps = {
  value: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
};

export default function RatingStars({
  value,
  interactive = false,
  onChange,
}: RatingStarsProps) {
  return (
    <div className="stars" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={n <= Math.round(value) ? "filled" : ""}
          onClick={() => interactive && onChange?.(n)}
          aria-label={`${n} estrelas`}
          tabIndex={interactive ? 0 : -1}
        >
          <Icon name="star" size={interactive ? 30 : 14} />
        </button>
      ))}
    </div>
  );
}
