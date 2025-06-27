import { getPrivacyHtml } from '@/lib/getPrivacyHtml'

export default function PrivacyPage() {
  const html = getPrivacyHtml()

  return (
    <div className="prose mx-auto max-w-3xl py-10">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
} 