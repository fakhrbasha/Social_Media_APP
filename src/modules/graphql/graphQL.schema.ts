import { GraphQLObjectType, GraphQLSchema } from "graphql";
import UserFields from "../auth/graphql/user.fields";


export const gql_schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        // name disc fields
        name: "RootQueryType",
        description: "Root Query",

        fields: {
            // endpoint name 
            // hello: {
            //     // type and resolve function to return 
            //     type: GraphQLString,
            //     resolve: () => {
            //         return "Hello World!"
            //     }
            // }
            ...UserFields.query()
        }
    }),
    mutation: new GraphQLObjectType({
        name: "Mutation",

        fields: {
            ...UserFields.mutation()


        }
    })


})