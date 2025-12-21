import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, Download, Settings, Plus, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext'; 
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { apiCall, API_CONFIG, APIError } from '../config/api';
import { handleAWSError, globalErrorHandler } from '../utils/errorHandler';
import { esimService, ESIMPlan, ESIMOrder } from '../services/ESIMService';
import { backendService } from '../services/BackendService';
import { backendApiCall } from '../config/backend-api';
import MockDataNotice from '../components/MockDataNotice';
import ESIMPurchaseModal from '../components/ESIMPurchaseModal';
import { formatCurrency } from '../utils/currencyFormatter';

interface ESIMPlanLocal {
  id: string;
  name: string;
  dataAmount: string;
  validity: string;
  price: { amount: number; currency: string };
  status: 'active' | 'inactive' | 'expired';
  usage: { used: number; total: number };
  activationDate?: string;
  expiryDate?: string;
  orderReference?: string;
  qrCode?: string;
  bundleState?: string; // Bundle state from eSIM Go API: Processing, Queued, Active, Depleted, Expired, Revoked, Lapsed
  esimDetails?: {
    qrCode?: string;
    activationCode?: string;
    smdpAddress?: string;
    iccid?: string;
    bundleState?: string;
  };
}

const ESIMManagement: React.FC = () => {
  const { t } = useLanguage();
  const { session } = useSupabaseAuth();
  const [esimPlans, setESIMPlans] = useState<ESIMPlanLocal[]>([]);
  const [availablePlans, setAvailablePlans] = useState<ESIMPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMockNotice, setShowMockNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ESIMPlan | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');
  const [showSettingsMenu, setShowSettingsMenu] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.access_token) {
      loadESIMData();
    }
  }, [session?.access_token]);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadESIMData = async () => {
    setShowMockNotice(false);
    setNoticeMessage(null);
    
    try {
      // Get authentication token from context
      const token = session?.access_token;
      
      // Load user's eSIM orders
      const ordersResult = await backendService.getESIMOrders(token);
      console.log('📦 ESIM Orders Result:', {
        success: ordersResult.success,
        hasData: !!ordersResult.data,
        dataType: Array.isArray(ordersResult.data) ? 'array' : typeof ordersResult.data,
        dataLength: Array.isArray(ordersResult.data) ? ordersResult.data.length : 'N/A',
        firstOrder: Array.isArray(ordersResult.data) && ordersResult.data.length > 0 ? ordersResult.data[0] : null
      });
      
      if (ordersResult.success && ordersResult.data && Array.isArray(ordersResult.data) && ordersResult.data.length > 0) {
        // Fetch detailed order information for each order
        const userPlansPromises = ordersResult.data.map(async (order: any) => {
          console.log('🔄 Processing order:', {
            id: order.id,
            plan_name: order.plan_name,
            status: order.status,
            hasPlanDetails: !!order.plan_details,
            hasProviderData: !!order.provider_data
          });
          // Normalize date strings - ensure they're valid ISO strings
          const normalizeDate = (date: any): string | undefined => {
            if (!date) return undefined;
            try {
              const d = new Date(date);
              if (isNaN(d.getTime())) return undefined;
              return d.toISOString();
            } catch {
              return undefined;
            }
          };

          // Calculate expiry date from validity if not set
          // Handles formats like "15日", "7D", "30 days", etc.
          const calculateExpiryDate = (activationDate: string | undefined, validity: string | undefined): string | undefined => {
            if (!activationDate || !validity) return undefined;
            // Extract number from validity string (handles "15日", "7D", "30 days", etc.)
            const daysMatch = validity.match(/(\d+)/);
            if (daysMatch) {
              const days = parseInt(daysMatch[1], 10);
              const created = new Date(activationDate);
              if (!isNaN(created.getTime())) {
                const expiry = new Date(created);
                expiry.setDate(expiry.getDate() + days);
                return expiry.toISOString();
              }
            }
            return undefined;
          };
          
          // Calculate usage from plan details if not available
          const calculateUsageFromPlan = (planDetails: any): { used: number; total: number } | null => {
            if (!planDetails?.dataAmount) return null;
            
            const dataAmount = planDetails.dataAmount;
            let totalGB = 0;
            
            // Parse data amount (handles "1GB", "3GB", "1000MB", etc.)
            if (typeof dataAmount === 'string') {
              if (dataAmount.toLowerCase().includes('gb')) {
                totalGB = parseFloat(dataAmount.replace(/[^0-9.]/g, '')) || 0;
              } else if (dataAmount.toLowerCase().includes('mb')) {
                totalGB = (parseFloat(dataAmount.replace(/[^0-9.]/g, '')) || 0) / 1024;
              } else {
                // Try to parse as number (might be in MB)
                const num = parseFloat(dataAmount.replace(/[^0-9.]/g, ''));
                if (num > 100) {
                  // Likely in MB
                  totalGB = num / 1024;
                } else {
                  // Likely in GB
                  totalGB = num;
                }
              }
            } else if (typeof dataAmount === 'number') {
              // If number is large, assume MB, otherwise GB
              totalGB = dataAmount > 100 ? dataAmount / 1024 : dataAmount;
            }
            
            if (totalGB > 0) {
              return {
                used: 0, // Default to 0 used if not provided
                total: totalGB
              };
            }
            
            return null;
          };

          const baseActivationDate = normalizeDate(order.purchase_date || order.created_at || order.activated_at);
          // Calculate expiry date - try multiple sources
          let baseExpiryDate = normalizeDate(order.expiry_date);
          if (!baseExpiryDate && baseActivationDate && order.plan_details?.validity) {
            baseExpiryDate = calculateExpiryDate(baseActivationDate, order.plan_details.validity);
            if (baseExpiryDate) {
              console.log('✅ Calculated base expiry date:', {
                activationDate: baseActivationDate,
                validity: order.plan_details.validity,
                expiryDate: baseExpiryDate
              });
            }
          }
          
          // Calculate usage from plan if not available
          const baseUsage = order.usage && order.usage.total > 0 
            ? order.usage 
            : calculateUsageFromPlan(order.plan_details) || { used: 0, total: 0 };

          // Extract plan details from order - check multiple possible locations
          const planDetails = order.plan_details || order.provider_data?.planDetails || {};
          const planName = planDetails.name || order.plan_name || order.planId || 'Unknown Plan';
          const dataAmount = planDetails.dataAmount || order.data_amount || '3GB';
          const validity = planDetails.validity || order.validity || '15日';
          const price = planDetails.price || order.price || { amount: 3500, currency: 'JPY' };
          const orderReference = order.esim_provider_order_id || order.order_reference || order.provider_data?.orderReference;
          
          const basePlan: ESIMPlanLocal = {
            id: order.id, // This is the database order ID, used for deletion
            name: planName,
            dataAmount: dataAmount,
            validity: validity,
            price: typeof price === 'object' ? price : { amount: price || 3500, currency: 'JPY' },
            status: (order.status || 'inactive') as 'active' | 'inactive' | 'expired',
            usage: baseUsage,
            activationDate: baseActivationDate,
            expiryDate: baseExpiryDate,
            orderReference: orderReference,
            bundleState: order.usage_data?.bundleState || order.provider_data?.bundleState || undefined
          };
          
          console.log('✅ Created base plan:', {
            id: basePlan.id,
            name: basePlan.name,
            dataAmount: basePlan.dataAmount,
            validity: basePlan.validity,
            status: basePlan.status,
            hasActivationDate: !!basePlan.activationDate,
            hasExpiryDate: !!basePlan.expiryDate,
            usage: basePlan.usage
          });
          
          console.log('📋 Base plan created:', {
            id: basePlan.id,
            name: basePlan.name,
            orderReference: basePlan.orderReference,
            activationDate: basePlan.activationDate,
            expiryDate: basePlan.expiryDate,
            usage: basePlan.usage,
            validity: basePlan.validity
          });

          // Fetch detailed order information from eSIM Go API if we have an orderReference
          // Skip API call for manual ICCID assignments (they start with "manual-")
          const isManualAssignment = order.esim_provider_order_id && order.esim_provider_order_id.startsWith('manual-');
          
          if (order.esim_provider_order_id && token && !isManualAssignment) {
            try {
              const detailsResult = await backendApiCall(
                `/api/esim/orders/${encodeURIComponent(order.esim_provider_order_id)}/details`,
                { method: 'GET' },
                token
              );

              if (detailsResult.success && detailsResult.data) {
                const details = detailsResult.data;
                
                // Update activation and expiry dates from API
                if (details.createdDate) {
                  const normalizedDate = normalizeDate(details.createdDate);
                  if (normalizedDate) {
                    basePlan.activationDate = normalizedDate;
                  }
                }
                if (details.expiryDate) {
                  const normalizedDate = normalizeDate(details.expiryDate);
                  if (normalizedDate) {
                    basePlan.expiryDate = normalizedDate;
                  }
                } 
                
                // Always calculate expiry date if not set and we have createdDate and validity
                const activationDateForExpiry = details.createdDate || basePlan.activationDate;
                if (!basePlan.expiryDate && activationDateForExpiry && order.plan_details?.validity) {
                  const calculated = calculateExpiryDate(activationDateForExpiry, order.plan_details.validity);
                  if (calculated) {
                    basePlan.expiryDate = calculated;
                    console.log('✅ Calculated expiry date from API details:', {
                      activationDate: activationDateForExpiry,
                      validity: order.plan_details.validity,
                      expiryDate: basePlan.expiryDate
                    });
                  }
                }

                // Update usage data if available
                if (details.esimDetails) {
                  const esimDetails = details.esimDetails;
                  if (esimDetails.dataTotalMb !== null && esimDetails.dataTotalMb !== undefined) {
                    const totalGB = esimDetails.dataTotalMb / 1024;
                    const usedGB = esimDetails.dataUsedMb ? esimDetails.dataUsedMb / 1024 : 
                                  (esimDetails.dataRemainingMb ? (totalGB - (esimDetails.dataRemainingMb / 1024)) : 0);
                    basePlan.usage = {
                      used: Math.max(0, usedGB),
                      total: totalGB
                    };
                  } else if (order.usage && order.usage.total > 0) {
                    // Use usage data from order if available
                    basePlan.usage = order.usage;
                  }
                } else if (order.usage && order.usage.total > 0) {
                  // Use usage data from order if esimDetails not available
                  basePlan.usage = order.usage;
                }

                // Store QR code and eSIM details
                if (details.esimDetails) {
                  basePlan.qrCode = details.esimDetails.qrCode || null;
                  basePlan.esimDetails = details.esimDetails;
                  // Store bundle state if available
                  if (details.esimDetails.bundleState) {
                    basePlan.bundleState = details.esimDetails.bundleState;
                  }
                }
              }
            } catch (error) {
              console.warn('Failed to fetch order details:', error);
              // Continue with base plan data
            }
          } else if (isManualAssignment) {
            // For manual assignments, try to get QR code from usage_data if available
            if (order.usage_data?.iccid) {
              basePlan.esimDetails = {
                iccid: order.usage_data.iccid,
                qrCode: order.qr_code || null,
                activationCode: order.activation_code || null
              };
              basePlan.qrCode = order.qr_code || null;
            }
            
            // Calculate expiry date for manual assignments if we have purchase date and validity
            if (!basePlan.expiryDate && basePlan.activationDate && order.plan_details?.validity) {
              const calculated = calculateExpiryDate(basePlan.activationDate, order.plan_details.validity);
              if (calculated) {
                basePlan.expiryDate = calculated;
                console.log('✅ Calculated expiry date for manual assignment:', basePlan.expiryDate);
              }
            }
            
            // Calculate usage from plan if not available
            if ((!basePlan.usage || basePlan.usage.total === 0) && order.plan_details) {
              const calculatedUsage = calculateUsageFromPlan(order.plan_details);
              if (calculatedUsage) {
                basePlan.usage = calculatedUsage;
                console.log('✅ Calculated usage from plan:', basePlan.usage);
              }
            }
            
            // Extract bundle state from usage_data if available
            if (order.usage_data?.bundleState) {
              basePlan.bundleState = order.usage_data.bundleState;
            }
          }

          // Final check: ensure expiry date is calculated if still missing
          if (!basePlan.expiryDate && basePlan.activationDate && basePlan.validity) {
            const finalExpiry = calculateExpiryDate(basePlan.activationDate, basePlan.validity);
            if (finalExpiry) {
              basePlan.expiryDate = finalExpiry;
              console.log('✅ Final expiry date calculation:', {
                planId: basePlan.id,
                activationDate: basePlan.activationDate,
                validity: basePlan.validity,
                expiryDate: basePlan.expiryDate
              });
            }
          }
          
          // Final check: ensure usage is calculated if still missing
          if ((!basePlan.usage || basePlan.usage.total === 0) && basePlan.dataAmount) {
            const finalUsage = calculateUsageFromPlan({ dataAmount: basePlan.dataAmount });
            if (finalUsage) {
              basePlan.usage = finalUsage;
              console.log('✅ Final usage calculation:', {
                planId: basePlan.id,
                dataAmount: basePlan.dataAmount,
                usage: basePlan.usage
              });
            }
          }

          return basePlan;
        });

        const userPlans = await Promise.all(userPlansPromises);
        console.log('📊 Final plans with dates and usage:', userPlans.map(p => ({
          id: p.id,
          name: p.name,
          activationDate: p.activationDate,
          expiryDate: p.expiryDate,
          usage: p.usage
        })));
        setESIMPlans(userPlans);
      }

      // Load available plans
      const plansResult = await backendService.getESIMPlans(token);
      if (plansResult.success && plansResult.data) {
        setAvailablePlans(plansResult.data);
        if (plansResult.isMockData) {
          setShowMockNotice(true);
          setNoticeMessage(t('errors.esim.mockDataNotice'));
        }
      } else {
        throw new Error(plansResult.error || t('errors.esim.plansLoadFailed'));
      }
    } catch (error) {
      console.error('Failed to load eSIM data:', error);
      setShowMockNotice(true);
      setNoticeMessage(t('errors.esim.loadFailedFallback'));
      
      // Use fallback data
      const fallbackPlans: ESIMPlan[] = [
        {
          id: 'plan_1',
          name: 'Japan 3GB - 15 Days',
          description: '日本全国で使える15日間3GBプラン',
          dataAmount: '3GB',
          validity: '15日',
          price: { amount: 3500, currency: 'JPY' },
          coverage: ['Japan'],
          features: ['High-speed data', '24/7 support'],
          isAvailable: true
        },
        {
          id: 'plan_2',
          name: 'Japan 10GB - 30 Days',
          description: '日本全国で使える30日間10GBプラン',
          dataAmount: '10GB',
          validity: '30日',
          price: { amount: 8500, currency: 'JPY' },
          coverage: ['Japan'],
          features: ['High-speed data', '24/7 support'],
          isAvailable: true
        }
      ];
      setAvailablePlans(fallbackPlans);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseClick = (plan: ESIMPlan) => {
    // Open purchase modal instead of redirecting
    setSelectedPlan(plan);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = (orderData: any) => {
    console.log('Purchase successful:', orderData);
    loadESIMData(); // Refresh data
    setShowPurchaseModal(false);
    setSelectedPlan(null);
  };

  const handleQRCodeClick = (plan: ESIMPlanLocal) => {
    // Try to get QR code from plan data
    const qrCode = plan.qrCode || plan.esimDetails?.qrCode || null;
    
    if (qrCode) {
      setSelectedQRCode(qrCode);
      setSelectedPlanName(plan.name);
      setShowQRModal(true);
    } else {
      // If QR code not available, try to fetch it
      if (plan.orderReference && session?.access_token) {
        fetchQRCode(plan.orderReference, plan.name);
      } else {
        alert(t('esim.qrCode') + ' ' + t('common.notAvailable') || 'QR Code not available');
      }
    }
  };

  const fetchQRCode = async (orderReference: string, planName: string) => {
    try {
      const token = session?.access_token;
      if (!token) return;

      // Skip API call for manual assignments
      if (orderReference.startsWith('manual-')) {
        alert(t('esim.qrCode') + ' ' + t('common.notAvailable') || 'QR Code not available for manual assignments');
        return;
      }

      const result = await backendApiCall(
        `/api/esim/orders/${encodeURIComponent(orderReference)}/details`,
        { method: 'GET' },
        token
      );

      if (result.success && result.data?.esimDetails?.qrCode) {
        setSelectedQRCode(result.data.esimDetails.qrCode);
        setSelectedPlanName(planName);
        setShowQRModal(true);
      } else {
        alert(t('esim.qrCode') + ' ' + t('common.notAvailable') || 'QR Code not available');
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      alert(t('esim.qrCode') + ' ' + t('common.notAvailable') || 'QR Code not available');
    }
  };

  const handleDeleteESIM = async (planId: string) => {
    if (!confirm(t('esim.confirmDelete') || 'Are you sure you want to remove this eSIM? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setShowDeleteConfirm(null);
    setShowSettingsMenu(null);

    try {
      const token = session?.access_token;
      if (!token) {
        alert(t('common.authRequired') || 'Authentication required');
        setIsDeleting(false);
        return;
      }

      console.log('🗑️ Attempting to delete eSIM order:', {
        planId: planId,
        planIdType: typeof planId,
        planIdLength: planId?.length
      });

      if (!planId) {
        alert('Invalid order ID');
        setIsDeleting(false);
        return;
      }

      const result = await backendApiCall(
        `/api/esim/orders/${encodeURIComponent(planId)}`,
        { method: 'DELETE' },
        token
      );

      console.log('Delete result:', {
        success: result.success,
        error: result.error,
        message: result.message,
        code: result.code,
        details: result.details
      });

      if (result.success) {
        console.log('✅ eSIM deleted successfully, reloading data...');
        // Reload eSIM data
        await loadESIMData();
      } else {
        const errorMsg = result.error || result.message || result.details || t('esim.deleteError') || 'Failed to delete eSIM';
        console.error('❌ Delete failed:', errorMsg);
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Failed to delete eSIM:', error);
      const errorMsg = error.message || error.details?.error || error.details?.message || t('esim.deleteError') || 'Failed to delete eSIM';
      alert(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      case 'expired': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getBundleStateColor = (bundleState: string | undefined) => {
    if (!bundleState) return 'text-gray-600 bg-gray-100';
    switch (bundleState.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'queued': return 'text-yellow-600 bg-yellow-100';
      case 'depleted': return 'text-orange-600 bg-orange-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'revoked': return 'text-red-600 bg-red-100';
      case 'lapsed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBundleState = (bundleState: string | undefined): string => {
    if (!bundleState) return '';
    // Capitalize first letter and keep rest lowercase
    return bundleState.charAt(0).toUpperCase() + bundleState.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return '-';
      }
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return '-';
    }
  };

  if (isLoading) {
    const currentPlanSkeletons = Array.from({ length: 2 });
    const availablePlanSkeletons = Array.from({ length: 3 });

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse">
          <div className="text-center mb-8">
            <div className="h-10 bg-white/70 rounded-full w-48 mx-auto mb-4" />
            <div className="h-4 bg-white/70 rounded-full w-72 mx-auto" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-7 bg-white/70 rounded-full w-40" />
              {currentPlanSkeletons.map((_, index) => (
                <div
                  key={`current-plan-skeleton-${index}`}
                  className="bg-white rounded-3xl shadow-lg p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-200 rounded-full w-20" />
                      <div className="h-6 bg-gray-100 rounded-full w-16" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-100 rounded" />
                    <div className="h-10 bg-gray-100 rounded" />
                  </div>

                  <div className="flex space-x-3">
                    <div className="h-10 bg-gray-100 rounded-lg flex-1" />
                    <div className="h-10 bg-gray-100 rounded-lg flex-1" />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="h-7 bg-white/70 rounded-full w-40" />
              {availablePlanSkeletons.map((_, index) => (
                <div
                  key={`available-plan-skeleton-${index}`}
                  className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
                >
                  <div className="h-5 bg-gray-200 rounded w-52" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-32" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }} 
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('esim.title')}</h1>
          <p className="text-lg text-gray-600">{t('esim.subtitle')}</p>
        </motion.div>
        
        {/* Mock Data Notice */}
        {showMockNotice && noticeMessage && (
          <MockDataNotice 
            message={noticeMessage}
            onRetry={() => setShowMockNotice(false)}
            className="max-w-6xl mx-auto mb-4"
          />
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current eSIM Plans */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('esim.currentPlans')}</h2> 
            
            {esimPlans.length === 0 ? (
              <motion.div
                className="bg-white rounded-3xl shadow-lg p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('esim.noPlansAvailable')}</h3>
                <p className="text-gray-600 mb-4">{t('esim.purchaseToStartPrompt')}</p>
                <div className="text-sm text-gray-500">
                  <p>• {t('esim.features.highSpeedData')}</p>
                  <p>• {t('esim.features.japanNationwideAvailability')}</p>
                  <p>• {t('esim.features.easyQRSetup')}</p>
                </div>
              </motion.div>
            ) : (
              esimPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                className="bg-white rounded-3xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                      <p className="text-gray-600">{plan.dataAmount} • {plan.validity}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plan.status)}`}>
                      {getStatusIcon(plan.status)}
                      <span>{plan.status === 'active' ? t('esim.active') : plan.status === 'expired' ? t('esim.expired') : t('esim.inactive')}</span>
                    </div>
                    {plan.bundleState && (
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getBundleStateColor(plan.bundleState)}`}>
                        <span>{formatBundleState(plan.bundleState)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {plan.usage && plan.usage.total > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{t('esim.dataRemaining') || 'Data Remaining'}</span>
                      <span className="font-medium">
                        {plan.usage.total > 0 
                          ? `${(plan.usage.total - plan.usage.used).toFixed(2)}GB / ${plan.usage.total.toFixed(2)}GB`
                          : plan.usage.unlimited 
                            ? t('esim.unlimited') || 'Unlimited'
                            : '-'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, ((plan.usage.total - plan.usage.used) / plan.usage.total) * 100))}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{plan.usage.used.toFixed(2)}GB used</span>
                      <span>{(plan.usage.total - plan.usage.used).toFixed(2)}GB remaining</span>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">{t('esim.activationDate')}:</span>
                    <br />
                    <span className="text-gray-700">{formatDate(plan.activationDate)}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t('esim.expiryDate')}:</span>
                    <br />
                    <span className="text-gray-700">{formatDate(plan.expiryDate)}</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <div className="relative" ref={settingsMenuRef}>
                    <button 
                      onClick={() => setShowSettingsMenu(showSettingsMenu === plan.id ? null : plan.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Settings className="w-4 h-4" /> 
                      <span>{t('esim.settings')}</span>
                    </button>
                    
                    {showSettingsMenu === plan.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      >
                        <button
                          onClick={() => {
                            setShowSettingsMenu(null);
                            handleDeleteESIM(plan.id);
                          }}
                          disabled={isDeleting}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{isDeleting ? (t('esim.deleting') || 'Deleting...') : (t('esim.removeSIM') || 'Remove SIM')}</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleQRCodeClick(plan)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('esim.qrCode')}</span>
                  </button>
                </div>
              </motion.div>
              ))
            )}
          </div>

          {/* Available Plans */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('esim.availablePlans')}</h2>
            
            {availablePlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                className="bg-white rounded-2xl shadow-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3 className="text-lg font-bold text-gray-800 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>{t('esim.dataCapacity')}:</span>
                    <span className="font-medium">{plan.dataAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('esim.validityPeriod')}:</span>
                    <span className="font-medium">{plan.validity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('esim.coverageArea')}:</span>
                    <span className="font-medium">
                      {plan.coverage && plan.coverage.length > 0 
                        ? (Array.isArray(plan.coverage) 
                            ? plan.coverage.map(item => typeof item === 'string' ? item : (item?.name || item?.country || item?.code || String(item))).join(', ')
                            : String(plan.coverage))
                        : t('esim.japanNationwide')}
                    </span>
                  </div>
                </div>

                <div className="text-2xl font-bold text-purple-600 mb-4">
                  {formatCurrency(plan.price.amount, plan.price.currency)}
                </div>

                <button
                  onClick={() => handlePurchaseClick(plan)}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('esim.purchase')}</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <ESIMPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onPurchaseSuccess={handlePurchaseSuccess}
      />

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{selectedPlanName}</h3>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedQRCode(null);
                    setSelectedPlanName('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Wifi className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">{t('esim.qrCode')}</span>
                </div>
                <div className="flex justify-center">
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedQRCode)}`}
                      alt="eSIM QR Code"
                      className="w-64 h-64"
                      onError={(e) => {
                        console.error('Failed to load QR code image');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t('esim.scanQRCode') || 'このQRコードをスキャンしてeSIMを設定してください'}
                </p>
                {selectedQRCode.startsWith('LPA:1$') && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 font-mono break-all">
                      {selectedQRCode}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedQRCode(null);
                  setSelectedPlanName('');
                }}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                {t('common.close') || '閉じる'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ESIMManagement;