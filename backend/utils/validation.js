export function onlyAllowedKeys(value, allowedKeys) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).every((key) => allowedKeys.includes(key))
}
