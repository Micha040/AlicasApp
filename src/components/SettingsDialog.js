import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import urlBase64ToUint8Array from '../utils/urlBase64ToUint8Array';
import { supabase } from '../supabaseClient';

export default function SettingsDialog({ 
  open, 
  onClose, 
  user,
  themeSetting,
  setThemeSetting,
  languageSetting,
  setLanguageSetting,
  pushEnabled,
  setPushEnabled
}) {
  const { t, i18n } = useTranslation();

  const handleThemeChange = (event) => {
    setThemeSetting(event.target.value);
  };

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    setLanguageSetting(newLang);
    i18n.changeLanguage(newLang);
  };

  const handlePushToggle = async () => {
    console.log('[Push-DEBUG] ===== PUSH TOGGLE START =====');
    console.log('[Push-DEBUG] User:', user);
    console.log('[Push-DEBUG] User Agent:', navigator.userAgent);

    if (!('serviceWorker' in navigator)) {
      console.error('[Push-DEBUG] Service Worker wird nicht unterstützt');
      alert(t('ServiceWorkerNichtUnterstuetzt'));
      return;
    }

    if (!('PushManager' in window)) {
      console.error('[Push-DEBUG] Push API wird nicht unterstützt');
      alert(t('PushAPINichtUnterstuetzt'));
      return;
    }

    try {
      // Service Worker registrieren
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[Push-DEBUG] Service Worker registriert:', registration);

      // Warten bis der Service Worker aktiv ist
      await navigator.serviceWorker.ready;
      console.log('[Push-DEBUG] Service Worker ready');

      if (!pushEnabled) {
        console.log('[Push-DEBUG] Push wird aktiviert');
        console.log('[Push-DEBUG] User ID:', user.id);
        
        const applicationServerKey = urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY);
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        console.log('[Push-DEBUG] Neue Subscription:', subscription);
        const subscriptionJson = subscription.toJSON();
        
        // Subscription in Supabase speichern
        const subscriptionData = {
          user_id: user.id,
          subscription: subscriptionJson,
          created_at: new Date().toISOString()
        };
        
        console.log('[Push-DEBUG] Versuche Supabase Insert mit Daten:', subscriptionData);
        
        const { data, error } = await supabase
          .from('push_subscriptions')
          .upsert(subscriptionData)
          .select();

        if (error) {
          console.error('[Push-DEBUG] Fehler beim Speichern in Supabase:', error);
          throw error;
        }

        console.log('[Push-DEBUG] Supabase Antwort:', data);
        console.log('[Push-DEBUG] ===== PUSH TOGGLE ENDE =====');
        
        setPushEnabled(true);
        alert(t('PushBenachrichtigungenAktiviert'));
      } else {
        // Push-Subscription deaktivieren
        console.log('[Push-DEBUG] Push wird deaktiviert');
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          
          const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id);

          if (error) {
            console.error('[Push-DEBUG] Fehler beim Löschen in Supabase:', error);
            throw error;
          }

          setPushEnabled(false);
          alert(t('PushBenachrichtigungenDeaktiviert'));
        }
      }
    } catch (error) {
      console.error('[Push-DEBUG] Fehler beim Umschalten der Push-Subscription:', error);
      alert('Fehler beim Aktivieren/Deaktivieren der Push-Benachrichtigungen: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Einstellungen')}</DialogTitle>
      <DialogContent>
        <List>
          <ListItem>
            <ListItemText 
              primary={t('Design')} 
              secondary={t('Wähle zwischen hell und dunkel')}
            />
            <ListItemSecondaryAction>
              <FormControl variant="outlined" size="small">
                <Select
                  value={themeSetting}
                  onChange={handleThemeChange}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="light">{t('Hell')}</MenuItem>
                  <MenuItem value="dark">{t('Dunkel')}</MenuItem>
                  <MenuItem value="system">{t('System')}</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText 
              primary={t('Sprache')} 
              secondary={t('Wähle deine bevorzugte Sprache')}
            />
            <ListItemSecondaryAction>
              <FormControl variant="outlined" size="small">
                <Select
                  value={languageSetting}
                  onChange={handleLanguageChange}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText 
              primary={t('Push-Benachrichtigungen')} 
              secondary={t('Erhalte Benachrichtigungen für neue Nachrichten')}
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={pushEnabled}
                onChange={handlePushToggle}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Schließen')}</Button>
      </DialogActions>
    </Dialog>
  );
} 