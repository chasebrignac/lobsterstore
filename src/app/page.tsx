import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-white">LobsterLoop</div>
          <Link
            href="/login"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white">
            Run AI agents with an API
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Execute autonomous coding workflows with Ralph. Watch your code come to life with real-time progress tracking.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-black rounded-md hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              Get started for free
            </Link>
            <Link
              href="/discover"
              className="px-8 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-semibold text-lg border border-gray-700"
            >
              Explore loops
            </Link>
          </div>

          {/* Code Example */}
          <div className="mt-16 bg-gray-900 rounded-lg p-6 text-left border border-gray-800">
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`// Execute a Ralph loop
const execution = await fetch('https://api.lobsterloop.com/v1/loops/run', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({
    loop_id: "add-feature-xyz",
    prd: {
      userStories: [
        {
          id: "US-001",
          description: "Add authentication to app",
          acceptanceCriteria: ["Users can sign in", "Session persists"]
        }
      ]
    }
  })
});`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-white text-center">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                Define workflows
              </h3>
              <p className="text-gray-400">
                Create product requirements with user stories. Ralph will implement them using Claude Code CLI.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                Execute on EC2
              </h3>
              <p className="text-gray-400">
                Run loops on dedicated EC2 instances. Secure, isolated, and scalable execution environment.
              </p>
            </div>

            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
              <div className="text-4xl mb-4">👀</div>
              <h3 className="text-xl font-semibold mb-3 text-white">
                Watch live progress
              </h3>
              <p className="text-gray-400">
                Real-time visualization of workflow execution. See every commit, test, and update as it happens.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="container mx-auto px-4 py-20 border-t border-gray-800">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-400 italic mb-4">
            "Deployed my first autonomous agent in under 5 minutes. LobsterLoop makes AI-powered development incredibly simple."
          </p>
          <p className="text-gray-500">— Early adopter</p>
        </div>
      </div>
    </main>
  )
}
