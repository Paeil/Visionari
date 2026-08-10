import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
        // DIRECT HARDCODED SUPABASE KEYS TO BYPASS VERCEL ENV BUG
        const supabaseUrl = 'https://umkgmicbfwexdwlvixzt.supabase.co'; 
        const supabaseKey = 'sb_publishable_5w8hS718LQtqwghGHypppA_011Vn6LY';
        
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (!admin.apps.length) {
            const projectId = process.env.VITE_FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
            const clientEmail = process.env.VITE_FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
            let privateKey = process.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

            if (!projectId || !clientEmail || !privateKey) {
                throw new Error("Missing Firebase Admin environment variables on server.");
            }

            privateKey = privateKey.replace(/\\n/g, '\n');
            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        }

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
        console.error('CRITICAL PUSH ERROR:', error.message);
        return res.status(500).json({ error: error.message });
    }
}