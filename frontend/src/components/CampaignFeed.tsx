import React, { useState } from 'react';
import { Campaign } from '../stellar';
import { Award, Clock, Heart, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';

interface CampaignFeedProps {
  campaigns: Campaign[];
  onSelectCampaign: (id: number) => void;
}

export const CampaignFeed: React.FC<CampaignFeedProps> = ({ campaigns, onSelectCampaign }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Medical', 'Cancer Care', 'Disaster Relief'];

  const filteredCampaigns = selectedCategory === 'All'
    ? campaigns
    : campaigns.filter(c => c.category === selectedCategory);

  const calculateProgress = (c: Campaign) => {
    return Math.min(100, Math.round((c.total_raised / c.goal_amount) * 100));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs">Completed</span>;
      case 'PartiallyReleased':
        return <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">Partially Released</span>;
      case 'Refunded':
        return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs">Refunded</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">Active</span>;
    }
  };

  const formatTimeRemaining = (deadlineSecs: number) => {
    const remaining = deadlineSecs - (Date.now() / 1000);
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    if (days > 0) return `${days}d remaining`;
    
    const hours = Math.floor((remaining % 86400) / 3600);
    return `${hours}h remaining`;
  };

  return (
    <div>
      {/* Category Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full text-center py-12 glass-card border border-white/5">
            <Heart className="mx-auto h-12 w-12 text-gray-500 mb-3" />
            <p className="text-gray-400">No campaigns found in this category.</p>
          </div>
        ) : (
          filteredCampaigns.map(c => {
            const progress = calculateProgress(c);
            const totalMilestones = c.milestones.length;
            const releasedMilestones = c.milestones.filter(m => m.released).length;
            const provenMilestones = c.milestones.filter(m => m.proof_submitted).length;

            return (
              <div
                key={c.id}
                onClick={() => onSelectCampaign(c.id)}
                className="glass-card glass-card-hover p-6 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">{c.category}</span>
                    {getStatusBadge(c.status)}
                  </div>

                  <h3 className="text-lg font-bold font-outfit text-white group-hover:text-blue-400 transition-colors mb-2">
                    {c.title}
                  </h3>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Progress Section */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Raised <span className="text-white font-bold">{c.total_raised.toLocaleString()}</span> / {c.goal_amount.toLocaleString()} XLM</span>
                      <span className="text-blue-400 font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Milestones Snapshot */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-xl border border-white/5 mb-5 text-xs">
                    <div>
                      <p className="text-gray-400 mb-0.5">Milestone Proofs</p>
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <CheckCircle className="h-4 w-4 text-teal-400" />
                        <span>{provenMilestones} / {totalMilestones} Proven</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-0.5">Funds Released</p>
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <Award className="h-4 w-4 text-blue-400" />
                        <span>{releasedMilestones} / {totalMilestones} Released</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTimeRemaining(c.deadline)}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
