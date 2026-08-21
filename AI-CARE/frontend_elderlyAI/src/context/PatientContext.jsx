import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const PatientContext = createContext(null);

export const PatientProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  const [assignedPatients, setAssignedPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("PAT10000");
  const [loading, setLoading] = useState(false);

  const loadPatients = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    setLoading(true);
    try {
      const endpoint = isAdmin ? "/patients?per_page=50" : "/my/patients";
      const res = await api.get(endpoint, {
        params: { userId: currentUser?.user_id, userRole: currentUser?.role || "User" }
      });
      const items = res?.items || res?.data?.items || res?.data || [];
      setAssignedPatients(items);

      if (items.length > 0) {
        // If current selected patient is not in items, select first item
        const exists = items.some((p) => (p.patient_code || p.patient_id || p.id) === selectedPatientId);
        if (!exists) {
          const firstCode = items[0].patient_code || items[0].patient_id || items[0].id || "PAT10000";
          setSelectedPatientId(firstCode);
        }
      }
    } catch (err) {
      console.warn("Lỗi khi tải danh sách bệnh nhân phân quyền:", err);
      // Fallback clean profile
      setAssignedPatients([
        {
          patient_code: "PAT10000",
          patient_id: "PAT10000",
          full_name: "Cụ Hồ Thanh Khánh",
          age: 71,
          gender: "Nam",
          status: "An toàn"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, currentUser, selectedPatientId]);

  useEffect(() => {
    loadPatients();
  }, [isAuthenticated, currentUser?.role]);

  const selectedPatient = assignedPatients.find(
    (p) => (p.patient_code || p.patient_id || p.id) === selectedPatientId
  ) || assignedPatients[0] || {
    patient_code: "PAT10000",
    patient_id: "PAT10000",
    full_name: "Cụ Hồ Thanh Khánh",
    age: 71,
    gender: "Nam",
    status: "Đang được chăm sóc"
  };

  return (
    <PatientContext.Provider
      value={{
        assignedPatients,
        selectedPatientId,
        selectedPatient,
        setSelectedPatientId,
        loading,
        refreshPatients: loadPatients
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient phải được dùng bên trong PatientProvider");
  }
  return context;
};
