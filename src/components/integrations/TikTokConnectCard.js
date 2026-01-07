// src/components/integrations/TikTokConnectCard.js
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { disconnectTikTok, getTikTokStatus, startTikTokConnect, TikTokIntegration } from '../../services/integrations/tiktok';
 
WebBrowser.maybeCompleteAuthSession();
 
export default function TikTokConnectCard() {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    connected: false,
    username: null,
    profileUrl: null,
    followerCount: 0,
    lastSynced: null,
  });
 
  const refresh = useCallback(async () => {
    const res = await getTikTokStatus();
    if (res.success) {
      setState({
        connected: !!res.connected,
        username: res.username || null,
        profileUrl: res.profileUrl || null,
        followerCount: res.followerCount || 0,
        lastSynced: res.lastSynced || null,
      });
    } else {
      setState((prev) => ({ ...prev, connected: false }));
    }
  }, []);
 
  useEffect(() => {
    refresh();
  }, [refresh]);
 
  // Listen for callback deep link
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      if (!url) return;
      if (url.startsWith(TikTokIntegration.TIKTOK_CALLBACK_DEEPLINK_PREFIX)) {
        await refresh();
        Alert.alert('สำเร็จ', 'เชื่อมต่อ TikTok แล้ว');
      }
    });
 
    Linking.getInitialURL().then((url) => {
      if (url && url.startsWith(TikTokIntegration.TIKTOK_CALLBACK_DEEPLINK_PREFIX)) {
        refresh();
      }
    });
 
    return () => sub.remove();
  }, [refresh]);
 
  const onConnect = useCallback(async () => {
    try {
      setLoading(true);
      const start = await startTikTokConnect();
 
      if (!start.success) {
        Alert.alert('ยังไม่พร้อมใช้งาน', start.message || 'Cannot start TikTok connection');
        return;
      }
 
      await WebBrowser.openAuthSessionAsync(start.url, TikTokIntegration.TIKTOK_CALLBACK_DEEPLINK_PREFIX);
      // After callback, listener refreshes status
    } catch (e) {
      Alert.alert('ข้อผิดพลาด', e?.message || 'เชื่อมต่อ TikTok ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);
 
  const onDisconnect = useCallback(() => {
    Alert.alert('ยกเลิกการเชื่อมต่อ TikTok', 'คุณแน่ใจหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ยกเลิกการเชื่อมต่อ',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const res = await disconnectTikTok();
            if (!res.success) throw new Error(res.message || 'Disconnect failed');
            await refresh();
          } catch (e) {
            Alert.alert('ข้อผิดพลาด', e?.message || 'ยกเลิกไม่สำเร็จ');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [refresh]);
 
  const openProfile = useCallback(() => {
    if (!state.profileUrl) {
      Alert.alert('ไม่พบโปรไฟล์', 'กรุณาเชื่อมต่อ TikTok ก่อน');
      return;
    }
    Linking.openURL(state.profileUrl);
  }, [state.profileUrl]);
 
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>TK</Text>
        </View>
 
        <View style={styles.info}>
          <Text style={styles.title}>TikTok</Text>
          <Text style={styles.subtitle}>
            {state.connected ? `เชื่อมต่อแล้ว • @${state.username || '-'}` : 'เชื่อมต่อเพื่อทำเควส TikTok'}
          </Text>
        </View>
 
        <Switch
          value={state.connected}
          onValueChange={(v) => {
            if (loading) return;
            if (v) onConnect();
            else onDisconnect();
          }}
          trackColor={{ false: '#ddd', true: '#010101' }}
          thumbColor="#fff"
        />
      </View>
 
      {state.connected ? (
        <View style={styles.body}>
          <View style={styles.row}>
            <Icon name="alternate-email" size={16} color="#010101" />
            <Text style={styles.rowText}>@{state.username || '-'}</Text>
          </View>
 
          <View style={styles.row}>
            <Icon name="people" size={16} color="#010101" />
            <Text style={styles.rowText}>Followers: {state.followerCount || 0}</Text>
          </View>
 
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={openProfile} disabled={!state.profileUrl}>
              <Icon name="open-in-new" size={16} color="#010101" />
              <Text style={styles.actionText}>เปิดโปรไฟล์</Text>
            </TouchableOpacity>
 
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnMuted]} onPress={refresh}>
              <Icon name="sync" size={16} color="#010101" />
              <Text style={styles.actionText}>รีเฟรช</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.connectBtn} onPress={onConnect} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="add-link" size={18} color="#fff" />
              <Text style={styles.connectText}>เชื่อมต่อ TikTok</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
 
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#010101',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#2D3047', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#666' },
 
  connectBtn: {
    marginTop: 16,
    backgroundColor: '#010101',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  connectText: { color: '#fff', fontSize: 16, fontWeight: '600' },
 
  body: { borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 16, paddingTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  rowText: { fontSize: 14, color: '#333' },
 
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionBtn: {
    backgroundColor: '#F7F9FC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnMuted: { backgroundColor: '#f1f1f1' },
  actionText: { fontSize: 14, fontWeight: '500', color: '#010101' },
});