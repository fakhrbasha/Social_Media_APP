import { GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { AppError } from "../../../common/utils/global-error-handling";
import { users, userType } from "./user.type";
import { createUserArgs, getUserArgs } from "./user.args";
import userService from "../user.service";
import { authentication_gql } from "../../../common/middleware/authentication";
import { authorization_GQL } from "../../../common/middleware/authorization";
import { validation_gql } from "../../../common/middleware/validation";
import { getUSerSchema } from "../user.validation";


let idCounter = users.length + 1;



export class UserFields {

    constructor() { }

    query = () => {
        return {
            getUser: {
                type: userType,
                // args: getUserArgs,
                resolve: async (parent: any, args: any, context: any) => {
                    // authentication
                    // console.log({ context }) contain objects
                    // console.log({
                    //     raw: context.req.req, // contain data od user
                    //     headers: context.req.headers
                    // })
                    const { user, decoded } = await authentication_gql(context.req.headers.authorization!)
                    // await validation_gql(getUSerSchema, token)
                    await authorization_GQL(["admin"], user.role)
                    return userService.getUser(user._id)
                }
            },
            listUsers: {
                type: new GraphQLList(userType),
                resolve: (parent: any, args: any, context: any) => {
                    // console.log({ context })
                    // console.log({
                    //     raw: context.req.raw, // contain data od user
                    //     headers: context.req.headers
                    // })
                    // console.log(
                    //     context.req.raw
                    // );


                    return userService.getUsers()
                }
            }
        }
    }

    mutation = () => {
        return {
            addUser: {
                type: userType,

                args: createUserArgs,

                resolve: (_: any, args: any) => {

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
                    id: { type: new GraphQLNonNull(GraphQLInt) },
                    name: { type: new GraphQLNonNull(GraphQLString) }
                },

                resolve: (_: any, args: any) => {

                    const user = users.find(user => user.id === args.id);

                    if (!user) {
                        throw new AppError("User not found");
                    }

                    user.name = args.name;

                    return user;
                }
            },

            deleteUser: {
                type: userType,

                args: {
                    id: { type: new GraphQLNonNull(GraphQLInt) }
                },

                resolve: (_: any, args: any) => {

                    const userIndex = users.findIndex(
                        user => user.id === args.id
                    );

                    if (userIndex === -1) {
                        throw new Error("User not found");
                    }

                    const deletedUser = users[userIndex];

                    users.splice(userIndex, 1);

                    return deletedUser;
                }
            }
        }
    }


}
export default new UserFields()