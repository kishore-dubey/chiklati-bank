"use client";

import { useEffect, useRef, useState } from "react";
import type { PaymentResponse } from "@chiklati/shared";

const TERMINAL_STATUSES = new Set(["Sent", "Rejected", "Canceled"]);
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

export function usePaymentStatusPolling(initialPayment: PaymentResponse): {
  payment: PaymentResponse;
  isPolling: boolean;
} {
  const [payment, setPayment] = useState(initialPayment);
  const [isPolling, setIsPolling] = useState(!TERMINAL_STATUSES.has(initialPayment.status));
  const pollCount = useRef(0);

  useEffect(() => {
    if (!isPolling || TERMINAL_STATUSES.has(payment.status) || pollCount.current >= MAX_POLLS) {
      setIsPolling(false);
      return;
    }

    const timer = setTimeout(async () => {
      pollCount.current += 1;
      const response = await fetch(`/api/payments/${payment.id}`);
      if (response.ok) {
        setPayment((await response.json()) as PaymentResponse);
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [payment, isPolling]);

  return { payment, isPolling };
}
