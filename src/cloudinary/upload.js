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

export const getOptimizedUrl = (url, width = 600) => {
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
      // Use LH3 for better reliability
      finalUrl = `https://lh3.googleusercontent.com/d/${fileId}=s${width > 1200 ? 1200 : width}`;
    }
  }

  // 2. If it's already a Cloudinary URL, use standard transformation
  if (finalUrl.includes("cloudinary.com")) {
    const parts = finalUrl.split("upload/");
    if (parts.length === 2) {
      return `${parts[0]}upload/f_auto,q_auto:best,w_${width}/${parts[1]}`;
    }
    return finalUrl;
  }

  // 3. For ALL external URLs (Google Drive, Imgur, etc.), use Cloudinary Fetch!
  // This proxies the image, optimizes it, and ensures it loads reliably.
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_auto,q_auto,w_${width}/${encodeURIComponent(finalUrl)}`;
};
