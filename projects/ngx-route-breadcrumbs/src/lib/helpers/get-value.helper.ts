export function getValue<R>(data: unknown, keys: string[]): R {
  let result: unknown = data;

  for (const key of keys) {
    result = (result as object)[key as keyof object];
  }

  return result as R;
}
