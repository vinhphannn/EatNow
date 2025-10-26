import React from 'react';

interface CartItemOptionsProps {
  options: Array<{
    name: string;
    choices: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
  }>;
}

export const CartItemOptions: React.FC<CartItemOptionsProps> = ({ options }) => {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1">
      {options.map((option, index) => (
        <div key={index} className="text-xs text-gray-600">
          <span className="font-medium text-gray-700">{option.name}:</span>
          {option.choices && option.choices.length > 0 && (
            <span className="ml-1">
              {option.choices.map((choice, choiceIndex) => (
                <span key={choiceIndex} className="text-gray-600">
                  {choice.name}
                  {choice.quantity > 1 && (
                    <span className="text-gray-500"> (x{choice.quantity})</span>
                  )}
                  {choice.price > 0 && (
                    <span className="text-green-600 font-medium">
                      {' '}+{choice.price.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                  {choiceIndex < option.choices.length - 1 && (
                    <span className="text-gray-400">, </span>
                  )}
                </span>
              ))}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
