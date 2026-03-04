import { ShareIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SocialShare = ({ rescue }) => {
    const shareUrl = window.location.href;
    const shareText = `🐾 Help ResQPet! Rescue Case: ${rescue.description}. Current Status: ${rescue.status.replace('_', ' ')}. Check it out here: ${shareUrl}`;

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
                            title: 'ResQPet Rescue Case',
                            text: shareText,
                            url: shareUrl,
                        });
                        toast.success('Shared successfully!');
                        return;
                    } catch (err) {
                        console.error('Error sharing:', err);
                    }
                }
                // Fallback: Copy to clipboard
                navigator.clipboard.writeText(shareText);
                toast.success('Link copied to clipboard!');
                return;
            default:
                return;
        }
        window.open(url, '_blank');
    };

    return (
        <div className="flex flex-col gap-3 mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-btn animate-fade-in">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2">
                <ShareIcon className="w-4 h-4" /> Spread the Word
            </h4>
            <p className="text-xs text-indigo-600">Share this rescue case to help get more support!</p>
            <div className="flex gap-2">
                <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold py-1.5 rounded shadow-sm transition-all"
                >
                    WhatsApp
                </button>
                <button
                    onClick={() => handleShare('twitter')}
                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold py-1.5 rounded shadow-sm transition-all"
                >
                    Twitter
                </button>
                <button
                    onClick={() => handleShare('facebook')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 rounded shadow-sm transition-all"
                >
                    Facebook
                </button>
                <button
                    onClick={() => handleShare('native')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded shadow-sm transition-all"
                    title="Share Link"
                >
                    <ShareIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SocialShare;
