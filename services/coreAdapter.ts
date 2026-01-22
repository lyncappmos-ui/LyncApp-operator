
import React from 'react';
import { CoreResponse } from '../types';

/**
 * Utility to safely extract data from a CoreResponse.
 * Returns null if the response is not 'ok' or if data is missing.
 */
export function unwrapCoreData<T>(response: CoreResponse<T>): T | null {
  if (response && response.ok && response.data !== undefined) {
    return response.data;
  }
  if (response?.error) {
    console.warn(`[CoreAdapter] Unwrap failed: ${response.error}`);
  }
  return null;
}

/**
 * Helper to update a React state setter directly from a CoreResponse.
 * Only updates if the response is successful.
 */
export function setFromCoreResponse<T>(
  response: CoreResponse<T>,
  setter: React.Dispatch<React.SetStateAction<T>>,
  defaultValue?: T
) {
  const data = unwrapCoreData(response);
  if (data !== null) {
    setter(data);
  } else if (defaultValue !== undefined) {
    setter(defaultValue);
  }
}

/**
 * Wraps a raw payload into a standard CoreResponse object.
 * Useful for simulation or local fallback logic.
 */
export function wrapAsCoreResponse<T>(data: T | null, error?: string): CoreResponse<T> {
  return {
    ok: !error,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}
