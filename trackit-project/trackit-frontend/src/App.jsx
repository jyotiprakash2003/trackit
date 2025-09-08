import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CLIENT SETUP ---
const supabaseUrl = 'https://ykptuwbyzwxjxbyigqmo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcHR1d2J5end4anhieWlncW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODUwNDgsImV4cCI6MjA3Mjg2MTA0OH0.viwkGUMYdNHDjCtjHx1pXLEi8hEYnxYS6a_8ViA5E-U';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("CRITICAL ERROR: Supabase URL and Key are not configured correctly.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- ICONS ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v-2H6.5A2.5 2.5 0 0 1 4 12.5v-5A2.5 2.5 0 0 1 6.5 5H20V3H6.5A2.5 2.5 0 0 1 4 5.5v14z"></path></svg>;
const CheckIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-green-300"><path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const SignOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;


// --- PAGE COMPONENTS ---

const AuthPage = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        
        const authMethod = isLogin ? supabase.auth.signInWithPassword : supabase.auth.signUp;
        const { error } = await authMethod({ email, password });

        if (error) {
            setMessage(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gray-900">
            {/* The Prism component was here and has been removed */}
            <div className="relative z-10 w-full max-w-sm mx-auto p-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700">
                <h1 className="text-4xl font-bold text-white mb-6 text-center">TrackIT</h1>
                <form onSubmit={handleAuth} className="space-y-6">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-900 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" required />
                    <input type="password" placeholder="Password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-900 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" required />
                    <button type="submit" disabled={loading} className="w-full p-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-500">
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-400 mt-4">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-blue-400 hover:underline ml-1">
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
                {message && <p className="text-center text-red-400 mt-4">{message}</p>}
            </div>
        </div>
    );
};

const DashboardPage = ({ setPage, subjects, setActiveSubjectId, signOut, deleteSubject, user }) => (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 min-h-screen">
         <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                {user && <p className="text-xl text-gray-400 mt-1">Welcome, {user.email}</p>}
            </div>
            <button 
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/50 text-white font-semibold rounded-lg border border-red-500 hover:bg-red-600 transition-colors"
            >
                <SignOutIcon/>
                Sign Out
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
            {subjects.map(subject => (
                <div key={subject.id} className="relative group aspect-square bg-gray-800/50 rounded-2xl border border-gray-700 transition-all duration-300 hover:border-blue-500">
                    <button onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id) }} className="absolute top-3 right-3 z-10 p-2 bg-red-500/50 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all" aria-label="Delete subject"><XIcon /></button>
                    <button onClick={() => { setActiveSubjectId(subject.id); setPage('tracker'); }} className="w-full h-full flex flex-col items-center justify-center p-4 hover:bg-blue-900/50 rounded-2xl">
                        <BookIcon /><span className="mt-4 text-lg font-semibold text-center">{subject.name}</span>
                    </button>
                </div>
            ))}
            <button onClick={() => setPage('addSubject')} className="aspect-square flex flex-col items-center justify-center p-4 bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-600 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-300">
                <PlusIcon /><span className="mt-4 text-lg font-semibold">Add Subject</span>
            </button>
        </div>
    </div>
);

