import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (will be called after env vars are loaded)
let isConfigured = false;

function ensureCloudinaryConfig() {
  if (!isConfigured) {
    console.log('Configuring Cloudinary with:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
    });

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    isConfigured = true;
  }
}

/**
 * Upload an image to Cloudinary
 * @param {string} imagePath - Local path to the image file
 * @param {string} publicId - Public ID for the uploaded image
 * @param {string} folder - Folder to organize images in Cloudinary
 * @returns {Promise<Object>} Upload result
 */
export async function uploadImage(imagePath, publicId, folder = 'vosf') {
  ensureCloudinaryConfig();
  
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: folder,
      overwrite: true,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload image from buffer (for API uploads)
 * @param {Buffer} buffer - Image buffer
 * @param {string} publicId - Public ID for the uploaded image
 * @param {string} folder - Folder to organize images in Cloudinary
 * @returns {Promise<Object>} Upload result
 */
export async function uploadImageFromBuffer(buffer, publicId, folder = 'vosf') {
  ensureCloudinaryConfig();
  
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: folder,
          overwrite: true,
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              success: true,
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
            });
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate optimized image URL
 * @param {string} publicId - Public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(publicId, options = {}) {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    ...options,
  };
  
  return cloudinary.url(publicId, defaultOptions);
}

export default cloudinary;
