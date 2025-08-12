'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Crown, Check, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHotspots: number;
  maxHotspots: number;
  isSignedIn: boolean;
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentHotspots, 
  maxHotspots,
  isSignedIn 
}: UpgradeModalProps) {
  const handleSignUp = () => {
    window.location.href = '/auth/signup';
  };

  const handleUpgrade = () => {
    // TODO: Implement actual upgrade flow
    alert('Upgrade flow will be implemented with Stripe integration');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-bold text-gray-900"
                    >
                      Upgrade to Pro
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-gray-900">Limit Reached!</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      You've used {currentHotspots} of {maxHotspots} free hotspots. 
                      {isSignedIn 
                        ? " Upgrade to Pro for unlimited hotspots!"
                        : " Sign up to track your usage and upgrade for unlimited hotspots!"
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">Pro Plan</h4>
                          <p className="text-2xl font-bold text-blue-600">$1.99<span className="text-sm font-normal text-gray-500">/month</span></p>
                        </div>
                      </div>
                      
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">Unlimited hotspots</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">Unlimited projects</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">Priority support</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">All current & future features</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Maybe Later
                  </button>
                  {isSignedIn ? (
                    <button
                      onClick={handleUpgrade}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                    >
                      Upgrade Now
                    </button>
                  ) : (
                    <button
                      onClick={handleSignUp}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                    >
                      Sign Up & Upgrade
                    </button>
                  )}
                </div>

                {!isSignedIn && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Already have an account? <a href="/auth/login" className="text-blue-600 hover:underline">Sign in</a>
                  </p>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}