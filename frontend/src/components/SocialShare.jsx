import { ShareIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const socialButtons = [
    {
        id: 'whatsapp',
        label: 'WhatsApp',
        bg: 'bg-green-500 hover:bg-green-600',
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12.03 0C5.4 0 .02 5.37.02 12c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.62A11.94 11.94 0 0 0 12.03 24h.01c6.62 0 11.99-5.38 11.99-12 0-3.2-1.25-6.21-3.51-8.52ZM12.04 21.9a9.9 9.9 0 0 1-5.03-1.37l-.36-.21-3.68.96.98-3.58-.24-.37a9.9 9.9 0 1 1 8.33 4.57Zm5.43-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.94 1.17-.17.2-.35.22-.65.08-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.51-1.8-1.68-2.1-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.66-1.6-.9-2.2-.24-.56-.48-.48-.66-.49h-.56c-.2 0-.5.08-.76.38-.27.3-1.03 1-1.03 2.43 0 1.42 1.05 2.8 1.19 2.99.15.2 2.06 3.15 5 4.41.7.3 1.25.47 1.67.6.7.22 1.33.19 1.83.11.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.31.18-1.43-.07-.12-.26-.2-.56-.35Z" />
            </svg>
        ),
    },
    {
        id: 'twitter',
        label: 'Twitter',
        bg: 'bg-sky-500 hover:bg-sky-600',
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.27l-4.9-6.4L6.43 22H3.32l7.24-8.27L.8 2h6.43l4.43 5.85L18.9 2Zm-1.1 18h1.73L6.3 3.9H4.45L17.8 20Z" />
            </svg>
        ),
    },
    {
        id: 'facebook',
        label: 'Facebook',
        bg: 'bg-blue-600 hover:bg-blue-700',
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.5h3.05V9.39c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.48 0-1.94.93-1.94 1.88v2.27h3.3l-.53 3.5h-2.77V24C19.61 23.09 24 18.1 24 12.07Z" />
            </svg>
        ),
    },
];

const getPosterVisual = (rescue) => ({
    title: rescue?.status === 'resolved_on_spot' ? 'Saved on the spot' : 'Recovery in progress',
    subtitle: rescue?.location?.address || 'Shared via ResQPet',
    image: rescue?.images?.[0] || null,
});

const SocialShare = ({ rescue }) => {
    const shareUrl = window.location.href;
    const poster = getPosterVisual(rescue);
    const shareText = [
        'Help ResQPet spread this rescue story.',
        `Case: ${rescue.description}`,
        `Status: ${rescue.status.replaceAll('_', ' ')}`,
        poster.subtitle ? `Location: ${poster.subtitle}` : null,
        `Follow the journey: ${shareUrl}`,
    ].filter(Boolean).join('\n');

    const handleShare = async (platform) => {
        let url = '';
        switch (platform) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                break;
            case 'whatsapp':
                url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'native':
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'ResQPet Rescue Story',
                            text: shareText,
                            url: shareUrl,
                        });
                        toast.success('Shared successfully.');
                        return;
                    } catch (err) {
                        console.error('Error sharing:', err);
                    }
                }
                await navigator.clipboard.writeText(shareText);
                toast.success('Share text copied.');
                return;
            case 'copy':
                await navigator.clipboard.writeText(shareText);
                toast.success('Share text copied.');
                return;
            default:
                return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="mt-5 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 shadow-sm">
            <div className="grid gap-5 p-5 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                        <ShareIcon className="h-4 w-4" />
                        Spread the Word
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-900">Share this rescue beautifully</h4>
                        <p className="mt-1 text-sm text-slate-600">
                            If no updated treatment image exists, the section uses a general rescue poster style so the share card still looks strong.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {socialButtons.map((button) => (
                            <button
                                key={button.id}
                                onClick={() => handleShare(button.id)}
                                title={button.label}
                                className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 ${button.bg}`}
                            >
                                {button.icon}
                            </button>
                        ))}
                        <button
                            onClick={() => handleShare('native')}
                            title="More options"
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5"
                        >
                            <ShareIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => handleShare('copy')}
                            title="Copy text"
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                        >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-slate-900 p-4 text-white shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.45),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.35),_transparent_34%)]" />
                    <div className="relative">
                        <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
                            <span>ResQPet Story</span>
                            <span>{poster.title}</span>
                        </div>
                        {poster.image ? (
                            <img src={poster.image} alt="Rescue poster" className="mb-3 h-36 w-full rounded-[18px] object-cover" />
                        ) : (
                            <div className="mb-3 flex h-36 w-full items-center justify-center rounded-[18px] border border-white/10 bg-white/10 text-center">
                                <div>
                                    <p className="text-4xl">🐾</p>
                                    <p className="mt-2 text-sm font-semibold">General rescue poster</p>
                                    <p className="text-xs text-slate-300">Used when no updated photo is available</p>
                                </div>
                            </div>
                        )}
                        <p className="line-clamp-2 text-sm font-semibold">{rescue.description}</p>
                        <p className="mt-1 text-xs text-slate-300">{poster.subtitle}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialShare;
