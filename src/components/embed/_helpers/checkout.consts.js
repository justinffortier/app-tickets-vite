import { signal } from '@preact/signals-react';

// Signals and constants for checkout component
export const isProcessingPayment = signal(false);
export const showTestCards = signal(false);
export const providerConfigError = signal(null);
export const sessionInitError = signal(null);
