/**
 * Safe version of JSON.stringify that handles circular references and 
 * strips out React internal properties like __reactFiber.
 */
export function safeStringify(obj: any): string {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    // Strip React internal properties
    if (key.startsWith('__react') || key.startsWith('__fiber')) return undefined;
    
    // Handle DOM elements
    if (value instanceof HTMLElement) return `[HTMLElement: ${value.tagName}]`;
    
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    return value;
  });
}
