// src/services/facebookService.js
import { 
  LoginManager, 
  AccessToken, 
  GraphRequest, 
  GraphRequestManager 
} from 'react-native-fbsdk-next';

export const FacebookService = {
  /**
   * Login to Facebook and get access token
   */
  login: async () => {
    try {
      console.log('🔐 Starting Facebook login...');
      
      // Logout first to clear any existing sessions
      await LoginManager.logOut();
      
      // Request permissions - need 'pages_show_list' to check liked pages
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'pages_show_list' // Critical: to get user's liked pages
      ]);
      
      if (result.isCancelled) {
        console.log('Facebook login cancelled by user');
        throw new Error('USER_CANCELLED');
      }
      
      if (result.declinedPermissions && result.declinedPermissions.includes('pages_show_list')) {
        console.log('User declined pages_show_list permission');
        throw new Error('PERMISSION_DENIED');
      }
      
      // Get access token
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        console.log('No access token received');
        throw new Error('NO_ACCESS_TOKEN');
      }
      
      console.log('✅ Facebook login successful, token:', data.accessToken.substring(0, 20) + '...');
      return {
        accessToken: data.accessToken,
        userId: data.userID,
        expirationDate: data.expirationTime
      };
      
    } catch (error) {
      console.error('Facebook login error:', error);
      
      if (error.message === 'USER_CANCELLED') {
        throw new Error('Login cancelled by user');
      } else if (error.message === 'PERMISSION_DENIED') {
        throw new Error('Please grant permission to access your Facebook pages');
      } else if (error.message === 'NO_ACCESS_TOKEN') {
        throw new Error('Failed to get Facebook access token');
      }
      
      throw new Error(`Facebook login failed: ${error.message}`);
    }
  },

  /**
   * Check if user follows/likes a specific Facebook page
   * @param {string} accessToken - User's Facebook access token
   * @param {string} pageId - Facebook Page ID to check
   * @returns {Promise<boolean>} - True if user likes the page
   */
  checkPageLike: (accessToken, pageId) => {
    return new Promise((resolve, reject) => {
      console.log(`🔍 Checking if user likes page: ${pageId}`);
      
      // First, get the page details to verify it exists
      const getPageRequest = new GraphRequest(
        `/${pageId}`,
        {
          accessToken: accessToken,
          parameters: {
            fields: {
              string: 'id,name,fan_count'
            }
          }
        },
        (pageError, pageResult) => {
          if (pageError) {
            console.error('Error fetching page details:', pageError);
            reject(new Error(`Facebook page ${pageId} not found or inaccessible`));
            return;
          }

          console.log(`Page found: ${pageResult.name} (${pageResult.fan_count} fans)`);
          
          // Now check if user likes this page
          const checkLikeRequest = new GraphRequest(
            `/me/likes/${pageId}`,
            {
              accessToken: accessToken,
              httpMethod: 'GET',
            },
            (likeError, likeResult) => {
              if (likeError) {
                console.error('Error checking page like:', likeError);
                reject(new Error('Failed to check page like status'));
              } else {
                // If result has data array with length > 0, user likes the page
                const isFollowing = !!likeResult.data && likeResult.data.length > 0;
                console.log(`User ${isFollowing ? 'LIKES' : 'DOES NOT LIKE'} page ${pageId}`);
                resolve(isFollowing);
              }
            }
          );
          
          new GraphRequestManager().addRequest(checkLikeRequest).start();
        }
      );
      
      new GraphRequestManager().addRequest(getPageRequest).start();
    });
  },

  /**
   * Get user's Facebook profile information
   */
  getUserProfile: (accessToken) => {
    return new Promise((resolve, reject) => {
      const request = new GraphRequest(
        '/me',
        {
          accessToken: accessToken,
          parameters: {
            fields: {
              string: 'id,name,email,picture{url}'
            }
          }
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      new GraphRequestManager().addRequest(request).start();
    });
  },

  /**
   * Get all pages liked by the user (for debugging)
   */
  getUserLikedPages: (accessToken) => {
    return new Promise((resolve, reject) => {
      const request = new GraphRequest(
        '/me/likes',
        {
          accessToken: accessToken,
          parameters: {
            fields: {
              string: 'id,name,category,created_time'
            },
            limit: {
              string: '100'
            }
          }
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      new GraphRequestManager().addRequest(request).start();
    });
  },

  /**
   * Logout from Facebook
   */
  logout: async () => {
    try {
      await LoginManager.logOut();
      console.log('✅ Logged out from Facebook');
      return true;
    } catch (error) {
      console.error('Facebook logout error:', error);
      return false;
    }
  },

  /**
   * Comprehensive verification: Login + Check page like
   */
  verifyFacebookFollow: async (pageId) => {
    try {
      console.log(`🎯 Starting Facebook verification for page: ${pageId}`);
      
      // Step 1: Login to Facebook
      const facebookData = await FacebookService.login();
      
      // Step 2: Get user profile
      const userProfile = await FacebookService.getUserProfile(facebookData.accessToken);
      console.log('User profile:', userProfile.name);
      
      // Step 3: Check if user likes the page
      const isFollowing = await FacebookService.checkPageLike(facebookData.accessToken, pageId);
      
      return {
        success: true,
        isFollowing: isFollowing,
        userData: {
          facebookUserId: userProfile.id,
          facebookUserName: userProfile.name,
          facebookUserEmail: userProfile.email,
          facebookProfilePic: userProfile.picture?.data?.url
        },
        verificationData: {
          accessToken: facebookData.accessToken,
          verifiedAt: new Date().toISOString(),
          pageId: pageId
        }
      };
      
    } catch (error) {
      console.error('Facebook verification error:', error);
      return {
        success: false,
        error: error.message,
        isFollowing: false
      };
    }
  }
};