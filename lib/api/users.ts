import { api } from "@/lib/api/client";
import type { Id, OkResponse, RolePermissions, User, UserRole } from "@/lib/api/types";

// Users and roles
export const getPermissions = () =>
  api
    .get<RolePermissions>("/users-permissions/permissions")
    .then(({ data }) => data);
export const listRoles = () =>
  api
    .get<{ roles: UserRole[] }>("/users-permissions/roles")
    .then(({ data }) => data);
export const createRole = (data: {
  name: string;
  description?: string;
  type?: string;
  permissions?: RolePermissions;
}) =>
  api
    .post<UserRole>("/users-permissions/roles", data)
    .then(({ data: response }) => response);
export const getRole = (id: Id) =>
  api.get<UserRole>(`/users-permissions/roles/${id}`).then(({ data }) => data);
export const updateRole = (
  id: Id,
  data: {
    name?: string;
    description?: string;
    type?: string;
    permissions?: RolePermissions;
  },
) =>
  api
    .put<OkResponse>(`/users-permissions/roles/${id}`, data)
    .then(({ data: response }) => response);
export const deleteRole = (id: Id) =>
  api
    .delete<OkResponse>(`/users-permissions/roles/${id}`)
    .then(({ data }) => data);
export const listUsers = () =>
  api.get<User[]>("/users").then(({ data }) => data);
export const createUser = (data: {
  username: string;
  email: string;
  password: string;
}) => api.post<User>("/users", data).then(({ data: response }) => response);
export const getUser = (id: Id) =>
  api.get<User>(`/users/${id}`).then(({ data }) => data);
export const updateUser = (
  id: Id,
  data: Partial<User> & { password?: string; role?: Id },
) => api.put<User>(`/users/${id}`, data).then(({ data: response }) => response);
export const deleteUser = (id: Id) =>
  api.delete<User>(`/users/${id}`).then(({ data }) => data);
export const getCurrentUser = () =>
  api.get<User>("/users/me").then(({ data }) => data);
export const countUsers = () =>
  api.get<number>("/users/count").then(({ data }) => data);
