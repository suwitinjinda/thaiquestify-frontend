// src/hooks/v2/useStreak.js - FIXED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://34.68.216.20:5000/api/v2';

export const useStreak = () => {
    const isMounted = useRef(true);
    const isFetching = useRef(false);
    const lastFetchTime = useRef(0);

    // เก็บ count เพื่อดูว่าเกิด infinite loop หรือไม่
    const fetchCount = useRef(0);

    const [streakStats, setStreakStats] = useState({
        currentStreak: 0,
        longestStreak: 0,
        dailyCompleted: 0,
        totalPoints: 0,
        nextReset: { time: '', hours: 0, minutes: 0 },
        multiplier: 1.0,
        isLoading: true,
        error: null
    });


    const [dailyQuests, setDailyQuests] = useState({
        quests: [],
        completedCount: 0,
        totalCount: 0,
        isLoading: true,
        error: null
    });

    const [leaderboard, setLeaderboard] = useState({
        data: [],
        isLoading: true,
        error: null
    });

    // 🔧 FIXED: apiCall function ที่ทำงานได้ถูกต้อง
    // 🔍 DEBUG: เพิ่ม logging สำหรับทุก API call
    const apiCall = useCallback(async (method, endpoint, body = null) => {
        fetchCount.current++;
        console.log(`🔍 API Call #${fetchCount.current}: ${method} ${endpoint}`);

        try {
            let token = await AsyncStorage.getItem('authToken');
            console.log(`📤 Token exists: ${!!token}`);

            if (token) {
                console.log(`🔑 Token length: ${token.length}, starts with: ${token.substring(0, 30)}...`);
            }

            const fullUrl = `http://34.68.216.20:5000/api/v2${endpoint}`;
            console.log(`🔗 Full URL: ${fullUrl}`);

            const config = {
                method,
                url: fullUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 5000, // ลด timeout เพื่อไม่ให้แฮงค์นาน
            };

            if (token) {
                // ทดลองใช้ token format ต่างๆ
                const tokenFormats = [
                    `Bearer ${token}`,
                    token,
                    `Bearer user-token-${token}`,
                    `Bearer auto-login-${token}`,
                ];

                // ใช้ format แรกก่อน
                config.headers.Authorization = tokenFormats[0];
                console.log(`🔐 Using token format: ${tokenFormats[0].substring(0, 50)}...`);
            }

            console.log(`🚀 Sending request...`);
            const startTime = Date.now();

            const response = await axios(config);
            const endTime = Date.now();

            console.log(`✅ Response received in ${endTime - startTime}ms`);
            console.log(`📊 Response status: ${response.status}`);
            console.log(`📦 Response data keys: ${Object.keys(response.data)}`);

            return response.data;

        } catch (error) {
            console.error(`❌ API Error details:`);
            console.error(`   - Message: ${error.message}`);
            console.error(`   - Code: ${error.code}`);
            console.error(`   - Status: ${error.response?.status}`);
            console.error(`   - Response data:`, error.response?.data);

            if (error.code === 'ECONNABORTED') {
                console.error('   ⚠️ Request timeout!');
            }

            throw error;
        }
    }, []);

    // 🔧 FIXED: loadStreakStats function ที่หายไป
    // 🔍 DEBUG: เพิ่ม logging ใน loadStreakStats
    const loadStreakStats = useCallback(async () => {
        const now = Date.now();
        console.log(`⏰ Streak stats called, time since last: ${now - lastFetchTime.current}ms`);

        if (now - lastFetchTime.current < 1000) {
            console.log('⏭️ Skipping - too soon since last call');
            return;
        }

        lastFetchTime.current = now;

        if (!isMounted.current) {
            console.log('🚫 Component unmounted, skipping');
            return;
        }

        if (isFetching.current) {
            console.log('⏳ Already fetching, skipping');
            return;
        }

        isFetching.current = true;
        console.log('🔄 STARTING loadStreakStats...');

        try {
            setStreakStats(prev => {
                console.log('📝 Setting streak stats loading to true');
                return { ...prev, isLoading: true, error: null };
            });

            // ลองเรียก API
            console.log('📡 Attempting API call to /streak/stats...');
            const data = await apiCall('GET', '/streak/stats');
            console.log('📦 API Response:', JSON.stringify(data, null, 2));

            if (data && data.success !== false) {
                console.log('✅ API call successful');

                let streakData = data.data || data;
                console.log('📊 Parsed streak data:', streakData);

                setStreakStats({
                    currentStreak: streakData.currentStreak || 0,
                    longestStreak: streakData.longestStreak || 0,
                    dailyCompleted: streakData.dailyCompleted || 0,
                    totalPoints: streakData.totalPoints || 0,
                    nextReset: streakData.nextReset || { time: '00:00', hours: 0, minutes: 0 },
                    multiplier: streakData.multiplier || 1.0,
                    isLoading: false,
                    error: null
                });

                console.log('🎯 Streak stats updated successfully');
            } else {
                console.warn('⚠️ API returned unsuccessful:', data);
                throw new Error(data?.error || 'API returned unsuccessful');
            }

        } catch (error) {
            console.error('❌ ERROR in loadStreakStats:', error.message);

            // ใช้ fallback data ทันที
            console.log('🔄 Using fallback mock data...');
            setStreakStats({
                currentStreak: 5,
                longestStreak: 12,
                dailyCompleted: 2,
                totalPoints: 320,
                nextReset: { time: '00:00', hours: 3, minutes: 45 },
                multiplier: 1.3,
                isLoading: false,
                error: error.message || 'Using mock data'
            });

            console.log('✅ Fallback data set');
        } finally {
            console.log('🏁 loadStreakStats finished');
            if (isMounted.current) {
                isFetching.current = false;
            }
        }
    }, [apiCall]);


    // 🔧 FIXED: loadDailyQuests function
    const loadDailyQuests = useCallback(async () => {
        try {
            console.log('🔄 Loading daily quests...');
            setDailyQuests(prev => ({ ...prev, isLoading: true, error: null }));

            const data = await apiCall('GET', '/daily-quests/today');

            console.log('📦 Daily quests response:', {
                success: data.success,
                dataLength: data.data?.length || 0,
                hasSummary: !!data.summary
            });

            if (data.success && Array.isArray(data.data)) {
                const questsArray = data.data;
                const completedCount = data.summary?.completed ||
                    questsArray.filter(q => q.isCompleted || q.completed).length;

                setDailyQuests({
                    quests: questsArray,
                    completedCount,
                    totalCount: data.summary?.total || questsArray.length,
                    isLoading: false,
                    error: null
                });

                console.log(`✅ Loaded ${questsArray.length} quests`);

            } else {
                throw new Error(data.error || 'Invalid response from backend');
            }

        } catch (error) {
            console.error('❌ Error loading daily quests:', error);

            // Fallback mock data
            const mockQuests = [
                {
                    _id: 'mock_1',
                    name: 'เช็คอินรายวัน',
                    description: 'เข้าใช้แอปทุกวันรับคะแนนพิเศษ',
                    points: 20,
                    icon: 'check_circle',
                    requirements: 'เข้าสู่ระบบในแอป',
                    isCompleted: false,
                    completed: false
                },
                {
                    _id: 'mock_2',
                    name: 'ทำเควสสำเร็จ',
                    description: 'ทำเควสให้สำเร็จ 1 เควส',
                    points: 30,
                    icon: 'task_alt',
                    requirements: 'ทำเควสใดๆ ให้สำเร็จ',
                    isCompleted: Math.random() > 0.5,
                    completed: Math.random() > 0.5
                },
                {
                    _id: 'mock_3',
                    name: 'เรียนรู้สิ่งใหม่',
                    description: 'เรียนรู้เนื้อหาใหม่ 1 บทเรียน',
                    points: 40,
                    icon: 'explore',
                    requirements: 'เรียนจบ 1 บทเรียน',
                    isCompleted: false,
                    completed: false
                }
            ];

            const completedCount = mockQuests.filter(q => q.isCompleted).length;

            setDailyQuests({
                quests: mockQuests,
                completedCount,
                totalCount: mockQuests.length,
                isLoading: false,
                error: 'Using mock data: ' + error.message
            });
        }
    }, [apiCall]);

    // 🔧 FIXED: loadLeaderboard function
    const loadLeaderboard = useCallback(async (limit = 10) => {
        try {
            console.log('🔄 Loading leaderboard...');
            setLeaderboard(prev => ({ ...prev, isLoading: true, error: null }));

            const data = await apiCall('GET', `/streak/leaderboard?limit=${limit}`);

            let leaderboardArray = [];
            if (Array.isArray(data)) {
                leaderboardArray = data;
            } else if (data?.data && Array.isArray(data.data)) {
                leaderboardArray = data.data;
            }

            console.log(`✅ Loaded ${leaderboardArray.length} leaderboard items`);

            setLeaderboard({
                data: leaderboardArray,
                isLoading: false,
                error: null
            });

        } catch (error) {
            console.error('❌ Error loading leaderboard:', error);

            // Fallback mock leaderboard
            const mockLeaderboard = [
                { _id: '1', name: 'John Doe', streak: 15, totalPoints: 450, rank: 1 },
                { _id: '2', name: 'Jane Smith', streak: 12, totalPoints: 380, rank: 2 },
                { _id: '3', name: 'Bob Wilson', streak: 10, totalPoints: 320, rank: 3 },
                { _id: '4', name: 'Alice Brown', streak: 8, totalPoints: 280, rank: 4 },
                { _id: '5', name: 'Charlie Lee', streak: 5, totalPoints: 210, rank: 5 }
            ];

            setLeaderboard({
                data: mockLeaderboard,
                isLoading: false,
                error: 'Using mock data: ' + error.message
            });
        }
    }, [apiCall]);

    // 🔧 FIXED: completeDailyQuest function
    const completeDailyQuest = useCallback(async (questId, questName = '') => {
        try {
            console.log(`🎯 Completing quest: ${questName} (${questId})`);

            // Optimistic update
            setDailyQuests(prev => {
                const updatedQuests = prev.quests.map(quest =>
                    quest._id === questId
                        ? { ...quest, isCompleted: true, completed: true }
                        : quest
                );

                const completedCount = updatedQuests.filter(q => q.isCompleted).length;

                return {
                    ...prev,
                    quests: updatedQuests,
                    completedCount
                };
            });

            // เรียก API
            const response = await apiCall('POST', `/daily-quests/${questId}/complete`);
            console.log('✅ Quest completion response:', response);

            if (response.success) {
                // อัพเดท streak stats หลังจากสำเร็จ
                await loadStreakStats();

                return {
                    success: true,
                    message: response.message || 'ทำเควสสำเร็จ!',
                    data: response.data
                };
            } else {
                // Rollback ถ้าไม่สำเร็จ
                await loadDailyQuests();
                return {
                    success: false,
                    error: response.error || 'ไม่สามารถทำเควสได้'
                };
            }

        } catch (error) {
            console.error('❌ Error completing quest:', error);

            // Rollback
            await loadDailyQuests();

            return {
                success: false,
                error: error.message || 'เกิดข้อผิดพลาดในการทำเควส'
            };
        }
    }, [apiCall, loadStreakStats, loadDailyQuests]);

    // 🔧 FIXED: refreshAll function
    const refreshAll = useCallback(async () => {
        if (!isMounted.current || isFetching.current) return;

        isFetching.current = true;
        console.log('🔄 Refreshing all data...');

        try {
            await Promise.all([
                loadStreakStats(),
                loadDailyQuests(),
                loadLeaderboard()
            ]);

            console.log('✅ All data refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing all data:', error);
        } finally {
            if (isMounted.current) {
                isFetching.current = false;
            }
        }
    }, [loadStreakStats, loadDailyQuests, loadLeaderboard]);

    // Load initial data
    // 🔍 DEBUG: แก้ไข useEffect ที่อาจทำให้เกิด infinite loop
    useEffect(() => {
        console.log('🏁 useStreak MOUNTED');

        let mounted = true;

        const init = async () => {
            console.log('🚀 Starting initial data load...');

            // โหลดแยกทีละอันเพื่อ debug ง่าย
            try {
                console.log('1️⃣ Loading streak stats...');
                await loadStreakStats();

                console.log('2️⃣ Loading daily quests...');
                await loadDailyQuests();

                console.log('3️⃣ Loading leaderboard...');
                await loadLeaderboard();

                console.log('✅ All initial data loaded!');
            } catch (error) {
                console.error('❌ Error in initial load:', error);
            }
        };

        // หน่วงเวลาเล็กน้อยก่อนเริ่มโหลด
        setTimeout(() => {
            if (mounted) {
                init();
            }
        }, 100);

        return () => {
            console.log('🗑️ useStreak UNMOUNTING');
            mounted = false;
            isMounted.current = false;
        };
    }, []); // ⚠️ ต้องไม่มี dependencies ตรงนี้!
    return {
        streakStats,
        dailyQuests,
        leaderboard,
        loadStreakStats,
        loadDailyQuests,
        loadLeaderboard,
        completeDailyQuest,
        refreshAll,
        isLoading: streakStats.isLoading || dailyQuests.isLoading || leaderboard.isLoading,
        error: streakStats.error || dailyQuests.error || leaderboard.error
    };
};