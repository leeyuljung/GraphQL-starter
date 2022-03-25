const { ApolloServer, gql } = require('apollo-server');

// GraphQL Schema 定義
const typeDefs = gql`
    type Query {
        "A simple type for getting started!"
        hello: String
    }
`;

// Resolvers
const resolvers = {
    Query: {
        hello: () => 'world'
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