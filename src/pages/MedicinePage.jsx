import MedicineTable from "../components/Medicine/MedicineTable";

function MedicinePage({ medicines, setMedicines, addActivity }) {
  return (
    <div className="animate-fade-in">
      <MedicineTable
        medicines={medicines}
        setMedicines={setMedicines}
        addActivity={addActivity}
      />
    </div>
  );
}

export default MedicinePage;
