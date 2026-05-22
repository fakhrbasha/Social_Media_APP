import { GraphQLID, GraphQLInt, GraphQLObjectType, GraphQLString } from "graphql"

export const users = [
    { id: 1, name: "Ahmed" },
    { id: 2, name: "Fakhr" },
    { id: 3, name: "Ali" },
]
export const userType = new GraphQLObjectType({
    name: "User",
    description: "User type",
    fields: {
        _id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        age: { type: GraphQLString },
        phone: { type: GraphQLString },
        address: { type: GraphQLString },
        password: { type: GraphQLString },
        role: { type: GraphQLString },
        confirmed: { type: GraphQLString },
        gender: { type: GraphQLString },
    }
})