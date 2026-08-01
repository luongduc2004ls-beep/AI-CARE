// ============================
// Dashboard Statistics Helper Functions
// ============================

const getDashboardStatistics = (medicines = []) => {
  const totalMedicines = medicines.length;
  const takenMedicines = medicines.filter(
    (medicine) => medicine.status === "Đã uống",
  ).length;
  const currentTime = new Date().toTimeString().slice(0, 5);
  const overdueMedicines = medicines.filter(
    (medicine) => medicine.status !== "Đã uống" && Boolean(medicine.time) && medicine.time < currentTime,
  ).length;

  return {
    totalMedicines,
    takenMedicines,
    notTakenMedicines: totalMedicines - takenMedicines,
    todaySchedules: totalMedicines,
    onTimeMedicines: takenMedicines,
    overdueMedicines,
  };
};

// ============================
// Chart Data Helper Functions
// ============================

const getMedicationBarChartData = (medicines = []) => {
  const timeSlots = [
    { label: "Sáng", start: 5, end: 10 },
    { label: "Trưa", start: 11, end: 13 },
    { label: "Chiều", start: 14, end: 17 },
    { label: "Tối", start: 18, end: 23 },
  ];
  const medicinesByTimeSlot = { Sáng: 0, Trưa: 0, Chiều: 0, Tối: 0 };

  medicines.forEach((medicine) => {
    const hour = Number(medicine.time?.split(":")[0]);

    if (Number.isNaN(hour)) return;

    const matchedSlot = timeSlots.find(
      (timeSlot) => hour >= timeSlot.start && hour <= timeSlot.end,
    );
    const slotLabel = matchedSlot ? matchedSlot.label : "Tối";

    medicinesByTimeSlot[slotLabel] += 1;
  });

  return timeSlots.map((timeSlot) => ({
    label: timeSlot.label,
    value: medicinesByTimeSlot[timeSlot.label],
  }));
};

const getMedicationPieChartData = (medicines = []) => {
  const { takenMedicines, notTakenMedicines } = getDashboardStatistics(medicines);

  return [
    { label: "Đã uống", value: takenMedicines },
    { label: "Chưa uống", value: notTakenMedicines },
  ];
};

const getMedicationLineChartData = (medicines = []) => {
  const statistics = getDashboardStatistics(medicines);

  // Mock historical data for previous days.
  // Today's point updates reactively as medicine status changes.
  return [
    { label: "T2", taken: 5, missed: 1 },
    { label: "T3", taken: 6, missed: 2 },
    { label: "T4", taken: 7, missed: 1 },
    { label: "T5", taken: 5, missed: 3 },
    { label: "T6", taken: 8, missed: 1 },
    { label: "T7", taken: 6, missed: 2 },
    { label: "CN", taken: statistics.takenMedicines, missed: statistics.notTakenMedicines },
  ];
};

export {
  getDashboardStatistics,
  getMedicationBarChartData,
  getMedicationLineChartData,
  getMedicationPieChartData,
};
