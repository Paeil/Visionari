import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
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
        // 1. Securely load Supabase (Reads straight from Vercel securely)
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase configuration in Vercel.");
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Securely Initialize Firebase Admin (Using modern getApps() check)
        if (getApps().length === 0) {
            const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_ADMIN_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.VITE_FIREBASE_ADMIN_CLIENT_EMAIL;
            let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.VITE_FIREBASE_ADMIN_PRIVATE_KEY;

            if (!projectId || !clientEmail || !privateKey) {
                throw new Error("Missing Firebase Admin keys in Vercel.");
            }

            // Clean the private key safely
            privateKey = privateKey.replace(/\\n/g, '\n');
            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
            }

            initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        }

        // 3. Fetch Tokens
        const { data: tokenRows, error: dbError } = await supabase
            .from('push_tokens')
            .select('token');

        if (dbError) throw dbError;

        if (!tokenRows || tokenRows.length === 0) {
            return res.status(200).json({ message: 'No registered devices to notify.' });
        }

        const tokens = tokenRows.map(row => row.token);

        // 4. Blast the Notification!
        const response = await getMessaging().sendEachForMulticast({
            notification: { title, body },
            tokens: tokens,
        });

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