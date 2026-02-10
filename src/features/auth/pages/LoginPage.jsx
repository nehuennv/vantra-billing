import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientConfig } from '../../../config/client';
import { toast } from 'sonner';
import { authAPI } from '../../../services/apiClient';
import { Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

// --- 1. COMPONENTE DE RUIDO (Noise Texture) ---
// Clave para la estética Arc: quita la sensación de "sitio web plano"
const NoiseOverlay = () => (
    <div
        className="absolute inset-0 pointer-events-none z-[50] opacity-[0.04] mix-blend-overlay"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
    />
);

const LoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Color principal (Fallback a negro si no existe)
    const primaryColor = clientConfig.colors?.primary || '#18181b';

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error('Información incompleta', {
                description: 'Por favor, completa todos los campos.',
                icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await authAPI.login({ email: username, password });

            if (response && response.token) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('vantra_user', JSON.stringify(response.user));

                toast.success('Sesión iniciada', {
                    description: `Bienvenido de nuevo a ${clientConfig.name}`,
                    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
                });
                navigate('/');
            } else {
                throw new Error("Respuesta inválida del servidor");
            }
        } catch (error) {
            console.error("Login Error:", error);

            // Mensaje genérico para seguridad y UX
            let description = 'Usuario o contraseña incorrectos.';

            // Solo diferenciamos si es un error de red claro
            if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Network'))) {
                description = 'Error de conexión con el servidor.';
            }

            toast.error('Error de acceso', {
                description: description,
                icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // --- 2. EL LIENZO (Canvas) ---
        // Fondo "Off-White" (Zinc-50/100) en lugar de blanco puro para calidez
        <div className="relative min-h-screen w-full flex items-center justify-center bg-[#F7F7F5] overflow-hidden font-sans selection:bg-black/10 selection:text-black">

            {/* TEXTURA GLOBAL */}
            <NoiseOverlay />

            {/* --- 3. BACKGROUND MESH (Sutil) --- */}
            {/* Gradientes desenfocados que se mueven muy lento detrás */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div
                    className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.08] animate-pulse"
                    style={{ backgroundColor: primaryColor }}
                />
                <div
                    className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-[0.06]"
                    style={{ backgroundColor: primaryColor }}
                />
            </div>

            {/* --- 4. LA TARJETA FLOTANTE (The Card) --- */}
            <div className="relative z-10 w-full max-w-[400px] p-6 sm:p-10 mx-4">

                {/* Estructura de la tarjeta: Vidrio esmerilado + Bordes internos brillantes */}
                <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-xl"
                    style={{
                        boxShadow: `0 20px 40px -10px ${primaryColor}15, 0 0 0 1px rgba(255,255,255,0.5) inset`
                    }}
                />

                {/* Contenido de la tarjeta */}
                <div className="relative z-20 flex flex-col items-center">

                    {/* LOGO MINIMALISTA (Squircle) */}
                    <div className="mb-8 relative group cursor-default">
                        <div
                            className="w-16 h-16 rounded-[20px] flex items-center justify-center text-2xl font-bold text-white shadow-lg transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-105"
                            style={{
                                backgroundColor: primaryColor,
                                boxShadow: `0 10px 25px -5px ${primaryColor}60`
                            }}
                        >
                            {/* Inicial del Cliente */}
                            {clientConfig.name.charAt(0).toUpperCase()}

                            {/* Brillo interno del logo */}
                            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-tr from-black/10 to-white/20 pointer-events-none" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-zinc-800 mb-2">
                        {clientConfig.name}
                    </h1>
                    <p className="text-sm text-zinc-500 font-medium mb-8 text-center">
                        Inicia sesión para acceder al dashboard
                    </p>

                    <form onSubmit={handleLogin} className="w-full space-y-4">

                        {/* INPUT: USUARIO */}
                        <div className="space-y-1.5 group">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-3 transition-colors group-focus-within:text-zinc-600">
                                Usuario
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full h-12 px-4 rounded-2xl bg-white/50 border border-zinc-200/80 focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition-all duration-300 outline-none text-zinc-800 text-sm font-medium placeholder:text-zinc-300 shadow-sm"
                                placeholder="usuario@vantra.com"
                            />
                        </div>

                        {/* INPUT: CONTRASEÑA */}
                        <div className="space-y-1.5 group">
                            <div className="flex justify-between items-center ml-3 mr-1">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest transition-colors group-focus-within:text-zinc-600">
                                    Contraseña
                                </label>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-2xl bg-white/50 border border-zinc-200/80 focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition-all duration-300 outline-none text-zinc-800 text-sm font-medium placeholder:text-zinc-300 shadow-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* BOTÓN "ARC" */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 mt-4 rounded-2xl font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center overflow-hidden relative"
                            style={{
                                backgroundColor: primaryColor,
                                boxShadow: `0 8px 20px -6px ${primaryColor}50` // Sombra de color suave
                            }}
                        >
                            {/* Efecto de luz superior */}
                            <div className="absolute top-0 inset-x-0 h-px bg-white/30" />

                            <div className="relative flex items-center gap-2">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Acceder</span>
                                        <ArrowRight className="w-4 h-4 opacity-80" />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>


                </div>
            </div>

            {/* Copyright Flotante */}
            <div className="absolute bottom-6 text-[10px] text-zinc-400 font-bold tracking-widest opacity-60">
                POWERED BY VANTRA
            </div>
        </div>
    );
};

export default LoginPage;