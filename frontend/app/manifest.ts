import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Youva EdAi',
        short_name: 'Youva',
        description: 'AI-Native Education Ecosystem',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#F8F9FA',
        theme_color: '#1A73E8',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
