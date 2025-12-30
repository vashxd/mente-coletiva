import React, { useEffect } from 'react';

function AdSpace() {
    useEffect(() => {
        // In production, this would load the actual AdSense script
        // For now, we simulate the "fill"
        try {
            if (window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error("AdSense Error", e);
        }
    }, []);

    if (import.meta.env.DEV) {
        return (
            <div className="w-full h-32 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 my-4 animate-pulse">
                <span className="font-bold">ADVERTISMENT PLACEHOLDER</span>
                <span className="text-xs">(Visible in Dev Mode)</span>
            </div>
        )
    }

    return (
        <div className="my-4 w-full flex justify-center overflow-hidden">
            {/* Replace with actual AdSense Ins tag */}
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot="XXXXXXXXXX"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
        </div>
    );
}

export default AdSpace;
