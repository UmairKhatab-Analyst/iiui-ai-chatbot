import React from 'react';

interface ResourcesViewProps {
  onBack?: () => void;
}

const ResourcesView: React.FC<ResourcesViewProps> = ({ onBack }) => {
  const sections = [
    {
      title: 'Digital Portals',
      icon: '💻',
      links: [
        { name: 'Student CMS Portal', url: 'https://cms.iiu.edu.pk/' },
        { name: 'LMS Main Dashboard', url: 'https://lms.iiu.edu.pk/' },
        { name: 'Academic Calendar', url: 'https://www.iiu.edu.pk/academics/academic-calendar/' },
        { name: 'Official Downloads', url: 'https://www.iiu.edu.pk/academics/downloads/' }
      ],
      color: 'bg-emerald-50 text-emerald-800 border-emerald-100'
    },
    {
      title: 'Finance & Scholarships',
      icon: '💰',
      links: [
        { name: 'Scholarship Portal', url: 'https://www.iiu.edu.pk/admission/scholarships/' },
        { name: 'HEC National Portal', url: 'https://scholarships.hec.gov.pk/' },
        { name: 'Fee Structure', url: 'https://www.iiu.edu.pk/admission/fee-structure/' },
        { name: 'Financial Aid Office', url: 'https://www.iiu.edu.pk/admission/financial-assistance/' }
      ],
      color: 'bg-blue-50 text-blue-800 border-blue-100'
    },
    {
      title: 'Campus Facilities',
      icon: '🏢',
      links: [
        { name: 'Hostel Services', url: 'https://www.iiu.edu.pk/campus-life/hostels/' },
        { name: 'Bus Routes & Transport', url: 'https://www.iiu.edu.pk/campus-life/transport/' },
        { name: 'Medical Centre', url: 'https://www.iiu.edu.pk/campus-life/medical-center/' },
        { name: 'Sports Facilities', url: 'https://www.iiu.edu.pk/campus-life/sports/' }
      ],
      color: 'bg-amber-50 text-amber-800 border-amber-100'
    },
    {
      title: 'Knowledge Hub',
      icon: '📚',
      links: [
        { name: 'Central Library OPAC', url: 'https://library.iiu.edu.pk/' },
        { name: 'Digital Library (HEC)', url: 'http://www.digitallibrary.edu.pk/iiu.html' },
        { name: 'Research & Journals', url: 'https://www.iiu.edu.pk/research/journals/' },
        { name: 'Quality Assurance (QAD)', url: 'https://www.iiu.edu.pk/qad/' }
      ],
      color: 'bg-purple-50 text-purple-800 border-purple-100'
    }
  ];

  return (
    <div className="p-6 md:p-10 bg-slate-50 h-full overflow-y-auto">
      {/* Navigation & Header */}
      <div className="flex flex-col items-center mb-10 relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all shadow-sm group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Chat
          </button>
        )}
        <div className="text-center mt-12 md:mt-0">
          <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">Verified Resource Directory</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto italic">Stable, direct access to official IIUI subdomains and campus services.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className={`p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${section.color}`}>
                {section.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{section.title}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {section.links.map((link, lIdx) => (
                <a key={lIdx} href={link.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all text-xs font-bold text-slate-700">
                  {link.name}
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-emerald-900 rounded-[2.5rem] text-white flex flex-col items-center text-center relative overflow-hidden">
        <h4 className="text-xl font-serif font-bold mb-2 z-10">Administrative ICT Help</h4>
        <p className="text-emerald-200 text-xs mb-6 max-w-sm z-10">For CMS or LMS account lockouts, visit the ICT Center at the Central Library basement or email support@iiu.edu.pk</p>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-emerald-800/50 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default ResourcesView;