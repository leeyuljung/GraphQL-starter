const { ApolloServer, gql } = require('apollo-server');

const users = [
    {
        id: 1,
        name: 'Yuljung',
        age: 25,
        friendIds: [2, 3]
    },
    {
        id: 2,
        name: 'Panda',
        age: 16,
        friendIds: [1]
    },
    {
        id: 3,
        name: 'Uber',
        age: 33,
        friendIds: [1]
    }
]

// GraphQL Schema 定義
const typeDefs = gql`
    type Query {
        hello: String
        "取得當前使用者"
        me: User
        "取得所有使用者"
        users: [User]
    }

    """
    使用者資訊
    """
    type User {
        "識別碼"
        id: ID
        "名字"
        name: String
        "年齡"
        age: Int
        "好友"
        friends: [User]
    }
`;

// Resolvers
const resolvers = {
    Query: {
        hello: () => 'world',
        me: () => users[0],
        users: () => users
    },
    User: {
        friends: (parent, args, context) => {
            const {friendIds} = parent
            return users.filter(user => friendIds.includes(user.id))
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