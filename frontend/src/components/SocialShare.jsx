import { useMemo } from 'react';
import { ShareIcon, DocumentDuplicateIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const socialButtons = [
    {
        id: 'whatsapp',
        label: 'WhatsApp',
        bg: 'bg-green-500 hover:bg-green-600',
        icon: (
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .01 5.437.008 12.045c0 2.112.553 4.174 1.605 6.006L0 24l6.117-1.604a11.803 11.803 0 005.925 1.585h.005c6.605 0 12.039-5.438 12.041-12.047a11.823 11.823 0 00-3.576-8.523z" />
            </svg>
        )
    },
    {
        id: 'twitter',
        label: 'Twitter',
        bg: 'bg-slate-900 hover:bg-black',
        icon: (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        )
    },
    {
        id: 'facebook',
        label: 'Facebook',
        bg: 'bg-blue-600 hover:bg-blue-700',
        icon: (
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        )
    },
];

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        if (!src) {
            resolve(null);
            return;
        }
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });

const createPosterFile = async (rescue) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    const beforeImage = rescue?.images?.[0] || null;
    const afterImage = [...(rescue?.images || [])].reverse().find((image) => image && image !== beforeImage) || null;
    const [before, after] = await Promise.all([loadImage(beforeImage), loadImage(afterImage)]);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('VetsCue Rescue Story', 90, 130);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(rescue.location?.address || 'Shared via VetsCue', 90, 180);

    const drawPanel = (x, y, label, image) => {
        ctx.fillStyle = '#111827';
        ctx.fillRect(x, y, 420, 420);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(label, x, y - 20);
        if (image) {
            ctx.drawImage(image, x, y, 420, 420);
        } else {
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(x, y, 420, 420);
            ctx.fillStyle = '#e5e7eb';
            ctx.font = '22px sans-serif';
            ctx.fillText('No image available', x + 110, y + 220);
        }
    };

    drawPanel(90, 260, 'Before', before);
    drawPanel(570, 260, 'After', after);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(rescue.description.slice(0, 55), 90, 760);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Status: ${rescue.status.replaceAll('_', ' ')}`, 90, 820);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return new File([blob], `vetscue-${rescue._id}.png`, { type: 'image/png' });
};

const SocialShare = ({ rescue }) => {
    const shareUrl = window.location.href;
    const shareText = useMemo(() => [
        'Help VetsCue spread this rescue story.',
        `Case: ${rescue.description}`,
        `Status: ${rescue.status.replaceAll('_', ' ')}`,
        rescue.location?.address ? `Location: ${rescue.location.address}` : null,
        `Follow the journey: ${shareUrl}`,
    ].filter(Boolean).join('\n'), [rescue, shareUrl]);

    const handlePlatformShare = async (platform) => {
        const encodedText = encodeURIComponent(shareText);
        const shareUrls = {
            whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        };

        try {
            const file = await createPosterFile(rescue);
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: 'VetsCue Rescue Story',
                    text: shareText,
                    files: [file],
                    url: shareUrl,
                });
                return;
            }
        } catch (err) {
            console.warn('Native share failed or cancelled', err);
        }

        // Fallback to platform-specific link (text-only) if native share fails or isn't supported
        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
        }
    };

    const handleNativeShare = async () => {
        try {
            const file = await createPosterFile(rescue);
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: 'VetsCue Rescue Story',
                    text: shareText,
                    files: [file],
                    url: shareUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(shareText);
            toast.success('Share text copied. Native image sharing is not available on this device.');
        } catch (error) {
            toast.error('Unable to prepare story card.');
        }
    };

    const handleDownloadPoster = async () => {
        try {
            const file = await createPosterFile(rescue);
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Story card downloaded.');
        } catch (error) {
            toast.error('Unable to create story card.');
        }
    };

    return (
        <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-surface-border bg-surface shadow-2xl w-full">
            <div className="flex flex-col lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-8 p-6 md:p-10 lg:items-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-surface-hover border border-surface-border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
                        <ShareIcon className="h-4 w-4" />
                        Spread the Word
                    </div>
                    <div>
                        <h4 className="text-2xl font-headline font-bold text-on-surface">Share the journey</h4>
                        <p className="mt-2 text-sm text-on-surface/50 leading-relaxed max-w-sm">Native sharing attaches a beautiful story card image with automatically included case details.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {socialButtons.map((button) => (
                            <button 
                                key={button.id} 
                                onClick={() => handlePlatformShare(button.id)} 
                                title={button.label} 
                                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl transition-all hover:-translate-y-1 active:scale-95 ${button.bg}`}
                            >
                                {button.icon}
                            </button>
                        ))}
                        <button 
                            onClick={handleNativeShare} 
                            title="Native Share" 
                            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-background shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <ShareIcon className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={handleDownloadPoster} 
                            title="Download Poster" 
                            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-border bg-surface-hover text-on-surface shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2.5rem] border border-surface-border bg-background p-6 text-white shadow-2xl group w-full max-w-[320px] mx-auto lg:max-w-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-brand/70">
                            <span>VetsCue Official Story</span>
                            <span>{rescue.status.replaceAll('_', ' ')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 aspect-square max-h-[160px] md:max-h-[180px] w-full">
                            <div className="h-full w-full rounded-2xl overflow-hidden bg-surface-hover border border-surface-border">
                                {rescue.images?.[0] ? <img src={rescue.images[0]} alt="before" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-white/20">Before</div>}
                            </div>
                            <div className="h-full w-full rounded-2xl overflow-hidden bg-surface-hover border border-surface-border">
                                {[...(rescue.images || [])].reverse().find((image) => image && image !== rescue.images?.[0]) ? 
                                    <img src={[...(rescue.images || [])].reverse().find((image) => image && image !== rescue.images?.[0])} alt="after" className="h-full w-full object-cover" /> : 
                                    <div className="flex h-full items-center justify-center text-[10px] text-white/20">After</div>
                                }
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="line-clamp-1 text-sm font-bold text-on-surface">{rescue.description}</p>
                            <p className="line-clamp-1 text-[10px] text-white/20 uppercase tracking-widest">{rescue.location?.address || 'Verified Rescue'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialShare;
