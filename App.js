import { StyleSheet, Text, View,Button } from 'react-native';
import * as Notifications from 'expo-notifications';
import React,{ useState,useEffect,useRef } from 'react';
import * as Permissions from "expo-permissions";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App(){
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "new chat",
    importance: Notifications.AndroidImportance.HIGH, //이것은 알람의 중요도를 설정합니다.
  });
}

const [expoPushToken, setExpoPushToken] = useState('');
const [notification, setNotification] = useState(false);
const notificationListener = useRef();
const responseListener = useRef();
useEffect(() => {
  // Permission for iOS
  Permissions.getAsync(Permissions.NOTIFICATIONS)
    .then(statusObj => {
      // Check if we already have permission
      if (statusObj.status !== "granted") {
        // If permission is not there, ask for the same
        return Permissions.askAsync(Permissions.NOTIFICATIONS)
      }
      return statusObj
    })
    .then(statusObj => {
      // If permission is still not given throw error
      if (statusObj.status !== "granted") {
        throw new Error("Permission not granted")
      }
    })
    .catch(err => {
      return null
    })
}, [])

useEffect(() => {
  registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

  notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    setNotification(notification);
  });

  responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    console.log(response);
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener.current);
    Notifications.removeNotificationSubscription(responseListener.current);
  };
}, []);

return (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-around',
    }}>
    <Text>Your expo push token: {expoPushToken}</Text>
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text>Title: {notification && notification.request.content.title} </Text>
      <Text>Body: {notification && notification.request.content.body}</Text>
      <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
    </View>
    <Button
      title="Press to schedule a notification"
      onPress={async () => {
        await schedulePushNotification();
      }}
    />
  </View>
);
}

async function schedulePushNotification() {
await Notifications.scheduleNotificationAsync({
  content: {
    title: "You've got mail! 📬",
    body: 'Here is the notification body',
    data: { data: 'goes here' },
  },
  trigger: { 
    seconds: 1,
    channelId:'default', 
  },
});
}

async function registerForPushNotificationsAsync() {
let token;

if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

if (Device.isDevice) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);
} else {
  alert('Must use physical device for Push Notifications');
}

return token;
}