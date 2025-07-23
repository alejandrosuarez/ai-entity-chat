'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, Bot, MessageSquare, Sparkles, Zap, Brain, Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MarketingBannerProps {
  onClose: () => void;
  userEmail?: string;
  onInterestCaptured?: (email: string) => void;
}

const MarketingBanner = ({ onClose, userEmail, onInterestCaptured }: MarketingBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const t = useTranslations('marketing');

  useEffect(() => {
    // Trigger animation on mount
    const showTimeout = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-close after 25 seconds with fade out animation
    const closeTimeout = setTimeout(() => {
      setIsClosing(true);
      // Wait for fade animation to complete before actually closing
      setTimeout(onClose, 500);
    }, 25000);
    
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(closeTimeout);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 500); // Wait for animation
  };

  const handleInterestClick = (action: string) => {
    if (userEmail && onInterestCaptured) {
      onInterestCaptured(userEmail);
    }
    
    // Open the respective page
    if (action === 'trial') {
      window.open('/subscribe', '_blank');
    } else if (action === 'learn') {
      window.open('/learn-more', '_blank');
    }
  };

  const aiFeatures = [
    {
      icon: <Bot className="h-5 w-5" />,
      title: t('featureChatAssistant'),
      description: "Get instant answers about your entities"
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: t('featureDataAnalysis'),
      description: "Discover patterns and insights automatically"
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: t('featureAutoSuggestions'),
      description: "AI-powered recommendations for optimization"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: t('featureQuickActions'),
      description: "Automate routine tasks with AI commands"
    }
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-500 ease-out transform ${
        isVisible && !isClosing ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <Card className="mx-auto max-w-5xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white shadow-2xl border-0">
        <CardContent className="relative p-6 md:p-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-3 right-3 text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Left side - Main content */}
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-full">
                  <Rocket className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold">{t('bannerTitle')}</h3>
                  <p className="text-white/90 text-lg">{t('description')}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-white/80">/month</span>
                  <span className="bg-yellow-400 text-black px-2 py-1 rounded-full text-sm font-semibold">{t('betaPrice')}</span>
                </div>
                <p className="text-white/90">{t('limitedOffer')}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-3 text-lg" 
                  onClick={() => handleInterestClick('trial')}
                >
                  {t('startTrial')}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 hover:text-gray-900 px-6 py-3 bg-white/10 backdrop-blur-sm"
                  onClick={() => handleInterestClick('learn')}
                >
                  <span className="text-gray-900 font-medium">{t('learnMore')}</span>
                </Button>
              </div>
            </div>
            
            {/* Right side - Features grid */}
            <div className="flex-1 lg:max-w-md">
              <h4 className="text-xl font-semibold mb-4 text-center lg:text-left">{t('featuresTitle')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {aiFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm transition-all duration-300 ease-out transform ${
                      isVisible && !isClosing ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="p-1.5 bg-white/20 rounded-md flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm">{feature.title}</h5>
                      <p className="text-white/80 text-xs">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom note */}
          <div className="mt-6 pt-4 border-t border-white/20 text-center">
            <p className="text-white/70 text-sm">
              💡 {t('note')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingBanner;
