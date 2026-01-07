// src/utils/testConnection.js
export const testBackendConnection = async () => {
    try {
        console.log('🔗 Testing backend connection...');

        // Test 1: Basic connection
        const testResponse = await fetch('https://thaiquestify.com/api/v2/test');
        const testData = await testResponse.json();
        console.log('✅ Basic test:', testData);

        // Test 2: Streak stats
        const statsResponse = await fetch('https://thaiquestify.com/api/v2/streak/stats');
        const statsData = await statsResponse.json();
        console.log('✅ Streak stats:', statsData);

        // Test 3: Daily quests
        const questsResponse = await fetch('https://thaiquestify.com/api/v2/daily-quests/today');
        const questsData = await questsResponse.json();
        console.log('✅ Daily quests:', questsData.data.length, 'quests');

        return {
            connected: true,
            endpoints: {
                test: testData,
                stats: statsData,
                quests: questsData
            }
        };
    } catch (error) {
        console.error('❌ Connection failed:', error);
        return {
            connected: false,
            error: error.message
        };
    }
};