const AddSubjectPage = ({ setPage, onSubjectAdded }) => {
    const [name, setName] = useState('');
    const [faculty, setFaculty] = useState('');
    const [examDate, setExamDate] = useState('');
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files) setFile(e.target.files[0]);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !examDate || !file) {
            setError('Please fill all required fields.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            // This is still placeholder data. You will need to implement 
            // a serverless function to handle the actual PDF parsing. (updated)
            const syllabus = {
                examName: name,
                topics: [
                    { id: 't1', title: 'Placeholder Topic 1', topicWeightage: 50, subTopics: [
                        { id: 'st1-1', title: 'Placeholder Sub-Topic 1.1', weightage: 25, completed: false },
                        { id: 'st1-2', title: 'Placeholder Sub-Topic 1.2', weightage: 25, completed: false }
                    ]},
                    { id: 't2', title: 'Placeholder Topic 2', topicWeightage: 50, subTopics: [
                        { id: 'st2-1', title: 'Placeholder Sub-Topic 2.1', weightage: 50, completed: false }
                    ]}
                ]
            };
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const { data: newSubject, error: insertError } = await supabase
                .from('subjects')
                .insert({ name, faculty, exam_date: examDate, syllabus, user_id: user.id })
                .select()
                .single();

            if (insertError) throw insertError;

            onSubjectAdded(newSubject);
            setPage('dashboard');

        } catch (err) {
            setError('Failed to save syllabus. ' + err.message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 min-h-screen flex items-center justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-800/50 p-8 rounded-2xl border border-gray-700">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">Add Your Subject</h1>
                <div className="space-y-6">
                    <input type="text" placeholder="Subject Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-900 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" required />
                    <input type="text" placeholder="Faculty Name (Optional)" value={faculty} onChange={e => setFaculty(e.target.value)} className="w-full p-3 bg-gray-900 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" />
                    <input type="datetime-local" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full p-3 bg-gray-900 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500" required />
                    <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" required />
                </div>
                <button type="submit" disabled={isLoading} className="w-full mt-8 p-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-500">
                    {isLoading ? 'Processing...' : 'Save & Track'}
                </button>
                {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            </form>
        </div>
    );
};


const TrackerPage = ({ subject: initialSubject, onUpdateSubject }) => {
    const [subject, setSubject] = useState(initialSubject);

    const handleToggle = async (topicId, subTopicId) => {
        const newSyllabus = JSON.parse(JSON.stringify(subject.syllabus));
        const topic = newSyllabus.topics.find(t => t.id === topicId);
        const subTopic = topic.subTopics.find(st => st.id === subTopicId);
        subTopic.completed = !subTopic.completed;
        const updatedSubject = { ...subject, syllabus: newSyllabus };
        setSubject(updatedSubject);
        onUpdateSubject(updatedSubject);
    };
    
    const Timer = ({ targetDate }) => {
        const calculateTimeLeft = useCallback(() => {
            const difference = +new Date(targetDate) - +new Date();
            return difference > 0 ? { days: Math.floor(difference / (1000*60*60*24)), hours: Math.floor((difference/(1000*60*60))%24), minutes: Math.floor((difference/1000/60)%60), seconds: Math.floor((difference/1000)%60)} : {};
        }, [targetDate]);
        const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
        useEffect(() => { const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000); return () => clearTimeout(timer); });
        return (<div className="grid grid-cols-4 gap-4 my-8 max-w-2xl mx-auto">{Object.keys(timeLeft).length ? Object.entries(timeLeft).map(([unit, value]) => (<div key={unit} className="text-center p-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50"><div className="text-4xl lg:text-5xl font-bold text-gray-50 tracking-tight">{String(value).padStart(2, '0')}</div><div className="text-xs uppercase text-gray-400 mt-1">{unit}</div></div>)) : <div className="col-span-4 text-center text-3xl font-bold text-green-400">Exam Day!</div>}</div>);
    };
    
    const ProgressBar = ({ progress }) => {
        const percentage = Math.round(progress);
        return (<div className="w-full my-8 max-w-2xl mx-auto"><div className="flex justify-between mb-2"><span className="text-base font-medium text-blue-300">Completion</span><span className="text-sm font-bold text-gray-50">{percentage}%</span></div><div className="w-full bg-gray-700/50 rounded-full h-3 relative overflow-hidden"><div className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%` }}/></div></div>);
    };
    
    const progress = subject.syllabus.topics.reduce((acc, topic) => acc + topic.subTopics.reduce((subAcc, sub) => sub.completed ? subAcc + sub.weightage : subAcc, 0), 0);
    
    return (<div className="w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 min-h-screen"><div className="max-w-4xl mx-auto"><h1 className="text-4xl font-bold text-white mb-2">{subject.name}</h1><p className="text-gray-400">Faculty: {subject.faculty}</p><Timer targetDate={subject.exam_date} /><ProgressBar progress={progress} /></div><div className="space-y-6 mt-8">{subject.syllabus.topics.map(topic => (<div key={topic.id} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 max-w-4xl mx-auto"><h3 className="text-xl font-bold text-cyan-400 mb-4">{topic.title}</h3><ul className="space-y-3">{topic.subTopics.map(subTopic => (<li key={subTopic.id}><label className="flex items-center p-4 bg-gray-900/50 rounded-lg hover:bg-gray-800/70 cursor-pointer transition-colors duration-200 border border-transparent hover:border-blue-600 group"><div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md border-2 ${subTopic.completed ? 'bg-green-500 border-green-400' : 'border-gray-500 group-hover:border-blue-500'}`}><input type="checkbox" checked={subTopic.completed} onChange={() => handleToggle(topic.id, subTopic.id)} className="hidden"/>{subTopic.completed && <CheckIcon />}</div><span className={`ml-4 text-md flex-grow ${subTopic.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>{subTopic.title}</span><span className="ml-4 text-xs font-mono bg-gray-700/80 text-gray-300 px-2 py-1 rounded-full">{subTopic.weightage.toFixed(2)}%</span></label></li>))}</ul></div>))}</div></div>);
};

const Header = ({ setPage }) => (
    <header className="absolute top-0 left-0 right-0 p-6 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <button onClick={() => setPage('dashboard')} className="text-2xl font-bold tracking-tight text-white hover:text-blue-400 transition-colors">
                TrackIT
            </button>
        </div>
    </header>
);

// --- MAIN APP ---
function App() {
    const [session, setSession] = useState(null);
    const [page, setPage] = useState('dashboard');
    const [subjects, setSubjects] = useState([]);
    const [activeSubjectId, setActiveSubjectId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        
        return () => subscription.unsubscribe();
    }, []);

    const fetchSubjects = useCallback(async () => {
        if (!session) return;
        const { data, error } = await supabase.from('subjects').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching subjects:', error);
        else setSubjects(data);
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchSubjects();
        }
    }, [session, fetchSubjects]);

    const signOut = () => supabase.auth.signOut();
    
    const deleteSubject = async (id) => {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) console.error('Error deleting subject:', error);
        else setSubjects(subjects.filter(s => s.id !== id));
    };

    const handleSubjectAdded = (newSubject) => {
         setSubjects(currentSubjects => [newSubject, ...currentSubjects]);
    }

    const handleUpdateSubject = async (updatedSubject) => {
        const { id, syllabus } = updatedSubject;
        const { error } = await supabase.from('subjects').update({ syllabus }).eq('id', id);
        if(error) console.error('Failed to update subject:', error);
    }

    if (loading) {
        return <div className="bg-gray-900 h-screen w-screen flex items-center justify-center text-white text-xl">Loading TrackIT...</div>;
    }
    
    if (!session) {
        return <AuthPage />;
    }

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    
    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <DashboardPage setPage={setPage} subjects={subjects} setActiveSubjectId={setActiveSubjectId} signOut={signOut} deleteSubject={deleteSubject} user={session.user} />;
            case 'addSubject': return <AddSubjectPage setPage={setPage} onSubjectAdded={handleSubjectAdded} />;
            case 'tracker': return activeSubject ? <TrackerPage subject={activeSubject} onUpdateSubject={handleUpdateSubject} /> : <DashboardPage setPage={setPage} subjects={subjects} setActiveSubjectId={setActiveSubjectId} signOut={signOut} deleteSubject={deleteSubject} user={session.user} />;
            default: return <DashboardPage setPage={setPage} subjects={subjects} setActiveSubjectId={setActiveSubjectId} signOut={signOut} deleteSubject={deleteSubject} user={session.user} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white font-sans">
            <Header setPage={setPage} />
            <main>{renderPage()}</main>
        </div>
    );
}

export default App;