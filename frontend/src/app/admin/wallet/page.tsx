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
  ArrowUpTrayIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface WalletTransaction {
  _id: string;
  type: 'platform_fee' | 'withdraw' | 'refund' | 'fee';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'escrowed';
  createdAt: string;
  orderId?: string;
  orderCode?: string;
}

interface SystemWalletBalance {
  balance: number;
  pendingBalance: number;
  escrowBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export default function AdminWalletPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { showToast } = useToast();

  const [balance, setBalance] = useState<SystemWalletBalance>({
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

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Load system wallet balance
      const balanceResponse = await fetch(`${api}/api/v1/admin/wallet/balance`, {
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
      const transactionsResponse = await fetch(`${api}/api/v1/admin/wallet/transactions`, {
        credentials: 'include'
      });
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setHasWallet(false);
      showToast('Có lỗi xảy ra khi tải dữ liệu ví', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setCreatingWallet(true);
      
      // Call API to create system wallet
      const response = await fetch(`${api}/api/v1/admin/wallet/balance`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        showToast('Tạo ví thành công!', 'success');
        await loadWalletData();
      } else {
        showToast('Không thể tạo ví', 'error');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      showToast('Có lỗi xảy ra khi tạo ví', 'error');
    } finally {
      setCreatingWallet(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'platform_fee': return <BanknotesIcon width={20} className="text-green-600" />;
      case 'withdraw': return <ArrowUpTrayIcon width={20} className="text-red-600" />;
      case 'refund': return <CreditCardIcon width={20} className="text-orange-600" />;
      case 'fee': return <WalletIcon width={20} className="text-gray-600" />;
      default: return <ChartBarIcon width={20} className="text-gray-600" />;
    }
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'platform_fee': return 'Phí platform';
      case 'withdraw': return 'Rút tiền';
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
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Ví hệ thống</Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack alignItems="center" spacing={3} sx={{ py: 6 }}>
              <WalletIcon width={64} className="text-gray-400" />
              <Typography variant="h6" color="text.secondary" textAlign="center">
                Hệ thống chưa có ví
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Tạo ví hệ thống ngay để nhận phí platform
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
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Ví hệ thống (Platform Revenue)</Typography>

      {/* Balance Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <BanknotesIcon width={32} className="text-white" />
            <Typography variant="h5" fontWeight={600} color="white">Tổng thu nhập Platform</Typography>
          </Stack>
          
          <Typography variant="h3" color="white" fontWeight={700} sx={{ mb: 1 }}>
            {balance.balance.toLocaleString('vi-VN')}đ
          </Typography>
          
          {balance.escrowBalance > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Tiền đang giữ: {balance.escrowBalance.toLocaleString('vi-VN')}đ
            </Alert>
          )}
          
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

      {/* Stats Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tổng thu nhập
            </Typography>
            <Typography variant="h5" color="success.main">
              {balance.totalDeposits.toLocaleString('vi-VN')}đ
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tiền đang giữ
            </Typography>
            <Typography variant="h5" color="info.main">
              {balance.escrowBalance.toLocaleString('vi-VN')}đ
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Số dư khả dụng
            </Typography>
            <Typography variant="h5" color="primary.main">
              {balance.balance.toLocaleString('vi-VN')}đ
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Transactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Giao dịch gần đây</Typography>
          
          {transactions.length === 0 ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <ChartBarIcon width={48} className="text-gray-400" />
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
                        <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" component="span" fontWeight={600}>
                            {getTransactionTypeText(transaction.type)}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            component="span"
                            fontWeight={600}
                            color="success.main"
                          >
                            +{transaction.amount.toLocaleString('vi-VN')}đ
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="body2" component="span" color="text.secondary">
                            {transaction.description}
                            {transaction.orderCode && ` - Đơn hàng #${transaction.orderCode}`}
                          </Typography>
                          <Chip 
                            label={getStatusText(transaction.status)} 
                            color={getStatusColor(transaction.status) as any}
                            size="small"
                            component="span"
                          />
                        </Box>
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
    </div>
  );
}

