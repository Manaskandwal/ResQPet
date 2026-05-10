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
    const previewUrlsRef = useRef(new Set());
    const [form, setForm] = useState({
        description: '',
        lat: null,
        lng: null,
        address: '',
        animalType: 'dog',
        animalTypeOther: '',
        willingToPay: false,
        willingToGo: false,
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

            const preview = URL.createObjectURL(file);
            previewUrlsRef.current.add(preview);

            nextItems.push({
                id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
                file,
                kind,
                preview,
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
        setMediaItems((current) => {
            const item = current.find((i) => i.id === id);
            if (item?.preview) {
                URL.revokeObjectURL(item.preview);
                previewUrlsRef.current.delete(item.preview);
            }
            return current.filter((item) => item.id !== id);
        });
    };

    // Cleanup all ObjectURLs on unmount
    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
            previewUrlsRef.current.clear();
        };
    }, []);

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
            formData.append('willingToPay', form.willingToPay);
            formData.append('willingToGo', form.willingToGo);
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
            <div className="resqpet-obsidian-theme w-full space-y-12 pb-20" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
                {/* Header Section */}
                <section className="space-y-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 transition-colors group"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Mission</span>
                    </button>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--accent-primary)' }}>Rescue Emergency</span>
                        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight">Report <span style={{ color: 'var(--primary-dim)' }}>Animal Emergency</span></h1>
                        <p className="max-w-lg" style={{ color: 'var(--text-muted)' }}>A nominal service charge of <span style={{ color: 'var(--primary-dim)', fontWeight: 'bold' }}>Rs 30</span> applies for coordination and logistics.</p>
                    </div>
                </section>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Details & Description */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Animal Type Selection */}
                        <div className="glass-card rounded-[2.5rem] border p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)', color: 'var(--primary-dim)' }}>
                                    <span className="material-symbols-outlined">pets</span>
                                </div>
                                <h3 className="font-headline text-xl font-bold" style={{ color: 'var(--text-on-surface)' }}>Who needs help?</h3>
                            </div>

                            <div className="space-y-2 px-2">
                                <label className="text-[10px] font-black uppercase tracking-widest block mb-4" style={{ color: 'var(--text-muted)' }}>Animal Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {animalOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm(c => ({ ...c, animalType: opt.value }))}
                                            className={`h-16 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                                                form.animalType === opt.value 
                                                ? 'shadow-[0_0_20px_rgba(118,214,213,0.3)]' 
                                                : 'hover:border-white/10'
                                            }`}
                                            style={form.animalType === opt.value 
                                                ? { backgroundColor: 'var(--primary-dim)', borderColor: 'var(--primary-dim)', color: 'var(--on-surface-inverse)' }
                                                : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }
                                            }
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {form.animalType === 'other' && (
                                <div className="mt-6 p-6 rounded-3xl border space-y-4 animate-slide-up" style={{ backgroundColor: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.2)' }}>
                                    <p className="text-xs font-bold leading-relaxed uppercase tracking-wide" style={{ color: '#f97316' }}>
                                        Limited Support Notice: We currently prioritize dogs and cats. We will attempt coordination for other species if possible.
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="What kind of animal? (e.g. Cow, Bird)"
                                        className="w-full h-14 rounded-2xl border px-6 font-bold focus:ring-2 outline-none"
                                        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-surface)', color: 'var(--text-on-surface)' }}
                                        value={form.animalTypeOther}
                                        onChange={(e) => setForm(c => ({ ...c, animalTypeOther: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="space-y-2 px-2 pt-4">
                                <label className="text-[10px] font-black uppercase tracking-widest block mb-4" style={{ color: 'var(--text-muted)' }}>What's the situation?</label>
                                <textarea
                                    className="w-full h-40 rounded-3xl border p-8 font-bold outline-none resize-none transition-all"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--text-on-surface)' }}
                                    placeholder="Tell us about the animal's condition or injuries..."
                                    value={form.description}
                                    onChange={(e) => setForm(c => ({ ...c, description: e.target.value }))}
                                    required
                                />
                                <div className="flex justify-end pr-4 mt-2">
                                    <span className="text-[10px] font-black font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{form.description.length}/1000 characters</span>
                                </div>
                            </div>
                        </div>

                        {/* Media Upload Section */}
                        <div className="glass-card rounded-[2.5rem] border p-8 space-y-8">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                                        <CameraIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-headline text-xl font-bold" style={{ color: 'var(--text-on-surface)' }}>Photos & Videos</h3>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                    {mediaItems.length} / 6 FILES
                                </div>
                             </div>

                             <input ref={galleryRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaPick} />
                             <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={handleMediaPick} />

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button type="button" onClick={() => galleryRef.current?.click()} className="h-20 rounded-2xl border flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-bold group" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                    <PhotoIcon className="w-6 h-6 group-hover:text-[#76d6d5]" style={{ color: 'var(--text-muted)' }} />
                                    Choose from Gallery
                                </button>
                                <button type="button" onClick={() => cameraRef.current?.click()} className="h-20 rounded-2xl border flex items-center justify-center gap-3 hover:opacity-80 transition-all font-bold group" style={{ borderColor: 'rgba(118,214,213,0.2)', backgroundColor: 'rgba(118,214,213,0.05)', color: 'var(--primary-dim)' }}>
                                    <CameraIcon className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ filter: 'drop-shadow(0 0 8px rgba(118,214,213,0.3))' }} />
                                    Take a Photo
                                </button>
                             </div>

                             {mediaItems.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                                    {mediaItems.map(item => (
                                        <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden border group" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                            {item.kind === 'video' ? (
                                                <video src={item.preview} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={item.preview} alt="Upload" className="w-full h-full object-cover" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                                <button type="button" onClick={() => handleRemoveMedia(item.id)} className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.6)' }}>
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
                        <div className="glass-card rounded-[2.5rem] border p-8 space-y-8 sticky top-32">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: '#fb7185' }}>
                                            <MapPinIcon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-headline text-xl font-bold" style={{ color: 'var(--text-on-surface)' }}>Where is the animal?</h3>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => detectLocation(false)} 
                                        disabled={geoLoading}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        style={geoLoading 
                                            ? { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }
                                            : { backgroundColor: 'rgba(118,214,213,0.1)', color: 'var(--primary-dim)', cursor: 'pointer' }
                                        }
                                    >
                                        {geoLoading ? 'Finding you...' : 'Check again'}
                                    </button>
                                </div>

                                <div className="h-64 rounded-3xl border overflow-hidden relative shadow-2xl" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
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
                                                <div className="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(118,214,213,1)]" style={{ backgroundColor: 'var(--primary-dim)', border: '2px solid var(--bg-surface)' }} />
                                            </Marker>
                                        )}
                                    </MapContainer>
                                    <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                                        <div className="px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--primary-dim)' }}>
                                            Tap the map to mark exactly where the animal is
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest block ml-2" style={{ color: 'var(--text-muted)' }}>Nearby landmark</label>
                                        <input
                                            type="text"
                                            className="w-full h-14 rounded-2xl border px-6 font-bold outline-none transition-all"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--text-on-surface)' }}
                                            placeholder="Near the tea stall, second floor, shop name, etc."
                                            value={form.address}
                                            onChange={(e) => setForm(c => ({ ...c, address: e.target.value }))}
                                        />
                                    </div>

                                    {form.lat && (
                                        <div className="flex items-center gap-4 px-4 py-3 rounded-2xl border" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--primary-dim)' }}>Location Marked</div>
                                            <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                                                {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-surface)' }}>
                                <label className="flex items-start gap-4 p-4 rounded-2xl border cursor-pointer group" style={{ backgroundColor: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.2)' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={form.willingToPay}
                                        onChange={(e) => setForm(c => ({ ...c, willingToPay: e.target.checked }))}
                                        className="mt-1 w-5 h-5 rounded"
                                        style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-surface)', color: '#f97316' }}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="text-sm font-bold transition-colors" style={{ color: 'var(--text-on-surface)' }}>I can cover hospital costs</div>
                                        <div className="text-[10px] font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                            If no free NGO can take the case, checking this allows us to immediately send a private ambulance and admit to a paid hospital at your expense.
                                        </div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-4 p-4 rounded-2xl border cursor-pointer group" style={{ backgroundColor: 'rgba(118,214,213,0.05)', borderColor: 'rgba(118,214,213,0.2)' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={form.willingToGo}
                                        onChange={(e) => setForm(c => ({ ...c, willingToGo: e.target.checked }))}
                                        className="mt-1 w-5 h-5 rounded"
                                        style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-surface)', color: 'var(--primary-dim)' }}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="text-sm font-bold transition-colors" style={{ color: 'var(--text-on-surface)' }}>I can escort the animal</div>
                                        <div className="text-[10px] font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                            If an ambulance is dispatched but no NGO agent is available to coordinate, checking this indicates you will travel in the ambulance with the animal.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-surface)' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-20 rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--primary-dim)', color: 'var(--on-surface-inverse)', boxShadow: '0 20px 40px -10px rgba(118,214,213,0.3)' }}
                                >
                                    {loading ? 'Sending Request...' : 'Request Help Now'}
                                </button>
                                <p className="text-center text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                    Your request is being sent securely
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
                                    {Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)}
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

                        <div className="card animate-fade-in space-y-4 bg-slate-50 border-slate-200">
                            <h3 className="font-semibold text-slate-800">Coordination & Costs Fallback</h3>
                            <p className="text-xs text-surface-muted mb-4">In case free NGO assistance is not immediately available, let us know your preferences:</p>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={form.willingToPay}
                                    onChange={(e) => setForm(c => ({ ...c, willingToPay: e.target.checked }))}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-700">I am willing to cover paid hospital and ambulance changes</span>
                                    <p className="text-xs text-slate-500">Allows us to dispatch a private service if NGOs decline.</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={form.willingToGo}
                                    onChange={(e) => setForm(c => ({ ...c, willingToGo: e.target.checked }))}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-700">I am available to travel to the hospital with the animal</span>
                                    <p className="text-xs text-slate-500">If no NGO is available, someone must be present to accompany the animal in the ambulance.</p>
                                </div>
                            </label>
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
