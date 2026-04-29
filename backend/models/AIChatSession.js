const mongoose = require('mongoose');

const aiChatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    messages: [
        {
            role: {
                type: String,
                enum: ['user', 'ai'],
                required: true
            },
            content: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Limit the history to last 20 messages to keep context window manageable and database light
aiChatSessionSchema.pre('save', function(next) {
    if (this.messages.length > 20) {
        this.messages = this.messages.slice(-20);
    }
    this.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model('AIChatSession', aiChatSessionSchema);
