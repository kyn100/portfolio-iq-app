import React from 'react';

const RecommendationBadge = ({ recommendation, confidence, score }) => {
  const getColors = () => {
    switch (recommendation) {
      case 'BUY':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'SELL':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getConfidenceIndicator = () => {
    switch (confidence) {
      case 'high':
        return '+++';
      case 'medium':
        return '++';
      default:
        return '+';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getColors()}`}>
      <span className="font-bold text-lg">{recommendation}</span>
      <span className="text-xs opacity-75">{getConfidenceIndicator()}</span>
      <span className="text-xs opacity-60">({score > 0 ? '+' : ''}{score})</span>
    </div>
  );
};

export default RecommendationBadge;
