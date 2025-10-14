import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface Database {
  user: UserTable;
}

export interface UserTable {
  id: Generated<string>;

  created_at: ColumnType<Date, string, never>;
  updated_at: ColumnType<Date, string, string>;

  email: string;
  password: string;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UpdateUser = Updateable<UserTable>;
