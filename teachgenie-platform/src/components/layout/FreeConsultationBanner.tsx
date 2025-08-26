import Link from 'next/link'
import { GiftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

export default function FreeConsultationBanner() {
  return (
    <div className="bg-gradient-to-r from-[#e38614]/90 to-[#f39c1f]/90 text-white py-3 px-4 text-center">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center">
          <GiftIcon className="w-4 h-4 mr-2 text-white" />
          <span className="font-medium">Free Consultation Lessons Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-90">Select tutors offer complimentary first sessions</span>
          <Link 
            href="/tutors" 
            className="inline-flex items-center text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all duration-200 hover:scale-105"
          >
            Find Tutors
            <ArrowRightIcon className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
