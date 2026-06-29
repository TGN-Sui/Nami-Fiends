import { useEffect, useState } from 'react';

import {
  fetchPaymentConfig,
  isPaymentApiAvailable,
  type PublicPaymentConfig,
} from './membership-payments-api.js';

export function usePublicPaymentConfig(): PublicPaymentConfig | null {
  const [paymentConfig, setPaymentConfig] = useState<PublicPaymentConfig | null>(null);

  useEffect(() => {
    if (!isPaymentApiAvailable()) {
      return;
    }

    void fetchPaymentConfig()
      .then(setPaymentConfig)
      .catch(() => setPaymentConfig(null));
  }, []);

  return paymentConfig;
}