import { useMemo } from 'react';
import { ShareIcon, DocumentDuplicateIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const socialButtons = [
    { id: 'whatsapp', label: 'WhatsApp', bg: 'bg-green-500 hover:bg-green-600' },
    { id: 'twitter', label: 'Twitter', bg: 'bg-sky-500 hover:bg-sky-600' },
    { id: 'facebook', label: 'Facebook', bg: 'bg-blue-600 hover:bg-blue-700' },
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
    ctx.fillText('ResQPet Rescue Story', 90, 130);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(rescue.location?.address || 'Shared via ResQPet', 90, 180);

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
    return new File([blob], `resqpet-${rescue._id}.png`, { type: 'image/png' });
};

const SocialShare = ({ rescue }) => {
    const shareUrl = window.location.href;
    const shareText = useMemo(() => [
        'Help ResQPet spread this rescue story.',
        `Case: ${rescue.description}`,
        `Status: ${rescue.status.replaceAll('_', ' ')}`,
        rescue.location?.address ? `Location: ${rescue.location.address}` : null,
        `Follow the journey: ${shareUrl}`,
    ].filter(Boolean).join('\n'), [rescue, shareUrl]);

    const handlePlatformShare = async (platform) => {
        const encodedText = encodeURIComponent(shareText);
        if (platform === 'whatsapp') window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener,noreferrer');
        if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank', 'noopener,noreferrer');
        if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
    };

    const handleNativeShare = async () => {
        try {
            const file = await createPosterFile(rescue);
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: 'ResQPet Rescue Story',
                    text: shareText,
                    files: [file],
                    url: shareUrl,
                });
                toast.success('Story card shared.');
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
        } catch (error) {
            toast.error('Unable to create story card.');
        }
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
                        <p className="mt-1 text-sm text-slate-600">Native share now sends a generated story card image with before/after panels when the device supports file sharing.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {socialButtons.map((button) => (
                            <button key={button.id} onClick={() => handlePlatformShare(button.id)} title={button.label} className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 ${button.bg}`}>
                                {button.label[0]}
                            </button>
                        ))}
                        <button onClick={handleNativeShare} title="Share story card" className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5">
                            <ShareIcon className="h-5 w-5" />
                        </button>
                        <button onClick={handleDownloadPoster} title="Download story card" className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5">
                            <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => navigator.clipboard.writeText(shareText).then(() => toast.success('Share text copied.'))} title="Copy text" className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5">
                            <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-slate-900 p-4 text-white shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.45),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.35),_transparent_34%)]" />
                    <div className="relative">
                        <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
                            <span>ResQPet Story</span>
                            <span>{rescue.outcome === 'on_spot_treated' ? 'On-spot recovery' : 'Recovery in progress'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {rescue.images?.[0] ? <img src={rescue.images[0]} alt="before" className="h-36 w-full rounded-[18px] object-cover" /> : <div className="flex h-36 items-center justify-center rounded-[18px] bg-white/10 text-xs">Before</div>}
                            {[...(rescue.images || [])].reverse().find((image) => image && image !== rescue.images?.[0]) ? <img src={[...(rescue.images || [])].reverse().find((image) => image && image !== rescue.images?.[0])} alt="after" className="h-36 w-full rounded-[18px] object-cover" /> : <div className="flex h-36 items-center justify-center rounded-[18px] bg-white/10 text-xs">After</div>}
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm font-semibold">{rescue.description}</p>
                        <p className="mt-1 text-xs text-slate-300">{rescue.location?.address || 'Shared via ResQPet'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialShare;
