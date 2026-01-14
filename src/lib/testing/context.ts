import { createContextInner } from '../context';

export async function createTestContext() {
  const innerContext = await createContextInner();

  return {
    ...innerContext,

    user: null,
  };
}
