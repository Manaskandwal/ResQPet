import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';

// Standard bell sound URL (fallback to a generated tone if needed)
const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const AudioAlert = () => {
    const { user } = useAuth();
    const audioRef = useRef(null);
    const isMutedRef = useRef(localStorage.getItem('isMuted') === 'true');

    useEffect(() => {
        const handleMuteChange = () => {
            isMutedRef.current = localStorage.getItem('isMuted') === 'true';
        };
        window.addEventListener('mute-change', handleMuteChange);
        return () => window.removeEventListener('mute-change', handleMuteChange);
    }, []);

    useEffect(() => {
        if (!user || !user.isApproved) return;

        if (!socket) return;

        socket.connect();
        socket.emit('join', { userId: user._id, role: user.role });

        const playAlert = () => {
            if (audioRef.current && !isMutedRef.current) {
                audioRef.current.play().catch(e => console.warn('[AudioAlert] Play blocked by browser:', e.message));
            }
        };

        const showBrowserNotification = (title, body) => {
            if (!("Notification" in window)) return;
            
            if (Notification.permission === "granted") {
                new Notification(title, { body, icon: '/logo.svg' });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        };

        // NGO Listener
        if (user.role === 'ngo') {
            socket.on('new_rescue_alert', (data) => {
                playAlert();
                toast.success(`NEW RESCUE: ${data.description}`, { duration: 10000, icon: '🚨' });
                showBrowserNotification("New Rescue Request Nearby!", data.description);
                window.dispatchEvent(new Event('new-notification'));
            });
        }

        // Ambulance Listener
        if (user.role === 'ambulance') {
            socket.on('new_dispatch_alert', (data) => {
                playAlert();
                toast.error(`NEW DISPATCH: ${data.hospitalName} is requesting transport.`, { duration: 15000, icon: '🚑' });
                showBrowserNotification("New Ambulance Dispatch Request!", `${data.hospitalName} needs help with a ${data.description}`);
                window.dispatchEvent(new Event('new-notification'));
            });
        }

        return () => {
            socket.off('new_rescue_alert');
            socket.off('new_dispatch_alert');
        };
    }, [user]);

    // Request notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    return (
        <audio ref={audioRef} src={ALERT_SOUND_URL} preload="auto" hidden />
    );
};

export default AudioAlert;
