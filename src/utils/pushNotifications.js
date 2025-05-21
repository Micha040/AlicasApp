import { supabase } from '../supabaseClient';

// Funktion zum Senden einer Push-Benachrichtigung
export const sendPushNotification = async (userId, title, message) => {
  try {
    // Push-Subscription des Empfängers aus der Datenbank holen
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      console.log('Keine Push-Subscription gefunden für User:', userId);
      return;
    }

    // Push-Benachrichtigung senden
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        payload: {
          title,
          message
        }
      })
    });

    if (!response.ok) {
      throw new Error('Fehler beim Senden der Push-Benachrichtigung');
    }
  } catch (error) {
    console.error('Fehler beim Senden der Push-Benachrichtigung:', error);
  }
}; 