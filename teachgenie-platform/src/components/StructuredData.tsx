'use client'

import { useEffect } from 'react'

interface StructuredDataProps {
  data: Record<string, any>
}

export default function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    // Remove any existing structured data script
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Create new script element
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [data])

  return null
}

// Predefined structured data schemas
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "TeachGenie",
  "description": "Online tutoring platform connecting students with expert tutors for personalized learning experiences across all subjects.",
  "url": "https://teachgenie.io",
  "logo": "https://teachgenie.io/logo.png",
  "image": "https://teachgenie.io/logo.png",
  "foundingDate": "2024",
  "founder": {
    "@type": "Person",
    "name": "TeachGenie Team"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "teachgenieai@gmail.com",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://twitter.com/teachgenieai",
    "https://linkedin.com/company/teachgenie",
    "https://facebook.com/teachgenie",
    "https://youtube.com/@teachgenie",
    "https://instagram.com/teachgenie"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Tutoring Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Math Tutoring",
          "description": "Expert math tutoring for all levels from elementary to advanced calculus"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Science Tutoring",
          "description": "Comprehensive science tutoring including physics, chemistry, and biology"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "English Tutoring",
          "description": "English language and literature tutoring for all skill levels"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Computer Science Tutoring",
          "description": "Programming and computer science concepts tutoring"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "reviewCount": "25",
    "bestRating": "5",
    "worstRating": "1"
  }
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TeachGenie",
  "url": "https://teachgenie.io",
  "description": "Online tutoring platform connecting students with expert tutors for personalized learning experiences.",
  "publisher": {
    "@type": "EducationalOrganization",
    "name": "TeachGenie"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://teachgenie.io/tutors?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Online Tutoring Services",
  "description": "Professional online tutoring services connecting students with qualified educators for personalized learning experiences.",
  "provider": {
    "@type": "EducationalOrganization",
    "name": "TeachGenie",
    "url": "https://teachgenie.io"
  },
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Tutoring Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "One-on-One Tutoring",
          "description": "Personalized one-on-one tutoring sessions with expert educators"
        },
        "priceRange": "$25-$75",
        "priceCurrency": "USD",
        "priceSpecification": {
          "@type": "PriceSpecification",
          "priceRange": "$25-$75",
          "priceCurrency": "USD",
          "unitText": "per hour"
        }
      }
    ]
  },
  "serviceType": "Educational Services",
  "category": "Education",
  "audience": {
    "@type": "Audience",
    "audienceType": "Students"
  }
}

export const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://teachgenie.io"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Find Tutors",
      "item": "https://teachgenie.io/tutors"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Dashboard",
      "item": "https://teachgenie.io/dashboard"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Messages",
      "item": "https://teachgenie.io/inbox"
    },
    {
      "@type": "ListItem",
      "position": 5,
      "name": "Sessions",
      "item": "https://teachgenie.io/sessions"
    }
  ]
}

export const mainEntitySchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "TeachGenie Main Navigation",
  "description": "Main sections of the TeachGenie tutoring platform",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Find Tutors",
      "description": "Browse and connect with expert tutors",
      "url": "https://teachgenie.io/tutors"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Dashboard",
      "description": "Access your personal dashboard and account",
      "url": "https://teachgenie.io/dashboard"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Messages",
      "description": "Communicate with tutors and students",
      "url": "https://teachgenie.io/inbox"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Sessions",
      "description": "Manage your tutoring sessions",
      "url": "https://teachgenie.io/sessions"
    },
  ]
}
