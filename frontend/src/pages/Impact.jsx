import { useEffect, useState } from 'react';
import { ChatBubbleLeftRightIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { formatIndianDateTime } from '../utils/dateTime';

const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

const Impact = () => {
    const [feed, setFeed] = useState([]);
    const [commentDrafts, setCommentDrafts] = useState({});
    const [loading, setLoading] = useState(true);

    const loadFeed = async () => {
        try {
            const { data } = await api.get('/rescue/impact/feed');
            setFeed(data.feed || []);
        } catch (error) {
            toast.error('Failed to load impact feed.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeed();
    }, []);

    const handleLike = async (id) => {
        try {
            const { data } = await api.post(`/rescue/${id}/impact/like`);
            setFeed((current) => current.map((item) => item._id === id ? {
                ...item,
                liked: data.liked,
                likesCount: data.likesCount,
            } : item));
        } catch (error) {
            toast.error('Failed to update like.');
        }
    };

    const handleComment = async (id) => {
        const message = (commentDrafts[id] || '').trim();
        if (!message) return;

        try {
            const { data } = await api.post(`/rescue/${id}/impact/comment`, { message });
            setFeed((current) => current.map((item) => item._id === id ? {
                ...item,
                comments: data.comments,
                commentsCount: data.commentsCount,
            } : item));
            setCommentDrafts((current) => ({ ...current, [id]: '' }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add comment.');
        }
    };

    if (loading) {
        if (isNewUI) return <div className="resqpet-obsidian-theme space-y-4">{[1,2].map(i => <div key={i} className="h-64 rounded-[2rem] bg-white/5 animate-pulse" />)}</div>;
        return <p className="text-sm text-slate-500">Loading impact feed...</p>;
    }

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-10">
                <section className="space-y-2">
                    <span className="text-[#76d6d5] text-[10px] font-black uppercase tracking-[0.3em]">Community Impact</span>
                    <h1 className="font-headline text-4xl font-extrabold tracking-tight">Successful <span className="text-[#76d6d5]">Rescues</span></h1>
                    <p className="text-[#e5e2e1]/50 max-w-xl">This feed highlights completed rescue stories, before-and-after progress, and community reactions.</p>
                </section>

                <div className="space-y-8">
                    {feed.length === 0 ? (
                        <div className="glass-card rounded-[3rem] border border-dashed border-white/5 p-16 text-center space-y-4">
                            <span className="material-symbols-outlined text-5xl text-white/10">volunteer_activism</span>
                            <p className="text-xs font-black uppercase tracking-widest text-white/20">No completed rescue stories yet.</p>
                        </div>
                    ) : feed.map((item) => (
                        <div key={item._id} className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] overflow-hidden">
                            <div className="grid gap-8 p-6 md:p-10 grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]">{item.status.replaceAll('_', ' ')}</span>
                                        <h2 className="font-headline text-2xl font-bold text-[#e5e2e1] leading-tight">{item.description}</h2>
                                        <p className="text-xs text-[#e5e2e1]/40">Completed {item.completedAt ? formatIndianDateTime(item.completedAt) : formatIndianDateTime(item.createdAt)}</p>
                                    </div>
                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                        <div className="rounded-[1.5rem] border border-red-500/10 bg-red-500/5 p-4 space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Before</p>
                                            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white/5">
                                                {item.beforeImage ? <img src={item.beforeImage} alt="Before" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-white/20">No image uploaded.</div>}
                                            </div>
                                        </div>
                                        <div className="rounded-[1.5rem] border border-[#76d6d5]/10 bg-[#76d6d5]/5 p-4 space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5]">After</p>
                                            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white/5">
                                                {item.afterImage ? <img src={item.afterImage} alt="After" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-center text-sm text-white/20">No media yet.</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col rounded-[2rem] bg-white/5 border border-white/5 p-5 md:p-8 space-y-6 min-w-0">
                                    <p className="text-sm text-[#e5e2e1]/60 leading-relaxed italic">"{item.afterSummary}"</p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button onClick={() => handleLike(item._id)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${item.liked ? 'bg-red-500/20 text-red-400 border border-red-400/20' : 'bg-white/5 border border-white/5 text-[#e5e2e1]/50 hover:text-red-400'}`}>
                                            {item.liked ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
                                            {item.likesCount}
                                        </button>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/5 px-4 py-2 text-sm font-bold text-[#e5e2e1]/50">
                                            <ChatBubbleLeftRightIcon className="h-4 w-4" />{item.commentsCount}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#76d6d5] md:ml-auto">{item.helperName}</span>
                                    </div>
                                    
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {(item.comments || []).length === 0 ? (
                                            <p className="text-center py-4 text-[10px] font-black uppercase tracking-widest text-white/10">No messages yet</p>
                                        ) : (
                                            item.comments.map((comment, idx) => (
                                                <div key={`${comment.createdAt}-${idx}`} className="rounded-2xl bg-white/5 p-4 border border-white/5">
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <p className="text-[10px] font-bold text-[#76d6d5] uppercase tracking-wider">{comment.name || 'Guardian'}</p>
                                                        <p className="text-[9px] text-white/20 font-medium">{formatIndianDateTime(comment.createdAt)}</p>
                                                    </div>
                                                    <p className="text-xs text-[#e5e2e1]/70 leading-relaxed">{comment.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    
                                    <div className="pt-4 border-t border-white/5">
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={commentDrafts[item._id] || ''} 
                                                onChange={(e) => setCommentDrafts((cur) => ({ ...cur, [item._id]: e.target.value }))} 
                                                onKeyDown={(e) => e.key === 'Enter' && handleComment(item._id)}
                                                className="flex-1 rounded-2xl bg-white/5 border border-white/5 px-4 py-3 text-sm text-[#e5e2e1] outline-none focus:border-[#76d6d5]/30 focus:ring-2 focus:ring-[#76d6d5]/10 transition-all placeholder:text-white/10" 
                                                placeholder="Write a supportive comment..." 
                                            />
                                            <button 
                                                onClick={() => handleComment(item._id)} 
                                                className="rounded-2xl bg-[#76d6d5] text-[#131313] px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,1),rgba(251,191,36,0.16))] p-7 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Impact</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">Successful rescues and their journeys</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">This feed highlights completed rescue stories, before-and-after progress, and community reactions.</p>
            </div>

            <div className="grid gap-6">
                {feed.length === 0 ? (
                    <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">No completed rescue stories are available yet.</div>
                ) : feed.map((item) => (
                    <div key={item._id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr]">
                            <div>
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{item.status.replaceAll('_', ' ')}</p>
                                        <h2 className="mt-2 text-xl font-bold text-slate-900">{item.description}</h2>
                                        <p className="mt-1 text-sm text-slate-500">Completed {item.completedAt ? formatIndianDateTime(item.completedAt) : formatIndianDateTime(item.createdAt)}</p>
                                    </div>
                                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.helperName}</div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[22px] border border-rose-100 bg-rose-50 p-3">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Before</p>
                                        {item.beforeImage ? <img src={item.beforeImage} alt="Before" className="h-56 w-full rounded-[18px] object-cover" /> : <div className="flex h-56 items-center justify-center rounded-[18px] bg-white text-sm text-slate-500">No image uploaded.</div>}
                                    </div>
                                    <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 p-3">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">After</p>
                                        {item.afterImage ? <img src={item.afterImage} alt="After" className="h-56 w-full rounded-[18px] object-cover" /> : <div className="flex h-56 items-center justify-center rounded-[18px] bg-white text-center text-sm text-slate-500">No after-treatment media yet.</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col rounded-[24px] bg-slate-50 p-5">
                                <p className="text-sm text-slate-600">{item.afterSummary}</p>
                                <div className="mt-5 flex items-center gap-3">
                                    <button onClick={() => handleLike(item._id)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${item.liked ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-700'}`}>
                                        {item.liked ? <HeartSolidIcon className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
                                        {item.likesCount}
                                    </button>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                                        <ChatBubbleLeftRightIcon className="h-5 w-5" />{item.commentsCount}
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3">
                                    {(item.comments || []).map((comment, index) => (
                                        <div key={`${comment.createdAt}-${index}`} className="rounded-2xl bg-white p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-semibold text-slate-800">{comment.name || 'Supporter'}</p>
                                                <p className="text-[11px] text-slate-400">{formatIndianDateTime(comment.createdAt)}</p>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600">{comment.message}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <input type="text" value={commentDrafts[item._id] || ''} onChange={(e) => setCommentDrafts((cur) => ({ ...cur, [item._id]: e.target.value }))} className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none" placeholder="Write a supportive comment" />
                                    <button onClick={() => handleComment(item._id)} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Post</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Impact;
