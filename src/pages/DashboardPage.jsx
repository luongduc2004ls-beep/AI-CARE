import Dashboard from "../components/Dashboard/Dashboard";

function DashboardPage({ medicines, activities }) {
  return (
    <div className="animate-fade-in">
      <Dashboard medicines={medicines} activities={activities} />
    </div>
  );
}

export default DashboardPage;
