import { useGetMe, useGetUserAddresses, getGetUserAddressesQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user, logout } = useAuth();
  
  const { data: addresses, isLoading: isAddressesLoading } = useGetUserAddresses(user?.id || 0, {
    query: {
      queryKey: getGetUserAddressesQueryKey(user?.id || 0),
      enabled: !!user?.id,
    },
  });

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="border border-border/40 bg-secondary/10 p-6">
            <div className="h-20 w-20 bg-primary/20 flex items-center justify-center text-primary font-display text-2xl font-bold uppercase mb-4">
              {user.name.charAt(0)}
            </div>
            <h2 className="font-bold text-xl mb-1 uppercase tracking-wider">{user.name}</h2>
            <p className="text-muted-foreground text-sm mb-6">{user.email}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Role</span>
                <span className="font-mono uppercase">{user.role}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-mono">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <Button onClick={logout} variant="outline" className="w-full rounded-none border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground uppercase tracking-widest text-xs font-bold">
              Sign Out
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex justify-between items-end border-b border-border/40 pb-4 mb-4">
              <h2 className="text-2xl font-bold uppercase tracking-tight">Saved Addresses</h2>
              <Button variant="outline" className="rounded-none uppercase tracking-widest text-xs font-bold">Add New</Button>
            </div>
            
            {isAddressesLoading ? (
              <div className="h-32 bg-secondary/20 animate-pulse border border-border/40"></div>
            ) : addresses && addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div key={addr.id} className="border border-border/40 p-4 bg-secondary/5">
                    {addr.isDefault && <span className="bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 mb-2 inline-block">Default</span>}
                    <p className="font-bold mb-1">{addr.label || "Address"}</p>
                    <p className="text-sm text-muted-foreground">{addr.line1}</p>
                    {addr.line2 && <p className="text-sm text-muted-foreground">{addr.line2}</p>}
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
                    <p className="text-sm text-muted-foreground font-medium">{addr.country}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-border/40 bg-secondary/5">
                <p className="text-muted-foreground">You haven't saved any addresses yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
