// src/screens/ShopQuestTemplates.js (สำหรับให้ Shop เลือก Template)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ShopQuestTemplates = ({ navigation }) => {
  const { user } = useAuth();

  const availableTemplates = [
    {
      id: 1,
      name: 'Follow Facebook Page',
      description: 'Follow our Facebook page to stay updated',
      type: 'social_media',
      rewardPoints: 50,
      rewardAmount: 10,
      estimatedTime: 2,
      category: 'Social Media'
    }
  ];

  const handleUseTemplate = (template) => {
    navigation.navigate('CreateQuestFromTemplate', { template });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => navigation.navigate('Profile')}>
        <Image source={{ uri: user.photo }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.welcome}>Quest Templates</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>Choose a template to create quest</Text>
        </View>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Available Quest Templates</Text>
        <Text style={styles.subtitle}>
          Choose from pre-made templates to quickly create quests
        </Text>

        {availableTemplates.map(template => (
          <TouchableOpacity 
            key={template.id}
            style={styles.templateCard}
            onPress={() => handleUseTemplate(template)}
          >
            <View style={styles.templateHeader}>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateCategory}>{template.category}</Text>
            </View>
            <Text style={styles.templateDescription}>{template.description}</Text>
            <View style={styles.templateRewards}>
              <Text style={styles.rewardText}>
                🎁 {template.rewardPoints} points + ฿{template.rewardAmount}
              </Text>
              <Text style={styles.timeText}>⏱️ {template.estimatedTime} min</Text>
            </View>
            <TouchableOpacity style={styles.useTemplateButton}>
              <Text style={styles.useTemplateButtonText}>Use This Template</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Add styles similar to previous components...

export default ShopQuestTemplates;