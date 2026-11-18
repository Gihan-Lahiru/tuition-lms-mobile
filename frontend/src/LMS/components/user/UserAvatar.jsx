import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { resolveAvatarUrl } from '../../utils/avatarUtils';

const SIZE_MAP = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-14 w-14 text-lg',
  '2xl': 'h-20 w-20 text-2xl',
};

export default function UserAvatar({
  user,
  src,
  size = 'md',
  className = '',
  ring = true,
  ringColor = 'ring-white/30',
  alt = 'Profile photo',
}) {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = resolveAvatarUrl(src || user);
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  // Reset error when URL changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const name = user?.name || '';
  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : null;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full font-bold select-none ${sizeClasses} ${
        ring ? `ring-2 ${ringColor}` : ''
      } ${className}`}
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name ? `${name}'s profile photo` : alt}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover rounded-full"
          loading="lazy"
        />
      ) : (
        <img
          src="/lms/images/default_student_avatar.png"
          alt="Student Profile"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          className="h-full w-full object-cover rounded-full"
        />
      )}
    </div>
  );
}
