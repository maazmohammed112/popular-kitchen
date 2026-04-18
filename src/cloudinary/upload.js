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
  if (!url || !url.includes("cloudinary.com")) return url;
  
  // Insert transformation parameters before the version number or public ID
  const parts = url.split("upload/");
  if (parts.length === 2) {
    return `${parts[0]}upload/f_auto,q_auto:best,w_${width}/${parts[1]}`;
  }
  return url;
};
