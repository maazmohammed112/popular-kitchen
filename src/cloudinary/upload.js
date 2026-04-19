const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dxonu07sc";
const UPLOAD_PRESET = "popular_kitchen";

export const uploadImageToCloudinary = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error("Failed to upload image");
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const getOptimizedUrl = (url, width = 400) => {
  if (!url || url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) return url;

  let finalUrl = url;

  // 1. Handle Google Drive links to make them direct-viewable
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    let fileId = "";
    if (url.includes("/file/d/")) {
      fileId = url.split("/file/d/")[1].split("/")[0].split("?")[0];
    } else if (url.includes("id=")) {
      fileId = url.split("id=")[1].split("&")[0].split("/")[0];
    }
    
    if (fileId) {
      finalUrl = `https://lh3.googleusercontent.com/d/${fileId}=s${width > 1200 ? 1200 : width}`;
    }
  }

  // 2. If it's already a Cloudinary URL — use fast WebP transformation
  if (finalUrl.includes("cloudinary.com")) {
    // Strip any existing transformation to avoid double-transform
    const parts = finalUrl.split("upload/");
    if (parts.length === 2) {
      // Remove any existing transformation segment (starts with f_, q_, w_, etc.)
      const afterUpload = parts[1].replace(/^([a-z_,0-9:]+\/)+/, '');
      return `${parts[0]}upload/f_webp,q_auto:eco,w_${width},c_limit/${afterUpload}`;
    }
    return finalUrl;
  }

  // 3. For all other external URLs — proxy through Cloudinary Fetch for reliability
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_webp,q_auto:eco,w_${width}/${encodeURIComponent(finalUrl)}`;
};
