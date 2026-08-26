import { resourceService } from '../../services/resource.service';

export const resourceResolvers = {
  Query: {
    resources: () => resourceService.getResources(),
    resource: (_: any, { id }: { id: string }) => resourceService.getResourceById(id),
  },
  Mutation: {
    createResource: (_: any, { input }: { input: { name: string; capacity: number } }) => 
      resourceService.createResource(input),
  }
};
