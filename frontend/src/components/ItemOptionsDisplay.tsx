"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

interface OptionChoice {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
}

interface ItemOption {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  choices: OptionChoice[];
}

interface ItemOptionsDisplayProps {
  optionsSnapshot: Record<string, any>;
  itemName: string;
}

export function ItemOptionsDisplay({ 
  optionsSnapshot, 
  itemName 
}: ItemOptionsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count total options
  const totalOptions = Object.values(optionsSnapshot).reduce((sum, option: any) => {
    if (option && option.choices) {
      return sum + option.choices.length;
    }
    return sum;
  }, 0);
  
  if (totalOptions === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span>
          Tùy chọn đã chọn ({totalOptions} mục)
        </span>
        <FontAwesomeIcon 
          icon={isExpanded ? faChevronUp : faChevronDown} 
          className="text-xs" 
        />
      </button>
      
      {isExpanded && (
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-200">
          {Object.entries(optionsSnapshot).map(([optionId, optionData]) => (
            <div key={optionId} className="text-sm">
              <div className="font-medium text-gray-700 mb-1">
                {optionData?.optionName || `Tùy chọn ${optionId.slice(-4)}`}:
              </div>
              <div className="space-y-1">
                {optionData?.choices?.map((choice: any, index: number) => (
                  <div key={choice.id} className="flex items-center justify-between text-gray-600">
                    <span>• {choice.name}</span>
                    {choice.price > 0 && (
                      <span className="text-xs text-orange-600">
                        +{choice.price.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                )) || []}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
