"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_service_1 = require("../config/config.service");
const checkConnection = async () => {
    try {
        await mongoose_1.default.connect(config_service_1.MONGO_URI);
        console.log(`Connected to MongoDB successfully at ${config_service_1.MONGO_URI}`);
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};
exports.checkConnection = checkConnection;
