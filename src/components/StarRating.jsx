import { useState } from 'react';

export default function StarRating({ rating = 0, onChange, size = 'normal', readOnly = false }) {
    const [hover, setHover] = useState(0);
    const isDisplay = readOnly || !onChange;
    const className = isDisplay ? 'star-rating-display' : 'star-rating';

    return (
        <div className={className}>
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
                    style={size === 'large' ? { fontSize: '1.5rem' } : undefined}
                    onClick={() => !isDisplay && onChange && onChange(star === rating ? 0 : star)}
                    onMouseEnter={() => !isDisplay && setHover(star)}
                    onMouseLeave={() => !isDisplay && setHover(0)}
                    role={isDisplay ? undefined : 'button'}
                    aria-label={`${star} yıldız`}
                >
                    ★
                </span>
            ))}
        </div>
    );
}
