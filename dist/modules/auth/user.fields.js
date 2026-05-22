"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFields = void 0;
const graphql_1 = require("graphql");
const global_error_handling_1 = require("../../common/utils/global-error-handling");
const users = [
    { id: 1, name: "Ahmed" },
    { id: 2, name: "Fakhr" },
    { id: 3, name: "Ali" },
];
let idCounter = users.length + 1;
const userType = new graphql_1.GraphQLObjectType({
    name: "User",
    description: "User type",
    fields: {
        id: { type: graphql_1.GraphQLInt },
        name: { type: graphql_1.GraphQLString }
    }
});
class UserFields {
    constructor() { }
    query = () => {
        return {
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
        };
    };
    mutation = () => {
        return {
            addUser: {
                type: userType,
                args: {
                    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) }
                },
                resolve: (_, args) => {
                    const newUser = {
                        id: idCounter++,
                        name: args.name
                    };
                    users.push(newUser);
                    console.log("User Added:", newUser);
                    return newUser;
                }
            },
            updateUser: {
                type: userType,
                args: {
                    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
                    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) }
                },
                resolve: (_, args) => {
                    const user = users.find(user => user.id === args.id);
                    if (!user) {
                        throw new global_error_handling_1.AppError("User not found");
                    }
                    user.name = args.name;
                    return user;
                }
            },
            deleteUser: {
                type: userType,
                args: {
                    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) }
                },
                resolve: (_, args) => {
                    const userIndex = users.findIndex(user => user.id === args.id);
                    if (userIndex === -1) {
                        throw new Error("User not found");
                    }
                    const deletedUser = users[userIndex];
                    users.splice(userIndex, 1);
                    return deletedUser;
                }
            }
        };
    };
}
exports.UserFields = UserFields;
exports.default = new UserFields();
