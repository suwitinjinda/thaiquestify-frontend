import api from './api';

export const shopAPI = {
  // Get all shops for admin
  getAllShops: async () => {
    try {
      console.log('🔄 Fetching shops from API...');
      
      const response = await api.get('/shop/admin/shops');
      console.log('✅ Real API response received');
      console.log('📊 Shops data:', response.data);
      
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      };
      
    } catch (error) {
      console.error('❌ Shops API error:', error);
      
      let errorMessage = 'Failed to fetch shops';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Get partner dashboard data
  getPartnerDashboard: async () => {
    try {
      console.log('🔄 Fetching partner dashboard data from API...');
      
      const response = await api.get('/partner/dashboard');
      console.log('✅ Partner dashboard API response received');
      console.log('📊 Partner dashboard data:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Partner dashboard API error:', error);
      
      let errorMessage = 'Failed to fetch partner dashboard data';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Get shops by owner
  getShops: async () => {
    try {
      console.log('🔄 Fetching partner shops from API...');
      
      const response = await api.get('/shop/shops');
      console.log('✅ Owner shops API response received');
      console.log('📊 Owner shops data:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Partner shops API error:', error);
      
      let errorMessage = 'Failed to fetch partner shops';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  getShopByUserId: async (userId) => {
  try {
    console.log(`🛍️ Fetching shop for user: ${userId}`);
    
    const response = await api.get(`/shop/${userId}/shop`);
    console.log('✅ User shop data received:', response.data);
    
    return response.data.data; // Return the shop data array
    
  } catch (error) {
    console.error(`❌ Get shop by user ID ${userId} error:`, error);
    
    let errorMessage = 'Failed to fetch user shop data';
    
    if (error.response) {
      console.error('📡 Server response:', error.response.status, error.response.data);
      
      // If shop not found, return empty array instead of throwing error
      if (error.response.status === 404) {
        console.log('📭 No shop found for user, returning empty array');
        return [];
      }
      
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      console.error('🌐 No response received - network error');
      errorMessage = 'Network error: Cannot connect to server';
    } else {
      console.error('💥 Request setup error:', error.message);
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
  },
  
  // Get quest by ID
getQuestById: async (questId) => {
  try {
    console.log(`🔍 Fetching quest details: ${questId}`);
    
    const response = await api.get(`/shop/quests/${questId}`);
    console.log('✅ Quest details received');
    
    return {
      success: true,
      data: response.data.data
    };
    
  } catch (error) {
    console.error(`❌ Get quest ${questId} error:`, error);
    throw new Error('Failed to fetch quest details');
  }
},
 
// Toggle quest active status
toggleQuestActive: async (questId) => {
  try {
    console.log(`🔄 Toggling quest active status: ${questId}`);
    
    const response = await api.patch(`/shop/quests/${questId}/toggle-active`);
    console.log('✅ Quest status toggled');
    
    return {
      success: true,
      data: response.data.data
    };
    
  } catch (error) {
    console.error(`❌ Toggle quest ${questId} error:`, error);
    throw new Error('Failed to toggle quest status');
  }
},

  // Get shop by owner email
getShopByOwnerEmail: async (email) => {
  try {
    console.log(`🛍️ Fetching shop for owner email: ${email}`);
    
    const response = await api.get(`/shop/owner/${email}/shops`);
    // console.log('✅ User shop data received:', response.data);

    if (response.data.data && response.data.data.length > 0) {
      const shopIds = response.data.data
        .filter(shop => 
          shop.ownerEmail === email || 
          shop.user?.email === email
        )
        .map(shop => shop.shopId) // Only get the shopId strings
        .filter(shopId => shopId); // Remove any null/undefined values
      
      console.log(`✅ Found shop IDs: [${shopIds.join(', ')}]`);
      return shopIds; // Returns: ['832687', '347166']
    }
    return []; // No shops found
    
    
  } catch (error) {
    console.error(`❌ Get shop by owner email ${email} error:`, error);
    
    let errorMessage = 'Failed to fetch user shop data';
    
    if (error.response) {
      console.error('📡 Server response:', error.response.status, error.response.data);
      
      // If shop not found, return empty array instead of throwing error
      if (error.response.status === 404) {
        console.log('📭 No shop found for user email, returning empty array');
        return [];
      }
      
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      console.error('🌐 No response received - network error');
      errorMessage = 'Network error: Cannot connect to server';
    } else {
      console.error('💥 Request setup error:', error.message);
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
},

   // Get partner shops
  getPartnerShops: async () => {
    try {
      console.log('🔄 Fetching partner shops from API...');
      
      const response = await api.get('/partner/shops');
      console.log('✅ Partner shops API response received');
      console.log('📊 Partner shops data:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Partner shops API error:', error);
      
      let errorMessage = 'Failed to fetch partner shops';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Register new shop
  registerShop: async (shopData) => {
    try {
      console.log('📦 Registering shop with data:', shopData);
      
      // ✅ FIX: Prepare the data with correct field names for backend
      const backendShopData = {
        shopId: shopData.shopId,
        partnerId: shopData.partnerId, // Make sure this is defined
        partnerCode: shopData.partnerCode,
        shopName: shopData.shopName,
        shopType: shopData.shopType,
        taxId: shopData.taxId || '',
        province: shopData.province,
        district: shopData.district || '',
        address: shopData.address || '',
        coordinates: shopData.coordinates,
        phone: shopData.phone,
        businessHours: shopData.businessHours || '',
        description: shopData.description || '',
        // ✅ CRITICAL: Use the correct field names that match the Shop model
        user: shopData.ownerUserId, // This must match the 'user' field in Shop model
        ownerEmail: shopData.ownerEmail // This must match the 'ownerEmail' field in Shop model
      };

      console.log('🚀 Sending to backend:', backendShopData);

      const response = await api.post('/partner/shops/register', backendShopData);
      return response.data;
    } catch (error) {
      console.error('❌ Error registering shop:', error);
      throw new Error(error.response?.data?.message || 'Failed to register shop');
    }
  },

  // Update shop status
  updateShopStatus: async (shopId, status, reason = '') => {
    try {
      console.log(`🔄 Updating shop ${shopId} status to ${status}`);
      
      const response = await api.put(`/shop/admin/shops/${shopId}/status`, {
        status,
        rejectionReason: reason
      });
      
      console.log('✅ Shop status updated via API:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Update shop status error:', error);
      
      let errorMessage = 'Failed to update shop status';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Get partner commission data
  getPartnerCommission: async () => {
    try {
      console.log('🔄 Fetching partner commission data from API...');
      
      const response = await api.get('/shop/partner/commission');
      console.log('✅ Partner commission API response received');
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Partner commission API error:', error);
      
      let errorMessage = 'Failed to fetch commission data';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Generate shop number - ADD THIS METHOD
  generateShopNumber: async () => {
  try {
    console.log('🔄 Generating shop number from API...');
    
    const response = await api.post('/partner/shops/generate-number');
    console.log('✅ Shop number generated:', response.data);
    
    // Return just the shop number string, not the full response object
    return response.data.shopNumber;
    
  } catch (error) {
    console.error('❌ Generate shop number API error:', error);
    
    let errorMessage = 'Failed to generate shop number';
    
    if (error.response) {
      console.error('📡 Server response:', error.response.status, error.response.data);
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      console.error('🌐 No response received - network error');
      errorMessage = 'Network error: Cannot connect to server';
    } else {
      console.error('💥 Request setup error:', error.message);
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
},
  // Test API connection
  testConnection: async () => {
    try {
      const response = await api.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      throw new Error('Cannot connect to backend server');
    }
  },
  // สร้างเควสจากเทมเพลต - ADD THIS METHOD
  createQuestFromTemplate: async (questData) => {
    try {
      console.log('🚀 Creating quest from template:', questData);
      
      const response = await api.post('/shop/quests', questData);
      console.log('✅ Quest created successfully:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Create quest error:', error);
      
      let errorMessage = 'Failed to create quest';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Get quests สำหรับ shop owner และ admin - ADD THIS METHOD
  getQuests: async (filters = {}) => {
    try {
      console.log('🔄 Fetching quests with role-based filtering');
      
      const response = await api.get('/shop/quests', { params: filters });
      console.log('✅ Quests fetched:', response.data.count, 'for user type:', response.data.userType);
      
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
        userType: response.data.userType
      };
      
    } catch (error) {
      console.error('❌ Get quests error:', error);
      throw new Error('Failed to fetch quests');
    }
  },

  // สำหรับ Admin: Get all quests - ADD THIS METHOD
  getAllQuests: async (filters = {}) => {
    try {
      console.log('🔄 Admin fetching all quests...');
      
      const response = await api.get('/shop/admin/quests', { params: filters });
      console.log('✅ All quests fetched:', response.data.data.length);
      
      return {
        success: true,
        data: response.data.data,
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages
      };
      
    } catch (error) {
      console.error('❌ Get all quests error:', error);
      throw new Error('Failed to fetch all quests');
    }
  },

  // Get quest statistics - ADD THIS METHOD
  getQuestStats: async () => {
    try {
      console.log('🔄 Fetching quest statistics...');
      
      const response = await api.get('/shop/quests-stats');
      console.log('✅ Quest stats fetched');
      
      return {
        success: true,
        data: response.data.data,
        userType: response.data.userType
      };
      
    } catch (error) {
      console.error('❌ Get quest stats error:', error);
      throw new Error('Failed to fetch quest statistics');
    }
  },

  // ✅ CORRECT METHOD NAME: Get quests by shop owner's user ID
  getQuestsByShopOwner: async (userId, filters = {}) => {
    try {
      console.log(`🔄 Fetching quests for shop owner: ${userId}`);
      
      const response = await api.get(`/shop/quests/shop/${userId}/quests`, { 
        params: filters 
      });
      
      console.log(`✅ Found ${response.data.data.length} quests for shop owner ${userId}`);
      
      return {
        success: true,
        data: response.data.data,
        statistics: response.data.statistics,
        shopInfo: response.data.shopInfo,
        pagination: response.data.pagination
      };
      
    } catch (error) {
      console.error(`❌ Get quests for shop owner ${userId} error:`, error);
      throw new Error('Failed to fetch shop quests');
    }
  },

  // Add to shopService.js
  getQuestsByShopId: async (shopId, filters = {}) => {
  try {
    console.log(`🔄 Fetching quests for shop: ${shopId}`);
    
    const response = await api.get(`/shop/quests/shop/${shopId}/quests`, { 
      params: filters 
    });
    
    console.log(`✅ Found ${response.data.data.length} quests for shop ${shopId}`);
    
    return {
      success: true,
      data: response.data.data,
      statistics: response.data.statistics,
      shopInfo: response.data.shopInfo,
      pagination: response.data.pagination
    };
    
  } catch (error) {
    console.error(`❌ Get quests for shop ${shopId} error:`, error);
    throw new Error('Failed to fetch shop quests');
  }
},

  // createQuestFromTemplate: async (questData) => {
  // try {
  //   console.log('🚀 Creating quest from template:', questData);
    
  //   const response = await api.post('/shop/quests/quests', questData);
  //   console.log('✅ Quest created successfully:', response.data);
    
  //   return {
  //     success: true,
  //     data: response.data.data
  //   };
    
  // } catch (error) {
  //   console.error('❌ Create quest error:', error);
    
  //   let errorMessage = 'Failed to create quest';
    
  //   if (error.response) {
  //     console.error('📡 Server response:', error.response.status, error.response.data);
  //     errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
  //   } else if (error.request) {
  //     console.error('🌐 No response received - network error');
  //     errorMessage = 'Network error: Cannot connect to server';
  //   } else {
  //     console.error('💥 Request setup error:', error.message);
  //     errorMessage = error.message;
  //   }
    
  //   throw new Error(errorMessage);
  // }
  // },
  
  // src/services/shopService.js - Update createQuestFromTemplate function
createQuestFromTemplate: async (questData) => {
  try {
    console.log('📤 Creating quest from template:', questData);
    
    // Make sure we're sending the correct data structure
    const payload = {
      templateId: questData.templateId,
      shopId: questData.shopId,
      budget: questData.budget,
      maxParticipants: questData.maxParticipants,
      duration: questData.duration || 7
    };
    
    console.log('📦 Sending payload:', payload);
    
    const response = await api.post('/quests/from-template', payload);
    console.log('✅ Quest created response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error creating quest:', error.response?.data || error);
    throw error;
  }
}


};