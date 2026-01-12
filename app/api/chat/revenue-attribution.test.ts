/**
 * Revenue Attribution Tests
 */

import {
  attributeDealToConversation,
  calculateRevenueMetrics,
  formatRevenueReportAsTable,
  type Deal,
} from './revenue-attribution'

describe('Revenue Attribution', () => {
  const mockConversations = [
    {
      id: 'conv-1',
      sessionId: 'session-123',
      userId: 'user-1',
      timestamp: '2024-01-15T10:00:00.000Z',
      intent: { detected: 'company_registration_pricing' as const },
      persona: { detected: 'REGISTRATION' as const },
      responseType: 'pricing',
      userActions: {
        contactMethod: 'phone',
        contactedAt: '2024-01-15T10:01:00.000Z',
      },
      metadata: {
        userEmail: 'customer1@example.com',
        userPhone: '081-234-5678',
      },
    },
    {
      id: 'conv-2',
      sessionId: 'session-456',
      userId: 'user-2',
      timestamp: '2024-01-16T10:00:00.000Z',
      intent: { detected: 'accounting_pricing' as const },
      persona: { detected: 'ACCOUNTING' as const },
      responseType: 'pricing',
      userActions: {
        contactMethod: 'email',
        contactedAt: '2024-01-16T10:02:00.000Z',
      },
      metadata: {
        userEmail: 'customer2@example.com',
      },
    },
    {
      id: 'conv-3',
      sessionId: 'session-789',
      timestamp: '2024-01-17T10:00:00.000Z',
      intent: { detected: 'hr_pricing' as const },
      persona: { detected: 'HR' as const },
      responseType: 'pricing',
      userActions: {
        contactMethod: 'click',
      },
    },
  ]

  describe('attributeDealToConversation', () => {
    it('should attribute deal with direct conversation ID', () => {
      const deal: Deal = {
        id: 'deal-1',
        status: 'closed_won',
        serviceType: 'registration',
        dealValue: 25000,
        currency: 'THB',
        createdDate: '2024-01-20T10:00:00.000Z',
        attributedConversationId: 'conv-1',
        attributionConfidence: 1.0,
        attributionMethod: 'direct',
      }

      const attribution = attributeDealToConversation(deal, mockConversations)

      expect(attribution.conversationId).toBe('conv-1')
      expect(attribution.confidence).toBe(1.0)
      expect(attribution.method).toBe('direct')
    })

    it('should attribute deal by session ID', () => {
      const deal: Deal = {
        id: 'deal-2',
        status: 'closed_won',
        serviceType: 'accounting',
        dealValue: 30000,
        currency: 'THB',
        createdDate: '2024-01-20T10:00:00.000Z',
        attributedSessionId: 'session-456',
        attributionConfidence: 0.9,
        attributionMethod: 'session_match',
      }

      const attribution = attributeDealToConversation(deal, mockConversations)

      expect(attribution.conversationId).toBe('conv-2')
      expect(attribution.confidence).toBe(0.9)
      expect(attribution.method).toBe('session_match')
    })

    it('should attribute deal by email match', () => {
      const deal: Deal = {
        id: 'deal-3',
        status: 'closed_won',
        serviceType: 'accounting',
        dealValue: 30000,
        currency: 'THB',
        createdDate: '2024-01-20T10:00:00.000Z',
        customerEmail: 'customer1@example.com',
        attributionConfidence: 0.8,
        attributionMethod: 'email_match',
      }

      const attribution = attributeDealToConversation(deal, mockConversations)

      expect(attribution.conversationId).toBe('conv-1')
      expect(attribution.confidence).toBe(0.8)
      expect(attribution.method).toBe('email_match')
    })

    it('should attribute deal by phone match', () => {
      const deal: Deal = {
        id: 'deal-4',
        status: 'closed_won',
        serviceType: 'registration',
        dealValue: 25000,
        currency: 'THB',
        createdDate: '2024-01-20T10:00:00.000Z',
        customerPhone: '081-234-5678',
        attributionConfidence: 0.8,
        attributionMethod: 'phone_match',
      }

      const attribution = attributeDealToConversation(deal, mockConversations)

      expect(attribution.conversationId).toBe('conv-1')
      expect(attribution.confidence).toBe(0.8)
      expect(attribution.method).toBe('phone_match')
    })

    it('should return no match if no criteria match', () => {
      const deal: Deal = {
        id: 'deal-5',
        status: 'closed_won',
        serviceType: 'registration',
        dealValue: 25000,
        currency: 'THB',
        createdDate: '2024-02-01T10:00:00.000Z', // More than 7 days after last conversation
        attributionConfidence: 0,
        attributionMethod: 'unknown',
      }

      const attribution = attributeDealToConversation(deal, mockConversations)

      expect(attribution.conversationId).toBeUndefined()
      expect(attribution.confidence).toBe(0)
      expect(attribution.method).toBe('unknown')
    })
  })

  describe('calculateRevenueMetrics', () => {
    it('should calculate revenue metrics correctly', () => {
      const deals: Deal[] = [
        {
          id: 'deal-1',
          status: 'closed_won',
          serviceType: 'registration',
          dealValue: 25000,
          currency: 'THB',
          createdDate: '2024-01-20T10:00:00.000Z',
          closedDate: '2024-01-25T10:00:00.000Z',
          daysToClose: 10,
          attributedConversationId: 'conv-1',
          attributedPersona: 'REGISTRATION',
          attributedIntent: 'company_registration_pricing',
          attributionConfidence: 1.0,
          attributionMethod: 'direct',
        },
        {
          id: 'deal-2',
          status: 'closed_won',
          serviceType: 'accounting',
          dealValue: 30000,
          currency: 'THB',
          createdDate: '2024-01-21T10:00:00.000Z',
          closedDate: '2024-01-28T10:00:00.000Z',
          daysToClose: 12,
          attributedConversationId: 'conv-2',
          attributedPersona: 'ACCOUNTING',
          attributedIntent: 'accounting_pricing',
          attributionConfidence: 1.0,
          attributionMethod: 'direct',
        },
        {
          id: 'deal-3',
          status: 'closed_lost', // Should be excluded
          serviceType: 'hr',
          dealValue: 20000,
          currency: 'THB',
          createdDate: '2024-01-22T10:00:00.000Z',
          attributionConfidence: 1.0,
          attributionMethod: 'direct',
        },
      ]

      const metrics = calculateRevenueMetrics(deals, mockConversations)

      expect(metrics.totalRevenue).toBe(55000)
      expect(metrics.totalDeals).toBe(2)
      expect(metrics.averageDealValue).toBe(27500)
      expect(metrics.revenueByPersona.REGISTRATION.revenue).toBe(25000)
      expect(metrics.revenueByPersona.ACCOUNTING.revenue).toBe(30000)
      expect(metrics.revenueByPersona.HR.revenue).toBe(0)
      expect(metrics.averageDaysToClose).toBe(11)
    })

    it('should handle empty deals array', () => {
      const metrics = calculateRevenueMetrics([], mockConversations)

      expect(metrics.totalRevenue).toBe(0)
      expect(metrics.totalDeals).toBe(0)
      expect(metrics.averageDealValue).toBe(0)
    })
  })

  describe('formatRevenueReportAsTable', () => {
    it('should format metrics as table', () => {
      const deals: Deal[] = [
        {
          id: 'deal-1',
          status: 'closed_won',
          serviceType: 'registration',
          dealValue: 25000,
          currency: 'THB',
          createdDate: '2024-01-20T10:00:00.000Z',
          attributedPersona: 'REGISTRATION',
          attributedIntent: 'company_registration_pricing',
          attributionConfidence: 1.0,
          attributionMethod: 'direct',
        },
      ]

      const metrics = calculateRevenueMetrics(deals, mockConversations)
      const table = formatRevenueReportAsTable(metrics)

      expect(table).toContain('REVENUE ATTRIBUTION REPORT')
      expect(table).toContain('Total Revenue')
      expect(table).toContain('REVENUE BY PERSONA')
      expect(table).toContain('REGISTRATION')
    })
  })
})
