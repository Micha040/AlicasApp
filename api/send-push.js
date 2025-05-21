const webpush = require('web-push');

// VAPID-Keys aus der Umgebung laden
webpush.setVapidDetails(
  'mailto:mkroeger.hh@gmail.com',
  process.env.REACT_APP_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { subscription, payload } = req.body;

    // Push-Benachrichtigung senden
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    res.status(200).json({ message: 'Push notification sent' });
  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ message: 'Error sending push notification' });
  }
} 