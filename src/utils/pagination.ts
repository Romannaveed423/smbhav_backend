import { SortOrder } from "mongoose";

export const getPagination = (query: any) => {
  const page = Math.max(parseInt(query.page as string) || 1, 1);
  const limit = Math.min(parseInt(query.limit as string) || 10, 100);
  const skip = (page - 1) * limit;

  const sortBy = (query.sortBy as string) || 'createdAt';
  const order: SortOrder = query.order === 'asc' ? 1 : -1;

  const sort: { [key: string]: SortOrder } = {
    [sortBy]: order,
  };

  return {
    page,
    limit,
    skip,
    sort,
  };
};
