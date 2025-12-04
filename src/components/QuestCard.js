// src/components/QuestCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/constants';

const QuestCard = ({ quest, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{quest.title}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>⚡ {quest.points}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {quest.description}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.partner}>{quest.partner?.shopName}</Text>
        <Text style={styles.reward}>🎁 {quest.reward}</Text>
      </View>
      
      {!quest.isAvailable && (
        <View style={styles.unavailableOverlay}>
          <Text style={styles.unavailableText}>ไม่พร้อมใช้งาน</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: COLORS.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
    marginRight: 8,
  },
  pointsBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  description: {
    fontSize: SIZES.font,
    color: COLORS.gray[600],
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partner: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '500',
  },
  reward: {
    fontSize: SIZES.small,
    color: COLORS.success,
    fontWeight: '500',
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
});

export default QuestCard;