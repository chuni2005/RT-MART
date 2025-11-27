import React from 'react';
import styles from './RatingFilter.module.scss';

export interface RatingFilterProps {
  value: number | null;
  onChange: (rating: number | null) => void;
}

interface RatingOption {
  value: number | null;
  label: string;
  stars: string;
}

const RATING_OPTIONS: RatingOption[] = [
  { value: null, label: '全部', stars: '' },
  { value: 5, label: '(5 星)', stars: '⭐⭐⭐⭐⭐' },
  { value: 4, label: '(4 星以上)', stars: '⭐⭐⭐⭐' },
  { value: 3, label: '(3 星以上)', stars: '⭐⭐⭐' },
];

function RatingFilter({ value, onChange }: RatingFilterProps) {
  const handleChange = (rating: number | null) => {
    onChange(rating);
  };

  return (
    <div className={styles.ratingFilter}>
      <h3 className={styles.filterTitle}>評價篩選</h3>
      <div className={styles.ratingOptions}>
        {RATING_OPTIONS.map((option) => {
          const isChecked = value === option.value;
          const optionId = `rating-${option.value ?? 'all'}`;

          return (
            <label
              key={optionId}
              htmlFor={optionId}
              className={`${styles.ratingOption} ${isChecked ? styles.active : ''}`}
            >
              <input
                type="radio"
                id={optionId}
                name="rating"
                value={option.value ?? ''}
                checked={isChecked}
                onChange={() => handleChange(option.value)}
                className={styles.radioInput}
              />
              <span className={styles.optionLabel}>
                {option.stars && <span className={styles.stars}>{option.stars}</span>}
                <span className={styles.text}>{option.label}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default RatingFilter;
