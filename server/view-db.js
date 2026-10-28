const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/signup_lab";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log("================================================================================");
    console.log("                           MONGODB SHELL (mongosh)                              ");
    console.log("================================================================================");
    console.log("Connecting to: " + uri);
    console.log("Current Database: signup_lab");
    console.log("");
    console.log("signup_lab> show collections");
    console.log("users");
    console.log("");
    console.log("signup_lab> db.users.find().pretty()");
    
    const users = await User.find({}).lean();
    if (users.length === 0) {
      console.log("(No documents found in 'users' collection. Please sign up first at http://localhost:3000)");
    } else {
      console.log(JSON.stringify(users, null, 2));
      console.log(`\n[Found ${users.length} document(s) in 'users' collection]`);
    }
    console.log("================================================================================");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();
