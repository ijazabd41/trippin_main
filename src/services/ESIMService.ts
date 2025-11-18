// eSIM Service for Trippin App
import { backendApiCall, BACKEND_API_CONFIG } from '../config/backend-api';

export interface ESIMPlan {
  id: string;
  name: string;
  description: string;
  dataAmount: string;
  validity: string;
  price: {
    amount: number;
    currency: string;
  };
  coverage: string[];
  features: string[];
  isAvailable: boolean;
}

export interface ESIMPurchase {
  planId: string;
  customerInfo: {
    email: string;
    name: string;
    phone?: string;
  };
  paymentMethodId: string;
}

export interface ESIMOrder {
  id: string;
  planId: string;
  status: 'pending' | 'processing' | 'active' | 'expired' | 'cancelled';
  qrCode?: string;
  activationCode?: string;
  purchaseDate: string;
  expiryDate?: string;
  usage?: {
    used: number;
    total: number;
  };
  planDetails?: {
    name: string;
    dataAmount: string;
    validity: string;
    price: {
      amount: number;
      currency: string;
    };
  };
}

class ESIMService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = 'https://tubular-pie-835f20.netlify.app';
    this.token = '5mdcjufvuyN_PFyuUazHhSAYJrjdSnoft_AWrFfi';
  }

  // Get available eSIM plans
  async getAvailablePlans(): Promise<{ success: boolean; data?: ESIMPlan[]; error?: string }> {
    try {
      // Try backend first
      const result = await backendApiCall(
        '/api/esim/plans',
        { method: 'GET' }
      );
      
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.warn('Backend eSIM service unavailable, using direct API:', error);
    }

    // Fallback to direct API call
    try {
      const response = await fetch(`${this.baseUrl}/api/plans`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.plans || data
      };
    } catch (error) {
      console.error('Failed to fetch eSIM plans:', error);
      return {
        success: false,
        error: 'Failed to load eSIM plans'
      };
    }
  }

  // Purchase eSIM plan
  async purchasePlan(purchaseData: ESIMPurchase, token?: string): Promise<{ success: boolean; data?: ESIMOrder; error?: string }> {
    try {
      // Try backend first
      const result = await backendApiCall(
        '/api/esim/purchase',
        {
          method: 'POST',
          body: JSON.stringify(purchaseData)
        },
        token
      );
      
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.warn('Backend eSIM service unavailable, using direct API:', error);
    }

    // Fallback to direct API call
    try {
      const response = await fetch(`${this.baseUrl}/api/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchaseData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.order || data
      };
    } catch (error) {
      console.error('Failed to purchase eSIM plan:', error);
      return {
        success: false,
        error: 'Failed to purchase eSIM plan'
      };
    }
  }

  // Get user's eSIM orders
  async getUserOrders(token?: string): Promise<{ success: boolean; data?: ESIMOrder[]; error?: string }> {
    try {
      const result = await backendApiCall(
        '/api/esim/orders',
        { method: 'GET' },
        token
      );
      
      return result;
    } catch (error) {
      console.error('Failed to fetch user eSIM orders:', error);
      return {
        success: false,
        error: 'Failed to load eSIM orders'
      };
    }
  }

  // Get eSIM order details
  async getOrderDetails(orderId: string, token?: string): Promise<{ success: boolean; data?: ESIMOrder; error?: string }> {
    try {
      const result = await backendApiCall(
        `/api/esim/orders/${orderId}`,
        { method: 'GET' },
        token
      );
      
      return result;
    } catch (error) {
      console.error('Failed to fetch eSIM order details:', error);
      return {
        success: false,
        error: 'Failed to load eSIM order details'
      };
    }
  }

  // Activate eSIM
  async activateESIM(orderId: string, token?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await backendApiCall(
        `/api/esim/orders/${orderId}/activate`,
        { method: 'POST' },
        token
      );
      
      return result;
    } catch (error) {
      console.error('Failed to activate eSIM:', error);
      return {
        success: false,
        error: 'Failed to activate eSIM'
      };
    }
  }

  // Get eSIM usage
  async getUsage(orderId: string, token?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await backendApiCall(
        `/api/esim/orders/${orderId}/usage`,
        { method: 'GET' },
        token
      );
      
      return result;
    } catch (error) {
      console.error('Failed to fetch eSIM usage:', error);
      return {
        success: false,
        error: 'Failed to load eSIM usage'
      };
    }
  }

  // Cancel eSIM order
  async cancelOrder(orderId: string, token?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await backendApiCall(
        `/api/esim/orders/${orderId}/cancel`,
        { method: 'POST' },
        token
      );
      
      return result;
    } catch (error) {
      console.error('Failed to cancel eSIM order:', error);
      return {
        success: false,
        error: 'Failed to cancel eSIM order'
      };
    }
  }
}

// Export singleton instance
export const esimService = new ESIMService();
export default esimService;
