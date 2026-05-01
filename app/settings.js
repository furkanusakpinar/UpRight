import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, SafeAreaView, ScrollView, useColorScheme } from 'react-native';
import { Bell, Shield, Info, ChevronRight, Moon, User, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const Colors = {
  light: { text: '#1e293b', background: '#f8fafc', tint: '#6366f1', border: '#e2e8f0' },
  dark: { text: '#f8fafc', background: '#0f172a', tint: '#818cf8', border: '#334155' },
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme || 'light'];
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [highSensitivity, setHighSensitivity] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const n = await AsyncStorage.getItem('notifications');
    const s = await AsyncStorage.getItem('highSensitivity');
    if (n !== null) setNotifications(n === 'true');
    if (s !== null) setHighSensitivity(s === 'true');
  };

  const saveSetting = async (key, value) => {
    await AsyncStorage.setItem(key, value.toString());
  };

  const SettingItem = ({ icon: Icon, title, value, onValueChange, type = 'switch' }) => (
    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.tint + '20' }]}>
          <Icon size={20} color={theme.tint} />
        </View>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {type === 'switch' ? (
        <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#334155', true: theme.tint }} thumbColor="#fff" />
      ) : (
        <ChevronRight size={20} color="#64748b" />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Ayarlar</Text>
          <TouchableOpacity onPress={() => router.back()}><X size={28} color={theme.text} /></TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BİLDİRİMLER</Text>
          <SettingItem 
            icon={Bell} 
            title="Uyarı Bildirimleri" 
            value={notifications} 
            onValueChange={(val) => { setNotifications(val); saveSetting('notifications', val); }} 
          />
          <SettingItem icon={Moon} title="Rahatsız Etme Modu" value={false} onValueChange={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HASSASİYET</Text>
          <SettingItem 
            icon={Shield} 
            title="Yüksek Hassasiyet" 
            value={highSensitivity} 
            onValueChange={(val) => { setHighSensitivity(val); saveSetting('highSensitivity', val); }} 
          />
          <View style={styles.infoBox}>
            <Info size={16} color="#64748b" />
            <Text style={styles.infoText}>Yüksek hassasiyet, en ufak eğilmelerde bile sizi uyaracaktır.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton}><Text style={styles.logoutText}>Verileri Sıfırla</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 4 },
  infoText: { fontSize: 13, color: '#64748b', flex: 1 },
  logoutButton: { marginTop: 20, padding: 16, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
