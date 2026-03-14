import { describe, it, expect } from 'vitest';
import { getPurchaseService, isUsingMockPayments } from '../../lib/purchase-service-factory';
import { MockPurchaseService } from '../../lib/mock-purchase-service';

describe('Mock Payments Configuration', () => {
  it('should use mock payments when EXPO_PUBLIC_USE_MOCK_PAYMENTS is true', () => {
    const useMock = process.env.EXPO_PUBLIC_USE_MOCK_PAYMENTS === 'true';
    expect(useMock).toBe(true);
  });

  it('should return mock purchase service', () => {
    const service = getPurchaseService();
    expect(service).toBeInstanceOf(MockPurchaseService);
  });

  it('should report using mock payments', () => {
    const isMock = isUsingMockPayments();
    expect(isMock).toBe(true);
  });

  it('should configure mock service without errors', async () => {
    const service = getPurchaseService();
    await expect(service.configure('mock_api_key')).resolves.not.toThrow();
  });

  it('should return mock packages', async () => {
    const service = getPurchaseService();
    await service.configure('mock_api_key');

    const packages = await service.getOfferings();

    expect(packages).toHaveLength(2);
    expect(packages[0].identifier).toBe('pro_monthly_mock');
    expect(packages[0].product.priceString).toBe('$9.99');
    expect(packages[1].identifier).toBe('pro_yearly_mock');
    expect(packages[1].product.priceString).toBe('$95.99');
  });
});
