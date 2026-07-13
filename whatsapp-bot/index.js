const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const mime = require('mime-types');

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Django Backend URL
const DJANGO_API_URL = 'http://127.0.0.1:8000/api/chatbot/whatsapp/';

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Bot is READY and listening!');
});

client.on('message', async (msg) => {
    try {
        console.log(`Received message from ${msg.from}`);

        // Check if message has media (e.g., Voice Note)
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();

            // We specifically want Audio / Voice Notes (ptt)
            if (media && (media.mimetype.includes('audio') || media.mimetype.includes('ogg'))) {
                console.log('Processing Voice Note...');

                // Use contact.id.user to get the real phone number instead of the @lid
                const contact = await msg.getContact();
                let phoneNumber = (contact.id && contact.id.user) || contact.number || msg.from.replace('@c.us', '').replace('@lid', '');


                // If it starts with 91 (India), we might strip it to match local DB format, 
                // but let's pass it raw and let Django handle normalization.

                try {
                    console.log('Sending audio to Django backend...');

                    const response = await axios.post(DJANGO_API_URL, {
                        phone: phoneNumber,
                        audio_base64: media.data,
                        mime_type: media.mimetype
                    });

                    if (response.data && response.data.reply_audio_base64) {
                        console.log('Received TTS reply from Django. Sending to user...');

                        // The t:t error often happens when sending base64 media directly. 
                        // Saving to a local file and using fromFilePath is much more stable.
                        console.log("Content-Type:", response.data.mime_type);
                        console.log("Audio length:", response.data.reply_audio_base64.length);
                        const { MessageMedia } = require('whatsapp-web.js');
                        const audioBuffer = Buffer.from(response.data.reply_audio_base64, 'base64');
                        
                        // Dynamically determine extension
                        const isOgg = response.data.mime_type === 'audio/ogg';
                        const ext = isOgg ? 'ogg' : 'mp3';
                        const tmpPath = `./temp_reply_${Date.now()}.${ext}`;
                        
                        require('fs').writeFileSync(tmpPath, audioBuffer);

                        const replyMedia = MessageMedia.fromFilePath(tmpPath);
                        
                        // WhatsApp requires .ogg Opus to render as a native voice note
                        await client.sendMessage(msg.from, replyMedia, { sendAudioAsVoice: isOgg });

                        // Cleanup
                        require('fs').unlinkSync(tmpPath);
                        console.log('Voice note sent successfully!');
                    } else if (response.data && response.data.reply_text) {
                        // Fallback to text if TTS fails
                        await client.sendMessage(msg.from, response.data.reply_text);
                    }

                } catch (apiError) {
                    console.error('Error from Django API or WhatsApp JS:', apiError);
                    await client.sendMessage(msg.from, 'Sorry, I am having trouble connecting to the medical server right now.');
                }
            } else {
                console.log('Media is not audio. Ignoring.');
                await client.sendMessage(msg.from, 'Please send a voice note.');
            }
        } else {
            // If they send text instead of Voice Note, we can just reply asking for voice, or process it.
            // Let's just process it as text for fallback.
            const contact = await msg.getContact();
            let phoneNumber = (contact.id && contact.id.user) || contact.number || msg.from.replace('@c.us', '').replace('@lid', '');
            try {
                const response = await axios.post(DJANGO_API_URL, {
                    phone: phoneNumber,
                    text: msg.body
                });

                if (response.data && response.data.reply_audio_base64) {
                    const { MessageMedia } = require('whatsapp-web.js');
                    const replyMedia = new MessageMedia('audio/wav', response.data.reply_audio_base64);
                    await client.sendMessage(msg.from, replyMedia, { sendAudioAsVoice: true });
                } else if (response.data && response.data.reply_text) {
                    await client.sendMessage(msg.from, response.data.reply_text);
                }
            } catch (err) {
                console.error(err.message);
            }
        }
    } catch (e) {
        console.error('General Error processing message:', e);
    }
});

client.initialize();
