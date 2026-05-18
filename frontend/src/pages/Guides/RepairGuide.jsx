import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Clock, PenTool, AlertTriangle, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button/Button';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Alert from '../../components/Alert/Alert';
import './RepairGuide.css';

const RepairGuide = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [guide, setGuide] = useState(null);
    const [steps, setSteps] = useState([]);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [activeStepIdx, setActiveStepIdx] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGuide = async () => {
            try {
                const res = await api.get(`/guides/${id}`);
                setGuide(res.data.data);
                setSteps(JSON.parse(res.data.data.steps_json));
                setCompletedSteps(JSON.parse(res.data.data.completed_steps_json));
            } catch (err) {
                toast.error('Failed to load repair guide');
                navigate('/app/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchGuide();
    }, [id, navigate]);

    const handleMarkDone = async (stepIdx) => {
        const newCompleted = [...completedSteps, stepIdx];
        setCompletedSteps(newCompleted);
        
        try {
            await api.patch(`/guides/${id}/progress`, { completed_steps: newCompleted });
            if (stepIdx < steps.length - 1) {
                setActiveStepIdx(stepIdx + 1);
            }
        } catch (err) {
            toast.error('Failed to update progress');
            setCompletedSteps(completedSteps); // revert on error
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!guide || steps.length === 0) return <div>No guide found</div>;

    const activeStep = steps[activeStepIdx];
    const isDone = completedSteps.includes(activeStepIdx);
    const progress = (completedSteps.length / steps.length) * 100;
    const allDone = completedSteps.length === steps.length;

    return (
        <div className="guide-page">
            <button className="btn-icon mb-4" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={16} /> Back
            </button>
            
            <div className="guide-header">
                <div>
                    <h1>Repair Guide</h1>
                    <p className="text-muted">Follow these steps carefully to complete the repair.</p>
                </div>
                <div className="guide-progress-info">
                    <span className="text-sm font-medium">{completedSteps.length} / {steps.length} steps completed</span>
                    <ProgressBar value={progress} className="mt-2" />
                </div>
            </div>

            {allDone ? (
                <div className="completion-card">
                    <div className="completion-icon"><CheckCircle size={64} /></div>
                    <h2>Repair Complete!</h2>
                    <p className="text-muted mb-6">You've successfully completed all steps in this repair guide.</p>
                    <Button variant="primary" onClick={() => navigate('/app/reports')}>Generate Report</Button>
                </div>
            ) : (
                <div className="guide-content">
                    <div className="guide-sidebar">
                        <h3>Steps</h3>
                        <div className="step-list">
                            {steps.map((step, idx) => {
                                const isCompleted = completedSteps.includes(idx);
                                const isActive = activeStepIdx === idx;
                                return (
                                    <div 
                                        key={idx} 
                                        className={`step-item ${isCompleted ? 'step-item--completed' : ''} ${isActive ? 'step-item--active' : ''}`}
                                        onClick={() => setActiveStepIdx(idx)}
                                    >
                                        <div className="step-item__indicator">
                                            {isCompleted ? <CheckCircle size={16} /> : <span>{idx + 1}</span>}
                                        </div>
                                        <div className="step-item__title">{step.title}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="guide-main">
                        {activeStep.warning && activeStep.warning.toLowerCase().includes('missing') && (
                            <Alert variant="warning" className="mb-4">
                                Need a part? <Link to="/app/parts">View Recommendations</Link>
                            </Alert>
                        )}
                        
                        <div className="active-step-card">
                            <div className="active-step-header">
                                <h2 className="active-step-title">Step {activeStepIdx + 1}: {activeStep.title}</h2>
                                {activeStep.estimated_minutes && (
                                    <div className="time-badge">
                                        <Clock size={14} /> {activeStep.estimated_minutes} min
                                    </div>
                                )}
                            </div>

                            {activeStep.warning && (
                                <Alert variant="warning" className="mb-6">
                                    <strong>Warning:</strong> {activeStep.warning}
                                </Alert>
                            )}

                            {activeStep.tools_needed && activeStep.tools_needed.length > 0 && (
                                <div className="tools-section mb-6">
                                    <h4 className="flex-align-center gap-2 mb-2"><PenTool size={16} /> Tools Needed:</h4>
                                    <div className="tools-list">
                                        {activeStep.tools_needed.map((tool, i) => (
                                            <span key={i} className="tool-chip">{tool}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="instruction-section mb-8">
                                <h4>Instructions:</h4>
                                <p className="instruction-text">{activeStep.instruction}</p>
                            </div>

                            <div className="step-actions">
                                <Button 
                                    variant={isDone ? "secondary" : "primary"}
                                    onClick={() => handleMarkDone(activeStepIdx)}
                                    disabled={isDone}
                                >
                                    {isDone ? 'Completed' : 'Mark as Done'}
                                </Button>
                                
                                {activeStepIdx < steps.length - 1 && (
                                    <Button variant="ghost" onClick={() => setActiveStepIdx(activeStepIdx + 1)}>
                                        Next Step <ChevronRight size={16} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepairGuide;
