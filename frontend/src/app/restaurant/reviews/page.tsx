'use client';

import { useState, useEffect } from 'react';
import { restaurantService } from '@modules/restaurant/services';
import { handleApiError } from '@/services/api.client';

interface Review {
  _id: string;
  customer: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  rating: number;
  comment?: string;
  createdAt: string;
  helpfulCount: number;
  response?: string;
  responseAt?: string;
  orderId: string;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
}

export default function RestaurantReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'helpful'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [savingResponse, setSavingResponse] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [currentPage, filterRating, sortBy, sortOrder]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await restaurantService.getReviews({
        rating: filterRating || undefined,
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
      });

      setReviews(response.reviews);
      setSummary(response.summary);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToReview = async (reviewId: string) => {
    if (!responseText.trim()) return;

    try {
      setSavingResponse(true);
      await restaurantService.respondToReview(reviewId, responseText);
      setResponseText('');
      setRespondingTo(null);
      loadReviews(); // Reload to show the response
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSavingResponse(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl mt-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đánh giá & Phản hồi</h1>
          <p className="text-gray-600 mt-1">Quản lý đánh giá của khách hàng</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Xuất báo cáo
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Gửi yêu cầu đánh giá
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đánh giá trung bình</p>
                <p className="text-3xl font-bold text-gray-900">{summary.averageRating.toFixed(1)}</p>
                <div className="mt-1">
                  {renderStars(Math.round(summary.averageRating))}
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng đánh giá</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalReviews}</p>
                <p className="text-xs text-blue-600 mt-1">Đánh giá từ khách hàng</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đánh giá 5 sao</p>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.ratingDistribution.find(r => r.rating === 5)?.count || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {(summary.ratingDistribution.find(r => r.rating === 5)?.percentage || 0).toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌟</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Phản hồi</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reviews.filter(r => r.response).length}
                </p>
                <p className="text-xs text-purple-600 mt-1">Đã phản hồi</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {summary && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố đánh giá</h3>
          <div className="space-y-3">
            {summary.ratingDistribution
              .sort((a, b) => b.rating - a.rating)
              .map((dist) => (
                <div key={dist.rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-20">
                    <span className="font-medium">{dist.rating}</span>
                    <span className="text-yellow-400">⭐</span>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${dist.percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium">{dist.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({dist.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRating(null)}
              className={`px-3 py-1 rounded-md text-sm ${
                filterRating === null
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                  filterRating === rating
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating}⭐
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="date">Ngày đánh giá</option>
              <option value="rating">Điểm đánh giá</option>
              <option value="helpful">Hữu ích</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Đánh giá của khách hàng</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {reviews.map((review) => (
            <div key={review._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    {review.customer.avatarUrl ? (
                      <img src={review.customer.avatarUrl} alt={review.customer.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-orange-600 font-semibold">
                        {review.customer.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{review.customer.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Đơn hàng #{review.orderId.slice(-6).toUpperCase()}</p>
                  <p className="text-sm text-gray-500">Hữu ích: {review.helpfulCount}</p>
                </div>
              </div>

              {review.comment && (
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              )}

              {/* Restaurant Response */}
              {review.response ? (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-semibold text-sm">NH</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-orange-900">Phản hồi từ nhà hàng</span>
                        {review.responseAt && (
                          <span className="text-sm text-orange-600">{formatDate(review.responseAt)}</span>
                        )}
                      </div>
                      <p className="text-orange-800">{review.response}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setRespondingTo(review._id)}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    Phản hồi
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Đánh dấu hữu ích
                  </button>
                </div>
              )}

              {/* Response Form */}
              {respondingTo === review._id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Phản hồi đánh giá</h5>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Viết phản hồi của nhà hàng..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-3"
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespondToReview(review._id)}
                      disabled={savingResponse || !responseText.trim()}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingResponse ? 'Đang gửi...' : 'Gửi phản hồi'}
                    </button>
                    <button
                      onClick={() => {
                        setRespondingTo(null);
                        setResponseText('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Trang {currentPage} của {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


