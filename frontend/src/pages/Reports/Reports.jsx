import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FileText, Printer } from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import EmptyState from '../../components/EmptyState/EmptyState';
import './Reports.css';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports');
            setReports(res.data.data);
        } catch (err) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handlePrint = (report) => {
        const printWindow = window.open('', '_blank');
        const reportContent = `
            <html>
            <head>
                <title>Report - ${report.device_name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                    .header { border-bottom: 2px solid #1a56db; padding-bottom: 20px; margin-bottom: 30px; }
                    h1 { color: #1a56db; margin: 0; }
                    .meta { color: #666; margin-top: 10px; }
                    .section { margin-bottom: 30px; }
                    h2 { font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                    .box { background: #f9f9f9; padding: 15px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>TechCare AI - Diagnostic Report</h1>
                    <div class="meta">
                        <p><strong>Device:</strong> ${report.device_name}</p>
                        <p><strong>Serial Number:</strong> ${report.device_sn}</p>
                        <p><strong>Date:</strong> ${new Date(report.generated_at).toLocaleString()}</p>
                    </div>
                </div>

                <div class="section">
                    <h2>Diagnosis</h2>
                    <div class="box">
                        <p><strong>Issue:</strong> ${report.diagnosis_summary}</p>
                    </div>
                </div>

                <div class="section">
                    <h2>Repair Steps</h2>
                    <div class="box">
                        <p><strong>Total Steps:</strong> ${report.total_steps}</p>
                        <p><strong>Completed Steps:</strong> ${report.completed_steps}</p>
                        <p><strong>Status:</strong> ${report.completed_steps === report.total_steps ? 'Completed' : 'In Progress'}</p>
                    </div>
                </div>

                <div class="section">
                    <h2>Related Orders</h2>
                    <div class="box">
                        <p><strong>Total Spent:</strong> $${report.total_spent.toFixed(2)}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    if (loading) return <div>Loading...</div>;

    const columns = [
        { header: 'Device', accessor: 'device_name' },
        { header: 'Date', accessor: 'generated_at', render: (row) => new Date(row.generated_at).toLocaleDateString() },
        { header: 'Diagnosis', accessor: 'diagnosis_summary', render: (row) => (
            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.diagnosis_summary}
            </div>
        )},
        { header: 'Progress', accessor: 'progress', render: (row) => `${row.completed_steps}/${row.total_steps} steps` },
        { header: 'Spent', accessor: 'total_spent', render: (row) => `$${row.total_spent.toFixed(2)}` },
        { header: 'Actions', accessor: 'id', render: (row) => (
            <Button variant="ghost" onClick={() => handlePrint(row)}>
                <Printer size={16} className="me-2" /> Print
            </Button>
        )}
    ];

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1>Diagnostic Reports</h1>
                    <p className="text-muted">History of your repairs and related expenditures.</p>
                </div>
            </div>

            {reports.length === 0 ? (
                <EmptyState 
                    icon={FileText}
                    title="No reports generated"
                    description="Reports are automatically generated when you diagnose devices and follow repair guides."
                />
            ) : (
                <div className="reports-container">
                    <Table columns={columns} data={reports} />
                </div>
            )}
        </div>
    );
};

export default Reports;
