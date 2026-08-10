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
        // Grab environment variables safely (checking multiple possible naming conventions)
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase environment variables on server.");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Initialize Firebase Admin if not already initialized
        if (!admin.apps.length) {
            const projectId = process.env.VITE_FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
            const clientEmail = process.env.VITE_FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
            let privateKey = process.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

            if (!projectId || !clientEmail || !privateKey) {
                throw new Error("Missing Firebase Admin environment variables on server.");
            }

            // Clean up private key formatting safely
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

        // Fetch tokens
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