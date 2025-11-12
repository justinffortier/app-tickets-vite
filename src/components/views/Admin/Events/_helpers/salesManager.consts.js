import { signal } from '@preact/signals-react';

// Filter signal for payment status (null = all, 'PAID' = paid only, 'PENDING' = pending only)
export const $statusFilter = signal(null);

