import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const { width } = Dimensions.get('window');

const WalletScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'points', title: 'คะแนน' },
    { key: 'finance', title: 'การเงิน' },
  ]);

  // Points State
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);

  // Finance State
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState([]);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      setLoading(true);

      if (index === 0) {
        // Load points data
        const pointsResponse = await api.get(`/users/${user._id}/points`);
        if (pointsResponse.data.success) {
          setPointsBalance(pointsResponse.data.data.balance);
          setPointsHistory(pointsResponse.data.data.history || []);
        }

        const rewardsResponse = await api.get('/rewards/available');
        if (rewardsResponse.data.success) {
          setAvailableRewards(rewardsResponse.data.data);
        }
      } else {
        // Load finance data
        const financeResponse = await api.get(`/users/${user._id}/finance`);
        if (financeResponse.data.success) {
          setBalance(financeResponse.data.data.balance);
          setTransactions(financeResponse.data.data.transactions || []);
          setWithdrawalMethods(financeResponse.data.data.withdrawalMethods || []);
        }
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  // Points Tab Component
  const PointsTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Points Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>คะแนนสะสมของคุณ</Text>
        <Text style={styles.balanceAmount}>{pointsBalance.toLocaleString()} คะแนน</Text>
        <View style={styles.pointsValue}>
          <Icon name="monetization-on" size={16} color="#666" />
          <Text style={styles.pointsValueText}>
            มีมูลค่า ฿{(pointsBalance * 0.1).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* How to Earn Points */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>วิธีรับคะแนน</Text>
        <View style={styles.earnMethods}>
          <View style={styles.earnMethod}>
            <View style={[styles.methodIcon, { backgroundColor: '#e7f3ff' }]}>
              <Icon name="assignment" size={20} color="#4a6baf" />
            </View>
            <Text style={styles.methodTitle}>ทำเควส</Text>
            <Text style={styles.methodValue}>10-100 คะแนน</Text>
          </View>

          <View style={styles.earnMethod}>
            <View style={[styles.methodIcon, { backgroundColor: '#d4edda' }]}>
              <Icon name="rate-review" size={20} color="#28a745" />
            </View>
            <Text style={styles.methodTitle}>เขียนรีวิว</Text>
            <Text style={styles.methodValue}>20-50 คะแนน</Text>
          </View>

          <View style={styles.earnMethod}>
            <View style={[styles.methodIcon, { backgroundColor: '#fff3cd' }]}>
              <Icon name="share" size={20} color="#ffc107" />
            </View>
            <Text style={styles.methodTitle}>แชร์โซเชียล</Text>
            <Text style={styles.methodValue}>5-10 คะแนน</Text>
          </View>

          <View style={styles.earnMethod}>
            <View style={[styles.methodIcon, { backgroundColor: '#f8d7da' }]}>
              <Icon name="card-giftcard" size={20} color="#dc3545" />
            </View>
            <Text style={styles.methodTitle}>รางวัลแนะนำ</Text>
            <Text style={styles.methodValue}>50+ คะแนน</Text>
          </View>
        </View>
      </View>

      {/* Available Rewards */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>แลกคะแนนเป็นรางวัล</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rewardsScroll}
        >
          {availableRewards.length > 0 ? (
            availableRewards.map((reward) => (
              <TouchableOpacity key={reward._id} style={styles.rewardCard}>
                <View style={styles.rewardImage}>
                  <Icon name="card-giftcard" size={32} color="#4a6baf" />
                </View>
                <Text style={styles.rewardName} numberOfLines={2}>{reward.name}</Text>
                <Text style={styles.rewardPoints}>{reward.pointsRequired} คะแนน</Text>
                <TouchableOpacity
                  style={[
                    styles.redeemButton,
                    pointsBalance >= reward.pointsRequired
                      ? styles.redeemButtonActive
                      : styles.redeemButtonDisabled
                  ]}
                  disabled={pointsBalance < reward.pointsRequired}
                >
                  <Text style={styles.redeemButtonText}>
                    {pointsBalance >= reward.pointsRequired ? 'แลกเลย' : 'คะแนนไม่พอ'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyRewards}>
              <Text style={styles.emptyText}>ไม่มีรางวัลในขณะนี้</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Points History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ประวัติคะแนน</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyList}>
          {pointsHistory.length > 0 ? (
            pointsHistory.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{item.description}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
                <Text style={[
                  styles.historyPoints,
                  item.type === 'earn' ? styles.earnPoints : styles.spendPoints
                ]}>
                  {item.type === 'earn' ? '+' : '-'}{item.points} คะแนน
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>ไม่มีประวัติคะแนน</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  // Finance Tab Component
  const FinanceTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>ยอดเงินคงเหลือ</Text>
        <Text style={styles.balanceAmount}>฿{balance.toLocaleString()}</Text>
        <Text style={styles.balanceInfo}>
          สามารถถอนได้ขั้นต่ำ ฿100
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {/* TODO: Implement deposit */ }}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#28a745' }]}>
            <Icon name="add-circle" size={24} color="white" />
          </View>
          <Text style={styles.actionTitle}>เติมเงิน</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {/* TODO: Implement withdraw */ }}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#4a6baf' }]}>
            <Icon name="arrow-upward" size={24} color="white" />
          </View>
          <Text style={styles.actionTitle}>ถอนเงิน</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {/* TODO: Implement transfer */ }}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#ffc107' }]}>
            <Icon name="swap-horiz" size={24} color="white" />
          </View>
          <Text style={styles.actionTitle}>โอนเงิน</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {/* TODO: Implement history */ }}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#dc3545' }]}>
            <Icon name="history" size={24} color="white" />
          </View>
          <Text style={styles.actionTitle}>ประวัติ</Text>
        </TouchableOpacity>
      </View>

      {/* Withdrawal Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ช่องทางการถอนเงิน</Text>
        <View style={styles.withdrawalMethods}>
          {withdrawalMethods.length > 0 ? (
            withdrawalMethods.map((method, index) => (
              <TouchableOpacity key={index} style={styles.methodCard}>
                <View style={styles.methodHeader}>
                  <Icon name={method.type === 'bank' ? 'account-balance' : 'qr-code'}
                    size={24} color="#4a6baf"
                  />
                  <Text style={styles.methodName}>{method.name}</Text>
                </View>
                <Text style={styles.methodDetails}>{method.details}</Text>
                <View style={styles.methodStatus}>
                  <Text style={styles.statusText}>
                    {method.isDefault ? 'ช่องทางหลัก' : 'เลือกเป็นหลัก'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity style={styles.addMethodButton}>
              <Icon name="add-circle" size={20} color="#4a6baf" />
              <Text style={styles.addMethodText}>เพิ่มช่องทางการถอนเงิน</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ธุรกรรมล่าสุด</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionList}>
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((transaction, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                  <Text style={styles.transactionId}>ID: {transaction.id}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'deposit' ? styles.depositAmount : styles.withdrawalAmount
                ]}>
                  {transaction.type === 'deposit' ? '+' : '-'}฿{transaction.amount}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>ไม่มีธุรกรรม</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderScene = SceneMap({
    points: PointsTab,
    finance: FinanceTab,
  });

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      style={styles.tabBar}
      indicatorStyle={styles.indicator}
      labelStyle={styles.tabLabel}
      activeColor="#4a6baf"
      inactiveColor="#666"
    />
  );

  if (!user) {
    return (
      <View style={styles.loginPrompt}>
        <Icon name="account-balance-wallet" size={64} color="#ccc" />
        <Text style={styles.loginTitle}>กรุณาเข้าสู่ระบบ</Text>
        <Text style={styles.loginText}>
          คุณต้องเข้าสู่ระบบเพื่อใช้งานกระเป๋าเงิน
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>กระเป๋าเงิน</Text>
        <Text style={styles.headerSubtitle}>
          {user.name} - จัดการเงินและคะแนน
        </Text>
      </View>

      {/* Tab View */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={renderTabBar}
        initialLayout={{ width }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabBar: {
    backgroundColor: 'white',
  },
  indicator: {
    backgroundColor: '#4a6baf',
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  pointsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsValueText: {
    fontSize: 14,
    color: '#666',
  },
  balanceInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4a6baf',
  },
  earnMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  earnMethod: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  methodValue: {
    fontSize: 12,
    color: '#666',
  },
  rewardsScroll: {
    paddingHorizontal: 4,
  },
  rewardCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: 140,
    marginRight: 12,
    alignItems: 'center',
  },
  rewardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardPoints: {
    fontSize: 12,
    color: '#ffc107',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  redeemButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  redeemButtonActive: {
    backgroundColor: '#4a6baf',
  },
  redeemButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  redeemButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  emptyRewards: {
    padding: 40,
    alignItems: 'center',
  },
  historyList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyPoints: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  earnPoints: {
    color: '#28a745',
  },
  spendPoints: {
    color: '#dc3545',
  },
  emptyHistory: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  withdrawalMethods: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  methodDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  methodStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e7f3ff',
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    color: '#4a6baf',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addMethodText: {
    fontSize: 14,
    color: '#4a6baf',
    fontWeight: '500',
  },
  transactionList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  transactionId: {
    fontSize: 10,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  depositAmount: {
    color: '#28a745',
  },
  withdrawalAmount: {
    color: '#dc3545',
  },
  emptyTransactions: {
    padding: 40,
    alignItems: 'center',
  },
});

export default WalletScreen;