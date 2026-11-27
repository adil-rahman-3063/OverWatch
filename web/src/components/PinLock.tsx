import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, Check, ShieldCheck } from 'lucide-react';

interface PinLockProps {
  expectedPin: string;
  onAuthenticated: () => void;
}

export const PinLock: React.FC<PinLockProps> = ({ expectedPin, onAuthenticated }) => {
  const [pin, setPin] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const handleComplete = useCallback(
    (enteredPin: string) => {
      if (enteredPin === expectedPin) {
        setIsSuccess(true);
        setHasError(false);
        if (rememberDevice) {
          localStorage.setItem('overwatch_auth_token', 'true');
          localStorage.setItem('overwatch_auth_timestamp', new Date().toISOString());
        } else {
          sessionStorage.setItem('overwatch_auth_token', 'true');
        }
        setTimeout(() => {
          onAuthenticated();
        }, 100);
      } else {
        setHasError(true);
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        setTimeout(() => {
          setPin('');
          setHasError(false);
        }, 700);
      }
    },
    [expectedPin, onAuthenticated, rememberDevice]
  );

  const handleKeyPress = (num: string) => {
    if (pin.length < 6 && !isSuccess) {
      const nextPin = pin + num;
      setPin(nextPin);
      setHasError(false);
      if (nextPin.length === 6) {
        handleComplete(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !isSuccess) {
      setPin(pin.slice(0, -1));
      setHasError(false);
    }
  };

  // Support physical keyboard (laptops/external keyboards)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isSuccess, handleComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col landscape:flex-row items-center justify-between landscape:justify-center landscape:gap-10 p-4 sm:p-6 landscape:p-4 select-none font-sans antialiased text-[#f4f4f5] overflow-y-auto no-scrollbar">
      {/* Top / Left Header + PIN Indicators */}
      <div className="flex flex-col items-center text-center space-y-3 landscape:space-y-2 pt-4 sm:pt-8 landscape:pt-0">
        <div
          className={`w-12 sm:w-14 h-12 sm:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
            isSuccess
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
              : hasError
              ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
              : 'bg-[#0b0b0e] border-[#1f1f26] text-neutral-300'
          }`}
        >
          {isSuccess ? (
            <ShieldCheck className="w-6 sm:w-7 h-6 sm:h-7" />
          ) : (
            <Lock className="w-5 sm:w-6 h-5 sm:h-6" />
          )}
        </div>

        <div className="space-y-0.5">
          <h1 className="text-xs sm:text-sm font-mono font-medium uppercase tracking-widest text-neutral-400">
            OverWatch Security
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-500 font-mono">
            Enter 6-digit PIN to authenticate device
          </p>
        </div>

        {/* 6-Digit Visual Code Indicators */}
        <div className="flex flex-col items-center space-y-2 pt-2">
          <div
            className={`flex items-center gap-2.5 transition-transform ${
              hasError ? 'animate-shake' : ''
            }`}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = pin.length > index;
              const isCurrent = pin.length === index && !isSuccess;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 flex items-center justify-center ${
                    isSuccess
                      ? 'bg-emerald-400 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                      : hasError
                      ? 'bg-rose-500 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                      : isFilled
                      ? 'bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                      : isCurrent
                      ? 'border-amber-400 bg-amber-400/20 animate-pulse'
                      : 'border-neutral-800 bg-[#0d0d12]'
                  }`}
                />
              );
            })}
          </div>

          <p
            className={`text-[10px] sm:text-[11px] font-mono h-4 transition-colors ${
              hasError
                ? 'text-rose-400 font-medium'
                : isSuccess
                ? 'text-emerald-400 font-medium'
                : 'text-neutral-600'
            }`}
          >
            {hasError
              ? 'Incorrect PIN. Try again.'
              : isSuccess
              ? 'Access Granted. Initializing...'
              : 'Ask once • Device remembered'}
          </p>
        </div>
      </div>

      {/* Right / Bottom: Tactile Numeric Keypad */}
      <div className="w-full max-w-xs space-y-2 sm:space-y-4 pb-2 sm:pb-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-10 sm:h-12 landscape:h-9 md:landscape:h-11 rounded-xl bg-[#09090c] hover:bg-[#131318] active:bg-neutral-800 border border-[#1b1b22] text-white font-mono text-lg sm:text-xl font-medium flex items-center justify-center active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}

          {/* Empty placeholder or check mark */}
          <div className="h-10 sm:h-12 landscape:h-9 md:landscape:h-11 flex items-center justify-center text-neutral-600">
            {isSuccess && <Check className="w-5 h-5 text-emerald-400" />}
          </div>

          <button
            onClick={() => handleKeyPress('0')}
            className="h-10 sm:h-12 landscape:h-9 md:landscape:h-11 rounded-xl bg-[#09090c] hover:bg-[#131318] active:bg-neutral-800 border border-[#1b1b22] text-white font-mono text-lg sm:text-xl font-medium flex items-center justify-center active:scale-95 transition-all"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="h-10 sm:h-12 landscape:h-9 md:landscape:h-11 rounded-xl bg-[#09090c] hover:bg-[#131318] active:bg-neutral-800 border border-[#1b1b22] text-neutral-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
            title="Delete"
          >
            <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Remember device toggle */}
        <label className="flex items-center justify-center gap-2 cursor-pointer text-[10px] sm:text-[11px] font-mono text-neutral-400 hover:text-neutral-200 pt-0.5">
          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            className="w-3.5 h-3.5 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>Remember this device on this browser</span>
        </label>
      </div>
    </div>
  );
};
