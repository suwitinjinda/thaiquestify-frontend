// src/services/mockQuestTemplateService.js
// Mock service for development when backend is not available

const mockTemplates = [
  {
    _id: '1',
    name: 'Follow Facebook Page',
    description: 'Follow our Facebook page to stay updated with latest news and promotions',
    type: 'social_media',
    instructions: '1. Visit our Facebook page using the link provided\n2. Click the Follow button\n3. Take a clear screenshot showing you have followed the page\n4. Submit the screenshot for verification',
    verificationMethod: 'screenshot',
    rewardPoints: 50,
    rewardAmount: 10,
    category: 'Social Media',
    estimatedTime: 2,
    isActive: true,
    requiredData: {
      facebook_url: 'https://facebook.com/',
      page_name: 'Your Page Name'
    },
    createdBy: { name: 'Admin User', email: 'admin@thaiquestify.com' },
    createdAt: new Date().toISOString(),
    tags: ['social', 'facebook', 'follow', 'engagement']
  },
  {
    _id: '2',
    name: 'Website Visit',
    description: 'Visit our website and explore our services',
    type: 'website_visit',
    instructions: '1. Click the website link provided\n2. Spend at least 2 minutes browsing our services\n3. Take a screenshot of the website showing you have visited\n4. Submit the screenshot for verification',
    verificationMethod: 'screenshot',
    rewardPoints: 30,
    rewardAmount: 5,
    category: 'Website',
    estimatedTime: 3,
    isActive: true,
    requiredData: {
      website_url: 'https://yourwebsite.com'
    },
    createdBy: { name: 'Admin User', email: 'admin@thaiquestify.com' },
    createdAt: new Date().toISOString(),
    tags: ['website', 'visit', 'browsing', 'traffic']
  }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockQuestTemplateAPI = {
  getAllTemplates: async () => {
    console.log('🔄 [MOCK] Getting all templates...');
    await delay(800);
    return mockTemplates;
  },

  getTemplateById: async (id) => {
    console.log(`🔄 [MOCK] Getting template ${id}...`);
    await delay(500);
    const template = mockTemplates.find(t => t._id === id);
    if (!template) throw new Error('Template not found');
    return template;
  },

  createTemplate: async (templateData) => {
    console.log('🔄 [MOCK] Creating template...', templateData);
    await delay(1000);
    const newTemplate = {
      _id: Date.now().toString(),
      ...templateData,
      isActive: true,
      createdBy: { name: 'Admin User', email: 'admin@thaiquestify.com' },
      createdAt: new Date().toISOString(),
    };
    mockTemplates.unshift(newTemplate);
    return newTemplate;
  },

  updateTemplate: async (id, templateData) => {
    console.log(`🔄 [MOCK] Updating template ${id}...`, templateData);
    await delay(800);
    const index = mockTemplates.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Template not found');
    
    mockTemplates[index] = { ...mockTemplates[index], ...templateData };
    return mockTemplates[index];
  },

  toggleTemplateStatus: async (id) => {
    console.log(`🔄 [MOCK] Toggling template ${id}...`);
    await delay(500);
    const template = mockTemplates.find(t => t._id === id);
    if (!template) throw new Error('Template not found');
    
    template.isActive = !template.isActive;
    return template;
  },

  deleteTemplate: async (id) => {
    console.log(`🔄 [MOCK] Deleting template ${id}...`);
    await delay(600);
    const index = mockTemplates.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Template not found');
    
    mockTemplates.splice(index, 1);
    return { success: true, message: 'Template deleted successfully' };
  }
};