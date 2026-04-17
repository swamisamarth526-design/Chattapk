export function extractApiMessage(error, fallbackMessage) {
  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (!error?.response) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
}

export function extractApiFieldErrors(error) {
  const payloadErrors = error?.response?.data?.error;

  if (!payloadErrors || typeof payloadErrors !== 'object' || Array.isArray(payloadErrors)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(payloadErrors).map(([key, value]) => [key, String(value)])
  );
}
