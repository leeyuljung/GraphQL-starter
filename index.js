const { ApolloServer, gql } = require('apollo-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 定義加密所需次數
const SALT_ROUNDS = 2
// 定義 jwt 的 secret
const SECRET = 'this_is_a_secret'

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
        signUp(name: String, email: String!, password: String!): User
        login(email: String!, password: String!): Token
    }

    type Token {
        token: String!
    }
`;

// Resolvers
const resolvers = {
    Query: {
        hello: () => 'world',
        me: (parent, args, { me }) => {
            if(!me) throw new Error('Please log in first')
            return users.find(user => user.id === me.id)
        },
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
        updateMyInfo: (parent, args, { me }) => {
            if(!me) throw new Error('Please log in first')
            const { input } = args
            const { name, age } = input
            // 過濾空值
            const data = Object.keys(input)
                               .filter(key => input[key] !== null && input[key] !== undefined)
                               .reduce((acc, key) => ({...acc, [key]: input[key]}), {})
            // 取得我的資料
            const myInfo = users.find(user => user.id === me.id)
            // 複製我原本的資料，並更新成新的 data
            const newMyInfo = Object.assign(myInfo, data)
            // 最後回傳更新後的資料
            return newMyInfo
        },
        addFriend: (parent, args, { me: { id: meId } }) => {
            if(!me) throw new Error('Please log in first')
            const { userId } = args
            const me = users.find(user => user.id === meId)
            // 若我的朋友名單中已經包含該 userId，則拋出錯誤
            if(me.friendIds.includes(userId)) throw new Error(`User ${userId} has already been my friend.`)

            // 取得該 userId 的資料
            const friend = users.find(user => user.id === Number(userId))
            // 取得我的資料
            const myInfo = users.find(user => user.id === meId)
            // 我的新朋友名單
            const newMyFriendIds = {friendIds: me.friendIds.concat(userId)}
            // 更新我的資料
            const newMe = Object.assign(myInfo, newMyFriendIds)
            // 更新朋友的新朋友名單(加上我)
            Object.assign(friend, {friendIds: friend.friendIds.concat(meId)})

            return newMe
        },
        addPost: (parent, args, { me }) => {
            if(!me) throw new Error('Please log in first')
            const { input } = args
            const { title, content } = input
            const newPost = {
                id: posts[posts.length - 1].id + 1,
                authorId: me.id,
                title,
                content,
                likeGiverIds: [],
                createdAt: new Date().toISOString()
            }
            // 將新貼文加入 posts
            posts[posts.length] = newPost
            return newPost
        },
        likePost: (parent, args, { me }) => {
            if(!me) throw new Error('Please log in first')
            const { postId } = args
            // 取得該 postId 的貼文
            const post = posts.find(post => post.id === Number(postId))
            // 若沒有此貼文，則拋出錯誤
            if(!post) throw new Error(`Post ${postId} Not Exists`)

            // 如果沒按過喜歡，就將我的 userId 加入 likeGiverIds 陣列中
            if(!post.likeGiverIds.includes(me.id)){
                const updatePost = Object.assign(post, {likeGiverIds: post.likeGiverIds.concat(me.id)})
                return updatePost
            }
            return post
        },
        signUp: async (parent, args) => {
            const { name, email, password } = args
            // 檢查是否有重複註冊的 Email，只要有其中一個重複了，便會回傳 true，然後拋出錯誤
            const isUserEmailDuplicate = users.some(user => user.email === email)
            if(isUserEmailDuplicate) throw new Error('This user email has already been used.')

            // 將密碼加密
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
            // 建立新 User Data，並存入加密後的密碼
            const newUser = {
                id: users[users.length - 1].id + 1,
                name,
                email,
                password: hashedPassword
            }
            // 更新 users 名單，加入新註冊的 user
            users[users.length] = newUser

            return newUser
        },
        login: async (parent, args) => {
            const { email, password } = args
            // 從 users 中找到符合 email 的 user，若無則拋出錯誤
            const user = users.find(user => user.email === email)
            if (!user) throw new Error('Email account not exists')

            // 將傳進來的 password 和存在資料中的密碼做比對，若密碼不符則拋出錯誤
            const passwordIsValid = await bcrypt.compare(password, user.password)
            if(!passwordIsValid) throw new Error('Wrong password')

            // 建立 Token
            const createToken = ({ id, email, name }) => jwt.sign({id, email, name}, SECRET, { expiresIn: '1d' }) 
            // 登入成功則回傳 Token
            return { token: await createToken(user) }
        }
    }
}

// 初始化 Web Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({req}) => {
        const token = req.headers['x-token']
        if(token) {
            try {
                const me = await jwt.verify(token, SECRET)
                return { me }
            } catch (e){
                throw new Error('Your session expired. Sign in again.')
            }
        }
        return {}
    }
})

// 啟動 Server
server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})