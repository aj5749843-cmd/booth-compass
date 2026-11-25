// Firebase project settings.
// 1. Create a Firebase project, register a Web app and paste its config below.
// 2. In the console enable "Firebase AI Logic" with the Gemini Developer API.
// 3. Enable App Check with reCAPTCHA Enterprise and paste the site key below.
// While apiKey is empty the app runs in SIMULATION mode (no real AI calls),
// so the interface can be explored without any setup.
export const firebaseConfig = {
  apiKey: "AIzaSyDTbCb9lqTogpf6vCUXqywtZwx_DCri6V8",
  authDomain: "booth-compass.firebaseapp.com",
  projectId: "booth-compass",
  storageBucket: "booth-compass.firebasestorage.app",
  messagingSenderId: "18779353645",
  appId: "1:18779353645:web:5a743fe61b50f358a1fea4",
};

export const recaptchaEnterpriseSiteKey = "6Ld1JjIuAAAAAB3kuiOjpBBvjRrIp0x9eo8P4YMQ";

// Cloud model used for the one-time "expo pack" build and as fallback.
export const CLOUD_MODEL = "gemini-3.5-flash-lite";
