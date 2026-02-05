import React, { useState } from 'react';

const Sparkline = ({ data, color, interactive = false }) => {
    const [hoverData, setHoverData] = useState(null);

    // Data must be array of { date, value }
    // If simple numbers passed, mapping will fail, so we handle safety in parent or here
    if (!data || data.length < 2) return null;

    // Handle both object format {date, value} and simple number format fallback
    const normalizedData = typeof data[0] === 'number' ? data.map((v, i) => ({ value: v, date: new Date().toISOString() })) : data;
    const values = normalizedData.map(d => d.value);

    // Prevent issues if all values are null or undefined
    if (values.every(v => v === undefined || v === null)) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Coordinate Helpers
    const getX = (idx) => (idx / (normalizedData.length - 1)) * 100;
    const getY = (val) => 100 - ((val - min) / range) * 80 - 10; // Reserve padding

    const points = values.map((val, idx) => `${getX(idx).toFixed(2)},${getY(val).toFixed(2)}`);
    const linePath = points.join(' ');
    const areaPath = `0,100 ${linePath} 100,100`;

    const handleMouseMove = (e) => {
        if (!interactive) return;
        const svgRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const relativeX = Math.max(0, Math.min(1, x / svgRect.width));

        const idx = Math.round(relativeX * (normalizedData.length - 1));
        setHoverData({
            ...normalizedData[idx],
            x: getX(idx),
            y: getY(values[idx])
        });
    };

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div
            className={`relative w-full h-full group ${interactive ? 'cursor-crosshair' : 'cursor-default'}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverData(null)}
        >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polyline points={areaPath} fill={`url(#${gradientId})`} stroke="none" />
                <polyline
                    points={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Hover Elements */}
                {hoverData && (
                    <>
                        <line
                            x1={hoverData.x} y1="0"
                            x2={hoverData.x} y2="100"
                            stroke="#6b7280"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            vectorEffect="non-scaling-stroke"
                        />
                        <circle
                            cx={hoverData.x} cy={hoverData.y}
                            r="4"
                            fill={color}
                            stroke="white"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />
                    </>
                )}
            </svg>

            {/* Tooltip */}
            {hoverData && (
                <div
                    className="absolute bottom-full mb-1 left-0 z-50 pointer-events-none transform -translate-x-1/2"
                    style={{ left: `${hoverData.x}%` }}
                >
                    <div className="bg-gray-900/90 backdrop-blur text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap border border-gray-700">
                        <div className="font-bold mb-0.5">
                            {new Date(hoverData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="font-mono text-base leading-none">${typeof hoverData.value === 'number' ? hoverData.value.toFixed(2) : hoverData.value}</div>
                    </div>
                    {/* Tiny triangle pointer */}
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-900/90 mx-auto"></div>
                </div>
            )}
        </div>
    );
};

export default Sparkline;
