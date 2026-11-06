import { queryOptions } from '@tanstack/react-query';
import { listStaff } from './service';

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const
};

export const staffListQueryOptions = () => {
  return queryOptions({
    queryKey: staffKeys.lists(),
    queryFn: () => listStaff()
  });
};
