import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import gsap from 'gsap';

export default function ShoeModel(props) {
    const { nodes, materials } = useGLTF('/shoe.gltf');
    
    // Refs for the 3 main pieces
    const lacesRef = useRef();
    const upperRef = useRef(); // This will hold the ENTIRE top part of the shoe
    const soleRef = useRef();

    useEffect(() => {
        // 1. Initial "Exploded" State (Spread them vertically)
        gsap.set(lacesRef.current.position, { y: 2.5 });  // Laces high up
        gsap.set(upperRef.current.position, { y: 0 });    // Body in the middle
        gsap.set(soleRef.current.position, { y: -2.5 });  // Sole way down

        // 2. The gentle floating animation while waiting
        gsap.to([lacesRef.current.position, upperRef.current.position, soleRef.current.position], {
            y: "+=0.2",
            yoyo: true,
            repeat: -1,
            duration: 1.5,
            ease: "sine.inOut"
        });

        // 3. The Assembly Animation (Triggers after 5 seconds)
        const tl = gsap.timeline({ delay: 3 });

        // Note: 'overwrite: true' forces the floating animation to stop so it can snap perfectly into place
        tl.to(upperRef.current.position, { y: 0, duration: 0.8, ease: "power2.out", overwrite: true }, 0)
          .to(soleRef.current.position, { y: 0, duration: 1, ease: "back.out(1.2)", overwrite: true }, 0.2)
          .to(lacesRef.current.position, { y: 0, duration: 1, ease: "bounce.out", overwrite: true }, 0.4);

    }, []);

    // 🎨 Let's add custom colors so it looks like a real, premium shoe!
    // Feel free to change these hex codes to match your NeoShop brand
    const colors = {
        laces: "#ffffff",     // White laces
        mesh: "#ffffff",      // White main fabric
        caps: "#E11D48",      // Red toe caps/accents
        inner: "#1F2937",     // Dark gray inside lining
        sole: "#F3F4F6",      // Off-white/Gray sole
        stripes: "#000000",   // Black Swoosh/Stripes
        band: "#000000",      // Black band
        patch: "#E11D48",     // Red back patch
    };

    return (
        <group {...props} dispose={null}>
            
            {/* 1. LACES (Separated at the top) */}
            <mesh ref={lacesRef} geometry={nodes.shoe.geometry} material={materials.laces} material-color={colors.laces} />
            
            {/* 2. ENTIRE UPPER BODY (Grouped together so it doesn't break apart!) */}
            <group ref={upperRef}>
                <mesh geometry={nodes.shoe_1.geometry} material={materials.mesh} material-color={colors.mesh} />
                <mesh geometry={nodes.shoe_2.geometry} material={materials.caps} material-color={colors.caps} />
                <mesh geometry={nodes.shoe_3.geometry} material={materials.inner} material-color={colors.inner} />
                <mesh geometry={nodes.shoe_5.geometry} material={materials.stripes} material-color={colors.stripes} />
                <mesh geometry={nodes.shoe_6.geometry} material={materials.band} material-color={colors.band} />
                <mesh geometry={nodes.shoe_7.geometry} material={materials.patch} material-color={colors.patch} />
            </group>

            {/* 3. SOLE (Separated at the bottom) */}
            <mesh ref={soleRef} geometry={nodes.shoe_4.geometry} material={materials.sole} material-color={colors.sole} />
            
        </group>
    );
}

useGLTF.preload('/shoe.gltf');