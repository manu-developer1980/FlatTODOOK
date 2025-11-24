import webpush from "web-push";

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log("Generated VAPID Keys:");
console.log("Public Key:", vapidKeys.publicKey);
console.log("Private Key:", vapidKeys.privateKey);
console.log("\nAdd these to your .env file:");
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
