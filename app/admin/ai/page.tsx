'use client'

import AIConfigManager from '../components/AIConfigManager'

export default function AdminAiPage() {
  return (
    <div className="p-8">
      <AIConfigManager title="AI Providers & Models" />
    </div>
  )
}
