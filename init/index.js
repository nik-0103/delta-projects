const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const initData = require("./data.js");
const User = require("../models/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});

    const user = await User.findOne({ username: "delta-student" });

    if (!user) {
        console.log("delta-student user not found. Please signup first.");
        return;
    }

    console.log("Owner:", user.username);
    console.log("Owner ID:", user._id);

    initData.data = initData.data.map((obj) => ({
        ...obj,
        owner: user._id,
    }));

    await Listing.insertMany(initData.data);

    console.log("data was initialized");
};

initDB();