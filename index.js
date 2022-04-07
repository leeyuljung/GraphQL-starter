const { ApolloServer, gql } = require('apollo-server');

// Mock Data
const users = [
    {
        id: 1,
        email: 'yuljung@test.com',
        password: '12345',
        name: 'Yuljung',
        age: 20,
        friendIds: [2, 3]
    },
    {
        id: 2,
        email: 'star@test.com',
        password: '12345',
        name: 'Star',
        age: 25,
        friendIds: [1]
    },
    {
        id: 3,
        email: 'sky@test.com',
        password: '12345',
        name: 'Sky',
        age: 28,
        friendIds: [1]
    }
]

const posts = [
    {
        id: 1,
        authorId: 1,
        title: 'Helloooo',
        body: 'Hello world',
        likeGiverIds: [1, 2],
        createdAt: '2030-12-12T01:40:14.941Z'
    },
    {
        id: 2,
        authorId: 2,
        title: 'Oh my god',
        body: 'Is it good to drink?',
        likeGiverIds: [1],
        createdAt: '2030-12-10T01:38:14.941Z'
    }
]

// Schema
const typeDefs = gql`
    type Query {
        hello: String
        me: User
        users: [User]
        user(name: String!): User
        posts: [Post]
        post(id: ID!): Post
    }

    type User {
        id: ID!
        email: String!
        name: String
        age: Int
        friends: [User]
        posts: [Post]
    }

    type Post {
        id: ID!
        author: User
        title: String
        body: String
        likeGivers: [User]
        createdAt: String
    }
`;

// Resolvers
const resolvers = {
    Query: {
        hello: () => 'world',
        me: () => users.find(user => user.id === 1),
        users: () => users,
        user: (parent, args) => {
            const { name } = args
            return users.find(user => user.name === name)
        },
        posts: () => posts,
        post: (parent, args) => {
            const { id } = args
            return posts.find(post => post.id === Number(id))
        }
    },
    User: {
        friends: (parent) => {
            const { friendIds } = parent
            return users.filter(user => friendIds.includes(user.id))
        },
        posts: (parent) => {
            const { id } = parent
            return posts.filter(post => id === post.authorId)
        }
    },
    Post: {
        author: (parent) => {
            const { authorId } = parent
            return users.find(user => Number(authorId) === user.id)
        },
        likeGivers: (parent) => {
            const { likeGiverIds } = parent
            return users.filter(user => likeGiverIds.includes(user.id))
        }
    }
}

// 初始化 Web Server
const server = new ApolloServer({
    typeDefs,
    resolvers
})

// 啟動 Server
server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})