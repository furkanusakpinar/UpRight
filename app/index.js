import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, useColorScheme, Alert } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import { Play, Square, Bell, Info, Settings, ShieldCheck, ShieldAlert } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Colors = {
  light: { text: '#1e293b', background: '#f8fafc', tint: '#6366f1', border: '#e2e8f0' },
  dark: { text: '#f8fafc', background: '#0f172a', tint: '#818cf8', border: '#334155' },
};

function PostureIndicator({ pitch, isGood }) {
  return (
    <View style={indicatorStyles.container}>
      <LinearGradient
        colors={isGood ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
        style={indicatorStyles.circle}
      >
        {isGood ? (
          <ShieldCheck size={60} color="#fff" strokeWidth={1.5} />
        ) : (
          <ShieldAlert size={60} color="#fff" strokeWidth={1.5} />
        )}
      </LinearGradient>
      <View style={indicatorStyles.statusBox}>
        <Text style={[indicatorStyles.statusText, { color: isGood ? '#10b981' : '#ef4444' }]}>
          {isGood ? 'DURUŞUN İYİ' : 'DİKLEŞMELİSİN'}
        </Text>
        <Text style={indicatorStyles.angleText}>
          Eğim: {(pitch * 90).toFixed(1)}°
        </Text>
      </View>
    </View>
  );
}

export default function PostureScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme || 'light'];
  const router = useRouter();
  
  const [subscription, setSubscription] = useState(null);
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [isActive, setIsActive] = useState(false);
  const [isGoodPosture, setIsGoodPosture] = useState(true);
  const [baselineY, setBaselineY] = useState(-0.8);
  const [highSensitivity, setHighSensitivity] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const lastNotificationTime = useRef(0);

  useEffect(() => {
    loadSettings();
  }, [isActive]);

  const loadSettings = async () => {
    const savedBaseline = await AsyncStorage.getItem('baselineY');
    const savedSensitivity = await AsyncStorage.getItem('highSensitivity');
    const savedNotifications = await AsyncStorage.getItem('notifications');
    
    if (savedBaseline) setBaselineY(parseFloat(savedBaseline));
    if (savedSensitivity) setHighSensitivity(savedSensitivity === 'true');
    if (savedNotifications) setNotificationsEnabled(savedNotifications !== 'false');
  };

  const _subscribe = () => {
    setSubscription(
      Accelerometer.addListener(accelerometerData => {
        setData(accelerometerData);
        const threshold = highSensitivity ? 0.12 : 0.25;
        const diff = Math.abs(accelerometerData.y - baselineY);
        const isGood = diff < threshold;
        setIsGoodPosture(isGood);
        if (!isGood && isActive && notificationsEnabled) {
          const now = Date.now();
          if (now - lastNotificationTime.current > 15000) {
            sendPostureNotification();
            lastNotificationTime.current = now;
          }
        }
      })
    );
    Accelerometer.setUpdateInterval(500);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  useEffect(() => {
    if (isActive) _subscribe();
    else _unsubscribe();
    return () => _unsubscribe();
  }, [isActive]);

  const toggleTracking = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Bildirim izni vermeniz gerekiyor!');
      return;
    }
    if (isActive) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Takip Aktif 🛡️",
          body: "Duruşunuz şu an takip ediliyor.",
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    }
    setIsActive(!isActive);
  };

  const sendPostureNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Dikleşme Zamanı! 🧘‍♂️",
        body: "Duruşun bozuldu, lütfen kendini düzelt.",
        sound: true,
        channelId: 'posture-alerts',
      },
      trigger: null,
    });
  };

  const calibrate = async () => {
    setBaselineY(data.y);
    await AsyncStorage.setItem('baselineY', data.y.toString());
    Alert.alert("Başarılı", "Duruşunuz kalibre edildi! Artık bu açı referans alınacak.");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: theme.text }]}>Dik Duruş</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Settings size={28} color={theme.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Sağlıklı bir omurga için yanındayız.</Text>
        </View>

        <PostureIndicator pitch={data.y} isGood={isGoodPosture} />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Info size={20} color={theme.tint} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Nasıl Kullanılır?</Text>
          </View>
          <Text style={styles.cardText}>
            Telefonunuzu dikey tutun. Uygulama, telefonun eğimini ölçerek duruşunuzu takip eder.
          </Text>
        </View>

        <TouchableOpacity 
          onPress={toggleTracking}
          style={[styles.mainButton, { backgroundColor: isActive ? '#ef4444' : theme.tint }]}
        >
          {isActive ? (
            <><Square size={24} color="#fff" fill="#fff" /><Text style={styles.buttonText}>Durdur</Text></>
          ) : (
            <><Play size={24} color="#fff" fill="#fff" /><Text style={styles.buttonText}>Başlat</Text></>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={calibrate}
          style={[styles.calibrateButton, { borderColor: theme.tint, borderWidth: 2 }]}
        >
          <Text style={[styles.calibrateText, { color: theme.tint }]}>Şu Anki Duruşumu Kalibre Et</Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Bell size={16} color="#94a3b8" />
          <Text style={styles.footerText}>Duruşun bozulduğunda seni uyaracağız.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const indicatorStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginVertical: 40 },
  circle: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', elevation: 15 },
  statusBox: { marginTop: 30, alignItems: 'center' },
  statusText: { fontSize: 24, fontWeight: '800' },
  angleText: { fontSize: 16, color: '#94a3b8', marginTop: 5 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, alignItems: 'center' },
  header: { width: '100%', marginTop: 20, marginBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
  card: { width: '100%', padding: 20, borderRadius: 24, backgroundColor: 'rgba(148, 163, 184, 0.1)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.2)', marginVertical: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardText: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  mainButton: { width: '100%', height: 65, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 8, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 30 },
  footerText: { color: '#94a3b8', fontSize: 13 },
  calibrateButton: { width: '100%', height: 55, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  calibrateText: { fontSize: 16, fontWeight: '700' },
});
