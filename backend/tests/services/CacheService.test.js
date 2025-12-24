import CacheService from '../../src/services/CacheService.js';

describe('CacheService', () => {
  let cacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Basic Operations', () => {
    test('should set and get a value', () => {
      cacheService.set('key1', 'value1', 10);
      expect(cacheService.get('key1')).toBe('value1');
    });

    test('should return undefined for non-existent key', () => {
      expect(cacheService.get('nonexistent')).toBeUndefined();
    });

    test('should delete a key', () => {
      cacheService.set('key1', 'value1', 10);
      const deleted = cacheService.delete('key1');
      expect(deleted).toBe(1);
      expect(cacheService.get('key1')).toBeUndefined();
    });

    test('should return 0 when deleting non-existent key', () => {
      const deleted = cacheService.delete('nonexistent');
      expect(deleted).toBe(0);
    });

    test('should clear all entries', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.set('key2', 'value2', 10);
      cacheService.clear();
      expect(cacheService.get('key1')).toBeUndefined();
      expect(cacheService.get('key2')).toBeUndefined();
    });
  });

  describe('TTL-based Expiration', () => {
    test('should expire entries after TTL', async () => {
      cacheService.set('key1', 'value1', 1); // 1 second TTL
      expect(cacheService.get('key1')).toBe('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(cacheService.get('key1')).toBeUndefined();
    });

    test('should throw error for invalid TTL', () => {
      expect(() => cacheService.set('key1', 'value1', 0)).toThrow('TTL must be a positive number');
      expect(() => cacheService.set('key1', 'value1', -1)).toThrow('TTL must be a positive number');
      expect(() => cacheService.set('key1', 'value1', 'invalid')).toThrow('TTL must be a positive number');
    });

    test('should allow different TTLs for different keys', () => {
      cacheService.set('short', 'value1', 1);
      cacheService.set('long', 'value2', 100);
      
      expect(cacheService.get('short')).toBe('value1');
      expect(cacheService.get('long')).toBe('value2');
    });
  });

  describe('Cache Statistics', () => {
    test('should track cache hits', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.get('key1');
      cacheService.get('key1');
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
    });

    test('should track cache misses', () => {
      cacheService.get('nonexistent1');
      cacheService.get('nonexistent2');
      
      const stats = cacheService.getStats();
      expect(stats.misses).toBe(2);
    });

    test('should track sets', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.set('key2', 'value2', 10);
      
      const stats = cacheService.getStats();
      expect(stats.sets).toBe(2);
    });

    test('should track deletes', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.delete('key1');
      
      const stats = cacheService.getStats();
      expect(stats.deletes).toBe(1);
    });

    test('should calculate hit rate correctly', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.get('key1'); // hit
      cacheService.get('key1'); // hit
      cacheService.get('nonexistent'); // miss
      
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBe('66.67%');
    });

    test('should track number of keys', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.set('key2', 'value2', 10);
      
      const stats = cacheService.getStats();
      expect(stats.keys).toBe(2);
    });

    test('should reset statistics on clear', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.get('key1');
      cacheService.clear();
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      expect(stats.keys).toBe(0);
    });
  });

  describe('Additional Methods', () => {
    test('should check if key exists', () => {
      cacheService.set('key1', 'value1', 10);
      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('nonexistent')).toBe(false);
    });

    test('should get all keys', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.set('key2', 'value2', 10);
      
      const keys = cacheService.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });

    test('should handle complex objects', () => {
      const complexObject = {
        name: 'Test',
        nested: { value: 123 },
        array: [1, 2, 3]
      };
      
      cacheService.set('complex', complexObject, 10);
      const retrieved = cacheService.get('complex');
      
      expect(retrieved).toEqual(complexObject);
    });

    test('should handle arrays', () => {
      const array = [1, 2, 3, 4, 5];
      cacheService.set('array', array, 10);
      
      expect(cacheService.get('array')).toEqual(array);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string as key', () => {
      cacheService.set('', 'value', 10);
      expect(cacheService.get('')).toBe('value');
    });

    test('should handle null values', () => {
      cacheService.set('null', null, 10);
      expect(cacheService.get('null')).toBe(null);
    });

    test('should handle undefined values', () => {
      cacheService.set('undef', undefined, 10);
      // Note: node-cache converts undefined to null
      expect(cacheService.get('undef')).toBe(null);
    });

    test('should handle numeric keys', () => {
      cacheService.set('123', 'value', 10);
      expect(cacheService.get('123')).toBe('value');
    });

    test('should overwrite existing key', () => {
      cacheService.set('key1', 'value1', 10);
      cacheService.set('key1', 'value2', 10);
      
      expect(cacheService.get('key1')).toBe('value2');
    });
  });
});
