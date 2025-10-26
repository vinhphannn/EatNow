"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';

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

interface ItemOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedOptions: Record<string, string[]>) => void;
  itemName: string;
  itemPrice: number;
  options: ItemOption[];
}

export function ItemOptionsDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemPrice,
  options
}: ItemOptionsDialogProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [totalPrice, setTotalPrice] = useState(itemPrice);

  useEffect(() => {
    if (isOpen) {
      // Initialize with default choices
      const initialSelections: Record<string, string[]> = {};
      options.forEach(option => {
        const defaultChoices = option.choices.filter(choice => choice.isDefault);
        if (defaultChoices.length > 0) {
          initialSelections[option.id] = defaultChoices.map(choice => choice.id);
        } else if (option.required && option.choices.length > 0) {
          // If no default but required, select first choice
          initialSelections[option.id] = [option.choices[0].id];
        }
      });
      setSelectedOptions(initialSelections);
    }
  }, [isOpen, options]);

  useEffect(() => {
    // Calculate total price
    let total = itemPrice;
    options.forEach(option => {
      const selectedChoiceIds = selectedOptions[option.id] || [];
      selectedChoiceIds.forEach(choiceId => {
        const choice = option.choices.find(c => c.id === choiceId);
        if (choice) {
          total += choice.price;
        }
      });
    });
    setTotalPrice(total);
  }, [selectedOptions, itemPrice, options]);

  const handleChoiceToggle = (optionId: string, choiceId: string, optionType: 'single' | 'multiple') => {
    setSelectedOptions(prev => {
      const currentSelections = prev[optionId] || [];
      
      if (optionType === 'single') {
        // Single selection - replace current selection
        return {
          ...prev,
          [optionId]: [choiceId]
        };
      } else {
        // Multiple selection - toggle choice
        if (currentSelections.includes(choiceId)) {
          return {
            ...prev,
            [optionId]: currentSelections.filter(id => id !== choiceId)
          };
        } else {
          return {
            ...prev,
            [optionId]: [...currentSelections, choiceId]
          };
        }
      }
    });
  };

  const isSelectionValid = () => {
    return options.every(option => {
      if (option.required) {
        const selectedChoices = selectedOptions[option.id] || [];
        return selectedChoices.length > 0;
      }
      return true;
    });
  };

  const handleConfirm = () => {
    if (isSelectionValid()) {
      onConfirm(selectedOptions);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{itemName}</h3>
            <p className="text-sm text-gray-600">Tùy chọn món ăn</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {options.map((option) => (
            <div key={option.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{option.name}</h4>
                {option.required && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    Bắt buộc
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {option.type === 'single' ? 'Chọn 1' : 'Chọn nhiều'}
                </span>
              </div>

              <div className="space-y-2">
                {option.choices.map((choice) => {
                  const isSelected = selectedOptions[option.id]?.includes(choice.id) || false;
                  return (
                    <label
                      key={choice.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type={option.type === 'single' ? 'radio' : 'checkbox'}
                          name={`option-${option.id}`}
                          checked={isSelected}
                          onChange={() => handleChoiceToggle(option.id, choice.id, option.type)}
                          className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                        />
                        <span className="text-gray-900">{choice.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {choice.price > 0 && (
                          <span className="text-sm text-gray-600">
                            +{choice.price.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                        {isSelected && (
                          <FontAwesomeIcon icon={faCheck} className="text-orange-500" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
            <span className="text-xl font-bold text-orange-600">
              {totalPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>
          
          <button
            onClick={handleConfirm}
            disabled={!isSelectionValid()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isSelectionValid()
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSelectionValid() ? 'Thêm vào giỏ hàng' : 'Vui lòng chọn đầy đủ tùy chọn bắt buộc'}
          </button>
        </div>
      </div>
    </div>
  );
}
