import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/LoadingState';
import { Award, Download, Calendar, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';

export const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/certificates/my');
      setCertificates(res.data.certificates || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const downloadPDF = (cert) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Background styling
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 210, 'F');

      // Outer golden/indigo border
      doc.setDrawColor(99, 102, 241); // indigo-500
      doc.setLineWidth(4);
      doc.rect(10, 10, 277, 190);

      doc.setDrawColor(245, 158, 11); // amber-500
      doc.setLineWidth(1);
      doc.rect(14, 14, 269, 182);

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('CERTIFICATE OF PARTICIPATION', 148.5, 45, { align: 'center' });

      // Subtitle
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('This is proudly presented to', 148.5, 65, { align: 'center' });

      // Recipient Name
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(129, 140, 248); // indigo-400
      doc.text(cert.user?.name || 'Student', 148.5, 85, { align: 'center' });

      // Body text
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      const eventName = cert.event?.title || 'Campus Event';
      doc.text(
        `for actively participating and successfully completing`,
        148.5,
        105,
        { align: 'center' }
      );

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 158, 11); // amber-500
      doc.text(eventName, 148.5, 120, { align: 'center' });

      // Issue date & verification ID
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const issueDate = new Date(cert.issueDate || cert.createdAt).toLocaleDateString();
      doc.text(`Issue Date: ${issueDate}`, 40, 160);
      doc.text(`Certificate ID: ${cert.certificateId || cert._id}`, 40, 168);

      // Signature / College Seal text
      doc.text('Authorized Campus Coordinator', 230, 160, { align: 'center' });
      doc.text('CollegeHub Academic Network', 230, 168, { align: 'center' });

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.line(185, 155, 275, 155);

      doc.save(`Certificate_${cert.certificateId || cert._id}.pdf`);
      showToast('Certificate PDF downloaded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate certificate PDF', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Award className="text-amber-400" />
          My Verified Certificates & Achievements
        </h1>
        <p className="text-sm text-slate-400">
          Digital certificates earned through legitimate campus event participation and verified attendance.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading your verified certificates..." />
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Certificates Earned Yet"
          description="Attend campus workshops, hackathons, seminars, and technical fests with verified attendance to receive certificates."
          actionText="Browse Upcoming Events"
          actionHref="/events"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="glass-card rounded-2xl overflow-hidden border border-slate-700/60 p-6 flex flex-col justify-between relative group hover:border-amber-500/40 transition-all shadow-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-1 line-clamp-2">
                  {cert.event?.title || 'Campus Event Certificate'}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Organizer: {cert.event?.organizer || 'CollegeHub'}
                </p>

                <div className="space-y-2 py-3 border-y border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Recipient:</span>
                    <span className="font-semibold text-slate-200">{cert.user?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Issued On:</span>
                    <span>{new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Certificate ID:</span>
                    <span className="font-mono text-[11px] text-indigo-400">{cert.certificateId || cert._id.slice(-8)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => downloadPDF(cert)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Download className="w-4 h-4" /> Download PDF Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
