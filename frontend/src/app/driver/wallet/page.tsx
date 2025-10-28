'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components';
import QRCode from 'qrcode';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { 
  WalletIcon, 
  ArrowUpTrayIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface WalletTransaction {
  _id: string;
  type: 'commission' | 'withdraw' | 'refund' | 'fee';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'escrowed';
  createdAt: string;
  orderId?: string;
  orderCode?: string;
}

interface DriverWalletBalance {
  balance: number;
  pendingBalance: number;
  escrowBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export default function DriverWalletPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { showToast } = useToast();

  const [balance, setBalance] = useState<DriverWalletBalance>({
    balance: 0,
    pendingBalance: 0,
    escrowBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Deposit states
  const [depositAmount, setDepositAmount] = useState('');
  const [customDepositAmount, setCustomDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [depositStep, setDepositStep] = useState<'amount' | 'qr'>('amount');
  const [currentTransactionId, setCurrentTransactionId] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

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
        
        const response = await fetch(`${api}/api/v1/drivers/mine/wallet/transaction/${transactionId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          const tx = result.transaction;
          console.log(`📊 Transaction status: ${tx.status}`);
          
          if (tx.status === 'completed') {
            console.log('✅ Transaction completed!');
            clearInterval(interval);
            setPollingInterval(null);
            setIsPolling(false);
            showToast('Nạp tiền thành công! Số dư đã được cập nhật.', 'success');
            resetDepositModal();
            loadWalletData(); // Reload balance
            return;
          } else if (tx.status === 'failed' || tx.status === 'cancelled') {
            console.log('❌ Transaction failed/cancelled');
            clearInterval(interval);
            setPollingInterval(null);
            setIsPolling(false);
            showToast('Giao dịch thất bại hoặc bị hủy.', 'error');
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
          showToast('Giao dịch đang chờ xử lý. Bạn có thể kiểm tra lại sau.', 'info');
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
      showToast('Số tiền nạp tối thiểu là 10,000 VND', 'error');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`${api}/api/v1/drivers/mine/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, provider: 'momo' })
      });
      
      const result = await response.json();
      console.log('Deposit response:', result);
      
      if (result.success && result.transaction) {
        const transaction = result.transaction;
        
        // Lưu transaction ID để confirm sau
        setCurrentTransactionId(transaction._id);
        
        // Tạo QR code từ payment URL nếu có
        if (transaction.paymentUrl) {
          const qrCodeDataURL = await QRCode.toDataURL(transaction.paymentUrl, {
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
          startPollingTransaction(transaction._id);
        } else {
          showToast('Tạo giao dịch thành công!', 'success');
          resetDepositModal();
          loadWalletData();
        }
      } else {
        showToast('Tạo giao dịch thất bại: ' + (result.message || 'Unknown error'), 'error');
      }
    } catch (error: any) {
      console.error('Error depositing:', error);
      showToast('Lỗi nạp tiền: ' + error.message, 'error');
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

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Load driver wallet balance
      const balanceResponse = await fetch(`${api}/api/v1/drivers/mine/wallet/balance`, {
        credentials: 'include'
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData);
        
        // Check if wallet exists
        const walletExists = balanceData !== null && balanceData.isActive !== false;
        setHasWallet(walletExists);
      }

      // Load transactions
      const transactionsResponse = await fetch(`${api}/api/v1/drivers/mine/wallet/transactions`, {
        credentials: 'include'
      });
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setHasWallet(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setCreatingWallet(true);
      
      // Call API to create wallet (backend will auto-create if not exists)
      const response = await fetch(`${api}/api/v1/drivers/mine/wallet/balance`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        showToast('Ví đã được tạo thành công!', 'success');
        await loadWalletData();
      } else {
        throw new Error('Failed to create wallet');
      }
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      showToast('Không thể tạo ví: ' + error.message, 'error');
    } finally {
      setCreatingWallet(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawPhone) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }

    const amount = parseInt(withdrawAmount) * 1000; // Convert to VND
    if (amount < 50000) {
      showToast('Số tiền rút tối thiểu là 50,000 VND', 'error');
      return;
    }

    if (amount > balance.balance) {
      showToast('Số dư không đủ', 'error');
      return;
    }

    try {
      setProcessing(true);
      
      const response = await fetch(`${api}/api/v1/drivers/mine/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          phone: withdrawPhone,
          description: `Rút tiền về số ${withdrawPhone}`
        })
      });

      if (response.ok) {
        showToast('Yêu cầu rút tiền đã được gửi!', 'success');
        setWithdrawDialogOpen(false);
        setWithdrawAmount('');
        setWithdrawPhone('');
        await loadWalletData();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Rút tiền thất bại');
      }
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      showToast('Rút tiền thất bại: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'escrowed': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'failed': return 'Thất bại';
      case 'escrowed': return 'Đang giữ';
      default: return 'Không xác định';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'commission': return 'Nhận tiền từ đơn hàng';
      case 'withdraw': return 'Rút tiền';
      case 'refund': return 'Hoàn tiền';
      case 'fee': return 'Phí dịch vụ';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Đang tải dữ liệu ví...</Typography>
      </Stack>
    );
  }

  // Show create wallet UI if no wallet exists
  if (hasWallet === false) {
    return (
      <div>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Ví tài xế</Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack alignItems="center" spacing={3} sx={{ py: 6 }}>
              <WalletIcon width={64} className="text-gray-400" />
              <Typography variant="h6" color="text.secondary" textAlign="center">
                Bạn chưa có ví
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Tạo ví ngay để nhận tiền từ các đơn hàng đã giao
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleCreateWallet}
                disabled={creatingWallet}
                startIcon={<WalletIcon width={20} />}
                sx={{ mt: 2 }}
              >
                {creatingWallet ? 'Đang tạo...' : 'Tạo ví'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Ví tài xế</Typography>

      {/* Balance Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <BanknotesIcon width={32} className="text-white" />
            <Typography variant="h5" fontWeight={600} color="white">Số dư khả dụng</Typography>
          </Stack>
          
          <Typography variant="h3" color="white" fontWeight={700} sx={{ mb: 1 }}>
            {balance.balance.toLocaleString('vi-VN')}đ
          </Typography>
          
          {balance.pendingBalance > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Số dư đang chờ: {balance.pendingBalance.toLocaleString('vi-VN')}đ
            </Alert>
          )}
          
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="rgba(255,255,255,0.9)">Tổng thu</Typography>
              <Typography variant="h6" color="white">
                +{balance.totalDeposits.toLocaleString('vi-VN')}đ
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="rgba(255,255,255,0.9)">Tổng chi</Typography>
              <Typography variant="h6" color="white">
                -{balance.totalWithdrawals.toLocaleString('vi-VN')}đ
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<CreditCardIcon width={20} />}
          onClick={() => setShowDepositModal(true)}
          sx={{ minWidth: 150 }}
        >
          Nạp tiền
        </Button>
        <Button
          variant="contained"
          startIcon={<ArrowUpTrayIcon width={20} />}
          onClick={() => setWithdrawDialogOpen(true)}
          disabled={balance.balance < 50000}
          sx={{ minWidth: 150 }}
        >
          Rút tiền
        </Button>
        <Button
          variant="outlined"
          startIcon={<ChartBarIcon width={20} />}
          onClick={loadWalletData}
          sx={{ minWidth: 150 }}
        >
          Làm mới
        </Button>
      </Stack>

      {/* Transactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Lịch sử giao dịch</Typography>
          
          {transactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CreditCardIcon width={48} className="text-gray-400 mx-auto mb-2" />
              <Typography variant="body2" color="text.secondary">
                Chưa có giao dịch nào
              </Typography>
            </Box>
          ) : (
            <List>
              {transactions.map((transaction, index) => (
                <div key={transaction._id}>
                  <ListItem>
                    <ListItemIcon>
                      <CreditCardIcon width={24} className="text-gray-600" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight={500}>
                            {getTypeText(transaction.type)}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight={600}
                            color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                          >
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('vi-VN')}đ
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            {transaction.description}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Chip 
                              label={getStatusText(transaction.status)} 
                              size="small" 
                              color={getStatusColor(transaction.status) as any}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                            </Typography>
                            {transaction.orderCode && (
                              <Typography variant="caption" color="primary">
                                #{transaction.orderCode}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < transactions.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Deposit Modal */}
      <Dialog open={showDepositModal} onClose={resetDepositModal} maxWidth="md" fullWidth>
        <DialogTitle>Nạp tiền vào ví</DialogTitle>
        <DialogContent>
          {depositStep === 'amount' && (
            <>
              {/* Chọn số tiền có sẵn */}
              <Typography variant="h6" sx={{ mb: 2 }}>Chọn số tiền</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }}>
                {presetAmounts.map((presetAmount) => (
                  <Button
                    key={presetAmount}
                    variant={depositAmount === (presetAmount / 1000).toString() ? 'contained' : 'outlined'}
                    onClick={() => handlePresetAmount(presetAmount)}
                    sx={{ minWidth: 100 }}
                  >
                    {(presetAmount / 1000).toLocaleString()}k
                  </Button>
                ))}
              </Stack>

              {/* Số tiền tùy chỉnh */}
              <TextField
                label="Số tiền tùy chỉnh (nghìn đồng)"
                type="number"
                value={customDepositAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                placeholder="Nhập số tiền (VD: 100 = 100,000 VND)"
                helperText="Tối thiểu 10,000 VND"
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* Hiển thị số tiền đã chọn */}
              {depositAmount && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Số tiền nạp: {(parseFloat(depositAmount) * 1000).toLocaleString()} VND
                </Alert>
              )}
            </>
          )}

          {depositStep === 'qr' && (
            <>
              {/* Hiển thị QR Code */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
                  Quét mã QR để thanh toán
                </Typography>
                
                <Box sx={{ p: 2, border: '2px solid #e0e0e0', borderRadius: 2, mb: 2, display: 'inline-block' }}>
                  <img src={qrCode} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Mở ứng dụng MoMo và quét mã QR này để thanh toán
                </Typography>

                {/* Hướng dẫn */}
                <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Hướng dẫn thanh toán:</Typography>
                  <Box component="div" sx={{ fontSize: '0.875rem' }}>
                    1. Mở ứng dụng MoMo trên điện thoại<br/>
                    2. Chọn "Quét mã QR"<br/>
                    3. Quét mã QR ở trên<br/>
                    4. Xác nhận thanh toán<br/>
                    5. Tiền sẽ được nạp vào ví
                  </Box>
                </Alert>

                {isPolling && (
                  <Alert severity="info">
                    Đang kiểm tra giao dịch... Vui lòng chờ trong giây lát.
                  </Alert>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {depositStep === 'amount' && (
            <>
              <Button onClick={resetDepositModal}>Hủy</Button>
              <Button
                onClick={handleDeposit}
                variant="contained"
                color="success"
                disabled={!depositAmount || processing}
              >
                {processing ? 'Đang xử lý...' : 'Nạp tiền qua MoMo'}
              </Button>
            </>
          )}
          {depositStep === 'qr' && (
            <Button onClick={() => setDepositStep('amount')} variant="outlined">
              Quay lại
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rút tiền</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Số tiền (VND)"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="50000"
              helperText="Tối thiểu 50,000 VND"
              fullWidth
            />
            <TextField
              label="Số điện thoại MoMo"
              type="tel"
              value={withdrawPhone}
              onChange={(e) => setWithdrawPhone(e.target.value)}
              placeholder="0123456789"
              fullWidth
            />
            <Alert severity="info">
              Tiền sẽ được chuyển vào tài khoản MoMo trong vòng 24h
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleWithdraw} 
            variant="contained" 
            disabled={processing || !withdrawAmount || !withdrawPhone}
          >
            {processing ? 'Đang xử lý...' : 'Rút tiền'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
