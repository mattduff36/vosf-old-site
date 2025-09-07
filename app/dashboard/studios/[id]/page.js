import DashboardLayout from '../../../components/DashboardLayout';
import EnhancedStudioProfile from '../../../components/EnhancedStudioProfile';

export default function StudioProfilePage({ params }) {
  return (
    <DashboardLayout>
      <EnhancedStudioProfile studioId={params.id} />
    </DashboardLayout>
  );
}
