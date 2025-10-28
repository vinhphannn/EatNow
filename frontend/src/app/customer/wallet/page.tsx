'use client';

import { useState, useEffect } from 'react';
import { walletService, WalletBalance, WalletTransaction } from '@/services/wallet.service';
import { useCustomerAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode';

export default function WalletPage() {
  const { user } = useCustomerAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [customDepositAmount, setCustomDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [depositStep, setDepositStep] = useState<'amount' | 'qr'>('amount');
  const [currentTransactionId, setCurrentTransactionId] = useState<string>('');
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
  }, []); // Only run once on mount

  // Stop polling function
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setIsPolling(false);
      console.log('🛑 Polling stopped manually');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading wallet data...');
      
      const [balanceData, transactionsData] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions(50),
      ]);
      
      console.log('💰 Balance data received:', balanceData);
      console.log('📝 Transactions data received:', transactionsData);
      
      // Update state
      setBalance(balanceData);
      setTransactions(transactionsData);
      
      console.log('✅ Wallet data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading wallet data:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Số tiền có sẵn để chọn
  const presetAmounts = [50000, 100000, 200000, 500000, 1000000];

  const handlePresetAmount = (amount: number) => {
    setDepositAmount((amount / 1000).toString());
    setCustomDepositAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomDepositAmount(value);
    setDepositAmount(value);
  };

  // Polling function to check transaction status
  const startPollingTransaction = (transactionId: string) => {
    console.log(`🔄 Starting polling for transaction: ${transactionId}`);
    
    let pollCount = 0;
    const maxPolls = 20; // Maximum 20 polls (1 minute)
    
    const interval = setInterval(async () => {
      try {
        pollCount++;
        console.log(`🔍 Polling transaction (${pollCount}/${maxPolls}): ${transactionId}`);
        
        const response = await walletService.checkTransaction(transactionId);
        
        if (response.success && response.transaction) {
          const tx = response.transaction;
          console.log(`📊 Transaction status: ${tx.status}`);
          
          if (tx.status === 'completed') {
            console.log('✅ Transaction completed!');
            clearInterval(interval);
            setPollingInterval(null);
            setIsPolling(false);
            alert('Nạp tiền thành công! Số dư đã được cập nhật.');
            resetDepositModal();
            loadData(); // Reload balance
            return;
          } else if (tx.status === 'failed' || tx.status === 'cancelled') {
            console.log('❌ Transaction failed/cancelled');
            clearInterval(interval);
            setPollingInterval(null);
            setIsPolling(false);
            alert('Giao dịch thất bại hoặc bị hủy.');
            resetDepositModal();
            return;
          }
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          console.log('⏰ Polling timeout - maximum attempts reached');
          clearInterval(interval);
          setPollingInterval(null);
          setIsPolling(false);
          alert('Giao dịch đang chờ xử lý. Bạn có thể nhấn "Test Confirm" để test hoặc kiểm tra lại sau.');
        }
      } catch (error) {
        console.error('Error polling transaction:', error);
        pollCount++; // Count errors too
      }
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);
    setIsPolling(true);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount) * 1000;
    
    if (!depositAmount || amount < 10000) {
      alert('Số tiền nạp tối thiểu là 10,000 VND');
      return;
    }

    try {
      setProcessing(true);
      const response = await walletService.deposit(amount, 'momo');
      
      console.log('Deposit response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      if (response && response.paymentUrl) {
        const paymentUrl = response.paymentUrl;
        console.log('Payment URL:', paymentUrl);
        
        // Lưu transaction ID để confirm sau
        setCurrentTransactionId(response.transactionId);
        
        // Tạo QR code từ payment URL
        const qrCodeDataURL = await QRCode.toDataURL(paymentUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setQrCode(qrCodeDataURL);
        setDepositStep('qr');
        setShowQRCode(true);
        
        // Start polling for transaction status
        startPollingTransaction(response.transactionId);
      } else {
        console.log('No payment URL in response:', response);
        alert('Thanh toán thành công!');
        setShowDepositModal(false);
        setDepositAmount('');
        setCustomDepositAmount('');
        loadData();
      }
    } catch (error: any) {
      console.error('Error depositing:', error);
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckTransaction = async () => {
    if (!currentTransactionId) {
      alert('Không có transaction ID');
      return;
    }

    try {
      setProcessing(true);
      const response = await walletService.checkTransaction(currentTransactionId);
      
      console.log('Transaction check response:', response);
      
      if (response.success) {
        const tx = response.transaction;
        alert(`Giao dịch: ${tx.status}\nSố tiền: ${walletService.formatCurrency(tx.amount)}\nMô tả: ${tx.description}`);
        
        if (tx.status === 'pending') {
          alert('Giao dịch đang chờ xử lý. Nhấn "Xác nhận thanh toán" để hoàn tất.');
        } else if (tx.status === 'completed') {
          alert('Giao dịch đã hoàn thành! Số dư đã được cập nhật.');
          loadData(); // Reload balance
        }
      } else {
        alert('Không thể kiểm tra giao dịch: ' + response.message);
      }
    } catch (error: any) {
      console.error('Error checking transaction:', error);
      alert('Lỗi kiểm tra: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleTestConfirm = async () => {
    if (!currentTransactionId) {
      alert('Không có transaction ID');
      return;
    }

    try {
      setProcessing(true);
      console.log('🧪 Testing confirm deposit:', currentTransactionId);
      
      const response = await fetch(`http://localhost:3001/api/v1/payment/test-confirm/${currentTransactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const result = await response.json();
      console.log('Test confirm result:', result);
      
      if (result.success) {
        alert('Test confirm thành công! Số dư đã được cập nhật.');
        resetDepositModal();
        loadData(); // Reload balance
      } else {
        alert('Test confirm thất bại: ' + result.message);
      }
    } catch (error: any) {
      console.error('Error test confirming:', error);
      alert('Lỗi test confirm: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDeposit = async () => {
    if (!currentTransactionId) {
      alert('Không có transaction ID');
      return;
    }

    try {
      setProcessing(true);
      const response = await walletService.confirmDeposit(currentTransactionId);
      
      if (response.success) {
        alert('Xác nhận nạp tiền thành công!');
        resetDepositModal();
        loadData(); // Reload balance
      } else {
        alert('Xác nhận thất bại: ' + response.message);
      }
    } catch (error: any) {
      console.error('Error confirming deposit:', error);
      alert('Lỗi xác nhận: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const resetDepositModal = () => {
    setShowDepositModal(false);
    setDepositAmount('');
    setCustomDepositAmount('');
    setQrCode('');
    setShowQRCode(false);
    setDepositStep('amount');
    setCurrentTransactionId('');
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!withdrawPhone) {
      alert('Vui lòng nhập số điện thoại MoMo');
      return;
    }

    try {
      setProcessing(true);
      const response = await walletService.withdraw(
        parseFloat(withdrawAmount) * 1000,
        'momo',
        withdrawPhone
      );
      
      alert('Yêu cầu rút tiền đã được xử lý');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawPhone('');
      loadData();
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Ví của tôi</h1>
          
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <p className="text-sm mb-2">Số dư khả dụng</p>
              <p className="text-3xl font-bold">{walletService.formatCurrency(balance?.balance || 0)}</p>
              <p className="text-xs mt-1 opacity-75">State: {balance ? 'Loaded' : 'Not loaded'} | Raw: {balance?.balance || 0}</p>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <p className="text-sm mb-2">Số dư đang chờ</p>
              <p className="text-3xl font-bold">{walletService.formatCurrency(balance?.pendingBalance || 0)}</p>
              <p className="text-xs mt-1 opacity-75">Raw: {balance?.pendingBalance || 0}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              💰 Nạp tiền
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              💸 Rút tiền
            </button>
            <button
              onClick={loadData}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Tổng đã nạp</p>
              <p className="text-lg font-semibold text-gray-800">
                {walletService.formatCurrency(balance?.totalDeposits || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng đã rút</p>
              <p className="text-lg font-semibold text-gray-800">
                {walletService.formatCurrency(balance?.totalWithdrawals || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Lịch sử giao dịch</h2>
          
          {!transactions || transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Chưa có giao dịch nào</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {walletService.getTransactionTypeLabel(transaction.type)}
                      </p>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {walletService.formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {walletService.formatCurrency(transaction.amount)}
                      </p>
                      <p
                        className={`text-xs font-medium ${walletService.getTransactionStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status === 'pending' && '⏳ Đang xử lý'}
                        {transaction.status === 'completed' && '✅ Hoàn thành'}
                        {transaction.status === 'failed' && '❌ Thất bại'}
                        {transaction.status === 'cancelled' && '🚫 Đã hủy'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Nạp tiền vào ví</h3>
              
              {depositStep === 'amount' && (
                <>
                  {/* Chọn số tiền có sẵn */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Chọn số tiền</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {presetAmounts.map((presetAmount) => (
                        <button
                          key={presetAmount}
                          onClick={() => handlePresetAmount(presetAmount)}
                          className={`p-3 rounded-lg border-2 ${
                            depositAmount === (presetAmount / 1000).toString()
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {(presetAmount / 1000).toLocaleString()}k VND
                        </button>
                      ))}
                    </div>

                    {/* Số tiền tùy chỉnh */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tiền tùy chỉnh (nghìn đồng)
                      </label>
                      <input
                        type="number"
                        value={customDepositAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        placeholder="Nhập số tiền (VD: 100 = 100,000 VND)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="10"
                      />
                    </div>
                  </div>

                  {/* Hiển thị số tiền đã chọn */}
                  {depositAmount && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-center text-lg font-semibold text-blue-700">
                        Số tiền nạp: {(parseFloat(depositAmount) * 1000).toLocaleString()} VND
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={resetDepositModal}
                      className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || processing}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-400"
                    >
                      {processing ? 'Đang xử lý...' : 'Nạp tiền qua MoMo'}
                    </button>
                  </div>
                </>
              )}

              {depositStep === 'qr' && (
                <>
                  {/* Hiển thị QR Code */}
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-3 text-green-700">
                      Quét mã QR để thanh toán
                    </h4>
                    
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                      <img src={qrCode} alt="QR Code" className="mx-auto" />
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      Mở ứng dụng MoMo và quét mã QR này để thanh toán
                    </p>

                    {/* Hướng dẫn */}
                    <div className="p-4 bg-yellow-50 rounded-lg mb-4">
                      <h5 className="font-semibold text-yellow-800 mb-2">
                        Hướng dẫn thanh toán:
                      </h5>
                      <ol className="text-sm text-yellow-700 space-y-1 text-left">
                        <li>1. Mở ứng dụng MoMo trên điện thoại</li>
                        <li>2. Chọn "Quét mã QR"</li>
                        <li>3. Quét mã QR ở trên</li>
                        <li>4. Xác nhận thanh toán</li>
                        <li>5. Tiền sẽ được nạp vào ví</li>
                      </ol>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Quét mã QR bằng ứng dụng MoMo để thanh toán
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Hệ thống sẽ tự động cập nhật số dư khi thanh toán thành công
                      </p>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDepositStep('amount')}
                            className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                          >
                            Quay lại
                          </button>
                        </div>
                        {/* Nút dừng polling đã được gỡ để tránh thao tác thủ công */}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Rút tiền</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền (nghìn đồng)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Nhập số tiền (VD: 50 = 50,000 VND)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại MoMo
                </label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="0937xxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={processing}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

