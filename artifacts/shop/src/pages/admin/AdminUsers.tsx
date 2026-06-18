import { useListUsers, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { UserUpdateRole } from "@workspace/api-client-react";

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground uppercase tracking-widest text-sm">Loading Users...</div>;
  }

  const handleRoleChange = (id: number, role: string) => {
    updateUser.mutate(
      { id, data: { role: role as UserUpdateRole } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          toast({ title: "Role updated" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Users</h1>

      <div className="border border-border/40 bg-secondary/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 bg-secondary/20">
              <tr>
                <th className="px-4 py-4 font-normal">ID</th>
                <th className="px-4 py-4 font-normal">Name</th>
                <th className="px-4 py-4 font-normal">Email</th>
                <th className="px-4 py-4 font-normal">Joined</th>
                <th className="px-4 py-4 font-normal w-40">Role</th>
              </tr>
            </thead>
            <tbody>
              {users && users.length > 0 ? users.map(user => (
                <tr key={user.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-4 font-mono font-bold text-muted-foreground">{user.id}</td>
                  <td className="px-4 py-4 font-bold">{user.name}</td>
                  <td className="px-4 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-4 text-muted-foreground">{format(new Date(user.createdAt), "MMM dd, yyyy")}</td>
                  <td className="px-4 py-3">
                    <Select defaultValue={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                      <SelectTrigger className="h-8 rounded-none border-border/40 text-xs uppercase tracking-wider font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-border/40">
                        <SelectItem value="user" className="text-xs uppercase tracking-wider">User</SelectItem>
                        <SelectItem value="staff" className="text-xs uppercase tracking-wider">Staff</SelectItem>
                        <SelectItem value="admin" className="text-xs uppercase tracking-wider font-bold text-primary">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
