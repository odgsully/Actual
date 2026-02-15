'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

export default function AgentView() {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = {
    basic: {
      name: 'Basic',
      monthly: 85,
      annual: 67,
      savings: '21%',
      features: [
        'LLM-infused IDX custom viewport',
        'Advanced backend infrastructure',
        'Zillow integration',
        'Hindsight loading for buyer\'s My Favorites',
        'Refined property ranking system',
        'Standard support'
      ],
      stripeLink: {
        monthly: '#', // Replace with actual Stripe payment link
        annual: '#'   // Replace with actual Stripe payment link
      }
    },
    pro: {
      name: 'PRO',
      monthly: 130,
      annual: 102.7,
      savings: '21%',
      features: [
        'Everything in Basic',
        'Upgraded priority support',
        'Wabbit customization PRO Suite',
        'Full brand customization',
        'Up to 5GB of storage',
        'Advanced analytics dashboard',
        'API access',
        'White-label options'
      ],
      stripeLink: {
        monthly: '#', // Replace with actual Stripe payment link
        annual: '#'   // Replace with actual Stripe payment link
      }
    }
  };

  const currentPlan = plans[selectedPlan];
  const price = billingCycle === 'monthly' ? currentPlan.monthly : currentPlan.annual;

  const handleGetStarted = () => {
    // For now, just log the selection. Replace with actual Stripe redirect
    console.log(`Selected: ${selectedPlan} - ${billingCycle}`);
    // window.location.href = currentPlan.stripeLink[billingCycle];
    alert(`Stripe integration pending: ${currentPlan.name} - ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'} - $${price}${billingCycle === 'monthly' ? '/mo' : '/mo (billed annually)'}`);
  };

  return (
    <div className="min-h-screen h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Agent Portal
          </h1>
          <p className="text-xl text-gray-300">
            Empower your real estate business with AI-driven property matching
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-full p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-purple-900 font-semibold'
                  : 'text-white hover:text-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-purple-900 font-semibold'
                  : 'text-white hover:text-gray-200'
              }`}
            >
              Annual
              <span className="ml-2 text-green-400 text-sm font-bold">Save 21%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Basic Plan */}
          <div
            onClick={() => setSelectedPlan('basic')}
            className={`relative rounded-2xl p-8 cursor-pointer transition-all transform hover:scale-105 ${
              selectedPlan === 'basic'
                ? 'bg-white/20 backdrop-blur-lg border-2 border-purple-400 shadow-2xl'
                : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15'
            }`}
          >
            {selectedPlan === 'basic' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  SELECTED
                </span>
              </div>
            )}

            <div className="text-white">
              <h3 className="text-2xl font-bold mb-4">{plans.basic.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">
                  ${billingCycle === 'monthly' ? plans.basic.monthly : plans.basic.annual}
                </span>
                <span className="text-gray-300 ml-2">
                  {billingCycle === 'monthly' ? '/month' : '/month (billed annually)'}
                </span>
              </div>

              <ul className="space-y-3">
                {plans.basic.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PRO Plan */}
          <div
            onClick={() => setSelectedPlan('pro')}
            className={`relative rounded-2xl p-8 cursor-pointer transition-all transform hover:scale-105 ${
              selectedPlan === 'pro'
                ? 'bg-white/20 backdrop-blur-lg border-2 border-purple-400 shadow-2xl'
                : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15'
            }`}
          >
            {selectedPlan === 'pro' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  SELECTED
                </span>
              </div>
            )}

            <div className="absolute -top-3 right-8">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </span>
            </div>

            <div className="text-white">
              <h3 className="text-2xl font-bold mb-4">{plans.pro.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">
                  ${billingCycle === 'monthly' ? plans.pro.monthly : plans.pro.annual}
                </span>
                <span className="text-gray-300 ml-2">
                  {billingCycle === 'monthly' ? '/month' : '/month (billed annually)'}
                </span>
              </div>

              <ul className="space-y-3">
                {plans.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-12 rounded-full text-xl shadow-2xl transform transition-all hover:scale-105 active:scale-95"
          >
            Get Started with {currentPlan.name}
          </button>
          <p className="text-gray-400 mt-4 text-sm">
            No setup fees • Cancel anytime • Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}