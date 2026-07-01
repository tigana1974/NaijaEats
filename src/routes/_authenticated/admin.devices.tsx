import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  UberPageTitle,
  UberKpi,
  UberTable,
  UberThead,
  UberTh,
  UberTr,
  UberTd,
  UberStatus,
} from "@/components/admin/AdminUI";
import { Smartphone, Tablet, Laptop, ShieldAlert, PowerOff, ShieldBan, Search } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/devices")({
  component: AdminDevices,
});

type DeviceSession = {
  id: string;
  user: { name: string, role: string };
  device_name: string;
  ip_address: string;
  app_version: string;
  last_active: string;
  status: 'active' | 'suspicious' | 'blocked';
  type: 'tablet' | 'mobile' | 'desktop';
};

function AdminDevices() {
  const [search, setSearch] = useState("");

  const { data: devices, isLoading } = useQuery({
    queryKey: ["admin-devices"],
    queryFn: async () => {
      // Mock data for devices/sessions as it relies on auth logs not exposed to our client directly
      return [
        { id: "d1", user: { name: "Iya Basira's Buka", role: "vendor" }, device_name: "Samsung Galaxy Tab A8", ip_address: "197.210.64.12", app_version: "v2.1.4", last_active: new Date().toISOString(), status: "active", type: "tablet" },
        { id: "d2", user: { name: "Admin John", role: "admin" }, device_name: "MacBook Pro", ip_address: "102.89.44.200", app_version: "Web", last_active: new Date().toISOString(), status: "active", type: "desktop" },
        { id: "d3", user: { name: "Ahmed (Rider)", role: "rider" }, device_name: "Infinix Hot 12", ip_address: "105.112.4.99", app_version: "v2.1.3", last_active: new Date(Date.now() - 3600000).toISOString(), status: "active", type: "mobile" },
        { id: "d4", user: { name: "Unknown", role: "vendor" }, device_name: "Unknown Device", ip_address: "185.12.33.10", app_version: "v1.0.0", last_active: new Date(Date.now() - 86400000).toISOString(), status: "suspicious", type: "mobile" },
      ] as DeviceSession[];
    },
  });

  const filtered = devices?.filter(d => 
    d.user.name.toLowerCase().includes(search.toLowerCase()) || 
    d.device_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const kpis = {
    active: devices?.filter(d => d.status === 'active').length || 0,
    tablets: devices?.filter(d => d.type === 'tablet').length || 0,
    desktops: devices?.filter(d => d.type === 'desktop').length || 0,
    suspicious: devices?.filter(d => d.status === 'suspicious').length || 0,
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <UberPageTitle
          eyebrow="Security & IT"
          title="Active Devices"
          description="Monitor and manage active sessions across all vendors, riders, and admins."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
          <UberKpi label="Active Devices" value={isLoading ? "…" : kpis.active} Icon={Smartphone} accent="green" />
          <UberKpi label="Tablets in Stores" value={isLoading ? "…" : kpis.tablets} Icon={Tablet} accent="blue" />
          <UberKpi label="Admin Desktops" value={isLoading ? "…" : kpis.desktops} Icon={Laptop} accent="ink" />
          <UberKpi label="Suspicious Sessions" value={isLoading ? "…" : kpis.suspicious} Icon={ShieldAlert} accent="red" />
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-5 bg-neutral-50/50 gap-4">
              <h3 className="font-semibold text-lg">Active Sessions</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search user or device..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-core"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <UberTable>
                <UberThead>
                  <tr>
                    <UberTh>User / Owner</UberTh>
                    <UberTh>Device Name</UberTh>
                    <UberTh>IP Address</UberTh>
                    <UberTh>Last Active</UberTh>
                    <UberTh>Status</UberTh>
                    <UberTh></UberTh>
                  </tr>
                </UberThead>
                <tbody>
                  {isLoading ? (
                    <UberTr><UberTd colSpan={6} className="text-center py-8">Loading devices...</UberTd></UberTr>
                  ) : filtered.length === 0 ? (
                    <UberTr><UberTd colSpan={6} className="text-center py-12 text-neutral-500">No devices found.</UberTd></UberTr>
                  ) : (
                    filtered.map((dev) => (
                      <UberTr key={dev.id}>
                        <UberTd>
                          <div className="flex flex-col">
                            <span className="font-medium text-neutral-900">{dev.user.name}</span>
                            <span className="text-xs text-neutral-500 capitalize">{dev.user.role}</span>
                          </div>
                        </UberTd>
                        <UberTd>
                          <div className="flex items-center gap-2">
                            {dev.type === 'tablet' && <Tablet className="h-4 w-4 text-neutral-400" />}
                            {dev.type === 'mobile' && <Smartphone className="h-4 w-4 text-neutral-400" />}
                            {dev.type === 'desktop' && <Laptop className="h-4 w-4 text-neutral-400" />}
                            <div className="flex flex-col">
                              <span className="font-medium">{dev.device_name}</span>
                              <span className="text-xs text-neutral-500">{dev.app_version}</span>
                            </div>
                          </div>
                        </UberTd>
                        <UberTd className="font-mono text-sm">{dev.ip_address}</UberTd>
                        <UberTd className="text-sm">{format(new Date(dev.last_active), "MMM d, h:mm a")}</UberTd>
                        <UberTd>
                          <UberStatus 
                            status={dev.status} 
                            variant={dev.status === 'active' ? 'success' : dev.status === 'suspicious' ? 'error' : 'neutral'}
                          />
                        </UberTd>
                        <UberTd>
                          <div className="flex items-center gap-2 justify-end">
                            <button className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500" title="Force Logout">
                              <PowerOff className="h-4 w-4" />
                            </button>
                            <button className="p-2 hover:bg-red-50 text-red-600 rounded-md" title="Block IP">
                              <ShieldBan className="h-4 w-4" />
                            </button>
                          </div>
                        </UberTd>
                      </UberTr>
                    ))
                  )}
                </tbody>
              </UberTable>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
