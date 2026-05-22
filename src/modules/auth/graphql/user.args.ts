import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";


export const getUserArgs = {
    id: { type: new GraphQLNonNull(GraphQLID) }
}
export const createUserArgs = {
    name: { type: new GraphQLNonNull(GraphQLString) }
}