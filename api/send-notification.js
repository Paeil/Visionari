import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase Client (supporting both VITE_ and standard env names)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const privateKey = process.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.VITE_FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.VITE_FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined,
        }),
    });
}

// 3. The Serverless Function Handler
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
        const { data: tokenRows, error: dbError } = await supabase
            .from('push_tokens')
            .select('token');

        if (dbError) throw dbError;

        if (!tokenRows || tokenRows.length === 0) {
            return res.status(200).json({ message: 'No registered devices to notify.' });
        }

        const tokens = tokenRows.map(row => row.token);

        const message = {
            notification: { title, body },
            tokens: tokens,
        };

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