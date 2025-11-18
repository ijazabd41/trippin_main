import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
  canonicalUrl?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords = [],
  image = '/trippin-logo.png',
  type = 'website',
  noIndex = false,
  canonicalUrl,
  structuredData
}) => {
  const location = useLocation();
  const { currentLanguage, t } = useLanguage();
  
  // Default SEO values
  const defaultTitle = 'TRIPPIN - AI-Powered Japan Travel Planner';
  const defaultDescription = 'Plan your perfect Japan trip with AI-powered itinerary generation, eSIM support, and 24/7 travel assistance.';
  const defaultKeywords = ['Japan travel', 'AI travel planner', 'trip planning', 'Japan tourism', 'eSIM', 'travel assistant'];
  
  // Build final values
  const finalTitle = title ? `${title} | TRIPPIN` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = [...defaultKeywords, ...keywords];
  const finalImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;
  const finalCanonicalUrl = canonicalUrl || `${window.location.origin}${location.pathname}`;
  
  // Generate hreflang URLs
  const languages = ['ja', 'en', 'zh', 'ko', 'es', 'fr'];
  const hreflangs = languages.map(lang => ({
    lang,
    url: `${window.location.origin}${location.pathname}?lang=${lang}`
  }));

  // Page-specific structured data
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "TRIPPIN",
      "description": finalDescription,
      "url": window.location.origin,
      "applicationCategory": "TravelApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "1500",
        "priceCurrency": "JPY",
        "description": "Premium travel planning service"
      },
      "author": {
        "@type": "Organization",
        "name": "TRIPPIN Inc.",
        "url": window.location.origin
      }
    };

    // Add page-specific structured data
    if (structuredData) {
      return { ...baseData, ...structuredData };
    }

    // Generate page-specific data based on route
    switch (location.pathname) {
      case '/':
        return {
          ...baseData,
          "@type": "WebSite",
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        };
      
      case '/dashboard':
        return {
          ...baseData,
          "@type": "WebPage",
          "name": "Travel Dashboard",
          "description": "Manage your Japan travel plans and bookings"
        };
      
      default:
        return baseData;
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords.join(', ')} />
      <meta name="author" content="TRIPPIN Inc." />
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      <meta name="language" content={currentLanguage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {/* Hreflang Tags */}
      {hreflangs.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${window.location.origin}${location.pathname}`} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="TRIPPIN" />
      <meta property="og:locale" content={currentLanguage === 'ja' ? 'ja_JP' : 'en_US'} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:site" content="@trippin_app" />
      <meta name="twitter:creator" content="@trippin_app" />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="TRIPPIN" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#8b5cf6" />
      <meta name="msapplication-TileColor" content="#8b5cf6" />
      <meta name="msapplication-navbutton-color" content="#8b5cf6" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://images.pexels.com" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//images.pexels.com" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(getStructuredData())}
      </script>
      
      {/* Additional Meta Tags for Japan Travel */}
      <meta name="geo.region" content="JP" />
      <meta name="geo.placename" content="Japan" />
      <meta name="geo.position" content="35.6762;139.6503" />
      <meta name="ICBM" content="35.6762, 139.6503" />
      
      {/* Travel-specific meta tags */}
      <meta name="travel.destination" content="Japan" />
      <meta name="travel.type" content="leisure" />
      <meta name="travel.duration" content="flexible" />
    </Helmet>
  );
};

export default SEOHead;