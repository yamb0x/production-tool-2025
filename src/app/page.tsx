export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Production Tool 2025</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Professional booking and project management for 3D CGI studios
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Booking System</h2>
            <p className="text-muted-foreground">
              Manage resource bookings with real-time conflict prevention
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Project Management</h2>
            <p className="text-muted-foreground">
              Track projects, timelines, and resource allocation
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Real-time Updates</h2>
            <p className="text-muted-foreground">
              Live synchronization across all connected clients
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}