import type { IPurchaseService, PurchasePackage, CustomerInfo, PurchaseResult } from './purchase-service';
import Purchases from 'react-native-purchases';

/**
 * RevenueCat Purchase Service (Production)
 * 
 * Real implementation using RevenueCat SDK for production in-app purchases.
 */
export class RevenueCatService implements IPurchaseService {
  async configure(apiKey: string): Promise<void> {
    await Purchases.configure({ apiKey });
    console.log('[RevenueCat] Configured with API key');
  }

  async getOfferings(): Promise<PurchasePackage[]> {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current?.availablePackages) {
      return [];
    }

    // Convert RevenueCat packages to our interface
    return offerings.current.availablePackages.map((pkg) => ({
      identifier: pkg.identifier,
      product: {
        identifier: pkg.product.identifier,
        title: pkg.product.title,
        description: pkg.product.description,
        priceString: pkg.product.priceString,
        price: pkg.product.price,
        currencyCode: pkg.product.currencyCode,
      },
    }));
  }

  async purchasePackage(pkg: PurchasePackage): Promise<PurchaseResult> {
    // Find the original RevenueCat package
    const offerings = await Purchases.getOfferings();
    const rcPackage = offerings.current?.availablePackages.find(
      (p) => p.identifier === pkg.identifier
    );

    if (!rcPackage) {
      throw new Error(`Package ${pkg.identifier} not found`);
    }

    try {
      const result = await Purchases.purchasePackage(rcPackage);

      return {
        customerInfo: result.customerInfo as any,
        userCancelled: false,
      };
    } catch (error: any) {
      if (error.userCancelled) {
        return {
          customerInfo: await this.getCustomerInfo(),
          userCancelled: true,
        };
      }
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo as any;
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo as any;
  }

  async isPremium(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  }
}
