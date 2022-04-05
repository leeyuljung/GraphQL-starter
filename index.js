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

const posts = [
    {
        id: 1,
        authorId: 1,
        title: 'Hello World',
        content: 'Hello World yeah',
        likeGiverIds: [2]
    },
    {
        id: 2,
        authorId: 2,
        title: 'Good Night',
        content: 'Gonna go to sleep',
        likeGiverIds: [2, 3]
    },
    {
        id: 3,
        authorId: 1,
        title: 'Hungry moment',
        content: 'I want eating lots of hamburgers',
        likeGiverIds: []
    }
]

// GraphQL Schema 定義
const typeDefs = gql`
    type Query {
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
        "貼文"
        posts: [Post]
    }

    """
    貼文
    """
    type Post {
        "識別碼"
        id: ID!
        "作者"
        author: User
        "標題"
        title: String
        "內容"
        content: String
        "按讚者"
        likeGivers: [User]
    }
`;

// Resolvers
const resolvers = {
    Query: {
        users: () => users,
        user: (parent, args) => {
            const {name} = args
            return users.find(user => user.name === name)
        }
    },
    User: {
        friends: (parent) => {
            // 從 users 中找出 id 符合 friendIds 的 users
            const {friendIds} = parent
            return users.filter(user => friendIds.includes(user.id))
        },
        posts: (parent) => {
            // 找出該使用者的所有 posts，所以從所有貼文過濾出 authorId 為 user.id 的貼文
            const {id} = parent
            return posts.filter(post => post.authorId === id)
        }
    },
    Post: {
        author: (parent) => {
            // 從 users 中找出 id 符合貼文中的 authorId 的 user
            const {authorId} = parent
            return users.find(user => user.id === authorId)
        },
        likeGivers: (parent) => {
            // 從 users 中找出 id 符合 likeGiverIds 的 users
            const {likeGiverIds} = parent
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