"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Loader2,
  Users,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  employeeCount: number;
}

export default function RolesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [permissionsDialogRole, setPermissionsDialogRole] = useState<Role | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Selected permissions for edit
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch roles
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get("/roles");
      return res.data.data;
    },
  });

  // Fetch all permissions
  const { data: permissionsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await api.get("/roles/permissions/all");
      return res.data;
    },
  });

  const roles: Role[] = rolesData || [];
  const allPermissions: Permission[] = permissionsData?.data || [];
  const groupedPermissions: Record<string, Permission[]> = permissionsData?.grouped || {};

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissionIds?: string[] }) => {
      if (editingRole) {
        return api.put(`/roles/${editingRole.id}`, data);
      }
      return api.post("/roles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingRole ? "Rôle modifié" : "Rôle créé",
        description: `${formData.name} a été ${editingRole ? "modifié" : "créé"} avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de l'enregistrement du rôle",
        variant: "destructive",
      });
    },
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      return api.put(`/roles/${roleId}/permissions`, { permissionIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setPermissionsDialogRole(null);
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions du rôle ont été mises à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de la mise à jour des permissions",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteConfirm(null);
      toast({
        title: "Rôle supprimé",
        description: "Le rôle a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Échec de la suppression du rôle",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setEditingRole(null);
    setSelectedPermissions([]);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
    });
    setSelectedPermissions(role.permissions.map((p) => p.id));
    setIsDialogOpen(true);
  };

  const openPermissionsDialog = (role: Role) => {
    setPermissionsDialogRole(role);
    setSelectedPermissions(role.permissions.map((p) => p.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name: formData.name,
      description: formData.description,
      permissionIds: selectedPermissions,
    });
  };

  const handlePermissionsSubmit = () => {
    if (permissionsDialogRole) {
      updatePermissionsMutation.mutate({
        roleId: permissionsDialogRole.id,
        permissionIds: selectedPermissions,
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleResourcePermissions = (resource: string) => {
    const resourcePermIds = groupedPermissions[resource]?.map((p) => p.id) || [];
    const allSelected = resourcePermIds.every((id) => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !resourcePermIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...resourcePermIds])]);
    }
  };

  const getRoleBadgeColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "manager":
        return "bg-blue-100 text-blue-700";
      case "cashier":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatResourceName = (resource: string) => {
    return resource.charAt(0).toUpperCase() + resource.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rôles & Permissions</h1>
          <p className="text-slate-500 mt-1">
            Gérez les rôles des utilisateurs et leurs permissions d'accès
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {/* Roles Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Permissions</TableHead>
              <TableHead className="text-center">Employees</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-500">No roles found</p>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(role.name)}>
                      {role.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {role.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPermissionsDialog(role)}
                      className="gap-1"
                    >
                      <Shield className="h-3 w-3" />
                      {role.permissions.length}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{role.employeeCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="outline" className="text-xs">System</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(role)}
                        disabled={role.isSystem}
                        title={role.isSystem ? "System roles cannot be edited" : "Edit role"}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(role.id)}
                        disabled={role.isSystem || role.employeeCount > 0}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={
                          role.isSystem
                            ? "System roles cannot be deleted"
                            : role.employeeCount > 0
                            ? "Cannot delete role with assigned employees"
                            : "Delete role"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Supervisor"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this role"
                />
              </div>
            </div>

            {/* Permissions Selection */}
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">
                        {formatResourceName(resource)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleResourcePermissions(resource)}
                        className="text-xs h-7"
                      >
                        {perms.every((p) => selectedPermissions.includes(p.id))
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => togglePermission(perm.id)}
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            selectedPermissions.includes(perm.id)
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {perm.action}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {selectedPermissions.length} permission(s) selected
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingRole ? "Update Role" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Matrix Dialog */}
      <Dialog open={!!permissionsDialogRole} onOpenChange={() => setPermissionsDialogRole(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permissions for{" "}
              <Badge className={getRoleBadgeColor(permissionsDialogRole?.name || "")}>
                {permissionsDialogRole?.name}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {permissionsDialogRole?.isSystem ? (
            <div className="py-4">
              <p className="text-slate-500 text-sm mb-4">
                System roles cannot be modified. Below are the current permissions:
              </p>
              <div className="border rounded-lg divide-y">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="p-3">
                    <span className="font-medium text-slate-900 block mb-2">
                      {formatResourceName(resource)}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <span
                          key={perm.id}
                          className={`px-2.5 py-1 text-xs rounded-full ${
                            permissionsDialogRole?.permissions.some((p) => p.id === perm.id)
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {permissionsDialogRole?.permissions.some((p) => p.id === perm.id) ? (
                            <Check className="h-3 w-3 inline mr-1" />
                          ) : (
                            <X className="h-3 w-3 inline mr-1" />
                          )}
                          {perm.action}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">
                        {formatResourceName(resource)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleResourcePermissions(resource)}
                        className="text-xs h-7"
                      >
                        {perms.every((p) => selectedPermissions.includes(p.id))
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => togglePermission(perm.id)}
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            selectedPermissions.includes(perm.id)
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {perm.action}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {selectedPermissions.length} permission(s) selected
              </p>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPermissionsDialogRole(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePermissionsSubmit}
                  disabled={updatePermissionsMutation.isPending}
                >
                  {updatePermissionsMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Permissions
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
          </DialogHeader>
          <p className="text-slate-500">
            Are you sure you want to delete this role? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

