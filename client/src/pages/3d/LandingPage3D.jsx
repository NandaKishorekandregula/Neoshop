import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, Environment, ContactShadows } from '@react-three/drei';
import ShoeModel from '../../components/3d/ShoeModel';

function AutoRotatingShoe({ children }) {
    const groupRef = useRef();
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
        }
    });
    return <group ref={groupRef}>{children}</group>;
}

export default function LandingPage3D({ is3DMode, setIs3DMode }) {
    return (
        <div className="w-full h-[calc(100vh-80px)] bg-[#F8F9FE] relative flex items-center justify-center overflow-hidden">

            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-400/30 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>

            <div className="absolute z-0 flex items-center justify-center w-full h-full pointer-events-none select-none opacity-40">
                <h1 className="text-[15vw] font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-[#F8F9FE] tracking-tighter">
                    STYLE.
                </h1>
            </div>

            <div className="w-full h-full absolute top-0 left-0 cursor-grab active:cursor-grabbing z-10">
                <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
                    <ambientLight intensity={0.6} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} color="#fbcfe8" />
                    <spotLight position={[-10, 10, -10]} angle={0.15} penumbra={1} intensity={0.5} color="#c084fc" />
                    <Environment preset="city" />

                    <Suspense fallback={null}>
                        <PresentationControls global={true} cursor={true} snap={{ mass: 4, tension: 400 }}>
                            <AutoRotatingShoe>
                                {/* 🌟 FIX: Moved the shoe UP to Y: -0.1 */}
                                <ShoeModel position={[0, -0.1, 0]} />
                            </AutoRotatingShoe>
                        </PresentationControls>

                        {/* 🌟 FIX: Moved the shadow UP to Y: -0.8 so it stays under the shoe */}
                        <ContactShadows position={[0, -0.8, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#86198f" />
                    </Suspense>
                </Canvas>
            </div>

            {/* --- THE TOGGLE SWITCH --- */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
                <span className="text-xs font-bold tracking-widest text-gray-400 uppercase drop-shadow-sm">Select Experience</span>
                <div onClick={() => setIs3DMode(!is3DMode)} className="relative flex items-center w-[280px] h-[64px] bg-[#F8F9FE] rounded-full p-2 cursor-pointer shadow-[inset_6px_6px_12px_#dce1f0,inset_-6px_-6px_12px_#ffffff]">
                    <div className="absolute w-full flex justify-between px-8 text-gray-400 font-bold z-0 pointer-events-none text-[11px] tracking-wider">
                        <span className="w-[120px] text-center">2D LOOKBOOK</span>
                        <span className="w-[120px] text-center">3D STUDIO</span>
                    </div>
                    <div className={`relative flex items-center justify-center w-[130px] h-[48px] bg-[#F8F9FE] rounded-full shadow-[4px_4px_8px_#dce1f0,-4px_-4px_8px_#ffffff] transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)] z-10 ${is3DMode ? 'translate-x-[134px]' : 'translate-x-0'}`}>
                        <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-black text-xs tracking-wider">{is3DMode ? '3D STUDIO' : '2D LOOKBOOK'}</span>
                    </div>
                </div>
            </div>

        </div>
    );
}