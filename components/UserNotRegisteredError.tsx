import React from 'react';

const UserNotRegisteredError = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505]">
            <div className="max-w-md w-full p-8 bg-[#0a0a0a] rounded-2xl shadow-2xl border border-white/5">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-3xl bg-orange-500/10 border border-orange-500/20 shadow-inner">
                        <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Access Restricted</h1>
                    <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                        You are not registered to use this application. Please contact the app administrator to request access.
                    </p>
                    <div className="p-5 bg-white/5 rounded-xl text-xs text-zinc-500 border border-white/5 text-left space-y-3">
                        <p className="font-semibold text-zinc-300">If you believe this is an error, you can:</p>
                        <ul className="list-disc list-inside space-y-2 opacity-80">
                            <li>Verify you are logged in with the correct account</li>
                            <li>Contact the app administrator for access</li>
                            <li>Try logging out and back in again</li>
                        </ul>
                    </div>

                    <button className="mt-8 w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-900/20">
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserNotRegisteredError;
