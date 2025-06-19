import axios from "axios"; // ✅ Ensure Axios is imported

const API_URL = "http://localhost:5000/api/annotations"; // ✅ Ensure correct API URL
const AUTH_URL = "http://localhost:5000/api/auth"; // Auth API URL

// ✅ Fetch annotations for a video
export const getAnnotations = async (videoId) => {
  try {
    const response = await axios.get(`${API_URL}/${videoId}`);

    // ✅ Debugging log to check API response structure
    console.log("🔹 API Response:", JSON.stringify(response.data, null, 2));

    // ✅ Ensure response contains valid annotations & comments
    return {
      annotations: response.data?.annotations || [], // Default to empty array if missing
      comments: response.data?.comments || {}, // Default to empty object if missing
    };
  } catch (error) {
    console.error("❌ Error fetching annotations:", error);
    return { annotations: [], comments: {} }; // ✅ Prevent errors if request fails
  }
};

// ✅ Save annotations & comments with userId
export const saveAnnotations = async (videoId, annotations, comments, userId) => {
  try {
    // ✅ Ensure JSON serialization before sending to API
    const formattedComments = JSON.parse(JSON.stringify(comments));

    const requestData = {
      videoId,
      userId, // Add the user ID to track who created the annotation
      annotations,
      comments: formattedComments,
    };

    console.log("🔹 Sending data to server:", JSON.stringify(requestData, null, 2));

    const response = await axios.post(API_URL, requestData);
    return response.data;
  } catch (error) {
    console.error("❌ API ERROR:", error);
    throw error;
  }
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${AUTH_URL}/reset-password-request`, { email });
    return response.data;
  } catch (error) {
    console.error("❌ Error requesting password reset:", error);
    throw error;
  }
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${AUTH_URL}/reset-password`, { token, newPassword });
    return response.data;
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    throw error;
  }
};