import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize Firebase Admin SDK (preventing multiple initializations)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.VITE_FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.VITE_FIREBASE_ADMIN_CLIENT_EMAIL,
            // Format the private key to handle newline characters properly
            privateKey: process.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY
                ? process.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
                : undefined,
        }),
    });
}

// 3. The Serverless Function Handler
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
        // Fetch all push tokens from Supabase
        const { data: tokenRows, error: dbError } = await supabase
            .from('push_tokens')
            .select('token');

        if (dbError) throw dbError;

        if (!tokenRows || tokenRows.length === 0) {
            return res.status(200).json({ message: 'No registered devices to notify.' });
        }

        // Extract raw token strings into an array
        const tokens = tokenRows.map(row => row.token);

        // Construct the multicast push message
        const message = {
            notification: {
                title: title,
                body: body,
            },
            tokens: tokens, // Sends to all tokens at once!
        };

        // Send notification via Firebase
        const response = await admin.messaging().sendEachForMulticast(message);

        return res.status(200).json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return res.status(500).json({ error: error.message });
    }
}