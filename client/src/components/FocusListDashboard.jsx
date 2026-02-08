import React from 'react';
import StockCard from './StockCard';
import AIWatchlistPanel from './AIWatchlistPanel';

const FocusListDashboard = ({ items, onRemove, onAdd, onAddClick, onTrade }) => {
    return (
        <>
            {/* Optional: Add AI suggestions for Focus List later? For now reusing AIWatchlistPanel might be confusing if it adds to Watchlist. 
          Maybe just keep it clean. */}

            {items.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-12 text-center">
                    <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Focus List is empty</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Add stocks you are monitoring for imminent trading setups.
                        Define target entry prices and stop losses to stay disciplined.
                    </p>
                    <button
                        onClick={onAddClick}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add to Focus List
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((stock) => (
                        <StockCard
                            key={stock.id}
                            stock={stock}
                            onRemove={onRemove}
                            onTrade={onTrade}
                            isFocusList={true}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default FocusListDashboard;
