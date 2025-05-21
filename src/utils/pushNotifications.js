import { supabase } from '../supabaseClient';

// Funktion zum Senden einer Push-Benachrichtigung
export const sendPushNotification = async (userId, title, message) => {
  try {
    console.log('[Push-DEBUG] Sende Push an userId:', userId);
    // Push-Subscription des Empfängers aus der Datenbank holen
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    console.log('[Push-DEBUG] Gefundene Subscription:', subscription, 'Fehler:', error);
    if (error || !subscription) {
      console.log('[Push-DEBUG] Keine Push-Subscription gefunden für User:', userId);
      return;
    }
    // Push-Benachrichtigung senden
    const payload = {
      subscription: subscription.subscription || subscription, // falls als jsonb gespeichert
      payload: {
        title,
        message
      }
    };
    console.log('[Push-DEBUG] Sende an /api/send-push:', payload);
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    console.log('[Push-DEBUG] Antwort von /api/send-push:', response.status, response.statusText);
    if (!response.ok) {
      throw new Error('Fehler beim Senden der Push-Benachrichtigung');
    }
  } catch (error) {
    console.error('[Push-DEBUG] Fehler beim Senden der Push-Benachrichtigung:', error);
  }
}; 