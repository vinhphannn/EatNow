import React from 'react';

interface ItemNumberProps {
  number: number;
  className?: string;
}

export const ItemNumber: React.FC<ItemNumberProps> = ({ number, className = '' }) => {
  return (
    <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md ${className}`}>
      {number}
    </div>
  );
};
