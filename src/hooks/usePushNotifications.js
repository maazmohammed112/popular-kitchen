import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export const usePushNotifications = () => {
  const { currentUser } = useAuth();
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    // Only run if we are in a native app context (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      console.log('Not running on native platform, skipping push notifications setup.');
      return;
    }

    const registerPush = async () => {
      try {
        // Request permission to use push notifications
        // iOS will prompt user and return if they granted permission or not
        // Android will just grant without prompting
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('User denied push notification permissions');
          return;
        }

        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          setFcmToken(token.value);
          
          // Save the token to the user's profile in Firestore if logged in
          if (currentUser) {
            try {
              await updateDoc(doc(db, 'users', currentUser.uid), {
                fcmToken: token.value,
                fcmTokenUpdatedAt: new Date().toISOString()
              });
              console.log('FCM Token saved to user profile.');
            } catch (err) {
              console.error('Error saving FCM token:', err);
            }
          }
        });

        // Some issue with our setup and push will not work
        PushNotifications.addListener('registrationError', (error) => {
          console.log('Error on registration: ' + JSON.stringify(error));
        });

        // Show us the notification payload if the app is open on our device
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ' + JSON.stringify(notification));
          // You could show a toast here if you wanted, or update a local state
        });

        // Method called when tapping on a notification
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ' + JSON.stringify(notification));
        });

      } catch (error) {
        console.error('Error during push notification setup:', error);
      }
    };

    registerPush();

    // Cleanup listeners on unmount
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [currentUser]);

  return { fcmToken };
};
