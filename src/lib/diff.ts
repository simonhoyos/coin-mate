import { isEqual, isObject, transform } from 'lodash';

export function getObjectDiff(
  base: Record<string, unknown>,
  object: Record<string, unknown>,
) {
  return transform<Record<string, unknown>, Record<string, unknown>>(
    object,
    (result, value, key) => {
      if (!isEqual(value, base[key])) {
        result[key] =
          isObject(value) && isObject(base[key])
            ? getObjectDiff(
                base[key] as Record<string, unknown>,
                value as Record<string, unknown>,
              )
            : value;
      }
    },
    {},
  );
}
