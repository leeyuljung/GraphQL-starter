const { ApolloServer, gql } = require('apollo-server');

const users = [
    {
        id: 1,
        name: 'Yuljung',
        age: 25,
        height: 160,
        weight: 45,
        friendIds: [2, 3]
    },
    {
        id: 2,
        name: 'Panda',
        age: 16,
        height: 100,
        weight: 80,
        friendIds: [1]
    },
    {
        id: 3,
        name: 'Uber',
        age: 33,
        height: 180,
        weight: 65,
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
        "取得特定使用者"
        user(name: String!): User
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
        "身高"
        height(unit: HeightUnit = CM): Float
        "體重"
        weight(unit: WeightUnit = G): Float
    }

    """
    高度單位
    """
    enum HeightUnit {
        "公分"
        CM
        "公尺"
        M
    }

    """
    重量單位
    """
    enum WeightUnit {
        "公斤"
        KG
        "克"
        G
    }
    
`;

// Resolvers
const resolvers = {
    Query: {
        hello: () => 'world',
        me: () => users[0],
        users: () => users,
        user: (root, args, context) => {
            const {name} = args
            return users.find(user => user.name === name)
        }
    },
    User: {
        friends: (parent, args, context) => {
            const {friendIds} = parent
            return users.filter(user => friendIds.includes(user.id))
        },
        height: (parent, args) => {
            const {unit} = args
            if (unit === 'CM') return parent.height
            else if (unit === 'M') return parent.height / 100
        },
        weight: (parent, args, context) => {
            const {unit} = args
            if (unit === 'KG') return parent.weight
            else if (unit === 'G') return parent.weight * 1000
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