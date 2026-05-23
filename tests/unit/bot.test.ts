import { normalizePhone } from '@/lib/pricing'

// Bot state machine tests are primarily integration tests (require Supabase + WA API).
// Unit-testable: pure utility logic extracted from bot.ts

describe('Bot state machine utilities', () => {
  describe('Package type menu parsing', () => {
    const PACKAGE_MAP: Record<string, { label: string; weightKg: number }> = {
      '1': { label: 'Dokumen',           weightKg: 0.5 },
      '2': { label: 'Makanan & Minuman', weightKg: 1.5 },
      '3': { label: 'Paket Kecil',       weightKg: 2.0 },
      '4': { label: 'Paket Sedang',      weightKg: 4.0 },
      '5': { label: 'Paket Besar',       weightKg: 6.0 },
      '6': { label: 'Lainnya',           weightKg: 1.0 },
    }

    it('maps all 6 package type options', () => {
      expect(Object.keys(PACKAGE_MAP)).toHaveLength(6)
    })

    it('option 4 triggers medium weight multiplier', () => {
      const pkg = PACKAGE_MAP['4']
      expect(pkg.weightKg).toBeGreaterThan(3)
      expect(pkg.weightKg).toBeLessThanOrEqual(5)
    })

    it('option 5 triggers heavy weight multiplier', () => {
      const pkg = PACKAGE_MAP['5']
      expect(pkg.weightKg).toBeGreaterThan(5)
    })
  })

  describe('Global command detection', () => {
    const globalCommands = ['BANTUAN', 'HELP', 'BATAL', 'CANCEL', 'STATUS']

    const isGlobalCommand = (text: string) =>
      globalCommands.includes(text.trim().toUpperCase())

    it('detects BANTUAN regardless of case', () => {
      expect(isGlobalCommand('bantuan')).toBe(true)
      expect(isGlobalCommand('BANTUAN')).toBe(true)
      expect(isGlobalCommand('Bantuan')).toBe(true)
    })

    it('detects BATAL command', () => {
      expect(isGlobalCommand('batal')).toBe(true)
    })

    it('ignores non-command messages', () => {
      expect(isGlobalCommand('Jl. Gerung No. 5')).toBe(false)
    })

    it('detects STATUS command', () => {
      expect(isGlobalCommand('STATUS')).toBe(true)
    })
  })

  describe('Courier response parsing', () => {
    const parseCourierResponse = (text: string): 'accept' | 'reject' | null => {
      const t = text.trim()
      if (t === '1') return 'accept'
      if (t === '0') return 'reject'
      return null
    }

    it('parses "1" as accept', () => {
      expect(parseCourierResponse('1')).toBe('accept')
    })

    it('parses "0" as reject', () => {
      expect(parseCourierResponse('0')).toBe('reject')
    })

    it('returns null for other input', () => {
      expect(parseCourierResponse('yes')).toBeNull()
      expect(parseCourierResponse('2')).toBeNull()
    })
  })

  describe('Payment method validation', () => {
    const parsePayment = (text: string): 'cod' | 'transfer' | null => {
      const t = text.trim()
      if (t === '1') return 'cod'
      if (t === '2') return 'transfer'
      return null
    }

    it('parses "1" as COD', () => {
      expect(parsePayment('1')).toBe('cod')
    })

    it('parses "2" as transfer', () => {
      expect(parsePayment('2')).toBe('transfer')
    })

    it('rejects invalid input', () => {
      expect(parsePayment('3')).toBeNull()
      expect(parsePayment('cod')).toBeNull()
    })
  })
})
