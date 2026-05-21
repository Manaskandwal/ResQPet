const Notification = require('../models/Notification');
const User = require('../models/User');

const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

const sendPush = async (tokens, payload) => {
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey || !Array.isArray(tokens) || tokens.length === 0) return;

    try {
        await fetch(FCM_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `key=${serverKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                registration_ids: tokens,
                notification: {
                    title: payload.title,
                    body: payload.message,
                },
                data: {
                    type: payload.type || 'system',
                    rescueRequest: payload.rescueRequest ? String(payload.rescueRequest) : '',
                    transaction: payload.transaction ? String(payload.transaction) : '',
                },
            }),
        });
    } catch (error) {
        console.error('[Notification Service] FCM send failed:', error.message);
    }
};

const notifyUsers = async (recipients, payload) => {
    const recipientIds = [...new Set((Array.isArray(recipients) ? recipients : [recipients]).filter(Boolean).map(String))];
    if (recipientIds.length === 0) return [];

    const docs = recipientIds.map((recipient) => ({
        recipient,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'system',
        rescueRequest: payload.rescueRequest || null,
        transaction: payload.transaction || null,
    }));

    const notifications = await Notification.insertMany(docs, { ordered: false });
    const users = await User.find({ _id: { $in: recipientIds } }).select('pushTokens');
    const tokens = users.flatMap((user) => (user.pushTokens || []).map((entry) => entry.token).filter(Boolean));
    await sendPush(tokens, payload);

    return notifications;
};

module.exports = { notifyUsers, sendPush };
