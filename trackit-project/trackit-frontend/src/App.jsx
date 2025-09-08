import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
// Removed: import pdfParse from 'pdf-parse'; // This cannot be run in the browser
import { Renderer, Triangle, Program, Mesh } from 'ogl';

// --- SUPABASE CLIENT SETUP ---
// This part is crucial. Make sure your Vercel environment variables are correctly named.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This check will now reliably tell you if the variables are missing during deployment.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("CRITICAL ERROR: Supabase URL and/or Anon Key are missing from environment variables.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- PRISM BACKGROUND COMPONENT (No changes needed here) ---
const Prism = ({
  height = 3.5, baseWidth = 5.5, animationType = 'rotate', glow = 1,
  offset = { x: 0, y: 0 }, noise = 0.5, transparent = true, scale = 3.6,
  hueShift = 0, colorFrequency = 1, hoverStrength = 2, inertia = 0.05,
  bloom = 1, suspendWhenOffscreen = false, timeScale = 0.5
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let onPointerMove, onLeave, onBlur, onMove;

    const H = Math.max(0.001, height);
    const BW = Math.max(0.001, baseWidth);
    const BASE_HALF = BW * 0.5;
    const GLOW = Math.max(0.0, glow);
    const NOISE = Math.max(0.0, noise);
    const offX = offset?.x ?? 0;
    const offY = offset?.y ?? 0;
    const SAT = transparent ? 1.5 : 1;
    const SCALE = Math.max(0.001, scale);
    const HUE = hueShift || 0;
    const CFREQ = Math.max(0.0, colorFrequency || 1);
    const BLOOM = Math.max(0.0, bloom || 1);
    const RSX = 1;
    const RSY = 1;
    const RSZ = 1;
    const TS = Math.max(0, timeScale || 1);
    const HOVSTR = Math.max(0, hoverStrength || 1);
    const INERT = Math.max(0, Math.min(1, inertia || 0.12));

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const renderer = new Renderer({ dpr, alpha: transparent, antialias: false });
    const gl = renderer.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    Object.assign(gl.canvas.style, {
      position: 'absolute', inset: '0', width: '100%',
      height: '100%', display: 'block'
    });
    container.appendChild(gl.canvas);

    const vertex = `attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
    const fragment = `precision highp float;
      uniform vec2 iResolution; uniform float iTime;
      uniform float uHeight; uniform float uBaseHalf; uniform mat3 uRot;
      uniform int uUseBaseWobble; uniform float uGlow; uniform vec2 uOffsetPx;
      uniform float uNoise; uniform float uSaturation; uniform float uScale;
      uniform float uHueShift; uniform float uColorFreq; uniform float uBloom;
      uniform float uCenterShift; uniform float uInvBaseHalf; uniform float uInvHeight;
      uniform float uMinAxis; uniform float uPxScale; uniform float uTimeScale;

      vec4 tanh4(vec4 x){ vec4 e2x = exp(2.0*x); return (e2x - 1.0) / (e2x + 1.0); }
      float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
      float sdOctaAnisoInv(vec3 p){
        vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
        return (q.x + q.y + q.z - 1.0) * uMinAxis * 0.57735;
      }
      float sdPyramidUpInv(vec3 p){ return max(sdOctaAnisoInv(p), -p.y); }
      mat3 hueRotation(float a){
        float c = cos(a), s = sin(a);
        mat3 W = mat3(0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114);
        mat3 U = mat3(0.701, -0.587, -0.114, -0.299, 0.413, -0.114, -0.300, -0.588, 0.886);
        mat3 V = mat3(0.168, -0.331, 0.500, 0.328, 0.035, -0.500, -0.497, 0.296, 0.201);
        return W + U * c + V * s;
      }
      void main(){
        vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;
        float z = 5.0, d; vec3 p; vec4 o = vec4(0.0);
        mat2 wob = mat2(1.0);
        if (uUseBaseWobble == 1) {
          float t = iTime * uTimeScale;
          wob = mat2(cos(t), sin(t), -sin(t), cos(t));
        }
        for (int i = 0; i < 100; i++) {
          p = vec3(f, z); p.xz = p.xz * wob; p = uRot * p;
          vec3 q = p; q.y += uCenterShift;
          d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
          z -= d;
          o += (sin((p.y + z) * uColorFreq + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
        }
        o = tanh4(o * o * (uGlow * uBloom) / 1e5);
        vec3 col = o.rgb;
        col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);
        float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);
        if(abs(uHueShift) > 0.0001){ col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0); }
        gl_FragColor = vec4(col, o.a);
      }`;

    const geometry = new Triangle(gl);
    const iResBuf = new Float32Array(2);
    const offsetPxBuf = new Float32Array(2);
    const program = new Program(gl, { vertex, fragment, uniforms: {
      iResolution: { value: iResBuf }, iTime: { value: 0 },
      uHeight: { value: H }, uBaseHalf: { value: BASE_HALF },
      uUseBaseWobble: { value: 1 }, uRot: { value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) },
      uGlow: { value: GLOW }, uOffsetPx: { value: offsetPxBuf }, uNoise: { value: NOISE },
      uSaturation: { value: SAT }, uScale: { value: SCALE }, uHueShift: { value: HUE },
      uColorFreq: { value: CFREQ }, uBloom: { value: BLOOM }, uCenterShift: { value: H * 0.25 },
      uInvBaseHalf: { value: 1 / BASE_HALF }, uInvHeight: { value: 1 / H },
      uMinAxis: { value: Math.min(BASE_HALF, H) },
      uPxScale: { value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE) },
      uTimeScale: { value: TS }
    }});
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      iResBuf[0] = gl.drawingBufferWidth; iResBuf[1] = gl.drawingBufferHeight;
      offsetPxBuf[0] = offX * dpr; offsetPxBuf[1] = offY * dpr;
      program.uniforms.uPxScale.value = 1 / (gl.drawingBufferHeight * 0.1 * SCALE);
    };
    const ro = new ResizeObserver(resize); ro.observe(container); resize();

    const rotBuf = new Float32Array(9);
    const setMat3FromEuler = (yawY, pitchX, rollZ, out) => {
      const cy = Math.cos(yawY), sy = Math.sin(yawY), cx = Math.cos(pitchX), sx = Math.sin(pitchX), cz = Math.cos(rollZ), sz = Math.sin(rollZ);
      out[0]=cy*cz+sy*sx*sz; out[1]=cx*sz; out[2]=-sy*cz+cy*sx*sz;
      out[3]=-cy*sz+sy*sx*cz; out[4]=cx*cz; out[5]=sy*sz+cy*sx*cz;
      out[6]=sy*cx; out[7]=-sx; out[8]=cy*cx;
      return out;
    };

    let raf = 0; const t0 = performance.now();
    const startRAF = () => { if (!raf) raf = requestAnimationFrame(render); };
    const stopRAF = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

    const rnd = Math.random; const wX = (0.3+rnd()*0.6)*RSX; const wY = (0.2+rnd()*0.7)*RSY; const wZ = (0.1+rnd()*0.5)*RSZ;
    const phX = rnd()*Math.PI*2; const phZ = rnd()*Math.PI*2;
    let yaw=0, pitch=0, roll=0; let targetYaw=0, targetPitch=0;
    const lerp = (a, b, t) => a + (b - a) * t;
    const pointer = { x: 0, y: 0, inside: true };
    
    if (animationType === 'hover') {
      onMove = (e) => {
        const ww = window.innerWidth, wh = window.innerHeight;
        pointer.x = (e.clientX - ww*0.5)/(ww*0.5); pointer.y = (e.clientY-wh*0.5)/(wh*0.5); pointer.inside = true;
        startRAF();
      };
      onLeave = () => { pointer.inside = false; };
      onBlur = () => { pointer.inside = false; };
      window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('mouseleave', onLeave); window.addEventListener('blur', onBlur);
      program.uniforms.uUseBaseWobble.value = 0;
    } else { program.uniforms.uUseBaseWobble.value = animationType === 'rotate' ? 1 : 0; }

    const render = (t) => {
      const time = (t - t0) * 0.001;
      program.uniforms.iTime.value = time;
      let continueRAF = true;
      if (animationType === 'hover') {
        targetYaw = (pointer.inside ? -pointer.x : 0) * 0.6 * HOVSTR; targetPitch = (pointer.inside ? pointer.y : 0) * 0.6 * HOVSTR;
        yaw = lerp(yaw, targetYaw, INERT); pitch = lerp(pitch, targetPitch, INERT); roll = lerp(roll, 0, 0.1);
        if (NOISE < 1e-6 && Math.abs(yaw-targetYaw)<1e-4 && Math.abs(pitch-targetPitch)<1e-4) continueRAF=false;
      } else if (animationType === '3drotate') {
        const tScaled = time * TS;
        yaw = tScaled * wY; pitch = Math.sin(tScaled * wX + phX) * 0.6; roll = Math.sin(tScaled * wZ + phZ) * 0.5;
        if (TS < 1e-6) continueRAF = false;
      } else { if (TS < 1e-6) continueRAF = false; }
      program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);
      renderer.render({ scene: mesh });
      if (continueRAF) raf = requestAnimationFrame(render); else raf = 0;
    };
    if (suspendWhenOffscreen) {
      const io = new IntersectionObserver(e=>e[0].isIntersecting ? startRAF() : stopRAF()); io.observe(container);
      container.__prismIO = io;
    } else { startRAF(); }

    return () => {
      stopRAF(); ro.disconnect();
      if(onMove) window.removeEventListener('pointermove', onMove);
      if(onLeave) window.removeEventListener('mouseleave', onLeave);
      if(onBlur) window.removeEventListener('blur', onBlur);
      if (container.__prismIO) container.__prismIO.disconnect();
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    };
  }, [height, baseWidth, animationType, glow, noise, offset, scale, transparent, hueShift, colorFrequency, timeScale, hoverStrength, inertia, bloom, suspendWhenOffscreen]);

  return <div className="prism-container" ref={containerRef} />;
};

// --- ICONS (No changes needed) ---
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
             <div className="absolute inset-0 z-0">
                <Prism animationType="3drotate" bloom={0.5} glow={1} />
            </div>
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

// --- MODIFIED AddSubjectPage ---
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
            // STEP 1: Upload the file to a serverless function to be parsed.
            // You will need to create a new file like `/api/parse-syllabus.js` in your Vercel project.
            
            const formData = new FormData();
            formData.append('syllabus', file);
            formData.append('examName', name);

            // Replace with your actual Vercel deployment URL
            const response = await fetch('/api/parse-syllabus', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to parse syllabus.');
            }

            const syllabus = await response.json();

            // STEP 2: Save the parsed data to Supabase.
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