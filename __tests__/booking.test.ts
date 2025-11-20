import { describe, it, expect, beforeEach } from '@jest/globals'

// Mock booking calculation functions
// These should match the logic in BookingsPage.tsx
const getPrice = (flightType: any, currency: string): number => {
  switch (currency) {
    case 'GEL':
      return flightType.price_gel || 0
    case 'USD':
      return flightType.price_usd || 0
    case 'EUR':
      return flightType.price_eur || 0
    default:
      return 0
  }
}

const getSubtotal = (basePrice: number, numberOfPeople: number): number => {
  return basePrice * numberOfPeople
}

const getDiscount = (subtotal: number, promoDiscount: number): number => {
  return (subtotal * promoDiscount) / 100
}

const getTotalPrice = (subtotal: number, discount: number): number => {
  return subtotal - discount
}

describe('Booking Price Calculations', () => {
  const mockFlightType = {
    id: '1',
    name: 'Tandem Flight',
    price_gel: 300,
    price_usd: 100,
    price_eur: 90,
  }

  describe('getPrice', () => {
    it('should return GEL price when currency is GEL', () => {
      expect(getPrice(mockFlightType, 'GEL')).toBe(300)
    })

    it('should return USD price when currency is USD', () => {
      expect(getPrice(mockFlightType, 'USD')).toBe(100)
    })

    it('should return EUR price when currency is EUR', () => {
      expect(getPrice(mockFlightType, 'EUR')).toBe(90)
    })

    it('should return 0 for invalid currency', () => {
      expect(getPrice(mockFlightType, 'INVALID')).toBe(0)
    })
  })

  describe('getSubtotal', () => {
    it('should calculate subtotal for 1 person', () => {
      expect(getSubtotal(100, 1)).toBe(100)
    })

    it('should calculate subtotal for multiple people', () => {
      expect(getSubtotal(100, 3)).toBe(300)
    })

    it('should handle 0 people', () => {
      expect(getSubtotal(100, 0)).toBe(0)
    })
  })

  describe('getDiscount', () => {
    it('should calculate 10% discount', () => {
      expect(getDiscount(300, 10)).toBe(30)
    })

    it('should calculate 20% discount', () => {
      expect(getDiscount(500, 20)).toBe(100)
    })

    it('should return 0 for no discount', () => {
      expect(getDiscount(300, 0)).toBe(0)
    })

    it('should handle 100% discount', () => {
      expect(getDiscount(300, 100)).toBe(300)
    })
  })

  describe('getTotalPrice', () => {
    it('should calculate total with discount', () => {
      expect(getTotalPrice(300, 30)).toBe(270)
    })

    it('should calculate total without discount', () => {
      expect(getTotalPrice(300, 0)).toBe(300)
    })

    it('should handle full discount', () => {
      expect(getTotalPrice(300, 300)).toBe(0)
    })
  })

  describe('Complete Booking Flow', () => {
    it('should calculate correct total for 1 person without promo', () => {
      const basePrice = getPrice(mockFlightType, 'GEL')
      const subtotal = getSubtotal(basePrice, 1)
      const discount = getDiscount(subtotal, 0)
      const total = getTotalPrice(subtotal, discount)

      expect(total).toBe(300)
    })

    it('should calculate correct total for 3 people with 10% discount', () => {
      const basePrice = getPrice(mockFlightType, 'GEL')
      const subtotal = getSubtotal(basePrice, 3) // 900
      const discount = getDiscount(subtotal, 10) // 90
      const total = getTotalPrice(subtotal, discount) // 810

      expect(total).toBe(810)
    })

    it('should calculate correct total in USD', () => {
      const basePrice = getPrice(mockFlightType, 'USD')
      const subtotal = getSubtotal(basePrice, 2) // 200
      const discount = getDiscount(subtotal, 15) // 30
      const total = getTotalPrice(subtotal, discount) // 170

      expect(total).toBe(170)
    })

    it('should calculate correct total in EUR with 20% discount', () => {
      const basePrice = getPrice(mockFlightType, 'EUR')
      const subtotal = getSubtotal(basePrice, 4) // 360
      const discount = getDiscount(subtotal, 20) // 72
      const total = getTotalPrice(subtotal, discount) // 288

      expect(total).toBe(288)
    })
  })

  describe('Backend Validation Logic', () => {
    it('should match backend price tolerance (0.01)', () => {
      const frontendTotal = 810.005
      const backendTotal = 810.0
      const tolerance = 0.01

      expect(Math.abs(frontendTotal - backendTotal)).toBeLessThanOrEqual(tolerance)
    })

    it('should reject prices outside tolerance', () => {
      const frontendTotal = 810.05
      const backendTotal = 810.0
      const tolerance = 0.01

      expect(Math.abs(frontendTotal - backendTotal)).toBeGreaterThan(tolerance)
    })
  })
})

describe('Promo Code Validation', () => {
  const now = new Date('2025-11-20T12:00:00Z')

  const validatePromoCode = (promo: {
    is_active: boolean
    valid_from: string | null
    valid_until: string | null
    usage_count: number
    usage_limit: number | null
    discount_percentage: number
  }): number => {
    if (!promo.is_active) return 0

    const validFrom = promo.valid_from ? new Date(promo.valid_from) : null
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null

    const isDateValid = (!validFrom || validFrom <= now) && (!validUntil || validUntil >= now)
    const isUsageValid = !promo.usage_limit || promo.usage_count < promo.usage_limit

    return isDateValid && isUsageValid ? promo.discount_percentage : 0
  }

  it('should accept valid promo code', () => {
    const promo = {
      is_active: true,
      valid_from: '2025-11-01',
      valid_until: '2025-12-31',
      usage_count: 5,
      usage_limit: 100,
      discount_percentage: 15,
    }

    expect(validatePromoCode(promo)).toBe(15)
  })

  it('should reject inactive promo code', () => {
    const promo = {
      is_active: false,
      valid_from: null,
      valid_until: null,
      usage_count: 0,
      usage_limit: null,
      discount_percentage: 20,
    }

    expect(validatePromoCode(promo)).toBe(0)
  })

  it('should reject promo code that reached usage limit', () => {
    const promo = {
      is_active: true,
      valid_from: null,
      valid_until: null,
      usage_count: 100,
      usage_limit: 100,
      discount_percentage: 25,
    }

    expect(validatePromoCode(promo)).toBe(0)
  })

  it('should accept promo code without usage limit', () => {
    const promo = {
      is_active: true,
      valid_from: null,
      valid_until: null,
      usage_count: 1000,
      usage_limit: null,
      discount_percentage: 10,
    }

    expect(validatePromoCode(promo)).toBe(10)
  })

  it('should reject expired promo code', () => {
    const promo = {
      is_active: true,
      valid_from: '2025-01-01',
      valid_until: '2025-10-31', // before current date (2025-11-20)
      usage_count: 0,
      usage_limit: 100,
      discount_percentage: 30,
    }

    expect(validatePromoCode(promo)).toBe(0)
  })

  it('should reject promo code not yet valid', () => {
    const promo = {
      is_active: true,
      valid_from: '2025-12-01', // after current date (2025-11-20)
      valid_until: '2025-12-31',
      usage_count: 0,
      usage_limit: 100,
      discount_percentage: 20,
    }

    expect(validatePromoCode(promo)).toBe(0)
  })
})
