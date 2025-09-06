import { extractCityFromDescription, batchExtractCities, getCityStats } from '../cityParser'

describe('cityParser', () => {
  describe('extractCityFromDescription', () => {
    test('should extract city from "BY НАЗВАНИЕ, ГОРОД" format', () => {
      const result = extractCityFromDescription('BY SUPERMARKET LOGOYSK')
      expect(result.city).toBe('LOGOYSK')
      expect(result.cleanDescription).toBe('Supermarket')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    test('should extract city from "MN ГОРОДBY НАЗВАНИЕ" format', () => {
      const result = extractCityFromDescription('MN LOGOYSKBY SHOP "MAYAK", LOGOYSK')
      expect(result.city).toBe('LOGOYSK')
      expect(result.cleanDescription).toContain('Shop')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    test('should extract city from "BY НАЗВАНИЕ, ГОРОД" format', () => {
      const result = extractCityFromDescription('BY KEBAB FACTORY, MINSK')
      expect(result.city).toBe('MINSK')
      expect(result.cleanDescription).toBe('Kebab Factory')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    test('should handle unknown cities with lower confidence', () => {
      const result = extractCityFromDescription('BY SHOP, UNKNOWN_CITY')
      expect(result.city).toBeNull()
      expect(result.confidence).toBeLessThan(0.5)
    })

    test('should handle empty or invalid input', () => {
      const result1 = extractCityFromDescription('')
      expect(result1.city).toBeNull()
      expect(result1.confidence).toBe(0)

      const result2 = extractCityFromDescription(null as any)
      expect(result2.city).toBeNull()
      expect(result2.confidence).toBe(0)
    })

    test('should clean description properly', () => {
      const result = extractCityFromDescription('BY "SUPER MARKET", MINSK')
      expect(result.cleanDescription).toBe('Super Market')
      expect(result.city).toBe('MINSK')
    })
  })

  describe('batchExtractCities', () => {
    test('should process multiple descriptions', () => {
      const descriptions = [
        'BY SUPERMARKET LOGOYSK',
        'MN LOGOYSKBY SHOP "MAYAK", LOGOYSK',
        'BY KEBAB FACTORY, MINSK'
      ]
      
      const results = batchExtractCities(descriptions)
      expect(results).toHaveLength(3)
      expect(results[0].city).toBe('LOGOYSK')
      expect(results[2].city).toBe('MINSK')
    })
  })

  describe('getCityStats', () => {
    test('should calculate city statistics', () => {
      const descriptions = [
        'BY SUPERMARKET LOGOYSK',
        'BY SHOP, MINSK',
        'BY CAFE, MINSK',
        'BY STORE, LOGOYSK'
      ]
      
      const stats = getCityStats(descriptions)
      expect(stats['MINSK']).toBe(2)
      expect(stats['LOGOYSK']).toBe(2)
    })
  })
})