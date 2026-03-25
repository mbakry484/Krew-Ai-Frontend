'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveOnboarding } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

const steps = [
  {
    eyebrow: 'Step 1 — Business type',
    question: 'What type of business do you run?',
    sub: 'This helps Luna adapt her tone and responses to your industry.',
    key: 'businessType',
    options: ['Fashion', 'Accessories', 'Fragrances', 'Cosmetics', 'General E-commerce', 'Other']
  },
  {
    eyebrow: 'Step 2 — Revenue range',
    question: 'What is your average monthly revenue?',
    sub: 'Helps us understand your scale so we can set Luna up correctly.',
    key: 'revenueRange',
    options: ['0 – 50,000', '50,000 – 200,000', '200,000 – 500,000', '500,000+']
  },
  {
    eyebrow: 'Step 3 — DM volume',
    question: 'How many customer DMs do you receive per day?',
    sub: 'This determines how Luna is configured for your inbox load.',
    key: 'dmVolume',
    options: ['0 – 20', '20 – 60', '60 – 150', '150+']
  },
  {
    eyebrow: 'Step 4 — Main challenge',
    question: 'What is your biggest challenge right now?',
    sub: 'Luna will prioritize solving this for you first.',
    key: 'painPoint',
    options: ['Slow response time', 'Missed orders in DMs', 'Managing team replies', 'Tracking customer issues', 'Scaling customer support']
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      router.push('/auth/login');
    }
  }, [router]);

  const step = steps[currentStep];
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  const handleSelect = (option: string) => {
    setSelected(option);
  };

  const handleNext = async () => {
    if (!selected) return;

    const updatedAnswers = { ...answers, [step.key]: selected };
    setAnswers(updatedAnswers);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelected(updatedAnswers[steps[currentStep + 1].key] || null);
    } else {
      // Complete onboarding
      setLoading(true);

      try {
        await saveOnboarding(updatedAnswers);
      } catch (error) {
        console.error('Failed to save onboarding data:', error);
      }

      // Show loading messages
      const messages = ['Building your Krew…', 'Configuring Luna…', 'Almost ready…'];
      let messageIndex = 0;

      const interval = setInterval(() => {
        messageIndex++;
        if (messageIndex >= messages.length) {
          clearInterval(interval);
        }
      }, 800);

      setTimeout(() => {
        clearInterval(interval);
        setLoading(false);
        setShowWelcomeToast(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }, 2600);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    setCurrentStep(currentStep - 1);
    setSelected(answers[steps[currentStep - 1].key] || null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[500] bg-background flex flex-col items-center justify-center gap-6">
        <div className="w-7 h-7 border-[1.5px] border-border border-t-text-secondary rounded-full animate-spin" />
        <div>
          <div className="text-base font-light tracking-[-0.02em] text-text-primary">
            Building your Krew…
          </div>
          <div className="text-[0.72rem] text-text-tertiary text-center mt-[0.3rem]">
            Optimizing Luna for your business
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative">
      {/* Progress Bar */}
      <div className="w-full max-w-[480px] mb-10">
        <div className="text-[0.6rem] text-text-tertiary tracking-[0.1em] uppercase mb-[0.6rem] flex justify-between">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-[1px] bg-border rounded-[1px] overflow-hidden">
          <div
            className="h-full bg-text-secondary rounded-[1px] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Card */}
      <div className="w-full max-w-[480px] animate-fadeUp">
        <div className="text-[0.6rem] uppercase tracking-[0.1em] text-text-tertiary mb-[0.9rem]">
          {step.eyebrow}
        </div>
        <h1 className="text-[clamp(1.3rem,4vw,1.7rem)] font-light tracking-[-0.025em] leading-[1.25] text-text-primary mb-2">
          {step.question}
        </h1>
        <p className="text-[0.75rem] text-text-tertiary mb-8 leading-[1.6]">
          {step.sub}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-[0.55rem]">
          {step.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`flex items-center justify-between px-5 py-[0.95rem] bg-background2 border rounded-[10px] transition-all duration-[180ms] text-[0.8rem] text-left w-full ${
                selected === option
                  ? 'border-border-hover text-text-primary bg-background3'
                  : 'border-border text-text-secondary hover:border-border-md hover:text-text-primary hover:bg-background3'
              }`}
            >
              <span>{option}</span>
              <span className={`w-4 h-4 border rounded-full flex items-center justify-center transition-all duration-150 ${
                selected === option
                  ? 'border-text-secondary bg-text-secondary after:content-[""] after:w-[5px] after:h-[5px] after:rounded-full after:bg-background'
                  : 'border-border'
              }`} />
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleBack}
            className={`text-[0.72rem] text-text-tertiary hover:text-text-secondary transition-colors duration-200 ${
              currentStep === 0 ? 'invisible' : ''
            }`}
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!selected}
            className={`bg-btn-bg text-btn-text px-[22px] py-[9px] rounded-[8px] text-[0.78rem] font-medium transition-opacity duration-200 ${
              selected ? 'opacity-100 hover:opacity-85' : 'opacity-35 pointer-events-none'
            }`}
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Welcome Toast */}
      {showWelcomeToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background2 border border-border-md rounded-[10px] px-6 py-[0.9rem] flex items-center gap-[0.7rem] text-[0.75rem] text-text-secondary shadow-[0_8px_32px_rgba(0,0,0,0.2)] z-[400] whitespace-nowrap animate-toastIn">
          <span className="w-[6px] h-[6px] rounded-full bg-text-secondary animate-pulse flex-shrink-0" />
          Welcome to Krew! Luna is ready.
        </div>
      )}

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .animate-fadeUp {
          animation: fadeUp 0.4s ease both;
        }

        .animate-toastIn {
          animation: toastIn 0.4s 0.3s ease both;
        }
      `}</style>
    </div>
  );
}