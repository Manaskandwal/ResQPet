import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import {
    MapPinIcon,
    CameraIcon,
    PhotoIcon,
    ArrowLeftIcon,
    TrashIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import api from '../../api/axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MAX_IMAGES = 5;
const MAX_VIDEO = 1;

const animalOptions = [
    { value: 'dog', label: 'Dog' },
    { value: 'cat', label: 'Cat' },
    { value: 'other', label: 'Not in list?' },
];

const LocationPicker = ({ onPick }) => {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const SubmitRescue = () => {
    const navigate = useNavigate();
    const galleryRef = useRef(null);
    const cameraRef = useRef(null);
    const hasDetected = useRef(false);
    const [form, setForm] = useState({
        description: '',
        lat: null,
        lng: null,
        address: '',
        animalType: 'dog',
        animalTypeOther: '',
    });
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);

    useEffect(() => {
        if (!hasDetected.current) {
            detectLocation(false);
            hasDetected.current = true;
        }
    }, []);

    const detectLocation = (silent = false) => {
        if (!navigator.geolocation) {
            if (!silent) toast.error('Geolocation is not supported on this browser.');
            return;
        }
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm((current) => ({ ...current, lat: pos.coords.latitude, lng: pos.coords.longitude }));
                setGeoLoading(false);
                if (!silent) toast.success('Location detected.');
            },
            () => {
                if (!silent) toast.error('Could not detect location. Please pin it on the map.');
                setGeoLoading(false);
            },
            { timeout: 8000 }
        );
    };

    const appendMedia = (files) => {
        const currentImages = mediaItems.filter((item) => item.kind === 'image').length;
        const currentVideo = mediaItems.filter((item) => item.kind === 'video').length;

        let imageCount = currentImages;
        let videoCount = currentVideo;
        const nextItems = [];

        files.forEach((file) => {
            const kind = file.type.startsWith('video/') ? 'video' : 'image';
            if (kind === 'video') {
                if (videoCount >= MAX_VIDEO) return;
                if (file.size > 200 * 1024 * 1024) return;
                videoCount += 1;
            } else {
                if (imageCount >= MAX_IMAGES) return;
                imageCount += 1;
            }

            nextItems.push({
                id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
                file,
                kind,
                preview: URL.createObjectURL(file),
            });
        });

        if (nextItems.length === 0) {
            toast.error('Upload limit reached. Keep up to 5 images and 1 video.');
            return;
        }

        setMediaItems((current) => [...current, ...nextItems]);
    };

    const handleMediaPick = (event) => {
        const files = Array.from(event.target.files || []);
        appendMedia(files);
        event.target.value = '';
    };

    const handleRemoveMedia = (id) => {
        setMediaItems((current) => current.filter((item) => item.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.lat || !form.lng) {
            toast.error('Please select your location on the map or allow GPS access.');
            return;
        }
        if (!form.description.trim()) {
            toast.error('Please provide a description.');
            return;
        }
        if (form.animalType === 'other' && !form.animalTypeOther.trim()) {
            toast.error('Please tell us which animal this is.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('description', form.description);
            formData.append('animalType', form.animalType);
            formData.append('animalTypeOther', form.animalTypeOther);
            formData.append('lat', form.lat);
            formData.append('lng', form.lng);
            formData.append('address', form.address);
            mediaItems.forEach((item) => formData.append('media', item.file));

            await api.post('/rescue', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Rescue request submitted. Rs 30 small service fee charged from your wallet.');
            navigate('/user/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit rescue request.');
        } finally {
            setLoading(false);
        }
    };

    const defaultCenter = form.lat ? [form.lat, form.lng] : [28.6139, 77.209];

    const isNewUI = import.meta.env.VITE_UI_DESIGN === 'new';

    if (isNewUI) {
        return (
            <div className="resqpet-obsidian-theme w-full text-[#e5e2e1] space-y-12 pb-20">
                {/* Header Section */}
                <section className="space-y-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-[#e5e2e1]/40 hover:text-[#76d6d5] transition-colors group"
                    >
                        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Mission</span>
                    </button>
                    <div className="space-y-2">
                        <span className="text-[#fd8b00] text-[10px] font-black uppercase tracking-[0.3em]">Guardian Dispatch</span>
                        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">Report <span className="text-[#76d6d5]">Animal Emergency</span></h1>
                        <p className="text-[#e5e2e1]/50 max-w-lg">A nominal service charge of <span className="text-[#76d6d5] font-bold">Rs 30</span> applies for coordination and logistics.</p>
                    </div>
                </section>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Details & Description */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Animal Type Selection */}
                        <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b]/50 p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-[#76d6d5]/10 flex items-center justify-center text-[#76d6d5]">
                                    <span className="material-symbols-outlined">pets</span>
                                </div>
                                <h3 className="font-headline text-xl font-bold">Nature of the Mission</h3>
                            </div>

                            <div className="space-y-2 px-2">
                                <label className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-widest block mb-4">Subject Species</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {animalOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm(c => ({ ...c, animalType: opt.value }))}
                                            className={`h-16 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                                                form.animalType === opt.value 
                                                ? 'bg-[#76d6d5] border-[#76d6d5] text-[#131313] shadow-[0_0_20px_rgba(118,214,213,0.3)]' 
                                                : 'bg-white/5 border-white/5 text-[#e5e2e1]/40 hover:border-white/10'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {form.animalType === 'other' && (
                                <div className="mt-6 p-6 rounded-3xl bg-[#fd8b00]/5 border border-[#fd8b00]/20 space-y-4 animate-slide-up">
                                    <p className="text-xs text-[#fd8b00] font-bold leading-relaxed uppercase tracking-wide">
                                        Limited Support Notice: We currently prioritize dogs and cats. We will attempt coordination for other species if possible.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Specify Species (e.g. Winged, Bovine)"
                                        className="w-full h-14 rounded-2xl bg-[#131313] border border-white/5 px-6 font-bold text-[#e5e2e1] focus:ring-2 focus:ring-[#fd8b00]/20 outline-none"
                                        value={form.animalTypeOther}
                                        onChange={(e) => setForm(c => ({ ...c, animalTypeOther: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="space-y-2 px-2 pt-4">
                                <label className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-widest block mb-4">Tactical Description</label>
                                <textarea
                                    className="w-full h-40 rounded-3xl bg-white/5 border border-white/5 p-8 font-bold text-[#e5e2e1] focus:ring-2 focus:ring-[#76d6d5]/20 outline-none resize-none transition-all"
                                    placeholder="Describe the condition, injuries, or status of the subject..."
                                    value={form.description}
                                    onChange={(e) => setForm(c => ({ ...c, description: e.target.value }))}
                                    required
                                />
                                <div className="flex justify-end pr-4 mt-2">
                                    <span className="text-[10px] font-black font-mono text-[#e5e2e1]/20 uppercase tracking-widest">{form.description.length}/1000 UNits</span>
                                </div>
                            </div>
                        </div>

                        {/* Media Upload Section */}
                        <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b]/50 p-8 space-y-8">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <CameraIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-headline text-xl font-bold">Visual Evidence</h3>
                                </div>
                                <div className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-[0.2em]">
                                    {mediaItems.length} / 6 FILES
                                </div>
                             </div>

                             <input ref={galleryRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaPick} />
                             <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={handleMediaPick} />

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button type="button" onClick={() => galleryRef.current?.click()} className="h-20 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-bold group">
                                    <PhotoIcon className="w-6 h-6 text-[#e5e2e1]/40 group-hover:text-[#76d6d5]" />
                                    Upload from Array
                                </button>
                                <button type="button" onClick={() => cameraRef.current?.click()} className="h-20 rounded-2xl border border-[#76d6d5]/20 bg-[#76d6d5]/5 flex items-center justify-center gap-3 hover:bg-[#76d6d5]/10 transition-all font-bold text-[#76d6d5] group">
                                    <CameraIcon className="w-6 h-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(118,214,213,0.3)]" />
                                    Active Cam Intel
                                </button>
                             </div>

                             {mediaItems.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                                    {mediaItems.map(item => (
                                        <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                                            {item.kind === 'video' ? (
                                                <video src={item.preview} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={item.preview} alt="Upload" className="w-full h-full object-cover" />
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button type="button" onClick={() => handleRemoveMedia(item.id)} className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/40 text-[8px] font-black uppercase tracking-widest text-white/60">
                                                {item.kind}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Right Column: Mission Control & Location */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="glass-card rounded-[2.5rem] border border-white/5 bg-[#1c1b1b] p-8 space-y-8 sticky top-32">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                            <MapPinIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-headline text-xl font-bold">Location Sync</h3>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => detectLocation(false)} 
                                        disabled={geoLoading}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            geoLoading ? 'bg-white/5 text-white/20' : 'bg-[#76d6d5]/10 text-[#76d6d5] hover:bg-[#76d6d5]/20'
                                        }`}
                                    >
                                        {geoLoading ? 'Syncing GPS...' : 'Re-Detect'}
                                    </button>
                                </div>

                                <div className="h-64 rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
                                    <MapContainer 
                                        center={defaultCenter} 
                                        zoom={15} 
                                        style={{ height: '100%', width: '100%' }}
                                        key={form.lat || 'default'}
                                    >
                                        <TileLayer 
                                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                                            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' 
                                        />
                                        <LocationPicker onPick={(lat, lng) => setForm(c => ({ ...c, lat, lng }))} />
                                        {form.lat && (
                                            <Marker position={[form.lat, form.lng]}>
                                                <div className="w-4 h-4 rounded-full bg-[#76d6d5] shadow-[0_0_15px_rgba(118,214,213,1)] border-2 border-[#131313]" />
                                            </Marker>
                                        )}
                                    </MapContainer>
                                    <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-[#76d6d5]">
                                            Tap to Pin Precise Location
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#e5e2e1]/30 uppercase tracking-widest block ml-2">Landmark Note</label>
                                        <input
                                            type="text"
                                            className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 px-6 font-bold text-[#e5e2e1] focus:ring-2 focus:ring-[#76d6d5]/20 outline-none transition-all placeholder:text-white/10"
                                            placeholder="Floor, shop name, or landmark nearby..."
                                            value={form.address}
                                            onChange={(e) => setForm(c => ({ ...c, address: e.target.value }))}
                                        />
                                    </div>

                                    {form.lat && (
                                        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="text-[10px] font-black text-[#76d6d5] uppercase tracking-widest">Target Locked</div>
                                            <div className="text-[10px] font-mono text-[#e5e2e1]/40">
                                                {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-20 bg-[#76d6d5] text-[#131313] rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(118,214,213,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Transmitting Data...' : 'Dispatch Rescue Service'}
                                </button>
                                <p className="text-center text-[9px] font-black text-[#e5e2e1]/20 uppercase tracking-widest">
                                    Encrypted Payload Transmission Secure
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="flex items-center gap-3">
                <div>
                    <h1 className="page-title">Report an Animal</h1>
                    <p className="page-subtitle">Rs 30 small service fee. Refunded only if no treatment/transport work starts.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="card space-y-4">
                    <div>
                        <h3 className="mb-3 font-semibold text-slate-800">Animal Details</h3>
                        <label className="label">Which animal is this?</label>
                        <div className="relative">
                            <select
                                className="input appearance-none bg-white pr-10 border border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500/20"
                                value={form.animalType}
                                onChange={(e) => setForm((current) => ({ ...current, animalType: e.target.value }))}
                            >
                                {animalOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                                <ChevronDownIcon className="h-5 w-5" />
                            </div>
                        </div>

                        {form.animalType === 'other' && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
                                    <p className="font-bold mb-1">We are sorry!</p>
                                    Currently, we only support Dogs and Cats for emergency rescue coordination. Please tell us which animal this is, and we will try to include it in our next phase.
                                </div>
                                <div>
                                    <label className="label">Specify Animal Type</label>
                                    <input
                                        type="text"
                                        className="input bg-white border border-slate-300 shadow-sm py-3 text-base focus:border-primary-500 focus:ring-primary-500/20"
                                        placeholder="e.g. Cow, Bird, Monkey"
                                        value={form.animalTypeOther}
                                        onChange={(e) => setForm((current) => ({ ...current, animalTypeOther: e.target.value }))}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !form.animalTypeOther.trim()}
                                    className="btn-accent w-full py-3.5 text-base font-bold shadow-lg"
                                >
                                    {loading ? 'Submitting...' : 'Submit Request for this Animal'}
                                </button>
                            </div>
                        )}
                    </div>

                    {form.animalType !== 'other' && (
                        <div className="animate-fade-in space-y-4">
                            <h3 className="mb-3 font-semibold text-slate-800">Describe the Situation</h3>
                            <textarea
                                className="textarea h-28 bg-white border border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500/20"
                                placeholder="e.g. Injured dog on the road near XYZ market, unable to walk..."
                                value={form.description}
                                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                                required
                                maxLength={1000}
                            />
                            <p className="mt-1 text-right text-[11px] text-surface-muted">{form.description.length}/1000</p>
                        </div>
                    )}
                </div>

                {form.animalType !== 'other' && (
                    <>
                        <div className="card animate-fade-in">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-800">Location</h3>
                                <button type="button" onClick={() => detectLocation(false)} disabled={geoLoading} className="btn-outline btn-sm">
                                    <MapPinIcon className="h-4 w-4" />
                                    {geoLoading ? 'Detecting...' : 'Use GPS'}
                                </button>
                            </div>
                            {form.lat && (
                                <p className="mb-2 text-xs font-medium text-primary-600">
                                    {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                                </p>
                            )}
                            <div className="h-56 overflow-hidden rounded-btn border border-surface-border">
                                <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' />
                                    <LocationPicker onPick={(lat, lng) => setForm((current) => ({ ...current, lat, lng }))} />
                                    {form.lat && <Marker position={[form.lat, form.lng]} />}
                                </MapContainer>
                            </div>
                            <p className="mt-1 text-[11px] text-surface-muted">Tap the map to pin the animal&apos;s exact location.</p>
                            <input
                                type="text"
                                className="input mt-2 text-xs bg-white border border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500/20"
                                placeholder="Optional: add a landmark or address description"
                                value={form.address}
                                onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                            />
                        </div>

                        <div className="card animate-fade-in">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800">Photos or Video</h3>
                                    <p className="text-xs text-surface-muted">Upload up to 5 images and 1 video. New files are appended until the limit is reached.</p>
                                </div>
                                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {mediaItems.filter((item) => item.kind === 'image').length}/{MAX_IMAGES} images, {mediaItems.filter((item) => item.kind === 'video').length}/{MAX_VIDEO} video
                                </div>
                            </div>

                            <input ref={galleryRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaPick} />
                            <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={handleMediaPick} />

                            <div className="grid gap-3 sm:grid-cols-2">
                                <button type="button" onClick={() => galleryRef.current?.click()} className="flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
                                    <PhotoIcon className="h-5 w-5" />
                                    Select Media
                                </button>
                                <button type="button" onClick={() => cameraRef.current?.click()} className="flex items-center justify-center gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                                    <CameraIcon className="h-5 w-5" />
                                    Open Camera / Record Now
                                </button>
                            </div>

                            {mediaItems.length > 0 && (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {mediaItems.map((item) => (
                                        <div key={item.id} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                                            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                                                <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.kind}</p>
                                                <button type="button" onClick={() => handleRemoveMedia(item.id)} className="rounded-full p-1 text-rose-500 hover:bg-rose-50">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="p-3">
                                                {item.kind === 'video' ? (
                                                    <video src={item.preview} controls className="h-48 w-full rounded-[16px] object-cover" />
                                                ) : (
                                                    <img src={item.preview} alt={item.file.name} className="h-48 w-full rounded-[16px] object-cover" />
                                                )}
                                                <p className="mt-2 truncate text-xs text-slate-500">{item.file.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="btn-accent btn-lg w-full">
                            {loading ? 'Uploading and submitting...' : 'Submit Rescue Request'}
                        </button>

                        <div className="rounded-btn border border-amber-100 bg-amber-50 p-3 text-center text-xs text-amber-700">
                            Rs 30 is a small service fee. It will be refunded only if the rescue cannot proceed before any NGO visit or transport work starts.
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default SubmitRescue;
