import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Cpu } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import Skeleton from '../../components/Skeleton/Skeleton';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import './Diagnose.css';

const Diagnose = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [device, setDevice] = useState(null);
    const [symptoms, setSymptoms] = useState('');
    const [checklist, setChecklist] = useState({
        heat: false,
        noise: false,
        noPower: false,
        slow: false,
        screen: false
    });
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchDevice = async () => {
            try {
                const res = await api.get(`/devices/${id}`);
                setDevice(res.data.data);
            } catch (err) {
                toast.error('Failed to load device');
                navigate('/app/devices');
            } finally {
                setLoading(false);
            }
        };
        fetchDevice();
    }, [id, navigate]);

    const handleChecklistChange = (e) => {
        setChecklist({ ...checklist, [e.target.name]: e.target.checked });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (symptoms.length < 20) {
            return toast.error('Please describe symptoms in at least 20 characters');
        }

        const activeChecks = Object.keys(checklist).filter(k => checklist[k]).join(', ');
        const fullSymptoms = `${symptoms}. ${activeChecks ? 'Additional flags: ' + activeChecks : ''}`;

        setIsAnalyzing(true);
        setResult(null);
        
        try {
            const res = await api.post('/diagnoses', { device_id: Number(id), symptoms_text: fullSymptoms });
            setResult(res.data.data);
            toast.success('Diagnosis complete');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to complete diagnosis');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleStartGuide = async () => {
        try {
            const res = await api.post('/guides', { diagnosis_id: result.id });
            navigate(`/app/diagnoses/${result.id}/guide`);
        } catch (err) {
            if (err.response?.data?.message === 'Guide already exists') {
                navigate(`/app/diagnoses/${result.id}/guide`);
            } else {
                toast.error(err.response?.data?.message || 'Failed to start guide');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="diagnose-page">
            <button className="btn-icon mb-4" onClick={() => navigate(`/app/devices/${id}`)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={16} /> Back to Device
            </button>
            
            <div className="page-header">
                <div>
                    <h1>Diagnose Issue</h1>
                    <p className="text-muted">{device.brand} {device.model}</p>
                </div>
            </div>

            <div className="diagnose-content">
                <div className="diagnose-form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="symptoms">Describe the Symptoms</label>
                            <p className="text-sm text-muted mb-2">Be as detailed as possible to help our AI accurately identify the root cause.</p>
                            <textarea
                                id="symptoms"
                                className="form-control"
                                rows="5"
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                placeholder="E.g., The phone suddenly shut down and won't turn back on even when plugged in..."
                                minLength={20}
                                required
                            ></textarea>
                            <div className="char-count text-sm text-muted text-right mt-1">
                                {symptoms.length}/20 min chars
                            </div>
                        </div>

                        <div className="form-group mt-4">
                            <label>Quick Checklist (Optional)</label>
                            <div className="checklist-grid">
                                <label className="checklist-item">
                                    <input type="checkbox" name="heat" checked={checklist.heat} onChange={handleChecklistChange} />
                                    <span>Overheating</span>
                                </label>
                                <label className="checklist-item">
                                    <input type="checkbox" name="noise" checked={checklist.noise} onChange={handleChecklistChange} />
                                    <span>Strange Noises</span>
                                </label>
                                <label className="checklist-item">
                                    <input type="checkbox" name="noPower" checked={checklist.noPower} onChange={handleChecklistChange} />
                                    <span>No Power</span>
                                </label>
                                <label className="checklist-item">
                                    <input type="checkbox" name="slow" checked={checklist.slow} onChange={handleChecklistChange} />
                                    <span>Very Slow</span>
                                </label>
                                <label className="checklist-item">
                                    <input type="checkbox" name="screen" checked={checklist.screen} onChange={handleChecklistChange} />
                                    <span>Screen Issue</span>
                                </label>
                            </div>
                        </div>

                        <Button type="submit" variant="primary" loading={isAnalyzing} className="w-full mt-6" disabled={isAnalyzing || symptoms.length < 20}>
                            Analyze with AI
                        </Button>
                    </form>
                </div>

                <div className="diagnose-result-card">
                    {isAnalyzing ? (
                        <div className="analyzing-state">
                            <Cpu size={48} className="analyzing-icon pulse-animation" />
                            <h3>AI is analysing...</h3>
                            <p className="text-muted">Comparing your symptoms against millions of repair records.</p>
                            <div className="skeleton-container mt-6">
                                <Skeleton style={{ height: '2rem', width: '60%', marginBottom: '1rem' }} />
                                <Skeleton style={{ height: '1rem', width: '100%', marginBottom: '0.5rem' }} />
                                <Skeleton style={{ height: '1rem', width: '90%', marginBottom: '0.5rem' }} />
                                <Skeleton style={{ height: '1rem', width: '80%' }} />
                            </div>
                        </div>
                    ) : result ? (
                        <div className="result-state">
                            <div className="result-header">
                                <h3>Diagnostic Result</h3>
                                <Badge variant={
                                    result.ai_severity === 'critical' ? 'danger' :
                                    result.ai_severity === 'high' ? 'warning' :
                                    result.ai_severity === 'medium' ? 'primary' : 'success'
                                }>
                                    {result.ai_severity} Severity
                                </Badge>
                            </div>
                            
                            <div className="result-cause mb-4 mt-4">
                                <span className="text-muted text-sm uppercase">Root Cause</span>
                                <h4>{result.ai_root_cause}</h4>
                            </div>

                            <div className="result-confidence mb-6">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className="text-sm font-medium">AI Confidence</span>
                                    <span className="text-sm">{result.ai_confidence}%</span>
                                </div>
                                <ProgressBar value={result.ai_confidence} />
                            </div>

                            <div className="result-summary mb-6 p-4 bg-light rounded">
                                <p>{result.ai_summary}</p>
                            </div>

                            {result.is_fixable ? (
                                <div className="result-action">
                                    <Badge variant="success" className="mb-4 d-block w-fit">Fixable Issue</Badge>
                                    <Button variant="primary" className="w-full" onClick={handleStartGuide}>
                                        Start Repair Guide
                                    </Button>
                                </div>
                            ) : (
                                <div className="result-action">
                                    <Badge variant="danger" className="mb-4 d-block w-fit">Not Easily Fixable</Badge>
                                    <p className="text-muted text-sm">This issue requires professional repair or component replacement beyond standard DIY guides.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-result-state">
                            <Cpu size={48} className="text-muted mb-4 opacity-50" />
                            <p className="text-muted">Enter symptoms and click analyze to see results here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Diagnose;
