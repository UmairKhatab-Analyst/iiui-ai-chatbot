
import React from 'react';

const AnalyticsView: React.FC = () => {
  // AI Agent Performance KPIs
  const agentKPIs = [
    { label: 'Query Precision', value: '98.4%', trend: '+1.2%', status: 'optimal' },
    { label: 'Avg. Latency', value: '420ms', trend: '-15ms', status: 'fast' },
    { label: 'Daily Resolved', value: '1,420', trend: '+240', status: 'high' },
    { label: 'User Satisfaction', value: '4.8/5', trend: '+0.1', status: 'excellent' },
  ];

  // Institutional University KPIs
  const universityKPIs = [
    { label: 'Graduation Rate', value: '82%', trend: '+3%', color: 'text-emerald-600' },
    { label: 'Research Impact', value: 'H-Index 45', trend: '+5', color: 'text-blue-600' },
    { label: 'Job Placement', value: '76%', trend: '+8%', color: 'text-indigo-600' },
    { label: 'Scholarship Coverage', value: '15%', trend: 'Stable', color: 'text-amber-600' },
  ];

  const deptData = [
    { name: 'Shariah & Law', percentage: 22, color: 'bg-emerald-500' },
    { name: 'Management Sciences', percentage: 18, color: 'bg-blue-500' },
    { name: 'Computing (FSLIT)', percentage: 25, color: 'bg-indigo-500' },
    { name: 'Engineering', percentage: 15, color: 'bg-orange-500' },
    { name: 'Social Sciences', percentage: 20, color: 'bg-pink-500' },
  ];

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">Intelligence Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time Key Performance Indicators (KPIs) for H-10 Node & Campus Institutional Metrics.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">Session: Active</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-200">Data Source: Live</span>
        </div>
      </div>

      {/* Section 1: AI Agent Performance KPIs */}
      <div className="mb-12">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Agent Performance KPIs</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {agentKPIs.map((kpi, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-serif font-bold text-emerald-900">{kpi.value}</p>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg mb-1">{kpi.trend}</span>
                  <span className="text-[8px] font-bold text-slate-300 uppercase">{kpi.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Institutional Growth Metrics */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* KPI List Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 012 2h2a2 2 0 012-2z"/></svg>
              Institutional KPIs
            </h3>
            <button className="text-[10px] font-bold text-emerald-600 hover:underline">Download Report</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {universityKPIs.map((stat, idx) => (
              <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-600 block">{stat.trend}</span>
                  <div className="w-12 h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[70%]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-50">
             <h4 className="text-xs font-bold text-slate-700 mb-4">Enrollment Distribution</h4>
             <div className="space-y-4">
               {deptData.map((dept, idx) => (
                 <div key={idx}>
                   <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wide">
                     <span className="text-slate-600">{dept.name}</span>
                     <span className="text-slate-400">{dept.percentage}%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-1.5">
                     <div className={`${dept.color} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${dept.percentage}%` }}></div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Vision Card */}
        <div className="bg-emerald-900 rounded-[2.5rem] p-10 text-white flex flex-col relative overflow-hidden shadow-2xl">
          <div className="z-10">
            <h3 className="text-2xl font-serif font-bold mb-6">Strategic KPI Tracking</h3>
            <p className="text-emerald-100 text-sm leading-relaxed mb-8">
              We leverage real-time data from the H-10 Core Node to monitor student success. Our AI doesn't just answer questions; it measures institutional momentum.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-md">
                <p className="text-[9px] uppercase font-black text-emerald-300 mb-2 tracking-widest">Next Target</p>
                <p className="text-xs font-medium">95% Digital Literacy among freshers via AI onboarding.</p>
              </div>
              <div className="bg-emerald-800/50 p-4 rounded-2xl border border-emerald-700">
                <p className="text-[9px] uppercase font-black text-emerald-300 mb-2 tracking-widest">System Health</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <p className="text-xs font-bold">Node-X Sync Stable</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-800/30 rounded-full blur-[80px]"></div>
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
