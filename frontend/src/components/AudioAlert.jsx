import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import socket, { connectSocket } from '../socket';

/**
 * Plays a notification tone using Web Audio API.
 * No external dependencies — generates a pleasant chime programmatically.
 */
const useNotificationSound = () => {
    const audioCtxRef = useRef(null);

    const playTone = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }

            const ctx = audioCtxRef.current;
            const now = ctx.currentTime;

            // Create a pleasant two-tone chime
            const playNote = (freq, startTime, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.3, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            // Two-note ascending chime
            playNote(880, now, 0.15);           // A5
            playNote(1174.66, now + 0.15, 0.2); // D6
        } catch (error) {
            console.warn('[AudioAlert] Failed to play notification tone:', error.message);
        }
    }, []);

    return playTone;
};

const AudioAlert = () => {
    const { user } = useAuth();
    const isMutedRef = useRef(localStorage.getItem('isMuted') === 'true');
    const playNotificationSound = useNotificationSound();

    useEffect(() => {
        const handleMuteChange = () => {
            isMutedRef.current = localStorage.getItem('isMuted') === 'true';
        };
        window.addEventListener('mute-change', handleMuteChange);
        return () => window.removeEventListener('mute-change', handleMuteChange);
    }, []);

    useEffect(() => {
        if (!user || !user.isApproved) return;

        connectSocket();
        socket.emit('join', { userId: user._id, role: user.role });

        const playAlert = () => {
            if (!isMutedRef.current) {
                playNotificationSound();
            }
        };

        const showBrowserNotification = (title, body) => {
            if (!('Notification' in window)) return;

            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/logo.svg' });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        };

        // NGO Listener
        if (user.role === 'ngo') {
            socket.on('new_rescue_alert', (data) => {
                playAlert();
                toast.success(`NEW RESCUE: ${data.description}`, { duration: 10000, icon: '🚨' });
                showBrowserNotification('New Rescue Request Nearby!', data.description);
                window.dispatchEvent(new Event('new-notification'));
            });
        }

        // Ambulance Listener
        if (user.role === 'ambulance') {
            socket.on('new_dispatch_alert', (data) => {
                playAlert();
                toast.error(`NEW DISPATCH: ${data.hospitalName} is requesting transport.`, { duration: 15000, icon: '🚑' });
                showBrowserNotification('New Ambulance Dispatch Request!', `${data.hospitalName} needs help with a ${data.description}`);
                window.dispatchEvent(new Event('new-notification'));
            });
        }

        return () => {
            socket.off('new_rescue_alert');
            socket.off('new_dispatch_alert');
        };
    }, [user, playNotificationSound]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // No DOM needed — audio is generated programmatically
    return null;
};

export default AudioAlert;
