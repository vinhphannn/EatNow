import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

/**
 * MoMo Payment Service
 * 
 * Integration với MoMo Payment Gateway
 * - Tạo payment URL cho nạp/rút tiền
 * - Xử lý IPN callback từ MoMo
 * - Query payment status
 * 
 * Documents: https://developers.momo.vn/
 */

export interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  redirectUrl: string;
  ipnUrl: string;
  environment: 'test' | 'production';
  skipVerify?: boolean;
}

export interface MoMoPaymentRequest {
  orderId: string;
  orderInfo: string;
  amount: number;
  extraData?: string;
}

export interface MoMoPaymentResponse {
  requestId: string;
  orderId: string;
  payUrl: string;
  signature: string;
}

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);
  private readonly config: MoMoConfig;

  constructor(private configService: ConfigService) {
    // Lấy config từ environment variables
    this.config = {
      partnerCode: this.configService.get<string>('MOMO_PARTNER_CODE') || 'MOMO',
      accessKey: this.configService.get<string>('MOMO_ACCESS_KEY') || 'F8BBA842ECF85',
      secretKey: this.configService.get<string>('MOMO_SECRET_KEY') || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
      redirectUrl: this.configService.get<string>('MOMO_REDIRECT_URL') || 'http://localhost:3003/customer/wallet/success',
      ipnUrl: this.configService.get<string>('MOMO_IPN_URL') || 'http://localhost:3001/api/v1/payment/momo/callback',
      environment: this.configService.get<string>('MOMO_ENV') === 'production' ? 'production' : 'test',
      skipVerify: this.configService.get<string>('MOMO_SKIP_VERIFY') === 'true',
    };

    this.logger.log(`✅ MoMo Service initialized - Environment: ${this.config.environment}`);
  }

  /**
   * Get MoMo API base URL based on environment
   */
  private getBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://payment.momo.vn'
      : 'https://test-payment.momo.vn';
  }

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return this.config.environment;
  }

  /**
   * Create signature using HMAC SHA256 with explicit key order (per MoMo docs)
   */
  private createSignature(data: Record<string, any>, orderedKeys?: string[]): string {
    const keys = orderedKeys && orderedKeys.length > 0
      ? orderedKeys
      : Object.keys(data).sort();

    const rawSignature = keys
      .map(key => `${key}=${data[key] ?? ''}`)
      .join('&');

    this.logger.debug(`Raw signature: ${rawSignature}`);

    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    this.logger.debug(`Signature: ${signature}`);
    return signature;
  }

  /**
   * Tạo payment URL để nạp tiền vào ví
   * Luồng: Actor muốn nạp → Tạo payment URL → Redirect → MoMo callback → Credit vào ví
   */
  async createPaymentUrl(request: MoMoPaymentRequest): Promise<MoMoPaymentResponse> {
    try {
      const requestId = this.config.partnerCode + new Date().getTime();
      const orderId = request.orderId || requestId;

      // Payload để tạo signature
      const paymentData = {
        accessKey: this.config.accessKey,
        amount: request.amount.toString(),
        extraData: request.extraData || '',
        ipnUrl: this.config.ipnUrl,
        orderId: orderId,
        orderInfo: request.orderInfo,
        partnerCode: this.config.partnerCode,
        redirectUrl: this.config.redirectUrl,
        requestId: requestId,
        requestType: 'payWithMethod',
      };

      // Tạo signature theo đúng thứ tự mẫu CollectionLink
      const signature = this.createSignature(paymentData, [
        'accessKey',
        'amount',
        'extraData',
        'ipnUrl',
        'orderId',
        'orderInfo',
        'partnerCode',
        'redirectUrl',
        'requestId',
        'requestType',
      ]);

      // Request body
      const requestBody = {
        ...paymentData,
        signature,
        lang: 'vi',
        autoCapture: true,
      };

      this.logger.log(`Creating payment URL for order: ${orderId}, amount: ${request.amount}`);

      // Gọi MoMo API
      const response = await axios.post(
        `${this.getBaseUrl()}/v2/gateway/api/create`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const { resultCode, message, payUrl } = response.data;

      if (resultCode !== 0) {
        this.logger.error(`MoMo API error: ${message}`);
        throw new BadRequestException(`Không thể tạo payment URL: ${message}`);
      }

      this.logger.log(`✅ Payment URL created: ${payUrl}`);

      return {
        requestId,
        orderId,
        payUrl,
        signature,
      };

    } catch (error: any) {
      const responseData = error?.response?.data;
      if (responseData) {
        this.logger.error(`MoMo create error: ${JSON.stringify(responseData)}`);
      }
      this.logger.error(`Failed to create payment URL: ${error.message}`);
      const msg = responseData?.message || responseData?.error || 'Không thể tạo payment URL từ MoMo';
      const code = responseData?.resultCode;
      throw new BadRequestException(`MoMo error${code !== undefined ? ` (${code})` : ''}: ${msg}`);
    }
  }

  /**
   * Verify IPN callback từ MoMo
   * MoMo sẽ gọi endpoint này với payment result
   */
  verifyCallback(callbackData: Record<string, any>): boolean {
    try {
      const { orderId, requestId, orderInfo, orderType, amount, extraData, resultCode, message, partnerCode, responseTime, payType, transId, signature } = callbackData;

      if (this.config.skipVerify && this.config.environment === 'test') {
        this.logger.warn('⚠️ Skipping MoMo IPN signature verification (test mode)');
        return true;
      }

      if (!signature) {
        this.logger.warn('Callback missing signature');
        return false;
      }

      // Tạo signature để verify theo IPN v2: 
      // accessKey&amount&extraData&message&orderId&orderInfo&orderType&partnerCode&payType&requestId&responseTime&resultCode&transId
      const dataToVerify: Record<string, any> = {
        accessKey: this.config.accessKey,
        amount: amount?.toString?.() ?? amount,
        extraData: extraData || '',
        message,
        orderId,
        orderInfo,
        orderType: orderType || 'momo_wallet',
        partnerCode,
        payType: payType || '',
        requestId,
        responseTime,
        resultCode,
        transId,
      };

      const expectedSignature = this.createSignature(dataToVerify, [
        'accessKey',
        'amount',
        'extraData',
        'message',
        'orderId',
        'orderInfo',
        'orderType',
        'partnerCode',
        'payType',
        'requestId',
        'responseTime',
        'resultCode',
        'transId',
      ]);

      if (signature !== expectedSignature) {
        this.logger.error('Invalid callback signature');
        this.logger.debug(`Expected: ${expectedSignature}`);
        this.logger.debug(`Received: ${signature}`);
        return false;
      }

      this.logger.log(`✅ Callback verified for order: ${orderId}`);
      return true;

    } catch (error) {
      this.logger.error(`Callback verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Query payment status từ MoMo
   * Dùng để kiểm tra trạng thái giao dịch
   */
  async queryPaymentStatus(orderId: string, requestId: string): Promise<any> {
    try {
      const data = {
        accessKey: this.config.accessKey,
        orderId,
        partnerCode: this.config.partnerCode,
        requestId: requestId || (this.config.partnerCode + new Date().getTime()),
        requestType: 'transactionStatus',
      };

      const signature = this.createSignature(data);

      const requestBody = {
        ...data,
        signature,
        lang: 'vi',
      };

      this.logger.log(`Querying payment status for order: ${orderId}`);

      const response = await axios.post(
        `${this.getBaseUrl()}/v2/gateway/api/query`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data;

    } catch (error) {
      this.logger.error(`Failed to query payment status: ${error.message}`);
      throw new BadRequestException('Không thể query payment status từ MoMo');
    }
  }

  /**
   * Rút tiền về MoMo
   * Note: MoMo có thể không support rút tiền trực tiếp
   * Có thể cần dùng MoMo eWallet hoặc API khác
   */
  async processWithdraw(phoneNumber: string, amount: number): Promise<any> {
    // TODO: Implement if MoMo supports withdrawal API
    this.logger.warn('Withdrawal via MoMo not yet implemented');
    throw new BadRequestException('Rút tiền qua MoMo chưa được hỗ trợ');
  }
}

