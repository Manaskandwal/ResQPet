import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    MapPinIcon, PhotoIcon, VideoCameraIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LocationPicker = ({ onPick }) => {
    useMapEvents({
        click(e) {
            console.log('[LocationPicker] Map clicked:', e.latlng);
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const SubmitRescue = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        description: '',
        lat: null,
        lng: null,
        address: '',
    });
    const [images, setImages] = useState([]); // up to 5
    const [video, setVideo] = useState(null); // 1 video
    const [previews, setPreviews] = useState([]);
    const [videoPrev, setVideoPrev] = useState(null);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const imgRef = useRef(null);
    const vidRef = useRef(null);

    // Auto-detect location on mount
    useEffect(() => {
        detectLocation();
    }, []);

    const detectLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported on this browser.'); return; }
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                console.log('[SubmitRescue] Geolocation obtained:', latitude, longitude);
                setForm((p) => ({ ...p, lat: latitude, lng: longitude }));
                setGeoLoading(false);
                toast.success('Location detected!');
            },
            (err) => {
                console.error('[SubmitRescue] Geolocation error:', err.message);
                toast.error('Could not detect location. Please pin it on the map.');
                setGeoLoading(false);
            },
            { timeout: 8000 }
        );
    };

    const handleImages = (e) => {
        try {
            const files = Array.from(e.target.files).slice(0, 5);
            if (files.length > 5) { toast.error('Maximum 5 images allowed.'); return; }
            setImages(files);
            setPreviews(files.map((f) => URL.createObjectURL(f)));
            console.log('[SubmitRescue] Images selected:', files.length);
        } catch (error) {
            console.error('[SubmitRescue] Image selection error:', error.message);
        }
    };

    const handleVideo = (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 200 * 1024 * 1024) { toast.error('Video max size is 200MB (~2 min).'); return; }
            setVideo(file);
            setVideoPrev(URL.createObjectURL(file));
            console.log('[SubmitRescue] Video selected:', file.name, `(${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        } catch (error) {
            console.error('[SubmitRescue] Video selection error:', error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.lat || !form.lng) { toast.error('Please select your location on the map or allow GPS access.'); return; }
        if (!form.description.trim()) { toast.error('Please provide a description.'); return; }

        setLoading(true);
        try {
            console.log('[SubmitRescue] Submitting rescue request...');
            const formData = new FormData();
            formData.append('description', form.description);
            formData.append('lat', form.lat);
            formData.append('lng', form.lng);
            formData.append('address', form.address);
            images.forEach((img) => formData.append('images', img));
            if (video) formData.append('video', video);

            const { data } = await api.post('/rescue', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Rescue request submitted! ₹20 deposit deducted. Help is on the way! 🐾');
            navigate('/user/dashboard');
            console.log('[SubmitRescue] Rescue created:', data.rescueRequest._id);
        } catch (error) {
            console.error('[SubmitRescue] Submission error:', error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || 'Failed to submit rescue request.');
        } finally {
            setLoading(false);
        }
    };

    const defaultCenter = form.lat ? [form.lat, form.lng] : [28.6139, 77.2090]; // Delhi fallback

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="btn-ghost p-2">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="page-title">Report an Animal</h1>
                    <p className="page-subtitle">A ₹20 deposit is required (refunded on completion)</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Description */}
                <div className="card">
                    <h3 className="font-semibold text-slate-800 mb-3">Describe the Situation</h3>
                    <textarea
                        className="textarea h-28"
                        placeholder="e.g. Injured dog on the road near XYZ market, unable to walk..."
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        required maxLength={1000}
                    />
                    <p className="text-[11px] text-surface-muted mt-1 text-right">{form.description.length}/1000</p>
                </div>

                {/* Location */}
                <div className="card">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-800">Location</h3>
                        <button type="button" onClick={detectLocation} disabled={geoLoading} className="btn-outline btn-sm">
                            <MapPinIcon className="w-4 h-4" />
                            {geoLoading ? 'Detecting...' : 'Use GPS'}
                        </button>
                    </div>
                    {form.lat && (
                        <p className="text-xs text-primary-600 font-medium mb-2">
                            📍 {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                        </p>
                    )}
                    <div className="h-56 rounded-btn overflow-hidden border border-surface-border">
                        <MapContainer
                            center={defaultCenter}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                            />
                            <LocationPicker onPick={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))} />
                            {form.lat && <Marker position={[form.lat, form.lng]} />}
                        </MapContainer>
                    </div>
                    <p className="text-[11px] text-surface-muted mt-1">Tap the map to pin the animal&apos;s exact location.</p>
                    <input
                        type="text" className="input mt-2 text-xs"
                        placeholder="Optional: Add a landmark or address description"
                        value={form.address}
                        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    />
                </div>

                {/* Media Upload */}
                <div className="card">
                    <h3 className="font-semibold text-slate-800 mb-3">Photos & Video</h3>

                    {/* Image upload */}
                    <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                    <button type="button" onClick={() => imgRef.current.click()}
                        className="btn-outline w-full mb-3">
                        <PhotoIcon className="w-4 h-4" />
                        Select Photos (up to 5)
                    </button>
                    {previews.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-3">
                            {previews.map((src, i) => (
                                <img key={i} src={src} alt={`preview-${i}`} className="w-20 h-20 object-cover rounded-btn border border-surface-border" />
                            ))}
                        </div>
                    )}

                    {/* Video upload */}
                    <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />
                    <button type="button" onClick={() => vidRef.current.click()}
                        className="btn-outline w-full">
                        <VideoCameraIcon className="w-4 h-4" />
                        {video ? `Video: ${video.name}` : 'Select Video (max 2 min / 200MB)'}
                    </button>
                    {videoPrev && (
                        <video src={videoPrev} controls className="w-full h-40 rounded-btn mt-2 border border-surface-border" />
                    )}
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="btn-accent w-full btn-lg">
                    {loading ? (
                        <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading & Submitting...</>
                    ) : '🐾 Submit Rescue Request'}
                </button>

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-btn text-xs text-amber-700 text-center">
                    ₹20 deposit will be deducted from your wallet and refunded when the rescue is completed.
                </div>
            </form>
        </div>
    );
};

export default SubmitRescue;
