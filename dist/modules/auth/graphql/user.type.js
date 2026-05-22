"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userType = exports.users = void 0;
const graphql_1 = require("graphql");
exports.users = [
    { id: 1, name: "Ahmed" },
    { id: 2, name: "Fakhr" },
    { id: 3, name: "Ali" },
];
exports.userType = new graphql_1.GraphQLObjectType({
    name: "User",
    description: "User type",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        firstName: { type: graphql_1.GraphQLString },
        lastName: { type: graphql_1.GraphQLString },
        username: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        age: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        address: { type: graphql_1.GraphQLString },
        password: { type: graphql_1.GraphQLString },
        role: { type: graphql_1.GraphQLString },
        confirmed: { type: graphql_1.GraphQLString },
        gender: { type: graphql_1.GraphQLString },
    }
});
