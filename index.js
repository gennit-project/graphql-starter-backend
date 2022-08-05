const { Neo4jGraphQL } = require("@neo4j/graphql");
const { ApolloServer, gql } = require("apollo-server");

require('dotenv').config();
const neo4j = require("neo4j-driver");
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(
  "neo4j://localhost:7687",
  neo4j.auth.basic("neo4j", password)
);

const typeDefs = gql`

    type Post {
    id:                    ID! @id
    title:                 String!
    description:           String
    CommentSections:       [CommentSection!] @relationship(type: "HAS_COMMENTS_IN", direction: OUT)
    Poster:                User!             @relationship(type: "POSTED_BY", direction: OUT)
    updatedAt:             DateTime          @timestamp(operations: [UPDATE])
    createdAt:             DateTime!         @timestamp(operations: [CREATE])
    deleted:               Boolean
    Tags:                  [Tag]             @relationship(type: "HAS_TAG", direction: OUT)
  }

  type User {
    username:                String! @unique
    Comments:                [Comment!]           @relationship(type: "AUTHORED_COMMENT", direction: OUT)
    Posts:                   [Post!]             @relationship(type: "POSTED_BY", direction: IN)
    createdAt:               DateTime!            @timestamp(operations: [CREATE])
    deleted:                 Boolean
  }
  
  type CommentSection {
    id:                       ID! @id
    Comments:                 [Comment]               @relationship(type: "CONTAINS_COMMENT", direction: OUT)
    Post:                     Post           @relationship(type: "HAS_COMMENTS_IN", direction: IN)
  }
  
  type Comment {
    id:                      ID! @id
    CommentAuthor:           User                    @relationship(type: "AUTHORED_COMMENT", direction: IN)
    CommentSection:          CommentSection          @relationship(type: "CONTAINS_COMMENT", direction: IN)
    ParentComment:           Comment                 @relationship(type: "IS_REPLY_TO", direction: OUT)
    text:                    String
    isRootComment:           Boolean!
    ChildComments:           [Comment]               @relationship(type: "IS_REPLY_TO", direction: IN)
    deleted:                 Boolean
    updatedAt:               DateTime               @timestamp(operations: [UPDATE])
    createdAt:               DateTime!               @timestamp(operations: [CREATE])
    Tags:                    [Tag]                   @relationship(type: "HAS_TAG", direction: OUT)
  }

  type Tag {
    text:                  String! @unique
    Posts:                [Post]                 @relationship(type: "HAS_TAG", direction: IN)
    Comments:              [Comment]               @relationship(type: "HAS_TAG", direction: IN)
  }
`;

const neoSchema = new Neo4jGraphQL({ typeDefs, driver, config: { enableRegex: true } });

neoSchema.assertIndexesAndConstraints({ options: { create: true } })
  .then(() => {
    const server = new ApolloServer({
      schema: neoSchema.schema,
    });

    server.listen().then(({ url }) => {
      console.log(`🚀 Server ready at ${url}`);
    });
  })
  .catch(e => {
    throw new Error(e);
  })
