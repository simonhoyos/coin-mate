export function assertNotNull<T>(value: T, message?: string) {
  if (value == null) {
    throw new Error(message ?? 'Value is null or undefined');
  }

  return value;
}
