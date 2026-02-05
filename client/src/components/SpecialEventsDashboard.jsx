import React from 'react';

const SpecialEventsDashboard = () => {
    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 rounded-xl shadow-lg border border-indigo-700 p-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
                        <span className="text-3xl">🌟</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Special Events Tracker</h2>
                        <p className="text-indigo-200">Monitoring high-impact scheduled and unscheduled market catalysts</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Special Events</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Our AI is currently monitoring global news feeds for significant special events (e.g., Summit Meetings, Elections, Central Bank Announcements).
                    <br /><br />
                    Check back soon for updates.
                </p>
            </div>
        </div>
    );
};

export default SpecialEventsDashboard;
