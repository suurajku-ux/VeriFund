import React, { useEffect, useState } from 'react';
import { StellarService } from '../stellar';
import { Wallet, Network } from 'lucide-react';

interface WalletConnectProps {
  address: string;
  setAddress: (addr: string) => void;
  onRefresh: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ address, setAddress, onRefresh }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [balance, setBalance] = useState(0);

  const fetchRealBalance = async (addr: string) => {
    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${addr}`);
      if (res.ok) {
        const data = await res.json();
        const nativeBal = data.balances.find((b: any) => b.asset_type === 'native');
        if (nativeBal) {
          setBalance(Number(nativeBal.balance));
          return;
        }
      }
    } catch (e) {
      console.error("Error fetching Horizon account balance:", e);
    }
    setBalance(0);
  };

  useEffect(() => {
    StellarService.isFreighterInstalled().then(setIsInstalled);
    if (address) {
      fetchRealBalance(address);
    }
  }, [address]);

  const handleConnect = async () => {
    try {
      const addr = await StellarService.getWalletAddress();
      setAddress(addr);
      fetchRealBalance(addr);
      onRefresh();
    } catch (e) {
      alert('Could not connect wallet. Please ensure Freighter is unlocked and set to Testnet.');
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 glass-card border border-white/10 mb-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold font-outfit text-white">Wallet Connection</h2>
          {address ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-mono text-gray-400">{shortenAddress(address)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Connect Freighter wallet to contribute or manage campaigns</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Network status indicator */}
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-teal-600/15 text-teal-400 border-teal-500/30">
          <Network className="h-4 w-4" />
          Network: Stellar Testnet
        </span>

        {!address ? (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Connect Freighter
          </button>
        ) : (
          <button
            onClick={() => {
              setAddress('');
              setBalance(0);
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};
