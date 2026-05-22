"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserArgs = exports.getUserArgs = void 0;
const graphql_1 = require("graphql");
exports.getUserArgs = {
    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) }
};
exports.createUserArgs = {
    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) }
};
