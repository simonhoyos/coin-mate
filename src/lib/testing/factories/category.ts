import { Category } from '@/models/category';

export function createCategoryFactory(overrides: Partial<Category> = {}): Category {
  const id = crypto.randomUUID();
  return {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: `Category ${id.slice(0, 4)}`,
    description: 'Test category description',
    user_id: crypto.randomUUID(),
    ...overrides,
  } as Category;
}
