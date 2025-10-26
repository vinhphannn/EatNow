'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components';
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
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  ClockIcon,
  BanknotesIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

interface WalletTransaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'order_payment' | 'refund' | 'fee';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  orderId?: string;
  orderCode?: string;
}

interface WalletBalance {
  balance: number;
  pendingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export default function RestaurantWalletPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { showToast } = useToast();

  const [balance, setBalance] = useState<WalletBalance>({
    balance: 0,
    pendingBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Load wallet balance
      const balanceResponse = await fetch(`${api}/api/v1/restaurants/mine/wallet/balance`, {
        credentials: 'include'
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData);
      }

      // Load transactions
      const transactionsResponse = await fetch(`${api}/api/v1/restaurants/mine/wallet/transactions`, {
        credentials: 'include'
      });
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      showToast('Có lỗi xảy ra khi tải dữ liệu ví', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${api}/api/v1/restaurants/mine/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        showToast('Yêu cầu nạp tiền đã được gửi', 'success');
        setDepositDialogOpen(false);
        setDepositAmount('');
        loadWalletData();
      } else {
        showToast('Có lỗi xảy ra khi nạp tiền', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra khi nạp tiền', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ', 'error');
      return;
    }

    if (amount > balance.balance) {
      showToast('Số dư không đủ để rút tiền', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${api}/api/v1/restaurants/mine/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        showToast('Yêu cầu rút tiền đã được gửi', 'success');
        setWithdrawDialogOpen(false);
        setWithdrawAmount('');
        loadWalletData();
      } else {
        showToast('Có lỗi xảy ra khi rút tiền', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra khi rút tiền', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownTrayIcon width={20} className="text-green-600" />;
      case 'withdraw': return <ArrowUpTrayIcon width={20} className="text-red-600" />;
      case 'order_payment': return <BanknotesIcon width={20} className="text-blue-600" />;
      case 'refund': return <CreditCardIcon width={20} className="text-orange-600" />;
      case 'fee': return <WalletIcon width={20} className="text-gray-600" />;
      default: return <ClockIcon width={20} className="text-gray-600" />;
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'deposit': return 'Nạp tiền';
      case 'withdraw': return 'Rút tiền';
      case 'order_payment': return 'Thanh toán đơn hàng';
      case 'refund': return 'Hoàn tiền';
      case 'fee': return 'Phí dịch vụ';
      default: return 'Giao dịch khác';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'failed': return 'Thất bại';
      default: return 'Không xác định';
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

  return (
    <div>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Ví điện tử</Typography>

      {/* Balance Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <WalletIcon width={32} className="text-orange-600" />
            <Typography variant="h5" fontWeight={600}>Số dư hiện tại</Typography>
          </Stack>
          
          <Typography variant="h3" color="primary.main" fontWeight={700} sx={{ mb: 1 }}>
            {balance.balance.toLocaleString('vi-VN')}đ
          </Typography>
          
          {balance.pendingBalance > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Số dư đang chờ: {balance.pendingBalance.toLocaleString('vi-VN')}đ
            </Alert>
          )}
          
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">Tổng nạp</Typography>
              <Typography variant="h6" color="success.main">
                +{balance.totalDeposits.toLocaleString('vi-VN')}đ
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">Tổng rút</Typography>
              <Typography variant="h6" color="error.main">
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
          size="large"
          startIcon={<ArrowDownTrayIcon width={20} />}
          onClick={() => setDepositDialogOpen(true)}
          sx={{ flex: 1, py: 2 }}
        >
          Nạp tiền
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ArrowUpTrayIcon width={20} />}
          onClick={() => setWithdrawDialogOpen(true)}
          sx={{ flex: 1, py: 2 }}
        >
          Rút tiền
        </Button>
      </Stack>

      {/* Transactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Giao dịch gần đây</Typography>
          
          {transactions.length === 0 ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <ClockIcon width={48} className="text-gray-400" />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Chưa có giao dịch nào
              </Typography>
            </Stack>
          ) : (
            <List>
              {transactions.map((transaction, index) => (
                <div key={transaction._id}>
                  <ListItem>
                    <ListItemIcon>
                      {getTransactionIcon(transaction.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight={600}>
                            {getTransactionTypeText(transaction.type)}
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
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {transaction.description}
                            {transaction.orderCode && ` - Đơn hàng #${transaction.orderCode}`}
                          </Typography>
                          <Chip 
                            label={getStatusText(transaction.status)} 
                            color={getStatusColor(transaction.status) as any}
                            size="small"
                          />
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

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onClose={() => setDepositDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nạp tiền vào ví</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Số tiền nạp (VNĐ)"
            type="number"
            fullWidth
            variant="outlined"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Yêu cầu nạp tiền sẽ được xử lý trong vòng 24 giờ làm việc.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleDeposit} 
            variant="contained" 
            disabled={processing}
          >
            {processing ? 'Đang xử lý...' : 'Nạp tiền'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rút tiền từ ví</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Số tiền rút (VNĐ)"
            type="number"
            fullWidth
            variant="outlined"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Số dư khả dụng: {balance.balance.toLocaleString('vi-VN')}đ
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleWithdraw} 
            variant="contained" 
            disabled={processing}
          >
            {processing ? 'Đang xử lý...' : 'Rút tiền'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}






















