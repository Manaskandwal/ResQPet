/** Generic loading skeleton components */

export const SkeletonCard = () => (
    <div className="card animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
        <div className="h-3 bg-slate-200 rounded w-full mb-2" />
        <div className="h-3 bg-slate-200 rounded w-5/6" />
    </div>
);

export const SkeletonRow = () => (
    <div className="flex items-center gap-4 p-4 animate-pulse">
        <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-2 bg-slate-200 rounded w-3/4" />
        </div>
        <div className="h-6 w-16 bg-slate-200 rounded-full" />
    </div>
);

export const SkeletonStatCard = () => (
    <div className="stat-card animate-pulse">
        <div className="w-10 h-10 bg-slate-200 rounded-btn mb-3" />
        <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
    </div>
);
