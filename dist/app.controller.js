"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const config_service_1 = require("./config/config.service");
const global_error_handling_1 = require("./common/utils/global-error-handling");
const user_controller_1 = __importDefault(require("./modules/auth/user.controller"));
const connectionDB_1 = require("./DB/connectionDB");
const redis_service_1 = __importDefault(require("./common/services/redis.service"));
const notification_controller_1 = __importDefault(require("./modules/notifications/notification.controller"));
const post_controller_1 = __importDefault(require("./modules/posts/post.controller"));
const graphql_1 = require("graphql");
const express_2 = require("graphql-http/lib/use/express");
const app = (0, express_1.default)();
const port = Number(config_service_1.PORT);
const bootstrap = () => {
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests, please try again later.",
        handler: (req, res, next) => {
            throw new global_error_handling_1.AppError("Too many requests, please try again later.", 429);
        },
        legacyHeaders: false,
    });
    app.use(express_1.default.json());
    async function test() {
    }
    test();
    (0, connectionDB_1.checkConnection)();
    redis_service_1.default.connect();
    app.use((0, cors_1.default)(), (0, helmet_1.default)(), limiter);
    const users = [
        { id: 1, name: "Ahmed" },
        { id: 2, name: "Fakhr" },
        { id: 3, name: "Ali" },
    ];
    const userType = new graphql_1.GraphQLObjectType({
        name: "User",
        description: "User type",
        fields: {
            id: { type: graphql_1.GraphQLInt },
            name: { type: graphql_1.GraphQLString }
        }
    });
    const schema = new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({
            name: "RootQueryType",
            description: "Root Query",
            fields: {
                getUser: {
                    type: userType,
                    args: { name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) } },
                    resolve: (parent, args) => {
                        return users.find(user => user.name === args.name);
                    }
                },
                listUsers: {
                    type: new graphql_1.GraphQLList(userType),
                    resolve: () => {
                        return users;
                    }
                }
            }
        })
    });
    app.use('/graphql', (0, express_2.createHandler)({ schema }));
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Welcome to the Social App API!" });
    });
    app.use("/auth", user_controller_1.default);
    app.use("/notifications", notification_controller_1.default);
    app.use("/posts", post_controller_1.default);
    app.use("{/*demo}", (req, res, next) => {
        throw new global_error_handling_1.AppError(`Invalid URL ${req.originalUrl} with method ${req.method} not found`, 404);
    });
    app.use(global_error_handling_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};
exports.default = bootstrap;
