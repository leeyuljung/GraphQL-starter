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
        content: 'Hello world',
        likeGiverIds: [1, 2],
        createdAt: '2030-12-12T01:40:14.941Z'
    },
    {
        id: 2,
        authorId: 2,
        title: 'Oh my god',
        content: 'Is it good to drink?',
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
        content: String
        likeGivers: [User]
        createdAt: String
    }

    input UpdateMyInfoInput {
        name: String
        age: Int
    }

    input AddPostInput {
        title: String!
        content: String
    }

    type Mutation {
        updateMyInfo(input: UpdateMyInfoInput!): User
        addFriend(userId: ID!): User
        addPost(input: AddPostInput!): Post
        likePost(postId: ID!): Post
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
    },
    Mutation: {
        updateMyInfo: (parent, args) => {
            const { input } = args
            const { name, age } = input
            // 過濾空值
            const data = Object.keys(input)
                               .filter(key => input[key] !== null && input[key] !== undefined)
                               .reduce((acc, key) => ({...acc, [key]: input[key]}), {})
            // 取得我的資料
            const myInfo = users.find(user => user.id === 1)
            // 複製我原本的資料，並更新成新的 data
            const newMyInfo = Object.assign(myInfo, data)
            // 最後回傳更新後的資料
            return newMyInfo
        },
        addFriend: (parent, args) => {
            const { userId } = args
            const me = users.find(user => user.id === 1)
            // 若我的朋友名單中已經包含該 userId，則拋出錯誤
            if(me.friendIds.includes(userId)) throw new Error(`User ${userId} has already been my friend.`)

            // 取得該 userId 的資料
            const friend = users.find(user => user.id === Number(userId))
            // 取得我的資料
            const myInfo = users.find(user => user.id === 1)
            // 我的新朋友名單
            const newMyFriendIds = {friendIds: me.friendIds.concat(userId)}
            // 更新我的資料
            const newMe = Object.assign(myInfo, newMyFriendIds)
            // 更新朋友的新朋友名單(加上我)
            Object.assign(friend, {friendIds: friend.friendIds.concat(1)})

            return newMe
        },
        addPost: (parent, args) => {
            const { input } = args
            const { title, content } = input
            const newPost = {
                id: posts[posts.length - 1].id + 1,
                authorId: 1,
                title,
                content,
                likeGiverIds: [],
                createdAt: new Date().toISOString()
            }
            // 將新貼文加入 posts
            posts[posts.length] = newPost
            return newPost
        },
        likePost: (parent, args) => {
            const { postId } = args
            // 取得該 postId 的貼文
            const post = posts.find(post => post.id === Number(postId))
            // 若沒有此貼文，則拋出錯誤
            if(!post) throw new Error(`Post ${postId} Not Exists`)

            // 如果沒按過喜歡，就將我的 userId 加入 likeGiverIds 陣列中
            if(!post.likeGiverIds.includes(1)){
                const updatePost = Object.assign(post, {likeGiverIds: post.likeGiverIds.concat(1)})
                return updatePost
            }
            return post
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