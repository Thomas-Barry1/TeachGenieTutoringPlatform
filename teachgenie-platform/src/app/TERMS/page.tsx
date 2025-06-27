import { getTermsHtml } from '@/lib/getTermsHtml'

export default function TermsPage() {
  const html = getTermsHtml()

  return (
    <div className="prose mx-auto max-w-3xl py-10">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
} 