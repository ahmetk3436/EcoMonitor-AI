import Purchases, {
  PurchasesPackage,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY;

export type { PurchasesPackage, PurchasesOffering };

export const initializePurchases = async () => {
  try {
    if (API_KEY) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey: API_KEY });
      console.log('RevenueCat initialized successfully');
    } else {
      console.warn('RevenueCat API key not configured - skipping initialization');
    }
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    if (!API_KEY) return null;
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    // Only log if initialized
    if (API_KEY) console.error('Failed to fetch offerings:', error);
    return null;
  }
};

export const purchasePackage = async (
  pkg: PurchasesPackage,
): Promise<boolean> => {
  try {
    if (!API_KEY) return false;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active.pro !== undefined;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Purchase failed:', error);
    }
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  try {
    if (!API_KEY) return false;
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active.pro !== undefined;
  } catch (error) {
    console.error('Restore purchases failed:', error);
    return false;
  }
};

export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    if (!API_KEY) return false;
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active.pro !== undefined;
  } catch (error) {
    // Only log if initialized
    if (API_KEY) console.error('Failed to check subscription status:', error);
    return false;
  }
};
