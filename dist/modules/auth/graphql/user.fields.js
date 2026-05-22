"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFields = void 0;
const graphql_1 = require("graphql");
const global_error_handling_1 = require("../../../common/utils/global-error-handling");
const user_type_1 = require("./user.type");
const user_args_1 = require("./user.args");
const user_service_1 = __importDefault(require("../user.service"));
const authentication_1 = require("../../../common/middleware/authentication");
const authorization_1 = require("../../../common/middleware/authorization");
let idCounter = user_type_1.users.length + 1;
class UserFields {
    constructor() { }
    query = () => {
        return {
            getUser: {
                type: user_type_1.userType,
                resolve: async (parent, args, context) => {
                    const { user, decoded } = await (0, authentication_1.authentication_gql)(context.req.headers.authorization);
                    await (0, authorization_1.authorization_GQL)(["admin"], user.role);
                    return user_service_1.default.getUser(user._id);
                }
            },
            listUsers: {
                type: new graphql_1.GraphQLList(user_type_1.userType),
                resolve: (parent, args, context) => {
                    return user_service_1.default.getUsers();
                }
            }
        };
    };
    mutation = () => {
        return {
            addUser: {
                type: user_type_1.userType,
                args: user_args_1.createUserArgs,
                resolve: (_, args) => {
                    const newUser = {
                        id: idCounter++,
                        name: args.name
                    };
                    user_type_1.users.push(newUser);
                    console.log("User Added:", newUser);
                    return newUser;
                }
            },
            updateUser: {
                type: user_type_1.userType,
                args: {
                    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
                    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) }
                },
                resolve: (_, args) => {
                    const user = user_type_1.users.find(user => user.id === args.id);
                    if (!user) {
                        throw new global_error_handling_1.AppError("User not found");
                    }
                    user.name = args.name;
                    return user;
                }
            },
            deleteUser: {
                type: user_type_1.userType,
                args: {
                    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) }
                },
                resolve: (_, args) => {
                    const userIndex = user_type_1.users.findIndex(user => user.id === args.id);
                    if (userIndex === -1) {
                        throw new Error("User not found");
                    }
                    const deletedUser = user_type_1.users[userIndex];
                    user_type_1.users.splice(userIndex, 1);
                    return deletedUser;
                }
            }
        };
    };
}
exports.UserFields = UserFields;
exports.default = new UserFields();
