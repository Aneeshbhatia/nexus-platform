import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../services/api";
import { useAuth } from "./authContext.jsx";

// eslint-disable-next-line react-refresh/only-export-components
export const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganizations([]);
      setCurrentOrg(null);
      return;
    }

    try {
      const res = await api.get("/organizations");
      const list = res.data?.data?.organizations || [];
      setOrganizations(list);

      // Determine active organization
      const savedOrgId = localStorage.getItem("nexus_active_org_id");
      let active = null;

      if (savedOrgId) {
        active = list.find((item) => item.organization?._id === savedOrgId);
      }

      if (!active && list.length > 0) {
        active = list[0];
      }

      if (active) {
        setCurrentOrg(active);
        localStorage.setItem("nexus_active_org_id", active.organization._id);
      } else {
        setCurrentOrg(null);
        localStorage.removeItem("nexus_active_org_id");
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!isAuthenticated) {
        setOrganizations([]);
        setCurrentOrg(null);
        return;
      }

      try {
        const res = await api.get("/organizations");
        if (ignore) return;
        const list = res.data?.data?.organizations || [];
        setOrganizations(list);

        const savedOrgId = localStorage.getItem("nexus_active_org_id");
        let active = null;

        if (savedOrgId) {
          active = list.find((item) => item.organization?._id === savedOrgId);
        }

        if (!active && list.length > 0) {
          active = list[0];
        }

        if (active) {
          setCurrentOrg(active);
          localStorage.setItem("nexus_active_org_id", active.organization._id);
        } else {
          setCurrentOrg(null);
          localStorage.removeItem("nexus_active_org_id");
        }
      } catch (err) {
        if (!ignore) console.error("Error loading organizations:", err);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const switchOrganization = (orgId) => {
    const selected = organizations.find(
      (item) => item.organization?._id === orgId
    );
    if (selected) {
      setCurrentOrg(selected);
      localStorage.setItem("nexus_active_org_id", selected.organization._id);
    }
  };

  const createOrganization = async (name, description = "") => {
    try {
      setLoading(true);
      const res = await api.post("/organizations", {
        name: name.trim(),
        description: description.trim(),
      });

      if (res.data?.success) {
        await fetchOrganizations();
        const newOrg = res.data.data.organization;
        if (newOrg) {
          localStorage.setItem("nexus_active_org_id", newOrg._id);
          const found = organizations.find(
            (o) => o.organization?._id === newOrg._id
          );
          if (found) setCurrentOrg(found);
        }
        return { success: true, organization: res.data.data.organization };
      }
      return { success: false, message: "Failed to create organization" };
    } catch (err) {
      console.error("Create organization error:", err);
      return {
        success: false,
        message: err.response?.data?.message || err.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    organizations,
    currentOrg,
    organizationId: currentOrg?.organization?._id || null,
    organizationName: currentOrg?.organization?.name || "No Organization",
    userRole: currentOrg?.role || "member",
    loading,
    fetchOrganizations,
    switchOrganization,
    createOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used inside OrganizationProvider");
  }
  return context;
}

export default OrganizationProvider;
