import { mergeResolvers } from '@graphql-tools/merge';
import { resourceResolvers } from './resource.resolver';
import { bookingResolvers } from './booking.resolver';
import { GraphQLScalarType, Kind } from 'graphql';

const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date(value).toISOString();
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const rootResolvers = {
  DateTime: dateTimeScalar,
};

export const resolvers = mergeResolvers([rootResolvers, resourceResolvers, bookingResolvers]);
