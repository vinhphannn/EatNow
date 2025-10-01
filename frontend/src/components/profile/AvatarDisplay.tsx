"use client";

interface AvatarDisplayProps {
  avatarUrl?: string;
  userName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AvatarDisplay({ 
  avatarUrl, 
  userName,
  size = 'md',
  className = ''
}: AvatarDisplayProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBgColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={userName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={`w-full h-full ${getAvatarBgColor(userName)} flex items-center justify-center`}>
          <span className="text-white font-semibold">
            {getInitials(userName)}
          </span>
        </div>
      )}
    </div>
  );
}
