// src/components/NetworkStatusBannerWrapper.tsx
"use client";

import dynamic from "next/dynamic";

const NetworkStatusBanner = dynamic(
    () => import("./NetworkStatusBanner"),
    {
        ssr: false,
        loading: () => null // Optional: Add a loading state if needed
    }
);

export default function NetworkStatusBannerWrapper() {
    return <NetworkStatusBanner />;
}