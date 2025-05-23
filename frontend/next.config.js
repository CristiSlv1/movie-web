/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
        {
            protocol: 'https',
            hostname: 'upload.wikimedia.org',
        },
        {
            protocol: 'https',
            hostname: '**.wikimedia.org',
        },
        {
            protocol: 'https',
            hostname: 'm.media-amazon.com',
        },
        {
            protocol: 'https',
            hostname: 'loremflickr.com',
        },
        {
            protocol: 'https',
            hostname: '**.loremflickr.com',
        },
        {
            protocol: 'https',
            hostname: 'example.com',
            pathname: '/*',
        },
        ],
    },
};

module.exports = nextConfig;