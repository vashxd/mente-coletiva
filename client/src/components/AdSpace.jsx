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
            {/* 
                IMPORTANT: Replace 'XXXXXXXXXX' with your actual AdSense Data Ad Slot ID. 
                You can find this ID when you create a new Ad Unit in your AdSense account.
            */}
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-6191818565281230"
                data-ad-slot="7077366978"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
        </div>
    );
}

export default AdSpace;
