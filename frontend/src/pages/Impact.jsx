import { useEffect, useState } from 'react';
import { ChatBubbleLeftRightIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { formatIndianDateTime } from '../utils/dateTime';

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
        return <p className="text-sm text-slate-500">Loading impact feed...</p>;
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
                    <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                        No completed rescue stories are available yet.
                    </div>
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
                                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        {item.helperName}
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[22px] border border-rose-100 bg-rose-50 p-3">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Before</p>
                                        {item.beforeImage ? (
                                            <img src={item.beforeImage} alt="Before" className="h-56 w-full rounded-[18px] object-cover" />
                                        ) : (
                                            <div className="flex h-56 items-center justify-center rounded-[18px] bg-white text-sm text-slate-500">No image uploaded.</div>
                                        )}
                                    </div>
                                    <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 p-3">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">After</p>
                                        {item.afterImage ? (
                                            <img src={item.afterImage} alt="After" className="h-56 w-full rounded-[18px] object-cover" />
                                        ) : (
                                            <div className="flex h-56 items-center justify-center rounded-[18px] bg-white text-center text-sm text-slate-500">No after-treatment media yet.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col rounded-[24px] bg-slate-50 p-5">
                                <p className="text-sm text-slate-600">{item.afterSummary}</p>
                                <div className="mt-5 flex items-center gap-3">
                                    <button
                                        onClick={() => handleLike(item._id)}
                                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${item.liked ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-700'}`}
                                    >
                                        {item.liked ? <HeartSolidIcon className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
                                        {item.likesCount}
                                    </button>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                        {item.commentsCount}
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
                                    <input
                                        type="text"
                                        value={commentDrafts[item._id] || ''}
                                        onChange={(e) => setCommentDrafts((current) => ({ ...current, [item._id]: e.target.value }))}
                                        className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-300 focus:outline-none"
                                        placeholder="Write a supportive comment"
                                    />
                                    <button
                                        onClick={() => handleComment(item._id)}
                                        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                                    >
                                        Post
                                    </button>
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
