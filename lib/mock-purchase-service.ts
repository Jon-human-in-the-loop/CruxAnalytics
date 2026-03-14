import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IPurchaseService, PurchasePackage, CustomerInfo, PurchaseResult } from './purchase-service';

const MOCK_PREMIUM_KEY = '@mock_premium_status';

/**
 * Mock Purchase Service for Development/Testing
 * 
 * Simulates in-app purchase flow without real connection to App Store/Play Store.
 * Stores premium status in AsyncStorage for persistence across app restarts.
 */
export class MockPurchaseService implements IPurchaseService {
  private configured = false;

  async configure(_apiKey: string): Promise<void> {
    console.log('[MockPurchase] Configured (mock mode)');
    this.configured = true;

    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async getOfferings(): Promise<PurchasePackage[]> {
    if (!this.configured) {
      throw new Error('MockPurchaseService not configured');
    }

    console.log('[MockPurchase] Returning mock packages');

    // Return static mock packages
    return [
      {
        identifier: 'pro_monthly_mock',
        product: {
          identifier: 'pro_monthly',
          title: 'Premium Monthly',
          description: 'Unlimited AI analysis and advanced features',
          priceString: '$9.99',
          price: 9.99,
          currencyCode: 'USD',
        },
      },
      {
        identifier: 'pro_yearly_mock',
        product: {
          identifier: 'pro_yearly',
          title: 'Premium Yearly',
          description: 'Save 20% with annual subscription',
          priceString: '$95.99',
          price: 95.99,
          currencyCode: 'USD',
        },
      },
    ];
  }

  async purchasePackage(pkg: PurchasePackage): Promise<PurchaseResult> {
    console.log('[MockPurchase] Simulating purchase:', pkg.identifier);

    // Simulate purchase processing delay (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Save premium status to AsyncStorage
    await AsyncStorage.setItem(MOCK_PREMIUM_KEY, 'true');
    await AsyncStorage.setItem(`${MOCK_PREMIUM_KEY}_package`, pkg.identifier);
    await AsyncStorage.setItem(`${MOCK_PREMIUM_KEY}_date`, new Date().toISOString());

    console.log('[MockPurchase] Purchase successful (mock)');

    return {
      customerInfo: {
        entitlements: {
          active: {
            premium: {
              identifier: 'premium',
              isActive: true,
              productIdentifier: pkg.product.identifier,
            },
          },
        },
        activeSubscriptions: [pkg.product.identifier],
      },
      userCancelled: false,
    };
  }

  async restorePurchases(): Promise<CustomerInfo> {
    console.log('[MockPurchase] Restoring purchases (mock)');

    // Simulate restore delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isPremium = await this.isPremium();

    if (!isPremium) {
      throw new Error('No active subscriptions found');
    }

    const packageId = await AsyncStorage.getItem(`${MOCK_PREMIUM_KEY}_package`);

    return {
      entitlements: {
        active: {
          premium: {
            identifier: 'premium',
            isActive: true,
            productIdentifier: packageId || 'pro_monthly',
          },
        },
      },
      activeSubscriptions: [packageId || 'pro_monthly'],
    };
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    const isPremium = await this.isPremium();
    const packageId = await AsyncStorage.getItem(`${MOCK_PREMIUM_KEY}_package`);

    return {
      entitlements: {
        active: isPremium
          ? {
              premium: {
                identifier: 'premium',
                isActive: true,
                productIdentifier: packageId || 'pro_monthly',
              },
            }
          : {},
      },
      activeSubscriptions: isPremium ? [packageId || 'pro_monthly'] : [],
    };
  }

  async isPremium(): Promise<boolean> {
    const status = await AsyncStorage.getItem(MOCK_PREMIUM_KEY);
    return status === 'true';
  }

  async resetPremiumStatus(): Promise<void> {
    await AsyncStorage.removeItem(MOCK_PREMIUM_KEY);
    await AsyncStorage.removeItem(`${MOCK_PREMIUM_KEY}_package`);
    await AsyncStorage.removeItem(`${MOCK_PREMIUM_KEY}_date`);
    console.log('[MockPurchase] Premium status reset');
  }
}
