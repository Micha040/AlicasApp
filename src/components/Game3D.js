import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, IconButton, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const COIN_COUNT = 10;
const GAME_TIME = 30; // Sekunden
const PLAYER_SPEED = 0.12;

function getRandomPosition(range = 4) {
  return [
    (Math.random() - 0.5) * range * 2,
    0.2,
    (Math.random() - 0.5) * range * 2
  ];
}

function Game3D() {
  const mountRef = useRef(null);
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameActive, setGameActive] = useState(true);
  const [direction, setDirection] = useState({ left: false, right: false, up: false, down: false });

  // Für mobile Buttons
  const handleTouch = (dir, value) => {
    setDirection(prev => ({ ...prev, [dir]: value }));
  };

  useEffect(() => {
    if (!gameActive) return;
    if (timeLeft <= 0) {
      setGameActive(false);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameActive]);

  useEffect(() => {
    let scene, camera, renderer, player, coins = [], controls;
    let animationId;
    let velocity = new THREE.Vector3();
    let collected = 0;
    let coinMeshes = [];
    let running = true;

    // Szene & Kamera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 7);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x222233);
    mountRef.current.appendChild(renderer.domElement);

    // Licht
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Boden
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x226622 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Spieler (Kugel)
    const playerGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const playerMat = new THREE.MeshPhongMaterial({ color: 0xff4081 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 0.3, 0);
    scene.add(player);

    // Münzen
    for (let i = 0; i < COIN_COUNT; i++) {
      const coinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 32);
      const coinMat = new THREE.MeshPhongMaterial({ color: 0xffd700 });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      const [x, y, z] = getRandomPosition();
      coin.position.set(x, y, z);
      coin.rotation.x = Math.PI / 2;
      scene.add(coin);
      coins.push({ mesh: coin, collected: false });
      coinMeshes.push(coin);
    }

    // Steuerung: Keyboard
    const keyMap = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      a: 'left',
      d: 'right',
      w: 'up',
      s: 'down',
    };
    const downHandler = (e) => {
      if (keyMap[e.key]) setDirection(prev => ({ ...prev, [keyMap[e.key]]: true }));
    };
    const upHandler = (e) => {
      if (keyMap[e.key]) setDirection(prev => ({ ...prev, [keyMap[e.key]]: false }));
    };
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    // Animation
    function animate() {
      if (!running) return;
      animationId = requestAnimationFrame(animate);
      // Spieler bewegen
      if (gameActive) {
        velocity.set(0, 0, 0);
        if (direction.left) velocity.x -= PLAYER_SPEED;
        if (direction.right) velocity.x += PLAYER_SPEED;
        if (direction.up) velocity.z -= PLAYER_SPEED;
        if (direction.down) velocity.z += PLAYER_SPEED;
        player.position.add(velocity);
        // Spielfeldbegrenzung
        player.position.x = Math.max(-4.7, Math.min(4.7, player.position.x));
        player.position.z = Math.max(-4.7, Math.min(4.7, player.position.z));
      }
      // Münzen drehen & Kollision
      coins.forEach((coin, i) => {
        if (!coin.collected) {
          coin.mesh.rotation.y += 0.07;
          // Kollision
          if (gameActive && player.position.distanceTo(coin.mesh.position) < 0.38) {
            coin.collected = true;
            scene.remove(coin.mesh);
            collected++;
            setScore(s => s + 1);
          }
        }
      });
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      coinMeshes.forEach(mesh => mesh.geometry.dispose());
      renderer.dispose();
      cancelAnimationFrame(animationId);
    };
  // eslint-disable-next-line
  }, [gameActive]);

  // Neustart
  const handleRestart = () => {
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameActive(true);
  };

  // Mobile Steuerung Buttons
  const mobileControls = (
    <Box sx={{ position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Button variant="contained" size="large" sx={{ minWidth: 56, minHeight: 56, mb: 1, borderRadius: '50%' }}
          onTouchStart={() => handleTouch('up', true)}
          onTouchEnd={() => handleTouch('up', false)}
        >▲</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" size="large" sx={{ minWidth: 56, minHeight: 56, borderRadius: '50%' }}
            onTouchStart={() => handleTouch('left', true)}
            onTouchEnd={() => handleTouch('left', false)}
          >◀</Button>
          <Button variant="contained" size="large" sx={{ minWidth: 56, minHeight: 56, borderRadius: '50%' }}
            onTouchStart={() => handleTouch('down', true)}
            onTouchEnd={() => handleTouch('down', false)}
          >▼</Button>
          <Button variant="contained" size="large" sx={{ minWidth: 56, minHeight: 56, borderRadius: '50%' }}
            onTouchStart={() => handleTouch('right', true)}
            onTouchEnd={() => handleTouch('right', false)}
          >▶</Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <IconButton
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          },
        }}
        onClick={() => navigate('/')}
      >
        <ArrowBackIcon />
      </IconButton>
      {/* Score & Timer */}
      <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, background: 'rgba(0,0,0,0.5)', color: 'white', p: 2, borderRadius: 2, minWidth: 90, textAlign: 'center' }}>
        <Typography variant="h6">⏱ {timeLeft}s</Typography>
        <Typography variant="h6">💰 {score}</Typography>
      </Box>
      {/* Mobile Controls */}
      {mobileControls}
      {/* Game Over Overlay */}
      {!gameActive && (
        <Box sx={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h3" color="white" gutterBottom>Spiel vorbei!</Typography>
          <Typography variant="h5" color="white" gutterBottom>Dein Score: {score}</Typography>
          <Button variant="contained" size="large" onClick={handleRestart} sx={{ mt: 2 }}>Nochmal spielen</Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/')} sx={{ mt: 2, color: 'white', borderColor: 'white' }}>Zurück</Button>
        </Box>
      )}
      <div ref={mountRef} style={{ width: '100vw', height: '100vh', touchAction: 'none' }} />
    </Box>
  );
}

export default Game3D; 