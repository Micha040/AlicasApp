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
    if (!pushEnabled) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
        });
        setPushEnabled(true);
      } catch (error) {
        console.error('Fehler beim Aktivieren der Push-Benachrichtigungen:', error);
      }
    } else {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
      } catch (error) {
        console.error('Fehler beim Deaktivieren der Push-Benachrichtigungen:', error);
      }
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