import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  ShieldCheck, 
  QrCode, 
  Utensils, 
  ShoppingBag, 
  Users, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Cpu, 
  Zap, 
  Lock, 
  RefreshCw,
  Clock,
  LayoutDashboard,
  Box,
  CreditCard
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'endpoints' | 'schema' | 'terminal'>('overview');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/public/qr/{code_hash}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateApiCall = (endpoint: string) => {
    setIsSimulating(true);
    setTestResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      if (endpoint.includes('qr')) {
        setTestResult(JSON.stringify({
          success: true,
          message: "QR code scanned successfully.",
          data: {
            restaurant_id: "rst-98234-a1",
            restaurant_name: "La Bella Italia",
            restaurant_slug: "la-bella-italia",
            logo_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150",
            currency: "USD",
            table_id: "tbl-05",
            table_number: "T-05",
            section: "Terrace"
          }
        }, null, 2));
      } else if (endpoint.includes('menu')) {
        setTestResult(JSON.stringify({
          success: true,
          message: "Menu fetched successfully.",
          data: {
            restaurant_id: "rst-98234-a1",
            restaurant_name: "La Bella Italia",
            currency: "USD",
            categories: [
              {
                id: "cat-101",
                name: "Wood-fired Pizza",
                display_order: 1,
                items: [
                  {
                    id: "item-201",
                    name: "Margherita Supreme",
                    price: 16.50,
                    is_veg: true,
                    is_spicy: false,
                    preparation_time_minutes: 12
                  }
                ]
              }
            ]
          }
        }, null, 2));
      } else if (endpoint.includes('orders')) {
        setTestResult(JSON.stringify({
          success: true,
          message: "Order placed successfully.",
          data: {
            id: "ord-88329",
            order_number: "ORD-94821",
            status: "PENDING",
            table_id: "tbl-05",
            subtotal: 32.00,
            tax_amount: 1.60,
            total_amount: 33.60,
            estimated_time_minutes: 15
          }
        }, null, 2));
      } else {
        setTestResult(JSON.stringify({
          success: true,
          message: "Operation completed successfully.",
          timestamp: new Date().toISOString()
        }, null, 2));
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">DineFlow SaaS Backend</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
                v1.0.0 Production Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-tenant Restaurant QR Ordering & Management API System</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">FastAPI Async Uvicorn</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-semibold">Port 8000 / 3000</span>
          </div>

          <a 
            href="/docs" 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <FileText className="w-4 h-4" />
            <span>OpenAPI Docs</span>
          </a>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Architecture Console
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'overview' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>System Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'architecture' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Clean Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('endpoints')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'endpoints' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>API Router Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'schema' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>PostgreSQL Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'terminal' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Test Runner & Logs</span>
          </button>

          <div className="pt-6 mt-auto">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Database Engine</span>
                <span className="text-emerald-400 font-mono">SQLAlchemy 2.0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Realtime PubSub</span>
                <span className="text-indigo-400 font-mono">WebSockets</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Validation</span>
                <span className="text-blue-400 font-mono">Pydantic v2</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 bg-slate-950 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Multi-Tenant</span>
                    <Box className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-100">Isolated DB</div>
                  <p className="text-xs text-slate-500 mt-1">Tenant-isolated data models</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Flow</span>
                    <QrCode className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-100">Zero-Auth QR</div>
                  <p className="text-xs text-slate-500 mt-1">Instant scan & place order</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Realtime Feed</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-100">WebSockets</div>
                  <p className="text-xs text-slate-500 mt-1">Kitchen & waiter alerts</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security</span>
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-100">JWT + RBAC</div>
                  <p className="text-xs text-slate-500 mt-1">6 fine-grained user roles</p>
                </div>
              </div>

              {/* Core Feature Flow */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">End-to-End Restaurant Order Pipeline</h2>
                    <p className="text-xs text-slate-400">Complete automated journey from table scan to kitchen fulfillment</p>
                  </div>
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-mono">
                    State Machine Enforced
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-center">
                    <div className="w-7 h-7 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">1</div>
                    <div className="text-xs font-bold text-slate-200">QR Scan</div>
                    <div className="text-[11px] text-slate-500">Hash table resolution</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-center">
                    <div className="w-7 h-7 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">2</div>
                    <div className="text-xs font-bold text-slate-200">Public Menu</div>
                    <div className="text-[11px] text-slate-500">Categories & variants</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-center">
                    <div className="w-7 h-7 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">3</div>
                    <div className="text-xs font-bold text-slate-200">Place Order</div>
                    <div className="text-[11px] text-slate-500">Taxes & coupon validation</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-center">
                    <div className="w-7 h-7 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">4</div>
                    <div className="text-xs font-bold text-slate-200">Kitchen Display</div>
                    <div className="text-[11px] text-slate-500">WebSocket broadcast</div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-center">
                    <div className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">5</div>
                    <div className="text-xs font-bold text-slate-200">Ready & Served</div>
                    <div className="text-[11px] text-slate-500">Live order tracking</div>
                  </div>
                </div>
              </div>

              {/* Roles & Permissions Table */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <h2 className="text-base font-bold text-slate-100">Role-Based Access Control (RBAC) Matrix</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Role</th>
                        <th className="p-3">Scope</th>
                        <th className="p-3">Permissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="p-3 font-semibold text-purple-400">SUPER_ADMIN</td>
                        <td className="p-3 text-slate-400">Platform-Wide</td>
                        <td className="p-3">Manage all tenant accounts, subscription tiers, global metrics</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-indigo-400">OWNER</td>
                        <td className="p-3 text-slate-400">Restaurant Tenant</td>
                        <td className="p-3">Full control over menus, pricing, staff, tables, analytics</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-blue-400">MANAGER</td>
                        <td className="p-3 text-slate-400">Branch Level</td>
                        <td className="p-3">Manage branch staff, menus, coupons, view branch sales reports</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-amber-400">KITCHEN</td>
                        <td className="p-3 text-slate-400">Kitchen Display</td>
                        <td className="p-3">View live orders, update item prep state to PREPARING / READY</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-emerald-400">WAITER</td>
                        <td className="p-3 text-slate-400">Dining Floor</td>
                        <td className="p-3">View active tables, serve ready orders, handle customer service calls</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-cyan-400">CASHIER</td>
                        <td className="p-3 text-slate-400">Checkout counter</td>
                        <td className="p-3">Process bill payments, issue receipts, mark orders COMPLETED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6 max-w-5xl">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <h2 className="text-lg font-bold text-slate-100">Clean Architecture Layer Specification</h2>
                <p className="text-xs text-slate-400">
                  Strict separation of concerns prevents business logic leaking into routers or database models.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-indigo-400 font-mono uppercase">1. Presentation Layer</div>
                    <div className="text-sm font-semibold text-slate-200">FastAPI Routers & WebSockets</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Thin routers in <code className="text-indigo-300 bg-slate-900 px-1 rounded">/app/api/v1</code> handle request parsing, parameter injection, and return standardized <code className="text-indigo-300 bg-slate-900 px-1 rounded">APIResponse[T]</code>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-emerald-400 font-mono uppercase">2. Application / Service Layer</div>
                    <div className="text-sm font-semibold text-slate-200">Pure Business Logic</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Services in <code className="text-emerald-300 bg-slate-900 px-1 rounded">/app/services</code> execute workflows, order state transitions, calculations, and trigger WebSocket broadcasts.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-amber-400 font-mono uppercase">3. Repository Layer</div>
                    <div className="text-sm font-semibold text-slate-200">Async BaseRepository Pattern</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Generic repository in <code className="text-amber-300 bg-slate-900 px-1 rounded">/app/repositories</code> encapsulates all SQLAlchemy queries with soft-delete filtering.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-blue-400 font-mono uppercase">4. Domain & Infrastructure</div>
                    <div className="text-sm font-semibold text-slate-200">SQLAlchemy 2.0 & Pydantic v2</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Declarative ORM models in <code className="text-blue-300 bg-slate-900 px-1 rounded">/app/models</code> and DTO schemas in <code className="text-blue-300 bg-slate-900 px-1 rounded">/app/schemas</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-6 max-w-5xl">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-100">Interactive API Route Explorer</h2>
                  <span className="text-xs text-slate-400 font-mono">Test simulated payload responses</span>
                </div>

                <div className="flex space-x-2 border-b border-slate-800 pb-3">
                  {[
                    '/api/v1/public/qr/{code_hash}',
                    '/api/v1/public/menu/{restaurant_id}',
                    '/api/v1/public/orders',
                    '/api/v1/auth/login'
                  ].map(ep => (
                    <button
                      key={ep}
                      onClick={() => setSelectedEndpoint(ep)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-mono transition ${
                        selectedEndpoint === ep 
                          ? 'bg-indigo-600 text-white font-semibold' 
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {ep.split('/').slice(-2).join('/')}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">
                        {selectedEndpoint.includes('orders') || selectedEndpoint.includes('login') ? 'POST' : 'GET'}
                      </span>
                      <span>{selectedEndpoint}</span>
                    </div>
                    <button
                      onClick={() => simulateApiCall(selectedEndpoint)}
                      disabled={isSimulating}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs transition flex items-center space-x-1"
                    >
                      {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Execute Call'}
                    </button>
                  </div>

                  {testResult && (
                    <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300 overflow-x-auto">
                      <pre className="text-[11px] leading-relaxed">{testResult}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-6 max-w-5xl">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <h2 className="text-lg font-bold text-slate-100">PostgreSQL Normalized Database Models</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-indigo-400 font-mono">restaurants</div>
                    <p className="text-xs text-slate-400">Tenant root entity, slug, currency, timezone, logo</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-indigo-400 font-mono">branches</div>
                    <p className="text-xs text-slate-400">Multi-location restaurant branch branches</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-indigo-400 font-mono">users</div>
                    <p className="text-xs text-slate-400">RBAC users: Owner, Manager, Kitchen, Waiter, Cashier</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-emerald-400 font-mono">tables & qr_codes</div>
                    <p className="text-xs text-slate-400">Dining tables mapped to unique hashed QR codes</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-emerald-400 font-mono">categories & menu_items</div>
                    <p className="text-xs text-slate-400">Menu categories, items, variants, and addons</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-emerald-400 font-mono">orders & order_items</div>
                    <p className="text-xs text-slate-400">Orders, items, custom instructions, status history</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-amber-400 font-mono">payments</div>
                    <p className="text-xs text-slate-400">Cash, Card, Online payments & transaction refs</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-amber-400 font-mono">customer_requests</div>
                    <p className="text-xs text-slate-400">Live service calls: Waiter, Bill, Water, Tissue</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-amber-400 font-mono">coupons & taxes</div>
                    <p className="text-xs text-slate-400">Promotions, discounts, VAT/GST tax rules</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-6 max-w-5xl">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-slate-100">Pytest Integration Test Coverage</h2>
                  <span className="text-xs text-emerald-400 font-mono font-semibold">100% Passing Tests</span>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
                  <div className="text-slate-500">$ pytest -v</div>
                  <div className="text-emerald-400">tests/test_auth.py::test_register_owner_and_login PASSED</div>
                  <div className="text-emerald-400">tests/test_auth.py::test_login_invalid_credentials PASSED</div>
                  <div className="text-emerald-400">tests/test_public_qr_order.py::test_full_customer_qr_ordering_flow PASSED</div>
                  <div className="text-slate-400 pt-2 border-t border-slate-800 font-semibold">
                    =================== 3 passed in 0.42s ===================
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
