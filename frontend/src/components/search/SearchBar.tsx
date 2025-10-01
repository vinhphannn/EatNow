"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchHistory, SearchType } from "@/types/search";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string, filters?: any) => void;
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder = "Tìm kiếm món ăn, nhà hàng...",
  className = "",
  onSearch,
  showSuggestions = true,
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('eatnow_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save search to localStorage
  const saveSearchToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('eatnow_recent_searches', JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestionsList(false);
    
    // Save to search history
    saveSearchToHistory(searchQuery);
    
    // Track search in backend (optional)
    try {
      // await searchService.trackSearch(searchQuery, SearchType.GENERAL);
    } catch (error) {
      console.error('Error tracking search:', error);
    }

    // Navigate to search results
    const searchUrl = `/customer/search?q=${encodeURIComponent(searchQuery)}`;
    router.push(searchUrl);
    
    // Call custom onSearch if provided
    if (onSearch) {
      onSearch(searchQuery);
    }
    
    setIsLoading(false);
  };

  // Handle input change
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim() && showSuggestions) {
      // Generate suggestions based on recent searches and common terms
      const filteredRecent = recentSearches.filter(search => 
        search.toLowerCase().includes(value.toLowerCase())
      );
      
      const commonTerms = [
        'Pizza', 'Burger', 'Phở', 'Bún bò', 'Cơm tấm', 'Bánh mì',
        'Gà rán', 'Sushi', 'Ramen', 'Mì quảng', 'Bún chả'
      ].filter(term => 
        term.toLowerCase().includes(value.toLowerCase()) && 
        !filteredRecent.includes(term)
      );
      
      setSuggestions([...filteredRecent, ...commonTerms].slice(0, 8));
      setShowSuggestionsList(true);
    } else {
      setSuggestions([]);
      setShowSuggestionsList(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestionsList(false);
    handleSearch(suggestion);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('eatnow_recent_searches');
  };

  // Handle focus
  const handleFocus = () => {
    if (suggestions.length > 0 || recentSearches.length > 0) {
      setShowSuggestionsList(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500"
        />
        <button
          onClick={() => handleSearch()}
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tìm kiếm gần đây
                </h4>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Xóa tất cả
                </button>
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {search}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                Gợi ý
              </h4>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestionsList && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestionsList(false)}
        />
      )}
    </div>
  );
}
