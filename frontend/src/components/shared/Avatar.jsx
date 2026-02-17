export default function Avatar({ user, size = 'md', className = '', title, ...props }) {
  const sizes = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{ backgroundColor: user?.avatar_color || '#6366f1' }}
      title={title || user?.username}
      {...props}
    >
      <span className="text-white leading-none">{initials}</span>
    </div>
  );
}