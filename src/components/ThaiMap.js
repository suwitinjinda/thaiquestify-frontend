// src/components/ThaiMap.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

// 简化的泰国地图路径数据 (示意性的形状)
const thaiMapPaths = {
  north: "M150,50 L180,80 L160,120 L140,100 L130,70 Z", // 北部
  northeast: "M200,80 L250,70 L280,120 L260,150 L220,140 L190,110 Z", // 东北部
  central: "M160,120 L200,130 L220,160 L180,170 L150,150 Z", // 中部
  east: "M230,130 L270,120 L290,160 L250,170 L220,150 Z", // 东部
  west: "M120,130 L150,140 L140,170 L110,160 Z", // 西部
  south: "M180,170 L220,180 L210,220 L170,210 Z", // 南部
  bangkok: "M170,140 L190,150 L180,160 L160,150 Z" // 曼谷区域
};

const ThaiMap = ({ onRegionPress, userStats }) => {
  const regions = [
    { id: 'north', name: 'ภาคเหนือ', path: thaiMapPaths.north, color: '#4CAF50', center: { x: 150, y: 85 } },
    { id: 'northeast', name: 'ภาคตะวันออกเฉียงเหนือ', path: thaiMapPaths.northeast, color: '#FF9800', center: { x: 230, y: 110 } },
    { id: 'central', name: 'ภาคกลาง', path: thaiMapPaths.central, color: '#2196F3', center: { x: 180, y: 140 } },
    { id: 'east', name: 'ภาคตะวันออก', path: thaiMapPaths.east, color: '#9C27B0', center: { x: 250, y: 145 } },
    { id: 'west', name: 'ภาคตะวันตก', path: thaiMapPaths.west, color: '#795548', center: { x: 130, y: 150 } },
    { id: 'south', name: 'ภาคใต้', path: thaiMapPaths.south, color: '#F44336', center: { x: 200, y: 195 } },
    { id: 'bangkok', name: 'กรุงเทพ', path: thaiMapPaths.bangkok, color: '#FFC107', center: { x: 175, y: 150 } }
  ];

  return (
    <View style={styles.container}>
      <Svg width={width - 40} height={300} viewBox="100 30 200 200">
        {regions.map(region => (
          <G key={region.id}>
            <Path
              d={region.path}
              fill={region.color}
              stroke="#FFFFFF"
              strokeWidth="2"
              onPress={() => onRegionPress(region)}
            />
            <SvgText
              x={region.center.x}
              y={region.center.y}
              fontSize="10"
              fontWeight="bold"
              fill="#FFFFFF"
              textAnchor="middle"
              onPress={() => onRegionPress(region)}
            >
              {region.name}
            </SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
};