'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { walletService } from '@/services/wallet.service';

export default function DepositSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Lấy thông tin từ URL params
        const orderId = searchParams.get('orderId');
        const resultCode = searchParams.get('resultCode');
        const message = searchParams.get('message');

        console.log('MoMo redirect params:', {
          orderId,
          resultCode,
          message
        });

        if (resultCode === '0') {
          // Thanh toán thành công trên phía MoMo (redirect). Chỉ hiển thị thông điệp
          // Việc cộng tiền sẽ do backend xác nhận qua IPN từ MoMo.
          setStatus('success');
          setMessage('Thanh toán thành công! Hệ thống sẽ xác nhận khi nhận được IPN từ MoMo.');

          // Chuyển về trang ví sau vài giây
          setTimeout(() => {
            router.push('/customer/wallet');
          }, 3000);
        } else {
          // Thanh toán thất bại
          setStatus('error');
          setMessage(`Thanh toán thất bại: ${message || 'Không xác định'}`);
          
          setTimeout(() => {
            router.push('/customer/wallet');
          }, 3000);
        }
      } catch (error) {
        console.error('Error handling success:', error);
        setStatus('error');
        setMessage('Có lỗi xảy ra khi xử lý thanh toán');
        
        setTimeout(() => {
          router.push('/customer/wallet');
        }, 3000);
      }
    };

    handleSuccess();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Đang xử lý...</h1>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-green-700 mb-4">
              Nạp tiền thành công!
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Tự động chuyển về trang ví trong 3 giây...
            </p>
            <button
              onClick={() => router.push('/customer/wallet')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Về trang ví ngay
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h1 className="text-2xl font-bold text-red-700 mb-4">
              Nạp tiền thất bại
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Tự động chuyển về trang ví trong 3 giây...
            </p>
            <button
              onClick={() => router.push('/customer/wallet')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Về trang ví ngay
            </button>
          </>
        )}
      </div>
    </div>
  );
}
