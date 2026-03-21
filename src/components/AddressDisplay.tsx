import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './Icons';

interface AddressDisplayProps {
  address: string;
  label?: string;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, label = "We Bring $UPLIFT as the currency for computation" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may not be available in all contexts
    }
  };

  return (
    <div className="text-primary p-3 bg-white/5 border border-white/10 rounded-lg inline-block max-w-full">
        <p className="text-xs text-muted font-mono mb-1">{label}</p>
        <div className="flex items-center gap-2">
            <p className="text-xs md:text-sm text-primary font-mono break-all select-all">
                {address}
            </p>
            <button 
                onClick={handleCopy}
                className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted hover:text-white cursor-pointer"
                aria-label="Copy address"
            >
                {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
            </button>
        </div>
    </div>
  );
};

export default AddressDisplay;
